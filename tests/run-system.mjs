import {spawn} from 'node:child_process';
import {startPackaged} from './release-runtime.mjs';
// Every legacy assertion is retained byte-for-byte in system-checks.js.
// Tests run the actual current package, with disposable loopback-only paper state.
const s=await startPackaged({hosted:false,local:true});
try {
 const code=await new Promise((resolve,reject)=>{
  const p=spawn(process.execPath,['tests/system-checks.js'],{env:{...process.env,TEST_URL:s.url,THN_TEST_RUNNER:'1'},stdio:'inherit'});
  p.once('error',reject);p.once('exit',resolve);
 });process.exitCode=code??1;
}finally {await s.stop();}
