import fs from 'node:fs';
import path from 'node:path';
const dir=process.env.THN_DATA_DIR;
if(!dir||!process.argv.includes('--service-stopped'))throw Error('Set THN_DATA_DIR and confirm the service/supervisor is stopped with --service-stopped');
// Run only in the same PID namespace as the application, with exclusive operator access.
const lock=path.join(dir,'.writer.lock');
const original=fs.readFileSync(lock,'utf8');
const pid=Number(original);
if(!Number.isSafeInteger(pid)||pid<1)throw Error('Malformed lock; requires manual investigation');
try{process.kill(pid,0);throw Error('Recorded writer is still running; refusing recovery')}catch(error){if(error.code!=='ESRCH')throw error}
if(fs.readFileSync(lock,'utf8')!==original)throw Error('Lock changed; refusing recovery');
fs.unlinkSync(lock);
console.log('Removed confirmed stale writer lock. Restart only one application instance.');
