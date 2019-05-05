/*
    Event Emitter Class
    Alan Thales, 12/2016
*/
var EventEmitter = (function() {
  "use strict";

  function CreateEmitter() {
    var _topics = {};
    this.topics = function() {
      return _topics;
    };
  }

  CreateEmitter.prototype.on = function(topic, listener) {
    var topics = this.topics();

    // Create the topic's object if not yet created
    if (!topics.hasOwnProperty(topic)) {
      topics[topic] = [];
    }

    // Add the listener to queue
    var index = topics[topic].push(listener) - 1;

    // Provide handle back for removal of topic
    return {
      remove: function() {
        delete topics[topic][index];
      }
    };
  };

  CreateEmitter.prototype.emit = function(topic, args) {
    var topics = this.topics();

    // If the topic doesn't exist, or there's no listeners in queue, just leave
    if (!topics.hasOwnProperty(topic)) {
      return;
    }

    // Cycle through topics queue, fire!
    topics[topic].forEach(function(item) {
      item(args !== undefined ? args : {});
    });
  };

  return CreateEmitter;
})();

if (typeof module === "object" && module.exports) {
  module.exports.EventEmitter = EventEmitter;
}
