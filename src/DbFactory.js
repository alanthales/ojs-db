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
        
        if (proxyType && typeof proxyType === "object") {
            _proxy = proxyType;
            return;
        }
        
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

    CreateFactory.prototype.query = function(key, filters, callback) {
        this.getProxy().query(key, filters, callback);
    }
    
    CreateFactory.prototype.groupBy = function(key, filters, options, groups, callback) {
        this.getProxy().groupBy(key, filters, options, groups, callback);
    }
    
    CreateFactory.prototype.createDataSet = function(table) {
        return new DataSet(this.getProxy(), table);
    }

    return CreateFactory;
})();
