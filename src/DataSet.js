/*
	DataSet Class
	Autor: Alan Thales, 09/2015
	Requires: SimpleDataSet.js, EventEmitter.js, SimplePromise.js
*/
var DataSet = (function() {
	'use strict';

	function CreateDataSet(proxy, table, genIdFn, synchronizer) {
		SimpleDataSet.apply(this);

		this._opts = {};
		this._event = _table + "_event";
		this._eof = true;
		this._active = false;
		this._reOpenOnRefresh = false;
		this.genId = genIdFn;

		this.getProxy = function() { return proxy; };
		this.getTable = function() { return table; };
		this.getSynchronizer = function() { return synchronizer; };
	}

	CreateDataSet.prototype = Object.create(SimpleDataSet.prototype);
	
	CreateDataSet.prototype.sort = function(order) {
		this._opts.sort = order;
	};

	CreateDataSet.prototype.limit = function(value) {
		this._opts.limit = value;
	};

	CreateDataSet.prototype.where = function(params) {
		this._opts.params = params;
	};

	var _getRecords = function(opts, callback) {
		var self = this,
			cb = callback && typeof callback === "function" ? callback : function() {};
		
		self.getProxy().getRecords(opts, function(err, records) {
			self.data.putRange(records, true);
			self._active = err ? false : true;
			self._eof = records.length < self._opts.limit;
			cb(err, records);
			if (!err) {
				EventEmitter.emit(self._event, records);
			}
		});
	};
	
	CreateDataSet.prototype.open = function() {
		var opts = { key: this.getTable() },
			defer = SimplePromise.defer(),
			self = this;

		if (self._active) {
			defer.resolve(self);
			return defer;
		}

		OjsUtils.cloneProperties(self._opts, opts);

		_getRecords.call(self, opts, function(err, records) {
			if (err) {
				defer.reject(err);
				return;
			}
			defer.resolve(self);
		});
		
		return defer;
	};
	
	CreateDataSet.prototype.next = function() {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}

		if (this._opts.limit || isNaN(this._opts.limit)) {
			throw "You must set 'limit' to use this method";
		}

		var self = this,
			opts = { key: self.getTable(), skip: self._opts.limit },
			defer = SimplePromise.defer();

		if (self._eof) {
			defer.resolve(self);
			return defer;
		}

		OjsUtils.cloneProperties(self._opts, opts);

		_getRecords.call(self, opts, function(err, results) {
			if (err) {
				defer.reject(err);
				return;
			}
			defer.resolve(self);
		});
		
		return defer;
	};
	
	CreateDataSet.prototype.close = function() {
		SimpleDataSet.prototype.clear.apply(this, arguments);
		this._active = false;
		return this;
	};

	CreateDataSet.prototype.refresh = function() {
		if (this._reOpenOnRefresh) {
			this._active = false;
			return this.open();
		}
		
		var defer = SimplePromise.defer();

		if (this._opts.sort) {
			this.data.orderBy(this._opts.sort);
		}

		defer.resolve(this);
		return defer;
	};
	
	CreateDataSet.prototype.insert = function(record) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}
		SimpleDataSet.prototype.insert.apply(this, arguments);
	};

	CreateDataSet.prototype.update = function(record) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}
		SimpleDataSet.prototype.update.apply(this, arguments);
	};

	CreateDataSet.prototype.delete = function(record) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}
		SimpleDataSet.prototype.delete.apply(this, arguments);
	};

	CreateDataSet.prototype.post = function(ignoreSync) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}

		var self = this,
			sync = this.getSynchronizer(),
			defer = SimplePromise.defer();

		if (!self._inserteds.length && !self._updateds.length && !self._deleteds.length) {
			defer.resolve(true);
			return defer;
		}
		
		self.getProxy().commit(
			self.getTable(), self._inserteds, self._updateds, self._deleteds, done
		);

		function done(err) {
			if (err) {
				self.cancel();
				defer.reject(err);
				return;
			}
			
			if (sync && !ignoreSync) {
				sync.writeData(self.getTable(), self._inserteds, self._updateds, self._deleteds);
			}
			
			self.refresh().then(
				function() { defer.resolve(true); },
				function(err) { defer.reject(err); }
			);
			
			self._cleanCache();
		}

		return defer;
	};

	CreateDataSet.prototype.sync = function() {
		var self = this,
			sync = this.getSynchronizer(),
			defer = SimplePromise.defer();
		
		if (!sync) {
			defer.resolve(self);
			return defer;
		}
		
		sync.exec(self.getTable(), function(err, allData, toDelete) {
			if (err) {
				defer.reject(err);
				return;
			}
			
			allData = allData || []; toDelete = toDelete || [];
			
			if (!allData.length && !toDelete.length) {
				defer.resolve(self);
				return;
			}
			
			var serverData = new ArrayMap(),
				localData = new ArrayMap(),
				toDeleteMap = toDelete.map(function(item) { return item.id; }),
				deleteFn;
			
			serverData.putRange(allData);
			localData.putRange(self.data);

			function deleteDiff(item) {
				if (serverData.indexOfKey('id', item.id) < 0) {
					self.delete(item);
				}
			}
			
			function deleteFix(item) {
				if (toDeleteMap.indexOf(item.id) > -1) {
					self.delete(item);
				}
			}
			
			deleteFn = toDelete && toDelete instanceof Array ? deleteFix : deleteDiff;
			
			localData.forEach(deleteFn);
			
			serverData.forEach(function(item) {
				if (self.data.indexOfKey('id', item.id) < 0) {
					self.insert(item);
				} else {
					self.update(item);
				}
			});
			
			self.post(true).then(function() {
				defer.resolve(self);
			}, function(err) {
				defer.reject(err);
			});
		});

		return defer;
	};
	
	CreateDataSet.prototype.fetch = function(property) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}

		var defer = SimplePromise.defer();

		this.getProxy().fetch(this.getTable(), this, property, function(err) {
			if (err) {
				defer.reject(err);
				return;
			}
			defer.resolve(self);
		});

		return defer;
	};
	
	CreateDataSet.prototype.eof = function() {
		return this._eof;
	};

	CreateDataSet.prototype.active = function() {
		return this._active;
	};

	CreateDataSet.prototype.reOpenOnRefresh = function(value) {
		this._reOpenOnRefresh = value.toString() === "true";
		return this;
	};

	return CreateDataSet;
})();