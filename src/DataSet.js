/*
    DataSet Class
    Autor: Alan Thales, 09/2015
    Requires: SimpleDataSet.js, SyncDb.js
*/
var DataSet = (function() {
    'use strict';

    function CreateDataSet(proxy, table, genIdFn, synchronizer) {
        var _proxy = proxy,
            _table = table,
            _synchronizer = synchronizer;
        
        this.active = false;
        this.limit = 1000;
        this.params = null;
        this.genId = genIdFn;
        this.eof = true;
        this.reOpenOnRefresh = false;
        
        this.getProxy = function() {
            return _proxy;
        }

        this.getTable = function() {
            return _table;
        }
        
        this.getSynchronizer = function() {
            return _synchronizer;
        }
        
        SimpleDataSet.apply(this);
    }

    CreateDataSet.prototype = Object.create(SimpleDataSet.prototype);
    
    var _getRecords = function(opts, callback) {
        var self = this,
            cb = callback && typeof callback === "function" ? callback : function() {};
        
        self.getProxy().getRecords(opts, function(err, records) {
            self.data = records;
            self.active = err ? false : true;
            self.eof = records.length < self.limit;
            cb(err, records);
        });
    };
    
    CreateDataSet.prototype.open = function(callback) {
        var opts = { key: this.getTable(), limit: this.limit, sort: this.sort, params: this.params };
        
        if (this.active) {
            if (callback && typeof callback === "function") {
                callback(null, this.data);
            }
            return this;
        }

        _getRecords.call(this, opts, callback);
        
        return this;
    }
    
    CreateDataSet.prototype.next = function(callback) {
        var self = this,
            opts = { key: self.getTable(), limit: self.limit, sort: self.sort, params: self.params, skip: self.limit },
            cb = callback && typeof callback === "function" ? callback : function() {};

        if (self.eof) {
            cb(null, false);
            return self;
        }

        _getRecords.call(self, opts, function(err, results) {
            cb(err, !self.eof);
        });
        
        return self;
    }
    
    CreateDataSet.prototype.close = function() {
        SimpleDataSet.prototype.clear.apply(this, arguments);
        this.active = false;
        return this;
    }

    CreateDataSet.prototype.refresh = function(callback) {
        var cb = callback && typeof callback === "function" ? callback : function() {};
        
        if (this.reOpenOnRefresh) {
            this.active = false;
            return this.open(cb);
        }
        
        if (this.sort) {
            this.data.orderBy(this.sort);
        }

        cb();
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
            sync = this.getSynchronizer();

        function done(err) {
            if (err) {
                self.cancel();
                return cb();
            }
            
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
            sync = this.getSynchronizer();
        
        if (!sync) {
            return;
        }
        
        sync.exec(self.getTable(), function(err, allData, toDelete) {
            if (err) {
                return callback(err);
            }
            
            allData = allData || []; toDelete = toDelete || [];
            
            if (!allData.length && !toDelete.length) {
                return callback();
            }
            
            var serverData = new ArrayMap(),
                localData = new ArrayMap(),
                toDeleteMap = toDelete.map(function(item) { return item.id }),
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
            
            self.post(callback, true);
        });
    }
    
    CreateDataSet.prototype.fetch = function(property, callback) {
        var cb = callback && typeof callback === 'function' ? callback : function() {};
        
        if (!this.active) {
            cb();
            return this;
        }
        
        this.getProxy().fetch(this.getTable(), this, property, cb);
        return this;
    }
    
    return CreateDataSet;
})();