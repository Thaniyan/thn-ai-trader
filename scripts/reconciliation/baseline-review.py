"""Read-only baseline comparison; export source only, fixture providers, loopback only.
Never copy tracked runtime JSON, call a real provider or touch an owner installation.
"""
import pathlib,tempfile,shutil,subprocess,json,os
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--output',required=True,type=pathlib.Path);args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[2];report=args.output
if not report.is_absolute() or report.exists():raise SystemExit('Choose a new absolute report directory')
report.mkdir(parents=True,mode=0o700)
fixture=(root/'tests/fixtures/providers.mjs').as_uri()
with tempfile.TemporaryDirectory(prefix='thn-original-baseline-') as tmp:
 out=pathlib.Path(tmp)
 for n in subprocess.check_output(['git','ls-tree','-r','--name-only','50857dfc1e45a901515b56ffe2ed914d897671af'],cwd=root,text=True).splitlines():
  if n in ['server.js','package.json','tests/system.test.js'] or n.startswith(('server/','public/')):
   dest=out/n;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(subprocess.check_output(['git','show','50857dfc1e45a901515b56ffe2ed914d897671af:'+n],cwd=root))
 preload=out/'fixture.mjs'
 preload.write_text('''import fs from 'node:fs';import http from 'node:http';
const originalFetch=globalThis.fetch;
globalThis.fetch=(input,options)=>{const url=new URL(String(input));if(!['localhost','127.0.0.1'].includes(url.hostname))throw Error('Unmocked network blocked');return originalFetch(input,options)};
await import('FIXTURE_URI');
const fixtureFetch=globalThis.fetch;globalThis.fetch=(input,options)=>fs.existsSync('force-provider-outage')&&!['localhost','127.0.0.1'].includes(new URL(String(input)).hostname)?Promise.resolve(new Response('{}',{status:503})):fixtureFetch(input,options);
const listen=http.Server.prototype.listen;
http.Server.prototype.listen=function(...args){this.once('listening',()=>console.log('THN_BASELINE_URL=http://127.0.0.1:'+this.address().port));return listen.call(this,0,'127.0.0.1',...args.filter(v=>typeof v==='function'))};
'''.replace('FIXTURE_URI',fixture))
 server=subprocess.Popen(['node','--import',str(preload),'server.js'],cwd=out,env={**os.environ,'PORT':'0','OPENAI_API_KEY':'','THN_DATA_DIR':str(out),'APP_ENCRYPTION_KEY':'fixture-only-baseline-key'},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 try:
  url=None
  for line in server.stdout:
   if line.startswith('THN_BASELINE_URL='):url=line.strip().split('=',1)[1];break
  assert url,'Baseline did not start'
  run=subprocess.run(['node','tests/system.test.js'],cwd=out,env={**os.environ,'TEST_URL':url},capture_output=True,text=True,timeout=120)
  (report/'original-system.log').write_text(run.stdout+'\n'+run.stderr)
  probe=subprocess.run(['node','--input-type=module','-e',"""const url=process.argv[1];const accounts=await fetch(url+'/api/accounts');const page=await fetch(url+'/');const csrf=await fetch(url+'/api/risk/calculate',{method:'POST',headers:{Origin:'https://untrusted.invalid','Content-Type':'application/json'},body:JSON.stringify({symbol:'EURUSD',entryPrice:1.085,stopLoss:1.08,takeProfit:1.095,lots:0.1,balance:50000,leverage:200})});const order=await fetch(url+'/api/orders/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountId:'acc_paper_sandbox_01',symbol:'EURUSD',side:'BUY',lots:0.2,stopLoss:1.05,takeProfit:1.25,idempotencyKey:'fixture-baseline-probe'})});const orderData=await order.json();console.log(JSON.stringify({legacyOrderStatus:order.status,legacyOrderCode:orderData.code||null,legacyOrderReason:orderData.error||null,anonymousAccountsStatus:accounts.status,rootStatus:page.status,csp:page.headers.get('content-security-policy'),crossOriginRiskStatus:csrf.status}));""",url],capture_output=True,text=True,check=True)
  (out/'force-provider-outage').write_text('isolated test fault')
  outage=subprocess.run(['node','--input-type=module','-e',"const r=await fetch(process.argv[1]+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:'EURUSD',timeframe:'intraday'})});const d=await r.json();console.log(JSON.stringify({status:r.status,ok:d.ok,source:d.marketDataSource||d.analysis?.market?.source||null,hasAnalysis:Array.isArray(d.candles)}));",url],capture_output=True,text=True,check=True)
  (out/'force-provider-outage').unlink()
  summary={'providerOutageProbe':json.loads(outage.stdout),'commit':'50857dfc1e45a901515b56ffe2ed914d897671af','systemExit':run.returncode,'probes':json.loads(probe.stdout),'runtimeData':'fresh isolated fixture; original tracked JSON never copied','network':'provider fixtures only; unknown network rejected'}
  from playwright.sync_api import sync_playwright
  import shutil
  with sync_playwright() as pw:
   browser=pw.chromium.launch(executable_path=shutil.which('chromium') or pw.chromium.executable_path,args=['--no-sandbox'])
   page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort())
   page.goto(url);page.wait_for_timeout(1500)
   checks=[]
   for lang in ['en','ar']:
    try:page.evaluate('(lang)=>setLanguage(lang)',lang)
    except Exception:pass
    for width in [1440,390]:
     page.set_viewport_size({'width':width,'height':1000})
     for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
      try:
       page.evaluate('(view)=>switchView(view)',view)
       checks.append({'lang':lang,'width':width,'view':view,'visible':page.locator('#view-'+view).is_visible(),'noHorizontalOverflow':page.evaluate('document.documentElement.scrollWidth<=innerWidth')})
      except Exception:checks.append({'lang':lang,'width':width,'view':view,'visible':False,'noHorizontalOverflow':False})
   summary['browser']={'navigationChecks':checks,'pageErrors':errors,'csp':'absent in original; no CSP compliance claim'}
   browser.close()
  (report/'original-results.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2));print(run.stdout[-400:])
 finally:
  server.terminate();server.wait(timeout=10)
