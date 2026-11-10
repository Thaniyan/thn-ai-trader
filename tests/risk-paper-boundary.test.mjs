import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startPackaged} from './release-runtime.mjs';
import {calculateRequiredMargin} from '../server/riskEngine.js';
const draft={symbol:'EURUSD',side:'BUY',lots:.1,entryPrice:1.1,stopLoss:1.08,takeProfit:1.12};
async function post(url,path,body){const response=await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,data:await response.json()};}
test('200/2000 preview leverage cannot mutate account leverage or bind a paper fill to hypothetical entry',async()=>{
 const r=await startPackaged({hosted:false,local:true,fixture:'./tests/risk-provider-fixture.js'});
 try{
  const accounts=()=>fetch(r.url+'/api/broker/accounts').then(r=>r.json()).then(d=>d.accounts);
  const before=(await accounts())[0];assert.equal(before.leverage,200);assert.equal(before.positions.length,0);
  for(const leverage of [200,2000]){
   const result=await post(r.url,'/api/risk/calculate',{...draft,leverage});assert.equal(result.status,200);assert.equal(result.data.assumptions.leverage,leverage);assert.equal(result.data.executionApproval,false);assert.equal(result.data.metrics.requiredMargin,leverage===200?55:5.5);
   assert.deepEqual((await accounts())[0],before,'a hypothetical preview changes no account state');
  }
  // Even extra client price/leverage fields cannot override the authoritative order path.
  const placed=await post(r.url,'/api/orders/execute',{...draft,currentPrice:1.1,leverage:2000,accountId:before.id,idempotencyKey:'m3-review-provider-boundary'});
  assert.equal(placed.status,200,JSON.stringify(placed.data));const order=placed.data.orderResult;
  assert.notEqual(order.executedPrice,draft.entryPrice);assert.equal(order.position.entryPrice,order.executedPrice);
  assert.equal(order.requiredMargin,calculateRequiredMargin({symbol:draft.symbol,lots:draft.lots,price:order.executedPrice,leverage:before.leverage}));
  assert.notEqual(order.requiredMargin,calculateRequiredMargin({symbol:draft.symbol,lots:draft.lots,price:order.executedPrice,leverage:2000}));
  const after=(await accounts())[0];assert.equal(after.leverage,200);assert.equal(after.positions.length,1);
 }finally{await r.stop();}
});
test('missing, blank and null draft prices/leverage cannot produce an estimate or account mutation',async()=>{
 const r=await startPackaged({hosted:false,local:true});
 try{
  const before=await fetch(r.url+'/api/broker/accounts').then(r=>r.json());
  for(const field of ['entryPrice','leverage','takeProfit','lots'])for(const value of ['',null,undefined]){
   const result=await post(r.url,'/api/risk/calculate',{...draft,leverage:200,[field]:value});assert.equal(result.status,400);assert.equal(result.data.ok,false);assert.equal(result.data.executionApproval,false);assert.ok(result.data.messages.en&&result.data.messages.ar);
  }
  assert.deepEqual(await fetch(r.url+'/api/broker/accounts').then(r=>r.json()),before);
 }finally{await r.stop();}
});
test('successful hosted preview never unlocks hosted paper execution',async()=>{
 const r=await startPackaged({hosted:true,local:true});
 try{
  assert.equal((await post(r.url,'/api/risk/calculate',{...draft,leverage:2000})).status,200);
  const denied=await post(r.url,'/api/orders/execute',{...draft,accountId:'acc_paper_sandbox_01',idempotencyKey:'hosted-must-stay-denied'});assert.equal(denied.status,503);assert.equal(denied.data.code,'LOCAL_PAPER_ONLY');
 }finally{await r.stop();}
});
test('a valid hypothetical preview cannot approve stop geometry that is invalid at the provider paper price',async()=>{
 const r=await startPackaged({hosted:false,local:true,fixture:'./tests/risk-provider-fixture.js'});
 try{
  const accounts=()=>fetch(r.url+'/api/broker/accounts').then(r=>r.json());const before=await accounts();
  const input={...draft,stopLoss:1.09,leverage:2000};const preview=await post(r.url,'/api/risk/calculate',input);assert.equal(preview.status,200);assert.equal(preview.data.executionApproval,false);
  const order=await post(r.url,'/api/orders/execute',{...input,accountId:before.accounts[0].id,idempotencyKey:'hypothetical-entry-is-not-paper-price'});assert.equal(order.status,400);assert.equal(order.data.code,'INVALID_STOP_LOSS');assert.deepEqual(await accounts(),before);
 }finally{await r.stop();}
});
