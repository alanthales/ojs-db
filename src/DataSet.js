/*
    DataSet Class
    Autor: Alan Thales, 09/2015
    Requires: HashMap.js
*/
var DataSet = (function() {
    var _inserteds = [],
        _deleteds = [],
        _updateds = [];
    
    var _cleanCache = function() {
        _inserteds.length = 0;
        _updateds.length = 0;
        _deleteds.length = 0;
    };
    
    function CreateDataSet(proxy, table) {
        var prx = proxy,
            tbl = table;

        this.active = false;
        this.limit = 1000;
        this.sortBy = "";
        this.data = new HashMap();

        this.getProxy = function() {
            return prx;
        }

        this.getTable = function() {
            return tbl;
        }
    }

    CreateDataSet.prototype.open = function(callback) {
        var self = this,
            opts = { key: self.getTable(), limit: self.limit, sort: self.sortBy };

        function fn(results, cb) {
            if (typeof cb === "function") {
                cb(results);
            }
        }

        if (self.active) {
            fn(self.data, callback);
            return;
        }

        self.getProxy().getRecords(opts, function(table) {
            self.data = table;
            self.active = true;
            fn(table, callback);
        });
    }

    CreateDataSet.prototype.close = function() {
        this.active = false;
        this.data.length = 0;
        _cleanCache();
    }

    CreateDataSet.prototype.getById = function(id) {
        var index = this.data.indexOfKey('id', parseInt(id));
        return this.data[index];
    }

    CreateDataSet.prototype.refresh = function() {
        var self = this;

        if (self.sortBy === "") {
            return;
        }

        self.data.sort(function(a,b) {
            return (a[self.sortBy] > b[self.sortBy]) - (a[self.sortBy] < b[self.sortBy]);
        });
    }

    CreateDataSet.prototype.insert = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        if (record && !record.id) {
            record.id = (new Date()).getTime();
        }
        var index = this.data.indexOfKey('id', record.id);
        if (index === -1) {
            _inserteds.push(record);
            this.data.push(record);
        }
    }

    CreateDataSet.prototype.update = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        var index = this.data.indexOfKey('id', record.id);
        if (!_updateds[index]) {
            _updateds.push(record);
        } else {
            _updateds.splice(index, 1, record);
        }
        this.data.splice(index, 1, record);
    }

    CreateDataSet.prototype.save = function(record) {
        if (record && !record.id) {
            this.insert(record);
        } else {
            this.update(record);
        }
    }
    
    CreateDataSet.prototype.delete = function(record) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }
        var index = this.data.indexOfKey('id', record.id);
        if (!_deleteds[index]) {
            _deleteds.push(record);
        }
        this.data.splice(index, 1);
    }

    CreateDataSet.prototype.post = function(callback) {
        if (!this.active) {
            throw "Invalid operation on closed dataset";
        }

        var self = this,
            callback = callback;

        function cb() {
            _cleanCache();
            if (typeof callback === "function") {
                callback();
            }
        }

        self.getProxy().commit(
            this.getTable(), _inserteds, _updateds, _deleteds, cb
        );
    }

    CreateDataSet.prototype.filter = function(options) {
        if (options && typeof options === 'function') {
            return this.data.filter(options);
        }
        return this.data.filter(function(record) {
            var finded = true,
                prop;
            for (prop in options) {
                if (record[prop] != options[prop]) {
                    finded = false;
                    break;
                }
            }
            return finded;
        });
    }
    
    CreateDataSet.prototype.cloneObject = function(obj) {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
            var out = [], i = 0, len = obj.length;
            for ( ; i < len; i++ ) {
                out[i] = arguments.callee(obj[i]);
            }
            return out;
        }
        if (obj && !(obj instanceof Date) && (typeof obj === 'object')) {
            var out = {}, i;
            for ( i in obj ) {
                out[i] = arguments.callee(obj[i]);
            }
            return out;
        }
        return obj;
    }
    
    return CreateDataSet;
})();