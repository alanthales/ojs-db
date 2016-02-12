/*
    LocalStorage Proxy Class
    Autor: Alan Thales, 09/2015
    Requires: HashMap.js, DbProxy.js
*/
var LocalStorageProxy = (function() {
    var _get = function(key) {
        var table = window.localStorage[key],
            results = new HashMap();
        if (table) {
            results.putRange( JSON.parse(table) );
        }
        return results;
    };

    var _saveAll = function(key, table, callback) {
        window.localStorage[key] = JSON.stringify(table);
        if (typeof callback == "function") {
            callback();
        }
    };
    
    function CreateProxy() {
        DbProxy.apply(this, arguments);
    }
    
    CreateProxy.prototype = Object.create(DbProxy.prototype);

    CreateProxy.prototype.getRecords = function(options, callback) {
        var opts = typeof options === "object" ? options : { key: options },
            table = _get(opts.key);

        if (opts.sort && opts.sort !== "") {
            table.sort(function(a,b) {
                return (a[opts.sort] > b[opts.sort]) - (a[opts.sort] < b[opts.sort]);
            });
        }

        if (typeof callback === "function") {
            callback( table );
        }
    }

    CreateProxy.prototype.select = function(key, opts, callback) {
        var table = _get(key),
            opts = opts && typeof opts === "object" ? opts : { },
            field, prop, matched, str,
            results;
        
        results = table.filter(function(record) {
            matched = true;
            
            for (field in opts) {
                if (!matched) {
                    break;
                }
                
                if (typeof opts[field] !== "object") {
                    matched = record[field] == opts[field];
                    continue;
                }
                
                str = record[field].toString();
                
                for (prop in opts[field]) {
                    switch(prop) {
                        case "$gt":
                            matched = record[field] > opts[field][prop];
                            break;
                        case "$gte":
                            matched = record[field] >= opts[field][prop];
                            break;
                        case "$lt":
                            matched = record[field] < opts[field][prop];
                            break;
                        case "$lte":
                            matched = record[field] <= opts[field][prop];
                            break;
                        case "$start":
                            matched = str.lastIndexOf(opts[field][prop], 0) === 0;
                            break;
                        case "$end":
                            matched = str.indexOf(opts[field][prop], str.length - opts[field][prop].length) !== -1;
                            break;
                        case "$like":
                            matched = str.indexOf(opts[field][prop]) > -1;
                            break;
                        default:
                            matched = false;
                    }
                    
                    if (!matched) {
                        break;
                    }
                }
            }
            
            return matched;
        });
        
        callback( results );
    }
    
//    CreateProxy.prototype.select = function(key, opts, callback) {
//        var table = _get(key),
//            opts = opts && typeof opts === "object" ? opts : { },
//            result = [],
//            finded, record, i, props;
//
//        for (i = 0; i < table.length; i++) {
//            finded = true,
//            record = table[i];
//
//            for (props in opts) {
//                if (record[props] != opts[props]) {
//                    finded = false;
//                    break;
//                }
//            }
//
//            if (finded) {
//                result.push(record);
//            }
//        }
//
//        callback( result );
//    }

    CreateProxy.prototype.save = function(key, record, callback) {
        var table = _get(key),
            index = table.indexOfKey('id', record.id);
        if (index === -1) {
            table.push(record);
        } else {
            table.splice(index, 1, record);
        }
        _saveAll(key, table, callback);
    }

    CreateProxy.prototype.remove = function(key, record, callback) {
        var id = typeof record === "object" ? record.id : record,
            table = _get(key),
            index = table.indexOfKey('id', id);
        table.splice(index, 1);
        _saveAll(key, table, callback);
    }

    CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        var self = this,
            toSave = toInsert.concat(toUpdate),
            total = toSave.length + toDelete.length,
            cb = callback && typeof callback === "function" ? callback : function() {},
            i;

        function progress() {
            total--;
            if (total === 0) {
                cb();
            }
        }

        for (i = 0; i < toSave.length; i++) {
            self.save(key, toSave[i], progress);
        }

        for (i = 0; i < toDelete.length; i++) {
            self.remove(key, toDelete[i], progress);
        }
    }
    
    return CreateProxy;
})();