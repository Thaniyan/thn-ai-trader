import {evidenceSnapshot,routeQuestion} from '../server/intelligence.js';
import {evidenceState} from '../public/intelligence-generation.js';
export const pilotEnv={THN_AI_ENABLED:'1',THN_AI_PROVIDER:'ollama',THN_AI_AUTH_TOKEN:'test-only-operator-token',THN_AI_MODEL:'fixture:local',THN_AI_MAX_REQUESTS:'12',THN_AI_TOTAL_TOKEN_CEILING:'50000',THN_AI_MAX_OUTPUT_TOKENS:'200',THN_AI_CONTEXT_TOKENS:'8192'};
export function pilotSnapshot(now=Date.now()){
 return evidenceSnapshot({symbol:'EURUSD',interval:'1h',asOf:now,selected:{provenance:{hash:'2'.repeat(64)},events:[]},frames:['15m','1h','1d'].map((interval,i)=>({interval,available:true,trend:i===2?'bearish':'bullish',close:1.1,ema20:1.09,provenance:{source:'FROZEN SYNTHETIC FIXTURE',providerSymbol:'EURUSD=X',hash:String(i+1).repeat(64),lastTime:now-86400000,status:'recent'}}))});
}
export function pilotAnswer(snapshot,question='Analyze'){
 return {schema:'THN-GENERATION-7.1',snapshotId:snapshot.id,symbol:snapshot.symbol,interval:snapshot.interval,summary:'Evidence conflicts; consider the opposing interpretation.',citations:['frame-1h'],claims:[{reference:'frame-1h',field:'close',value:1.1}],roles:routeQuestion(question),evidenceState:evidenceState(snapshot),uncertainties:['Historical observations cannot establish future outcomes.']};
}
export function mockRuntime(snapshot,{answer,chat,seen=[]}={}){
 return async(endpoint,path,options)=>{
  seen.push({endpoint,path,body:options?.body});
  if(path==='/api/tags')return {models:[{name:pilotEnv.THN_AI_MODEL,digest:'a'.repeat(64),size:100000000}]};
  if(path==='/api/show')return {model_info:{'general.architecture':'fixture'},capabilities:['completion']};
  if(path==='/api/chat')return chat?chat(options):{model:pilotEnv.THN_AI_MODEL,done:true,message:{role:'assistant',content:JSON.stringify(answer||pilotAnswer(snapshot))},prompt_eval_count:100,eval_count:40};
  throw Error('Unexpected mock path');
 };
}
