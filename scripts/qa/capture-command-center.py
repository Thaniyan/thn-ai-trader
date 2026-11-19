"""Reproduce actual before/after Day5 renders against one OFFLINE fixture server.
No checkout, model, account mutation, dependency install or deployment.
"""
import argparse,hashlib,json,mimetypes,os,pathlib,re,subprocess
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--url',required=True);p.add_argument('--output',required=True);p.add_argument('--before',action='store_true')
p.add_argument('--baseline',default='6275939fd7d2dd892a37d2298cc1c28455baaa9e');p.add_argument('--case',choices=['wait','conditional','sell','eligible'],default='wait');p.add_argument('--expanded',action='store_true');p.add_argument('--historical',action='store_true')
a=p.parse_args();u=urlsplit(a.url)
if u.scheme!='http' or u.hostname not in ['127.0.0.1','localhost'] or u.username or u.password or u.query or u.fragment:raise SystemExit('Use the existing loopback OFFLINE fixture server only.')
if not re.fullmatch('[a-f0-9]{40}',a.baseline):raise SystemExit('An exact baseline commit is required.')
root=pathlib.Path(__file__).resolve().parents[2];os.chdir(root);out=pathlib.Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
git=lambda *args:subprocess.check_output(['git',*args])
subprocess.run(['git','diff','--quiet',a.baseline,'--','server.js','server'],check=True)
paths=git('ls-tree','-r','--name-only',a.baseline,'public').decode().splitlines();old={name.removeprefix('public/'):git('show',a.baseline+':'+name) for name in paths} if a.before else None
files=old if a.before else {p.name:p.read_bytes() for p in (root/'public').iterdir() if p.is_file()}
if not a.before:
 for name,data in files.items():
  if (root/'.vercel/output/functions/index.func/public'/name).read_bytes()!=data:raise SystemExit('Package does not match source. Run npm run package:production first.')
