import crypto from 'node:crypto';
import { runBacktest, normalizeParameters, numericParameter, warmupBars, parseResearchDate, validateResearchContract } from './backtest.js';
import { validateCandles, researchError } from './research.js';

function segment(series, symbol, parameters, startIndex, endIndex) {
  // A training engine never receives its subsequent test candles, even as indicator input.
  const prefix=series.candles.slice(0,endIndex);
  const out=runBacktest({...series,candles:prefix},symbol,parameters,{startIndex,endIndex});
  out.sample.inputLastTime=prefix.at(-1).time;
  out.sample.windowHash=crypto.createHash('sha256').update(JSON.stringify(prefix.slice(startIndex))).digest('hex');
  return out;
}
const brief=run=>({sample:run.sample,metrics:run.metrics,gapHandling:run.gapHandling});
function difference(train,test){return {
  returnDifferencePct:test.metrics.returnPct-train.metrics.returnPct,
  returnPerBarDifferenceBps:train.metrics.returnPerBarBps!=null&&test.metrics.returnPerBarBps!=null?test.metrics.returnPerBarBps-train.metrics.returnPerBarBps:null,
  expectancyRDifference:train.metrics.averageR!=null&&test.metrics.averageR!=null?test.metrics.averageR-train.metrics.averageR:null,
  drawdownDifferencePct:test.metrics.maxDrawdownPct-train.metrics.maxDrawdownPct
};}
export function evaluateResearch(series,symbol,input={},options={}){
  validateResearchContract(series,symbol);
  validateCandles(series.candles);
  if(series.candles.length>2000)throw researchError('RESEARCH_BUDGET_EXCEEDED','At most 2000 closed candles per evaluation.',413);
  if(!options||typeof options!=='object'||Array.isArray(options))throw researchError('INVALID_RESEARCH_PARAMETERS','Evaluation options must be an object.');
  const trainFraction=numericParameter(options,'trainFraction',.7,.5,.8);
  const minimumTrades=numericParameter(options,'minimumTrades',20,5,100,true);
  const p=normalizeParameters(input),start=parseResearchDate(input.start),end=parseResearchDate(input.end);
  if(start!=null&&end!=null&&start>=end)throw researchError('INVALID_RESEARCH_PERIOD','Start must precede end.');
  const selected=series.candles.filter(c=>end==null||c.time<=end);
  const commonWarmup=p.strategy==='breakout'?warmupBars({...p,breakoutPeriod:Math.min(100,Math.round(p.breakoutPeriod*1.25))}):warmupBars(p);
  const startIndex=Math.max(commonWarmup,start==null?0:selected.findIndex(c=>c.time>=start)<0?selected.length:selected.findIndex(c=>c.time>=start));
  const count=selected.length-startIndex,splitIndex=startIndex+Math.floor(count*trainFraction);
  if(splitIndex-startIndex<60||selected.length-splitIndex<60)throw researchError('INSUFFICIENT_VALIDATION_HISTORY','Development and holdout windows each require 60 eligible closed bars.',503);
  const dataset={...series,candles:selected};
  const base={...p,...(input.start?{start:input.start}:{}),...(input.end?{end:input.end}:{})};
  let runs=0;
  const run=(params,from,to)=>{if(++runs>18)throw researchError('RESEARCH_BUDGET_EXCEEDED','Evaluation run budget exceeded.',413);return segment(dataset,symbol,params,from,to);};
  const development=run(base,startIndex,splitIndex),holdout=run(base,splitIndex,selected.length);
  const perturbations=[];
  if(p.strategy==='ema'){
    for(const multiplier of [.8,1.2]){const fast=Math.min(p.slow-1,Math.max(2,Math.round(p.fast*multiplier)));if(fast!==p.fast&&!perturbations.some(v=>v.patch.fast===fast))perturbations.push({kind:'parameter',label:multiplier<1?'parameter_lower':'parameter_higher',patch:{fast}});}
  }else if(p.strategy==='rsi'){
    for(const change of [-5,5]){const rsiLower=Math.max(5,Math.min(45,p.rsiLower+change));if(rsiLower!==p.rsiLower)perturbations.push({kind:'parameter',label:change<0?'parameter_lower':'parameter_higher',patch:{rsiLower}});}
  }else{
    for(const multiplier of [.75,1.25]){const breakoutPeriod=Math.max(5,Math.min(100,Math.round(p.breakoutPeriod*multiplier)));if(breakoutPeriod!==p.breakoutPeriod)perturbations.push({kind:'parameter',label:multiplier<1?'parameter_lower':'parameter_higher',patch:{breakoutPeriod}});}
  }
  perturbations.push({kind:'cost',label:'higher_costs',patch:{spreadBps:Math.min(100,p.spreadBps*2+1),commissionBps:Math.min(100,p.commissionBps*2+1)}},
    {kind:'slippage',label:'higher_slippage',patch:{slippageBps:Math.min(100,p.slippageBps*2+1)}},
    {kind:'combined',label:'combined_friction',patch:{spreadBps:Math.min(100,p.spreadBps*2+1),commissionBps:Math.min(100,p.commissionBps*2+1),slippageBps:Math.min(100,p.slippageBps*2+1)}});
  const sensitivity=perturbations.map(v=>{
    const params={...base,...v.patch};
    // Use identical time boundaries; extra warmup never enters the evaluation window.
    const train=run(params,startIndex,splitIndex),test=run(params,splitIndex,selected.length);
    return {...v,parameters:params,development:brief(train),holdout:brief(test),degradation:difference(train,test)};
  });
  let walkForward={available:false,reason:'insufficient_walkforward',requiredEligibleBars:360,folds:[]};
  if(count>=360){
    const firstTest=startIndex+Math.floor(count*.5),testBars=Math.floor((selected.length-firstTest)/3),folds=[];
    for(let i=0;i<3;i++){
      const boundary=firstTest+i*testBars,last=i===2?selected.length:boundary+testBars;
      const train=run(base,startIndex,boundary),test=run(base,boundary,last);
      folds.push({fold:i+1,development:brief(train),holdout:brief(test),equity:test.equity,degradation:difference(train,test)});
    }
    const grossProfit=folds.reduce((a,f)=>a+f.holdout.metrics.grossProfit,0),grossLoss=folds.reduce((a,f)=>a+f.holdout.metrics.grossLoss,0);
    walkForward={available:true,method:'Fixed-parameter expanding development windows; disjoint subsequent tests; each run resets hypothetical capital. No parameter selection/optimization.',folds,
      summary:{folds:3,positiveFolds:folds.filter(f=>f.holdout.metrics.returnPct>0).length,totalTrades:folds.reduce((a,f)=>a+f.holdout.metrics.trades,0),meanFoldReturnPct:folds.reduce((a,f)=>a+f.holdout.metrics.returnPct,0)/3,worstFoldDrawdownPct:Math.max(...folds.map(f=>f.holdout.metrics.maxDrawdownPct)),pooledProfitFactor:grossLoss?grossProfit/grossLoss:null}};
  }
  const warnings=['manual_development_split','holdout_reuse_bias','no_optimization','hypothetical_short_contracts','no_funding_or_borrow_costs','no_guarantee'];
  if(development.metrics.trades<minimumTrades||holdout.metrics.trades<minimumTrades)warnings.push('insufficient_validation_trades');
  if(holdout.metrics.returnPct<=0)warnings.push('negative_holdout');
  const degradation=difference(development,holdout);
  if(degradation.expectancyRDifference!=null&&degradation.expectancyRDifference<0)warnings.push('expectancy_degradation');
  if(sensitivity.some(s=>s.holdout.metrics.returnPct*holdout.metrics.returnPct<0))warnings.push('sensitivity_sign_change');
  if(holdout.metrics.largestTradeAbsolutePnlSharePct>40||holdout.metrics.largestTradeRiskSharePct>25)warnings.push('concentrated_outcomes');
  if(development.gapHandling.gapCount||holdout.gapHandling.gapCount)warnings.push('gap_path_unknown');
  if(!walkForward.available)warnings.push('insufficient_walkforward');
  if(series.provenance.status==='stale')warnings.push('stale_history');
  if(series.provenance.discardedRows)warnings.push('discarded_rows');
  return {available:true,version:'6.3',engineVersion:'6.3',symbol,parameters:base,dataset:series.provenance,
    split:{developmentFirstTime:selected[startIndex].time,holdoutLastTime:selected.at(-1).time,trainFraction,minimumTrades,startIndex,splitIndex,endIndexExclusive:selected.length,developmentLastTime:selected[splitIndex-1].time,holdoutFirstTime:selected[splitIndex].time,warmupLastTime:selected[startIndex-1]?.time??null,policy:'Chronological; fixed user parameters; fresh capital/flat start per window; no inherited pending signals. Training receives no subsequent test candles.'},
    development,holdout,sensitivity,walkForward,degradation,warnings,
    evidence:{method:'deterministic',favorable:[...(holdout.metrics.returnPct>0?['positive_holdout']:[]),...(holdout.metrics.trades>=minimumTrades?['minimum_trades_met']:[])],contradictory:warnings.filter(w=>['negative_holdout','expectancy_degradation','sensitivity_sign_change','concentrated_outcomes','insufficient_validation_trades','gap_path_unknown'].includes(w)),invalidation:['parameters_changed','dataset_changed','cost_assumptions_changed','repeated_holdout_tuning'],probabilityOfProfit:null},
    limits:{maxCandles:2000,maxRuns:18,runsExecuted:runs,parameterSelection:'None; all tested variants are disclosed without ranking or choosing a winner.'}};
}
