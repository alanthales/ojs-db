/*
    ChildRecord Class
    Autor: Alan Thales, 07/2016
*/
var ChildRecord = (function() {
    function CreateRecord(dtsMaster, recMaster) {
        var _dtsMaster = dtsMaster,
            _recMaster = recMaster;
        
        this.getDtsMaster = function() {
            return _dtsMaster;
        }
        
        this.getRecMaster = function() {
            return _recMaster;
        }
    }
    
    CreateRecord.prototype.notifyMaster = function() {
        this.getDtsMaster().update(this.getRecMaster());
    }
    
    return CreateRecord;
})();