/*
    Id Genrators for dataset records
    Alan Thales, 06/2016
    Requires: Utils.js
*/
var IdGenerators = (function() {
    'use strict';
    
    return {
        TIMESTAMP: function() {
            return (new Date()).getTime();
        },
        UUID: OjsUtils.uid
    };
})();

/*
    Database Factory Utility Class
    Alan Thales, 09/2015
    Requires: LocalStorageProxy.js, SQLiteProxy.js, RestProxy.js, DataSet.js, SimplePromise.js
*/
var DbFactory = (function() {
    'use strict';

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

    CreateFactory.prototype.createDatabase = function(maps) {
        var defer = SimplePromise.defer();

        this.getProxy().createDatabase(maps, function(err) {
            if (err) {
                defer.reject(err);
                return;
            }
            defer.resolve(true);
        });

        return defer;
    }

    CreateFactory.prototype.query = function(key, filters) {
        var defer = SimplePromise.defer();

        this.getProxy().query(key, filters, function(err, records) {
            if (err) {
                defer.reject(err);
                return;
            }
            defer.resolve(records);
        });

        return defer;
    }
    
    CreateFactory.prototype.groupBy = function(key, options, groups, filters) {
        var defer = SimplePromise.defer();
        
        this.getProxy().groupBy(key, options, groups, filters, function(err, records) {
            if (err) {
                defer.reject(err);
                return;
            }
            defer.resolve(records);
        });

        return defer;
    }
    
    CreateFactory.prototype.createDataSet = function(table, genIdFn) {
        var fn = genIdFn || IdGenerators.TIMESTAMP;
        return new DataSet(this.getProxy(), table, fn, this.getSynchronizer());
    }

    return CreateFactory;
})();