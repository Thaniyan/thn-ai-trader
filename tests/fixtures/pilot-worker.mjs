import {parentPort,workerData} from 'node:worker_threads';
import {validatedPilotSettings} from '../../scripts/pilot-report.mjs';
const model=workerData.options.model;
parentPort.postMessage({type:'started',atNs:String(process.hrtime.bigint())});
if(model.startsWith('settings:')){
 const settings=validatedPilotSettings(workerData.env);
 if(!model.endsWith(':unconfirmed'))parentPort.postMessage({type:'settings',phase:'worker_validated',settings});
 if(model.endsWith(':prepared')){parentPort.postMessage({type:'settings',phase:'request_prepared',settings});parentPort.postMessage({type:'settings',phase:'worker_validated',settings});}
 if(model.endsWith(':mismatch'))parentPort.postMessage({type:'settings',phase:'request_prepared',settings:{...settings,pilotThreads:4,private:workerData.env.THN_AI_AUTH_TOKEN}});
 if(model.endsWith(':exit'))process.exit(1);
 if(model.endsWith(':error'))throw Error(workerData.env.THN_AI_AUTH_TOKEN);
 if(model.endsWith(':spin'))for(;;){/* test parent termination after settings acknowledgement */}
 await new Promise(()=>{setInterval(()=>parentPort.postMessage({type:'heartbeat',atNs:String(process.hrtime.bigint())}),10);});
}
if(model.endsWith(':spin')||model.endsWith(':hang')){parentPort.postMessage({type:'inventory',inventory:{model,digest:'a'.repeat(64),sizeBytes:1400000000,modelInspectionVerified:true,financialExecution:false}});parentPort.postMessage({type:'runtime',runtime:{requestBytes:1700,requestedUnits:2700,reservedUnits:2700,private:workerData.env.THN_AI_AUTH_TOKEN}});parentPort.postMessage({type:'stage',stage:'generation',state:'started',atMs:0});if(model.endsWith(':hang')){setInterval(()=>parentPort.postMessage({type:'heartbeat',atNs:String(process.hrtime.bigint())}),10);await new Promise(()=>{});}else for(;;){/* deliberate non-cooperative worker; parent must interrupt */}}
parentPort.postMessage({type:'result',result:{model,digest:'a'.repeat(64),sizeBytes:1400000000,modelInspectionVerified:true,accepted:true,financialExecution:false,failureCode:null,matchedCitations:1,matchedClaims:1,verifiedCitationIds:['frame-1h'],runtime:{reportedLoadMs:0,unexpected:workerData.env.THN_AI_AUTH_TOKEN},summary:workerData.env.THN_AI_AUTH_TOKEN,error:workerData.env.THN_AI_AUTH_TOKEN}});
