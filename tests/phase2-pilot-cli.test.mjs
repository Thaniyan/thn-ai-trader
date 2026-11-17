import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticPilotSnapshot,parsePilotArgs,runPilot} from '../scripts/pilot-local-ai.mjs';
import {validateLocalSnapshot} from '../server/intelligence-local.js';

test('phase2 local pilot fixtures are synthetic, immutable, fresh and cross-timeframe',()=>{
 const now=1800000000000,s=syntheticPilotSnapshot(now);
 assert.equal(s.symbol,'EURUSD');assert.equal(s.interval,'1h');
 assert.equal(s.fresh,true);assert.equal(s.refs.filter(x=>x.interval).length,3);
 assert.equal(validateLocalSnapshot(s,now),s);
 assert.ok(s.refs.every(r=>r.source.includes('SYNTHETIC')));
 assert.ok(s.refs.some(r=>r.trend==='bearish')&&s.refs.some(r=>r.trend==='bullish'));
});
test('phase2 CLI refuses accidental inference, cloud tags and unbounded flags',()=>{
 assert.deepEqual(parsePilotArgs(['--check','--model','qwen3:1.7b','ar']),{mode:'--check',model:'qwen3:1.7b',language:'ar'});
 for(const args of [[],['--run','--model','tag'],['--run','--model','cloud model','en'],['--run','--model','x','fr'],['--install','--model','x','en']])assert.throws(()=>parsePilotArgs(args));
});
test('read-only pilot uses injected installed metadata and never calls generation',async()=>{
 let inspected=0,generated=0;
 const result=await runPilot({mode:'--check',model:'qwen3:1.7b',language:'en',
  env:{},inspect:async()=>{inspected++;return {model:'qwen3:1.7b',digest:'a'.repeat(64),sizeBytes:1400000000}},
  generate:async()=>{generated++;throw Error('forbidden')}});
 assert.equal(inspected,1);assert.equal(generated,0);assert.equal(result.generationTested,false);assert.equal(result.financialExecution,false);
});
test('hosted pilot is rejected before touching installed model or calling inference',async()=>{
 let calls=0;
 await assert.rejects(runPilot({mode:'--check',model:'qwen3:1.7b',language:'ar',env:{VERCEL:'1'},inspect:async()=>{calls++}}));
 assert.equal(calls,0);
});
test('inference is not invoked without opt-in token or when paper mode is enabled',async()=>{
 let generated=0;
 const inspect=async()=>({model:'qwen3:1.7b',digest:'b'.repeat(64),sizeBytes:1400000000});
 const generate=async()=>{generated++};
 for(const env of [{},{THN_AI_ENABLED:'1'},{THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'fixture',THN_LOCAL_PAPER:'1'}]){
  await assert.rejects(runPilot({mode:'--run',model:'qwen3:1.7b',language:'en',env,inspect,generate}));
 }
 assert.equal(generated,0);
});
test('rejected fixture model response emits no prose, secrets or fake success',async()=>{
 let calls=0;
 const result=await runPilot({mode:'--run',model:'fixture:local',language:'ar',
  now:()=>1800000000000,
  env:{THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'private-fixture',THN_LOCAL_PAPER:'0',THN_AI_MAX_REQUESTS:'2',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'10000'},
  inspect:async()=>({model:'fixture:local',digest:'c'.repeat(64),sizeBytes:1400000000}),
  generate:async()=>{calls++;throw Error('private-fixture inaccessible')}});
 assert.equal(calls,1);assert.equal(result.accepted,false);assert.equal(result.fallback,true);
 assert.equal(result.humanReviewRequired,true);
 assert.equal(JSON.stringify(result).includes('private-fixture'),false);
});

