!function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = "function" == typeof require && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f;
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n || e);
            }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
    }
    for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) s(r[o]);
    return s;
}({
    1: [ function(require, module, exports) {
        "use strict";
        function noop() {}
        function getThen(obj) {
            try {
                return obj.then;
            } catch (ex) {
                return LAST_ERROR = ex, IS_ERROR;
            }
        }
        function tryCallOne(fn, a) {
            try {
                return fn(a);
            } catch (ex) {
                return LAST_ERROR = ex, IS_ERROR;
            }
        }
        function tryCallTwo(fn, a, b) {
            try {
                fn(a, b);
            } catch (ex) {
                return LAST_ERROR = ex, IS_ERROR;
            }
        }
        function Promise(fn) {
            if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
            if ("function" != typeof fn) throw new TypeError("not a function");
            this._37 = 0, this._12 = null, this._59 = [], fn !== noop && doResolve(fn, this);
        }
        function safeThen(self, onFulfilled, onRejected) {
            return new self.constructor(function(resolve, reject) {
                var res = new Promise(noop);
                res.then(resolve, reject), handle(self, new Handler(onFulfilled, onRejected, res));
            });
        }
        function handle(self, deferred) {
            for (;3 === self._37; ) self = self._12;
            if (0 === self._37) return void self._59.push(deferred);
            asap(function() {
                var cb = 1 === self._37 ? deferred.onFulfilled : deferred.onRejected;
                if (null === cb) return void (1 === self._37 ? resolve(deferred.promise, self._12) : reject(deferred.promise, self._12));
                var ret = tryCallOne(cb, self._12);
                ret === IS_ERROR ? reject(deferred.promise, LAST_ERROR) : resolve(deferred.promise, ret);
            });
        }
        function resolve(self, newValue) {
            if (newValue === self) return reject(self, new TypeError("A promise cannot be resolved with itself."));
            if (newValue && ("object" == typeof newValue || "function" == typeof newValue)) {
                var then = getThen(newValue);
                if (then === IS_ERROR) return reject(self, LAST_ERROR);
                if (then === self.then && newValue instanceof Promise) return self._37 = 3, self._12 = newValue, 
                void finale(self);
                if ("function" == typeof then) return void doResolve(then.bind(newValue), self);
            }
            self._37 = 1, self._12 = newValue, finale(self);
        }
        function reject(self, newValue) {
            self._37 = 2, self._12 = newValue, finale(self);
        }
        function finale(self) {
            for (var i = 0; i < self._59.length; i++) handle(self, self._59[i]);
            self._59 = null;
        }
        function Handler(onFulfilled, onRejected, promise) {
            this.onFulfilled = "function" == typeof onFulfilled ? onFulfilled : null, this.onRejected = "function" == typeof onRejected ? onRejected : null, 
            this.promise = promise;
        }
        function doResolve(fn, promise) {
            var done = !1, res = tryCallTwo(fn, function(value) {
                done || (done = !0, resolve(promise, value));
            }, function(reason) {
                done || (done = !0, reject(promise, reason));
            });
            done || res !== IS_ERROR || (done = !0, reject(promise, LAST_ERROR));
        }
        var asap = require("asap/raw"), LAST_ERROR = null, IS_ERROR = {};
        module.exports = Promise, Promise._99 = noop, Promise.prototype.then = function(onFulfilled, onRejected) {
            if (this.constructor !== Promise) return safeThen(this, onFulfilled, onRejected);
            var res = new Promise(noop);
            return handle(this, new Handler(onFulfilled, onRejected, res)), res;
        };
    }, {
        "asap/raw": 4
    } ],
    2: [ function(require, module, exports) {
        "use strict";
        function valuePromise(value) {
            var p = new Promise(Promise._99);
            return p._37 = 1, p._12 = value, p;
        }
        var Promise = require("./core.js");
        module.exports = Promise;
        var TRUE = valuePromise(!0), FALSE = valuePromise(!1), NULL = valuePromise(null), UNDEFINED = valuePromise(void 0), ZERO = valuePromise(0), EMPTYSTRING = valuePromise("");
        Promise.resolve = function(value) {
            if (value instanceof Promise) return value;
            if (null === value) return NULL;
            if (void 0 === value) return UNDEFINED;
            if (!0 === value) return TRUE;
            if (!1 === value) return FALSE;
            if (0 === value) return ZERO;
            if ("" === value) return EMPTYSTRING;
            if ("object" == typeof value || "function" == typeof value) try {
                var then = value.then;
                if ("function" == typeof then) return new Promise(then.bind(value));
            } catch (ex) {
                return new Promise(function(resolve, reject) {
                    reject(ex);
                });
            }
            return valuePromise(value);
        }, Promise.all = function(arr) {
            var args = Array.prototype.slice.call(arr);
            return new Promise(function(resolve, reject) {
                function res(i, val) {
                    if (val && ("object" == typeof val || "function" == typeof val)) {
                        if (val instanceof Promise && val.then === Promise.prototype.then) {
                            for (;3 === val._37; ) val = val._12;
                            return 1 === val._37 ? res(i, val._12) : (2 === val._37 && reject(val._12), void val.then(function(val) {
                                res(i, val);
                            }, reject));
                        }
                        var then = val.then;
                        if ("function" == typeof then) {
                            return void new Promise(then.bind(val)).then(function(val) {
                                res(i, val);
                            }, reject);
                        }
                    }
                    args[i] = val, 0 == --remaining && resolve(args);
                }
                if (0 === args.length) return resolve([]);
                for (var remaining = args.length, i = 0; i < args.length; i++) res(i, args[i]);
            });
        }, Promise.reject = function(value) {
            return new Promise(function(resolve, reject) {
                reject(value);
            });
        }, Promise.race = function(values) {
            return new Promise(function(resolve, reject) {
                values.forEach(function(value) {
                    Promise.resolve(value).then(resolve, reject);
                });
            });
        }, Promise.prototype.catch = function(onRejected) {
            return this.then(null, onRejected);
        };
    }, {
        "./core.js": 1
    } ],
    3: [ function(require, module, exports) {
        "use strict";
        function throwFirstError() {
            if (pendingErrors.length) throw pendingErrors.shift();
        }
        function asap(task) {
            var rawTask;
            rawTask = freeTasks.length ? freeTasks.pop() : new RawTask(), rawTask.task = task, 
            rawAsap(rawTask);
        }
        function RawTask() {
            this.task = null;
        }
        var rawAsap = require("./raw"), freeTasks = [], pendingErrors = [], requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);
        module.exports = asap, RawTask.prototype.call = function() {
            try {
                this.task.call();
            } catch (error) {
                asap.onerror ? asap.onerror(error) : (pendingErrors.push(error), requestErrorThrow());
            } finally {
                this.task = null, freeTasks[freeTasks.length] = this;
            }
        };
    }, {
        "./raw": 4
    } ],
    4: [ function(require, module, exports) {
        (function(global) {
            "use strict";
            function rawAsap(task) {
                queue.length || (requestFlush(), flushing = !0), queue[queue.length] = task;
            }
            function flush() {
                for (;index < queue.length; ) {
                    var currentIndex = index;
                    if (index += 1, queue[currentIndex].call(), index > capacity) {
                        for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) queue[scan] = queue[scan + index];
                        queue.length -= index, index = 0;
                    }
                }
                queue.length = 0, index = 0, flushing = !1;
            }
            function makeRequestCallFromTimer(callback) {
                return function() {
                    function handleTimer() {
                        clearTimeout(timeoutHandle), clearInterval(intervalHandle), callback();
                    }
                    var timeoutHandle = setTimeout(handleTimer, 0), intervalHandle = setInterval(handleTimer, 50);
                };
            }
            module.exports = rawAsap;
            var requestFlush, queue = [], flushing = !1, index = 0, capacity = 1024, BrowserMutationObserver = global.MutationObserver || global.WebKitMutationObserver;
            requestFlush = "function" == typeof BrowserMutationObserver ? function(callback) {
                var toggle = 1, observer = new BrowserMutationObserver(callback), node = document.createTextNode("");
                return observer.observe(node, {
                    characterData: !0
                }), function() {
                    toggle = -toggle, node.data = toggle;
                };
            }(flush) : makeRequestCallFromTimer(flush), rawAsap.requestFlush = requestFlush, 
            rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
    }, {} ],
    5: [ function(require, module, exports) {
        "function" != typeof Promise.prototype.done && (Promise.prototype.done = function(onFulfilled, onRejected) {
            (arguments.length ? this.then.apply(this, arguments) : this).then(null, function(err) {
                setTimeout(function() {
                    throw err;
                }, 0);
            });
        });
    }, {} ],
    6: [ function(require, module, exports) {
        require("asap");
        "undefined" == typeof Promise && (Promise = require("./lib/core.js"), require("./lib/es6-extensions.js")), 
        require("./polyfill-done.js");
    }, {
        "./lib/core.js": 1,
        "./lib/es6-extensions.js": 2,
        "./polyfill-done.js": 5,
        asap: 3
    } ]
}, {}, [ 6 ]);

