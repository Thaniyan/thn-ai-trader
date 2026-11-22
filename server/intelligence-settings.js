// Shared closed inference settings; same validator for CLI and product worker.
export function validatedPilotSettings(env){
 if(env.THN_AI_PILOT_KEEP_ALIVE!==undefined&&!['0','5m'].includes(env.THN_AI_PILOT_KEEP_ALIVE))throw Error('Invalid local pilot keep-alive');
 if(env.THN_AI_PILOT_COMPACT!==undefined&&!['0','1'].includes(env.THN_AI_PILOT_COMPACT))throw Error('Invalid local pilot compact mode');
 if(env.THN_AI_PILOT_THREADS!==undefined&&!['1','2','4'].includes(env.THN_AI_PILOT_THREADS))throw Error('Invalid local pilot thread count');
 return Object.freeze({compactPilot:env.THN_AI_PILOT_COMPACT==='1',keepAlive:env.THN_AI_PILOT_KEEP_ALIVE==='5m'?'5m':0,pilotThreads:Number(env.THN_AI_PILOT_THREADS||'1')});
}
export function safePilotSettings(value){
 return value&&typeof value.compactPilot==='boolean'&&[0,'5m'].includes(value.keepAlive)&&[1,2,4].includes(value.pilotThreads)?{compactPilot:value.compactPilot,keepAlive:value.keepAlive,pilotThreads:value.pilotThreads}:null;
}
