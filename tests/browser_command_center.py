"""Real main-page command journey, retained engines, coordinate identity and fail-closed states."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/command-center'));out.mkdir(parents=True,exist_ok=True)
result={'profiles':[],'errors':[],'scope':'Offline deterministic providers; positive setup uses explicitly controlled analytical response fixtures, never a model or execution.'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda route:route.abort());page.on('pageerror',lambda error:result['errors'].append(str(error)))
 posts=[];page.on('request',lambda request:posts.append(request.url) if request.method=='POST' else None)
 page.goto(os.environ['TEST_URL']);page.wait_for_function('THNCommand&&THNCommand.state().fresh&&THNMarketTerminal.catalog().length');assert page.locator('#commandChooser').evaluate('(e)=>e.open');assert page.locator('#qCandles').count()==1
 page.evaluate('window.__commandChart=THNResearch.chart;window.__routeChanges=0;window.__route=document.querySelector(".view-active").id;addEventListener("thn:view",()=>{const next=document.querySelector(".view-active").id;if(next!==window.__route)window.__routeChanges++;window.__route=next})')
 page.locator('#commandSearch').fill('EURUSD');expect(page.locator('#commandInstruments button')).to_have_count(1);page.locator('#commandSearch').press('ArrowUp');expect(page.locator('#commandInstruments [data-command="pick:EURUSD"]')).to_be_focused();page.locator('#commandInstruments [data-command="pick:EURUSD"]').click();assert not page.locator('#commandChooser').evaluate('(e)=>e.open');expect(page.locator('#commandConfluence')).to_have_text(str(page.evaluate('THNCommand.state().confluence')))
 assert page.evaluate('THNCommand.state().probability') is None;assert page.evaluate('THNCommand.state().candidate') is None;expect(page.locator('#commandSetup')).to_contain_text('No valid setup');assert not page.locator('#commandOverlay line').count()
 page.route(EMBED_URL,lambda route:route.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY));page.locator('#proTradingViewMode').click();page.wait_for_function('THNProfessional.mode()==="manual"');assert page.evaluate('THNResearch.chart===window.__commandChart');expect(page.locator('#commandFeedNote')).to_contain_text('independent');page.locator('#proResearchMode').click();expect(page.locator('#qCandles')).to_be_visible()
 page.locator('[data-command=reasoning]').click();expect(page.locator('#commandRationaleTitle')).to_be_focused();assert page.locator('#commandRationale').evaluate('(e)=>e.open');expect(page.locator('#commandReasoning')).to_contain_text('Eight technical perspectives');page.locator('#commandSourceTitle').click();page.locator('#commandSourceTitle').focus();page.evaluate('document.documentElement.dataset.theme="light"');expect(page.locator('#commandSourceTitle')).to_be_focused();assert page.locator('#commandSourceDetails').evaluate('(e)=>e.open');page.evaluate('document.documentElement.dataset.theme="dark"');expect(page.locator('#commandSourceTitle')).to_be_focused();page.locator('#commandRationaleTitle').click()
 # Controlled positive evidence fixtures exercise the UI without changing any production calculations.
 def positive_analysis(route):
  response=route.fetch();data=response.json();entry=data['entry'];data.update({'decision':'BUY','consensusLabel':'BULLISH','confidence':80,'grade':'A','stopLoss':entry-.01,'targets':[entry+.002,entry+.004,entry+.006]});route.fulfill(response=response,json=data)
 def positive_brief(route):
  response=route.fetch();data=response.json();data['complete']=True;data['conflicting']=False
  for frame in data['frames']:
   if frame['available']:frame['trend']='bullish'
  for scenario in data['scenarios']:
   if scenario['direction']=='bullish':scenario.update({'readyForPlanning':True,'trigger':data['selected']['lastCandle']['close'],'invalidation':data['selected']['lastCandle']['close']-.01})
  route.fulfill(response=response,json=data)
 page.route('**/api/analyze',positive_analysis);page.route('**/api/research/brief?**',positive_brief)
 page.locator('#commandChooseButton').click();page.locator('#commandSearch').fill('GBPUSD');page.locator('#commandInstruments [data-command="pick:GBPUSD"]').click();page.wait_for_function('THNCommand.state().candidate?.symbol==="GBPUSD"');candidate=page.evaluate('THNCommand.state().candidate');assert candidate['capital'] is None and candidate['lots'] is None and candidate['executionAuthorized'] is False
 expect(page.locator('#commandSetup')).to_contain_text('Recorded candidate levels');expect(page.locator('#tradeToast')).to_be_hidden();expect(page.locator('#commandReviewCaption')).to_have_text('Full review:');page.wait_for_function('THNCommand.coordinates().length>0');bounds=page.locator('#qCandles,#commandOverlay').evaluate_all('(nodes)=>nodes.map(e=>e.getBoundingClientRect().toJSON())');assert all(abs(bounds[0][key]-bounds[1][key])<.1 for key in ['x','y','width','height']),bounds;coordinates=page.evaluate('THNCommand.coordinates()');assert all(point['hash']==candidate['hash'] for point in coordinates)
 for point in coordinates:
  actual=page.evaluate('(price)=>{const p=THNResearch.chart.plot;return p.top+(p.max-price)/(p.max-p.min)*p.height}',point['value']);assert abs(actual-point['y'])<.01
 page.locator('#qCandles').focus();page.keyboard.press('+');page.keyboard.press('ArrowLeft');page.wait_for_function('THNCommand.coordinates().length>0')
 for point in page.evaluate('THNCommand.coordinates()'):
  expected=page.evaluate('(price)=>{const p=THNResearch.chart.plot;return p.top+(p.max-price)/(p.max-p.min)*p.height}',point['value']);assert abs(expected-point['y'])<.01
 page.locator('#commandLegendTitle').click();page.locator('[data-command=inspect-marker]').click();expect(page.locator('#studioInspectorTitle')).to_be_focused();assert page.locator('#studioInspector').evaluate('(e)=>e.open')
 # Copy only recorded price references; never capital, leverage, sizing, or an order.
 capital=page.locator('#planCapital').input_value();leverage=page.locator('#planLeverage').input_value();before_posts=len(posts);page.locator('[data-command=use-levels]').click();expect(page.locator('#planEntry')).to_be_focused();assert len(posts)==before_posts;assert page.locator('#planCapital').input_value()==capital and page.locator('#planLeverage').input_value()==leverage
 assert float(page.locator('#planEntry').input_value())==candidate['entry'];assert float(page.locator('#planStop').input_value())==candidate['stop'];assert float(page.locator('#d64Target3').input_value())==candidate['targets'][2];expect(page.locator('#commandPlannerNote')).to_contain_text('does not change account leverage')
 for key,value in {'planCapital':'10000','planRisk':'1','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+key).fill(value)
 page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()?.inputValid===true');assert page.evaluate('THNDecision.plan().executionAuthorized') is False
 page.locator('#planEntry').fill('');assert page.evaluate('THNDecision.plan()') is None;page.locator('#planEntry').fill(str(candidate['entry']));page.locator('#commandPlannerTitle').click()
 page.locator('#commandThesis').fill('Main-page research thesis');expect(page.locator('#d64Thesis')).to_have_value('Main-page research thesis');saved_before=page.evaluate('JSON.stringify(THNLibrary.entries())');original_notes=page.locator('#d64Notes').input_value();page.locator('#commandIncludeCandidate').check();page.locator('[data-command=save]').click();expect(page.locator('#commandSaveStatus')).to_contain_text('Saved a separate');saved=page.evaluate('JSON.stringify(THNLibrary.entries())');assert saved!=saved_before;quoted=page.evaluate('THNLibrary.entries().find(v=>v.record.user.thesis==="Main-page research thesis").record.user.notes');assert candidate['hash'] in quoted and str(candidate['entry']) in quoted;assert 'not execution-approved' in quoted;assert page.locator('#d64Notes').input_value()==original_notes
 assert page.evaluate('window.__routeChanges')==0;result['coreRouteChanges']=page.evaluate('window.__routeChanges')
 # Stale data invalidates score/levels/annotations while preserving the original saved record.
 def stale(route):
  response=route.fetch();data=response.json();data['provenance']['status']='stale';route.fulfill(response=response,json=data)
 page.route('**/api/research/series?**',stale);page.locator('#qRefresh').click();page.wait_for_function('THNCommand.state().phase==="stale"');expect(page.locator('#commandConfluence')).to_have_text('N/A');assert page.evaluate('THNCommand.state().candidate') is None;assert page.locator('#commandOverlay line').count()==0;assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved;page.unroute('**/api/research/series?**')
 page.locator('#qRefresh').click();page.wait_for_function('THNCommand.state().fresh');page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,1024,768,390,320,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme);page.locator('.nav-stack [data-view=dashboard]').click();page.evaluate('scrollTo(0,0)');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,lang,theme)
  expect(page.locator('#qCandles')).to_be_visible();expect(page.locator('#commandSetup')).to_be_visible();expect(page.locator('#commandRationaleTitle')).to_be_visible();assert page.evaluate('THNResearch.chart===window.__commandChart')
  if width>=1024:
   boxes=page.locator('#qCandles,#commandConfluence,#commandSetup').evaluate_all('(nodes)=>nodes.map(e=>({id:e.id,y:e.getBoundingClientRect().y}))');assert all(box['y']<1000 for box in boxes),(width,lang,theme,boxes)
  if width in [1440,390]:
   violations=page.evaluate('async()=>(await axe.run(document.getElementById("commandGrid"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))');assert not violations,(width,lang,theme,violations)
   page.screenshot(path=str(out/f'command-{width}-{lang}-{theme}.png'),animations='disabled');
  result['profiles'].append([width,lang,theme])
 # A user cancellation aborts the actual pending analysis, preserves context and never creates an order.
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click();pending=[]
 page.route('**/api/analyze',lambda route:pending.append(route));page.locator('[data-command=analyze]').click();page.wait_for_function('document.getElementById("analyzeBtn").disabled');expect(page.locator('[data-command=cancel]')).to_be_visible();before_cancel=page.evaluate('THNContext.get()')
 with page.expect_event('requestfailed',predicate=lambda request:request.url.endswith('/api/analyze')):page.locator('[data-command=cancel]').click()
 for route in pending:route.abort()
 pending.clear()
 expect(page.locator('#commandActionStatus')).to_contain_text('Review cancelled');assert page.evaluate('THNContext.get()')==before_cancel;assert not page.evaluate('document.getElementById("analyzeBtn").disabled');page.unroute('**/api/analyze')
 assert not any('/api/order' in url or '/api/paper/' in url for url in posts)
 # A delayed old symbol is aborted when the user chooses a new instrument; no cross-context setup.
 page.route('**/api/analyze',lambda route:pending.append(route) if route.request.post_data_json.get('symbol')=='USDJPY' else positive_analysis(route));page.evaluate('THNCommand.pick("USDJPY")');page.wait_for_function('THNContext.get().symbol==="USDJPY"&&document.getElementById("analyzeBtn").disabled')
 with page.expect_event('requestfailed',predicate=lambda request:request.url.endswith('/api/analyze') and request.post_data_json.get('symbol')=='USDJPY'):page.evaluate('THNCommand.pick("GBPUSD")')
 [route.abort() for route in pending];pending.clear();page.wait_for_function('THNCommand.state().fresh&&THNContext.get().symbol==="GBPUSD"');assert page.evaluate('THNCommand.state().candidate?.symbol')=='GBPUSD';assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved;page.unroute('**/api/analyze')
 # Same single planner returns to Risk Desk; all nine original routes remain usable.
 for view in ['trading','ai','risk','portfolio','journal','brokers','settings','markets','dashboard']:
  page.locator('.nav-stack [data-view='+view+']').click();expect(page.locator('#view-'+view)).to_be_visible()
  if view=='risk':expect(page.locator('#view-risk #workRiskForm')).to_be_visible()
 # Main assessment owns directional signals; original secondary-page alerts and notices remain available.
 page.locator('.nav-stack [data-view=trading]').click();page.evaluate('showTradeToast(currentAnalysis)');expect(page.locator('#tradeToast')).to_be_visible();page.locator('.nav-stack [data-view=dashboard]').click();expect(page.locator('#tradeToast')).to_be_hidden();page.evaluate('showNotice("Research notice retained")');expect(page.locator('#tradeToast')).to_be_visible();expect(page.locator('#toastReason')).to_have_text('Research notice retained');page.locator('#toastCloseBtn').click()
 # Aging a still-open session invalidates a previously recent snapshot without changing its historical record.
 page.locator('.nav-stack [data-view=dashboard]').click();page.evaluate('window.__realClock=Date.now;const expiry=THNCommand.state().expiresAt;Date.now=()=>expiry+1;dispatchEvent(new Event("focus"))');page.wait_for_function('THNCommand.state().phase==="stale"');expect(page.locator('#commandConfluence')).to_have_text('N/A');assert page.locator('#commandOverlay line').count()==0;assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved;page.evaluate('Date.now=window.__realClock;dispatchEvent(new Event("focus"))');page.wait_for_function('THNCommand.state().fresh')
 # Catalog outage recovery uses the same catalog controller, not a second instrument list.
 recovery=b.new_page(viewport={'width':390,'height':844});recovery.route('https://**/*',lambda route:route.abort());recovery.route('**/api/research/catalog',lambda route:route.fulfill(status=503,json={'ok':False}));recovery.goto(os.environ['TEST_URL']);recovery.wait_for_function('window.THNCommand&&THNMarketTerminal.catalogStatus()==="failed"');expect(recovery.locator('[data-command=retry-catalog]')).to_be_visible();assert recovery.locator('#commandInstruments button').count()==0;recovery.unroute('**/api/research/catalog');recovery.locator('[data-command=retry-catalog]').click();recovery.wait_for_function('THNMarketTerminal.catalogStatus()==="ready"&&THNMarketTerminal.catalog().length>0');assert recovery.locator('#commandInstruments button').count()>0;recovery.close()
 assert page.evaluate('THNServiceHealth.get().capabilities.paperExecution') is False;assert page.evaluate('THNServiceHealth.get().capabilities.liveTrading') is False;assert not result['errors'];b.close()
(out/'command-center-results.json').write_text(json.dumps(result,indent=2));print('PASS: one-page selection/chart/conditional fixture/validated planner/save workflow, 24 bilingual/theme/layout profiles, coordinates, no sizing or execution, stale invalidation and original records preserved')
