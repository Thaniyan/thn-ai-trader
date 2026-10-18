import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {startTestServer} from './harness.mjs';
const headers={'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'};
const post=async(s,path,body)=>{const r=await fetch(s.url+path,{method:'POST',headers,body:JSON.stringify(body)});return {status:r.status,data:await r.json()}};
function seedLegacy(s){
 const db=new DatabaseSync(s.dir+'/state.sqlite');
 try{const row=db.prepare("SELECT json FROM state WHERE name='accounts'").get();const accounts=JSON.parse(row.json);const a=accounts.find(a=>a.id==='acc_paper_sandbox_01');
 // Explicit historical paper-format fixture; never used by runtime data providers.
 a.positions=[{ticket:'legacy-gold',id:'legacy-gold',symbol:'XAUUSD',side:'BUY',lots:0.01,entryPrice:2735,sl:2700,tp:2800,margin:13.68,riskDollars:35,floatingPnl:0},
 {ticket:'legacy-eur',id:'legacy-eur',symbol:'EURUSD',side:'BUY',lots:0.02,entryPrice:1.085,sl:1.08,tp:1.1,margin:10.85,riskDollars:10,floatingPnl:0}];
 a.orders=[{id:'legacy-pending',symbol:'XAUUSD',side:'BUY LIMIT',lots:0.01,entryPrice:2700,stopLoss:2690,takeProfit:2800,reservedMargin:13.5,riskDollars:10,expiresAt:Date.now()+86400000}];
 a.usedMargin=24.53;a.equity=a.balance;a.freeMargin=a.balance-38.03;
 db.prepare("UPDATE state SET json=? WHERE name='accounts'").run(JSON.stringify(accounts));
 }finally{db.close()}
}
test('legacy proxy remains blocked, priced reductions remain independent, opening is explicitly gated',async()=>{
 const s=await startTestServer();try{
  await fetch(s.url+'/api/accounts',{headers});seedLegacy(s);
  const response=await fetch(s.url+'/api/accounts/recovery?accountId=acc_paper_sandbox_01',{headers});assert.equal(response.status,200);const status=await response.json();
  assert.equal(status.openingBlocked,true);assert.equal(status.positions.find(p=>p.symbol==='XAUUSD').canReduce,false);assert.equal(status.positions.find(p=>p.symbol==='EURUSD').canReduce,true);
  const bad=await post(s,'/api/positions/close',{accountId:'acc_paper_sandbox_01',ticket:'legacy-gold',volumeRatio:1,currentPrice:9999,idempotencyKey:'no-substitute'});
  assert.equal(bad.status,409);assert.equal(bad.data.code,'CLOSE_PRICE_UNAVAILABLE');assert.equal(bad.data.causeCode,'INSTRUMENT_UNVERIFIED');assert.ok(bad.data.correlationId);assert.match(bad.data.recovery,/retry/);
  const opening=await post(s,'/api/orders/execute',{accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.01,stopLoss:1.08,takeProfit:1.1,idempotencyKey:'blocked-exposure'});
  assert.equal(opening.status,409);assert.equal(opening.data.code,'EXPOSURE_VALUATION_UNAVAILABLE');
  for(const volumeRatio of [-1,0,1.1,null])assert.equal((await post(s,'/api/positions/close',{accountId:'acc_paper_sandbox_01',ticket:'legacy-eur',volumeRatio,idempotencyKey:'invalid-'+volumeRatio})).status,400);
  const body={accountId:'acc_paper_sandbox_01',ticket:'legacy-eur',volumeRatio:0.5,idempotencyKey:'reduce-once'};
  const reduced=await post(s,'/api/positions/close',body);assert.equal(reduced.status,200);assert.equal(reduced.data.closeResult.closedLots,0.01);assert.equal(reduced.data.account.positions.find(p=>p.ticket==='legacy-eur').lots,0.01);
  const replay=await post(s,'/api/positions/close',body);assert.equal(replay.status,200);assert.deepEqual(replay.data.closeResult,reduced.data.closeResult);
  assert.equal((await post(s,'/api/positions/close',{...body,volumeRatio:1,idempotencyKey:'reduce-rest'})).status,200);
  const canceled=await post(s,'/api/orders/cancel',{accountId:'acc_paper_sandbox_01',orderId:'legacy-pending'});assert.equal(canceled.status,200);assert.equal(canceled.data.account.orders.length,0);assert.equal(canceled.data.account.positions.length,1);
  const fills=await(await fetch(s.url+'/api/ledger',{headers})).json();assert.equal(fills.fills.length,2);assert.ok(fills.fills.every(f=>f.symbol==='EURUSD'));
  const audit=await(await fetch(s.url+'/api/audit-logs',{headers})).json();assert.ok(audit.events.some(e=>e.eventType==='POSITION_CLOSE_BLOCKED'&&e.correlationId===bad.data.correlationId));
  assert.equal((await fetch(s.url+'/api/accounts/recovery?accountId=acc_paper_sandbox_01',{headers:{Authorization:'Bearer test-only-other-token'}})).status,403);
 }finally{await s.stop()}
});
test('unavailable reduction creates no fill; matching-key restart with recovered exact feed permits the same request',async()=>{
 let s=await startTestServer({THN_TEST_PROVIDER_MODE:'outage'});try{
  await fetch(s.url+'/api/accounts',{headers});seedLegacy(s);
  const body={accountId:'acc_paper_sandbox_01',ticket:'legacy-eur',volumeRatio:1,idempotencyKey:'recover-close'};
  const failed=await post(s,'/api/positions/close',body);assert.equal(failed.status,409);assert.equal(failed.data.code,'CLOSE_PRICE_UNAVAILABLE');
  assert.equal((await(await fetch(s.url+'/api/ledger',{headers})).json()).fills.length,0);
  const dir=s.dir;await s.stop(true);s=await startTestServer({},dir);
  const recovered=await post(s,'/api/positions/close',body);assert.equal(recovered.status,200);assert.equal(recovered.data.account.positions.length,1);assert.equal(recovered.data.account.positions[0].symbol,'XAUUSD');
  assert.equal((await post(s,'/api/positions/close',body)).status,200);assert.equal((await(await fetch(s.url+'/api/ledger',{headers})).json()).fills.length,1);
 }finally{await s.stop()}
});
test('failed login revokes an old cookie, successful identity changes also revoke the previous session',async()=>{
 const s=await startTestServer();try{
  const login=await post(s,'/api/session',{token:'test-only-operator-token'});
  const res=await fetch(s.url+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'test-only-operator-token'})});const cookie=res.headers.get('Set-Cookie').split(';')[0];
  const bad=await fetch(s.url+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({token:'wrong-token-here'})});assert.equal(bad.status,401);assert.equal((await fetch(s.url+'/api/accounts',{headers:{Cookie:cookie}})).status,401);
  const old=await fetch(s.url+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'test-only-operator-token'})});const oldCookie=old.headers.get('Set-Cookie').split(';')[0];
  const changed=await fetch(s.url+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',Cookie:oldCookie},body:JSON.stringify({token:'test-only-other-token'})});assert.equal(changed.status,200);assert.equal((await fetch(s.url+'/api/accounts',{headers:{Cookie:oldCookie}})).status,401);
 }finally{await s.stop()}
});
test('worker can protect priced positions while unpriced legacy exposure prevents pending fills',async()=>{
 const s=await startTestServer();try{
  await fetch(s.url+'/api/accounts',{headers});seedLegacy(s);
  const db=new DatabaseSync(s.dir+'/state.sqlite');try{const accounts=JSON.parse(db.prepare("SELECT json FROM state WHERE name='accounts'").get().json);accounts[0].orders=[{id:'crossed-eur',symbol:'EURUSD',side:'BUY LIMIT',lots:0.01,entryPrice:1.086,stopLoss:1.08,takeProfit:1.1,riskDollars:6,reservedMargin:6,expiresAt:Date.now()+86400000}];db.prepare("UPDATE state SET json=? WHERE name='accounts'").run(JSON.stringify(accounts))}finally{db.close()}
  await new Promise(resolve=>setTimeout(resolve,5500));
  const accounts=(await(await fetch(s.url+'/api/accounts',{headers})).json()).accounts;const a=accounts.find(a=>a.id==='acc_paper_sandbox_01');
  assert.equal(a.positions.length,2);assert.equal(a.orders.length,1);assert.equal(a.pricingStatus,'DEGRADED');assert.ok(a.pricingBlockedSymbols.includes('XAUUSD'));assert.equal(a.positions.find(p=>p.symbol==='EURUSD').pricingStatus,'CURRENT');
 }finally{await s.stop()}
});
