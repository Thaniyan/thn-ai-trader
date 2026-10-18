"""Read-only local-kit inventory. Outputs counts/status only, never credential values or DB rows."""
import hashlib,json,os,shutil,sqlite3,subprocess,sys
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
manifest=root/'manifest.json';report={'root':str(root),'releaseCommit':None}
if manifest.is_file():report['releaseCommit']=json.loads(manifest.read_text()).get('commit')
package=root/'backend/package.json'
if package.is_file():report['applicationVersion']=json.loads(package.read_text()).get('version')
for tool in ['node','caddy']:
 try:report[tool+'Version']=subprocess.check_output([tool,'--version' if tool=='node' else 'version'],text=True,stderr=subprocess.DEVNULL).splitlines()[0]
 except Exception:report[tool+'Version']='not found in PATH'
usage=shutil.disk_usage(root);report['freeDiskBytes']=usage.free
state=root/'.local-staging';data=state/'database/local-staging';dbfile=data/'state.sqlite'
report['legacyBackendConfigPresent']=any((root/'backend'/name).exists() for name in ['.env','.vault_key','trading_accounts.json','audit_log.json'])
report['writerLockPresent']=(data/'.writer.lock').exists()
report['credentialFilePresent']=(state/'credentials.json').is_file()
report['credentialFilePrivate']=(state/'credentials.json').is_file() and not ((state/'credentials.json').stat().st_mode&0o077)
report['certificatePresent']=(state/'caddy-data/caddy/pki/authorities/local/root.crt').is_file()
report['activeDataBytes']=sum(p.stat().st_size for p in data.glob('*') if p.is_file()) if data.exists() else 0
report['sourceRollbackPresent']=(root/'.release-code-previous').is_dir()
if dbfile.is_file():
 connection=sqlite3.connect(dbfile.as_uri()+'?mode=ro',uri=True,timeout=2)
 try:
  connection.execute('PRAGMA query_only=ON')
  report['sqliteIntegrity']=connection.execute('PRAGMA integrity_check').fetchone()[0]
  tables={row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
  report['requiredTablesPresent']={'state','idempotency','audit','ledger'}<=tables
  report['schemaSha256']=hashlib.sha256('\n'.join(str(row) for row in connection.execute("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name")).encode()).hexdigest()
  row=connection.execute("SELECT json FROM state WHERE name='accounts'").fetchone();accounts=json.loads(row[0]) if row else []
  positions=[p for a in accounts for p in a.get('positions',[])];orders=[o for a in accounts for o in a.get('orders',[])]
  report.update(accountCount=len(accounts),openPositionCount=len(positions),goldPositionCount=sum(p.get('symbol') in ['XAUUSD','GOLD','XAU'] for p in positions),pendingOrderCount=len(orders),paperOnly=all(a.get('broker')=='paper' and a.get('tradingMode')=='PAPER' for a in accounts))
 finally:connection.close()
else:report['sqliteIntegrity']='database not found'
backups=[]
for folder in sorted((state/'backups').glob('*')):
 if not folder.is_dir():continue
 try:
  m=json.loads((folder/'manifest.json').read_text());valid=all(hashlib.sha256((folder/name).read_bytes()).hexdigest()==m['sha256'][name] for name in ['state.sqlite','credentials.json']);backups.append(valid)
 except Exception:backups.append(False)
report['backupCount']=len(backups);report['verifiedBackupCount']=sum(backups)
report['diskHeadroomForBackup']=usage.free>max(100*1024*1024,report['activeDataBytes']*3)
report['notes']=['Inventory uses SQLite mode=ro/query_only; no SQL mutation, backup creation, key rotation or service restart.', 'A writer lock is not proof of a live writer. Do not delete it to force an upgrade.', 'Counts do not establish current executable prices. Inspect owner-authenticated recovery status after an approved candidate evaluation.', 'Do not share credentials, backup files or raw database rows.']
print(json.dumps(report,indent=2))
