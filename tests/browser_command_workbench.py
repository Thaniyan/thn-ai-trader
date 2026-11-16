"""Integrated evidence ledger and original chart/planner journey; offline fixture only."""
import os,json,itertools,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/command-workbench'));out.mkdir(parents=True,exist_ok=True)
results={'profiles':[],'labelProfiles':[],'errors':[],'scope':'Offline providers; positive setup uses controlled response fixtures, not a model or live market signal.'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:results['errors'].append(str(e)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNCommand?.state().fresh&&THNDecision.brief()?.frames.length===3&&document.querySelectorAll("#deskHorizons button").length===3');page.locator('.nav-stack [data-view=dashboard]').click();page.evaluate('window.__ownedChart=THNResearch.chart')
 expect(page.locator('#deskSourceStrip')).to_contain_text(page.evaluate('THNContext.get().symbol'))
 page.locator('#deskPrimaryActions [data-desk=evidence]').click();expect(page.locator('#deskEvidenceTitle')).to_be_focused();page.locator('#deskEvidenceWorkbench').press('Escape');expect(page.locator('#deskPrimaryActions [data-desk=evidence]')).to_be_focused()
 page.locator('#deskHorizons [data-desk="frame:1h"]').click();expect(page.locator('#deskFrame-1h')).to_have_attribute('open','');expect(page.locator('#deskFrame-1h code')).to_have_text(page.evaluate('THNDecision.brief().frames.find(f=>f.interval==="1h").provenance.hash'))
 page.locator('[data-desk="filter:BEARISH"]').click();expected=page.evaluate('THNConfidence.review().analysis.schools.filter(s=>s.bias==="BEARISH").length');assert page.locator('#deskEvidenceWorkbench [data-school-bias]').count()==expected
 page.locator('#commandThesis').fill('Preserved integrated evidence thesis');saved=page.evaluate('JSON.stringify(THNLibrary.entries())');page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,768,390,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  expect(page.locator('#commandThesis')).to_have_value('Preserved integrated evidence thesis');expect(page.locator('[data-desk="filter:BEARISH"]')).to_have_attribute('aria-pressed','true');assert page.locator('#qCandles').count()==1;assert page.evaluate('THNResearch.chart===window.__ownedChart');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,lang,theme)
  for selector in ['#deskEvidenceWorkbench','#deskHorizons','#deskPrimaryActions','#deskSourceStrip']:
   issues=page.evaluate('async(s)=>(await axe.run(document.querySelector(s),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))',selector);assert not issues,(width,lang,theme,selector,issues)
  results['profiles'].append([width,lang,theme])
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click();page.locator('[data-desk="filter:all"]').click()
 def positive_analysis(route):
  response=route.fetch();data=response.json();entry=data['entry'];data.update({'decision':'BUY','consensusLabel':'BULLISH','confidence':80,'grade':'A','stopLoss':entry-.01,'targets':[entry+.002,entry+.004,entry+.006]});route.fulfill(response=response,json=data)
 def positive_brief(route):
  response=route.fetch();data=response.json();data['complete']=True;data['conflicting']=False
  for frame in data['frames']:
   if frame['available']:frame['trend']='bullish'
  for scenario in data['scenarios']:
   if scenario['direction']=='bullish':scenario.update({'readyForPlanning':True,'trigger':data['selected']['lastCandle']['close'],'invalidation':data['selected']['lastCandle']['close']-.01})
  route.fulfill(response=response,json=data)
 page.route('**/api/analyze',positive_analysis);page.route('**/api/research/brief?**',positive_brief);held=[]
 def hold_brief(route):
  held.append(route);page.evaluate('window.__deskBriefHeld=true')
 page.route('**/api/research/brief?**',hold_brief);page.evaluate('THNCommand.pick("GBPUSD")');page.wait_for_function('window.__deskBriefHeld&&THNCommand.state().fresh&&THNContext.get().symbol==="GBPUSD"')
 assert page.locator('#deskHorizons [data-trend=unavailable]').count()==3;expect(page.locator('#deskSourceCertificate code')).to_have_text('—');assert page.evaluate('THNCommand.state().candidate') is None;assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 for route in held:positive_brief(route)
 page.unroute('**/api/research/brief?**',hold_brief);page.wait_for_function('THNCommand.state().candidate?.symbol==="GBPUSD"')
 for width,language,theme in itertools.product([1440,390],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+language+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.wait_for_function('THNCommand.coordinates().length>0&&Math.abs(THNResearch.chart.plot.right-(Math.max(280,document.getElementById("qCandles").getBoundingClientRect().width)-72))<.01&&document.querySelector("#commandOverlay text[data-level=E]").textContent==="E "+THNPresentation.price(THNCommand.state().candidate.entry,THNContext.get().symbol)')
  snapshot=page.evaluate('()=>({plot:{...THNResearch.chart.plot},labels:[...document.querySelectorAll("#commandOverlay text")].map(n=>{const b=n.getBBox();return {label:n.dataset.level,connected:n.isConnected,direction:getComputedStyle(n).direction,box:{x:b.x,y:b.y,width:b.width,height:b.height}}}),view:document.querySelector(".view-active").id,mode:THNProfessional.mode()})');labels=snapshot['labels'];plot=snapshot['plot']
  assert labels and all(n['connected'] and n['box']['width']>0 and n['box']['height']>0 and n['direction']=='ltr' and n['box']['x']>=plot['left']-1 and n['box']['x']+n['box']['width']<=plot['right']+1 for n in labels),(width,language,labels,plot)
  ordered=sorted(labels,key=lambda n:n['box']['y']);assert all(ordered[i]['box']['y']>=ordered[i-1]['box']['y']+ordered[i-1]['box']['height'] for i in range(1,len(ordered))),(width,language,ordered)
  results['labelProfiles'].append({'width':width,'language':language,'theme':theme,'labels':labels})
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click()
 page.locator('#commandSetup [data-desk="level:E"]').click();expect(page.locator('#commandOverlay line[data-level=E]')).to_have_attribute('data-active','true');assert page.locator('#commandOverlay [data-desk-zone]').count()>0
 point=page.evaluate('THNCommand.coordinates().find(v=>v.label==="E")');assert float(page.locator('#commandOverlay line[data-level=E]').get_attribute('y1'))==point['y'];page.locator('#qCandles').focus();page.keyboard.press('+');assert page.locator('#commandOverlay line[data-level=E]').get_attribute('data-active')=='true'
 page.locator('#deskChartStatus [data-desk=source-bar]').click();expect(page.locator('#studioInspectorTitle')).to_be_focused();assert page.locator('#studioInspector').evaluate('(e)=>e.open')
 page.evaluate('window.__workbenchClock=Date.now;const expiry=THNCommand.state().expiresAt;Date.now=()=>expiry+1;dispatchEvent(new Event("focus"))');page.wait_for_function('THNCommand.state().phase==="stale"');expect(page.locator('#deskLevelStatus')).to_contain_text('No eligible current levels');assert page.locator('#commandOverlay [data-desk-zone]').count()==0;assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved;page.evaluate('Date.now=window.__workbenchClock;dispatchEvent(new Event("focus"))');page.wait_for_function('THNCommand.state().candidate!==null')
 posts=[];page.on('request',lambda request:posts.append(request.url) if request.method=='POST' else None);capital=page.locator('#planCapital').input_value();leverage=page.locator('#planLeverage').input_value();page.locator('[data-command=use-levels]').click();assert not posts;assert page.locator('#planCapital').input_value()==capital and page.locator('#planLeverage').input_value()==leverage
 for key,value in {'planCapital':'10000','planRisk':'1','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+key).fill(value)
 page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()?.inputValid===true');assert page.evaluate('THNDecision.plan().executionAuthorized') is False
 page.locator('[data-command=save]').click();expect(page.locator('#commandSaveStatus')).to_contain_text('Saved a separate');recorded=page.evaluate('JSON.stringify(THNLibrary.entries())');assert recorded!=saved
 pending=[];page.route('**/api/analyze',lambda route:pending.append(route));page.locator('#deskPrimaryActions [data-desk=analyze]').click();page.wait_for_function('document.getElementById("analyzeBtn").disabled');expect(page.locator('#deskPrimaryActions [data-desk=cancel]')).to_be_visible()
 with page.expect_event('requestfailed',predicate=lambda request:request.url.endswith('/api/analyze')):page.locator('#deskPrimaryActions [data-desk=cancel]').click()
 for route in pending:route.abort()
 page.unroute('**/api/analyze');assert page.evaluate('JSON.stringify(THNLibrary.entries())')==recorded;expect(page.locator('#commandActionStatus')).to_contain_text('Review cancelled')
 page.locator('#deskPrimaryActions [data-desk=evidence]').click();page.locator('#deskFrame-15m summary').click();page.locator('[data-desk="context:15m"]').click();page.wait_for_function('THNCommand.state().fresh&&THNContext.get().interval==="15m"&&THNDecision.brief()?.interval==="15m"');assert page.evaluate('JSON.stringify(THNLibrary.entries())')==recorded;assert page.evaluate('THNResearch.chart===window.__ownedChart')
 assert not any('/api/order' in url or '/api/paper/' in url for url in posts);assert page.evaluate('THNServiceHealth.get().capabilities.paperExecution') is False;assert page.evaluate('THNServiceHealth.get().capabilities.liveTrading') is False;assert not results['errors'];b.close()
(out/'command-workbench-results.json').write_text(json.dumps(results,indent=2));print('PASS: evidence/source/contrary filters,16 EN/AR/theme/layout profiles with axe, exact coordinate-linked levels, retained planner/save/context journey and no execution')
