## ojs-db
A reactive framework to persist data in browser, mobile phone, cloud or anywhere. You can define where to write the data through proxies, develop offline first app's and more. **100% JavaScript, no binary dependency**. Simple API and easy to use.

## Installation
The installation is simple, you can download and linking js files directily in your page:

```html
<script src="build/ojs-db.min.js"></script>
```

Or use bower:

```
bower install https://github.com/alanthales/ojs-db.git --save
```

## API
It is simple and intuitive to use.

* <a href="#using-arraymap-for-your-needs">Using ArrayMap for your needs</a>
* <a href="#creating-a-factory-and-a-dataSet">Creating a Factory and a DataSet</a>
* <a href="#open-a-dataset-to-work-with">Open a DataSet to work with</a>
* <a href="#saving-records">Saving records</a>
* <a href="#removing-records">Removing records</a>
* <a href="#filtering-in-memory-records">Filtering in memory records</a>
* <a href="#finding-records-directly-from-source">Finding records directly from source</a>
  * <a href="#basic-querying">Basic Querying</a>
  * <a href="#operators">Operators</a>
  * <a href="#group-by">Group By</a>

### Using ArrayMap for your needs
`ArrayMap` is a powerfull class that extends of `Array` to query, group and order data, and get an element index by one of your attributes. That class is used in entire framework e to you use that, just instantiate and fill it with data. See:

```javascript
var array = new ArrayMap();

// Put a object.
array.put({ key: 'value' });

// Put a array object
var elements = [{key: 'key1'}, {key: 'key2'}, {key: 'key3'}];
array.putRange(elements);

// Query, group and order by
var q = array.query({ key: 'key1' }) // 'q' contains { key: 'key1' }
  , g = array.groupBy({ $max: 'key' }, []); // 'g' contains { key: 'key3' }
  
array.orderBy({ key: 'desc' }); // array have now reverse order

// Get an element index by your attributes
var index = array.indexOfKey('key', 'key2'); // 'index' = 1

// You can looping like an javascript Array
for (var i = 0; i < array.length; i++) {
    console.log(array[i]);
}
for (var obj in array) {
    console.log(obj);
}
```

### Creating a Factory and a DataSet
You can use **ojs-db** as an in-memory only database or as a persistent database. The factory is a class to create dataset's, the dataset's persist data through proxies. Each proxy may persist data according to your needs. There are 3 proxies already implemented and you can implement your own proxy. Are they:

* `LocalStorageProxy`: To persist data in browser LocalStorage.
* `SQLiteProxy`: To persist data in browser SQLite or SQLite datase in mobile phones, if using cordova sqlite plugin.
* `RestProxy`: To persist data in a webservice.

The constructor is used as follows `new ojsDb(proxy, options, synchronizer)` where:
* `proxy` (required): is a proxy instance, or an enum representing the proxy that will be instantiated (`DbProxies.LOCALSTORAGE`, `DbProxies.SQLITE`, `DbProxies.RESTFUL`).
* `options` (optional): is an object with the settings for the proxy, case use an enum to instantiate.
* `synchronizer` (optional): is a SyncDb instance to synchronizing local data with cloud or another place.


```javascript
// Type 1: LocalStorageProxy
var db = new ojsDb(DbProxies.LOCALSTORAGE);

// Type 2: SQLiteProxy
var db = new ojsDb(DbProxies.SQLITE, "DatabaseName");
db.createDatabase(maps);

// Type 3: RestProxy
var db = new ojsDb(DbProxies.RESTFUL, { url: "http://myserver" });

// Type 4: Your own proxy
var proxy = new MyProxy(config)
  , db = new ojsDb(proxy);
```

The dataset is the class that search , insert, remove and change records. In general you will have only one factory in the application, but many dataset's. Look:

```javascript
// Creating a Factory.
var db = new ojsDb(DbProxies.LOCALSTORAGE);

// Creating DataSet's.
var products = db.createDataSet("products")
  , clients = db.createDataSet("clients")
  , users = db.createDataSet("users");
```

### Open a DataSet to work with
The DataSet's contains the methods below:

* `limit`: method to set the quantity of records returned from proxy.
* `sort`: method to set the records ordering based in properties of object passed.
* `data`: property that contains all records returned after call `open`. Note: `data` is type of [ArrayMap](src/ArrayMap.js) and you can use any of your methods.

See examples below:

```javascript
products.limit(50).open(); // open and get the firsts 50 records.

clients
  .sort({ name: 'asc', age: 'desc' })
  .open()
  .then(); // open and gets the records sorted by name and age of high to low
```

### Saving records
The types of data are based on proxy, then the proxy is responsible for serialize and de-serialize the data.

If the record does not contain an `id` field, **ojs-db** will automatically generated one for you. The `id` of a record, once set, can be modified at your own risk.

```javascript
var products = db.createDataSet("products")
  , p = { description: "Computer", value: 200.00 };

products.save(p);
```

The `save` method is used both to insert and to update a record. If you only call `save`, the data was change only in memory, you have to call `post` to persist data to proxy.

```javascript
products.save(p); // memory only.
products.post().then(); // persist data.
```

