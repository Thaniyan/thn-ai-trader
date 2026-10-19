import {replayFixture} from './replay-fixture.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function withServer(mode,local,run){
 const dir=await mkdtemp(path.join(tmpdir(),'thn-test-'));const port=3400+Math.floor(Math.random()*1000);const base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['--import','./tests/provider-fixture.js','server.js'],{cwd:root,env:{...process.env,PORT:String(port),THN_DATA_DIR:dir,THN_LOCAL_PAPER:local?'1':'0',TEST_PROVIDER_MODE:mode},stdio:['ignore','pipe','pipe']});
 try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server startup timed out')),5000);child.once('error',reject);child.stdout.on('data',d=>{if(String(d).includes('running locally')){clearTimeout(timer);resolve();}});});
  const get=async route=>{const res=await fetch(base+route);return [res,await res.json()]};
  const post=async(route,body,headers={})=>{const res=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});return [res,await res.json()]};
  await run({get,post,base});
 } finally {child.kill();await new Promise(r=>child.once('exit',r));await rm(dir,{recursive:true,force:true});}
}
test('public mode: data provenance, truthful analysis and protected financial endpoints',()=>withServer('up',false,async({get,post})=>{
 const [,health]=await get('/api/health');assert.equal(health.capabilities.liveTrading,false);assert.equal(health.capabilities.paperExecution,false);
 const [,accounts]=await get('/api/accounts');assert.deepEqual(accounts.accounts,[]);assert.equal(accounts.available,false);
 for(const route of ['/api/orders/execute','/api/positions/close','/api/broker/reset-sandbox','/api/broker/connect-account'])assert.equal((await post(route,{}))[0].status,503);
 assert.equal((await get('/api/audit-logs'))[0].status,503);
 const [,data]=await get('/api/quotes');assert.equal(Object.keys(data.quotes).length,6);
 for(const q of Object.values(data.quotes)){assert.ok(q.close>0);assert.match(q.source,/Yahoo/);assert.equal(q.bid,null);assert.equal(q.ask,null);assert.equal(q.changePeriod,'previous candle');assert.ok(q.timestamp);}
 const [,research]=await get('/api/research/series?symbol=EURUSD&interval=1h');assert.ok(research.candles.length>=60);assert.equal(research.provenance.interval,'1h');
 const [briefResponse,brief]=await get('/api/research/brief?symbol=EURUSD&interval=1h');assert.equal(briefResponse.status,200);assert.equal(brief.method,'deterministic');assert.equal(brief.claims.length,3);assert.equal(brief.selected.provenance.hash,research.provenance.hash);assert.equal(brief.narrative,null);
 const [planResponse,planResult]=await post('/api/research/plan',{symbol:'USDJPY',side:'BUY',capital:10000,riskPct:1,entry:150,stop:149,targets:[152],leverage:20,spreadBps:2,slippageBps:1,commissionBps:1});assert.equal(planResponse.status,200);assert.equal(planResult.plan.metrics.slDollars,100);assert.equal(planResult.plan.metrics.requiredMargin,750);
 assert.equal((await post('/api/research/plan',{symbol:'BTCUSDT'}))[0].status,400);
 assert.equal((await get('/api/research/brief?symbol=EURUSD&interval=4h'))[0].status,400);
 const [,mtf]=await get('/api/research/mtf?symbol=EURUSD');assert.equal(mtf.frames.length,3);assert.ok(mtf.frames.every(f=>f.available));assert.equal(new Set(mtf.frames.map(f=>f.provenance.hash)).size,3);
 const [evaluationResponse,evaluation]=await post('/api/research/evaluate',{symbol:'EURUSD',interval:'1h',parameters:{direction:'long_short'},validation:{trainFraction:.7,minimumTrades:10}});assert.equal(evaluationResponse.status,200);assert.equal(evaluation.version,'6.3');assert.ok(evaluation.development.sample.lastTime<evaluation.holdout.sample.firstTime);assert.ok(evaluation.limits.runsExecuted<=18);
 assert.equal((await post('/api/research/evaluate',{symbol:'EURUSD',validation:{trainFraction:.99}}))[0].status,400);
 const [,backtest]=await post('/api/research/backtest',{symbol:'EURUSD',interval:'1h',parameters:{strategy:'ema'}});assert.equal(backtest.available,true);assert.ok(Array.isArray(backtest.equity));
 const [,repeated]=await post('/api/research/backtest',{symbol:'EURUSD',interval:'1h',parameters:{strategy:'ema'},candles:[{close:999999}],balance:999999});assert.deepEqual(repeated.metrics,backtest.metrics);
 assert.equal((await post('/api/research/backtest',{symbol:'EURUSD',interval:'5m'}))[0].status,400);
 assert.equal((await post('/api/research/backtest',{symbol:'EURUSD',parameters:[]}))[0].status,400);
 const [,analysis]=await post('/api/analyze',{symbol:'EURUSD',timeframe:'intraday'});assert.equal(analysis.methodology.type,'deterministic');assert.equal(analysis.backtest.available,false);assert.equal(analysis.mtfa.available,false);assert.deepEqual(analysis.macroCalendar,[]);assert.ok(Number.isFinite(analysis.indicators.rsi14));assert.ok(analysis.schools.length);
 assert.equal((await post('/api/risk/calculate',{lots:-1}))[0].status,400);
 assert.equal((await post('/api/risk/calculate',{symbol:'EURUSD',lots:.1,entryPrice:1.1,stopLoss:1.2,takeProfit:1.3}))[1].code,'INVALID_PROTECTION_DIRECTION');
 assert.equal((await post('/api/risk/calculate',{symbol:'EURGBP',lots:.1,entryPrice:1.1,stopLoss:1,takeProfit:1.3}))[1].code,'UNSUPPORTED_RISK_CONTRACT');
 assert.equal((await post('/api/analyze',{symbol:'bad/path'}))[0].status,400);
 assert.equal((await post('/api/risk/calculate',{}, {Origin:'https://attacker.invalid'}))[0].status,403);
}));
test('provider outage never substitutes synthetic candles or analysis',()=>withServer('down',false,async({get,post})=>{
 const [r,d]=await get('/api/market/EURUSD');assert.equal(r.status,503);assert.equal(d.code,'MARKET_DATA_UNAVAILABLE');assert.equal(d.candles,undefined);
 assert.equal((await post('/api/analyze',{symbol:'EURUSD'}))[0].status,503);
 assert.equal((await get('/api/research/series?symbol=EURUSD&interval=1h'))[0].status,503);
 const [briefResponse,brief]=await get('/api/research/brief?symbol=EURUSD&interval=1h');assert.equal(briefResponse.status,503);assert.equal(brief.claims.length,0);assert.equal(brief.selected,null);
 assert.equal((await get('/api/research/mtf?symbol=EURUSD'))[0].status,503);
 assert.equal((await post('/api/research/backtest',{symbol:'EURUSD'}))[0].status,503);
 assert.equal((await post('/api/research/evaluate',{symbol:'EURUSD'}))[0].status,503);
 const [,data]=await get('/api/quotes');for(const q of Object.values(data.quotes)){assert.equal(q.status,'unavailable');assert.equal(q.close,null);}
}));
test('stale data remains inspectable but cannot execute',()=>withServer('stale',true,async({get,post})=>{
 const [,data]=await get('/api/quotes');assert.equal(data.quotes.EURUSD.status,'stale');
 const [,result]=await post('/api/orders/execute',{accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:.1,stopLoss:1.07,takeProfit:1.1,idempotencyKey:'stale'});assert.equal(result.code,'STALE_PRICE');
}));
test('local paper lifecycle: sanitization, concurrent idempotency, settlement and reconciliation',()=>withServer('up',true,async({get,post})=>{
 const [,accounts]=await get('/api/accounts');const account=accounts.accounts[0];assert.equal(account.balance,50000);assert.equal(account.accountNumber,undefined);assert.equal(account.encryptedCredentials,undefined);
 const order={accountId:account.id,symbol:'EURUSD',side:'BUY',lots:.1,stopLoss:1.07,takeProfit:1.1,idempotencyKey:'same'};
 const results=await Promise.all([post('/api/orders/execute',order),post('/api/orders/execute',order)]);assert.ok(results.some(([r])=>r.status===200));assert.ok(results.every(([r])=>[200,409].includes(r.status)));assert.equal(new Set(results.filter(([r])=>r.status===200).map(([,d])=>d.orderResult.ticket)).size,1);
 const ticket=results.find(([r])=>r.status===200)[1].orderResult.ticket;
 const [,replay]=await post('/api/orders/execute',order);assert.equal(replay.orderResult.ticket,ticket);
 assert.equal((await post('/api/orders/execute',{...order,lots:.2}))[1].code,'IDEMPOTENCY_CONFLICT');
 const [,current]=await get('/api/accounts');assert.equal(current.accounts[0].positions.length,1);
 const [,closed]=await post('/api/positions/close',{accountId:account.id,ticket,symbol:'UNTRUSTED'});assert.ok(closed.closeResult);assert.ok(Number.isFinite(closed.closeResult.realizedPnl));
 const [,reconciled]=await post('/api/broker/reconcile',{accountId:account.id});assert.equal(reconciled.ok,true);
 assert.equal((await post('/api/broker/connect-account',{broker:'mt5',balance:999999}))[1].code,'BROKER_UNAVAILABLE');
 const [,reset]=await post('/api/broker/reset-sandbox',{accountId:account.id});assert.equal(reset.account.balance,50000);
}));

