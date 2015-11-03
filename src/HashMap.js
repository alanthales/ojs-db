/*
    HashMap Class
    Autor: Alan Thales, 10/2015
*/
var HashMap = (function() {
    function HashMap() {
        var collection = [];

        collection = (Array.apply( collection, arguments ) || collection);

        collection.__proto__ = HashMap.prototype;

        collection.mapTable = function(key) {
            return this.map(function(item) {
                return item[key];
            });
        }

        collection.indexOfKey = function(key, value) {
            return this.mapTable(key).indexOf(value);
        }

        collection.put = function(obj, index) {
            var i = index || this.length;
            this[i] = obj;
        }

        collection.putRange = function(arr) {
            for (var i = 0; i < arr.length; i++) {
                this.put(arr[i], i);
            }
        }

        return collection;
    }
    
    HashMap.prototype = new Array;
    
    return HashMap;
})();