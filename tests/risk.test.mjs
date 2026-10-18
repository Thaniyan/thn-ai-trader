import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateOrderRisk,validateOrderRisk} from '../server/riskEngine.js';
import {PaperTradingAdapter} from '../server/brokerAdapters.js';
const account={status:'CONNECTED',broker:'paper',tradingMode:'PAPER',permissionLevel:'TRADING_ENABLED',currency:'USD',balance:50000,equity:50000,freeMargin:50000,leverage:200,positions:[],orders:[]};
const order={symbol:'EURUSD',side:'BUY',lots:0.1,stopLoss:1.08,takeProfit:1.095};
test('risk rejects malformed prices, sides, steps, stops and target directions',()=>{
  assert.equal(validateOrderRisk({account,order,currentPrice:1.085}).approved,true);
  assert.equal(validateOrderRisk({account:{...account,status:'OFFLINE'},order,currentPrice:1.085}).approved,false);
  for(const bad of [{side:'invalid'},{lots:0.015},{lots:Infinity},{stopLoss:-1},{stopLoss:0},{takeProfit:-1},{takeProfit:1.01},{stopLoss:1.2},{symbol:'UNKNOWN'},{stopLoss:1.0800001},{stopLoss:1.08499}])assert.equal(validateOrderRisk({account,order:{...order,...bad},currentPrice:1.085}).approved,false);
  for(const price of [NaN,Infinity,-1,0])assert.equal(validateOrderRisk({account,order,currentPrice:price}).approved,false);
  assert.equal(validateOrderRisk({account:{...account,dailyRealizedPnl:-2500},order,currentPrice:1.085}).code,'DAILY_LOSS_LIMIT');
  assert.equal(validateOrderRisk({account:{...account,positions:[{riskDollars:2990}]},order,currentPrice:1.085}).code,'AGGREGATE_RISK_EXCEEDED');
});
test('USDJPY risk and margin convert quote currency into USD',()=>{
  const risk=calculateOrderRisk({symbol:'USDJPY',side:'BUY',lots:1,currentPrice:150,stopLoss:149,takeProfit:152,leverage:200});
  assert.equal(risk.requiredMargin,500);assert.equal(risk.slDollars,671.14);assert.equal(risk.tpDollars,1315.79);
});
test('half-close retains lots and margin and zero-lot close is rejected',async()=>{
  const adapter=new PaperTradingAdapter();const pos={ticket:'test',symbol:'EURUSD',side:'BUY',lots:0.2,entryPrice:1.085,margin:108.5,riskDollars:100};
  const result=await adapter.closePosition({...account,positions:[pos]},'test',0.5,1.09);
  assert.equal(result.isPartial,true);assert.equal(result.remainingPosition.lots,0.1);assert.equal(result.remainingPosition.margin,54.25);assert.equal(pos.lots,0.2);
  await assert.rejects(()=>adapter.closePosition({...account,positions:[{...pos,lots:0.01}]},'test',0.1,1.09));
});
test('sub-cent stop risk and margin cannot round down to bypass paper budgets',()=>{
 const tinyOrder={symbol:'ETHUSD',side:'BUY',lots:0.05,stopLoss:83.98,takeProfit:84.04};
 const risk=calculateOrderRisk({...tinyOrder,currentPrice:84,leverage:200});
 assert.equal(risk.slDollars,0);assert.equal(risk.slRiskUpperBound,0.01);assert.equal(risk.requiredMargin,0.03);
 assert.equal(validateOrderRisk({account:{...account,balance:0.03,equity:0.03,freeMargin:0.03},order:tinyOrder,currentPrice:84}).code,'RISK_LIMIT_EXCEEDED');
 assert.equal(validateOrderRisk({account:{...account,balance:1,equity:1,freeMargin:0.02},order:tinyOrder,currentPrice:84}).code,'INSUFFICIENT_MARGIN');
});
