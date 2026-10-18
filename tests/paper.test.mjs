import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {startTestServer} from './harness.mjs';
const headers={'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'};
const post=async(s,path,data)=>{const res=await fetch(s.url+path,{method:'POST',headers,body:JSON.stringify(data)});return {status:res.status,...await res.json()}};
const account=async s=>(await (await fetch(s.url+'/api/accounts',{headers})).json()).accounts[0];
test('API partial close preserves remainder and ignores a forged instrument',async()=>{
  const s=await startTestServer();try{
    const fill=await post(s,'/api/orders/execute',{accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.2,stopLoss:1.08,takeProfit:1.095,idempotencyKey:'open'});
    const result=await post(s,'/api/positions/close',{accountId:'acc_paper_sandbox_01',ticket:fill.orderResult.ticket,volumeRatio:0.5,symbol:'XAUUSD',idempotencyKey:'partial-close'});
    assert.equal(result.status,200);assert.equal(result.closeResult.isPartial,true);assert.equal(result.account.positions[0].lots,0.1);assert.ok(result.closeResult.exitPrice<2);
  }finally{await s.stop()}
});
test('pending limits wait for price crossing; server TP closes without any browser',async()=>{
  const s=await startTestServer();try{
    const pending=await post(s,'/api/orders/execute',{accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY LIMIT',entryPrice:1.0845,lots:0.1,stopLoss:1.08,takeProfit:1.095,idempotencyKey:'limit'});
    assert.equal(pending.orderResult.status,'PENDING');assert.equal(pending.account.positions.length,0);assert.equal(pending.account.orders.length,1);
    await writeFile(s.dir+'/test-price.json',JSON.stringify({'EURUSD=X':1.084}));
    let a;for(let i=0;i<15;i++){await delay(1000);a=await account(s);if(a.positions.length)break}
    assert.equal(a.positions.length,1);assert.equal(a.orders.length,0);assert.ok(a.positions[0].entryPrice<=1.0845);
    await writeFile(s.dir+'/test-price.json',JSON.stringify({'EURUSD=X':1.1}));
    for(let i=0;i<15;i++){await delay(1000);a=await account(s);if(!a.positions.length)break}
    assert.equal(a.positions.length,0);assert.ok(a.balance>50000);
    const ledger=await (await fetch(s.url+'/api/ledger',{headers})).json();assert.equal(ledger.fills.length,1);assert.equal(ledger.fills[0].reason,'SERVER_PROTECTION');
  }finally{await s.stop()}
});
