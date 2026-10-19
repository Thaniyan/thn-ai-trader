import {webcrypto} from 'node:crypto';
import {cleanReport} from '../public/decision-records.js';
import {verifySnapshot} from '../public/library-core.js';
import {replayEngine,REPLAY_ENGINE,recordedDifferences} from '../public/replay-contract.js';
import {evaluateResearch} from './evaluation.js';
import {researchError,prepareSeries,INTERVAL_MS} from './research.js';
const error=(code,message,status=422)=>researchError(code,message,status);
function validateMetrics(metrics){
  let nodes=0;const check=(v,depth=0)=>{if(++nodes>300||depth>5)throw error('INVALID_REPLAY_REPORT','Saved metrics exceed bounded shape.',400);if(Array.isArray(v)){if(v.length>10)throw error('INVALID_REPLAY_REPORT','Too many metric contributors.',400);v.forEach(x=>check(x,depth+1));}else if(v&&typeof v==='object'){if(Object.keys(v).length>60)throw error('INVALID_REPLAY_REPORT','Too many metric fields.',400);Object.values(v).forEach(x=>check(x,depth+1));}else if(typeof v==='string'&&v.length>200)throw error('INVALID_REPLAY_REPORT','Invalid metric string.',400);};check(metrics);

  if(!metrics||!Number.isInteger(metrics.trades)||metrics.trades<0||metrics.trades>10000||!Number.isFinite(metrics.returnPct)||!Number.isFinite(metrics.maxDrawdownPct))throw error('INVALID_REPLAY_REPORT','Saved outcome metrics are incomplete or malformed.',400);
}
export async function reproduceReport(input,isCancelled=()=>false){
  let report;try{report=cleanReport(input?.report);}catch{throw error('INVALID_REPLAY_REPORT','A valid research report is required.',400);}
  if(replayEngine(report)!==REPLAY_ENGINE)throw error('UNSUPPORTED_REPLAY_ENGINE','The saved evaluator version is unsupported.');
  const saved=report.quantitative;
  if(!saved?.parameters||!saved.split)throw error('MISSING_REPLAY_RESEARCH','The report has no quantitative evaluation.');
  validateMetrics(saved.development);validateMetrics(saved.holdout);
  if(!Number.isFinite(saved.split.trainFraction)||saved.split.trainFraction<.5||saved.split.trainFraction>.8||!Number.isInteger(saved.split.minimumTrades)||saved.split.minimumTrades<5||saved.split.minimumTrades>100||['startIndex','splitIndex','endIndexExclusive','developmentLastTime','holdoutFirstTime'].some(k=>!Number.isFinite(saved.split[k])))throw error('INVALID_REPLAY_REPORT','Saved chronological split is incomplete.',400);
  if(!input.snapshot)throw error('MISSING_REPLAY_SNAPSHOT','Exact historical candles were not retained. Fresh provider data will not be substituted.');
  let snapshot;try{snapshot=await verifySnapshot(input.snapshot,webcrypto);}catch{throw error('SNAPSHOT_INTEGRITY_FAILURE','Snapshot shape, OHLCV or SHA-256 verification failed.');}
  if(snapshot.hash!==report.brief.selected.provenance.hash||snapshot.symbol!==report.symbol||snapshot.interval!==report.interval)throw error('REPLAY_DATASET_MISMATCH','The snapshot does not belong to this instrument, interval and dataset.');
  if(isCancelled())throw error('REPLAY_INTERRUPTED','Replay request was interrupted.',499);
  let derived;try{derived=prepareSeries({candles:snapshot.candles,interval:snapshot.interval,source:snapshot.provenance.source,providerSymbol:snapshot.provenance.providerSymbol,currency:snapshot.provenance.currency,marketTime:snapshot.provenance.providerTime},snapshot.interval,snapshot.candles.at(-1).time+INTERVAL_MS[snapshot.interval]);}catch{throw error('SNAPSHOT_INTEGRITY_FAILURE','Snapshot candle cadence does not match its declared interval.');}

  const result=evaluateResearch({candles:snapshot.candles,provenance:snapshot.provenance},snapshot.symbol,saved.parameters,{trainFraction:saved.split.trainFraction,minimumTrades:saved.split.minimumTrades});
  const differences=[...recordedDifferences(saved.development,result.development.metrics,'development'),...recordedDifferences(saved.holdout,result.holdout.metrics,'holdout')];
  const windows=['startIndex','splitIndex','endIndexExclusive','developmentLastTime','holdoutFirstTime',...['developmentFirstTime','holdoutLastTime'].filter(k=>Object.hasOwn(saved.split,k))];
  for(const field of windows)if(saved.split[field]!==result.split[field])differences.push({window:'boundaries',field,stored:saved.split[field]??null,recomputed:result.split[field],delta:Number.isFinite(saved.split[field])?result.split[field]-saved.split[field]:null});
  const chart=input.includeChart===true?{symbol:snapshot.symbol,candles:derived.candles,indicators:derived.indicators,events:derived.events.slice(-200),provenance:{...snapshot.provenance,status:'saved'}}:null;
  return {ok:true,chart,status:differences.length?'mismatch':'reproduced',engineVersion:REPLAY_ENGINE,snapshotHash:snapshot.hash,imported:Boolean(report.imported),sourceAuthenticity:'Unverified: content integrity does not authenticate provider provenance or imported outcomes.',differences,stored:{development:saved.development,holdout:saved.holdout,split:saved.split},recomputed:{development:result.development.metrics,holdout:result.holdout.metrics,split:result.split},limits:result.limits,providerFetched:false,financialMutation:false};
}
