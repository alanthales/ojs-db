/*
    ChildRecord Class
    Alan Thales, 07/2016
*/
var ChildRecord = (function() {
  "use strict";

  function CreateRecord(record) {
    this.master = function() {
      return record;
    };
  }

  return CreateRecord;
})();

if (typeof module === "object" && module.exports) {
  module.exports.ChildRecord = ChildRecord;
}
