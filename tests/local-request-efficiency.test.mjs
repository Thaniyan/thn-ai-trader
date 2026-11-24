import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {buildLocalRequest,compactPilotEvidence,generateLocal} from '../server/intelligence-local.js';
import {packLocalEvidence,unpackLocalEvidence,LOCAL_REQUEST_VERSION} from '../server/intelligence-request-codec.js';
import {GENERATION_FORMAT,validateGeneration,evidenceState} from '../public/intelligence-generation.js';
import {syntheticPilotSnapshot} from '../scripts/pilot-local-ai.mjs';
import {baselineLocalRequest} from './fixtures/local-request-v1.mjs';
import {richOfflineSnapshot,measureLocalRequests} from '../scripts/measure-local-request.mjs';
import {safePilotReport} from '../scripts/pilot-report.mjs';
import {combineAssessments} from '../scripts/assess-local-ai.mjs';
const at=1800000000000,normal=v=>JSON.parse(JSON.stringify(v));
const cfg={THN_AI_MODEL:'fixture:local',THN_AI_AUTH_TOKEN:'private-efficiency-fixture',THN_AI_CONTEXT_TOKENS:'4096',THN_AI_MAX_OUTPUT_TOKENS:'256'};
const installed=async()=>({installed:true,model:'fixture:local',localWeightsVerified:true,digest:'a'.repeat(64)});
const answer=s=>({schema:'THN-GENERATION-7.1',snapshotId:s.id,symbol:s.symbol,interval:s.interval,summary:'Evidence conflicts; retain the opposing case.',citations:['frame-1h','frame-1d'],claims:[{reference:'frame-1h',field:'trend',value:'bullish'},{reference:'frame-1d',field:'trend',value:'bearish'}],roles:['technical','manager'],evidenceState:evidenceState(s),uncertainties:['The source does not establish a forecast.']});

