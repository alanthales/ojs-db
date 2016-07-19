/*
    DataSet Class
    Autor: Alan Thales, 09/2015
    Requires: SimpleDataSet.js, SyncDb.js
*/
var DataSet = (function() {
    function CreateDataSet(proxy, table, genIdFn, syncronizer) {
        var _proxy = proxy,
            _table = table,
            _syncronizer = syncronizer;
        
        this.active = false;
        this.limit = 1000;
        this.params = null;
        this.genId = genIdFn;
        
        this.getProxy = function() {
            return _proxy;
        }

        this.getTable = function() {
            return _table;
        }
        
        this.getSyncronizer = function() {
            return _syncronizer;
        }
        
        SimpleDataSet.apply(this);
    }

    CreateDataSet.prototype = Object.create(SimpleDataSet.prototype);
    
    CreateDataSet.prototype.open = function(callback) {
        var self = this,
            opts = { key: self.getTable(), limit: self.limit, sort: self.sort, params: self.params };

        function fn(results, cb) {
            if (typeof cb === "function") {
                cb(results);
            }
        }

        if (self.active) {
            fn(self.data, callback);
            return self;
        }

        self.getProxy().getRecords(opts, function(records) {
            self.data = records;
            self.active = true;
            fn(records, callback);
        });
        
        return self;
    }
    
    CreateDataSet.prototype.close = function() {
        SimpleDataSet.prototype.clear.apply(this, arguments);
        this.active = false;
        return this;
    }

    CreateDataSet.prototype.insert = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        SimpleDataSet.prototype.insert.apply(this, arguments);
    }

    CreateDataSet.prototype.update = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        SimpleDataSet.prototype.update.apply(this, arguments);
    }

    CreateDataSet.prototype.delete = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        SimpleDataSet.prototype.delete.apply(this, arguments);
    }

    CreateDataSet.prototype.post = function(callback, ignoreSync) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }

        var self = this,
            cb = typeof callback === "function" ? callback : function() {},
            sync = this.getSyncronizer();

        function done() {
            if (sync && !ignoreSync) {
                sync.writeData(self.getTable(), self._inserteds, self._updateds, self._deleteds);
            }
            
            self.refresh();
            self._cleanCache();
            
            cb();
        }
        
        if (!self._inserteds.length && !self._updateds.length && !self._deleteds.length) {
            return cb();
        }
        
        self.getProxy().commit(
            self.getTable(), self._inserteds, self._updateds, self._deleteds, done
        );
    }

    CreateDataSet.prototype.sync = function(callback) {
        var self = this,
            sync = this.getSyncronizer();
        
        if (!sync) {
            return;
        }
        
        sync.exec(self.getTable(), function(allData) {
            var serverData = new ArrayMap(),
                localData = new ArrayMap();
            
            serverData.putRange(allData);
            localData.putRange(self.data);
            
            localData.forEach(function(item) {
                if (serverData.indexOfKey('id', item.id) < 0) {
                    self.delete(item);
                }
            });
            
            serverData.forEach(function(item) {
                if (self.data.indexOfKey('id', item.id) < 0) {
                    self.insert(item);
                } else {
                    self.update(item);
                }
            });
            
            self.post(callback, true);
        });
    }
    
    CreateDataSet.prototype.fetch = function(property, callback) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        this.getProxy().fetch(this.getTable(), this, property, callback);
        return this;
    }
    
    return CreateDataSet;
})();