import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startTestServer} from './harness.mjs';
const payload={accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.1,stopLoss:1.08,takeProfit:1.095,idempotencyKey:'same'};
const call=async(server,body)=>{const res=await fetch(server.url+'/api/orders/execute',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'},body:JSON.stringify(body)});return {status:res.status,data:await res.json()}};
test('concurrent idempotency and independent orders preserve all state; restart replays durably',async()=>{
  let server=await startTestServer();
  try{
    const same=await Promise.all(Array.from({length:10},()=>call(server,payload)));
    assert.ok(same.every(r=>r.status===200));assert.equal(new Set(same.map(r=>r.data.orderResult.ticket)).size,1);
    const distinct=await Promise.all(Array.from({length:10},(_,i)=>call(server,{...payload,idempotencyKey:'different-'+i})));
    assert.ok(distinct.every(r=>r.status===200));
    const account=await (await fetch(server.url+'/api/accounts',{headers:{Authorization:'Bearer test-only-operator-token'}})).json();
    assert.equal(account.accounts[0].positions.length,11);assert.equal(account.accounts[0].todayTradesCount,11);
    assert.ok(Math.abs(account.accounts[0].usedMargin-account.accounts[0].positions.reduce((sum,p)=>sum+p.margin,0))<0.02);
    assert.equal((await call(server,{...payload,lots:0.2})).status,409);
    const dir=server.dir;await server.stop(true);server=await startTestServer({},dir);
    const replay=await call(server,payload);assert.equal(replay.data.orderResult.ticket,same[0].data.orderResult.ticket);
  }finally{await server.stop()}
});
