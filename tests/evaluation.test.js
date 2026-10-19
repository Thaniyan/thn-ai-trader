import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateResearch } from '../server/evaluation.js';
import { runBacktest, summarizePerformance } from '../server/backtest.js';
const step=3600000,now=1800000000000;
function data(n=800){const candles=Array.from({length:n},(_,i)=>{const close=1.1+Math.sin(i/10)*.04+i*.000005;return {time:now-(n-i)*step,open:close-.0002,high:close+.001,low:close-.001,close,volume:100};});return {candles,provenance:{currency:'USD',interval:'1h',source:'DETERMINISTIC TEST',providerSymbol:'EURUSD=X',status:'recent',hash:'f'.repeat(64)}};}
const parameters={direction:'long_short',leverage:20,spreadBps:0,slippageBps:0,commissionBps:0};
test('chronological holdout is disjoint, starts flat and has no inherited signals',()=>{
 const r=evaluateResearch(data(),'EURUSD',parameters,{trainFraction:.7});
 assert.ok(r.development.sample.lastTime<r.holdout.sample.firstTime);
 assert.equal(r.development.sample.inputLastTime,r.split.developmentLastTime);
 assert.equal(r.holdout.equity[0].equity,parameters.capital||10000);
 for(const tr of r.holdout.trades){assert.ok(tr.signalTime>=r.holdout.sample.firstTime);assert.ok(tr.entryTime>tr.signalTime);assert.ok(tr.exitTime<=r.holdout.sample.lastTime);}
 assert.ok(r.split.warmupLastTime<r.development.sample.firstTime);
});
test('changing every future test candle cannot affect development outcomes',()=>{
 const s=data(),r=evaluateResearch(s,'EURUSD',parameters,{});
 const changed={...s,candles:s.candles.map((c,i)=>i>=r.split.splitIndex?{...c,open:c.open*1.4,high:c.high*1.4,low:c.low*1.4,close:c.close*1.4}:c)};
 const other=evaluateResearch(changed,'EURUSD',parameters,{});
 assert.deepEqual(other.development,r.development);assert.notDeepEqual(other.holdout.metrics,r.holdout.metrics);
});
test('evaluation, sensitivity and walk-forward reports are exactly reproducible',()=>assert.deepEqual(evaluateResearch(data(),'EURUSD',parameters,{}),evaluateResearch(data(),'EURUSD',parameters,{})));
test('bounded sensitivity uses identical dates and discloses all variants without ranking',()=>{
 const r=evaluateResearch(data(),'EURUSD',{...parameters,strategy:'breakout',breakoutPeriod:80,fast:2,slow:3},{});
 assert.ok(r.sensitivity.length<=5);assert.ok(r.limits.runsExecuted<=18);assert.equal(r.bestParameters,undefined);
 for(const variant of r.sensitivity){assert.equal(variant.development.sample.firstTime,r.development.sample.firstTime);assert.equal(variant.holdout.sample.firstTime,r.holdout.sample.firstTime);assert.equal(variant.holdout.sample.lastTime,r.holdout.sample.lastTime);}
});
test('each sensitivity holdout matches an independently requested engine run',()=>{
 const s=data(),r=evaluateResearch(s,'EURUSD',parameters,{});
 for(const v of r.sensitivity){const direct=runBacktest(s,'EURUSD',v.parameters,{startIndex:r.split.splitIndex,endIndex:r.split.endIndexExclusive});assert.deepEqual(v.holdout.metrics,direct.metrics);}
});
test('walk-forward tests never overlap and do not feed future prices to development',()=>{
 const r=evaluateResearch(data(),'EURUSD',parameters,{});assert.equal(r.walkForward.folds.length,3);
 let end=-Infinity;for(const fold of r.walkForward.folds){assert.ok(fold.development.sample.inputLastTime<fold.holdout.sample.firstTime);assert.ok(fold.holdout.sample.firstTime>end);end=fold.holdout.sample.lastTime;}
 assert.equal(r.walkForward.summary.totalTrades,r.walkForward.folds.reduce((a,f)=>a+f.holdout.metrics.trades,0));
});
test('short samples refuse validation or mark unavailable walk-forward rather than inventing it',()=>{
 assert.throws(()=>evaluateResearch(data(170),'EURUSD',parameters,{}),e=>e.code==='INSUFFICIENT_VALIDATION_HISTORY');
 const r=evaluateResearch(data(300),'EURUSD',parameters,{});assert.equal(r.walkForward.available,false);assert.equal(r.walkForward.reason,'insufficient_walkforward');
});
test('split ratios, minimum trades and computation size are bounded',()=>{
 for(const trainFraction of [.49,.81,NaN])assert.throws(()=>evaluateResearch(data(),'EURUSD',parameters,{trainFraction}),/trainFraction/);
 assert.throws(()=>evaluateResearch(data(),'EURUSD',parameters,{minimumTrades:1000}),/minimumTrades/);
 assert.throws(()=>evaluateResearch(data(2001),'EURUSD',parameters,{}),e=>e.code==='RESEARCH_BUDGET_EXCEEDED');
});
test('long-only, short-only and both modes respect direction and generate actual short trades',()=>{
 for(const direction of ['long_only','short_only','long_short']){const r=runBacktest(data(),'EURUSD',{...parameters,direction});assert.ok(r.trades.length>0);if(direction==='long_only')assert.ok(r.trades.every(t=>t.direction==='long'));else if(direction==='short_only')assert.ok(r.trades.every(t=>t.direction==='short'));else assert.equal(new Set(r.trades.map(t=>t.direction)).size,2);}
});
test('short cash flow uses signed PnL without crediting sale proceeds',()=>{
 const r=runBacktest(data(),'EURUSD',{...parameters,direction:'short_only'});
 for(const tr of r.trades){assert.equal(tr.netPnl,tr.grossPnl);assert.ok(Math.abs(tr.grossPnl-(tr.entry-tr.exit)*100000*tr.lots)<1e-7);assert.ok(tr.stop>tr.entry);assert.ok(tr.target<tr.entry);}
 assert.ok(Math.abs(r.metrics.endingEquity-(10000+r.trades.reduce((s,t)=>s+t.netPnl,0)))<1e-7);
});
test('short spread/slippage execute in adverse directions and commissions on both fills',()=>{
 const s=data(),zero=runBacktest(s,'EURUSD',{...parameters,direction:'short_only'}).trades[0];
 const cost=runBacktest(s,'EURUSD',{...parameters,direction:'short_only',spreadBps:4,slippageBps:2,commissionBps:3}).trades[0];
 assert.equal(cost.signalTime,zero.signalTime);assert.ok(cost.entry<zero.entry);assert.ok(cost.fees>0);
 assert.ok(Math.abs(cost.netPnl-(cost.grossPnl-cost.fees))<1e-7);
});
test('short stop wins a stop/target overlap and adverse opening gaps use observed open',()=>{
 const s=data(),trade=runBacktest(s,'EURUSD',{...parameters,direction:'short_only'}).trades[0],index=s.candles.findIndex(c=>c.time===trade.entryTime);
 const overlap={...s,candles:s.candles.map((c,i)=>i===index?{...c,high:trade.entry*2,low:trade.entry*.5}:c)};
 const r=runBacktest(overlap,'EURUSD',{...parameters,direction:'short_only'});assert.equal(r.trades[0].reason,'stop');assert.ok(r.trades[0].netPnl<0);
 const held=runBacktest(s,'EURUSD',{...parameters,direction:'short_only'}).trades.find(t=>t.holdingBars>2);assert.ok(held);
 const gapIndex=s.candles.findIndex(c=>c.time===held.entryTime)+1;
 const priced={...s,candles:s.candles.map((c,i)=>i===gapIndex?{...c,open:held.stop*1.1,high:held.stop*1.11,low:held.stop*1.09,close:held.stop*1.1}:c)};
 const closed=runBacktest(priced,'EURUSD',{...parameters,direction:'short_only'}).trades.find(t=>t.entryTime===held.entryTime);assert.equal(closed.reason,'gap_stop');assert.equal(closed.exit,priced.candles[gapIndex].open);
});
test('gap policy cancels stale pending entries; strict policy refuses missing/session intervals',()=>{
 const s=data(),first=runBacktest(s,'EURUSD',parameters).trades[0],index=s.candles.findIndex(c=>c.time===first.entryTime);
 const gapped={...s,candles:s.candles.map((c,i)=>i>=index?{...c,time:c.time+step*3}:c)};
 const r=runBacktest(gapped,'EURUSD',parameters);assert.ok(r.gapHandling.cancelledSignals>=1);assert.ok(!r.trades.some(t=>t.signalTime===first.signalTime));
 assert.throws(()=>runBacktest(gapped,'EURUSD',{...parameters,gapPolicy:'reject_gaps'}),e=>e.code==='RESEARCH_GAPS_REJECTED');
});
test('held positions close at first observed post-gap open without interpolating prices',()=>{
 const s=data(),held=runBacktest(s,'EURUSD',parameters).trades.find(t=>t.holdingBars>2),index=s.candles.findIndex(c=>c.time===held.entryTime)+1;
 const gapped={...s,candles:s.candles.map((c,i)=>i>=index?{...c,time:c.time+step*2}:c)};
 const r=runBacktest(gapped,'EURUSD',parameters),tr=r.trades.find(t=>t.entryTime===held.entryTime);assert.equal(tr.reason,'data_gap_exit');assert.equal(tr.exit,gapped.candles[index].open);assert.equal(r.gapHandling.forcedExits,1);
});
test('independent metric fixture: holdings, exposure, direction counts and risk concentration',()=>{
 const trades=[{netPnl:100,rMultiple:2,direction:'long',holdingBars:4,holdingMs:7200000,riskAmount:50,entryTime:1,exitTime:3},{netPnl:-50,rMultiple:-1,direction:'short',holdingBars:2,holdingMs:3600000,riskAmount:50,entryTime:3,exitTime:5}];
 const m=summarizePerformance(trades,[{time:1,equity:1000,exposed:false},{time:2,equity:1100,exposed:true},{time:3,equity:1050,exposed:true},{time:4,equity:1050,exposed:false}],1000);
 assert.equal(m.averageHoldingBars,3);assert.equal(m.averageHoldingHours,1.5);assert.equal(m.exposurePct,50);assert.equal(m.longTrades,1);assert.equal(m.shortTrades,1);assert.equal(m.largestTradeRiskSharePct,50);assert.ok(Math.abs(m.largestTradeAbsolutePnlSharePct-100/150*100)<1e-10);assert.equal(m.tradeDistribution.oneRPlus,1);assert.equal(m.tradeDistribution.minusOneToZeroR,1);
});
test('quote-currency validation supports USD-base conversion and rejects stablecoin/contract mismatches',()=>{
 const s=data();assert.throws(()=>runBacktest({...s,provenance:{...s.provenance,currency:'USDT'}},'BTCUSDT',parameters),/USD-denominated/);
 assert.throws(()=>runBacktest(s,'USDJPY',parameters),/JPY-denominated/);
 const yen={...s,candles:s.candles.map(c=>Object.fromEntries(Object.entries(c).map(([k,v])=>[k,['open','high','low','close'].includes(k)?v*140:v]))),provenance:{...s.provenance,currency:'JPY'}};
 assert.ok(runBacktest(yen,'USDJPY',parameters).trades.every(t=>Number.isFinite(t.netPnl)));
});
test('minimum-trade and negative-holdout evidence uses observed metrics only',()=>{
 const r=evaluateResearch(data(),'EURUSD',parameters,{minimumTrades:100});assert.ok(r.warnings.includes('insufficient_validation_trades'));assert.equal(r.evidence.probabilityOfProfit,null);assert.equal(r.warnings.includes('negative_holdout'),r.holdout.metrics.returnPct<=0);
});
