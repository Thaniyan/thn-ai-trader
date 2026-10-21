"""Full workstation journeys and all-nine-view geometry; providers are explicit offline fixtures."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright
out=pathlib.Path(os.environ.get('PRO_OUTPUT','work/professional'));out.mkdir(parents=True,exist_ok=True)
results={'journeys':[],'layouts':[],'accessibility':[],'errors':[],'zoom':[],'touchTargets':[],'externalWidget':'External TradingView network not asserted by offline protocol tests'}
views=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']
geometry='''() => {const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;let issues=[];if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal page overflow');for(const q of ['.terminal-topbar','.topbar-controls','.language-switch','.nav-stack','.pro-mode-switch','.pro-market-controls']){const p=document.querySelector(q);if(!p||!visible(p))continue;const nodes=[...p.children].filter(e=>visible(e)&&getComputedStyle(e).position!=='absolute');for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(overlap(nodes[i].getBoundingClientRect(),nodes[j].getBoundingClientRect()))issues.push(q+' sibling collision');}return [...new Set(issues)];}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:results['errors'].append(str(e)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNProfessional&&window.THNLibrary&&THNResearch.series()&&THNDecision.brief()');page.wait_for_timeout(700)
 def go(v):
  button=page.locator('.nav-stack [data-view="'+v+'"]');button.focus();button.press('Enter');page.evaluate('scrollTo(0,0)');page.wait_for_timeout(70)
 # Real table -> API -> provider fixture -> provenance -> chart, no fake observations.
 go('markets');page.locator('#r66Search').fill('EURUSD');assert page.locator('#r66Markets tbody tr').count()==1
 page.locator('[data-pro-star="EURUSD"]').click();assert page.locator('[data-pro-star="EURUSD"]').get_attribute('aria-pressed')=='true'
 calls=[];page.on('request',lambda r:calls.append(r.url));page.locator('#proObserve').click();page.wait_for_function('!THNMarketObservations.busy()');assert page.evaluate('THNMarketObservations.get("EURUSD").value.close>0')
 before=len([u for u in calls if '/api/research/series?' in u]);page.locator('#proObserve').click();page.wait_for_function('!THNMarketObservations.busy()');assert len([u for u in calls if '/api/research/series?' in u])==before
 # Full bounded batch: the table does not fetch every catalog row.
 page.locator('#r66Search').fill('');batch=[];active=set();peak=[0]
 def began(r):
  if '/api/research/series?' in r.url:active.add(r);batch.append(r.url);peak[0]=max(peak[0],len(active))
 def ended(r):active.discard(r)
 page.on('request',began);page.on('requestfinished',ended);page.on('requestfailed',ended)
 page.locator('#proObserve').click();page.wait_for_function('!THNMarketObservations.busy()');assert len(batch)<=6 and peak[0]<=2,(len(batch),peak[0])
 page.remove_listener('request',began);page.remove_listener('requestfinished',ended);page.remove_listener('requestfailed',ended)
 page.locator('#r66Search').fill('EURUSD')
 # Widget contract shim is explicitly not proof of the real remote iframe.
 page.evaluate('window.TradingView={widget:function(config){window.__widgetConfig=config;}}');page.locator('[data-pro-tv="EURUSD"]').click();assert page.locator('#chart').is_visible();assert not page.locator('.q-chart-panel').is_visible();config=page.evaluate('__widgetConfig');assert config['symbol']=='FX:EURUSD' and config['interval']=='60' and config['hide_side_toolbar']==False and config['enable_publishing']==False
 page.locator('#loadChartBtn').click();assert page.evaluate('__widgetConfig.symbol')=='FX:EURUSD'
 page.locator('#proResearchMode').click();assert page.locator('.q-chart-panel').is_visible()
 page.locator('#qDrawingMode').select_option('horizontal');canvas=page.locator('#qCandles');canvas.scroll_into_view_if_needed();canvas.click(position={'x':150,'y':130});assert page.evaluate('THNResearch.chart.drawings.some(d=>d.type==="horizontal")')
 page.reload();page.wait_for_function('window.THNProfessional&&THNResearch.series()');assert page.evaluate('THNResearch.chart.drawings.some(d=>d.type==="horizontal")')
 go('trading');canvas=page.locator('#qCandles');canvas.focus();page.keyboard.press('ArrowLeft');page.keyboard.press('+');page.keyboard.press('Home')
 assert page.evaluate('THNResearch.chart.offset')==0
 # Genuine deterministic engine -> saved report -> Library; ideas remain unverified.
 page.evaluate('THNLibrary.save(THNDecision.snapshot())');assert page.evaluate('THNLibrary.records().length')>0
 page.evaluate('saveJournal()');go('journal');assert page.locator('#proRecords').get_by_text('EURUSD · Research idea',exact=True).count()>=1
 page.locator('#proRecordKind').select_option('research_idea');page.locator('#proRecords').get_by_role('button',name='Inspect original record').first.click();assert 'research_idea' in page.locator('#proRecordDetail').inner_text()
 assert page.evaluate('THNRecords.select(getJournal()).length')==0
 results['journeys']+=['Markets search/favorite, cached closes, <=6 requests and <=2 concurrency','Explicit TradingView widget configuration and source switch (shim only)','Horizontal level draw/reload and keyboard chart pan/zoom','Deterministic snapshot saved in Library; idea inspected without financial outcome']
 # Client-only lost-response protocol fixture. Actual restart/disk behavior is an HTTP Node test.
 intent_keys=[]
 def paper_reply(route):
  body=route.request.post_data_json;intent_keys.append(body['idempotencyKey'])
  if len(intent_keys)==1:route.abort('failed')
  else:route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'orderResult':{'ticket':'PAPER-PROTOCOL-ONLY','executedPrice':1.08}}))
 page.route('**/api/orders/execute',paper_reply)
 page.evaluate('window.__originalAccount=getBrokerAccount;getBrokerAccount=()=>({...window.__originalAccount(),id:"protocol-only-account"})')
 order={'symbol':'EURUSD','decision':'BUY','lots':.1,'stopLoss':1.07,'target1':1.1,'entry':1.08}
 page.evaluate('(d)=>executeBrokerOrder(d)',order);assert page.evaluate('!!localStorage.getItem("thn_pending_paper_intent_v1")')
 page.evaluate('(d)=>executeBrokerOrder(d)',order);assert len(intent_keys)==2 and intent_keys[0]==intent_keys[1]
 assert page.evaluate('localStorage.getItem("thn_pending_paper_intent_v1")') is None
 page.evaluate('getBrokerAccount=window.__originalAccount');page.unroute('**/api/orders/execute',paper_reply)
 go('brokers');page.locator('#proBrokerTools').evaluate('e=>e.open=true');page.locator('#openNewAccountFromDeskBtn').click();assert not page.locator('#brokerModal').is_visible();assert page.locator('#brokerPasswordInput').is_disabled()
 assert page.locator('#brokerActiveAccountSelect').is_disabled();assert 'LIVE REAL' not in page.locator('#brokerActiveAccountSelect').inner_text();page.locator('#proBrokerTools').evaluate('e=>e.open=false')
 results['journeys'].append('Client lost-response retry reuses one intent (protocol fixture); hosted broker UI asks for no credentials')
 page.add_script_tag(content=pathlib.Path(os.environ['AXE_PATH']).read_text())
 for width,lang,theme in itertools.product([1920,1649,1440,1280,1024,768,390,360],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
  for v in views:
   go(v);issues=page.evaluate(geometry);results['layouts'].append({'width':width,'language':lang,'theme':theme,'view':v,'issues':issues})
   if width in [390,360]:
    targets=page.evaluate("""()=>[...document.querySelectorAll('.nav-stack button,.topbar-controls button,#proChartModes button,#r66Markets button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent.trim(),width:r.width,height:r.height}})""");results['touchTargets'].append({'width':width,'view':v,'failures':[t for t in targets if t['width']<24 or t['height']<24]})
   if width in [1440,390] and (lang,theme) in [('en','dark'),('ar','light')]:
    page.wait_for_timeout(400);page.screenshot(path=str(out/(v+'-'+lang+'-'+theme+'-'+str(width)+'.png')))
   if width in [1440,390]:
    page.wait_for_timeout(300)
    if v=='brokers':page.locator('#proBrokerTools').evaluate('e=>e.open=true')
    violations=page.evaluate('''async()=> (await axe.run(document.querySelector('.app-view.view-active'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))''')
    if v=='brokers':page.locator('#proBrokerTools').evaluate('e=>e.open=false')
    results['accessibility'].append({'width':width,'language':lang,'theme':theme,'view':v,'violations':violations})
  (out/'results.json').write_text(json.dumps(results,indent=2))
 # Emulated desktop page zoom: CSS viewport and DPR vary inversely, like the preserved shell suite.
 cdp=page.context.new_cdp_session(page)
 for width,lang,theme,zoom in itertools.product([1649,360],['en','ar'],['dark','light'],[.8,1.25,1.5,2]):
  css=round(width/zoom);height=round(1000/zoom);page.set_viewport_size({'width':css,'height':height});cdp.send('Emulation.setDeviceMetricsOverride',{'width':css,'height':height,'deviceScaleFactor':zoom,'mobile':False});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
  for v in ['trading','risk']:
   go(v);results['zoom'].append({'width':width,'cssWidth':css,'zoom':zoom,'language':lang,'theme':theme,'view':v,'issues':page.evaluate(geometry)})
 # Storage refusal must not crash startup, preference changes, or any of the nine views.
 refused=b.new_page(viewport={'width':390,'height':844});errors=[];refused.on('pageerror',lambda e:errors.append(str(e)));refused.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('refused','SecurityError')}})");refused.goto(os.environ['TEST_URL']);refused.wait_for_function('window.THNProfessional&&window.THNRecords');assert refused.locator('#proStorageState').is_visible()
 for v in views:
  refused.locator('.nav-stack [data-view="'+v+'"]').focus();refused.keyboard.press('Enter')
 refused.locator('.terminal-topbar [data-language="ar"]').click();refused.locator('#themeBtn').click();refused.wait_for_timeout(200);assert not errors,errors
 refused.locator('.nav-stack [data-view="settings"]').focus();refused.keyboard.press('Enter');refused.on('dialog',lambda d:d.accept());refused.locator('#prefClearJournalBtn').click();refused.wait_for_timeout(100);assert not errors,errors
 refused.screenshot(path=str(out/'storage-refusal.png'));results['journeys'].append('Storage entirely denied: all nine views, language and theme initialize without uncaught errors')
 b.close()
(out/'results.json').write_text(json.dumps(results,indent=2))
failed=[r for r in results['layouts'] if r['issues']];a11y=[r for r in results['accessibility'] if r['violations']]
print(json.dumps({'layouts':len(results['layouts']),'geometryFailures':len(failed),'accessibilityScans':len(results['accessibility']),'accessibilityFailures':len(a11y),'errors':results['errors'],'examples':failed[:3]},indent=2))
assert not failed and not a11y and not results['errors'] and not any(r['issues'] for r in results['zoom']) and not any(r['failures'] for r in results['touchTargets']),'See professional/results.json for evidence'
