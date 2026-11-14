"""Owner acceptance: source-bound decision reading and original chart inspection."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/institutional-desk'));out.mkdir(parents=True,exist_ok=True)
result={'profiles':[],'candidateProfiles':[],'handoffProfiles':[],'errors':[],'scope':'Actual packaged app with offline synthetic providers; not live-market or Preview acceptance.'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:result['errors'].append(str(e)));posts=[];page.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None)
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNCommand?.state().fresh&&THNDecision.brief()?.frames.length===3');page.locator('.nav-stack [data-view=dashboard]').click();page.evaluate('window.__deskChart=THNResearch.chart;window.__deskRoutes=0;window.addEventListener("thn:view",()=>window.__deskRoutes++)')
 saved=page.evaluate('JSON.stringify(THNLibrary.entries())');page.add_script_tag(path=os.environ['AXE_PATH'])
 # Reading is copied from the actual visible closed candle; zoom is the original engine.
 expect(page.locator('#deskCandleReadout dd')).to_have_count(4);count=page.evaluate('THNResearch.chart.count');page.locator('[data-desk=zoom-in]').click();assert page.evaluate('THNResearch.chart.count')<count
 page.locator('[data-desk=reset-chart]').click();assert page.evaluate('THNResearch.chart.offset')==0
 page.locator('#qCandles').evaluate('(e)=>e.scrollIntoView({block:"start",behavior:"instant"})');chart=page.locator('#qCandles').bounding_box();plot=page.evaluate('THNResearch.chart.plot');page.mouse.move(chart['x']+plot['left']+plot['width']*.25,chart['y']+plot['top']+20)
 page.wait_for_function('document.querySelector("#deskCandleReadout").textContent.includes("Inspected bar")');expected=page.evaluate('(()=>{const c=THNResearch.chart,p=c.plot;return c.visible[Math.min(c.visible.length-1,Math.max(0,Math.floor((c.hover.x-p.left)/p.width*c.visible.length)))].time})()')
 assert page.locator('#deskCandleReadout').inner_text().find(page.evaluate('(t)=>new Date(t).toISOString().replace("T"," ").slice(0,19)',expected))>=0
 page.mouse.move(0,0);page.wait_for_function('document.querySelector("#deskCandleReadout").textContent.includes("Visible window")');last_time=page.evaluate('new Date(THNResearch.chart.visible.at(-1).time).toISOString().replace("T"," ").slice(0,19)');page.locator('[data-desk=inspect-reading]').click();expect(page.locator('#studioInspectorTitle')).to_be_focused();assert page.locator('#studioInspector').evaluate('(e)=>e.open');expect(page.locator('#studioBarValues>p').nth(0)).to_contain_text(last_time)
 page.locator('[data-desk=layer-source]').click();expect(page.locator('#deskLayerSourceTitle')).to_be_focused();assert page.locator('#deskLayerSource').evaluate('(e)=>e.open');expect(page.locator('#deskLayerSource code')).to_have_text(page.evaluate('THNContext.get().datasetId'));page.locator('#deskLayerSource').press('Escape');expect(page.locator('[data-desk=layer-source]')).to_be_focused()
 page.locator('[data-desk=range-source]').click();expect(page.locator('#studioInspectorTitle')).to_be_focused();assert page.evaluate('THNResearch.chart===window.__deskChart')
 page.locator('#deskDecisionBriefTitle').click();expect(page.locator('#deskDecisionBrief .desk-fact-link')).to_have_count(4)
 page.locator('#deskDecisionBrief [data-desk="school:0"]').click();expect(page.locator('#deskSchool-0 > summary')).to_be_focused();page.locator('#deskEvidenceWorkbench').press('Escape');expect(page.locator('#deskDecisionBrief [data-desk="school:0"]')).to_be_focused()
 page.locator('#deskPrimaryActions [data-desk=planner]').click();expect(page.locator('#commandPlannerTitle')).to_be_focused();assert page.locator('#commandPlanner').evaluate('(e)=>e.open')
 page.locator('#deskPrimaryActions [data-desk=notebook]').click();expect(page.locator('#commandThesis')).to_be_focused();page.locator('#commandThesis').fill('Preserved institutional research rationale');assert page.evaluate('window.__deskRoutes')==0
 for width,lang,theme in itertools.product([1440,1024,768,390,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.evaluate('scrollTo({top:0,behavior:"instant"})');page.mouse.move(0,0)
  expect(page.locator('#commandThesis')).to_have_value('Preserved institutional research rationale');assert page.evaluate('THNResearch.chart===window.__deskChart');assert page.locator('#qCandles').count()==1;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,lang,theme)
  for selector in ['#deskCandleReadout','#deskChartNavigation','#deskLayerSource','#deskDecisionBrief']:
   violations=page.evaluate('async(s)=>(await axe.run(document.querySelector(s),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))',selector);assert not violations,(width,lang,theme,selector,violations)
  rect=page.locator('#qCandles').bounding_box();result['profiles'].append({'width':width,'language':lang,'theme':theme,'chart':rect})
 # Genuine stale state clears new readings and fact links, preserves original records/draft.
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click()
 def stale(route):
  response=route.fetch();data=response.json();data['provenance']['status']='stale';route.fulfill(response=response,json=data)
 page.route('**/api/research/series?**',stale);page.locator('#qRefresh').click();page.wait_for_function('THNCommand.state().phase==="stale"');expect(page.locator('#deskCandleReadout dd')).to_have_count(0);expect(page.locator('#deskDecisionBrief .desk-fact-link')).to_have_count(0);expect(page.locator('#deskLayerSource code')).to_have_text('—');assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 page.unroute('**/api/research/series?**');page.locator('#qRefresh').click();page.wait_for_function('THNCommand.state().fresh');expect(page.locator('#deskCandleReadout dd')).to_have_count(4)
 # An independently delayed brief cannot keep old decision facts after a symbol change.
 old_hash=page.evaluate('THNContext.get().datasetId');held=[]
 def hold_new_brief(route):
  if 'symbol=GBPUSD' in route.request.url:held.append(route);page.evaluate('window.__newDeskBriefHeld=true')
  else:route.continue_()
 page.route('**/api/research/brief?**',hold_new_brief);page.evaluate('THNCommand.pick("GBPUSD")');page.wait_for_function('window.__newDeskBriefHeld&&THNContext.get().symbol==="GBPUSD"&&THNCommand.state().fresh')
 expect(page.locator('#deskDecisionBrief .desk-fact-link')).to_have_count(0);assert 'Matching recorded conditional levels unavailable' in page.locator('#deskDecisionBrief').inner_text();expect(page.locator('#deskLayerSource code')).to_have_text(page.evaluate('THNContext.get().datasetId'));assert page.evaluate('THNResearch.chart.context.symbol')=='GBPUSD'
 for route in held:route.continue_()
 held.clear();page.wait_for_function('THNDecision.brief()?.symbol==="GBPUSD"&&THNDecision.brief()?.selected?.provenance.hash===THNContext.get().datasetId');page.unroute('**/api/research/brief?**',hold_new_brief);expect(page.locator('#deskDecisionBrief .desk-fact-link')).to_have_count(4);assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 # Controlled eligible fixture: this is a UI contract, not a live signal or model output.
 def positive_analysis(route):
  response=route.fetch();data=response.json();entry=data['entry'];data.update({'decision':'BUY','consensusLabel':'BULLISH','confidence':80,'grade':'A','stopLoss':entry-.01,'targets':[entry+.002,entry+.004,entry+.006]});route.fulfill(response=response,json=data)
 def positive_brief(route):
  response=route.fetch();data=response.json();data['complete']=True;data['conflicting']=False
  for frame in data['frames']:
   if frame['available']:frame['trend']='bullish'
  for scenario in data['scenarios']:
   if scenario['direction']=='bullish':scenario.update({'readyForPlanning':True,'trigger':data['selected']['lastCandle']['close'],'invalidation':data['selected']['lastCandle']['close']-.01})
  route.fulfill(response=response,json=data)
 page.route('**/api/analyze',positive_analysis);page.route('**/api/research/brief?**',positive_brief);page.evaluate('THNCommand.pick("EURUSD")');page.wait_for_function('THNCommand.state().candidate!==null')
 for width,lang,theme in itertools.product([1440,1024],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.evaluate('scrollTo({top:0,behavior:"instant"})');page.wait_for_function('document.documentElement.lang==="'+lang+'"&&THNCommand.state().candidate!==null')
  setup=page.locator('#commandSetup').bounding_box();confidence=page.locator('#dashboardConviction').bounding_box();assert setup['y']>=0 and setup['y']+setup['height']<=1000,(width,lang,theme,setup);assert confidence['y']>=0 and confidence['y']+confidence['height']<=1000,(width,lang,theme,confidence);expect(page.locator('#commandSetup .command-levels>div')).to_have_count(5);assert page.evaluate('THNCommand.state().candidate.executionAuthorized') is False;assert page.locator('#commandSetup .command-levels>div').evaluate_all('(rows)=>rows.every(row=>{const r=row.getBoundingClientRect(),b=row.querySelector("button").getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1})'),(width,lang,theme)
  result['candidateProfiles'].append({'width':width,'language':lang,'theme':theme,'setup':setup,'confidence':confidence})
 # Source navigation must leave header controls genuinely clickable, without forced clicks or retries.
 page.set_viewport_size({'width':1440,'height':1000})
 for original,target in [('ar','en'),('en','ar')]:
  page.locator('.terminal-topbar [data-language='+original+']').click();page.locator('.nav-stack [data-view=dashboard]').click();page.locator('#evoReasoningChart').click();expect(page.locator('#qCandles')).to_be_focused();page.locator('.terminal-topbar [data-language='+target+']').click();expect(page.locator('html')).to_have_attribute('lang',target);assert page.evaluate('THNResearch.chart===window.__deskChart');result['handoffProfiles'].append([original,target])
 page.locator('#proTradingViewMode').click();expect(page.locator('#commandFeedNote')).to_be_visible();expect(page.locator('#qCandles')).to_be_hidden();assert page.evaluate('THNCommand.state().executionAuthorized') is False;page.locator('#proResearchMode').click();expect(page.locator('#qCandles')).to_be_visible()
 assert not any('/api/order' in u or '/api/paper/' in u for u in posts);assert not result['errors'],result['errors'];b.close()
(out/'institutional-desk-results.json').write_text(json.dumps(result,indent=2));print('PASS: 20 bilingual/theme/responsive plus8 complete first-viewport candidate profiles, original OHLC/zoom/source inspection, decision citations, one-page actions, stale invalidation and financial restrictions')
