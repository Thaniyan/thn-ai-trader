"""Connected user journeys over real application APIs and explicit offline provider fixtures."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright,expect
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY
out=pathlib.Path(os.environ.get('EVOLUTION_OUTPUT','work/evolution'));out.mkdir(parents=True,exist_ok=True)
result={'journeys':[],'geometry':[],'accessibility':[],'errors':[],'network':'Deterministic provider fixtures. No real TradingView candle claim.'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:result['errors'].append(str(e)))
 page.route(EMBED_URL,lambda r:r.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNEvolution&&THNDecision.brief()&&THNResearch.series()&&THNServiceHealth.get()')
 def go(v):
  page.locator('.nav-stack [data-view="'+v+'"]').click();expect(page.locator('#view-'+v)).to_be_visible()
  page.evaluate('async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().endTime!==Infinity).map(a=>a.finished.catch(()=>{})))}')
 def analyze():
  go('trading')
  with page.expect_response(lambda r:r.url.endswith('/api/analyze') and r.request.method=='POST') as response:page.locator('#proAnalyzeContext').click()
  assert response.value.status==200
  page.wait_for_function('THNEvolution.analysisReady()&&!document.getElementById("proAnalyzeContext").disabled')
  assert page.evaluate('currentAnalysis.symbol')==page.evaluate('THNContext.get().symbol')
 # A: Discover -> existing context -> provider provenance -> chart -> genuine deterministic analysis.
 page.locator('#evoDashboard [data-evo="go:markets"]').click();page.locator('#r66Search').fill('GBPUSD');page.locator('[data-evo-symbol="GBPUSD"][data-evo-view="ai"]').click()
 page.wait_for_function('THNContext.get().symbol==="GBPUSD"&&THNDecision.brief()?.symbol==="GBPUSD"&&THNResearch.series()?.symbol==="GBPUSD"')
 expect(page.locator('#evoContext')).to_contain_text('Yahoo Finance')
 page.locator('#evoIntelligence [data-evo="chart"]').click();expect(page.locator('#qCandles')).to_be_visible();analyze()
 expect(page.locator('#evoIntelligence')).to_contain_text('Counter-evidence');expect(page.locator('#evoIntelligence')).to_contain_text('Invalidation')
 # Stale analysis is not allowed to save another instrument or timeframe.
 before=page.evaluate('JSON.stringify(getJournal())');page.evaluate('THNContext.set({symbol:"EURUSD",interval:"1h"},"journey")')
 assert page.evaluate('saveJournal()') is False and page.evaluate('JSON.stringify(getJournal())')==before
 page.wait_for_function('THNDecision.brief()?.symbol==="EURUSD"&&THNResearch.series()?.symbol==="EURUSD"');analyze()
 result['journeys'].append('A: Dashboard -> GBPUSD discovery -> matching provider evidence -> chart -> HTTP analysis; stale GBPUSD cannot save as EURUSD')
 # B: Explicit assumptions -> authoritative plan HTTP -> evidence-bound Library snapshot.
 go('risk')
 for k,v in {'planCapital':'10000','planRisk':'1','planEntry':'1.1','planStop':'1.09','planTarget':'1.12','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+k).fill(v)
 page.locator('#planSide').select_option('BUY')
 with page.expect_response(lambda r:'/api/research/plan' in r.url and r.request.method=='POST') as response:page.locator('#workRiskForm button[type="submit"]').click()
 assert response.value.status==200
 page.wait_for_function('THNDecision.plan()!==null');assert page.evaluate('THNDecision.plan().budget')==100
 expect(page.locator('#evoRisk [data-evo="save-plan"]')).to_be_enabled();page.locator('#evoRisk [data-evo="save-plan"]').click()
 page.wait_for_function('THNLibrary.records().length===1');assert page.evaluate('THNLibrary.records()[0].plan.symbol')=='EURUSD';assert page.evaluate('getJournal().length')==0
 page.screenshot(path=str(out/'fixture-risk-to-library.png'),animations='disabled')
 result['journeys'].append('B: Explicit USD capital/entry/stop/target/costs -> validated hypothetical plan -> matching evidence-bound Library report; no executed record')
 # C: Save, immediate display, original inspection, reload and safe export.
 go('journal');expect(page.locator('#evoJournal [data-evo="save-idea"]')).to_be_enabled();page.locator('#evoJournal [data-evo="save-idea"]').click()
 expect(page.locator('#proRecords').get_by_text('EURUSD · Research idea',exact=True)).to_be_visible()
 page.locator('#proRecords').get_by_role('button',name='Inspect original record',exact=True).first.click();expect(page.locator('#proRecordDetail')).to_contain_text('research_idea')
 assert page.evaluate('THNRecords.select(getJournal()).length')==0
 page.reload();page.wait_for_function('window.THNEvolution');go('journal');expect(page.locator('#proRecords').get_by_text('EURUSD · Research idea',exact=True)).to_be_visible()
 with page.expect_download() as download:page.locator('#evoJournal [data-evo="export-json"]').click()
 payload=json.loads(pathlib.Path(download.value.path()).read_text());assert payload['schema']=='THN-RECORDS-1' and payload['records'][0]['kind']=='research_idea' and 'pnl' not in payload['records'][0]
 assert page.evaluate('THNLibrary.records().length')==1
 page.screenshot(path=str(out/'fixture-persisted-journal.png'),animations='disabled')
 result['journeys'].append('C: Genuine idea -> synchronous record -> original JSON inspection -> reload persistence -> unchanged JSON export and Library compatibility')
 # D: Official embed protocol in a real browser, never proof of real market candles.
 go('trading');page.locator('#proTradingViewMode').click();page.wait_for_function('THNTradingViewStatus().iframeLoaded&&THNTradingViewStatus().scriptLoaded')
 parent=page.locator('#tvChart .tradingview-widget-container').get_attribute('id');go('dashboard');go('trading');assert page.locator('#tvChart .tradingview-widget-container').get_attribute('id')==parent
 assert not page.evaluate('THNTradingViewStatus().candleReady');page.locator('#proTVFallback').click();expect(page.locator('#qCandles')).to_be_visible()
 result['journeys'].append('D: Direct Trading, official protocol frame, unchanged generation on revisit, honest unverified candles and THN fallback')
 # Defaults use original context preferences, never a second state store.
 go('settings');page.locator('#evoDefaultSymbol').fill('GBPUSD');page.locator('#evoDefaultInterval').select_option('15m');page.locator('#evoDefaultForm button[type="submit"]').click();page.wait_for_function('THNContext.get().symbol==="GBPUSD"&&THNContext.get().interval==="15m"')
 page.reload();page.wait_for_function('window.THNEvolution');assert page.evaluate('THNContext.get().symbol')=='GBPUSD';assert page.evaluate('THNContext.get().interval')=='15m';assert page.evaluate('getJournal().length')==1
 # Runtime flags and release use the package as single source of product version.
 health=page.request.get(os.environ['TEST_URL']+'/api/health').json();assert health['version']==json.loads(pathlib.Path('package.json').read_text())['version'];assert not health['openaiEnabled'] and not health['capabilities']['paperExecution'] and not health['capabilities']['liveTrading']
 assert page.request.get(os.environ['TEST_URL']+'/brand-mark.png').status==200
 result['journeys'].append('Settings: explicit context retained across reload, original records unchanged; version matches package and hosted safety flags stay disabled')
 # A burst of metadata notifications schedules bounded UI work, without provider calls.
 requests=[];page.on('request',lambda r:requests.append(r.url))
 page.wait_for_function('THNResearch.series()?.symbol===THNContext.get().symbol&&THNResearch.series()?.provenance.interval===THNContext.get().interval&&THNDecision.brief()?.symbol===THNContext.get().symbol&&!document.getElementById("analyzeBtn").disabled')
 measure=page.evaluate('''async()=>{await new Promise(requestAnimationFrame);const n=THNEvolution.renderCount();for(let i=0;i<40;i++)window.dispatchEvent(new Event('thn:research-context'));await new Promise(requestAnimationFrame);return THNEvolution.renderCount()-n}''');assert measure<=2,measure
 result['coalescedRenders']=measure
 # E: EN/AR, LTR/RTL, mobile/tablet/desktop, both themes; new surfaces and shared controls.
 page.add_script_tag(content=pathlib.Path(os.environ['AXE_PATH']).read_text())
 for width,lang,theme in itertools.product([1440,768,390],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   go(view)
   issues=page.evaluate('''()=>{const visible=e=>e.getClientRects().length>0;let issues=[];if(document.documentElement.scrollWidth>innerWidth+1)issues.push('page overflow');for(const q of ['.evo-command-grid','.evo-metrics','.evo-evidence-grid','.evo-settings-grid','.evo-capabilities','.evo-scenarios'])for(const parent of document.querySelectorAll(q)){if(!visible(parent))continue;const nodes=[...parent.children].filter(visible);for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i].getBoundingClientRect(),b=nodes[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push(q+' overlap');}}return issues}''');result['geometry'].append({'view':view,'width':width,'lang':lang,'theme':theme,'issues':issues});assert not issues, result['geometry'][-1]
   violations=page.evaluate("""async()=> (await axe.run(document.querySelector('.app-view.view-active'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))""");result['accessibility'].append({'view':view,'width':width,'lang':lang,'theme':theme,'violations':violations});(out/'results.json').write_text(json.dumps(result,indent=2));assert not violations,result['accessibility'][-1]
 assert not result['errors'],result['errors'];b.close()
(out/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps({'journeys':result['journeys'],'geometry':len(result['geometry']),'axeScans':len(result['accessibility']),'errors':result['errors'],'coalescedRenders':result['coalescedRenders']}))
