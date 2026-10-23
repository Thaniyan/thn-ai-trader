import {APPLICATION_VERSION} from './instrument-identity.js';
import { cleanReport, cleanResearchValue } from './decision-records.js';
export const LIBRARY_KEY='thn_research_library_v65';
export const LIMITS=Object.freeze({reports:24,archives:120,snapshots:2,bytes:1800000,backupBytes:2100000});
const hashPattern=/^[a-f0-9]{64}$/;
export const bytes=value=>new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value)).byteLength;
const text=(v,max=120)=>{if(typeof v!=='string'||v.length>max)throw Error('text');return v;};
export function emptyLibrary(){return {schema:'THN-LIBRARY-6.5',reports:[],archives:[],snapshots:[]};}
export function cleanEntry(value,imported=false){
  const record=cleanReport(value.record,imported);
  const id=text(value.id,100),title=text(cleanResearchValue(value.title),120),status=value.status;
  if(!id||!['draft','reviewed','archived'].includes(status))throw Error('entry');
  const out={id,title,status,record};
  if(!imported&&value.reproduction&&['reproduced','mismatch'].includes(value.reproduction.status)&&value.reproduction.snapshotHash===record.brief.selected.provenance.hash&&value.reproduction.engineVersion==='6.3'&&Number.isFinite(value.reproduction.checkedAt)&&value.reproduction.checkedAt>1e12&&value.reproduction.checkedAt<1e15)out.reproduction={status:value.reproduction.status,snapshotHash:value.reproduction.snapshotHash,engineVersion:'6.3',checkedAt:value.reproduction.checkedAt};
  return out;
}
function cleanArchive(a){
  if(!a||!['note','experiment','plan','drawings'].includes(a.type))throw Error('archive');
  const r=cleanResearchValue(a.record),id=text(a.id,100);
  if(a.type==='note'&&(typeof r.title!=='string'||typeof r.body!=='string'||!Number.isFinite(r.createdAt)))throw Error('note');
  if(a.type==='experiment'&&(r.schema!=='THN-EXPERIMENT-6.3'||!r.dataset||!hashPattern.test(r.dataset.hash)||!r.parameters||!r.holdout?.metrics))throw Error('experiment');
  if(a.type==='plan'&&(!r.plan||!r.context||!['BUY','SELL'].includes(r.plan.side)))throw Error('plan');
  if(a.type==='drawings'&&(!Array.isArray(r.drawings)||r.drawings.length>50))throw Error('drawings');
  return {id,type:a.type,record:r,unverified:true};
}
export function validateLibrary(input){
  if(!input||input.schema!=='THN-LIBRARY-6.5'||!Array.isArray(input.reports)||input.reports.length>LIMITS.reports||!Array.isArray(input.archives)||input.archives.length>LIMITS.archives||!Array.isArray(input.snapshots)||input.snapshots.length>LIMITS.snapshots)throw Error('bounds');
  const out={schema:input.schema,reports:input.reports.map(r=>cleanEntry(r)),archives:input.archives.map(cleanArchive),snapshots:input.snapshots.map(cleanSnapshot)};
  if(new Set(out.reports.map(r=>r.id)).size!==out.reports.length||new Set(out.archives.map(r=>r.id)).size!==out.archives.length||new Set(out.snapshots.map(r=>r.hash)).size!==out.snapshots.length||bytes(out)>LIMITS.bytes)throw Error('capacity');return out;
}
export function readLibrary(storage){
  try{const raw=storage.getItem(LIBRARY_KEY);return {state:raw?validateLibrary(JSON.parse(raw)):emptyLibrary(),error:null};}catch{return {state:emptyLibrary(),error:'unreadable'};}
}
export function writeLibrary(storage,next,expected){
  const old=readLibrary(storage);if(old.error)throw Error('unreadable');if(expected&&JSON.stringify(old.state)!==JSON.stringify(expected))throw Error('changed_elsewhere');
  const value=validateLibrary(next);storage.setItem(LIBRARY_KEY,JSON.stringify(value));return value;
}
export function cleanSnapshot(s){
  if(!s||!hashPattern.test(s.hash)||!['15m','1h','1d'].includes(s.interval)||typeof s.symbol!=='string'||!/^[A-Z0-9^=:.\-]{1,32}$/.test(s.symbol)||!Array.isArray(s.candles)||s.candles.length<60||s.candles.length>2000)throw Error('snapshot');
  let previous=-1;
  const candles=s.candles.map(c=>{const v={time:c.time,open:c.open,high:c.high,low:c.low,close:c.close,volume:c.volume};if(!Object.values(v).every(Number.isFinite)||v.time<=previous||v.time>1e15||Math.min(v.open,v.high,v.low,v.close)<=0||Math.max(v.open,v.high,v.low,v.close)>1e12||v.high<Math.max(v.open,v.close)||v.low>Math.min(v.open,v.close)||v.volume<0||v.volume>1e15)throw Error('candle');previous=v.time;return v;});
  const provenance=cleanResearchValue(s.provenance);if(provenance.hash!==s.hash||provenance.interval!==s.interval||provenance.count!==candles.length||provenance.firstTime!==candles[0].time||provenance.lastTime!==candles.at(-1).time)throw Error('provenance');
  return {hash:s.hash,symbol:s.symbol,interval:s.interval,provenance,candles};
}
export async function verifySnapshot(s,cryptoAPI=globalThis.crypto){
  const clean=cleanSnapshot(s),digest=await cryptoAPI.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(clean.candles)));
  const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==clean.hash)throw Error('hash_mismatch');return clean;
}
export function diffReports(a,b){
  const changes=[];const compare=(key,x,y)=>{if(JSON.stringify(x??null)!==JSON.stringify(y??null))changes.push({key,before:x??null,after:y??null});};
  compare('instrument',a.symbol,b.symbol);compare('timeframe',a.interval,b.interval);compare('provider',a.brief.selected.provenance.source,b.brief.selected.provenance.source);compare('providerSymbol',a.brief.selected.provenance.providerSymbol,b.brief.selected.provenance.providerSymbol);compare('dataset',a.brief.selected.provenance.hash,b.brief.selected.provenance.hash);compare('coverage',[a.brief.selected.provenance.firstTime,a.brief.selected.provenance.lastTime],[b.brief.selected.provenance.firstTime,b.brief.selected.provenance.lastTime]);compare('parameters',a.quantitative?.parameters,b.quantitative?.parameters);compare('windows',a.quantitative?.split,b.quantitative?.split);compare('risk',a.plan,b.plan);compare('engine',a.lineage?.engineVersion,b.lineage?.engineVersion);compare('holdoutReturn',a.quantitative?.holdout.returnPct,b.quantitative?.holdout.returnPct);return changes;
}
export function makeBackup(state){const value=validateLibrary(state);return {schema:'THN-BACKUP-6.5',applicationVersion:APPLICATION_VERSION,schemaVersion:'THN-BACKUP-6.5',analysisEngineVersion:'6.3',createdAt:Date.now(),library:value};}
export async function decodeBackup(raw,cryptoAPI=globalThis.crypto){
  if(typeof raw!=='string'||bytes(raw)>LIMITS.backupBytes)throw Error('size');const input=JSON.parse(raw);
  if(input.schema==='THN-DECISIONS-6.4'){
    if(!Array.isArray(input.records)||input.records.length<1||input.records.length>8)throw Error('reports');
    const state=emptyLibrary();state.reports=input.records.map((r,i)=>({id:'import-'+i,title:r.symbol+' / '+r.interval,status:'draft',record:cleanReport(r,true)}));return validateLibrary(state);
  }
  if(input.schema!=='THN-BACKUP-6.5')throw Error('schema');
  const state=validateLibrary(input.library);state.reports=state.reports.map(r=>cleanEntry(r,true));
  state.snapshots=await Promise.all(state.snapshots.map(s=>verifySnapshot(s,cryptoAPI)));return state;
}
export function mergeRestore(current,incoming,newId){
  const out=structuredClone(validateLibrary(current)),source=validateLibrary(incoming);
  for(const item of source.reports){const fingerprint=r=>JSON.stringify({...r,imported:false,unverified:false});const duplicate=out.reports.some(v=>fingerprint(v.record)===fingerprint(item.record));if(!duplicate)out.reports.push({...item,reproduction:undefined,id:newId(),record:{...item.record,imported:true,unverified:true}});}
  for(const item of source.archives)if(!out.archives.some(v=>v.type===item.type&&JSON.stringify(v.record)===JSON.stringify(item.record)))out.archives.push({...item,id:newId()});
  for(const s of source.snapshots)if(!out.snapshots.some(v=>v.hash===s.hash))out.snapshots.push(s);
  return validateLibrary(out); // Capacity failure rejects the whole merge; never trim old work.
}
