import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGeneration,evidenceState,conflictsWithInstrument} from '../public/intelligence-generation.js';
import {providerAvailability} from '../server/intelligence-provider.js';

// The fixtures are offline synthetic references: never market signals or profitability evidence.
const fixture=()=>({
 schema:'THN-EVIDENCE-7',id:'a'.repeat(64),symbol:'EURUSD',interval:'1h',selectedHash:'b'.repeat(64),
 fresh:true,missing:[],limitations:['No predictive probabilities'],asOf:1800000000000,
 refs:[
  {id:'frame-1h',interval:'1h',trend:'bullish',source:'OFFLINE FIXTURE',availableAt:1799996400000,inputs:{close:1.1,rsi:54}},
  {id:'frame-1d',interval:'1d',trend:'bearish',source:'OFFLINE FIXTURE',availableAt:1799913600000,inputs:{close:1.2,rsi:49}},
 ]
});
const valid=s=>({
 schema:'THN-GENERATION-7.1',snapshotId:s.id,symbol:s.symbol,interval:s.interval,
 summary:'Conflicting directional observations require further review.',
 citations:['frame-1h','frame-1d'],
 claims:[{reference:'frame-1h',field:'trend',value:'bullish'}],
 roles:['technical','manager'],evidenceState:'conflicting',
 uncertainties:['The available observations disagree.'],
});
test('strict schema preserves cited exact-value facts; not authoritative trade advice',()=>{
 const s=fixture(),v=valid(s),o=validateGeneration(v,s,{strict:true,expectedRoles:v.roles});
 assert.equal(o.interpretationUnverified,true);
 assert.deepEqual(o.claims,[{reference:'frame-1h',field:'trend',value:'bullish'}]);
 assert.equal(evidenceState(s),'conflicting');
});
test('wrong snapshot, market, timeframe and evidence state fail closed',()=>{
 const s=fixture();
 for(const change of [
  v=>{v.snapshotId='c'.repeat(64)},
  v=>{v.symbol='GBPUSD'},
  v=>{v.interval='1d'},
  v=>{v.evidenceState='consistent'},
 ]){const v=valid(s);change(v);assert.throws(()=>validateGeneration(v,s,{strict:true,expectedRoles:valid(s).roles}));}
 assert.equal(conflictsWithInstrument('GBPUSD analysis','EURUSD'),true);
});
test('invented citation, fabricated claim and changed recorded value are rejected',()=>{
 const s=fixture();
 for(const change of [
  v=>{v.citations=['not-real']},
  v=>{v.claims[0].reference='frame-1d'},
  v=>{v.claims[0].value='bearish'},
  v=>{v.claims[0].field='unsupported'},
 ]){const v=valid(s);change(v);assert.throws(()=>validateGeneration(v,s,{strict:true,expectedRoles:valid(s).roles}));}
});
test('numeric prediction, promised profit and unsupported news prose are rejected',()=>{
 const s=fixture();
 for(const summary of ['Win probability 90 percent.','Guaranteed profit.','Breaking news supports this setup.','Buy now.','احتمال الربح 90٪']){
  const v=valid(s);v.summary=summary;assert.throws(()=>validateGeneration(v,s,{strict:true,expectedRoles:v.roles}));
 }
});
test('role spoofing, missing uncertainties and unexpected fields are rejected',()=>{
 const s=fixture();
 for(const change of [
  v=>{v.roles=['risk','manager']},
  v=>{v.roles=['technical','technical']},
  v=>{v.uncertainties=[]},
  v=>{v.command='execute'},
  v=>{v.claims=[]},
 ]){const v=valid(s);change(v);assert.throws(()=>validateGeneration(v,s,{strict:true,expectedRoles:valid(s).roles}));}
});
test('stale evidence is explicitly insufficient, not a confident model signal',()=>{
 const s=fixture();s.fresh=false;assert.equal(evidenceState(s),'insufficient');
 const v=valid(s);assert.throws(()=>validateGeneration(v,s,{strict:true,expectedRoles:v.roles}));
});
test('hosted runtime cannot activate existing model provider even with flags and credentials',()=>{
 const e={VERCEL:'1',THN_AI_ENABLED:'1',THN_AI_PROVIDER:'openai',THN_AI_AUTH_TOKEN:'fixture-only',
 OPENAI_API_KEY:'fixture-only',THN_AI_MODEL:'fixture',THN_AI_MAX_REQUESTS:'2',
 THN_AI_MAX_OUTPUT_TOKENS:'200',THN_AI_TOTAL_TOKEN_CEILING:'10000'};
 assert.equal(providerAvailability(e).available,false);
 assert.equal(providerAvailability(e).hostedDisabled,true);
});
