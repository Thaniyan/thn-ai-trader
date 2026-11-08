import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {startPackaged} from './release-runtime.mjs';

let runtime;
before(async()=>{runtime=await startPackaged({local:true});});
after(async()=>{await runtime?.stop();});
async function jsonResponse(path,{status,code,...options}) {
 const response=await fetch(runtime.url+path,options);
 assert.equal(response.status,status,path);
 assert.match(response.headers.get('content-type'),/^application\/json; charset=utf-8$/);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 const data=await response.json();assert.equal(data.ok,false);assert.equal(data.code,code);
 assert.ok(!JSON.stringify(data).includes('<!doctype'));assert.ok(!JSON.stringify(data).includes('node:'));
 return {response,data};
}

test('unknown API routes return JSON 404 for every supported request method, never the SPA',async()=>{
 for(const path of ['/api','/api/this-route-does-not-exist','/api/auth/me','/api/research/no-such-route','/api/broker/no-such-route','/%61pi/no-such-route'])
  for(const method of ['GET','POST','PUT','PATCH','DELETE','OPTIONS'])
   await jsonResponse(path,{method,headers:{Accept:'text/html'},status:404,code:'API_NOT_FOUND'});
});
test('known read-only APIs reject writes before body parsing or provider work',async()=>{
 for(const path of ['/api/health','/api/intelligence/provider','/api/research/brief','/api/research/catalog','/api/research/series','/api/research/mtf','/api/quotes','/api/market/quotes','/api/broker/paper-quotes','/api/accounts','/api/broker/accounts','/api/audit-logs','/api/market/EURUSD']) {
  const {response}=await jsonResponse(path,{method:'POST',body:'{broken',status:405,code:'METHOD_NOT_ALLOWED'});assert.equal(response.headers.get('allow'),'GET, OPTIONS');
 }
});
test('known command and calculation APIs cannot fall through to successful HTML on GET',async()=>{
 for(const path of ['/api/intelligence/saved','/api/intelligence/reflect','/api/intelligence/provider/check','/api/intelligence/conversation/delete','/api/intelligence','/api/research/replay','/api/research/plan','/api/research/evaluate','/api/research/backtest','/api/analyze','/api/watchlist/scan','/api/accounts/test-connection','/api/accounts/connect','/api/broker/connect-account','/api/broker/register-account','/api/broker/reconcile','/api/broker/reset-sandbox','/api/accounts/delete','/api/broker/delete-account','/api/orders/execute','/api/positions/close','/api/risk/calculate','/api/broker/ping','/api/broker/funds']) {
  const {response}=await jsonResponse(path,{status:405,code:'METHOD_NOT_ALLOWED'});assert.equal(response.headers.get('allow'),'POST, OPTIONS');
 }
});
test('missing assets, private files and static namespaces never become an HTML success',async()=>{
 for(const path of ['/missing-engine.js','/missing.css','/missing.svg','/missing.json','/.env','/server.js','/trading_accounts.json','/%2e%2e/server.js','/assets/missing','/images/missing','/fonts/missing','/static/missing','/missing.js?cache=1'])
  await jsonResponse(path,{headers:{Accept:'text/html'},status:404,code:'NOT_FOUND'});
 await jsonResponse('/no-extension',{headers:{Accept:'image/*'},status:404,code:'NOT_FOUND'});
});
test('homepage, hash navigation, document deep links and real modules remain usable',async()=>{
 for(const path of ['/','/index.html','/#dashboard','/#ai','/research/workspace']) {
  const r=await fetch(runtime.url+path,{headers:{Accept:'text/html'}});assert.equal(r.status,200,path);assert.match(r.headers.get('content-type'),/^text\/html/);assert.match(await r.text(),/<!doctype html>/i);
 }
 const js=await fetch(runtime.url+'/research-state.js');assert.equal(js.status,200);assert.match(js.headers.get('content-type'),/^text\/javascript/);assert.ok((await js.text()).includes('THNContext'));
});
test('HEAD returns status and MIME without a body; unsupported methods expose stable Allow',async()=>{
 for(const [path,status,type] of [['/',200,'text/html'],['/app.js',200,'text/javascript'],['/absent.js',404,'application/json'],['/api/health',405,'application/json']]) {
  const r=await fetch(runtime.url+path,{method:'HEAD'});assert.equal(r.status,status);assert.ok(r.headers.get('content-type').startsWith(type));assert.equal(await r.text(),'');
 }
 const {response}=await jsonResponse('/app.js',{method:'PUT',status:405,code:'METHOD_NOT_ALLOWED'});assert.equal(response.headers.get('allow'),'GET, HEAD, OPTIONS');
 assert.equal((await fetch(runtime.url+'/api/research/plan',{method:'OPTIONS'})).status,204);
});
test('malformed paths reject safely and do not crash the next request',async()=>{
 for(const path of ['/%E0%A4%A','/api/%E0%A4%A','/%00'])await jsonResponse(path,{status:400,code:'INVALID_PATH'});
 assert.equal((await fetch(runtime.url+'/api/health')).status,200);
});
test('valid APIs preserve JSON parsing, payload bounds and origin rejection',async()=>{
 await jsonResponse('/api/research/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken',status:400,code:'INVALID_JSON'});
 await jsonResponse('/api/research/replay',{method:'POST',body:'x'.repeat(1000001),status:413,code:'PAYLOAD_TOO_LARGE'});
 await jsonResponse('/api/research/replay',{method:'POST',headers:{Origin:'https://attacker.invalid'},body:'{}',status:403,code:'ORIGIN_REJECTED'});
});
test('hosted financial and model capabilities stay denied',async()=>{
 const health=await fetch(runtime.url+'/api/health').then(r=>r.json());assert.equal(health.capabilities.liveTrading,false);assert.equal(health.capabilities.paperExecution,false);
 for(const path of ['/api/orders/execute','/api/positions/close','/api/broker/reset-sandbox'])await jsonResponse(path,{method:'POST',body:'{}',status:503,code:'LOCAL_PAPER_ONLY'});
 const provider=await fetch(runtime.url+'/api/intelligence/provider').then(r=>r.json());assert.equal(provider.available,false);
 assert.equal((await fetch(runtime.url+'/api/intelligence',{method:'POST',body:JSON.stringify({symbol:'EURUSD',interval:'1h',mode:'llm',question:'Review'})})).status,503);
});

test('unexpected internal exceptions disclose no filesystem, stack or private diagnostic',async()=>{
 const failing=await startPackaged({fixture:'./tests/http-failure-fixture.mjs'});
 try {
  const r=await fetch(failing.url+'/error-contract-trigger.js');assert.equal(r.status,500);assert.match(r.headers.get('content-type'),/^application\/json/);
  assert.deepEqual(await r.json(),{ok:false,code:'REQUEST_FAILED',error:'Request could not be completed.'});
  assert.equal((await fetch(failing.url+'/api/health')).status,200);
 }finally {await failing.stop();}
});
