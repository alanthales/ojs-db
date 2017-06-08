/*
	SQLite Proxy Class
	Alan Thales, 09/2015
	Requires: DbProxy.js, ArrayMap.js, OjsUtils.js, SimpleDataSet.js, ChildRecord.js
*/
var SQLiteProxy = (function(exports) {
	'use strict';

	var _selectFrom = "SELECT * FROM",
		_maps = {};
	
	function CreateProxy(options) {
		var db = null, opts = {},
			cordova = typeof window.cordova !== "undefined";
		
		if (typeof options === "object") {
			opts.name = options.name;
			opts.location = options.location || "default";
		} else {
			opts.name = options;
		}

		if (cordova) {
			document.addEventListener('deviceready', init);
		} else {
			init();
		}

		function init() {
			if (window.sqlitePlugin) {
				db = window.sqlitePlugin.openDatabase(opts);
			} else {
				db = window.openDatabase(opts.name, "SQLite Database", "1.0", 5*1024*1024);
			}
		}

		this.getDb = function() { return db; };
		
		DbProxy.apply(this, arguments);
	}

	exports.SQLiteProxy = CreateProxy;
	
	CreateProxy.prototype = Object.create(DbProxy.prototype);
	
	CreateProxy.prototype.createDatabase = function(maps, callback) {
		var self = this;
		
		_maps = OjsUtils.cloneObject(maps);
		
		self.getDb().transaction(function(tx) {
			var cb = callback && typeof callback === "function" ? callback : function() {},
				total = Object.keys(_maps).length,
				fields, field, table, prop, sql;

			function progress() {
				total--;
				if (total === 0) {
					cb();
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
						field.type = _maps[field.hasOne].id.type;
					}
					
					fields += [
						prop, field.type, (field.required ? "NOT NULL" : ""), (field.primaryKey ? "PRIMARY KEY" : ""), ","
					].join(" ");
				}

				fields = fields.substr(0, fields.length - 1);
				sql = ["CREATE TABLE IF NOT EXISTS", table, "(", fields, ")"].join(" ");

				tx.executeSql(sql, [], progress);
			}
		}, function(err) {
			cb(err);
		});
	};

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
			value = typeof record[key] === undefined ? null : record[key];

		if (fdmap.hasOne && record instanceof ChildRecord) {
			value = record.master().id;
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
		}, function(tx, err) {
			console.error( err.message );
			callback(err);
		});
	};
	
	var _orderBy = function(sorters) {
		var result = [],
			field;
		for (field in sorters) {
			result.push(field + " " + sorters[field]);
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
			
			if (options.skip) {
				sql.push("OFFSET " + options.skip);
			}
			
			if (options.limit) {
				sql.push("LIMIT " + options.limit);
			}
		} else {
			sql = [_selectFrom, options];
		}
		
		self.getDb().transaction(function(tx) {
			_select(key, sql.join(" "), [], tx, callback);
		});
	};

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
			alias = opt.alias || field;
			
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
			sql = filters && typeof filters === "function" ? filters() : _formatSql(select, opts);
		
		self.getDb().transaction(function(tx) {
			_select(key, sql, [], tx, callback);
		});
	};
	
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
			}, function(tx, err) {
				console.error( err.message );
				callback(err);
			});
		});
	};

	var _save = function(key, record, transaction, operationFn, callback) {
		var self = this,
			total = 1;
		
		operationFn(key, record, transaction, saveChildren);

		function saveChildren() {
			var inserteds = new ArrayMap(),
				updateds = new ArrayMap(),
				deleteds = new ArrayMap(),
				prop, fdmap, items;

			for (prop in record) {
				fdmap = _maps[key][prop];
				
				if (fdmap && fdmap.hasMany) {
					items = record[prop];
					
					if (items instanceof SimpleDataSet) {
						total++;
						inserteds.putRange( items._inserteds );
						updateds.putRange( items._updateds );
						deleteds.putRange( items._deleteds );

						items._cleanCache();
						self.insert(fdmap.hasMany, inserteds, transaction, updateFn);
						
						function updateFn() {
							self.update(fdmap.hasMany, updateds, transaction, deleteFn);
						}
						
						function deleteFn() {
							self.delete(fdmap.hasMany, deleteds, transaction, done);
						}
					}
				}
			}

			done();
		}

		function done() {
			total--;
			if (total === 0) {
				callback();
			}
		}
	};
	
	var _getInsertSql = function(key, record) {
		var params = [],
			fields = "",
			values = "",
			prop, sql, value, fdmap;
		
		for (prop in _maps[key]) {
			fdmap = _maps[key][prop];

			if (!fdmap || fdmap.hasMany) {
				continue;
			}
			
			value = _formatValue(key, prop, record);
			
			if (value !== undefined) {
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
		transaction.executeSql(obj.sql, obj.params, callback);
	};
	
	CreateProxy.prototype.insert = function(key, records, transaction, callback) {
		var self = this,
			l = records.length,
			i = 0;
		
		if (l === 0) return callback();
		
		for (; i < l; i++) {
			progress(records[i], i);
		}

		function progress(record, index) {
			_save.call(self, key, record, transaction, _insert, function() {
				if (index === (l - 1)) {
					callback();
				}
			});
		}
	};

	var _getUpdateSql = function(key, record) {
		var params = [],
			where = "id = '" + record.id + "'",
			sets = "",
			sql, prop, value, fdmap;

		for (prop in _maps[key]) {
			fdmap = _maps[key][prop];

			if (prop == "id" || !fdmap || fdmap.hasMany) {
				continue;
			}
			
			value = _formatValue(key, prop, record);
			sets += prop + " = ?,";
			params.push(value);
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
		transaction.executeSql(obj.sql, obj.params, callback);
	};
	
	CreateProxy.prototype.update = function(key, records, transaction, callback) {
		var self = this,
			l = records.length,
			i = 0;
		
		if (l === 0) return callback();
		
		for (; i < l; i++) {
			progress(records[i], i);
		}

		function progress(record, index) {
			_save.call(self, key, record, transaction, _update, function() {
				if (index === (l - 1)) {
					callback();
				}
			});
		}
	};

	var _delete = function(key, record, transaction, callback) {
		var id = typeof record === "object" ? record.id : record,
			total = 1,
			sql, prop, fdmap;

		for (prop in record) {
			fdmap = _maps[key][prop];
			if (fdmap && fdmap.hasMany) {
				total++;
				sql = ["DELETE FROM ", fdmap.hasMany, " WHERE ", fdmap.foreignKey, " = '", id, "'"].join("");
				transaction.executeSql(sql, [], progress);
				if (record[prop] instanceof SimpleDataSet) {
					record[prop].clear();
				}
			}
		}
		
		function progress() {
			total--;
			if (total === 0) {
				sql = ["DELETE FROM ", key, " WHERE id = '", id, "'"].join("");
				transaction.executeSql(sql, [], function() {
					callback();
				});
			}
		}

		progress();
	};
	
	CreateProxy.prototype.delete = function(key, records, transaction, callback) {
		var self = this,
			l = records.length,
			i = 0;
		
		if (l === 0) return callback();
		
		for (; i < l; i++) {
			progress(records[i], i);
		}

		function progress(record, index) {
			_delete.call(self, key, record, transaction, function() {
				if (index === (l - 1)) {
					callback();
				}
			});
		}
	};

	CreateProxy.prototype.commit = function(key, toInsert, toUpdate, toDelete, callback) {
		var self = this,
			cb = callback && typeof callback === "function" ? callback : function() {};

		if (!toInsert.length && !toUpdate.length && !toDelete.length) {
			return cb();
		}

		self.getDb().transaction(beginTransaction, function(err) {
			console.error(err.message);
			cb(err);
		});

		function beginTransaction(tx) {
			self.insert(key, toInsert, tx, updateFn);

			function updateFn() {
				self.update(key, toUpdate, tx, deleteFn);
			}

			function deleteFn() {
				self.delete(key, toDelete, tx, cb);
			}
		}
	};
	
	var _fetch = function(key, record, property, callback) {
		var opts = { params: {} },
			fdmap = _maps[key][property],
			i, l, child;

		if (record[property] instanceof SimpleDataSet || !fdmap || !fdmap.hasMany) {
			return callback();
		}

		opts.key = fdmap.hasMany;
		opts.params[fdmap.foreignKey] = record.id;
		
		this.getRecords(opts, function(err, results) {
			if (err) {
				return callback(err);
			}
			
			record[property] = new SimpleDataSet(key);
			
			i = 0; l = results.length;
			
			for (; i < l; i++) {
				child = new ChildRecord(record);
				OjsUtils.cloneProperties(results[i], child);
				record[property].data.push(child);
			}
			
			callback();
		});
	};
	
	CreateProxy.prototype.fetch = function(key, dataset, property, callback) {
		var cb = typeof callback === "function" ? callback : function() {},
			total = dataset.data.length,
			self = this,
			i = 0;
		
		if (total === 0) {
			return cb();
		}
		
		for (; i < total; i++) {
			progress(dataset.data[i], i);
		}

		function progress(record, index) {
			_fetch.call(self, key, record, property, function(err) {
				if (index === (total - 1)) {
					cb(err);
				}
			});
		}
	};

	CreateProxy.prototype.clear = function(key, callback) {
		var cb = typeof callback === "function" ? callback : function() {},
			total = 1,
			sql, prop;

		this.getDb().transaction(beginTransaction, cb);

		function beginTransaction(transaction) {
			for (prop in _maps[key]) {
				if (_maps[key][prop].hasMany) {
					total++;
					sql = ["DELETE FROM ", _maps[key][prop].hasMany].join("");
					transaction.executeSql(sql, [], progress);
				}
			}

			function progress() {
				total--;
				if (total === 0) {
					transaction.executeSql("DELETE FROM " + key, [], function() {
						cb();
					});
				}
			}

			progress();
		}
	};
	
	return CreateProxy;
})(this);