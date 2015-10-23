/*
    Proxy Enums
    Alan Thales, 09/2015
*/
DbProxies = {
    LOCALSTORAGE: 0,
    SQLITE: 1
}


/*
    HashMap Class
    Autor: Alan Thales, 10/2015
*/
function HashMap() {
    var collection = [];

    collection = (Array.apply( collection, arguments ) || collection);

    collection.mapTable = function(key) {
        return this.map(function(item) {
            return item[key];
        });
    }

    collection.indexOfKey = function(key, value) {
        return this.mapTable(key).indexOf(value);
    },

    collection.put = function(index, obj) {
        this[index] = obj;
    },

    collection.putRange = function(arr) {
        for (var i = 0; i < arr.length; i++) {
            this.put(i, arr[i]);
        }
    }
    
    return collection;
}


/*
    DbProxy Parent Class
    Autor: Alan Thales, 09/2015
*/
function DbProxy() {
    this.createDatabase = function() {}
}


/*
    LocalStorage Proxy Class
    Autor: Alan Thales, 09/2015
*/
LocalStorageProxy.prototype = new DbProxy();
LocalStorageProxy.prototype.constructor = LocalStorageProxy;

function LocalStorageProxy() {}

LocalStorageProxy.prototype._get = function(key) {
    var table = window.localStorage[key],
        results = new HashMap();
    if (table) {
        results.putRange( JSON.parse(table) );
    }
    return results;
}

LocalStorageProxy.prototype.getRecords = function(options, callback) {
    var opts = typeof options === "object" ? options : { key: options },
        table = this._get(opts.key);

    if (opts.sort && opts.sort !== "") {
        table.sort(function(a,b) {
            return (a[opts.sort] > b[opts.sort]) - (a[opts.sort] < b[opts.sort]);
        });
    }
    
    if (typeof callback === "function") {
        callback( table );
    }
}

LocalStorageProxy.prototype.select = function(key, opts, callback) {
    var table = this._get(key),
        opts = opts && typeof opts === "object" ? opts : { },
        result = [],
        finded, record, i, props;

    for (i = 0; i < table.length; i++) {
        finded = true,
        record = table[i];
        
        for (props in opts) {
            if (record[props] != opts[props]) {
                finded = false;
                break;
            }
        }
        
        if (finded) {
            result.push(record);
        }
    }

    callback( result );
}

LocalStorageProxy.prototype._saveAll = function(key, table, callback) {
    window.localStorage[key] = JSON.stringify(table);
    if (typeof callback == "function") {
        callback();
    }
}

LocalStorageProxy.prototype.save = function(key, record, callback) {
    var table = this._get(key),
        index = table.indexOfKey('id', record.id);
    if (index === -1) {
        table.push(record);
    } else {
        table.splice(index, 1, record);
    }
    this._saveAll(key, table, callback);
}

LocalStorageProxy.prototype.remove = function(key, record, callback) {
    var id = typeof record === "object" ? record.id : record,
        table = this._get(key),
        index = table.indexOfKey('id', id);
    table.splice(index, 1);
    this._saveAll(key, table, callback);
}

LocalStorageProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
    var self = this,
        toSave = toInsert.concat(toUpdate),
        total = toSave.length + toDelete.length,
        cb = callback && typeof callback === "function" ? callback : function() {},
        i;

    function progress() {
        total--;
        if (total === 0) {
            cb();
        }
    }
    
    for (i = 0; i < toSave.length; i++) {
        self.save(key, toSave[i], progress);
    }
    
    for (i = 0; i < toDelete.length; i++) {
        self.remove(key, toDelete[i], progress);
    }
}



/*
    SQLite Proxy Class
    Autor: Alan Thales, 09/2015
*/
SQLiteProxy.prototype = new DbProxy();
SQLiteProxy.prototype.constructor = SQLiteProxy;

function SQLiteProxy(dbName) {
    var db;
    
    if (window.cordova && window.sqlitePlugin) {
        db = window.sqlitePlugin.openDatabase({name: dbName});
    } else {
        db = window.openDatabase(dbName, "SQLite Database", "1.0", 5*1024*1024);
    }
    
    this._maps = new HashMap();
    this.getDb = function() {
        return db;
    }
}

SQLiteProxy.prototype.getFields = function(table) {
    var index = this._maps.indexOfKey('table', table);
    return this._maps[index].fields;
}

SQLiteProxy.prototype.createDatabase = function(maps, callback) {
    this._maps.length = 0;
    this._maps.putRange(maps);
    
    this.getDb().transaction(function(tx) {
        var cb = callback && typeof callback === "function" ? callback : function() {},
            total = maps.length,
            fields = "",
            field, table, sql, i, j;
        
        function progress() {
            total--;
            if (total === 0) {
                cb();
            }
        }
        
        for (i = 0; i < maps.length; i++) {
            table = maps[i].table;

            for (j = 0; j < maps[i].fields.length; j++) {
                field = maps[i].fields[j];
                fields += [
                    field.name, field.type, (field.nullable ? "" : "NOT NULL"), (field.primary ? "PRIMARY KEY" : ""), ","
                ].join(" ");
            }
            
            fields = fields.substr(0, fields.length -1);
            sql = ["CREATE TABLE IF NOT EXISTS", table, "(", fields, ")"].join(" ");
            
            tx.executeSql(sql, [], progress);
        }
    });
}

