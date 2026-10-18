import {mkdtemp,cp,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function startTestServer(extraEnv={},existingDir) {
  const dir=existingDir||await mkdtemp(path.join(tmpdir(),'thn-tests-'));
  if(!existingDir)for(const file of ['server.js','server','public','package.json']) await cp(path.join(root,file),path.join(dir,file),{recursive:true});
  if(!existingDir)await symlink(path.join(root,'node_modules'),path.join(dir,'node_modules'));
  const child=spawn(process.execPath,['--import',path.join(root,'tests/fixtures/providers.mjs'),'server.js'],{cwd:dir,env:{...process.env,PORT:'0',APP_ENCRYPTION_KEY:'test-only-vault-key',THN_AUTH_TOKEN:'test-only-operator-token',THN_AUTH_USERS:JSON.stringify([{id:'other',token:'test-only-other-token'}]),THN_DATA_DIR:dir,...extraEnv},stdio:['ignore','pipe','pipe']});
  let logs=''; child.stderr.on('data',chunk=>{logs+=chunk});
  const url=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Test server startup timeout: '+logs)),10000);
    child.stdout.on('data',chunk=>{logs+=chunk;const match=logs.match(/running on http:\/\/0\.0\.0\.0:(\d+)/);if(match){clearTimeout(timer);resolve('http://127.0.0.1:'+match[1])}});
    child.once('exit',code=>{clearTimeout(timer);reject(Error('Test server exited '+code+': '+logs))});
  });
  return {url,dir,child,logs:()=>logs, async stop(preserve=false){child.kill();await new Promise(resolve=>(child.exitCode!==null||child.signalCode!==null)?resolve():child.once('exit',resolve));if(!preserve)await rm(dir,{recursive:true,force:true})}};
}
