import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {startTestServer} from './harness.mjs';
import {assertPaperMarket,classifyQuote,MAX_QUOTE_AGE} from '../server/marketData.js';
import {paperPrice,PAPER_EXECUTION_MODEL} from '../server/paperExecution.js';
import {PaperTradingAdapter} from '../server/brokerAdapters.js';
const headers={'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'};
const order={accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.1,stopLoss:1.08,takeProfit:1.095,idempotencyKey:'reliability'};
const post=(s,data)=>fetch(s.url+'/api/orders/execute',{method:'POST',headers,body:JSON.stringify(data)});
const history=async s=>await(await fetch(s.url+'/api/orders/history?accountId='+order.accountId,{headers})).json();
test('freshness boundary is inclusive, future clocks are bounded, and candle freshness is rechecked',()=>{
 const now=Date.now();assert.equal(classifyQuote(now-MAX_QUOTE_AGE,now),true);assert.equal(classifyQuote(now-MAX_QUOTE_AGE-1,now),false);assert.equal(classifyQuote(now+1001,now),false);
 const candles=Array.from({length:40},(_,i)=>({time:now-(42-i)*3600000,open:1,high:2,low:0.5,close:1,volume:1}));
 assert.throws(()=>assertPaperMarket({marketTime:now,quotePrice:1,symbolInfo:{assetClass:'Forex'},candles,provenance:{instrumentMatch:true,verified:true,candlesCurrent:true,state:'REAL'}}),{code:'STALE_PRICE'});
});
test('cache preserves observation and quote times; evaluation time and delivery reveal cache use',async()=>{
 const s=await startTestServer({THN_TEST_COUNT_REQUESTS:'1'});try{
 const get=async()=>await(await fetch(s.url+'/api/market/EURUSD')).json();const a=await get();await new Promise(r=>setTimeout(r,20));const b=await get();
 assert.equal(a.provenance.delivery,'PROVIDER');assert.equal(b.provenance.delivery,'CACHED');assert.equal(b.provenance.observedAt,a.provenance.observedAt);assert.equal(b.marketTime,a.marketTime);assert.ok(b.provenance.evaluatedAt>a.provenance.evaluatedAt);assert.equal(b.provenance.dataType,'DELAY_UNKNOWN');assert.equal(b.provenance.simulated,false);
 assert.equal((await readFile(s.dir+'/provider-count.txt','utf8')).trim().split('\n').length,1);
 }finally{await s.stop()}
});
for(const mode of ['missing-price','missing-currency','wrong-currency','invalid-delay','missing-time','future-time','invalid-json','timeout','outage','rate-limit','stale','old-history','delayed'])test(`${mode}: no paper fill, no balance change, durable rejection and diagnostic evidence`,async()=>{
 const s=await startTestServer({THN_TEST_PROVIDER_MODE:mode});try{
 const r=await post(s,order);assert.equal(r.status,502);const d=await r.json();assert.equal(d.ok,false);
 const a=(await(await fetch(s.url+'/api/accounts',{headers})).json()).accounts[0];assert.equal(a.positions.length,0);assert.equal(a.balance,50000);assert.equal(a.usedMargin,0);
 const h=await history(s);assert.equal(h.events.length,1);assert.equal(h.events[0].eventType,'ORDER_REJECTED');
 const readiness=await(await fetch(s.url+'/api/readiness')).json();assert.ok(readiness.marketData.providers.length>0);assert.equal(readiness.liveExecutionEnabled,false);
 if(mode==='delayed'){const m=await(await fetch(s.url+'/api/market/EURUSD')).json();assert.equal(m.provenance.dataType,'DELAYED');assert.equal(m.provenance.delaySeconds,900);assert.equal(m.provenance.fresh,false)}
 if(['missing-price','missing-currency','wrong-currency','invalid-delay','missing-time','future-time'].includes(mode))assert.ok(readiness.marketData.providers.some(p=>p.state==='INVALID_RESPONSE'));
 }finally{await s.stop()}
});
test('fill model is explicit, limit admission is validated, and pending payloads exclude arbitrary client state',async()=>{
 assert.equal(paperPrice('EURUSD','BUY',1.085),1.08504);assert.equal(paperPrice('EURUSD','BUY',1.085,true),1.08496);assert.equal(PAPER_EXECUTION_MODEL.roundTripSpreadPips,0.8);assert.equal(PAPER_EXECUTION_MODEL.commission,0);
 const adapter=new PaperTradingAdapter(),account={broker:'paper',tradingMode:'PAPER',status:'CONNECTED',permissionLevel:'TRADING_ENABLED',balance:50000,freeMargin:50000,currency:'USD',leverage:200,positions:[],orders:[]};
 await assert.rejects(()=>adapter.placeOrder({...account,freeMargin:54.26},order,1.085),{code:'INSUFFICIENT_MARGIN'});
 await assert.rejects(()=>adapter.placeOrder(account,{...order,side:'BUY LIMIT',entryPrice:1.084,lots:-1},1.085),{code:'INVALID_VOLUME'});
 const p=await adapter.placeOrder(account,{...order,side:'BUY LIMIT',entryPrice:1.084,apiToken:'must-not-persist',balance:999},1.085);
 assert.equal(p.pendingOrder.apiToken,undefined);assert.equal(p.pendingOrder.balance,undefined);assert.equal(p.ticket,p.pendingOrder.ticket);assert.equal(p.executionModel.simulated,true);
});
test('concurrent retries create one fill; history is private, paginated and survives restart',async()=>{
 let s=await startTestServer();const dir=s.dir;try{
 const rs=await Promise.all(Array.from({length:8},()=>post(s,order)));const ds=await Promise.all(rs.map(r=>r.json()));assert.ok(rs.every(r=>r.status===200));assert.equal(new Set(ds.map(d=>d.orderResult.ticket)).size,1);assert.equal(ds[0].orderResult.marketEvidence.instrument,'EURUSD=X');assert.equal(ds[0].orderResult.executionModel.id,'paper-fixed-v1');assert.equal(ds[0].account.equity,49999.2);assert.equal(ds[0].account.freeMargin,Number((49999.2-ds[0].account.usedMargin).toFixed(2)));assert.equal(ds[0].account.latencyMs,null);
 const forbidden=await fetch(s.url+'/api/orders/history?accountId='+order.accountId,{headers:{Authorization:'Bearer test-only-other-token'}});assert.equal(forbidden.status,403);
 assert.equal((await fetch(s.url+'/api/orders/history?accountId='+order.accountId)).status,401);
 assert.equal((await post(s,{...order,lots:0.2})).status,409);
 const pending=await(await post(s,{...order,side:'BUY LIMIT',entryPrice:1.084,lots:0.1,idempotencyKey:'pending'})).json();
 await fetch(s.url+'/api/orders/cancel',{method:'POST',headers,body:JSON.stringify({accountId:order.accountId,orderId:pending.orderResult.pendingOrder.id})});
 const first=await(await fetch(s.url+'/api/orders/history?accountId='+order.accountId+'&limit=1',{headers})).json();assert.equal(first.events.length,1);assert.ok(first.nextCursor);assert.equal(first.events[0].eventType,'PENDING_CANCELLED');
 const second=await(await fetch(s.url+'/api/orders/history?accountId='+order.accountId+'&limit=1&before='+first.nextCursor,{headers})).json();assert.equal(second.events[0].eventType,'ORDER_PENDING');
 assert.equal((await fetch(s.url+'/api/orders/history?accountId='+order.accountId+'&limit=0',{headers})).status,400);
 await s.stop(true);s=await startTestServer({},dir);const h=await history(s);assert.equal(h.events.filter(e=>e.eventType==='ORDER_FILLED').length,1);assert.equal((await(await post(s,order)).json()).orderResult.ticket,ds[0].orderResult.ticket);
 }finally{await s.stop()}
});
test('worker expires orders once, audits identity, and cannot overspend simultaneous pending reservations',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'thn-worker-reliability-'));
 try{
 const root=path.resolve('.');const script=`
 import assert from 'node:assert/strict';
 import {allAccountRecords,saveTradingAccounts} from '${root}/server/accountStore.js';
 import {processPaperAccounts} from '${root}/server/paperWorker.js';
 import {getOrderHistory} from '${root}/server/auditLogger.js';
 import {closeStorage} from '${root}/server/storage.js';
 const a=allAccountRecords()[0];a.balance=1000;a.equity=1000;a.freeMargin=1000;a.orders=[];a.positions=[];
 const base={symbol:'EURUSD',side:'BUY LIMIT',entryPrice:1.086,lots:1,stopLoss:1.0849,takeProfit:1.09,riskDollars:10,reservedMargin:543,expiresAt:Date.now()+86400000};
 a.orders=[{...base,id:'first'},{...base,id:'second'},{...base,id:'expired',expiresAt:Date.now()-1}];saveTradingAccounts();
 await processPaperAccounts();await processPaperAccounts();
 const result=allAccountRecords()[0];assert.equal(result.positions.length,1);assert.equal(result.orders.length,0);assert.ok(result.freeMargin>=0);assert.ok(result.usedMargin<1000);
 const h=getOrderHistory(a.id).events;assert.equal(h.filter(e=>e.eventType==='PENDING_EXPIRED').length,1);assert.equal(h.filter(e=>e.eventType==='PENDING_FILLED').length,1);assert.equal(h.filter(e=>e.eventType==='PENDING_REJECTED').length,1);assert.ok(h.every(e=>e.details.orderId));await closeStorage();`;
 await promisify(execFile)(process.execPath,['--import',path.resolve('tests/fixtures/providers.mjs'),'--input-type=module','-e',script],{env:{...process.env,THN_DATA_DIR:dir,APP_ENCRYPTION_KEY:'test-only-worker-key'},cwd:dir});
 }finally{await rm(dir,{recursive:true,force:true})}
});

