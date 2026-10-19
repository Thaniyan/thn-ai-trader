"""v6.4 full workflow acceptance; requires local server, Playwright/Chromium and ignored axe-core."""
from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get('TEST_URL','http://127.0.0.1:3024')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1050});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE);page.wait_for_function('window.THNDecision?.brief()?.selected && THNResearch.series()',timeout=45000)
 result={'checks':[],'a11y':[],'mobile':[],'provider':page.evaluate('THNDecision.brief().selected.provenance')}
 assert page.evaluate('THNDecision.brief().claims.every(c=>c.datasetHash.length===64&&c.inputs.close>0)')
 page.locator('#decisionCommand [data-decision="chart"]').click();assert page.locator('#view-trading').is_visible();assert page.evaluate('THNResearch.chart.data.candles.length')>=60
 original=page.evaluate('THNResearch.chart.count');page.locator('#qZoomIn').click();assert page.evaluate('THNResearch.chart.count')<original;page.locator('#qReset').click();page.locator('#qCandles').focus();page.keyboard.press('ArrowLeft');assert page.evaluate('THNResearch.chart.offset')>0;page.keyboard.press('Home');assert page.evaluate('THNResearch.chart.offset')==0;page.keyboard.press('Shift+ArrowLeft');assert 'Open' in page.locator('#qTooltip').inner_text()
 page.locator('[data-qlayer="smc"]').click();assert page.evaluate('THNResearch.chart.layers.smc');page.locator('#qClear').click();page.locator('#qDrawingMode').select_option('line');canvas=page.locator('#qCandles');canvas.click(position={'x':100,'y':100});canvas.click(position={'x':200,'y':150});assert page.evaluate('THNResearch.chart.drawings.length')==1;page.locator('#qAnnotation').fill('Research annotation');page.locator('#qDrawingMode').select_option('note');canvas.click(position={'x':220,'y':160});assert page.evaluate('THNResearch.chart.drawings.length')==2;page.locator('#qUndo').click();assert page.evaluate('THNResearch.chart.drawings.length')==1;page.locator('#qDrawingMode').select_option('pan')
 result['checks'].append('genuine provider brief, traceable frame claims and preserved chart navigation/zoom')
 page.locator('.nav-stack [data-view="portfolio"]').click();page.locator('#qDirection').select_option('long_short');page.locator('#qMinimumTrades').fill('5');page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluation()',timeout=45000)
 assert page.evaluate('THNDecision.quality().checks.length===10');assert page.evaluate('THNDecision.quality().probability===null')
 page.locator('.nav-stack [data-view="ai"]').click();page.locator('#d64Thesis').fill('Research thesis <img src=x onerror=alert(1)>');page.locator('#d64Conclusion').fill('Wait for evidence');page.locator('#d64Notes').fill('User notes remain separate')
 page.locator('#decisionWorkspace [data-decision="save"]').click();page.wait_for_function('JSON.parse(localStorage.getItem("thn_decision_reports_v64")||"[]").length===1');saved=page.evaluate('JSON.parse(localStorage.getItem("thn_decision_reports_v64"))[0]');assert saved['quantitative']['quality']['checks'];assert saved['brief']['selected']['provenance']['hash']==result['provider']['hash']
 with page.expect_download() as d:page.locator('#decisionWorkspace [data-decision="export"]').click()
 exported=json.load(open(d.value.path()));assert exported['records'][0]['quantitative']['holdout']['trades']>=0
 with page.expect_download() as d:page.locator('#decisionWorkspace [data-decision="html"]').click()
 html=open(d.value.path()).read();assert '&lt;img' in html;assert '<img src=x' not in html;assert 'Content-Security-Policy' in html
 page.locator('.nav-stack [data-view="journal"]').click();exported['records'][0]['credentials']={'password':'DROP_ME'};page.locator('#d64Import').set_input_files({'name':'report.json','mimeType':'application/json','buffer':json.dumps(exported).encode()});page.wait_for_timeout(300)
 assert page.evaluate('JSON.parse(localStorage.getItem("thn_decision_reports_v64"))[1].unverified');assert 'DROP_ME' not in page.evaluate('localStorage.getItem("thn_decision_reports_v64")');assert page.locator('#decisionReports img').count()==0
 exported['records'][0]['savedAt']=1e100;page.locator('#d64Import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(exported).encode()});page.wait_for_timeout(200);assert 'rejected' in page.locator('#d64ImportStatus').inner_text()
 page.reload();page.wait_for_function('window.THNDecision?.brief()',timeout=45000);assert page.evaluate('JSON.parse(localStorage.getItem("thn_decision_reports_v64")).length')==2
 result['checks'].append('matched quantitative evidence, saved reports/reload, JSON/HTML export, escaped injection and bounded unverified imports')
 page.locator('.nav-stack [data-view="ai"]').click();scenario=page.locator('[data-brief-plan]');assert scenario.count()>0;scenario.first.click();assert page.locator('#view-risk').is_visible();assert page.locator('#planEntry').input_value();assert page.locator('#planStop').input_value()
 page.locator('#workRiskForm button[type="submit"]').click();page.wait_for_function('THNDecision.plan()',timeout=15000);assert page.evaluate('THNDecision.plan().plannedStopLossWithCosts>=THNDecision.plan().metrics.slDollars')
 page.locator('[data-decision="savePlan"]').click();page.locator('[data-decision="planChart"]').click();assert page.locator('#view-trading').is_visible();assert page.evaluate('THNResearch.chart.planLevels.targets.length')>=1
 page.locator('.nav-stack [data-view="risk"]').click();page.locator('#planRisk').fill('0.5');assert page.evaluate('THNDecision.plan()') is None
 page.evaluate('''(()=>{const native=fetch;window.fetch=(url,options={})=>String(url).endsWith('/api/research/plan')?native(url,options).then(r=>new Promise(resolve=>setTimeout(()=>resolve(r),900))):native(url,options);})()''')
 page.locator('#workRiskForm button[type="submit"]').click();page.locator('#planRisk').fill('0.6');page.wait_for_timeout(1200);assert page.evaluate('THNDecision.plan()') is None
 page.locator('#workRiskForm button[type="submit"]').click();page.wait_for_function('THNDecision.plan()',timeout=15000);page.locator('[data-decision="savePlan"]').click();assert page.locator('[data-plan-delete]').count()==2
 result['checks'].append('scenario-to-risk transfer, server-validated plans, cost-adjusted risk, chart levels and independent saved plan comparison')
 # Old requests ignore abort deliberately: selection identity still guards the response.
 page.evaluate('''(()=>{const native=fetch;window.fetch=(url,options={})=>{if(String(url).includes('/api/research/brief')&&String(url).includes('symbol=EURUSD')){const safe={...options};delete safe.signal;return native(url,safe).then(r=>new Promise(resolve=>setTimeout(()=>resolve(r),900)));}return native(url,options);};})()''')
 page.evaluate('THNDecision.reload()');page.locator('#qSymbol').fill('GBPUSD');page.locator('#qSymbol').press('Tab');page.wait_for_function('THNDecision.brief()?.symbol==="GBPUSD"',timeout=45000);page.wait_for_timeout(1200);assert page.evaluate('THNDecision.brief().symbol')=='GBPUSD';assert page.evaluate('THNDecision.plan()') is None;assert page.evaluate('THNDecision.quality().label')=='insufficient'
 for interval in ['15m','1d','1h']:
  page.locator('#qInterval').select_option(interval);page.wait_for_function('(i)=>THNDecision.brief()?.interval===i',arg=interval,timeout=45000)
 assert page.evaluate('THNContext.get().providerSymbol')
 result['checks'].append('late response protection, context reset and repeated independent timeframe switches')
 # Real provider outage response: no cached brief is presented as current analysis.
 page.route('**/api/research/brief?**',lambda route:route.fulfill(status=503,content_type='application/json',body='{"ok":false,"code":"MARKET_DATA_UNAVAILABLE"}'))
 page.evaluate('THNDecision.reload()');page.wait_for_function('THNDecision.brief()===null');page.wait_for_timeout(350);page.locator('.nav-stack [data-view="ai"]').click();assert 'no substitute' in page.locator('#decisionWorkspace').inner_text();page.unroute('**/api/research/brief?**');page.evaluate('THNDecision.reload()');page.wait_for_function('THNDecision.brief()',timeout=45000)
 result['checks'].append('provider outage removes current intelligence without fabricating evidence')
 views=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']
 for lang in ['en','ar']:
  page.locator('[data-language="'+lang+'"]').first.click();page.wait_for_timeout(300)
  if lang=='ar':assert page.locator('html').get_attribute('dir')=='rtl';assert 'ذكاء تداول' in page.locator('#decisionWorkspace').inner_text()
  page.set_viewport_size({'width':1440,'height':1050});page.add_script_tag(path='work/node_modules/axe-core/axe.min.js')
  for view in views:
   page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(250);v=page.evaluate('async()=>{const r=await axe.run(document.querySelector("#view-"+location.hash.slice(1)),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}');result['a11y'].append({'lang':lang,'view':view,'violations':v})
  page.locator('.nav-stack [data-view="ai"]').click();page.screenshot(path='work/v64-intelligence-'+lang+'.png',full_page=True)
  page.set_viewport_size({'width':390,'height':844})
  for view in views:
   page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(200);result['mobile'].append({'lang':lang,'view':view,'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth')})
  page.locator('.nav-stack [data-view="dashboard"]').click();page.screenshot(path='work/v64-mobile-'+lang+'.png',full_page=True)
 page.set_viewport_size({'width':1440,'height':1050});page.locator('#themeBtn').click();page.wait_for_timeout(400)
 for view in ['dashboard','ai','risk','journal']:
  page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(250);v=page.evaluate('async()=>{const r=await axe.run(document.querySelector("#view-"+location.hash.slice(1)),{runOnly:{type:"tag",values:["wcag2a","wcag2aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}');result['a11y'].append({'lang':'ar-light','view':view,'violations':v})
 page.screenshot(path='work/v64-light.png',full_page=True);result['errors']=errors;open('work/v64-browser-results.json','w').write(json.dumps(result,indent=2));print(json.dumps(result,indent=2));assert not errors;assert not any(v['overflow'] for v in result['mobile']);assert not any(v['violations'] for v in result['a11y']);b.close()
