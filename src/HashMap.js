/*
    HashMap Class
    Autor: Alan Thales, 10/2015
*/
var HashMap = (function() {
    var _recordMatch = function(record, opts) {
        var matched = true,
            field, prop, str;

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
                    case "$contain":
                        matched = str.indexOf(opts[field][prop]) > -1;
                        break;
                    case "$in":
                        matched = opts[field][prop].indexOf(record[field]) > -1;
                        break;
                    case "$custom":
                        matched = opts[field][prop].call(record[field]);
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
    }

    var _aggregate = function(array, options, value) {
        var opts = options && typeof options === "object" ? options : {},
            value = value || {},
            field, prop;

        for (prop in opts) {
            field = opts[prop];

            switch(prop) {
                case "$max":
                    array.sort(function(a, b){return b[field] - a[field]});
                    value[field] = array[0][field];
                    break;
                case "$min":
                    array.sort(function(a, b){return a[field] - b[field]});
                    value[field] = array[0][field];
                    break;
                case "$sum":
                    value[field] = array.map(function(item) {return item[field]}).reduce(function(previous, current) {
                        return parseFloat(previous) + parseFloat(current);
                    }, 0);
                    break;
                case "$avg":
                    value[field] = array.map(function(item) {return item[field]}).reduce(function(previous, current) {
                        return parseFloat(previous) + parseFloat(current);
                    }, 0);
                    value[field] /= array.length;
                    break;
                case "$count":
                    value[field] = array.length;
                    break;
                default:
                    value[field] = null;
            }
        }

        return value;
    }
    
    function Collection() {
        var collection = [];

        collection = (Array.apply( collection, arguments ) || collection);

        collection.__proto__ = Collection.prototype;

        collection.mapTable = function(key) {
            return this.map(function(item) {
                return item[key];
            });
        }

        collection.indexOfKey = function(key, value) {
            return this.mapTable(key).indexOf(value);
        }

        collection.put = function(obj, index) {
            var i = index || this.length;
            this[i] = obj;
        }

        collection.putRange = function(arr) {
            for (var i = 0; i < arr.length; i++) {
                this.put(arr[i], i);
            }
        }

        collection.query = function(filters) {
            var opts = filters && typeof filters === "object" ? filters : { },
                results = new Collection();

            results.putRange(
                this.filter(function(record) {
                    return _recordMatch(record, opts);
                })
            );

            return results;
        }
        
        collection.orderBy = function(sorters) {
            var opts = sorters && typeof sorters === "object" ? sorters : { },
                field;
            
            this.sort(function(a,b) {
                var result = 0;
                
                for (field in opts) {
                    if (a[field] == b[field]) {
                        result = 0;
                        continue;
                    }
                    if (opts[field] === 'desc') {
                        result = (b[field] > a[field]) - (b[field] < a[field]);
                    } else {
                        result = (a[field] > b[field]) - (a[field] < b[field]);
                    }
                    break;
                }
                
                return result;
            });
            
            return this;
        }
        
        collection.groupBy = function(options, groups) {
            var results = new Collection(),
                grouped = [],
                group, g, i;

            this.forEach(function(item) {
                g = {};
                for (i = 0; i < groups.length; i++) {
                    g[groups[i]] = item[groups[i]];
                }
                group = JSON.stringify( g );
                grouped[group] = grouped[group] || [];
                grouped[group].push( item );
            });

            results.putRange(
                Object.keys(grouped).map(function(item) {
                    g = JSON.parse( item );
                    return _aggregate(grouped[item], options, g);
                })
            );
            
            return results;
        }
        
        return collection;
    }
    
    Collection.prototype = Object.create(Array.prototype);
    
    Collection.cloneObject = function(obj) {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
            var out = [], i = 0, len = obj.length;
            for ( ; i < len; i++ ) {
                out[i] = arguments.callee(obj[i]);
            }
            return out;
        }
        if (obj && !(obj instanceof Date) && (typeof obj === 'object')) {
            var out = {}, i;
            for ( i in obj ) {
                out[i] = arguments.callee(obj[i]);
            }
            return out;
        }
        return obj;
    }

    return Collection;
})();
