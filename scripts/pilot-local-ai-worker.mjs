import {parentPort,workerData} from 'node:worker_threads';
import {runPilot} from './pilot-local-ai.mjs';
const elapsed=()=>Number(process.hrtime.bigint()-BigInt(workerData.startedNs))/1e6;
parentPort.postMessage({type:'started',atNs:String(process.hrtime.bigint())});
const heartbeat=setInterval(()=>parentPort.postMessage({type:'heartbeat',atNs:String(process.hrtime.bigint())}),100);heartbeat.unref();
try{
 const remaining=Math.floor(workerData.policyMs-elapsed());
 if(remaining<1)throw Error('Startup exhausted budget');
 const result=await runPilot({...workerData.options,env:workerData.env,timeoutMs:remaining,
  onSettingsReport:report=>parentPort.postMessage({type:'settings',...report}),
  onStage:event=>parentPort.postMessage({type:'stage',...event}),onRuntimeReport:runtime=>parentPort.postMessage({type:'runtime',runtime}),onInventoryReport:inventory=>parentPort.postMessage({type:'inventory',inventory})});
 parentPort.postMessage({type:'result',result});
}catch{parentPort.postMessage({type:'error'});}finally{clearInterval(heartbeat);}
