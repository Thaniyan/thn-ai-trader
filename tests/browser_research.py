from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get('TEST_URL','http://127.0.0.1:3011')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1050});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE);page.wait_for_function('window.THNResearch && window.THNResearch.series()',timeout=40000)
 report={'provider':page.evaluate('THNResearch.series().provenance'),'checks':[],'a11y':[],'mobile':[]}
 page.locator('.nav-stack [data-view="trading"]').click();page.wait_for_timeout(500)
 original=page.evaluate('THNResearch.chart.count');page.locator('#qZoomIn').click();assert page.evaluate('THNResearch.chart.count')<original
 page.locator('#qCandles').focus();page.keyboard.press('ArrowLeft');assert page.evaluate('THNResearch.chart.offset')>0
 page.keyboard.press('Home');assert page.evaluate('THNResearch.chart.offset')==0
 page.keyboard.press('Shift+ArrowLeft');assert 'Open' in page.locator('#qTooltip').inner_text()
 canvas=page.locator('#qCandles');box=canvas.bounding_box();page.mouse.move(box['x']+200,box['y']+120);assert 'Open' in page.locator('#qTooltip').inner_text()
 page.locator('[data-qlayer="smc"]').click();assert page.evaluate('THNResearch.chart.layers.smc')
 page.locator('#qDrawingMode').select_option('line');canvas.click(position={'x':100,'y':100});canvas.click(position={'x':200,'y':150});assert page.evaluate('THNResearch.chart.drawings.length')==1
 page.locator('#qAnnotation').fill('Research annotation');page.locator('#qDrawingMode').select_option('note');canvas.click(position={'x':220,'y':160});assert page.evaluate('THNResearch.chart.drawings.length')==2
 page.locator('#qUndo').click();assert page.evaluate('THNResearch.chart.drawings.length')==1
 with page.expect_download() as analytical:page.locator('#qAnalysisExport').click()
 analysis=json.load(open(analytical.value.path()));assert analysis['provenance']['hash'];assert 'accounts' not in analysis
 page.screenshot(path='work/v62-final-chart.png');report['checks'].append('OHLC tooltip, zoom, pan, keyboard reset, layers, drawings and undo')
 page.locator('#qInterval').select_option('15m');page.wait_for_function('THNResearch.series()?.provenance.interval === "15m"',timeout=40000)
 hash15=page.evaluate('THNResearch.series().provenance.hash');page.locator('#qInterval').select_option('1d');page.wait_for_function('THNResearch.series()?.provenance.interval === "1d"',timeout=40000)
 assert page.evaluate('THNResearch.series().provenance.hash')!=hash15
 assert page.locator('#timeframe').input_value()=='swing'
 report['checks'].append('independent timeframe datasets and shared terminal context')
 page.locator('.nav-stack [data-view="ai"]').click();page.wait_for_function('THNResearch.mtf()?.frames.length===3',timeout=40000);report['timeframes']=page.evaluate('THNResearch.mtf().frames.map(f=>({interval:f.interval,available:f.available,provenance:f.provenance}))');page.screenshot(path='work/v62-final-mtf.png')
 valid=page.evaluate('(()=>{const m=THNResearch.mtf();const h=m.frames.find(f=>f.interval==="1h");return m.scenarios.find(s=>s.direction!=="neutral"&&m.complete&&s.evidence.length&&(s.direction==="bullish"?s.invalidation<h.close:s.invalidation>h.close))?.direction})()')
 if valid:
  page.locator('[data-qscenario="'+valid+'"]').click();assert page.locator('#view-risk').is_visible();assert float(page.locator('#planEntry').input_value())>0;assert page.evaluate('THNContext.get().interval')=='1h';page.locator('#workRiskForm button').click();page.wait_for_function('document.querySelector(".work-result-grid")',timeout=10000);report['checks'].append('independent timeframe scenario transferred to server-backed Risk Desk')
 page.locator('#qInterval').select_option('1h');page.wait_for_function('THNResearch.series()?.provenance.interval === "1h"',timeout=40000)
 page.locator('.nav-stack [data-view="portfolio"]').click();page.locator('#qRun').click();page.wait_for_function('THNResearch.result()',timeout=40000)
 report['research']=page.evaluate('({metrics:THNResearch.result().metrics,sample:THNResearch.result().sample})')
 assert page.locator('.q-metrics').is_visible();page.screenshot(path='work/v62-final-research.png')
 with page.expect_download() as download:page.locator('#qExport').click()
 payload=json.load(open(download.value.path()));assert payload['research']['provenance']['hash'];assert 'accounts' not in payload;assert 'credentials' not in json.dumps(payload).lower()
 report['checks'].append('actual historical strategy run and export contains research only')
 page.locator('.nav-stack [data-view="journal"]').click();page.locator('#qNoteTitle').fill('Browser research record');page.locator('#qNoteBody').fill('Observed EMA result; invalidation requires confirmation.');page.locator('#qNoteForm button').click();assert 'Browser research record' in page.locator('#qNotes').inner_text();page.reload();page.wait_for_function('window.THNResearch');assert 'Browser research record' in page.locator('#qNotes').inner_text();report['checks'].append('research notes survive reload')
 page.locator('[data-language="ar"]').first.click();page.wait_for_timeout(600);assert page.locator('html').get_attribute('dir')=='rtl';assert page.locator('.q-lab h2').inner_text()=='مختبر الاستراتيجيات التاريخية'
 for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
  page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(500);assert page.locator('#view-'+view).is_visible()
  page.add_script_tag(path='work/node_modules/axe-core/axe.min.js');violations=page.evaluate('async()=>{let r=await axe.run(document.querySelector("#view-"+location.hash.slice(1)),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}')
  report['a11y'].append({'view':view,'violations':violations})
  if view=='trading':page.screenshot(path='work/v62-final-ar.png')
 for lang in ['ar','en']:
  page.locator('[data-language="'+lang+'"]').first.click();page.set_viewport_size({'width':390,'height':844})
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(450);report['mobile'].append({'lang':lang,'view':view,'overflow':page.evaluate('document.documentElement.scrollWidth > innerWidth')})
  page.locator('.nav-stack [data-view="trading"]').click();page.wait_for_timeout(500);page.screenshot(path='work/v62-mobile-'+lang+'.png')
 page.set_viewport_size({'width':1440,'height':1050});page.locator('#themeBtn').click();page.wait_for_timeout(500);page.screenshot(path='work/v62-final-light.png')
 page.add_script_tag(path='work/node_modules/axe-core/axe.min.js');report['lightA11y']=page.evaluate('async()=>{let r=await axe.run(document.querySelector("#view-trading"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}')
 report['errors']=errors;open('work/v62-browser-results.json','w').write(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 assert not errors,errors
 assert not any(i['overflow'] for i in report['mobile'])
 assert not any(i['violations'] for i in report['a11y'])
 assert not report['lightA11y']
 b.close()
