var ProxyBehavior = (function(exports) {
    exports.ProxyBehavior = function() {
        var record = {id: 1, name: 'test'},
            dts;

        before(function() {
            this.db.proxy().clear('test');
        });

        beforeEach(function() {
            dts = this.db.dataset('test');
            dts._active = true;
        });

        describe('#open()', function() {
            it('should open dataset and return no data', function() {
                dts.close();
                return dts.open().then(function(dataset) {
                    expect(dataset.data()).to.have.lengthOf(0);
                    expect(dataset.active()).to.be.true;
                });
            });
        });

        describe('#post():insert', function() {
            it('should save records through proxy', function() {
                dts.save(record);
                return dts.post().then(function(ok) {
                    expect(ok).to.equal(true);
                    expect(dts.data()).to.have.lengthOf(1);
                });
            });
        });

        describe('#post():update', function() {
            it('should save changes to record and persist through proxy', function() {
                var newR;
                dts.save({id: 1, name: 'new test'});
                return dts.post().then(function(ok) {
                    expect(ok).to.equal(true);
                    newR = dts.get(1);
                    expect(newR.name).to.equal('new test');
                });
            });
        });

        describe('#post():delete', function() {
            it('should delete records through proxy', function() {
                dts.delete(record);
                return dts.post().then(function(ok) {
                    expect(ok).to.equal(true);
                    expect(dts.data()).to.have.lengthOf(0);
                });
            });
        });

        describe('#cancel()', function() {
            it('should insert records and so cancel changes', function() {
                dts.save(record)
                    .save({ id: 2, name: 'new test' });
                expect(dts.data()).to.have.lengthOf(2);
                dts.cancel();
                expect(dts.data()).to.have.lengthOf(0);
            });
        });

        describe('#clear()', function() {
            it('should clear all records through proxy and return no data', function() {
                return dts.clear()
                    .then(function(dataset) {
                        return dataset.open();
                    })
                    .then(function() {
                        expect(dts.data()).to.have.lengthOf(0);
                    });
            });
        });
    };

    return exports.ProxyBehavior;
})(this);