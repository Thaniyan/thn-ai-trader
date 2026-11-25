import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptanceSummary,ownerAcceptance} from '../scripts/day9-owner-acceptance.mjs';
import {auditRuntime} from '../scripts/audit-research-runtime.mjs';
const head='a'.repeat(40),context={head,symbol:'EURUSD',interval:'1h'};
const args=['--expected-head',head,'--base','http://127.0.0.1:3000','--symbol','EURUSD','--interval','1h'];
const clean=(...a)=>a[0]==='branch'?'feature/ai-evidence-interpreter-phase2-20261116':a[0]==='rev-parse'?head:'';
async function unavailable(){return auditRuntime({base:'http://127.0.0.1:3000',symbols:['EURUSD'],intervals:['1h'],transport:async()=>({ok:false,status:503,code:'MARKET_DATA_UNAVAILABLE',data:{error:'PRIVATE_BODY',timestamp:1800000000000,price:1.234}})});}
test('Day9 one-context acceptance reuses the original audit without inference or planner calls',async()=>{
 const requests=[];const r=await ownerAcceptance(args,{git:clean,request:async(url,options)=>{requests.push({url,options});return {ok:false,status:503,code:'MARKET_DATA_UNAVAILABLE'};}});
 assert.equal(requests.length,5);assert.equal(requests.filter(r=>r.options.body).length,1);assert.ok(requests.every(r=>!/(respond|orders|research\/plan)/.test(r.url)));
 assert.equal(r.software.candidateRetained,false);assert.ok(r.software.blockers.includes('history_unavailable'));assert.equal(r.software.browserTicketRisk,'NOT_OBSERVED');assert.equal(r.providerConfiguration.inferencePerformed,false);assert.equal(r.evidence.releaseDecision,'NO_GO');assert.equal(r.financialExecution,false);
});
test('Day9 records actual engine direction separately from blocked Command Center admission',async()=>{
 const r=await ownerAcceptance(args,{git:clean,request:async(url)=>new URL(url).pathname==='/api/analyze'?{ok:true,status:200,data:{symbol:'EURUSD',timeframe:'1h',decision:'BUY',entry:1.234}}:{ok:false,status:503,code:'MARKET_DATA_UNAVAILABLE'}});
 assert.equal(r.software.engineDecision,'BUY');assert.equal(r.software.candidateRetained,false);assert.ok(r.software.blockers.includes('history_unavailable'));assert.ok(!JSON.stringify(r).includes('1.234'));assert.equal(r.evidence.ticketQualification,'NOT_VERIFIED');
});
test('Day9 exporter strips private fields including nested provider text, prices, timestamps, hashes and model prose',async()=>{
 const a=await unavailable(),r=a.samples[0].readiness;
 r.observation={source:'PRIVATE_BODY',providerSymbol:'PRIVATE_SYMBOL',currency:'PRIVATE_CURRENCY',status:'recent',count:100,gapCount:2,discardedRows:36,lastTime:1800000000000,hash:'b'.repeat(64),entry:1.234};
 r.dataQuality={metadata:{provider:'yahoo',reportedSymbol:'EURUSD=X',reportedProductType:'CURRENCY',reportedCurrency:'USD',private:'PRIVATE_BODY'},adapter:{rejectionReasons:{invalid_ohlc_geometry:36,missing_ohlc:5}}};r.reasons.push('PRIVATE_BODY');
 const before=JSON.stringify(a),s=acceptanceSummary(a,context),text=JSON.stringify(s);
 for(const secret of ['PRIVATE_BODY','PRIVATE_SYMBOL','PRIVATE_CURRENCY','1800000000000','1.234','b'.repeat(64),'lastTime','"entry"','"hash"'])assert.ok(!text.includes(secret),secret);
 assert.equal(s.selected.closedBars,100);assert.equal(s.rejections.invalid_ohlc_geometry,36);assert.equal(s.metadata.product,'CURRENCY');assert.equal(s.software.unknownBlockerPresent,true);assert.equal(JSON.stringify(a),before);
});
test('Day9 successful software candidate never supplies real source/model/Ticket, rights or browser acceptance',async()=>{
 const a=await unavailable();Object.assign(a.samples[0].readiness,{candidateRetained:true,phase:'ready',risk:'within_budget',aiState:'verified',sourceIdentityMatched:true,reasons:[]});
 const s=acceptanceSummary(a,context);assert.equal(s.software.candidateRetained,true);assert.equal(s.software.risk,'within_budget');assert.equal(s.software.browserAiMethod,'NOT_OBSERVED');
 for(const k of ['marketQualification','modelQualification','ticketQualification'])assert.equal(s.evidence[k],'NOT_VERIFIED');assert.equal(s.evidence.realVersusSynthetic,'OWNER_ATTESTATION_REQUIRED');assert.ok(Object.values(s.sourceApproval).every(x=>x==='NOT_VERIFIED'));assert.equal(s.evidence.releaseDecision,'NO_GO');
});
test('Day9 refuses changed HEAD, branch, dirty tree and remote/credential bases before any request',async()=>{
 let calls=0;const audit=async()=>{calls++;throw Error('must not call');};
 for(const git of [(...a)=>a[0]==='rev-parse'?'b'.repeat(40):clean(...a),(...a)=>a[0]==='branch'?'main':clean(...a),(...a)=>a[0]==='status'?' M public/app.js':clean(...a)])await assert.rejects(ownerAcceptance(args,{git,audit}));
 for(const base of ['http://localhost:3000','https://127.0.0.1:3000','http://127.0.0.1:3000/?token=PRIVATE','http://user:pass@127.0.0.1:3000']){const bad=[...args];bad[3]=base;await assert.rejects(ownerAcceptance(bad,{git:clean,audit}));}assert.equal(calls,0);
});
test('Day9 refuses wrong/extra sample contexts and malformed numeric metrics',async()=>{
 const a=await unavailable();const b=structuredClone(a);b.samples.push(b.samples[0]);assert.throws(()=>acceptanceSummary(b,context));a.samples[0].readiness.context.symbol='BTCUSD';assert.throws(()=>acceptanceSummary(a,context));
 const c=await unavailable();c.samples[0].readiness.observation={count:'100',gapCount:-1,discardedRows:Infinity};const s=acceptanceSummary(c,context);assert.equal(s.selected.closedBars,null);assert.equal(s.selected.gaps,null);assert.equal(s.selected.discardedRows,null);
});
