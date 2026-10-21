import os,json,pathlib
from playwright.sync_api import sync_playwright
out=pathlib.Path('/workspace/work/trading-remediation'); result={'external':{},'errors':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:result['errors'].append(str(e)));page.goto('http://127.0.0.1:36137');page.wait_for_function('window.THNProfessional&&THNResearch.series()');page.locator('.nav-stack [data-view="trading"]').click();page.screenshot(path=str(out/'before-research.png'));page.locator('#proTradingViewMode').click();page.wait_for_timeout(1000);page.screenshot(path=str(out/'before-tradingview.png'));b.close()
 # Real browser requests use the mandatory managed proxy; no fixture/shim here.
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY']});page=b.new_page()
 for name,url in [('production','https://thn-ai-trader.vercel.app/#trading'),('script','https://s3.tradingview.com/tv.js'),('widget','https://www.tradingview.com/widget/')]:
  try:
   response=page.goto(url,wait_until='domcontentloaded',timeout=20000);result['external'][name]={'status':response.status if response else None,'url':url}
  except Exception as e:result['external'][name]={'url':url,'error':str(e).split('Call log:')[0].strip()}
 b.close()
(out/'baseline.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
