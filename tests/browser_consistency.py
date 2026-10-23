"""v7.5 audited trust failures, using real engines with explicit offline provider fixtures.
No market candles, account state or analysis records are fabricated in the browser.
"""
import os,json,pathlib
from playwright.sync_api import sync_playwright,expect
from workspace_controls import control
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY
out=pathlib.Path(os.environ.get('V75_OUTPUT','work/v75'));out.mkdir(parents=True,exist_ok=True)
results={'routes':[],'journeys':[],'errors':[],'axe':[],'externalCandles':'Not asserted; offline official-protocol fixture only'}
views=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:results['errors'].append(str(e)))
 base=os.environ['TEST_URL']
 def ready():page.wait_for_function('window.THNEvolution&&window.THNProfessional&&THNResearch.series()&&THNDecision.brief()')
 def go(v):page.locator('.nav-stack [data-view="'+v+'"]').click();expect(page.locator('#view-'+v)).to_be_visible()
 # F06: actual direct routes and reloads, no manual switchView to disguise failure.
 for view in views:
  page.goto(base+'/#'+view);ready();expect(page.locator('#view-'+view)).to_be_visible();page.reload();ready();expect(page.locator('#view-'+view)).to_be_visible();assert page.url.endswith('#'+view);results['routes'].append(view);print('route',view,flush=True)
 go('markets');go('settings');page.go_back();expect(page.locator('#view-markets')).to_be_visible();page.go_forward();expect(page.locator('#view-settings')).to_be_visible()
 go('dashboard');go('trading');page.locator('#proChartFocus').click();page.go_back();expect(page.locator('#view-dashboard')).to_be_visible();assert not page.evaluate('document.body.classList.contains("pro-chart-focused")||document.querySelector(".view-active").inert')
 page.goto(base+'/#unknown');ready();expect(page.locator('#view-dashboard')).to_be_visible();assert page.url.endswith('#dashboard')
 # F03: health is authoritative, unavailable execution is actually disabled.
 assert page.request.get(base+'/api/health').json()['capabilities']['paperExecution']==False
 expect(page.locator('#executeDirectOrderBtn')).to_be_disabled();expect(page.locator('#prefResetSandboxBtn')).to_be_disabled();assert page.locator('#proBrokerTools input:enabled,#proBrokerTools button:enabled').count()==0
 # F01 F02: actual generated legacy analysis, immutable origin, no current-looking old analysis.
 page.evaluate('THNContext.set({symbol:"EURUSD",interval:"1h"})');go('trading');page.locator('#proAnalyzeContext').click();page.wait_for_function('currentAnalysis?.symbol==="EURUSD"&&!document.getElementById("analyzeBtn").disabled')
 data=page.evaluate('currentAnalysis');assert data['identity']['canonicalInstrument']=='EURUSD';assert data['applicationVersion']=='7.5.0';assert data['identity']['analysisEngineVersion']==data['analysisEngineVersion']
 for phrase in ['smart money trapped','smart money accumulated','smart money distributed','high bounce probability']:
  assert phrase not in json.dumps(data).lower(),phrase
 candles=page.evaluate('THNResearch.series().candles');assert page.evaluate('THNResearch.series().provenance.hash')==data['evidence']['hash']
 changes=[candles[i]['close']-candles[i-1]['close'] for i in range(len(candles)-14,len(candles))];gain=sum(max(0,d) for d in changes)/14;loss=sum(max(0,-d) for d in changes)/14;rolling_rsi=100 if loss==0 else 100-100/(1+gain/loss)
 assert abs(data['indicators']['rsi14']-rolling_rsi)<=.0051
 trs=[max(candles[i]['high']-candles[i]['low'],abs(candles[i]['high']-candles[i-1]['close']),abs(candles[i]['low']-candles[i-1]['close'])) for i in range(len(candles)-14,len(candles))];assert abs(data['indicators']['atr14']-sum(trs)/14)<=.00000051
 assert 'simple rolling' in data['indicatorMethodology']['rsi14'];assert page.evaluate('saveJournal()')==True
 page.locator('.terminal-topbar [data-language=ar]').click();assert any('\u0600'<=c<='\u06ff' for c in page.locator('#statusMsg').text_content());page.locator('.terminal-topbar [data-language=en]').click();expect(page.locator('#statusMsg')).to_contain_text('Research idea saved')
 origin=page.evaluate('getJournal()[0]');assert origin['identity']['datasetHash']==data['evidence']['hash'];assert page.evaluate('THNRecords.classify(getJournal()[0]).eligible')==False
 page.evaluate('THNContext.set({symbol:"BTCUSDT",interval:"15m"})');page.wait_for_function('THNResearch.series()?.symbol==="BTCUSDT"');expect(page.locator('#v75AnalysisIdentity')).to_have_attribute('data-historical','true');assert 'EURUSD' in page.locator('#v75AnalysisIdentity').text_content();assert page.evaluate('saveJournal()')==False;assert page.evaluate('getJournal()[0].identity')==origin['identity']
 go('trading');expect(page.locator('#proSelectedContext')).to_contain_text('NOT NATIVE USDT')
 go('markets');page.locator('#r66Search').fill('BTCUSDT');expect(page.locator('#r66Markets')).to_contain_text('NOT native USDT')
 # F05 F13: independent manual chart clearly separated; healthy status is a disclosure.
 page.route(EMBED_URL,lambda route:route.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY));go('trading');page.locator('#proTradingViewMode').click();page.wait_for_function('window.__widgets?.length');expect(page.locator('#proTVIndependent')).to_be_visible();assert not page.locator('.pro-tv-recovery').get_attribute('open');expect(page.locator('#proEvidenceTitle')).to_contain_text('Pinned THN');assert page.evaluate('THNTradingViewStatus().candleReady')==False
 page.locator('#proResearchMode').click()
 # F07/F08: genuine server validation, prior estimates disappear; budget labels separate.
 page.evaluate('THNContext.set({symbol:"EURUSD",interval:"1h"})');page.wait_for_function('THNDecision.brief()?.symbol==="EURUSD"');go('risk')
 page.locator('#planSymbol').select_option('EURUSD');page.locator('#planSide').select_option('BUY')
 for sel,value in [('planCapital','10000'),('planRisk','.5'),('planEntry','1.1'),('planStop','1.095'),('planTarget','1.11'),('qRisk_spread','1'),('qRisk_slippage','1'),('qRisk_commission','1')]:
  control(page,'#'+sel).fill(value)
 page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()');assert page.evaluate('THNDecision.plan().budgetCompliant')==False;expect(page.locator('#decisionPlans')).to_contain_text('OVER BUDGET');expect(page.locator('#evoPlanStatus')).to_contain_text('OVER BUDGET')
 page.locator('#planStop').fill('1.11');expect(page.locator('#planResult')).to_have_attribute('data-state','stale');assert page.evaluate('THNDecision.plan()') is None;expect(page.locator('#qRiskCost')).to_contain_text('No current estimate')
 page.locator('#workRiskForm button[type=submit]').click();expect(page.locator('#planResult')).to_have_attribute('data-state','rejected');expect(page.locator('#planResult')).to_contain_text('BUY stop must be below entry');assert 'USDT' not in page.locator('#planResult').text_content()
 page.locator('.terminal-topbar [data-language=ar]').click();expect(page.locator('#planResult')).to_contain_text('وقف الشراء');page.locator('.terminal-topbar [data-language=en]').click();expect(page.locator('#planResult')).to_contain_text('BUY stop')
 page.locator('#planStop').fill('1.095');page.locator('#v75CostInclusive').check();page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()?.budgetCompliant===true');assert page.evaluate('THNDecision.plan().plannedStopLossWithCosts<=THNDecision.plan().budget');assert page.evaluate('THNDecision.plan().executionAuthorized')==False
 # A→B→A request ordering: a real older response must not replace a newer matching ticker.
 held=[]
 def hold_analysis(route):held.append((route,route.fetch()))
 page.route('**/api/analyze',hold_analysis);page.evaluate('document.getElementById("riskPct").value="0.5";window.__oldAnalysisDone=false;void analyze().finally(()=>window.__oldAnalysisDone=true)');page.wait_for_function('document.getElementById("analyzeBtn").disabled')
 # Poll browser event dispatch via bounded condition, not an arbitrary timing delay.
 from time import monotonic
 until=monotonic()+10
 while len(held)<1 and monotonic()<until:page.wait_for_function('document.getElementById("analyzeBtn").disabled')
 assert len(held)==1
 page.locator('.terminal-topbar [data-language=ar]').click();assert any('\u0600'<=c<='\u06ff' for c in page.locator('#statusMsg').text_content());assert page.locator('#analyzeBtn').is_disabled();page.locator('.terminal-topbar [data-language=en]').click();expect(page.locator('#statusMsg')).to_contain_text('EURUSD')
 page.evaluate('THNContext.set({symbol:"GBPUSD"});THNContext.set({symbol:"EURUSD"});document.getElementById("riskPct").value="0.7";void analyze()')
 until=monotonic()+10
 while len(held)<2 and monotonic()<until:page.wait_for_function('document.getElementById("analyzeBtn").disabled')
 assert len(held)==2;held[1][0].fulfill(response=held[1][1]);page.wait_for_function('currentAnalysis?.risk.riskPct===0.7&&!document.getElementById("analyzeBtn").disabled');held[0][0].fulfill(response=held[0][1]);page.wait_for_function('window.__oldAnalysisDone===true');page.wait_for_function('THNDecision.brief()?.symbol==="EURUSD"');assert page.evaluate('currentAnalysis.risk.riskPct')==.7;results['asyncOrdering']={'oldResponseRiskPct':held[0][1].json()['risk']['riskPct'],'newResponseRiskPct':held[1][1].json()['risk']['riskPct'],'retainedRiskPct':page.evaluate('currentAnalysis.risk.riskPct')};page.unroute('**/api/analyze',hold_analysis)
 # F11: source-aware deterministic answer, no generative inference.
 go('ai');page.evaluate('THNIntelligence.ask("Explain provider mapping and indicator methodology")');page.wait_for_function('THNIntelligence.result()?.roles.some(r=>r.supporting.some(s=>s.includes("Wilder")))');assert page.evaluate('THNIntelligence.result().modelCalls')==0
 # F15: original version and exact hash survive report codec.
 page.wait_for_function('THNDecision.brief()?.selected?.provenance.hash===THNContext.get().datasetId');report=page.evaluate('THNDecision.snapshot()');assert report['applicationVersion']=='7.5.0';assert report['schemaVersion']=='THN-DECISION-6.4';assert report['analysisEngineVersion'];assert report['identity']['providerInstrument']=='EURUSD=X'
 results['journeys']=['F01 grounded narratives','F02 immutable historical record','F03 unavailable execution disabled','F04 USDT proxy disclosure','F05 independent TradingView','F06 route restoration','F07 direction/stale errors','F08 cost-inclusive compliance','F10 explicit smoothing distinction','F11 provenance assistant','F12 live language errors','F13 compact recovery','F15 versioned export']
 for language in ['en','ar']:
  page.locator('.terminal-topbar [data-language='+language+']').click()
  for width in [1440,390]:
   page.set_viewport_size({'width':width,'height':1000})
   for view in ['trading','risk','ai','journal']:
    go(view);page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/(view+'-'+language+'-'+str(width)+'.png')),full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(view,language,width)
    page.add_script_tag(path=os.environ['AXE_PATH']);violations=page.evaluate('async()=> (await axe.run(document.querySelector("#view-'+view+'"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))');assert not violations,(view,language,width,violations);results['axe'].append({'view':view,'language':language,'width':width,'violations':0})
 assert not results['errors'],results['errors'];b.close()
(out/'consistency.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
