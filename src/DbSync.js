/*
    DbSync Abstract Class
    Autor: Alan Thales, 03/2016
    Requires: ArrayMap.js
*/
var DbSync = (function() {
    'use strict';

    var Operations = {
        Insert: 'inserted',
        Update: 'updated',
        Delete: 'deleted'
    };
    
    function CreateSync() { }
    
    var _getTableName = function(table) {
        return ['sync_', table].join('');
    };
    
    var _getData = function(tableName) {
        var key = _getTableName(tableName),
            table = window.localStorage[key] || '{}';
        return JSON.parse(table, DbProxy.dateParser);
    };

    var _saveTable = function(tableName, values) {
        var key = _getTableName(tableName);
        window.localStorage[key] = JSON.stringify(values);
    };
    
    var _merge = function(arr1, arr2) {
        var result = new ArrayMap(),
            concated = arr1.concat(arr2),
            i = 0, l = concated.length;
        for (; i < l; i++) {
            if (result.indexOfKey('id', concated[i].id) < 0) {
                result.put(concated[i]);
            }
        }
        return result;
    };
    
    CreateSync.prototype.writeData = function(key, toInsert, toUpdate, toDelete) {
        var values = _getData(key);

        values[Operations.Insert] = _merge(toInsert, values[Operations.Insert]);
        values[Operations.Update] = _merge(toUpdate, values[Operations.Update]);
        values[Operations.Delete] = _merge(toDelete, values[Operations.Delete]);

        _saveTable(key, values);
    };
    
    CreateSync.prototype.cleanData = function(key) {
        _saveTable(key, {});
    };
    
    CreateSync.prototype.sendData = function(key, toInsert, toUpdate, toDelete, callback) {
        if (typeof callback === 'function') {
            callback();
        }
    };
    
    CreateSync.prototype.getData = function(key, callback) {
        if (typeof callback === 'function') {
            callback( null, [], [] );
        }
    };
    
    CreateSync.prototype.exec = function(key, callback) {
        var self = this,
            values = _getData(key),
            cb = callback || function() {};

        self.sendData(
            key, values[Operations.Insert], values[Operations.Update],
            values[Operations.Delete], done
        );

        function done(err) {
            if (err) {
                return cb(err);
            }
            self.cleanData(key);
            self.getData(key, cb);
        }
    };
    
    return CreateSync;
})();