var ArrayMap = function() {
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
            this[index || this.length] = obj;
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
                        matched = -1 !== str.indexOf(opts[field][prop], str.length - opts[field][prop].length);
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
    return Collection.prototype = Object.create(Array.prototype), Collection;
}();

"object" == typeof module && module.exports && (module.exports.ArrayMap = ArrayMap);

var OjsUtils = function() {
    "use strict";
    var randomBytes = function(size) {
        for (var r, bytes = new Array(size), i = 0; i < size; i++) 0 == (3 & i) && (r = 4294967296 * Math.random()), 
        bytes[i] = r >>> ((3 & i) << 3) & 255;
        return bytes;
    }, byteArrayToBase64 = function(uint8) {
        var temp, length, i, lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", extraBytes = uint8.length % 3, output = "";
        for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2], 
        output += function(num) {
            return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[63 & num];
        }(temp);
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
    return {
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
    };
}();

"object" == typeof module && module.exports && (module.exports.OjsUtils = OjsUtils);

var ChildRecord = function() {
    "use strict";
    function CreateRecord(record) {
        this.master = function() {
            return record;
        };
    }
    return CreateRecord;
}();

"object" == typeof module && module.exports && (module.exports.ChildRecord = ChildRecord);

var EventEmitter = function() {
    "use strict";
    function CreateEmitter() {
        var _topics = {};
        this.topics = function() {
            return _topics;
        };
    }
    return CreateEmitter.prototype.on = function(topic, listener) {
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
}();

"object" == typeof module && module.exports && (module.exports.EventEmitter = EventEmitter);

var DbEvents = function() {
    return new EventEmitter();
}();

"object" == typeof module && module.exports && (module.exports.DbEvents = DbEvents);

var SimpleDataSet = function() {
    "use strict";
    function CreateDataSet(table) {
        EventEmitter.apply(this);
        var _table = table || "tableName";
        this._history = [], this._data = new ArrayMap(), this.table = function() {
            return _table;
        };
    }
    CreateDataSet.prototype = Object.create(EventEmitter.prototype), CreateDataSet.prototype._cleanCache = function() {
        this._history.length = 0;
    }, CreateDataSet.prototype.get = function(id) {
        var index = this._data.indexOfKey("id", id);
        return this.item(index);
    };
    var _beforeChange = function(change) {
        var idx;
        if (this._history.some(function(item, index) {
            return idx = index, item.op === change.op && item.record.id === change.record.id;
        })) return void this._history.splice(idx, 1, change);
        this._history.push(change);
    }, _afterChange = function(change) {
        if (this.emit(this.table(), {
            event: change.op,
            data: change.record
        }), change.record instanceof ChildRecord) {
            var table = [ this.table(), ".child" ].join("");
            DbEvents.emit(table, {
                event: change.op,
                data: change.record
            });
        }
    };
    return CreateDataSet.prototype.insert = function(record) {
        record.id || (record.id = OjsUtils.newId());
        var change, index = this._data.indexOfKey("id", record.id);
        return -1 === index && (change = {
            op: "insert",
            record: OjsUtils.cloneObject(record)
        }, _beforeChange.call(this, change), this._data.push(record), _afterChange.call(this, change)), 
        this;
    }, CreateDataSet.prototype.update = function(record) {
        if (!record.id) return this;
        var change, index = this._data.indexOfKey("id", record.id);
        return -1 === index ? this : (change = {
            op: "update",
            record: OjsUtils.cloneObject(record)
        }, _beforeChange.call(this, change), this._data.splice(index, 1, record), _afterChange.call(this, change), 
        this);
    }, CreateDataSet.prototype.save = function(record) {
        return record ? record.id && this.get(record.id) ? this.update(record) : this.insert(record) : this;
    }, CreateDataSet.prototype.delete = function(record) {
        if (!record || !record.id) return this;
        var change, index = this._data.indexOfKey("id", record.id);
        return index >= 0 && (change = {
            op: "delete",
            record: OjsUtils.cloneObject(record)
        }, _beforeChange.call(this, change), this._data.splice(index, 1), _afterChange.call(this, change)), 
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
        if (!this._history.length) return this;
        for (var item, index, i = this._history.length - 1; i >= 0; i--) switch (item = this._history[i], 
        index = this._data.indexOfKey("id", item.record.id), item.op) {
          case "insert":
            this._data.splice(index, 1);
            break;

          case "update":
            this._data.splice(index, 1, item.record);
            break;

          case "delete":
            this._data.push(item.record);
        }
        return this.emit(this.table(), {
            event: "cancel",
            data: this._history
        }), this._history.length = 0, this;
    }, CreateDataSet.prototype.data = function() {
        return this._data.slice();
    }, CreateDataSet.prototype.count = function() {
        return this._data.length;
    }, CreateDataSet.prototype.item = function(index) {
        var record = this._data[index];
        return OjsUtils.cloneObject(record);
    }, CreateDataSet.prototype.filter = function(options) {
        return this._data.query(options);
    }, CreateDataSet.prototype.forEach = function(fn) {
        this._data.forEach(fn);
    }, CreateDataSet.prototype.subscribe = function(fn) {
        return this.on(this.table(), fn);
    }, CreateDataSet.prototype.unsubscribe = function(subscription) {
        return subscription && "function" == typeof subscription.remove && subscription.remove(), 
        this;
    }, CreateDataSet;
}();

"object" == typeof module && module.exports && (module.exports.SimpleDataSet = SimpleDataSet);

var DataSet = function() {
    "use strict";
    function CreateDataSet(table, proxy, synchronizer) {
        SimpleDataSet.apply(this, [ table ]), _pages[table] = 0, this._opts = {}, this._eof = !0, 
        this._active = !1;
        var childTable = [ table, ".child" ].join(""), self = this;
        DbEvents.on(table, function(args) {
            if ("key" === args.event) {
                var index = self._data.indexOfKey("id", args.data.oldId);
                self._data[index].id = args.data.newId;
            }
        }), DbEvents.on(childTable, function(args) {
            self.save(args.data.master());
        }), this.proxy = function() {
            return proxy;
        }, this.synchronizer = function() {
            return synchronizer;
        };
    }
    var _pages = {};
    CreateDataSet.prototype = Object.create(SimpleDataSet.prototype), CreateDataSet.prototype.sort = function(order) {
        return this._opts.sort = order, this;
    }, CreateDataSet.prototype.limit = function(value) {
        return this._opts.limit = value, this;
    }, CreateDataSet.prototype.where = function(params) {
        return this._opts.params = params, this;
    };
    var _getRecords = function(opts, callback) {
        var self = this, cb = callback && "function" == typeof callback ? callback : function() {};
        self.proxy().getRecords(opts, function(err, records) {
            self._data.putRange(records, !0), self._active = !err, self._eof = records && records.length < (self._opts.limit || 30), 
            cb(err, records);
        });
    };
    CreateDataSet.prototype.open = function() {
        var opts = {
            key: this.table()
        }, self = this;
        return new Promise(function(resolve, reject) {
            OjsUtils.cloneProperties(self._opts, opts), _getRecords.call(self, opts, function(err, records) {
                if (err) return void reject(err);
                resolve(records);
            });
        });
    }, CreateDataSet.prototype.next = function() {
        if (!this._active) throw "Invalid operation on closed dataset";
        this._opts.limit && !isNaN(this._opts.limit) || (this._opts.limit = 30), _pages[this.table()] = ++_pages[this.table()];
        var self = this, skip = _pages[self.table()] * self._opts.limit, opts = {
            key: self.table(),
            skip: skip
        };
        return new Promise(function(resolve, reject) {
            if (self.eof()) return void resolve(self.data());
            OjsUtils.cloneProperties(self._opts, opts), _getRecords.call(self, opts, function(err, results) {
                if (err) return void reject(err);
                resolve(results);
            });
        });
    }, CreateDataSet.prototype.close = function() {
        return SimpleDataSet.prototype.clear.apply(this, arguments), _pages[this.table()] = 0, 
        this._active = !1, this;
    }, CreateDataSet.prototype.clear = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            function done(err) {
                if (err) return void reject(err);
                _pages[self.table()] = 0, SimpleDataSet.prototype.clear.apply(self, arguments), 
                resolve();
            }
            self.proxy().clear(self.table(), done);
        });
    }, CreateDataSet.prototype.refresh = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self._opts.sort && self._data.orderBy(self._opts.sort), resolve();
        });
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
        if (!this._active) throw "Invalid operation on closed dataset";
        var toInsert, toUpdate, toDelete, self = this, sync = this.synchronizer();
        return new Promise(function(resolve, reject) {
            function done(err) {
                if (err) return self.cancel(), void reject(err);
                sync && !ignoreSync && sync.writeData(self.table(), toInsert, toUpdate, toDelete), 
                self.refresh().then(resolve, reject), self._cleanCache();
            }
            if (!self._history.length) return void resolve();
            toInsert = _filterOp(self._history, "insert"), toUpdate = _filterOp(self._history, "update"), 
            toDelete = _filterOp(self._history, "delete"), self.proxy().commit(self.table(), toInsert, toUpdate, toDelete, done);
        });
    }, CreateDataSet.prototype.sync = function() {
        var self = this, sync = this.synchronizer();
        return new Promise(function(resolve, reject) {
            if (!sync) return void resolve();
            sync.exec(self.table(), function(err, allData, toDelete) {
                function deleteDiff(item) {
                    serverData.indexOfKey("id", item.id) < 0 && self.delete(item);
                }
                function deleteFix(item) {
                    toDeleteMap.indexOf(item.id) > -1 && self.delete(item);
                }
                if (err) return void reject(err);
                if (allData = allData || [], toDelete = toDelete || [], !allData.length && !toDelete.length) return void resolve([]);
                var deleteFn, serverData = new ArrayMap(), localData = new ArrayMap(), toDeleteMap = toDelete.map(function(item) {
                    return item.id;
                });
                serverData.putRange(allData), localData.putRange(self.data()), deleteFn = toDelete && toDelete instanceof Array ? deleteFix : deleteDiff, 
                localData.forEach(deleteFn), serverData.forEach(function(item) {
                    self.save(item);
                }), self.post(!0).then(function() {
                    resolve(allData);
                }, function(err) {
                    reject(err);
                });
            });
        });
    }, CreateDataSet.prototype.fetch = function(property) {
        if (!this._active) throw "Invalid operation on closed dataset";
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!self.count()) return void resolve();
            self.proxy().fetch(self.table(), self, property, function(err) {
                if (err) return void reject(err);
                resolve();
            });
        });
    }, CreateDataSet.prototype.eof = function() {
        return this._eof;
    }, CreateDataSet.prototype.active = function() {
        return this._active;
    }, CreateDataSet;
}();

