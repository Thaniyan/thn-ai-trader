import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
const order={accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:.1,stopLoss:1.07,takeProfit:1.1,idempotencyKey:'fault-matrix-intent'};
async function start(directory){
 const child=spawn(process.execPath,['--import','./tests/paper-fault-preload.mjs','--import','./tests/provider-fixture.js','tests/source-launch.mjs'],{env:{...process.env,VERCEL:'',THN_LOCAL_PAPER:'1',THN_AI_ENABLED:'0',THN_DATA_DIR:directory,TEST_PROVIDER_MODE:'up'},stdio:['ignore','pipe','pipe','ipc']});let error='',output='';child.stderr.on('data',d=>error+=d);
 const url=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Fault fixture startup timeout: '+error)),8000);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',()=>{clearTimeout(timer);reject(Error('Fixture startup refused: '+error));});child.stdout.on('data',d=>{output+=d;const m=output.match(/THN_TEST_PORT=(\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});});
 return {child,url,error:()=>error,arm:fault=>new Promise(resolve=>{child.once('message',m=>{assert.equal(m.type,'armed');resolve();});child.send({type:'arm',fault});}),async stop(){if(child.exitCode===null&&child.signalCode===null){child.kill();await new Promise(r=>child.once('exit',r));}}};
}
async function post(s,key=order.idempotencyKey){try{const r=await fetch(s.url+'/api/orders/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...order,idempotencyKey:key}),signal:AbortSignal.timeout(5000)});return {status:r.status,data:await r.json()};}catch(e){return {status:null,error:e.name};}}
function read(directory,file){try{return JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));}catch{return null;}}
function snapshot(directory){const accounts=read(directory,'trading_accounts.json')||read(directory,'accounts.json'),intents=read(directory,'paper_intents.json'),audit=read(directory,'audit_log.json');return {positions:accounts?.find(a=>a.id===order.accountId)?.positions?.length||0,intent:intents?.[0]?.state||null,filledAudit:audit?.filter(e=>e.eventType==='ORDER_FILLED').length||0,writerMarker:fs.existsSync(path.join(directory,'paper-writer.lock'))};}
const rows=[];
const scenarios=[
 ...['before','after'].flatMap(phase=>[
  {file:'paper_intents.json',operation:'rename',occurrence:1,phase,mode:'crash',boundary:'reserve'},
  {file:'trading_accounts.json',operation:'rename',phase,mode:'crash',boundary:'account'},
  {file:'audit_log.json',operation:'write',phase,mode:'crash',boundary:'audit'},
  {file:'paper_intents.json',operation:'rename',occurrence:2,phase,mode:'crash',boundary:'completion'}]),
 ...['ENOSPC','EACCES'].flatMap(mode=>[
  {file:'paper_intents.json.tmp',operation:'write',phase:'before',mode,boundary:'reserve'},
  {file:'trading_accounts.json.tmp',operation:'write',phase:'before',mode,boundary:'account'},
  {file:'audit_log.json',operation:'write',phase:'before',mode,boundary:'audit'},
  {file:'paper_intents.json.tmp',operation:'write',occurrence:2,phase:'before',mode,boundary:'completion'}]),
 ...['fsync','rename'].flatMap(operation=>[
  {file:operation==='fsync'?'paper_intents.json.tmp':'paper_intents.json',operation,phase:'before',mode:'EIO',boundary:'reserve'},
  {file:operation==='fsync'?'trading_accounts.json.tmp':'trading_accounts.json',operation,phase:'before',mode:'EIO',boundary:'account'},
  {file:operation==='fsync'?'paper_intents.json.tmp':'paper_intents.json',operation,occurrence:2,phase:'before',mode:'EIO',boundary:'completion'}]),
 {file:'paper_intents.json',operation:'fsync',phase:'before',mode:'EIO',boundary:'reserve-directory-fsync'}
];
for(const spec of scenarios)test('disposable fault evidence: '+JSON.stringify(spec),async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'thn-fault-matrix-'));let s,restart;
 try{
  s=await start(directory);await fetch(s.url+'/api/accounts');await s.arm(spec);const first=await post(s);
  if(spec.mode==='crash'&&s.child.signalCode===null)await new Promise(r=>s.child.once('exit',r));
  assert.match(s.error(),/THN_FAULT=/,'The requested fault must actually fire');const disk=snapshot(directory);assert.ok(disk.positions<=1);
  await s.stop();restart=await start(directory);const retry=await post(restart),fresh=retry.status===409?await post(restart,'new-key-after-fault'):{status:null,data:{code:'NOT_A_RETRY_AFTER_COMPLETED_INTENT'}};const final=snapshot(directory);
  assert.equal(final.positions,disk.positions+(spec.mode!=='crash'&&!disk.intent?1:0),'Retry creates one position only when failure preceded a durable reservation');
  if(spec.mode==='crash'){assert.equal(retry.status,409);assert.equal(fresh.status,409);assert.equal(disk.writerMarker,true);}
  else if(spec.boundary==='audit'){assert.equal(first.status,200,'Known audit-write failure is currently swallowed');assert.equal(disk.intent,'completed');assert.equal(disk.positions,1);assert.equal(disk.filledAudit,0);assert.equal(retry.status,200);/* A genuinely new key is a separate order: do not submit it in this case. */}
  else {assert.equal(first.data.ok,false);if(disk.intent){assert.equal(retry.status,409);assert.equal(fresh.status,409);}else{assert.equal(retry.status,200);assert.equal(final.positions,1);}}
  rows.push({fault:spec,firstStatus:first.status,disk,retryStatus:retry.status,retryCode:retry.data?.code||null,newKeyStatus:fresh.status,final,limitation:spec.boundary==='audit'&&spec.mode!=='crash'?'AUDIT_FAILURE_SWALLOWED':disk.positions!==Number(disk.intent==='completed')||disk.positions!==disk.filledAudit?'CROSS_FILE_DIVERGENCE':'NO_ATOMICITY_CLAIM'});
 }finally{await s?.stop();await restart?.stop();fs.rmSync(directory,{recursive:true,force:true});}
});
// A different key after a completed intent is a genuinely new order, not a retry.
test.after(()=>{if(process.env.FAULT_MATRIX_OUTPUT)fs.writeFileSync(process.env.FAULT_MATRIX_OUTPUT,JSON.stringify({scope:'Disposable local-paper fault injection; test evidence, not recovery semantics changes',scenarios:rows},null,2));});
for(const kind of ['corrupt-intent','corrupt-account','corrupt-audit','orphan-writer','mismatched-owner','concurrent-writer'])test('disposable recovery evidence: '+kind,async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'thn-corrupt-matrix-'));let seed,s,other;
 try{
  seed=await start(directory);await fetch(seed.url+'/api/accounts');await seed.stop();
  const names={'corrupt-intent':'paper_intents.json','corrupt-account':'trading_accounts.json','corrupt-audit':'audit_log.json','orphan-writer':'paper-writer.lock'};
  if(names[kind])fs.writeFileSync(path.join(directory,names[kind]),'{unreadable retained fixture');
  s=await start(directory);
  if(kind==='corrupt-account'){const result=await post(s);assert.equal(result.status,500);assert.equal(result.data.ok,false);assert.equal(fs.readFileSync(path.join(directory,names[kind]),'utf8'),'{unreadable retained fixture');rows.push({fault:{boundary:kind},status:result.status,originalPreserved:true,limitation:'CLIENT_SAFE_RECOVERY_MESSAGE_NOT_IMPLEMENTED_IN_MAIN'});return;}
  if(kind==='mismatched-owner'){assert.equal((await post(s)).status,200);fs.writeFileSync(path.join(directory,'paper-writer.lock'),'retained different owner');const blocked=await post(s,'new-key-owner-mismatch');assert.equal(blocked.status,409);assert.equal(blocked.data.code,'PAPER_WRITER_RECOVERY_REQUIRED');assert.equal(snapshot(directory).positions,1);assert.equal(fs.readFileSync(path.join(directory,'paper-writer.lock'),'utf8'),'retained different owner');rows.push({fault:{boundary:kind},status:blocked.status,code:blocked.data.code,disk:snapshot(directory),originalPreserved:true});return;}
  if(kind==='concurrent-writer'){assert.equal((await post(s)).status,200);other=await start(directory);const blocked=await post(other,'other-process-intent');assert.equal(blocked.status,409);assert.equal(blocked.data.code,'PAPER_WRITER_RECOVERY_REQUIRED');assert.equal(snapshot(directory).positions,1);rows.push({fault:{boundary:kind},status:blocked.status,code:blocked.data.code,disk:snapshot(directory)});return;}
  const result=await post(s),disk=snapshot(directory);
  if(kind==='corrupt-audit'){assert.equal(result.status,200);assert.equal(disk.positions,1);assert.equal(disk.filledAudit,1);rows.push({fault:{boundary:kind},status:result.status,disk,limitation:'CORRUPT_AUDIT_REPLACED_NOT_RECOVERED'});}
  else {assert.equal(result.status,409);assert.equal(disk.positions,0);assert.equal(fs.readFileSync(path.join(directory,names[kind]),'utf8'),'{unreadable retained fixture');rows.push({fault:{boundary:kind},status:result.status,code:result.data.code,disk,originalPreserved:true});}
 }finally{await seed?.stop();await s?.stop();await other?.stop();fs.rmSync(directory,{recursive:true,force:true});}
});
