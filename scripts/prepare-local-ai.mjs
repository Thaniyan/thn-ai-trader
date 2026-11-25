// OFFLINE only: validates existing qualification plans; never inspects HTTP inventory or runs a worker.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {assessmentPlan} from './assess-local-ai.mjs';
import {validatedPilotSettings} from './pilot-report.mjs';
import {syntheticPilotSnapshot} from './pilot-local-ai.mjs';
import {localConfiguration,validateLocalSnapshot} from '../server/intelligence-local.js';
import {providerAvailability} from '../server/intelligence-provider.js';
import {evidenceState} from '../public/intelligence-generation.js';
const cases=['bullish','bearish','neutral','conflicting','missing','stale'];
const hosted=['VERCEL','AWS_LAMBDA_FUNCTION_NAME','NETLIFY','K_SERVICE','CF_PAGES'];
export function prepareLocalAI(config,{env=process.env}={}){
 const plan=assessmentPlan(config);
 if(hosted.some(key=>env[key]))throw Error('Local owner device required');
 if(config.models.length!==1||config.models[0].optional)throw Error('One required exact model identity required');
 if(config.languages.length!==2||!['en','ar'].every(x=>config.languages.includes(x))||config.cases.length!==6||!cases.every(x=>config.cases.includes(x)))throw Error('Both languages and all evidence cases required');
 const model=config.models[0].model,digest=config.models[0].digest;
 const secrets=[env.THN_AI_AUTH_TOKEN,env.OPENAI_API_KEY].filter(x=>typeof x==='string'&&x.length>=8);
 if(secrets.some(secret=>JSON.stringify(config).includes(secret)))throw Error('Credential-like plan rejected');
 if(env.THN_AI_EXPECTED_DIGEST!==digest||env.THN_AI_MODEL!==model)throw Error('Requested identity must match configured digest and model');
 if(env.THN_LOCAL_PAPER!=='0'||env.THN_AI_TIMEOUT_MS!==undefined&&env.THN_AI_TIMEOUT_MS!=='12000')throw Error('Paper execution must be off and deadline must remain 12000');
 const settings=validatedPilotSettings(env);
 if(config.threads.length!==1||config.threads[0]!==settings.pilotThreads||config.profiles.length!==1||config.profiles[0]!== (settings.compactPilot?'compact':'full')||config.conditions.length!==1||config.conditions[0]!== (settings.keepAlive==='5m'?'warm':'cold'))throw Error('One plan cell must match actual requested settings');
 const local=localConfiguration({...env,THN_AI_MODEL:model});
 if(!local)throw Error('Invalid existing local endpoint or context');
 // Reuse the authoritative availability validator only as a pure budget check.
 // This sentinel is private to this call, never a runtime credential or inference opt-in.
 const budgetEnv={...env,THN_AI_ENABLED:'1',THN_AI_PROVIDER:'ollama',THN_AI_MODEL:model,THN_AI_AUTH_TOKEN:'offline-validation-only'};
 if(!providerAvailability(budgetEnv).available)throw Error('Invalid existing bounded request/output budget');
 const requestLimit=Number(env.THN_AI_MAX_REQUESTS),tokenLimit=Number(env.THN_AI_TOTAL_TOKEN_CEILING);
 const reservedUnits=plan.trials*local.context;
 if(plan.trials>requestLimit||reservedUnits>tokenLimit||plan.trials>20)throw Error('Plan exceeds unchanged request or token budget');
 // Fixed reference time makes this static fixture inspection reproducible; no live prices or clock freshness claim.
 const at=1800000000000;
 const evidenceCases=cases.map(caseName=>{
  const snapshot=syntheticPilotSnapshot(at,caseName);
  let localEvidenceAdmissible=false;try{validateLocalSnapshot(snapshot,at);localEvidenceAdmissible=true;}catch{}
  return {caseName,state:evidenceState(snapshot),localEvidenceAdmissible,sourceReferences:snapshot.refs.length,syntheticOnly:true};
 });
 const positiveCoverage=['en','ar'].every(language=>['bullish','bearish','neutral','conflicting'].every(caseName=>plan.rows.filter(row=>row.language===language&&row.caseName===caseName).length>=2));
 const requestedInferenceAuthorized=env.THN_AI_PROVIDER==='ollama'&&providerAvailability(env).available;
 const result={schema:'THN-LOCAL-AI-PREPARATION-1',mode:'offline-preparation',configurationValid:true,
  model,digestIdentity:'REQUESTED_NOT_INSPECTED',runtimeInventory:'NOT_VERIFIED',modelQualification:'NOT_VERIFIED',releaseDecision:'NO_GO',
  generationTested:false,networkRequests:0,modelActivationPerformed:false,financialExecution:false,syntheticOnly:true,
  requestPolicyMs:12000,parallelism:1,plannedAttempts:plan.trials,worstCaseReservedUnits:reservedUnits,
  budgets:{requestLimit,tokenLimit,contextTokens:local.context,outputTokens:Number(env.THN_AI_MAX_OUTPUT_TOKENS)},
  requestedSettings:settings,workerConfirmedSettings:null,runtimeSettingsVerified:false,
  requestedInferenceAuthorized,minimumRepeatedPositiveCoveragePlanned:positiveCoverage,
  preparationExplicit:plan.preparationExplicit,preparationWouldActivateModel:plan.preparationExplicit,
  evidenceCases,
  blockers:['REAL_INSTALLED_DIGEST_NOT_INSPECTED','NO_REAL_MODEL_RESPONSE','NO_MEASURED_MODEL_LATENCY','HUMAN_EN_AR_REVIEW_NOT_PERFORMED',...(!positiveCoverage?['REPEATED_POSITIVE_COVERAGE_INCOMPLETE']:[]),...(!requestedInferenceAuthorized?['EXPLICIT_LOCAL_INFERENCE_AUTHORIZATION_NOT_CONFIGURED']:[])],
  // Handoff only. These commands execute a real synthetic attempt if separately authorized on the owner device.
  futureSingleShotCommands:['en','ar'].map(language=>({language,command:`node scripts/pilot-local-ai.mjs --run --model ${model} ${language}`,requiresSeparateOwnerAuthorization:true,syntheticOnly:true,qualifiesMarketData:false})),
  acceptanceContract:{strictSnapshotHash:true,exactInstalledDigest:true,sourceCitations:true,opposition:true,unknownEvidenceRefusal:true,missingOrStaleEvidenceFallback:true,hardDeadlineIncludingCancellationMs:12000,noPredictiveProbability:true,humanReviewRequired:true},
 };
 if(secrets.some(secret=>JSON.stringify(result).includes(secret)))throw Error('Credential-like output rejected');
 return result;
}
function readBoundedPlan(name){
 const prior=fs.lstatSync(name);
 if(!prior.isFile()||prior.isSymbolicLink()||prior.size>16384)throw Error('Bounded regular plan file required');
 // Nonblocking/no-follow where supported avoids a replaced FIFO or symlink being opened.
 const fd=fs.openSync(name,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0)|(fs.constants.O_NONBLOCK||0));
 try{
  const opened=fs.fstatSync(fd);
  if(!opened.isFile()||opened.size>16384||opened.dev!==prior.dev||opened.ino!==prior.ino)throw Error('Plan file changed or unsupported');
  const buffer=Buffer.alloc(16385);let length=0;
  while(length<buffer.length){const count=fs.readSync(fd,buffer,length,buffer.length-length,null);if(count===0)break;length+=count;}
  if(length>16384)throw Error('Plan too large');
  return buffer.subarray(0,length);
 }finally{fs.closeSync(fd);}
}
export function preparationCLI(args,{env=process.env,readFile=readBoundedPlan}={}){
 if(args.length!==2||args[0]!=='--plan')throw Error('Only offline --plan is supported');
 const source=readFile(args[1]);if(!Buffer.isBuffer(source)||source.length>16384)throw Error('Bounded local config required');
 return prepareLocalAI(JSON.parse(source.toString('utf8').replace(/^\uFEFF/,'')),{env});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{process.stdout.write(JSON.stringify(preparationCLI(process.argv.slice(2)),null,2)+'\n');}
 catch{process.stderr.write(JSON.stringify({ok:false,code:'OFFLINE_AI_PREPARATION_REJECTED',message:'Check the closed assessment schema, exact requested identity, EN/AR coverage, unchanged local settings and bounded budgets. No network, model activation or inference was performed.'})+'\n');process.exitCode=1;}
}
