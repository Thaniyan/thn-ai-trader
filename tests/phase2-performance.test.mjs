import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {createInferenceDeadline,createInferenceTiming} from '../server/intelligence-timing.js';
import {interpretVerifiedEvidence} from '../server/intelligence-inference-lifecycle.js';
import {compactPilotEvidence,localGenerationFormat,generateLocal,loopbackJSON} from '../server/intelligence-local.js';
import {evidenceState,GENERATION_FORMAT,validateGeneration} from '../public/intelligence-generation.js';
import {syntheticPilotSnapshot,runPilot} from '../scripts/pilot-local-ai.mjs';
import {supervisePilot} from '../scripts/pilot-supervisor.mjs';
import {safePilotReport} from '../scripts/pilot-report.mjs';
import {assessmentPlan,runAssessment,summarizeAssessment,combineAssessments} from '../scripts/assess-local-ai.mjs';
const at=1800000000000,secret='private-performance-fixture';
const env={THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:secret,THN_LOCAL_PAPER:'0',THN_AI_MAX_REQUESTS:'8',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'40000',THN_AI_CONTEXT_TOKENS:'4096'};
const installed=model=>({installed:true,localWeightsVerified:true,model,digest:'a'.repeat(64),sizeBytes:1400000000});
const answer=s=>({schema:'THN-GENERATION-7.1',snapshotId:s.id,symbol:s.symbol,interval:s.interval,summary:'Review opposing evidence.',citations:['frame-1h','frame-1d'],claims:[{reference:'frame-1h',field:'trend',value:s.refs.find(r=>r.id==='frame-1h').trend}],roles:['technical','manager'],evidenceState:evidenceState(s),uncertainties:['Observations do not establish a forecast.'],method:'llm',provider:'ollama',model:'fixture:local'});
test('absolute monotonic deadline rejects a valid response after synchronous blocking even before timer callback',async()=>{
 let elapsed=0,report;const s=syntheticPilotSnapshot(at);
 const result=await interpretVerifiedEvidence({snapshot:s,question:'Analyze EURUSD',now:()=>at,clock:()=>elapsed,onTimings:t=>report=t,provider:()=>{elapsed=23241;return answer(s)}});
 assert.equal(result.method,'deterministic');assert.equal(result.generation,null);assert.equal(report.requestElapsedMs,23241);assert.equal(report.deadlineExceeded,true);assert.equal(report.settlementOverrunMs,11241);assert.equal(report.deadlineObservedMs,23241);
});
test('same absolute deadline covers response parsing/strict validation and rejects late promise success',async()=>{
 let clock=0;const budget=createInferenceDeadline({timeoutMs:10,clock:()=>clock});try{await assert.rejects(budget.run(async()=>{clock=11;return 'too late'}),e=>e.code==='TIMEOUT');}finally{budget.dispose();}
});
test('timing diagnostics distinguish running stage at settlement and never mutate sealed reports',async()=>{
 let time=0;const m=createInferenceTiming({clock:()=>time});const end=m.begin('inventory');time=3;end();const finish=m.begin('generation');time=23;const report=m.report({seal:true});assert.equal(report.stages.inventory.elapsedMs,3);assert.equal(report.stages.generation.elapsedMs,20);assert.equal(report.stages.generation.state,'unsettled');finish();assert.equal(report.stages.generation.state,'unsettled');assert.throws(()=>m.begin(secret));
});
test('bound grammar is stricter than the existing contract and retains every identifier and claim field',()=>{
 const s=syntheticPilotSnapshot(at),p=compactPilotEvidence(s),format=localGenerationFormat(s,['technical','manager']);
 assert.deepEqual(format.required,GENERATION_FORMAT.required);assert.equal(format.additionalProperties,false);assert.deepEqual(Object.keys(format.properties),Object.keys(GENERATION_FORMAT.properties));
 for(const key of ['asOf','fresh','selectedHash','engineVersion','missing','limitations','refs','events','quantitative'])assert.deepEqual(p[key],s[key]);
 assert.equal(format.properties.snapshotId.const,s.id);assert.deepEqual(format.properties.citations.items.enum,s.refs.map(r=>r.id));
 const good=answer(s);const payload=Object.fromEntries(GENERATION_FORMAT.required.map(k=>[k,good[k]]));assert.ok(validateGeneration(payload,s,{strict:true,expectedRoles:['technical','manager']}));
 for(const patch of [{snapshotId:'other'},{citations:['invented']},{claims:[{reference:'frame-1h',field:'close',value:999}]}])assert.throws(()=>validateGeneration({...payload,...patch},s,{strict:true}));
});
test('local generation measures inventory separately, preserves EN/AR/history and enforces exact digest',async()=>{
 const s=syntheticPilotSnapshot(Date.now());let inventories=0;
 for(const language of ['en','ar']){
  const m=createInferenceTiming(),seen=[];const cfg={...env,THN_AI_MODEL:'fixture:local',THN_AI_EXPECTED_DIGEST:'a'.repeat(64)};
  const r=await generateLocal(cfg,s,'Analyze EURUSD',{authorization:'Bearer '+secret,language,pilotCompact:true,history:[{role:'user',content:'Explain evidence'}],timing:m,inspect:async()=>{inventories++;return installed(cfg.THN_AI_MODEL)},transport:async(_url,_path,o)=>{seen.push(o.body);return {model:cfg.THN_AI_MODEL,done:true,message:{role:'assistant',content:JSON.stringify(Object.fromEntries(GENERATION_FORMAT.required.map(k=>[k,answer(s)[k]])))}}}});
  assert.equal(r.method,'llm');assert.equal(seen.length,1);assert.ok(seen[0].messages.some(x=>x.content==='Explain evidence'));assert.ok(seen[0].messages.some(x=>x.content.includes('"language":"'+language+'"')));assert.equal(seen[0].think,false);assert.equal(seen[0].format.properties.snapshotId.const,s.id);const wire=JSON.parse(seen[0].messages[1].content),reconstructed={...wire.evidence};for(const key of ['snapshotId','symbol','interval','evidenceState'])reconstructed[key]=seen[0].format.properties[key].const;assert.deepEqual(reconstructed,JSON.parse(JSON.stringify(compactPilotEvidence(s))));const t=m.report();assert.equal(t.stages.inventory.count,1);assert.equal(t.stages.generation.count,1);assert.equal(t.stages.parsingValidation.count,1);
 }
 assert.equal(inventories,2);let calls=0;
 await assert.rejects(generateLocal({...env,THN_AI_MODEL:'fixture:local',THN_AI_EXPECTED_DIGEST:'b'.repeat(64)},s,'Analyze',{authorization:'Bearer '+secret,inspect:async()=>installed('fixture:local'),transport:async()=>{calls++}}));assert.equal(calls,0);
});
test('CLI inspection is inside the shared request instead of duplicated preflight and generation',async()=>{
 let inventories=0;const r=await runPilot({mode:'--run',model:'fixture:local',language:'ar',env,inspect:async()=>{inventories++;return installed('fixture:local')},generate:async(cfg,s,q,o)=>generateLocal(cfg,s,q,{...o,transport:async()=>({model:cfg.THN_AI_MODEL,done:true,message:{role:'assistant',content:JSON.stringify(Object.fromEntries(GENERATION_FORMAT.required.map(k=>[k,answer(s)[k]])))}})})});assert.equal(inventories,1);assert.equal(r.accepted,true);assert.equal(r.modelInspectionVerified,true);assert.equal(r.timings.stages.inventory.count,1);assert.equal(r.financialExecution,false);
});
test('independent CLI watchdog terminates a permanently blocked worker and never accepts late output',async()=>{
 const r=await supervisePilot({mode:'--run',model:'fixture:spin',language:'en',env,policyMs:150,workerURL:new URL('./fixtures/pilot-worker.mjs',import.meta.url)});
 assert.equal(r.accepted,false);assert.equal(r.failureCode,'TIMEOUT');assert.equal(r.supervision.deadlineExceeded,true);assert.equal(r.supervision.runtimeSettlementVerified,false);assert.equal(r.supervision.workerTerminationRequested,true);assert.ok(r.supervision.elapsedMs>=150);assert.equal(r.digest,'a'.repeat(64));assert.equal(r.runtime.requestBytes,1700);assert.equal(r.timings.stages.generation.state,'unsettled');assert.equal(JSON.stringify(r).includes(secret),false);
});
test('worker/report telemetry excludes secrets, arbitrary prose, exceptions, invalid counters and injected stages',async()=>{
 const raw={model:'fixture:local',digest:'a'.repeat(64),sizeBytes:1400000000,modelInspectionVerified:true,accepted:true,financialExecution:false,failureCode:null,matchedCitations:1,matchedClaims:1,summary:secret,error:secret,timings:{stages:{[secret]:secret,inventory:{elapsedMs:Infinity,state:secret,count:99999}}},runtime:{reportedLoadMs:NaN,requestBytes:secret}};
 const safe=safePilotReport(raw,{model:'fixture:local',secrets:[secret]});assert.equal(JSON.stringify(safe).includes(secret),false);assert.equal(safe.runtime.reportedLoadMs,null);assert.equal(safe.timings.stages.inventory.elapsedMs,null);assert.equal(safe.timings.stages.inventory.state,'not_started');
 const result=await supervisePilot({mode:'--run',model:'fixture:local',language:'en',env,policyMs:1000,workerURL:new URL('./fixtures/pilot-worker.mjs',import.meta.url)});assert.equal(result.accepted,true);assert.equal(JSON.stringify(result).includes(secret),false);
 await assert.rejects(supervisePilot({model:'fixture:local',env:{...env,VERCEL:'1'}}));
});
const config={schema:'THN-LOCAL-ASSESSMENT-1',models:[{model:'qwen3:1.7b',digest:'a'.repeat(64),optional:false}],languages:['en','ar'],threads:[2],conditions:['warm'],profiles:['full','compact'],cases:['conflicting','neutral'],repetitions:1,prepareModel:true};
test('assessment plan is reproducible and fixed to serial local-only installed candidate dimensions',()=>{
 assert.equal(assessmentPlan(config).trials,8);assert.equal(assessmentPlan(config).parallelism,1);
 for(const patch of [{threads:[8]},{models:[{model:'remote:cloud',digest:'a'.repeat(64),optional:false}]},{endpoint:'https://external.invalid'},{repetitions:100}])assert.throws(()=>assessmentPlan({...config,...patch}));
});
test('assessment budgets cannot reset per worker, download missing models or continue after timeout',async()=>{
 let attempts=0;
 const mock=async o=>{attempts++;return {model:o.model,digest:'a'.repeat(64),modelInspectionVerified:true,financialExecution:false,accepted:false,fallback:true,failureCode:'TIMEOUT',elapsedMs:12000}};
 const options={env,inspect:async e=>installed(e.THN_AI_MODEL),prepare:async(_e,condition)=>({requestedCondition:condition,verified:true,elapsedMs:1}),run:mock,freeMemory:()=>4*1024**3};
 const r=await runAssessment(config,options);assert.equal(attempts,1);assert.equal(r.summary.decision,'NO_GO');assert.equal(r.rows.filter(x=>x.status==='not_run_after_timeout').length,7);assert.equal(r.worstCaseReservedUnits,32768);assert.equal(JSON.stringify(r).includes(secret),false);
 await assert.rejects(runAssessment(config,{...options,env:{...env,THN_AI_TOTAL_TOKEN_CEILING:'10000'}}));assert.equal(attempts,1);
 await assert.rejects(runAssessment(config,{...options,env:{...env,VERCEL:'1'}}));assert.equal(attempts,1);
 const optional={...config,models:[{model:'qwen3:0.6b',digest:'a'.repeat(64),optional:true}]};const skipped=await runAssessment(optional,{...options,inspect:async()=>{throw Error(secret)}});assert.equal(skipped.rows.every(r=>r.status==='optional_model_unavailable'),true);assert.equal(attempts,1);
});
test('insufficient and mixed trial evidence cannot establish EN/AR quality or financial competence',()=>{
 const r=summarizeAssessment([]);assert.equal(r.decision,'NO_GO');assert.equal(r.eligibleAcceptanceRatio,null);assert.equal(r.p95AcceptedRequestMs,null);assert.equal(r.humanLanguageAndUtilityReview,'NOT_PERFORMED');assert.equal(r.financialCompetenceEstablished,false);
});
test('literal loopback transport settles timeout itself and still refuses remote endpoints',async()=>{
 assert.throws(()=>loopbackJSON('http://example.com:11434','/api/chat'));
 const server=http.createServer((_req,_res)=>{});server.listen(11434,'127.0.0.1');await once(server,'listening');
 try{await assert.rejects(loopbackJSON('http://127.0.0.1:11434','/api/chat',{timeout:30}),/timeout/);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('optimized request is smaller without dropping wire evidence, history or the full strict output',async()=>{
 const s=syntheticPilotSnapshot(Date.now()),sizes=[];
 for(const compact of [false,true]){const cfg={...env,THN_AI_MODEL:'fixture:local',THN_AI_CONTEXT_TOKENS:'8192'};let request;
  await generateLocal(cfg,s,'Analyze EURUSD',{authorization:'Bearer '+secret,pilotCompact:compact,inspect:async()=>installed(cfg.THN_AI_MODEL),transport:async(_a,_b,o)=>{request=o.body;return {done:true,model:cfg.THN_AI_MODEL,message:{role:'assistant',content:JSON.stringify(Object.fromEntries(GENERATION_FORMAT.required.map(k=>[k,answer(s)[k]])))}}}});
  sizes.push(Buffer.byteLength(JSON.stringify({messages:request.messages,format:request.format})));assert.deepEqual(request.format.required,GENERATION_FORMAT.required);
 }
 assert.ok(sizes[1]<sizes[0]);
});
test('late imported or worker reports cannot turn timeout evidence into accepted performance',()=>{
 const r=safePilotReport({accepted:true,model:'fixture:local',modelInspectionVerified:true,digest:'a'.repeat(64),financialExecution:false,failureCode:null,matchedCitations:2,matchedClaims:1,elapsedMs:23241},{model:'fixture:local'});assert.equal(r.accepted,false);assert.equal(r.failureCode,'TIMEOUT');
});
test('aggregation requires independent batch IDs, same settings and complete per-cell EN/AR/negative coverage',()=>{
 const rows=[];
 for(const language of ['en','ar'])for(const caseName of ['bullish','bearish','neutral','conflicting','missing','stale'])for(let rep=0;rep<2;rep++){
  const eligible=!['missing','stale'].includes(caseName);
  rows.push({model:'qwen3:1.7b',digest:'a'.repeat(64),threads:2,condition:'warm',profile:'compact',language,caseName,status:'attempted',preparation:{verified:true},result:{model:'qwen3:1.7b',modelInspectionVerified:eligible,digest:eligible?'a'.repeat(64):null,accepted:eligible,financialExecution:false,failureCode:eligible?null:'CONTEXT_CHANGED',matchedCitations:eligible?2:0,matchedClaims:eligible?1:0,verifiedCitationIds:eligible?['frame-1h','frame-1d']:[],generationTested:eligible,elapsedMs:eligible?100:0,languageEvidence:eligible?{requested:language,arabicScriptPresent:language==='ar',latinScriptPresent:language==='en'}:null}});
 }
 const base={schema:'THN-LOCAL-ASSESSMENT-1',fixtureVersion:'THN-PILOT-SYNTHETIC-1',optimizerVersion:'bound-schema-1',requestPolicyMs:12000,settings:{context:4096,outputTokens:500}};
 const a={...base,batchId:'a'.repeat(8)+'-aaaa-aaaa-aaaa-'+ 'a'.repeat(12),rows:rows.slice(0,12)},b={...base,batchId:'b'.repeat(8)+'-bbbb-bbbb-bbbb-'+ 'b'.repeat(12),rows:rows.slice(12)};
 const r=combineAssessments([a,b]);assert.equal(r.summary.decision,'TECHNICAL_CANDIDATE_REQUIRES_HUMAN_EN_AR_REVIEW');assert.equal(r.summary.financialCompetenceEstablished,false);assert.equal(r.operatorReportsUnattested,true);
 assert.throws(()=>combineAssessments([a,a]));assert.throws(()=>combineAssessments([a,{...b,settings:{context:8192,outputTokens:500}}]));
 assert.equal(combineAssessments([a]).summary.decision,'NO_GO');
 const bad=structuredClone(b);bad.rows[0].result.languageEvidence.arabicScriptPresent=false;assert.equal(combineAssessments([a,bad]).summary.decision,'NO_GO');
});
test('credential-bearing configurations are rejected before model inventory or inference',async()=>{
 let calls=0;await assert.rejects(runAssessment({...config,models:[{model:'qwen3:1.7b',digest:'a'.repeat(64),optional:false}]},{env:{...env,THN_AI_AUTH_TOKEN:'a'.repeat(64)},inspect:async()=>{calls++}}));assert.equal(calls,0);
});
test('failed parsing retains measured generation and bounded reported runtime counters without model prose',async()=>{
 let stats;const s=syntheticPilotSnapshot(Date.now());await assert.rejects(generateLocal({...env,THN_AI_MODEL:'fixture:local'},s,'Analyze EURUSD',{authorization:'Bearer '+secret,inspect:async()=>installed('fixture:local'),onRuntime:v=>{stats={...stats,...v}},transport:async()=>({done:true,model:'fixture:local',load_duration:5000000,eval_duration:10000000,eval_count:23,message:{role:'assistant',content:'malformed private model prose'}})}),SyntaxError);assert.equal(stats.reportedLoadMs,5);assert.equal(stats.reportedGenerationMs,10);assert.equal(stats.completionTokens,23);assert.equal(JSON.stringify(stats).includes('private model prose'),false);
});
test('heartbeat separates a responsive asynchronous wait from an unresponsive worker without claiming model completion',async()=>{
 const r=await supervisePilot({mode:'--run',model:'fixture:hang',language:'ar',env,policyMs:1000,workerURL:new URL('./fixtures/pilot-worker.mjs',import.meta.url)});assert.equal(r.failureCode,'TIMEOUT');assert.equal(r.supervision.workerResponsiveness,'responsive_at_settlement');assert.equal(r.supervision.runtimeSettlementVerified,false);assert.equal(r.runtime.reservedUnits,2700);assert.equal(JSON.stringify(r).includes(secret),false);
});
test('paired assessment requests share frozen synthetic evidence and stay within one cumulative reservation',async()=>{
 const seen=[];const r=await runAssessment(config,{env,freeMemory:()=>4*1024**3,inspect:async e=>installed(e.THN_AI_MODEL),prepare:async(_e,condition)=>({requestedCondition:condition,verified:true,elapsedMs:1}),run:async o=>{seen.push(o.snapshotAt);return {model:o.model,digest:'a'.repeat(64),modelInspectionVerified:true,financialExecution:false,accepted:true,failureCode:null,matchedCitations:2,matchedClaims:1,verifiedCitationIds:['frame-1h','frame-1d'],elapsedMs:10,languageEvidence:{requested:o.language,arabicScriptPresent:o.language==='ar',latinScriptPresent:o.language==='en'}}}});assert.equal(seen.length,8);assert.equal(new Set(seen).size,1);assert.equal(r.summary.decision,'NO_GO');assert.equal(r.cells.length,2);assert.equal(r.cells[0].languages.length,2);
});
test('invalid and backwards timing clocks fail closed instead of validating a latency-free model reply',async()=>{
 for(const value of [NaN,-1]){let clock=0;const s=syntheticPilotSnapshot(at);const r=await interpretVerifiedEvidence({snapshot:s,question:'Analyze EURUSD',now:()=>at,clock:()=>clock,provider:()=>{clock=value;return answer(s)}});assert.equal(r.method,'deterministic');assert.equal(r.generation,null);}
});
test('default supervised CLI completes the real local HTTP pipeline with one inventory and redacted EN/AR receipts',async()=>{
 let tags=0,shows=0,chats=0;
 const server=http.createServer((req,res)=>{let text='';req.on('data',b=>text+=b);req.on('end',()=>{
  const body=text?JSON.parse(text):{};let value;
  if(req.url==='/api/tags'){tags++;value={models:[{name:'fixture:local',digest:'a'.repeat(64),size:1400000000}]};}
  else if(req.url==='/api/show'){shows++;value={model_info:{'general.architecture':'offline-fixture'},capabilities:['completion']};}
  else{chats++;const prompt=JSON.parse(body.messages.find(m=>m.role==='user').content),p=body.format.properties,context=key=>p[key].const??prompt.evidence[key];const language=prompt.language;
   const payload={schema:'THN-GENERATION-7.1',snapshotId:context('snapshotId'),symbol:context('symbol'),interval:context('interval'),summary:language==='ar'?'راجع الأدلة المعارضة.':'Review opposing evidence.',citations:['frame-1h','frame-1d'],claims:[{reference:'frame-1h',field:'trend',value:'bullish'}],roles:p.roles.const||prompt.roles,evidenceState:context('evidenceState'),uncertainties:[language==='ar'?'الاتجاهات متعارضة.':'Directions conflict.']};
   value={model:body.model,done:true,message:{role:'assistant',content:JSON.stringify(payload)},load_duration:5000000,eval_duration:10000000,eval_count:20};
  }
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));
 });});server.listen(11434,'127.0.0.1');await once(server,'listening');
 try{for(const language of ['en','ar']){const r=await supervisePilot({mode:'--run',model:'fixture:local',language,env:{...env,THN_AI_PILOT_COMPACT:'1',THN_AI_PILOT_KEEP_ALIVE:'5m',THN_AI_PILOT_THREADS:'2',THN_AI_EXPECTED_DIGEST:'a'.repeat(64)}});assert.equal(r.accepted,true);assert.deepEqual(r.requestedSettings,{compactPilot:true,keepAlive:'5m',pilotThreads:2});assert.deepEqual(r.workerConfirmedSettings,r.requestedSettings);assert.equal(r.settingsConfirmation,'request_prepared');assert.equal(r.runtimeSettingsVerified,false);assert.equal(r.digest,'a'.repeat(64));assert.equal(r.timings.stages.inventory.count,1);assert.equal(r.supervision.runtimeSettlementVerified,true);assert.equal(r.runtime.responseReceived,true);assert.equal(r.languageEvidence.requested,language);assert.equal(language==='ar'?r.languageEvidence.arabicScriptPresent:r.languageEvidence.latinScriptPresent,true);assert.equal(JSON.stringify(r).includes(secret),false);}}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 assert.equal(tags,2);assert.equal(shows,2);assert.equal(chats,2);
});
test('English and Arabic pilot questions produce record-compatible specialist roles, not unsupported wrappers',async()=>{
 const {cleanCommittee}=await import('../public/intelligence-memory.js');
 for(const language of ['en','ar']){let calls=0;const r=await runPilot({mode:'--run',model:'fixture:local',language,env,now:()=>at,generate:async(_cfg,s,q)=>{assert.equal(q,language==='ar'?'تحليل EURUSD':'Analyze EURUSD');const committee=await interpretVerifiedEvidence({snapshot:s,question:q,language,now:()=>at,provider:async()=>{calls++;return answer(s)}});assert.equal(committee.outcome,'conflicting');assert.equal(committee.roles.length,2);assert.doesNotThrow(()=>cleanCommittee({...committee,modelCalls:calls}));return answer(s)}});assert.equal(r.accepted,true);assert.equal(calls,1);}
});
test('unsupported free-form questions cannot invoke a model or receive generative labels',async()=>{
 let calls=0,code;const r=await interpretVerifiedEvidence({snapshot:syntheticPilotSnapshot(at),question:'Write a poem',now:()=>at,provider:async()=>{calls++;return answer(syntheticPilotSnapshot(at))},onDiagnostic:c=>code=c});assert.equal(calls,0);assert.equal(r.method,'deterministic');assert.equal(r.outcome,'unsupported_question');assert.equal(code,'UNSUPPORTED_QUESTION');
});

const requestedSettings={compactPilot:true,keepAlive:'5m',pilotThreads:2};
const settingsEnv={...env,THN_AI_PILOT_COMPACT:'1',THN_AI_PILOT_KEEP_ALIVE:'5m',THN_AI_PILOT_THREADS:'2'};
const settingsWorker=new URL('./fixtures/pilot-worker.mjs',import.meta.url);
function assertRequestedSettings(r){
 assert.deepEqual(r.requestedSettings,requestedSettings);for(const k of Object.keys(requestedSettings))assert.equal(r[k],requestedSettings[k]);
 assert.equal(r.accepted,false);assert.equal(r.fallback,true);assert.equal(r.runtimeSettingsVerified,false);assert.equal(JSON.stringify(r).includes(secret),false);
}
test('timeout preserves requested settings independently of worker acknowledgement and termination',async()=>{
 for(const [tag,confirmation] of [['unconfirmed','unconfirmed'],['hang','worker_validated'],['prepared','request_prepared'],['spin','worker_validated']]){
  const r=await supervisePilot({mode:'--run',model:'settings:'+tag,language:'en',env:settingsEnv,policyMs:500,workerURL:settingsWorker});
  assertRequestedSettings(r);assert.equal(r.failureCode,'TIMEOUT');assert.equal(r.settingsConfirmation,confirmation);assert.deepEqual(r.workerConfirmedSettings,confirmation==='unconfirmed'?null:requestedSettings);assert.equal(r.supervision.workerTerminationRequested,true);assert.equal(r.supervision.runtimeSettlementVerified,false);
 }
});
test('worker exit and uncaught error preserve requested settings without inventing dispatched requests',async()=>{
 for(const tag of ['exit','error']){const r=await supervisePilot({mode:'--run',model:'settings:'+tag,language:'ar',env:settingsEnv,policyMs:2000,workerURL:settingsWorker});assertRequestedSettings(r);assert.equal(r.failureCode,'UNKNOWN');assert.equal(r.settingsConfirmation,'worker_validated');assert.deepEqual(r.workerConfirmedSettings,requestedSettings);assert.equal(r.supervision.deadlineExceeded,false);}
});
test('ordinary inventory rejection confirms validation only and retains nondefault settings in projected fallback',async()=>{
 const phases=[];const r=await runPilot({mode:'--run',model:'fixture:local',language:'ar',env:settingsEnv,onSettingsReport:r=>phases.push(r.phase),inspect:async()=>{throw Error(secret)}});
 const safe=safePilotReport(r,{model:'fixture:local',secrets:[secret]});assertRequestedSettings(safe);assert.deepEqual(phases,['worker_validated']);assert.equal(safe.settingsConfirmation,'worker_validated');assert.deepEqual(safe.workerConfirmedSettings,requestedSettings);assert.equal(safe.generationTested,false);
});
test('invalid requested settings fail before worker launch; genuine defaults remain explicit',async()=>{
 for(const patch of [{THN_AI_PILOT_COMPACT:'true'},{THN_AI_PILOT_KEEP_ALIVE:'forever'},{THN_AI_PILOT_THREADS:'8'},{THN_AI_PILOT_THREADS:''},{THN_AI_PILOT_THREADS:2}])await assert.rejects(supervisePilot({env:{...settingsEnv,...patch},workerURL:new URL('./fixtures/does-not-exist.mjs',import.meta.url)}),/Invalid local pilot/);
 const r=await supervisePilot({mode:'--run',model:'fixture:local',language:'en',env,workerURL:settingsWorker});assert.deepEqual(r.requestedSettings,{compactPilot:false,keepAlive:0,pilotThreads:1});assert.equal(r.workerConfirmedSettings,null);assert.equal(r.settingsConfirmation,'unconfirmed');
});
test('settings projection never fabricates missing defaults, trusts mismatched acknowledgements or leaks raw fields',async()=>{
 const empty=safePilotReport(null);assert.equal(empty.keepAlive,null);assert.equal(empty.compactPilot,null);assert.equal(empty.pilotThreads,null);assert.equal(empty.requestedSettings,null);
 const r=await supervisePilot({mode:'--run',model:'settings:mismatch',language:'en',env:settingsEnv,policyMs:500,workerURL:settingsWorker});assertRequestedSettings(r);assert.equal(r.settingsConfirmation,'worker_validated');
 for(const patch of [{workerConfirmedSettings:{...requestedSettings,pilotThreads:4}},{settingsConfirmation:secret}]){const r=safePilotReport({requestedSettings,workerConfirmedSettings:requestedSettings,settingsConfirmation:'request_prepared',...patch});assert.equal(r.workerConfirmedSettings,null);assert.equal(r.settingsConfirmation,'unconfirmed');assert.equal(JSON.stringify(r).includes(secret),false);}
 const r2=safePilotReport({requestedSettings:{...requestedSettings,private:secret},workerConfirmedSettings:requestedSettings,settingsConfirmation:'request_prepared',runtimeSettingsVerified:true,compactPilot:false,keepAlive:0,pilotThreads:1});assert.deepEqual(r2.requestedSettings,requestedSettings);assert.equal(r2.compactPilot,true);assert.equal(r2.runtimeSettingsVerified,false);assert.equal(JSON.stringify(r2).includes(secret),false);
});
test('real supervised EN/AR HTTP timeout retains settings encoded in the unfinished generation request',async()=>{
 const chats=[];
 const server=http.createServer((req,res)=>{let text='';req.on('data',b=>text+=b);req.on('end',()=>{
  const body=text?JSON.parse(text):{};
  if(req.url==='/api/chat'){chats.push(body);return;}
  const value=req.url==='/api/tags'?{models:[{name:'fixture:local',digest:'a'.repeat(64),size:1400000000}]}:{model_info:{'general.architecture':'offline-fixture'},capabilities:['completion']};
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));
 });});server.listen(11434,'127.0.0.1');await once(server,'listening');
 try{for(const language of ['en','ar']){const r=await supervisePilot({mode:'--run',model:'fixture:local',language,env:settingsEnv,policyMs:1000});assertRequestedSettings(r);assert.equal(r.failureCode,'TIMEOUT');assert.equal(r.settingsConfirmation,'request_prepared');assert.deepEqual(r.workerConfirmedSettings,requestedSettings);assert.equal(r.runtime.responseReceived,false);assert.equal(r.supervision.runtimeSettlementVerified,false);assert.equal(r.timings.stages.generation.state,'unsettled');}}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 assert.equal(chats.length,2);for(const body of chats){assert.equal(body.think,false);assert.equal(body.keep_alive,'5m');assert.equal(body.options.num_thread,2);}
});
