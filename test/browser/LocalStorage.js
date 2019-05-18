describe('LocalStorage', function() {
    before(function() {
       	this.db = new DbFactory(DbProxies.LOCALSTORAGE);
    });

    ProxyBehavior();
});