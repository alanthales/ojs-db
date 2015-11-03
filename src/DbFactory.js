/*
    Database Factory Utility Class
    Alan Thales, 09/2015
    Requires: LocalStorageProxy.js, SQLiteProxy.js, DataSet.js
*/
var DbFactory = (function() {
    var _proxy,
        _opts;
    
    function CreateFactory(opts, proxyType) {
        _opts = opts;
        
        switch(proxyType) {
            case 0:
                _proxy = new LocalStorageProxy();
                break;
            case 1:
                _proxy = new SQLiteProxy(opts);
                break;
            default:
                throw "Proxy not implemented";
        }
    }

    CreateFactory.prototype.getProxy = function() {
        return _proxy;
    }
    
    CreateFactory.prototype.createDatabase = function(maps, callback) {
        this.getProxy().createDatabase(maps, callback);
    }

    CreateFactory.prototype.createDataSet = function(table) {
        return new DataSet(this.getProxy(), table);
    }

    CreateFactory.prototype.select = function(sql, params, callback) {
        this.getProxy().select(sql, params, callback);
    }
    
    return CreateFactory;
})();
