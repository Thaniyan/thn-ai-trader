import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {AsyncLocalStorage} from 'node:async_hooks';
export const dataDir=process.env.THN_DATA_DIR||path.resolve('.runtime');
fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
const writerLock=path.join(dataDir,'.writer.lock');
try{fs.writeFileSync(writerLock,String(process.pid),{flag:'wx',mode:0o600})}catch{throw Error('State directory already has a writer; concurrent instances or an unclean shutdown require operator recovery')}
const cleanup=()=>{try{fs.unlinkSync(writerLock)}catch{}};
process.once('exit',cleanup);
export const db=new DatabaseSync(path.join(dataDir,'state.sqlite'));
fs.chmodSync(path.join(dataDir,'state.sqlite'),0o600);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
CREATE TABLE IF NOT EXISTS state (name TEXT PRIMARY KEY,json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS idempotency (key TEXT PRIMARY KEY,hash TEXT NOT NULL,json TEXT);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY,json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ledger (id TEXT PRIMARY KEY,account_id TEXT NOT NULL,json TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ledger_account_idx ON ledger(account_id);
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Append-only audit'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Append-only audit'); END;`);
export const readState=name=>{const row=db.prepare('SELECT json FROM state WHERE name=?').get(name);return row?JSON.parse(row.json):null};
export const writeState=(name,value)=>db.prepare('INSERT INTO state VALUES (?,?) ON CONFLICT(name) DO UPDATE SET json=excluded.json').run(name,JSON.stringify(value));
const context=new AsyncLocalStorage();
let tail=Promise.resolve(),waiting=0,closed=false;
export async function closeStorage(){await tail;if(closed)return;db.exec("PRAGMA wal_checkpoint(TRUNCATE)");db.close();closed=true;cleanup()}
export function commitTransaction(){const ctx=context.getStore();if(ctx&&ctx.begun&&!ctx.finished){try{db.exec('COMMIT');ctx.finished=true}catch(error){db.exec('ROLLBACK');ctx.finished=true;throw error}}}
export function rollbackTransaction(){const ctx=context.getStore();if(ctx&&ctx.begun&&!ctx.finished){db.exec("ROLLBACK");ctx.finished=true}}
export async function withTransaction(fn){
  if(closed)throw Object.assign(Error("Storage closed"),{status:503});
  if(waiting>=64)throw Object.assign(Error("State request capacity reached"),{status:503});
  waiting++;const before=tail;let release;tail=new Promise(resolve=>{release=resolve});await before;waiting--;
  return context.run({finished:false,begun:false},async()=>{const ctx=context.getStore();try{db.exec('BEGIN IMMEDIATE');ctx.begun=true;const result=await fn();commitTransaction();return result}catch(error){if(ctx.begun&&!ctx.finished){db.exec('ROLLBACK');ctx.finished=true}throw error}finally{release()}});
}
export function recordFill(fill,accountId){db.prepare('INSERT INTO ledger VALUES (?,?,?)').run(fill.id,accountId,JSON.stringify(fill))}
export function getLedger(accountIds,{limit=100,before}={}){
  if(!Number.isInteger(limit)||limit<1||limit>500||before!==undefined&&(!Number.isSafeInteger(before)||before<1))throw Object.assign(Error('Invalid ledger pagination'),{status:400});
  if(!accountIds.length)return {fills:[],nextCursor:null};
  const placeholders=accountIds.map(()=>'?').join(',');
  const rows=db.prepare(`SELECT rowid,json FROM ledger WHERE account_id IN (${placeholders}) ${before===undefined?'':'AND rowid < ?'} ORDER BY rowid DESC LIMIT ?`).all(...accountIds,...(before===undefined?[]:[before]),limit+1);
  const page=rows.slice(0,limit);
  return {fills:page.map(row=>JSON.parse(row.json)),nextCursor:rows.length>limit?page.at(-1).rowid:null};
}
