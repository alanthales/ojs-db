/*
	Data base events
	Alan Thales, 01/2017
	Require: EventEmitter.js
*/
var DbEvents = (function() {
  return new EventEmitter();
})();

if (typeof module === "object" && module.exports) {
  module.exports.DbEvents = DbEvents;
}
