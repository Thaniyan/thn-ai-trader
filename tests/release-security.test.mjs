import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {startPackaged} from './release-runtime.mjs';
test('packaged runtime contains all v7 assets and only declared source',()=>{
 const root='.vercel/output/functions/index.func/';
 const manifest=JSON.parse(fs.readFileSync('.vercel/output/runtime-manifest.json'));
 for(const f of manifest){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+f.path)).digest('hex'),f.sha256);assert.doesNotMatch(f.path,/(?:tests\/|\.env|\.runtime|\.sqlite|audit_log|trading_accounts|metadata\.json|AUDIT_REPORT)/);}
 for(const f of ['server/intelligence.js','server/intelligence-provider.js','public/intelligence-workspace.js','public/intelligence-memory.js','public/intelligence.css','public/research-library.js','public/platform-evolution.js','public/platform-evolution.css'])assert.ok(manifest.some(v=>v.path===f),f);
 assert.equal(JSON.parse(fs.readFileSync(root+'.vc-config.json')).runtime,'nodejs24.x');
 assert.equal(JSON.parse(fs.readFileSync(root+'.vc-config.json')).shouldAddHelpers,false);
 const output='.vercel/output/';
 const artifact=JSON.parse(fs.readFileSync(output+'artifact-manifest.json'));
 const inventory=[];
 function walk(dir){for(const item of fs.readdirSync(output+dir,{withFileTypes:true})){const file=dir+item.name;if(item.isDirectory())walk(file+'/');else if(file!=='artifact-manifest.json')inventory.push(file);}}
 walk('');assert.deepEqual(artifact.map(f=>f.path).sort(),inventory.sort());
 for(const file of artifact)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(output+file.path)).digest('hex'),file.sha256);
});
test('hosted package starts without credentials and rejects all financial mutations despite local opt-in',async()=>{
 const s=await startPackaged({local:true});try {
  const h=await(await fetch(s.url+'/api/health')).json();assert.equal(h.version,JSON.parse(fs.readFileSync('package.json')).version);assert.equal(h.capabilities.paperExecution,false);assert.equal(h.capabilities.liveTrading,false);assert.equal(h.openaiEnabled,false);
  assert.equal((await(await fetch(s.url+'/api/intelligence/provider')).json()).available,false);
  const a=await(await fetch(s.url+'/api/accounts')).json();assert.deepEqual(a.accounts,[]);assert.equal(a.available,false);
  for(const route of ['/api/orders/execute','/api/positions/close','/api/broker/connect-account','/api/broker/reset-sandbox','/api/broker/reconcile'])assert.equal((await fetch(s.url+route,{method:'POST',body:'{}'})).status,503,route);
  assert.equal((await fetch(s.url+'/api/audit-logs')).status,503);
  for(const asset of ['/','/intelligence-workspace.js','/intelligence-memory.js','/intelligence.css','/research-library.js']){const r=await fetch(s.url+asset);assert.equal(r.status,200);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.ok((await r.text()).length>100);}
  assert.equal((await fetch(s.url+'/api/intelligence',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
  assert.equal((await fetch(s.url+'/api/intelligence',{method:'POST',body:'x'.repeat(17000)})).status,413);
  assert.equal((await fetch(s.url+'/api/intelligence',{method:'POST',headers:{Origin:'https://attacker.invalid'},body:'{}'})).status,403);
  for(const route of ['/.env','/server.js','/trading_accounts.json','/%2e%2e/server.js'])assert.match(await(await fetch(s.url+route)).text(),/<!doctype html>/i);
  assert.deepEqual(fs.readdirSync(s.dir),[]);
 }finally {await s.stop();}
});
