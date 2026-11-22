// Deterministic cancellation ordering; no runtime HTTP, weights or inference.
import {parentPort,workerData} from 'node:worker_threads';
import {validatedPilotSettings} from '../../server/intelligence-settings.js';
const responseReceived=workerData.options.model==='race:response';
parentPort.postMessage({type:'started',atNs:String(process.hrtime.bigint())});
parentPort.postMessage({type:'settings',phase:'request_prepared',settings:validatedPilotSettings(workerData.env)});
parentPort.postMessage({type:'stage',stage:'generation',state:'started',atMs:1});
parentPort.postMessage({type:'runtime',runtime:{responseReceived}});
// An abort settles the HTTP promise; that is not evidence of completed inference.
parentPort.postMessage({type:'stage',stage:'generation',state:'settled',atMs:2});
parentPort.postMessage({type:'stage',stage:'fallbackCleanup',state:'started',atMs:2});
parentPort.postMessage({type:'stage',stage:'fallbackCleanup',state:'settled',atMs:3});
if(workerData.options.model==='race:parent')await new Promise(()=>{setInterval(()=>parentPort.postMessage({type:'heartbeat',atNs:String(process.hrtime.bigint())}),40);});
parentPort.postMessage({type:'result',result:{model:workerData.options.model,financialExecution:false,accepted:false,fallback:true,failureCode:'TIMEOUT',matchedCitations:0,matchedClaims:0,runtime:{responseReceived},timings:{policyMs:100,elapsedMs:3,deadlineExceeded:true,stages:{generation:{state:'settled',elapsedMs:1,count:1}}}}});