test('accepted strict synthetic interpretation reports bounded real latency and valid citations without prose',async()=>{
 const {evidenceState}=await import('../public/intelligence-generation.js');
 const now=1800000000000,expected=syntheticPilotSnapshot(now);
 let calls=0;
 const result=await runPilot({mode:'--run',model:'fixture:local',language:'en',now:()=>now,
  env:{THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'private-fixture',THN_LOCAL_PAPER:'0',
   THN_AI_MAX_REQUESTS:'2',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'10000'},
  inspect:async()=>({model:'fixture:local',digest:'e'.repeat(64),sizeBytes:1400000000}),
  generate:async(_env,source)=>{calls++;assert.equal(source.id,expected.id);return {
   schema:'THN-GENERATION-7.1',snapshotId:source.id,symbol:'EURUSD',interval:'1h',
   summary:'The directional evidence disagrees. Investigate opposing observations.',
   citations:['frame-1h','frame-1d'],
   claims:[{reference:'frame-1h',field:'trend',value:'bullish'}],
   roles:['technical','manager'],evidenceState:evidenceState(source),
   uncertainties:['Opposing trends remain unresolved.'],
   method:'llm',provider:'ollama',model:'fixture:local',latencyMs:215,
  };}});
 assert.equal(calls,1);
 assert.equal(result.generationTested,true);assert.equal(result.accepted,true);assert.equal(result.fallback,false);assert.equal(result.failureCode,null);
 assert.equal(result.latencyMs,215);assert.equal(result.matchedCitations,2);assert.equal(result.matchedClaims,1);
 assert.equal(result.financialExecution,false);assert.equal(result.noPredictiveProbability,true);
 assert.equal(JSON.stringify(result).includes('private-fixture'),false);
 assert.equal(JSON.stringify(result).includes('The directional evidence'),false);
});
test('unbounded or corrupt provider timing is not published as a measured latency',async()=>{
 const {evidenceState}=await import('../public/intelligence-generation.js');
 const at=1800000000000;
 const result=await runPilot({mode:'--run',model:'fixture:local',language:'en',now:()=>at,
  env:{THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'private-fixture',THN_LOCAL_PAPER:'0',
   THN_AI_MAX_REQUESTS:'2',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'10000'},
  inspect:async()=>({model:'fixture:local',digest:'e'.repeat(64),sizeBytes:1400000000}),
  generate:async(_env,source)=>({
   schema:'THN-GENERATION-7.1',snapshotId:source.id,symbol:source.symbol,interval:source.interval,
   summary:'The evidence conflicts. Review its sources.',citations:['frame-1h'],
   claims:[{reference:'frame-1h',field:'trend',value:'bullish'}],
   roles:['technical','manager'],evidenceState:evidenceState(source),uncertainties:['The sources disagree.'],
   method:'llm',provider:'ollama',model:'fixture:local',latencyMs:Infinity,
  })});
 assert.equal(result.accepted,true);assert.equal(result.latencyMs,null);
});

test('safe local pilot codes distinguish timeout, context, malformed JSON and false citations without leaking text',async()=>{
 const {classifyPilotFailure}=await import('../server/intelligence-diagnostics.js');
 assert.equal(classifyPilotFailure(new Error('Local provider timeout')),'TIMEOUT');
 assert.equal(classifyPilotFailure(new Error('Local context window exceeded')),'CONTEXT_LIMIT');
 assert.equal(classifyPilotFailure(new SyntaxError('private-fixture raw provider text')),'INVALID_JSON');
 assert.equal(classifyPilotFailure(new Error('Invalid model schema or citation')),'INVALID_SCHEMA');
 assert.equal(classifyPilotFailure(new Error('Invented fact or calculation')),'UNSUPPORTED_CLAIM');
 assert.equal(classifyPilotFailure(new Error('provider returned secret private-fixture')),'UNKNOWN');
 const env={THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'private-fixture',THN_LOCAL_PAPER:'0',
   THN_AI_MAX_REQUESTS:'2',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'10000'};
 const inspect=async()=>({model:'fixture:local',digest:'e'.repeat(64),sizeBytes:1400000000});
 for(const [error,expected] of [
  [Error('Local context window exceeded'),'CONTEXT_LIMIT'],
  [Error('Local provider timeout'),'TIMEOUT'],
  [new SyntaxError('private-fixture raw model response'),'INVALID_JSON'],
  [Error('Invented fact or calculation'),'UNSUPPORTED_CLAIM'],
  [Error('private-fixture unexpected exception'),'UNKNOWN']
 ]){
  const result=await runPilot({mode:'--run',model:'fixture:local',language:'en',
    now:()=>1800000000000,env,inspect,generate:async()=>{throw error}});
  assert.equal(result.accepted,false);assert.equal(result.fallback,true);
  assert.equal(result.failureCode,expected);
  assert.equal(JSON.stringify(result).includes('private-fixture'),false);
  assert.equal(JSON.stringify(result).includes(error.message),false);
 }
});

