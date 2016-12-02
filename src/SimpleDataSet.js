/*
	SimpleDataSet Class
	Autor: Alan Thales, 07/2016
	Requires: ArrayMap.js
*/
var SimpleDataSet = (function() {
	'use strict';
	
	function CreateDataSet() {
		this._inserteds = [];
		this._updateds = [];
		this._deleteds = [];
		this._copy = null;
		this._lastOp = null;
		this.sort = null;
		this.data = new ArrayMap();
	}

	CreateDataSet.prototype._cleanCache = function() {
		this._inserteds.length = 0;
		this._updateds.length = 0;
		this._deleteds.length = 0;
		this._copy = null;
		this._lastOp = null;
	}
	
	CreateDataSet.prototype.getById = function(id) {
		var index = this.data.indexOfKey('id', id);
		return this.data[index];
	}

	var _afterChange = function(operation, record) {
		this._copy = OjsUtils.cloneObject( record );
		this._lastOp = operation;
		
		if (record instanceof ChildRecord) {
			record.notifyMaster();
		}
	};

	CreateDataSet.prototype.insert = function(record) {
		if (!record.id) {
			record.id = (new Date()).getTime();
		}
		
		var index = this.data.indexOfKey('id', record.id);
		
		if (index === -1) {
			this._inserteds.push(record);
			this.data.push(record);
			_afterChange.call(this, 'insert', record);		
		}
		
		return this;
	}

	CreateDataSet.prototype.update = function(record) {
		if (!record.id) {
			return this;
		}
		
		var index = this.data.indexOfKey('id', record.id),
			idxUpd;
		
		if (index === -1) {
			return this;
		}
		
		idxUpd = this._updateds
			.map(function(item) { return item.id })
			.indexOf(record.id);
		
		if (idxUpd === -1) {
			this._updateds.push(record);
		} else {
			this._updateds.splice(idxUpd, 1, record);
		}
		
		_afterChange.call(this, 'update', this.data[index]);		
		this.data.splice(index, 1, record);

		return this;
	}

	CreateDataSet.prototype.save = function(record) {
		if (!record) return;
		if (!record.id) {
			return this.insert(record);
		}
		// var r = this.getById(record.id);
		return this.update(record);
	}
	
	CreateDataSet.prototype.delete = function(record) {
		if (!record.id) {
			return this;
		}
		
		var index = this.data.indexOfKey('id', record.id);
		
		if (index >= 0) {
			this._deleteds.push(record);
			_afterChange.call(this, 'delete', this.data[index]);
			this.data.splice(index, 1);
		}
		
		return this;
	}

	CreateDataSet.prototype.insertAll = function(records) {
		var self = this;
		
		if (!records instanceof Array) {
			return self;
		}
		
		records.forEach(function(record) {
			self.insert(record);
		});

		return self;
	}
	
	CreateDataSet.prototype.clear = function() {
		this.data.length = 0;
		this._cleanCache();
		return this;
	}
	
	CreateDataSet.prototype.cancel = function() {
		if (!this._copy) return;
		
		var index = this.data.indexOfKey('id', this._copy.id);
		
		switch (this._lastOp) {
			case 'insert':
				this.data.splice(index, 1);
				this._inserteds.pop();
				break;
			case 'update':
				this.data.splice(index, 1, this._copy);
				this._updateds.pop();
				break;
			case 'delete':
				this.data.push(this._copy);
				this._deleteds.pop();
				break;
		}
		
		this._copy = null;
		this._lastOp = null;
	}
	
	CreateDataSet.prototype.filter = function(options) {
		return this.data.query(options);
	}
	
	CreateDataSet.prototype.forEach = function(fn) {
		this.data.forEach(fn);
	}
	
	return CreateDataSet;
})();