### Removing records
`dataset.remove(record)` where `record` is the object to remove. Note: `remove` delete the record from memory only, you must call `post` to persist changes to proxy. See:

```javascript
persons.remove(record); // memory only.
persons.post().then(); // persist data.
```

### Filtering in memory records
The DataSet class contains a method `filter` that works in same way of `db.query` (see below), the only difference is that the data are obtained from memory, and not returned directly from the proxy. See:

```javascript
// Finding the persons with age greather than 21
var results = persons.filter({ age: { $gt: 21 } });
console.log(results); // output: [{ id: '2', name: 'Aron', age: 30 }, { id: '3', name: 'John', age: 31 }]

// To get one specific record use "getById" method
var record = persons.getById(3);
```

### Finding records directly from source
ojsDb class utilize the proxies to access data directly from source. The `query` method, find for multiple records that matching your search, you can select records based on field equality or use comparison operators (`$lt`, `$lte`, `$gt`, `$gte`, `$start`, `$end`, `$contain`, `$in`, `$custom`). See below for the syntax. Note: The `dataset.filter` method works in same way that examples below.

#### Basic querying
Basic querying means are searching for records whose fields match the ones you specify. Note: Basic querying works in same way to all proxies.

```javascript
// Let's say our database contains the following collection named 'persons'
// { id: '1', name: 'Joe', age: 17  }
// { id: '2', name: 'Aron', age: 30 }
// { id: '3', name: 'John', age: 31 }
// { id: '4', name: 'Matt', age: 17 }
// { id: '5', name: 'Jonh', age: 25 }

// Finding all persons with age equal 17
db.query('persons', { age: 17 }).then(function (results) {
  // 'results' is an array containing records 'Joe' and 'Matt'
  // If no record is found, 'results' is equal to []
});

// Finding all persons with name equal 'John' and age equal 25
db.query('persons', { name: 'John', age: 25 }).then(function (results) {
  // 'results' is an array containing record 5 only
});
```

Note: The array objects returned by methods query and groupBy, is not an standard `Array`, see [ArrayMap](src/ArrayMap.js).

#### Operators
The syntax is `{ field: { $op: value } }` where `$op` is any comparison operator ($lt, $lte, $gt, $gte, $start, $end, $contain, $in):

* `$lt`, `$lte`: less than, less than or equal
* `$gt`, `$gte`: greater than, greater than or equal
* `$start`: checks the record `field` start's with `value`
* `$end`: checks the record `field` end's with `value`
* `$contain`: checks the record `field` contains any of values in `value`. `value` must be an array
* `$in`: member of. `value` must be an array of values

```javascript
// $lt, $lte, $gt and $gte work on numbers, dates and strings. When used with strings, lexicographical order is used
db.query('persons', { age: { $gt: 17 } }).then(function (results) {
  // 'results' contains all records except id's 1 and 4
});

// Using $start. $end and $contain is used in same way
db.query('persons', { name: { $start: 'Jo' }}).then(function (results) {
  // 'results' contains Joe, John (3) and John (5)
});

// Using $in
db.query('persons', { age: { $in: [30,31] }}).then(function (results) {
  // 'results' contains Aron and John (3)
});

// Using $custom
function compareTo(record) {
    var regx = /[^0-9]/g;
    return regx.test(record.name);
};

db.query('persons', compareTo).then(function (results) {
  // 'results' contains all records, because the regular expression find any name NOT between 0 at 9.
});
```

#### Group By
The syntax is `{ { $op: field, alias: aliasName }, groups, filters }` where `$op` is any group by operator ($max, $min, $sum, $avg, $count), `alias` is the property with grouped values in resulting records, `groups` is an array of columns to group by and `filters` is an query object to filter the records (same as above). See the `$op` operators:

* `$max`: get the maximum value in dataset. `field` is the column to which the maximum value will be returned
* `$min`: get the minimum value in dataset. `field` is the column to which the minimum value will be returned
* `$sum`: sum all `field` in dataset records. `field` is the column to which to sum
* `$avg`: gets average `field` in dataset records. `field` is the column to which to average
* `$count`: count the number of records in dataset with same `field`. `field` is the column to which to count (see example below)

```javascript
// $max and $min work on numbers, dates and strings. When used with strings, lexicographical order is used
db.groupBy('persons', { $max: 'age' }, [], {}).then(function (results) {
  // 'results' contains an array with the following structure:
  // { age: 31 }
});

// Using $sum. $avg and $count is used in same way
db.groupBy('persons', { $sum: 'age' }, [], {}).then(function (results) {
  // 'results' contains an array with the following structure:
  // { age: 120 }
});

// Getting results with alias
db.groupBy('persons', [{ $max: 'age', alias: 'max' }, { $min: 'age', alias: 'min' }], [], {}).then(function (results) {
  // 'results' contains an array with the following structure:
  // { max: 31, min: 17 }
});

// Group by one or many columns
db.groupBy('persons', { $sum: 'age', alias: 'sum' }, ['name'], {}).then(function (results) {
  // 'results' contains an array with the following structure:
  // { name: 'Joe', sum: 17  }
  // { name: 'Aron', sum: 30 }
  // { name: 'John', sum: 56 }
  // { name: 'Matt', sum: 17 }
});
```

## License 

See [License](LICENSE)