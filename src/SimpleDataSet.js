/*
    SimpleDataSet Class
    Autor: Alan Thales, 07/2016
    Requires: ArrayMap.js
*/
var SimpleDataSet = (function() {
    
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
    
    CreateDataSet.prototype.insert = function(record) {
        if (!record.id) {
            record.id = (new Date()).getTime();
        }
        
        var index = this.data.indexOfKey('id', record.id);
        
        if (index === -1) {
            this._inserteds.push(record);
            this.data.push(record);
        }
        
        this._copy = OjsUtils.cloneObject( record );
        this._lastOp = 'insert';
        
        if (record instanceof ChildRecord) {
            record.notifyMaster();
        }
        
        return this;
    }

    CreateDataSet.prototype.update = function(record) {
        if (!record.id) {
            return;
        }
        
        var index = this.data.indexOfKey('id', record.id);
        
        if (!this._updateds[index]) {
            this._updateds.push(record);
        } else {
            this._updateds.splice(index, 1, record);
        }
        
        this._copy = OjsUtils.cloneObject( this.data[index] );
        this._lastOp = 'update';
        
        this.data.splice(index, 1, record);
        
        if (record instanceof ChildRecord) {
            record.notifyMaster();
        }
        
        return this;
    }

    CreateDataSet.prototype.save = function(record) {
        if (!record) return;
        if (!record.id) {
            return this.insert(record);
        }
        return this.update(record);
    }
    
    CreateDataSet.prototype.delete = function(record) {
        if (!record.id) {
            return;
        }
        
        var index = this.data.indexOfKey('id', record.id);
        
        if (!this._deleteds[index]) {
            this._deleteds.push(record);
        }
        
        this._copy = OjsUtils.cloneObject( this.data[index] );
        this._lastOp = 'delete';
        
        this.data.splice(index, 1);
        
        if (record instanceof ChildRecord) {
            record.notifyMaster();
        }
        
        return this;
    }

    CreateDataSet.prototype.refresh = function() {
        var self = this;
        if (self.sort) {
            self.data.orderBy(self.sort);
        }
        return self;
    }
    
    CreateDataSet.prototype.insertAll = function(records) {
        var self = this;
        
        if (!records instanceof Array) {
            return;
        }
        
        records.forEach(function(record) {
            self.insert(record);
        });
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
    }
    
    return CreateDataSet;
})();