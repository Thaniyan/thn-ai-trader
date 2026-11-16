import test from 'node:test';import assert from 'node:assert/strict';
import {matchedSeries,currentEvaluation,eventAvailability,candleInspection,chartWindow,nearestBar,workflowState,appendCitation,formatRecordedNumber} from '../public/research-studio-core.js';
const context={symbol:'EURUSD',interval:'1h',datasetId:'recorded-hash'},series={symbol:'EURUSD',provenance:{interval:'1h',hash:'recorded-hash'},candles:[{time:0,open:1,high:1.2,low:.9,close:1.1,volume:40},{time:3600000,open:1.1,high:1.3,low:1,close:1.2,volume:80}],indicators:{ema20:[null,1.125],rsi14:[null,62]},events:[{type:'swing',index:0,confirmedAt:3600000,price:1.2},{type:'break',index:1,confirmedAt:3600000,price:1.2}]};
const evaluation={symbol:'EURUSD',dataset:{interval:'1h',hash:'recorded-hash'}};
test('workspace state cannot promote stale, mismatched or pending evidence into current validation',()=>{
 assert.equal(matchedSeries(context,series),true);assert.equal(currentEvaluation(context,series,evaluation),true);
 for(const key of ['dirty','busy','failed'])assert.equal(currentEvaluation(context,series,evaluation,{[key]:true}),false);
 for(const change of [{symbol:'USDJPY'},{interval:'15m'},{datasetId:'new-history'}])assert.equal(currentEvaluation({...context,...change},series,evaluation),false);
 assert.equal(currentEvaluation(context,series,{...evaluation,dataset:{...evaluation.dataset,hash:'other'}}),false);
});
test('bar inspector returns exact recorded values without anticipatory structure or mutating the source',()=>{
 const original=JSON.stringify(series),first=candleInspection(series,0),second=candleInspection(series,1);
 assert.equal(first.events.length,0,'A later-confirmed swing is not available at its pivot');assert.equal(second.events[0].type,'break');assert.equal(second.indicators.ema20,1.125);assert.equal(first.indicators.atr14,null);assert.equal(first.volumeAvailable,false);assert.equal(candleInspection({...series,provenance:{...series.provenance,volumeAvailable:true}},0).volumeAvailable,true);assert.deepEqual(second.candle,series.candles[1]);
 second.candle.close=99;second.events[0].price=99;assert.equal(JSON.stringify(series),original);
 for(const index of [-1,2,1.5,NaN])assert.equal(candleInspection(series,index),null);
 assert.equal(eventAvailability(series.events[1],'1h'),7200000);assert.equal(eventAvailability(series.events[1],'invalid'),null);
});
test('chart windows and UTC lookup stay within loaded history at both edges',()=>{
 for(const length of [1,10,20,60,600])for(const count of [20,60,120,9999])for(const center of [-10,0,30,9999]){const w=chartWindow(length,count,center);assert.ok(w.count<=length&&w.count>=Math.min(20,length));assert.ok(w.offset>=0&&w.offset<=length-w.count);assert.ok(w.index>=0&&w.index<length);}
 assert.equal(chartWindow(0,20,1),null);assert.equal(nearestBar(series.candles,0),0);assert.equal(nearestBar(series.candles,1800000),0);assert.equal(nearestBar(series.candles,2000000),1);assert.equal(nearestBar([],1),-1);
});
test('planning readiness requires the exact saved-plan context and can never authorize execution',()=>{
 const brief={symbol:'EURUSD',interval:'1h',selected:{provenance:series.provenance}},plan={symbol:'EURUSD',context:{interval:'1h',datasetHash:context.datasetId}};
 const input={context,series,brief,evaluation,plan};assert.equal(workflowState(input).planning,true);
 for(const p of [{symbol:'EURUSD'},{...plan,context:{...plan.context,interval:'15m'}},{...plan,context:{...plan.context,datasetHash:'old'}}])assert.equal(workflowState({...input,plan:p}).planning,false);
 assert.equal(workflowState(input).executionAuthorized,false);assert.equal(workflowState(input).probability,null);
});
test('evidence citations append once, preserve existing thesis text and refuse overflow',()=>{
 const citation='[EURUSD 1h] recorded source / hash';assert.deepEqual(appendCitation('Personal research',citation),{ok:true,value:'Personal research\n'+citation});const prior='Original\n'+citation;assert.deepEqual(appendCitation(prior,citation),{ok:true,value:prior});assert.deepEqual(appendCitation('x'.repeat(2000),citation),{ok:false,value:'x'.repeat(2000)});assert.equal(appendCitation('notes','').ok,false);
});

test('recorded nonzero metrics stay nonzero at display precision and unavailable values never become zero',()=>{
 assert.equal(formatRecordedNumber(.0028291,'en-US',2),'0.00283');assert.equal(formatRecordedNumber(-1e-9,'en-US',2),'-0.000000001');assert.equal(formatRecordedNumber(0,'en-US',2),'0');assert.equal(formatRecordedNumber(4.487606,'en-US',2),'4.49');
 for(const value of [null,undefined,NaN,Infinity,'0'])assert.equal(formatRecordedNumber(value),'—');
 assert.equal(formatRecordedNumber(.0028291,'ar-OM',2),new Intl.NumberFormat('ar-OM',{maximumSignificantDigits:3}).format(.0028291));
});
