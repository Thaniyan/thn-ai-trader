import {INFERENCE_STAGES} from '../server/intelligence-timing.js';
import {classifyPilotFailure} from '../server/intelligence-diagnostics.js';
const num=(v,max=86400000)=>Number.isSafeInteger(v)&&v>=0&&v<=max?v:null;
const ids=v=>Array.isArray(v)&&v.length<=12&&v.every(x=>/^(frame-(15m|1h|1d)|evaluation|risk-plan|event-[0-5])$/.test(x))?[...v]:[];
import {validatedPilotSettings,safePilotSettings} from '../server/intelligence-settings.js';
export {validatedPilotSettings,safePilotSettings};
// Deliberate projection, not recursive redaction of an arbitrary provider/worker object.
export function safePilotReport(raw,{model,secrets=[]}={}){
 const text=v=>typeof v==='string'&&!secrets.filter(Boolean).some(s=>v.includes(s));
 const identity=text(model)&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,69}(?::[A-Za-z0-9][A-Za-z0-9._-]{0,28})?$/.test(model)?model:null;
 const hash=v=>text(v)&&/^[a-f0-9]{64}$/.test(v)?v:null;
 const failure=raw?.failureCode===null?null:classifyPilotFailure({code:raw?.failureCode});
 const expired=raw?.timings?.deadlineExceeded===true||raw?.supervision?.deadlineExceeded===true||Number.isFinite(raw?.elapsedMs)&&raw.elapsedMs>12000;
 const valid=!expired&&raw?.financialExecution===false&&raw?.model===model&&identity&&hash(raw?.digest)&&raw?.modelInspectionVerified===true&&num(raw?.matchedCitations,12)>0&&num(raw?.matchedClaims,6)>0&&failure===null;
 const result={mode:'explicit-local-pilot',model:identity,digest:hash(raw?.digest),sizeBytes:num(raw?.sizeBytes,2*1024**3),syntheticOnly:true,financialExecution:false,
  generationTested:raw?.generationTested===true,providerInvoked:raw?.providerInvoked===true,modelInspectionVerified:raw?.modelInspectionVerified===true,
  accepted:raw?.accepted===true&&!!valid,fallback:!(raw?.accepted===true&&valid),failureCode:expired?'TIMEOUT':raw?.accepted&&!valid?'MODEL_RESPONSE_INVALID':failure,
  configuredProviderDeadlineMs:num(raw?.configuredProviderDeadlineMs,12000),elapsedMs:num(raw?.elapsedMs),totalElapsedMs:num(raw?.totalElapsedMs),latencyMs:num(raw?.latencyMs),elapsedScope:'request including inventory, generation and strict validation',
  matchedCitations:num(raw?.matchedCitations,12)||0,matchedClaims:num(raw?.matchedClaims,6)||0,verifiedCitationIds:ids(raw?.verifiedCitationIds),
  snapshotId:hash(raw?.snapshotId),sourceIds:ids(raw?.sourceIds),keepAlive:[0,'5m'].includes(raw?.keepAlive)?raw.keepAlive:null,compactPilot:typeof raw?.compactPilot==='boolean'?raw.compactPilot:null,pilotThreads:[1,2,4].includes(raw?.pilotThreads)?raw.pilotThreads:null,
  humanReviewRequired:true,noPredictiveProbability:true};
 const requested=safePilotSettings(raw?.requestedSettings),confirmed=safePilotSettings(raw?.workerConfirmedSettings);
 const matching=requested&&confirmed&&['worker_validated','request_prepared'].includes(raw?.settingsConfirmation)&&Object.keys(requested).every(k=>requested[k]===confirmed[k]);
 result.requestedSettings=requested;result.workerConfirmedSettings=matching?confirmed:null;
 result.settingsConfirmation=matching&&['worker_validated','request_prepared'].includes(raw?.settingsConfirmation)?raw.settingsConfirmation:'unconfirmed';
 result.runtimeSettingsVerified=false;
 if(requested)Object.assign(result,requested);
 if(['conflicting','bullish','bearish','neutral','missing','stale'].includes(raw?.caseName))result.caseName=raw.caseName;
 if(raw?.timings){const t=raw.timings;result.timings={elapsedMs:num(t.elapsedMs),policyMs:num(t.policyMs,12000),requestElapsedMs:num(t.requestElapsedMs),deadlineExceeded:t.deadlineExceeded===true,deadlineObservedMs:num(t.deadlineObservedMs),settlementOverrunMs:num(t.settlementOverrunMs),timingClipped:t.timingClipped===true,stages:Object.fromEntries(INFERENCE_STAGES.map(name=>{const s=t.stages?.[name];return [name,{elapsedMs:num(s?.elapsedMs),count:num(s?.count,20)||0,state:['not_started','unsettled','settled'].includes(s?.state)?s.state:'not_started'}];}))};}
 if(raw?.runtime)result.runtime=Object.fromEntries(['reportedLoadMs','reportedPromptMs','reportedGenerationMs','reportedTotalMs','promptTokens','completionTokens','requestBytes','requestedUnits','reservedUnits'].map(k=>[k,num(raw.runtime[k],k.endsWith('Tokens')?8192:['requestBytes','requestedUnits','reservedUnits'].includes(k)?65536:86400000)]));
 if(raw?.languageEvidence&&['en','ar'].includes(raw.languageEvidence.requested))result.languageEvidence={requested:raw.languageEvidence.requested,arabicScriptPresent:raw.languageEvidence.arabicScriptPresent===true,latinScriptPresent:raw.languageEvidence.latinScriptPresent===true};
 if(result.runtime)result.runtime.responseReceived=raw.runtime.responseReceived===true;
 if(raw?.supervision){const s=raw.supervision;result.supervision={policyMs:num(s.policyMs,12000),elapsedMs:num(s.elapsedMs),deadlineExceeded:s.deadlineExceeded===true,settlementOverrunMs:num(s.settlementOverrunMs),workerStartupMs:Number.isFinite(s.workerStartupMs)&&s.workerStartupMs>=0&&s.workerStartupMs<=12000?Math.round(s.workerStartupMs):null,heartbeatGapMs:num(s.heartbeatGapMs),workerResponsiveness:['unknown','responsive_at_settlement','unresponsive_at_settlement'].includes(s.workerResponsiveness)?s.workerResponsiveness:'unknown',lastStage:INFERENCE_STAGES.includes(s.lastStage)?s.lastStage:null,lastStageState:['started','settled'].includes(s.lastStageState)?s.lastStageState:null,workerTerminationRequested:s.workerTerminationRequested===true,runtimeSettlementVerified:s.runtimeSettlementVerified===true,cancellationRequested:s.cancellationRequested===true};}
 return result;
}
