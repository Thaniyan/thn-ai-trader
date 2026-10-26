import {createHash,sign,createPrivateKey} from 'node:crypto';

// Operator-local pilot only. No HTTP route imports this module and no order method exists.
const hosted=env=>['VERCEL','AWS_LAMBDA_FUNCTION_NAME','NETLIFY','K_SERVICE','CF_PAGES'].some(k=>Boolean(env[k]));
const fail=code=>Object.assign(new Error(code),{code});
const sameAccount=(value,expected)=>(typeof value==='string'||(typeof value==='number'&&Number.isSafeInteger(value)))&&String(value)===expected;
export function exnessOrigin(raw){
 let u;try{u=new URL(raw);}catch{throw fail('EXNESS_HOST_INVALID');}
 if(typeof raw!=='string'||raw!==u.origin||u.protocol!=='https:'||u.port||u.username||u.password||u.pathname!=='/'||u.search||u.hash||!/^ap-[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:trading\.)?exness\.com$/.test(u.hostname))throw fail('EXNESS_HOST_INVALID');
 return u.origin;
}
function identity(accountId,apiKey){
 if(typeof accountId!=='string'||!(/^[1-9][0-9]{0,19}$/).test(accountId)||typeof apiKey!=='string'||!(/^[A-Za-z0-9_-]{8,160}$/).test(apiKey))throw fail('EXNESS_CONFIGURATION_INVALID');
}
export function accountPaths(accountId){identity(accountId,'test-only-key');return Object.freeze({configuration:`/v1/configuration/accounts/${accountId}/account`,snapshot:`/v1/trading/accounts/${accountId}/snapshot`});}
export function signedReadHeaders({accountId,apiKey,privateKey,path,timestamp=Date.now()}){
 identity(accountId,apiKey);if(!Object.values(accountPaths(accountId)).includes(path)||!Number.isSafeInteger(timestamp)||timestamp<1)throw fail('EXNESS_REQUEST_INVALID');
 let key;try{key=privateKey?.type==='private'?privateKey:createPrivateKey(privateKey);}catch{throw fail('EXNESS_KEY_INVALID');}
 if(key.asymmetricKeyType!=='ed25519')throw fail('EXNESS_KEY_INVALID');
 const payload=Buffer.from(JSON.stringify({api_key:apiKey,idempotency_key:'',timestamp,sign_version:1,method:'GET',path,body_hash:createHash('sha256').update('').digest('base64url')}));
 return {'EXN-API-KEY':apiKey,'EXN-IDEMPOTENCY-KEY':'','EXN-TIMESTAMP':String(timestamp),'EXN-SIGN-VERSION':'1','EXN-DATA':payload.toString('base64url'),'EXN-SIGN':sign(null,payload,key).toString('base64url'),Accept:'application/json'};
}
async function boundedJSON(response,signal){
 if(!response.body||!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')||''))throw fail('EXNESS_RESPONSE_INVALID');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1048576)throw fail('EXNESS_RESPONSE_TOO_LARGE');chunks.push(Buffer.from(value));}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 catch(e){await reader.cancel().catch(()=>{});throw e?.code?e:fail('EXNESS_RESPONSE_INVALID');}finally{reader.releaseLock();}
}
export function accountSummary(configuration,snapshot,accountId,receivedAt=Date.now()){
 // Require an explicit account identity; never substitute a response from another account.
 if(!configuration||!sameAccount(configuration.account_id,accountId)||!(/^[A-Z]{3}$/).test(configuration.currency||''))throw fail('EXNESS_ACCOUNT_MISMATCH');
 if(!snapshot||!snapshot.account_state||!Array.isArray(snapshot.orders)||!Array.isArray(snapshot.positions))throw fail('EXNESS_SNAPSHOT_INVALID');
 for(const data of [snapshot,snapshot.account_state])if(data.account_id!==undefined&&!sameAccount(data.account_id,accountId))throw fail('EXNESS_ACCOUNT_MISMATCH');
 const decimal=v=>typeof v==='string'&&v.length<=60&&/^-?\d+(?:\.\d+)?$/.test(v);
 const state=snapshot.account_state;for(const key of ['balance','equity','used_margin'])if(!decimal(state[key])||(key==='used_margin'&&state[key].startsWith('-')))throw fail('EXNESS_SNAPSHOT_INVALID');
 // Keep broker monetary strings exact. No floating-point conversion, USD assumption,
 // inferred free margin, profitability classification or execution permission.
 return Object.freeze({provider:'exness',mode:'operator-local-read-only',currency:configuration.currency,balance:state.balance,equity:state.equity,usedMargin:state.used_margin,freeMargin:null,openOrderCount:snapshot.orders.length,openPositionCount:snapshot.positions.length,receivedAt:new Date(receivedAt).toISOString(),providerAsOf:null,freshness:'provider-timestamp-unverified',executionEnabled:false});
}
export function createExnessReadOnly({accountId,apiKey,privateKey,origin,env=process.env,transport=fetch,timeoutMs=8000,now=Date.now}){
 if(hosted(process.env)||hosted(env)||env.THN_EXNESS_READONLY!=='1')throw fail('EXNESS_LOCAL_OPT_IN_REQUIRED');
 identity(accountId,apiKey);const host=exnessOrigin(origin),paths=accountPaths(accountId);
 if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>10000)throw fail('EXNESS_TIMEOUT_INVALID');
 let active=false,lastRequest=-Infinity;
 async function read(path,signal){
  signal.throwIfAborted();
  const headers=signedReadHeaders({accountId,apiKey,privateKey,path,timestamp:now()});
  let response;try{response=await transport(host+path,{method:'GET',headers,redirect:'error',signal,cache:'no-store'});}catch{throw fail(signal.aborted?'EXNESS_TIMEOUT_OR_CANCELLED':'EXNESS_TRANSPORT_UNAVAILABLE');}
  if(signal.aborted){await response.body?.cancel().catch(()=>{});throw fail('EXNESS_TIMEOUT_OR_CANCELLED');}
  if(!response.ok){await response.body?.cancel().catch(()=>{});throw fail(({401:'EXNESS_AUTH_REJECTED',403:'EXNESS_PERMISSION_DENIED',404:'EXNESS_ACCOUNT_NOT_FOUND',429:'EXNESS_RATE_LIMITED'})[response.status]||'EXNESS_PROVIDER_UNAVAILABLE');}
  return boundedJSON(response,signal);
 }
 return Object.freeze({async inspect({signal}={}){
  if(active||now()-lastRequest<10000)throw fail('EXNESS_LOCAL_RATE_LIMIT');
  active=true;lastRequest=now();const bounded=signal?AbortSignal.any([signal,AbortSignal.timeout(timeoutMs)]):AbortSignal.timeout(timeoutMs);
  let abort;const cancelled=new Promise((_,reject)=>{abort=()=>reject(fail('EXNESS_TIMEOUT_OR_CANCELLED'));bounded.addEventListener('abort',abort,{once:true});});
  try{bounded.throwIfAborted();return await Promise.race([(async()=>{const configuration=await read(paths.configuration,bounded);if(!sameAccount(configuration?.account_id,accountId))throw fail('EXNESS_ACCOUNT_MISMATCH');const snapshot=await read(paths.snapshot,bounded);return accountSummary(configuration,snapshot,accountId,now());})(),cancelled]);}
  catch(error){if(bounded.aborted)throw fail('EXNESS_TIMEOUT_OR_CANCELLED');throw error?.code?error:fail('EXNESS_RESPONSE_INVALID');}finally{bounded.removeEventListener('abort',abort);active=false;}
 }});
}
