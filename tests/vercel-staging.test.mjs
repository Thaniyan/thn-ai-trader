import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import http from 'node:http';
import {backendOrigin,csp,config} from '../deployment/vercel-staging/policy.mjs';import {serveModel} from '../scripts/vercel-staging/serve-model.mjs';import {startTestServer} from './harness.mjs';
const root=process.cwd(),build=(out,backend)=>spawnSync(process.execPath,['deployment/vercel-staging/build.mjs','--output',out,...(backend?['--backend',backend]:[])],{cwd:root,encoding:'utf8'});
async function artifact(){const temp=await fs.mkdtemp(path.join(os.tmpdir(),'thn-vercel-staging-')),out=path.join(temp,'frontend');assert.equal(build(out,'https://staging-backend.qa.example.com').status,0);return {temp,out}}
test('static artifact builds offline/connected, has no functions/state, rejects unsafe destinations and detects tampering',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'thn-vercel-build-'));
 try{
  for(const mode of ['offline','connected']){
   const out=path.join(temp,mode);const result=build(out,mode==='connected'?'https://staging-backend.qa.example.com':undefined);assert.equal(result.status,0,result.stderr);
   const verified=spawnSync(process.execPath,['verify-build.mjs'],{cwd:out,encoding:'utf8',env:{...process.env,THN_LOCAL_BUILD_TEST:'1'}});assert.equal(verified.status,0,verified.stderr);
   const cfg=JSON.parse(await fs.readFile(path.join(out,'vercel.json')));assert.equal(cfg.git.deploymentEnabled,false);assert.deepEqual(config(null),JSON.parse(await fs.readFile('deployment/vercel-staging/vercel.template.json')));assert.equal(cfg.functions,undefined);assert.equal(cfg.outputDirectory,'public');assert.ok(cfg.headers[0].headers.some(h=>h.key==='Content-Security-Policy'&&h.value===csp));assert.ok(cfg.headers[1].headers.every(h=>/no-store/.test(h.value)));
   assert.doesNotMatch(JSON.stringify(cfg),/\.invalid|thn-ai-trader\.vercel\.app/);
   const html=await fs.readFile(path.join(out,'public/index.html'),'utf8');assert.ok(html.includes('<template id="stagingWorkstationTemplate">'));assert.ok(!html.includes('<script src="app.js"'));
   await fs.appendFile(path.join(out,'public/app.js'),'\n// tampered fixture');assert.notEqual(spawnSync(process.execPath,['verify-build.mjs'],{cwd:out,env:{...process.env,THN_LOCAL_BUILD_TEST:'1'}}).status,0);
  }
  for(const url of ['https://backend.example.invalid','https://thn-ai-trader.vercel.app','http://staging-backend.qa.example.com','https://user:password@staging-backend.qa.example.com','https://staging-backend.qa.example.com/api','https://staging-backend.qa.example.com?token=x','https://staging-backend.foo.vercel.app'])assert.throws(()=>backendOrigin(url));
  const original=await fs.readFile('server.js','utf8');assert.ok(original.includes(csp),'CSP drift from application');
 }finally{await fs.rm(temp,{recursive:true,force:true})}
});
test('unconfigured route model returns honest unavailable metadata, no account/analysis objects, no cached API responses',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'thn-vercel-offline-'));let model;
 try{
  const out=path.join(temp,'frontend');assert.equal(build(out).status,0);model=await serveModel({artifact:out});
  for(const route of ['/api','/api/health','/api/accounts','/api/quotes','/api/analyze']){const res=await fetch(model.url+route);const data=await res.json();assert.equal(data.ok,false);assert.equal(data.code,'STAGING_BACKEND_UNCONFIGURED');assert.equal(data.liveExecutionEnabled,false);assert.equal(data.accounts,undefined);assert.equal(data.quotes,undefined);assert.match(res.headers.get('cache-control'),/no-store/);assert.match(res.headers.get('vercel-cdn-cache-control'),/no-store/)}
  assert.equal((await fetch(model.url+'/api/session',{method:'POST',body:'{}'})).status,405);
  for(const asset of ['/','/style.css','/app.js','/boot.js','/logo.svg'])assert.equal((await fetch(model.url+asset)).status,200);
  assert.equal((await fetch(model.url+'/server.js')).status,404);
 }finally{if(model)await model.stop();await fs.rm(temp,{recursive:true,force:true})}
});
test('persistent backend proxy model preserves independent gate, Origin, secure host-only cookies, ownership, logout and no-cache',async()=>{
 const {temp,out}=await artifact();let backend,gate,model;
 const origin='https://thn-ai-trader-staging-review-owner.vercel.app',basic='Basic '+Buffer.from('fixture-owner:fixture-only-gate-password').toString('base64');
 try{
  backend=await startTestServer({THN_PUBLIC_ORIGIN:origin,NODE_OPTIONS:'--import='+new URL('../deployment/vercel-staging/backend-preload.mjs',import.meta.url).href});
  gate=http.createServer((req,res)=>{if(req.headers.authorization!==basic){res.writeHead(401,{'WWW-Authenticate':'Basic realm="staging-fixture"','Cache-Control':'no-store'});res.end();return}const p=http.request(new URL(req.url,backend.url),{method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});p.on('error',()=>{res.writeHead(502);res.end()});req.pipe(p)});await new Promise(r=>gate.listen(0,'127.0.0.1',r));
  model=await serveModel({artifact:out,upstream:`http://127.0.0.1:${gate.address().port}`});
  assert.equal((await fetch(model.url+'/api/health')).status,401);
  const contract=await(await fetch(model.url+'/api/staging-contract',{headers:{Authorization:basic}})).json();assert.equal(contract.frontendOrigin,origin);assert.equal(contract.backend,'persistent-node-sqlite');assert.equal(contract.liveExecutionEnabled,false);
  const login=async(token,source=origin)=>fetch(model.url+'/api/session',{method:'POST',headers:{Authorization:basic,Origin:source,'Content-Type':'application/json'},body:JSON.stringify({token})});
  assert.equal((await login('test-only-operator-token','https://evil.invalid')).status,403);
  const response=await login('test-only-operator-token');assert.equal(response.status,200);const setCookie=response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Strict/);assert.match(setCookie,/Secure/);assert.doesNotMatch(setCookie,/Domain=/);assert.match(setCookie,/Path=\//);assert.match(response.headers.get('cache-control'),/no-store/);
  const cookie=setCookie.split(';')[0],headers={Authorization:basic,Cookie:cookie};const accounts=await(await fetch(model.url+'/api/accounts',{headers})).json();assert.ok(accounts.accounts.length>0);
  const other=await login('test-only-other-token');const otherCookie=other.headers.get('set-cookie').split(';')[0];assert.equal((await fetch(model.url+'/api/ledger?accountId='+accounts.accounts[0].id,{headers:{Authorization:basic,Cookie:otherCookie}})).status,403);
  assert.equal((await fetch(model.url+'/api/session',{method:'DELETE',headers:{...headers,Origin:origin}})).status,200);assert.equal((await fetch(model.url+'/api/accounts',{headers})).status,401);
 }finally{if(model)await model.stop();if(gate)await new Promise(r=>gate.close(r));if(backend)await backend.stop();await fs.rm(temp,{recursive:true,force:true})}
});
test('backend preflight rejects production origin, inherited identity, missing key and paid AI, accepts dedicated staging config',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thn-durable-staging-'));try{
  await fs.chmod(dir,0o700);const env={...process.env,THN_PUBLIC_ORIGIN:'https://thn-ai-trader-staging-review-owner.vercel.app',THN_DATA_DIR:dir,PORT:'3000',APP_ENCRYPTION_KEY:'a'.repeat(64),THN_AUTH_TOKEN:'',THN_AUTH_USERS:JSON.stringify([{id:'qa-a',token:'b'.repeat(64)},{id:'qa-b',token:'c'.repeat(64)}]),OPENAI_API_KEY:''};
  const run=extra=>spawnSync(process.execPath,['deployment/vercel-staging/backend-preflight.mjs'],{cwd:root,env:{...env,...extra}});
  assert.equal(run({}).status,0);for(const extra of [{THN_PUBLIC_ORIGIN:'https://thn-ai-trader.vercel.app'},{APP_ENCRYPTION_KEY:''},{THN_AUTH_TOKEN:'inherited-production-like-token'},{OPENAI_API_KEY:'fixture-only-paid-key'},{THN_AUTH_USERS:JSON.stringify([{id:'qa-a',token:'b'.repeat(64)},{id:'qa-b',token:'b'.repeat(64)}])}])assert.notEqual(run(extra).status,0);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
