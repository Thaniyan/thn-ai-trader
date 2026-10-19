import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderRisk, calculateRequiredMargin, validateOrderRisk } from '../server/riskEngine.js';
const account={balance:50000,freeMargin:50000,currency:'USD',leverage:200,positions:[],permissionLevel:'TRADING_ENABLED'};
const order={symbol:'EURUSD',side:'BUY',lots:.1,stopLoss:1.09,takeProfit:1.12};
test('USD-quoted FX risk, reward and margin are dimensionally correct',()=>{
 const m=calculateOrderRisk({...order,entryPrice:1.1,leverage:20});
 assert.equal(m.slDollars,100);assert.equal(m.tpDollars,200);assert.equal(m.rrRatio,2);assert.equal(m.requiredMargin,550);
});
test('USDJPY margin uses USD base not JPY notional',()=>{assert.equal(calculateRequiredMargin({symbol:'USDJPY',lots:1,price:150,leverage:100}),1000);assert.equal(calculateOrderRisk({symbol:'USDJPY',lots:1,entryPrice:150,stopLoss:149,takeProfit:152}).slDollars,666.67)});
for(const [name,patch,code] of [
 ['invalid side',{side:'garbage'},'INVALID_ORDER'],['missing protection',{stopLoss:0},'PROTECTION_REQUIRED'],['nonfinite protection',{stopLoss:'bad'},'PROTECTION_REQUIRED'],['invalid lot step',{lots:.015},'INVALID_LOT_STEP'],['wrong stop direction',{stopLoss:1.2},'INVALID_STOP_LOSS'],['wrong target direction',{takeProfit:1},'INVALID_TAKE_PROFIT'],['risk cap',{lots:10,stopLoss:1},'RISK_LIMIT_EXCEEDED']])
 test(name,()=>assert.equal(validateOrderRisk({account,order:{...order,...patch},currentPrice:1.1}).code,code));
test('invalid provider price cannot pass risk validation',()=>assert.equal(validateOrderRisk({account,order,currentPrice:NaN}).code,'INVALID_ORDER'));
test('zero free margin does not fall back to balance',()=>assert.equal(validateOrderRisk({account:{...account,freeMargin:0},order,currentPrice:1.1}).code,'INSUFFICIENT_MARGIN'));
test('read-only account cannot trade',()=>assert.equal(validateOrderRisk({account:{...account,permissionLevel:'READ_ONLY'},order,currentPrice:1.1}).code,'PERMISSION_DENIED'));

test('partial settlement preserves remaining lots and margin without mutating source',async()=>{
 const { PaperTradingAdapter }=await import('../server/brokerAdapters.js');
 const position={ticket:'test',symbol:'EURUSD',side:'BUY',lots:.1,entryPrice:1.1,margin:100};
 const result=await new PaperTradingAdapter().closePosition({positions:[position]},'test',.5,1.11);
 assert.equal(result.isPartial,true);assert.equal(result.closedLots,.05);assert.equal(result.remainingPosition.lots,.05);assert.equal(result.remainingPosition.margin,50);assert.equal(result.realizedPnl,50);assert.equal(position.lots,.1);
});
test('tiny partial close is rejected rather than silently rounding to zero',async()=>{
 const { PaperTradingAdapter }=await import('../server/brokerAdapters.js');
 await assert.rejects(()=>new PaperTradingAdapter().closePosition({positions:[{ticket:'test',symbol:'EURUSD',side:'BUY',lots:.01,entryPrice:1.1,margin:10}]},'test',.1,1.11),/minimum/);
});
