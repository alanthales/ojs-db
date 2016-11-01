/**
 * @license
 * Copyright (c) 2016 Alan Thales.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ArrayMap=function(){"use strict";function Collection(){var collection=[];return collection=Array.apply(collection,arguments)||collection,collection.__proto__=Collection.prototype,collection.mapTable=function(key){return this.map(function(item){return item[key]})},collection.indexOfKey=function(key,value){return this.mapTable(key).indexOf(value)},collection.put=function(obj,index){var i=index||this.length;this[i]=obj},collection.putRange=function(arr,tail){if(arr&&arr instanceof Array){var i,pos=tail&&"boolean"==typeof tail?this.length:0,l=arr.length;for(i=0;l>i;i++)this.put(arr[i],pos+i)}},collection.query=function(filters){var self=this,opts=filters&&"object"==typeof filters?filters:{},results=new Collection,queryFn=function(record){return _recordMatch.call(self,record,opts)},fn=filters&&"function"==typeof filters?filters:queryFn;return results.putRange(self.filter(fn)),results},collection.orderBy=function(sorters){var field,opts=sorters&&"object"==typeof sorters?sorters:{},ascSort=function(fieldA,fieldB){return"string"==typeof fieldA?fieldA.localeCompare(fieldB):(fieldA>fieldB)-(fieldB>fieldA)},descSort=function(fieldA,fieldB){return"string"==typeof fieldB?fieldB.localeCompare(fieldA):(fieldB>fieldA)-(fieldA>fieldB)};return this.sort(function(a,b){var result=0;for(field in opts){if(a[field]!=b[field]){result="desc"===opts[field]?descSort(a[field],b[field]):ascSort(a[field],b[field]);break}result=0}return result}),this},collection.groupBy=function(options,groups,filters){var group,g,i,self=this,results=new Collection,flts=filters&&"object"==typeof filters?filters:{},l=groups.length,grouped={};return self.forEach(function(item){if(_recordMatch.call(self,item,flts)){for(g={},i=0;l>i;i++)g[groups[i]]=item[groups[i]];group=JSON.stringify(g),grouped[group]=grouped[group]||[],grouped[group].push(item)}}),results.putRange(Object.keys(grouped).map(function(item){return g=JSON.parse(item),_aggregate(grouped[item],options,g)})),results},collection.compute=function(options){return _aggregate(this,options)},collection}var _recordMatch=function(record,opts){var field,prop,str,matched=!0;for(field in opts){if(!matched)break;if("object"==typeof opts[field]){str=record[field].toString();for(prop in opts[field]){switch(prop){case"$gt":matched=record[field]>opts[field][prop];break;case"$gte":matched=record[field]>=opts[field][prop];break;case"$lt":matched=record[field]<opts[field][prop];break;case"$lte":matched=record[field]<=opts[field][prop];break;case"$not":matched=record[field]!=opts[field][prop];break;case"$start":matched=0===str.lastIndexOf(opts[field][prop],0);break;case"$end":matched=-1!==str.indexOf(opts[field][prop],str.length-opts[field][prop].length);break;case"$contain":matched=str.indexOf(opts[field][prop])>-1;break;case"$in":matched=opts[field][prop].indexOf(record[field])>-1;break;default:matched=!1}if(!matched)break}}else matched=record[field]==opts[field]}return matched},_aggregate=function(array,options,value){var prop,field,alias,opts=options&&options instanceof Array?options:[options],value=value||{};return opts.forEach(function(opt){for(prop in opt)break;switch(field=opt[prop],alias=opt.alias||field,prop){case"$max":array.sort(function(a,b){return b[field]-a[field]}),value[alias]=array[0][field];break;case"$min":array.sort(function(a,b){return a[field]-b[field]}),value[alias]=array[0][field];break;case"$sum":value[alias]=array.map(function(item){return item[field]}).reduce(function(previous,current){return parseFloat(previous)+parseFloat(current)},0);break;case"$avg":value[alias]=array.map(function(item){return item[field]}).reduce(function(previous,current){return parseFloat(previous)+parseFloat(current)},0),value[alias]/=array.length;break;case"$count":value[alias]=array.length}}),value};return Collection.prototype=Object.create(Array.prototype),Collection}(),OjsUtils=function(){"use strict";var randomBytes=function(size){for(var r,bytes=new Array(size),i=0;size>i;i++)0==(3&i)&&(r=4294967296*Math.random()),bytes[i]=r>>>((3&i)<<3)&255;return bytes},byteArrayToBase64=function(uint8){function tripletToBase64(num){return lookup[num>>18&63]+lookup[num>>12&63]+lookup[num>>6&63]+lookup[63&num]}var temp,length,i,lookup="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",extraBytes=uint8.length%3,output="";for(i=0,length=uint8.length-extraBytes;length>i;i+=3)temp=(uint8[i]<<16)+(uint8[i+1]<<8)+uint8[i+2],output+=tripletToBase64(temp);switch(extraBytes){case 1:temp=uint8[uint8.length-1],output+=lookup[temp>>2],output+=lookup[temp<<4&63],output+="==";break;case 2:temp=(uint8[uint8.length-2]<<8)+uint8[uint8.length-1],output+=lookup[temp>>10],output+=lookup[temp>>4&63],output+=lookup[temp<<2&63],output+="="}return output};return{uid:function(len){return byteArrayToBase64(randomBytes(Math.ceil(Math.max(8,2*len)))).replace(/[+\/]/g,"").slice(0,len)},cloneObject:function(obj){var out,i,len;if(!obj||obj instanceof Date)return obj;if(obj instanceof ArrayMap?out=new ArrayMap:obj instanceof SimpleDataSet?out=new SimpleDataSet:obj instanceof ChildRecord&&(out=new ChildRecord),"[object Array]"===Object.prototype.toString.call(obj)){for(out=out||[],i=0,len=obj.length;len>i;i++)out[i]=this.cloneObject(obj[i]);return out}if("object"==typeof obj){out=out||{};for(i in obj)obj.hasOwnProperty(i)&&(out[i]=this.cloneObject(obj[i]));return out}return obj},cloneProperties:function(source,dest){for(var prop in source)dest[prop]=source[prop]}}}(),ChildRecord=function(){"use strict";function CreateRecord(dtsMaster,recMaster){var _dtsMaster=dtsMaster,_recMaster=recMaster;this.getDtsMaster=function(){return _dtsMaster},this.getRecMaster=function(){return _recMaster},this.setRecMaster=function(recMaster){recMaster&&(_recMaster=recMaster)}}return CreateRecord.prototype.notifyMaster=function(){this.getDtsMaster().save(this.getRecMaster())},CreateRecord}(),SimpleDataSet=function(){"use strict";function CreateDataSet(){this._inserteds=[],this._updateds=[],this._deleteds=[],this._copy=null,this._lastOp=null,this.sort=null,this.data=new ArrayMap}return CreateDataSet.prototype._cleanCache=function(){this._inserteds.length=0,this._updateds.length=0,this._deleteds.length=0,this._copy=null,this._lastOp=null},CreateDataSet.prototype.getById=function(id){var index=this.data.indexOfKey("id",id);return this.data[index]},CreateDataSet.prototype.insert=function(record){record.id||(record.id=(new Date).getTime());var index=this.data.indexOfKey("id",record.id);return-1===index&&(this._inserteds.push(record),this.data.push(record)),this._copy=OjsUtils.cloneObject(record),this._lastOp="insert",record instanceof ChildRecord&&record.notifyMaster(),this},CreateDataSet.prototype.update=function(record){if(record.id){var idxUpd,index=this.data.indexOfKey("id",record.id);if(-1!==index)return idxUpd=this._updateds.map(function(item){return item.id}).indexOf(record.id),-1===idxUpd?this._updateds.push(record):this._updateds.splice(idxUpd,1,record),this._copy=OjsUtils.cloneObject(this.data[index]),this._lastOp="update",this.data.splice(index,1,record),record instanceof ChildRecord&&record.notifyMaster(),this}},CreateDataSet.prototype.save=function(record){return record?record.id&&this.getById(record.id)?this.update(record):this.insert(record):void 0},CreateDataSet.prototype["delete"]=function(record){if(record.id){var index=this.data.indexOfKey("id",record.id);if(-1!==index)return this._deleteds.push(record),this._copy=OjsUtils.cloneObject(this.data[index]),this._lastOp="delete",this.data.splice(index,1),record instanceof ChildRecord&&record.notifyMaster(),this}},CreateDataSet.prototype.insertAll=function(records){var self=this;!records instanceof Array||records.forEach(function(record){self.insert(record)})},CreateDataSet.prototype.clear=function(){return this.data.length=0,this._cleanCache(),this},CreateDataSet.prototype.cancel=function(){if(this._copy){var index=this.data.indexOfKey("id",this._copy.id);switch(this._lastOp){case"insert":this.data.splice(index,1),this._inserteds.pop();break;case"update":this.data.splice(index,1,this._copy),this._updateds.pop();break;case"delete":this.data.push(this._copy),this._deleteds.pop()}this._copy=null,this._lastOp=null}},CreateDataSet.prototype.filter=function(options){return this.data.query(options)},CreateDataSet.prototype.forEach=function(fn){return this.data.forEach(fn),this},CreateDataSet}(),DataSet=function(){"use strict";function CreateDataSet(proxy,table,genIdFn,synchronizer){var _proxy=proxy,_table=table,_synchronizer=synchronizer;this.active=!1,this.limit=1e3,this.params=null,this.genId=genIdFn,this.eof=!0,this.reOpenOnRefresh=!1,this.getProxy=function(){return _proxy},this.getTable=function(){return _table},this.getSynchronizer=function(){return _synchronizer},SimpleDataSet.apply(this)}CreateDataSet.prototype=Object.create(SimpleDataSet.prototype);var _getRecords=function(opts,callback){var self=this,cb=callback&&"function"==typeof callback?callback:function(){};self.getProxy().getRecords(opts,function(err,records){self.data.putRange(records,!0),self.active=err?!1:!0,self.eof=records.length<self.limit,cb(err,records)})};return CreateDataSet.prototype.open=function(callback){var opts={key:this.getTable(),limit:this.limit,sort:this.sort,params:this.params};return this.active?(callback&&"function"==typeof callback&&callback(null,this.data),this):(_getRecords.call(this,opts,callback),this)},CreateDataSet.prototype.next=function(callback){var self=this,opts={key:self.getTable(),limit:self.limit,sort:self.sort,params:self.params,skip:self.limit},cb=callback&&"function"==typeof callback?callback:function(){};return self.eof?(cb(null,!1),self):(_getRecords.call(self,opts,function(err,results){cb(err,!self.eof)}),self)},CreateDataSet.prototype.close=function(){return SimpleDataSet.prototype.clear.apply(this,arguments),this.active=!1,this},CreateDataSet.prototype.refresh=function(callback){var cb=callback&&"function"==typeof callback?callback:function(){};return this.reOpenOnRefresh?(this.active=!1,this.open(cb)):(this.sort&&this.data.orderBy(this.sort),cb(),this)},CreateDataSet.prototype.insert=function(record){if(!this.active)throw"Invalid operation on closed dataset";SimpleDataSet.prototype.insert.apply(this,arguments)},CreateDataSet.prototype.update=function(record){if(!this.active)throw"Invalid operation on closed dataset";SimpleDataSet.prototype.update.apply(this,arguments)},CreateDataSet.prototype["delete"]=function(record){if(!this.active)throw"Invalid operation on closed dataset";SimpleDataSet.prototype["delete"].apply(this,arguments)},CreateDataSet.prototype.post=function(callback,ignoreSync){function done(err){return err?(self.cancel(),cb(err)):(sync&&!ignoreSync&&sync.writeData(self.getTable(),self._inserteds,self._updateds,self._deleteds),self.refresh(),self._cleanCache(),void cb())}if(!this.active)throw"Invalid operation on closed dataset";var self=this,cb="function"==typeof callback?callback:function(){},sync=this.getSynchronizer();return self._inserteds.length||self._updateds.length||self._deleteds.length?void self.getProxy().commit(self.getTable(),self._inserteds,self._updateds,self._deleteds,done):cb()},CreateDataSet.prototype.sync=function(callback){var self=this,sync=this.getSynchronizer(),cb=callback&&"function"==typeof callback?callback:function(){};sync&&sync.exec(self.getTable(),function(err,allData,toDelete){function deleteDiff(item){serverData.indexOfKey("id",item.id)<0&&self["delete"](item)}function deleteFix(item){toDeleteMap.indexOf(item.id)>-1&&self["delete"](item)}if(err)return cb(err);if(allData=allData||[],toDelete=toDelete||[],!allData.length&&!toDelete.length)return cb();var deleteFn,serverData=new ArrayMap,localData=new ArrayMap,toDeleteMap=toDelete.map(function(item){return item.id});serverData.putRange(allData),localData.putRange(self.data),deleteFn=toDelete&&toDelete instanceof Array?deleteFix:deleteDiff,localData.forEach(deleteFn),serverData.forEach(function(item){self.data.indexOfKey("id",item.id)<0?self.insert(item):self.update(item)}),self.post(cb,!0)})},CreateDataSet.prototype.fetch=function(property,callback){var cb=callback&&"function"==typeof callback?callback:function(){};return this.active?(this.getProxy().fetch(this.getTable(),this,property,cb),this):(cb(),this)},CreateDataSet}(),DbProxies=function(){return{LOCALSTORAGE:0,SQLITE:1,RESTFUL:2}}(),DbProxy=function(){function CreateProxy(){this.mappings={}}return CreateProxy.prototype.createDatabase=function(maps,callback){this.mappings=maps},CreateProxy.prototype.getRecords=function(options,callback){},CreateProxy.prototype.commit=function(key,toInsert,toUpdate,toDelete,callback){},CreateProxy.prototype.fetch=function(key,property,callback){},CreateProxy.dateParser=function(key,value){var test,reISO=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;return"string"==typeof value&&(test=reISO.exec(value))?new Date(value):value},CreateProxy}(),LocalStorageProxy=function(){"use strict";function CreateProxy(){DbProxy.apply(this,arguments)}var _get=function(opts){var key="object"==typeof opts?opts.key:opts,table=window.localStorage[key],results=new ArrayMap;return table&&results.putRange(JSON.parse(table,DbProxy.dateParser)),results.length&&opts.params?results.query(opts.params):results},_saveAll=function(key,table,callback){window.localStorage[key]=JSON.stringify(table),"function"==typeof callback&&callback()};return CreateProxy.prototype=Object.create(DbProxy.prototype),CreateProxy.prototype.getRecords=function(options,callback){var table=_get(options);options.sort&&table.orderBy(options.sort),"function"==typeof callback&&callback(null,table)},CreateProxy.prototype.query=function(key,filters,callback){var table=_get(key),results=table.query(filters);callback(null,results)},CreateProxy.prototype.groupBy=function(key,options,groups,filters,callback){var table=_get(key);callback(null,table.groupBy(options,groups,filters))},CreateProxy.prototype.save=function(key,record,callback){var table=_get(key),index=table.indexOfKey("id",record.id);-1===index?table.push(record):table.splice(index,1,record),_saveAll(key,table,callback)},CreateProxy.prototype.remove=function(key,record,callback){var id="object"==typeof record?record.id:record,table=_get(key),index=table.indexOfKey("id",id);table.splice(index,1),_saveAll(key,table,callback)},CreateProxy.prototype.commit=function(key,toInsert,toUpdate,toDelete,callback){function progress(){total--,0===total&&cb()}var i,self=this,toSave=toInsert.concat(toUpdate),total=toSave.length+toDelete.length,cb=callback&&"function"==typeof callback?callback:function(){};if(0===total)return cb();for(i=0;i<toSave.length;i++)self.save(key,toSave[i],progress);for(i=0;i<toDelete.length;i++)self.remove(key,toDelete[i],progress)},CreateProxy}(),SQLiteProxy=function(){"use strict";function CreateProxy(dbName){var db=null,eventName="undefined"!=typeof window.cordova?"deviceready":"readystatechange";document.addEventListener(eventName,function(){"loading"!=document.readyState&&(db=window.sqlitePlugin?window.sqlitePlugin.openDatabase({name:dbName,location:"default"}):window.openDatabase(dbName,"SQLite Database","1.0",5242880))}),this.getDb=function(){return db},DbProxy.apply(this,arguments)}var _selectFrom="SELECT * FROM",_maps={};CreateProxy.prototype=Object.create(DbProxy.prototype),CreateProxy.prototype.createDatabase=function(maps,callback){var self=this;_maps=OjsUtils.cloneObject(maps),self.getDb().transaction(function(tx){function progress(){total--,0===total&&cb()}var fields,field,table,prop,sql,cb=callback&&"function"==typeof callback?callback:function(){},total=Object.keys(_maps).length;for(table in _maps){fields="";for(prop in _maps[table])field=_maps[table][prop],field.hasMany||(field.hasOne&&(field.type=_maps[field.hasOne].id.type),fields+=[prop,field.type,field.required?"NOT NULL":"",field.primaryKey?"PRIMARY KEY":"",","].join(" "));fields=fields.substr(0,fields.length-1),sql=["CREATE TABLE IF NOT EXISTS",table,"(",fields,")"].join(" "),tx.executeSql(sql,[],progress)}},function(err){cb(err)})};var _parseItem=function(key,item){var prop,value,fdmap,result={};for(prop in _maps[key])value=item[prop],fdmap=_maps[key][prop],("date"===fdmap.type||"datetime"===fdmap.type)&&(value=new Date(value)),result[prop]=value;return result},_formatValue=function(table,key,record){var fdmap=_maps[table][key],value=void 0===typeof record[key]?null:record[key];return fdmap.hasOne&&record instanceof ChildRecord&&(value=record.getRecMaster().id),value},_select=function(key,sql,params,transaction,callback){var i,l,record,table=new ArrayMap;transaction.executeSql(sql,params,function(tx,results){for(l=results.rows.length,i=0;l>i;i++)record=_parseItem(key,results.rows.item(i)),table.push(record);"function"==typeof callback&&callback(null,table)},function(tx,err){console.error(err.message),callback(err)})},_orderBy=function(sorters){var field,result=[];for(field in sorters)result.push(field+" "+sorters[field]);return"ORDER BY "+result.join(",")};CreateProxy.prototype.getRecords=function(options,callback){var p,self=this,key=options&&options.key?options.key:options,sortBy=options&&options.sort?_orderBy(options.sort):"",where="WHERE ",sql=[];if("object"==typeof options){if(sql=[_selectFrom,options.key],options.params){for(p in options.params)where+=p+" = '"+options.params[p]+"'";sql.push(where)}sql.push(sortBy),options.skip&&sql.push("OFFSET "+options.skip),options.limit&&sql.push("LIMIT "+options.limit)}else sql=[_selectFrom,options];self.getDb().transaction(function(tx){_select(key,sql.join(" "),[],tx,callback)})};var _formatSql=function(sqlNoWhere,filters){var field,prop,where="";for(field in filters)if("object"==typeof filters[field])for(prop in filters[field])switch(prop){case"$gt":where+=[field,">",filters[field][prop]].join(" ")+" AND ";break;case"$gte":where+=[field,">=",filters[field][prop]].join(" ")+" AND ";break;case"$lt":where+=[field,"<",filters[field][prop]].join(" ")+" AND ";break;case"$lte":where+=[field,"<=",filters[field][prop]].join(" ")+" AND ";break;case"$start":where+=[field," LIKE '",filters[field][prop],"%'"].join("")+" AND ";break;case"$end":where+=[field," LIKE '%",filters[field][prop],"'"].join("")+" AND ";break;case"$contain":where+=[field," LIKE '%",filters[field][prop],"%'"].join("")+" AND ";break;case"$in":where+=[field," IN (",filters[field][prop].join(","),")"].join("")+" AND ";break;default:where+=""}else where+=[field," = '",filters[field],"'"].join("")+" AND ";return""===where?sqlNoWhere:(where=where.trim().slice(0,-3),[sqlNoWhere,"WHERE",where].join(" "))},_formatGroupBy=function(key,options,groups,filters){var prop,field,alias,opts=options&&options instanceof Array?options:[options],groupBy=groups.length?groups.join(",")+", ":"",where=filters&&"object"==typeof filters?_formatSql("",filters):"",sql="";return opts.forEach(function(opt){for(prop in opt)break;switch(field=opt[prop],alias=opt.alias||field,prop){case"$max":sql+=["MAX(",field,")"," AS ",alias].join("")+", ";break;case"$min":sql+=["MIN(",field,")"," AS ",alias].join("")+", ";break;case"$sum":sql+=["SUM(",field,")"," AS ",alias].join("")+", ";break;case"$avg":sql+=["AVG(",field,")"," AS ",alias].join("")+", ";break;case"$count":sql+=["COUNT(",field,")"," AS ",alias].join("")+", "}}),""===sql?[_selectFrom,key].join(" "):(sql=sql.trim().slice(0,-1),sql=["SELECT",groupBy,sql,"FROM",key,where].join(" "),""===groupBy?sql:sql+" GROUP BY "+groupBy.trim().slice(0,-1))};CreateProxy.prototype.query=function(key,filters,callback){var self=this,opts=filters&&"object"==typeof filters?filters:{},select=[_selectFrom,key].join(" "),sql=filters&&"function"==typeof filters?filters():_formatSql(select,opts);self.getDb().transaction(function(tx){_select(key,sql,[],tx,callback)})},CreateProxy.prototype.groupBy=function(key,options,groups,filters,callback){var i,l,self=this,sql=_formatGroupBy(key,options,groups,filters),table=new ArrayMap;self.getDb().transaction(function(transaction){transaction.executeSql(sql,[],function(tx,results){for(l=results.rows.length,i=0;l>i;i++)table.push(results.rows.item(i));"function"==typeof callback&&callback(null,table)},function(tx,err){console.error(err.message),callback(err)})})};var _save=function(key,record,transaction,operationFn,callback){function progress(){total--,0===total&&(items&&items instanceof SimpleDataSet&&items._cleanCache(),operationFn(key,record,transaction,callback))}var prop,fdmap,items,total=1;for(prop in record)fdmap=_maps[key][prop],fdmap&&fdmap.hasMany&&(items=record[prop],items instanceof SimpleDataSet&&(total+=items._inserteds.length+items._updateds.length+items._deleteds.length,items._inserteds.length&&this.insert(fdmap.hasMany,items._inserteds,transaction,progress),items._updateds.length&&this.update(fdmap.hasMany,items._updateds,transaction,progress),items._deleteds.length&&this["delete"](fdmap.hasMany,items._deleteds,transaction,progress)));progress()},_getInsertSql=function(key,record){var prop,sql,value,fdmap,params=[],fields="",values="";for(prop in _maps[key])fdmap=_maps[key][prop],fdmap&&!fdmap.hasMany&&(value=_formatValue(key,prop,record),void 0!=value&&(params.push(value),fields+=prop+",",values+="?,"));return fields=fields.substr(0,fields.length-1),values=values.substr(0,values.length-1),sql=["INSERT INTO",key,"(",fields,") VALUES (",values,")"].join(" "),{sql:sql,params:params}},_insert=function(key,record,transaction,callback){var obj=_getInsertSql(key,record);transaction.executeSql(obj.sql,obj.params,callback)};CreateProxy.prototype.insert=function(key,records,transaction,callback){var l=records.length,i=0;if(0===l)return callback();for(;l>i;i++)_save.call(this,key,records[i],transaction,_insert,callback)};var _getUpdateSql=function(key,record){var sql,prop,value,fdmap,params=[],where="id = '"+record.id+"'",sets="";for(prop in _maps[key])fdmap=_maps[key][prop],"id"!=prop&&fdmap&&!fdmap.hasMany&&(value=_formatValue(key,prop,record),sets+=prop+" = ?,",params.push(value));return sets=sets.substr(0,sets.length-1),sql=["UPDATE",key,"SET",sets,"WHERE",where].join(" "),{sql:sql,params:params}},_update=function(key,record,transaction,callback){var obj=_getUpdateSql(key,record);transaction.executeSql(obj.sql,obj.params,callback)};CreateProxy.prototype.update=function(key,records,transaction,callback){var l=records.length,i=0;if(0===l)return callback();for(;l>i;i++)_save.call(this,key,records[i],transaction,_update,callback)};var _delete=function(key,record,transaction,callback){function progress(){total--,0===total&&(sql=["DELETE FROM ",key," WHERE id = '",id,"'"].join(""),transaction.executeSql(sql,[],callback))}var sql,prop,fdmap,id="object"==typeof record?record.id:record,total=1;for(prop in record)fdmap=_maps[key][prop],fdmap&&fdmap.hasMany&&(total++,sql=["DELETE FROM ",fdmap.hasMany," WHERE ",fdmap.foreignKey," = '",id,"'"].join(""),transaction.executeSql(sql,[],progress),record[prop]instanceof SimpleDataSet&&record[prop].clear());progress()};CreateProxy.prototype["delete"]=function(key,records,transaction,callback){var l=records.length,i=0;if(0===l)return callback();for(;l>i;i++)_delete.call(this,key,records[i],transaction,callback)},CreateProxy.prototype.commit=function(key,toInsert,toUpdate,toDelete,callback){function progress(){total--,0===total&&cb()}var self=this,total=toInsert.length+toUpdate.length+toDelete.length,cb=callback&&"function"==typeof callback?callback:function(){};return toInsert.length||toUpdate.length||toDelete.length?void self.getDb().transaction(function(tx){toInsert.length&&self.insert(key,toInsert,tx,progress),toUpdate.length&&self.update(key,toUpdate,tx,progress),toDelete.length&&self["delete"](key,toDelete,tx,progress)},function(err){console.error(err.message),cb(err)}):cb()};var _fetch=function(key,master,record,property,callback){var i,l,child,opts={params:{}},fdmap=_maps[key][property];fdmap&&fdmap.hasMany?(opts.key=fdmap.hasMany,opts.params[fdmap.foreignKey]=record.id,this.getRecords(opts,function(err,results){if(err)return callback(err);for(record[property]=new SimpleDataSet,i=0,l=results.length;l>i;i++)child=new ChildRecord(master,record),OjsUtils.cloneProperties(results[i],child),record[property].data.push(child);callback()})):callback()};return CreateProxy.prototype.fetch=function(key,dataset,property,callback){function progress(){total--,0===total&&cb()}var cb="function"==typeof callback?callback:function(){},total=dataset.data.length,i=0;if(0===total)return void cb();for(;total>i;i++)_fetch.call(this,key,dataset,dataset.data[i],property,progress)},CreateProxy}(),RestProxy=function(){"use strict";function ProxyError(xhr){var res;try{res=JSON.parse(xhr.responseText)}catch(e){res={error:xhr.responseText}}this.code=xhr.status,this.status=xhr.statusText,this.error=res.error||{}}function CreateProxy(config){this.config=config,config&&config.autoPK&&(this.autoPK=!0),config.serializeFn&&"function"==typeof config.serializeFn?this.serialize=config.serializeFn:this.serialize=_defSerialize,DbProxy.apply(this,arguments)}var _defSerialize=function(obj){return JSON.stringify(obj)},_httpRequest=function(url,method,config,success,error){var callback,prop,params,http=new XMLHttpRequest;if(http.open(method,url,!0),http.onreadystatechange=function(){4===http.readyState&&(callback=[200,201,304].indexOf(http.status)>-1?success:error)(http)},"object"==typeof config){params=config.data;for(prop in config.headers)http.setRequestHeader(prop,config.headers[prop])}http.send(params)},_get=function(options,success,error){var p,opts="object"==typeof options?options:{key:options},url=this.config.url+"/"+opts.key+"?",table=new ArrayMap;if(opts.params)for(p in opts.params)url+=p+"="+opts.params[p]+"&";if(opts.sort){url+="sort=";for(p in opts.sort){url+=p+" "+opts.sort[p]+"&";break}}opts.skip&&(url+="skip="+opts.skip+"&"),opts.limit&&(url+="limit="+opts.limit+"&"),url=url.slice(0,-1),_httpRequest(url,"GET",this.config,function(xhr){table.putRange(JSON.parse(xhr.responseText,DbProxy.dateParser)),success(table)},error)},_save=function(method,key,record,success,error){var url=this.config.url+"/"+key,config={};"POST"===method&&this.autoPK&&delete record.id,"PUT"===method&&(url+="/"+record.id),config.data=this.serialize(record),this.config.headers&&(config.headers=this.config.headers),_httpRequest(url,method,config,success,error)};return CreateProxy.prototype=Object.create(DbProxy.prototype),CreateProxy.prototype.getRecords=function(options,callback){_get.call(this,options,function(data){callback(null,data)},function(xhr){callback(new ProxyError(xhr),[])})},CreateProxy.prototype.query=function(key,filters,callback){var opts={key:key,params:filters};_get.call(this,opts,function(data){callback(null,data)},function(xhr){callback(new ProxyError(xhr),[])})},CreateProxy.prototype.groupBy=function(key,filters,options,groups,callback){this.query(key,filters,function(err,data){if(err)return void callback(err);var results=data.groupBy(options,groups,{});callback(null,results)})},CreateProxy.prototype.insert=function(key,record,callback){var self=this;_save.call(self,"POST",key,record,function(xhr){var created=JSON.parse(xhr.responseText);self.autoPK&&created.id&&(record.id=created.id),callback(null,xhr)},function(xhr){callback(new ProxyError(xhr))})},CreateProxy.prototype.update=function(key,record,callback){_save.call(this,"PUT",key,record,function(xhr){callback(null,xhr)},function(xhr){callback(new ProxyError(xhr))})},CreateProxy.prototype["delete"]=function(key,record,callback){var url=this.config.url+"/"+key+"/"+record.id,config={};this.config.headers&&(config.headers=this.config.headers),_httpRequest(url,"DELETE",config,function(xhr){callback(null,xhr)},function(xhr){callback(new ProxyError(xhr))})},CreateProxy.prototype.commit=function(key,toInsert,toUpdate,toDelete,callback){function progress(err){return total--,err&&(errors=errors||{messages:[]},errors.messages.push(err)),0===total?void cb(errors):void 0}var errors,i,self=this,total=toInsert.length+toUpdate.length+toDelete.length,cb=callback&&"function"==typeof callback?callback:function(){};if(0===total)return cb();for(i=0;i<toInsert.length;i++)self.insert(key,toInsert[i],progress);for(i=0;i<toUpdate.length;i++)self.update(key,toUpdate[i],progress);for(i=0;i<toDelete.length;i++)self["delete"](key,toDelete[i],progress)},CreateProxy}(),SyncDb=function(){"use strict";function CreateSync(){}var Operations={Insert:"_inserted",Update:"_updated",Delete:"_deleted"},_getTableName=function(operation,table){return["sync_",table,operation].join("")},_saveTable=function(operation,tableName,tableValues){var key=_getTableName(operation,tableName);window.localStorage[key]=JSON.stringify(tableValues)},_getData=function(operation,tableName){var key=_getTableName(operation,tableName),table=window.localStorage[key],result=new ArrayMap;return table&&result.putRange(JSON.parse(table,DbProxy.dateParser)),result},_merge=function(arr1,arr2){for(var result=new ArrayMap,concated=arr1.concat(arr2),i=0,l=concated.length;l>i;i++)result.indexOfKey("id",concated[i].id)<0&&result.put(concated[i]);return result};return CreateSync.prototype.writeData=function(table,toInsert,toUpdate,toDelete){var insTable=_getData(Operations.Insert,table),updTable=_getData(Operations.Update,table),delTable=_getData(Operations.Delete,table);insTable=_merge(toInsert,insTable),updTable=_merge(toUpdate,updTable),delTable=_merge(toDelete,delTable),_saveTable(Operations.Insert,table,insTable),_saveTable(Operations.Update,table,updTable),_saveTable(Operations.Delete,table,delTable)},CreateSync.prototype.cleanData=function(table){_saveTable(Operations.Insert,table,[]),_saveTable(Operations.Update,table,[]),_saveTable(Operations.Delete,table,[])},CreateSync.prototype.sendData=function(table,toInsert,toUpdate,toDelete,callback){"function"==typeof callback&&callback()},CreateSync.prototype.getNews=function(table,callback){"function"==typeof callback&&callback(null,[],[])},CreateSync.prototype.exec=function(table,callback){var self=this,cb=callback||function(){};self.sendData(table,_getData(Operations.Insert,table),_getData(Operations.Update,table),_getData(Operations.Delete,table),function(err){return err?cb(err):(self.cleanData(table),void self.getNews(table,cb))})},CreateSync}(),IdGenerators=function(){"use strict";return{TIMESTAMP:function(){return(new Date).getTime()},UUID:OjsUtils.uid}}(),DbFactory=function(){"use strict";function CreateFactory(proxyType,opts,synchronizer){var _proxy,_synchronizer=synchronizer;if(this.getProxy=function(){return _proxy},this.getSynchronizer=function(){return _synchronizer},proxyType&&"object"==typeof proxyType)return void(_proxy=proxyType);switch(proxyType){case 0:_proxy=new LocalStorageProxy;break;case 1:_proxy=new SQLiteProxy(opts);break;case 2:_proxy=new RestProxy(opts);break;default:throw"Proxy not implemented"}}return CreateFactory.prototype.createDatabase=function(maps,callback){this.getProxy().createDatabase(maps,callback)},CreateFactory.prototype.query=function(key,filters,callback){this.getProxy().query(key,filters,callback)},CreateFactory.prototype.groupBy=function(key,options,groups,filters,callback){this.getProxy().groupBy(key,options,groups,filters,callback)},CreateFactory.prototype.createDataSet=function(table,genIdFn){var fn=genIdFn||IdGenerators.TIMESTAMP;return new DataSet(this.getProxy(),table,fn,this.getSynchronizer())},CreateFactory}();