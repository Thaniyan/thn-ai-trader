// Monotonic, request-scoped diagnostics. Only fixed names and bounded numbers leave this module.
export const INFERENCE_STAGES=['inventory','construction','generation','parsingValidation','fallbackCleanup'];
const LIMIT=86400000;
const bounded=v=>Number.isFinite(v)?Math.min(LIMIT,Math.max(0,Math.round(v))):null;
export function inferenceTimeout(){return Object.assign(new Error('Interpretation deadline exceeded'),{code:'TIMEOUT',name:'TimeoutError'});}
export function createInferenceTiming({clock=()=>performance.now(),onStage=null}={}){
 const start=clock(),entries=new Map();let sealed=false,clipped=false;
 const safe=v=>{if(!Number.isFinite(v)||v<0||v>LIMIT)clipped=true;return bounded(v);};
 const notify=(stage,state)=>{try{onStage?.({stage,state,atMs:safe(clock()-start)});}catch{/* diagnostics cannot change authority */}};
 function begin(stage){if(!INFERENCE_STAGES.includes(stage))throw Error('Unknown timing stage');if(sealed)return()=>{};const entry=entries.get(stage)||{duration:0,active:null,count:0};if(entry.active!==null)throw Error('Nested timing stage');entry.active=clock();entry.count++;entries.set(stage,entry);notify(stage,'started');return()=>{if(sealed)return;entry.duration+=Math.max(0,clock()-entry.active);entry.active=null;notify(stage,'settled');};}
 return {clock,start,begin,
  async measure(stage,operation){const end=begin(stage);try{return await operation();}finally{end();}},
  sync(stage,operation){const end=begin(stage);try{return operation();}finally{end();}},
  report({seal=false}={}){const at=clock();const stages=Object.fromEntries(INFERENCE_STAGES.map(name=>{const e=entries.get(name);return [name,{elapsedMs:e?safe(e.duration+(e.active===null?0:at-e.active)):null,state:!e?'not_started':e.active!==null?'unsettled':'settled',count:e?.count||0}];}));const result={elapsedMs:safe(at-start),stages,timingClipped:clipped};if(seal)sealed=true;return result;}
 };
}
export function createInferenceDeadline({timeoutMs=12000,signal,clock=()=>performance.now()}={}){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>12000)throw Error('Invalid interpretation deadline');
 const start=clock(),controller=new AbortController();if(!Number.isFinite(start))throw Error('Invalid monotonic clock');let observed=null,reject,last=start;
 const read=()=>{const value=clock();if(!Number.isFinite(value)||value<last)throw Error('Invalid monotonic clock');last=value;return value;};
 const interrupted=new Promise((_,r)=>reject=r);interrupted.catch(()=>{});
 const expire=()=>{let error;try{if(observed===null)observed=Math.max(0,read()-start);error=inferenceTimeout();}catch{error=Error('Invalid monotonic clock');}controller.abort(error);reject(error);};
 const abort=()=>{controller.abort(signal.reason);reject(signal.reason);};
 signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const timer=setTimeout(expire,timeoutMs);
 function check(){if(read()-start>=timeoutMs){expire();throw inferenceTimeout();}controller.signal.throwIfAborted();}
 return {signal:controller.signal,timeoutMs,start,
  check,remaining:()=>Math.max(0,timeoutMs-(read()-start)),
  async run(operation){check();const result=await Promise.race([Promise.resolve(operation()),interrupted]);check();return result;},
  report(){let elapsed;try{elapsed=Math.max(0,read()-start);}catch{return {policyMs:timeoutMs,requestElapsedMs:null,deadlineExceeded:observed!==null,deadlineObservedMs:bounded(observed),settlementOverrunMs:null,timingClipped:true};}const over=elapsed>=timeoutMs;return {policyMs:timeoutMs,requestElapsedMs:bounded(elapsed),deadlineExceeded:over||observed!==null,deadlineObservedMs:observed===null?null:bounded(observed),settlementOverrunMs:bounded(Math.max(0,elapsed-timeoutMs)),timingClipped:elapsed>LIMIT};},
  dispose(){clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 };
}
