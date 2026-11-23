// One selected-context handoff, reusing the existing audit. No new provider,
// inference, planner, order, source-anomaly capture or acceptance engine.
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {auditBase,auditRequest,auditRuntime} from './audit-research-runtime.mjs';

const symbols=['EURUSD','GBPUSD','USDJPY','BTCUSD','ETHUSD','XAUUSD'];
const intervals=['15m','1h','1d'];
const pick=(v,values)=>values.includes(v)?v:null;
const count=v=>Number.isSafeInteger(v)&&v>=0&&v<=20000?v:null;
const reasons=['history_unavailable','history_stale','proxy_context','data_quality','analysis_stale','analysis_required','analysis_incomplete','incomplete_frames','conflicting_frames','neutral_consensus','signal_disagreement','pending_pullback','scenario_unavailable','confirmation_pending','plan_direction_mismatch','risk_review_required','source_identity_unverified','contract_unavailable','currency_mismatch','invalid_recorded_levels'];
const codes=['MARKET_DATA_UNAVAILABLE','INVALID_MARKET_REQUEST','INVALID_OBSERVATION_TIME','INVALID_OBSERVATION_CURRENCY','INSUFFICIENT_HISTORY','INVALID_CANDLES','INTERVAL_MISMATCH','REQUEST_TIMEOUT','RESPONSE_LIMIT','MALFORMED_RESPONSE','CONNECTION_FAILED','REQUEST_FAILED'];
const nativeSymbols=['EURUSD=X','GBPUSD=X','USDJPY=X','BTCUSDT','ETHUSDT','BTC-USD','ETH-USD','GC=F'];
function observation(p){return p?{
 source:pick(p.source,['Yahoo Finance chart data','Binance spot candles']),
 providerSymbol:pick(p.providerSymbol,nativeSymbols),quoteCurrency:pick(p.currency,['USD','JPY','USDT']),
 recordedFreshness:pick(p.status,['recent','stale','unavailable']),
 closedBars:count(p.count),gaps:count(p.gapCount),discardedRows:count(p.discardedRows),
}:null;}

export function acceptanceSummary(audit,{head,symbol,interval,analysisDecision=null}){
 if(!/^[a-f0-9]{40}$/.test(head)||!symbols.includes(symbol)||!intervals.includes(interval)||audit?.schema!=='THN-RUNTIME-AUDIT-1'||audit.samples?.length!==1)throw Error('Bounded exact-head context required');
 const sample=audit.samples[0],r=sample?.readiness;
 if(sample.symbol!==symbol||sample.interval!==interval||r?.schema!=='THN-READINESS-1'||r.context?.symbol!==symbol||r.context?.interval!==interval)throw Error('Context mismatch');
 const q=r.dataQuality;
 const publicReasons=Array.isArray(r.reasons)?r.reasons:[];
 // Closed export schema: never copy upstream text, source bodies, prices, hashes,
 // timestamps, model identities/digests, paths, prompts, credentials or answers.
 return {schema:'THN-DAY9-ACCEPTANCE-1',head,context:{symbol,interval},
  evidence:{kind:'OWNER_RUNTIME_OBSERVATION_NOT_INDEPENDENTLY_VERIFIED',realVersusSynthetic:'OWNER_ATTESTATION_REQUIRED',marketQualification:'NOT_VERIFIED',modelQualification:'NOT_VERIFIED',ticketQualification:'NOT_VERIFIED',releaseDecision:'NO_GO'},
  endpoints:Object.fromEntries(['series','brief','analysis'].map(k=>{const e=sample.endpoints?.[k];return [k,{ok:e?.ok===true,status:Number.isInteger(e?.status)&&e.status>=100&&e.status<=599?e.status:null,code:pick(e?.code,codes)}];})),
  selected:observation(r.observation),
  frames:intervals.map(i=>{const f=r.frames?.find(f=>f.interval===i);return {interval:i,available:f?.available===true,observation:observation(f?.observation)};}),
  metadata:q?.metadata?{provider:pick(q.metadata.provider,['yahoo','binance']),reportedSymbol:pick(q.metadata.reportedSymbol,nativeSymbols),product:pick(q.metadata.reportedProductType,['CURRENCY','CRYPTOCURRENCY','FUTURE','SPOT']),quoteCurrency:pick(q.metadata.reportedCurrency,['USD','JPY','USDT'])}:null,
  rejections:q?.adapter?Object.fromEntries(['missing_ohlc','nonfinite_or_nonnumeric_ohlc','nonpositive_ohlc','invalid_ohlc_geometry','other_adapter_rejection'].map(k=>[k,count(q.adapter.rejectionReasons?.[k])])):null,
  software:{phase:pick(r.phase,['loading','unavailable','analysis_required','stale','ready']),engineDecision:pick(analysisDecision,['BUY','SELL','BUY LIMIT','SELL LIMIT','WAIT']),candidateRetained:r.candidateRetained===true,
   blockers:[...new Set(publicReasons.filter(v=>reasons.includes(v)))],unknownBlockerPresent:publicReasons.some(v=>!reasons.includes(v)),sourceIdentityMatched:r.sourceIdentityMatched===true,
   risk:pick(r.risk,['unreviewed','unavailable','within_budget','over_budget','direction_mismatch']),
   // This audit has no browser session, plan, evaluator result or model response.
   browserTicketRisk:'NOT_OBSERVED',browserAiMethod:'NOT_OBSERVED',browserWithdrawal:'NOT_OBSERVED',browserWalkthrough:'NOT_VERIFIED'},
  sourceApproval:{rights:'NOT_VERIFIED',contract:'NOT_VERIFIED',calendar:'NOT_VERIFIED',independentAuthentication:'NOT_VERIFIED'},
  providerConfiguration:{available:audit.provider?.configurationAvailable===true,hostedDisabled:typeof audit.provider?.hostedDisabled==='boolean'?audit.provider.hostedDisabled:null,inferencePerformed:false},
  financialExecution:false,sourceChanged:false,eligibilityChanged:false,
 };
}

export async function ownerAcceptance(args,{git=(...a)=>execFileSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(),audit=auditRuntime,request=auditRequest}={}){
 if(args.length!==8||args[0]!=='--expected-head'||args[2]!=='--base'||args[4]!=='--symbol'||args[6]!=='--interval')throw Error('Exact arguments required');
 const [head,base,symbol,interval]=[args[1],args[3],args[5],args[7]];
 if(!/^[a-f0-9]{40}$/.test(head)||!symbols.includes(symbol)||!intervals.includes(interval))throw Error('Invalid context');
 auditBase(base);
 if(git('branch','--show-current')!=='feature/ai-evidence-interpreter-phase2-20261116'||git('rev-parse','HEAD')!==head||git('status','--porcelain=v1'))throw Error('Clean exact-head existing branch required');
 let analysisDecision=null;
 const report=await audit({base,symbols:[symbol],intervals:[interval],transport:async(url,options)=>{
  const response=await request(url,options);
  if(new URL(url).pathname==='/api/analyze'&&response.ok&&response.data?.symbol===symbol&&response.data?.timeframe===interval)analysisDecision=pick(response.data.decision,['BUY','SELL','BUY LIMIT','SELL LIMIT','WAIT']);
  return response;
 }});
 return acceptanceSummary(report,{head,symbol,interval,analysisDecision});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await ownerAcceptance(process.argv.slice(2)),null,2));}
 catch{console.error(JSON.stringify({ok:false,code:'OWNER_ACCEPTANCE_REFUSED',message:'Use the clean reviewed PR23 branch, exact expected HEAD, literal loopback application base and one supported context. No qualification is established.'}));process.exitCode=1;}
}
