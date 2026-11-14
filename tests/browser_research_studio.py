"""Real integrated controls; fixture data never authorize execution or model claims."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright,expect
from workspace_controls import control
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/studio'));out.mkdir(parents=True,exist_ok=True)
results={'checks':[],'profiles':[],'errors':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);results['browserVersion']=b.version;page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:results['errors'].append(str(e)));requests=[];page.on('request',lambda r:requests.append((r.method,r.url)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('THNStudio&&THNResearch.series()&&THNDecision.brief()?.selected');chart_id=page.evaluate('()=>{window.__studioChart=THNResearch.chart;return THNResearch.series().provenance.hash;}')
 def go(view):page.locator('.nav-stack [data-view='+view+']').click()
 def action(name):return page.locator('[data-studio="'+name+'"]:visible')
 page.locator('#workspaceMarketSearch').click();page.locator('#workspaceMarketQuery').fill('EURUSD');page.locator('[data-workspace-symbol=EURUSD]').click();page.wait_for_function('THNConfidence.review().analysis?.symbol==="EURUSD"&&!document.getElementById("analyzeBtn").disabled')
 assert len([r for r in requests if '/api/research/series?' in r[1]])==1,'Selected history has one authoritative request, not legacy-panel duplicates'
 # Original single chart, exact data and bounded navigation; none issues a provider/model request.
 go('trading');before=len(requests);action('range:60').click();assert page.evaluate('THNResearch.chart.visible.length')==60
 page.locator('#studioHistoryRange').fill('30');page.locator('#studioHistoryRange').dispatch_event('input');assert page.evaluate('THNResearch.chart.offset')==30
 box=page.locator('#qCandles').bounding_box();page.mouse.move(box['x']+box['width']*.5,box['y']+100);page.mouse.down();page.mouse.move(box['x']+box['width']*.5+60,box['y']+100,steps=5);page.mouse.up();assert not page.locator('#studioInspector').evaluate('(e)=>e.open'),'Dragging the chart is not a candle-inspection click'
 page.locator('#studioInspector > summary').click();expect(page.locator('#studioChartDate')).to_be_visible();page.locator('#studioInspector > summary').focus();page.keyboard.press('Space');expect(page.locator('#studioChartDate')).not_to_be_visible();page.keyboard.press('Enter');expect(page.locator('#studioChartDate')).to_be_visible()
 time=page.evaluate('new Date(THNResearch.series().candles[100].time).toISOString().slice(0,16)');page.locator('#studioChartDate').fill(time);page.locator('#studioJump').click();expect(page.locator('#studioChartStatus')).to_contain_text('Nearest recorded closed bar')
 page.locator('#studioInspector').scroll_into_view_if_needed();page.screenshot(path=str(out/'studio-inspector.png'),animations='disabled')
 expected=page.evaluate('new Intl.NumberFormat("en-US",{maximumFractionDigits:6}).format(THNResearch.series().candles[100].close)');expect(page.locator('#studioBarValues')).to_contain_text(expected)
 action('bar:next').click();expect(page.locator('#studioBarValues')).to_contain_text(page.evaluate('new Intl.NumberFormat("en-US",{maximumFractionDigits:6}).format(THNResearch.series().candles[101].close)'))
 page.locator('#studioChartDate').fill('2000-01-01T00:00');page.locator('#studioJump').click();expect(page.locator('#studioChartStatus')).to_contain_text('within the loaded closed-bar history');assert not [r for r in requests[before:] if r[0]=='POST' or '/api/research/series?' in r[1]],requests[before:]
 results['checks'].append('Chart UTC navigation, bounded range/history, original OHLC/indicators, no provider/model requests')
 # Explicit legacy refresh still refreshes the authoritative series once.
 go('dashboard');page.locator('#m65DashboardDetails > summary').click();before_refresh=len([r for r in requests if '/api/research/series?' in r[1]]);control(page,'#workRefresh').click();page.wait_for_function('THNResearch.series()&&!document.getElementById("qRefresh").disabled&&!document.getElementById("workRefresh").disabled');assert len([r for r in requests if '/api/research/series?' in r[1]])==before_refresh+1;assert page.locator('#focusPrice').inner_text()!='—'
 results['checks'].append('One selected-history request, shared legacy focus and one explicit authoritative refresh')
 # Citation is an explicit append to a draft, deduplicated; originals stay immutable.
 go('ai');control(page,'#d64Thesis').fill('My original thesis');first=page.locator('#studioEvidence [data-studio="cite:1h"]');expect(first).to_have_count(1);first.click();note=page.locator('#d64Thesis').input_value();assert note.startswith('My original thesis\n') and 'SHA256 ' in note;first.click();expect(page.locator('#d64Thesis')).to_have_value(note)
 action('evidence:bearish').click();expect(action('evidence:bearish')).to_be_focused();expect(page.locator('#studioEvidence article')).to_have_count(len(page.evaluate('THNDecision.brief().frames.filter(f=>f.trend==="bearish")')));action('evidence:all').click()
 page.locator('#studioEvidence').screenshot(path=str(out/'studio-evidence.png'),animations='disabled');results['checks'].append('Source-linked evidence filters and append-only draft citations')
 before_assistant=len(requests);action('assistant').click();expect(page.locator('#i7Question')).to_be_focused();expect(page.locator('#i7Question')).to_have_value('Explain the opposing timeframe evidence and the limitations of these observations');assert not [r for r in requests[before_assistant:] if r[0]=='POST' and '/api/intelligence' in r[1]]
 # Reuse the authoritative chronological engine and compare a fresh unsaved case.
 go('portfolio');page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluation()&&!THNResearch.evaluationState().busy');expect(page.locator('#studioLabReport')).to_contain_text('Inspect the historical evidence')
 values=page.evaluate('(()=>{let e=THNResearch.evaluation();return [e.development.metrics.returnPct,e.holdout.metrics.returnPct].map(v=>new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(v)+"%");})()')
 for v in values:expect(page.locator('#studioLabReport')).to_contain_text(v)
 assert page.locator('#studioLabReport .studio-folds article').count()==len(page.evaluate('THNResearch.evaluation().walkForward.folds'))
 action('validation').click();expect(page.locator('#confidenceTestTitle')).to_be_focused();assert page.locator('#studioValidationAudit').evaluate('(e)=>e.open');expect(page.locator('#confidenceValidation .confidence-checks > li')).to_have_count(10)
 action('save-research').click();page.wait_for_function('THNLibrary.entries().length===1');saved=page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)');report_id=page.evaluate('THNLibrary.entries()[0].id')
 go('portfolio');page.locator('#studioCompareCase').select_option(report_id);action('compare-live').click();expect(page.locator('#studioCompareResult')).to_contain_text('Current unsaved research');assert page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')==saved;page.locator('#studioCompareResult').scroll_into_view_if_needed();page.screenshot(path=str(out/'studio-current-saved-comparison.png'),animations='disabled')
 page.locator('#qParam_fast').fill('13');expect(page.locator('#studioLabReport')).to_contain_text('not current validation');expect(action('compare-live')).to_be_disabled();expect(page.locator('#studioCompareResult')).to_be_empty();assert page.evaluate('THNStudio.state().validation') is False
 page.locator('#qRun').click();page.wait_for_function('!THNResearch.evaluationState().busy&&!THNResearch.evaluationState().dirty');page.locator('#studioCompareCase').select_option(report_id);action('compare-live').click();expect(page.locator('#studioCompareResult')).to_contain_text('Current unsaved research');expect(page.locator('#studioCompareResult')).to_contain_text('parameters changed yes');page.locator('#studioCompareResult').screenshot(path=str(out/'studio-current-saved-comparison.png'),animations='disabled')
 results['checks'].append('Exact development/holdout/fold values, original ten checks, current-to-saved comparison, stale-input invalidation and immutable original')
 # Legacy/incomplete and imported reports remain visibly unverified, without reconstructed metrics.
 page.evaluate('()=>{let r=structuredClone(THNLibrary.entries()[0].record);r.id=crypto.randomUUID();r.quantitative=null;r.imported=true;r.unverified=true;r.user.thesis="Imported incomplete case";if(!THNLibrary.save(r))throw Error("Fixture save refused");}')
 go('journal');ids=page.evaluate('THNLibrary.entries().map(v=>v.id)');assert len(ids)==2;
 for ident in ids:page.locator('[data-lib-select="'+ident+'"]').check()
 assert page.evaluate('THNLibrary.select(["not-a-report"])') is False;assert page.evaluate('THNLibrary.selected().length')==2;action('compare-saved').click();expect(page.locator('#l65Comparison')).to_contain_text('Quantitative comparison workstation');expect(page.locator('.l65-record').filter(has=page.locator('[data-lib-select="'+ids[1]+'"]')).locator('.studio-case-metrics')).to_contain_text('Unavailable')
 page.locator('[data-lib-replay="'+report_id+'"]').click();expect(page.locator('#r66Replay')).to_be_focused();expect(page.locator('#r66Replay')).to_contain_text('Exact candles were not retained');action('retain').click();page.wait_for_function('THNLibrary.state().snapshots.length===1');page.locator('[data-lib-replay="'+report_id+'"]').click();expect(page.locator('#r66Replay')).to_contain_text('Verify & reproduce evaluation');page.locator('[data-r66-replay]').click();page.wait_for_function('(id)=>THNLibrary.entries().find(e=>e.id===id)?.reproduction?.status==="reproduced"',arg=report_id)
 assert page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')==saved;page.locator('#r66Replay').screenshot(path=str(out/'studio-numerical-replay.png'),animations='disabled')
 results['checks'].append('Unverified/incomplete comparison, missing snapshot disclosure, explicit retention, source/replay navigation and actual numerical reproduction')
 # Risk path uses original validator; the read-only workflow never becomes execution approval.
 go('portfolio');action('risk').click();expect(page.locator('#studioRiskContext')).to_be_visible()
 for key,value in {'planCapital':'10000','planRisk':'1','planEntry':'1.1','planStop':'1.09','planTarget':'1.12','planLeverage':'100'}.items():page.locator('#'+key).fill(value)
 page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()?.inputValid');assert page.evaluate('THNStudio.state().planning') is True;assert page.evaluate('THNStudio.state().executionAuthorized') is False
 page.locator('#planEntry').fill('');assert page.evaluate('THNDecision.plan()') is None;assert page.evaluate('THNStudio.state().planning') is False
 results['checks'].append('Historical-to-hypothetical planner continuity, empty-input invalidation and unavailable execution')
 # Context changes immediately invalidate current comparison and preserve notes/retained reports.
 go('portfolio');page.locator('#qSymbol').fill('GBPUSD');page.locator('#qSymbol').press('Tab');page.wait_for_function('THNResearch.series()?.symbol==="GBPUSD"');assert page.evaluate('THNStudio.state().validation') is False;assert page.evaluate('THNStudio.state().planning') is False
 go('ai');expect(control(page,'#d64Thesis')).to_have_value(note);assert page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')==saved
 # A late evaluator response is never promoted after a market change.
 go('portfolio');retained=page.evaluate('JSON.stringify(THNResearch.evaluation())');held=[];page.route('**/api/research/evaluate',lambda route:held.append(route));page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluationState().busy');assert len(held)==1
 with page.expect_event('requestfailed',predicate=lambda request:'/api/research/evaluate' in request.url) as cancelled:
  page.locator('#qSymbol').fill('EURUSD');page.locator('#qSymbol').press('Tab')
 assert 'ERR_ABORTED' in cancelled.value.failure;page.wait_for_function('THNResearch.series()?.symbol==="EURUSD"');response=held[0].fetch();assert response.json()['symbol']=='GBPUSD';held[0].fulfill(response=response)
 page.unroute('**/api/research/evaluate');page.evaluate('()=>new Promise(requestAnimationFrame)');assert page.evaluate('JSON.stringify(THNResearch.evaluation())')==retained;assert page.evaluate('THNResearch.evaluation().symbol')=='EURUSD'

 results['checks'].append('Late old-market evaluation cannot become current validation in the unified summary')
 # All views, EN/AR, themes, RTL and reduced motion, with meaningful chart space and WCAG controls.
 page.add_script_tag(path=os.environ['AXE_PATH']);page.emulate_media(reduced_motion='reduce')
 for width,lang,theme in itertools.product([1440,768,390,320],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click()
  if page.locator('html').get_attribute('data-theme')!=theme:page.locator('#themeBtn').click()
  for view in ['dashboard','markets','trading','ai','portfolio','journal','risk','brokers','settings']:
   go(view);assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),(width,lang,theme,view)
  go('trading');assert page.locator('#qCandles').bounding_box()['width']>=max(200,width*.35);assert page.evaluate('THNResearch.chart===window.__studioChart')
  if width in [1440,390] and (lang,theme) in [('en','dark'),('ar','light')]:
   for view,selector in [('trading','#studioChartTools'),('trading','#studioInspector'),('ai','#studioJourney'),('ai','#studioEvidence'),('portfolio','#studioLab'),('journal','#studioArchive'),('risk','#studioRiskContext')]:
    go(view);violations=page.evaluate('''async(selector)=>(await axe.run(document.querySelector(selector),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))''',selector);assert not violations,(width,lang,theme,view,violations)
  results['profiles'].append([width,lang,theme])
 # Cross-instrument comparisons disclose incompatibility; unavailable briefs never invent evidence.
 page.locator('.terminal-topbar [data-language=en]').click();go('portfolio');page.locator('#qSymbol').fill('GBPUSD');page.locator('#qSymbol').press('Tab');page.wait_for_function('THNResearch.series()?.symbol==="GBPUSD"&&THNDecision.brief()?.symbol==="GBPUSD"');page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluation()?.symbol==="GBPUSD"&&!THNResearch.evaluationState().busy');page.locator('#studioCompareCase').select_option(report_id);action('compare-live').click();expect(page.locator('#studioCompareResult')).to_contain_text('Different instruments')
 page.route('**/api/research/brief?**',lambda route:route.fulfill(status=503,content_type='application/json',body='{"ok":false,"code":"MARKET_DATA_UNAVAILABLE"}'));page.locator('#qSymbol').fill('EURUSD');page.locator('#qSymbol').press('Tab');page.wait_for_function('THNDecision.failure()!==null');go('ai');expect(page.locator('#studioEvidence article')).to_have_count(0);expect(page.locator('#studioEvidence [data-studio^="cite:"]')).to_have_count(0);assert page.evaluate('THNStudio.state().evidence') is False;assert page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')==saved
 results['checks'].append('Cross-instrument compatibility warning and unavailable brief without substituted evidence or original-record mutation')
 assert page.evaluate('THNServiceHealth.get().capabilities.liveTrading') is False;assert page.evaluate('THNServiceHealth.get().capabilities.paperExecution') is False;assert not results['errors'];b.close()
(out/'research-studio-results.json').write_text(json.dumps(results,indent=2));print('PASS: integrated chart/evidence/validation/saved-case/replay/hypothetical planning workflows; 16 EN/AR/theme/viewport profiles and accessibility')
