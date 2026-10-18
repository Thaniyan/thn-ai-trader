"""Approval-gated, source-only transition with recoverable mixed-file rollback.
Never creates fills, resets data, rotates keys, imports backups or restarts services.
"""
import argparse,hashlib,json,os,re,shutil,socket,sqlite3
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('action',choices=['apply','rollback']);parser.add_argument('instance');parser.add_argument('candidate');parser.add_argument('--expected-sha',required=True);parser.add_argument('--explicitly-approved',action='store_true');parser.add_argument('--acknowledge-open-positions',action='store_true');args=parser.parse_args()
if not args.explicitly_approved:raise SystemExit('Separate explicit approval is required; no changes made')
if not re.fullmatch('[0-9a-f]{40}',args.expected_sha):raise SystemExit('Pin the exact approved commit')
root=Path(args.instance).resolve();candidate=Path(args.candidate).resolve();backup=root/'.release-code-previous'
if root==candidate:raise SystemExit('Candidate must be separate from the instance')
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def safe(base,name):
 relative=Path(name)
 if relative.is_absolute() or '..' in relative.parts or any(part in {'.local-staging','.git','.env','.vault_key','credentials.json','node_modules'} for part in relative.parts):raise SystemExit('Protected path rejected')
 p=base/relative
 if p.is_symlink() or not p.resolve().is_relative_to(base):raise SystemExit('Symlink boundary rejected')
 return p
def record(path,data):
 temp=path.with_name(path.name+'.new')
 if temp.exists():temp.rename(path.with_name(path.name+'.interrupted-'+os.urandom(4).hex()))
 payload=json.dumps(data,indent=2)+'\n'
 with temp.open('x') as f:os.chmod(temp,0o600);f.write(payload);f.flush();os.fsync(f.fileno())
 os.replace(temp,path)
def copy_atomic(source,destination,nonce):
 destination.parent.mkdir(parents=True,exist_ok=True);temp=destination.with_name(destination.name+'.transition-'+nonce)
 with temp.open('xb') as f:f.write(source.read_bytes());f.flush();os.fsync(f.fileno())
 shutil.copymode(source,temp);os.replace(temp,destination)
lock=root/'.local-staging/database/local-staging/.writer.lock'
if any((root/'backend'/name).exists() for name in ['.env','.vault_key','trading_accounts.json','audit_log.json']):raise SystemExit('Legacy backend config/data needs separate review; refusing transition')
if lock.exists():raise SystemExit('A writer lock exists. Stop/recover the owned service normally; never delete a live lock')
dbfile=root/'.local-staging/database/local-staging/state.sqlite'
if not dbfile.is_file():raise SystemExit('Expected existing dedicated local-kit state')
connection=sqlite3.connect(dbfile.as_uri()+'?mode=ro',uri=True)
try:
 connection.execute('PRAGMA query_only=ON')
 if connection.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise SystemExit('Database integrity failure')
 row=connection.execute("SELECT json FROM state WHERE name='accounts'").fetchone();accounts=json.loads(row[0]) if row else []
 if any(a.get('broker')!='paper' or a.get('tradingMode')!='PAPER' for a in accounts):raise SystemExit('Non-paper state requires review; refusing transition')
 if any(a.get('positions') or a.get('orders') for a in accounts) and not args.acknowledge_open_positions:raise SystemExit('Existing positions/orders retained: review recovery limitations and explicitly acknowledge before transition')
finally:connection.close()
ports=[]
try:
 # Keep the managed kit from restarting during a source transition; never stop another listener.
 for port in [3000,8443]:
  sock=socket.socket();sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);sock.bind(('127.0.0.1',port));sock.listen(1);ports.append(sock)
 if args.action=='apply':
  known=json.loads((Path(__file__).parent/'known-releases.json').read_text());old=json.loads((root/'manifest.json').read_text());new=json.loads((candidate/'manifest.json').read_text())
  if new['commit']!=args.expected_sha:raise SystemExit('Candidate commit mismatch')
  expected=known.get(old['commit'])
  if expected is None or old['sha256']!=expected:raise SystemExit('Unknown/modified installed release; inventory and review required')
  if backup.exists():raise SystemExit('Prior code backup preserved; refusing overwrite')
  for name,h in expected.items():
   if digest(safe(root,name))!=h:raise SystemExit('Installed source modified: '+name)
  for name,h in new['sha256'].items():
   if not (name.startswith(('backend/','frontend/public/','local/')) or name=='START-HERE.md'):raise SystemExit('Unexpected asset path')
   if digest(safe(candidate,name))!=h:raise SystemExit('Candidate integrity failure')
   if name not in expected and safe(root,name).exists():raise SystemExit('Destination collision: '+name)
  backup.mkdir(mode=0o700);created=[];names=['manifest.json']+sorted(new['sha256'])
  for name in names:
   destination=safe(root,name)
   if destination.exists():saved=safe(backup,name);saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(destination,saved)
   else:created.append(name)
  data={'oldCommit':old['commit'],'newCommit':new['commit'],'oldHashes':expected,'newHashes':new['sha256'],'created':created,'nonce':os.urandom(8).hex(),'phase':'prepared','oldManifestHash':digest(root/'manifest.json'),'newManifestHash':digest(candidate/'manifest.json')}
  record(backup/'transition.json',data)
  for name in names:copy_atomic(safe(candidate,name),safe(root,name),data['nonce'])
  data['phase']='installed';record(backup/'transition.json',data)
  print('Candidate source installed. Existing data, credentials, CA, dependencies and backups retained; services remain stopped.')
 else:
  data=json.loads((backup/'transition.json').read_text())
  if data['newCommit']!=args.expected_sha:raise SystemExit('Rollback candidate mismatch')
  if (root/'manifest.json').exists() and digest(root/'manifest.json') not in {data['oldManifestHash'],data['newManifestHash']}:raise SystemExit('Unrecognized manifest edit; refusing rollback')
  # Accept known old/new mixtures after interruption, but never overwrite an unknown local edit.
  for name,newHash in data['newHashes'].items():
   destination=safe(root,name)
   if destination.exists() and digest(destination) not in {newHash,data['oldHashes'].get(name)}:raise SystemExit('Unrecognized local edit; refusing rollback: '+name)
  for name in ['manifest.json']+list(data['newHashes']):
   temp=safe(root,name).with_name(Path(name).name+'.transition-'+data['nonce'])
   if temp.exists():temp.unlink()
  for name in data['created']:
   destination=safe(root,name)
   if destination.exists():destination.unlink()
  for source in backup.rglob('*'):
   if source.is_file() and source.name not in ['transition.json','transition.json.new']:
    name=str(source.relative_to(backup));copy_atomic(source,safe(root,name),data['nonce'])
  for name in ['manifest.json']+list(data['newHashes']):
   temp=safe(root,name).with_name(Path(name).name+'.transition-'+data['nonce'])
   if temp.exists():temp.unlink()
  for name,h in data['oldHashes'].items():
   if digest(safe(root,name))!=h:raise SystemExit('Rollback verification failed')
  data['phase']='rolled-back';record(backup/'transition.json',data)
  print('Previous source restored. Compatible current paper data retained; no database rollback or service restart performed.')
finally:
 for sock in ports:sock.close()
