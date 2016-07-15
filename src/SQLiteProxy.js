/*
    SQLite Proxy Class
    Autor: Alan Thales, 09/2015
    Requires: ArrayMap.js, DbProxy.js, Utils.js, SimpleDataSet.js
*/
var SQLiteProxy = (function() {
    var _selectFrom = "SELECT * FROM",
        _maps = {};
    
    function CreateProxy(dbName) {
        var db;

        if (window.cordova && window.sqlitePlugin) {
            db = window.sqlitePlugin.openDatabase({name: dbName});
        } else {
            db = window.openDatabase(dbName, "SQLite Database", "1.0", 5*1024*1024);
        }

        this.getDb = function() {
            return db;
        }
        
        DbProxy.apply(this, arguments);
    }
    
    CreateProxy.prototype = Object.create(DbProxy.prototype);
    
    CreateProxy.prototype.createDatabase = function(maps, callback) {
        var self = this,
            errorObj = null;
        
        _maps = OjsUtils.cloneObject(maps);

        self.getDb().transaction(function(tx) {
            var cb = callback && typeof callback === "function" ? callback : function() {},
                total = Object.keys(_maps).length,
                fields, field, table, prop, sql;

            function progress() {
                total--;
                if (total === 0) {
                    cb(errorObj);
                }
            }

            for (table in _maps) {
                fields = "";
                
                for (prop in _maps[table]) {
                    field = _maps[table][prop];
                    
                    if (field.hasMany) {
                        continue;
                    }
                    
                    if (field.hasOne) {
                        field.type = _maps[field.hasOne]["id"].type;
                    }
                    
                    fields += [
                        prop, field.type, (field.required ? "NOT NULL" : ""), (field.primaryKey ? "PRIMARY KEY" : ""), ","
                    ].join(" ");
                }

                fields = fields.substr(0, fields.length - 1);
                sql = ["CREATE TABLE IF NOT EXISTS", table, "(", fields, ")"].join(" ");

                tx.executeSql(sql, [], progress, function(err) {
                    errorObj = err;
                    progress();
                });
            }
        });
    }

    var _parseItem = function(key, item) {
        var result = {},
            prop, value, fdmap;

        for (prop in _maps[key]) {
            value = item[prop];
            fdmap = _maps[key][prop];
            
            if (fdmap.type === "date" || fdmap.type === "datetime") {
                value = new Date(value);
            }
            
            result[prop] = value;
        }
        
        return result;
    };

    var _formatValue = function(table, key, value) {
        var fdmap = _maps[table][key];
        
        if (fdmap && fdmap.hasOne) {
            value = typeof value === "object" ? value.id : value;
        }
        
        if (fdmap && fdmap.hasMany) {
            value = null;
        }
        
//        if (typeof value === "date") {
//            value = value.toString();
//        }
        
        return value;
    };
    
    var _select = function(key, sql, params, transaction, callback) {
        var table = new ArrayMap(),
            i, l, record; //, field, index;

        transaction.executeSql(sql, params, function(tx, results) {
            l = results.rows.length;
            
            for (i = 0; i < l; i++) {
                record = _parseItem(key, results.rows.item(i));
                table.push(record);
            }
            
            if (typeof callback === "function") {
                callback( table );
            }
        });
    };
    
    var _orderBy = function(sorters) {
        var result = [],
            field;
        for (field in sorters) {
            result.push(field + sorters[field]);
        }
        return "ORDER BY " + result.join(",");
    };
    
    CreateProxy.prototype.getRecords = function(options, callback) {
        console.log(options);
        var self = this,
            key = options && options.key ? options.key : options,
            sortBy = options && options.sort ? _orderBy(options.sort) : "",
            where = "WHERE ",
            sql = [], p;
        
        if (typeof options === "object") {
            sql = [_selectFrom, options.key];
            if (options.params) {
                for (p in options.params) {
                    where += p + " = " + options.params[p];
                }
                sql.push(where);
            }
            sql = sql.concat([sortBy, "LIMIT", options.limit]);
        } else {
            sql = [_selectFrom, options];
        }
        
        self.getDb().transaction(function(tx) {
            _select(key, sql.join(" "), [], tx, callback);
        });
    }

    var _formatSql = function(sqlNoWhere, filters) {
        var where = "",
            field, prop;
        
        for (field in filters) {
            for (prop in filters[field]) {
                switch(prop) {
                    case "$gt":
                        where += [field, ">", filters[field][prop]].join(" ") + " AND ";
                        break;
                    case "$gte":
                        where += [field, ">=", filters[field][prop]].join(" ") + " AND ";
                        break;
                    case "$lt":
                        where += [field, "<", filters[field][prop]].join(" ") + " AND ";
                        break;
                    case "$lte":
                        where += [field, "<=", filters[field][prop]].join(" ") + " AND ";
                        break;
                    case "$start":
                        where += [field, " LIKE '", filters[field][prop], "%'"].join("") + " AND ";
                        break;
                    case "$end":
                        where += [field, " LIKE '%", filters[field][prop], "'"].join("") + " AND ";
                        break;
                    case "$contain":
                        where += [field, " LIKE '%", filters[field][prop], "%'"].join("") + " AND ";
                        break;
                    case "$in":
                        where += [field, " IN (", filters[field][prop].join(","), ")"].join("") + " AND ";
                        break;
                    case "$custom":
                        where += filters[field][prop].call(filters[field][prop], field) + " AND ";
                        break;
                    default:
                        where += "";
                }
            }
        }
        
        if (where === "") {
            return sqlNoWhere;
        }
        
        where = where.trim().slice(0, -3);
        
        return [sqlNoWhere, "WHERE", where].join(" ");
    };
    
    var _formatGroupBy = function(key, options, groups, filters) {
        var opts = options && options instanceof Array ? options : [options],
            groupBy = groups.length ? groups.join(",") + ", " : "",
            where = filters && typeof filters === "object" ? _formatSql("", filters) : "",
            sql = "",
            prop, field, alias;
    
        opts.forEach(function(opt) { 
            for (prop in opt) break;
            
            field = opt[prop];
            alias = opt["alias"] || field;
            
            switch(prop) {
                case "$max":
                    sql += ["MAX(", field, ")", " AS ", alias].join("") + ", ";
                    break;
                case "$min":
                    sql += ["MIN(", field, ")", " AS ", alias].join("") + ", ";
                    break;
                case "$sum":
                    sql += ["SUM(", field, ")", " AS ", alias].join("") + ", ";
                    break;
                case "$avg":
                    sql += ["AVG(", field, ")", " AS ", alias].join("") + ", ";
                    break;
                case "$count":
                    sql += ["COUNT(", field, ")", " AS ", alias].join("") + ", ";
                    break;
            }
        });
        
        if (sql === "") {
            return [_selectFrom, key].join(" ");
        }

        sql = sql.trim().slice(0, -1);
        sql = ["SELECT", groupBy, sql, "FROM", key, where].join(" ");
        
        if (groupBy === "") {
            return sql;
        }
            
        return sql + " GROUP BY " + groupBy;
    };

    CreateProxy.prototype.query = function(key, filters, callback) {
        var self = this,
            opts = filters && typeof filters === "object" ? filters : { },
            select = [_selectFrom, key].join(" "),
            sql = _formatSql(select, opts);
        
        self.getDb().transaction(function(tx) {
            _select(key, sql, [], tx, callback);
        });
    }
    
    CreateProxy.prototype.groupBy = function(key, options, groups, filters, callback) {
        var self = this,
            sql = _formatGroupBy(key, options, groups, filters);
        
        self.getDb().transaction(function(tx) {
            _select(key, sql, [], tx, callback);
        });
    }

    var _getInsertSql = function(key, record) {
        var params = [],
            fields = "",
            values = "",
            prop, sql, value;
        
        for (prop in record) {
            value = _formatValue(key, prop, record[prop]);
            if (value) {
                params.push(value);
                fields += prop + ",";
                values += "?,";
            }
        }

        fields = fields.substr(0, fields.length - 1);
        values = values.substr(0, values.length - 1);

//        if (ignore) {
//            sql = ["INSERT OR IGNORE INTO", key, "(", fields, ") VALUES (", values, ")"].join(" ");
//        } else {
            sql = ["INSERT INTO", key, "(", fields, ") VALUES (", values, ")"].join(" ");
//        }
        
        console.log(sql);
        return {
            sql: sql,
            params: params
        };
    };
    
    var _save = function(instance, key, record, transaction, operationFn, callback) {
        var total = 0,
            prop, fdmap, items;
        
        function onerror(err) {
            var obj = err || { message: "errors happen on save" };
            throw obj.message;
        }
        
        function progress(err) {
            if (err) {
                return onerror(err);
            }
            total--;
            if (total === 0) {
                operationFn(key, record, transaction, callback, onerror);
            }
        };
        
        for (prop in record) {
            fdmap = _maps[key][prop];
            
            if (fdmap && fdmap.hasMany) {
                items = record[prop];
                
                if (items instanceof SimpleDataSet) {
                    total++;
                    instance.commit(fdmap.hasMany,
                        items._inserteds, items._updateds, items._deleteds, progress
                    );
                }
            }
        }

        if (!items) {
            total = 1;
            progress();
        }
    };
    
    var _insert = function(key, record, transaction, onsuccess, onerror) {
        var obj = _getInsertSql(key, record);
        transaction.executeSql(obj.sql, obj.params, onsuccess, onerror);
    };
    
    CreateProxy.prototype.insert = function(key, record, transaction, callback) {
        _save(this, key, record, transaction, _insert, callback);
    }

    var _getUpdateSql = function(key, record) {
        var params = [],
            where = "id = " + record.id,
            sets = "",
            sql, prop, value;

        for (prop in record) {
            if (prop == "id") {
                continue;
            }
            
            value = _formatValue(key, prop, record[prop]);

            if (value) {
                params.push(value);
                sets += prop + " = ?,";
            }
        }

        sets = sets.substr(0, sets.length - 1);
        sql = ["UPDATE", key, "SET", sets, "WHERE", where].join(" ");

        console.log(sql);
        return {
            sql: sql,
            params: params
        };
    };
    
    var _update = function(key, record, transaction, onsuccess, onerror) {
        var obj = _getUpdateSql(key, record);
        transaction.executeSql(obj.sql, obj.params, onsuccess, onerror);
    };
    
    CreateProxy.prototype.update = function(key, record, transaction, callback) {
        _save(this, key, record, transaction, _update, callback);
    }

    var _delete = function(key, where, transaction, onsuccess, onerror) {
        var sql = ["DELETE FROM", key, "WHERE", where].join(" ");
        transaction.executeSql(sql, [], onsuccess, onerror);
    };
    
    CreateProxy.prototype.delete = function(key, record, transaction, callback) {
        var id = typeof record === "object" ? record.id : record,
            total = 1,
            where, prop, fdmap;

        function onerror(err) {
            throw err.message;
        }
        
        function progress() {
            total--;
            if (total === 0) {
                where = "id = " + id;
                _delete(key, where, transaction, callback, onerror);
            }
        }
        
        for (prop in record) {
            fdmap = _maps[key][prop];
            if (fdmap && fdmap.hasMany) {
                total++;
                where = fdmap.foreignKey + " = " + id;
                _delete(fdmap.hasMany, where, transaction, progress, onerror);
                if (record[prop] instanceof SimpleDataSet) {
                    record[prop].clear();
                }
            }
        }
        
        progress();
    }

    CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        var self = this,
            total = toInsert.length + toUpdate.length + toDelete.length,
            cb = callback && typeof callback === "function" ? callback : function() {},
            errors = [],
            i;

        function progress(err) {
            total--;
            if (err) {
                errors.push(err);
            }
            if (total === 0) {
                cb(errors.length ? errors : null);
            }
        }

        if (!toInsert.length && !toUpdate.length && !toDelete.length) {
            return cb();
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
    
    var _fetch = function(key, record, property, callback) {
        var opts = { params: {} },
            fdmap;
        
        fdmap = _maps[key][property];

        if (fdmap.hasMany) {
            record[property] = new SimpleDataSet();
            
            opts.key = fdmap.hasMany;
            opts.params[fdmap.foreignKey] = record.id;
            
            this.getRecords(opts, function(results) {
                record[property].data = results;
                callback();
            });
        } else {
            callback();
        }
    };
    
    CreateProxy.prototype.fetch = function(key, records, property, callback) {
        var self = this,
            cb = typeof callback === "function" ? callback : function() {},
            total = records.length;
        
        function progress() {
            total--;
            if (total === 0) {
                cb();
            }
        }
        
        records.forEach(function(record) {
            _fetch.call(self, key, record, property, progress);
        });
    }
    
    return CreateProxy;
})();