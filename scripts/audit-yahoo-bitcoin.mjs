// Isolated operator-only qualification; never imported by application routing.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {recordProviderRows} from '../server/provider-diagnostics.js';
import {closedMarket} from '../server/market-evidence.js';
import {observationExpiry} from '../public/command-center-core.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const ADAPTER='64b39ee0cceb20627e2de8aba28f23c7f7e86e458337aa5a0ba8612252a06828',CONFIG='b47a479bc5ede71e0588017e9a7a0897d6a3e6bcc3505328fd8bd799195d2eed';
const frames=['15m','1h','1d'],ranges=['1mo','6mo','5y'],limit=2*1024*1024;
const realGit=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
export function adapterParts(source){
 source=source.replace(/\r\n/g,'\n');const a=source.indexOf('async function fetchYahooCandles('),b=source.indexOf('\nasync function fetchMarketData(',a),c=source.indexOf('const TIMEFRAME_CONFIG ='),d=source.indexOf('\n};',c)+3;
 if(a<0||b<a||c<0||d<c)throw Error('ADAPTER_REVIEW_REQUIRED');const adapter=source.slice(a,b).trim(),config=source.slice(c,d).trim();
 if(digest(adapter)!==ADAPTER||digest(config)!==CONFIG)throw Error('ADAPTER_REVIEW_REQUIRED');return {adapter,config};
}
async function boundedBytes(response,signal){
 const reader=response.body?.getReader();if(!reader)throw Error('SOURCE_BODY_UNAVAILABLE');const chunks=[];let size=0;
 try{for(;;){signal?.throwIfAborted();const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>limit)throw Error('SOURCE_BODY_LIMIT');chunks.push(r.value);}signal?.throwIfAborted();return Buffer.concat(chunks);}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function auditYahooBitcoin(args,{git=realGit,transport=globalThis.fetch,source,clock=Date.now}={}){
 if(args.length!==2||args[0]!=='--expected-head'||!/^[a-f0-9]{40}$/.test(args[1]))throw Error('EXACT_HEAD_REQUIRED');
 const check=()=>{if(git('branch','--show-current')!=='feature/ai-evidence-interpreter-phase2-20261116'||git('rev-parse','HEAD')!==args[1]||git('status','--porcelain'))throw Error('CLEAN_REVIEWED_BRANCH_REQUIRED');};check();
 const {adapter,config}=adapterParts(source??await fs.readFile(path.join(root,'server.js'),'utf8'));
 const requests=[],samples=[];let current=-1,capture=null;
 const fetchImpl=async(url,options)=>{
  const u=new URL(String(url));
  if(current<0||requests.length>=6||u.protocol!=='https:'||!['query1.finance.yahoo.com','query2.finance.yahoo.com'].includes(u.hostname)||u.port||u.username||u.password||u.hash||u.pathname!=='/v8/finance/chart/BTC-USD'||u.searchParams.get('interval')!==frames[current]||u.searchParams.get('range')!==ranges[current]||u.searchParams.get('includePrePost')!=='false'||u.searchParams.get('events')!=='div,splits'||[...u.searchParams.keys()].sort().join(',')!=='events,includePrePost,interval,range')throw Error('UNEXPECTED_SOURCE_REQUEST');
  const row={interval:frames[current],host:u.hostname,status:null,responseReceived:false,retryAfterHeaderPresent:false};requests.push(row);
  try{const response=await transport(url,{...options,redirect:'error'});row.status=response.status;row.responseReceived=true;row.retryAfterHeaderPresent=response.headers.has('retry-after');
   if(!response.ok)return response;
   const bytes=await boundedBytes(response,options?.signal);capture={bytes,body:null};capture.body=JSON.parse(bytes.toString('utf8'));return new Response(bytes,{status:response.status,headers:response.headers});
  }catch{row.failure='SOURCE_REQUEST_UNAVAILABLE';throw Error('SOURCE_REQUEST_UNAVAILABLE');}
 };
 // Execute only the exact reviewed existing function/config, not a copied price mapper
 // or the production Binance-first fetchMarketData path. No HTTP server is started.
 const fn=new vm.Script(`${config}; (${adapter})`).runInNewContext({fetch:fetchImpl,AbortController,setTimeout,clearTimeout,Date,recordProviderRows},{timeout:1000});
 for(current=0;current<frames.length;current++){
  const interval=frames[current];capture=null;let market=null,series=null,failed=false,asOf=null;
  try{market=await fn({yahoo:'BTC-USD',display:'BTCUSD',assetClass:'Crypto'},interval);asOf=clock();series=closedMarket(market,asOf);}catch{failed=true;}
  const raw=capture?.body?.chart?.result?.[0],times=raw?.timestamp,meta=raw?.meta;
  const count=Array.isArray(times)?times.length:null,withinLimit=count!==null&&count>=35&&count<=20000;
  const unique=withinLimit?new Set(times).size===times.length:null,ordered=withinLimit?times.every((t,i)=>Number.isSafeInteger(t)&&t>0&&(!i||t>times[i-1])):null;
  const identity=meta?.symbol==='BTC-USD'&&meta?.currency==='USD'&&meta?.instrumentType==='CRYPTOCURRENCY';
  const diag=series?.dataDiagnostics,p=series?.evidence;
  const currentObservation=!!(series&&p?.status==='recent'&&asOf<=observationExpiry(p));
  const granularityMatches=meta?.dataGranularity===undefined?null:meta.dataGranularity===interval;
  const quality=!!(series&&withinLimit&&unique&&ordered&&currentObservation&&granularityMatches!==false&&p.gapCount===0&&p.discardedRows===0&&diag?.reconciliation?.gapsMatch===true&&diag?.reconciliation?.rejectionsMatch===true);
  const technical=capture?(identity&&!failed&&quality?'PASS':'FAIL'):'NOT_VERIFIED';
  samples.push({interval,requestedRange:ranges[current],technical,identity:{requestedSymbol:'BTC-USD',reportedSymbol:meta?.symbol==='BTC-USD'?'BTC-USD':null,reportedCurrency:meta?.currency==='USD'?'USD':null,reportedProduct:meta?.instrumentType==='CRYPTOCURRENCY'?'CRYPTOCURRENCY':null,metadataIdentity:!capture?'NOT_VERIFIED':identity?'PASS':'FAIL',base:'BTC',baseBasis:'Derived from reported BTC-USD only; not independently authenticated',venue:'NOT_VERIFIED',priceBasis:'NOT_VERIFIED'},
   sourceBodySHA256:capture?digest(capture.bytes):null,datasetSHA256:p?.hash??null,
   rawRows:count,adapterAcceptedRows:market?.candles.length??null,rejectedRows:market?.discardedRows??null,closedRows:series?.candles.length??null,
   excludedNotClosedOrAfterObservation:diag?.selectedWindow?.excludedNotClosedOrAfterObservation??null,trimmedClosedRows:diag?.selectedWindow?.trimmedClosedRows??null,
   rawSpanHours:ordered&&times.length>1?Math.floor((times.at(-1)-times[0])/3600):null,
   rawTimestampsUnique:unique,rawTimestampsStrictlyIncreasing:ordered,gaps:p?.gapCount??null,rejectionReasons:diag?.adapter?.rejectionReasons??null,
   freshness:currentObservation?'recent':series?'stale':'NOT_VERIFIED',lastClosedUnderOriginalEngine:!!series,reportedGranularityMatches:granularityMatches,
   timezone:diag?.metadata?.reportedTimezone??null,reportedGranularity:diag?.metadata?.reportedGranularity??null,
   weekendGapOverlap:diag?.gaps?.utcWeekendOverlap??null,otherGapShape:diag?.gaps?.otherUtcShape??null,
   reconciliation:{gaps:diag?.reconciliation?.gapsMatch??null,rejections:diag?.reconciliation?.rejectionsMatch??null},
   vendorBarTimestampConvention:'NOT_VERIFIED',engineTimestampConvention:'bar-open; available after interval close',historicalSessionContract:'NOT_VERIFIED',usageRights:'NOT_VERIFIED'});
  // Stop the entire pass when no body can be inspected; no retries or harvesting.
  if(!capture)break;
 }
 check();
 return {schema:'THN-YAHOO-BTC-QUALIFICATION-1',head:args[1],scope:transport===globalThis.fetch?'EXISTING_YAHOO_ROUTE_READ_ONLY':'SYNTHETIC_TRANSPORT_NOT_REAL_QUALIFICATION',adapterSHA256:ADAPTER,configSHA256:CONFIG,
  requests,maximumRequests:6,samples,notAttempted:frames.filter(f=>!samples.some(s=>s.interval===f)),
  technical:samples.some(s=>s.technical==='FAIL')?'FAIL':samples.length===3&&samples.every(s=>s.technical==='PASS')?'PASS':'NOT_VERIFIED',
  sourceContract:'NOT_VERIFIED',usageRights:'NOT_VERIFIED',overallSourceApproval:'NOT_VERIFIED',
  sourceRoutingChanged:false,eligibilityChanged:false,calendarExceptionApplied:false,rawFilesWritten:false,modelInference:false,financialExecution:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const report=await auditYahooBitcoin(process.argv.slice(2));console.log(JSON.stringify(report,null,2));if(report.technical!=='PASS')process.exitCode=2;}
 catch{console.error(JSON.stringify({ok:false,code:'BTC_AUDIT_REFUSED',message:'Use the clean reviewed PR23 branch and exact expected HEAD; adapter review and existing authorized Yahoo access are required.'}));process.exitCode=1;}
}
