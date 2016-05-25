/*
    Proxy Enums
    Alan Thales, 09/2015
*/
var DbProxies = (function() {
    return {
        LOCALSTORAGE: 0,
        SQLITE: 1,
        RESTFUL: 2
    }
})();


/*
    DbProxy Parent Class
    Autor: Alan Thales, 09/2015
*/
var DbProxy = (function() {
    function CreateProxy() {}
    
    CreateProxy.prototype.createDatabase = function() {}
    
    CreateProxy.prototype.getRecords = function(options, callback) {}
    
    CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {}
    
    CreateProxy.dateParser = function(key, value) {
        var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/,
            test;
        
        if (typeof value === 'string') {
            test = reISO.exec(value);
            if (test)
                return new Date(value);
        }
        
        return value;
    }
    
    return CreateProxy;
})();