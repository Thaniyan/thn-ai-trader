import test from 'node:test';
import assert from 'node:assert/strict';
import {commandEvidence,annotationLabels,decisionEvidence,chartReading} from '../public/command-evidence.js';
const hash='a'.repeat(64),now=1800000000000;
function fixture(){
 const provenance={hash,interval:'1h',lastTime:now-3600000,status:'recent',providerSymbol:'EURUSD=X',source:'offline fixture'};
 return {now,context:{symbol:'EURUSD',interval:'1h',datasetId:hash},series:{symbol:'EURUSD',provenance},brief:{symbol:'EURUSD',interval:'1h',selected:{provenance},frames:['15m','1h','1d'].map(interval=>({interval,available:true,trend:'bullish',ema20:1.1,ema50:1.09,rsi:61,atr:.003,provenance:{...provenance,interval,lastTime:now-({'15m':900000,'1h':3600000,'1d':86400000}[interval])}}))},analysis:{symbol:'EURUSD',timeframe:'1h',evidence:provenance,schools:[{name:'Technical',bias:'BULLISH',reasons:['Retained reason'],warnings:[]},{name:'Structure',bias:'BEARISH',reasons:['Opposing retained reason'],warnings:['Heuristic']}]},model:{fresh:true,warnings:['risk_review_required'],candidate:{symbol:'EURUSD',interval:'1h',hash,barTime:provenance.lastTime,entry:1.1,stop:1.09,targets:[1.12],executionAuthorized:false}}};
}
test('evidence ledger copies retained values and contrary perspectives without probabilities or recalculation',()=>{
 const f=fixture(),before=JSON.stringify(f),e=commandEvidence(f);assert.equal(e.matched,true);assert.equal(e.frames.length,3);assert.ok(e.frames.every(v=>v.status==='recent'));assert.equal(e.frames[1].selected,true);assert.equal(e.frames[0].rsi,61);assert.equal(e.schools[1].bias,'BEARISH');assert.equal(e.candidate.entry,1.1);assert.equal(e.probability,null);assert.equal(e.executionAuthorized,false);
 e.schools[0].reasons.push('changed copy');e.candidate.targets[0]=99;assert.equal(JSON.stringify(f),before);
});
test('cross-context, missing and late briefs cannot become matching timeframe evidence',()=>{
 for(const mutate of [f=>f.context.symbol='GBPUSD',f=>f.context.interval='1d',f=>f.context.datasetId='b'.repeat(64),f=>f.brief=null,f=>f.brief.selected.provenance={hash:'b'.repeat(64)}]){
  const f=fixture();mutate(f);const e=commandEvidence(f);assert.equal(e.matched,false);assert.ok(e.frames.every(v=>v.status==='unavailable'&&v.trend===null));assert.equal(e.source,null);assert.equal(e.candidate,null);
 }
});
test('stale, future, absent and wrong-provider frame data stays unavailable or stale with no current indicators',()=>{
 for(const mutate of [f=>f.brief.frames[0].available=false,f=>f.brief.frames[0].provenance.status='stale',f=>f.brief.frames[0].provenance.lastTime=now+1,f=>f.brief.frames[0].provenance.hash='invalid',f=>f.brief.frames[0].provenance.providerSymbol='USDJPY=X']){
  const f=fixture();mutate(f);const frame=commandEvidence(f).frames[0];assert.notEqual(frame.status,'recent');assert.equal(frame.trend,null);assert.equal(frame.ema20,null);assert.equal(frame.rsi,null);
 }
 for(const frames of [null,{},'unavailable']){const malformed=fixture();malformed.brief.frames=frames;assert.ok(commandEvidence(malformed).frames.every(v=>v.status==='unavailable'));}
 const f=fixture();f.now+=4*86400000+1;assert.ok(commandEvidence(f).frames.every(v=>v.status==='stale'));
});
test('mismatched analysis is not displayed as current school evidence and no saved input is mutated',()=>{
 const f=fixture();f.analysis.evidence={...f.analysis.evidence,lastTime:now};const before=JSON.stringify(f);assert.deepEqual(commandEvidence(f).schools,[]);assert.equal(JSON.stringify(f),before);
 f.model.fresh=false;assert.equal(commandEvidence(f).candidate,null);assert.deepEqual(commandEvidence(f).schools,[]);
});

