import {committee,routeQuestion} from './intelligence.js';
import {validateGeneration} from '../public/intelligence-generation.js';
import {validateLocalSnapshot} from './intelligence-local.js';

// Phase-2 opt-in interpretation boundary; caller injects provider, no network here.
// Deterministic evidence is always authoritative and is never modified by a model.
export async function interpretVerifiedEvidence({
 snapshot,question,provider,authorization,language='en',signal,history=[],
 now=Date.now,currentSnapshotId=()=>snapshot?.id
}={}){
 const baseline=committee(snapshot,question,language);
 const fallback=reason=>({...baseline,method:'deterministic',model:null,provider:null,
  generation:null,providerFallback:reason,financialExecution:false});
 if(baseline.outcome==='context_mismatch')return fallback('Context mismatch; model not called.');
 if(routeQuestion(question).join(',')==='risk')return fallback('Execution or risk-only request is not eligible for model generation.');
 if(!snapshot?.fresh)return fallback('Fresh, matched source evidence required; no model called.');
 if(typeof provider!=='function')return fallback('Model provider unavailable; deterministic evidence retained.');
 try{
  validateLocalSnapshot(snapshot,now());
  signal?.throwIfAborted();
  const result=await provider(snapshot,question,{authorization,language,signal,history});
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
  if(result.method!=='llm'||!['ollama','openai'].includes(result.provider)||typeof result.model!=='string'||!result.model.length)throw Error('Unverified model identity');
  return {...baseline,method:'llm-assisted',model:result.model,provider:result.provider,
   summary:verified.summary,generation:{...verified,method:'llm',provider:result.provider,model:result.model},
   financialExecution:false};
 }catch(error){
  if(signal?.aborted)throw error;
  return fallback('Model output unavailable, invalid or stale; deterministic evidence retained.');
 }
}
