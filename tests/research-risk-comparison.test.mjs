import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareResearchRisk,researchRiskHTML} from '../public/research-risk-comparison.js';
const hash='a'.repeat(64),nextHash='b'.repeat(64),at=1700000000000;
function fixture(){
 const p={source:'recorded-provider',providerSymbol:'EURUSD=X',currency:'USD',interval:'1h',hash,lastTime:at,status:'recent'};
 const old={version:'6.4.0',symbol:'EURUSD',side:'BUY',capital:10000,riskPct:1,budget:100,entry:1.1,stop:1.09,targets:[1.12],lots:.1,contractSize:100000,leverage:100,spreadBps:0,slippageBps:0,commissionBps:0,estimatedRoundTripCosts:0,plannedStopLossWithCosts:100,metrics:{contractSize:100000,notionalValue:11000,requiredMargin:110,slDollars:100},inputValid:true,budgetCompliant:true,executionAuthorized:false,context:{symbol:'EURUSD',interval:'1h',datasetHash:hash,dataTimestamp:at,createdAt:at+10}};
 const report={symbol:'EURUSD',interval:'1h',savedAt:at+20,identity:{canonicalInstrument:'EURUSD',observationCurrency:'USD',proxy:false},brief:{selected:{provenance:p}},plan:old,quantitative:{development:{returnPct:7},holdout:{returnPct:-2}}};
 const fresh={...p,hash:nextHash,lastTime:at+3600000};
 const state={supported:true,planState:'valid',context:{symbol:'EURUSD',interval:'1h',datasetId:nextHash},series:{symbol:'EURUSD',provenance:fresh},brief:{symbol:'EURUSD',interval:'1h',selected:{provenance:fresh}},plan:{...structuredClone(old),capital:20000,budget:200,plannedStopLossWithCosts:210,budgetCompliant:false,warnings:['costs_exceed_budget']},planContext:{symbol:'EURUSD',interval:'1h',datasetHash:nextHash,dataTimestamp:fresh.lastTime,createdAt:at+30}};
 return {report,state};
}
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
test('compares supplied server amounts across explicit historical/current snapshots without modifying records',()=>{
 const {report,state}=fixture();freeze(report);freeze(state);const before=JSON.stringify({report,state}),m=compareResearchRisk(report,state);
 assert.equal(m.ready,true);assert.equal(m.rows.find(r=>r.key==='capital').difference,10000);assert.equal(m.rows.find(r=>r.key==='plannedStopLossWithCosts').difference,110);assert.ok(m.warnings.includes('snapshots'));assert.ok(m.warnings.includes('over_budget'));assert.ok(m.warnings.includes('exposure_increased'));assert.equal(JSON.stringify({report,state}),before);
});
test('missing plan never substitutes historical backtest capital or recomputes risk budget',()=>{
 const {report,state}=fixture();delete report.plan;report.quantitative.parameters={capital:10000,riskPct:1};const m=compareResearchRisk(report,state);assert.ok(m.reasons.includes('no_historical_plan'));assert.equal(m.rows.find(r=>r.key==='capital').historical,undefined);assert.ok(m.rows.every(r=>r.difference===null));
});
test('unknown fields remain unknown, including missing target outcomes and zero costs',()=>{
 const {report,state}=fixture();delete report.plan.metrics.requiredMargin;const m=compareResearchRisk(report,state);assert.equal(m.rows.find(r=>r.key==='metrics.requiredMargin').difference,null);assert.equal(m.rows.find(r=>r.key==='estimatedRoundTripCosts').difference,0);assert.equal(m.rows.find(r=>r.key==='targets.1').difference,null);
});
test('invalidated, pending or rejected estimates never retain comparison differences',()=>{
 for(const phase of ['stale','pending','rejected','idle']){const {report,state}=fixture();state.planState=phase;const m=compareResearchRisk(report,state);assert.equal(m.current,null);assert.ok(m.reasons.includes('validate'));assert.ok(m.rows.every(r=>r.difference===null));}
});
test('context, currency, provider and snapshot mismatches withhold all differences',()=>{
 for(const alter of [s=>s.context.interval='15m',s=>s.series.provenance.currency='USDT',s=>s.series.provenance.providerSymbol='other',s=>s.planContext.datasetHash=hash,s=>s.plan.symbol='GBPUSD']){const {report,state}=fixture();alter(state);const m=compareResearchRisk(report,state);assert.equal(m.ready,false);assert.ok(m.rows.every(r=>r.difference===null));}
});
test('unavailable, stale or unmatched research cannot bless an otherwise input-valid estimate',()=>{
 for(const alter of [s=>s.series=null,s=>s.series.provenance.status='stale',s=>s.brief=null]){const {report,state}=fixture();alter(state);assert.equal(compareResearchRisk(report,state).ready,false);}
});
test('original estimate is not presented as a new validation',()=>{
 const {report,state}=fixture();state.planContext.createdAt=report.savedAt;assert.ok(compareResearchRisk(report,state).reasons.includes('new_validation'));
});
test('imports, proxies and incomplete legacy validation metadata remain inspectable without deltas',()=>{
 for(const alter of [r=>r.imported=true,r=>r.identity.proxy=true,r=>delete r.identity,r=>delete r.plan.inputValid,r=>delete r.plan.context]){const {report,state}=fixture();alter(report);const m=compareResearchRisk(report,state);assert.ok(m.rows.every(r=>r.difference===null));assert.match(researchRiskHTML(report,'saved',state),/Historical recorded/);}
});
test('contract version and size mismatches cannot be silently equated',()=>{
 for(const alter of [r=>r.plan.version='old',r=>r.plan.contractSize=1,r=>r.plan.metrics.contractSize=1]){const {report,state}=fixture();alter(report);assert.ok(compareResearchRisk(report,state).reasons.includes('specification'));}
});
test('opposing direction withholds level differences while retaining comparable USD assumptions',()=>{
 const {report,state}=fixture();state.plan.side='SELL';const m=compareResearchRisk(report,state);assert.equal(m.ready,true);assert.equal(m.rows.find(r=>r.key==='entry').difference,null);assert.equal(m.rows.find(r=>r.key==='capital').difference,10000);assert.ok(m.warnings.includes('direction'));
});
test('source timestamps and historical dataset binding are mandatory',()=>{
 const {report,state}=fixture();report.plan.context.dataTimestamp=at+1;assert.ok(compareResearchRisk(report,state).reasons.includes('historical_binding'));delete state.series.provenance.lastTime;assert.ok(compareResearchRisk(report,state).reasons.includes('evidence'));
});
test('untrusted titles and provenance remain text, without any performance projection',()=>{
 const {report,state}=fixture();report.brief.selected.provenance.providerSymbol='<img src=x>';const html=researchRiskHTML(report,'<script>alert(1)</script>',state);assert.doesNotMatch(html,/<img|<script/);assert.match(html,/&lt;script/);assert.match(html,/never recalculate historical strategy returns/);
});
test('different scenario reference contexts cannot be treated as equivalent analytical price levels',()=>{
 const {report,state}=fixture();report.plan.context.sourceInterval='1h';report.plan.context.sourceDatasetHash=hash;state.planContext.sourceInterval='15m';state.planContext.sourceDatasetHash=nextHash;
 const m=compareResearchRisk(report,state);assert.ok(m.warnings.includes('reference_context'));assert.equal(m.rows.find(r=>r.key==='entry').difference,null);assert.equal(m.rows.find(r=>r.key==='capital').difference,10000);
});
