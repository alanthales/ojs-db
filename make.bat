@echo off

echo compiling...

uglifyjs src\ArrayMap.js src\DbProxy.js src\LocalStorageProxy.js src\SQLiteProxy.js src\RestProxy.js src\SyncDb.js src\DataSet.js src\DbFactory.js -o ojs-db.min.js -m -r 'ArrayMap,DbProxies,DbProxy,LocalStorageProxy,SQLiteProxy,RestProxy,SyncDb,DataSet,DbFactory' -c --comments
