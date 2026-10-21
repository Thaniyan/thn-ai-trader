import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createPaperIntents,atomicPrivateJSON} from '../server/paper-intents.js';
const directory=()=>fs.mkdtempSync(path.join(os.tmpdir(),'thn-intents-'));
test('paper intent survives a lost response/restart and rejects a changed payload',()=>{
 const dir=directory();try{let store=createPaperIntents(dir);assert.deepEqual(store.reserve('a','stable-intent','fp'),{});store.complete('a','stable-intent',{ok:true,orderResult:{ticket:'PAPER-1'}});store=createPaperIntents(dir);assert.equal(store.check('a','stable-intent','fp').response.orderResult.ticket,'PAPER-1');assert.equal(store.check('a','stable-intent','changed').blocked,'IDEMPOTENCY_CONFLICT');assert.deepEqual(store.check('b','stable-intent','changed'),{});}finally{fs.rmSync(dir,{recursive:true});}
});
test('uncertain persisted intent blocks all new keys for its account across restart',()=>{
 const dir=directory();try{createPaperIntents(dir).reserve('a','old','fp');const store=createPaperIntents(dir);assert.equal(store.check('a','old','fp').blocked,'PAPER_RECOVERY_REQUIRED');assert.equal(store.reserve('a','fresh','samefp').blocked,'PAPER_RECOVERY_REQUIRED');assert.deepEqual(store.reserve('b','fresh','fp'),{});}finally{fs.rmSync(dir,{recursive:true});}
});
test('malformed journal and storage failure fail closed without trading',()=>{
 const dir=directory();try{fs.writeFileSync(path.join(dir,'paper_intents.json'),'{bad');assert.equal(createPaperIntents(dir).reserve('a','k','fp').blocked,'PAPER_RECOVERY_REQUIRED');assert.equal(createPaperIntents(path.join(dir,'missing')).reserve('a','k','fp').blocked,'PAPER_WRITER_RECOVERY_REQUIRED');}finally{fs.rmSync(dir,{recursive:true});}
});
test('private state replacement is complete JSON with restrictive permissions',()=>{const dir=directory();try{const f=path.join(dir,'state.json');atomicPrivateJSON(f,{first:true});atomicPrivateJSON(f,{second:true});assert.deepEqual(JSON.parse(fs.readFileSync(f)),{second:true});assert.equal(fs.statSync(f).mode&0o777,0o600);}finally{fs.rmSync(dir,{recursive:true});}});
test('preference refusal never prevents initialization and cannot impersonate successful writes',()=>{const events=[];const window={dispatchEvent:e=>events.push(e.type)};const source=fs.readFileSync('public/preferences.js','utf8');vm.runInNewContext(source,{window,Event:class{constructor(type){this.type=type;}},localStorage:{getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}}});assert.equal(window.THNPreferences.getItem('theme'),null);assert.equal(window.THNPreferences.setItem('theme','light'),false);assert.equal(window.THNPreferences.removeItem('theme'),false);assert.equal(window.THNPreferences.unavailable(),true);assert.equal(events.length,3);});

test('HTTP lost response retry remains one position after process restart',async()=>{
 const {spawn}=await import('node:child_process');const dir=directory();let child;
 async function start(){child=spawn(process.execPath,['--import','./tests/provider-fixture.js','tests/source-launch.mjs'],{env:{...process.env,VERCEL:'',THN_LOCAL_PAPER:'1',THN_DATA_DIR:dir,TEST_PROVIDER_MODE:'up'},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Startup timeout')),8000);child.once('error',reject);child.stdout.on('data',d=>{output+=d;const m=output.match(/THN_TEST_PORT=(\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});});}
 async function stop(){child.kill();if(child.exitCode===null&&child.signalCode===null)await new Promise(r=>child.once('exit',r));}
 const order={accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:.1,stopLoss:1.07,takeProfit:1.1,idempotencyKey:'logical-intent'};
 async function post(url,body){const r=await fetch(url+'/api/orders/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
 try{let url=await start();const first=await post(url,order);assert.equal(first.status,200,JSON.stringify(first.data));await stop();url=await start();const retry=await post(url,order);assert.equal(retry.status,200);assert.equal(retry.data.orderResult.ticket,first.data.orderResult.ticket);const accounts=await fetch(url+'/api/accounts').then(r=>r.json());assert.equal(accounts.accounts[0].positions.length,1);assert.equal((await post(url,{...order,lots:.2})).data.code,'IDEMPOTENCY_CONFLICT');}
 finally{if(child&&child.exitCode===null&&child.signalCode===null)await stop();fs.rmSync(dir,{recursive:true,force:true});}
});
test('another local process cannot reserve against the same private paper directory',async()=>{
 const {spawnSync}=await import('node:child_process');const dir=directory();try{assert.deepEqual(createPaperIntents(dir).reserve('a','one','fp'),{});const source=`import {createPaperIntents} from './server/paper-intents.js';console.log(JSON.stringify(createPaperIntents(${JSON.stringify(dir)}).reserve('other-account','two','fp')))`;const r=spawnSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).blocked,'PAPER_WRITER_RECOVERY_REQUIRED');}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('an orphaned exclusive-writer marker requires recovery, never automatic deletion',()=>{const dir=directory();try{const file=path.join(dir,'paper-writer.lock');fs.writeFileSync(file,'retained orphan marker');assert.equal(createPaperIntents(dir).reserve('a','fresh','fp').blocked,'PAPER_WRITER_RECOVERY_REQUIRED');assert.equal(fs.readFileSync(file,'utf8'),'retained orphan marker');}finally{fs.rmSync(dir,{recursive:true,force:true});}});
