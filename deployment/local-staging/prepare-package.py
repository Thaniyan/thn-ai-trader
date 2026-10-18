"""Build a sanitized transferable local release from a committed Git snapshot."""
import hashlib,io,json,pathlib,shutil,subprocess,sys,tarfile,zipfile
repo=pathlib.Path(__file__).resolve().parents[2]
if len(sys.argv)!=2:raise SystemExit('Usage: python deployment/local-staging/prepare-package.py /absolute/new-package-directory')
out=pathlib.Path(sys.argv[1])
if not out.is_absolute() or out.exists() or out.with_suffix('.zip').exists():raise SystemExit('Choose a new absolute output directory')
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
paths=['server.js','server','public','package.json','bun.lock','scripts','tests','deployment','docs']
raw=subprocess.check_output(['git','archive','--format=tar',sha,*paths],cwd=repo)
out.mkdir(parents=True,mode=0o700);backend=out/'backend';backend.mkdir()
forbidden={'.env','.vault_key','.runtime','.local-staging','trading_accounts.json','audit_log.json','node_modules','credentials.json'}
with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
 for member in archive.getmembers():
  if set(pathlib.PurePosixPath(member.name).parts)&forbidden or member.name.endswith(('.sqlite','.sqlite-wal','.sqlite-shm')):raise SystemExit('Forbidden runtime data in Git export')
 archive.extractall(backend,filter='data')
shutil.copytree(backend/'deployment/local-staging',out/'local')
shutil.copytree(backend/'public',out/'frontend/public')
shutil.copyfile(backend/'docs/local-windows-staging.md',out/'START-HERE.md')
files={str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file()}
(out/'manifest.json').write_text(json.dumps({'commit':sha,'purpose':'LOCAL_ONLY_UNDEPLOYED','sha256':files},indent=2)+'\n')
archive_path=out.with_suffix('.zip')
with zipfile.ZipFile(archive_path,'w',compression=zipfile.ZIP_DEFLATED) as archive:
 for p in sorted(out.rglob('*')):
  if p.is_file():
   info=zipfile.ZipInfo(str(pathlib.Path('thn-local-staging')/p.relative_to(out)),date_time=(2020,1,1,0,0,0))
   info.create_system=3;info.external_attr=(0o100644<<16);info.compress_type=zipfile.ZIP_DEFLATED
   archive.writestr(info,p.read_bytes())
digest=hashlib.sha256(archive_path.read_bytes()).hexdigest();archive_path.with_suffix('.zip.sha256').write_text(digest+'  '+archive_path.name+'\n')
print(json.dumps({'commit':sha,'zip':str(archive_path),'sha256':digest,'runtimeSecretsIncluded':False}))
