/*
	Data base events
	Alan Thales, 01/2017
	Require: EventEmitter.js
*/
var DbEvents = (function(exports) {
	exports.DbEvents = new EventEmitter();
	return exports.DbEvents;
})(this);