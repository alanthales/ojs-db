var expect = require('chai').expect;
var ojs = require('../build/ojs-db');
var DbFactory = ojs.DbFactory;
var DbProxies = ojs.DbProxies;
var DataSet = ojs.DataSet;

describe('DbFactory', function() {
	var db = new DbFactory(DbProxies.LOCALSTORAGE);

	describe('#constructor', function() {
		it('should return a DbFactory instance', function() {
			expect(db).to.be.an.instanceof(DbFactory);
		});
	});

	describe('#dataset()', function() {
		it('should return a DataSet instance', function() {
			var dts = db.dataset('test');
			expect(dts).to.be.an.instanceof(DataSet);
		});
	});
});