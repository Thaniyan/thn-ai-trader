import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {setTimeout as delay} from 'node:timers/promises';
import {startTestServer} from './harness.mjs';
const headers={'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'};
test('paper funding rejects negatives and malformed values, preserves zero and custom equity',async()=>{
 const s=await startTestServer();try{for(const balance of [-1,'100','Infinity',null]){const r=await fetch(s.url+'/api/accounts/connect',{method:'POST',headers,body:JSON.stringify({broker:'paper',balance})});assert.equal(r.status,400)}
 for(const balance of [0,12345.67]){const r=await fetch(s.url+'/api/accounts/connect',{method:'POST',headers,body:JSON.stringify({broker:'paper',balance})});assert.equal(r.status,200);const {account}=await r.json();assert.equal(account.balance,balance);assert.equal(account.startingBalance,balance);assert.equal(account.equity,balance)}
 }finally{await s.stop()}
});
test('ledger cursor is bounded, ordered, owner-scoped and indexed; backup is consistent',async()=>{
 const s=await startTestServer();let db;try{await fetch(s.url+'/api/accounts',{headers});db=new DatabaseSync(path.join(s.dir,'state.sqlite'));const insert=db.prepare('INSERT INTO ledger VALUES (?,?,?)');for(let i=0;i<7;i++)insert.run('fill'+i,i%2?'foreign':'acc_paper_sandbox_01',JSON.stringify({id:'fill'+i}));
 const get=async q=>{const r=await fetch(s.url+'/api/ledger?'+q,{headers});return {status:r.status,...await r.json()}};
 const first=await get('limit=2');assert.deepEqual(first.fills.map(f=>f.id),['fill6','fill4']);const second=await get('limit=2&before='+first.nextCursor);assert.deepEqual(second.fills.map(f=>f.id),['fill2','fill0']);assert.equal(second.nextCursor,null);
 for(const q of ['limit=0','limit=501','limit=1.2','before=-1','before=NaN','accountId=foreign'])assert.ok((await get(q)).status>=400);
 assert.match(JSON.stringify(db.prepare("EXPLAIN QUERY PLAN SELECT rowid,json FROM ledger WHERE account_id=? AND rowid<? ORDER BY rowid DESC LIMIT 3").all('acc_paper_sandbox_01',100)),/ledger_account_idx/);
 const destination=path.join(s.dir,'snapshot.sqlite');const result=spawnSync(process.execPath,['scripts/backup-sqlite.mjs',destination],{env:{...process.env,THN_DATA_DIR:s.dir}});assert.equal(result.status,0,result.stderr.toString());assert.equal(fs.statSync(destination).mode&0o777,0o600);const copy=new DatabaseSync(destination,{readOnly:true});assert.equal(copy.prepare('SELECT COUNT(*) n FROM ledger').get().n,7);copy.close();
 }finally{db?.close();await s.stop()}
});
test('SIGTERM drains an accepted slow request, closes storage and releases writer lock',async()=>{
 const s=await startTestServer();try{const http=await import('node:http');
 const completed=new Promise((resolve,reject)=>{const req=http.request(s.url+'/api/accounts/connect',{method:'POST',headers:{...headers,'Content-Length':Buffer.byteLength('{"broker":"paper","balance":12345.67}')}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode))});req.on('error',reject);req.write('{"broker":"paper",');setTimeout(()=>req.end('"balance":12345.67}'),150);});
 await delay(50);s.child.kill('SIGTERM');assert.equal(await completed,200);await new Promise(resolve=>s.child.exitCode!==null?resolve():s.child.once('exit',resolve));assert.equal(s.child.exitCode,0);assert.equal(fs.existsSync(path.join(s.dir,'.writer.lock')),false);
 const restarted=await startTestServer({},s.dir);try{const accounts=(await(await fetch(restarted.url+'/api/accounts',{headers})).json()).accounts;assert.ok(accounts.some(a=>a.balance===12345.67))}finally{await restarted.stop(true)}
 }finally{await s.stop()}
});
test('lock recovery refuses live and malformed locks and recovers a dead writer',async()=>{
 const s=await startTestServer();try{const run=()=>spawnSync(process.execPath,['scripts/recover-writer-lock.mjs','--service-stopped'],{env:{...process.env,THN_DATA_DIR:s.dir}});assert.notEqual(run().status,0);
 s.child.kill('SIGKILL');await new Promise(resolve=>s.child.once('exit',resolve));assert.equal(fs.existsSync(path.join(s.dir,'.writer.lock')),true);assert.equal(run().status,0);
 fs.writeFileSync(path.join(s.dir,'.writer.lock'),'malformed');assert.notEqual(run().status,0);fs.unlinkSync(path.join(s.dir,'.writer.lock'));
 }finally{await s.stop()}
});
test('worker stop waits for active work and prevents later ticks',async()=>{
 const s=await startTestServer();try{const result=spawnSync(process.execPath,['--input-type=module','-e',`import assert from 'node:assert/strict';import {setTimeout as delay} from 'node:timers/promises';import {startPaperWorker} from './server/paperWorker.js';import {closeStorage} from './server/storage.js';let calls=0,finish;const worker=startPaperWorker({intervalMs:5,processAccounts:()=>{calls++;return new Promise(r=>finish=r)}});await delay(20);assert.equal(calls,1);let done=false;const stopping=worker.stop().then(()=>done=true);await delay(10);assert.equal(done,false);finish();await stopping;await delay(20);assert.equal(calls,1);await closeStorage();`],{env:{...process.env,THN_DATA_DIR:path.join(s.dir,'worker'),APP_ENCRYPTION_KEY:'test-only-vault-key'}});assert.equal(result.status,0,result.stderr.toString())}finally{await s.stop()}
});
test('deployment templates stay static, isolated and credential-free',()=>{
 const config=JSON.parse(fs.readFileSync('deployment/vercel.frontend.json.example','utf8'));assert.equal(config.outputDirectory,'public');assert.equal(config.rewrites[0].source,'/api/:path*');assert.ok(config.rewrites[0].destination.startsWith('https://'));
 assert.ok(config.headers.some(rule=>rule.headers.some(h=>h.key==='Content-Security-Policy')));assert.ok(config.headers.some(rule=>rule.headers.some(h=>h.key==='Cache-Control'&&h.value==='no-store')));
 const staging=fs.readFileSync('deployment/staging.env.example','utf8'),production=fs.readFileSync('deployment/production.env.example','utf8');for(const text of [staging,production])for(const key of ['THN_AUTH_TOKEN','THN_AUTH_USERS','APP_ENCRYPTION_KEY','OPENAI_API_KEY'])assert.ok(text.includes(key+'=\n'));
 assert.notEqual(staging.match(/THN_DATA_DIR=(.*)/)[1],production.match(/THN_DATA_DIR=(.*)/)[1]);assert.notEqual(staging.match(/THN_PUBLIC_ORIGIN=(.*)/)[1],production.match(/THN_PUBLIC_ORIGIN=(.*)/)[1]);
});
