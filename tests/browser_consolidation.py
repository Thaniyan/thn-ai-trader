from workspace_controls import control
"""v7.3 user acceptance over packaged APIs, explicit provider and public-widget protocol fixtures."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright,expect
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY
out=pathlib.Path('work/consolidation');out.mkdir(parents=True,exist_ok=True)
result={'journeys':[],'geometry':[],'accessibility':[],'errors':[],'network':'Offline provider/widget fixtures; not external TradingView candle evidence'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:result['errors'].append(str(e)))
 page.route(EMBED_URL,lambda r:r.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNEvolution&&THNResearch.series()&&THNDecision.brief()&&THNServiceHealth.get()')
 def go(v):
  page.locator('.nav-stack [data-view="'+v+'"]').click();expect(page.locator('#view-'+v)).to_be_visible();page.wait_for_function('()=>!document.querySelector(".app-view.view-active").getAnimations({subtree:true}).some(a=>a.playState==="running"&&a.effect?.getComputedTiming().endTime!==Infinity&&a.effect?.target?.getClientRects().length)',timeout=10000)
 def ready(symbol='EURUSD',interval='1h'):
  page.wait_for_function('(c)=>THNResearch.series()?.symbol===c[0]&&THNResearch.series()?.provenance.interval===c[1]&&THNDecision.brief()?.symbol===c[0]&&THNDecision.brief()?.interval===c[1]',arg=[symbol,interval])
 def analyze():
  go('trading')
  with page.expect_response(lambda r:r.url.endswith('/api/analyze') and r.request.method=='POST') as response:page.locator('#proAnalyzeContext').click()
  assert response.value.status==200
  page.wait_for_function('THNEvolution.analysisReady()');go('trading');expect(page.locator('#proSaveIdea')).to_be_enabled()
 # A: normal discovery and observation, using the real provider-backed application path.
 go('markets');page.locator('#r66Search').fill('EURUSD');page.locator('#proObserve').click();page.wait_for_function('!THNMarketObservations.busy()');expect(page.locator('#r66Markets')).to_contain_text('Yahoo')
 page.locator('[data-r66-chart="EURUSD"]').click();ready();expect(page.locator('#qCandles')).to_be_visible()
 assert page.locator('#evoFlow').count()==1 and page.locator('.q-context-actions').count()==1
 assert page.locator('#evoFlow [data-evo]').count()==0
 assert page.locator('.pro-chart-area .q-chart-panel').count()==1 and page.locator('#proTerminal .pro-research-rail').count()==1
 expect(page.locator('#proTradingArchive')).to_be_visible();assert page.locator('#proTradingArchive').get_attribute('open') is None
 result['journeys'].append('A: discovery -> explicit observation -> selected chart; one toolbar and terminal owner')
 # B: actual analysis HTTP response, current numerical observations and one canonical scenario surface.
 analyze();expect(page.locator('#proTechnicalEvidence')).not_to_contain_text('—');page.locator('#proEvidenceLink').click();expect(page.locator('#evoIntelligence')).to_contain_text('Counter-evidence');assert page.locator('#evoIntelligence [data-brief-plan]').count()==0
 assert page.locator('#decisionWorkspace .d64-scenarios').count()==1
 result['journeys'].append('B: HTTP analysis -> current technical evidence -> Intelligence; canonical scenario owner')
 # C: original position calculator and matched report, never an execution record.
 go('risk')
 for k,v in {'planCapital':'10000','planRisk':'1','planEntry':'1.1','planStop':'1.09','planTarget':'1.12','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+k).fill(v)
 page.locator('#planSide').select_option('BUY')
 with page.expect_response(lambda r:r.url.endswith('/api/research/plan') and r.request.method=='POST') as response:page.locator('#workRiskForm button[type="submit"]').click()
 assert response.value.status==200;page.wait_for_function('THNDecision.plan()?.budget===100');page.locator('#evoRisk [data-evo="save-plan"]').click();page.wait_for_function('THNLibrary.records().length===1')
 original=page.evaluate('JSON.stringify(THNLibrary.records())');page.locator('[data-lib-open]').first.click();expect(page.locator('#d64ReportReader')).to_contain_text('never replaces this saved evidence')
 page.screenshot(path=str(out/'populated-library.png'),animations='disabled')
 page.evaluate('THNContext.set({symbol:"GBPUSD",interval:"15m"},"acceptance")');ready('GBPUSD','15m');go('journal');page.locator('[data-lib-open]').first.click();page.locator('[data-lib-context]').click();ready();assert page.evaluate('JSON.stringify(THNLibrary.records())')==original
 result['journeys'].append('C: validated USD100 risk plan -> matched Library -> current research navigation; original evidence unchanged')
 # D: terminal idea save, synchronous record, current-instrument filter, reload and original inspection.
 analyze();page.locator('#proSaveIdea').click();expect(page.locator('#proRecords')).to_contain_text('EURUSD · Research idea');assert page.evaluate('THNRecords.select(getJournal()).length')==0
 page.locator('#proRecordContext').click();expect(page.locator('#proRecordCount')).to_contain_text('1 / 1')
 held=[]
 def hold_analysis(route):held.append(route)
 page.route('**/api/analyze',hold_analysis)
 with page.expect_request(lambda r:r.url.endswith('/api/analyze')):page.reload();page.wait_for_function('window.THNEvolution')
 go('journal');expect(page.locator('#proRecords')).to_contain_text('EURUSD · Research idea');page.locator('#proRecords').get_by_role('button',name='Inspect original record',exact=True).first.click();expect(page.locator('#proRecordDetail')).to_contain_text('research_idea')
 go('trading');expect(page.locator('#proSaveIdea')).to_be_disabled();assert page.evaluate('saveJournal()') is False
 page.unroute('**/api/analyze',hold_analysis)
 for route in held:route.continue_()
 page.wait_for_function('THNEvolution.analysisReady()');expect(page.locator('#proSaveIdea')).to_be_enabled()
 result['journeys'].append('D: terminal save -> immediate idea -> filter -> reload -> original inspection; premature saves rejected')
 # E: observable widget phases; no private API or fake candle readiness.
 page.locator('#proTradingViewMode').click();page.wait_for_function('THNTradingViewStatus().iframeLoaded&&THNTradingViewStatus().scriptLoaded')
 metrics=page.evaluate('THNTradingViewMetrics()');assert metrics['scriptMs']>=0 and metrics['frameMs']>=0
 expect(page.locator('#proTVMetrics')).to_contain_text('unverified');gen=metrics['generation'];go('markets');go('trading');assert page.evaluate('THNTradingViewMetrics().generation')==gen
 page.evaluate('THNContext.set({analysisTimestamp:Date.now()},"metadata")');assert page.evaluate('THNTradingViewMetrics().generation')==gen
 assert page.evaluate('THNTradingViewStatus().candleReady') is False
 control(page,'#proTVFallback').click();expect(page.locator('#qCandles')).to_be_visible();result['widget']=metrics
 result['journeys'].append('E: measured script/frame phases; widget reused on revisits/metadata; unverified candles and real THN fallback')
 # F: working sizing preferences use the existing setup store; storage refusal stays honest.
 go('settings');page.locator('#prefDefaultRisk').select_option('0.5');page.locator('#prefDefaultRR').select_option('3.0');page.locator('#evoApplySizing').click();expect(page.locator('#evoSizingStatus')).to_contain_text('saved');assert page.locator('#planRisk').input_value()=='0.5'
 page.reload();page.wait_for_function('window.THNEvolution');go('settings');assert page.locator('#prefDefaultRisk').input_value()=='0.5' and page.locator('#prefDefaultRR').input_value()=='3.0';assert page.locator('#planRisk').input_value()=='0.5'
 assert page.locator('#prefDefaultTf').count()==0 and page.locator('#prefThemeToggleBtn').count()==0
 before=page.evaluate('JSON.stringify(getJournal())');page.evaluate('()=>{window.oldStorageWrite=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error("fixture quota")};}');page.locator('#evoApplySizing').click();expect(page.locator('#evoSizingStatus')).to_contain_text('this page only');assert page.evaluate('JSON.stringify(getJournal())')==before;page.evaluate('()=>{Storage.prototype.setItem=window.oldStorageWrite;}')
 result['journeys'].append('F: sizing setup persists across reload; storage refusal explicit; records preserved')
 page.add_script_tag(content=pathlib.Path(os.environ['AXE_PATH']).read_text())
 for width,lang,theme in itertools.product([1440,1024,768,390,320],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme);go('trading');page.evaluate('scrollTo(0,0)')
  geometry=page.evaluate('''()=>{const c=document.querySelector('.q-canvas-shell').getBoundingClientRect(),labels=THNResearch.chart.timeLabels||[];return {chartTop:c.top,chartWidth:c.width,overflow:document.documentElement.scrollWidth>innerWidth+1,axisOverlap:labels.some((a,i)=>labels.some((b,j)=>i<j&&a.x<b.x+b.width&&a.x+a.width>b.x)),labels:labels.length}}''');result['geometry'].append({'width':width,'lang':lang,'theme':theme,**geometry});assert not geometry['overflow'] and not geometry['axisOverlap'] and geometry['labels']>=2
  violations=page.evaluate("async()=> (await axe.run(document.querySelector('#view-trading'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))");result['accessibility'].append({'width':width,'lang':lang,'theme':theme,'violations':violations});(out/'results.json').write_text(json.dumps(result,indent=2));assert not violations,result['accessibility'][-1]
 assert not result['errors'],result['errors'];b.close()
(out/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps({'journeys':result['journeys'],'geometry':len(result['geometry']),'accessibility':len(result['accessibility']),'errors':result['errors']}))
