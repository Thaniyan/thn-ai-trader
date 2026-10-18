"""CSP-enforced local routing model only; no Vercel/cloud deployment or paid calls."""
import hashlib,json,os,pathlib,shutil,subprocess,tempfile,time
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1];OUTPUT=pathlib.Path(os.environ.get('VERCEL_QA_OUTPUT','/workspace/reports/vercel-staging/browser'))
if OUTPUT.exists():raise SystemExit('Use a new QA output directory')
OUTPUT.mkdir(mode=0o700,parents=True);checks=[];screenshots=[];console=[];console_events=[];network_events=[]
def check(name,condition):
 checks.append({'check':name,'passed':bool(condition)})
 assert condition,name
def observe(page):
 from urllib.parse import urlparse
 page.on('pageerror',lambda err:console.append(type(err).__name__))
 page.on('console',lambda msg:console_events.append({'type':msg.type,'messageHash':hashlib.sha256(msg.text.encode()).hexdigest()}) if msg.type=='error' else None)
 page.on('requestfailed',lambda req:network_events.append({'kind':'request-failed','path':urlparse(req.url).path if req.url.startswith('http://127.0.0.1') else '[external]'}))
 page.on('response',lambda res:network_events.append({'kind':'http-error','status':res.status,'path':urlparse(res.url).path}) if res.status>=400 and res.url.startswith('http://127.0.0.1') else None)
def start(artifact,mode):
 server=subprocess.Popen(['node','scripts/vercel-staging/browser-model.mjs',str(artifact),mode],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 line=server.stdout.readline()
 if not line:raise RuntimeError(server.stderr.read())
 return server,json.loads(line)
def stop(server):server.terminate();server.wait(timeout=40);server.stdout.close();server.stderr.close()
try:
 with tempfile.TemporaryDirectory(prefix='thn-vercel-browser-') as folder,sync_playwright() as p:
  folder=pathlib.Path(folder);artifacts={}
  for mode in ['offline','connected']:
   out=folder/mode;args=['node','deployment/vercel-staging/build.mjs','--output',str(out)]
   if mode=='connected':args+=['--backend','https://staging-backend.qa.example.com']
   subprocess.run(args,cwd=ROOT,check=True,capture_output=True);subprocess.run(['node','verify-build.mjs'],cwd=out,check=True,capture_output=True,env={**os.environ,'THN_LOCAL_BUILD_TEST':'1'});artifacts[mode]=out
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path,args=['--no-sandbox'])
  server,info=start(artifacts['offline'],'offline')
  try:
   context=browser.new_context();page=context.new_page();observe(page)
   page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(info['url']) else route.abort())
   response=page.goto(info['url']);page.wait_for_function("()=>!document.getElementById('stagingRetry').disabled")
   check('CSP retained',"default-src 'self'" in response.headers.get('content-security-policy',''))
   check('No browser application session fabricated',page.evaluate('typeof privateUser')=='undefined')
   check('Workstation remains inert',page.locator('#stagingWorkstation').is_hidden())
   for label,width,height in [('desktop',1440,1000),('mobile',390,844)]:
    page.set_viewport_size({'width':width,'height':height})
    for lang in ['en','ar']:
     page.locator('[data-staging-language="'+lang+'"]').click();check(label+'/'+lang+' direction',page.locator('html').get_attribute('dir')==('rtl' if lang=='ar' else 'ltr'))
     for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
      page.locator('[data-staging-view="'+view+'"]').click()
      check(label+'/'+lang+'/'+view+' selected',page.locator('[data-staging-view="'+view+'"]').get_attribute('aria-current')=='page')
      body=page.locator('body').inner_text();check(label+'/'+lang+'/'+view+' no invented state',all(text not in body for text in ['$25,000','$50,000','Engine Operational','1.082','CONNECTED','STRONG BUY']))
      check(label+'/'+lang+'/'+view+' responsive',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
      name=f'offline-{label}-{lang}-{view}.png';page.screenshot(path=str(OUTPUT/name),full_page=True);screenshots.append(name)
   data=page.request.get(info['url']+'/api/accounts').json();check('Offline API refuses operational metadata',data.get('ok') is False and data.get('code')=='STAGING_BACKEND_UNCONFIGURED')
   check('No authenticated API cache', 'no-store' in page.request.get(info['url']+'/api/accounts').headers.get('cache-control',''))
   nojs=browser.new_context(java_script_enabled=False);nj=nojs.new_page();nj.goto(info['url']);check('No-JS remains honest',nj.locator('#stagingWorkstation').is_hidden() and '$25,000' not in nj.locator('body').inner_text());nojs.close();context.close()
  finally:stop(server)
  server,info=start(artifacts['connected'],'connected')
  try:
   blocked=browser.new_context();bp=blocked.new_page();bp.goto(info['url']);bp.wait_for_function("()=>!document.getElementById('stagingRetry').disabled")
   check('Independent backend gate blocks before app load',bp.locator('#stagingWorkstation').is_hidden() and bp.evaluate('typeof privateUser')=='undefined');blocked.close()
   context=browser.new_context(http_credentials={'username':info['user'],'password':info['password']});page=context.new_page();observe(page)
   page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(info['url']) else route.abort());page.goto(info['url']);page.wait_for_selector('#stagingWorkstation:not([hidden])',timeout=20000)
   check('Verified contract enables original frontend',page.locator('#sessionForm').is_visible())
   check('Real backend authentication required',page.evaluate('privateUser===null'))
   def login(token,user):
    page.locator('#sessionToken').fill(token);page.locator('#sessionForm button[type="submit"]').click();page.wait_for_function('(u)=>privateUser===u&&!sessionChanging',arg=user);page.wait_for_function('()=>!brokerSyncInFlight')
   login('test-only-operator-token','operator');page.wait_for_function('()=>serverBrokerAccounts.length>0');owned=page.evaluate('serverBrokerAccounts[0].id')
   check('Cookie-backed owner session through model',page.request.get(info['url']+'/api/accounts').status==200)
   check('Wrong Origin rejected through model',page.request.post(info['url']+'/api/session',headers={'Origin':'https://evil.invalid'},data={'token':'test-only-operator-token'}).status==403)
   for lang in ['en','ar']:
    page.evaluate('(lang)=>setLanguage(lang)',lang)
    for view in ['dashboard','ai','brokers']:
     page.evaluate('(view)=>switchView(view)',view);name=f'connected-{lang}-{view}.png';page.screenshot(path=str(OUTPUT/name),full_page=True,mask=[page.locator('input,textarea,#brokerBalanceDisplay,#brokerEquityDisplay,#brokerAccountDetailsView,#report,#riskTable')]);screenshots.append(name)
   login('test-only-other-token','other');page.wait_for_function('()=>serverBrokerAccounts.length===0');check('Empty identity clears earlier account',page.evaluate('selectedBrokerAccount===null'))
   check('Backend ownership remains enforced',page.request.get(info['url']+'/api/ledger?accountId='+owned).status==403)
   page.wait_for_function('()=>!analysisInFlight');page.route('**/api/analyze',lambda route:route.fulfill(status=503,json={'ok':False,'error':'Explicit QA provider failure','code':'QA_PROVIDER_FAILURE'}))
   page.evaluate('async()=>{analysisRetryAt=0;await analyze()}');check('Provider failure is honest without hiding healthy backend',page.evaluate('currentAnalysis===null&&!analysisInFlight') and page.locator('#stagingWorkstation').is_visible());page.unroute('**/api/analyze')
   page.route('**/api/quotes*',lambda route:route.abort());page.evaluate("async()=>{try{await fetch('/api/quotes?symbols=EURUSD')}catch{}}")
   page.wait_for_selector('#stagingShell:not([hidden])');check('Network outage hides private workstation',page.locator('#stagingWorkstation').is_hidden() and page.evaluate('privateUser===null&&serverBrokerAccounts.length===0'));page.unroute('**/api/quotes*')
   page.route('**/api/staging-contract',lambda route:route.fulfill(status=200,json={'ok':True,'contractVersion':1,'backend':'persistent-node-sqlite','frontendOrigin':'https://different-staging.example','liveExecutionEnabled':False}))
   page.locator('#stagingRetry').click();page.wait_for_function("()=>!document.getElementById('stagingRetry').disabled");check('Origin contract mismatch fails closed',page.locator('#stagingWorkstation').is_hidden())
   context.close()
   broken=browser.new_context(http_credentials={'username':info['user'],'password':info['password']});brokenpage=broken.new_page();brokenpage.route('**/app.js',lambda route:route.abort());brokenpage.goto(info['url']);brokenpage.wait_for_function("()=>!document.getElementById('stagingRetry').disabled");brokenpage.locator('#stagingRetry').click();brokenpage.wait_for_function("()=>!document.getElementById('stagingRetry').disabled");check('Missing app asset cannot reveal static sample state on retry',brokenpage.locator('#stagingWorkstation').is_hidden());broken.close()
  finally:stop(server)
  check('No unexpected page exceptions',not console);browser.close()
