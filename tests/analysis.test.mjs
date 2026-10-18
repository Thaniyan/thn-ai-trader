import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ema,rsi,atr,macd,bollinger} from '../server/indicators.js';
import {startTestServer} from './harness.mjs';
test('indicator reference vectors and insufficient-history conventions',()=>{
  assert.equal(ema([1,2,3,4],3),3);assert.equal(ema([1,2],3),null);
  assert.equal(rsi(Array(30).fill(1)),50);assert.equal(rsi(Array.from({length:30},(_,i)=>i)),100);assert.equal(rsi(Array.from({length:30},(_,i)=>30-i)),0);
  assert.equal(atr(Array.from({length:30},()=>({high:2,low:1,close:1.5}))),1);
  const m=macd(Array.from({length:100},(_,i)=>i+1));assert.ok(Math.abs(m.macd-7)<1e-9);assert.ok(Math.abs(m.histogram)<1e-9);
  assert.equal(bollinger(Array(30).fill(5)).upper,5);
});
test('analysis uses independent timeframes, honest calendar and ordered targets',async()=>{
  const s=await startTestServer({THN_TEST_PROVIDER_MODE:"long"});try{
    for(const rewardRisk of [1,1.5,2,5]){
      const res=await fetch(s.url+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:'EURUSD',rewardRisk})});
      assert.equal(res.status,200);const a=await res.json();assert.deepEqual(a.macroCalendar,[]);assert.equal(a.confidenceType,'HEURISTIC_CONFLUENCE_NOT_PROBABILITY');
      assert.match(a.mtfa.d1.detail,/1d/);assert.match(a.mtfa.h4.detail,/4h/);assert.match(a.mtfa.h1.detail,/1h/);assert.match(a.mtfa.m15.detail,/15m/);
      if(a.decision==='WAIT'){assert.equal(a.stopLoss,null);assert.deepEqual(a.targets,[])}else{const distance=a.targets.map(t=>Math.abs(t-a.entry));assert.ok(distance[0]<distance[1]&&distance[1]<distance[2])}
      assert.equal(a.backtest.isHistoricalBacktest,false);
      assert.equal(a.professional.analysisMap.candles.length,300);
      const last=a.professional.analysisMap.candles.at(-1);assert.equal(last.ema20,a.indicators.ema20);assert.equal(last.ema200,a.indicators.ema200);
    }
  }finally{await s.stop()}
});
