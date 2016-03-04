/*
    Database Factory Utility Class
    Alan Thales, 09/2015
    Requires: LocalStorageProxy.js, SQLiteProxy.js, DataSet.js
*/
var DbFactory = (function() {
    
    function CreateFactory(opts, proxyType, syncronizer) {
        var _syncronizer = syncronizer,
            _proxy;
        
        this.getProxy = function() {
            return _proxy;
        }
        
        this.getSyncronizer = function() {
            return _syncronizer;
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
    
    CreateFactory.prototype.groupBy = function(key, filters, options, groups, callback) {
        this.getProxy().groupBy(key, filters, options, groups, callback);
    }
    
    CreateFactory.prototype.createDataSet = function(table) {
        return new DataSet(this.getProxy(), table, this.getSyncronizer());
    }

    return CreateFactory;
})();
