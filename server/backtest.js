import { getContractSpec, calculateRequiredMargin } from './riskEngine.js';
import { emaSeries, rsiSeries, atrSeries, validateCandles, researchError, INTERVAL_MS } from './research.js';

const SUPPORTED = /^(EURUSD|GBPUSD|AUDUSD|NZDUSD|USDJPY|USDCHF|USDCAD|XAUUSD|XAGUSD|USOIL|BRENT|BTCUSD|BTCUSDT|ETHUSD|ETHUSDT|SPX|NAS100|US30)$/;
export function numericParameter(input, key, fallback, min, max, integer = false) {
  const value = input[key] === undefined || input[key] === '' ? fallback : Number(input[key]);
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value)))
    throw researchError('INVALID_RESEARCH_PARAMETERS', `Invalid ${key}`);
  return value;
}
export function normalizeParameters(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw researchError('INVALID_RESEARCH_PARAMETERS', 'Strategy parameters must be an object.');
  const strategy = input.strategy || 'ema', direction = input.direction || 'long_only', gapPolicy = input.gapPolicy || 'exit_next_open';
  if (!['ema', 'rsi', 'breakout'].includes(strategy)) throw researchError('INVALID_STRATEGY', 'Unsupported strategy.');
  if (!['long_only', 'short_only', 'long_short'].includes(direction)) throw researchError('INVALID_RESEARCH_PARAMETERS', 'Invalid direction mode.');
  if (!['exit_next_open', 'reject_gaps'].includes(gapPolicy)) throw researchError('INVALID_RESEARCH_PARAMETERS', 'Invalid gap policy.');
  const n = (key, fallback, min, max, integer = false) => numericParameter(input, key, fallback, min, max, integer);
  const p = { strategy, direction, gapPolicy, fast:n('fast',12,2,100,true), slow:n('slow',26,3,200,true),
    confirmation:n('confirmation',1,1,5,true), rsiPeriod:n('rsiPeriod',14,2,50,true), rsiLower:n('rsiLower',30,5,45), rsiUpper:n('rsiUpper',65,55,95),
    breakoutPeriod:n('breakoutPeriod',20,5,100,true), atrPeriod:n('atrPeriod',14,2,50,true), atrMultiple:n('atrMultiple',2,.5,10), rewardRisk:n('rewardRisk',2,.5,10),
    capital:n('capital',10000,100,100000000), riskPct:n('riskPct',1,.05,5), leverage:n('leverage',1,1,20),
    spreadBps:n('spreadBps',2,0,100), slippageBps:n('slippageBps',1,0,100), commissionBps:n('commissionBps',1,0,100) };
  if (p.fast >= p.slow) throw researchError('INVALID_RESEARCH_PARAMETERS', 'Fast EMA must be shorter than slow EMA.');
  return p;
}
export function warmupBars(p) { return Math.max(p.slow,p.rsiPeriod+1,p.atrPeriod,p.breakoutPeriod+1)+p.confirmation; }
export function parseResearchDate(value) {
  if (!value) return null;
  if (typeof value !== 'string' || value.length > 40 || !Number.isFinite(Date.parse(value))) throw researchError('INVALID_RESEARCH_PERIOD','Invalid research date.');
  return Date.parse(value);
}
export function validateResearchContract(series, symbol) {
  if (!SUPPORTED.test(symbol)) throw researchError('UNSUPPORTED_RESEARCH_CONTRACT','Supported USD-settled hypothetical margined contracts only.');
  const expected = /^USD[A-Z]{3}$/.test(symbol) ? symbol.slice(3) : 'USD';
  if (series.provenance.currency && series.provenance.currency !== expected)
    throw researchError('UNSUPPORTED_RESEARCH_CURRENCY',`A ${expected}-denominated provider series is required; stablecoin parity is not assumed.`);
}
export function summarizePerformance(trades, equity, initialCapital) {
  const profits=trades.map(t=>t.netPnl),wins=profits.filter(x=>x>0),losses=profits.filter(x=>x<0);
  const grossProfit=wins.reduce((a,b)=>a+b,0),grossLoss=-losses.reduce((a,b)=>a+b,0);
  let peak=initialCapital,maxDrawdownPct=0,peakTime=equity[0]?.time ?? null,largestEpisode=null;
  const drawdown=equity.map(p=>{
    if(p.equity>=peak){peak=p.equity;peakTime=p.time;}
    const pct=(peak-p.equity)/peak*100;
    if(pct>maxDrawdownPct){maxDrawdownPct=pct;largestEpisode={peakTime,troughTime:p.time,drawdownPct:pct};}
    return {time:p.time,drawdownPct:pct};
  });
  const validReturns=initialCapital>0&&equity.every(p=>Number.isFinite(p.equity)&&p.equity>0);
  const returns=validReturns?equity.map((p,i)=>p.equity/(i?equity[i-1].equity:initialCapital)-1):[];
  const mean=returns.reduce((a,b)=>a+b,0)/Math.max(1,returns.length);
  const variance=returns.length>1?returns.reduce((a,b)=>a+(b-mean)**2,0)/(returns.length-1):0;
  const endingEquity=equity.at(-1)?.equity??initialCapital,holdings=trades.map(t=>t.holdingBars).filter(Number.isFinite),durations=trades.map(t=>t.holdingMs).filter(Number.isFinite);
  const meanOf=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const absolutePnl=profits.reduce((a,b)=>a+Math.abs(b),0),sumRisk=trades.reduce((a,t)=>a+(t.riskAmount||0),0);
  const drawdownTrades=largestEpisode?trades.filter(t=>t.exitTime>=largestEpisode.peakTime&&t.exitTime<=largestEpisode.troughTime).sort((a,b)=>a.netPnl-b.netPnl).slice(0,5).map(t=>({entryTime:t.entryTime,exitTime:t.exitTime,direction:t.direction,netPnl:t.netPnl,reason:t.reason})):[];
  const sharpe=returns.length>=30&&variance>0&&Number.isFinite(variance)?mean/Math.sqrt(variance):null;
  return {trades:trades.length,wins:wins.length,losses:losses.length,breakeven:profits.filter(x=>x===0).length,
    winRate:trades.length?wins.length/trades.length*100:null,grossProfit,grossLoss,
    profitFactor:grossLoss>0?grossProfit/grossLoss:null,profitFactorUndefined:grossLoss===0,
    expectancy:meanOf(profits),averageR:meanOf(trades.map(t=>t.rMultiple)),averageWinLossRatio:wins.length&&losses.length?(grossProfit/wins.length)/(grossLoss/losses.length):null,
    averageWin:meanOf(wins),averageLoss:meanOf(losses),bestTrade:profits.length?Math.max(...profits):null,worstTrade:profits.length?Math.min(...profits):null,
    averageHoldingBars:meanOf(holdings),averageHoldingHours:durations.length?meanOf(durations)/3600000:null,
    exposurePct:equity.length?equity.filter(p=>p.exposed).length/equity.length*100:null,
    largestTradeAbsolutePnlSharePct:absolutePnl?Math.max(...profits.map(Math.abs))/absolutePnl*100:null,
    largestTradeRiskSharePct:sumRisk?Math.max(...trades.map(t=>t.riskAmount||0))/sumRisk*100:null,
    tradeDistribution:{belowMinusOneR:trades.filter(t=>t.rMultiple< -1).length,minusOneToZeroR:trades.filter(t=>t.rMultiple>= -1&&t.rMultiple<0).length,zeroToOneR:trades.filter(t=>t.rMultiple>=0&&t.rMultiple<1).length,oneRPlus:trades.filter(t=>t.rMultiple>=1).length},
    longTrades:trades.filter(t=>t.direction==='long').length,shortTrades:trades.filter(t=>t.direction==='short').length,
    endingEquity,returnPct:(endingEquity/initialCapital-1)*100,maxDrawdownPct,largestDrawdown:largestEpisode?{...largestEpisode,contributingTrades:drawdownTrades}:null,
    returnPerBarBps:endingEquity>0&&equity.length?((endingEquity/initialCapital)**(1/equity.length)-1)*10000:null,
    sharpePerBar:sharpe,sharpeAnnualized:null,
    metricReasons:{profitFactor:grossLoss===0?'no_losing_trades':null,expectancy:trades.length?null:'no_trades',winRate:trades.length?null:'no_trades',sharpePerBar:sharpe!=null?null:!validReturns?'nonpositive_equity':returns.length<30?'too_few_returns':'zero_variance'},
    sharpeNote:'Non-annualized sample Sharpe of close-to-close equity bar returns; zero risk-free rate. No calendar annualization assumed.',drawdown};
}
export function runBacktest(series, symbol, input = {}, window = {}) {
  validateResearchContract(series,symbol);
  const p=normalizeParameters(input),all=validateCandles(series.candles),spec=getContractSpec(symbol),start=parseResearchDate(input.start),end=parseResearchDate(input.end);
  if(start!=null&&end!=null&&start>=end)throw researchError('INVALID_RESEARCH_PERIOD','Start must precede end.');
  const candles=all.filter(c=>end==null||c.time<=end),warmup=warmupBars(p);
  const from=Math.max(warmup,window.startIndex??0,start==null?0:candles.findIndex(c=>c.time>=start) < 0 ? candles.length : candles.findIndex(c=>c.time>=start));
  const until=Math.min(candles.length,window.endIndex??candles.length);
  if(!Number.isInteger(from)||!Number.isInteger(until)||until-from<30)throw researchError('INSUFFICIENT_HISTORY','At least 30 eligible bars after indicator warmup are required.',503);
  const close=candles.map(c=>c.close),fast=emaSeries(close,p.fast),slow=emaSeries(close,p.slow),rsi=rsiSeries(close,p.rsiPeriod),atr=atrSeries(candles,p.atrPeriod);
  const baseUSD=/^USD[A-Z]{3}$/.test(symbol),fx=price=>baseUSD?1/price:1,adverse=(p.spreadBps/2+p.slippageBps)/10000;
  const notional=(lots,price)=>lots*spec.contractSize*(baseUSD?1:price),step=INTERVAL_MS[series.provenance.interval]||3600000;
  const gaps=[];for(let i=from+1;i<until;i++)if(candles[i].time-candles[i-1].time>step*1.5)gaps.push(i);
  if(p.gapPolicy==='reject_gaps'&&gaps.length)throw researchError('RESEARCH_GAPS_REJECTED','Strict gap policy rejects session/data gaps in this sample.',422);
  let cash=p.capital,position=null,pendingEntry=null,pendingExit=false,rejected=0,cancelledSignals=0;
  const trades=[],equity=[];
  function settle(rawPrice,bar,index,reason){
    const sign=position.sign,exit=rawPrice*(1-sign*adverse),fee=notional(position.lots,exit)*p.commissionBps/10000;
    const gross=sign*(exit-position.entry)*position.lots*spec.contractSize*fx(exit),net=gross-position.entryFee-fee;
    cash+=gross-fee;
    trades.push({direction:sign===1?'long':'short',entryTime:position.entryTime,signalTime:position.signalTime,exitTime:bar.time,entry:position.entry,exit,stop:position.stop,target:position.target,lots:position.lots,netPnl:net,grossPnl:gross,fees:position.entryFee+fee,riskAmount:position.risk,rMultiple:net/position.risk,holdingBars:index-position.entryIndex+1,holdingMs:Math.max(0,bar.time-position.entryTime),reason});
    position=null;pendingExit=false;
  }
  for(let i=from;i<until;i++){
    const c=candles[i],gap=i>from&&c.time-candles[i-1].time>step*1.5;let exposed=Boolean(position);
    if(gap){if(pendingEntry)cancelledSignals++;pendingEntry=null;if(position)settle(c.open,c,i,'data_gap_exit');}
    if(position){const crossed=position.sign===1?c.open<=position.stop:c.open>=position.stop;if(crossed)settle(c.open,c,i,'gap_stop');else if(pendingExit)settle(c.open,c,i,'signal');}
    if(!position&&pendingEntry){
      const sign=pendingEntry.sign,entry=c.open*(1+sign*adverse),distance=pendingEntry.atr*p.atrMultiple;
      const desired=cash*p.riskPct/100/(distance*spec.contractSize*fx(entry)),margin=calculateRequiredMargin({symbol,lots:1,price:entry,leverage:p.leverage}),feePerLot=notional(1,entry)*p.commissionBps/10000;
      const lots=+(Math.floor((Math.min(desired,cash/(margin+feePerLot),spec.maxLot)+1e-10)/spec.lotStep)*spec.lotStep).toFixed(4);
      const stop=entry-sign*distance,target=entry+sign*distance*p.rewardRisk;
      if(lots>=spec.minLot&&Math.min(stop,target)>0&&cash>0){const fee=notional(lots,entry)*p.commissionBps/10000;position={sign,entry,entryTime:c.time,entryIndex:i,signalTime:pendingEntry.signalTime,stop,target,lots,risk:distance*spec.contractSize*lots*fx(entry),entryFee:fee};cash-=fee;exposed=true;}else rejected++;
      pendingEntry=null;
    }
    if(position){
      const long=position.sign===1,stopHit=long?c.low<=position.stop:c.high>=position.stop,targetHit=long?c.high>=position.target:c.low<=position.target;
      if(stopHit)settle(position.stop,c,i,'stop');else if(targetHit)settle(position.target,c,i,'target');
    }
    let enterLong=false,enterShort=false,exitLong=false,exitShort=false;
    if(p.strategy==='ema'){
      const j=i-p.confirmation+1;
      enterLong=fast[j-1]<=slow[j-1]&&Array.from({length:p.confirmation},(_,k)=>fast[j+k]>slow[j+k]).every(Boolean);
      enterShort=fast[j-1]>=slow[j-1]&&Array.from({length:p.confirmation},(_,k)=>fast[j+k]<slow[j+k]).every(Boolean);
      exitLong=fast[i]<slow[i];exitShort=fast[i]>slow[i];
    }else if(p.strategy==='rsi'){
      enterLong=rsi[i-1]<p.rsiLower&&rsi[i]>=p.rsiLower;enterShort=rsi[i-1]>p.rsiUpper&&rsi[i]<=p.rsiUpper;
      exitLong=rsi[i]>=p.rsiUpper;exitShort=rsi[i]<=p.rsiLower;
    }else{const prior=candles.slice(i-p.breakoutPeriod,i),high=Math.max(...prior.map(b=>b.high)),low=Math.min(...prior.map(b=>b.low));enterLong=c.close>high;enterShort=c.close<low;exitLong=c.close<low;exitShort=c.close>high;}
    if(position&&(position.sign===1?exitLong:exitShort))pendingExit=true;
    if(atr[i]>0){if(enterLong&&p.direction!=='short_only'&&(!position||(position.sign===-1&&pendingExit)))pendingEntry={atr:atr[i],signalTime:c.time,sign:1};else if(enterShort&&p.direction!=='long_only'&&(!position||(position.sign===1&&pendingExit)))pendingEntry={atr:atr[i],signalTime:c.time,sign:-1};}
    if(i===until-1&&position)settle(c.close,c,i,'end_of_sample');
    const floating=position?position.sign*(c.close-position.entry)*position.lots*spec.contractSize*fx(c.close):0;
    equity.push({time:c.time,equity:cash+floating,exposed});
  }
  const metrics=summarizePerformance(trades,equity,p.capital);
  return {available:true,symbol,parameters:p,provenance:series.provenance,
    sample:{firstTime:equity[0].time,lastTime:equity.at(-1).time,bars:equity.length,warmupBars:warmup,startIndex:from,endIndexExclusive:until},
    rules:{direction:p.direction,strategy:p.strategy==='ema'?'Symmetric confirmed fast/slow EMA crossover; exit at opposite EMA relationship.':p.strategy==='rsi'?'Long: recover through lower RSI threshold. Short: reject through upper threshold. Exit at opposing threshold.':'Close beyond prior N-bar high/low; exit beyond opposing prior range.',entry:'Closed-bar signals; fill at next observed open. Each evaluation window starts flat with fresh hypothetical capital and no pending signals.',exit:'Fixed ATR stops/targets; strategy exits at next open; terminal positions liquidate at sample close.',intrabar:'Adverse gap stops and stop-first when stop/target overlap. Target gap improvement is not credited.',gapPolicy:p.gapPolicy,gaps:'Exit carried positions at first observed post-gap open; cancel stale pre-gap entries. Unknown intragap paths are not simulated. This can underestimate hidden adverse excursions.',shortModel:'Hypothetical margined contracts. Short proceeds are not credited to cash. No actual borrowing, financing or margin-liquidation simulation.',costs:'Half spread plus slippage adversely applied per fill; commissions on each notional side.',sizing:'Floor contract lot step; cap risk, leverage/margin and contract maximum; no pyramiding.',risk:'Costs, gaps and leverage can cause losses beyond the nominal budget.'},
    metrics:{...metrics,drawdown:undefined},equity,drawdown:metrics.drawdown,trades,rejectedEntries:rejected,
    gapHandling:{gapCount:gaps.length,cancelledSignals,forcedExits:trades.filter(t=>t.reason==='data_gap_exit').length,policy:p.gapPolicy},
    warnings:[...(equity.some(p=>p.equity<=0)?['nonpositive_equity']:[]),...(series.provenance.discardedRows?['discarded_rows']:[]),...(gaps.length?['data_gaps','gap_path_unknown']:[]),...(trades.length<30?['small_sample']:[]),'in_sample_only','costs_are_assumptions','no_corporate_action_adjustment','no_funding_or_borrow_costs','no_guarantee',...(series.provenance.status==='stale'?['stale_history']:[])]};
}
