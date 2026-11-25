import {committee,routeQuestion} from './intelligence.js';
import {validateGeneration} from '../public/intelligence-generation.js';
import {validateLocalSnapshot} from './intelligence-local.js';
import {createInferenceDeadline,createInferenceTiming} from './intelligence-timing.js';
import {classifyPilotFailure} from './intelligence-diagnostics.js';

const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};

// Phase-2 opt-in interpretation boundary; caller injects provider, no network here.
// Deterministic evidence is always authoritative and is never modified by a model.
export async function interpretVerifiedEvidence({
 snapshot,question,provider,authorization,language='en',signal,history=[],
 now=Date.now,currentSnapshotId=()=>snapshot?.id,timeoutMs=12000,deadline:parentDeadline=null,enforceLanguage=false,onDiagnostic=null,onTimings=null,timing=null,clock=()=>performance.now()
}={}){
 // Providers receive a frozen private copy, never the caller's authoritative record.
 const metrics=timing||createInferenceTiming({clock});
 const deadline=parentDeadline||createInferenceDeadline({timeoutMs,signal,clock});
 let baseline,failureCode=null;
 try{baseline=metrics.sync('construction',()=>{snapshot=freeze(structuredClone(snapshot));return committee(snapshot,question,language);});deadline.check();}catch(error){if(!parentDeadline)deadline.dispose();throw error;}
 const fallback=(reason,code='MODEL_UNAVAILABLE')=>({...baseline,method:'deterministic',model:null,provider:null,
  generation:null,providerFallback:reason,interpretationStatus:{outcome:'fallback',code:failureCode||code,policyMs:12000,modelQualification:'NOT_VERIFIED'},financialExecution:false});
 try{
 if(baseline.outcome==='context_mismatch')return fallback('Context mismatch; model not called.','CONTEXT_CHANGED');
 if(baseline.outcome==='unsupported_question'){if(typeof onDiagnostic==='function')onDiagnostic('UNSUPPORTED_QUESTION');return fallback('Unsupported research question; model not called.','UNSUPPORTED_QUESTION');}
 if(routeQuestion(question).join(',')==='risk')return fallback('Execution or risk-only request is not eligible for model generation.');
 if(!snapshot?.fresh){if(typeof onDiagnostic==='function')onDiagnostic('CONTEXT_CHANGED');return fallback('Fresh, matched source evidence required; no model called.','CONTEXT_CHANGED');}
 if(typeof provider!=='function')return fallback('Model provider unavailable; deterministic evidence retained.');
  validateLocalSnapshot(snapshot,now());
  signal?.throwIfAborted();
  const result=await deadline.run(()=>provider(snapshot,question,{authorization,language,signal:deadline.signal,history:structuredClone(history),deadline,timing:metrics}));
  signal?.throwIfAborted();
  validateLocalSnapshot(snapshot,now());
  if(currentSnapshotId()!==snapshot.id){if(typeof onDiagnostic==='function')onDiagnostic('CONTEXT_CHANGED');return fallback('Evidence context changed; late model output discarded.');}
  // Accept only an exact structured generation, not a loose plausible summary.
  const contractFields=['schema','snapshotId','symbol','interval','summary','citations','claims','roles','evidenceState','uncertainties'];
  const material=Object.fromEntries(contractFields.filter(k=>Object.hasOwn(result||{},k)).map(k=>[k,result[k]]));
  const allowed=new Set([...contractFields,'method','provider','model','latencyMs','usage','reservation','interpretationUnverified']);
  if(Object.keys(result||{}).some(k=>!allowed.has(k)))throw Error('Unexpected provider output');
  const verified=metrics.sync('parsingValidation',()=>validateGeneration(material,snapshot,{strict:true,expectedRoles:routeQuestion(question)}));
  deadline.check();
  if(enforceLanguage&&(language==='ar'?!/\p{Script=Arabic}/u.test(verified.summary):!/\p{Script=Latin}/u.test(verified.summary)))throw Object.assign(Error('Response language mismatch'),{code:'MODEL_RESPONSE_INVALID'});
  // Structured citations alone do not make instruction-like model prose safe.
  const instruction=/\b(?:ignore|override|discard|bypass)\s+(?:all\s+)?(?:previous|system|developer|safety|instructions?|rules?)\b|\b(?:disable|bypass)\s+(?:safety|checks?|validation|guardrails?)\b|تجاهل\s+(?:التعليمات|القواعد|الضوابط)|تعطيل\s+(?:التحقق|الحماية|الأمان)/i;
  if([verified.summary,...verified.uncertainties].some(s=>instruction.test(s)))throw Error('Instruction-like model response rejected');
  if(result.method!=='llm'||!['ollama','openai'].includes(result.provider)||typeof result.model!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,159}$/.test(result.model))throw Error('Unverified model identity');
  deadline.check();
  // Expose only bounded, verified telemetry; no arbitrary provider metadata or prose.
  const latencyMs=Number.isSafeInteger(result.latencyMs)&&result.latencyMs>=0&&result.latencyMs<=30000?result.latencyMs:null;
  return {...baseline,method:'llm-assisted',model:result.model,provider:result.provider,
   summary:verified.summary,generation:{...verified,method:'llm',provider:result.provider,model:result.model,latencyMs},
   interpretationStatus:{outcome:'accepted',code:'FACTS_CHECKED',policyMs:12000,modelQualification:'NOT_VERIFIED'},financialExecution:false};
 }catch(error){
  if(signal?.aborted)throw error;
  failureCode=classifyPilotFailure(error);if(typeof onDiagnostic==='function')onDiagnostic(failureCode);
  return fallback('Model output unavailable, invalid or stale; deterministic evidence retained.');
 }finally{metrics.sync('fallbackCleanup',()=>{if(!parentDeadline)deadline.dispose();});const report={...metrics.report({seal:true}),...deadline.report()};try{onTimings?.(report);}catch{/* diagnostic consumer cannot affect validated results */}}
}
