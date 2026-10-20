import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
export async function startPackaged({hosted=true,local=false}={}) {
  const dir=await mkdtemp(path.join(tmpdir(),'thn-v7-package-'));
  const child=spawn(process.execPath,['--import','./tests/provider-fixture.js','tests/packaged-launch.mjs'],{
    env:{...process.env,VERCEL:hosted?'1':'',THN_LOCAL_PAPER:local?'1':'0',THN_DATA_DIR:dir,THN_AI_ENABLED:'0'},stdio:['ignore','pipe','pipe']});
  let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
  const stop=async()=>{child.kill();if(child.exitCode===null&&child.signalCode===null)await new Promise(r=>child.once('exit',r));await rm(dir,{recursive:true,force:true});};
  try {
    const url=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Packaged startup timeout: '+logs)),10000);
      child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(Error('Packaged startup exited '+code+': '+logs));});
      child.stdout.on('data',()=>{const m=logs.match(/THN_TEST_PORT=(\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});
    });return {url,dir,stop};
  }catch(error){await stop();throw error;}
}
