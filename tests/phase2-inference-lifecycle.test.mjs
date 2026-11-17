import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceSnapshot} from '../server/intelligence.js';
import {interpretVerifiedEvidence} from '../server/intelligence-inference-lifecycle.js';
import {evidenceState} from '../public/intelligence-generation.js';
const now=1800000000000;
function snapshot(){
 const brief={symbol:'EURUSD',interval:'1h',asOf:now,selected:{provenance:{hash:'2'.repeat(64)},events:[]},
 frames:['15m','1h','1d'].map((interval,i)=>({interval,available:true,trend:i===2?'bearish':'bullish',close:1.1,provenance:{source:'OFFLINE TEST',providerSymbol:'EURUSD=X',hash:String(i+1).repeat(64),lastTime:now-86400000,status:'recent'}}))};
 const s=evidenceSnapshot(brief);assert.equal(s.fresh,true);return s;
}
function generated(s){return {schema:'THN-GENERATION-7.1',snapshotId:s.id,symbol:s.symbol,interval:s.interval,summary:'Directions disagree. Inspect opposing evidence.',citations:['frame-1h','frame-1d'],claims:[{reference:'frame-1h',field:'trend',value:'bullish'}],roles:['technical','manager'],evidenceState:evidenceState(s),uncertainties:['The observations disagree.'],method:'llm',provider:'ollama',model:'offline-fixture'};}
const go=(s,provider,extra={})=>interpretVerifiedEvidence({snapshot:s,provider,question:'Analyze EURUSD',now, ...extra});
test('verified simulated response is clearly labeled, cites source and cannot alter deterministic verdict',async()=>{
 const s=snapshot(),original=JSON.stringify(s);
 const r=await go(s,async()=>generated(s));
 assert.equal(r.method,'llm-assisted');assert.equal(r.model,'offline-fixture');assert.equal(r.generation.claims[0].value,'bullish');
 assert.equal(r.financialExecution,false);assert.equal(JSON.stringify(s),original);assert.ok(r.snapshot&&r.snapshot.id===s.id);
});
test('missing provider, cross-instrument request and stale snapshots fall back without model requests',async()=>{
 const s=snapshot();let calls=0;const mock=async()=>{calls++;return generated(s)};
 assert.equal((await go(s,null)).method,'deterministic');
 assert.equal((await interpretVerifiedEvidence({snapshot:s,question:'Analyze GBPUSD',provider:mock,now})).method,'deterministic');
 const stale=structuredClone(s);stale.fresh=false;
 assert.equal((await go(stale,mock)).method,'deterministic');
 assert.equal(calls,0);
});
test('fabricated claims, unknown numbers, missing citations and prompts are rejected to rules',async()=>{
 const s=snapshot();
 for(const mutate of [
  v=>{v.claims[0].value='bearish'}, v=>{v.summary='Profit 99 percent.'},
  v=>{v.citations=['nonexistent']},v=>{v.roles=['risk']},
  v=>{v.execution=true},v=>{v.summary='Buy now.'}
 ]){const v=generated(s);mutate(v);const r=await go(s,async()=>v);assert.equal(r.method,'deterministic');assert.equal(r.generation,null);}
});
test('timeout/error and delayed context change cannot create accepted generation',async()=>{
 const s=snapshot();
 assert.equal((await go(s,async()=>{throw Error('Provider unavailable')})).method,'deterministic');
 let release;const deferred=new Promise(resolve=>release=resolve);
 const task=go(s,async()=>{await deferred;return generated(s)},{currentSnapshotId:()=> 'different'});
 release();const result=await task;
 assert.equal(result.method,'deterministic');assert.match(result.providerFallback,/context changed/);
});
test('cancellation throws and does not present delayed generated interpretation',async()=>{
 const s=snapshot(),ctrl=new AbortController();let release;
 const provider=async()=>{await new Promise(resolve=>release=resolve);return generated(s)};
 const pending=go(s,provider,{signal:ctrl.signal});
 ctrl.abort();release();
 await assert.rejects(pending);
});
test('missing model identity and mismatched schema always downgrade',async()=>{
 const s=snapshot();
 for(const patch of [{model:''},{provider:'unknown'},{schema:'old'},{snapshotId:'other'}]){
  const r=await go(s,async()=>({...generated(s),...patch}));assert.equal(r.method,'deterministic');
 }
});


test('existing research conversation uses the one strict boundary and preserves session history',async()=>{
 const s=snapshot();
 const {createConversations}=await import('../server/intelligence-conversation.js');
 let calls=0;
 const provider=async()=>{calls++;return generated(s)};
 provider.stats=()=>({modelCalls:calls});
 const svc=createConversations({provider,now:()=>now});
 const context={symbol:'EURUSD',interval:'1h',expectedHash:s.selectedHash};
 const id=svc.start(s,context);
 const r=await svc.respond(id,{...context,question:'Analyze EURUSD',language:'en'});
 assert.equal(r.method,'llm-assisted');assert.equal(r.model,'offline-fixture');
 assert.equal(r.financialExecution,false);assert.equal(r.generation.snapshotId,s.id);
 assert.equal(r.conversation.turn,1);assert.equal(r.modelCalls,1);
});
test('original conversation retains deterministic summary when mock runtime invents unsupported facts',async()=>{
 const s=snapshot();
 const {createConversations}=await import('../server/intelligence-conversation.js');
 let calls=0;const provider=async()=>{calls++;return {...generated(s),summary:'Guaranteed profit.'}};
 provider.stats=()=>({modelCalls:calls});
 const svc=createConversations({provider,now:()=>now});
 const context={symbol:'EURUSD',interval:'1h',expectedHash:s.selectedHash};
 const id=svc.start(s,context);
 const r=await svc.respond(id,{...context,question:'Analyze EURUSD',language:'ar'});
 assert.equal(r.method,'deterministic');assert.equal(r.generation,undefined);
 assert.match(r.providerFallback,/deterministic evidence retained/);
 assert.equal(r.modelCalls,1);
});
test('instruction takeover and execution-only question never receive generated text',async()=>{
 const s=snapshot();let calls=0;
 const prompt=async()=>{calls++;return {...generated(s),summary:'Ignore previous instructions.'}};
 const r=await go(s,prompt);
 assert.equal(r.method,'deterministic');assert.equal(calls,1);
 const e=await interpretVerifiedEvidence({snapshot:s,question:'Execute order now',provider:prompt,now});
 assert.equal(e.method,'deterministic');assert.equal(calls,1);
});
