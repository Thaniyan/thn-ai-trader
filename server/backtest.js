import { getContractSpec, calculateRequiredMargin } from './riskEngine.js';
import { emaSeries, rsiSeries, atrSeries, validateCandles, researchError } from './research.js';

const SUPPORTED = /^(EURUSD|GBPUSD|AUDUSD|NZDUSD|USDJPY|USDCHF|USDCAD|XAUUSD|XAGUSD|USOIL|BRENT|BTCUSD|BTCUSDT|ETHUSD|ETHUSDT|SPX|NAS100|US30)$/;
function parameter(input, key, fallback, min, max, integer = false) {
  const v = input[key] === undefined || input[key] === '' ? fallback : Number(input[key]);
  if (!Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) throw researchError('INVALID_RESEARCH_PARAMETERS', `Invalid ${key}`);
  return v;
}
export function normalizeParameters(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw researchError('INVALID_RESEARCH_PARAMETERS', 'Strategy parameters must be an object.');
  const strategy = input.strategy || 'ema';
  if (!['ema', 'rsi', 'breakout'].includes(strategy)) throw researchError('INVALID_STRATEGY', 'Unsupported strategy.');
  const p = { strategy, fast: parameter(input, 'fast', 12, 2, 100, true), slow: parameter(input, 'slow', 26, 3, 200, true),
    confirmation: parameter(input, 'confirmation', 1, 1, 5, true), rsiPeriod: parameter(input, 'rsiPeriod', 14, 2, 50, true),
    rsiLower: parameter(input, 'rsiLower', 30, 5, 45), rsiUpper: parameter(input, 'rsiUpper', 65, 55, 95),
    breakoutPeriod: parameter(input, 'breakoutPeriod', 20, 5, 100, true), atrPeriod: parameter(input, 'atrPeriod', 14, 2, 50, true),
    atrMultiple: parameter(input, 'atrMultiple', 2, .5, 10), rewardRisk: parameter(input, 'rewardRisk', 2, .5, 10),
    capital: parameter(input, 'capital', 10000, 100, 100000000), riskPct: parameter(input, 'riskPct', 1, .05, 5),
    leverage: parameter(input, 'leverage', 1, 1, 20), spreadBps: parameter(input, 'spreadBps', 2, 0, 100),
    slippageBps: parameter(input, 'slippageBps', 1, 0, 100), commissionBps: parameter(input, 'commissionBps', 1, 0, 100) };
  if (p.fast >= p.slow) throw researchError('INVALID_RESEARCH_PARAMETERS', 'Fast EMA must be shorter than slow EMA.');
  return p;
}
export function summarizePerformance(trades, equity, initialCapital) {
  const profits = trades.map(t => t.netPnl), wins = profits.filter(x => x > 0), losses = profits.filter(x => x < 0);
  const grossProfit = wins.reduce((a,b)=>a+b,0), grossLoss = -losses.reduce((a,b)=>a+b,0);
  let peak = initialCapital, maxDrawdownPct = 0;
  const drawdown = equity.map(p => { peak = Math.max(peak, p.equity); const pct = (peak - p.equity) / peak * 100; maxDrawdownPct = Math.max(maxDrawdownPct, pct); return { time:p.time, drawdownPct:pct }; });
  // Bar returns are irregular across asset calendars. Do not invent an annualization factor.
  const validReturnSeries = initialCapital > 0 && equity.every(p => Number.isFinite(p.equity) && p.equity > 0);
  const returns = validReturnSeries ? equity.map((p,i) => i ? p.equity / equity[i-1].equity - 1 : p.equity / initialCapital - 1) : [];
  const mean = returns.reduce((a,b)=>a+b,0) / Math.max(1, returns.length);
  const variance = returns.length > 1 ? returns.reduce((a,b)=>a+(b-mean)**2,0)/(returns.length-1) : 0;
  const endingEquity = equity.at(-1)?.equity ?? initialCapital;
  return { trades:trades.length, wins:wins.length, losses:losses.length, breakeven:profits.filter(x=>x===0).length,
    winRate:trades.length ? wins.length / trades.length * 100 : null, grossProfit, grossLoss,
    profitFactor:grossLoss > 0 ? grossProfit / grossLoss : null, profitFactorUndefined:grossLoss === 0,
    expectancy:trades.length ? profits.reduce((a,b)=>a+b,0)/trades.length : null,
    averageR:trades.length ? trades.reduce((a,t)=>a+t.rMultiple,0)/trades.length : null,
    averageWinLossRatio:wins.length && losses.length ? (grossProfit/wins.length)/(grossLoss/losses.length) : null,
    endingEquity, returnPct:(endingEquity/initialCapital-1)*100, maxDrawdownPct,
    sharpePerBar:returns.length >= 30 && variance > 0 ? mean/Math.sqrt(variance) : null,
    sharpeAnnualized:null, sharpeNote:'Non-annualized sample Sharpe of close-to-close equity bar returns; zero risk-free rate. No calendar annualization assumed.', drawdown };
}
export function runBacktest(series, symbol, input = {}) {
  if (series.provenance.currency && series.provenance.currency !== 'USD') throw researchError('UNSUPPORTED_RESEARCH_CURRENCY', 'A USD-denominated provider series is required; stablecoin parity is not assumed.');
  if (!SUPPORTED.test(symbol)) throw researchError('UNSUPPORTED_RESEARCH_CONTRACT', 'USD-settled supported research contracts only.');
  const p = normalizeParameters(input), all = validateCandles(series.candles), spec = getContractSpec(symbol);
  const parseDate = value => { if (!value) return null; const time = Date.parse(value); if (!Number.isFinite(time)) throw researchError('INVALID_RESEARCH_PERIOD','Invalid research date.'); return time; };
  const start = parseDate(input.start), end = parseDate(input.end);
  if (start != null && end != null && start >= end) throw researchError('INVALID_RESEARCH_PERIOD','Start must precede end.');
  const candles = all.filter(c => end == null || c.time <= end);
  const warmup = Math.max(p.slow, p.rsiPeriod + 1, p.atrPeriod, p.breakoutPeriod + 1) + p.confirmation;
  if (candles.length < warmup + 30 || candles.filter((c,i)=>i>=warmup && (start==null||c.time>=start)).length < 30)
    throw researchError('INSUFFICIENT_HISTORY', 'At least 30 eligible bars after indicator warmup are required.', 503);
  const close = candles.map(c=>c.close), fast = emaSeries(close,p.fast), slow=emaSeries(close,p.slow), rsi=rsiSeries(close,p.rsiPeriod), atr=atrSeries(candles,p.atrPeriod);
  const baseUSD=/^USD[A-Z]{3}$/.test(symbol), fx = price => baseUSD ? 1/price : 1;
  const adverse = (p.spreadBps/2+p.slippageBps)/10000;
  const notional = (lots,price) => lots*spec.contractSize*(baseUSD?1:price);
  let cash=p.capital, position=null, pendingEntry=null, pendingExit=false, rejected=0;
  const trades=[],equity=[];
  function settle(rawPrice, bar, reason) {
    const exit=rawPrice*(1-adverse), fee=notional(position.lots,exit)*p.commissionBps/10000;
    const gross=(exit-position.entry)*position.lots*spec.contractSize*fx(exit);
    const net=gross-position.entryFee-fee;
    cash+=gross-fee;
    trades.push({entryTime:position.entryTime,signalTime:position.signalTime,exitTime:bar.time,entry:position.entry,exit,stop:position.stop,target:position.target,lots:position.lots,netPnl:net,grossPnl:gross,fees:position.entryFee+fee,riskAmount:position.risk,rMultiple:net/position.risk,reason});
    position=null;pendingExit=false;
  }
  for(let i=warmup;i<candles.length;i++) {
    const c=candles[i];if(start!=null && c.time<start)continue;
    if(position && pendingExit)settle(c.open,c,'signal');
    if(!position && pendingEntry) {
      const entry=c.open*(1+adverse),distance=pendingEntry.atr*p.atrMultiple;
      const desiredLots=cash*p.riskPct/100/(distance*spec.contractSize*fx(entry));
      const perLotMargin=calculateRequiredMargin({symbol,lots:1,price:entry,leverage:p.leverage});
      const feePerLot=notional(1,entry)*p.commissionBps/10000;
      const maxAffordable=cash/(perLotMargin+feePerLot);
      const lots=Number((Math.floor((Math.min(desiredLots,maxAffordable,spec.maxLot)+1e-10)/spec.lotStep)*spec.lotStep).toFixed(4));
      if(lots>=spec.minLot && entry-distance>0 && cash>0) {
        const fee=notional(lots,entry)*p.commissionBps/10000;
        position={entry,entryTime:c.time,signalTime:pendingEntry.signalTime,stop:entry-distance,target:entry+distance*p.rewardRisk,lots,risk:distance*spec.contractSize*lots*fx(entry),entryFee:fee};cash-=fee;
      } else rejected++;
      pendingEntry=null;
    }
    if(position) {
      // Conservative intrabar ordering: a stop wins when both stop and target are touched.
      if(c.open<=position.stop)settle(c.open,c,'gap_stop');
      else if(c.low<=position.stop)settle(position.stop,c,'stop');
      else if(c.high>=position.target)settle(position.target,c,'target');
    }
    let buy=false,sell=false;
    if(p.strategy==='ema') {
      const j=i-p.confirmation+1;
      buy=fast[j-1]<=slow[j-1] && Array.from({length:p.confirmation},(_,k)=>fast[j+k]>slow[j+k]).every(Boolean);
      sell=fast[i]<slow[i];
    } else if(p.strategy==='rsi') { buy=rsi[i-1]<p.rsiLower && rsi[i]>=p.rsiLower; sell=rsi[i]>=p.rsiUpper; }
    else { const prior=candles.slice(i-p.breakoutPeriod,i); buy=c.close>Math.max(...prior.map(b=>b.high)); sell=c.close<Math.min(...prior.map(b=>b.low)); }
    if(position && sell)pendingExit=true;
    if(!position && buy && atr[i]>0)pendingEntry={atr:atr[i],signalTime:c.time};
    if(i===candles.length-1 && position)settle(c.close,c,'end_of_sample');
    const floating=position ? (c.close-position.entry)*position.lots*spec.contractSize*fx(c.close) : 0;
    equity.push({time:c.time,equity:cash+floating});
  }
  const metrics=summarizePerformance(trades,equity,p.capital);
  return { available:true, symbol, parameters:p, provenance:series.provenance, sample:{firstTime:equity[0].time,lastTime:equity.at(-1).time,bars:equity.length,warmupBars:warmup},
    rules:{direction:'long_only',strategy:p.strategy==='ema'?'Confirmed fast/slow EMA crossover up; exit when fast EMA falls below slow.':p.strategy==='rsi'?'RSI crosses upward through lower threshold; exit at upper threshold.':'Close above prior N-bar highs; exit below prior N-bar lows.',entry:'Signal at closed bar; fill at next bar open. No entry on final signal without a subsequent bar.',exit:'ATR stop/target fixed at fill; strategy exit at next open; remaining position liquidated at final close.',intrabar:'Stop first when stop and target overlap; adverse gap stop at opening price.',costs:'Half spread plus slippage adversely applied per fill; commission on both notional sides.',sizing:'Floor to contract lot step, cap by risk budget, leverage/margin, contract maximum. No pyramiding.',risk:'Stops do not guarantee losses stay inside the budget when gaps and costs occur.'},
    metrics:{...metrics,drawdown:undefined},equity,drawdown:metrics.drawdown,trades,rejectedEntries:rejected,
    warnings:[...(equity.some(p=>p.equity<=0)?['nonpositive_equity']:[]),...(series.provenance.discardedRows?['discarded_rows']:[]),...(series.provenance.gapCount?['data_gaps']:[]),...(trades.length<30?['small_sample']:[]),'in_sample_only','costs_are_assumptions','no_corporate_action_adjustment','no_funding_or_borrow_costs','no_guarantee',...(series.provenance.status==='stale'?['stale_history']:[])] };
}