SQLiteProxy.prototype.getRecords = function(options, callback) {
    var opts = typeof options === "object" ? options : { key: options, limit: 1000 },
        sortBy = opts.sort && opts.sort !== "" ? "ORDER BY " + opts.sort : "",
        self = this;
    
    self.getDb().transaction(function(tx) {
        var sql = ["SELECT * FROM", opts.key, sortBy, "LIMIT", opts.limit].join(" "),
            fields = self.getFields(opts.key),
            hashtable = fields.map(function(field) {
                return field.name;
            }),
            table = new HashMap(),
            i, record, field, index;
        
        tx.executeSql(sql, [], function(tx, results) {
            for (i = 0; i < results.rows.length; i++) {
                record = results.rows.item(i);
                for (field in record) {
                    index = hashtable.indexOf(field);
                    if (fields[index].serialize) {
                        record[field] = JSON.parse(record[field]);
                    }
                }
                table.push(record);
            }
            if (typeof callback === "function") {
                callback( table );
            }
        })
    });
}

SQLiteProxy.prototype.insert = function(key, record, transaction, callback) {
    var params = [],
        fields = "",
        values = "",
        sql, prop, value;

    for (prop in record) {
        value = record[prop];
        if (typeof value === "object") {
            value = JSON.stringify(value);
        }
        params.push(value);
        fields += prop + ",";
        values += "?,";
    }

    fields = fields.substr(0, fields.length -1);
    values = values.substr(0, values.length -1);

    sql = ["INSERT INTO", key, "(", fields, ") VALUES (", values, ")"].join(" ");
    
    transaction.executeSql(sql, params, callback);
}

SQLiteProxy.prototype.update = function(key, record, transaction, callback) {
    var params = [],
        where = "id = " + record.id,
        sets = "",
        sql, prop, value;
        
    for (prop in record) {
        if (prop != "id") {
            value = record[prop];
            if (typeof value === "object") {
                value = JSON.stringify(value);
            }
            params.push(value);
            sets += prop + " = ?,"
        }
    }

    sets = sets.substr(0, sets.length -1);

    sql = ["UPDATE", key, "set", sets, "WHERE", where].join(" ");
    
    transaction.executeSql(sql, params, callback);
}

SQLiteProxy.prototype.delete = function(key, record, transaction, callback) {
    var id = typeof record === "object" ? record.id : record,
        where = "id = " + id,
        sql;
    
    sql = ["DELETE FROM", key, "WHERE", where].join(" ");
    
    transaction.executeSql(sql, [], callback);
}

SQLiteProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
    var self = this,
        total = toInsert.length + toUpdate.length + toDelete.length,
        cb = callback && typeof callback === "function" ? callback : function() {},
        i;

    function progress() {
        total--;
        if (total === 0) {
            cb();
            return;
        }
    }

    self.getDb().transaction(function(tx) {
        // to insert
        for (i = 0; i < toInsert.length; i++) {
            self.insert(key, toInsert[i], tx, progress);
        }
        // to update
        for (i = 0; i < toUpdate.length; i++) {
            self.update(key, toUpdate[i], tx, progress);
        }
        // to delete
        for (i = 0; i < toDelete.length; i++) {
            self.delete(key, toDelete[i], tx, progress);
        }
    });
}



/*
    DataSet Class
    Autor: Alan Thales, 09/2015
*/
function DataSet(proxy, table) {
    var prx = proxy,
        tbl = table;
    
    this._inserteds = [];
    this._deleteds = [];
    this._updateds = [];
    
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

DataSet.prototype.open = function(callback) {
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

DataSet.prototype.close = function() {
    this.active = false;
    this.data.length = 0;
    this._inserteds.length = 0;
    this._updateds.length = 0;
    this._deleteds.length = 0;
}

DataSet.prototype.getById = function(id) {
    var index = this.data.indexOfKey('id', parseInt(id));
    return this.data[index];
}

DataSet.prototype.insert = function(record) {
    if (!this.active) {
        throw "Invalid operation on closed dataset";
    }
    if (record && !record.id) {
        record.id = (new Date()).getTime();
    }
    var index = this.data.indexOfKey('id', record.id);
    if (index === -1) {
        this._inserteds.push(record);
        this.data.push(record);
    }
}

DataSet.prototype.update = function(record) {
    if (!this.active) {
        throw "Invalid operation on closed dataset";
    }
    var index = this.data.indexOfKey('id', record.id);
    if (!this._updateds[index]) {
        this._updateds.push(record);
    } else {
        this._updateds.splice(index, 1, record);
    }
    this.data.splice(index, 1, record);
}

DataSet.prototype.delete = function(record) {
    if (!this.active) {
        throw "Invalid operation on closed dataset";
    }
    var index = this.data.indexOfKey('id', record.id);
    if (!this._deleteds[index]) {
        this._deleteds.push(record);
    }
    this.data.splice(index, 1);
}

DataSet.prototype.post = function(callback) {
    if (!this.active) {
        throw "Invalid operation on closed dataset";
    }
    this.getProxy().commit(
        this.getTable(), this._inserteds, this._updateds,
        this._deleteds, callback
    );
}

DataSet.prototype.filter = function(options) {
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



/*
    Database Factory Utility Class
    Alan Thales, 09/2015
*/
function DbFactory (opts, proxyType) {
    var proxy;
    switch(proxyType) {
        case 0:
            proxy = new LocalStorageProxy();
            break;
        case 1:
            proxy = new SQLiteProxy(opts);
            break;
        default:
            throw "Proxy not implemented";
    }
    this.opts = opts;
    this.getProxy = function() {
        return proxy;
    }
}

DbFactory.prototype.createDatabase = function(maps, callback) {
    this.getProxy().createDatabase(maps, callback);
}

DbFactory.prototype.createDataSet = function(table) {
    return new DataSet(this.getProxy(), table);
}

DbFactory.prototype.select = function(sql, params, callback) {
    this.getProxy().select(sql, params, callback);
}