test('annotation labels avoid collisions inside the plot without altering financial price coordinates',()=>{
 const points=[{label:'E',y:40,value:1.1},{label:'T1',y:39,value:1.2},{label:'T2',y:38,value:1.3},{label:'SL',y:195,value:1}],before=JSON.stringify(points);
 const result=annotationLabels(points,{top:24,bottom:200});assert.equal(JSON.stringify(points),before);
 for(let i=0;i<result.length;i++){assert.ok(result[i].labelY>=35&&result[i].labelY<=197);if(i)assert.ok(result[i].labelY-result[i-1].labelY>=14);const original=points.find(p=>p.label===result[i].label);assert.equal(result[i].y,original.y);assert.equal(result[i].value,original.value);}
 assert.deepEqual(annotationLabels(points,{top:100,bottom:20}),[]);
});

test('decision brief keeps contrary facts, incomplete frames and original conditions distinct from approval',()=>{
 const f=fixture();f.model.context={symbol:'EURUSD',interval:'1h',hash};f.model.recommendation={action:'WAIT'};f.brief.scenarios=[{direction:'bullish',trigger:1.1,invalidation:1.09},{direction:'bearish',trigger:1.08,invalidation:1.11},{direction:'bullish',trigger:null,invalidation:1}];
 const e=commandEvidence(f),before=JSON.stringify(f),v=decisionEvidence({evidence:e,model:f.model,brief:f.brief});
 assert.equal(v.action,'WAIT');assert.equal(v.directional,false);for(const action of ['AVOID','WAIT','BUY','SELL']){const state=decisionEvidence({evidence:e,model:{...f.model,recommendation:{action}},brief:f.brief});assert.equal(state.action,action);assert.equal(state.directional,['BUY','SELL'].includes(action));}assert.equal(v.alignment,'bullish');assert.equal(v.supporting[0].text,'Retained reason');assert.equal(v.opposing[0].text,'Opposing retained reason');assert.equal(v.scenarios.length,2);assert.equal(v.executionAuthorized,false);assert.equal(v.probability,null);v.scenarios[0].trigger=9;assert.equal(JSON.stringify(f),before);
 e.frames[0].trend='neutral';assert.equal(decisionEvidence({evidence:e,model:f.model}).alignment,'mixed');e.frames[0].trend='bearish';assert.equal(decisionEvidence({evidence:e,model:f.model}).alignment,'mixed');e.frames[0].status='stale';assert.equal(decisionEvidence({evidence:e,model:f.model}).alignment,'incomplete');
});
test('stale decision facts and late cross-context scenarios never become current decision evidence',()=>{
 const f=fixture();f.model.context={symbol:'EURUSD',interval:'1h',hash};f.brief.scenarios=[{direction:'bullish',trigger:1.1,invalidation:1}];const e=commandEvidence(f);
 for(const brief of [{...f.brief,symbol:'GBPUSD'},{...f.brief,interval:'1d'},{...f.brief,selected:{provenance:{hash:'b'.repeat(64)}}},null])assert.deepEqual(decisionEvidence({evidence:e,model:f.model,brief}).scenarios,[]);
 const v=decisionEvidence({evidence:e,model:{...f.model,fresh:false},brief:f.brief});assert.equal(v.usable,false);assert.deepEqual(v.supporting,[]);assert.deepEqual(v.opposing,[]);assert.deepEqual(v.scenarios,[]);assert.equal(v.availableFrames,0);
});
test('OHLC readout uses original selected candle and exact rolling source window without calculating prices',()=>{
 const f=fixture();f.series.candles=Array.from({length:40},(_,i)=>({time:i*3600000,open:1+i/100,high:1.1+i/100,low:.9+i/100,close:1.02+i/100,volume:i}));const visible=f.series.candles.slice(10,30),plot={left:12,right:212,width:200},input={context:f.context,series:f.series,visible,plot,hover:{x:17},fresh:true},before=JSON.stringify(input);
 const r=chartReading(input);assert.deepEqual(r.candle,f.series.candles[10]);assert.equal(r.index,10);assert.deepEqual(r.rangeSource,{first:f.series.candles[9].time,last:f.series.candles[28].time,count:20});assert.equal(r.executionAuthorized,false);r.candle.open=99;assert.equal(JSON.stringify(input),before);
 const last=chartReading({...input,hover:{x:999}});assert.equal(last.candle.time,visible.at(-1).time);assert.equal(last.inspected,false);
});
test('OHLC readout withholds stale, missing, wrong context and altered visible-candle evidence',()=>{
 const f=fixture();f.series.candles=[{time:1,open:1,high:2,low:.9,close:1.1}];const input={context:f.context,series:f.series,visible:f.series.candles,fresh:true};
 for(const changes of [{fresh:false},{series:null},{visible:[]},{context:{...f.context,symbol:'GBPUSD'}},{context:{...f.context,interval:'1d'}},{context:{...f.context,datasetId:'b'.repeat(64)}},{visible:[{...f.series.candles[0],close:1.2}]}])assert.equal(chartReading({...input,...changes}),null);
});
