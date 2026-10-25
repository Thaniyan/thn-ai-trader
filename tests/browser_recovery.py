"""Product recovery acceptance: one real chart, matched engines and honest states.
Offline provider/official-embed protocol fixtures are test-only, never live proof.
"""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright,expect
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY
out=pathlib.Path(os.environ.get('RECOVERY_OUTPUT','work/recovery-m1'));out.mkdir(parents=True,exist_ok=True)
results={'journeys':[],'geometry':[],'accessibility':[],'errors':[],'screenshots':'Local packaged source; offline provider fixture, not Production'}
views=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);s=b.new_page(viewport={'width':1440,'height':1000});s.on('pageerror',lambda e:results['errors'].append(str(e)))
 s.route(EMBED_URL,lambda r:r.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY))
 s.goto(os.environ['TEST_URL']);s.wait_for_function('window.THNEvolution&&THNDecision.brief()&&THNResearch.series()')
 def go(v):
  s.locator('.nav-stack [data-view='+v+']').click();expect(s.locator('#view-'+v)).to_be_visible()
  s.wait_for_function('()=>!document.querySelector(".view-active").getAnimations({subtree:true}).some(a=>a.playState==="running"&&a.effect?.getComputedTiming().endTime!==Infinity&&a.effect?.target?.getClientRects().length)')
 def matched(symbol,interval):s.wait_for_function('(c)=>THNResearch.series()?.symbol===c[0]&&THNDecision.brief()?.symbol===c[0]&&THNDecision.brief()?.interval===c[1]',arg=[symbol,interval])
 expect(s.locator('#view-dashboard #qCandles')).to_be_visible();assert s.locator('#qCandles').count()==1
 chart=s.locator('#qCandles').bounding_box();assert chart['y']<400 and chart['width']>800 and chart['height']>=400,chart
 # Identity is compared with an object reference, not a fake substitute chart.
 s.evaluate('window.__recoveryChart=THNResearch.chart')
 go('trading');assert s.evaluate('THNResearch.chart===window.__recoveryChart');expect(s.locator('#view-trading #qCandles')).to_be_visible()
 s.locator('#qCandles').focus();s.keyboard.press('ArrowLeft');offset=s.evaluate('THNResearch.chart.offset');assert offset>0
 go('dashboard');assert s.evaluate('THNResearch.chart.offset')==offset and s.evaluate('THNResearch.chart===window.__recoveryChart')
 s.locator('#proChartFocus').click();expect(s.locator('#view-trading')).to_be_visible();expect(s.locator('#proTerminal')).to_have_attribute('aria-modal','true');s.keyboard.press('Escape');assert not s.locator('.sidebar').evaluate('e=>e.inert')
 go('dashboard');s.locator('#qSymbol').fill('GBPUSD');s.locator('#qSymbol').press('Tab');matched('GBPUSD','1h')
 for layer in ['ema','rsi','levels','smc']:
  toggle=s.locator('[data-qlayer='+layer+']');assert toggle.is_visible();before=toggle.get_attribute('aria-pressed');toggle.click();s.wait_for_function('(v)=>String(THNResearch.chart.layers[v[0]])!==v[1]',arg=[layer,before]);toggle.click()
 # New primary tools must drive the original chart, not decorative UI state.
 s.locator('[data-pro-draw="line"]').click();assert s.evaluate('THNResearch.chart.mode')=='line';assert s.locator('#qDrawingMode').input_value()=='line'
 canvas=s.locator('#qCandles');canvas.click(position={'x':100,'y':100});canvas.click(position={'x':220,'y':180});assert s.evaluate('THNResearch.chart.drawings.some(d=>d.type==="line")')
 s.locator('[data-pro-draw="note"]').click();expect(s.locator('#qAnnotation')).to_be_focused();s.locator('#qAnnotation').fill('Local research annotation');s.locator('#qAnnotation').dispatch_event('input');canvas.click(position={'x':180,'y':120});assert s.evaluate('THNResearch.chart.drawings.some(d=>d.type==="note")')
 s.locator('[data-pro-draw="horizontal"]').click();assert s.evaluate('THNResearch.chart.mode')=='horizontal';canvas.click(position={'x':240,'y':160});assert s.evaluate('THNResearch.chart.drawings.some(d=>d.type==="horizontal")')
 s.locator('[data-pro-draw="pan"]').click();assert s.evaluate('THNResearch.chart.mode')=='pan';s.locator('#qClear').click();assert s.evaluate('THNResearch.chart.drawings.length')==0
 s.locator('#proChartTools > summary').click();before=s.evaluate('THNResearch.chart.count');s.locator('#qZoomIn').click();assert s.evaluate('THNResearch.chart.count')<before;s.locator('#qReset').click()
 expected=s.evaluate('THNPresentation.price(THNResearch.series().candles.at(-1).close,THNContext.get().symbol)');expect(s.locator('#proObservedClose')).to_have_text(expected)
 expect(s.locator('.pro-technical-card #proTechnicalEvidence')).to_be_visible();assert s.locator('.pro-technical-card dt').all_text_contents()==['EMA20','RSI14','ATR14']
 assert s.locator('#evoDashboard .evo-desk-metrics .evo-metric').count()==3
 assert s.locator('#evoDashboard .evo-desk-metrics strong').nth(0).inner_text()==s.evaluate('String(THNLibrary.records().length)')
 go('markets');s.go_back();expect(s.locator('#proRouteTitle')).to_have_text('Trading Terminal' if s.url.endswith('#trading') else 'Overview')
 frame=s.evaluate('THNDecision.brief().frames.find(f=>f.interval===THNContext.get().interval)')
 for value in [frame['support'],frame['resistance']]:assert s.evaluate('(v)=>THNPresentation.price(v,"GBPUSD")',value) in s.locator('#proSummaryLevels').inner_text()
 s.locator('#qInterval').select_option('15m');matched('GBPUSD','15m');assert s.evaluate('THNResearch.chart.context.interval')=='15m'
 s.reload();s.wait_for_function('window.THNEvolution&&THNResearch.series()');expect(s.locator('#view-dashboard #qCandles')).to_be_visible();go('trading');s.locator('#proAnalyzeContext').click();s.wait_for_function('THNEvolution.analysisReady()');go('trading');s.locator('#proSaveIdea').click();expect(s.locator('#proRecords')).to_contain_text('Research idea');assert s.evaluate('THNRecords.select(getJournal()).length')==0
 go('trading');s.locator('#proTradingViewMode').click();s.wait_for_function('THNTradingViewStatus().iframeLoaded');expect(s.locator('#qCandles')).not_to_be_visible();expect(s.locator('#proDrawingDock')).not_to_be_visible();assert not s.evaluate('THNTradingViewStatus().candleReady');s.locator('#proTVRecovery > summary').click();s.locator('#proTVFallback').click();expect(s.locator('#qCandles')).to_be_visible()
 results['journeys']=['Landing chart visible without navigation','Exact same chart/state across desk and terminal','Focus routing and Escape restoration','Search and timeframe -> matched evidence','Visible toggles, drawing dock and native zoom change the actual chart','Summary equals authoritative frame values','Reload -> real analysis -> research idea (never profit)','Official widget protocol -> honest THN fallback']
 # A real provider failure clears selected values. Do not inject analysis or prices.
 s.route('**/api/research/series?**',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"Provider unavailable in acceptance case"}'))
 s.locator('#qSymbol').fill('USDJPY');s.locator('#qSymbol').press('Tab');s.wait_for_function('THNContext.get().symbol==="USDJPY"&&THNResearch.series()===null');expect(s.locator('#proSummaryLevels')).to_contain_text('—');expect(s.locator('#proObservedClose')).to_have_text('—');expect(s.locator('#proSummaryStructure')).to_contain_text('unavailable');assert not s.evaluate('THNEvolution.analysisReady()');expect(s.locator('#proSaveIdea')).to_be_disabled();s.screenshot(path=str(out/'provider-unavailable.png'),full_page=True);s.unroute('**/api/research/series?**')
 s.locator('#qSymbol').fill('EURUSD');s.locator('#qSymbol').press('Tab');matched('EURUSD','15m');s.locator('#qInterval').select_option('1h');matched('EURUSD','1h')
 s.add_script_tag(path=os.environ['AXE_PATH']);cdp=s.context.new_cdp_session(s)
 # Physical-width / DPR pairs emulate common zoom; all nine sections remain reachable.
 for width,language,theme,zoom in itertools.product([1440,1280,820,390],['en','ar'],['dark','light'],[1,1.25]):
  s.set_viewport_size({'width':round(width/zoom),'height':round(1000/zoom)});cdp.send('Emulation.setDeviceMetricsOverride',{'width':round(width/zoom),'height':round(1000/zoom),'deviceScaleFactor':zoom,'mobile':False});s.locator('.terminal-topbar [data-language='+language+']').click();s.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  for view in views:
   go(view)
   issues=s.evaluate('''()=>{const out=[];if(document.documentElement.scrollWidth>innerWidth+1)out.push('page overflow');for(const sel of ['.nav-stack','.topbar-controls','.pro-terminal-head','.q-layer-controls']){const parent=document.querySelector(sel);if(!parent?.getClientRects().length)continue;const boxes=[...parent.children].filter(e=>e.getClientRects().length&&getComputedStyle(e).position!=='absolute').map(e=>e.getBoundingClientRect());for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(Math.min(boxes[i].right,boxes[j].right)-Math.max(boxes[i].left,boxes[j].left)>1&&Math.min(boxes[i].bottom,boxes[j].bottom)-Math.max(boxes[i].top,boxes[j].top)>1)out.push(sel+' overlap');}return out;}''')
   results['geometry'].append([width,language,theme,zoom,view,issues]);assert not issues,results['geometry'][-1]
   if zoom==1 and width in [1440,390]:
    violations=s.evaluate('async()=> (await axe.run(document.querySelector(".view-active"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))');results['accessibility'].append([width,language,theme,view,violations]);assert not violations,results['accessibility'][-1]
    if (width==1440 and theme=='dark') or (width==390 and theme=='light'):s.screenshot(path=str(out/(view+'-'+language+'-'+str(width)+'-'+theme+'.png')),full_page=True,animations='disabled')
   if zoom==1 and width==820 and theme=='dark' and view in ['dashboard','trading']:s.screenshot(path=str(out/(view+'-'+language+'-820-dark.png')),full_page=True,animations='disabled')
 # Narrow zoom reflow must contain actual heading text, not merely the page box.
 # This catches the research-desk heading overflow even when a browser clamps it.
 results['narrowHeadings']=[]
 for width,language,theme in itertools.product([160,192,240],['en','ar'],['dark','light']):
  s.set_viewport_size({'width':width,'height':450});cdp.send('Emulation.setDeviceMetricsOverride',{'width':width,'height':450,'deviceScaleFactor':2,'mobile':False});s.locator('.terminal-topbar [data-language='+language+']').click();s.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  for view in views:
   go(view)
   s.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
   issues=s.evaluate("""()=>{const out=[];if(document.documentElement.scrollWidth>innerWidth+1)out.push('page overflow');for(const e of document.querySelectorAll('.view-active .evo-panel h2,.view-active .pro-research-rail h2')){if(!e.getClientRects().length)continue;const box=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())if(n.textContent.trim()){const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width&&(r.left<box.left-1||r.right>box.right+1))out.push(e.textContent+' text exceeds heading box');}}return out;}""")
   results['narrowHeadings'].append([width,language,theme,view,issues]);assert not issues,results['narrowHeadings'][-1]
 assert not results['errors'],results['errors'];b.close()
(out/'acceptance.json').write_text(json.dumps(results,indent=2));print(json.dumps({'journeys':len(results['journeys']),'geometry':len(results['geometry']),'axe':len(results['accessibility']),'narrowHeadings':len(results['narrowHeadings']),'errors':results['errors']}))
