/*
    SQLite Proxy Class
    Autor: Alan Thales, 09/2015
    Requires: DbProxy.js, ArrayMap.js, Utils.js, SimpleDataSet.js, ChildRecord.js
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
        
        DbProxy.prototype.createDatabase.apply(this, arguments);
        
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

    var _formatValue = function(table, key, record) {
        var fdmap = _maps[table][key],
            value = record[key];

        if (!fdmap || fdmap.hasMany) {
            return null;
        }
        
        if (fdmap.hasOne && record instanceof ChildRecord) {
            value = record.getRecMaster().id;
        }
        
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
                callback( null, table );
            }
        }, function(tx, errors) {
            console.error( JSON.stringify(errors) );
            callback(errors);
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
        var self = this,
            key = options && options.key ? options.key : options,
            sortBy = options && options.sort ? _orderBy(options.sort) : "",
            where = "WHERE ",
            sql = [], p;
        
        if (typeof options === "object") {
            sql = [_selectFrom, options.key];
            if (options.params) {
                for (p in options.params) {
                    where += p + " = '" + options.params[p] + "'";
                }
                sql.push(where);
            }
            sql.push(sortBy);
            if (options.limit) {
                sql.push("LIMIT " + options.limit);
            }
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
            if (typeof filters[field] !== "object") {
                where += [field, " = '", filters[field], "'"].join("") + " AND ";
                continue;
            }
            
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
            
        return sql + " GROUP BY " + groupBy.trim().slice(0, -1);
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
            sql = _formatGroupBy(key, options, groups, filters),
            table = new ArrayMap(),
            i, l;
        
        self.getDb().transaction(function(transaction) {
            transaction.executeSql(sql, [], function(tx, results) {
                l = results.rows.length;

                for (i = 0; i < l; i++) {
                    table.push(results.rows.item(i));
                }

                if (typeof callback === "function") {
                    callback( null, table );
                }
            }, function(tx, errors) {
                console.error( JSON.stringify(errors) );
                callback(errors);
            });
        });
    }

    var _save = function(key, record, transaction, operationFn, callback) {
        var total = 1,
            prop, fdmap, items;//, i, l;
        
        function progress(tx, err) {
            if (err) {
                console.error( JSON.stringify(err) );
            }
            total--;
            if (total === 0) {
                if (items && items instanceof SimpleDataSet) {
                    items._cleanCache();
                }
                operationFn(key, record, transaction, callback);
            }
        };
        
        for (prop in record) {
            fdmap = _maps[key][prop];
            
            if (fdmap && fdmap.hasMany) {
                items = record[prop];
                
                if (items instanceof SimpleDataSet) {
                    total += items._inserteds.length + items._updateds.length + items._deleteds.length;
                    
                    if (items._inserteds.length) {
                        this.insert(fdmap.hasMany, items._inserteds, transaction, progress);
                    }
                    
                    if (items._updateds.length) {
                        this.update(fdmap.hasMany, items._updateds, transaction, progress);
                    }
                    
                    if (items._deleteds.length) {
                        this.delete(fdmap.hasMany, items._deleteds, transaction, progress);
                    }
                }
            }
        }

        progress();
    };
    
    var _getInsertSql = function(key, record) {
        var params = [],
            fields = "",
            values = "",
            prop, sql, value;
        
        for (prop in _maps[key]) {
            value = _formatValue(key, prop, record);
            if (value) {
                params.push(value);
                fields += prop + ",";
                values += "?,";
            }
        }

        fields = fields.substr(0, fields.length - 1);
        values = values.substr(0, values.length - 1);

        sql = ["INSERT INTO", key, "(", fields, ") VALUES (", values, ")"].join(" ");
        
        return {
            sql: sql,
            params: params
        };
    };

    var _insert = function(key, record, transaction, callback) {
        var obj = _getInsertSql(key, record);
        transaction.executeSql(obj.sql, obj.params, callback, callback);
    };
    
    CreateProxy.prototype.insert = function(key, records, transaction, callback) {
        var l = records.length,
            i = 0;
        
        if (l === 0) return callback();
        
        for (; i < l; i++) {
            _save.call(this, key, records[i], transaction, _insert, callback);
        }
    }

    var _getUpdateSql = function(key, record) {
        var params = [],
            where = "id = '" + record.id + "'",
            sets = "",
            sql, prop, value;

        for (prop in _maps[key]) {
            if (prop == "id") {
                continue;
            }
            
            value = _formatValue(key, prop, record);

            if (value) {
                params.push(value);
                sets += prop + " = ?,";
            }
        }

        sets = sets.substr(0, sets.length - 1);
        sql = ["UPDATE", key, "SET", sets, "WHERE", where].join(" ");

        return {
            sql: sql,
            params: params
        };
    };
    
    var _update = function(key, record, transaction, callback) {
        var obj = _getUpdateSql(key, record);
        transaction.executeSql(obj.sql, obj.params, callback, callback);
    };
    
    CreateProxy.prototype.update = function(key, records, transaction, callback) {
        var l = records.length,
            i = 0;
        
        if (l === 0) return callback();
        
        for (; i < l; i++) {
            _save.call(this, key, records[i], transaction, _update, callback);
        }
    }

    var _delete = function(key, record, transaction, callback) {
        var id = typeof record === "object" ? record.id : record,
            total = 1,
            sql, prop, fdmap;

        function progress(tx, err) {
            if (err) {
                console.error( JSON.stringify(err) );
            }
            total--;
            if (total === 0) {
                sql = ["DELETE FROM ", key, " WHERE id = '", id, "'"].join("");
                transaction.executeSql(sql, [], callback, callback);
            }
        }
        
        for (prop in record) {
            fdmap = _maps[key][prop];
            if (fdmap && fdmap.hasMany) {
                total++;
                sql = ["DELETE FROM ", fdmap.hasMany, " WHERE ", fdmap.foreignKey, " = '", id, "'"].join("");
                transaction.executeSql(sql, [], progress, progress);
                if (record[prop] instanceof SimpleDataSet) {
                    record[prop].clear();
                }
            }
        }
        
        progress();
    };
    
    CreateProxy.prototype.delete = function(key, records, transaction, callback) {
        var l = records.length,
            i = 0;
        
        if (l === 0) return callback();
        
        for (; i < l; i++) {
            _delete.call(this, key, records[i], transaction, callback);
        }
    }

    CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
        var self = this,
            total = toInsert.length + toUpdate.length + toDelete.length,
            cb = callback && typeof callback === "function" ? callback : function() {},
            errors = [];

        function progress(tx, err) {
            total--;
            if (err) {
                errors.push(err);
                console.error( JSON.stringify(err) );
            }
            if (total === 0) {
                cb(errors.length ? errors : null);
            }
        }

        if (!toInsert.length && !toUpdate.length && !toDelete.length) {
            return cb();
        }
        
        self.getDb().transaction(function(tx) {
            if (toInsert.length) {
                self.insert(key, toInsert, tx, progress);
            }

            if (toUpdate.length) {
                self.update(key, toUpdate, tx, progress);
            }

            if (toDelete.length) {
                self.delete(key, toDelete, tx, progress);
            }
        });
    }
    
    var _fetch = function(key, master, record, property, callback) {
        var opts = { params: {} },
            fdmap = _maps[key][property],
            i = 0,
            l, child;

        if (fdmap && fdmap.hasMany) {
            opts.key = fdmap.hasMany;
            opts.params[fdmap.foreignKey] = record.id;
            
            this.getRecords(opts, function(results) {
                record[property] = new SimpleDataSet();
                
                l = results.length;
                
                for (; i < l; i++) {
                    child = new ChildRecord(master, record);
                    OjsUtils.cloneProperties(results[i], child);
                    record[property].data.push(child);
                }
                
                callback();
            });
        } else {
            callback();
        }
    };
    
    CreateProxy.prototype.fetch = function(key, dataset, property, callback) {
        var cb = typeof callback === "function" ? callback : function() {},
            total = dataset.data.length,
            i = 0;
        
        if (total === 0) {
            cb();
            return;
        }
        
        function progress() {
            total--;
            if (total === 0) {
                cb();
            }
        }
        
        for (; i < total; i++) {
            _fetch.call(this, key, dataset, dataset.data[i], property, progress);
        }
    }
    
    return CreateProxy;
})();