"object" == typeof module && module.exports && (module.exports.DataSet = DataSet);

var DbProxies = function() {
    return {
        LOCALSTORAGE: 0,
        SQLITE: 1,
        RESTFUL: 2,
        INDEXEDDB: 3,
        WEBSOCKET: 4
    };
}();

"object" == typeof module && module.exports && (module.exports.DbProxies = DbProxies);

var DbProxy = function() {
    "use strict";
    function CreateProxy() {}
    return CreateProxy.prototype.createDatabase = function(maps, callback) {
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
        var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
        return "string" == typeof value && reISO.exec(value) ? new Date(value) : value;
    }, CreateProxy;
}();

"object" == typeof module && module.exports && (module.exports.DbProxy = DbProxy);

var LocalStorageProxy = function() {
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
    CreateProxy.prototype = Object.create(DbProxy.prototype), CreateProxy.prototype.getRecords = function(options, callback) {
        var table = _get(options);
        options.sort && table.orderBy(options.sort), "function" == typeof callback && callback(null, table);
    }, CreateProxy.prototype.query = function(key, filters, callback) {
        callback(null, _get(key).query(filters));
    }, CreateProxy.prototype.groupBy = function(key, options, groups, filters, callback) {
        callback(null, _get(key).groupBy(options, groups, filters));
    };
    var _save = function(table, record) {
        var index = table.indexOfKey("id", record.id);
        -1 === index ? table.push(record) : table.splice(index, 1, record);
    }, _remove = function(table, record) {
        var id = "object" == typeof record ? record.id : record, index = table.indexOfKey("id", id);
        table.splice(index, 1);
    };
    return CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        var i, toSave = toInsert.concat(toUpdate), total = toSave.length + toDelete.length, table = _get(key), cb = callback && "function" == typeof callback ? callback : function() {};
        if (0 === total) return cb();
        for (i = 0; i < toSave.length; i++) _save.call(this, table, toSave[i]);
        for (i = 0; i < toDelete.length; i++) _remove.call(this, table, toDelete[i]);
        _saveAll(key, table, cb);
    }, CreateProxy.prototype.clear = function(key, callback) {
        _saveAll(key, [], callback);
    }, CreateProxy;
}();

