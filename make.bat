@echo off

echo compiling...

uglifyjs src\HashMap.js src\DbProxy.js src\LocalStorageProxy.js src\SQLiteProxy.js src\DataSet.js src\DbFactory.js -o ojs-db.min.js -m -r 'HashMap,DbProxies,DbProxy,LocalStorageProxy,SQLiteProxy,DataSet,DbFactory' -c
