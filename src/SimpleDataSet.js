/*
    SimpleDataSet Class
    Autor: Alan Thales, 07/2016
    Requires: ArrayMap.js
*/
var SimpleDataSet = (function() {
    function CreateDataSet(master) {
        this._inserteds = [];
        this._updateds = [];
        this._deleteds = [];
        this.sort = null;
        this.data = new ArrayMap();
        this.master = master;
    }

    CreateDataSet.prototype._cleanCache = function() {
        this._inserteds.length = 0;
        this._updateds.length = 0;
        this._deleteds.length = 0;
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
        
        record.dataset = this;
        
        if (this.master) {
            this.master.dataset.update(this.master);
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
        
        this.data.splice(index, 1, record);
        
        record.dataset = this;
        
        if (this.master) {
            this.master.dataset.update(this.master);
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
        
        this.data.splice(index, 1);
        
        record.dataset = this;
        
        if (this.master) {
            this.master.dataset.update(this.master);
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
    
    return CreateDataSet;
})();