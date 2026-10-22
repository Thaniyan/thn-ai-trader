"""Full current-application browser gate against the production package, offline.
All canonical v6.6 suites and both v7 suites run; failure in any suite blocks CI.
"""
import os,pathlib,subprocess,sys,time,select,shutil
root=pathlib.Path(__file__).resolve().parents[2];os.chdir(root)
out=root/'work';out.mkdir(exist_ok=True);(out/'v7').mkdir(exist_ok=True)
env={**os.environ,'VERCEL':'1','THN_AI_ENABLED':'0','THN_LOCAL_PAPER':'0','TEST_OUTPUT':str(out/'v7')}
if not env.get('CHROMIUM_PATH'):
 from playwright.sync_api import sync_playwright
 with sync_playwright() as p:env['CHROMIUM_PATH']=shutil.which('chromium') or p.chromium.executable_path
if not env.get('AXE_PATH'):raise SystemExit('AXE_PATH must reference pinned axe-core tooling')
server=subprocess.Popen(['node','--import','./tests/browser-provider.js','tests/packaged-launch.mjs'],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
 ready,_,_=select.select([server.stdout],[],[],10)
 if not ready:raise RuntimeError('Packaged browser server startup timed out')
 line=server.stdout.readline().strip()
 if not line.startswith('THN_TEST_PORT='):raise RuntimeError('Packaged browser server failed: '+line)
 env['TEST_URL']='http://127.0.0.1:'+line.split('=')[1]
 suites=['workstation','research','research_outage','quality','decision','library_reliability','maturity','terminal','intelligence','intelligence_memory','layout','pilot','trust','professional','journal_lifecycle','trading_remediation','evolution']
 failures=[]
 for name in suites:
  target='tests/browser_'+name+'.py';log=out/('ci-browser-'+name+'.log')
  with log.open('w') as stream:
   try:result=subprocess.run([sys.executable,target],env=env,stdout=stream,stderr=subprocess.STDOUT,timeout=360 if name=='professional' else 240);code=result.returncode
   except subprocess.TimeoutExpired:code=124
  print(target+': '+('PASS' if code==0 else 'FAIL ('+str(code)+')'),flush=True)
  if code:failures.append(name);print(log.read_text()[-2500:],flush=True)
 if failures:raise SystemExit('Failed browser suites: '+', '.join(failures))
finally:
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill();server.wait()
