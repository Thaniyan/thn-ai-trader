import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {candleStatus,assertPaperMarket} from '../server/marketData.js';
import {startTestServer} from './harness.mjs';
const headers={'Content-Type':'application/json',Authorization:'Bearer test-only-operator-token'};
function encrypted(key){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update('test-only-credential'),cipher.final()]);return {iv:iv.toString('base64'),authTag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')}}
function probe(dir,managed=''){return spawnSync(process.execPath,['--input-type=module','-e',`import {encryptSecret} from './server/encryption.js';import {closeStorage} from './server/storage.js';const result=encryptSecret('test-only');if(result.version!==1||!result.keyId)throw Error('Missing identity');await closeStorage();`],{env:{...process.env,THN_DATA_DIR:dir,APP_ENCRYPTION_KEY:managed}})}
for(const source of ['sqlite','legacy'])test(`encryption ${source}: missing, malformed, wrong and recovered keys; ciphertext unchanged`,()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thn-p1-key-'));try{const key=crypto.randomBytes(32),records=[{encryptedCredentials:encrypted(key)}];
 if(source==='sqlite'){const db=new DatabaseSync(path.join(dir,'state.sqlite'));db.exec('CREATE TABLE state(name TEXT PRIMARY KEY,json TEXT NOT NULL)');db.prepare('INSERT INTO state VALUES (?,?)').run('accounts',JSON.stringify(records));db.close()}else fs.writeFileSync(path.join(dir,'trading_accounts.json'),JSON.stringify(records));
 const missing=probe(dir);assert.notEqual(missing.status,0);assert.match(missing.stderr.toString(),/key missing/);assert.equal(fs.existsSync(path.join(dir,'.vault_key')),false);
 fs.writeFileSync(path.join(dir,'.vault_key'),'bad');assert.notEqual(probe(dir).status,0);
 fs.writeFileSync(path.join(dir,'.vault_key'),crypto.randomBytes(32).toString('hex'));assert.notEqual(probe(dir).status,0);
 fs.writeFileSync(path.join(dir,'.vault_key'),key.toString('hex'));for(let i=0;i<2;i++)assert.equal(probe(dir).status,0);
 assert.notEqual(probe(dir,'wrong-test-only-key').status,0);
 if(source==='sqlite'){const db=new DatabaseSync(path.join(dir,'state.sqlite'));assert.deepEqual(JSON.parse(db.prepare("SELECT json FROM state WHERE name='accounts'").get().json),records);db.close()}else assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'trading_accounts.json'))),records);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('empty SQLite generates one private key; managed matching key supports restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thn-p1-empty-'));try{assert.equal(probe(dir).status,0);const key=fs.readFileSync(path.join(dir,'.vault_key'),'utf8');assert.equal(probe(dir).status,0);assert.equal(fs.readFileSync(path.join(dir,'.vault_key'),'utf8'),key);assert.equal(fs.statSync(path.join(dir,'.vault_key')).mode&0o777,0o600);
 const managed='test-only-managed-key',db=new DatabaseSync(path.join(dir,'state.sqlite'));db.prepare('INSERT INTO state VALUES (?,?)').run('accounts',JSON.stringify([{encryptedCredentials:encrypted(crypto.scryptSync(managed,'thn_ai_salt',32))}]));db.close();assert.equal(probe(dir,managed).status,0);assert.equal(probe(dir,managed).status,0);assert.notEqual(probe(dir).status,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
function bars(end,step){return Array.from({length:40},(_,i)=>({time:end-(40-i)*step,open:1,high:2,low:.5,close:1.5,volume:1}))}
test('candle freshness separately validates current history, weekends, closures and ancient bars',()=>{
 const monday=Date.UTC(2026,9,12,8),hour=3600000;
 assert.equal(candleStatus(bars(monday,hour),'intraday','Forex',monday).current,true);
 const friday=Date.UTC(2026,9,9,21);const weekend=candleStatus(bars(friday,hour),'intraday','Forex',monday);assert.equal(weekend.current,false);assert.equal(weekend.closureCompatible,true);
 assert.equal(candleStatus(bars(friday,hour),'intraday','Crypto',monday).closureCompatible,false);
 assert.equal(candleStatus(bars(monday-15*hour,hour),'intraday','Index',monday).closureCompatible,true);
 const ancient=candleStatus(bars(monday-363*86400000,hour),'intraday','Forex',monday);assert.equal(ancient.current,false);assert.equal(ancient.closureCompatible,false);
 for(const timeframe of ['scalp','intraday','h4','swing','position']){const step={scalp:900000,intraday:hour,h4:4*hour,swing:86400000,position:86400000}[timeframe];assert.equal(candleStatus(bars(monday,step),timeframe,'Forex',monday).current,true)}
 const dst=bars(monday,86400000);for(let i=20;i<dst.length;i++)dst[i].time-=3600000;assert.equal(candleStatus(dst,'swing','Forex',monday).current,true);
 assert.throws(()=>candleStatus(bars(monday,86400000),'intraday','Forex',monday),/cadence/);
 assert.throws(()=>candleStatus(bars(monday,900000),'intraday','Forex',monday),/timeframe/);
 assert.throws(()=>candleStatus(bars(monday+hour,hour),'intraday','Forex',monday));
 assert.throws(()=>assertPaperMarket({provenance:{verified:true,state:'REAL',candlesCurrent:false},quotePrice:1,marketTime:Date.now()}));
});
test('fresh quotes with stale history cannot execute orders or activate opportunities',async()=>{
 const s=await startTestServer({THN_TEST_PROVIDER_MODE:'old-history'});try{const quote=await(await fetch(s.url+'/api/market/EURUSD')).json();assert.equal(quote.provenance.quoteFresh,true);assert.equal(quote.provenance.state,'STALE');assert.equal(quote.provenance.verified,false);assert.equal(quote.provenance.fresh,false);
 const r=await fetch(s.url+'/api/orders/execute',{method:'POST',headers,body:JSON.stringify({accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:.1,stopLoss:1.08,takeProfit:1.1,idempotencyKey:'ancient'})});assert.equal(r.status,502);
 const scan=await(await fetch(s.url+'/api/watchlist/scan',{method:'POST',headers,body:JSON.stringify({symbols:['EURUSD'],minConfidence:50})})).json();assert.equal(scan.strongAlertCount,0);assert.equal(scan.results[0].automation.active,false);
 }finally{await s.stop()}
});
test('account API preserves zero, handles missing values conservatively and rejects corrupt numbers',async()=>{
 const s=await startTestServer();let db;try{await fetch(s.url+'/api/accounts',{headers});db=new DatabaseSync(path.join(s.dir,'state.sqlite'));const records=JSON.parse(db.prepare("SELECT json FROM state WHERE name='accounts'").get().json);const save=()=>db.prepare("UPDATE state SET json=? WHERE name='accounts'").run(JSON.stringify(records));
 Object.assign(records[0],{balance:1000,equity:0,freeMargin:0,usedMargin:0,marginLevel:0,dailyRealizedPnl:0});save();let response=await(await fetch(s.url+'/api/accounts',{headers})).json();for(const field of ['equity','freeMargin','usedMargin','marginLevel','dailyRealizedPnl'])assert.equal(response.accounts[0][field],0);
 records[0].equity=null;delete records[0].freeMargin;save();response=await(await fetch(s.url+'/api/accounts',{headers})).json();assert.equal(response.accounts[0].equity,1000);assert.equal(response.accounts[0].freeMargin,0);
 records[0].equity='NaN';save();assert.equal((await fetch(s.url+'/api/accounts',{headers})).status,503);
 }finally{db?.close();await s.stop()}
});
test('financial sanitizer distinguishes NaN, infinity, strings, null and zero',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thn-p1-numbers-'));try{const r=spawnSync(process.execPath,['--input-type=module','-e',`import assert from 'node:assert/strict';import {sanitizeAccountForClient} from './server/accountStore.js';import {closeStorage} from './server/storage.js';for(const field of ['balance','equity','freeMargin','usedMargin','marginLevel','startingBalance','leverage','dailyRealizedPnl','todayTradesCount']){for(const value of [NaN,Infinity,-Infinity,'0','bad'])assert.throws(()=>sanitizeAccountForClient({[field]:value}),/Invalid persisted/);assert.equal(sanitizeAccountForClient({[field]:0})[field],0)}assert.equal(sanitizeAccountForClient({balance:1000,equity:null,freeMargin:null}).freeMargin,0);await closeStorage();`],{env:{...process.env,THN_DATA_DIR:dir,APP_ENCRYPTION_KEY:'test-only'}});assert.equal(r.status,0,r.stderr.toString())}finally{fs.rmSync(dir,{recursive:true,force:true})}
});
