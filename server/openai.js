import crypto from 'node:crypto';
const cache=new Map();let active=0,windowStart=Date.now(),requests=0;
let observed={verified:false,state:'NOT_TESTED'};
export function openaiReadiness(){return {configured:Boolean(process.env.OPENAI_API_KEY),...observed,activeRequests:active,requestLimitPerMinute:5,numericLevelsMutable:false}}
export function validateNarrative(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!['aiNarrative','professionalActionPlan','extraWarnings'].includes(key))||typeof value.aiNarrative!=='string'||!value.aiNarrative.length||value.aiNarrative.length>4000)throw Error('Invalid narrative schema');
  for(const key of ['professionalActionPlan','extraWarnings'])if(!Array.isArray(value[key])||value[key].length>6||value[key].some(x=>typeof x!=='string'||x.length>500))throw Error('Invalid narrative schema');
  return value;
}
export async function enhanceWithOpenAI(analysis,user){
  if(!process.env.OPENAI_API_KEY)return {...analysis,aiStatus:'DISABLED'};
  if(!user)return {...analysis,aiStatus:'LOGIN_REQUIRED'};
  const context={symbol:analysis.symbol,decision:analysis.decision,confidenceType:analysis.confidenceType,indicators:analysis.indicators,entry:analysis.entry,stopLoss:analysis.stopLoss,targets:analysis.targets,warnings:analysis.warnings,provenance:analysis.provenance};
  const key=crypto.createHash('sha256').update(JSON.stringify(context)).digest('hex');
  const hit=cache.get(key);if(hit&&Date.now()-hit.time<60000)return {...analysis,...hit.narrative,aiStatus:'VERIFIED_CACHED'};
  if(Date.now()-windowStart>=60000){windowStart=Date.now();requests=0}
  if(active>=2||requests>=5)return {...analysis,aiStatus:'RATE_LIMITED',warnings:['Narrative budget reached; local analysis retained',...analysis.warnings]};
  active++;requests++;
  try{
    const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',max_completion_tokens:700,temperature:0.25,response_format:{type:'json_schema',json_schema:{name:'narrative',strict:true,schema:{type:'object',additionalProperties:false,properties:{aiNarrative:{type:'string'},professionalActionPlan:{type:'array',items:{type:'string'}},extraWarnings:{type:'array',items:{type:'string'}}},required:['aiNarrative','professionalActionPlan','extraWarnings']}}},messages:[{role:'system',content:'Provide cautious educational narrative only. Confluence is heuristic, not a probability. Do not promise profitability or change numeric levels. Return the requested JSON schema.'},{role:'user',content:JSON.stringify(context)}]})});
    if(!response.ok)throw Error('OpenAI HTTP '+response.status);
    const completion=await response.json();const parsed=validateNarrative(JSON.parse(completion.choices?.[0]?.message?.content));
    const narrative={aiNarrative:parsed.aiNarrative,professionalActionPlan:parsed.professionalActionPlan,warnings:[...analysis.warnings,...parsed.extraWarnings].slice(0,12)};
    if(cache.size>=50)cache.delete(cache.keys().next().value);cache.set(key,{time:Date.now(),narrative});observed={verified:true,state:'READY',observedAt:Date.now()};
    return {...analysis,...narrative,aiStatus:'VERIFIED'};
  }catch(error){observed={verified:false,state:'FAILED',observedAt:Date.now(),reason:error.message};return {...analysis,aiStatus:'FAILED',warnings:['OpenAI narrative unavailable; local numeric analysis retained',...analysis.warnings]}}
  finally{active--}
}
