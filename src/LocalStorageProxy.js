/*
	LocalStorage Proxy Class
	Alan Thales, 09/2015
	Requires: ArrayMap.js, DbProxy.js
*/
var LocalStorageProxy = (function() {
  "use strict";

  var _get = function(opts) {
    var key = typeof opts === "object" ? opts.key : opts,
      table = window.localStorage[key],
      results = new ArrayMap();
    if (table) {
      results.putRange(JSON.parse(table, DbProxy.dateParser));
    }
    if (results.length && opts.params) {
      return results.query(opts.params);
    }
    return results;
  };

  var _saveAll = function(key, table, callback) {
    window.localStorage[key] = JSON.stringify(table);
    if (typeof callback === "function") {
      callback();
    }
  };

  function CreateProxy() {
    DbProxy.apply(this, arguments);
  }

  CreateProxy.prototype = Object.create(DbProxy.prototype);

  CreateProxy.prototype.getRecords = function(options, callback) {
    var table = _get(options);

    if (options.sort) {
      table.orderBy(options.sort);
    }

    if (typeof callback === "function") {
      callback(null, table);
    }
  };

  CreateProxy.prototype.query = function(key, filters, callback) {
    var table = _get(key),
      results = table.query(filters);
    callback(null, results);
  };

  CreateProxy.prototype.groupBy = function(
    key,
    options,
    groups,
    filters,
    callback
  ) {
    var table = _get(key),
      results = table.groupBy(options, groups, filters);
    callback(null, results);
  };

  var _save = function(table, record) {
    var index = table.indexOfKey("id", record.id);
    if (index === -1) {
      table.push(record);
    } else {
      table.splice(index, 1, record);
    }
  };

  var _remove = function(table, record) {
    var id = typeof record === "object" ? record.id : record,
      index = table.indexOfKey("id", id);
    table.splice(index, 1);
  };

  CreateProxy.prototype.commit = function(
    key,
    toInsert,
    toUpdate,
    toDelete,
    callback
  ) {
    var toSave = toInsert.concat(toUpdate),
      total = toSave.length + toDelete.length,
      table = _get(key),
      cb =
        callback && typeof callback === "function" ? callback : function() {},
      i;

    if (total === 0) {
      return cb();
    }

    for (i = 0; i < toSave.length; i++) {
      _save.call(this, table, toSave[i]);
    }

    for (i = 0; i < toDelete.length; i++) {
      _remove.call(this, table, toDelete[i]);
    }

    _saveAll(key, table, cb);
  };

  CreateProxy.prototype.clear = function(key, callback) {
    _saveAll(key, [], callback);
  };

  return CreateProxy;
})();

if (typeof module === "object" && module.exports) {
  module.exports.LocalStorageProxy = LocalStorageProxy;
}