test('partial independent provider outage remains visible and never becomes complete',()=>withServer('partial',false,async({get})=>{const [r,data]=await get('/api/research/mtf?symbol=EURUSD');assert.equal(r.status,200);assert.equal(data.complete,false);assert.equal(data.frames.filter(f=>f.available).length,2);assert.equal(data.frames.find(f=>f.interval==='1d').available,false);}));

test('snapshot-only replay remains available during provider outage and cannot mutate finances',()=>withServer('down',false,async({get,post,base})=>{
 const fixture=replayFixture();const [r,data]=await post('/api/research/replay',{...fixture,includeChart:true});assert.equal(r.status,200);assert.equal(data.status,'reproduced');assert.equal(data.providerFetched,false);assert.equal(data.financialMutation,false);assert.equal(data.chart.candles.length,600);
 const [,accounts]=await get('/api/accounts');assert.deepEqual(accounts.accounts,[]);assert.equal((await post('/api/orders/execute',{}))[0].status,503);
 const altered=structuredClone(fixture);altered.snapshot.candles[0].volume++;assert.equal((await post('/api/research/replay',altered))[1].code,'SNAPSHOT_INTEGRITY_FAILURE');
 const invalid=await fetch(base+'/api/research/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'});assert.equal(invalid.status,400);assert.equal((await invalid.json()).code,'INVALID_JSON');
 const oversized=await fetch(base+'/api/research/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(1000001)});assert.equal(oversized.status,413);assert.equal((await oversized.json()).code,'PAYLOAD_TOO_LARGE');
 assert.equal((await post('/api/research/replay',fixture,{Origin:'https://attacker.invalid'}))[0].status,403);
}));
test('curated market catalog discloses candidate coverage and correct instrument mappings',()=>withServer('down',false,async({get})=>{const [r,data]=await get('/api/research/catalog');assert.equal(r.status,200);assert.equal(data.instruments.length,18);assert.equal(new Set(data.instruments.map(v=>v.category)).size,5);assert.equal(data.instruments.find(v=>v.symbol==='NAS100').providerSymbol,'^NDX');assert.equal(data.instruments.find(v=>v.symbol==='USOIL').proxy,true);assert.ok(data.instruments.every(v=>v.contract.contractSize>0));assert.match(data.availability,/Candidate/);}));
