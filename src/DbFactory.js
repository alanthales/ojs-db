/*
	Database Factory Utility Class
	Alan Thales, 09/2015
	Requires: DataSet.js, SimplePromise.js, LocalStorageProxy.js, SQLiteProxy.js, RestProxy.js
*/
var DbFactory = (function() {
	'use strict';

	function CreateFactory(proxyType, opts, synchronizer) {
		var _synchronizer = synchronizer,
			_proxy;
		
		this.proxy = function() { return _proxy; };
		this.synchronizer = function() { return _synchronizer; };
		
		if (proxyType && typeof proxyType === "object") {
			_proxy = proxyType;
			return;
		}
		
		switch(proxyType) {
			case 0:
				_proxy = new LocalStorageProxy();
				break;
			case 1:
				_proxy = new SQLiteProxy(opts);
				break;
			case 2:
				_proxy = new RestProxy(opts);
				break;
			default:
				throw "Proxy not implemented";
		}
	}

	CreateFactory.prototype.createDatabase = function(maps) {
		var defer = SimplePromise.defer();

		this.proxy().createDatabase(maps, function(err) {
			if (err) {
				defer.reject(err);
				return;
			}
			defer.resolve(true);
		});

		return defer;
	};

	CreateFactory.prototype.query = function(key, filters) {
		var defer = SimplePromise.defer();

		this.proxy().query(key, filters, function(err, records) {
			if (err) {
				defer.reject(err);
				return;
			}
			defer.resolve(records);
		});

		return defer;
	};
	
	CreateFactory.prototype.groupBy = function(key, options, groups, filters) {
		var defer = SimplePromise.defer();
		
		this.proxy().groupBy(key, options, groups, filters, function(err, records) {
			if (err) {
				defer.reject(err);
				return;
			}
			defer.resolve(records);
		});

		return defer;
	};
	
	CreateFactory.prototype.createDataSet = function(table) {
		// var fn = genIdFn || IdGenerators.TIMESTAMP;
		return new DataSet(table, this.proxy(), this.synchronizer());
	};

	var _save = function(key, toInsert, toUpdate, toDelete) {
		var defer = SimplePromise.defer();

		this.proxy().commit(key, toInsert, toUpdate, toDelete, function(err) {
			if (err) {
				defer.reject(err);
				return;
			}
			defer.resolve(true);
		});

		return defer;
	};

	CreateFactory.prototype.insert = function(key, toInsert) {
		return _save.call(this, key, toInsert, [], []);
	};

	CreateFactory.prototype.update = function(key, toUpdate) {
		return _save.call(this, key, [], toUpdate, []);
	};

	CreateFactory.prototype.delete = function(key, toDelete) {
		return _save.call(this, key, [], [], toDelete);
	};

	return CreateFactory;
})();