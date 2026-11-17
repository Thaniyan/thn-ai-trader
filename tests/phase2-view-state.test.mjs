import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceSnapshot,committee} from '../server/intelligence.js';
import {admitInterpretation,interpretationView} from '../public/intelligence-view-state.js';
import {evidenceState} from '../public/intelligence-generation.js';
const now=1800000000000;
const snapshot=evidenceSnapshot({symbol:'EURUSD',interval:'1h',asOf:now,selected:{provenance:{hash:'2'.repeat(64)},events:[]},frames:['15m','1h','1d'].map((interval,i)=>({interval,available:true,trend:i===2?'bearish':'bullish',provenance:{source:'OFFLINE TEST',providerSymbol:'EURUSD=X',hash:String(i+1).repeat(64),lastTime:now-86400000,status:'recent'}}))});
const context={symbol:snapshot.symbol,interval:snapshot.interval,expectedHash:snapshot.selectedHash};
const result=()=>committee(snapshot,'Analyze EURUSD');
function model(){const r=result();r.method='llm-assisted';r.modelCalls=1;r.provider='ollama';r.model='offline-fixture';r.summary='The recorded directions disagree.';r.generation={schema:'THN-GENERATION-7.1',snapshotId:snapshot.id,symbol:snapshot.symbol,interval:snapshot.interval,summary:r.summary,citations:['frame-1h'],claims:[{reference:'frame-1h',field:'trend',value:'bullish'}],roles:r.roles.map(r=>r.role),evidenceState:evidenceState(snapshot),uncertainties:['Opposing evidence remains.'],provider:r.provider,model:r.model};return r;}
test('current deterministic response is admitted without changing its evidence or authority',()=>{
 const r=result(),before=JSON.stringify(r);assert.equal(admitInterpretation(r,context),r);assert.equal(JSON.stringify(r),before);assert.equal(r.financialExecution,false);
});
test('client refuses wrong instrument, timeframe, hash, imported and missing source identity',()=>{
 for(const patch of [{symbol:'BTCUSD'},{interval:'1d'},{expectedHash:'3'.repeat(64)},{expectedHash:''}])assert.throws(()=>admitInterpretation(result(),{...context,...patch}));
 assert.throws(()=>admitInterpretation({...result(),unverified:true},context));
});
test('client cannot silently upgrade a deterministic request into model generation',()=>{
 assert.throws(()=>admitInterpretation(model(),context));assert.equal(admitInterpretation(model(),context,{generative:true}).method,'llm-assisted');
});
test('fabricated model facts, identity mismatch and ambiguous method fail at presentation boundary',()=>{
 for(const mutate of [r=>r.generation.claims[0].value='bearish',r=>r.model='other',r=>r.generation.snapshotId='other',r=>r.summary='Guaranteed profit.',r=>r.method='deterministic']){const r=model();mutate(r);assert.throws(()=>admitInterpretation(r,context,{generative:true}));}
});
const view=(extra={})=>interpretationView({result:result(),phase:'ready',requestSignature:'A',resultSignature:'A',signature:'A',language:'en',resultLanguage:'en',now,...extra});
test('view withdraws context, assumptions, language, future and expired evidence',()=>{
 assert.equal(view().current,true);
 for(const extra of [{signature:'B'},{language:'ar'},{now:now+600001},{now:now-1},{result:{...result(),unverified:true}}]){const v=view(extra);assert.equal(v.current,false);assert.equal(v.phase,'stale');assert.equal(v.result,null);}
});
test('read-only projection cannot mutate the assistant record',()=>{const r=result(),v=view({result:r});v.result.snapshot.symbol='BTCUSD';assert.equal(r.snapshot.symbol,'EURUSD');});
test('loading, failed and cancelled attempts do not present the previous accepted result as new evidence',()=>{
 for(const phase of ['loading','error','cancelled']){const v=view({phase});assert.equal(v.phase,phase);assert.equal(v.current,false);assert.equal(v.result,null);}
});
