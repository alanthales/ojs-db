## ojs-db
**A JavaScript database to persist data in browser, mobile phone, cloud or anywhere. You define where to write the data through proxies. 100% JavaScript, no binary dependency**. API is simple and easy to use.

## Installation, tests
Clone or download the project.

```
git clone https://github.com/alanthales/ojs-db.git
```

Install uglifyjs to minify and compact the code.

```
npm install -g uglify-js
```

Go to project directory and compile.

```
make
```

## API
It is simple and intuitive to use.

* <a href="#creating-a-factory-and-a-dataSet">Creating a Factory and a DataSet</a>
* <a href="#saving-records">Saving records</a>
* <a href="#finding-records">Finding records</a>
  * <a href="#basic-querying">Basic Querying</a>
  * <a href="#operators">Operators ($lt, $lte, $gt, $gte, $start, $end, $contain, $in, $custom)</a>
  * <a href="#sorting">Sorting</a>
* <a href="#removing-records">Removing records</a>

### Creating a Factory and a DataSet
You can use **ojs-db** as an in-memory only database or as a persistent database. The factory is a class to create dataset's, the dataset's persist data through proxies. Each proxy may persist data according to your needs. There are 3 proxies already implemented and you can implement your own proxy. Are they:

* `LocalStorageProxy`: To persist data in browser LocalStorage.
* `SQLiteProxy`: To persist data in browser SQLite or SQLite datase in mobile phones, if using cordova sqlite plugin.
* `RestProxy`: To persist data in a webservice.

The constructor is used as follows `new DbFactory(proxy, options, synchronizer)` where:
* `proxy` (required): is a proxy instance, or an enum representing the proxy that will be instantiated (DbProxy.LOCALSTORAGE, DbProxy.SQLITE, DbProxy.RESTFUL).
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
Use `query` to search for multiple records that matching you query, or `getById` to go to one specific record. You can select records based on field equality or use comparison operators (`$lt`, `$lte`, `$gt`, `$gte`, `$start`, `$end`, `$contain`, `$in`, `$custom`). See below for the syntax.
