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
        
        http.open(method, url, true);
        
        http.onreadystatechange = function() {
            if (http.readyState === 4) {
                callback = [200,201,304].indexOf(http.status) > -1 ? success : error;
                callback(http);
            }
        }
        
        if (typeof config === "object") {
            params = config.data;
            for (prop in config.headers) {
                http.setRequestHeader(prop, config.headers[prop]);
            }
        }
        
        http.send(params);
    };

    var _get = function(options, success, error) {
        var opts = typeof options === "object" ? options : { key: options },
            url = this.config.url + "/" + opts.key,
            table = new ArrayMap(),
            p;
        
        if (opts.params) {
            url += '?';
            for (p in opts.params) {
                url += p + "=" + opts.params[p] + '&';
            }
            url = url.slice(0, -1);
        }
        
        _httpRequest(url, "GET", this.config, function(xhr) {
            table.putRange( JSON.parse(xhr.responseText, DbProxy.dateParser) );
            success( table );
        }, error);
    };
    
    var _save = function(method, key, record, success, error) {
        var url = this.config.url + "/" + key,
            config = {};

        if (method === "POST" && this.autoPK) {
            delete record.id;
        }
        
        if (method === "PUT") {
            url += "/" + record.id;
        }

        config.data = this.serialize(record);
        
        if (this.config.headers) {
            config.headers = this.config.headers;
        }
        
        _httpRequest(url, method, config, success, error);
    };

    function ProxyError(xhr) {
        var res;
        
        try {
            res = JSON.parse(xhr.responseText);
        } catch (e) {
            res = { error: xhr.responseText };
        }
        
        this.code = xhr.status;
        this.status = xhr.statusText;
        this.error = res.error || {};
    }
    
    function CreateProxy(config) {
        this.config = config;
        
//        if (config && config.autoPK) {
//            this.autoPK = config.autoPK;
//        }
        
        if (config.serializeFn && typeof config.serializeFn === "function") {
            this.serialize = config.serializeFn;
        } else {
            this.serialize = _defSerialize;
        }
        
        DbProxy.apply(this, arguments);
    }
    
    CreateProxy.prototype = Object.create(DbProxy.prototype);

    CreateProxy.prototype.getRecords = function(options, callback) {
        _get.call(this, options, function(data) {
            if (typeof options === "object" && options.sort) {
                data.orderBy(options.sort);
            }
            callback( null, data );
        }, function(xhr) {
            callback( new ProxyError(xhr), [] );
        });
    }
    
    CreateProxy.prototype.query = function(key, filters, callback) {
        _get.call(this, key, function(data) {
            var results = data.query(filters);
            callback( null, results );
        }, function(xhr) {
            callback( new ProxyError(xhr), [] );
        });
    }
    
    CreateProxy.prototype.groupBy = function(key, filters, options, groups, callback) {
        _get.call(this, key, function(data) {
            var results = data.groupBy(options, groups, filters);
            callback( results );
        }, function(xhr) {
            callback( new ProxyError(xhr), [] );
        });
    }
    
    CreateProxy.prototype.insert = function(key, record, callback) {
        _save.call(this, "POST", key, record, function(xhr) {
            var created = JSON.parse(xhr.responseText);
            if (this.autoPK) {
                record.id = created.id || record.id;
            }
            callback(null, xhr);
        }, function(xhr) {
            callback( new ProxyError(xhr) );
        });
    }

    CreateProxy.prototype.update = function(key, record, callback) {
        _save.call(this, "PUT", key, record, function(xhr) {
            callback(null, xhr);
        }, function(xhr) {
            callback( new ProxyError(xhr) );
        });
    }
    
    CreateProxy.prototype.delete = function(key, record, callback) {
        var url = this.config.url + "/" + key + "/" + record.id,
            config = {};
        
        if (this.config.headers) {
            config.headers = this.config.headers;
        }
        
        _httpRequest(url, "DELETE", config, function(xhr) {
            callback(null, xhr);
        }, function(xhr) {
            callback( new ProxyError(xhr) );
        });
    }

    CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        var self = this,
            total = toInsert.length + toUpdate.length + toDelete.length,
            cb = callback && typeof callback === "function" ? callback : function() {},
            errors, i;

        function progress(err) {
            total--;
            if (err) {
                errors = errors || { messages: [] };
                errors.messages.push(err);
            }
            if (total === 0) {
                cb(errors);
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