"""Day6 eligible-ticket acceptance. Controlled admission, real retained engine prices.

This verifies UI/integrity, NOT live providers, predictive merit or execution.
The numerical values from /api/analyze and /api/research/plan are never replaced.
"""
import copy,itertools,json,os,pathlib,select,subprocess,sys
from playwright.sync_api import sync_playwright,expect
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY

out=pathlib.Path(os.environ.get('TEST_OUTPUT','work'))/'day6';out.mkdir(parents=True,exist_ok=True)
result={'scope':'OFFLINE synthetic histories; controlled directional/confirmation admission. Original engine prices and authoritative risk results. UI verification only, not a real provider-qualified setup.','profiles':[],'negativeCases':[],'errors':[]}
env={**os.environ,'VERCEL':'1','THN_AI_ENABLED':'0','THN_LOCAL_PAPER':'0'}
server=subprocess.Popen(['node','--import','./tests/browser_day6_provider.mjs','tests/packaged-launch.mjs'],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
 assert select.select([server.stdout],[],[],10)[0],'Day6 fixture server did not start'
 line=server.stdout.readline().strip() if server.stdout else ''
except BaseException:
 server.terminate();server.wait(timeout=5);raise
# Server ownership is scoped to this suite, including assertion/error exits.
try:
 assert line.startswith('THN_TEST_PORT='),line
 url='http://127.0.0.1:'+line.split('=')[1]
 state={'case':'positive','symbol':'GBPUSD','targets':3};retained={};originals={};requests=[]
 sides={'GBPUSD':'BUY','EURUSD':'SELL','AUDUSD':'BUY'}
 with sync_playwright() as api:
  browser=api.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
  assert browser.version=='151.0.7922.34'
  page=browser.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.route(EMBED_URL,lambda r:r.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY))
  font_cdp=page.context.new_cdp_session(page);font_cdp.send('DOM.enable');font_cdp.send('CSS.enable')
  page.on('pageerror',lambda e:result['errors'].append(str(e)))
  page.on('request',lambda r:requests.append(r.url) if r.method=='POST' else None)
  reference={symbol:page.request.post(url+'/api/analyze',data={'symbol':symbol,'timeframe':'1h'}).json() for symbol in sides}
  def analysis(route):
   response=route.fetch();d=response.json();symbol=d['symbol'];side=sides.get(symbol,'BUY');originals[symbol]=copy.deepcopy(d)
   assert d['decision'].startswith(side),(symbol,'fixture must exercise original engine side',d['decision'])
   retained[symbol]={'entry':d['entry'],'stop':d['stopLoss'],'targets':d['targets'][:state['targets']]}
   # Admission is explicitly controlled, not reported as an unmodified signal.
   d.update(decision=side,consensusLabel='BULLISH' if side=='BUY' else 'BEARISH');d['targets']=d['targets'][:state['targets']]
   if state['case']=='wait':d['consensusLabel']='NEUTRAL'
   if state['case']=='contradictory':d['decision']='SELL' if side=='BUY' else 'BUY'
   if state['case']=='missing-levels':d['targets']=[]
   if state['case']=='geometry':d['stopLoss']=d['entry']
   route.fulfill(response=response,json=d)
  def brief(route):
   response=route.fetch();d=response.json();side=sides.get(d['symbol'],'BUY');direction='bullish' if side=='BUY' else 'bearish'
   d.update(complete=True,conflicting=False)
   for f in d['frames']:
    if f['available']:f['trend']=direction
   for s in d['scenarios']:
    if s['direction']==direction:
     s.update(readyForPlanning=True,trigger=d['selected']['lastCandle']['close'],invalidation=reference[d['symbol']]['stopLoss'])
     assert s['invalidation']<s['trigger'] if side=='BUY' else s['invalidation']>s['trigger']
   if state['case']=='stale-frame':d['frames'][0]['provenance']['status']='stale'
   if state['case']=='missing-frame':d['frames'][0]['available']=False;d['complete']=False
   if state['case']=='conflicting-frame':d['frames'][0]['trend']='bearish' if side=='BUY' else 'bullish';d['conflicting']=True
   route.fulfill(response=response,json=d)
  def series(route):
   response=route.fetch();d=response.json()
   if state['case']=='currency':d['provenance']['currency']='JPY'
   if state['case']=='provider':d['provenance']['providerSymbol']='OTHER=X'
   if state['case']=='stale-series':d['provenance']['status']='stale'
   route.fulfill(response=response,json=d)
  def catalog(route):
   response=route.fetch();d=response.json()
   for item in d['instruments']:
    if item['symbol']!=state['symbol']:continue
    if state['case']=='proxy':item['proxy']=True
    if state['case']=='missing-contract':item['contract']=None
    if state['case']=='invalid-contract':item['contract']['minLot']=item['contract']['maxLot']+1
    if state['case']=='contract-mapping':
     metal=next(i for i in d['instruments'] if i['symbol']=='XAUUSD');item.update(providerSymbol=metal['providerSymbol'],contract=copy.deepcopy(metal['contract']),proxy=True)
   route.fulfill(response=response,json=d)
  page.route('**/api/analyze',analysis);page.route('**/api/research/brief?**',brief);page.route('**/api/research/series?**',series);page.route('**/api/research/catalog',catalog)
  def select(symbol):
   state['symbol']=symbol;page.evaluate('(s)=>THNWorkspace.selectMarket(s)',symbol)
   page.wait_for_function('(s)=>THNCommand.state().fresh&&THNContext.get().symbol===s&&THNDecision.brief()?.symbol===s&&THNDecision.brief()?.selected.provenance.hash===THNContext.get().datasetId',arg=symbol)
  def validate(capital='10000'):
   page.wait_for_function('THNCommand.state().candidate!==null');page.locator('[data-command=use-levels]').click()
   r=retained[state['symbol']]
   assert float(page.locator('#planEntry').input_value())==r['entry'];assert float(page.locator('#planStop').input_value())==r['stop']
   for key,value in {'planCapital':capital,'planRisk':'1','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+key).fill(value)
   page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNPrecision.review().status==="eligible"');page.locator('#commandRationale').evaluate('(e)=>e.open=false')
   p=page.evaluate('THNDecision.plan()');assert p['inputValid'] and not p['executionAuthorized'];assert p['entry']==r['entry'] and p['stop']==r['stop'] and p['targets']==r['targets'];assert p['plannedStopLossWithCosts']<=p['budget'] and p['metrics']['requiredMargin']<=p['capital'];return p
  def assert_prices():
   c=page.evaluate('THNCommand.state().candidate');r=retained[state['symbol']];assert c is not None
   assert c['entry']==r['entry'] and c['stop']==r['stop'] and c['targets']==r['targets'];assert not c['executionAuthorized'] and not c['entryQuoteVerified']
   assert c['symbol']==state['symbol'] and c['interval']=='1h' and c['hash']==page.evaluate('THNContext.get().datasetId');assert c['barTime']==page.evaluate('THNResearch.series().provenance.lastTime')
   values=[('E',r['entry']),('SL',r['stop'])]+[('T'+str(i+1),v) for i,v in enumerate(r['targets'])]
   for label,value in values:
    expected=page.evaluate('(v)=>new Intl.NumberFormat(document.documentElement.lang==="ar"?"ar-OM":"en-US",{maximumFractionDigits:6}).format(v)',value);control=page.locator('#commandSetup [data-desk="level:'+label+'"]');expect(control).to_have_text(expected);expect(control).to_be_visible();assert control.get_attribute('aria-label');assert control.evaluate('(e)=>{const b=e.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(e);const t=r.getBoundingClientRect(),lines=[...r.getClientRects()];return t.left>=b.left-1&&t.right<=b.right+1&&lines.every(v=>Math.abs(v.top-lines[0].top)<1)}'),(state['symbol'],label,'complete retained price must fit on one readable line')
   return c
  page.goto(url);page.wait_for_function('window.THNCommand&&THNCommand.state().fresh&&THNDecision.brief()');page.locator('.nav-stack [data-view=dashboard]').click();page.add_script_tag(path=os.environ['AXE_PATH'])
  health=page.request.get(url+'/api/health').json();assert health['capabilities']['liveTrading'] is False and health['capabilities']['paperExecution'] is False
  saved=page.evaluate('JSON.stringify(THNLibrary.entries())')
  for symbol,side in [('GBPUSD','BUY'),('EURUSD','SELL')]:
   select(symbol);plan=validate();candidate=assert_prices();original=originals[symbol]
   result.setdefault('engineReferences',{})[side]={'symbol':symbol,'originalDecision':original['decision'],'originalConsensus':original['consensusLabel'],'engine':original['analysisEngineVersion'],'raw':retained[symbol],'provenance':original['evidence'],'controlledAdmission':True,'riskPlan':plan}
   for width,lang,theme,mode in itertools.product([1440,1024,390],['en','ar'],['dark','light'],['research','manual']):
    page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
    page.locator('#proResearchMode' if mode=='research' else '#proTradingViewMode').click();page.wait_for_function('(m)=>THNProfessional.mode()===m',arg=mode);expect(page.locator('#precisionStatus')).to_have_attribute('data-state','eligible');assert assert_prices()==candidate
    assert page.evaluate('THNDecision.plan()')==plan;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.evaluate('scrollTo(0,0)');boxes=page.locator('#commandSetup,#commandChartHost,#qCandles,#chart').evaluate_all('(es)=>Object.fromEntries(es.map(e=>[e.id,e.getBoundingClientRect().toJSON()]))');ticket=boxes['commandSetup']
    if width>900:
     chart=boxes['commandChartHost'];assert ticket['x']>=chart['right'] or ticket['right']<=chart['x'];assert ticket['y']<800
     assert page.locator('#commandSetup [data-desk^="level:"]').evaluate_all('(es)=>es.every(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})')
    else:
     assert page.locator('#commandSetup').evaluate('(e)=>e.parentElement.id')=='precisionMobileTicket'
     assert page.locator('#precisionMobileTicket').evaluate('(e)=>e.previousElementSibling.'+('classList.contains("pro-plotting")' if mode=='research' else 'id==="chart"'))
     page.locator('#deskPrimaryActions [data-desk=setup]').click();expect(page.locator('#commandSetup')).to_be_focused();assert page.locator('#commandSetup [data-desk^="level:"]').evaluate_all('(es)=>es.every(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})')
     page.locator('#commandSetup').press('Escape');expect(page.locator('#deskPrimaryActions [data-desk=setup]')).to_be_focused()
    expect(page.locator('#commandSetup .command-kicker')).to_contain_text('افتراضية' if lang=='ar' else 'HYPOTHETICAL');expect(page.locator('#precisionStatus')).to_contain_text('ليس أمراً' if lang=='ar' else 'not an order');expect(page.locator('.precision-trigger')).to_have_attribute('dir','ltr');expect(page.locator('.precision-trigger')).to_contain_text('≥' if side=='BUY' else '≤')
    scenario=page.evaluate('THNPrecision.review().scenario');trigger=page.evaluate('(v)=>new Intl.NumberFormat(document.documentElement.lang==="ar"?"ar-OM":"en-US",{maximumFractionDigits:6}).format(v)',scenario['trigger']);expect(page.locator('.precision-trigger')).to_contain_text(trigger)
    if mode=='manual':expect(page.locator('#commandFeedNote')).to_contain_text('مستقل' if lang=='ar' else 'independent');expect(page.locator('#qCandles')).to_be_hidden()
    bad=page.evaluate('async()=> (await axe.run(document.querySelector("#commandSetup"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>v.id)');assert not bad,(side,width,lang,theme,mode,bad)
    document=font_cdp.send('DOM.getDocument');node=font_cdp.send('DOM.querySelector',{'nodeId':document['root']['nodeId'],'selector':'#commandSetup [data-desk="level:E"]'});fonts=font_cdp.send('CSS.getPlatformFontsForNode',{'nodeId':node['nodeId']})['fonts'];assert fonts and all(f['glyphCount']>0 for f in fonts)
    if os.environ.get('THN_DAY6_EXPECT_FONT'):assert all(f['familyName']==os.environ['THN_DAY6_EXPECT_FONT'] and not f['isCustomFont'] for f in fonts),(width,lang,theme,fonts)
    name=f'{side.lower()}-{width}-{lang}-{theme}-{mode}'
    if (lang,theme) in [('en','dark'),('ar','light')]:
     page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/(name+'.png')),animations='disabled')
     if width==390:page.locator('#deskPrimaryActions [data-desk=setup]').click();page.screenshot(path=str(out/(name+'-ticket.png')),animations='disabled')
    result['profiles'].append({'side':side,'symbol':symbol,'width':width,'language':lang,'theme':theme,'mode':mode,'candidate':candidate,'display':{e.get_attribute('data-desk').split(':',1)[1]:e.inner_text() for e in page.locator('#commandSetup [data-desk^="level:"]').all()},'ticketLabel':page.locator('#commandSetup .command-kicker').inner_text(),'boxes':boxes,'riskValidated':True,'renderedPriceFonts':fonts})
   # Real keyboard activation selects a sourced annotation and returns to its level.
   page.locator('#proResearchMode').click();level=page.locator('#commandSetup [data-desk="level:E"]');level.focus();level.press('Enter');expect(page.locator('#qCandles')).to_be_focused();page.locator('#qCandles').press('Escape');expect(level).to_be_focused();assert assert_prices()==candidate
   print('PASS eligible matrix '+side,flush=True)
  # Reproduced P1: five-decimal quote rounding merged two distinct retained targets.
  select('AUDUSD');precision_plan=validate('1000000');precision_candidate=assert_prices();raw=retained['AUDUSD'];assert raw['targets'][0]!=raw['targets'][1]
  displays={k:page.locator('#commandSetup [data-desk="level:'+k+'"]').inner_text() for k in ['E','SL','T1','T2','T3']};assert displays['T1']!=displays['T2'];result['precisionRegression']={'raw':raw,'display':displays,'candidate':precision_candidate,'riskPlan':precision_plan,'scope':'Original engine six-decimal values; controlled admission, synthetic low-range history.'}
  page.locator('#commandSetup').scroll_into_view_if_needed();page.screenshot(path=str(out/'retained-precision.png'),animations='disabled')
  # Independently available targets retain their original values; no T2/T3 is invented.
  state.update(case='positive',targets=1);select('GBPUSD');validate();assert_prices();assert page.locator('#commandSetup [data-desk="level:T2"]').count()==0 and page.locator('#commandSetup [data-desk="level:T3"]').count()==0;result['partialTargets']='PASS: only retained T1 available; no T2/T3 controls'
  state['targets']=3
  for case in ['wait','stale-series','stale-frame','missing-frame','conflicting-frame','proxy','currency','provider','missing-contract','invalid-contract','contract-mapping','missing-levels','geometry','contradictory']:
   state['case']=case;page.reload();page.wait_for_function('window.THNCommand');page.evaluate('(s)=>THNWorkspace.selectMarket(s)',state['symbol']);page.wait_for_function('(s)=>window.THNCommand&&THNConfidence.review().analysis?.symbol===s&&THNDecision.brief()?.symbol===s&&THNCommand.state().phase!=="loading"',arg=state['symbol']);page.locator('.nav-stack [data-view=dashboard]').click();page.wait_for_function('THNCommand.state().candidate===null');expect(page.locator('#precisionStatus')).to_have_attribute('data-state','wait');assert page.locator('#commandSetup [data-desk^="level:"]').count()==0;assert page.locator('#commandOverlay line').count()==0
   warnings=page.evaluate('THNCommand.state().warnings')
   required={'wait':'neutral_consensus','stale-series':'history_stale','stale-frame':'incomplete_frames','missing-frame':'incomplete_frames','conflicting-frame':'conflicting_frames','proxy':'proxy_context','currency':'currency_mismatch','provider':'source_identity_unverified','missing-contract':'contract_unavailable','invalid-contract':'contract_unavailable','contract-mapping':'source_identity_unverified','missing-levels':'invalid_recorded_levels','geometry':'invalid_recorded_levels','contradictory':'signal_disagreement'}[case]
   assert required in warnings,(case,required,warnings)
   result['negativeCases'].append({'case':case,'result':'PASS','requiredBlocker':required,'warnings':warnings})
   if case=='wait':
    for width,lang,theme in [(1440,'en','dark'),(1024,'en','dark'),(390,'en','dark'),(1440,'ar','light'),(1024,'ar','light'),(390,'ar','light')]:
     page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/f'wait-{width}-{lang}-{theme}.png'),animations='disabled')
  # A concurrent, independently delayed context must not retain old references.
  state['case']='positive';page.reload();page.wait_for_function('window.THNCommand&&THNCommand.state().candidate!==null');page.locator('.nav-stack [data-view=dashboard]').click();validate();held=[]
  def hold(route):
   if 'symbol=EURUSD' in route.request.url:held.append(route)
   else:route.fallback()
  page.route('**/api/research/brief?**',hold);page.evaluate('''()=>{window.__day6Boundary=null;addEventListener('thn:context',()=>__day6Boundary={candidate:THNCommand.state().candidate,levels:document.querySelectorAll('#commandSetup [data-desk^="level:"]').length},{once:true});THNWorkspace.selectMarket('EURUSD');}''');page.wait_for_function('THNCommand.state().fresh&&THNContext.get().symbol==="EURUSD"');assert page.evaluate('__day6Boundary')=={'candidate':None,'levels':0};assert held and page.evaluate('THNCommand.state().candidate') is None
  for route in held:route.fallback()
  page.unroute('**/api/research/brief?**',hold);page.wait_for_function('THNCommand.state().candidate?.symbol==="EURUSD"');state['symbol']='EURUSD';assert_prices();assert page.evaluate('THNPrecision.review().status')!='eligible';result['concurrentContext']='PASS: immediate withdrawal, held new brief, no old risk eligibility'
  page.route('**/api/research/series?**',lambda r:r.fulfill(status=503,json={'ok':False,'code':'MARKET_DATA_UNAVAILABLE'}))
  with page.expect_response(lambda r:'/api/research/series?' in r.url and r.status==503):page.evaluate('THNWorkspace.refreshMarket()')
  page.wait_for_function('THNResearch.series()===null');assert page.locator('#commandSetup [data-desk^="level:"]').count()==0;result['missingProviderData']='PASS: no substitute prices'
  assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved;assert not any('/api/order' in x or '/api/paper/' in x for x in requests);assert not result['errors'],result['errors'];result['financialExecution']='Unavailable; no order/paper mutation requested';browser.close()
 (out/'acceptance.json').write_text(json.dumps(result,indent=2));print('PASS Day6:48 eligible BUY/SELL responsive language/theme/mode profiles;14 negative cases; original engine prices and risk validation; UI-only qualification.',flush=True)
finally:
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill();server.wait()
