import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function evaluateAudit(report,status) {
  if(!report||typeof report!=='object'||Array.isArray(report))throw Error('Invalid audit response');
  const counts={critical:0,high:0,moderate:0,low:0,info:0};
  function visit(value) {
    if(!value||typeof value!=='object')return;
    if(typeof value.severity==='string') {
      if(!(value.severity in counts))throw Error('Unknown advisory severity');
      counts[value.severity]++;
    }
    for(const child of Object.values(value))if(child&&typeof child==='object')visit(child);
  }
  visit(report);
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  if(![0,1].includes(status)||(!total&&(status!==0||Object.keys(report).length)))throw Error('Audit unavailable or unrecognized response; fail closed');
  return {counts,blocking:counts.critical+counts.high>0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const result=spawnSync('bun',['audit','--json'],{encoding:'utf8',maxBuffer:8*1024*1024});
    if(result.error)throw result.error;
    const report=evaluateAudit(JSON.parse(result.stdout),result.status);
    console.log(JSON.stringify({policy:'Block high/critical; report lower severity; errors block',...report},null,2));
    // Public advisory metadata only, no environment/credentials or application state.
    if(Object.keys(JSON.parse(result.stdout)).length)console.log(result.stdout);
    if(report.blocking)process.exitCode=1;
  } catch {
    console.error('Dependency audit failed or returned unsupported data; investigate registry/tool access.');
    process.exitCode=1;
  }
}
