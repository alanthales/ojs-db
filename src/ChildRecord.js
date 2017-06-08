/*
    ChildRecord Class
    Alan Thales, 07/2016
*/
var ChildRecord = (function(exports) {
    'use strict';
    
    function CreateRecord(record) {
        this.master = function() {
            return record;
        };
    }

    exports.ChildRecord = CreateRecord;
    
    return CreateRecord;
})(this);