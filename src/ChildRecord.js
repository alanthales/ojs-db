/*
    ChildRecord Class
    Autor: Alan Thales, 07/2016
*/
var ChildRecord = (function() {
    'use strict';
    
    function CreateRecord(dtsMaster, recMaster) {
        var _dtsMaster = dtsMaster,
            _recMaster = recMaster;
        
        this.getDtsMaster = function() {
            return _dtsMaster;
        }
        
        this.getRecMaster = function() {
            return _recMaster;
        }
        
        this.setRecMaster = function(recMaster) {
            if (recMaster)
                _recMaster = recMaster;
        }
    }
    
    CreateRecord.prototype.notifyMaster = function() {
        this.getDtsMaster().save(this.getRecMaster());
    }
    
    return CreateRecord;
})();