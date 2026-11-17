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
