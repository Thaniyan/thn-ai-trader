import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {DatabaseSync} from 'node:sqlite';
import {allowRequest,mapConcurrent} from '../server/limits.js';
import {startTestServer} from './harness.mjs';
const headers={'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'};
const post=async(s,path,body)=>{const r=await fetch(s.url+path,{method:'POST',headers,body:JSON.stringify(body)});return {status:r.status,...await r.json()}};
test('bounded concurrency preserves input order and rate windows reset',async()=>{
  let active=0,peak=0;const result=await mapConcurrent([1,2,3,4,5,6],async x=>{active++;peak=Math.max(peak,active);await delay(5);active--;return x*2},3);assert.equal(peak,3);assert.deepEqual(result,[2,4,6,8,10,12]);
  for(let i=0;i<3;i++)assert.equal(allowRequest('unit','limited',3,1000),true);assert.equal(allowRequest('unit','limited',3,1000),false);assert.equal(allowRequest('unit','limited',3,62000),true);
});
test('storage write failure rolls back account, ledger and idempotency atomically',async()=>{
  const s=await startTestServer();let db;try{
    await fetch(s.url+'/api/accounts',{headers});db=new DatabaseSync(s.dir+'/state.sqlite');
    db.exec(`CREATE TRIGGER fail_account BEFORE UPDATE ON state WHEN NEW.name='accounts' BEGIN SELECT RAISE(ABORT,'Controlled persistence failure'); END;`);
    const result=await post(s,'/api/orders/execute',{accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.1,stopLoss:1.08,takeProfit:1.095,idempotencyKey:'persist-failure'});assert.equal(result.status,500);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM idempotency').get().n,0);assert.equal(JSON.parse(db.prepare("SELECT json FROM state WHERE name='accounts'").get().json)[0].positions.length,0);
    db.exec('DROP TRIGGER fail_account');
    const good=await post(s,'/api/orders/execute',{accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.1,stopLoss:1.08,takeProfit:1.095,idempotencyKey:'persist-failure'});assert.equal(good.status,200);
    assert.throws(()=>db.exec('DELETE FROM audit'),/Append-only/);
  }finally{db?.close();await s.stop()}
});
test('simultaneous partial-close retries settle once; pending orders reserve and release margin',async()=>{
  const s=await startTestServer();try{
    const fill=await post(s,'/api/orders/execute',{accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.2,stopLoss:1.08,takeProfit:1.095,idempotencyKey:'open'});
    const payload={accountId:'acc_paper_sandbox_01',ticket:fill.orderResult.ticket,volumeRatio:0.5,idempotencyKey:'close-once'};
    const results=await Promise.all([post(s,'/api/positions/close',payload),post(s,'/api/positions/close',payload)]);assert.ok(results.every(r=>r.status===200));
    const ledger=await (await fetch(s.url+'/api/ledger',{headers})).json();assert.equal(ledger.fills.length,1);
    const pending=await post(s,'/api/orders/execute',{accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY LIMIT',entryPrice:1.0845,lots:0.1,stopLoss:1.08,takeProfit:1.095,idempotencyKey:'pending'});
    assert.ok(pending.account.freeMargin<results[0].account.freeMargin);
    const canceled=await post(s,'/api/orders/cancel',{accountId:'acc_paper_sandbox_01',orderId:pending.account.orders[0].id});assert.equal(canceled.status,200);assert.equal(canceled.account.orders.length,0);
  }finally{await s.stop()}
});
test('unknown APIs, malformed JSON, cross-owner risk preview and oversized watchlists fail honestly',async()=>{
  const s=await startTestServer();try{
    assert.equal((await fetch(s.url+'/api/does-not-exist')).status,404);
    const batch=await (await fetch(s.url+'/api/quotes?symbols=EURUSD,ETHUSD')).json();assert.equal(batch.quotes.ETHUSD.symbol,'ETHUSD');
    assert.equal((await fetch(s.url+'/api/analyze',{method:'POST',headers,body:'null'})).status,400);
    assert.equal((await post(s,'/api/accounts/connect',{broker:123})).status,400);
    assert.equal((await fetch(s.url+'/api/analyze',{method:'POST',headers,body:JSON.stringify({padding:'x'.repeat(1000001)})})).status,413);
    assert.equal((await post(s,'/api/watchlist/scan',{symbols:Array.from({length:31},(_,i)=>'SYM'+i)})).status,400);
    assert.equal((await fetch(s.url+'/api/risk/calculate',{method:'POST',headers:{...headers,Authorization:'Bearer test-only-other-token'},body:JSON.stringify({symbol:'EURUSD',lots:0.1,stopLoss:1.08,takeProfit:1.095})})).status,403);
  }finally{await s.stop()}
});

test('legacy audit history migrates once and recursively redacts credential fields',async()=>{let s=await startTestServer({THN_TEST_LEGACY_AUDIT:"1"});try{let events=(await(await fetch(s.url+"/api/audit-logs",{headers})).json()).events;assert.equal(events.filter(e=>e.id==="legacy-event").length,1);assert.deepEqual(events[0].details.nested,{message:"preserved"});const dir=s.dir;await s.stop(true);s=await startTestServer({},dir);events=(await(await fetch(s.url+"/api/audit-logs",{headers})).json()).events;assert.equal(events.filter(e=>e.id==="legacy-event").length,1)}finally{await s.stop()}});
