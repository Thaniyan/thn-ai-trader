from workspace_controls import control
"""Owned terminal lifecycle/recovery tests. Protocol frames never establish real TV candles."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY,SCRIPT_ONLY,DEFER_DETACHED
out=pathlib.Path(os.environ.get('REMEDIATION_OUTPUT','work/trading-remediation'));out.mkdir(parents=True,exist_ok=True)
result={'network':'offline protocol fixtures; actual TradingView candles NOT verified','checks':[],'layouts':[],'accessibility':[],'errors':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:result['errors'].append(str(e)))
 page.route(EMBED_URL,lambda r:r.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNProfessional&&THNResearch.series()&&THNDecision.brief()')
 def widget_state():
  return page.evaluate("()=>{const parent=document.querySelector('#tvChart .tradingview-widget-container'),script=parent?.querySelector('script');return {context:THNContext.get(),controls:{symbol:document.getElementById('qSymbol').value,interval:document.getElementById('qInterval').value},container:parent?.id||null,activeConfig:script?JSON.parse(script.textContent):null,activeWidget:window.__widgets?.findLast(w=>w.container_id===parent?.id)||null,history:window.__widgets?.slice(-8)||[],status:THNTradingViewStatus(),frames:parent?.querySelectorAll('iframe').length||0,mode:THNProfessional.mode()}}")
 def wait_widget(symbol,interval):
  try:
   page.wait_for_function("v=>{const parent=document.querySelector('#tvChart .tradingview-widget-container'),w=window.__widgets?.findLast(x=>x.container_id===parent?.id),s=THNTradingViewStatus();return w?.symbol===v[0]&&w.interval===v[1]&&s.scriptLoaded&&s.iframeLoaded&&parent.querySelectorAll('iframe').length===1}",arg=[symbol,interval])
  except Exception as error:
   diagnostic={'expected':{'symbol':symbol,'interval':interval},**widget_state()}
   (out/'widget-failure.json').write_text(json.dumps(diagnostic,indent=2))
   summary={'expected':diagnostic['expected'],'context':{k:diagnostic['context'].get(k) for k in ['symbol','interval']},'controls':diagnostic['controls'],'activeContainer':diagnostic['container'],'activeWidget':{k:(diagnostic['activeWidget'] or {}).get(k) for k in ['symbol','interval','container_id']},'historicalLast':{k:(diagnostic['history'] or [{}])[-1].get(k) for k in ['symbol','interval','container_id']},'status':diagnostic['status'],'frames':diagnostic['frames']}
   raise AssertionError('WIDGET FAILURE '+json.dumps(summary)) from error
  state=widget_state();result.setdefault('transitions',[]).append({'expected':[symbol,interval],**state})
  (out/'transitions.json').write_text(json.dumps(result['transitions'],indent=2))
  return state['activeWidget']
 def go(v):
  button=page.locator('.nav-stack [data-view="'+v+'"]');button.focus();button.press('Enter');page.wait_for_timeout(100)
 go('markets');page.locator('#r66Search').fill('GBPUSD');page.locator('[data-pro-tv="GBPUSD"]').click();page.wait_for_function('THNTradingViewStatus().iframeLoaded&&THNTradingViewStatus().scriptLoaded')
 assert page.evaluate('__widgets.length')==1 and page.evaluate('__widgets[0].symbol')=='FX:GBPUSD'
 assert page.evaluate('THNTradingViewStatus()')=={'phase':'frame','scriptLoaded':True,'iframeLoaded':True,'uiReady':False,'candleReady':False,'providerData':'unverified'}
 page.wait_for_timeout(18050)
 assert page.evaluate('THNTradingViewStatus().phase')=='unverified'
 page.evaluate('window.dispatchEvent(new MessageEvent("message",{data:{event:"onChartReady",ready:true}}))');assert not page.evaluate('THNTradingViewStatus().candleReady')
 result['checks'].append('iframe load and toolbar-only protocol frame never prove UI or candle readiness; 18-second bounded feedback')
 for _ in range(3):
  page.locator('#proResearchMode').click();page.locator('#proTradingViewMode').click();go('dashboard');go('trading')
 assert page.evaluate('__widgets.length')==1
 for symbol,tv in [('GBPUSD','FX:GBPUSD'),('XAUUSD','OANDA:XAUUSD'),('BTCUSDT','BINANCE:BTCUSDT'),('EURUSD','FX:EURUSD')]:
  for interval,expected in [('15m','15'),('1d','D'),('1h','60')]:
   page.locator('#qSymbol').fill(symbol);page.locator('#qSymbol').press('Tab');page.wait_for_function('s=>THNContext.get().symbol===s',arg=symbol);page.locator('#qInterval').select_option(interval);page.wait_for_function('v=>THNContext.get().interval===v',arg=interval);wait_widget(tv,expected)
   c=widget_state()['activeWidget'];assert c['symbol']==tv and c['interval']==expected and c['studies']==[] and not c['details'] and not c['hotlist'] and not c['calendar']
   assert page.locator('#proTVExternal').get_attribute('href').startswith('https://www.tradingview.com/chart/?symbol=')
 ids=page.evaluate('__widgets.map(c=>c.container_id)');assert len(set(ids))==len(ids)
 old=page.evaluate('__widgets.length');page.evaluate('THNContext.set({datasetId:"metadata-only"},"test")');page.wait_for_timeout(150);assert page.evaluate('__widgets.length')==old
 page.locator('#loadChartBtn').click();page.wait_for_function('(n)=>__widgets.length===n+1',arg=old)
 result['checks'].append('12 symbol/timeframe combinations, repeated navigation, metadata-only updates and explicit retry; shim configuration only')
 # Complete a genuine detached bootstrap after the active generation (deterministic negative control).
 delayed=[];release_detached=[False]
 def defer_detached(route):
  if release_detached[0]:route.fulfill(status=200,content_type='application/javascript',body=DEFER_DETACHED)
  else:delayed.append(route)
 page.route(EMBED_URL,defer_detached)
 page.locator('#loadChartBtn').click()
 page.wait_for_function('THNTradingViewStatus().phase==="loading"')
 page.locator('#qSymbol').fill('GBPUSD');page.locator('#qSymbol').press('Tab');page.locator('#qInterval').select_option('15m')
 release_detached[0]=True
 for request in reversed(delayed):request.fulfill(status=200,content_type='application/javascript',body=DEFER_DETACHED)
 wait_widget('FX:GBPUSD','15')
 page.wait_for_function('window.__detachedBootstraps?.length>0')
 page.evaluate('__detachedBootstraps.splice(0).forEach(mount=>mount())')
 state=widget_state()
 assert state['history'][-1]['container_id']!=state['container'],state
 assert (state['history'][-1]['symbol'],state['history'][-1]['interval'])!=('FX:GBPUSD','15'),state
 assert state['context']['symbol']=='GBPUSD' and state['context']['interval']=='15m' and state['frames']==1,state
 wait_widget('FX:GBPUSD','15')
 assert not state['status']['candleReady']
 page.unroute(EMBED_URL,defer_detached)
 page.evaluate('THNContext.set({symbol:"EURUSD",interval:"1h"},"restore-after-detached-test")');wait_widget('FX:EURUSD','60')
 result['checks'].append('Detached bootstrap finishes last: historical-tail predicate is false while the current generation, context and one frame remain correct')
 # Unknown context never leaves an old instrument visible or an old external link.
 page.evaluate('THNContext.set({symbol:"UNKNOWN"},"test")');assert page.locator('#tvChart iframe').count()==0;assert page.locator('#proTVExternal').get_attribute('href')=='https://www.tradingview.com/chart/'
 page.evaluate('THNContext.set({symbol:"EURUSD"},"test")');control(page,'#proTVFallback').focus();control(page,'#proTVFallback').press('Enter');assert page.locator('#qCandles').is_visible()
 page.wait_for_function('THNResearch.series()&&THNResearch.series().symbol==="EURUSD"')
 # Fail a changed-context script request; no global constructor exists to shim.
 def missing_library(route):route.abort()
 page.route(EMBED_URL,missing_library);page.evaluate('THNContext.set({interval:"15m"},"missing-embed-test")');page.locator('#proTradingViewMode').click();page.wait_for_function('THNTradingViewStatus().phase==="unavailable"')
 assert not page.evaluate('THNTradingViewStatus().scriptLoaded') and page.locator('#tvChart').is_hidden()
 page.unroute(EMBED_URL,missing_library)
 pending=[]
 def delayed_library(route):pending.append(route)
 page.route(EMBED_URL,delayed_library);old=page.evaluate('__widgets.length');page.locator('#loadChartBtn').click();page.wait_for_timeout(150)
 assert page.locator('#loadChartBtn').is_disabled() and len(pending)==1
 page.evaluate('document.getElementById("loadChartBtn").click()');assert len(pending)==1
 assert not page.evaluate('THNTradingViewStatus().scriptLoaded')
 pending[0].fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY)
 page.wait_for_function('(n)=>__widgets.length===n+1&&THNTradingViewStatus().iframeLoaded',arg=old);page.unroute(EMBED_URL,delayed_library)
 assert not page.evaluate('THNTradingViewStatus().candleReady')
 # Script success without a frame must never establish toolbar or market data.
 def script_only(route):route.fulfill(status=200,content_type='application/javascript',body=SCRIPT_ONLY)
 page.route(EMBED_URL,script_only);page.locator('#loadChartBtn').click();page.wait_for_function('THNTradingViewStatus().scriptLoaded')
 assert not page.evaluate('THNTradingViewStatus().iframeLoaded') and not page.evaluate('THNTradingViewStatus().uiReady')
 page.wait_for_timeout(18050);assert page.evaluate('THNTradingViewStatus().phase')=='unverified'
 page.unroute(EMBED_URL,script_only)
 control(page,'#proTVFallback').focus();control(page,'#proTVFallback').press('Enter');assert page.locator('#qCandles').is_visible()
 result['checks'].append('Network failure, delayed official-embed boundary, retry lock, script-only versus frame-only readiness, generation containers and keyboard fallback')
 # Browsers may coalesce two requests for this SAME public script URL.
 # Cover both fetch behaviors without cache-busting undocumented provider URLs.
 late=[];release=[False]
 def late_library(route):
  if release[0]:route.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY)
  else:late.append(route)
 page.route(EMBED_URL,late_library);page.locator('#proTradingViewMode').click();page.locator('#loadChartBtn').click();page.wait_for_timeout(200);assert len(late)==1
 old_generation=page.locator('#tvChart .tradingview-widget-container').get_attribute('id')
 page.evaluate('window.__oldEmbedScript=document.querySelector("#tvChart script")')
 page.evaluate('THNContext.set({symbol:"GBPUSD"},"late-response-test")');page.wait_for_timeout(250)
 generation=page.locator('#tvChart .tradingview-widget-container').get_attribute('id');assert generation!=old_generation
 assert page.locator('#tvChart script').evaluate('s=>JSON.parse(s.textContent).symbol')=='FX:GBPUSD'
 page.evaluate('window.__oldEmbedScript.dispatchEvent(new Event("load"))')
 assert not page.evaluate('THNTradingViewStatus().scriptLoaded') and page.evaluate('THNTradingViewStatus().phase')=='loading'
 release[0]=True
 for request in reversed(late):request.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY)
 page.wait_for_function('THNTradingViewStatus().scriptLoaded&&THNTradingViewStatus().iframeLoaded')
 assert page.locator('#tvChart .tradingview-widget-container').get_attribute('id')==generation
 assert page.locator('#tvChart iframe').count()==1
 assert page.locator('#tvChart script').evaluate('s=>JSON.parse(s.textContent).symbol')=='FX:GBPUSD'
 assert not page.evaluate('THNTradingViewStatus().candleReady')
 page.unroute(EMBED_URL,late_library);page.evaluate('THNContext.set({symbol:"EURUSD",interval:"1h"},"restore-context-test")');page.wait_for_function('THNTradingViewStatus().iframeLoaded');control(page,'#proTVFallback').click();page.wait_for_function('THNResearch.series()?.symbol==="EURUSD"&&THNResearch.series().provenance.interval==="1h"&&THNDecision.brief()?.symbol==="EURUSD"&&THNDecision.brief().interval==="1h"')
 result['checks'].append('Late old-generation events and shared/reverse-order asset completion cannot restore a stale instrument or readiness')
 # Selected-context original analysis opens existing evidence, never a second analysis engine.
 with page.expect_response(lambda r:r.url.endswith('/api/analyze') and r.request.method=='POST') as analysis_response:
  page.locator('#proAnalyzeContext').click()
 assert analysis_response.value.status==200 and analysis_response.value.json()['symbol']=='EURUSD'
 page.wait_for_function('!document.getElementById("proAnalyzeContext").disabled&&document.getElementById("view-ai").classList.contains("view-active")');assert page.evaluate('currentAnalysis.symbol')=='EURUSD'
 result['checks'].append('Terminal -> original analysis API -> selected-context AI evidence')
 go('trading')
 # Actual existing deterministic HTTP plan path and owned renderer; never orders.
 page.locator('#proRiskLink').click();page.locator('#planEntry').fill('1.1');page.locator('#planStop').fill('1.09');page.locator('#planTarget').fill('1.12');page.locator('#planSide').select_option('BUY');page.locator('#workRiskForm button[type="submit"]').click();page.wait_for_function('THNDecision.plan()!==null');page.locator('[data-decision="planChart"]').click();assert page.locator('#qCandles').is_visible();assert page.evaluate('THNResearch.chart.planLevels.entry')==1.1
 page.locator('#proEvidenceLink').click();page.wait_for_function('THNDecision.brief()&&THNDecision.brief().symbol==="EURUSD"');page.evaluate('THNLibrary.save(THNDecision.snapshot())');go('trading');page.locator('#proLibraryLink').click();assert page.locator('#decisionReports').is_visible();assert page.evaluate('THNLibrary.records().length')>0
 result['checks'].append('Risk API validated plan -> THN entry/stop/target overlay; evidence -> complete saved Library research')
 page.add_script_tag(content=pathlib.Path(os.environ['AXE_PATH']).read_text())
 for width,lang,theme in itertools.product([1440,768,390],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);go('trading')
  for mode in ['research','manual']:
   page.evaluate('(m)=>THNProfessional.setMode(m)',mode);page.wait_for_timeout(100)
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   issues=page.evaluate("""()=>{const root=document.querySelector('#proTerminal');let issues=[];for(const q of ['.pro-terminal-head','.pro-mode-switch','.pro-workflow-actions']){const p=root.querySelector(q);const kids=[...p.children].filter(e=>e.getClientRects().length);for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++){const a=kids[i].getBoundingClientRect(),b=kids[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push(q);}}return issues;}""");assert not issues,issues
   result['layouts'].append({'width':width,'language':lang,'theme':theme,'mode':mode,'issues':issues})
   violations=page.evaluate("""async()=> (await axe.run(document.querySelector('#proTerminal'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))""");assert not violations,violations
   result['accessibility'].append({'width':width,'language':lang,'theme':theme,'mode':mode,'violations':violations})
   if (lang,theme) in [('en','dark'),('ar','light')]:page.screenshot(path=str(out/(mode+'-'+lang+'-'+theme+'-'+str(width)+'.png')))
 assert not result['errors'],result['errors'];b.close()
(out/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'checks':result['checks'],'layouts':len(result['layouts']),'accessibility':len(result['accessibility']),'errors':result['errors']}))
