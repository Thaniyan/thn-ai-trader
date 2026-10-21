import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../public/research-records.js';
import {closedMarket} from '../server/market-evidence.js';
import {startPackaged} from './release-runtime.mjs';
import {evidenceSnapshot} from '../server/intelligence.js';
const R=globalThis.THNRecords;
const reported={id:'report-1',date:'2026-01-01',symbol:'EURUSD',decision:'BUY',entry:1.1,exitPrice:1.12,risk:100,pnl:200,currency:'USD'};
test('ideas cannot fabricate outcomes, including legacy WINs and forged verification',()=>{
  const idea=R.idea({symbol:'EURUSD',decision:'BUY',entry:1.1,targets:[1.12],risk:{riskAmount:100,rewardRisk:2}});
  assert.equal(idea.pnl,undefined);assert.equal(idea.exitPrice,undefined);assert.equal(idea.status,undefined);
  assert.equal(R.classify(idea).kind,'research_idea');
  const legacy={...reported,status:'WIN'};const bytes=JSON.stringify(legacy);
  for(const v of [idea,{...idea,kind:'hypothetical_scenario',pnl:200,status:'WIN'},legacy,{...legacy,schema:'THN-RECORD-1',kind:'executed_trade',verification:'verified',source:'broker'}])assert.equal(R.classify(v).eligible,false);
  assert.equal(JSON.stringify(legacy),bytes);assert.deepEqual(R.select([idea,legacy]),[]);
});
test('outcome source selection never combines manual, imported and paper results',()=>{
  const manual=R.outcome(reported),imported=R.outcome({...reported,pnl:-50},'import');
  const paper={...manual,kind:'paper_trade',source:'local_paper',execution:{mode:'PAPER',ticket:'PT-TEST123',closedLots:.01,realizedPnl:200,exitPrice:1.12}};
  assert.deepEqual(R.select([manual,imported,paper]),[]);
  for(const [key,v] of [['manual',manual],['import',imported],['paper',paper]])assert.deepEqual(R.select([manual,imported,paper],key),[v]);
  assert.equal(R.classify({...paper,execution:{...paper.execution,mode:'LIVE'}}).eligible,false);
  assert.equal(R.classify({...manual,exitPrice:null}).eligible,false);
  assert.equal(R.classify({...manual,openedAt:'2026-02-01'}).eligible,false);
  assert.equal(R.classify(manual).verification,'unverified');
  assert.equal(R.reportedR(R.outcome({...reported,pnl:0})),0);
  assert.equal(R.reportedR({...reported,status:'WIN'}),null);
});
test('CSV rejects missing, infinite, conflicting and interrupted outcomes without inventing defaults',()=>{
  const missing=R.parseCSV('symbol\nEURUSD');assert.equal(missing.records.length,0);assert.equal(missing.issues.length,1);
  const header='date,symbol,decision,entry,exitPrice,risk,pnl,currency,kind';
  const good='2026-01-01,EURUSD,BUY,1.1,1.12,100,200,USD,closed_trade';
  assert.equal(R.parseCSV(header.replace(',kind','')+'\n'+good.replace(',closed_trade','')).records.length,0);
  assert.equal(R.parseCSV(header+'\n'+good).records[0].pnl,200);
  for(const bad of [good.replace('100,200','0,200'),good.replace('100,200','100,1e999'),good.replace('2026-01-01','2026-02-30'),good.replace('1.12',''),good.replace(',USD',',USDT')]){
    if(bad!==good)assert.equal(R.parseCSV(header+'\n'+bad).records.length,0);
  }
  assert.throws(()=>R.parseCSV(header+'\n"interrupted'));
  assert.throws(()=>R.parseCSV('symbol,symbol\nEURUSD,EURUSD'));
  assert.throws(()=>R.parseCSV('x'.repeat(1000001)));
  const q=R.parseCSV(header+',notes\n'+good+',"multi\nline, quoted ""note"""');assert.equal(q.records.length,1);
  assert.deepEqual(q.records[0].originalCSV.values.at(-1),'multi\nline, quoted "note"');
  const idea=R.parseCSV(header+'\n'+good.replace('closed_trade','research_idea')).records[0];assert.equal(R.classify(idea).eligible,false);assert.equal(idea.pnl,undefined);
});
test('JSON recovery preserves legacy source records but cannot import verification authority',()=>{
  const original={...reported,status:'WIN',notes:'original user notes'};
  const idea=R.idea({symbol:'EURUSD',decision:'SELL'}),manual=R.outcome(reported);
  const result=R.parseBackup(JSON.stringify({schema:'THN-RECORDS-1',records:[original,idea,manual]}));
  assert.deepEqual(result.records[0].originalRecord,original);assert.equal(R.classify(result.records[0]).eligible,false);
  assert.equal(R.classify(result.records[1]).kind,'research_idea');assert.equal(result.records[2].source,'import');
  assert.equal(R.select(result.records).length,0);assert.equal(R.select(result.records,'import').length,1);
  assert.throws(()=>R.parseBackup('{'));assert.throws(()=>R.parseBackup(JSON.stringify({schema:'THN-RECORDS-1',records:[null]})));
  const large=R.parseBackup(JSON.stringify({schema:'THN-RECORDS-1',records:[{...original,notes:'x'.repeat(1100000)}]}));
  assert.equal(large.records[0].originalRecord.notes.length,1100000);assert.equal(large.records[0].notes,undefined);
  let deep={};for(let i=0;i<20;i++)deep={nested:deep};
  assert.throws(()=>R.parseBackup(JSON.stringify({schema:'THN-RECORDS-1',records:[deep]})));
  assert.match(R.csvCell('=HYPERLINK("bad")'),/^"'/);assert.equal(R.csvCell(-100),'"-100"');
  assert.match(R.label(manual,'ar'),/غير موثق/);assert.match(R.label(idea,'ar'),/فكرة/);
});
const step=3600000,asOf=Date.UTC(2026,0,10,12);
const bars=Array.from({length:100},(_,i)=>({time:asOf-(100-i)*step,open:1,high:1.2,low:.9,close:1.1,volume:100}));
const market={interval:'1h',candles:bars,marketTime:asOf,source:'TEST',providerSymbol:'EURUSD=X',currency:'USD'};
test('forming/future candles cannot enter analytical prices, indicators or dataset identity',()=>{
  const baseline=closedMarket(market,asOf);
  for(const time of [asOf,asOf+step]){
    const changed=closedMarket({...market,candles:[...bars,{time,open:100,high:101,low:99,close:100,volume:1}]},asOf);
    assert.deepEqual(changed.candles,baseline.candles);assert.equal(changed.evidence.hash,baseline.evidence.hash);
    assert.equal(changed.evidence.availableAt,asOf);assert.equal(changed.evidence.excludedUnclosedBars,1);
  }
  assert.equal(closedMarket(market,asOf-1).candles.length,99);
});
test('provider observation delay limits available-at evidence; malformed timestamps/intervals fail closed',()=>{
  const delayed=closedMarket({...market,marketTime:asOf-2*step},asOf);
  assert.equal(delayed.evidence.availableAt,asOf-2*step);assert.equal(delayed.candles.length,98);
  assert.equal(delayed.evidence.observedAt,asOf-2*step);
  assert.throws(()=>closedMarket({...market,providerTimePresent:false},asOf));
  for(const m of [{...market,interval:'5m'},{...market,marketTime:asOf+10000},{...market,marketTime:null},{...market,candles:[...bars,bars.at(-1)]},{...market,candles:bars.map(c=>({...c,time:c.time/1000}))}])assert.throws(()=>closedMarket(m,asOf));
});
test('independent frame evidence respects each frame close without manufacturing lower-timeframe history',()=>{
  for(const [interval,span] of [['15m',900000],['1h',step],['1d',86400000]]){
    const candles=bars.map((c,i)=>({...c,time:asOf-(100-i)*span}));
    const m=closedMarket({...market,interval,candles:[...candles,{...candles.at(-1),time:asOf}]},asOf);
    assert.equal(m.candles.length,100);assert.equal(m.evidence.availableAt,asOf);assert.equal(m.evidence.interval,interval);
  }
});
test('committee structure evidence becomes observable at confirmation-bar CLOSE, not its open label',()=>{
  const brief={symbol:'EURUSD',interval:'1h',asOf,selected:{provenance:{hash:'a'.repeat(64)},events:[{type:'BOS',confirmedAt:asOf-step},{type:'CHoCH',confirmedAt:asOf-1}]},frames:[]};
  const snapshot=evidenceSnapshot(brief);
  assert.equal(snapshot.events.length,1);assert.equal(snapshot.events[0].time,asOf);
  assert.equal(snapshot.refs.find(r=>r.id==='event-0').availableAt,asOf);
});
test('known local paper risk: new transport keys do not deduplicate one logical intent (assessment only)',async()=>{
  const s=await startPackaged({hosted:false,local:true});
  try{
    const order={accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:.01,stopLoss:1.08,takeProfit:1.1,idempotencyKey:'same-logical-intent'};
    const execute=async body=>{const r=await fetch(s.url+'/api/orders/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();};
    const first=await execute(order),same=await execute(order),fresh=await execute({...order,idempotencyKey:'new-key-for-same-intent'});
    assert.equal(same.orderResult.ticket,first.orderResult.ticket);assert.notEqual(fresh.orderResult.ticket,first.orderResult.ticket);assert.equal(fresh.account.positions.length,2);
  }finally{await s.stop();}
});