digests={name:hashlib.sha256(data).hexdigest() for name,data in files.items()};tree_hash=hashlib.sha256(json.dumps(digests,sort_keys=True).encode()).hexdigest();rows=[];errors=[]
with sync_playwright() as api:
 browser=api.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH',api.chromium.executable_path),args=['--no-sandbox'])
 if browser.version!='151.0.7922.34':raise SystemExit('Use pinned Playwright Chromium151.0.7922.34, revision1234.')
 page=browser.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:errors.append(str(e)))
 health=page.request.get(a.url+'/api/health').json()
 if health['capabilities'].get('liveTrading') is not False or health['capabilities'].get('paperExecution') is not False:raise SystemExit('Financial execution must be disabled.')
 if old:
  def original_static(route):
   name=urlsplit(route.request.url).path.lstrip('/') or 'index.html'
   if name in old:route.fulfill(body=old[name],content_type=mimetypes.guess_type(name)[0] or 'application/octet-stream')
   else:route.fallback()
  page.route(a.url.rstrip('/')+'/**',original_static)
 if a.case!='wait':
  side='SELL' if a.case=='sell' else 'BUY';sign=1 if side=='BUY' else -1;direction='bullish' if side=='BUY' else 'bearish'
  def analysis(route):
   response=route.fetch();d=response.json();entry=d['entry'];d.update(decision=side,consensusLabel='BULLISH' if sign==1 else 'BEARISH',confidence=80,grade='A',stopLoss=entry-sign*.01,targets=[entry+sign*.002,entry+sign*.004,entry+sign*.006]);route.fulfill(response=response,json=d)
  def brief(route):
   response=route.fetch();d=response.json();d.update(complete=True,conflicting=False)
   for f in d['frames']:
    if f['available']:f['trend']=direction
   for s in d['scenarios']:
    if s['direction']==direction:s.update(readyForPlanning=True,trigger=d['selected']['lastCandle']['close'],invalidation=d['selected']['lastCandle']['close']-sign*.01)
   route.fulfill(response=response,json=d)
  page.route('**/api/analyze',analysis);page.route('**/api/research/brief?**',brief)
 page.goto(a.url);page.wait_for_function('window.THNCommand?.state().fresh&&THNDecision.brief()?.selected.provenance.hash===THNContext.get().datasetId');page.locator('.nav-stack [data-view=dashboard]').click()
 if a.case=='wait':assert page.evaluate('THNCommand.state().candidate') is None
 else:page.wait_for_function('THNCommand.state().candidate')
 if a.case=='eligible':
  page.locator('[data-command=use-levels]').click()
  for key,value in {'planCapital':'10000','planRisk':'1','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+key).fill(value)
  page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNPrecision.review().status==="eligible"');page.locator('#commandRationale').evaluate('(e)=>e.open=false')
 for width,lang,theme in [(1440,'en','dark'),(1440,'ar','light'),(1024,'en','dark'),(1024,'ar','light'),(390,'en','dark'),(390,'ar','light')]:
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.evaluate('document.fonts.ready');page.evaluate('scrollTo(0,0)')
  if not a.before:page.wait_for_function('(mobile)=>document.getElementById("commandSetup").parentElement.id===(mobile?"precisionMobileTicket":"commandAssessment")',arg=width<901)
  file=f'{width}-{lang}-{theme}';page.screenshot(path=str(out/(file+'.png')),animations='disabled');page.screenshot(path=str(out/(file+'-full.png')),animations='disabled',full_page=True)
  boxes=page.locator('#qCandles,#commandVerdict,#commandSetup').evaluate_all('(els)=>Object.fromEntries(els.map(e=>[e.id,e.getBoundingClientRect().toJSON()]))')
  model=page.evaluate('(()=>{const m=THNCommand.state();return {context:m.context,candidate:m.candidate,confluence:m.confluence,phase:m.phase,probability:m.probability,executionAuthorized:m.executionAuthorized}})()');rows.append({'width':width,'height':1000,'language':lang,'theme':theme,'geometry':boxes,'ticketLevels':page.locator('#commandSetup .command-levels').bounding_box(),'assessment':model})
  if width==390:
   page.locator('#commandSetup').evaluate('(e)=>e.scrollIntoView({block:"start",behavior:"instant"})');page.screenshot(path=str(out/(file+'-ticket.png')),animations='disabled')
 phone=[]
 for lang,theme in [('en','dark'),('ar','light')]:
  page.set_viewport_size({'width':390,'height':844});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/f'390-{lang}-{theme}-844.png'),animations='disabled')
  phone.append({'width':390,'height':844,'language':lang,'theme':theme,'chart':page.locator('#qCandles').bounding_box(),'decision':page.locator('#commandVerdict').bounding_box()})
 if a.expanded:
  page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click();page.locator('#trustReviewAction').click();page.locator('#trustHeader [data-trust=score]').click();page.locator('#commandTrust').screenshot(path=str(out/'expanded-confidence.png'),animations='disabled')
 if a.historical:
  page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click();page.locator('#heritageConfidenceTestAction').click();page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"');page.locator('#trustHistorical').screenshot(path=str(out/'historical-validation-en.png'),animations='disabled')
  page.set_viewport_size({'width':390,'height':1000});page.locator('.terminal-topbar [data-language=ar]').click();page.locator('#trustHistorical').screenshot(path=str(out/'historical-validation-ar.png'),animations='disabled')
 assert not errors,errors;browser.close()
receipt={'baselineSHA':a.baseline,'source':'exact baseline public files' if a.before else 'packaged working tree; verify fingerprint against final commit','sourceHEAD':git('rev-parse','HEAD').decode().strip(),'publicTreeSHA256':tree_hash,'publicFileSHA256':digests,'case':a.case,'scope':'Actual app; OFFLINE synthetic provider. Conditional/SELL/eligible fixtures do not establish real signals, model quality or market readiness.','profiles':rows,'shortPhoneProfiles':phone,'errors':errors}
(out/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps({'output':str(out),'publicTreeSHA256':tree_hash,'profiles':len(rows),'case':a.case,'before':a.before}))
