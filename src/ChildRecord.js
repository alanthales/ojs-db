/*
    ChildRecord Class
    Autor: Alan Thales, 07/2016
*/
var ChildRecord = (function() {
    'use strict';
    
    function CreateRecord(record) {
        this.master = function() {
            return record;
        };
    }
    
    return CreateRecord;
})();