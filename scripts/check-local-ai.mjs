import {inspectLocalModel} from '../server/intelligence-local.js';
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--model') {
 console.error('Usage: node scripts/check-local-ai.mjs --model <installed-local-model-tag>');
 process.exitCode=1;
}else{
 const env={THN_AI_MODEL:args[1],THN_AI_OLLAMA_URL:process.env.THN_AI_OLLAMA_URL,THN_AI_CONTEXT_TOKENS:process.env.THN_AI_CONTEXT_TOKENS||'4096'};
 try{
  const result=await inspectLocalModel(env);
  console.log(JSON.stringify({purpose:'Read-only local Ollama readiness; no inference, download or execution',...result},null,2));
 }catch{
  console.error(JSON.stringify({installed:false,generationTested:false,code:'LOCAL_MODEL_NOT_READY',next:'Check that Ollama is running on the existing allowlisted loopback endpoint and that the supplied non-cloud model is installed. See docs/LOCAL-AI-RESEARCH.md.'},null,2));process.exitCode=1;
 }
}
