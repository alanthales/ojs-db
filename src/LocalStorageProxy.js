/*
    LocalStorage Proxy Class
    Autor: Alan Thales, 09/2015
    Requires: ArrayMap.js, DbProxy.js
*/
var LocalStorageProxy = (function() {
    var _get = function(opts) {
        var key = typeof opts === "object" ? opts.key : opts,
            table = window.localStorage[key],
            results = new ArrayMap();
        if (table) {
            results.putRange( JSON.parse(table, DbProxy.dateParser) );
        }
        if (results.length && opts.params) {
            return results.query(opts.params);
        }
        return results;
    };

    var _saveAll = function(key, table, callback) {
        window.localStorage[key] = JSON.stringify(table);
        if (typeof callback === "function") {
            callback();
        }
    };
    
    function CreateProxy() {
        DbProxy.apply(this, arguments);
    }
    
    CreateProxy.prototype = Object.create(DbProxy.prototype);

    CreateProxy.prototype.getRecords = function(options, callback) {
        var table = _get(options);

        if (options.sort) {
            table.orderBy(options.sort);
        }

        if (typeof callback === "function") {
            callback( table );
        }
    }
    
    CreateProxy.prototype.query = function(key, filters, callback) {
        var table = _get(key),
            results = table.query(filters);
        
        callback( results );
    }
    
    CreateProxy.prototype.groupBy = function(key, options, groups, filters, callback) {
        var table = _get(key);
        
        callback( table.groupBy(options, groups, filters) );
    }
    
    CreateProxy.prototype.save = function(key, record, callback) {
        var table = _get(key),
            index = table.indexOfKey("id", record.id);
        if (index === -1) {
            table.push(record);
        } else {
            table.splice(index, 1, record);
        }
        _saveAll(key, table, callback);
    }

    CreateProxy.prototype.remove = function(key, record, callback) {
        var id = typeof record === "object" ? record.id : record,
            table = _get(key),
            index = table.indexOfKey("id", id);
        table.splice(index, 1);
        _saveAll(key, table, callback);
    }

    CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        var self = this,
            toSave = toInsert.concat(toUpdate),
            total = toSave.length + toDelete.length,
            cb = callback && typeof callback === "function" ? callback : function() {},
            i;

        function progress() {
            total--;
            if (total === 0) {
                cb();
            }
        }

        for (i = 0; i < toSave.length; i++) {
            self.save(key, toSave[i], progress);
        }

        for (i = 0; i < toDelete.length; i++) {
            self.remove(key, toDelete[i], progress);
        }
    }
    
    return CreateProxy;
})();