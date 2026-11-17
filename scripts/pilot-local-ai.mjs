// Isolated real-model research pilot. Never installs weights, changes provider config or executes trades.
import {pathToFileURL} from 'node:url';
import {evidenceSnapshot} from '../server/intelligence.js';
import {inspectLocalModel,generateLocal} from '../server/intelligence-local.js';
import {interpretVerifiedEvidence} from '../server/intelligence-inference-lifecycle.js';
import {providerAvailability} from '../server/intelligence-provider.js';

export function syntheticPilotSnapshot(at=Date.now()){
 if(!Number.isFinite(at))throw Error('Invalid clock');
 const symbol='EURUSD',interval='1h';
 const frames=[
  {interval:'15m',trend:'bullish',back:30*60000},
  {interval:'1h',trend:'bullish',back:2*3600000},
  {interval:'1d',trend:'bearish',back:2*24*3600000},
 ].map((f,i)=>({interval:f.interval,available:true,trend:f.trend,close:1.1,
   rsi:i===2?46:54,provenance:{source:'THN SYNTHETIC OFFLINE PILOT - NOT MARKET DATA',
    providerSymbol:'EURUSD=X',hash:String(i+1).repeat(64),lastTime:at-f.back,status:'recent',gapCount:0}}));
 return evidenceSnapshot({symbol,interval,asOf:at,selected:{provenance:{hash:'2'.repeat(64)},events:[]},frames});
}
export function parsePilotArgs(args){
 if(args.length!==4||!['--check','--run'].includes(args[0])||args[1]!=='--model'||!/^([A-Za-z0-9][A-Za-z0-9._-]{0,69})(?::[A-Za-z0-9][A-Za-z0-9._-]{0,28})?$/.test(args[2])||!['en','ar'].includes(args[3]))throw Error('Usage: node scripts/pilot-local-ai.mjs --check|--run --model <installed-local-tag> en|ar');
 return {mode:args[0],model:args[2],language:args[3]};
}
export async function runPilot({mode,model,language,env=process.env,inspect=inspectLocalModel,generate=generateLocal,now=Date.now}){
 if(!['--check','--run'].includes(mode)||!['en','ar'].includes(language)||typeof model!=='string')throw Error('Invalid pilot selection');
 if(env.VERCEL||env.AWS_LAMBDA_FUNCTION_NAME||env.NETLIFY||env.K_SERVICE||env.CF_PAGES)throw Error('Hosted environments are prohibited');
 const config={...env,THN_AI_MODEL:model,THN_AI_PROVIDER:'ollama'};
 const installed=await inspect(config);
 const reference={mode:mode==='--check'?'read-only':'explicit-local-pilot',model:installed.model,digest:installed.digest,
  sizeBytes:installed.sizeBytes,generationTested:false,syntheticOnly:true,financialExecution:false};
 if(mode==='--check')return reference;
 if(env.THN_LOCAL_PAPER==='1'||!providerAvailability(config).available||providerAvailability(config).provider!=='ollama')throw Error('Explicit local provider authorization, budgets and paper-off required');
 if(env.THN_AI_PILOT_KEEP_ALIVE!==undefined&&!['0','5m'].includes(env.THN_AI_PILOT_KEEP_ALIVE))throw Error('Invalid local pilot keep-alive');
 const pilotKeepAlive=env.THN_AI_PILOT_KEEP_ALIVE==='5m'?'5m':0;
 if(env.THN_AI_PILOT_COMPACT!==undefined&&!['0','1'].includes(env.THN_AI_PILOT_COMPACT))throw Error('Invalid local pilot compact mode');
 const pilotCompact=env.THN_AI_PILOT_COMPACT==='1';
 const snapshot=syntheticPilotSnapshot(now());
 const question=language==='ar'?'حلل EURUSD':'Analyze EURUSD';
 let modelAttempts=0,failureCode=null;
 const started=performance.now();
 const answer=await interpretVerifiedEvidence({snapshot,question,language,now,
  provider:async(s,q,options)=>{modelAttempts++;
   return generate(config,s,q,{authorization:'Bearer '+env.THN_AI_AUTH_TOKEN,language,signal:options.signal,
    pilotKeepAlive,pilotCompact,
    onRequest:count=>{if(!Number.isInteger(count)||count<1||count>Number(config.THN_AI_TOTAL_TOKEN_CEILING))throw Error('Local pilot reserved token ceiling exceeded');}});
  },
  currentSnapshotId:()=>snapshot.id,
  onDiagnostic:code=>{failureCode=code;}});
 return {...reference,generationTested:modelAttempts>0,accepted:answer.method==='llm-assisted',fallback:answer.method!=='llm-assisted',
   failureCode:answer.method==='llm-assisted'?null:(failureCode||'UNKNOWN'),
   elapsedMs:Math.max(0,Math.min(30000,Math.round(performance.now()-started))),
   keepAlive:pilotKeepAlive,compactPilot:pilotCompact,
   snapshotId:snapshot.id,sourceIds:snapshot.refs.map(r=>r.id),
   latencyMs:answer.generation?.latencyMs??null,matchedCitations:answer.generation?.citations?.length??0,
   matchedClaims:answer.generation?.claims?.length??0,
   humanReviewRequired:true,noPredictiveProbability:true,
   // No model prose, private credentials or full evidence serialized into logs.
 };
}
async function main(args,env){
 try{
  const options=parsePilotArgs(args),result=await runPilot({...options,env});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(options.mode==='--run'&&!result.accepted)process.exitCode=2;
 }catch(error){
  process.stderr.write(JSON.stringify({ok:false,code:'PILOT_UNAVAILABLE_OR_REJECTED',
   message:'No verified successful model result. Check installed local runtime, explicit opt-in, and strict evidence contract.'})+'\n');
  process.exitCode=1;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main(process.argv.slice(2),process.env);
