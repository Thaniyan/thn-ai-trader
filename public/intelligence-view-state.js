import {cleanCommittee} from './intelligence-memory.js';

// Presentation admission only. No decision, price or position-size calculations.
export function admitInterpretation(result,context,{generative=false,saved=false}={}){
 const checked=cleanCommittee(result);
 if(!saved&&(checked.unverified||checked.snapshot.symbol!==context?.symbol||checked.snapshot.interval!==context?.interval||!context?.expectedHash||checked.snapshot.selectedHash!==context.expectedHash))throw Error('Research response does not match selected evidence');
 if(result.method==='llm-assisted'&&(!generative||result.provider!=='ollama'||result.model!==checked.generation?.model||result.summary!==checked.generation?.summary))throw Error('Unrequested or unverified model interpretation');
 if(result.method==='llm-assisted'&&context?.language&&(context.language==='ar'?!/\p{Script=Arabic}/u.test(result.summary):!/\p{Script=Latin}/u.test(result.summary)))throw Error('Model response language mismatch');
 if(result.method==='deterministic'&&result.generation)throw Error('Ambiguous interpretation method');
 return result;
}
export function interpretationView({result,phase,requestSignature,resultSignature,signature,language,resultLanguage,now=Date.now()}){
 const matched=!!(result&&!result.unverified&&resultSignature===signature&&resultLanguage===language&&result.snapshot?.asOf<=now&&now-result.snapshot.asOf<=600000);
 const current=matched&&phase==='ready';
 return {phase:phase==='loading'&&requestSignature===signature?'loading':result&&!matched?'stale':phase,current,result:current?structuredClone(result):null};
}
