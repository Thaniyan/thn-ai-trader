/* Single-process LOCAL paper recovery gate, not a multi-process exactly-once ledger. */
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
const writerLocks=new Map();let handlers=false;
function cleanupWriters(){for(const [file,owner]of writerLocks){try{if(fs.readFileSync(file,'utf8')===owner)fs.unlinkSync(file);}catch{}}}
export function ensurePaperWriter(directory){
 const file=path.join(path.resolve(directory),'paper-writer.lock');if(writerLocks.has(file)){try{return fs.readFileSync(file,'utf8')===writerLocks.get(file);}catch{return false;}}
 let fd;try{fd=fs.openSync(file,'wx',0o600);const owner=JSON.stringify({pid:process.pid,session:randomUUID()});fs.writeFileSync(fd,owner);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;writerLocks.set(file,owner);
 if(!handlers){handlers=true;process.once('exit',cleanupWriters);for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{cleanupWriters();process.exit(0);});}return true;
 }catch{return false;}finally{if(fd!==undefined)fs.closeSync(fd);}
}
export function atomicPrivateJSON(file,value){
 const temp=file+'.tmp';let fd;
 try{fd=fs.openSync(temp,'w',0o600);fs.fchmodSync(fd,0o600);fs.writeFileSync(fd,JSON.stringify(value));fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
 finally{if(fd!==undefined)fs.closeSync(fd);}
}
export function createPaperIntents(directory){
 const file=path.join(directory,'paper_intents.json');let records=[],broken=false;
 try{if(fs.existsSync(file)){if(fs.statSync(file).size>16777216)throw Error('Paper intent storage capacity');const v=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(v)||v.length>10000||v.some(r=>!r||typeof r.account!=='string'||typeof r.key!=='string'||typeof r.fingerprint!=='string'||!['reserved','completed'].includes(r.state)||(r.state==='completed'&&!r.response?.ok)))throw Error();records=v;}}catch{broken=true;}
 function check(account,key,fingerprint){if(broken)return {blocked:'PAPER_RECOVERY_REQUIRED'};const r=records.find(v=>v.account===account&&v.key===key);if(r)return r.fingerprint!==fingerprint?{blocked:'IDEMPOTENCY_CONFLICT'}:r.state==='completed'?{response:structuredClone(r.response)}:{blocked:'PAPER_RECOVERY_REQUIRED'};if(records.some(v=>v.account===account&&v.state==='reserved'))return {blocked:'PAPER_RECOVERY_REQUIRED'};return {};}
 return {check,reserve(account,key,fingerprint){const prior=check(account,key,fingerprint);if(prior.blocked||prior.response)return prior;if(records.length>=10000)return {blocked:'PAPER_INTENT_CAPACITY'};if(!ensurePaperWriter(directory))return {blocked:'PAPER_WRITER_RECOVERY_REQUIRED'};try{const next=[...records,{account,key,fingerprint,state:'reserved'}];if(Buffer.byteLength(JSON.stringify(next))>16777216)throw Error('Paper intent storage capacity');atomicPrivateJSON(file,next);records=next;return {};}catch{broken=true;return {blocked:'PAPER_RECOVERY_REQUIRED'};}},complete(account,key,response){const r=records.find(v=>v.account===account&&v.key===key);if(!r||r.state!=='reserved')throw Error('Paper intent reservation missing');const next=records.map(v=>v===r?{...v,state:'completed',response:structuredClone(response)}:v);try{if(Buffer.byteLength(JSON.stringify(next))>16777216)throw Error('Paper intent storage capacity');atomicPrivateJSON(file,next);records=next;}catch(e){broken=true;throw e;}}};
}
