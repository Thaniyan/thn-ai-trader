// Local-only supervisor and recovery tools. No deploy/provision/purchase operations.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {DatabaseSync,backup as sqliteBackup} from 'node:sqlite';
const local=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(local);
const state=path.join(root,'.local-staging'),data=path.join(state,'database','local-staging');
const configFile=path.join(state,'credentials.json'),controlFile=path.join(state,'controller.json');
const certificate=path.join(state,'caddy-data','caddy','pki','authorities','local','root.crt');
const backend=path.join(root,'backend'),frontend=path.join(root,'frontend','public');
const caddy=process.env.CADDY_BIN||(fs.existsSync(path.join(root,'tools','bin','caddy'))?path.join(root,'tools','bin','caddy'):'caddy');
const fail=message=>{throw Error(message)};
function readPrivateJson(file){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{fail('Private local configuration/metadata is invalid; recover from a matching local backup')}}
function privateDirectory(dir){fs.mkdirSync(dir,{recursive:true,mode:0o700});fs.chmodSync(dir,0o700)}
function writePrivate(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'})}
function configuration(){
  if(!fs.existsSync(configFile))fail('Run init first');
  if(fs.realpathSync(configFile)!==configFile)fail('Credentials must not be redirected through a symlink');
  if(fs.statSync(configFile).mode&0o077)fail('Credentials must be private: chmod 600 .local-staging/credentials.json');
  const cfg=readPrivateJson(configFile);
  if(cfg.origin!=='https://localhost:8443'||cfg.dataDir!==data||[cfg.primaryToken,cfg.secondaryToken,cfg.encryptionKey].some(value=>typeof value!=='string'||!/^([0-9a-f]{64})$/.test(value)))fail('Invalid dedicated local configuration; do not import production config');
  if(!fs.existsSync(data)||fs.statSync(data).mode&0o077)fail('Local data directory must have private Linux permissions');
  if(fs.realpathSync(state)!==state||fs.realpathSync(data)!==data)fail('Local storage must not be redirected through symlinks');
  return cfg;
}
function environment(cfg){return {...process.env,NODE_ENV:'production',NODE_OPTIONS:'',PORT:'3000',THN_PUBLIC_ORIGIN:cfg.origin,THN_DATA_DIR:cfg.dataDir,THN_AUTH_TOKEN:cfg.primaryToken,THN_AUTH_USERS:JSON.stringify([{id:'local-secondary',token:cfg.secondaryToken}]),APP_ENCRYPTION_KEY:cfg.encryptionKey,OPENAI_API_KEY:process.env.THN_LOCAL_OPENAI_API_KEY||'',OPENAI_MODEL:process.env.THN_LOCAL_OPENAI_MODEL||'',THN_LOCAL_FRONTEND:frontend,XDG_DATA_HOME:path.join(state,'caddy-data'),XDG_CONFIG_HOME:path.join(state,'caddy-config')}}
function fingerprint(pid){try{const text=fs.readFileSync(`/proc/${pid}/stat`,'utf8');const fields=text.slice(text.lastIndexOf(')')+2).split(' ');return fields[0]==='Z'?null:fields[19]}catch{return null}}
function owned(record){
  if(!record||record.start===null||fingerprint(record.pid)!==record.start)return false;
  const allowed=[fileURLToPath(import.meta.url),pathToFileURL(path.join(local,'loopback.mjs')).href,path.join(local,'Caddyfile')];
  if(!allowed.includes(record.marker))return false;
  try{return fs.readFileSync(`/proc/${record.pid}/cmdline`,'utf8').split('\0').includes(record.marker)}catch{return false}
}
function control(){try{return JSON.parse(fs.readFileSync(controlFile,'utf8'))}catch{return null}}
async function requireStopped(){const record=control();if(owned(record)||record?.children?.some(owned))fail('Stop the managed local services first');await portFree(3000);await portFree(8443);if(record)fs.unlinkSync(controlFile)}
async function portFree(port){await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',()=>reject(Error(`Local port ${port} is occupied; do not stop unrelated services`)));server.listen(port,'127.0.0.1',()=>server.close(resolve))})}
function request(route,{method='GET',body,cookie,token,origin='https://localhost:8443'}={}){
  return new Promise((resolve,reject)=>{
    const headers={Origin:origin};if(body)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;if(token)headers.Authorization='Bearer '+token;
    const req=https.request('https://localhost:8443'+route,{host:'localhost',family:4,method,headers,ca:fs.readFileSync(certificate),timeout:45000},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>{let json;try{json=JSON.parse(text)}catch{}resolve({status:res.statusCode,headers:res.headers,json})})});req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Local request timed out')));req.end(body?JSON.stringify(body):undefined);
  });
}
async function start(){
  configuration();const record=control();if(owned(record)){console.log('Local staging already running');return}await requireStopped();
  await portFree(3000);await portFree(8443);
  const log=fs.openSync(path.join(state,'supervisor.log'),'a',0o600);
  const child=spawn(process.execPath,[fileURLToPath(import.meta.url),'serve'],{cwd:root,env:process.env,detached:true,stdio:['ignore',log,log]});child.unref();fs.closeSync(log);
  for(let i=0;i<100;i++){await delay(100);try{const r=await request('/api/health');if(r.status===200&&r.json?.liveExecutionEnabled===false){console.log('Local staging ready: https://localhost:8443');return}}catch{}if(child.exitCode!==null)break}
  fail('Startup did not become ready; inspect private .local-staging/supervisor.log and use status/stop');
}
async function stop(){
  const record=control();if(!record){console.log('Local services already stopped');return}
  if(owned(record))process.kill(record.pid,'SIGTERM');else for(const child of record.children||[])if(owned(child))process.kill(child.pid,'SIGTERM');
  for(let i=0;i<400;i++){if(!owned(record)&&!(record.children||[]).some(owned)){if(fs.existsSync(controlFile))fs.unlinkSync(controlFile);console.log('Local services stopped');return}await delay(100)}
  fail('Stop timeout. Do not delete SQLite locks or kill unrelated processes; inspect owned process records');
}
async function serve(){
  const cfg=configuration();await requireStopped();
  const record={pid:process.pid,start:fingerprint(process.pid),marker:fileURLToPath(import.meta.url),children:[]};writePrivate(controlFile,record);
  const env=environment(cfg),children=[];let stopping=false;
  async function shutdown(){
    if(stopping)return;stopping=true;
    for(const child of children)if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');
    await Promise.all(children.map(child=>child.exitCode!==null||child.signalCode!==null?Promise.resolve():new Promise(r=>child.once('exit',r))));
    if(control()?.pid===process.pid)fs.unlinkSync(controlFile);process.exitCode=0;
  }
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,shutdown);
  try{
    for(const filename of ['.env','.vault_key','trading_accounts.json','audit_log.json'])if(fs.existsSync(path.join(backend,filename)))fail('Backend release contains forbidden legacy/config data');
    const validation=spawnSync(caddy,['validate','--config',path.join(local,'Caddyfile'),'--adapter','caddyfile'],{env,stdio:'ignore'});if(validation.status!==0)fail('Caddy unavailable or configuration invalid; run local/install-tools.sh');
    const api=spawn(process.execPath,['--import',pathToFileURL(path.join(local,'loopback.mjs')).href,'server.js'],{cwd:backend,env,stdio:['ignore','inherit','inherit']});children.push(api);
    const edge=spawn(caddy,['run','--config',path.join(local,'Caddyfile'),'--adapter','caddyfile'],{cwd:root,env,stdio:['ignore','inherit','inherit']});children.push(edge);
    for(const child of children){record.children.push({pid:child.pid,start:fingerprint(child.pid),marker:child===api?pathToFileURL(path.join(local,'loopback.mjs')).href:path.join(local,'Caddyfile')});child.on('error',()=>{console.error('Local child failed; stopping');shutdown()});child.once('exit',()=>{if(!stopping){console.error('Local child exited; stopping remaining services');shutdown()}})}
    fs.writeFileSync(controlFile,JSON.stringify(record),{mode:0o600});
  }catch{console.error('Local supervisor failed. Check tools, ports and private configuration.');await shutdown();process.exitCode=1}
}
async function verify(restart){
  const cfg=configuration(),assert=(value,message)=>{if(!value)fail('Validation failed: '+message)};
  assert((await request('/')).status===200,'static frontend');
  assert((await request('/.local-staging/credentials.json')).status===404,'private state not served');
  const health=await request('/api/health');assert(health.json?.liveExecutionEnabled===false,'live execution disabled');
  assert((await request('/api/accounts')).status===401,'anonymous account access');
  assert((await request('/api/session',{method:'POST',body:{token:cfg.primaryToken},origin:'https://other.invalid'})).status===403,'CSRF origin boundary');
  const login=await request('/api/session',{method:'POST',body:{token:cfg.primaryToken}});const header=login.headers['set-cookie']?.[0];
  assert(login.status===200&&header&&['Secure','HttpOnly','SameSite=Strict','Max-Age=28800'].every(value=>header.includes(value)),'secure session cookie');const cookie=header.split(';')[0];
  assert((await request('/api/accounts',{cookie})).status===200,'same-origin cookie forwarding');
  const result=await request('/api/accounts/connect',{method:'POST',cookie,body:{broker:'paper',balance:12345.67,accountNumber:'LOCAL-VALIDATION-'+crypto.randomUUID()}});assert(result.status===200,'paper account registration');const id=result.json.account.id;
  assert((await request('/api/ledger?accountId='+id,{token:cfg.secondaryToken})).status===403,'cross-owner denial');
  assert((await request('/api/accounts/connect',{method:'POST',cookie,body:{broker:'xtb'}})).status===403,'non-paper broker denied');
  if(restart){await stop();await start();assert((await request('/api/accounts',{cookie})).status===401,'restart session revocation');const accounts=await request('/api/accounts',{token:cfg.primaryToken});assert(accounts.json.accounts.some(a=>a.id===id&&a.balance===12345.67),'database and key persistence')}
  else assert((await request('/api/session',{method:'DELETE',cookie})).status===200,'logout');
  assert((await request('/api/accounts',{cookie})).status===401,'old session rejected');
  console.log('PASS: TLS, static/API routing, cookies, CSRF, authentication, ownership, paper-only registration, logout/restart behavior and storage.');
  console.log('Real market data, browser behavior and paper order execution remain separate checks. No paid API key used.');
}
async function marketCheck(){
  const quote=await request('/api/market/EURUSD');
  if(quote.status!==200){console.log('BLOCKED: free market provider unavailable; do not submit paper orders using substitute prices.');return}
  const p=quote.json?.provenance;
  if(!p||p.executable!==false)fail('Market provenance missing or incorrectly executable');
  if(p.fresh&&(!p.quoteFresh||!p.candlesCurrent||!p.verified||p.state!=='REAL'))fail('Market freshness/provenance mismatch');
  const scan=await request('/api/watchlist/scan',{method:'POST',body:{symbols:['EURUSD'],minConfidence:50}});
  if(scan.status!==200){console.log('BLOCKED: analysis unavailable; no readiness claim.');return}
  for(const result of scan.json.results||[])if(!result.provenance?.fresh&&(result.automation?.active||result.decision!=='WAIT'))fail('Stale analysis unexpectedly actionable');
  console.log(p.fresh?'PASS: real free-provider quote/candle provenance; all prices remain non-executable for live trading.':'STALE: closed market or old history; opportunities and orders remain blocked by design.');
}
async function backup(){
  const cfg=configuration(),dir=path.join(state,'backups',new Date().toISOString().replace(/[:.]/g,'-'));privateDirectory(dir);
  const db=new DatabaseSync(path.join(data,'state.sqlite'),{readOnly:true});try{await sqliteBackup(db,path.join(dir,'state.sqlite'))}finally{db.close()}
  fs.chmodSync(path.join(dir,'state.sqlite'),0o600);fs.copyFileSync(configFile,path.join(dir,'credentials.json'));fs.chmodSync(path.join(dir,'credentials.json'),0o600);
  const dbCopy=new DatabaseSync(path.join(dir,'state.sqlite'),{readOnly:true});try{if(dbCopy.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')fail('Backup integrity check failed')}finally{dbCopy.close()}
  writePrivate(path.join(dir,'manifest.json'),{instance:cfg.instance,sha256:Object.fromEntries(['state.sqlite','credentials.json'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex')]))});
  console.log('Private backup created: '+path.basename(dir));
}
function archiveData(){const dir=path.join(state,'archives',new Date().toISOString().replace(/[:.]/g,'-'));privateDirectory(dir);fs.renameSync(data,path.join(dir,'database'));fs.copyFileSync(configFile,path.join(dir,'credentials.json'));fs.chmodSync(path.join(dir,'credentials.json'),0o600);privateDirectory(data)}
async function main(){
  if(process.platform!=='linux')fail('Run this inside WSL2 Ubuntu, not Windows Node');
  const [major,minor]=process.versions.node.split('.').map(Number);if(major!==24||minor<5)fail('Node 24.x, minimum 24.5, required');
  const [command,arg,confirmation]=process.argv.slice(2);
  if(command==='init'){
    if(fs.existsSync(configFile)){configuration();console.log('Existing local configuration preserved');return}
    if(!fs.existsSync(backend)||!fs.existsSync(frontend))fail('Use the prepared local release package');
    if(fs.existsSync(state)&&fs.readdirSync(state).length)fail('Existing local state without credentials; restore the matching local configuration, never reinitialize');
    privateDirectory(state);privateDirectory(data);writePrivate(configFile,{instance:crypto.randomUUID(),origin:'https://localhost:8443',dataDir:data,primaryToken:crypto.randomBytes(32).toString('hex'),secondaryToken:crypto.randomBytes(32).toString('hex'),encryptionKey:crypto.randomBytes(32).toString('hex')});
    console.log('Dedicated private local configuration created. Keys/tokens were not printed.');
  }else if(command==='serve')await serve();else if(command==='start')await start();else if(command==='stop')await stop();
  else if(command==='status'){const record=control();console.log(owned(record)?'Managed local services running':'Managed local services stopped or require recovery')}
  else if(command==='verify')await verify(arg==='--restart');
  else if(command==='token'){const cfg=configuration();console.log(arg==='secondary'?cfg.secondaryToken:cfg.primaryToken)}
  else if(command==='certificate'){if(!fs.existsSync(certificate))fail('Start services first');fs.copyFileSync(certificate,path.join(root,'THN-local-root.crt'));console.log('Public CA certificate exported: THN-local-root.crt. Never export private CA keys.');}
  else if(command==='market-check')await marketCheck();
  else if(command==='backup')await backup();
  else if(command==='reset'){configuration();await requireStopped();if(fs.existsSync(path.join(data,'.writer.lock')))fail('Resolve the existing writer lock before reset');if(arg!=='--confirm-local-reset')fail('Requires --confirm-local-reset; old data is archived');archiveData();console.log('Local data reset; old database/key archived privately. Auth configuration preserved.');}
  else if(command==='restore'){
    const cfg=configuration();await requireStopped();if(fs.existsSync(path.join(data,'.writer.lock')))fail('Resolve the existing writer lock before restore');if(!arg||path.basename(arg)!==arg||confirmation!=='--confirm-local-restore')fail('Use restore BACKUP-NAME --confirm-local-restore');const source=path.join(state,'backups',arg),manifest=readPrivateJson(path.join(source,'manifest.json'));
    if(manifest.instance!==cfg.instance)fail('Backup is not from this dedicated local instance');
    for(const f of ['state.sqlite','credentials.json'])if(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,f))).digest('hex')!==manifest.sha256[f])fail('Backup checksum mismatch');
    const db=new DatabaseSync(path.join(source,'state.sqlite'),{readOnly:true});try{if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')fail('Backup corrupt');const row=db.prepare("SELECT json FROM state WHERE name='accounts'").get();if(row&&JSON.parse(row.json).some(a=>a.broker!=='paper'||a.tradingMode!=='PAPER'))fail('Backup is not paper-only')}finally{db.close()}
    const saved=readPrivateJson(path.join(source,'credentials.json'));if(saved.instance!==cfg.instance||saved.dataDir!==data)fail('Backup configuration mismatch');
    archiveData();fs.copyFileSync(path.join(source,'state.sqlite'),path.join(data,'state.sqlite'));fs.chmodSync(path.join(data,'state.sqlite'),0o600);fs.copyFileSync(path.join(source,'credentials.json'),configFile);fs.chmodSync(configFile,0o600);console.log('Local snapshot restored with matching keys; newer data archived. Restart and validate.');
  }else if(command==='recover-lock'){const cfg=configuration();await requireStopped();const r=spawnSync(process.execPath,['scripts/recover-writer-lock.mjs','--service-stopped'],{cwd:backend,env:environment(cfg),stdio:'inherit'});if(r.status)fail('Manual local lock recovery refused')}
  else fail('Commands: init | start | stop | status | verify [--restart] | token [secondary] | certificate | market-check | backup | reset --confirm-local-reset | restore NAME --confirm-local-restore | recover-lock');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
