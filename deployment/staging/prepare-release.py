"""Local preparation only; no network, credentials, installation or deployment."""
import hashlib,json,pathlib,subprocess,sys,tarfile,io,shutil
root=pathlib.Path(__file__).resolve().parents[2]
if len(sys.argv)!=2: raise SystemExit('Usage: python deployment/staging/prepare-release.py /absolute/new-output-directory')
out=pathlib.Path(sys.argv[1])
if not out.is_absolute() or out.exists(): raise SystemExit('Output must be a new absolute directory')
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
paths=['server.js','server','public','package.json','bun.lock','scripts/backup-sqlite.mjs','scripts/recover-writer-lock.mjs']
archive=subprocess.check_output(['git','archive','--format=tar',sha,*paths],cwd=root)
out.mkdir(parents=True,mode=0o700)
backend=out/'backend';backend.mkdir()
with tarfile.open(fileobj=io.BytesIO(archive)) as source:
 for member in source.getmembers():
  if set(pathlib.PurePosixPath(member.name).parts)&{'.env','.vault_key','.runtime','trading_accounts.json','audit_log.json','node_modules'}:raise SystemExit('Forbidden artifact in release')
 source.extractall(backend,filter='data')
addons=backend/'deployment'/'staging';addons.mkdir(parents=True)
shutil.copyfile(root/'deployment/staging/preflight.mjs',addons/'preflight.mjs')
frontend=out/'frontend';frontend.mkdir()
shutil.copytree(backend/'public',frontend/'public')
shutil.copyfile(root/'deployment/staging/vercel.json.example',frontend/'vercel.json')
files={str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file()}
(out/'manifest.json').write_text(json.dumps({'applicationCommit':sha,'status':'LOCAL_ONLY_UNDEPLOYED','configuration':'Includes reviewed local staging templates; placeholders require approval and editing','sha256':files},indent=2)+'\n')
print(json.dumps({'applicationCommit':sha,'backendFiles':sum(p.is_file() for p in backend.rglob('*')),'frontendFiles':sum(p.is_file() for p in frontend.rglob('*')),'state':'Prepared locally; not deployed'}))
