## ojs-db
A JavaScript database to persist data in browser, mobile phone, cloud or anywhere. You define where to write the data through proxies. **100% JavaScript, no binary dependency**. API is simple and easy to use.

## Installation, tests
The installation is simple, you can download and linking js files directily in your page using `script` tag or do that:

* Clone the project.
* Install uglifyjs to minify and compact the code.
* Go to project directory and compile.
* Link the minified file generated in your page.

```
git clone https://github.com/alanthales/ojs-db.git
npm install -g uglify-js
cd ojs-db
make
```

```javascript
<script src="ojs-db.min.js"></script>
```

## API
It is simple and intuitive to use.
Note: The array objects returned by methods and the property `data` of DataSet is not an standard `Array`, see [ArrayMap](src/ArrayMap.js).

* <a href="#creating-a-factory-and-a-dataSet">Creating a Factory and a DataSet</a>
* <a href="#open-a-dataset-to-work-with">Open a DataSet to work with</a>
* <a href="#saving-records">Saving records</a>
* <a href="#finding-records">Finding records</a>
  * <a href="#basic-querying">Basic Querying</a>
  * <a href="#operators">Operators</a>
  * <a href="#group-by">Group By</a>
* <a href="#removing-records">Removing records</a>

### Creating a Factory and a DataSet
You can use **ojs-db** as an in-memory only database or as a persistent database. The factory is a class to create dataset's, the dataset's persist data through proxies. Each proxy may persist data according to your needs. There are 3 proxies already implemented and you can implement your own proxy. Are they:

* `LocalStorageProxy`: To persist data in browser LocalStorage.
* `SQLiteProxy`: To persist data in browser SQLite or SQLite datase in mobile phones, if using cordova sqlite plugin.
* `RestProxy`: To persist data in a webservice.

The constructor is used as follows `new DbFactory(proxy, options, synchronizer)` where:
* `proxy` (required): is a proxy instance, or an enum representing the proxy that will be instantiated (`DbProxy.LOCALSTORAGE`, `DbProxy.SQLITE`, `DbProxy.RESTFUL`).
* `options` (optional): is an object with the settings for the proxy, case use an enum to instantiate.
* `synchronizer` (optional): is a SyncDb instance to synchronizing local data with cloud or another place.


```javascript
// Type 1: LocalStorageProxy enum.
var db = new DbFactory(DbProxy.LOCALSTORAGE);

// Type 2: SQLiteProxy enum with config object
var db = new DbFactory(DbProxy.SQLITE, "DatabaseName");
db.createDatabase(maps);

// Type 3: Your own proxy
var proxy = new MyProxy(config)
  , db = new DbFactory(proxy);
```

The dataset is the class that search , insert, remove and change records. In general you will have only one factory in the application, but many dataset's. Look:

```javascript
// Creating a Factory.
var db = new DbFactory(DbProxy.LOCALSTORAGE);

// Creating DataSet's.
var products = db.createDataSet("products")
  , clients = db.createDataSet("clients")
  , users = db.createDataSet("users");
```

### Open a DataSet to work with
The DataSet's contains the properties below:

* `limit` (default 1000): control the quantity of records returned from proxy.
* `sort` (default null): gets the records sorting them by properties in a sort object. See:
* `data` (default []): contains all records returned after call `open`. See:

```javascript
products.limit = 50;
products.open(); // just open and get the firsts 50 records.

clients.sort = { name: 'asc', age: 'desc' };
clients.open(); // open and gets the records sorted by name and age of high to low
```

### Saving records
The types of data are based on proxy, then the proxy is responsible for serialize and de-serialize the data.

If the record does not contain an `id` field, **ojs-db** will automatically generated one for you. The `id` of a document, once set, can be modified at your own risk.

```javascript
var products = db.createDataSet("products")
  , p = { description: "Computer", value: 200.00 };

products.save(p);
```

The save method is used both to insert and to update a record. If you only call save, the data was change only in memory, you have to call `post` to persist data to proxy.

```javascript
products.save(p); // memory only.
products.post(); // persist data.
```

### Finding records
Use `query` to find for multiple records that matching you search, or `getById` to go to one specific record. You can select records based on field equality or use comparison operators (`$lt`, `$lte`, `$gt`, `$gte`, `$start`, `$end`, `$contain`, `$in`, `$custom`). See below for the syntax.

#### Basic querying
Basic querying means are searching for records whose fields match the ones you specify.

```javascript
// Let's say our database contains the following collection
// { id: '1', name: 'Joe', age: 17  }
// { id: '2', name: 'Aron', age: 30 }
// { id: '3', name: 'John', age: 31 }
// { id: '4', name: 'Matt', age: 17 }
// { id: '5', name: 'Jonh', age: 25 }

// Finding all persons with age equal 17
dataset.query({ age: 17 }, function (results) {
  // 'results' is an array containing records 'Joe' and 'Matt'
  // If no record is found, 'results' is equal to []
});

// Finding all persons with name equal 'John' and age equal 25
dataset.query({ name: 'John', age: 25 }, function (results) {
  // 'results' is an array containing record 5 only
});
```

#### Operators
The syntax is `{ field: { $op: value } }` where `$op` is any comparison operator ($lt, $lte, $gt, $gte, $start, $end, $contain, $in, $custom):

* `$lt`, `$lte`: less than, less than or equal
* `$gt`, `$gte`: greater than, greater than or equal
* `$start`: checks the record `field` start's with `value`
* `$end`: checks the record `field` end's with `value`
* `$contain`: checks the record `field` contains any of values in `value`. `value` must be an array
* `$in`: member of. `value` must be an array of values
* `$custom`: checks the record `field` based in return from function passed in `value`. `value` should be a function which returns true or false (see example below)

```javascript
// $lt, $lte, $gt and $gte work on numbers, dates and strings. When used with strings, lexicographical order is used
dataset.query({ age: { $gt: 17 } }, function (results) {
  // 'results' contains all records except id's 1 and 4
});

// Using $start. $end and $contain is used in same way
dataset.query({ name: { $start: 'Jo' }}, function (results) {
  // 'results' contains Joe, John (3) and John (5)
});

// Using $in
dataset.query({ age: { $in: [30,31] }}, function (results) {
  // 'results' contains Aron and John (3)
});

// Using $custom
function compareTo(field) {
    var regx = /[^0-9]/g;
    return regx.test(field);
};

dataset.query({ name: { $custom: compareTo }}, function (results) {
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
dataset.groupBy({ $max: 'age' }, [], {}, function (results) {
  // 'results' contains an array with the following structure:
  // { age: 31 }
});

// Using $sum. $avg and $count is used in same way
dataset.groupBy({ $sum: 'age' }, [], {}, function (results) {
  // 'results' contains an array with the following structure:
  // { age: 120 }
});

// Getting results with alias
dataset.groupBy([{ $max: 'age', alias: 'max' }, { $min: 'age', alias: 'min' }], [], {}, function (results) {
  // 'results' contains an array with the following structure:
  // { max: 31, min: 17 }
});

// Group by one or many columns
dataset.groupBy({ $sum: 'age', alias: 'sum' }, ['name'], {}, function (results) {
  // 'results' contains an array with the following structure:
  // { name: 'Joe', sum: 17  }
  // { name: 'Aron', sum: 30 }
  // { name: 'John', sum: 56 }
  // { name: 'Matt', sum: 17 }
});
```

### Removing records
`dataset.remove(record)` remove the record from memory only, you must call `post` to persist changes to proxy. See:

```javascript
products.remove(p); // memory only.
products.post(); // persist data.
```

## License 

See [License](LICENSE)
