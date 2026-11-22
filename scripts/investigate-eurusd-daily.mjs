// One-shot operator-local P1 case trace. Never imported by production.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {prepareSeries} from '../server/research.js';
import {rowDetailCollector} from '../server/provider-shapes.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const pinnedMapping='774b2f1c5fb7be9b4aeb929d30f4e7f0d6cacdf4fcda17c4ed3176f558a11520';
const limit=2*1024*1024;
let used=false;
export function mappingIdentity(source){const start=source.indexOf('async function fetchYahooCandles('),a=source.indexOf('const rows = timestamps.map(',start),b=source.indexOf('recordProviderRows(rows,candles,',a);if(start<0||a<start||b<a||b-a>12000||hash(source.slice(a,b).trim())!==pinnedMapping)throw Error('ADAPTER_REVIEW_REQUIRED');return pinnedMapping;}
export function compareCapture(body,api,asOf=Date.now()){
 let source;try{source=JSON.parse(body);}catch{throw Error('SOURCE_JSON_INVALID');}
 const r=source?.chart?.result?.[0],q=r?.indicators?.quote?.[0],times=r?.timestamp;
 if(!q||!Array.isArray(times)||times.length<60||times.length>5000||r.meta?.symbol!=='EURUSD=X'||r.meta?.currency!=='USD')throw Error('SOURCE_CONTRACT_UNVERIFIED');
 // A mirror of the hash-pinned direct mapping above, not a replacement adapter.
 const rows=times.map((t,i)=>({time:t*1000,open:q.open?.[i],high:q.high?.[i],low:q.low?.[i],close:q.close?.[i],volume:q.volume?.[i]||0}));
 const kept=rows.filter(c=>c.open!=null&&c.high!=null&&c.low!=null&&c.close!=null&&[c.open,c.high,c.low,c.close].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0)&&c.high>=Math.max(c.open,c.close)&&c.low<=Math.min(c.open,c.close));
 const selected=new Set(kept),collector=rowDetailCollector(null);let missing=0;
 for(const [i,row] of rows.entries())if(!selected.has(row)){const v=[row.open,row.high,row.low,row.close],reason=v.some(x=>x==null)?'missing_ohlc':v.some(x=>typeof x!=='number'||!Number.isFinite(x))?'other':v.some(x=>x<=0)?'other':'invalid_ohlc_geometry';if(reason==='missing_ohlc')missing++;collector.add(row,reason,i);}
 const geometry=collector.finish().report.geometry;
 const through=Math.min(asOf,r.meta.regularMarketTime*1000),directClosedHash=hash(JSON.stringify(kept.filter(c=>c.time+86400000<=through).slice(-2000)));
 const expected=prepareSeries({interval:'1d',candles:kept,discardedRows:rows.length-kept.length,source:'Yahoo Finance chart data',providerSymbol:'EURUSD=X',currency:'USD',marketTime:r.meta.regularMarketTime*1000},'1d',Math.min(asOf,r.meta.regularMarketTime*1000));
 const expectedHash=expected.provenance.hash,enginePreservesMappedClosedBars=expectedHash===directClosedHash&&hash(JSON.stringify(expected.candles))===directClosedHash,apiHash=hash(JSON.stringify(api?.candles)),matches=enginePreservesMappedClosedBars&&api?.ok===true&&api.symbol==='EURUSD'&&api.provenance?.providerSymbol==='EURUSD=X'&&api.provenance?.currency==='USD'&&api.provenance?.interval==='1d'&&api.provenance?.hash===expectedHash&&apiHash===expectedHash&&api.provenance?.discardedRows===rows.length-kept.length;
 return {rawRows:rows.length,adapterRetainedRows:kept.length,missingRows:missing,sourceGeometry:{count:geometry.count,comparisonMaskCounts:geometry.comparisonMaskCounts,boundaryCounts:geometry.boundaryCounts,severityBuckets:geometry.severityBuckets},pipeline:{mappingIdentity:pinnedMapping,enginePreservesMappedClosedBars,apiMatchesExpectedClosedBars:matches,expectedDatasetHash:expectedHash},proximateOrigin:matches?(geometry.count?'SOURCE_RESPONSE':'NO_GEOMETRY_ANOMALY_IN_THIS_CAPTURE'):'UNESTABLISHED',upstreamBarConstructionCause:'NOT_ESTABLISHED',historical36RecordIdentity:'NOT_ESTABLISHED',executionAuthorized:false};
}
export async function privateCaptureDirectory(raw){
 if(typeof raw!=='string'||!path.isAbsolute(raw))throw Error('ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const parent=await fs.realpath(raw),repo=await fs.realpath(root),rel=path.relative(repo,parent);
 if(!rel||!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel))throw Error('PRIVATE_DIRECTORY_OUTSIDE_REPOSITORY_REQUIRED');
 for(let p=parent;;p=path.dirname(p)){try{await fs.lstat(path.join(p,'.git'));throw Error('PRIVATE_DIRECTORY_IN_GIT_CHECKOUT');}catch(e){if(e.code!=='ENOENT')throw e;}if(path.dirname(p)===p)break;}
 const stat=await fs.stat(parent);if(!stat.isDirectory()||process.platform!=='win32'&&(stat.mode&0o077)!==0)throw Error('OWNER_PRIVATE_DIRECTORY_REQUIRED');
 return fs.mkdtemp(path.join(parent,'eurusd-daily-'));
}
async function bytes(response){const reader=response.body?.getReader();if(!reader)throw Error('EMPTY_SOURCE_BODY');const parts=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('SOURCE_RESPONSE_LIMIT');parts.push(value);}return Buffer.concat(parts);}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}}
function localSeries(port){return new Promise((resolve,reject)=>{const req=http.get({host:'127.0.0.1',port,signal:AbortSignal.timeout(20000),path:'/api/research/series?symbol=EURUSD&interval=1d'},res=>{let size=0,b=[];res.on('data',chunk=>{size+=chunk.length;if(size>limit){req.destroy();reject(Error('API_RESPONSE_LIMIT'));}else b.push(chunk);});res.on('error',()=>reject(Error('API_TRANSPORT_FAILED')));res.on('end',()=>{try{resolve({status:res.statusCode,data:JSON.parse(Buffer.concat(b))});}catch{reject(Error('API_RESPONSE_INVALID'));}});});req.setTimeout(20000,()=>req.destroy(Error('API_DEADLINE')));req.on('error',()=>reject(Error('API_TRANSPORT_FAILED')));});}
export async function investigate({privateDir,fetchImpl}={}){
 if(used)throw Error('FRESH_OPERATOR_PROCESS_REQUIRED');used=true;
 const mapping=mappingIdentity(await fs.readFile(path.join(root,'server.js'),'utf8')),directory=await privateCaptureDirectory(privateDir),originalFetch=globalThis.fetch,transport=fetchImpl||originalFetch,snapshots=[],requests=[];
 Object.assign(process.env,{VERCEL:'1',THN_AI_ENABLED:'0',THN_LOCAL_PAPER:'0'});
 globalThis.fetch=async(url,options)=>{
  const u=new URL(String(url));
  if(requests.length>=2||u.protocol!=='https:'||!['query1.finance.yahoo.com','query2.finance.yahoo.com'].includes(u.hostname)||decodeURIComponent(u.pathname)!=='/v8/finance/chart/EURUSD=X'||u.searchParams.get('range')!=='5y'||u.searchParams.get('interval')!=='1d'||u.searchParams.get('includePrePost')!=='false'||u.searchParams.get('events')!=='div,splits'||[...u.searchParams.keys()].sort().join(',')!=='events,includePrePost,interval,range'||u.username||u.password||u.port||u.hash)throw Error('UNEXPECTED_SOURCE_REQUEST');
  const request={host:u.hostname,status:null,received:false};requests.push(request);
  try{const response=await transport(url,{...options,redirect:'error'});request.status=response.status;if(response.ok){const body=await bytes(response),file=path.join(directory,`source-${requests.length}.json`);await fs.writeFile(file,body,{flag:'wx',mode:0o600});await fs.chmod(file,0o400);const manifest=file+'.sha256';await fs.writeFile(manifest,hash(body)+'\n',{flag:'wx',mode:0o600});await fs.chmod(manifest,0o400);snapshots.push({file,sha256:hash(body),body});request.received=true;options?.signal?.throwIfAborted();return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});}return response;}catch{request.failure='SOURCE_REQUEST_FAILED';throw Error('SOURCE_REQUEST_FAILED');}
 };
 let app,api,result=null,analysisFailure=null;const capturedAt=new Date().toISOString();
 try{({default:app}=await import('../server.js'));if(app.listening)throw Error('FRESH_OPERATOR_PROCESS_REQUIRED');await new Promise((resolve,reject)=>{app.once('error',reject);app.listen(0,'127.0.0.1',resolve);});api=await localSeries(app.address().port);
  if(api.status===200&&snapshots.length){const last=snapshots.at(-1);try{result=compareCapture(last.body.toString('utf8'),api.data);}catch(e){analysisFailure=['SOURCE_JSON_INVALID','SOURCE_CONTRACT_UNVERIFIED'].includes(e.message)?e.message:'COMPARISON_UNVERIFIED';}}
  const immutable=await Promise.all(snapshots.map(async s=>({sha256:s.sha256,bytes:s.body.length,unchanged:hash(await fs.readFile(s.file))===s.sha256})));
  if(immutable.some(s=>!s.unchanged))throw Error('PRIVATE_ORIGINAL_CHANGED');
  const report={schema:'THN-EURUSD-P1-1',scope:fetchImpl?'CONTROLLED_FIXTURE_NOT_REAL_DATA':'EXISTING_SOURCE_READ_ONLY_CURRENT_CAPTURE',capturedAt,mappingIdentity:mapping,sourceRequests:requests,apiStatus:api.status,privateOriginals:immutable,analysisFailure,result,state:result?.pipeline.apiMatchesExpectedClosedBars?'COMPARISON_COMPLETE':'BLOCKED_OR_UNVERIFIED',qualificationChanged:false,calendarExceptionApplied:false,executionAuthorized:false};
  await fs.writeFile(path.join(directory,'redacted-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});return report;
 }finally{globalThis.fetch=originalFetch;if(app?.listening)await new Promise(resolve=>app.close(resolve));}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=process.argv.slice(2);if(a.length!==2||a[0]!=='--private-dir'){console.error('Usage: node scripts/investigate-eurusd-daily.mjs --private-dir ABSOLUTE_OWNER_PRIVATE_FOLDER_OUTSIDE_GIT');process.exitCode=1;}
 else try{const report=await investigate({privateDir:a[1]});console.log(JSON.stringify(report,null,2));if(report.state!=='COMPARISON_COMPLETE')process.exitCode=2;}catch{console.error('P1 investigation stopped. No public raw evidence or financial changes. Check private-directory requirements, unchanged adapter mapping and existing source availability.');process.exitCode=1;}
}
