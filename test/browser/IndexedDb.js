describe("IndexedDB", function() {
  var config = {
    name: "testDb",
    version: 1,
    schema: {
      test: {
        name: { unique: true }
      }
    }
  };

  before(function(done) {
    this.db = new DbFactory(DbProxies.INDEXEDDB, config);

    if (!window.indexedDB) {
      console.log("browser not support IndexedDB");
      return done();
    }

    this.db
      .createDb()
      .then(done)
      .catch(function(err) {
        console.log(err);
      });
  });

  if (!!window.indexedDB) {
    ProxyBehavior();
  }
});
