import test from 'node:test';
import assert from 'node:assert/strict';
import {waitMatrix} from '../scripts/audit-wait-matrix.mjs';
import {AUDIT_SYMBOLS,AUDIT_INTERVALS} from '../scripts/audit-research-runtime.mjs';
import {analyticalSummary} from '../public/workspace-summary-core.js';
import {commandAssessment} from '../public/command-center-core.js';
const now=1800000000000,hash='a'.repeat(64),head='b'.repeat(40);
const args=['--expected-head',head,'--base','http://127.0.0.1:3000'];
const clean=(...a)=>a[0]==='branch'?'feature/ai-evidence-interpreter-phase2-20261116':a[0]==='rev-parse'?head:'';
function fixture(){const p={hash,source:'synthetic fixture',providerSymbol:'EURUSD=X',currency:'USD',interval:'1h',lastTime:now-3600000,status:'recent',count:100,gapCount:0,discardedRows:0};return {now,context:{symbol:'EURUSD',interval:'1h',datasetId:hash},series:{symbol:'EURUSD',provenance:p,candles:[{time:p.lastTime,close:1.1}]},analysis:{symbol:'EURUSD',timeframe:'1h',evidence:{...p},confidence:86,schools:[{reasons:[]}],consensusLabel:'BULLISH',decision:'BUY',entry:1.1,stopLoss:1.09,targets:[1.12]},brief:{symbol:'EURUSD',interval:'1h',selected:{provenance:{...p},lastCandle:{close:1.1}},frames:AUDIT_INTERVALS.map(interval=>({interval,available:true,trend:'bullish',provenance:{...p,interval,lastTime:now-({'15m':900000,'1h':3600000,'1d':86400000}[interval])}})),complete:true,conflicting:false,scenarios:[{direction:'bullish',readyForPlanning:true,trigger:1.1,invalidation:1.09}]},catalog:[{symbol:'EURUSD',providerSymbol:'EURUSD=X',proxy:false,contract:{contractSize:100000,lotStep:.01,minLot:.01,maxLot:100}}]};}
test('high heuristic agreement and raw BUY remain separate from quality-blocked WAIT; no levels manufactured',()=>{
 const f=fixture();f.series.provenance.gapCount=17;f.series.provenance.discardedRows=93;const before=JSON.stringify(f),m=commandAssessment(f),a=analyticalSummary(m);
 assert.equal(a.signal,'BUY');assert.equal(a.bias,'bullish');assert.equal(a.gaps,17);assert.equal(a.discardedRows,93);assert.equal(m.recommendation.action,'WAIT');assert.equal(m.candidate,null);assert.ok(m.warnings.includes('data_quality'));assert.equal(a.probability,null);assert.equal(a.executionAuthorized,false);assert.equal(JSON.stringify(f),before);
});
test('source, direction, confirmation, contract and geometry blockers remain independently authoritative',()=>{
 for(const [code,mutate] of [['proxy_context',f=>f.catalog[0].proxy=true],['data_quality',f=>f.series.provenance.discardedRows=36],['incomplete_frames',f=>f.brief.frames[0].available=false],['conflicting_frames',f=>f.brief.conflicting=true],['pending_pullback',f=>f.analysis.decision='BUY LIMIT'],['neutral_consensus',f=>f.analysis.consensusLabel='NEUTRAL'],['confirmation_pending',f=>f.brief.scenarios[0].trigger=1.11],['contract_unavailable',f=>delete f.catalog[0].contract],['invalid_recorded_levels',f=>f.analysis.stopLoss=f.analysis.entry]]){
  const f=fixture();mutate(f);const m=commandAssessment(f);assert.ok(m.warnings.includes(code),code);assert.equal(m.candidate,null,code);assert.equal(analyticalSummary(m).signal,f.analysis.decision,code);
 }
});
test('both SELL and BUY LIMIT hypotheses are copied without promotion or re-scoring',()=>{
 const f=fixture();Object.assign(f.analysis,{consensusLabel:'BEARISH',decision:'SELL',stopLoss:1.12,targets:[1.08]});f.series.provenance.gapCount=1;
 assert.equal(analyticalSummary(commandAssessment(f)).signal,'SELL');assert.equal(commandAssessment(f).candidate,null);
 f.analysis.decision='SELL LIMIT';assert.equal(analyticalSummary(commandAssessment(f)).signal,'SELL LIMIT');
 f.analysis.consensusLabel='NEUTRAL';assert.equal(analyticalSummary(commandAssessment(f)).bias,'neutral');
});
test('stale, asynchronous and changed-context raw directions withdraw rather than masquerade as current',()=>{
 for(const mutate of [f=>f.now+=86400000*8,f=>f.analysis.evidence.hash='c'.repeat(64),f=>f.analysis.symbol='GBPUSD',f=>f.context.datasetId='d'.repeat(64),f=>f.busy=true]){const f=fixture();mutate(f);const a=analyticalSummary(commandAssessment(f));assert.equal(a.signal,null);assert.equal(a.bias,null);assert.equal(a.gaps,null);}
});
test('risk review is not invented as the cause of every absent candidate',()=>{
 const m=commandAssessment(fixture());assert.ok(m.candidate);assert.equal(m.recommendation.risk,'unreviewed');assert.ok(m.warnings.includes('risk_review_required'));assert.equal(analyticalSummary(m).signal,'BUY');assert.equal(m.candidate.executionAuthorized,false);
});
const catalog={ok:true,data:{instruments:AUDIT_SYMBOLS.map(symbol=>({symbol,category:'Forex',proxy:false})),intervals:[...AUDIT_INTERVALS]}};
function requestLog(log){return async(url,options)=>{log.push([url,options]);const u=new URL(url);if(u.pathname==='/api/research/catalog')return catalog;if(u.pathname==='/api/analyze')return {ok:true,status:200,data:{symbol:options.body.symbol,timeframe:options.body.timeframe,decision:'BUY LIMIT',consensusLabel:'NEUTRAL',entry:1.23456789,error:'PRIVATE'}};return {ok:false,status:503,code:'MARKET_DATA_UNAVAILABLE',data:{error:'PRIVATE'}};};}
test('one bounded batch covers all54 selectable contexts with164 original read-only requests; no inference/planner',async()=>{
 const log=[];const r=await waitMatrix(args,{git:clean,request:requestLog(log)});assert.equal(r.samples.length,54);assert.equal(new Set(r.samples.map(s=>s.context.symbol+'|'+s.context.interval)).size,54);assert.equal(r.requestCount,164);assert.equal(log.length,164);assert.equal(log.filter(([,o])=>o?.body).length,54);assert.ok(log.every(([u])=>!/(respond|orders|research\/plan|models)/.test(u)));
 assert.equal(r.observed.engineDirections['BUY LIMIT'],54);assert.equal(r.observed.blockerCounts.history_unavailable,54);assert.ok(!r.observed.sharedReportedBlockers.includes('data_quality'));assert.equal(r.observed.softwareCandidatesRetained,0);assert.equal(r.realEligibleTicket,'NOT_VERIFIED');assert.equal(r.releaseDecision,'NO_GO');assert.equal(r.inferencePerformed,false);assert.ok(!JSON.stringify(r).includes('PRIVATE'));assert.ok(!JSON.stringify(r).includes('1.23456789'));assert.ok(r.samples.every(s=>s.software.analyticalConsensus==='NEUTRAL'&&s.sourceApproval.rights==='NOT_VERIFIED'));
});
test('batch refuses changed/unapproved catalog before market requests',async()=>{
 for(const items of [[],[...catalog.data.instruments,{symbol:'NEW'}],catalog.data.instruments.map((v,i)=>i===0?{symbol:'NEW'}:v),catalog.data.instruments.map((v,i)=>i===0?catalog.data.instruments[1]:v)]){let n=0;await assert.rejects(waitMatrix(args,{git:clean,request:async()=>{n++;return {ok:true,data:{...catalog.data,instruments:items}};}}));assert.equal(n,1);}
});
test('exact-head, clean tree, branch and endpoint checks precede any batch requests',async()=>{
 let n=0;const request=async()=>{n++;throw Error();};for(const git of [(...a)=>a[0]==='branch'?'main':clean(...a),(...a)=>a[0]==='status'?' M server.js':clean(...a),(...a)=>a[0]==='rev-parse'?'c'.repeat(40):clean(...a)])await assert.rejects(waitMatrix(args,{git,request}));
 for(const url of ['http://example.com:3000','http://localhost:3000','http://user:pass@127.0.0.1:3000','https://127.0.0.1:3000'])await assert.rejects(waitMatrix([...args.slice(0,3),url],{git:clean,request}));assert.equal(n,0);
});
test('a context mutation during collection refuses the completed export',async()=>{
 let checks=0;await assert.rejects(waitMatrix(args,{git:(...a)=>a[0]==='status'?(++checks===1?'':' M public/app.js'):clean(...a),request:requestLog([])}));assert.equal(checks,2);
});
