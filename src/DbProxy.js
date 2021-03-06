/*
	DbProxy Parent Class
	Alan Thales, 09/2015
*/
var DbProxy = (function() {
  "use strict";

  function CreateProxy() {}

  CreateProxy.prototype.createDatabase = function(maps, callback) {
    if (typeof callback === "function") {
      callback();
    }
  };

  CreateProxy.prototype.getRecords = function(options, callback) {
    if (typeof callback === "function") {
      callback(null, []);
    }
  };

  CreateProxy.prototype.groupBy = function(
    key,
    options,
    groups,
    filters,
    callback
  ) {
    if (typeof callback === "function") {
      callback(null, []);
    }
  };

  CreateProxy.prototype.commit = function(
    key,
    toInsert,
    toUpdate,
    toDelete,
    callback
  ) {
    if (typeof callback === "function") {
      callback();
    }
  };

  CreateProxy.prototype.fetch = function(key, property, callback) {
    if (typeof callback === "function") {
      callback();
    }
  };

  CreateProxy.prototype.clear = function(key, callback) {
    if (typeof callback === "function") {
      callback();
    }
  };

  CreateProxy.dateParser = function(key, value) {
    var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/,
      test;

    if (typeof value === "string") {
      test = reISO.exec(value);
      if (test) {
        return new Date(value);
      }
    }

    return value;
  };

  return CreateProxy;
})();

if (typeof module === "object" && module.exports) {
  module.exports.DbProxy = DbProxy;
}
