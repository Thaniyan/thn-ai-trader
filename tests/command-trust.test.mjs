import test from 'node:test';
import assert from 'node:assert/strict';
import {trustEvidence} from '../public/command-trust-core.js';
const context={symbol:'EURUSD',interval:'1h',datasetId:'a'.repeat(64)};
const analysis={symbol:'EURUSD',timeframe:'1h',evidence:{hash:context.datasetId},confidence:82,consensusScore:9,schools:[{name:'Trend',bias:'BULLISH',reasons:['Recorded trend']},{name:'Counter',bias:'BEARISH',reasons:['Recorded opposition'],warnings:['Risk']}]};
const evaluation={symbol:'EURUSD',dataset:{interval:'1h',hash:context.datasetId},holdout:{metrics:{trades:3}}};
const candidate={symbol:'EURUSD',entry:1.2,stop:1.1,targets:[1.3],executionAuthorized:false};
const model={fresh:true,confidence:{confluence:82,testStatus:'complete',checks:[{code:'trade_count',pass:false}]},candidate,warnings:['conflicting_frames']};
test('trust presentation preserves original candidate, flags, contradictions and missing score inputs without a probability',()=>{
 const before=JSON.stringify({analysis,evaluation,candidate});const r=trustEvidence({model,analysis,evaluation,context});assert.equal(r.confluence,82);assert.equal(r.validationCurrent,true);assert.equal(r.checks[0].pass,false);assert.equal(r.scoreInputs.weightedConsensus,9);assert.equal(r.scoreInputs.riskWarningCount,null);assert.equal(r.schools[1].bias,'BEARISH');assert.equal(r.probability,null);assert.equal(r.executionAuthorized,false);assert.deepEqual(r.candidate,candidate);r.candidate.targets[0]=99;assert.equal(JSON.stringify({analysis,evaluation,candidate}),before);
});
test('mismatched symbol, timeframe or dataset never displays retained evaluation or candidate as current',()=>{
 for(const c of [{...context,symbol:'GBPUSD'},{...context,interval:'15m'},{...context,datasetId:'b'.repeat(64)}]){const r=trustEvidence({model,analysis,evaluation,context:c});assert.equal(r.current,false);assert.equal(r.confluence,null);assert.equal(r.evaluation,null);assert.equal(r.candidate,null);assert.equal(r.validationCurrent,false);assert.deepEqual(r.schools,[]);}
});
test('running, dirty and failed evaluations retain historical evidence without a current-validation claim',()=>{
 for(const state of [{busy:true},{dirty:true},{failed:true}]){const r=trustEvidence({model,analysis,evaluation,context,evaluationState:state});assert.equal(r.evaluation,evaluation);assert.equal(r.validationCurrent,false);assert.equal(r.probability,null);}
});
test('stale or absent analysis clears confluence and trade while historical evidence stays separately recorded',()=>{
 for(const a of [null,analysis]){const r=trustEvidence({model:{...model,fresh:false},analysis:a,evaluation,context});assert.equal(r.current,false);assert.equal(r.candidate,null);assert.equal(r.confluence,null);assert.equal(r.evaluation,evaluation);}
 const r=trustEvidence({context});assert.equal(r.status,'untested');assert.equal(r.evaluation,null);assert.deepEqual(r.checks,[]);assert.equal(r.probability,null);
});