test('compact EN/AR wire round-trips every original field, opposing reference, numeric input and output-schema constraint',()=>{
 for(const language of ['en','ar'])for(const scenario of ['conflicting','bullish','bearish','neutral','missing','stale']){
  const s=syntheticPilotSnapshot(at,scenario),before=JSON.stringify(s),q=language==='ar'?'تحليل EURUSD':'Analyze EURUSD',r=buildLocalRequest(s,q,{language,pilotCompact:true});
  const e=unpackLocalEvidence(JSON.parse(r.messages[1].content).evidence);for(const k of ['snapshotId','symbol','interval','evidenceState'])e[k]=r.format.properties[k].const;
  assert.deepEqual(e,normal(compactPilotEvidence(s)));assert.deepEqual(r.format,baselineLocalRequest(s,q,{language}).format);assert.deepEqual(e.refs.map(x=>x.id),s.refs.map(x=>x.id));assert.equal(JSON.stringify(s),before);
  assert.equal(r.requestProfile,LOCAL_REQUEST_VERSION);assert.deepEqual(r.format.required,GENERATION_FORMAT.required);assert.equal(r.messages.at(-1).content,q);
 }
});
test('rich source/event/risk provenance is lossless and hash sharing never changes claimable values',()=>{
 const s=richOfflineSnapshot(),e=compactPilotEvidence(s),packed=packLocalEvidence(e);assert.ok(packed.hashes?.length);assert.deepEqual(unpackLocalEvidence(packed),normal(e));
 const round=unpackLocalEvidence(packed);for(const ref of s.refs){const r=round.refs.find(x=>x.id===ref.id);assert.deepEqual(r.inputs,ref.inputs);assert.equal(r.availableAt,ref.availableAt);assert.equal(r.datasetHash,ref.datasetHash);assert.equal(r.source,ref.source);}
});
test('small/heterogeneous evidence is not inflated; missing properties and nulls remain distinct',()=>{
 for(const refs of [[{id:'a',source:'x',inputs:{close:1.1},status:null}],[{id:'a',source:'x',inputs:{}},{id:'b',source:'y',inputs:{close:null}}]]){
  const e={refs,selectedHash:null,quantitative:null,missing:[],events:[]},p=packLocalEvidence(e);assert.ok(Buffer.byteLength(JSON.stringify(p))<=Buffer.byteLength(JSON.stringify(e)));assert.deepEqual(unpackLocalEvidence(p),e);
 }
});
test('nested retained historical metrics, periods, costs and limitations are opaque lossless evidence',()=>{
 const e=compactPilotEvidence(richOfflineSnapshot());
 e.quantitative={datasetHash:e.selectedHash,development:{trades:31,returnPct:-1.25},holdout:{trades:12,maxDrawdownPct:2.75},minimumTrades:10,parameters:{capital:10000,spreadBps:2,commissionBps:1,slippageBps:3},walkForward:{periods:[{start:at-86400000,end:at,returnPct:null}],limitations:['SYNTHETIC historical fixture; not predictive']}};
 const before=normal(e),packed=packLocalEvidence(e);assert.deepEqual(unpackLocalEvidence(packed),before);assert.deepEqual(e,before);assert.equal(unpackLocalEvidence(packed).quantitative.holdout.maxDrawdownPct,2.75);
});
test('malformed dictionary references fail closed instead of manufacturing source provenance',()=>{
 const e={refs:[{id:'a',datasetHash:{$hash:0}}],hashes:['a'.repeat(64)]};assert.equal(unpackLocalEvidence(e).refs[0].datasetHash,'a'.repeat(64));
 for(const patch of [{hashes:[]},{hashes:['bad']},{hashes:['a'.repeat(64),'a'.repeat(64)]},{refs:[{datasetHash:{$hash:-1}}]},{refs:[{datasetHash:{$hash:0,extra:true}}]},{refDefaults:{inputs:{close:999}}}])assert.throws(()=>unpackLocalEvidence({...e,...patch}));
 assert.throws(()=>packLocalEvidence({refs:[],hashes:[]}));
});
test('fixed owner-sized synthetic case reproduces2878-byte baseline and reduces the unchanged reservation without claiming tokens',()=>{
 const s=syntheticPilotSnapshot(at),old=baselineLocalRequest(s,'Analyze EURUSD'),r=buildLocalRequest(s,'Analyze EURUSD',{pilotCompact:true});assert.equal(old.requestBytes,2878);assert.equal(old.requestBytes+512+256,3646);assert.ok(r.requestBytes<old.requestBytes);assert.ok(r.requestBytes+512+256<3646);
 const report=measureLocalRequests();assert.equal(report.networkRequests,0);assert.equal(report.generationTested,false);assert.equal(report.actualModelTokens,null);assert.equal(report.actualInferenceLatencyMs,null);assert.equal(report.releaseDecision,'NO_GO');assert.equal(report.rows.length,14);assert.ok(report.rows.every(x=>x.losslessEvidence&&x.unchangedOutputSchema&&x.savedBytes>0));
});
test('all original model output fields, citation/claim validation and numeric-prose refusal remain authoritative',()=>{
 const s=syntheticPilotSnapshot(at),a=answer(s);assert.ok(validateGeneration(a,s,{strict:true,expectedRoles:a.roles}));
 for(const patch of [{snapshotId:'wrong'},{citations:['unknown']},{claims:[{reference:'frame-1h',field:'trend',value:'bearish'}]},{summary:'Win probability is guaranteed.'},{summary:'Return 80 percent.'},{roles:['bull']},{evidenceState:'consistent'},{uncertainties:[]},{extra:'unexpected'}])assert.throws(()=>validateGeneration({...a,...patch},s,{strict:true,expectedRoles:a.roles}));
 for(const key of GENERATION_FORMAT.required){const missing={...a};delete missing[key];assert.throws(()=>validateGeneration(missing,s,{strict:true,expectedRoles:a.roles}),key);}
});
test('encoded compact generation is greedy, non-thinking and repetition-neutral without changing budgets/settings or accepting partial JSON',async()=>{
 const s=syntheticPilotSnapshot(),a=answer(s);let seen,reserved,runtime;
 const run=content=>generateLocal(cfg,s,'Analyze EURUSD',{authorization:'Bearer '+cfg.THN_AI_AUTH_TOKEN,pilotCompact:true,pilotKeepAlive:'5m',pilotThreads:2,inspect:installed,onRequest:n=>reserved=n,onRuntime:r=>runtime={...runtime,...r},transport:async(_u,_p,o)=>{seen=o.body;return {done:true,model:cfg.THN_AI_MODEL,message:{role:'assistant',content}};}});
 assert.equal((await run(JSON.stringify(a))).method,'llm');assert.equal(seen.think,false);assert.equal(seen.stream,false);assert.equal(seen.options.temperature,0);assert.equal(seen.options.repeat_penalty,1);assert.equal(seen.options.num_predict,256);assert.equal(seen.options.num_ctx,4096);assert.equal(seen.options.num_thread,2);assert.equal(seen.keep_alive,'5m');assert.equal(reserved,runtime.requestBytes+512+256);assert.equal(runtime.requestProfile,LOCAL_REQUEST_VERSION);
 await assert.rejects(run(JSON.stringify(a).slice(0,-1)));assert.deepEqual(seen.format,baselineLocalRequest(s,'Analyze EURUSD').format);
});
test('oversized context, wrong digest, credential-like history and cancelled work never reach generation',async()=>{
 const s=syntheticPilotSnapshot();let calls=0,inspections=0;const transport=async()=>{calls++;throw Error('Unexpected model call');},inspect=async()=>{inspections++;return installed();};
 await assert.rejects(generateLocal({...cfg,THN_AI_CONTEXT_TOKENS:'2048'},s,'Analyze EURUSD',{authorization:'Bearer '+cfg.THN_AI_AUTH_TOKEN,pilotCompact:true,transport,inspect}));assert.equal(inspections,0);
 await assert.rejects(generateLocal({...cfg,THN_AI_EXPECTED_DIGEST:'b'.repeat(64)},s,'Analyze EURUSD',{authorization:'Bearer '+cfg.THN_AI_AUTH_TOKEN,pilotCompact:true,transport,inspect}));
 await assert.rejects(generateLocal(cfg,s,'Analyze EURUSD',{authorization:'Bearer '+cfg.THN_AI_AUTH_TOKEN,pilotCompact:true,transport,inspect,history:[{role:'user',content:cfg.THN_AI_AUTH_TOKEN}]}));
 const controller=new AbortController();controller.abort();await assert.rejects(generateLocal(cfg,s,'Analyze EURUSD',{authorization:'Bearer '+cfg.THN_AI_AUTH_TOKEN,pilotCompact:true,transport,inspect,signal:controller.signal}));assert.equal(calls,0);
});
test('full request control and original history messages remain intact',()=>{
 const s=syntheticPilotSnapshot(at),history=[{role:'assistant',content:'Prior source interpretation'}],r=buildLocalRequest(s,'Analyze EURUSD',{history});assert.deepEqual(r.format,GENERATION_FORMAT);assert.deepEqual(JSON.parse(r.messages[1].content).evidence,normal(compactPilotEvidence(s)));assert.deepEqual(r.messages[2],history[0]);assert.equal(r.requestProfile,'bound-schema-1');
});
test('request profile diagnostics are closed and null timing counters stay unknown',()=>{
 for(const requestProfile of ['bound-schema-1',LOCAL_REQUEST_VERSION]){const r=safePilotReport({runtime:{requestProfile,responseReceived:false,reportedLoadMs:null,promptTokens:null}});assert.equal(r.runtime.requestProfile,requestProfile);assert.equal(r.runtime.reportedLoadMs,null);assert.equal(r.runtime.promptTokens,null);assert.equal(r.runtime.responseReceived,false);}
 assert.equal(safePilotReport({runtime:{requestProfile:cfg.THN_AI_AUTH_TOKEN}}).runtime.requestProfile,null);
 assert.equal(safePilotReport({runtime:{requestProfile:LOCAL_REQUEST_VERSION}},{secrets:[LOCAL_REQUEST_VERSION]}).runtime.requestProfile,null);
});
test('assessment aggregation rejects mixed optimizer versions and still labels homogeneous evidence unqualified',()=>{
 const base={schema:'THN-LOCAL-ASSESSMENT-1',fixtureVersion:'THN-PILOT-SYNTHETIC-1',requestPolicyMs:12000,settings:{context:4096,outputTokens:256},rows:[]};
 const a={...base,batchId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',optimizerVersion:'bound-schema-1'},b={...base,batchId:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',optimizerVersion:LOCAL_REQUEST_VERSION};
 assert.throws(()=>combineAssessments([a,b]),/encodings/);assert.equal(combineAssessments([a]).summary.decision,'NO_GO');assert.equal(combineAssessments([b]).summary.decision,'NO_GO');assert.equal(combineAssessments([b]).optimizerVersion,LOCAL_REQUEST_VERSION);
});
test('offline CLI refuses inference/model arguments and emits no environment credentials or source records',()=>{
 const env={...process.env,THN_AI_AUTH_TOKEN:cfg.THN_AI_AUTH_TOKEN,OPENAI_API_KEY:'private-offline-measurement'};const r=spawnSync(process.execPath,['--import','./tests/fixtures/offline-no-runtime.mjs','scripts/measure-local-request.mjs'],{env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.ok(!r.stdout.includes(cfg.THN_AI_AUTH_TOKEN)&&!r.stdout.includes(env.OPENAI_API_KEY));const j=JSON.parse(r.stdout);assert.equal(j.generationTested,false);assert.equal(j.networkRequests,0);assert.equal(j.modelQualification,'NOT_VERIFIED');assert.ok(!('evidence' in j));assert.equal(spawnSync(process.execPath,['scripts/measure-local-request.mjs','--run'],{env,encoding:'utf8'}).status,1);
});
