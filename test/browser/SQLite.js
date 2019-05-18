describe("SQLite", function() {
  var config = {
    name: "testDb",
    version: "1.0",
    schema: {
      test: {
        id: { type: "int", primaryKey: true },
        name: { type: "string", notNull: true }
      }
    }
  };

  before(function(done) {
    this.db = new DbFactory(DbProxies.SQLITE, config);
    this.db
      .createDb()
      .then(done)
      .catch(function(err) {
        console.log(err);
      });
  });

  ProxyBehavior();
});
