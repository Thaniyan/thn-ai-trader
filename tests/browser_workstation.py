from playwright.sync_api import sync_playwright
import json, os
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000}); errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('TEST_URL','http://127.0.0.1:3000'));page.wait_for_function("document.querySelector('#workRefresh').disabled === false",timeout=35000)
 page.wait_for_timeout(1200)
 results={'coverage':page.locator('#workCoverage').inner_text(),'views':[],'accessibility':[],'mobile':[]}
 for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
  page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(150)
  assert page.locator('#view-'+view).is_visible();results['views'].append(view)
  if view in ['dashboard','markets','trading','ai','risk']:page.screenshot(path='work/final-'+view+'.png')
  page.add_script_tag(path=os.environ['AXE_PATH'])
  scan=page.evaluate("async()=>{const r=await axe.run(document.querySelector('#view-'+location.hash.slice(1)),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,count:v.nodes.length,example:v.nodes[0].target}))}")
  results['accessibility'].append({'view':view,'violations':scan})
 page.locator('.nav-stack [data-view="markets"]').click()
 page.locator('#r66MarketLegacy > summary').click();page.locator('#workSearch').fill('BTC');assert page.locator('.work-instrument').count()==1
 page.locator('.work-instrument').click();assert page.locator('#workSelected').inner_text()=='BTCUSDT'
 page.locator('#workSearch').fill('');page.locator('[data-asset="Forex"]').click();assert page.locator('.work-instrument').count()==3
 page.locator('.nav-stack [data-view="risk"]').click();page.locator('#planSymbol').select_option('EURUSD')
 for key,value in {'planEntry':'1.1','planStop':'1.09','planTarget':'1.12'}.items():page.locator('#'+key).fill(value)
 page.locator('#workRiskForm button').click();page.wait_for_function("THNDecision.plan()")
 assert page.evaluate('THNDecision.plan().metrics.slDollars')==100;assert page.evaluate('THNDecision.plan().metrics.requiredMargin')==550;results['risk']='100 USD stop / 200 USD target / 550 USD margin'
 page.locator('.nav-stack [data-view="ai"]').click();page.locator('#d64Legacy > summary').click();page.locator('#view-ai .subtab-btn[data-subtab="structure"]').click();page.wait_for_timeout(500)
 canvas=page.locator('#analysisMapCanvas');assert canvas.is_visible()
 if page.locator('[data-map-layer="candles"]').count():
  button=page.locator('[data-map-layer="candles"]');old=button.get_attribute('aria-pressed');button.click();assert button.get_attribute('aria-pressed')!=old;button.click()
 canvas.focus();page.keyboard.press('ArrowRight');page.keyboard.press('Escape');results['chart']='layer toggle and keyboard crosshair exercised'
 page.screenshot(path='work/final-chart.png')
 page.locator('[data-language="ar"]').first.click();assert page.locator('html').get_attribute('dir')=='rtl'
 page.locator('.nav-stack [data-view="dashboard"]').click();page.wait_for_timeout(600);page.screenshot(path='work/final-ar.png')
 page.set_viewport_size({'width':390,'height':844})
 for lang in ['ar','en']:
  page.locator('[data-language="'+lang+'"]').first.click()
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(450)
   results['mobile'].append({'lang':lang,'view':view,'overflow':page.evaluate('document.documentElement.scrollWidth > innerWidth')})
  page.locator('.nav-stack [data-view="dashboard"]').click();page.wait_for_timeout(600);page.screenshot(path='work/final-mobile-'+lang+'.png')
 page.set_viewport_size({'width':1440,'height':1000});page.locator('#themeBtn').click();page.screenshot(path='work/final-light.png')
 page.add_script_tag(path=os.environ['AXE_PATH'])
 results['lightA11y']=page.evaluate("async()=>{const r=await axe.run(document.querySelector('#view-dashboard'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}});return r.violations.map(v=>({id:v.id,count:v.nodes.length,example:v.nodes[0].target}))}")
 results['errors']=errors
 open('work/browser-results.json','w').write(json.dumps(results,indent=2))
 assert not errors, errors
 assert all(not entry['overflow'] for entry in results['mobile'])
 assert all(not entry['violations'] for entry in results['accessibility'])
 assert not results['lightA11y']
 print(json.dumps(results,indent=2));b.close()
