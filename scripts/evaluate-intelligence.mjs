// Frozen synthetic evidence comparison; no network, model or performance claim.
import fs from 'node:fs';import {evidenceSnapshot,committee} from '../server/intelligence.js';import {buildBrief} from '../public/decision-core.js';
const now=1800000000000,results=[];
for(const scenario of ['aligned','conflicting','missing','stale','future','changed-dataset']){
 const frames=['15m','1h','1d'].map((interval,i)=>({interval,available:!(scenario==='missing'&&i===2),trend:scenario==='conflicting'&&i===2?'bearish':'bullish',close:1.1,provenance:{hash:(scenario==='changed-dataset'?'f':String(i+1)).repeat(64),source:'FROZEN SYNTHETIC FIXTURE',providerSymbol:'EURUSD=X',lastTime:scenario==='future'?now+1:now-86400000,status:scenario==='stale'?'stale':'recent'}}));
 const series={provenance:{hash:'a'.repeat(64)},candles:[{time:now-3600000,open:1.1,high:1.2,low:1,close:1.1,volume:1}],events:[]};
 const base=buildBrief(series,{frames,asOf:now,complete:!frames.some(f=>!f.available),scenarios:[]},'EURUSD','1h');const begin=performance.now(),result=committee(evidenceSnapshot(base),'Committee challenge');
 results.push({scenario,baseline:{method:base.method,conflicting:base.conflicting,frameClaims:base.claims.length},committee:{outcome:result.outcome,roles:result.roles.length,citationErrors:result.roles.flatMap(r=>r.references).filter(id=>!result.snapshot.refs.some(ref=>ref.id===id)).length,missing:result.snapshot.missing.length,latencyMs:performance.now()-begin,modelCalls:result.modelCalls,tokenUse:0}});
}
const report={fixtureOnly:true,realLLMComparison:null,method:'Measures citation and chronology behavior, not verbosity or predictive superiority.',results};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));else console.log(JSON.stringify(report,null,2));
if(results.some(r=>r.committee.citationErrors))process.exitCode=1;
