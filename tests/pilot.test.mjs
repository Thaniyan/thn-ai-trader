import {test} from 'node:test';import assert from 'node:assert/strict';
import {createProvider,providerAvailability} from '../server/intelligence-provider.js';
import {localEndpoint,localConfiguration,localPilotRequest,validateLocalSnapshot,inspectLocalModel,loopbackJSON} from '../server/intelligence-local.js';
import {createConversations} from '../server/intelligence-conversation.js';
import {validateGeneration} from '../public/intelligence-generation.js';
import {cleanCommittee} from '../public/intelligence-memory.js';
import {cleanEntry,makeBackup,decodeBackup,emptyLibrary} from '../public/library-core.js';
import {replayFixture} from './replay-fixture.js';
import {pilotEnv,pilotSnapshot,pilotAnswer,mockRuntime} from './pilot-fixture.mjs';
const authorization='Bearer '+pilotEnv.THN_AI_AUTH_TOKEN;
const context=s=>({symbol:s.symbol,interval:s.interval,expectedHash:s.selectedHash,question:'Analyze',language:'en'});
test('local endpoint rejects external, cloud, credentials, alternate ports, paths and rebinding forms',()=>{
 for(const u of ['https://localhost:11434','http://127.0.0.1:8080','http://127.0.0.1:11434/api/chat','http://user:pass@localhost:11434','http://evil.invalid:11434','http://localhost.evil.invalid:11434','http://169.254.169.254:11434','http://127.0.0.1:11434/?url=x'])assert.throws(()=>localEndpoint(u),u);
 assert.equal(localEndpoint('http://localhost:11434'),'http://127.0.0.1:11434');assert.equal(localEndpoint('http://[::1]:11434'),'http://[::1]:11434');
 for(const model of ['fixture:cloud','https://evil.invalid/model','registry/model','fixture-cloud:tag'])assert.equal(localConfiguration({...pilotEnv,THN_AI_MODEL:model}),null);
});
test('hosted flags and remote/forwarded callers cannot expose a local model proxy',()=>{
 const req={headers:{host:'localhost:3000'},socket:{remoteAddress:'127.0.0.1'}};assert.equal(localPilotRequest(req,{}),true);
 for(const flag of ['VERCEL','AWS_LAMBDA_FUNCTION_NAME','NETLIFY','K_SERVICE','CF_PAGES']){assert.equal(localPilotRequest(req,{[flag]:'1'}),false);assert.equal(providerAvailability({...pilotEnv,[flag]:'1'}).available,false);}
 for(const req of [{headers:{host:'evil.invalid'},socket:{remoteAddress:'127.0.0.1'}},{headers:{host:'localhost',forwarded:'x'},socket:{remoteAddress:'127.0.0.1'}},{headers:{host:'localhost'},socket:{remoteAddress:'192.0.2.1'}}])assert.equal(localPilotRequest(req,{}),false);
});
test('inventory requires installed local weights and rejects cloud-backed metadata; never pulls',async()=>{
 const s=pilotSnapshot(),transport=mockRuntime(s);assert.equal((await inspectLocalModel(pilotEnv,{transport})).localWeightsVerified,true);
 for(const tags of [{models:[]},{models:[{name:pilotEnv.THN_AI_MODEL,size:3*1024**3,digest:'a'.repeat(64)}]},{models:[{name:pilotEnv.THN_AI_MODEL,size:0,digest:'a'.repeat(64)}]},{models:[{name:pilotEnv.THN_AI_MODEL,size:10000000,digest:'a'.repeat(64),remote_host:'cloud'}]}])await assert.rejects(inspectLocalModel(pilotEnv,{transport:async()=>tags}));
 await assert.rejects(inspectLocalModel(pilotEnv,{transport:async(e,p,o)=>p==='/api/show'?{remote_model:'cloud'}:transport(e,p,o)}));
 await assert.rejects(loopbackJSON('http://localhost:11434','/api/pull'));
});
test('authenticated mock generation sends bounded structured messages and validates exact factual claims',async()=>{
 const s=pilotSnapshot(),seen=[],provider=createProvider({env:pilotEnv,localTransport:mockRuntime(s,{seen})});await assert.rejects(provider(s,'Analyze',{}));assert.equal(seen.length,0);
 const r=await provider(s,'Analyze',{authorization});assert.equal(r.method,'llm');assert.equal(r.claims[0].value,s.refs[1].inputs.close);assert.equal(r.interpretationUnverified,true);assert.equal(r.evidenceState,'conflicting');assert.equal(provider.stats().modelCalls,1);
 const body=seen.find(x=>x.path==='/api/chat').body;assert.equal(body.stream,false);assert.equal(body.keep_alive,0);assert.equal(body.options.num_thread,1);assert.equal(body.format.additionalProperties,false);assert.equal(body.tools,undefined);assert.ok(body.messages.every(m=>!m.content.includes(pilotEnv.THN_AI_AUTH_TOKEN)));
});
test('immutable conversations retain server evidence and bounded followups, cancellation and context checks',async()=>{
 const s=pilotSnapshot(),seen=[],provider=createProvider({env:pilotEnv,localTransport:mockRuntime(s,{seen})}),sessions=createConversations({provider,maxTurns:2}),input=context(s),id=sessions.start(s,input),original=s.id;
 s.refs[0].inputs.close=999;const a=await sessions.respond(id,input,{authorization});assert.equal(a.method,'llm-assisted');assert.equal(a.snapshot.id,original);assert.notEqual(a.snapshot.refs[0].inputs.close,999);
 const b=await sessions.respond(id,{...input,question:'Explain this evidence'},{authorization});assert.equal(b.conversation.snapshotId,original);assert.equal(seen.filter(x=>x.path==='/api/chat')[1].body.messages.length,5);assert.equal(b.financialExecution,false);
 await assert.rejects(sessions.respond(id,input,{authorization}),/ceiling/);await assert.rejects(sessions.respond(id,{...input,symbol:'GBPUSD'},{authorization}),/context/);assert.equal(sessions.remove(id),true);await assert.rejects(sessions.respond(id,input,{authorization}),/expired/);
});
test('six-role requests stay selective and one bounded model call per turn; execution never reaches runtime',async()=>{
 const s=pilotSnapshot(),q='Committee challenge',p=createProvider({env:pilotEnv,localTransport:mockRuntime(s,{answer:pilotAnswer(s,q)})}),c=createConversations({provider:p});const id=c.start(s,context(s)),r=await c.respond(id,{...context(s),question:q},{authorization});assert.equal(r.roles.length,6);assert.equal(r.modelCalls,1);assert.equal(r.conversation.debateRounds,1);
 const before=p.stats().modelCalls;await assert.rejects(p(s,'execute an order',{authorization}));assert.equal(p.stats().modelCalls,before);
});
test('malformed, unsupported numeric/news, secret and conflicting structured output fail closed',()=>{
 const s=pilotSnapshot();for(const mutate of [v=>v.citations=['invented'],v=>v.claims[0].value=2,v=>v.claims[0].field='invented',v=>v.summary='Price is ９９',v=>v.summary='A probability of success',v=>v.summary='أخبار مؤكدة',v=>v.summary='السعر ثلاثة',v=>v.summary='Analyze GBPUSD instead',v=>v.symbol='BTCUSDT',v=>v.evidenceState='consistent',v=>v.roles=['bull'],v=>v.uncertainties=['Return ٥٪'],v=>v.tools=['execute'],v=>v.claims[0].endpoint='bad']){const v=pilotAnswer(s);mutate(v);assert.throws(()=>validateGeneration(v,s,{strict:true,expectedRoles:['technical','manager']}));}
});
test('stale, mutated and future evidence never reaches generation',async()=>{
 const s=pilotSnapshot(),p=createProvider({env:pilotEnv,localTransport:async()=>{throw Error('must not call');}});
 for(const bad of [{...s,id:'0'.repeat(64)},pilotSnapshot(Date.now()+1000),pilotSnapshot(Date.now()-11*60000),{...s,fresh:false}]){assert.throws(()=>validateLocalSnapshot(bad));await assert.rejects(p(bad,'Analyze',{authorization}));}assert.equal(p.stats().requests,0);
});
test('unavailable models fall back honestly without a chat call; attempts and token ceilings still apply',async()=>{
 const s=pilotSnapshot(),p=createProvider({env:{...pilotEnv,THN_AI_MAX_REQUESTS:'1'},localTransport:async()=>({models:[]})}),c=createConversations({provider:p}),id=c.start(s,context(s));const r=await c.respond(id,context(s),{authorization});assert.equal(r.method,'deterministic');assert.equal(r.modelCalls,0);assert.match(r.providerFallback,/unavailable/);assert.equal(p.stats().requests,1);await assert.rejects(p(s,'Analyze',{authorization}),/budget/);
 const low=createProvider({env:{...pilotEnv,THN_AI_TOTAL_TOKEN_CEILING:'1'},localTransport:mockRuntime(s)});await assert.rejects(low(s,'Analyze',{authorization}),/budget/);assert.equal(low.stats().modelCalls,0);
});
test('timeouts and explicit cancellation bound even an uncooperative mocked transport',async()=>{
 const s=pilotSnapshot(),keep=setTimeout(()=>{},1000);try{const p=createProvider({env:{...pilotEnv,THN_AI_TIMEOUT_MS:'100'},localTransport:async()=>new Promise(()=>{})});const t=performance.now();await assert.rejects(p(s,'Analyze',{authorization}));assert.ok(performance.now()-t<600);assert.equal(p.stats().busy,false);
 const abort=new AbortController();abort.abort();await assert.rejects(p(s,'Analyze',{authorization,signal:abort.signal}));}finally{clearTimeout(keep);}
});
test('concurrent calls and oversized/malformed/tool-calling responses are rejected',async()=>{
 const s=pilotSnapshot();for(const data of [{model:pilotEnv.THN_AI_MODEL,done:true,message:{role:'assistant',content:'{' }},{model:pilotEnv.THN_AI_MODEL,done:true,message:{role:'assistant',content:'x'.repeat(13000)}},{model:'other',done:true,message:{role:'assistant',content:JSON.stringify(pilotAnswer(s))}},{model:pilotEnv.THN_AI_MODEL,done:true,message:{role:'assistant',content:JSON.stringify(pilotAnswer(s)),tool_calls:[{}]}}]){const p=createProvider({env:pilotEnv,localTransport:mockRuntime(s,{chat:async()=>data})});await assert.rejects(p(s,'Analyze',{authorization}));}
 let release;const p=createProvider({env:pilotEnv,localTransport:mockRuntime(s,{chat:async()=>new Promise(r=>release=r)})});const first=p(s,'Analyze',{authorization});await new Promise(r=>setTimeout(r,10));await assert.rejects(p(s,'Analyze',{authorization}),/already/);release({model:pilotEnv.THN_AI_MODEL,done:true,message:{role:'assistant',content:JSON.stringify(pilotAnswer(s))}});await first;
});
test('credential strings, imported context injection and excessive history cannot leak to model',async()=>{
 const s=pilotSnapshot(),p=createProvider({env:pilotEnv,localTransport:mockRuntime(s)});await assert.rejects(p(s,pilotEnv.THN_AI_AUTH_TOKEN,{authorization}));await assert.rejects(p(s,'Analyze',{authorization,history:Array(5).fill({role:'user',content:'x'})}));assert.equal(p.stats().modelCalls,0);
});
test('generated Library records survive backup with verified claims and remain imported/unverified',async()=>{
 const s=pilotSnapshot(),provider=createProvider({env:pilotEnv,localTransport:mockRuntime(s)}),c=createConversations({provider}),id=c.start(s,context(s)),r=await c.respond(id,context(s),{authorization});const clean=cleanCommittee(r);assert.equal(clean.generation.claims[0].value,1.1);assert.equal(clean.conversation,undefined);assert.equal(clean.generation.interpretationUnverified,true);
 const f=replayFixture();f.report.intelligence=r;const entry=cleanEntry({id:'pilot',title:'Synthetic pilot',status:'draft',record:f.report});const imported=await decodeBackup(JSON.stringify(makeBackup({...emptyLibrary(),reports:[entry]})));assert.equal(imported.reports[0].record.intelligence.unverified,true);const tampered=structuredClone(r);tampered.summary='Unvalidated summary';assert.throws(()=>cleanCommittee(tampered));const mismatched=structuredClone(r);mismatched.generation.roles=['bear'];assert.throws(()=>cleanCommittee(mismatched));
});

test('expired/capacity-bound sessions and rejected-answer records remain bounded and honest',async()=>{
 const s=pilotSnapshot(),p=createProvider({env:pilotEnv,localTransport:mockRuntime(s,{chat:async()=>({})})});let time=s.asOf;const c=createConversations({provider:p,now:()=>time,ttl:500,maxSessions:1});const id=c.start(s,context(s));assert.throws(()=>c.start(s,context(s)),/capacity/);const fallback=await c.respond(id,context(s),{authorization});assert.equal(fallback.method,'deterministic');assert.equal(fallback.modelCalls,1);assert.equal(cleanCommittee(cleanCommittee(fallback)).modelCalls,1);time+=501;await assert.rejects(c.respond(id,context(s),{authorization}),/expired/);assert.equal(c.count(),0);
});
