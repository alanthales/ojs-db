/*
    SyncDb Abstract Class
    Autor: Alan Thales, 03/2016
    Requires: HashMap.js
*/
var SyncDb = (function() {
    var Operations = {
        Insert: '_inserted',
        Update: '_updated',
        Delete: '_deleted'
    }
    
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
            result = new HashMap();
        if (table) {
            result.putRange( JSON.parse(table, DbProxy.dateParser) );
        }
        return result;
    }
    
    CreateSync.prototype.writeData = function(table, toInsert, toUpdate, toDelete) {
        var insTable = _getData(Operations.Insert, table),
            updTable = _getData(Operations.Update, table),
            delTable = _getData(Operations.Delete, table);

        insTable.putRange(toInsert, true);
        updTable.putRange(toUpdate, true);
        delTable.putRange(toDelete, true);
        
        _saveTable(Operations.Insert, table, insTable);
        _saveTable(Operations.Update, table, updTable);
        _saveTable(Operations.Delete, table, delTable);
    }
    
    CreateSync.prototype.cleanData = function(table) {
        _saveTable(Operations.Insert, table, []);
        _saveTable(Operations.Update, table, []);
        _saveTable(Operations.Delete, table, []);
    }
    
    CreateSync.prototype.sendData = function(table, toInsert, toUpdate, toDelete, callback) {
        if (typeof callback === 'function') {
            callback();
        }
    }
    
    CreateSync.prototype.getNews = function(table, callback) {
        if (typeof callback === 'function') {
            callback( [] );
        }
    }
    
    CreateSync.prototype.exec = function(table, callback) {
        var self = this,
            cb = callback || function() {};
        self.sendData(
            table,
            _getData(Operations.Insert, table),
            _getData(Operations.Update, table),
            _getData(Operations.Delete, table),
            function() {
                self.cleanData(table);
                self.getNews(table, cb);
            }
        );
    }
    
    return CreateSync;
})();