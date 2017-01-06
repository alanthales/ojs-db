/*
	SimpleDataSet Class
	Autor: Alan Thales, 07/2016
	Requires: ArrayMap.js, Utils.js, ChildRecord.js, EventEmitter.js
*/
var SimpleDataSet = (function() {
	'use strict';
	
	function CreateDataSet(table) {
		EventEmitter.apply(this);

		var _table = table || 'tableName';
		// this._inserteds = [];
		// this._updateds = [];
		// this._deleteds = [];
		this._history = [];
		this.data = new ArrayMap();
		
		this.table = function() { return _table; };
	}

	CreateDataSet.prototype = Object.create(EventEmitter.prototype);

	CreateDataSet.prototype._cleanCache = function() {
		// this._inserteds.length = 0;
		// this._updateds.length = 0;
		// this._deleteds.length = 0;
		this._history.length = 0;
	};
	
	CreateDataSet.prototype.getById = function(id) {
		var index = this.data.indexOfKey('id', id);
		return this.data[index];
	};

	var _afterChange = function(operation, record) {
		var change = {
			op: operation,
			record: OjsUtils.cloneObject( record )
		};

		var idx, exists;

		exists = this._history.some(function(item, index) {
			idx = index;
			return item.op === operation && item.record.id === record.id;
		});

		if (exists) {
			this._history.splice(idx, 1, change);
			return;
		}
		
		this._history.push(change);
		this.emit(this.table(), {event: operation, data: record});

		if (record instanceof ChildRecord) {
			var table = [this.table(), '.child'].join('');
			DbEvents.emit(table, {event: operation, data: record});
		}
	};

	CreateDataSet.prototype.insert = function(record) {
		if (!record.id) {
			record.id = OjsUtils.newId();
		}
		
		var index = this.data.indexOfKey('id', record.id);
		
		if (index === -1) {
			// this._inserteds.push(record);
			this.data.push(record);
			_afterChange.call(this, 'insert', record);		
		}
		
		return this;
	};

	CreateDataSet.prototype.update = function(record) {
		if (!record.id) {
			return this;
		}
		
		var index = this.data.indexOfKey('id', record.id);
			// idxUpd;
		
		if (index === -1) {
			return this;
		}
		
		// idxUpd = this._updateds
		// 	.map(function(item) { return item.id; })
		// 	.indexOf(record.id);
		
		// if (idxUpd === -1) {
		// 	this._updateds.push(record);
		// } else {
		// 	this._updateds.splice(idxUpd, 1, record);
		// }
		
		_afterChange.call(this, 'update', this.data[index]);		
		this.data.splice(index, 1, record);

		return this;
	};

	CreateDataSet.prototype.save = function(record) {
		if (!record) return this;
		if (!record.id || !this.getById(record.id)) {
			return this.insert(record);
		}
		return this.update(record);
	};
	
	CreateDataSet.prototype.delete = function(record) {
		if (!record.id) {
			return this;
		}
		
		var index = this.data.indexOfKey('id', record.id);
		
		if (index >= 0) {
			// this._deleteds.push(record);
			_afterChange.call(this, 'delete', this.data[index]);
			this.data.splice(index, 1);
		}
		
		return this;
	};

	CreateDataSet.prototype.insertAll = function(records) {
		var self = this;
		
		if (!(records instanceof Array)) {
			return self;
		}
		
		records.forEach(function(record) {
			self.insert(record);
		});

		return self;
	};
	
	CreateDataSet.prototype.clear = function(mustNotify) {
		this.data.length = 0;
		this._cleanCache();
		if (mustNotify) {
			this.emit(this.table(), {event: 'clear', data: []});
		}
		return this;
	};
	
	CreateDataSet.prototype.cancel = function() {
		if (!this._history.length) return;

		var self = this,
			i = self._history.length - 1,
			item, index;

		for (; i >= 0; i--) {
			item = self._history[i];
			index = self.data.indexOfKey('id', item.record.id);

			switch (item.op) {
				case 'insert':
					self.data.splice(index, 1);
					// self._inserteds.pop();
					break;
				case 'update':
					self.data.splice(index, 1, item.record);
					// self._updateds.pop();
					break;
				case 'delete':
					self.data.push(item.record);
					// self._deleteds.pop();
					break;
			}
		}
		
		this.emit(this.table(), {event: 'cancel', data: this._history});
		this._history.length = 0;
	};
	
	CreateDataSet.prototype.count = function() {
		return this.data.length;
	};

	CreateDataSet.prototype.item = function(index) {
		return this.data[index];
	};

	CreateDataSet.prototype.filter = function(options) {
		return this.data.query(options);
	};
	
	CreateDataSet.prototype.forEach = function(fn) {
		this.data.forEach(fn);
	};
	
	CreateDataSet.prototype.subscribe = function(fn) {
		this.on(this.table(), fn);
		return this;
	};
	
	return CreateDataSet;
})();