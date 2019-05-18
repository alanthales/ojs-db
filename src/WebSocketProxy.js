/*
    WebSocket Proxy Class
    Alan Thales, 09/2015
    Requires: ArrayMap.js, DbProxy.js
*/
var WebSocketProxy = (function() {
  "use strict";

  var _stack = new ArrayMap(),
    _socket;

  var _onOpen = function() {
    this.connected = true;
  };

  var _onClose = function() {
    this.connected = false;
  };

  var _onError = function(e) {
    var err = !!e ? JSON.stringify(e) : { message: "Socket Error" };
    throw JSON.stringify(err);
  };

  var _onMessage = function(e) {
    var message = JSON.parse(e, DbProxy.dateParser),
      key = message.event + message.model;
    _dispatch(key, message.data);
  };

  var _sendMessage = function(message, callback) {
    var key = message.event + message.model;
    _stack.put({ key: key, callback: callback });
    _socket.send(JSON.stringify(message));
  };

  var _dispatch = function(key, data) {
    var index = _stack.indexOfKey("key", key);
    _stack[index].callback(null, data);
    _stack.splice(index, 1);
  };

  function CreateProxy(config) {
    this.config = config;
    this.connected = false;

    _socket = new WebSocket(config.url);

    _socket.onopen = _onOpen.bind(this);
    _socket.onclose = _onClose.bind(this);
    _socket.onmessage = _onMessage.bind(this);
    _socket.onerror = _onError.bind(this);

    DbProxy.apply(this, arguments);
  }

  CreateProxy.prototype = Object.create(DbProxy.prototype);

  CreateProxy.prototype.getRecords = function(options, callback) {
    if (!this.connected) {
      throw "Socket is not connected";
    }

    var opt = Object.assign({}, options),
      message;

    delete opt.key;
    message = { event: "READ", model: options.key, data: opt };

    _sendMessage(message, callback);
  };

  CreateProxy.prototype.query = function(key, filters, callback) {
    if (!this.connected) {
      throw "Socket is not connected";
    }
    var message = { event: "READ", model: key, data: filters };
    _sendMessage(message, callback);
  };

  CreateProxy.prototype.groupBy = function(
    key,
    filters,
    options,
    groups,
    callback
  ) {
    this.query(key, filters, function(err, data) {
      if (err) {
        callback(err);
        return;
      }
      var results = data.groupBy(options, groups, {});
      callback(null, results);
    });
  };

  CreateProxy.prototype.insert = function(key, records, callback) {
    if (!this.connected) {
      throw "Socket is not connected";
    }
    var message = { event: "CREATE", model: key, data: records };
    _sendMessage(message, callback);
  };

  CreateProxy.prototype.update = function(key, records, callback) {
    if (!this.connected) {
      throw "Socket is not connected";
    }
    var message = { event: "UPDATE", model: key, data: records };
    _sendMessage(message, callback);
  };

  CreateProxy.prototype.delete = function(key, records, callback) {
    if (!this.connected) {
      throw "Socket is not connected";
    }
    var message = { event: "DELETE", model: key, data: records };
    _sendMessage(message, callback);
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

    self.insert(key, toInsert, updateFn);

    function updateFn(err) {
      if (err) {
        return cb(err);
      }
      self.update(key, toUpdate, deleteFn);
    }

    function deleteFn(err) {
      if (err) {
        return cb(err);
      }
      self.delete(key, toDelete, cb);
    }
  };

  return CreateProxy;
})();

if (typeof module === "object" && module.exports) {
  module.exports.WebSocketProxy = WebSocketProxy;
}
