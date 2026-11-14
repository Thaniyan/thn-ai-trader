/* Disposable-process fault injector. Not imported by application or production package. */
import fs from 'node:fs';
import path from 'node:path';
const directory=path.resolve(process.env.THN_DATA_DIR||'/nonexistent');
const original=Object.fromEntries(['openSync','closeSync','writeFileSync','fsyncSync','renameSync'].map(k=>[k,fs[k].bind(fs)]));
const descriptors=new Map();let armed=null,count=0,lastRenamed='';
process.on('message',message=>{if(message?.type==='arm'){armed=message.fault;count=0;process.send?.({type:'armed'});}});
function filename(value){return typeof value==='number'?descriptors.get(value):typeof value==='string'?path.resolve(value):null;}
function fault(operation,phase,file){
 if(!armed||operation!==armed.operation||phase!==armed.phase||!file?.startsWith(directory+path.sep)||path.basename(file)!==armed.file)return;
 if(++count!==(armed.occurrence||1))return;
 const spec=armed;armed=null;fs.writeSync(2,'THN_FAULT='+JSON.stringify(spec)+'\n');
 if(spec.mode==='crash')process.kill(process.pid,'SIGKILL');
 const error=Error('Synthetic '+spec.mode+' in disposable paper fixture');error.code=spec.mode;throw error;
}
fs.openSync=function(file,...args){const fd=original.openSync(file,...args);descriptors.set(fd,filename(file));return fd;};
fs.closeSync=function(fd,...args){try{return original.closeSync(fd,...args);}finally{descriptors.delete(fd);}};
fs.writeFileSync=function(value,...args){const file=filename(value);fault('write','before',file);const result=original.writeFileSync(value,...args);fault('write','after',file);return result;};
fs.renameSync=function(from,to,...args){const file=filename(to);fault('rename','before',file);const result=original.renameSync(from,to,...args);lastRenamed=file;fault('rename','after',file);return result;};
fs.fsyncSync=function(fd,...args){const file=filename(fd)===directory?lastRenamed:filename(fd);fault('fsync','before',file);const result=original.fsyncSync(fd,...args);fault('fsync','after',file);return result;};
