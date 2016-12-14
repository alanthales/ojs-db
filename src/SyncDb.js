/*
    SyncDb Abstract Class
    Autor: Alan Thales, 03/2016
    Requires: ArrayMap.js
*/
var SyncDb = (function() {
    'use strict';

    var Operations = {
        Insert: '_inserted',
        Update: '_updated',
        Delete: '_deleted'
    };
    
    function CreateSync() { }
    
    var _getTableName = function(operation, table) {
        return ['sync_', table, operation].join('');
    };
    
    var _saveTable = function(operation, tableName, tableValues) {
        var key = _getTableName(operation, tableName);
        window.localStorage[key] = JSON.stringify(tableValues);
    };
    
    var _getData = function(operation, tableName) {
        var key = _getTableName(operation, tableName),
            table = window.localStorage[key],
            result = new ArrayMap();
        if (table) {
            result.putRange( JSON.parse(table, DbProxy.dateParser) );
        }
        return result;
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
    
    CreateSync.prototype.writeData = function(table, toInsert, toUpdate, toDelete) {
        var insTable = _getData(Operations.Insert, table),
            updTable = _getData(Operations.Update, table),
            delTable = _getData(Operations.Delete, table);

        insTable = _merge(toInsert, insTable);
        updTable = _merge(toUpdate, updTable);
        delTable = _merge(toDelete, delTable);
        
        _saveTable(Operations.Insert, table, insTable);
        _saveTable(Operations.Update, table, updTable);
        _saveTable(Operations.Delete, table, delTable);
    };
    
    CreateSync.prototype.cleanData = function(table) {
        _saveTable(Operations.Insert, table, []);
        _saveTable(Operations.Update, table, []);
        _saveTable(Operations.Delete, table, []);
    };
    
    CreateSync.prototype.sendData = function(table, toInsert, toUpdate, toDelete, callback) {
        if (typeof callback === 'function') {
            callback();
        }
    };
    
    CreateSync.prototype.getNews = function(table, callback) {
        if (typeof callback === 'function') {
            callback( null, [], [] );
        }
    };
    
    CreateSync.prototype.exec = function(table, callback) {
        var self = this,
            cb = callback || function() {};
        self.sendData(
            table,
            _getData(Operations.Insert, table),
            _getData(Operations.Update, table),
            _getData(Operations.Delete, table),
            function(err) {
                if (err) {
                    return cb(err);
                }
                self.cleanData(table);
                self.getNews(table, cb);
            }
        );
    };
    
    return CreateSync;
})();