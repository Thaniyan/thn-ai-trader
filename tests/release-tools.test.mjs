import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,cp,mkdir,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {startTestServer} from './harness.mjs';
const root=process.cwd();
const run=(args)=>spawnSync('python',args,{cwd:root,maxBuffer:32*1024*1024});
test('release ZIP bytes are deterministic and offline verification rejects tampering and extra private files',async()=>{
 const dir=await mkdtemp('/tmp/thn-package-');try{
  for(const name of ['a','b']){const result=run(['deployment/local-staging/prepare-package.py',dir+'/'+name]);assert.equal(result.status,0,result.stderr.toString())}
  assert.deepEqual(await readFile(dir+'/a.zip'),await readFile(dir+'/b.zip'));
  const verify=()=>run(['deployment/local-staging/validate-package.py',dir+'/a']);assert.equal(verify().status,0);
  await writeFile(dir+'/a/.env','test-only-private-artifact');assert.notEqual(verify().status,0);await rm(dir+'/a/.env');
  await writeFile(dir+'/a/backend/server.js','tampered');assert.notEqual(verify().status,0);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('source transition is approval-gated, preserves existing positions/state, and rollback accepts a known interrupted mixture',async()=>{
 const dir=await mkdtemp('/tmp/thn-transition-');let server;
 try{
  const instance=dir+'/instance',candidate=dir+'/candidate';await mkdir(instance);
  // Portable source-only fixture: a fresh clone of the reconciled branch must
  // not require objects from the unrelated private staging Git root.
  await mkdir(instance+'/backend');
  for(const name of ['server.js','server','public','package.json','bun.lock','scripts','tests','deployment','docs'])await cp(path.join(root,name),path.join(instance,'backend',name),{recursive:true});
  await cp(instance+'/backend/deployment/local-staging',instance+'/local',{recursive:true});await cp(instance+'/backend/public',instance+'/frontend/public',{recursive:true});await cp(instance+'/backend/docs/local-windows-staging.md',instance+'/START-HERE.md');
  const crypto=await import('node:crypto'),hashes={};
  async function inventory(base,relative=''){
   for(const entry of await readdir(path.join(base,relative),{withFileTypes:true})){
    const name=path.posix.join(relative,entry.name);
    if(entry.isDirectory())await inventory(base,name);
    else{assert.ok(entry.isFile());hashes[name]=crypto.createHash('sha256').update(await readFile(path.join(base,name))).digest('hex')}
   }
  }
  await inventory(instance);
  const baseline='a'.repeat(40),manifest={commit:baseline,purpose:'LOCAL_ONLY_UNDEPLOYED',sha256:hashes};await writeFile(instance+'/manifest.json',JSON.stringify(manifest));
  // Only the disposable test tool gets this synthetic allowlist. The shipped
  // transition tool and its historical known-releases.json remain unchanged.
  const fixtureTool=path.join(dir,'fixture-tool');await mkdir(fixtureTool);
  await cp('deployment/local-staging/transition-release.py',fixtureTool+'/transition-release.py');
  await writeFile(fixtureTool+'/known-releases.json',JSON.stringify({[baseline]:hashes}));
  const transition=fixtureTool+'/transition-release.py';
  await cp(instance,candidate,{recursive:true});const incoming=structuredClone(manifest);incoming.commit='f'.repeat(40);
  await writeFile(candidate+'/backend/server.js',(await readFile(candidate+'/backend/server.js','utf8'))+'\n// test-only incoming fixture\n');incoming.sha256['backend/server.js']=crypto.createHash('sha256').update(await readFile(candidate+'/backend/server.js')).digest('hex');await writeFile(candidate+'/manifest.json',JSON.stringify(incoming));
  const data=instance+'/.local-staging/database/local-staging';await mkdir(data,{recursive:true,mode:0o700});
  server=await startTestServer({THN_DATA_DIR:data},instance+'/backend');
  await fetch(server.url+'/api/accounts',{headers:{Authorization:'Bearer test-only-operator-token'}});await server.stop(true);server=null;
  // Historical position fixture proves the transition does not assume an empty book or create a close.
  const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(data+'/state.sqlite');
  const accounts=JSON.parse(db.prepare("SELECT json FROM state WHERE name='accounts'").get().json);accounts[0].positions=[{ticket:'legacy',symbol:'XAUUSD',lots:0.01,entryPrice:2735}];db.prepare("UPDATE state SET json=? WHERE name='accounts'").run(JSON.stringify(accounts));db.close();
  const before=await readFile(data+'/state.sqlite');await writeFile(instance+'/.local-staging/credentials.json','test-only-credential-fixture');
  const args=[transition,'apply',instance,candidate,'--expected-sha',incoming.commit];
  assert.notEqual(run(args).status,0);assert.notEqual(run([...args,'--explicitly-approved']).status,0);
  assert.equal(run([...args,'--explicitly-approved','--acknowledge-open-positions']).status,0);
  assert.deepEqual(await readFile(data+'/state.sqlite'),before);assert.equal(await readFile(instance+'/.local-staging/credentials.json','utf8'),'test-only-credential-fixture');
  // Simulate interrupted per-file source copying before the new manifest became active.
  await writeFile(instance+'/manifest.json',JSON.stringify(manifest));
  const journal=JSON.parse(await readFile(instance+'/.release-code-previous/transition.json'));await writeFile(instance+'/backend/server.js.transition-'+journal.nonce,'partial test-only write');await writeFile(instance+'/.release-code-previous/transition.json.new','interrupted journal');
  // A stopped HTTPS service can leave accepted sockets in TIME_WAIT; active listeners must still refuse.
  const timeWait=spawnSync('python',['-c',"import socket; s=socket.socket(); s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1); s.bind(('127.0.0.1',3000)); s.listen(); c=socket.create_connection(('127.0.0.1',3000)); a,_=s.accept(); a.close(); c.recv(1); c.close(); s.close()"]);assert.equal(timeWait.status,0,timeWait.stderr.toString());
  const reverted=run([transition,'rollback',instance,candidate,'--expected-sha',incoming.commit,'--explicitly-approved','--acknowledge-open-positions']);assert.equal(reverted.status,0,reverted.stderr.toString());
  assert.deepEqual(await readFile(instance+'/backend/server.js'),await readFile(instance+'/.release-code-previous/backend/server.js'));assert.deepEqual(await readFile(data+'/state.sqlite'),before);
 }finally{if(server)await server.stop(true);await rm(dir,{recursive:true,force:true})}
});
