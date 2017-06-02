/*
	DataSet Class
	Autor: Alan Thales, 09/2015
	Requires: SimpleDataSet.js, SimplePromise.js, DbEvents.js
*/
var DataSet = (function(exports) {
	'use strict';

	var _pages = {};

	function CreateDataSet(table, proxy, synchronizer) {
		SimpleDataSet.apply(this, [table]);

		_pages[table] = 0;

		this._opts = {};
		this._eof = true;
		this._active = false;
		this._reOpenOnRefresh = false;

		this.proxy = function() { return proxy; };
		this.synchronizer = function() { return synchronizer; };

		var childTable = [table, '.child'].join(''),
			self = this;

		DbEvents.on(childTable, function(args) {
			self.save(args.data.master());
		});
	}

	exports.DataSet = CreateDataSet;

	CreateDataSet.prototype = Object.create(SimpleDataSet.prototype);
	
	CreateDataSet.prototype.emit = function(key, args) {
		DbEvents.emit(key, args);
	};

	CreateDataSet.prototype.subscribe = function(fn) {
		DbEvents.on(this.table(), fn);
		return this;
	};

	CreateDataSet.prototype.sort = function(order) {
		this._opts.sort = order;
		return this;
	};

	CreateDataSet.prototype.limit = function(value) {
		this._opts.limit = value;
		return this;
	};

	CreateDataSet.prototype.where = function(params) {
		this._opts.params = params;
		return this;
	};

	CreateDataSet.prototype.reOpenOnRefresh = function(value) {
		this._reOpenOnRefresh = value.toString() === "true";
		return this;
	};

	var _getRecords = function(opts, callback) {
		var self = this,
			cb = callback && typeof callback === "function" ? callback : function() {};
		
		self.proxy().getRecords(opts, function(err, records) {
			self._data.putRange(records, true);
			self._active = err ? false : true;
			self._eof = records && records.length < (self._opts.limit || 30);
			cb(err, records);
			if (!err) {
				self.emit(self.table(), {event: 'read', data: records});
			}
		});
	};
	
	CreateDataSet.prototype.open = function() {
		var opts = { key: this.table() },
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

		if (!this._opts.limit || isNaN(this._opts.limit)) {
			this._opts.limit = 30;
		}

		_pages[this.table()] = ++_pages[this.table()];

		var self = this,
			skip = _pages[self.table()] * self._opts.limit,
			opts = { key: self.table(), skip: skip },
			defer = SimplePromise.defer();

		if (self.eof()) {
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
		_pages[this.table()] = 0;
		this._active = false;
		return this;
	};

	CreateDataSet.prototype.clear = function() {
		var self = this,
			defer = SimplePromise.defer();

		self.proxy().clear(self.table(), done);
		
		function done(err) {
			if (err) {
				defer.reject(err);
				return;
			}
			_pages[self.table()] = 0;
			SimpleDataSet.prototype.clear.apply(self, arguments);
			defer.resolve(self);
		}

		return defer;
	};

	CreateDataSet.prototype.refresh = function() {
		if (this._reOpenOnRefresh) {
			this._active = false;
			return this.open();
		}
		
		var defer = SimplePromise.defer();

		if (this._opts.sort) {
			this._data.orderBy(this._opts.sort);
		}

		defer.resolve(this);
		return defer;
	};
	
	CreateDataSet.prototype.insert = function(record) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}
		return SimpleDataSet.prototype.insert.apply(this, arguments);
	};

	CreateDataSet.prototype.update = function(record) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}
		return SimpleDataSet.prototype.update.apply(this, arguments);
	};

	CreateDataSet.prototype.delete = function(record) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}
		return SimpleDataSet.prototype.delete.apply(this, arguments);
	};

	var _filterOp = function(changes, operation) {
		var results = [];

		changes.forEach(function(item) {
			if (item.op === operation) {
				results.push(item.record);
			}
		});

		return results;
	};

	CreateDataSet.prototype.post = function(ignoreSync) {
		if (!this._active) {
			throw "Invalid operation on closed dataset";
		}

		var self = this,
			sync = this.synchronizer(),
			defer = SimplePromise.defer(),
			toInsert, toUpdate, toDelete;

		if (!self._history.length) {
			defer.resolve(true);
			return defer;
		}
		
		toInsert = _filterOp(self._history, 'insert');
		toUpdate = _filterOp(self._history, 'update');
		toDelete = _filterOp(self._history, 'delete');
		
		self.proxy().commit(self.table(), toInsert, toUpdate, toDelete, done);

		function done(err) {
			if (err) {
				self.cancel();
				defer.reject(err);
				return;
			}
			
			if (sync && !ignoreSync) {
				sync.writeData(self.table(), toInsert, toUpdate, toDelete);
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
			sync = this.synchronizer(),
			defer = SimplePromise.defer();
		
		if (!sync) {
			defer.resolve(self);
			return defer;
		}
		
		sync.exec(self.table(), function(err, allData, toDelete) {
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
			localData.putRange(self._data);

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
				self.save(item);
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

		var defer = SimplePromise.defer(),
			self = this;

		if (!this.count()) {
			defer.resolve(self);
			return defer;
		}

		this.proxy().fetch(this.table(), this, property, function(err) {
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

	return CreateDataSet;
})(this);