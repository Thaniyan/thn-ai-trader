import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {validateRiskPreview,verifyRiskContext,calculateRiskPreview} from '../server/risk-preview.js';
import {calculateOrderRisk} from '../server/riskEngine.js';
import {startPackaged} from './release-runtime.mjs';
const valid={symbol:'EURUSD',side:'BUY',lots:.1,entryPrice:1.1,stopLoss:1.09,takeProfit:1.12,leverage:20};
const bad=(value,code)=>assert.throws(()=>validateRiskPreview(value),e=>e.code===code&&e.status>=400&&Boolean(e.messages.en)&&Boolean(e.messages.ar));
test('risk preview rejects null, arrays, primitives and missing/nonfinite numeric fields without coercion',()=>{
 for(const input of [null,[],true,0,'risk',{}])assert.throws(()=>validateRiskPreview(input));
 for(const field of ['lots','entryPrice','stopLoss','takeProfit','leverage'])for(const value of [null,undefined,'1',true,[],{},NaN,Infinity,-Infinity])assert.throws(()=>validateRiskPreview({...valid,[field]:value}));
 for(const field of ['entryPrice','stopLoss','takeProfit'])for(const value of [0,-1,1e10])bad({...valid,[field]:value},'INVALID_RISK_INPUT');
});
test('invalid leverage never defaults or clamps, valid original engine bounds retain exact arithmetic',()=>{
 for(const leverage of [-1,0,.5,2001])bad({...valid,leverage},'INVALID_LEVERAGE');
 for(const leverage of [1,20,200,2000])assert.deepEqual(calculateRiskPreview(validateRiskPreview({...valid,leverage})).metrics,calculateOrderRisk({...valid,leverage}));
});
test('entry binding cannot validate entryPrice but calculate against a different currentPrice',()=>{
 bad({...valid,currentPrice:1.11},'AMBIGUOUS_ENTRY');bad({...valid,currentPrice:null},'AMBIGUOUS_ENTRY');
 const current={...valid,currentPrice:1.1};delete current.entryPrice;
 assert.deepEqual(calculateRiskPreview(validateRiskPreview(current)).metrics,calculateOrderRisk(valid));
 const result=calculateRiskPreview(validateRiskPreview(valid));assert.equal(result.metrics.slDollars,100);assert.equal(result.metrics.requiredMargin,550);assert.equal(result.metrics.tpDollars,200);assert.equal(result.executionApproval,false);assert.equal(result.evidenceStatus,'manual_assumptions_only');
});
test('instrument, side, lot step and BUY/SELL protection geometry are strict',()=>{
 for(const patch of [{symbol:'EURJPY'},{symbol:'eurusd'},{symbol:[]},{side:'BUY_LIMIT'},{side:null}])bad({...valid,...patch},'UNSUPPORTED_RISK_CONTRACT');
 for(const lots of [0,-1,.015,101])bad({...valid,lots},'INVALID_VOLUME');
 for(const patch of [{stopLoss:1.1},{stopLoss:1.2},{takeProfit:1.1},{takeProfit:1.08},{side:'SELL'}])bad({...valid,...patch},'INVALID_PROTECTION_DIRECTION');
 assert.equal(calculateRiskPreview(validateRiskPreview({...valid,side:'SELL',stopLoss:1.11,takeProfit:1.08})).metrics.slDollars,100);
});
test('USD-base, metals, crypto and index numerical outputs equal authoritative engine without input mutation',()=>{
 for(const x of [{symbol:'USDJPY',entryPrice:150,stopLoss:149,takeProfit:152},{symbol:'XAUUSD',entryPrice:2000,stopLoss:1990,takeProfit:2020},{symbol:'BTCUSD',entryPrice:60000,stopLoss:59000,takeProfit:62000},{symbol:'US30',entryPrice:40000,stopLoss:39900,takeProfit:40200}]){
  const input={...valid,...x},snapshot=structuredClone(input);assert.deepEqual(calculateRiskPreview(validateRiskPreview(input)).metrics,calculateOrderRisk(input));assert.deepEqual(input,snapshot);
 }
});
const now=Date.now(),context={symbol:'EURUSD',interval:'1h',datasetId:'a'.repeat(64),dataTimestamp:now-7200000,provider:'fixture',providerSymbol:'EURUSD=X'};
const series={candles:[{}],provenance:{hash:context.datasetId,interval:context.interval,lastTime:context.dataTimestamp,source:context.provider,providerSymbol:context.providerSymbol,status:'recent'}};
test('retained evidence identities and chronology cannot be mixed or fabricated as current',()=>{
 const input=validateRiskPreview({...valid,context}),original=structuredClone(input);
 assert.equal(verifyRiskContext(input,series,now).executableQuote,false);assert.deepEqual(input,original);
 for(const [field,value] of [['hash','b'.repeat(64)],['interval','15m'],['lastTime',now-10800000],['source','other'],['providerSymbol','GBPUSD=X']])assert.throws(()=>verifyRiskContext(input,{...series,provenance:{...series.provenance,[field]:value}},now),{code:'RISK_CONTEXT_MISMATCH'});
 for(const p of [{status:'stale'},{lastTime:now}])assert.throws(()=>verifyRiskContext(input,{...series,provenance:{...series.provenance,...p}},now),{code:'STALE_RISK_CONTEXT'});
 assert.throws(()=>verifyRiskContext(input,null,now),{code:'RISK_CONTEXT_UNAVAILABLE'});
 bad({...valid,context:{...context,symbol:'GBPUSD'}},'RISK_CONTEXT_MISMATCH');
 for(const c of [null,[],{}, {...context,interval:'__proto__'},{...context,interval:['1h']},{...context,datasetId:'fake'},{...context,dataTimestamp:'today'}])bad({...valid,context:c},'INVALID_RISK_CONTEXT');
});
let runtime;before(async()=>{runtime=await startPackaged();});after(async()=>{await runtime?.stop();});
async function request(input,url=runtime.url){const r=await fetch(url+'/api/risk/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});assert.match(r.headers.get('content-type'),/application\/json/);assert.equal(r.headers.get('cache-control'),'no-store');return {status:r.status,data:await r.json()};}
test('HTTP invalid bodies, prices, leverage and context return client-safe bilingual errors, never 500',async()=>{
 for(const [input,code] of [[null,'INVALID_RISK_INPUT'],[[],'INVALID_RISK_INPUT'],[{...valid,leverage:-1},'INVALID_LEVERAGE'],[{...valid,leverage:0},'INVALID_LEVERAGE'],[{...valid,leverage:'bad'},'INVALID_RISK_INPUT'],[{...valid,entryPrice:null},'INVALID_RISK_INPUT'],[{...valid,currentPrice:1.12},'AMBIGUOUS_ENTRY'],[{...valid,stopLoss:1.2},'INVALID_PROTECTION_DIRECTION'],[{...valid,context:{}},'INVALID_RISK_CONTEXT']]){
  const r=await request(input);assert.equal(r.status,400);assert.equal(r.data.code,code);assert.ok(r.data.messages.en&&r.data.messages.ar);assert.equal(r.data.executionApproval,false);assert.doesNotMatch(JSON.stringify(r.data),/node:|\.js:\d|\/workspace/);
 }
});
test('HTTP successful preview is non-executing, exact engine output with explicit assumptions',async()=>{
 const {status,data}=await request(valid);assert.equal(status,200);assert.deepEqual(data.metrics,calculateOrderRisk(valid));assert.equal(data.assumptions.entryPrice,1.1);assert.equal(data.hypothetical,true);assert.equal(data.context,null);assert.equal(data.executionApproval,false);
});
test('HTTP contextual preview binds to actual provider series and rejects cross-market or changed retained evidence',async()=>{
 const response=await fetch(runtime.url+'/api/research/series?symbol=EURUSD&interval=1h').then(r=>r.json());assert.equal(response.ok,true);
 const p=response.provenance,c={symbol:response.symbol,interval:p.interval,datasetId:p.hash,dataTimestamp:p.lastTime,provider:p.source,providerSymbol:p.providerSymbol};
 const ok=await request({...valid,context:c});assert.equal(ok.status,200);assert.equal(ok.data.context.datasetId,p.hash);assert.equal(ok.data.context.executableQuote,false);assert.equal(ok.data.evidenceStatus,'matched_at_calculation');
 for(const patch of [{datasetId:'0'.repeat(64)},{symbol:'GBPUSD'},{dataTimestamp:c.dataTimestamp-3600000},{provider:'wrong'}]){
  const r=await request({...valid,context:{...c,...patch}});assert.equal(r.status,409);assert.equal(r.data.code,'RISK_CONTEXT_MISMATCH');
 }
});
test('HTTP stale and unavailable provider evidence fail closed without inventing replacement evidence',async()=>{
 for(const mode of ['stale','down']){
  const old=process.env.TEST_PROVIDER_MODE;process.env.TEST_PROVIDER_MODE=mode;let r;
  try{r=await startPackaged();}finally{if(old===undefined)delete process.env.TEST_PROVIDER_MODE;else process.env.TEST_PROVIDER_MODE=old;}
  try{const result=await request({...valid,context},r.url);assert.equal(result.status,mode==='stale'?409:503);assert.equal(result.data.code,mode==='stale'?'STALE_RISK_CONTEXT':'RISK_CONTEXT_UNAVAILABLE');assert.equal(result.data.executionApproval,false);}finally{await r.stop();}
 }
});
test('hypothetical preview never enables hosted account operations, live execution or cross-origin requests',async()=>{
 const r=await fetch(runtime.url+'/api/risk/calculate',{method:'POST',headers:{Origin:'https://attacker.invalid'},body:JSON.stringify(valid)});assert.equal(r.status,403);
 for(const path of ['/api/orders/execute','/api/positions/close','/api/broker/reset-sandbox'])assert.equal((await fetch(runtime.url+path,{method:'POST',body:JSON.stringify(valid)})).status,503);
 const h=await fetch(runtime.url+'/api/health').then(r=>r.json());assert.equal(h.capabilities.liveTrading,false);assert.equal(h.capabilities.paperExecution,false);
});
