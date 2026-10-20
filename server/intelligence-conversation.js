import crypto from 'node:crypto';
import {committee} from './intelligence.js';
import {validateLocalSnapshot} from './intelligence-local.js';
const freeze=v=>{if(v&&typeof v==='object'){for(const child of Object.values(v))freeze(child);Object.freeze(v);}return v;};
const contextKey=input=>JSON.stringify({symbol:input.symbol,interval:input.interval,expectedHash:input.expectedHash,hypotheticalPlan:input.hypotheticalPlan,evaluationParameters:input.evaluationParameters,trainFraction:input.trainFraction,minimumTrades:input.minimumTrades});
export function createConversations({provider,now=Date.now,ttl=10*60000,maxSessions=8,maxTurns=6}={}){
 const sessions=new Map();
 function expire(){for(const [id,s] of sessions)if(now()-s.createdAt>=ttl&&!s.busy)sessions.delete(id);}
 function start(snapshot,input){expire();validateLocalSnapshot(snapshot,now());if(sessions.size>=maxSessions)throw Object.assign(Error('Conversation capacity reached'),{status:429});const id=crypto.randomBytes(24).toString('hex');sessions.set(id,{snapshot:freeze(structuredClone(snapshot)),context:contextKey(input),history:[],turns:0,busy:false,createdAt:now()});return id;}
 async function respond(id,input,{authorization,signal}={}){
  expire();const s=sessions.get(id);if(!s)throw Object.assign(Error('Conversation expired; start with new evidence'),{status:409});
  if(s.context!==contextKey(input)||input.snapshotId&&input.snapshotId!==s.snapshot.id)throw Object.assign(Error('Conversation context changed'),{status:409});
  if(s.busy||s.turns>=maxTurns)throw Object.assign(Error('Conversation busy or turn ceiling reached'),{status:429});validateLocalSnapshot(s.snapshot,now());
  const result=committee(s.snapshot,input.question,input.language);if(result.outcome==='context_mismatch')return result;
  s.busy=true;s.turns++;const before=provider.stats().modelCalls;
  try{result.generation=await provider(s.snapshot,input.question,{authorization,signal,history:s.history.slice(-4),language:input.language});result.method='llm-assisted';result.summary=result.generation.summary;result.model=result.generation.model;result.provider=result.generation.provider;s.history.push({role:'user',content:input.question},{role:'assistant',content:result.summary});s.history=s.history.slice(-4);}
  catch(error){if(signal?.aborted)throw error;result.providerFallback='Generative answer unavailable or rejected; deterministic evidence retained.';}
  finally{result.modelCalls=provider.stats().modelCalls-before;s.busy=false;}
  return {...result,conversation:{id,snapshotId:s.snapshot.id,turn:s.turns,maxTurns,expiresAt:s.createdAt+ttl,debateRounds:1}};
 }
 return {start,respond,remove:id=>sessions.delete(id),count:()=>{expire();return sessions.size;}};
}
