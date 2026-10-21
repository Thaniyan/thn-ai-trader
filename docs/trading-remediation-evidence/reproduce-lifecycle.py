import subprocess,json,pathlib
from playwright.sync_api import sync_playwright
out=pathlib.Path('/workspace/work/trading-remediation');baseline='ab910a5cb7d46e52a08421b688f8caee7130fc29'
sources={x:subprocess.check_output(['git','show',baseline+':public/'+x]).decode() for x in ['app.js','professional-workspace.js','professional.css','index.html']}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000})
 for name,source in sources.items():
  if name=='index.html':page.route('http://127.0.0.1:43849/',lambda r,request,s=source:r.fulfill(status=200,content_type='text/html',body=s))
  else:page.route('**/'+name,lambda r,request,s=source:r.fulfill(status=200,content_type='text/css' if r.request.url.endswith('.css') else 'application/javascript',body=s))
 page.route('https://s3.tradingview.com/**',lambda r:r.abort());page.goto('http://127.0.0.1:43849/');page.wait_for_function('window.THNProfessional&&THNResearch.series()');page.evaluate('window.__calls=[];window.TradingView={widget:function(c){__calls.push({symbol:c.symbol,interval:c.interval,studies:c.studies});}}')
 page.locator('.nav-stack [data-view="markets"]').click();page.locator('#r66Search').fill('GBPUSD');page.locator('[data-pro-tv="GBPUSD"]').click();page.wait_for_timeout(250);initial=page.evaluate('__calls')
 for i in range(3):
  page.locator('#proResearchMode').click();page.locator('#proTradingViewMode').click();page.locator('.nav-stack [data-view="dashboard"]').click();page.locator('.nav-stack [data-view="trading"]').click();page.wait_for_timeout(150)
 calls=page.evaluate('__calls');b.close()
result={'source':baseline,'fixture':'Constructor recording only; no actual TradingView data','initialNavigationCalls':initial,'callsAfterThreeUnchangedReturns':calls,'total':len(calls)}
(out/'baseline-lifecycle.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