test('local pilot retains model for 5m only on explicit opt-in, leaves default at zero',async()=>{
 const env={THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'private-fixture',THN_LOCAL_PAPER:'0',
  THN_AI_MAX_REQUESTS:'2',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'10000'};
 const inspect=async()=>({model:'fixture:local',digest:'e'.repeat(64),sizeBytes:1400000000});
 const options=[],generate=async(_env,_snapshot,_question,optionsArg)=>{
  options.push(optionsArg);throw Error('Local provider timeout');
 };
 for(const [keepAlive,expected] of [[undefined,0],['5m','5m']]){
  const result=await runPilot({mode:'--run',model:'fixture:local',language:'en',
   now:()=>1800000000000,env:{...env,...(keepAlive?{THN_AI_PILOT_KEEP_ALIVE:keepAlive}:{})},
   inspect,generate});
  assert.equal(result.keepAlive,expected);
  assert.equal(options.at(-1).pilotKeepAlive,expected);
  assert.equal(result.failureCode,'TIMEOUT');
  assert.equal(result.accepted,false);assert.equal(result.fallback,true);
  assert.ok(Number.isInteger(result.elapsedMs)&&result.elapsedMs>=0&&result.elapsedMs<=30000);
 }
 assert.equal(options.length,2);
});
test('invalid warm-keep-alive input is refused before any generation request',async()=>{
 let calls=0;
 await assert.rejects(runPilot({mode:'--run',model:'fixture:local',language:'en',
  env:{THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'private-fixture',THN_LOCAL_PAPER:'0',
  THN_AI_MAX_REQUESTS:'2',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'10000',
  THN_AI_PILOT_KEEP_ALIVE:'24h'},
  inspect:async()=>({model:'fixture:local',digest:'e'.repeat(64),sizeBytes:1400000000}),
  generate:async()=>{calls++;}}));
 assert.equal(calls,0);
});

test('compact mode preserves source-linked reference identity and is not active by default',async()=>{
 const {compactPilotEvidence}=await import('../server/intelligence-local.js');
 const s=syntheticPilotSnapshot(1800000000000),compact=compactPilotEvidence(s);
 assert.equal(compact.snapshotId,s.id);
 assert.deepEqual(compact.refs.map(r=>r.id),s.refs.map(r=>r.id));
 for(let i=0;i<s.refs.length;i++){
  const a=s.refs[i],b=compact.refs[i];
  for(const key of ['interval','trend','source','providerSymbol','datasetHash','availableAt','status','inputs'])
   assert.deepEqual(b[key],a[key]);
 }
 assert.deepEqual(compact.missing,s.missing);
 assert.deepEqual(compact.limitations,s.limitations);
 const env={THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'private-fixture',THN_LOCAL_PAPER:'0',
  THN_AI_MAX_REQUESTS:'2',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'12000'};
 const inspect=async()=>({model:'fixture:local',digest:'e'.repeat(64),sizeBytes:1400000000});
 let seen=[];
 for(const mode of [undefined,'1']){
  const result=await runPilot({mode:'--run',model:'fixture:local',language:'en',
   env:{...env,...(mode?{THN_AI_PILOT_COMPACT:mode}:{})},
   inspect,generate:async(_e,_s,_q,o)=>{seen.push(o);throw Error('Local provider timeout')}});
  assert.equal(result.compactPilot,mode==='1');
  assert.equal(result.accepted,false);assert.equal(result.failureCode,'TIMEOUT');
 }
 assert.deepEqual(seen.map(x=>x.pilotCompact),[false,true]);
});
test('invalid local compact flag fails closed without inference',async()=>{
 let calls=0;
 await assert.rejects(runPilot({mode:'--run',model:'fixture:local',language:'en',
  env:{THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'fixture',THN_LOCAL_PAPER:'0',
   THN_AI_MAX_REQUESTS:'2',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'12000',
   THN_AI_PILOT_COMPACT:'yes'},
  inspect:async()=>({model:'fixture:local',digest:'e'.repeat(64),sizeBytes:1400000000}),
  generate:async()=>{calls++}}));
 assert.equal(calls,0);
});
