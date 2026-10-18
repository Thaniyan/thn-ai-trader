import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateNarrative} from '../server/openai.js';
import {getBrokerAdapter} from '../server/brokerAdapters.js';
import {startTestServer} from './harness.mjs';
test('narrative schema refuses numeric trading overrides and malformed output',()=>{
  assert.throws(()=>validateNarrative({aiNarrative:'x',professionalActionPlan:[],extraWarnings:[],entry:999}));
  assert.throws(()=>validateNarrative({aiNarrative:'x',professionalActionPlan:'execute',extraWarnings:[]}));
  assert.equal(validateNarrative({aiNarrative:'Caution',professionalActionPlan:[],extraWarnings:[]}).aiNarrative,'Caution');
});
test('all external broker adapters fail closed regardless of configuration',async()=>{
  for(const name of ['exness','xtb','mt5']){const adapter=getBrokerAdapter(name);assert.equal((await adapter.testConnection()).ok,false);assert.equal((await adapter.getConnectionStatus()).latencyMs,null);await assert.rejects(()=>adapter.placeOrder());await assert.rejects(()=>adapter.closePosition());await assert.rejects(()=>adapter.fetchPositions())}
  assert.throws(()=>getBrokerAdapter('unknown'));
});
for(const mode of ['valid','invalid','outage','rate-limit','timeout'])test(`mocked OpenAI ${mode} never modifies numerical analysis`,async()=>{
  const s=await startTestServer({OPENAI_API_KEY:'test-only-ai-token',THN_TEST_OPENAI_MODE:mode});try{
    const a=await (await fetch(s.url+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'},body:JSON.stringify({symbol:'EURUSD'})})).json();
    assert.equal(a.aiStatus,mode==='valid'?'VERIFIED':'FAILED');assert.notEqual(a.entry,999);assert.equal(a.provenance.executable,false);
    const readiness=await (await fetch(s.url+'/api/readiness')).json();assert.equal(readiness.openai.verified,mode==='valid');assert.equal(readiness.liveExecutionEnabled,false);
  }finally{await s.stop()}
});
