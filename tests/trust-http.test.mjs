import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
test('packaged analysis, chart, scanner, quotes and committee share closed evidence; hosted mutations remain denied',async()=>{
  const child=spawn(process.execPath,['--import','./tests/trust-provider-fixture.mjs','tests/packaged-launch.mjs'],{env:{...process.env,VERCEL:'1',THN_LOCAL_PAPER:'1',THN_AI_ENABLED:'0'},stdio:['ignore','pipe','pipe']});
  try{
    const url=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Startup timeout')),10000);child.once('error',reject);child.stdout.on('data',d=>{output+=d;const m=output.match(/THN_TEST_PORT=(\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});});
    const get=async p=>{const r=await fetch(url+p);assert.equal(r.status,200);return r.json();};
    const post=async(p,body)=>{const r=await fetch(url+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
    const series=await get('/api/research/series?symbol=EURUSD&interval=1h');
    const analysis=await post('/api/analyze',{symbol:'EURUSD',timeframe:'intraday'});
    assert.equal(analysis.status,200);assert.notEqual(analysis.data.indicators.price,1.2);
    assert.equal(analysis.data.indicators.price,Number(series.candles.at(-1).close.toFixed(6)));
    assert.equal(analysis.data.evidence.hash,series.provenance.hash);
    const quotes=await get('/api/quotes');assert.equal(quotes.quotes.EURUSD.close,series.candles.at(-1).close);assert.equal(quotes.quotes.EURUSD.evidence.hash,series.provenance.hash);
    const mtf=await get('/api/research/mtf?symbol=EURUSD');assert.equal(mtf.frames.find(f=>f.interval==='1h').provenance.hash,series.provenance.hash);
    const intelligence=await post('/api/intelligence',{symbol:'EURUSD',interval:'1h',question:'Analyze',mode:'deterministic',language:'en'});assert.equal(intelligence.status,200);assert.equal(intelligence.data.snapshot.selectedHash,series.provenance.hash);assert.equal(intelligence.data.financialExecution,false);
    const scan=await post('/api/watchlist/scan',{symbols:['EURUSD'],timeframe:'intraday'});assert.equal(scan.status,200);assert.equal(scan.data.results[0].entry,analysis.data.entry);
    assert.equal((await post('/api/orders/execute',{})).status,503);
    assert.equal((await fetch(url+'/api/broker/paper-quotes')).status,503);
    assert.equal((await post('/api/intelligence',{mode:'llm',question:'Analyze',symbol:'EURUSD',interval:'1h'})).status,503);
    assert.equal((await get('/api/intelligence/provider')).available,false);
  }finally{child.kill();if(child.exitCode===null&&child.signalCode===null)await new Promise(r=>child.once('exit',r));}
});
test('opt-in local paper marks retain original raw observation semantics separately from research closes',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'thn-trust-marks-'));
  const child=spawn(process.execPath,['--import','./tests/trust-provider-fixture.mjs','tests/packaged-launch.mjs'],{env:{...process.env,VERCEL:'',THN_LOCAL_PAPER:'1',THN_AI_ENABLED:'0',THN_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
  try{
    const url=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Startup timeout')),10000);child.once('error',reject);child.stdout.on('data',d=>{output+=d;const m=output.match(/THN_TEST_PORT=(\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});});
    const paper=await fetch(url+'/api/broker/paper-quotes').then(r=>r.json());
    const research=await fetch(url+'/api/quotes').then(r=>r.json());
    assert.equal(paper.quotes.EURUSD.close,1.2);assert.notEqual(research.quotes.EURUSD.close,1.2);
  }finally{child.kill();if(child.exitCode===null&&child.signalCode===null)await new Promise(r=>child.once('exit',r));await rm(dir,{recursive:true,force:true});}
});
