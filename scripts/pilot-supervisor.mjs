import {Worker} from 'node:worker_threads';
import {safePilotReport,validatedPilotSettings,safePilotSettings} from './pilot-report.mjs';
import {INFERENCE_STAGES} from '../server/intelligence-timing.js';
const hosted=env=>['VERCEL','AWS_LAMBDA_FUNCTION_NAME','NETLIFY','K_SERVICE','CF_PAGES'].some(k=>env[k]);
const permitted=['THN_AI_ENABLED','THN_AI_AUTH_TOKEN','THN_LOCAL_PAPER','THN_AI_MAX_REQUESTS','THN_AI_MAX_OUTPUT_TOKENS','THN_AI_TOTAL_TOKEN_CEILING','THN_AI_CONTEXT_TOKENS','THN_AI_TIMEOUT_MS','THN_AI_OLLAMA_URL','THN_AI_EXPECTED_DIGEST','THN_AI_PILOT_KEEP_ALIVE','THN_AI_PILOT_COMPACT','THN_AI_PILOT_THREADS'];
export async function supervisePilot({env=process.env,workerURL=new URL('./pilot-local-ai-worker.mjs',import.meta.url),policyMs=12000,...options}={}){
 if(hosted(env)||env.THN_LOCAL_PAPER==='1'||env.THN_AI_ENABLED!=='1'||!env.THN_AI_AUTH_TOKEN)throw Error('Authorized local pilot required');
 if(!Number.isInteger(policyMs)||policyMs<1||policyMs>12000)throw Error('Invalid pilot policy');
 const requestedSettings=validatedPilotSettings(env);
 const selected=Object.fromEntries(permitted.filter(k=>env[k]!==undefined).map(k=>[k,env[k]]));
 const start=process.hrtime.bigint(),clock=()=>Number(process.hrtime.bigint()-start)/1e6;
 let latest=null,startupMs=null,lastHeartbeat=null,latestRuntime=null,inventory=null,workerConfirmedSettings=null,settingsConfirmation='unconfirmed';const stages=new Map();
 return new Promise(resolve=>{
  let settled=false,timer;
  const worker=new Worker(workerURL,{workerData:{options,env:selected,startedNs:String(start),policyMs},env:selected});
  const finish=(result,timeout=false)=>{if(settled)return;settled=true;clearTimeout(timer);
   const projection=safePilotReport(result,{model:options.model,secrets:[env.THN_AI_AUTH_TOKEN,env.OPENAI_API_KEY]});
   if(clock()>=policyMs)timeout=true;
   const elapsedMs=Math.min(86400000,Math.max(0,Math.round(clock())));
   worker.unref();void worker.terminate().catch(()=>{});
   const observedStages=Object.fromEntries(INFERENCE_STAGES.map(name=>{const s=stages.get(name);return [name,{elapsedMs:s?Math.max(0,Math.round(s.duration+(s.active===null?0:clock()-s.active))):null,state:!s?'not_started':s.active===null?'settled':'unsettled',count:s?.count||0}];}));
   const safe={mode:'explicit-local-pilot',model:null,digest:null,sizeBytes:null,syntheticOnly:true,financialExecution:false,generationTested:false,accepted:false,fallback:true,failureCode:timeout?'TIMEOUT':'UNKNOWN',matchedCitations:0,matchedClaims:0,humanReviewRequired:true,noPredictiveProbability:true};
   // Worker messages contain the already redacted runner result, never provider text.
   resolve({...safe,...projection,...requestedSettings,requestedSettings,workerConfirmedSettings,settingsConfirmation,runtimeSettingsVerified:false,...(timeout&&inventory?{model:inventory.model,digest:inventory.digest,sizeBytes:inventory.sizeBytes,modelInspectionVerified:inventory.modelInspectionVerified}:{}),...(timeout&&latestRuntime?{runtime:latestRuntime}:{}),...(timeout?{accepted:false,fallback:true,failureCode:'TIMEOUT',matchedCitations:0,matchedClaims:0}:{}),supervision:{policyMs,elapsedMs,deadlineExceeded:timeout,settlementOverrunMs:Math.max(0,elapsedMs-policyMs),workerStartupMs:startupMs,heartbeatGapMs:lastHeartbeat===null?null:Math.max(0,Math.round(clock()-lastHeartbeat)),workerResponsiveness:lastHeartbeat===null?'unknown':clock()-lastHeartbeat<=Math.min(500,policyMs/2)?'responsive_at_settlement':'unresponsive_at_settlement',lastStage:latest?.stage||null,lastStageState:latest?.state||null,workerTerminationRequested:true,runtimeSettlementVerified:!timeout&&projection.runtime?.responseReceived===true,cancellationRequested:timeout},...(timeout?{generationTested:stages.has('generation'),timings:{policyMs,requestElapsedMs:elapsedMs,elapsedMs,deadlineExceeded:true,deadlineObservedMs:elapsedMs,settlementOverrunMs:Math.max(0,elapsedMs-policyMs),stages:observedStages,timingClipped:false},elapsedMs,elapsedScope:'supervised attempt including worker startup; runtime settlement unverified'}:{})});
  };
  // Node may round a fractional timer delay down. Recheck the absolute deadline
  // so an early timer callback cannot falsely label an in-budget attempt TIMEOUT.
  const onDeadline=()=>{const remaining=policyMs-clock();if(remaining>0){timer=setTimeout(onDeadline,Math.ceil(remaining));return;}finish(null,true);};
  timer=setTimeout(onDeadline,Math.max(0,Math.ceil(policyMs-clock())));
  worker.on('message',message=>{
   if(clock()>=policyMs)return finish(null,true);
   if(message?.type==='started'&&typeof message.atNs==='string'&&/^\d{1,24}$/.test(message.atNs)){const delta=Number(BigInt(message.atNs)-start)/1e6;if(delta>=0&&delta<=policyMs){startupMs=delta;lastHeartbeat=delta;}}
   if(message?.type==='heartbeat'&&typeof message.atNs==='string'&&/^\d{1,24}$/.test(message.atNs)){const delta=Number(BigInt(message.atNs)-start)/1e6;if(delta>=0&&delta<=clock())lastHeartbeat=delta;}
   if(message?.type==='stage'&&INFERENCE_STAGES.includes(message.stage)&&['started','settled'].includes(message.state)&&Number.isFinite(message.atMs)&&message.atMs>=0&&message.atMs<=86400000){latest={stage:message.stage,state:message.state};const at=message.atMs+(startupMs||0),s=stages.get(message.stage)||{duration:0,active:null,count:0};if(message.state==='started'&&s.active===null){s.active=at;s.count++;}else if(message.state==='settled'&&s.active!==null){s.duration+=Math.max(0,at-s.active);s.active=null;}stages.set(message.stage,s);}
   if(message?.type==='settings'){const settings=safePilotSettings(message.settings);if(settings&&Object.keys(requestedSettings).every(k=>settings[k]===requestedSettings[k])&&['worker_validated','request_prepared'].includes(message.phase)){workerConfirmedSettings=settings;if(settingsConfirmation!=='request_prepared')settingsConfirmation=message.phase;}}
   if(message?.type==='runtime')latestRuntime=safePilotReport({runtime:message.runtime}).runtime;
   if(message?.type==='inventory')inventory=safePilotReport(message.inventory,{model:options.model,secrets:[env.THN_AI_AUTH_TOKEN,env.OPENAI_API_KEY]});
   if(message?.type==='result')finish(message.result);
   if(message?.type==='error')finish(null);
  });
  worker.on('error',()=>finish(null));worker.on('exit',code=>{if(!settled)finish(null,clock()>=policyMs);});
 });
}
