/*
    SQLite Proxy Class
    Autor: Alan Thales, 09/2015
    Requires: ArrayMap.js, DbProxy.js
*/
var SQLiteProxy = (function() {
    var _maps = new ArrayMap(),
        _selectFrom = "SELECT * FROM";
    
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
    
    CreateProxy.prototype.getFields = function(table) {
        var index = _maps.indexOfKey("table", table);
        return _maps[index].fields;
    }
    
    CreateProxy.prototype.createDatabase = function(maps, callback) {
        _maps.length = 0;
        _maps.putRange(maps);

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

    var _select = function(key, sql, params, transaction, callback) {
        var fields = self.getFields(key),
            hashtable = fields.map(function(field) {
                return field.name;
            }),
            table = new ArrayMap(),
            i, record, field, index;

        transaction.executeSql(sql, params, function(tx, results) {
            for (i = 0; i < results.rows.length; i++) {
                record = results.rows.item(i);
                for (field in record) {
                    index = hashtable.indexOf(field);
                    if (fields[index].serialize) {
                        record[field] = JSON.parse(record[field], DbProxy.dateParser);
                    }
                }
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

    CreateProxy.prototype.insert = function(key, record, transaction, callback) {
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

    CreateProxy.prototype.update = function(key, record, transaction, callback) {
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

    CreateProxy.prototype.delete = function(key, record, transaction, callback) {
        var id = typeof record === "object" ? record.id : record,
            where = "id = " + id,
            sql;

        sql = ["DELETE FROM", key, "WHERE", where].join(" ");

        transaction.executeSql(sql, [], callback);
    }

    CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
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
    
    return CreateProxy;
})();