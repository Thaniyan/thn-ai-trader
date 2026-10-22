"""v7.4 real UI/API journeys with explicit offline provider/widget fixtures, never live candle proof."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright,expect
from workspace_controls import control
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY
out=pathlib.Path('work/experience');out.mkdir(parents=True,exist_ok=True)
result={'checks':[],'geometry':[],'accessibility':[],'errors':[],'fixtures':'Offline provider plus official-embed protocol shim, not real TradingView candles'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:result['errors'].append(str(e)))
 page.route(EMBED_URL,lambda r:r.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNEvolution&&THNDecision.brief()&&currentAnalysis&&!document.getElementById("analyzeBtn").disabled')
 def go(v):
  page.locator('.nav-stack [data-view="'+v+'"]').click();expect(page.locator('#view-'+v)).to_be_visible();page.wait_for_function('()=>!document.querySelector(".app-view.view-active").getAnimations({subtree:true}).some(a=>a.playState==="running"&&a.effect?.getComputedTiming().endTime!==Infinity&&a.effect?.target?.getClientRects().length)',timeout=10000)
 def ready(symbol,interval='1h'):page.wait_for_function('(c)=>THNResearch.series()?.symbol===c[0]&&THNDecision.brief()?.symbol===c[0]&&THNDecision.brief()?.interval===c[1]',arg=[symbol,interval])
 assert page.evaluate('THNPresentation.price(157.1234567,"USDJPY","en")')=='157.123'
 assert page.evaluate('THNPresentation.price(1.1234567,"EURUSD","en")')=='1.12346'
 assert page.locator('#evoBriefDetails').get_attribute('open') is None
 raw=page.evaluate('THNResearch.series().candles.at(-1).close');assert page.locator('#evoDashboard .evo-close').inner_text()==page.evaluate('(p)=>THNPresentation.price(p,"EURUSD")',raw)
 result['checks'].append('A: instrument-aware display, exact raw candles retained, compact Dashboard and advanced original access')
 go('markets');page.locator('#r66Search').fill('USDJPY');page.locator('[data-r66-chart="USDJPY"]').click();ready('USDJPY');assert page.evaluate('THNContext.get().symbol')=='USDJPY'
 go('trading');page.locator('#proChartTools > summary').click();assert page.locator('#qDrawingMode').is_visible()
 for layer in ['ema','volume','rsi','levels','smc']:
  el=page.locator('[data-qlayer="'+layer+'"]');before=el.get_attribute('aria-pressed');el.click();assert el.get_attribute('aria-pressed')!=before;assert page.evaluate('(k)=>String(THNResearch.chart.layers[k])',layer)==el.get_attribute('aria-pressed');el.click()
 page.locator('#proChartTools > summary').click();width=page.locator('.q-canvas-shell').bounding_box()['width'];page.locator('#proChartFocus').click();expect(page.locator('#proTerminal')).to_have_attribute('aria-modal','true');assert page.locator('.q-canvas-shell').bounding_box()['width']>width;page.screenshot(path=str(out/'focused-chart.png'),animations='disabled')
 page.locator('#proChartFocus').focus();page.keyboard.press('Escape');expect(page.locator('#proChartFocus')).to_be_focused();assert not page.locator('.sidebar').evaluate('e=>e.inert')
 page.locator('#proTradingViewMode').click();page.wait_for_function('THNTradingViewStatus().iframeLoaded');assert not page.evaluate('THNTradingViewStatus().candleReady');page.locator('#proTVFallback').click();expect(page.locator('#qCandles')).to_be_visible()
 result['checks'].append('B–D: discovery, original context, active layers, focus/Escape/focus restoration, official widget shim and honest fallback')
 # Genuine server assistant: history is contextual, never fabricated by the test.
 go('ai');page.locator('#i7Question').fill('Explain the evidence');page.locator('#intelligenceAssistant button[type="submit"]').click();page.wait_for_function('THNIntelligence.result()?.snapshot.symbol==="USDJPY"');page.locator('#qSymbol').fill('EURUSD');page.locator('#qSymbol').press('Tab');ready('EURUSD')
 expect(page.locator('.i7-message[data-historical="true"]').first).to_contain_text('USDJPY / 1h');expect(page.locator('.i7-message[data-historical="true"]').first).to_contain_text('not current evidence')
 page.screenshot(path=str(out/'historical-assistant.png'),animations='disabled')
 result['checks'].append('E: real deterministic assistant history attributed to prior USDJPY after EURUSD selection')
 go('risk');expect(page.locator('#evoPlanStatus')).to_contain_text('Plan not validated');page.locator('#evoRiskConditions > summary').click();expect(page.locator('#riskChecklistContext')).to_contain_text('not plan');assert page.locator('#riskChecklistContext').get_attribute('data-current')=='false'
 for k,v in {'planCapital':'10000','planRisk':'1','planEntry':'1.1','planStop':'1.09','planTarget':'1.12','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+k).fill(v)
 page.locator('#planSide').select_option('BUY');page.locator('#workRiskForm button[type="submit"]').click();page.wait_for_function('THNDecision.plan()?.budget===100');expect(page.locator('#evoPlanStatus')).to_contain_text('Validated hypothetical plan');assert page.evaluate('THNDecision.plan().plannedStopLossWithCosts')==100
 page.screenshot(path=str(out/'validated-hypothetical-plan.png'),animations='disabled');page.locator('#evoRisk [data-evo="save-plan"]').click();page.wait_for_function('THNLibrary.records().length===1');original=page.evaluate('JSON.stringify(THNLibrary.records())');page.locator('[data-lib-open]').first.click();expect(page.locator('[data-lib-context]')).to_be_visible()
 page.screenshot(path=str(out/'populated-library.png'),animations='disabled')
 result['checks'].append('F/J: unmatched checklist separate from plan; genuine USD100 server plan -> immutable Library')
 go('portfolio');page.locator('[data-evo="portfolio:evoOutcomes"]').click();expect(page.locator('#performanceEmpty')).to_be_visible();assert page.locator('#performanceAnalytics .d3-card:visible').count()==0
 page.screenshot(path=str(out/'empty-outcomes.png'),animations='disabled');page.locator('#openLogTradeModalBtn').click()
 for k,v in {'manualSymbol':'EURUSD','manualEntry':'1.1','manualExit':'1.12','manualPnl':'200','manualRisk':'100','manualDate':'2026-01-02'}.items():page.locator('#'+k).fill(v)
 page.locator('#logTradeForm button[type="submit"]').click();control(page,'#trustPerformanceSource').select_option('manual');expect(page.locator('#kpiNetPnl')).to_have_text('+$200.00');assert page.locator('#performanceAnalytics .d3-card:visible').count()==3
 page.screenshot(path=str(out/'eligible-outcomes.png'),animations='disabled');control(page,'#trustPerformanceSource').select_option('verified');expect(page.locator('#performanceEmpty')).to_be_visible()
 result['checks'].append('G: empty charts compact; actual UI manual outcome shown only for explicit unverified source; verified remains unavailable')
 go('trading');page.locator('#proAnalyzeContext').click();page.wait_for_function('THNEvolution.analysisReady()');go('trading');page.locator('#proSaveIdea').click();expect(page.locator('#proRecords')).to_contain_text('EURUSD · Research idea');assert page.evaluate('THNRecords.select(getJournal()).length')==0
 page.locator('#l65Recovery > summary').click();expect(page.locator('#d64Import')).to_be_visible();assert page.evaluate('JSON.stringify(THNLibrary.records())')==original
 page.screenshot(path=str(out/'populated-journal-recovery.png'),animations='disabled')
 result['checks'].append('H: guarded idea save, truthful classification, separate backup tools, accessible Advanced Recovery and preserved reports')
 go('settings');page.locator('#prefDefaultRisk').select_option('0.5');page.locator('#evoApplySizing').click();page.reload();page.wait_for_function('window.THNEvolution');go('settings');assert page.locator('#prefDefaultRisk').input_value()=='0.5';page.locator('#evoDanger > summary').click();dialogs=[];page.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()));page.locator('#prefClearJournalBtn').click();assert dialogs and page.evaluate('getJournal().length')>=2
 result['checks'].append('I: restored preferences and explicit, cancellable destructive confirmation')
 page.add_script_tag(content=pathlib.Path(os.environ['AXE_PATH']).read_text())
 for width,lang,theme in itertools.product([1440,768,390,320],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   go(view);issue=page.evaluate('document.documentElement.scrollWidth>innerWidth+1');result['geometry'].append([width,lang,theme,view,issue]);assert not issue,result['geometry'][-1]
   if width in [1440,390]:
    violations=page.evaluate("async()=> (await axe.run(document.querySelector('.app-view.view-active'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))");result['accessibility'].append([width,lang,theme,view,violations]);assert not violations,result['accessibility'][-1]
 result['focus']=[]
 for lang,theme in itertools.product(['en','ar'],['dark','light']):
  page.set_viewport_size({'width':390,'height':844});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);go('trading');page.locator('#proChartFocus').click()
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  violations=page.evaluate("async()=> (await axe.run(document.querySelector('#proTerminal'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)");assert not violations,violations
  result['focus'].append({'lang':lang,'theme':theme,'violations':violations});page.keyboard.press('Escape');expect(page.locator('#proChartFocus')).to_be_focused()
 assert not result['errors'],result['errors'];b.close()
(out/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