"object" == typeof module && module.exports && (module.exports.LocalStorageProxy = LocalStorageProxy);

var SQLiteProxy = function() {
    "use strict";
    function CreateProxy(opts) {
        function init() {
            db = window.sqlitePlugin ? window.sqlitePlugin.openDatabase(opts) : window.openDatabase(opts.name, "SQLite Database", opts.version || "1.0", 5242880);
        }
        var db = null;
        opts.schema && (_maps = opts.schema), void 0 !== window.cordova ? document.addEventListener("deviceready", init) : init(), 
        this.getDb = function() {
            return db;
        }, DbProxy.apply(this, arguments);
    }
    var _maps = {};
    CreateProxy.prototype = Object.create(DbProxy.prototype), CreateProxy.prototype.createDatabase = function(callback) {
        var self = this, cb = callback && "function" == typeof callback ? callback : function() {};
        self.getDb().transaction(function(tx) {
            function progress() {
                0 === --total && cb();
            }
            var fields, field, table, prop, sql, total = Object.keys(_maps).length;
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
            if (sql = [ "SELECT * FROM", options.key ], options.params) {
                for (p in options.params) where += p + " = '" + options.params[p] + "'";
                sql.push(where);
            }
            sql.push(sortBy), options.skip && sql.push("OFFSET " + options.skip), options.limit && sql.push("LIMIT " + options.limit);
        } else sql = [ "SELECT * FROM", options ];
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
        }), "" === sql ? [ "SELECT * FROM", key ].join(" ") : (sql = sql.trim().slice(0, -1), 
        sql = [ "SELECT", groupBy, sql, "FROM", key, where ].join(" "), "" === groupBy ? sql : sql + " GROUP BY " + groupBy.trim().slice(0, -1));
    };
    CreateProxy.prototype.query = function(key, filters, callback) {
        var self = this, opts = filters && "object" == typeof filters ? filters : {}, select = [ "SELECT * FROM", key ].join(" "), sql = filters && "function" == typeof filters ? filters() : _formatSql(select, opts);
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
            for (prop in record) (fdmap = _maps[key][prop]) && fdmap.hasMany && (items = record[prop]) instanceof SimpleDataSet && (total++, 
            inserteds.putRange(items._inserteds), updateds.putRange(items._updateds), deleteds.putRange(items._deleteds), 
            items._cleanCache(), self.insert(fdmap.hasMany, inserteds, transaction, updateFn));
            done();
        }
        function done() {
            0 === --total && callback();
        }
        var self = this, total = 1;
        operationFn(key, record, transaction, saveChildren);
    }, _getInsertSql = function(key, record) {
        var prop, sql, value, fdmap, params = [], fields = "", values = "";
        for (prop in _maps[key]) (fdmap = _maps[key][prop]) && !fdmap.hasMany && void 0 !== (value = _formatValue(key, prop, record)) && (params.push(value), 
        fields += prop + ",", values += "?,");
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
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) !function(record, index) {
            _save.call(self, key, record, transaction, _insert, function() {
                index === l - 1 && callback();
            });
        }(records[i], i);
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
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) !function(record, index) {
            _save.call(self, key, record, transaction, _update, function() {
                index === l - 1 && callback();
            });
        }(records[i], i);
    };
    var _delete = function(key, record, transaction, callback) {
        function progress() {
            0 === --total && (sql = [ "DELETE FROM ", key, " WHERE id = '", id, "'" ].join(""), 
            transaction.executeSql(sql, [], function() {
                callback();
            }));
        }
        var sql, prop, fdmap, id = "object" == typeof record ? record.id : record, total = 1;
        for (prop in record) (fdmap = _maps[key][prop]) && fdmap.hasMany && (total++, sql = [ "DELETE FROM ", fdmap.hasMany, " WHERE ", fdmap.foreignKey, " = '", id, "'" ].join(""), 
        transaction.executeSql(sql, [], progress), record[prop] instanceof SimpleDataSet && record[prop].clear());
        progress();
    };
    CreateProxy.prototype.delete = function(key, records, transaction, callback) {
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) !function(record, index) {
            _delete.call(self, key, record, transaction, function() {
                index === l - 1 && callback();
            });
        }(records[i], i);
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
        if (!toInsert.length && !toUpdate.length && !toDelete.length) return cb();
        self.getDb().transaction(beginTransaction, function(err) {
            console.error(err.message), cb(err);
        });
    };
    var _fetch = function(key, record, property, callback) {
        var i, l, child, opts = {
            params: {}
        }, fdmap = _maps[key][property];
        if (record[property] instanceof SimpleDataSet || !fdmap || !fdmap.hasMany) return callback();
        opts.key = fdmap.hasMany, opts.params[fdmap.foreignKey] = record.id, this.getRecords(opts, function(err, results) {
            if (err) return callback(err);
            for (record[property] = new SimpleDataSet(key), i = 0, l = results.length; i < l; i++) child = new ChildRecord(record), 
            OjsUtils.cloneProperties(results[i], child), record[property].data.push(child);
            callback();
        });
    };
    return CreateProxy.prototype.fetch = function(key, dataset, property, callback) {
        var cb = "function" == typeof callback ? callback : function() {}, total = dataset.data.length, self = this, i = 0;
        if (0 === total) return cb();
        for (;i < total; i++) !function(record, index) {
            _fetch.call(self, key, record, property, function(err) {
                index === total - 1 && cb(err);
            });
        }(dataset.data[i], i);
    }, CreateProxy.prototype.clear = function(key, callback) {
        function beginTransaction(transaction) {
            function progress() {
                0 === --total && transaction.executeSql("DELETE FROM " + key, [], function() {
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
}();

"object" == typeof module && module.exports && (module.exports.SQLiteProxy = SQLiteProxy);

var RestProxy = function() {
    "use strict";
    function CreateProxy(config) {
        this.config = config, config && config.autoPK && (this.autoPK = !0), config.serializeFn && "function" == typeof config.serializeFn ? this.serialize = config.serializeFn : this.serialize = _defSerialize, 
        DbProxy.apply(this, arguments);
    }
    var _defSerialize = function(obj) {
        return JSON.stringify(obj);
    }, _getHeader = function(obj) {
        return "function" == typeof obj ? obj() : obj;
    }, _httpRequest = function(url, method, config, success, error) {
        var callback, prop, params, http = new XMLHttpRequest();
        if (http.open(method, url, !0), http.onreadystatechange = function() {
            4 === http.readyState && (callback = [ 200, 201, 204, 304 ].indexOf(http.status) > -1 ? success : error)(http);
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
        var url = this.config.url + "/" + key, id = record.id, config = {};
        "POST" === method && this.autoPK && delete record.id, "PUT" === method && (url += "/" + record.id), 
        config.data = this.serialize(record), record.id = id, this.config.headers && (config.headers = this.config.headers), 
        _httpRequest(url, method, config, success, error);
    }, _proxyError = function(xhr) {
        var res;
        try {
            res = JSON.parse(xhr.responseText);
        } catch (e) {
            res = {
                message: xhr.responseText
            };
        }
        return res;
    };
    return CreateProxy.prototype = Object.create(DbProxy.prototype), CreateProxy.prototype.getRecords = function(options, callback) {
        _get.call(this, options, function(data) {
            callback(null, data);
        }, function(xhr) {
            callback(_proxyError(xhr), []);
        });
    }, CreateProxy.prototype.query = function(key, filters, callback) {
        _get.call(this, {
            key: key,
            params: filters
        }, function(data) {
            callback(null, data);
        }, function(xhr) {
            callback(_proxyError(xhr), []);
        });
    }, CreateProxy.prototype.groupBy = function(key, filters, options, groups, callback) {
        this.query(key, filters, function(err, data) {
            if (err) return void callback(err);
            var results = data.groupBy(options, groups, {});
            callback(null, results);
        });
    }, CreateProxy.prototype.insert = function(key, records, callback) {
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) !function(record, index) {
            _save.call(self, "POST", key, record, function(xhr) {
                var created = JSON.parse(xhr.responseText);
                self.autoPK && created.id && DbEvents.emit(key, {
                    event: "key",
                    data: {
                        oldId: record.id,
                        newId: created.id
                    }
                }), index === l - 1 && callback(null, xhr);
            }, function(xhr) {
                callback(_proxyError(xhr));
            });
        }(records[i], i);
    }, CreateProxy.prototype.update = function(key, records, callback) {
        var self = this, l = records.length, i = 0;
        if (0 === l) return callback();
        for (;i < l; i++) !function(record, index) {
            _save.call(self, "PUT", key, record, function(xhr) {
                index === l - 1 && callback(null, xhr);
            }, function(xhr) {
                callback(_proxyError(xhr));
            });
        }(records[i], i);
    }, CreateProxy.prototype.delete = function(key, records, callback) {
        var baseurl = this.config.url + "/" + key + "/", config = {}, l = records.length, i = 0;
        if (0 === l) return callback();
        for (this.config.headers && (config.headers = this.config.headers); i < l; i++) !function(record, index) {
            var url = baseurl + record.id;
            _httpRequest(url, "DELETE", config, function(xhr) {
                index === l - 1 && callback(null, xhr);
            }, function(xhr) {
                callback(_proxyError(xhr));
            });
        }(records[i], i);
    }, CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        function updateFn(err) {
            if (err) return cb(err);
            self.update(key, toUpdate, deleteFn);
        }
        function deleteFn(err) {
            if (err) return cb(err);
            self.delete(key, toDelete, cb);
        }
        var self = this, total = toInsert.length + toUpdate.length + toDelete.length, cb = callback && "function" == typeof callback ? callback : function() {};
        if (0 === total) return cb();
        self.insert(key, toInsert, updateFn);
    }, CreateProxy;
}();

"object" == typeof module && module.exports && (module.exports.RestProxy = RestProxy);

var IndexedDbProxy = function() {
    "use strict";
    function CreateProxy(config) {
        _config = config, window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB, 
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction, 
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange, 
        DbProxy.apply(this, arguments);
    }
    var _config, _db = null;
    CreateProxy.prototype = Object.create(DbProxy.prototype), CreateProxy.prototype.createDatabase = function(callback) {
        var request = window.indexedDB.open(_config.name, _config.version), cb = callback;
        request.onerror = function(e) {
            cb(e.target);
        }, request.onsuccess = function(e) {
            _db = request.result, cb();
        }, request.onupgradeneeded = function(e) {
            var table, prop, field, db = e.target.result, schema = _config.schema;
            for (table in schema) {
                var store = db.createObjectStore(table, {
                    keyPath: "id"
                });
                for (prop in schema[table]) field = schema[table][prop], store.createIndex(prop, prop, {
                    unique: !!field.unique
                });
            }
        };
    }, CreateProxy.prototype.getRecords = function(options, callback) {
        var store = _db.transaction([ options.key ]).objectStore(options.key), request = store.openCursor(), opt = options, cb = callback;
        request.onsuccess = function(e) {
            var cursor = e.target.result, result = new ArrayMap();
            if (cursor) return result.put(cursor.value), void cursor.continue();
            opt.sort && result.orderBy(opt.sort), cb(null, result);
        }, request.onerror = function(e) {
            cb(e.target);
        };
    }, CreateProxy.prototype.query = function(key, filters, callback) {
        var opts = {
            key: key
        }, cb = callback;
        this.getRecords(opts, function(err, records) {
            if (err) return void cb(err);
            cb(null, records.query(filters));
        });
    }, CreateProxy.prototype.groupBy = function(key, options, groups, filters, callback) {
        var opts = {
            key: key
        }, cb = callback;
        this.getRecords(opts, function(err, records) {
            if (err) return void cb(err);
            cb(null, records.groupBy(options, groups, filters));
        });
    };
    var _save = function(key, records, callback, operationFn) {
        var transaction = _db.transaction([ key ], "readwrite"), store = transaction.objectStore(key), cb = callback;
        records.foreach(function(item) {
            operationFn(store, item);
        }), transaction.onsuccess = function(e) {
            cb();
        }, transaction.onerror = function(e) {
            cb(e.target);
        };
    };
    return CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        function updateFn(err) {
            if (err) return cb(err);
            _save.call(self, key, toUpdate, deleteFn, function(store, item) {
                store.put(item);
            });
        }
        function deleteFn(err) {
            if (err) return cb(err);
            _save.call(self, key, toDelete, cb, function(store, item) {
                store.delete(item.id);
            });
        }
        var self = this, total = toInsert.length + toUpdate.length + toDelete.length, cb = callback && "function" == typeof callback ? callback : function() {};
        if (0 === total) return cb();
        _save.call(self, key, toInsert, updateFn, function(store, item) {
            store.add(item);
        });
    }, CreateProxy.prototype.clear = function(key, callback) {
        var request, store = _db.transaction([ key ], "readwrite").objectStore(key), cb = callback;
        request = store.clear(), request.onsuccess = function(e) {
            cb();
        }, request.onerror = function(e) {
            cb(e.target);
        };
    }, CreateProxy;
}();

"object" == typeof module && module.exports && (module.exports.IndexedDbProxy = IndexedDbProxy);

var WebSocketProxy = function() {
    "use strict";
    function CreateProxy(config) {
        this.config = config, this.connected = !1, _socket = new WebSocket(config.url), 
        _socket.onopen = _onOpen.bind(this), _socket.onclose = _onClose.bind(this), _socket.onmessage = _onMessage.bind(this), 
        _socket.onerror = _onError.bind(this), DbProxy.apply(this, arguments);
    }
    var _socket, _stack = new ArrayMap(), _onOpen = function() {
        this.connected = !0;
    }, _onClose = function() {
        this.connected = !1;
    }, _onError = function(e) {
        var err = e ? JSON.stringify(e) : {
            message: "Socket Error"
        };
        throw JSON.stringify(err);
    }, _onMessage = function(e) {
        var message = JSON.parse(e, DbProxy.dateParser), key = message.event + message.model;
        _dispatch(key, message.data);
    }, _sendMessage = function(message, callback) {
        var key = message.event + message.model;
        _stack.put({
            key: key,
            callback: callback
        }), _socket.send(JSON.stringify(message));
    }, _dispatch = function(key, data) {
        var index = _stack.indexOfKey("key", key);
        _stack[index].callback(null, data), _stack.splice(index, 1);
    };
    return CreateProxy.prototype = Object.create(DbProxy.prototype), CreateProxy.prototype.getRecords = function(options, callback) {
        if (!this.connected) throw "Socket is not connected";
        var message, opt = Object.assign({}, options);
        delete opt.key, message = {
            event: "READ",
            model: options.key,
            data: opt
        }, _sendMessage(message, callback);
    }, CreateProxy.prototype.query = function(key, filters, callback) {
        if (!this.connected) throw "Socket is not connected";
        _sendMessage({
            event: "READ",
            model: key,
            data: filters
        }, callback);
    }, CreateProxy.prototype.groupBy = function(key, filters, options, groups, callback) {
        this.query(key, filters, function(err, data) {
            if (err) return void callback(err);
            var results = data.groupBy(options, groups, {});
            callback(null, results);
        });
    }, CreateProxy.prototype.insert = function(key, records, callback) {
        if (!this.connected) throw "Socket is not connected";
        _sendMessage({
            event: "CREATE",
            model: key,
            data: records
        }, callback);
    }, CreateProxy.prototype.update = function(key, records, callback) {
        if (!this.connected) throw "Socket is not connected";
        _sendMessage({
            event: "UPDATE",
            model: key,
            data: records
        }, callback);
    }, CreateProxy.prototype.delete = function(key, records, callback) {
        if (!this.connected) throw "Socket is not connected";
        _sendMessage({
            event: "DELETE",
            model: key,
            data: records
        }, callback);
    }, CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        function updateFn(err) {
            if (err) return cb(err);
            self.update(key, toUpdate, deleteFn);
        }
        function deleteFn(err) {
            if (err) return cb(err);
            self.delete(key, toDelete, cb);
        }
        var self = this, total = toInsert.length + toUpdate.length + toDelete.length, cb = callback && "function" == typeof callback ? callback : function() {};
        if (0 === total) return cb();
        self.insert(key, toInsert, updateFn);
    }, CreateProxy;
}();

"object" == typeof module && module.exports && (module.exports.WebSocketProxy = WebSocketProxy);

var DbSync = function() {
    "use strict";
    function CreateSync() {}
    var Operations = {
        Insert: "inserted",
        Update: "updated",
        Delete: "deleted"
    }, _getTableName = function(table) {
        return [ "sync_", table ].join("");
    }, _getData = function(tableName) {
        var key = _getTableName(tableName), table = window.localStorage[key] || "{}";
        return JSON.parse(table, DbProxy.dateParser);
    }, _saveTable = function(tableName, values) {
        var key = _getTableName(tableName);
        window.localStorage[key] = JSON.stringify(values);
    }, _merge = function(arr1, arr2) {
        for (var result = new ArrayMap(), concated = arr1.concat(arr2 || []), i = 0, l = concated.length; i < l; i++) result.indexOfKey("id", concated[i].id) < 0 && result.put(concated[i]);
        return result;
    };
    return CreateSync.prototype.writeData = function(key, toInsert, toUpdate, toDelete) {
        var values = _getData(key);
        toInsert.length && (values[Operations.Insert] = _merge(toInsert, values[Operations.Insert])), 
        toUpdate.length && (values[Operations.Update] = _merge(toUpdate, values[Operations.Update])), 
        toDelete.length && (values[Operations.Delete] = _merge(toDelete, values[Operations.Delete])), 
        _saveTable(key, values);
    }, CreateSync.prototype.cleanData = function(key) {
        _saveTable(key, {});
    }, CreateSync.prototype.sendData = function(key, toInsert, toUpdate, toDelete, callback) {
        "function" == typeof callback && callback();
    }, CreateSync.prototype.getData = function(key, callback) {
        "function" == typeof callback && callback(null, [], []);
    }, CreateSync.prototype.exec = function(key, callback) {
        function done(err) {
            if (err) return cb(err);
            self.cleanData(key), self.getData(key, cb);
        }
        var self = this, values = _getData(key), cb = callback || function() {};
        self.sendData(key, values[Operations.Insert] || [], values[Operations.Update] || [], values[Operations.Delete] || [], done);
    }, CreateSync;
}();

"object" == typeof module && module.exports && (module.exports.DbSync = DbSync);

/**
 * @license
 * Copyright (c) 2016 Alan Thales.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var DbFactory = function() {
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

          case 3:
            _proxy = new IndexedDbProxy(opts);
            break;

          case 4:
            _proxy = new WebSocketProxy(opts);
            break;

          default:
            throw "Proxy not implemented";
        }
    }
    CreateFactory.prototype.createDb = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.proxy().createDatabase(function(err) {
                if (err) return void reject(err);
                resolve();
            });
        });
    }, CreateFactory.prototype.query = function(key, filters) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.proxy().query(key, filters, function(err, records) {
                if (err) return void reject(err);
                resolve(records);
            });
        });
    }, CreateFactory.prototype.groupBy = function(key, options, groups, filters) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.proxy().groupBy(key, options, groups, filters, function(err, records) {
                if (err) return void reject(err);
                resolve(records);
            });
        });
    }, CreateFactory.prototype.dataset = function(table) {
        return new DataSet(table, this.proxy(), this.synchronizer());
    };
    var _save = function(key, toInsert, toUpdate, toDelete) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.proxy().commit(key, toInsert, toUpdate, toDelete, function(err) {
                if (err) return void reject(err);
                resolve();
            });
        });
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
}(), ojsDb = DbFactory;

"object" == typeof module && module.exports && (module.exports.DbFactory = DbFactory);