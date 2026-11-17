// Serial, opt-in synthetic assessment. No downloads, hosted providers or financial execution.
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {inspectLocalModel,localConfiguration,loopbackJSON} from '../server/intelligence-local.js';
import {providerAvailability} from '../server/intelligence-provider.js';
import {createInferenceDeadline} from '../server/intelligence-timing.js';
import {supervisePilot} from './pilot-supervisor.mjs';
import {safePilotReport} from './pilot-report.mjs';
const scenarios=['bullish','bearish','neutral','conflicting','missing','stale'];
function choices(value,allowed){if(!Array.isArray(value)||!value.length||new Set(value).size!==value.length||value.some(x=>!allowed.includes(x)))throw Error('Invalid assessment dimensions');return value;}
export function assessmentPlan(config){
 if(!config||Object.keys(config).some(k=>!['schema','models','languages','threads','conditions','profiles','cases','repetitions','prepareModel'].includes(k))||config.schema!=='THN-LOCAL-ASSESSMENT-1'||!Array.isArray(config.models)||config.models.length<1||config.models.length>2)throw Error('Invalid assessment config');
 if(!Number.isInteger(config.repetitions)||config.repetitions<1||config.repetitions>3||typeof config.prepareModel!=='boolean')throw Error('Invalid assessment bounds');
 const models=config.models.map(m=>{if(!m||Object.keys(m).some(k=>!['model','digest','optional'].includes(k))||!['qwen3:1.7b','qwen3:0.6b'].includes(m.model)||!/^[a-f0-9]{64}$/.test(m.digest)||typeof m.optional!=='boolean')throw Error('Exact model and digest required');return m;});
 if(new Set(models.map(m=>m.model)).size!==models.length)throw Error('Duplicate model');
 const rows=[];
 for(const m of models)for(const threads of choices(config.threads,[1,2,4]))for(const condition of choices(config.conditions,['cold','warm']))for(const profile of choices(config.profiles,['full','compact']))for(const language of choices(config.languages,['en','ar']))for(const caseName of choices(config.cases,scenarios))for(let repeat=1;repeat<=config.repetitions;repeat++)rows.push({...m,threads,condition,profile,language,caseName,repeat});
 return {rows,trials:rows.length,maximumRequestSeconds:rows.length*12,preparationExplicit:config.prepareModel,parallelism:1};
}
export async function prepareInstalledModel(env,condition,{inspect=inspectLocalModel,transport=loopbackJSON}={}){
 if(!['cold','warm'].includes(condition))throw Error('Invalid preparation condition');
 if(!providerAvailability(env).available||providerAvailability(env).provider!=='ollama'||env.THN_LOCAL_PAPER!=='0')throw Error('Local authorization required');
 const budget=createInferenceDeadline();
 try{
  const installed=await budget.run(()=>inspect(env,{signal:budget.signal}));
  if(installed.digest!==env.THN_AI_EXPECTED_DIGEST)throw Error('Installed local weights required');
  const result=await budget.run(()=>transport(localConfiguration(env).endpoint,'/api/chat',{signal:budget.signal,timeout:Math.max(1,Math.floor(budget.remaining())),body:{model:env.THN_AI_MODEL,messages:[],stream:false,keep_alive:condition==='cold'?0:'5m'}}));
  if(result?.done!==true||result.model!==env.THN_AI_MODEL||result.message?.content||result.message?.tool_calls?.length)throw Error('Preparation response rejected');
  return {requestedCondition:condition,elapsedMs:budget.report().requestElapsedMs,verified:true};
 }finally{budget.dispose();}
}
const percentile=(a,q)=>a.length?[...a].sort((x,y)=>x-y)[Math.max(0,Math.ceil(a.length*q)-1)]:null;
export function summarizeAssessment(rows){
 const attempted=rows.filter(r=>r.status==='attempted'),accepted=attempted.filter(r=>r.result?.accepted);
 const eligible=attempted.filter(r=>!['missing','stale'].includes(r.caseName)),passingEligible=eligible.filter(r=>r.result?.accepted);
 const failures=Object.fromEntries([...new Set(attempted.filter(r=>!r.result?.accepted).map(r=>r.result?.failureCode||'UNKNOWN'))].map(code=>[code,attempted.filter(r=>!r.result?.accepted&&(r.result?.failureCode||'UNKNOWN')===code).length]));
 const complete= ['en','ar'].every(language=>['bullish','bearish','neutral','conflicting'].every(caseName=>eligible.filter(r=>r.language===language&&r.caseName===caseName).length>=2));
 const opposing=accepted.filter(r=>r.caseName==='conflicting').every(r=>['frame-1h','frame-1d'].every(id=>r.result.verifiedCitationIds?.includes(id)));
 const negativeCoverage=['en','ar'].every(language=>['missing','stale'].every(caseName=>attempted.some(r=>r.language===language&&r.caseName===caseName)));
 const safeNegative=attempted.filter(r=>['missing','stale'].includes(r.caseName)).every(r=>!r.result.accepted&&!r.result.generationTested);
 const ratio=eligible.length?passingEligible.length/eligible.length:null;
 const technical=complete&&ratio>=.9&&!failures.TIMEOUT&&opposing&&safeNegative&&negativeCoverage&&rows.every(r=>r.status==='attempted')&&eligible.every(r=>r.preparation?.verified===true)&&accepted.every(r=>r.result.matchedClaims>0&&r.result.matchedCitations>0&&r.result.financialExecution===false&&Number.isFinite(r.result.elapsedMs)&&r.result.elapsedMs<=12000&&r.result.languageEvidence?.requested===r.language&&(r.language==='ar'?r.result.languageEvidence.arabicScriptPresent:r.result.languageEvidence.latinScriptPresent));
 return {attempted:attempted.length,accepted:accepted.length,eligibleAttempts:eligible.length,eligibleAcceptanceRatio:ratio,failures,medianAcceptedRequestMs:percentile(accepted.map(r=>r.result.elapsedMs).filter(Number.isFinite),.5),p95AcceptedRequestMs:percentile(accepted.map(r=>r.result.elapsedMs).filter(Number.isFinite),.95),timeoutSamplesAreCensored:true,minimumCoverageMet:complete,opposingCitationCoverage:opposing,negativeCasesSafe:safeNegative,negativeCoverageMet:negativeCoverage,decision:technical?'TECHNICAL_CANDIDATE_REQUIRES_HUMAN_EN_AR_REVIEW':'NO_GO',humanLanguageAndUtilityReview:'NOT_PERFORMED',financialCompetenceEstablished:false};
}
function cellSummary(cell,rows){return {cell,...summarizeAssessment(rows),languages:['en','ar'].map(language=>{const s=summarizeAssessment(rows.filter(r=>r.language===language));return {language,attempted:s.attempted,accepted:s.accepted,eligibleAcceptanceRatio:s.eligibleAcceptanceRatio,medianAcceptedRequestMs:s.medianAcceptedRequestMs,p95AcceptedRequestMs:s.p95AcceptedRequestMs,failures:s.failures};})};}
export async function runAssessment(config,{env=process.env,inspect=inspectLocalModel,prepare=prepareInstalledModel,run=supervisePilot,freeMemory=()=>os.freemem()}={}){
 const plan=assessmentPlan(config),rows=[],frozenEvidenceAt=Date.now();
 if([env.THN_AI_AUTH_TOKEN,env.OPENAI_API_KEY].filter(s=>s&&s.length>=8).some(s=>JSON.stringify(config).includes(s)))throw Error('Credential-like config rejected');
 if(env.THN_LOCAL_PAPER!=='0'||!providerAvailability({...env,THN_AI_PROVIDER:'ollama',THN_AI_MODEL:plan.rows[0].model}).available)throw Error('Explicit authorized local pilot required');
 const context=Number(env.THN_AI_CONTEXT_TOKENS||4096);
 // Reserve worst-case context per attempt up front; never reset budgets per worker.
 if(plan.trials>Number(env.THN_AI_MAX_REQUESTS)||plan.trials*context>Number(env.THN_AI_TOTAL_TOKEN_CEILING)||plan.trials>20||freeMemory()<2*1024**3)throw Error('Assessment exceeds existing resource budget');
 let stopped=false;
 const missing=new Set();
 for(const m of config.models){
  try{const found=await inspect({...env,THN_AI_PROVIDER:'ollama',THN_AI_MODEL:m.model});if(found.model!==m.model||found.digest!==m.digest)throw Error('Identity mismatch');}
  catch{if(!m.optional)throw Error('Required installed model unavailable');missing.add(m.model);}
 }
 for(const trial of plan.rows){
  const row={model:trial.model,digest:trial.digest,threads:trial.threads,condition:trial.condition,profile:trial.profile,language:trial.language,caseName:trial.caseName,repeat:trial.repeat};
  if(missing.has(trial.model)||stopped){rows.push({...row,status:missing.has(trial.model)?'optional_model_unavailable':'not_run_after_timeout'});continue;}
  const settings={...env,THN_AI_MODEL:trial.model,THN_AI_PROVIDER:'ollama',THN_AI_EXPECTED_DIGEST:trial.digest,THN_AI_PILOT_COMPACT:trial.profile==='compact'?'1':'0',THN_AI_PILOT_THREADS:String(trial.threads),THN_AI_PILOT_KEEP_ALIVE:trial.condition==='warm'?'5m':'0'};
  let preparation={requestedCondition:trial.condition,verified:false,elapsedMs:null};
  if(config.prepareModel&&!['missing','stale'].includes(trial.caseName)){try{preparation=await prepare(settings,trial.condition);}catch{rows.push({...row,status:'preparation_failed',preparation});stopped=true;continue;}}
  const result=safePilotReport(await run({mode:'--run',model:trial.model,language:trial.language,caseName:trial.caseName,snapshotAt:frozenEvidenceAt,env:settings}),{model:trial.model,secrets:[env.THN_AI_AUTH_TOKEN,env.OPENAI_API_KEY]});
  rows.push({...row,status:'attempted',preparation,result});if(result.failureCode==='TIMEOUT')stopped=true;
 }
 const cells=[...new Set(rows.map(r=>[r.model,r.threads,r.condition,r.profile].join('|')))].map(key=>cellSummary(key,rows.filter(r=>[r.model,r.threads,r.condition,r.profile].join('|')===key)));
 const summary=summarizeAssessment(rows);if(cells.some(c=>c.decision==='NO_GO'))summary.decision='NO_GO';
 return {schema:'THN-LOCAL-ASSESSMENT-1',batchId:crypto.randomUUID(),fixtureVersion:'THN-PILOT-SYNTHETIC-1',optimizerVersion:'bound-schema-1',settings:{context,outputTokens:Number(env.THN_AI_MAX_OUTPUT_TOKENS)},syntheticOnly:true,frozenEvidenceAt,financialExecution:false,parallelism:1,worstCaseReservedUnits:plan.trials*context,requestPolicyMs:12000,preparationHasSeparate12sBudget:true,preparationCallCeiling:config.prepareModel?plan.trials:0,modelBytesAreNotRamMeasurement:true,rows,summary,cells};
}
export function combineAssessments(reports,{secrets=[]}={}){
 if(!Array.isArray(reports)||reports.length<1||reports.length>64)throw Error('Invalid report set');
 const ids=new Set(),rows=[];let settings;
 for(const report of reports){
  if(report?.schema!=='THN-LOCAL-ASSESSMENT-1'||report.fixtureVersion!=='THN-PILOT-SYNTHETIC-1'||report.optimizerVersion!=='bound-schema-1'||report.requestPolicyMs!==12000||!Array.isArray(report.rows)||report.rows.length>20||!/^[a-f0-9-]{36}$/.test(report.batchId)||ids.has(report.batchId))throw Error('Incompatible or duplicate batch');
  if(!Number.isInteger(report.settings?.context)||report.settings.context<2048||report.settings.context>8192||!Number.isInteger(report.settings.outputTokens)||report.settings.outputTokens<32||report.settings.outputTokens>800)throw Error('Invalid report settings');
  if(settings&&JSON.stringify(settings)!==JSON.stringify(report.settings))throw Error('Different resource conditions');settings={context:report.settings.context,outputTokens:report.settings.outputTokens};ids.add(report.batchId);
  for(const row of report.rows){
   if(!['qwen3:1.7b','qwen3:0.6b'].includes(row.model)||!/^[a-f0-9]{64}$/.test(row.digest)||!scenarios.includes(row.caseName)||![1,2,4].includes(row.threads)||!['cold','warm'].includes(row.condition)||!['full','compact'].includes(row.profile)||!['en','ar'].includes(row.language)||!['attempted','preparation_failed','optional_model_unavailable','not_run_after_timeout'].includes(row.status)||secrets.filter(Boolean).some(s=>row.model.includes(s)||row.digest.includes(s)))throw Error('Invalid report row');
   const result=safePilotReport(row.result,{model:row.model,secrets});
   if(row.status==='attempted'&&(result.digest&&result.digest!==row.digest||result.languageEvidence&&result.languageEvidence.requested!==row.language))throw Error('Result identity mismatch');
   rows.push({model:row.model,digest:row.digest,threads:row.threads,condition:row.condition,profile:row.profile,language:row.language,caseName:row.caseName,status:row.status,preparation:{verified:row.preparation?.verified===true},result});
  }
 }
 const cells=[...new Set(rows.map(r=>[r.model,r.digest,r.threads,r.condition,r.profile].join('|')))].map(cell=>cellSummary(cell,rows.filter(r=>[r.model,r.digest,r.threads,r.condition,r.profile].join('|')===cell)));
 const summary=summarizeAssessment(rows);if(cells.some(c=>c.decision==='NO_GO'))summary.decision='NO_GO';
 return {schema:'THN-LOCAL-ASSESSMENT-SUMMARY-1',batchCount:ids.size,settings,operatorReportsUnattested:true,financialExecution:false,summary,cells};
}
async function main(args){
 try{
  if(args[0]==='--summarize'){if(args.length<2||args.length>65)throw Error('Invalid report files');const reports=args.slice(1).map(name=>{const b=fs.readFileSync(name);if(b.length>1048576)throw Error('Report too large');return JSON.parse(b.toString('utf8').replace(/^\uFEFF/,''));});const result=combineAssessments(reports,{secrets:[process.env.THN_AI_AUTH_TOKEN,process.env.OPENAI_API_KEY]});process.stdout.write(JSON.stringify(result,null,2)+'\n');if(result.summary.decision==='NO_GO')process.exitCode=2;return;}
  if(args.length!==2||!['--plan','--run'].includes(args[0]))throw Error('Invalid assessment command');
  const source=fs.readFileSync(args[1]);if(source.length>16384)throw Error('Config too large');const config=JSON.parse(source.toString('utf8').replace(/^\uFEFF/,''));
  if(args[0]==='--plan'){const p=assessmentPlan(config);process.stdout.write(JSON.stringify({trials:p.trials,parallelism:p.parallelism,maximumRequestSeconds:p.maximumRequestSeconds,preparationExplicit:p.preparationExplicit,requestPolicyMs:12000,models:config.models.map(m=>m.model)},null,2)+'\n');return;}
  const report=await runAssessment(config);process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.summary.decision==='NO_GO')process.exitCode=2;
 }catch{process.stderr.write(JSON.stringify({ok:false,code:'ASSESSMENT_UNAVAILABLE_OR_REJECTED',message:'Check local authorization, exact installed digests, explicit preparation and bounded batch configuration. No model was downloaded or financial action enabled.'})+'\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main(process.argv.slice(2));
