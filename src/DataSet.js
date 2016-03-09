/*
    DataSet Class
    Autor: Alan Thales, 09/2015
    Requires: HashMap.js, SyncTable.js
*/
var DataSet = (function() {
    var _cleanCache = function(dts) {
        this._inserteds.length = 0;
        this._updateds.length = 0;
        this._deleteds.length = 0;
    };
    
    function CreateDataSet(proxy, table, syncronizer) {
        var _proxy = proxy,
            _table = table,
            _syncronizer = syncronizer;
        
        this._inserteds = [];
        this._updateds = [];
        this._deleteds = [];
        this.active = false;
        this.limit = 1000;
        this.sort = null;
        this.data = new HashMap();
        
        this.getProxy = function() {
            return _proxy;
        }

        this.getTable = function() {
            return _table;
        }
        
        this.getSyncronizer = function() {
            return _syncronizer;
        }
    }

    CreateDataSet.prototype.open = function(callback) {
        var self = this,
            opts = { key: self.getTable(), limit: self.limit, sort: self.sort };

        function fn(results, cb) {
            if (typeof cb === "function") {
                cb(results);
            }
        }

        if (self.active) {
            fn(self.data, callback);
            return;
        }

        self.getProxy().getRecords(opts, function(records) {
            self.data = records;
            self.active = true;
            fn(records, callback);
        });
    }

    CreateDataSet.prototype.close = function() {
        var self = this;
        self.active = false;
        self.data.length = 0;
        _cleanCache(self);
    }

    CreateDataSet.prototype.getById = function(id) {
        var index = this.data.indexOfKey('id', parseInt(id));
        return this.data[index];
    }

    CreateDataSet.prototype.refresh = function() {
        var self = this;
        if (self.sort) {
            self.data.orderBy(self.sort);
        }
    }

    CreateDataSet.prototype.insert = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        
        if (record && !record.id) {
            record.id = (new Date()).getTime();
        }
        
        var index = this.data.indexOfKey('id', record.id);
        
        if (index === -1) {
            this._inserteds.push(record);
            this.data.push(record);
        }
    }

    CreateDataSet.prototype.update = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        
        var index = this.data.indexOfKey('id', record.id);
        
        if (!this._updateds[index]) {
            this._updateds.push(record);
        } else {
            this._updateds.splice(index, 1, record);
        }
        
        this.data.splice(index, 1, record);
    }

    CreateDataSet.prototype.save = function(record) {
        if (record && !record.id) {
            this.insert(record);
        } else {
            this.update(record);
        }
    }
    
    CreateDataSet.prototype.delete = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        
        var index = this.data.indexOfKey('id', record.id);
        
        if (!this._deleteds[index]) {
            this._deleteds.push(record);
        }
        
        this.data.splice(index, 1);
    }

    CreateDataSet.prototype.post = function(callback) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }

        var self = this,
            callback = callback,
            sync = this.getSyncronizer();

        function cb() {
            if (sync) {
                sync.writeData(self.getTable(), self._inserteds, self._updateds, self._deleteds);
            }
            _cleanCache(self);
            if (typeof callback === "function") {
                callback();
            }
        }

        if (!self._inserteds.length && !self._updateds.length && !self._deleteds.length) {
            if (typeof callback === "function") {
                callback();
            }
            return;
        }
        
        self.getProxy().commit(
            this.getTable(), self._inserteds, self._updateds, self._deleteds, cb
        );
    }

    CreateDataSet.prototype.sync = function(callback) {
        var self = this,
            sync = this.getSyncronizer();
        
        if (!sync) {
            return;
        }
        
        sync.exec(self.getTable(), function(allData) {
            allData.forEach(function(item) {
                if (self.data.indexOfKey('id', item.id) < 0) {
                    self.insert(item);
                };
            });
            
            self.data.post();
            self.refresh();
            
            if (typeof callback === 'function') {
                callback();
            }
        });
    }
    
    CreateDataSet.prototype.filter = function(options) {
        if (options && typeof options === 'function') {
            return this.data.filter(options);
        }
        return this.data.query(options);
    }
    
    return CreateDataSet;
})();