finally:
 data={'mode':'LOCAL_ROUTING_MODEL_NOT_VERCEL','checks':checks,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'screenshots':screenshots,'pageExceptions':console,'consoleEvents':console_events,'networkEvents':network_events,'networkNote':'Expected auth/ownership/CSRF denials, injected provider503/network abort and blocked optional external chart are recorded; not online availability evidence. No headers, bodies, queries or credentials retained.','unverified':['Actual Vercel deployment/protection','Vercel forwarded auth/header/cookie behavior','Real HTTPS browser cookie roundtrip: local browser model is HTTP; secure-cookie attributes checked separately','Live provider freshness and paper fills','Plan/account/commit-author eligibility']}
 (OUTPUT/'findings.json').write_text(json.dumps(data,indent=2));os.chmod(OUTPUT/'findings.json',0o600)
 (OUTPUT/'REPORT.md').write_text('# Vercel staging local QA\n\nMode: LOCAL ROUTING MODEL, not a deployed Vercel endpoint.\n\n'+f"{data['passed']} passed; {data['failed']} failed.\n\n"+'\n'.join(f"- {'PASS' if c['passed'] else 'FAIL'}: {c['check']}" for c in checks)+'\n\n## Screenshots\n\n'+'\n'.join(f'![{n}]({n})' for n in screenshots)+'\n\nConsole errors are hashed and network failures are sanitized in findings.json. Expected test refusals/injections must not be counted as online outages.\n\n## Unverified\n\n'+'\n'.join('- '+v for v in data['unverified']))
 print(json.dumps({'passed':data['passed'],'failed':data['failed'],'screenshots':len(screenshots),'mode':data['mode']}))
