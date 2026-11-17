import {committee,routeQuestion} from './intelligence.js';
import {validateGeneration} from '../public/intelligence-generation.js';
import {validateLocalSnapshot} from './intelligence-local.js';

const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};

// Phase-2 opt-in interpretation boundary; caller injects provider, no network here.
// Deterministic evidence is always authoritative and is never modified by a model.
export async function interpretVerifiedEvidence({
 snapshot,question,provider,authorization,language='en',signal,history=[],
 now=Date.now,currentSnapshotId=()=>snapshot?.id,timeoutMs=12000
}={}){
 // Providers receive a frozen private copy, never the caller's authoritative record.
 snapshot=freeze(structuredClone(snapshot));
 const baseline=committee(snapshot,question,language);
 let timer,abort;
 const controller=new AbortController();
 const fallback=reason=>({...baseline,method:'deterministic',model:null,provider:null,
  generation:null,providerFallback:reason,financialExecution:false});
 if(baseline.outcome==='context_mismatch')return fallback('Context mismatch; model not called.');
 if(routeQuestion(question).join(',')==='risk')return fallback('Execution or risk-only request is not eligible for model generation.');
 if(!snapshot?.fresh)return fallback('Fresh, matched source evidence required; no model called.');
 if(typeof provider!=='function')return fallback('Model provider unavailable; deterministic evidence retained.');
 try{
  validateLocalSnapshot(snapshot,now());
  signal?.throwIfAborted();
  if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('Invalid interpretation deadline');
  const interrupted=new Promise((_,reject)=>{
   abort=()=>{controller.abort(signal.reason);reject(signal.reason);};
   signal?.addEventListener('abort',abort,{once:true});
   timer=setTimeout(()=>{const error=new Error('Interpretation deadline exceeded');controller.abort(error);reject(error);},timeoutMs);
  });
  const result=await Promise.race([provider(snapshot,question,{authorization,language,signal:controller.signal,history:structuredClone(history)}),interrupted]);
  signal?.throwIfAborted();
  validateLocalSnapshot(snapshot,now());
  if(currentSnapshotId()!==snapshot.id)return fallback('Evidence context changed; late model output discarded.');
  // Accept only an exact structured generation, not a loose plausible summary.
  const contractFields=['schema','snapshotId','symbol','interval','summary','citations','claims','roles','evidenceState','uncertainties'];
  const material=Object.fromEntries(contractFields.filter(k=>Object.hasOwn(result||{},k)).map(k=>[k,result[k]]));
  const allowed=new Set([...contractFields,'method','provider','model','latencyMs','usage','reservation','interpretationUnverified']);
  if(Object.keys(result||{}).some(k=>!allowed.has(k)))throw Error('Unexpected provider output');
  const verified=validateGeneration(material,snapshot,{strict:true,expectedRoles:routeQuestion(question)});
  // Structured citations alone do not make instruction-like model prose safe.
  const instruction=/\b(?:ignore|override|discard|bypass)\s+(?:all\s+)?(?:previous|system|developer|safety|instructions?|rules?)\b|\b(?:disable|bypass)\s+(?:safety|checks?|validation|guardrails?)\b|تجاهل\s+(?:التعليمات|القواعد|الضوابط)|تعطيل\s+(?:التحقق|الحماية|الأمان)/i;
  if([verified.summary,...verified.uncertainties].some(s=>instruction.test(s)))throw Error('Instruction-like model response rejected');
  if(result.method!=='llm'||!['ollama','openai'].includes(result.provider)||typeof result.model!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,159}$/.test(result.model))throw Error('Unverified model identity');
  // Expose only bounded, verified telemetry; no arbitrary provider metadata or prose.
  const latencyMs=Number.isSafeInteger(result.latencyMs)&&result.latencyMs>=0&&result.latencyMs<=30000?result.latencyMs:null;
  return {...baseline,method:'llm-assisted',model:result.model,provider:result.provider,
   summary:verified.summary,generation:{...verified,method:'llm',provider:result.provider,model:result.model,latencyMs},
   financialExecution:false};
 }catch(error){
  if(signal?.aborted)throw error;
  return fallback('Model output unavailable, invalid or stale; deterministic evidence retained.');
 }finally{clearTimeout(timer);if(abort)signal?.removeEventListener('abort',abort);}
}
