import {validatedPilotSettings} from './intelligence-settings.js';
import {authenticated} from './intelligence-local.js';
import {Worker} from 'node:worker_threads';
import {createInferenceDeadline,inferenceTimeout} from './intelligence-timing.js';
// The parent owns cumulative budgets. Workers cannot reset them or choose endpoints.
const fields=['THN_AI_MODEL','THN_AI_AUTH_TOKEN','THN_AI_OLLAMA_URL','THN_AI_CONTEXT_TOKENS','THN_AI_MAX_OUTPUT_TOKENS','THN_AI_TIMEOUT_MS','THN_AI_EXPECTED_DIGEST','THN_AI_PILOT_KEEP_ALIVE','THN_AI_PILOT_COMPACT','THN_AI_PILOT_THREADS'];
export async function supervisedLocal(env,snapshot,question,{authorization,signal,history=[],language='en',deadline,onRequest,onModelCall,workerURL=new URL('./intelligence-worker.js',import.meta.url)}={}){
 if(['VERCEL','AWS_LAMBDA_FUNCTION_NAME','NETLIFY','K_SERVICE','CF_PAGES'].some(k=>env[k])||env.THN_LOCAL_PAPER==='1'||env.THN_AI_ENABLED!=='1'||env.THN_AI_PROVIDER!=='ollama'||!authenticated(authorization,env))throw Error('Authorized local pilot required');
 if(!/^[a-f0-9]{64}$/.test(env.THN_AI_EXPECTED_DIGEST||''))throw Object.assign(Error('Installed local weights required'),{code:'MODEL_UNAVAILABLE'});
 validatedPilotSettings(env);
 const owned=!deadline,budget=deadline||createInferenceDeadline({signal});
 const policyMs=Math.min(12000,Math.floor(budget.remaining()));if(policyMs<1)throw inferenceTimeout();
 const startedNs=String(process.hrtime.bigint());
 try{return await budget.run(()=>new Promise((resolve,reject)=>{
  const worker=new Worker(workerURL,{workerData:{snapshot,question,options:{history,language},env:Object.fromEntries(fields.filter(k=>env[k]!==undefined).map(k=>[k,env[k]])),startedNs,policyMs},env:{},execArgv:[]});
  let settled=false,reserved=false,called=false;
  const finish=(error,value)=>{if(settled)return;settled=true;budget.signal.removeEventListener('abort',abort);worker.unref();void worker.terminate().catch(()=>{});error?reject(error):resolve(value);};
  const abort=()=>finish(budget.signal.reason||inferenceTimeout());budget.signal.addEventListener('abort',abort,{once:true});if(budget.signal.aborted)abort();
  worker.on('message',m=>{if(settled)return;
   if(m?.type==='reserve'){try{budget.check();if(reserved||!Number.isSafeInteger(m.units)||m.units<1)throw Error('Invalid reservation');onRequest(m.units);reserved=true;worker.postMessage({type:'budget',allowed:true});}catch(error){finish(error);}}
   else if(m?.type==='modelCall'){if(!reserved||called)return finish(Error('Invalid model call'));called=true;onModelCall();}
   else if(m?.type==='result'){try{budget.check();if(!reserved||!called)throw Error('Unverified response');if([env.THN_AI_AUTH_TOKEN,env.OPENAI_API_KEY].filter(v=>typeof v==='string'&&v.length>=8).some(v=>JSON.stringify(m.result).includes(v)))throw Error('Credential-like output rejected');finish(null,m.result);}catch(error){finish(error);}}
   else if(m?.type==='failure')finish(Object.assign(Error('Local interpretation rejected'),{code:['TIMEOUT','CONTEXT_LIMIT','INVALID_JSON','INVALID_SCHEMA','UNSUPPORTED_CLAIM','MODEL_RESPONSE_INVALID','MODEL_UNAVAILABLE','CONTEXT_CHANGED','UNKNOWN'].includes(m.code)?m.code:'UNKNOWN'}));
  });
  worker.on('error',()=>finish(Object.assign(Error('Local worker unavailable'),{code:'MODEL_UNAVAILABLE'})));
  worker.on('exit',()=>{if(!settled)finish(Object.assign(Error('Local worker exited'),{code:'MODEL_UNAVAILABLE'}));});
 }));}finally{if(owned)budget.dispose();}
}
