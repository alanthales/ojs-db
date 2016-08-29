/*
    Restful Proxy Class
    Autor: Alan Thales, 09/2015
    Requires: ArrayMap.js, DbProxy.js
*/
var RestProxy = (function() {
    var _defSerialize = function(obj) {
        return JSON.stringify(obj);
    };
    
    var _httpRequest = function(url, method, config, success, error) {
        var http = new XMLHttpRequest(),
            callback, prop, params;
        
        http.onreadystatechange = function() {
            if (http.readyState === 4) {
                callback = http.status === 200 ? success : error;
                callback(http);
            }
        }
        
        if (typeof config === "object") {
            params = config.data;
            for (prop in config.headers) {
                http.setRequestHeader(prop, config.headers[prop]);
            }
        }
        
        http.open(method, url, true);
        http.send(params);
    };

    var _get = function(options, success, error) {
        var opts = typeof options === "object" ? options : { key: options },
            url = this.config.url + "/" + opts.key,
            table = new ArrayMap(),
            p;
        
        if (opts.params) {
            for (p in opts.params) {
                url += "/" + p + "/" + opts.params[p];
            }
        }
//        else {
//            url += "/" + this.config.getEP;
//        }
        
        _httpRequest(url, "GET", this.config, function(xhr) {
            table.putRange( JSON.parse(xhr.responseText, DbProxy.dateParser) );
            success( table );
        }, error);
    };
    
    var _save = function(method, key, record, success, error) {
        var url = this.config.url + "/" + key,
            config = { data: this.serialize(record) };
        
        if (method === "PUT") {
            url += "/" + record.id;
        }
        
        if (this.config.headers) {
            config.headers = this.config.headers;
        }
        
        _httpRequest(url, method, config, function(xhr) {
            if (typeof callback === "function") {
                success( xhr );
            }
        }, error);
    };

    function errorHandle(xhr) {
        console.log( JSON.stringify(xhr) );
        throw xhr.responseText;
    }
    
    function CreateProxy(config) {
        this.config = config;
        if (config.serializeFn && typeof config.serializeFn === "function") {
            this.serialize = config.serializeFn;
        } else {
            this.serialize = _defSerialize;
        }
        DbProxy.apply(this, arguments);
    }
    
    CreateProxy.prototype = Object.create(DbProxy.prototype);

    CreateProxy.prototype.getRecords = function(options, callback) {
        _get(options, function(data) {
            if (typeof options === "object" && options.sort) {
                data.orderBy(options.sort);
            }
            callback( data );
        }, errorHandle);
    }
    
    CreateProxy.prototype.query = function(key, filters, callback) {
        _get(key, function(data) {
            var results = data.query(filters);
            callback( results );
        }, errorHandle);
    }
    
    CreateProxy.prototype.groupBy = function(key, filters, options, groups, callback) {
        _get(key, function(data) {
            var results = data.groupBy(options, groups, filters);
            callback( results );
        }, errorHandle);
    }
    
    CreateProxy.prototype.insert = function(key, record, callback) {
        _save("POST", key, record, callback, errorHandle);
    }

    CreateProxy.prototype.update = function(key, record, callback) {
        _save("PUT", key, record, callback, errorHandle);
    }
    
    CreateProxy.prototype.delete = function(key, record, callback) {
        var url = this.config.url + "/" + key + "/" + record.id,
            config = {};
        
        if (this.config.headers) {
            config.headers = this.config.headers;
        }
        
        _httpRequest(url, "DELETE", config, function(xhr) {
            if (typeof callback === "function") {
                success( xhr );
            }
        }, error);
    }

    CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        var self = this,
            total = toInsert.length + toUpdate.length + toDelete.length,
            cb = callback && typeof callback === "function" ? callback : function() {},
            i;

        function progress() {
            total--;
            if (total === 0) {
                cb();
                return;
            }
        }

        if (total === 0) {
            return cb();
        }
        
        // to insert
        for (i = 0; i < toInsert.length; i++) {
            self.insert(key, toInsert[i], progress);
        }
        // to update
        for (i = 0; i < toUpdate.length; i++) {
            self.update(key, toUpdate[i], progress);
        }
        // to delete
        for (i = 0; i < toDelete.length; i++) {
            self.delete(key, toDelete[i], progress);
        }
    }
    
    return CreateProxy;
})();