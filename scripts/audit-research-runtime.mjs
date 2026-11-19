// Read-only existing-runtime audit. No new provider, credentials, generation or orders.
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {researchReadiness} from '../public/research-readiness.js';
const codes=new Set(['MARKET_DATA_UNAVAILABLE','INVALID_MARKET_REQUEST','INVALID_OBSERVATION_TIME','INVALID_OBSERVATION_CURRENCY','INSUFFICIENT_HISTORY','INVALID_CANDLES','INTERVAL_MISMATCH','REQUEST_TIMEOUT','RESPONSE_LIMIT','MALFORMED_RESPONSE','CONNECTION_FAILED']);
export function auditBase(raw){const u=new URL(raw);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||!u.port||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error('Literal loopback HTTP base required');return u.origin;}
export function auditRequest(url,{body}={}){
 const u=new URL(url);if(u.username||u.password||u.hash)throw Error('Credentials and fragments forbidden');auditBase(u.origin);
 if(!['/api/research/catalog','/api/research/series','/api/research/brief','/api/intelligence/provider','/api/analyze'].includes(u.pathname)||Boolean(body)!==(u.pathname==='/api/analyze'))throw Error('Read-only research routes only');
 return new Promise(resolve=>{
  let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value);};
  const req=http.request(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{}},res=>{
   let bytes=0,chunks=[];res.on('data',b=>{bytes+=b.length;if(bytes>2*1024**2){finish({ok:false,code:'RESPONSE_LIMIT'});req.destroy();}else chunks.push(b);});
   res.on('error',()=>finish({ok:false,code:'CONNECTION_FAILED'}));res.on('end',()=>{try{const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));finish({ok:res.statusCode===200&&data.ok!==false,status:res.statusCode,data,code:codes.has(data.code)?data.code:res.statusCode===200?null:'REQUEST_FAILED'});}catch{finish({ok:false,code:'MALFORMED_RESPONSE'});}});
  });
  const timer=setTimeout(()=>{finish({ok:false,code:'REQUEST_TIMEOUT'});req.destroy();},25000);req.on('error',()=>finish({ok:false,code:'CONNECTION_FAILED'}));if(body)req.write(JSON.stringify(body));req.end();
 });
}
export async function auditRuntime({base,symbols=['EURUSD'],intervals=['15m','1h','1d'],transport=auditRequest}){
 const origin=auditBase(base);
 if(!Array.isArray(symbols)||!symbols.length||symbols.length>3||new Set(symbols).size!==symbols.length||symbols.some(s=>!['EURUSD','GBPUSD','USDJPY','BTCUSD','ETHUSD','XAUUSD'].includes(s))||!Array.isArray(intervals)||!intervals.length||intervals.length>3||new Set(intervals).size!==intervals.length||intervals.some(v=>!['15m','1h','1d'].includes(v)))throw Error('Bounded supported symbols and intervals required');
 const read=(path,body)=>transport(origin+path,body?{body}:{});
 const catalog=await read('/api/research/catalog'),provider=await read('/api/intelligence/provider');
 const samples=[];
 for(const symbol of symbols)for(const interval of intervals){
  const [series,brief,analysis]=await Promise.all([read(`/api/research/series?symbol=${symbol}&interval=${interval}`),read(`/api/research/brief?symbol=${symbol}&interval=${interval}`),read('/api/analyze',{symbol,timeframe:interval})]);
  const input={context:{symbol,interval,datasetId:series.ok?series.data.provenance?.hash:null},series:series.ok?series.data:null,brief:brief.data||null,analysis:analysis.ok?analysis.data:null,catalog:catalog.ok?catalog.data.instruments:[]};
  samples.push({symbol,interval,frameFailures:brief.data?.symbol===symbol&&brief.data?.interval===interval&&Array.isArray(brief.data.frames)?brief.data.frames.filter(f=>!f.available&&['15m','1h','1d'].includes(f.interval)).map(f=>({interval:f.interval,code:codes.has(f.code)?f.code:'REQUEST_FAILED'})):[],endpoints:Object.fromEntries([['series',series],['brief',brief],['analysis',analysis]].map(([name,r])=>[name,{ok:!!r.ok,status:r.status??null,code:codes.has(r.code)?r.code:r.ok?null:'REQUEST_FAILED'}])),readiness:researchReadiness(input)});
 }
 return {schema:'THN-RUNTIME-AUDIT-1',asOf:new Date().toISOString(),scope:'Read-only loopback application requests. Source metadata is not independent provider authentication. No inference, execution, hypothetical capital or eligibility is fabricated.',provider:{configurationAvailable:provider.ok&&provider.data.available===true,hostedDisabled:provider.ok?provider.data.hostedDisabled===true:null,qualification:'UNVERIFIED'},samples,executionAuthorized:false,liveEligibleTicket:'NOT_VERIFIED'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const a=process.argv.slice(2);if(a.length!==2&&a.length!==4||a[0]!=='--base'||a.length===4&&a[2]!=='--symbols'){console.error('Usage: node scripts/audit-research-runtime.mjs --base http://127.0.0.1:PORT [--symbols EURUSD,BTCUSD]');process.exitCode=1;}
 else try{console.log(JSON.stringify(await auditRuntime({base:a[1],...(a[3]?{symbols:a[3].split(',')}:{})}),null,2));}catch{console.error('Audit refused: use a literal loopback base and at most three supported instruments. No remote service or credential configuration is performed.');process.exitCode=1;}
}
