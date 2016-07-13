/*
    SQLite Proxy Class
    Autor: Alan Thales, 09/2015
    Requires: ArrayMap.js, DbProxy.js, Utils.js
*/
var SQLiteProxy = (function() {
    var _selectFrom = "SELECT * FROM";
    
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
    
//    CreateProxy.prototype.getFields = function(table) {
//        var index = _maps.indexOfKey("table", table);
//        return _maps[index].fields;
//    }
    
    CreateProxy.prototype.createDatabase = function(maps, callback) {
        var self = this,
            errorObj = null;
        
        self.maps = OjsUtils.cloneObject(maps);

        self.getDb().transaction(function(tx) {
            var cb = callback && typeof callback === "function" ? callback : function() {},
                total = self.maps.length,
                fields, field, table, prop, sql;

            function progress() {
                total--;
                if (total === 0) {
                    cb(errorObj);
                }
            }

            for (table in self.maps) {
                fields = "";
                
                for (prop in self.maps[table]) {
                    field = self.maps[table][prop];
                    
                    if (field.hasMany) {
                        continue;
                    }
                    
                    if (field.hasOne) {
                        field.type = self.maps[field.hasOne]["id"].type;
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

    var _select = function(key, sql, params, transaction, callback) {
        var self = this,
//            fields = self.getFields(key),
//            hashtable = fields.map(function(field) {
//                return field.name;
//            }),
            table = new ArrayMap(),
            i, l, record; //, field, index;

        transaction.executeSql(sql, params, function(tx, results) {
            l = results.rows.length;
            
            for (i = 0; i < l; i++) {
                record = results.rows.item(i);
//                for (field in record) {
//                    index = hashtable.indexOf(field);
//                    if (fields[index].serialize) {
//                        record[field] = JSON.parse(record[field], DbProxy.dateParser);
//                    }
//                }
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
        var key = options && options.key ? options.key : options,
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
        
        this.getDb().transaction(function(tx) {
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
        var opts = filters && typeof filters === "object" ? filters : { },
            select = [_selectFrom, key].join(" "),
            sql = _formatSql(select, opts);
        
        this.getDb().transaction(function(tx) {
            _select(key, sql, [], tx, callback);
        });
    }
    
    CreateProxy.prototype.groupBy = function(key, options, groups, filters, callback) {
        var sql = _formatGroupBy(key, options, groups, filters);
        
        this.getDb().transaction(function(tx) {
            _select(key, sql, [], tx, callback);
        });
    }

    var _getInsertSql = function(key, record, ignore) {
        var params = [],
            fields = "",
            values = "",
            prop, sql, value, fdmap;
        
        for (prop in record) {
            value = null;
            
            if (typeof record[prop] === "object") {
                fdmap = this.maps[key][prop];
                if (fdmap.hasOne) {
                    value = record[prop].id;
                }
            } else {
                value = record[prop];
            }

            if (value) {
                params.push(value);
                fields += prop + ",";
                values += "?,";
            }
        }

        fields = fields.substr(0, fields.length - 1);
        values = values.substr(0, values.length - 1);

        if (ignore) {
            sql = ["INSERT OR IGNORE INTO", key, "(", fields, ") VALUES (", values, ")"].join(" ");
        } else {
            sql = ["INSERT INTO", key, "(", fields, ") VALUES (", values, ")"].join(" ");
        }
        
        console.log(sql);
        
        return {
            sql: sql,
            params: params
        };
    };
    
    var _insert = function(key, record, transaction, callback) {
        var obj = _getInsertSql(key, record);
        transaction.executeSql(obj.sql, obj.params, callback, function(err) {
            console.log(err);
            console.log(arguments);
            callback(err);
        });
    };
    
    CreateProxy.prototype.insert = function(key, record, transaction, callback) {
        var total = 1,
            prop, fdmap, i, l;
        
        function progress(err) {
            total--;
            if (err) {
                console.log('insert errors:', JSON.stringify(err));
            }
            if (total === 0) {
                _insert(key, record, transaction, callback);
            }
        };
        
        for (prop in record) {
            fdmap = this.maps[key][prop];
            
            if (fdmap.hasMany) {
                l = record[prop].length;
                total += l;
                
                for (i = 0; i < l; i++) {
                    _insert(fdmap.hasMany, record[prop][i], transaction, progress);
                }
            }
        }
        
        progress();
    }

    var _getUpdateSql = function(key, record) {
        var params = [],
            where = "id = " + record.id,
            sets = "",
            prop, value, fdmap;

        for (prop in record) {
            value = null;
            
            if (prop == "id") {
                continue;
            }
            
            if (typeof record[prop] === "object") {
                fdmap = this.maps[key][prop];
                if (fdmap.hasOne) {
                    value = record[prop].id;
                }
            } else {
                value = record[prop];
            }

            if (value) {
                params.push(value);
                sets += prop + " = ?,";
            }
        }

        sets = sets.substr(0, sets.length - 1);

        return {
            sql: ["UPDATE", key, "SET", sets, "WHERE", where].join(" "),
            params: params
        };
    };
    
    var _update = function(key, record, transaction, callback) {
        var iobj = _getInsertSql(key, record, true),
            uobj = _getUpdateSql(key, record);
        
        function onerror(err) {
            callback(err);
        }
        
        transaction.executeSql(iobj.sql, iobj.params, function(tx) {
            transaction.executeSql(uobj.sql, uobj.params, callback, onerror);
        }, onerror);
    };
    
    CreateProxy.prototype.update = function(key, record, transaction, callback) {
        var total = 1,
            prop, fdmap, i, l;
        
        function progress(err) {
            total--;
            if (err) {
                console.log('update errors:', JSON.stringify(err));
            }
            if (total === 0) {
                _update(key, record, transaction, callback);
            }
        };
        
        for (prop in record) {
            fdmap = this.maps[key][prop];
            
            if (fdmap.hasMany) {
                l = record[prop].length;
                total += l;
                
                for (i = 0; i < l; i++) {
                    _update(fdmap.hasMany, record[prop][i], transaction, progress);
                }
            }
        }
        
        progress();
    }

    var _delete = function(key, where, transaction, callback) {
        var sql = ["DELETE FROM", key, "WHERE", where].join(" ");
        transaction.executeSql(sql, [], callback, function(err) {
            callback(err);
        });
    };
    
    CreateProxy.prototype.delete = function(key, record, transaction, callback) {
        var id = typeof record === "object" ? record.id : record,
            total = 1,
            where, prop, fdmap;

        function progress(err) {
            total--;
            if (err) {
                console.log('delete errors:', JSON.stringify(err));
            }
            if (total === 0) {
                where = "id = " + id;
                _delete(key, where, transaction, callback);
            }
        }
        
        for (prop in record) {
            fdmap = this.maps[key][prop];
            if (fdmap.hasMany) {
                total++;
                where = fdmap.foreignKey + " = " + id;
                _delete(fdmap.hasMany, where, transaction, progress);
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
    
    return CreateProxy;
})();