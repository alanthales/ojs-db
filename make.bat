@echo off

echo compiling...

cmd /c "uglifyjs src\ArrayMap.js src\Utils.js src\ChildRecord.js src\EventEmitter.js src\SimplePromise.js src\SimpleDataSet.js src\DataSet.js src\DbProxy.js src\LocalStorageProxy.js src\SQLiteProxy.js src\RestProxy.js src\DbSync.js src\DbFactory.js -o build\ojs-db.js -b -c --comments"

cmd /c "uglifyjs src\ArrayMap.js src\Utils.js src\ChildRecord.js src\EventEmitter.js src\SimplePromise.js src\SimpleDataSet.js src\DataSet.js src\DbProxy.js src\LocalStorageProxy.js src\SQLiteProxy.js src\RestProxy.js src\DbSync.js src\DbFactory.js -o build\ojs-db.min.js -m -c --comments"
