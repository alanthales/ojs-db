/*
	SimpleDataSet Class
	Alan Thales, 07/2016
	Requires: ArrayMap.js, OjsUtils.js, ChildRecord.js, EventEmitter.js
*/
var SimpleDataSet = (function() {
  "use strict";

  function CreateDataSet(table) {
    EventEmitter.apply(this);

    var _table = table || "tableName";
    this._history = [];
    this._data = new ArrayMap();

    this.table = function() {
      return _table;
    };
  }

  CreateDataSet.prototype = Object.create(EventEmitter.prototype);

  CreateDataSet.prototype._cleanCache = function() {
    this._history.length = 0;
  };

  CreateDataSet.prototype.get = function(id) {
    var index = this._data.indexOfKey("id", id);
    return this.item(index);
  };

  var _beforeChange = function(change) {
    var idx, exists;

    exists = this._history.some(function(item, index) {
      idx = index;
      return item.op === change.op && item.record.id === change.record.id;
    });

    if (exists) {
      this._history.splice(idx, 1, change);
      return;
    }

    this._history.push(change);
  };

  var _afterChange = function(change) {
    this.emit(this.table(), { event: change.op, data: change.record });

    if (change.record instanceof ChildRecord) {
      var table = [this.table(), ".child"].join("");
      DbEvents.emit(table, { event: change.op, data: change.record });
    }
  };

  CreateDataSet.prototype.insert = function(record) {
    if (!record.id) {
      record.id = OjsUtils.newId();
    }

    var index = this._data.indexOfKey("id", record.id),
      change;

    if (index === -1) {
      change = {
        op: "insert",
        record: OjsUtils.cloneObject(record)
      };

      _beforeChange.call(this, change);
      this._data.push(record);
      _afterChange.call(this, change);
    }

    return this;
  };

  CreateDataSet.prototype.update = function(record) {
    if (!record.id) {
      return this;
    }

    var index = this._data.indexOfKey("id", record.id),
      change;

    if (index === -1) {
      return this;
    }

    change = {
      op: "update",
      record: OjsUtils.cloneObject(record)
    };

    _beforeChange.call(this, change);
    this._data.splice(index, 1, record);
    _afterChange.call(this, change);

    return this;
  };

  CreateDataSet.prototype.save = function(record) {
    if (!record) return this;
    if (!record.id || !this.get(record.id)) {
      return this.insert(record);
    }
    return this.update(record);
  };

  CreateDataSet.prototype.delete = function(record) {
    if (!record || !record.id) {
      return this;
    }

    var index = this._data.indexOfKey("id", record.id),
      change;

    if (index >= 0) {
      change = {
        op: "delete",
        record: OjsUtils.cloneObject(record)
      };

      _beforeChange.call(this, change);
      this._data.splice(index, 1);
      _afterChange.call(this, change);
    }

    return this;
  };

  CreateDataSet.prototype.insertAll = function(records) {
    var self = this;

    if (!(records instanceof Array)) {
      return self;
    }

    records.forEach(function(record) {
      self.insert(record);
    });

    return self;
  };

  CreateDataSet.prototype.clear = function(mustNotify) {
    this._data.length = 0;
    this._cleanCache();
    if (mustNotify) {
      this.emit(this.table(), { event: "clear", data: [] });
    }
    return this;
  };

  CreateDataSet.prototype.cancel = function() {
    if (!this._history.length) return this;

    var i = this._history.length - 1,
      item,
      index;

    for (; i >= 0; i--) {
      item = this._history[i];
      index = this._data.indexOfKey("id", item.record.id);

      switch (item.op) {
        case "insert":
          this._data.splice(index, 1);
          break;
        case "update":
          this._data.splice(index, 1, item.record);
          break;
        case "delete":
          this._data.push(item.record);
          break;
      }
    }

    this.emit(this.table(), { event: "cancel", data: this._history });
    this._history.length = 0;
    return this;
  };

  CreateDataSet.prototype.data = function() {
    return this._data.slice();
  };

  CreateDataSet.prototype.count = function() {
    return this._data.length;
  };

  CreateDataSet.prototype.item = function(index) {
    var record = this._data[index];
    return OjsUtils.cloneObject(record);
  };

  CreateDataSet.prototype.filter = function(options) {
    return this._data.query(options);
  };

  CreateDataSet.prototype.forEach = function(fn) {
    this._data.forEach(fn);
  };

  CreateDataSet.prototype.subscribe = function(fn) {
    return this.on(this.table(), fn);
  };

  CreateDataSet.prototype.unsubscribe = function(subscription) {
    if (subscription && typeof subscription.remove === "function") {
      subscription.remove();
    }
    return this;
  };

  return CreateDataSet;
})();

if (typeof module === "object" && module.exports) {
  module.exports.SimpleDataSet = SimpleDataSet;
}