test('conversion latency cannot extend the original quote validity',async()=>{
 const module=await import('../server/marketData.js?conversion-expiry');
 const originalFetch=globalThis.fetch,originalNow=Date.now;let clock=originalNow();
 Date.now=()=>clock;
 const candles=()=>Array.from({length:40},(_,i)=>({time:clock-(40-i)*3600000,open:1.25,high:1.3,low:1.2,close:1.25,volume:1}));
 const market={symbolInfo:{display:'EURGBP',assetClass:'Forex'},timeframe:'intraday',currency:'GBP',quotePrice:0.85,marketTime:clock-119000,candles:candles(),provenance:{instrumentMatch:true,verified:true,candlesCurrent:true,state:'REAL'}};
 try{
 globalThis.fetch=async()=>{clock+=2000;const cs=candles();return Response.json({chart:{result:[{meta:{symbol:'GBPUSD=X',currency:'USD',regularMarketTime:clock/1000,regularMarketPrice:1.25},timestamp:cs.map(c=>c.time/1000),indicators:{quote:[{open:cs.map(c=>c.open),high:cs.map(c=>c.high),low:cs.map(c=>c.low),close:cs.map(c=>c.close),volume:cs.map(c=>c.volume)}]}}]}})};
 await assert.rejects(()=>module.getPaperPricing(market),{code:'STALE_PRICE'});
 }finally{globalThis.fetch=originalFetch;Date.now=originalNow}
});
