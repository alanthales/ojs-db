/*
    Database Factory Utility Class
    Alan Thales, 09/2015
    Requires: LocalStorageProxy.js, SQLiteProxy.js, RestProxy.js, DataSet.js
*/
var DbFactory = (function() {
    
    function CreateFactory(proxyType, opts, synchronizer) {
        var _synchronizer = synchronizer,
            _proxy;
        
        this.getProxy = function() {
            return _proxy;
        }
        
        this.getSynchronizer = function() {
            return _synchronizer;
        }
        
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
            case 2:
                _proxy = new RestProxy(opts);
                break;
            default:
                throw "Proxy not implemented";
        }
    }

    CreateFactory.prototype.createDatabase = function(maps, callback) {
        this.getProxy().createDatabase(maps, callback);
    }

    CreateFactory.prototype.query = function(key, filters, callback) {
        this.getProxy().query(key, filters, callback);
    }
    
    CreateFactory.prototype.groupBy = function(key, options, groups, filters, callback) {
        this.getProxy().groupBy(key, options, groups, filters, callback);
    }
    
    CreateFactory.prototype.createDataSet = function(table) {
        return new DataSet(this.getProxy(), table, this.getSynchronizer());
    }

    return CreateFactory;
})();