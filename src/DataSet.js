/*
	DataSet Class
	Alan Thales, 09/2015
	Requires: SimpleDataSet.js, DbEvents.js
*/
var DataSet = (function() {
  "use strict";

  var _pages = {};

  function CreateDataSet(table, proxy, synchronizer) {
    SimpleDataSet.apply(this, [table]);

    _pages[table] = 0;

    this._opts = {};
    this._eof = true;
    this._active = false;
    // this._reOpenOnRefresh = false;

    var childTable = [table, ".child"].join(""),
      self = this;

    DbEvents.on(table, function(args) {
      if (args.event === "key") {
        var index = self._data.indexOfKey("id", args.data.oldId),
          record = self._data[index];
        record.id = args.data.newId;
      }
    });

    DbEvents.on(childTable, function(args) {
      self.save(args.data.master());
    });

    this.proxy = function() {
      return proxy;
    };

    this.synchronizer = function() {
      return synchronizer;
    };
  }

  CreateDataSet.prototype = Object.create(SimpleDataSet.prototype);

  // CreateDataSet.prototype.emit = function(key, args) {
  // 	DbEvents.emit(key, args);
  // 	return this;
  // };

  // CreateDataSet.prototype.on = function(key, fn) {
  // 	return DbEvents.on(key, fn);
  // };

  CreateDataSet.prototype.sort = function(order) {
    this._opts.sort = order;
    return this;
  };

  CreateDataSet.prototype.limit = function(value) {
    this._opts.limit = value;
    return this;
  };

  CreateDataSet.prototype.where = function(params) {
    this._opts.params = params;
    return this;
  };

  //   CreateDataSet.prototype.reOpenOnRefresh = function(value) {
  //     this._reOpenOnRefresh = value.toString() === "true";
  //     return this;
  //   };

  var _getRecords = function(opts, callback) {
    var self = this,
      cb =
        callback && typeof callback === "function" ? callback : function() {};

    self.proxy().getRecords(opts, function(err, records) {
      self._data.putRange(records, true);
      self._active = err ? false : true;
      self._eof = records && records.length < (self._opts.limit || 30);
      cb(err, records);
      //   if (!err) {
      //     self.emit(self.table(), { event: "read", data: records });
      //   }
    });
  };

  CreateDataSet.prototype.open = function() {
    var opts = { key: this.table() },
      // defer = SimplePromise.defer(),
      self = this;

    return new Promise(function(resolve, reject) {
      //   if (self._active) {
      //     resolve(self);
      //     return;
      //   }

      OjsUtils.cloneProperties(self._opts, opts);

      _getRecords.call(self, opts, function(err, records) {
        if (err) {
          reject(err);
          return;
        }
        resolve(records);
      });
    });
  };

  CreateDataSet.prototype.next = function() {
    if (!this._active) {
      throw "Invalid operation on closed dataset";
    }

    if (!this._opts.limit || isNaN(this._opts.limit)) {
      this._opts.limit = 30;
    }

    _pages[this.table()] = ++_pages[this.table()];

    var self = this,
      skip = _pages[self.table()] * self._opts.limit,
      opts = { key: self.table(), skip: skip };
    // defer = SimplePromise.defer();

    return new Promise(function(resolve, reject) {
      if (self.eof()) {
        resolve(self.data());
        return;
      }

      OjsUtils.cloneProperties(self._opts, opts);

      _getRecords.call(self, opts, function(err, results) {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  };

  CreateDataSet.prototype.close = function() {
    SimpleDataSet.prototype.clear.apply(this, arguments);
    _pages[this.table()] = 0;
    this._active = false;
    return this;
  };

  CreateDataSet.prototype.clear = function() {
    var self = this;
    // defer = SimplePromise.defer();

    return new Promise(function(resolve, reject) {
      self.proxy().clear(self.table(), done);

      function done(err) {
        if (err) {
          reject(err);
          return;
        }
        _pages[self.table()] = 0;
        SimpleDataSet.prototype.clear.apply(self, arguments);
        resolve();
      }
    });
  };

  CreateDataSet.prototype.refresh = function() {
    // if (this._reOpenOnRefresh) {
    //   this._active = false;
    //   return this.open();
    // }

    var self = this;
    // var defer = SimplePromise.defer();

    return new Promise(function(resolve, reject) {
      if (self._opts.sort) {
        self._data.orderBy(self._opts.sort);
      }
      resolve();
    });
  };

  CreateDataSet.prototype.insert = function(record) {
    if (!this._active) {
      throw "Invalid operation on closed dataset";
    }
    return SimpleDataSet.prototype.insert.apply(this, arguments);
  };

  CreateDataSet.prototype.update = function(record) {
    if (!this._active) {
      throw "Invalid operation on closed dataset";
    }
    return SimpleDataSet.prototype.update.apply(this, arguments);
  };

  CreateDataSet.prototype.delete = function(record) {
    if (!this._active) {
      throw "Invalid operation on closed dataset";
    }
    return SimpleDataSet.prototype.delete.apply(this, arguments);
  };

  var _filterOp = function(changes, operation) {
    var results = [];

    changes.forEach(function(item) {
      if (item.op === operation) {
        results.push(item.record);
      }
    });

    return results;
  };

  CreateDataSet.prototype.post = function(ignoreSync) {
    if (!this._active) {
      throw "Invalid operation on closed dataset";
    }

    var self = this,
      sync = this.synchronizer(),
      // defer = SimplePromise.defer(),
      toInsert,
      toUpdate,
      toDelete;

    return new Promise(function(resolve, reject) {
      if (!self._history.length) {
        resolve();
        return;
      }

      toInsert = _filterOp(self._history, "insert");
      toUpdate = _filterOp(self._history, "update");
      toDelete = _filterOp(self._history, "delete");

      self.proxy().commit(self.table(), toInsert, toUpdate, toDelete, done);

      function done(err) {
        if (err) {
          self.cancel();
          reject(err);
          return;
        }

        if (sync && !ignoreSync) {
          sync.writeData(self.table(), toInsert, toUpdate, toDelete);
        }

        self.refresh().then(resolve, reject);
        self._cleanCache();
      }
    });
  };

  CreateDataSet.prototype.sync = function() {
    var self = this,
      sync = this.synchronizer();
    // defer = SimplePromise.defer();

    return new Promise(function(resolve, reject) {
      if (!sync) {
        resolve();
        return;
      }

      sync.exec(self.table(), function(err, allData, toDelete) {
        if (err) {
          reject(err);
          return;
        }

        allData = allData || [];
        toDelete = toDelete || [];

        if (!allData.length && !toDelete.length) {
          resolve([]);
          return;
        }

        var serverData = new ArrayMap(),
          localData = new ArrayMap(),
          toDeleteMap = toDelete.map(function(item) {
            return item.id;
          }),
          deleteFn;

        serverData.putRange(allData);
        localData.putRange(self.data());

        function deleteDiff(item) {
          if (serverData.indexOfKey("id", item.id) < 0) {
            self.delete(item);
          }
        }

        function deleteFix(item) {
          if (toDeleteMap.indexOf(item.id) > -1) {
            self.delete(item);
          }
        }

        deleteFn =
          toDelete && toDelete instanceof Array ? deleteFix : deleteDiff;

        localData.forEach(deleteFn);

        serverData.forEach(function(item) {
          self.save(item);
        });

        self.post(true).then(
          function() {
            resolve(allData);
          },
          function(err) {
            reject(err);
          }
        );
      });
    });
  };

  CreateDataSet.prototype.fetch = function(property) {
    if (!this._active) {
      throw "Invalid operation on closed dataset";
    }

    // var defer = SimplePromise.defer(),
    var self = this;

    return new Promise(function(resolve, reject) {
      if (!self.count()) {
        resolve();
        return;
      }

      self.proxy().fetch(self.table(), self, property, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  };

  CreateDataSet.prototype.eof = function() {
    return this._eof;
  };

  CreateDataSet.prototype.active = function() {
    return this._active;
  };

  return CreateDataSet;
})();

if (typeof module === "object" && module.exports) {
  module.exports.DataSet = DataSet;
}
