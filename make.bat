@echo off

echo compiling...

cmd /c "uglifyjs src\ArrayMap.js src\Utils.js src\ChildRecord.js src\SimpleDataSet.js src\DataSet.js src\DbProxy.js src\LocalStorageProxy.js src\SQLiteProxy.js src\RestProxy.js src\SyncDb.js src\DbFactory.js -o build\ojs-db.js -c --comments"

cmd /c "uglifyjs src\ArrayMap.js src\Utils.js src\ChildRecord.js src\SimpleDataSet.js src\DataSet.js src\DbProxy.js src\LocalStorageProxy.js src\SQLiteProxy.js src\RestProxy.js src\SyncDb.js src\DbFactory.js -o build\ojs-db.min.js -m -r 'ArrayMap,OjsUtils,ChildRecord,SimpleDataSet,DataSet,DbProxies,DbProxy,LocalStorageProxy,SQLiteProxy,RestProxy,SyncDb,DbFactory' -c --comments"
