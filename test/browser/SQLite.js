describe('SQLite', function() {
    var maps = {
        test: {
            id: { type: 'int', primaryKey: true },
            name: { type: 'string', notNull: true }
        }
    };

    before(function(done) {
       	this.db = new DbFactory(DbProxies.SQLITE, "testDb");
        this.db.createDb(maps).then(function() {
            done();
        });
    });

    ProxyBehavior();
});