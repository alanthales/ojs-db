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

## Documentation
See [Docs](DOCS.md)

## Samples
How to work with samples.

* <a href="#persist-data-directly">Persist data directly</a>
* <a href="#use-data-sets-collections">Use data sets (collections)</a>
* <a href="#get-data-on-demand">Get data on demand</a>
* <a href="#working-with-reactivity">Working with reactivity</a>

### Persist data directly
You can persist data directly using the created instance of `ojsDb`.

```javascript
var db = new ojsDb(DbProxies.LOCALSTORAGE),
    person = { name: 'Seya', age: 21 };

// insert, update, delete e query methods return a promise.
db.insert('knights', person).then();

person.armor = 'Pegasus';
db.update('knights', person).then();

db.delete('knights', person).then();

db.query('knights', { age: 21 }).then(function(results) {
    console.log(results);
});
```

### Use data sets (collections)
Regardless of the frontend framework that you use, you can use datasets to manipulate data bound to a database table.

```javascript
var db = new ojsDb(DbProxies.LOCALSTORAGE),
    collection = db.dataset('knights');

// Open return a promise e retrieve the data.
collection.open().then();

// Post return a promise, this method persist data to database. Save method just "save" in memory.
collection
    .save({name:'Shiryu'})
    .save({name:'Yoga'})
    .post().then();

// Cancel method undo any changes in memory.
collection
    .save({name:'Ikki'})
    .save({name:'Shun'})
    .cancel();

var data = collection.data(); // Return a array of elements
var seya = collection.get(1); // Get a record by id
var count = collection.count(); // Return records count
var filtered = collection.filter({age:21}); // Return a array with filtered data

collection.forEach(function(item) {
    console.log(item);
});
```

### Get data on demand
Make paging easy

```javascript
var db = new ojsDb(DbProxies.SQLITE),
    collection = db.dataset('knights').limit(10);

// Open retrieve just first 10 records.
collection.open().then();

// Get next 10 records.
collection.next().then();

// Return a boolean, if is the end.
collection.eof();
```

### Working with reactivity
See sample below:

```html
<html>
<body>
    <input id="name" type="text" placeholder="Type your hero's name"/>
    <button id="add">Add</button>
    <ul id="list">
    </ul>

    <script src="ojs-db.min.js"></script>
    <script src="app.js"></script>
</body>
</html>
```

```javascript
// app.js
var db = new ojsDb(DbProxies.LOCALSTORAGE),
    collection = db.dataset('heros');

collection.subscribe(function(args) {
    var list = document.getElementById('list');

    list.innerHTML = '';
    collection.data().forEach(function(item) {
        list.innerHTML += '<li>' + item.name + '</li>';
    });
});

collection.open().then();

document.getElementById('add').addEventListener('click', function() {
    var input = document.getElementById('name'),
        hero = {name: input.value};
    collection
        .save(hero)
        .post().then(function() {
            input.value = '';
        });
});
```

## License 

See [License](LICENSE)