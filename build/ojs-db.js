var ArrayMap = function(exports) {
    "use strict";
    function Collection() {
        var collection = [];
        return collection = Array.apply(collection, arguments) || collection, collection.__proto__ = Collection.prototype, 
        collection.mapTable = function(key) {
            return this.map(function(item) {
                return item[key];
            });
        }, collection.indexOfKey = function(key, value) {
            return this.mapTable(key).indexOf(value);
        }, collection.put = function(obj, index) {
            var i = index || this.length;
            this[i] = obj;
        }, collection.putRange = function(arr, tail) {
            var l, i, pos = tail && "boolean" == typeof tail ? this.length : 0;
            if (arr) for (arr instanceof Array || (arr = [ arr ]), i = 0, l = arr.length; i < l; i++) this.put(arr[i], pos + i);
        }, collection.query = function(filters) {
            var self = this, opts = filters && "object" == typeof filters ? filters : {}, results = new Collection(), queryFn = function(record) {
                return _recordMatch.call(self, record, opts);
            }, fn = filters && "function" == typeof filters ? filters : queryFn;
            return results.putRange(self.filter(fn)), results;
        }, collection.orderBy = function(sorters) {
            var field, opts = sorters && "object" == typeof sorters ? sorters : {}, ascSort = function(fieldA, fieldB) {
                return "string" == typeof fieldA ? fieldA.localeCompare(fieldB) : (fieldA > fieldB) - (fieldA < fieldB);
            }, descSort = function(fieldA, fieldB) {
                return "string" == typeof fieldB ? fieldB.localeCompare(fieldA) : (fieldB > fieldA) - (fieldB < fieldA);
            };
            return this.sort(function(a, b) {
                var result = 0;
                for (field in opts) {
                    if (a[field] != b[field]) {
                        result = "desc" === opts[field] ? descSort(a[field], b[field]) : ascSort(a[field], b[field]);
                        break;
                    }
                    result = 0;
                }
                return result;
            }), this;
        }, collection.groupBy = function(options, groups, filters) {
            var group, g, i, self = this, results = new Collection(), flts = filters && "object" == typeof filters ? filters : {}, l = groups.length, grouped = {};
            return self.forEach(function(item) {
                if (_recordMatch.call(self, item, flts)) {
                    for (g = {}, i = 0; i < l; i++) g[groups[i]] = item[groups[i]];
                    group = JSON.stringify(g), grouped[group] = grouped[group] || [], grouped[group].push(item);
                }
            }), results.putRange(Object.keys(grouped).map(function(item) {
                return g = JSON.parse(item), _aggregate(grouped[item], options, g);
            })), results;
        }, collection.compute = function(options) {
            return _aggregate(this, options);
        }, collection;
    }
    var _recordMatch = function(record, opts) {
        var field, prop, str, matched = !0;
        for (field in opts) {
            if (!matched) break;
            if ("object" == typeof opts[field]) {
                str = record[field].toString();
                for (prop in opts[field]) {
                    switch (prop) {
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

                      case "$not":
                        matched = record[field] != opts[field][prop];
                        break;

                      case "$start":
                        matched = 0 === str.lastIndexOf(opts[field][prop], 0);
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

                      default:
                        matched = !1;
                    }
                    if (!matched) break;
                }
            } else matched = record[field] == opts[field];
        }
        return matched;
    }, _aggregate = function(array, options, obj) {
        var prop, field, alias, opts = options && options instanceof Array ? options : [ options ], value = obj || {};
        return opts.forEach(function(opt) {
            for (prop in opt) break;
            switch (field = opt[prop], alias = opt.alias || field, prop) {
              case "$max":
                array.sort(function(a, b) {
                    return b[field] - a[field];
                }), value[alias] = array[0][field];
                break;

              case "$min":
                array.sort(function(a, b) {
                    return a[field] - b[field];
                }), value[alias] = array[0][field];
                break;

              case "$sum":
                value[alias] = array.map(function(item) {
                    return item[field];
                }).reduce(function(previous, current) {
                    return parseFloat(previous) + parseFloat(current);
                }, 0);
                break;

              case "$avg":
                value[alias] = array.map(function(item) {
                    return item[field];
                }).reduce(function(previous, current) {
                    return parseFloat(previous) + parseFloat(current);
                }, 0), value[alias] /= array.length;
                break;

              case "$count":
                value[alias] = array.length;
            }
        }), value;
    };
    return exports.ArrayMap = Collection, Collection.prototype = Object.create(Array.prototype), 
    Collection;
}(this), OjsUtils = function(exports) {
    "use strict";
    var randomBytes = function(size) {
        for (var r, bytes = new Array(size), i = 0; i < size; i++) 0 === (3 & i) && (r = 4294967296 * Math.random()), 
        bytes[i] = r >>> ((3 & i) << 3) & 255;
        return bytes;
    }, byteArrayToBase64 = function(uint8) {
        function tripletToBase64(num) {
            return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[63 & num];
        }
        var temp, length, i, lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", extraBytes = uint8.length % 3, output = "";
        for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2], 
        output += tripletToBase64(temp);
        switch (extraBytes) {
          case 1:
            temp = uint8[uint8.length - 1], output += lookup[temp >> 2], output += lookup[temp << 4 & 63], 
            output += "==";
            break;

          case 2:
            temp = (uint8[uint8.length - 2] << 8) + uint8[uint8.length - 1], output += lookup[temp >> 10], 
            output += lookup[temp >> 4 & 63], output += lookup[temp << 2 & 63], output += "=";
        }
        return output;
    };
    return exports.OjsUtils = {
        newId: function() {
            return Date.now();
        },
        uuid: function(len) {
            return byteArrayToBase64(randomBytes(Math.ceil(Math.max(8, 2 * len)))).replace(/[+\/]/g, "").slice(0, len);
        },
        cloneObject: function(obj) {
            var out, i, len;
            if (!obj || obj instanceof Date) return obj;
            if (obj instanceof ArrayMap ? out = new ArrayMap() : obj instanceof SimpleDataSet ? out = new SimpleDataSet() : obj instanceof ChildRecord && (out = new ChildRecord()), 
            "[object Array]" === Object.prototype.toString.call(obj)) {
                for (out = out || [], i = 0, len = obj.length; i < len; i++) out[i] = this.cloneObject(obj[i]);
                return out;
            }
            if ("object" == typeof obj) {
                out = out || {};
                for (i in obj) obj.hasOwnProperty(i) && (out[i] = this.cloneObject(obj[i]));
                return out;
            }
            return obj;
        },
        cloneProperties: function(source, dest) {
            for (var prop in source) source.hasOwnProperty(prop) && (dest[prop] = source[prop]);
        }
    }, exports.OjsUtils;
}(this), ChildRecord = function(exports) {
    "use strict";
    function CreateRecord(record) {
        this.master = function() {
            return record;
        };
    }
    return exports.ChildRecord = CreateRecord, CreateRecord;
}(this), EventEmitter = function(exports) {
    "use strict";
    function CreateEmitter() {
        var _topics = {};
        this.topics = function() {
            return _topics;
        };
    }
    return exports.EventEmitter = CreateEmitter, CreateEmitter.prototype.on = function(topic, listener) {
        var topics = this.topics();
        topics.hasOwnProperty(topic) || (topics[topic] = []);
        var index = topics[topic].push(listener) - 1;
        return {
            remove: function() {
                delete topics[topic][index];
            }
        };
    }, CreateEmitter.prototype.emit = function(topic, args) {
        var topics = this.topics();
        topics.hasOwnProperty(topic) && topics[topic].forEach(function(item) {
            item(void 0 !== args ? args : {});
        });
    }, CreateEmitter;
}(this), SimplePromise = function(exports) {
    "use strict";
    function defer(opt_scope) {
        return new Deferred(opt_scope);
    }
    function isPromise(arg) {
        return arg && "function" == typeof arg.then;
    }
    function when(var_args) {
        for (var deferred = new Deferred(), args = [].slice.call(arguments, 0), results = [], callback = function(value) {
            results.push(value), args.length === results.length && deferred.resolve(results);
        }, errback = function(error) {
            deferred.reject(error);
        }, i = 0, len = args.length; i < len; i++) {
            var arg = args[i];
            isPromise(arg) ? arg.then(callback, errback).resolve() : "function" == typeof arg ? defer().then(arg).then(callback, errback).resolve() : defer().then(function() {
                return arg;
            }).then(callback, errback).resolve();
        }
        return deferred;
    }
    var freeze = Object.freeze || function() {}, IPromise = function() {};
    IPromise.prototype.resolve, IPromise.prototype.reject, IPromise.prototype.then;
    var Deferred = function(opt_scope) {
        this.state_ = Deferred.State.UNRESOLVED, this.chain_ = [], this.scope_ = opt_scope || null;
    };
    return Deferred.prototype.state_, Deferred.prototype.chain_, Deferred.prototype.scope_, 
    Deferred.prototype.result_, Deferred.prototype.then = function(callback, errback, progback) {
        return this.chain_.push([ callback || null, errback || null, progback || null ]), 
        this.state_ !== Deferred.State.UNRESOLVED && this.fire_(), this;
    }, Deferred.prototype.resolve = function(value) {
        this.state_ = Deferred.State.RESOLVED, this.fire_(value);
    }, Deferred.prototype.reject = function(error) {
        this.state_ = Deferred.State.REJECTED, this.fire_(error);
    }, Deferred.prototype.isResolved = function() {
        return this.state_ === Deferred.State.RESOLVED;
    }, Deferred.prototype.isRejected = function() {
        return this.state_ === Deferred.State.REJECTED;
    }, Deferred.prototype.next = function(callback, errback, opt_interval) {
        var interval = opt_interval || 10, deferred = new Deferred(this);
        return deferred.then(callback, errback), this.then(function(value) {
            setTimeout(function() {
                deferred.resolve(value);
            }, interval);
        }, function(error) {
            setTimeout(function() {
                deferred.reject(error);
            }, interval);
        }), deferred;
    }, Deferred.prototype.fire_ = function(value) {
        var res = "undefined" != typeof value ? value : this.result_;
        for (this.result_ = res; this.chain_.length; ) {
            var entry = this.chain_.shift(), fn = this.state_ === Deferred.State.REJECTED ? entry[1] : entry[0];
            if (fn) try {
                res = this.result_ = fn.call(this.scope_, res);
            } catch (e) {
                this.state_ = Deferred.State.REJECTED, res = this.result_ = e;
            }
        }
    }, Deferred.State = {
        UNRESOLVED: "unresolved",
        RESOLVED: "resolved",
        REJECTED: "rejected"
    }, freeze(Deferred.State), exports.SimplePromise = {
        defer: defer,
        isPromise: isPromise,
        when: when
    }, exports.SimplePromise;
}(this), DbEvents = function(exports) {
    return exports.DbEvents = new EventEmitter(), exports.DbEvents;
}(this), SimpleDataSet = function(exports) {
    "use strict";
    function CreateDataSet(table) {
        EventEmitter.apply(this);
        var _table = table || "tableName";
        this._history = [], this._data = new ArrayMap(), this.table = function() {
            return _table;
        };
    }
    exports.SimpleDataSet = CreateDataSet, CreateDataSet.prototype = Object.create(EventEmitter.prototype), 
    CreateDataSet.prototype._cleanCache = function() {
        this._history.length = 0;
    }, CreateDataSet.prototype.get = function(id) {
        var index = this._data.indexOfKey("id", id);
        return this._data[index];
    };
    var _afterChange = function(operation, record) {
        var idx, exists, change = {
            op: operation,
            record: OjsUtils.cloneObject(record)
        };
        if (exists = this._history.some(function(item, index) {
            return idx = index, item.op === operation && item.record.id === record.id;
        })) return void this._history.splice(idx, 1, change);
        if (this._history.push(change), this.emit(this.table(), {
            event: operation,
            data: record
        }), record instanceof ChildRecord) {
            var table = [ this.table(), ".child" ].join("");
            DbEvents.emit(table, {
                event: operation,
                data: record
            });
        }
    };
    return CreateDataSet.prototype.insert = function(record) {
        record.id || (record.id = OjsUtils.newId());
        var index = this._data.indexOfKey("id", record.id);
        return index === -1 && (this._data.push(record), _afterChange.call(this, "insert", record)), 
        this;
    }, CreateDataSet.prototype.update = function(record) {
        if (!record.id) return this;
        var index = this._data.indexOfKey("id", record.id);
        return index === -1 ? this : (_afterChange.call(this, "update", this._data[index]), 
        this._data.splice(index, 1, record), this);
    }, CreateDataSet.prototype.save = function(record) {
        return record ? record.id && this.get(record.id) ? this.update(record) : this.insert(record) : this;
    }, CreateDataSet.prototype.delete = function(record) {
        if (!record.id) return this;
        var index = this._data.indexOfKey("id", record.id);
        return index >= 0 && (_afterChange.call(this, "delete", this._data[index]), this._data.splice(index, 1)), 
        this;
    }, CreateDataSet.prototype.insertAll = function(records) {
        var self = this;
        return records instanceof Array ? (records.forEach(function(record) {
            self.insert(record);
        }), self) : self;
    }, CreateDataSet.prototype.clear = function(mustNotify) {
        return this._data.length = 0, this._cleanCache(), mustNotify && this.emit(this.table(), {
            event: "clear",
            data: []
        }), this;
    }, CreateDataSet.prototype.cancel = function() {
        if (this._history.length) {
            for (var item, index, self = this, i = self._history.length - 1; i >= 0; i--) switch (item = self._history[i], 
            index = self._data.indexOfKey("id", item.record.id), item.op) {
              case "insert":
                self._data.splice(index, 1);
                break;

              case "update":
                self._data.splice(index, 1, item.record);
                break;

              case "delete":
                self._data.push(item.record);
            }
            this.emit(this.table(), {
                event: "cancel",
                data: this._history
            }), this._history.length = 0;
        }
    }, CreateDataSet.prototype.data = function() {
        return this._data;
    }, CreateDataSet.prototype.count = function() {
        return this._data.length;
    }, CreateDataSet.prototype.item = function(index) {
        return this._data[index];
    }, CreateDataSet.prototype.filter = function(options) {
        return this._data.query(options);
    }, CreateDataSet.prototype.forEach = function(fn) {
        this._data.forEach(fn);
    }, CreateDataSet.prototype.subscribe = function(fn) {
        return this._listener = this.on(this.table(), fn), this;
    }, CreateDataSet.prototype.unsubscribe = function() {
        return this._listener && this._listener.remove(), this;
    }, CreateDataSet;
}(this), DataSet = function(exports) {
    "use strict";
    function CreateDataSet(table, proxy, synchronizer) {
        SimpleDataSet.apply(this, [ table ]), _pages[table] = 0, this._opts = {}, this._eof = !0, 
        this._active = !1, this._reOpenOnRefresh = !1, this.proxy = function() {
            return proxy;
        }, this.synchronizer = function() {
            return synchronizer;
        };
        var childTable = [ table, ".child" ].join(""), self = this;
        DbEvents.on(childTable, function(args) {
            self.save(args.data.master());
        });
    }
    var _pages = {};
    exports.DataSet = CreateDataSet, CreateDataSet.prototype = Object.create(SimpleDataSet.prototype), 
    CreateDataSet.prototype.emit = function(key, args) {
        return DbEvents.emit(key, args), this;
    }, CreateDataSet.prototype.on = function(key, fn) {
        return DbEvents.on(key, fn);
    }, CreateDataSet.prototype.sort = function(order) {
        return this._opts.sort = order, this;
    }, CreateDataSet.prototype.limit = function(value) {
        return this._opts.limit = value, this;
    }, CreateDataSet.prototype.where = function(params) {
        return this._opts.params = params, this;
    }, CreateDataSet.prototype.reOpenOnRefresh = function(value) {
        return this._reOpenOnRefresh = "true" === value.toString(), this;
    };
    var _getRecords = function(opts, callback) {
        var self = this, cb = callback && "function" == typeof callback ? callback : function() {};
        self.proxy().getRecords(opts, function(err, records) {
            self._data.putRange(records, !0), self._active = !err, self._eof = records && records.length < (self._opts.limit || 30), 
            cb(err, records), err || self.emit(self.table(), {
                event: "read",
                data: records
            });
        });
    };
    CreateDataSet.prototype.open = function() {
        var opts = {
            key: this.table()
        }, defer = SimplePromise.defer(), self = this;
        return self._active ? (defer.resolve(self), defer) : (OjsUtils.cloneProperties(self._opts, opts), 
        _getRecords.call(self, opts, function(err, records) {
            return err ? void defer.reject(err) : void defer.resolve(self);
        }), defer);
    }, CreateDataSet.prototype.next = function() {
        if (!this._active) throw "Invalid operation on closed dataset";
        this._opts.limit && !isNaN(this._opts.limit) || (this._opts.limit = 30), _pages[this.table()] = ++_pages[this.table()];
        var self = this, skip = _pages[self.table()] * self._opts.limit, opts = {
            key: self.table(),
            skip: skip
        }, defer = SimplePromise.defer();
        return self.eof() ? (defer.resolve(self), defer) : (OjsUtils.cloneProperties(self._opts, opts), 
        _getRecords.call(self, opts, function(err, results) {
            return err ? void defer.reject(err) : void defer.resolve(self);
        }), defer);
    }, CreateDataSet.prototype.close = function() {
        return SimpleDataSet.prototype.clear.apply(this, arguments), _pages[this.table()] = 0, 
        this._active = !1, this;
    }, CreateDataSet.prototype.clear = function() {
        function done(err) {
            return err ? void defer.reject(err) : (_pages[self.table()] = 0, SimpleDataSet.prototype.clear.apply(self, arguments), 
            void defer.resolve(self));
        }
        var self = this, defer = SimplePromise.defer();
        return self.proxy().clear(self.table(), done), defer;
    }, CreateDataSet.prototype.refresh = function() {
        if (this._reOpenOnRefresh) return this._active = !1, this.open();
        var defer = SimplePromise.defer();
        return this._opts.sort && this._data.orderBy(this._opts.sort), defer.resolve(this), 
        defer;
    }, CreateDataSet.prototype.insert = function(record) {
        if (!this._active) throw "Invalid operation on closed dataset";
        return SimpleDataSet.prototype.insert.apply(this, arguments);
    }, CreateDataSet.prototype.update = function(record) {
        if (!this._active) throw "Invalid operation on closed dataset";
        return SimpleDataSet.prototype.update.apply(this, arguments);
    }, CreateDataSet.prototype.delete = function(record) {
        if (!this._active) throw "Invalid operation on closed dataset";
        return SimpleDataSet.prototype.delete.apply(this, arguments);
    };
    var _filterOp = function(changes, operation) {
        var results = [];
        return changes.forEach(function(item) {
            item.op === operation && results.push(item.record);
        }), results;
    };
    return CreateDataSet.prototype.post = function(ignoreSync) {
        function done(err) {
            return err ? (self.cancel(), void defer.reject(err)) : (sync && !ignoreSync && sync.writeData(self.table(), toInsert, toUpdate, toDelete), 
            self.refresh().then(function() {
                defer.resolve(!0);
            }, function(err) {
                defer.reject(err);
            }), void self._cleanCache());
        }
        if (!this._active) throw "Invalid operation on closed dataset";
        var toInsert, toUpdate, toDelete, self = this, sync = this.synchronizer(), defer = SimplePromise.defer();
        return self._history.length ? (toInsert = _filterOp(self._history, "insert"), toUpdate = _filterOp(self._history, "update"), 
        toDelete = _filterOp(self._history, "delete"), self.proxy().commit(self.table(), toInsert, toUpdate, toDelete, done), 
        defer) : (defer.resolve(!0), defer);
    }, CreateDataSet.prototype.sync = function() {
        var self = this, sync = this.synchronizer(), defer = SimplePromise.defer();
        return sync ? (sync.exec(self.table(), function(err, allData, toDelete) {
            function deleteDiff(item) {
                serverData.indexOfKey("id", item.id) < 0 && self.delete(item);
            }
            function deleteFix(item) {
                toDeleteMap.indexOf(item.id) > -1 && self.delete(item);
            }
            if (err) return void defer.reject(err);
            if (allData = allData || [], toDelete = toDelete || [], !allData.length && !toDelete.length) return void defer.resolve(self);
            var deleteFn, serverData = new ArrayMap(), localData = new ArrayMap(), toDeleteMap = toDelete.map(function(item) {
                return item.id;
            });
            serverData.putRange(allData), localData.putRange(self._data), deleteFn = toDelete && toDelete instanceof Array ? deleteFix : deleteDiff, 
            localData.forEach(deleteFn), serverData.forEach(function(item) {
                self.save(item);
            }), self.post(!0).then(function() {
                defer.resolve(self);
            }, function(err) {
                defer.reject(err);
            });
        }), defer) : (defer.resolve(self), defer);
    }, CreateDataSet.prototype.fetch = function(property) {
        if (!this._active) throw "Invalid operation on closed dataset";
        var defer = SimplePromise.defer(), self = this;
        return this.count() ? (this.proxy().fetch(this.table(), this, property, function(err) {
            return err ? void defer.reject(err) : void defer.resolve(self);
        }), defer) : (defer.resolve(self), defer);
    }, CreateDataSet.prototype.eof = function() {
        return this._eof;
    }, CreateDataSet.prototype.active = function() {
        return this._active;
    }, CreateDataSet;
}(this), DbProxies = function(exports) {
    return exports.DbProxies = {
        LOCALSTORAGE: 0,
        SQLITE: 1,
        RESTFUL: 2
    }, exports.DbProxies;
}(this), DbProxy = function(exports) {
    function CreateProxy() {}
    return exports.DbProxy = CreateProxy, CreateProxy.prototype.createDatabase = function(maps, callback) {
        "function" == typeof callback && callback();
    }, CreateProxy.prototype.getRecords = function(options, callback) {
        "function" == typeof callback && callback(null, []);
    }, CreateProxy.prototype.groupBy = function(key, options, groups, filters, callback) {
        "function" == typeof callback && callback(null, []);
    }, CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        "function" == typeof callback && callback();
    }, CreateProxy.prototype.fetch = function(key, property, callback) {
        "function" == typeof callback && callback();
    }, CreateProxy.prototype.clear = function(key, callback) {
        "function" == typeof callback && callback();
    }, CreateProxy.dateParser = function(key, value) {
        var test, reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
        return "string" == typeof value && (test = reISO.exec(value)) ? new Date(value) : value;
    }, CreateProxy;
}(this), LocalStorageProxy = function(exports) {
    "use strict";
    function CreateProxy() {
        DbProxy.apply(this, arguments);
    }
    var _get = function(opts) {
        var key = "object" == typeof opts ? opts.key : opts, table = window.localStorage[key], results = new ArrayMap();
        return table && results.putRange(JSON.parse(table, DbProxy.dateParser)), results.length && opts.params ? results.query(opts.params) : results;
    }, _saveAll = function(key, table, callback) {
        window.localStorage[key] = JSON.stringify(table), "function" == typeof callback && callback();
    };
    return exports.LocalStorageProxy = CreateProxy, CreateProxy.prototype = Object.create(DbProxy.prototype), 
    CreateProxy.prototype.getRecords = function(options, callback) {
        var table = _get(options);
        options.sort && table.orderBy(options.sort), "function" == typeof callback && callback(null, table);
    }, CreateProxy.prototype.query = function(key, filters, callback) {
        var table = _get(key), results = table.query(filters);
        callback(null, results);
    }, CreateProxy.prototype.groupBy = function(key, options, groups, filters, callback) {
        var table = _get(key);
        callback(null, table.groupBy(options, groups, filters));
    }, CreateProxy.prototype.save = function(key, record, callback) {
        var table = _get(key), index = table.indexOfKey("id", record.id);
        index === -1 ? table.push(record) : table.splice(index, 1, record), _saveAll(key, table, callback);
    }, CreateProxy.prototype.remove = function(key, record, callback) {
        var id = "object" == typeof record ? record.id : record, table = _get(key), index = table.indexOfKey("id", id);
        table.splice(index, 1), _saveAll(key, table, callback);
    }, CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        function progress() {
            total--, 0 === total && cb();
        }
        var i, self = this, toSave = toInsert.concat(toUpdate), total = toSave.length + toDelete.length, cb = callback && "function" == typeof callback ? callback : function() {};
        if (0 === total) return cb();
        for (i = 0; i < toSave.length; i++) self.save(key, toSave[i], progress);
        for (i = 0; i < toDelete.length; i++) self.remove(key, toDelete[i], progress);
    }, CreateProxy.prototype.clear = function(key, callback) {
        _saveAll(key, [], callback);
    }, CreateProxy;
}(this), SQLiteProxy = function(exports) {
    "use strict";
    function CreateProxy(options) {
        function init() {
            db = window.sqlitePlugin ? window.sqlitePlugin.openDatabase(opts) : window.openDatabase(opts.name, "SQLite Database", "1.0", 5242880);
        }
        var db = null, opts = {}, cordova = "undefined" != typeof window.cordova;
        "object" == typeof options ? (opts.name = options.name, opts.location = options.location || "default") : opts.name = options, 
        cordova ? document.addEventListener("deviceready", init) : init(), this.getDb = function() {
            return db;
        }, DbProxy.apply(this, arguments);
    }
    var _selectFrom = "SELECT * FROM", _maps = {};
    exports.SQLiteProxy = CreateProxy, CreateProxy.prototype = Object.create(DbProxy.prototype), 
    CreateProxy.prototype.createDatabase = function(maps, callback) {
        var self = this;
        _maps = OjsUtils.cloneObject(maps), self.getDb().transaction(function(tx) {
            function progress() {
                total--, 0 === total && cb();
            }
            var fields, field, table, prop, sql, cb = callback && "function" == typeof callback ? callback : function() {}, total = Object.keys(_maps).length;
            for (table in _maps) {
                fields = "";
                for (prop in _maps[table]) field = _maps[table][prop], field.hasMany || (field.hasOne && (field.type = _maps[field.hasOne].id.type), 
                fields += [ prop, field.type, field.required ? "NOT NULL" : "", field.primaryKey ? "PRIMARY KEY" : "", "," ].join(" "));
                fields = fields.substr(0, fields.length - 1), sql = [ "CREATE TABLE IF NOT EXISTS", table, "(", fields, ")" ].join(" "), 
                tx.executeSql(sql, [], progress);
            }
        }, function(err) {
            cb(err);
        });
    };
    var _parseItem = function(key, item) {
        var prop, value, fdmap, result = {};
        for (prop in _maps[key]) value = item[prop], fdmap = _maps[key][prop], "date" !== fdmap.type && "datetime" !== fdmap.type || (value = new Date(value)), 
        result[prop] = value;
        return result;
    }, _formatValue = function(table, key, record) {
        var fdmap = _maps[table][key], value = void 0 === typeof record[key] ? null : record[key];
        return fdmap.hasOne && record instanceof ChildRecord && (value = record.master().id), 
        value;
    }, _select = function(key, sql, params, transaction, callback) {
        var i, l, record, table = new ArrayMap();
        transaction.executeSql(sql, params, function(tx, results) {
            for (l = results.rows.length, i = 0; i < l; i++) record = _parseItem(key, results.rows.item(i)), 
            table.push(record);
            "function" == typeof callback && callback(null, table);
        }, function(tx, err) {
            console.error(err.message), callback(err);
        });
    }, _orderBy = function(sorters) {
        var field, result = [];
        for (field in sorters) result.push(field + " " + sorters[field]);
        return "ORDER BY " + result.join(",");
    };
    CreateProxy.prototype.getRecords = function(options, callback) {
        var p, self = this, key = options && options.key ? options.key : options, sortBy = options && options.sort ? _orderBy(options.sort) : "", where = "WHERE ", sql = [];
        if ("object" == typeof options) {
            if (sql = [ _selectFrom, options.key ], options.params) {
                for (p in options.params) where += p + " = '" + options.params[p] + "'";
                sql.push(where);
            }
            sql.push(sortBy), options.skip && sql.push("OFFSET " + options.skip), options.limit && sql.push("LIMIT " + options.limit);
        } else sql = [ _selectFrom, options ];
        self.getDb().transaction(function(tx) {
            _select(key, sql.join(" "), [], tx, callback);
        });
    };
    var _formatSql = function(sqlNoWhere, filters) {
        var field, prop, where = "";
        for (field in filters) if ("object" == typeof filters[field]) for (prop in filters[field]) switch (prop) {
          case "$gt":
            where += [ field, ">", filters[field][prop] ].join(" ") + " AND ";
            break;

          case "$gte":
            where += [ field, ">=", filters[field][prop] ].join(" ") + " AND ";
            break;

          case "$lt":
            where += [ field, "<", filters[field][prop] ].join(" ") + " AND ";
            break;

          case "$lte":
            where += [ field, "<=", filters[field][prop] ].join(" ") + " AND ";
            break;

          case "$start":
            where += [ field, " LIKE '", filters[field][prop], "%'" ].join("") + " AND ";
            break;

          case "$end":
            where += [ field, " LIKE '%", filters[field][prop], "'" ].join("") + " AND ";
            break;

          case "$contain":
            where += [ field, " LIKE '%", filters[field][prop], "%'" ].join("") + " AND ";
            break;

          case "$in":
            where += [ field, " IN (", filters[field][prop].join(","), ")" ].join("") + " AND ";
            break;

          default:
            where += "";
        } else where += [ field, " = '", filters[field], "'" ].join("") + " AND ";
        return "" === where ? sqlNoWhere : (where = where.trim().slice(0, -3), [ sqlNoWhere, "WHERE", where ].join(" "));
    }, _formatGroupBy = function(key, options, groups, filters) {
        var prop, field, alias, opts = options && options instanceof Array ? options : [ options ], groupBy = groups.length ? groups.join(",") + ", " : "", where = filters && "object" == typeof filters ? _formatSql("", filters) : "", sql = "";
        return opts.forEach(function(opt) {
            for (prop in opt) break;
            switch (field = opt[prop], alias = opt.alias || field, prop) {
              case "$max":
                sql += [ "MAX(", field, ")", " AS ", alias ].join("") + ", ";
                break;

              case "$min":
                sql += [ "MIN(", field, ")", " AS ", alias ].join("") + ", ";
                break;

              case "$sum":
                sql += [ "SUM(", field, ")", " AS ", alias ].join("") + ", ";
                break;

              case "$avg":
                sql += [ "AVG(", field, ")", " AS ", alias ].join("") + ", ";
                break;

              case "$count":
                sql += [ "COUNT(", field, ")", " AS ", alias ].join("") + ", ";
            }
        }), "" === sql ? [ _selectFrom, key ].join(" ") : (sql = sql.trim().slice(0, -1), 
        sql = [ "SELECT", groupBy, sql, "FROM", key, where ].join(" "), "" === groupBy ? sql : sql + " GROUP BY " + groupBy.trim().slice(0, -1));
    };
    CreateProxy.prototype.query = function(key, filters, callback) {
        var self = this, opts = filters && "object" == typeof filters ? filters : {}, select = [ _selectFrom, key ].join(" "), sql = filters && "function" == typeof filters ? filters() : _formatSql(select, opts);
        self.getDb().transaction(function(tx) {
            _select(key, sql, [], tx, callback);
        });
    }, CreateProxy.prototype.groupBy = function(key, options, groups, filters, callback) {
        var i, l, self = this, sql = _formatGroupBy(key, options, groups, filters), table = new ArrayMap();
        self.getDb().transaction(function(transaction) {
            transaction.executeSql(sql, [], function(tx, results) {
                for (l = results.rows.length, i = 0; i < l; i++) table.push(results.rows.item(i));
                "function" == typeof callback && callback(null, table);
            }, function(tx, err) {
                console.error(err.message), callback(err);
            });
        });
    };
    var _save = function(key, record, transaction, operationFn, callback) {
        function saveChildren() {
            function updateFn() {
                self.update(fdmap.hasMany, updateds, transaction, deleteFn);
            }
            function deleteFn() {
                self.delete(fdmap.hasMany, deleteds, transaction, done);
            }
            var prop, fdmap, items, inserteds = new ArrayMap(), updateds = new ArrayMap(), deleteds = new ArrayMap();
            for (prop in record) fdmap = _maps[key][prop], fdmap && fdmap.hasMany && (items = record[prop], 
            items instanceof SimpleDataSet && (total++, inserteds.putRange(items._inserteds), 
            updateds.putRange(items._updateds), deleteds.putRange(items._deleteds), items._cleanCache(), 
            self.insert(fdmap.hasMany, inserteds, transaction, updateFn)));
            done();
        }
        function done() {
            total--, 0 === total && callback();
        }
        var self = this, total = 1;
        operationFn(key, record, transaction, saveChildren);
    }, _getInsertSql = function(key, record) {
        var prop, sql, value, fdmap, params = [], fields = "", values = "";
        for (prop in _maps[key]) fdmap = _maps[key][prop], fdmap && !fdmap.hasMany && (value = _formatValue(key, prop, record), 
        void 0 !== value && (params.push(value), fields += prop + ",", values += "?,"));
        return fields = fields.substr(0, fields.length - 1), values = values.substr(0, values.length - 1), 
        sql = [ "INSERT INTO", key, "(", fields, ") VALUES (", values, ")" ].join(" "), 
        {
            sql: sql,
            params: params
        };
    }, _insert = function(key, record, transaction, callback) {
        var obj = _getInsertSql(key, record);
        transaction.executeSql(obj.sql, obj.params, callback);
    };
    CreateProxy.prototype.insert = function(key, records, transaction, callback) {
        function progress(record, index) {
            _save.call(self, key, record, transaction, _insert, function() {
                index === l - 1 && callback();
            });
        }
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) progress(records[i], i);
    };
    var _getUpdateSql = function(key, record) {
        var sql, prop, value, fdmap, params = [], where = "id = '" + record.id + "'", sets = "";
        for (prop in _maps[key]) fdmap = _maps[key][prop], "id" != prop && fdmap && !fdmap.hasMany && (value = _formatValue(key, prop, record), 
        sets += prop + " = ?,", params.push(value));
        return sets = sets.substr(0, sets.length - 1), sql = [ "UPDATE", key, "SET", sets, "WHERE", where ].join(" "), 
        {
            sql: sql,
            params: params
        };
    }, _update = function(key, record, transaction, callback) {
        var obj = _getUpdateSql(key, record);
        transaction.executeSql(obj.sql, obj.params, callback);
    };
    CreateProxy.prototype.update = function(key, records, transaction, callback) {
        function progress(record, index) {
            _save.call(self, key, record, transaction, _update, function() {
                index === l - 1 && callback();
            });
        }
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) progress(records[i], i);
    };
    var _delete = function(key, record, transaction, callback) {
        function progress() {
            total--, 0 === total && (sql = [ "DELETE FROM ", key, " WHERE id = '", id, "'" ].join(""), 
            transaction.executeSql(sql, [], function() {
                callback();
            }));
        }
        var sql, prop, fdmap, id = "object" == typeof record ? record.id : record, total = 1;
        for (prop in record) fdmap = _maps[key][prop], fdmap && fdmap.hasMany && (total++, 
        sql = [ "DELETE FROM ", fdmap.hasMany, " WHERE ", fdmap.foreignKey, " = '", id, "'" ].join(""), 
        transaction.executeSql(sql, [], progress), record[prop] instanceof SimpleDataSet && record[prop].clear());
        progress();
    };
    CreateProxy.prototype.delete = function(key, records, transaction, callback) {
        function progress(record, index) {
            _delete.call(self, key, record, transaction, function() {
                index === l - 1 && callback();
            });
        }
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) progress(records[i], i);
    }, CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        function beginTransaction(tx) {
            function updateFn() {
                self.update(key, toUpdate, tx, deleteFn);
            }
            function deleteFn() {
                self.delete(key, toDelete, tx, cb);
            }
            self.insert(key, toInsert, tx, updateFn);
        }
        var self = this, cb = callback && "function" == typeof callback ? callback : function() {};
        return toInsert.length || toUpdate.length || toDelete.length ? void self.getDb().transaction(beginTransaction, function(err) {
            console.error(err.message), cb(err);
        }) : cb();
    };
    var _fetch = function(key, record, property, callback) {
        var i, l, child, opts = {
            params: {}
        }, fdmap = _maps[key][property];
        return record[property] instanceof SimpleDataSet || !fdmap || !fdmap.hasMany ? callback() : (opts.key = fdmap.hasMany, 
        opts.params[fdmap.foreignKey] = record.id, void this.getRecords(opts, function(err, results) {
            if (err) return callback(err);
            for (record[property] = new SimpleDataSet(key), i = 0, l = results.length; i < l; i++) child = new ChildRecord(record), 
            OjsUtils.cloneProperties(results[i], child), record[property].data.push(child);
            callback();
        }));
    };
    return CreateProxy.prototype.fetch = function(key, dataset, property, callback) {
        function progress(record, index) {
            _fetch.call(self, key, record, property, function(err) {
                index === total - 1 && cb(err);
            });
        }
        var cb = "function" == typeof callback ? callback : function() {}, total = dataset.data.length, self = this, i = 0;
        if (0 === total) return cb();
        for (;i < total; i++) progress(dataset.data[i], i);
    }, CreateProxy.prototype.clear = function(key, callback) {
        function beginTransaction(transaction) {
            function progress() {
                total--, 0 === total && transaction.executeSql("DELETE FROM " + key, [], function() {
                    cb();
                });
            }
            for (prop in _maps[key]) _maps[key][prop].hasMany && (total++, sql = [ "DELETE FROM ", _maps[key][prop].hasMany ].join(""), 
            transaction.executeSql(sql, [], progress));
            progress();
        }
        var sql, prop, cb = "function" == typeof callback ? callback : function() {}, total = 1;
        this.getDb().transaction(beginTransaction, cb);
    }, CreateProxy;
}(this), RestProxy = function(exports) {
    "use strict";
    function ProxyError(xhr) {
        var res;
        try {
            res = JSON.parse(xhr.responseText);
        } catch (e) {
            res = {
                error: xhr.responseText
            };
        }
        this.code = xhr.status, this.status = xhr.statusText, this.error = res.error || {};
    }
    function CreateProxy(config) {
        this.config = config, config && config.autoPK && (this.autoPK = !0), config.serializeFn && "function" == typeof config.serializeFn ? this.serialize = config.serializeFn : this.serialize = _defSerialize, 
        DbProxy.apply(this, arguments);
    }
    var _defSerialize = function(obj) {
        return JSON.stringify(obj);
    }, _getHeader = function(obj) {
        var header = "function" == typeof obj ? obj() : obj;
        return header;
    }, _httpRequest = function(url, method, config, success, error) {
        var callback, prop, params, http = new XMLHttpRequest();
        if (http.open(method, url, !0), http.onreadystatechange = function() {
            4 === http.readyState && (callback = [ 200, 201, 304 ].indexOf(http.status) > -1 ? success : error)(http);
        }, "object" == typeof config) {
            params = config.data;
            for (prop in config.headers) http.setRequestHeader(prop, _getHeader(config.headers[prop]));
        }
        http.send(params);
    }, _get = function(options, success, error) {
        var p, opts = "object" == typeof options ? options : {
            key: options
        }, url = this.config.url + "/" + opts.key + "?", table = new ArrayMap();
        if (opts.params) for (p in opts.params) url += p + "=" + ("object" == typeof opts.params[p] ? JSON.stringify(opts.params[p]) : opts.params[p]) + "&";
        if (opts.sort) {
            url += "sort=";
            for (p in opts.sort) {
                url += p + (opts.sort[p] ? " " + opts.sort[p] : "") + "&";
                break;
            }
        }
        opts.skip && (url += "skip=" + opts.skip + "&"), opts.limit && (url += "limit=" + opts.limit + "&"), 
        url = url.slice(0, -1), _httpRequest(url, "GET", this.config, function(xhr) {
            table.putRange(JSON.parse(xhr.responseText, DbProxy.dateParser)), success(table);
        }, error);
    }, _save = function(method, key, record, success, error) {
        var url = this.config.url + "/" + key, config = {};
        "POST" === method && this.autoPK && delete record.id, "PUT" === method && (url += "/" + record.id), 
        config.data = this.serialize(record), this.config.headers && (config.headers = this.config.headers), 
        _httpRequest(url, method, config, success, error);
    };
    return exports.RestProxy = CreateProxy, CreateProxy.prototype = Object.create(DbProxy.prototype), 
    CreateProxy.prototype.getRecords = function(options, callback) {
        _get.call(this, options, function(data) {
            callback(null, data);
        }, function(xhr) {
            callback(new ProxyError(xhr), []);
        });
    }, CreateProxy.prototype.query = function(key, filters, callback) {
        var opts = {
            key: key,
            params: filters
        };
        _get.call(this, opts, function(data) {
            callback(null, data);
        }, function(xhr) {
            callback(new ProxyError(xhr), []);
        });
    }, CreateProxy.prototype.groupBy = function(key, filters, options, groups, callback) {
        this.query(key, filters, function(err, data) {
            if (err) return void callback(err);
            var results = data.groupBy(options, groups, {});
            callback(null, results);
        });
    }, CreateProxy.prototype.insert = function(key, records, callback) {
        function progress(record, index) {
            _save.call(self, "POST", key, record, function(xhr) {
                var created = JSON.parse(xhr.responseText);
                self.autoPK && created.id && (records.id = created.id), index === l - 1 && callback(null, xhr);
            }, error);
        }
        function error(xhr) {
            callback(new ProxyError(xhr));
        }
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) progress(records[i], i);
    }, CreateProxy.prototype.update = function(key, records, callback) {
        function progress(record, index) {
            _save.call(self, "PUT", key, record, function(xhr) {
                index === l - 1 && callback(null, xhr);
            }, error);
        }
        function error(xhr) {
            callback(new ProxyError(xhr));
        }
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) progress(records[i], i);
    }, CreateProxy.prototype.delete = function(key, records, callback) {
        function progress(record, index) {
            var url = baseurl + record.id;
            _httpRequest(url, "DELETE", config, function(xhr) {
                index === l - 1 && callback(null, xhr);
            }, error);
        }
        function error(xhr) {
            callback(new ProxyError(xhr));
        }
        var baseurl = this.config.url + "/" + key + "/", config = {}, l = records.length, i = 0;
        if (0 === l) return callback();
        for (this.config.headers && (config.headers = this.config.headers); i < l; i++) progress(records[i], i);
    }, CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        function updateFn(err) {
            return err ? cb(err) : void self.update(key, toUpdate, deleteFn);
        }
        function deleteFn(err) {
            return err ? cb(err) : void self.delete(key, toDelete, cb);
        }
        var self = this, total = toInsert.length + toUpdate.length + toDelete.length, cb = callback && "function" == typeof callback ? callback : function() {};
        return 0 === total ? cb() : void self.insert(key, toInsert, updateFn);
    }, CreateProxy;
}(this), DbSync = function(exports) {
    "use strict";
    function CreateSync() {}
    var Operations = {
        Insert: "inserted",
        Update: "updated",
        Delete: "deleted"
    };
    exports.DbSync = CreateSync;
    var _getTableName = function(table) {
        return [ "sync_", table ].join("");
    }, _getData = function(tableName) {
        var key = _getTableName(tableName), table = window.localStorage[key] || "{}";
        return JSON.parse(table, DbProxy.dateParser);
    }, _saveTable = function(tableName, values) {
        var key = _getTableName(tableName);
        window.localStorage[key] = JSON.stringify(values);
    }, _merge = function(arr1, arr2) {
        for (var result = new ArrayMap(), concated = arr1.concat(arr2), i = 0, l = concated.length; i < l; i++) result.indexOfKey("id", concated[i].id) < 0 && result.put(concated[i]);
        return result;
    };
    return CreateSync.prototype.writeData = function(key, toInsert, toUpdate, toDelete) {
        var values = _getData(key);
        values[Operations.Insert] = _merge(toInsert, values[Operations.Insert]), values[Operations.Update] = _merge(toUpdate, values[Operations.Update]), 
        values[Operations.Delete] = _merge(toDelete, values[Operations.Delete]), _saveTable(key, values);
    }, CreateSync.prototype.cleanData = function(key) {
        _saveTable(key, {});
    }, CreateSync.prototype.sendData = function(key, toInsert, toUpdate, toDelete, callback) {
        "function" == typeof callback && callback();
    }, CreateSync.prototype.getData = function(key, callback) {
        "function" == typeof callback && callback(null, [], []);
    }, CreateSync.prototype.exec = function(key, callback) {
        function done(err) {
            return err ? cb(err) : (self.cleanData(key), void self.getData(key, cb));
        }
        var self = this, values = _getData(key), cb = callback || function() {};
        self.sendData(key, values[Operations.Insert], values[Operations.Update], values[Operations.Delete], done);
    }, CreateSync;
}(this), DbFactory = function(exports) {
    "use strict";
    function CreateFactory(proxyType, opts, synchronizer) {
        var _proxy, _synchronizer = synchronizer;
        if (this.proxy = function() {
            return _proxy;
        }, this.synchronizer = function() {
            return _synchronizer;
        }, proxyType && "object" == typeof proxyType) return void (_proxy = proxyType);
        switch (proxyType) {
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
    exports.DbFactory = CreateFactory, CreateFactory.prototype.createDb = function(maps) {
        var defer = SimplePromise.defer();
        return this.proxy().createDatabase(maps, function(err) {
            return err ? void defer.reject(err) : void defer.resolve(!0);
        }), defer;
    }, CreateFactory.prototype.query = function(key, filters) {
        var defer = SimplePromise.defer();
        return this.proxy().query(key, filters, function(err, records) {
            return err ? void defer.reject(err) : void defer.resolve(records);
        }), defer;
    }, CreateFactory.prototype.groupBy = function(key, options, groups, filters) {
        var defer = SimplePromise.defer();
        return this.proxy().groupBy(key, options, groups, filters, function(err, records) {
            return err ? void defer.reject(err) : void defer.resolve(records);
        }), defer;
    }, CreateFactory.prototype.dataset = function(table) {
        return new DataSet(table, this.proxy(), this.synchronizer());
    };
    var _save = function(key, toInsert, toUpdate, toDelete) {
        var defer = SimplePromise.defer();
        return this.proxy().commit(key, toInsert, toUpdate, toDelete, function(err) {
            return err ? void defer.reject(err) : void defer.resolve(!0);
        }), defer;
    };
    return CreateFactory.prototype.insert = function(key, toInsert) {
        var elements = toInsert instanceof Array ? toInsert : [ toInsert ];
        return _save.call(this, key, elements, [], []);
    }, CreateFactory.prototype.update = function(key, toUpdate) {
        var elements = toUpdate instanceof Array ? toUpdate : [ toUpdate ];
        return _save.call(this, key, [], elements, []);
    }, CreateFactory.prototype.delete = function(key, toDelete) {
        var elements = toDelete instanceof Array ? toDelete : [ toDelete ];
        return _save.call(this, key, [], [], elements);
    }, CreateFactory;
}(this), ojsDb = DbFactory;