/*
	IndexedDb Proxy Class
	Alan Thales, 09/2015
	Requires: ArrayMap.js, DbProxy.js
*/
var IndexedDbProxy = (function() {
  "use strict";

  var _db = null,
    _config;

  function CreateProxy(config) {
    _config = config;

    window.indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB;
    window.IDBTransaction =
      window.IDBTransaction ||
      window.webkitIDBTransaction ||
      window.msIDBTransaction;
    window.IDBKeyRange =
      window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    DbProxy.apply(this, arguments);
  }

  CreateProxy.prototype = Object.create(DbProxy.prototype);

  CreateProxy.prototype.createDatabase = function(callback) {
    var request = window.indexedDB.open(_config.name, _config.version),
      cb = callback;

    request.onerror = function(e) {
      cb(e.target);
    };

    request.onsuccess = function(e) {
      _db = request.result;
      cb();
    };

    request.onupgradeneeded = function(e) {
      var db = e.target.result,
        schema = _config.schema,
        table,
        prop,
        field;

      for (table in schema) {
        var store = db.createObjectStore(table, { keyPath: "id" });

        for (prop in schema[table]) {
          field = schema[table][prop];
          store.createIndex(prop, prop, { unique: !!field.unique });
        }
      }
    };
  };

  CreateProxy.prototype.getRecords = function(options, callback) {
    var store = _db.transaction([options.key]).objectStore(options.key),
      request = store.openCursor(),
      opt = options,
      cb = callback;

    request.onsuccess = function(e) {
      var cursor = e.target.result,
        result = new ArrayMap();

      if (cursor) {
        result.put(cursor.value);
        cursor.continue();
        return;
      }

      if (opt.sort) {
        result.orderBy(opt.sort);
      }

      cb(null, result);
    };

    request.onerror = function(e) {
      cb(e.target);
    };
  };

  CreateProxy.prototype.query = function(key, filters, callback) {
    var opts = { key: key },
      cb = callback;

    this.getRecords(opts, function(err, records) {
      if (err) {
        cb(err);
        return;
      }

      cb(null, records.query(filters));
    });
  };

  CreateProxy.prototype.groupBy = function(
    key,
    options,
    groups,
    filters,
    callback
  ) {
    var opts = { key: key },
      cb = callback;

    this.getRecords(opts, function(err, records) {
      if (err) {
        cb(err);
        return;
      }

      cb(null, records.groupBy(options, groups, filters));
    });
  };

  var _save = function(key, records, callback, operationFn) {
    var transaction = _db.transaction([key], "readwrite"),
      store = transaction.objectStore(key),
      cb = callback;

    records.foreach(function(item) {
      operationFn(store, item);
    });

    transaction.onsuccess = function(e) {
      cb();
    };

    transaction.onerror = function(e) {
      cb(e.target);
    };
  };

  CreateProxy.prototype.commit = function(
    key,
    toInsert,
    toUpdate,
    toDelete,
    callback
  ) {
    var self = this,
      total = toInsert.length + toUpdate.length + toDelete.length,
      cb =
        callback && typeof callback === "function" ? callback : function() {};

    if (total === 0) {
      return cb();
    }

    _save.call(self, key, toInsert, updateFn, function(store, item) {
      store.add(item);
    });

    function updateFn(err) {
      if (err) {
        return cb(err);
      }

      _save.call(self, key, toUpdate, deleteFn, function(store, item) {
        store.put(item);
      });
    }

    function deleteFn(err) {
      if (err) {
        return cb(err);
      }

      _save.call(self, key, toDelete, cb, function(store, item) {
        store.delete(item.id);
      });
    }
  };

  CreateProxy.prototype.clear = function(key, callback) {
    var store = _db.transaction([key], "readwrite").objectStore(key),
      cb = callback,
      request;

    request = store.clear();

    request.onsuccess = function(e) {
      cb();
    };

    request.onerror = function(e) {
      cb(e.target);
    };
  };

  return CreateProxy;
})();

if (typeof module === "object" && module.exports) {
  module.exports.IndexedDbProxy = IndexedDbProxy;
}
