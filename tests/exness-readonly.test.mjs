import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {exnessOrigin,signedReadHeaders,accountPaths,accountSummary,createExnessReadOnly} from '../server/exness-readonly.js';
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const base={accountId:'123456',apiKey:'test-only-exness-key',privateKey,origin:'https://ap-test.exness.com',env:{THN_EXNESS_READONLY:'1'}};
const configuration={account_id:123456,currency:'USD'};
const snapshot=()=>({account_id:123456,orders:[],positions:[],account_state:{balance:'1000.00000000000001',equity:'950.50',used_margin:'100.00'}});
const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
test('Exness AP host is explicit HTTPS and rejects external URLs, credentials and review-host guesses',()=>{
 for(const value of ['https://ap-test.exness.com','https://ap-abc123.trading.exness.com'])assert.equal(exnessOrigin(value),value);
 for(const value of ['http://ap-test.exness.com','https://api.exness.com','https://127.0.0.1','https://ap-test.exness.com.evil.com','https://evil.exness.com','https://ap-test.exness.com/','https://ap-test.exness.com/path','https://ap-test.exness.com?x=1','https://ap-test.exness.com#x','https://u:p@ap-test.exness.com','https://ap-test.exness.com:443','https://ap-test.exness.com:444','https://AP-test.exness.com',' https://ap-test.exness.com'])assert.throws(()=>exnessOrigin(value));
});
test('Ed25519 GET signing binds exact account path, empty body and mandatory headers',()=>{
 const path=accountPaths(base.accountId).configuration,timestamp=1773656070123,headers=signedReadHeaders({...base,path,timestamp});
 const bytes=Buffer.from(headers['EXN-DATA'],'base64url'),payload=JSON.parse(bytes);
 assert.deepEqual(payload,{api_key:base.apiKey,idempotency_key:'',timestamp,sign_version:1,method:'GET',path,body_hash:'47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU'});
 assert.equal(headers['EXN-TIMESTAMP'],String(timestamp));assert.equal(headers['EXN-IDEMPOTENCY-KEY'],'');assert.equal(headers['EXN-SIGN-VERSION'],'1');
 assert.ok(verify(null,bytes,publicKey,Buffer.from(headers['EXN-SIGN'],'base64url')));assert.ok(!headers['EXN-DATA'].includes('=')&&!headers['EXN-SIGN'].includes('='));
 const other=signedReadHeaders({...base,path,timestamp:timestamp+1});assert.notEqual(other['EXN-SIGN'],headers['EXN-SIGN']);
 for(const path of ['/v1/trading/accounts/123456/positions','/v1/payments/transfer','/v1/configuration/accounts/999/account',accountPaths(base.accountId).configuration+'?x=1'])assert.throws(()=>signedReadHeaders({...base,path}));
 assert.throws(()=>signedReadHeaders({...base,path,privateKey:generateKeyPairSync('rsa',{modulusLength:2048}).privateKey}));
});
test('account summary preserves decimal precision, rejects wrong identity and never fabricates free margin or freshness',()=>{
 const result=accountSummary(configuration,snapshot(),base.accountId,1773656070123);assert.equal(result.balance,'1000.00000000000001');assert.equal(result.currency,'USD');assert.equal(result.freeMargin,null);assert.equal(result.providerAsOf,null);assert.equal(result.executionEnabled,false);assert.ok(Object.isFrozen(result));assert.ok(!('accountId' in result));
 assert.throws(()=>accountSummary({...configuration,account_id:999},snapshot(),base.accountId));
 assert.throws(()=>accountSummary({...configuration,account_id:9007199254740992},snapshot(),'9007199254740992'));
 for(const value of [null,1000,'NaN','Infinity','1e8','<script>']){const s=snapshot();s.account_state.balance=value;assert.throws(()=>accountSummary(configuration,s,base.accountId));}
 const s=snapshot();s.account_state.account_id=999;assert.throws(()=>accountSummary(configuration,s,base.accountId));
 const negative=snapshot();negative.account_state.used_margin='-1';assert.throws(()=>accountSummary(configuration,negative,base.accountId));
});
test('local opt-in and hosting exclusions fail closed before any provider requests',()=>{
 for(const env of [{},...['VERCEL','AWS_LAMBDA_FUNCTION_NAME','NETLIFY','K_SERVICE','CF_PAGES'].map(k=>({THN_EXNESS_READONLY:'1',[k]:'1'}))])assert.throws(()=>createExnessReadOnly({...base,env}));
 assert.throws(()=>createExnessReadOnly({...base,timeoutMs:20000}));
 assert.throws(()=>createExnessReadOnly({...base,accountId:'123/../other'}));
});
test('read-only client uses two signed GETs, blocks redirects and does not retry or expose provider bodies',async()=>{
 const requests=[];const client=createExnessReadOnly({...base,transport:async(url,options)=>{requests.push({url,...options});return json(url.endsWith('/account')?configuration:snapshot());}});
 const result=await client.inspect();assert.equal(result.equity,'950.50');assert.equal(requests.length,2);assert.equal(typeof client.placeOrder,'undefined');
 for(const r of requests){assert.equal(r.method,'GET');assert.equal(r.redirect,'error');assert.equal(r.cache,'no-store');const payload=JSON.parse(Buffer.from(r.headers['EXN-DATA'],'base64url'));assert.equal(new URL(r.url).pathname,payload.path);assert.equal(payload.method,'GET');}
 await assert.rejects(client.inspect(),{code:'EXNESS_LOCAL_RATE_LIMIT'});
 for(const status of [401,403,404,429,503]){let calls=0;const client=createExnessReadOnly({...base,transport:async()=>{calls++;return new Response('provider-secret-diagnostic',{status});}});try{await client.inspect();assert.fail('must reject');}catch(e){assert.match(e.code,/^EXNESS_/);assert.ok(!e.message.includes('secret'));}assert.equal(calls,1);}
});
test('missing account fields, cross-account responses, oversized and malformed JSON are rejected',async()=>{
 for(const response of [()=>json({...configuration,account_id:999}),()=>new Response('broken',{headers:{'content-type':'application/json'}}),()=>new Response('x'.repeat(1048577),{headers:{'content-type':'application/json'}}),()=>new Response('<html>login</html>',{headers:{'content-type':'text/html'}})]){let calls=0;const client=createExnessReadOnly({...base,transport:async()=>{calls++;return response();}});await assert.rejects(client.inspect());assert.equal(calls,1);}
});
test('cancelled, concurrent and hung transports are bounded without submitting any mutations',async()=>{
 let calls=0;const client=createExnessReadOnly({...base,timeoutMs:100,transport:()=>{calls++;return new Promise(()=>{});}});const hold=setTimeout(()=>{},1000);
 try{const first=client.inspect();await assert.rejects(client.inspect(),{code:'EXNESS_LOCAL_RATE_LIMIT'});await assert.rejects(first,{code:'EXNESS_TIMEOUT_OR_CANCELLED'});assert.equal(calls,1);}finally{clearTimeout(hold);}
 const c=new AbortController();c.abort();let count=0;await assert.rejects(createExnessReadOnly({...base,transport:async()=>{count++;return json(configuration);}}).inspect({signal:c.signal}));assert.equal(count,0);
});
test('CLI missing opt-in and hosted invocation never print secrets or claim website connectivity',()=>{
 for(const env of [{THN_EXNESS_READONLY:''},{THN_EXNESS_READONLY:'1',VERCEL:'1'}]){const r=spawnSync(process.execPath,['scripts/exness-readonly.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,...env},encoding:'utf8'});assert.equal(r.status,1);const d=JSON.parse(r.stderr);assert.equal(d.code,'EXNESS_LOCAL_OPT_IN_REQUIRED');assert.equal(d.websiteConnected,false);assert.equal(d.executionEnabled,false);assert.equal(r.stdout,'');}
});
test('CLI refuses exposed or symlinked key files and unsafe destinations without sending requests',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thn-exness-test-')),filename=path.join(dir,'operator-test-key'),link=path.join(dir,'key-link');
 try{
  fs.writeFileSync(filename,privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o644});fs.chmodSync(filename,0o644);
  const env={...process.env,THN_EXNESS_READONLY:'1',EXN_PRIVATE_KEY_FILE:filename,EXN_ACCOUNT_ID:base.accountId,EXN_API_KEY:base.apiKey,EXN_ACCOUNT_ACCESS_POINT:'http://127.0.0.1'};
  const run=env=>spawnSync(process.execPath,['scripts/exness-readonly.mjs'],{cwd:new URL('..',import.meta.url),env,encoding:'utf8'});
  let r=run(env);assert.equal(r.status,1);assert.equal(JSON.parse(r.stderr).code,'EXNESS_PRIVATE_FILE_UNSAFE');
  fs.chmodSync(filename,0o600);fs.symlinkSync(filename,link);r=run({...env,EXN_PRIVATE_KEY_FILE:link});assert.equal(JSON.parse(r.stderr).code,'EXNESS_PRIVATE_FILE_UNSAFE');
  r=run(env);assert.equal(JSON.parse(r.stderr).code,'EXNESS_HOST_INVALID');assert.ok(!r.stderr.includes('PRIVATE KEY'));assert.ok(!r.stderr.includes(base.apiKey));assert.equal(r.stdout,'');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
