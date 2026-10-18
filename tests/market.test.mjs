import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateCandles,classifyQuote} from '../server/marketData.js';
import {startTestServer} from './harness.mjs';
test('reject malformed, duplicate, unordered and future candles',()=>{
  const now=Date.now();const valid=Array.from({length:40},(_,i)=>({time:now-(40-i)*1000,open:1,high:2,low:0.5,close:1.5,volume:10}));
  assert.equal(validateCandles(valid).length,40);
  for(const change of [{high:0.1},{low:3},{close:NaN},{volume:-1},{time:now+10000},{time:valid[0].time}]){const broken=structuredClone(valid);Object.assign(broken[10],change);assert.throws(()=>validateCandles(broken))}
  assert.equal(classifyQuote(now-86400000),false);assert.equal(classifyQuote(now+10000),false);assert.equal(classifyQuote(now),true);
});
for(const mode of ['outage','stale'])test(`provider ${mode} cannot authorize orders or opportunities`,async()=>{
  const server=await startTestServer({THN_TEST_PROVIDER_MODE:mode});
  try{
    const order=await fetch(server.url+'/api/orders/execute',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'},body:JSON.stringify({accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.1,stopLoss:1.08,takeProfit:1.1,idempotencyKey:'unsafe'})});
    assert.equal(order.status,502);
    const response=await fetch(server.url+'/api/watchlist/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbols:['EURUSD'],minConfidence:50})});
    const data=await response.json();assert.equal(data.strongAlertCount,0);assert.equal(data.results[0].automation.active,false);
    if(mode==='stale'){assert.equal(data.results[0].decision,'WAIT');assert.equal(data.results[0].provenance.state,'STALE')}
    const accounts=await (await fetch(server.url+'/api/accounts',{headers:{Authorization:'Bearer test-only-operator-token'}})).json();assert.equal(accounts.accounts[0].positions.length,0);
  }finally{await server.stop()}
});

test('wholly empty provider bars are skipped without fabricating prices',async()=>{const s=await startTestServer({THN_TEST_PROVIDER_MODE:"empty"});try{const res=await fetch(s.url+"/api/market/EURUSD");assert.equal(res.status,200);const data=await res.json();assert.equal(data.provenance.gapsSkipped,1);assert.ok(data.candles.every(c=>c.close>0))}finally{await s.stop()}});

test('instrument mismatch is rejected and underlying proxies cannot qualify as opportunities',async()=>{const bad=await startTestServer({THN_TEST_PROVIDER_MODE:"wrong-symbol"});try{assert.equal((await fetch(bad.url+"/api/market/EURUSD")).status,502)}finally{await bad.stop()}const s=await startTestServer();try{const res=await fetch(s.url+"/api/watchlist/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbols:["XAUUSD"],minConfidence:50})});const data=await res.json();assert.equal(data.results[0].provenance.pricingProxy,true);assert.equal(data.results[0].automation.active,false)}finally{await s.stop()}});
