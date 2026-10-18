import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {startTestServer} from './harness.mjs';
import {retryAfterSeconds} from '../server/marketData.js';
const headers={'Content-Type':'application/json'};
const analyze=s=>fetch(s.url+'/api/analyze',{method:'POST',headers,body:JSON.stringify({symbol:'XAUUSD'})});
test('Gold outage keeps error identity and correlation, deduplicates requests and cools down',async()=>{
  const s=await startTestServer({THN_TEST_PROVIDER_MODE:'outage',THN_TEST_COUNT_REQUESTS:'1'});
  try{
    const responses=await Promise.all([analyze(s),analyze(s)]);
    for(const res of responses){assert.equal(res.status,502);assert.equal(res.headers.get('Retry-After'),'15');const data=await res.json();assert.equal(data.code,'MARKET_UNAVAILABLE');assert.equal(data.correlationId,res.headers.get('X-Correlation-ID'));assert.ok(s.logs().includes(data.correlationId))}
    const quotes=await fetch(s.url+'/api/quotes?symbols=XAUUSD');assert.equal(quotes.status,503);const data=await quotes.json();assert.equal(data.ok,false);assert.equal(data.state,'UNAVAILABLE');assert.deepEqual(data.quotes,{});assert.equal(data.errors.XAUUSD.code,'MARKET_UNAVAILABLE');
    assert.equal((await readFile(s.dir+'/provider-count.txt','utf8')).trim().split('\n').length,2,'one attempt per Yahoo host, none during cooldown');
  }finally{await s.stop()}
});
test('Gold provider quota propagates Retry-After instead of becoming an unexplained 502',async()=>{
  const s=await startTestServer({THN_TEST_PROVIDER_MODE:'rate-limit'});
  try{const res=await analyze(s);assert.equal(res.status,429);assert.equal(res.headers.get('Retry-After'),'60');assert.equal((await res.json()).code,'PROVIDER_RATE_LIMITED');const q=await fetch(s.url+'/api/quotes?symbols=XAUUSD');assert.equal(q.status,429);assert.equal((await q.json()).state,'UNAVAILABLE')}finally{await s.stop()}
});
test('partial quote batch preserves available instruments and identifies unavailable Gold',async()=>{
  const s=await startTestServer({THN_TEST_PROVIDER_MODE:'partial'});
  try{const res=await fetch(s.url+'/api/quotes?symbols=XAUUSD,EURUSD');assert.equal(res.status,200);const data=await res.json();assert.equal(data.state,'DEGRADED');assert.ok(data.quotes.EURUSD);assert.equal(data.quotes.XAUUSD,undefined);assert.equal(data.errors.XAUUSD.code,'MARKET_UNAVAILABLE')}finally{await s.stop()}
});
test('fresh Gold futures proxy is analysis-only and cannot authorize paper orders',async()=>{
  const s=await startTestServer();
  try{const analysis=await(await analyze(s)).json();assert.equal(analysis.aiStatus,'DISABLED');assert.equal(analysis.provenance.pricingProxy,true);assert.equal(analysis.decision,'WAIT');assert.equal(analysis.entry,null);const res=await fetch(s.url+'/api/orders/execute',{method:'POST',headers:{...headers,Authorization:'Bearer test-only-operator-token'},body:JSON.stringify({accountId:'acc_paper_sandbox_01',symbol:'XAUUSD',side:'BUY',lots:0.01,stopLoss:2700,takeProfit:2800,idempotencyKey:'proxy-rejection'})});assert.equal(res.status,502);assert.match((await res.json()).error,/Exact instrument/)}finally{await s.stop()}
});
test('Retry-After parses seconds and HTTP date with bounded provider cooldown',()=>{
 const now=Date.now();assert.equal(retryAfterSeconds('60',now),60);assert.equal(retryAfterSeconds(new Date(now+60000).toUTCString(),now),60);assert.equal(retryAfterSeconds('bad',now),30);assert.equal(retryAfterSeconds('99999',now),99999);
});
test('USD and USDT requests retain distinct instrument identity through the cache',async()=>{
 const s=await startTestServer();try{
  const usd=await(await fetch(s.url+'/api/market/BTCUSD')).json();const usdt=await(await fetch(s.url+'/api/market/BTCUSDT')).json();
  assert.equal(usd.symbolInfo.display,'BTCUSD');assert.equal(usdt.symbolInfo.display,'BTCUSDT');assert.equal(usd.provenance.instrumentMatch,true);assert.equal(usdt.provenance.instrumentMatch,false);
 }finally{await s.stop()}
});
test('cached prices crossing the freshness boundary become stale without restamping the quote',async()=>{
 const s=await startTestServer({THN_TEST_QUOTE_AGE_SECONDS:'118'});try{
  const first=await(await fetch(s.url+'/api/market/EURUSD')).json();assert.equal(first.provenance.quoteFresh,true);
  await new Promise(resolve=>setTimeout(resolve,3000));
  const second=await(await fetch(s.url+'/api/market/EURUSD')).json();assert.equal(second.marketTime,first.marketTime);assert.equal(second.provenance.quoteFresh,false);assert.equal(second.provenance.state,'STALE');
 }finally{await s.stop()}
});
