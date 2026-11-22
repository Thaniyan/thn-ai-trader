import {validatedPilotSettings} from './intelligence-settings.js';
// One authorized real-source request; no synthetic pilot or model installation path.
import {parentPort,workerData} from 'node:worker_threads';
import {generateLocal,loopbackJSON} from './intelligence-local.js';
import {createInferenceDeadline} from './intelligence-timing.js';
import {classifyPilotFailure} from './intelligence-diagnostics.js';
const {snapshot,question,options,env,startedNs,policyMs}=workerData;
const clock=()=>Number(process.hrtime.bigint()-BigInt(startedNs))/1e6;
let approve,reject;
const permission=new Promise((a,b)=>{approve=a;reject=b;});
parentPort.on('message',m=>{if(m?.type==='budget')m.allowed?approve():reject(Error('Provider budget exhausted'));});
const settings=validatedPilotSettings(env);
const remaining=Math.floor(policyMs-clock());
try{
 if(remaining<1)throw Object.assign(Error('Deadline'),{code:'TIMEOUT'});
 const deadline=createInferenceDeadline({timeoutMs:remaining});
 try{
  const result=await generateLocal(env,snapshot,question,{...options,pilotCompact:settings.compactPilot,pilotThreads:settings.pilotThreads,pilotKeepAlive:settings.keepAlive,authorization:'Bearer '+env.THN_AI_AUTH_TOKEN,deadline,
   onRequest:units=>parentPort.postMessage({type:'reserve',units}),
   onModelCall:()=>parentPort.postMessage({type:'modelCall'}),
   transport:async(...args)=>{await deadline.run(()=>permission);return loopbackJSON(...args);}});
  parentPort.postMessage({type:'result',result});
 }finally{deadline.dispose();}
}catch(error){parentPort.postMessage({type:'failure',code:classifyPilotFailure(error)});}
finally{parentPort.close();}
