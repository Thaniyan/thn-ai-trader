"""Real packaged research/planner path; controlled SYNTHETIC admission only.
No fixture-backed Ticket qualifies a real source, model or financial execution.
"""
import copy,itertools,json,os,pathlib,select,subprocess
from playwright.sync_api import sync_playwright,expect
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work'))/'day8';out.mkdir(parents=True,exist_ok=True)
result={'scope':'SYNTHETIC controlled admission; original numerical analysis/risk prices. NOT real source, model or Ticket qualification.','profiles':[],'checks':[],'errors':[]}
server=subprocess.Popen(['node','--import','./tests/browser_day6_provider.mjs','tests/packaged-launch.mjs'],env={**os.environ,'VERCEL':'1','THN_AI_ENABLED':'0','THN_LOCAL_PAPER':'0'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
 assert select.select([server.stdout],[],[],10)[0]
 line=server.stdout.readline().strip();assert line.startswith('THN_TEST_PORT='),line
 url='http://127.0.0.1:'+line.split('=')[1]
 with sync_playwright() as api:
  browser=api.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);assert browser.version=='151.0.7922.34'
  page=browser.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:result['errors'].append(str(e)))
  page.route('https://**/*',lambda r:r.abort());page.route(EMBED_URL,lambda r:r.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY))
  requests=[];page.on('request',lambda r:requests.append(r.url) if r.method=='POST' else None)
  state={'targets':3,'wait':False};original={}
  def analysis(route):
   response=route.fetch();d=response.json();original[d['symbol']]=copy.deepcopy(d)
   # Only directional admission is controlled. Every financial price is original.
   side='BUY' if d['symbol']=='GBPUSD' else 'SELL';assert d['decision'].startswith(side)
   d.update(decision=side,consensusLabel='NEUTRAL' if state['wait'] else 'BULLISH' if side=='BUY' else 'BEARISH');d['targets']=d['targets'][:state['targets']]
   route.fulfill(response=response,json=d)
  def brief(route):
   response=route.fetch();d=response.json();direction='bullish' if d['symbol']=='GBPUSD' else 'bearish';d.update(complete=True,conflicting=False)
   for f in d['frames']:
    if f['available']:f['trend']=direction
   raw=page.request.post(url+'/api/analyze',data={'symbol':d['symbol'],'timeframe':'1h'}).json()
   for s in d['scenarios']:
    if s['direction']==direction:s.update(readyForPlanning=True,trigger=d['selected']['lastCandle']['close'],invalidation=raw['stopLoss'])
   route.fulfill(response=response,json=d)
  page.route('**/api/analyze',analysis);page.route('**/api/research/brief?**',brief)
  page.goto(url);page.wait_for_function('window.THNPrecision&&THNDecision.planningState&&THNCommand.state().fresh');page.locator('.nav-stack [data-view=dashboard]').click();page.add_script_tag(path=os.environ['AXE_PATH'])
  def select(symbol):
   page.evaluate('(s)=>THNWorkspace.selectMarket(s)',symbol);page.wait_for_function('(s)=>THNCommand.state().candidate?.symbol===s&&THNDecision.brief()?.symbol===s',arg=symbol)
  def open_review():
   page.locator('#researchTicketDetails').evaluate('(e)=>e.open=true')
  def prepare():
   open_review();page.locator('[data-ticket=levels]').click()
   for key,value in {'planCapital':'10000','planRisk':'1','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+key).fill(value)
  def submit():page.locator('#workRiskForm').evaluate('(e)=>e.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))')
  def validate():
   submit();page.wait_for_function('THNPrecision.review().status==="eligible"');expect(page.locator('#researchTicketRiskState')).to_have_attribute('data-state','matched')
   p=page.evaluate('THNDecision.plan()');c=page.evaluate('THNCommand.state().candidate');assert p['entry']==c['entry'] and p['stop']==c['stop'] and p['targets']==c['targets'];assert p['plannedStopLossWithCosts']<=p['budget'] and p['metrics']['requiredMargin']<=p['capital'];return p
  for symbol in ['GBPUSD','EURUSD']:
   select(symbol);prepare();plan=validate();candidate=page.evaluate('THNCommand.state().candidate');raw=original[symbol];assert candidate['entry']==raw['entry'] and candidate['stop']==raw['stopLoss'] and candidate['targets']==raw['targets']
   for width,lang,theme in itertools.product([1440,768,390],['en','ar'],['dark','light']):
    page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
    page.wait_for_function('THNPrecision.review().status==="eligible"');open_review();page.locator('#commandRationale').evaluate('(e)=>e.open=false')
    assert page.evaluate('THNDecision.plan()')==plan;assert page.locator('#commandSetup .command-levels>div').count()==5
    expect(page.locator('#ticketSourceHash')).to_have_text(candidate['hash']);assert page.locator('[data-ticket-target]').count()==len(plan['targets'])
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert page.locator('#ticketRiskTitle').evaluate('(e)=>getComputedStyle(e).direction')==('rtl' if lang=='ar' else 'ltr')
    violations=page.evaluate('async()=> (await axe.run(document.querySelector("#commandSetup"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>v.id)');assert not violations,(width,lang,theme,violations)
    page.locator('#commandSetup').screenshot(path=str(out/f'{symbol}-{width}-{lang}-{theme}-ticket.png'),animations='disabled')
    page.locator('#ticketRiskTitle').scroll_into_view_if_needed();page.screenshot(path=str(out/f'{symbol}-{width}-{lang}-{theme}-risk-viewport.png'),animations='disabled')
    page.locator('#researchTicketDetails').evaluate('(e)=>e.open=false');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/f'{symbol}-{width}-{lang}-{theme}.png'),animations='disabled')
    result['profiles'].append({'symbol':symbol,'width':width,'language':lang,'theme':theme,'candidateHash':candidate['hash'],'targets':len(candidate['targets']),'axeViolations':violations,'riskBound':True})
   # Source/validation/interpretation navigation uses the original owners in-place.
   open_review()
   for key,target in [('source','deskSourceCertificate'),('validation','trustTest'),('interpretation','commandInterpretation')]:
    origin=page.locator('[data-ticket='+key+']');origin.click();assert page.locator('#view-dashboard').evaluate('(e)=>e.classList.contains("view-active")')
    assert page.locator('#'+target).is_visible();page.locator(':focus').press('Escape');expect(origin).to_be_focused()
   # Save and revisit the original report through the existing Library owner.
   open_review();page.locator('[data-ticket=notes]').click();page.locator('#commandThesis').fill('Day8 SYNTHETIC Ticket '+symbol);page.locator('#commandIncludeCandidate').check();page.locator('#commandNotebook [data-command=save]').click()
   entry=page.evaluate('THNLibrary.entries().at(-1)');assert entry['record']['plan']['entry']==candidate['entry'];assert entry['record']['plan']['targets']==candidate['targets'];saved=page.evaluate('JSON.stringify(THNLibrary.records())')
   page.locator('.nav-stack [data-view=journal]').click();page.evaluate('(id)=>THNLibrary.open(id)',entry['id']);expect(page.locator('#l65SavedResultsTitle')).to_be_visible();page.locator('.nav-stack [data-view=dashboard]').click();assert page.evaluate('JSON.stringify(THNLibrary.records())')==saved
   result['checks'].append(symbol+': original Library roundtrip retains source-bound plan and quoted references')
   # A different valid entry used to borrow the candidate's Eligible label.
   prepare();page.locator('#planEntry').fill(str(candidate['entry']+(1 if symbol=='GBPUSD' else -1)*.000001));submit();page.wait_for_function('THNDecision.planningState().state==="valid"')
   expect(page.locator('#researchTicketRiskState')).to_have_attribute('data-state','levels_mismatch');assert page.evaluate('THNPrecision.review().status')=='conditional';assert page.evaluate('THNPrecision.review().validatedPlan') is None;assert page.evaluate('THNCommand.state().candidate')==candidate
   assert page.evaluate('JSON.stringify(THNLibrary.records())')==saved
   result['checks'].append(symbol+': separate valid entry cannot validate recorded Ticket; saved record immutable')
   prepare();validate()
   # Switching chart engines preserves bound levels and uses the native inspector.
   page.locator('#proTradingViewMode').click();assert page.evaluate('THNCommand.state().candidate')==candidate
   level=page.locator('#commandSetup [data-desk="level:E"]');level.click();expect(page.locator('#qCandles')).to_be_focused();assert page.evaluate('THNProfessional.mode()')=='research';page.locator('#qCandles').press('Escape');expect(level).to_be_focused()
  # No placeholder T2/T3 or manufactured outcomes when only T1 is retained.
  state['targets']=1;page.reload();page.wait_for_function('window.THNCommand&&THNCommand.state().fresh');page.locator('.nav-stack [data-view=dashboard]').click();select('GBPUSD');prepare();validate();open_review()
  assert page.locator('#commandSetup .command-levels>div').count()==3;assert page.locator('[data-ticket-target]').count()==1
  result['checks'].append('Only retained T1 rendered and planned; no unavailable target placeholders')
  # Explicit zero costs are valid. Blank required assumptions are not zero.
  for lang in ['en','ar']:
   page.locator('.terminal-topbar [data-language='+lang+']').click()
   for field in ['planCapital','planRisk','planLeverage','planEntry','planStop','planTarget','qRisk_spread','qRisk_slippage','qRisk_commission']:
    prepare();page.locator('#'+field).fill('');before=len(requests);submit();expect(page.locator('#planResult')).to_have_attribute('data-state','rejected');expect(page.locator('#researchTicketRiskState')).to_have_attribute('data-state','rejected');assert page.evaluate('THNDecision.plan()') is None;assert len(requests)==before
   result['checks'].append(lang+': nine empty required assumptions rejected without provider request')
  # Current source changes while risk response is in flight: clear immediately.
  prepare();held=[]
  def hold_plan(route):
   response=route.fetch();held.append((route,response));page.evaluate('window.__day8Held=true')
  page.route('**/api/research/plan',hold_plan)
  submit();page.wait_for_function('window.__day8Held===true');assert held
  old=page.evaluate('THNContext.get()');page.evaluate('THNContext.set({datasetId:"b".repeat(64)},"day8-source-change")');assert page.evaluate('THNDecision.plan()') is None;assert page.evaluate('THNPrecision.review().candidate') is None
  with page.expect_response('**/api/research/plan'):held[0][0].fulfill(response=held[0][1])
  page.evaluate('()=>new Promise(requestAnimationFrame)');assert page.evaluate('THNDecision.plan()') is None;assert page.evaluate('THNDecision.planningState().state')=='stale';assert page.locator('#commandOverlay line').count()==0
  page.unroute('**/api/research/plan');result['checks'].append('Late actual planner response cannot attach to changed source hash')
  # Truthful synthetic WAIT, explicitly not a real-source observation.
  state['wait']=True;page.reload();page.wait_for_function('window.THNCommand&&THNCommand.state().fresh');page.locator('.nav-stack [data-view=dashboard]').click();page.wait_for_function('THNPrecision.review().status==="wait"');open_review();expect(page.locator('#researchTicketRiskState')).to_have_attribute('data-state','blocked');assert page.locator('#commandSetup .command-levels>div').count()==0;assert page.locator('[data-ticket-target]').count()==0
  expect(page.locator('#researchTicketDetails')).to_contain_text('توافق' if page.evaluate('document.documentElement.lang')=='ar' else 'consensus')
  page.add_script_tag(path=os.environ['AXE_PATH']) # Reload above resets the document's axe runtime.
  result['waitProfiles']=[]
  for width,lang,theme in [(1440,'en','dark'),(390,'ar','light')]:
   page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);open_review()
   violations=page.evaluate('async()=> (await axe.run(document.querySelector("#commandSetup"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>v.id)');assert not violations
   page.locator('#commandSetup').screenshot(path=str(out/f'WAIT-{width}-{lang}-{theme}-ticket.png'),animations='disabled');page.locator('#researchTicketDetails').evaluate('(e)=>e.open=false');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/f'WAIT-{width}-{lang}-{theme}.png'),animations='disabled')
   result['waitProfiles'].append({'width':width,'language':lang,'theme':theme,'axeViolations':violations,'candidatePresent':False})
  # Regression: the legacy 1px hover translation could move the RTL submit
  # hitbox away from a stationary pointer forever. Use real pointer events.
  for lang in ['en','ar']:
   page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.locator('.nav-stack [data-view=ai]').click();page.locator('#i7Question').fill('Explain indicator methodology' if lang=='en' else 'اشرح منهجية المؤشرات')
   control=page.locator('#intelligenceAssistant form button[type=submit]');page.mouse.move(0,0);control.evaluate('(e)=>e.scrollIntoView({block:"center",behavior:"instant"})');box=control.bounding_box();control.hover(position={'x':box['width']/2-1,'y':box['height']-1.5})
   frames=page.evaluate('async()=>{const rows=[],n=document.querySelector("#intelligenceAssistant form button[type=submit]");for(let i=0;i<20;i++){await new Promise(requestAnimationFrame);const b=n.getBoundingClientRect();rows.push({y:b.y,transform:getComputedStyle(n).transform,hover:n.matches(":hover")});}return rows;}')
   assert len({f['y'] for f in frames})==1 and all(f['transform']=='none' for f in frames) and any(f['hover'] for f in frames),(lang,frames)
   control.click();page.wait_for_function('THNIntelligence.view().phase==="ready"&&!THNIntelligence.state().busy');assert page.evaluate('THNIntelligence.result().method')=='deterministic'
   result['checks'].append(lang+': stationary pointer-boundary submit and normal click; no model inference')
  health=page.request.get(url+'/api/health').json();assert health['capabilities']['liveTrading'] is False and health['capabilities']['paperExecution'] is False
  assert not any('/api/orders' in r or '/api/trade' in r for r in requests);assert not result['errors'],result['errors']
  result['checks'].append('WAIT has no released prices/outcomes; no execution calls; deterministic model method')
  (out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
 print('PASS Day8: 24 BUY/SELL EN/AR/theme/responsive profiles, exact risk binding, empty assumptions, source-hash cancellation and original chart/evaluator owners.',flush=True)
finally:
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill();server.wait()
