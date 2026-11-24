// One bounded owner-device investigation, reusing the original audit and exporter.
// No new endpoint/provider, retries, planner, inference, price export or admission.
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {auditBase,auditRequest,auditRuntime,AUDIT_SYMBOLS,AUDIT_INTERVALS} from './audit-research-runtime.mjs';
import {acceptanceSummary} from './day9-owner-acceptance.mjs';

export async function waitMatrix(args,{git=(...a)=>execFileSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(),request=auditRequest,clock=()=>new Date().toISOString()}={}){
 if(args.length!==4||args[0]!=='--expected-head'||args[2]!=='--base'||!/^[a-f0-9]{40}$/.test(args[1]))throw Error('Exact head and loopback base required');
 const head=args[1],base=auditBase(args[3]);
 const check=()=>{if(git('branch','--show-current')!=='feature/ai-evidence-interpreter-phase2-20261116'||git('rev-parse','HEAD')!==head||git('status','--porcelain=v1'))throw Error('Clean exact-head existing branch required');};check();
 const startedAt=clock();let requests=0;
 const read=async(url,options)=>{if(++requests>164)throw Error('Read-only batch request ceiling');return request(url,options);};
 const catalog=await read(base+'/api/research/catalog');
 const items=catalog.ok&&catalog.data?.instruments,intervals=catalog.data?.intervals;
 if(!Array.isArray(items)||items.length!==18||new Set(items.map(v=>v?.symbol)).size!==18||items.some(v=>!AUDIT_SYMBOLS.includes(v?.symbol))||!Array.isArray(intervals)||intervals.length!==3||new Set(intervals).size!==3||intervals.some(v=>!AUDIT_INTERVALS.includes(v)))throw Error('Reviewed selectable catalog changed or unavailable');
 const provider=await read(base+'/api/intelligence/provider');const samples=[];
 // Original three-symbol/nine-context limit per audit call is unchanged. Cache
 // catalog/configuration only, never observations, to keep the entire batch164 requests.
 for(let start=0;start<items.length;start+=3){
  const decisions=new Map();
  const transport=async(url,options)=>{
   const path=new URL(url).pathname;if(path==='/api/research/catalog')return catalog;if(path==='/api/intelligence/provider')return provider;
   const response=await read(url,options);
   if(path==='/api/analyze'&&response.ok){const a=response.data,b=options?.body;if(a?.symbol===b?.symbol&&a?.timeframe===b?.timeframe)decisions.set(a.symbol+'|'+a.timeframe,{decision:a.decision,consensus:a.consensusLabel});}
   return response;
  };
  const audit=await auditRuntime({base,symbols:items.slice(start,start+3).map(v=>v.symbol),intervals:AUDIT_INTERVALS,transport});
  for(const sample of audit.samples){const raw=decisions.get(sample.symbol+'|'+sample.interval),report=acceptanceSummary({...audit,samples:[sample]},{head,symbol:sample.symbol,interval:sample.interval,analysisDecision:raw?.decision,analyticalConsensus:raw?.consensus});samples.push(report);}
 }
 check();
 const counts={};for(const s of samples)for(const reason of s.software.blockers)counts[reason]=(counts[reason]||0)+1;
 return {schema:'THN-WAIT-MATRIX-1',head,startedAt,completedAt:clock(),scope:'ONE read-only existing-source batch; rolling observations, not a simultaneous snapshot. Owner real-versus-synthetic attestation required. No source rights or real Ticket qualification inferred.',requestCount:requests,maximumRequests:164,
  selectable:{instruments:items.map(v=>({symbol:v.symbol,category:['Forex','Metals','Oil','Crypto','Index'].includes(v.category)?v.category:null,catalogProxy:typeof v.proxy==='boolean'?v.proxy:null})),intervals:[...AUDIT_INTERVALS],contexts:54},
  observed:{contexts:samples.length,allThreeEndpointsSucceeded:samples.filter(s=>Object.values(s.endpoints).every(e=>e.ok)).length,softwareCandidatesRetained:samples.filter(s=>s.software.candidateRetained).length,engineDirections:Object.fromEntries(['BUY','SELL','BUY LIMIT','SELL LIMIT','WAIT','unavailable'].map(v=>[v,samples.filter(s=>(s.software.engineDecision||'unavailable')===v).length])),blockerCounts:counts,sharedReportedBlockers:Object.keys(counts).filter(k=>counts[k]===samples.length)},
  limitations:['Blocker counts overlap; co-occurrence does not establish sole causality.','Risk unreviewed is expected: no capital, planner or browser state is submitted. It does not itself prevent the original engine from retaining a candidate.','Source rights/contract/calendar remain independent NOT_VERIFIED release gates, not invented runtime reason codes.','No observed software candidate is a qualified real-market Ticket without source/rights, exact risk binding and independent owner acceptance.'],samples,realEligibleTicket:'NOT_VERIFIED',modelQualification:'NOT_VERIFIED',releaseDecision:'NO_GO',eligibilityChanged:false,sourceChanged:false,inferencePerformed:false,financialExecution:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await waitMatrix(process.argv.slice(2)),null,2));}catch{console.error(JSON.stringify({ok:false,code:'WAIT_MATRIX_REFUSED',message:'Use the clean reviewed PR23 branch, exact expected HEAD and literal loopback base. The reviewed18-instrument/three-interval catalog is required. No qualification is established.'}));process.exitCode=1;}}
