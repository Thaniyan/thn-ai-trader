import test from 'node:test';
import assert from 'node:assert/strict';
import {commandEvidence,annotationLabels} from '../public/command-evidence.js';
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
