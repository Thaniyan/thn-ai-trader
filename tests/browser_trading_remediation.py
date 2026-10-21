"""Owned terminal lifecycle/recovery tests. Protocol frames never establish real TV candles."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright
out=pathlib.Path(os.environ.get('REMEDIATION_OUTPUT','work/trading-remediation'));out.mkdir(parents=True,exist_ok=True)
result={'network':'offline protocol fixtures; actual TradingView candles NOT verified','checks':[],'layouts':[],'accessibility':[],'errors':[]}
shim="""window.__widgets=[];window.TradingView={widget:function(c){__widgets.push(c);const f=document.createElement('iframe');f.srcdoc='<p>Protocol toolbar only. No chart data.</p>';document.getElementById(c.container_id).append(f);}}"""
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:result['errors'].append(str(e)))
 page.route('https://s3.tradingview.com/**',lambda r:r.abort())
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNProfessional&&THNResearch.series()&&THNDecision.brief()')
 def go(v):
  button=page.locator('.nav-stack [data-view="'+v+'"]');button.focus();button.press('Enter');page.wait_for_timeout(100)
 page.evaluate(shim);go('markets');page.locator('#r66Search').fill('GBPUSD');page.locator('[data-pro-tv="GBPUSD"]').click();page.wait_for_function('THNTradingViewStatus().iframeLoaded')
 assert page.evaluate('__widgets.length')==1 and page.evaluate('__widgets[0].symbol')=='FX:GBPUSD'
 assert page.evaluate('THNTradingViewStatus()')=={'phase':'frame','iframeLoaded':True,'uiReady':False,'candleReady':False}
 page.wait_for_timeout(18050)
 assert page.evaluate('THNTradingViewStatus().phase')=='unverified'
 page.evaluate('window.dispatchEvent(new MessageEvent("message",{data:{event:"onChartReady",ready:true}}))');assert not page.evaluate('THNTradingViewStatus().candleReady')
 result['checks'].append('iframe load and toolbar-only protocol frame never prove UI or candle readiness; 18-second bounded feedback')
 for _ in range(3):
  page.locator('#proResearchMode').click();page.locator('#proTradingViewMode').click();go('dashboard');go('trading')
 assert page.evaluate('__widgets.length')==1
 for symbol,tv in [('GBPUSD','FX:GBPUSD'),('XAUUSD','OANDA:XAUUSD'),('BTCUSDT','BINANCE:BTCUSDT'),('EURUSD','FX:EURUSD')]:
  for interval,expected in [('15m','15'),('1d','D'),('1h','60')]:
   page.locator('#qSymbol').fill(symbol);page.locator('#qSymbol').press('Tab');page.locator('#qInterval').select_option(interval);page.wait_for_timeout(100)
   c=page.evaluate('__widgets.at(-1)');assert c['symbol']==tv and c['interval']==expected and c['studies']==[] and not c['details'] and not c['hotlist'] and not c['calendar']
   assert page.locator('#proTVExternal').get_attribute('href').startswith('https://www.tradingview.com/chart/?symbol=')
 ids=page.evaluate('__widgets.map(c=>c.container_id)');assert len(set(ids))==len(ids)
 old=page.evaluate('__widgets.length');page.evaluate('THNContext.set({datasetId:"metadata-only"},"test")');page.wait_for_timeout(150);assert page.evaluate('__widgets.length')==old
 page.locator('#loadChartBtn').click();assert page.evaluate('__widgets.length')==old+1
 result['checks'].append('12 symbol/timeframe combinations, repeated navigation, metadata-only updates and explicit retry; shim configuration only')
 # Unknown context never leaves an old instrument visible or an old external link.
 page.evaluate('THNContext.set({symbol:"UNKNOWN"},"test")');assert page.locator('#tvChart iframe').count()==0;assert page.locator('#proTVExternal').get_attribute('href')=='https://www.tradingview.com/chart/'
 page.evaluate('THNContext.set({symbol:"EURUSD"},"test")');page.locator('#proTVFallback').focus();page.locator('#proTVFallback').press('Enter');assert page.locator('#qCandles').is_visible()
 page.wait_for_function('THNResearch.series()&&THNResearch.series().symbol==="EURUSD"')
 page.evaluate('()=>{delete window.TradingView;THNContext.set({interval:"15m"},"missing-library-test")}');page.locator('#proTradingViewMode').click();assert page.evaluate('THNTradingViewStatus().phase')=='unavailable'
 # Hold the real script request boundary, then deliver a protocol-only constructor.
 pending=[]
 def delayed_library(route):pending.append(route)
 page.route('https://s3.tradingview.com/tv.js',delayed_library);page.locator('#loadChartBtn').click();page.wait_for_timeout(150)
 assert page.locator('#loadChartBtn').is_disabled() and len(pending)==1
 page.evaluate('document.getElementById("loadChartBtn").click()');assert len(pending)==1
 pending[0].fulfill(status=200,content_type='application/javascript',body=shim)
 page.wait_for_function('window.__widgets?.length===1&&!document.getElementById("loadChartBtn").disabled');assert page.evaluate('THNTradingViewStatus().candleReady')==False
 page.evaluate('()=>{window.TradingView.widget=function(){throw Error("protocol failure")}}');page.locator('#loadChartBtn').click();assert page.evaluate('THNTradingViewStatus().phase')=='unavailable';page.locator('#proTVFallback').focus();page.locator('#proTVFallback').press('Enter');assert page.locator('#qCandles').is_visible()
 result['checks'].append('Missing script, delayed real-script boundary, duplicate-retry lock, constructor failure, unique generation containers, unsupported mapping and keyboard fallback')
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
 page.evaluate(shim)
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
