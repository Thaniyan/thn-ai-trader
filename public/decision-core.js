/* Shared deterministic interpretation. Labels are criteria, never future probabilities. */
export const ANALYSIS_VERSION='6.4.0';
export function researchQuality(evaluation){
  if(!evaluation)return {label:'insufficient',criteriaVersion:'6.4-Q1',checks:[],probability:null};
  const e=evaluation,a=e.development.metrics,b=e.holdout.metrics;
  const checks=[
    ['trade_count',a.trades>=e.split.minimumTrades&&b.trades>=e.split.minimumTrades],
    ['holdout_positive',b.returnPct>0&&b.expectancy>0],
    ['development_positive',a.returnPct>0&&a.expectancy>0],
    ['expectancy_retained',a.averageR!=null&&b.averageR!=null&&b.averageR>=a.averageR],
    ['cost_robustness',e.sensitivity.filter(v=>v.kind!=='parameter').length===3&&e.sensitivity.filter(v=>v.kind!=='parameter').every(v=>v.holdout.metrics.returnPct>0&&v.development.metrics.returnPct>0)],
    ['parameter_robustness',e.sensitivity.filter(v=>v.kind==='parameter').length>=2&&e.sensitivity.filter(v=>v.kind==='parameter').every(v=>v.holdout.metrics.returnPct>0&&v.development.metrics.returnPct>0)],
    ['walk_consistency',e.walkForward.available&&e.walkForward.summary.positiveFolds===3&&e.walkForward.folds?.every(f=>f.holdout.metrics.trades>=e.split.minimumTrades)],
    ['concentration',b.largestTradeAbsolutePnlSharePct!=null&&b.largestTradeAbsolutePnlSharePct<=40&&b.largestTradeRiskSharePct<=25],
    ['coverage',e.dataset.status==='recent'&&!e.dataset.gapCount&&!e.dataset.discardedRows],
    ['defined_metrics',b.profitFactor!=null&&b.sharpePerBar!=null&&b.averageR!=null]
  ].map(([code,pass])=>({code,pass:Boolean(pass)}));
  const sufficient=checks[0].pass,positive=checks[1].pass;
  const label=!sufficient?'insufficient':!positive?'limited':checks.every(c=>c.pass)?'consistent':'mixed';
  return {label,criteriaVersion:'6.4-Q1',checks,probability:null,warnings:[...e.warnings,'holdout_reuse_bias'],period:{...e.split},datasetHash:e.dataset.hash};
}
export function buildBrief(series,mtf,symbol,interval){
  const frames=mtf.frames.map(f=>f.available?{interval:f.interval,available:true,trend:f.trend,close:f.close,ema20:f.ema20,ema50:f.ema50,rsi:f.rsi,atr:f.atr,atrPct:f.atrPct,support:f.support,resistance:f.resistance,lastStructure:f.lastStructure,provenance:f.provenance}:{interval:f.interval,available:false,code:f.code});
  const claims=frames.filter(f=>f.available).map(f=>({id:'frame-'+f.interval,kind:'deterministic',interval:f.interval,trend:f.trend,source:f.provenance.source,providerSymbol:f.provenance.providerSymbol,datasetHash:f.provenance.hash,time:f.provenance.lastTime,status:f.provenance.status,inputs:{close:f.close,ema20:f.ema20,ema50:f.ema50,rsi14:f.rsi,atr14:f.atr},rule:'EMA20/50 + closed close; Wilder RSI14/ATR14; previous 20 bars exclude current bar'}));
  const selected=series?{provenance:series.provenance,lastCandle:series.candles.at(-1),events:series.events.slice(-12)}:null;
  const recent=frames.filter(f=>f.available&&f.provenance.status==='recent');
  const directional=recent.filter(f=>f.trend!=='neutral');
  const conflicting=new Set(directional.map(f=>f.trend)).size>1;
  const scenarios=mtf.scenarios.map(s=>({...s,actionable:false,readyForPlanning:s.direction!=='neutral'&&mtf.complete&&s.evidence.length>0&&Number.isFinite(s.trigger)&&Number.isFinite(s.invalidation)&&(s.direction==='bullish'?s.invalidation<s.trigger:s.invalidation>s.trigger),invalidationRule:s.direction==='bullish'?'closed_below_invalidation':s.direction==='bearish'?'closed_above_invalidation':'wait_for_complete_nonconflicting_evidence',evidenceRefs:(s.evidence||[]).map(v=>'frame-'+v),opposingRefs:(s.opposing||[]).map(v=>'frame-'+v)}));
  return {version:ANALYSIS_VERSION,method:'deterministic',symbol,interval,asOf:mtf.asOf,selected,frames,claims,scenarios,complete:mtf.complete,conflicting,
    supporting:recent.filter(f=>f.trend==='bullish').map(f=>'frame-'+f.interval),contradictory:recent.filter(f=>f.trend==='bearish').map(f=>'frame-'+f.interval),
    unavailable:['news','sentiment','economic_calendar','generative_narrative'],warnings:[...(!mtf.complete?['incomplete_frames']:[]),...(conflicting?['conflicting_frames']:[]),...(!series?['selected_history_unavailable']:[]),'heuristic_structure','no_prediction','stop_not_guaranteed'],narrative:null};
}
