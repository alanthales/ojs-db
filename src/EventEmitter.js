var EventEmitter = (function() {
    'use strict';

	var topics = {};

	return {
		on: function(topic, listener) {
			// Create the topic's object if not yet created
			if (!topics.hasOwnProperty(topic))  { topics[topic] = []; }

			// Add the listener to queue
			var index = topics[topic].push(listener) - 1;

			// Provide handle back for removal of topic
			return {
				remove: function() {
					delete topics[topic][index];
				}
			};
		},

		emit: function(topic, args) {
			// If the topic doesn't exist, or there's no listeners in queue, just leave
			if (!topics.hasOwnProperty(topic)) { return; }

			// Cycle through topics queue, fire!
			topics[topic].forEach(function(item) {
				item(args != undefined ? args : {});
			});
		}
	};
})();