from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get('TEST_URL','http://127.0.0.1:3021')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1050});errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
 page.goto(BASE);page.wait_for_function('window.THNResearch?.series() && THNContext.get().datasetId',timeout=40000)
 report={'checks':[],'a11y':[],'mobile':[],'data':page.evaluate('THNResearch.series().provenance')}
 initial=len([r for r in requests if '/api/research/series' in r]);page.evaluate('THNContext.set({strategy:{name:"ema",direction:"long_short"}},"test")');page.wait_for_timeout(200);assert len([r for r in requests if '/api/research/series' in r])==initial
 page.locator('.nav-stack [data-view="portfolio"]').click();page.locator('#qDirection').select_option('long_short');page.locator('#qMinimumTrades').fill('5');page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluation()',timeout=40000)
 first=page.evaluate('THNResearch.evaluation()');assert first['development']['sample']['lastTime']<first['holdout']['sample']['firstTime'];assert first['limits']['runsExecuted']<=18
 report['realEvaluation']={'dataset':first['dataset'],'development':first['development']['metrics'],'holdout':first['holdout']['metrics'],'split':first['split']}
 page.locator('#qSaveExperiment').click();page.locator('#qDirection').select_option('short_only');page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluation().parameters.direction==="short_only"',timeout=40000);page.locator('#qSaveExperiment').click()
 for box in page.locator('[data-experiment]').all():box.check()
 page.locator('#qCompareExperiments').click();assert page.locator('#q63Comparison svg').count()==1
 page.locator('#qResult').screenshot(path='work/v63-report.png');page.locator('#q63Comparison').screenshot(path='work/v63-comparison.png')
 report['checks'].append('real chronological reports, directional strategies, bounded sensitivity, walk-forward and two-run comparison')
 with page.expect_download() as downloaded:page.locator('#qExport').click()
 exported=json.load(open(downloaded.value.path()));assert exported['evaluation']['split'];assert exported['context']['datasetId']==exported['evaluation']['dataset']['hash'];assert 'credentials' not in json.dumps(exported).lower()
 with page.expect_download() as downloaded:page.locator('#qExportExperiments').click()
 records=json.load(open(downloaded.value.path()));records['records'][0]['credentials']={'apiToken':'DO_NOT_RETAIN'}
 page.locator('#qImportExperiments').set_input_files({'name':'experiments.json','mimeType':'application/json','buffer':json.dumps(records).encode()});page.wait_for_timeout(300)
 assert page.locator('[data-experiment]').count()==4;stored=page.evaluate('localStorage.getItem("thn_experiments_v63")');assert 'DO_NOT_RETAIN' not in stored;assert 'Imported — unverified' in page.locator('#q63Runs').inner_text()
 records['records'][0]['holdout']['sample']['firstTime']=1e100
 page.locator('#qImportExperiments').set_input_files({'name':'malformed.json','mimeType':'application/json','buffer':json.dumps(records).encode()});page.wait_for_timeout(200);assert 'Import rejected' in page.locator('#q63StorageStatus').inner_text()
 report['checks'].append('complete export, bounded experiment import, unverified labeling, credential-field stripping and invalid timestamp rejection')
 page.locator('#qRecordConclusion').click();assert page.locator('#view-journal').is_visible();assert first['dataset']['hash'] in page.locator('#qNoteBody').input_value();page.locator('#qNoteForm button').click();notes=page.evaluate('JSON.parse(localStorage.getItem("thn_research_notes_v62"))');assert notes[-1]['evaluation']['holdout']['trades']>=0
 report['checks'].append('evaluation conclusions and dataset identity attach to browser-local journal')
 page.locator('.nav-stack [data-view="portfolio"]').click()
 page.evaluate('''(()=>{const native=window.fetch;window.fetch=(url,options={})=>{if(String(url).includes('/api/research/evaluate')&&JSON.parse(options.body||'{}').symbol==='EURUSD'){const safe={...options};delete safe.signal;return native(url,safe).then(r=>new Promise(resolve=>setTimeout(()=>resolve(r),900)));}return native(url,options);};})()''')
 page.locator('#qRun').click();page.locator('#qSymbol').fill('GBPUSD');page.locator('#qSymbol').press('Tab');page.wait_for_function('THNResearch.series()?.symbol==="GBPUSD"',timeout=40000);page.wait_for_timeout(1300);assert page.evaluate('THNContext.get().symbol')=='GBPUSD';assert page.evaluate('THNResearch.evaluation().symbol')=='EURUSD';assert 'Previous report retained' in page.locator('#qResult').inner_text()
 page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluation()?.symbol==="GBPUSD"',timeout=40000);assert page.evaluate('THNContext.get().datasetId===THNResearch.evaluation().dataset.hash')
 report['checks'].append('late old evaluation cannot overwrite a newer selection; prior work is retained explicitly')
 page.locator('.nav-stack [data-view="risk"]').click();page.locator('#planCapital').fill('20000');page.locator('#planRisk').fill('0.5');page.locator('#planLeverage').fill('10');page.locator('.q-context [data-qgoto="portfolio"]').click();assert page.locator('#qParam_capital').input_value()=='20000';assert page.locator('#qParam_riskPct').input_value()=='0.5';assert page.locator('#qParam_leverage').input_value()=='10'
 report['checks'].append('Risk Desk assumptions transfer to research without account balances or extra chart reloads')
 page.locator('[data-language="ar"]').first.click();page.wait_for_timeout(400);assert page.locator('html').get_attribute('dir')=='rtl';assert page.locator('.q-lab h2').inner_text()=='منصة تقييم الاستراتيجيات'
 page.evaluate('openBrokerDocsModal()');assert 'لا تدخل كلمات مرور' in page.locator('#qualityHelp').inner_text();page.locator('#qCloseQualityHelp').click()
 for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
  page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(450)
  page.add_script_tag(path='work/node_modules/axe-core/axe.min.js');v=page.evaluate('async()=>{const r=await axe.run(document.querySelector("#view-"+location.hash.slice(1)),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}');report['a11y'].append({'view':view,'violations':v})
 page.locator('.nav-stack [data-view="portfolio"]').click();page.screenshot(path='work/v63-arabic.png')
 for lang in ['ar','en']:
  page.locator('[data-language="'+lang+'"]').first.click();page.set_viewport_size({'width':390,'height':844})
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(450);report['mobile'].append({'lang':lang,'view':view,'overflow':page.evaluate('document.documentElement.scrollWidth > innerWidth')})
  page.locator('.nav-stack [data-view="portfolio"]').click();page.wait_for_timeout(400);page.screenshot(path='work/v63-mobile-'+lang+'.png')
 page.set_viewport_size({'width':1440,'height':1050});page.locator('#themeBtn').click();page.wait_for_timeout(400);page.add_script_tag(path='work/node_modules/axe-core/axe.min.js');report['lightA11y']=page.evaluate('async()=>{const r=await axe.run(document.querySelector("#view-portfolio"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}');page.screenshot(path='work/v63-light.png')
 report['errors']=errors;open('work/v63-browser-results.json','w').write(json.dumps(report,indent=2));print(json.dumps(report,indent=2));assert not errors;assert not any(v['overflow'] for v in report['mobile']);assert not any(v['violations'] for v in report['a11y']);assert not report['lightA11y'];b.close()
