import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {startTestServer} from './harness.mjs';
let server;before(async()=>{server=await startTestServer()});after(async()=>server.stop());
const request=(path,body,token='test-only-operator-token',extra={})=>fetch(server.url+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
test('private APIs reject anonymous and wrong-owner requests',async()=>{
  for(const path of ['/api/accounts','/api/audit-logs','/api/ledger'])assert.equal((await request(path,undefined,null)).status,401);
  for(const path of ['/api/orders/execute','/api/positions/close','/api/broker/reset-sandbox','/api/broker/reconcile','/api/accounts/delete'])assert.equal((await request(path,{accountId:'acc_paper_sandbox_01'},'test-only-other-token')).status,403);
  assert.deepEqual((await (await request('/api/accounts',undefined,'test-only-other-token')).json()).accounts,[]);
});
test('cross-origin mutations and unknown broker are denied',async()=>{
  assert.equal((await request('/api/broker/reset-sandbox',{},undefined,{Origin:'https://attacker.invalid'})).status,403);
  assert.equal((await request('/api/broker/ping',{broker:'unknown'})).status,400);
  const ping=await (await request('/api/broker/ping',{broker:'exness'})).json();assert.equal(ping.ok,false);assert.equal(ping.latencyMs,null);
  assert.equal((await request('/api/accounts/connect',{broker:'exness',balance:99999})).status,403);
});
test('sessions use HttpOnly cookies and logout revokes them',async()=>{
  const login=await request('/api/session',{token:'test-only-operator-token'},null);
  const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
  assert.equal((await fetch(server.url+'/api/accounts',{headers:{Cookie:cookie.split(';')[0]}})).status,200);
  await fetch(server.url+'/api/session',{method:'DELETE',headers:{Cookie:cookie.split(';')[0]}});
  assert.equal((await fetch(server.url+'/api/accounts',{headers:{Cookie:cookie.split(';')[0]}})).status,401);
});
test('read-only paper account cannot execute, close or reset',async()=>{
  const data=await (await request('/api/accounts/connect',{broker:'paper',permissionLevel:'READ_ONLY'})).json();
  for(const path of ['/api/orders/execute','/api/positions/close'])assert.equal((await request(path,{accountId:data.account.id})).status,403);
  assert.notEqual((await request('/api/broker/reset-sandbox',{accountId:data.account.id})).status,200);
});
