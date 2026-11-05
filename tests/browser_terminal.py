from workspace_controls import control
"""v6.6 real-provider market discovery, browser replay, comparison and reliability acceptance."""
from playwright.sync_api import sync_playwright,expect
import os,json,subprocess,re
BASE=os.environ.get('TEST_URL','http://127.1.0.1:3027')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1600,'height':1050});errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
 page.goto(BASE);page.wait_for_function('window.THNMarketTerminal?.catalog().length && THNDecision.brief()?.selected && THNResearch.series()',timeout=45000)
 result={'checks':[],'a11y':[],'layouts':[],'initialProvider':page.evaluate('THNResearch.series().provenance')}
 page.locator('.nav-stack [data-view="markets"]').click();page.locator('#r66Category').select_option('Index');page.locator('#r66Search').fill('NAS');assert page.locator('[data-r66-select]').count()==1;page.locator('[data-r66-select="NAS100"]').click();page.wait_for_function('THNResearch.series()?.symbol==="NAS100" && THNDecision.brief()?.symbol==="NAS100"',timeout=45000);assert page.evaluate('THNResearch.series().provenance.providerSymbol')=='^NDX';result['nasdaqProvider']=page.evaluate('THNResearch.series().provenance');assert '^NDX' in control(page,'#r66Data').inner_text();page.screenshot(path='work/v66-markets.png',full_page=True)
 page.locator('.q-context [data-qgoto="ai"]').click();page.locator('#decisionWorkspace > details.m65-audit').first.locator(':scope > summary').click();page.locator('[data-evidence-frame="1d"]').click();page.wait_for_function('THNResearch.series()?.provenance.interval==="1d"',timeout=45000);assert page.locator('#view-trading').is_visible();assert page.evaluate('THNContext.get().symbol')=='NAS100';assert 'dataset' in page.locator('#r66ClaimStatus').inner_text() or 'snapshot' in page.locator('#r66ClaimStatus').inner_text()
 page.locator('#qCandles').focus();page.keyboard.press('ArrowLeft');assert page.evaluate('THNResearch.chart.offset')>0;page.keyboard.press('Home');page.keyboard.press('Shift+ArrowLeft');assert 'Open' in page.locator('#qTooltip').inner_text();control(page,'[data-qlayer="smc"]').click();assert page.evaluate('THNResearch.chart.layers.smc');control(page,'#qClear').click();control(page,'#qDrawingMode').select_option('line');page.locator('#qCandles').click(position={'x':100,'y':100});page.locator('#qCandles').click(position={'x':200,'y':160});assert page.evaluate('THNResearch.chart.drawings.length')==1;control(page,'#qDrawingMode').select_option('pan')
 result['checks'].append('curated discovery/search, actual Nasdaq-100 ^NDX observations, independent frame provenance, evidence-to-chart navigation and chart/SMC/drawing keyboard interactions')
 # Return to a liquid genuine dataset for chronological research and saved replay.
 page.locator('#qSymbol').fill('EURUSD');page.locator('#qSymbol').press('Tab');page.locator('#qInterval').select_option('1h');page.wait_for_function('THNDecision.brief()?.symbol==="EURUSD"&&THNDecision.brief()?.interval==="1h"&&THNResearch.series()?.provenance.interval==="1h"',timeout=45000)
 page.locator('.q-context [data-qgoto="portfolio"]').click();control(page,'#qDirection').select_option('long_short');control(page,'#qMinimumTrades').fill('5');control(page,'#qRun').click();page.wait_for_function('THNResearch.evaluation()',timeout=45000);control(page,'#qSaveExperiment').click();page.locator('#m65ReviewEvidence').click();page.locator('#d64Thesis').fill('EURUSD independent timeframe research');page.locator('#d64Conclusion').fill('Recheck costs and gaps before drawing conclusions.');page.locator('#decisionWorkspace [data-decision="save"]').click();page.wait_for_function('THNLibrary.entries().length===1');page.locator('#m65Library').click();page.locator('[data-lib="snapshot"]').click();page.wait_for_function('THNLibrary.state().snapshots.length===1');page.locator('[data-lib-open]').first.click()
 saved_record=page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')
 # Inline Library editors must be discoverable and cancellable without writes.
 library_before=page.evaluate('JSON.stringify(THNLibrary.state())')
 for width,lang,theme in [(1440,'en','dark'),(390,'ar','light'),(160,'ar','dark')]:
  page.set_viewport_size({'width':width,'height':1050});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  for attribute,initial in [('data-lib-edit','#l65Title'),('data-lib-delete','[data-lib="close-editor"]'),('data-lib-drop-snapshot','[data-lib="close-editor"]')]:
   opener=page.locator('['+attribute+']');expect(opener).to_have_count(1)
   if attribute=='data-lib-drop-snapshot' and not opener.is_visible():opener.locator('xpath=ancestor::details[1]').locator(':scope > summary').click()
   opener.click()
   editor=page.locator('#l65Editor');expect(editor).to_have_attribute('role','region');expect(editor).to_have_attribute('aria-label',re.compile('.+'));expect(editor.locator(initial)).to_be_focused()
   if attribute=='data-lib-edit':page.locator('#l65Title').fill('Unsaved temporary title')
   if attribute=='data-lib-delete':expect(editor).to_contain_text(page.evaluate('THNLibrary.entries()[0].title'))
   editor.locator('[data-lib="close-editor"]').click();expect(opener).to_be_focused();expect(editor).to_be_empty();assert page.evaluate('JSON.stringify(THNLibrary.state())')==library_before
   opener.click();editor.locator(initial).press('Escape');expect(opener).to_be_focused();expect(editor).to_be_empty();assert page.evaluate('JSON.stringify(THNLibrary.state())')==library_before
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),(width,lang,attribute)
 page.set_viewport_size({'width':1600,'height':1050});page.locator('.terminal-topbar [data-language=en]').click();page.evaluate('document.documentElement.dataset.theme="dark"');page.locator('[data-lib-open]').click()
 quantitative=page.evaluate('THNLibrary.entries()[0].record.quantitative')
 # Saved validation is immutable evidence, not a new evaluation of current data.
 saved_library=page.evaluate('localStorage.getItem("thn_research_library_v65")');evaluation_calls=sum('/api/research/evaluate' in url for url in requests)
 saved_panel=page.locator('.l65-saved-validation');expect(saved_panel.locator('[data-validation-check]')).to_have_count(10)
 for check in quantitative['quality']['checks']:
  expect(saved_panel.locator('[data-validation-check="'+check['code']+'"]')).to_have_attribute('data-saved-validation-state','passed' if check['pass'] else 'unmet')
 saved_panel.locator('[data-validation-check=walk_consistency] summary').click();expect(saved_panel.locator('[data-validation-value=foldsMissing]')).to_contain_text('Individual fold periods and trade counts were not retained')
 saved_panel.locator(':scope > .q-actions [data-saved-validation-target=l65SavedAssumptions]').click();expect(page.locator('#l65SavedAssumptions')).to_be_focused()
 saved_panel.locator(':scope > .q-actions [data-saved-validation-target=l65SavedAudit]').click();expect(page.locator('#l65SavedAudit')).to_have_attribute('open','');expect(page.locator('#l65SavedAudit')).to_be_focused();page.locator('#l65SavedAudit > summary').click()
 page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in [(w,l,t) for w in [1440,768,390,160] for l in ['en','ar'] for t in ['dark','light']]:
  page.set_viewport_size({'width':width,'height':1050});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  for code in ['trade_count','cost_robustness','walk_consistency']:
   finding=saved_panel.locator('[data-validation-check='+code+']');finding.locator('summary').click()
  expect(saved_panel.locator('#l65ValidationTitle')).to_have_text('Historical validation · saved findings' if lang=='en' else 'التحقق التاريخي · النتائج المحفوظة')
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),(width,lang,theme)
  assert saved_panel.evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(width,lang,theme)
  assert page.evaluate('localStorage.getItem("thn_research_library_v65")')==saved_library
  if width in [1440,390]:
   violations=page.evaluate('async()=> (await axe.run(document.querySelector(".l65-saved-validation"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>v.id)');assert not violations,(width,lang,theme,violations)
  if (width,lang,theme) in [(1440,'en','dark'),(390,'ar','light')]:saved_panel.screenshot(path='work/library-validation-20261105/saved-validation-'+str(width)+'-'+lang+'.png')
 page.set_viewport_size({'width':1600,'height':1050});page.locator('.terminal-topbar [data-language=en]').click();page.evaluate('document.documentElement.dataset.theme="dark"')
 page.evaluate('THNContext.set({symbol:"GBPUSD"},"saved-validation-regression")');page.wait_for_function('THNResearch.series()?.symbol==="GBPUSD" && THNDecision.brief()?.symbol==="GBPUSD"')
 assert page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')==saved_record
 expect(saved_panel).to_contain_text('Saved historical evidence, not current validation');assert page.evaluate('localStorage.getItem("thn_research_library_v65")')==saved_library
 assert sum('/api/research/evaluate' in url for url in requests)==evaluation_calls
 page.evaluate('THNContext.set({symbol:"EURUSD"},"saved-validation-regression")');page.wait_for_function('THNResearch.series()?.symbol==="EURUSD" && THNDecision.brief()?.symbol==="EURUSD"')

 for key in ['returnPct','maxDrawdownPct','trades','profitFactor','averageR','exposurePct']:
  for index,window in enumerate(['development','holdout']):
   expected=page.evaluate('(v)=>Number.isFinite(v)?new Intl.NumberFormat("en-US",{maximumFractionDigits:6}).format(v):"Unavailable"',quantitative[window].get(key))
   expect(page.locator('#l65SavedMetrics [data-saved-metric='+key+'] td').nth(index)).to_have_text(expected)
 expect(page.locator('#l65SavedCosts')).to_have_text(' / '.join(str(quantitative['parameters'][k]) for k in ['spreadBps','slippageBps','commissionBps']))
 expect(page.locator('.l65-saved-results')).to_contain_text('not a current market assessment or an execution record')
 for width in [1440,390,160]:
  for lang in ['en','ar']:
   for theme in ['dark','light']:
    page.set_viewport_size({'width':width,'height':1050});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
    expect(page.locator('#l65SavedResultsTitle')).to_have_text('Saved results & assumptions' if lang=='en' else 'النتائج والافتراضات المحفوظة')
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),(width,lang,theme)
    if width>=390:assert page.locator('.l65-metrics-shell').evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(width,lang,theme)
    page.locator('.l65-metrics-shell').focus();assert page.evaluate('document.activeElement.classList.contains("l65-metrics-shell")')
    assert page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')==saved_record
    if (width,lang,theme) in [(1440,'en','dark'),(390,'ar','light')]:page.locator('.l65-saved-results').screenshot(path='work/saved-review-20261104/summary-'+str(width)+'-'+lang+'-'+theme+'.png')
 page.set_viewport_size({'width':1600,'height':1050});page.locator('.terminal-topbar [data-language=en]').click();page.evaluate('document.documentElement.dataset.theme="dark"')
 result['checks'].append('saved development/holdout metrics and costs equal original report; 12 responsive/theme/language profiles preserve immutable historical evidence')
 market_requests=lambda:len([u for u in requests if any(v in u for v in ['/api/research/series','/api/research/mtf','/api/research/brief'])])
 before=market_requests();page.locator('[data-r66-replay]').click();page.wait_for_function('THNLibrary.entries()[0].reproduction?.status==="reproduced"',timeout=30000);assert market_requests()==before;assert 'recorded metrics and windows match' in page.locator('.r66-replay').inner_text();assert page.locator('.r66-replay').get_by_text('0',exact=True).count()>=1
 page.locator('[data-r66-snapshot-chart]').click();assert page.locator('#r66SavedChart').is_visible();assert page.locator('#r66SavedCanvas').count()==1;page.locator('#r66SavedCanvas').focus();page.keyboard.press('ArrowLeft');page.keyboard.press('Home');page.locator('#r66SavedSMC').click();page.locator('#r66SavedZoom').click();page.locator('#r66SavedReset').click();page.screenshot(path='work/v66-saved-chart.png',full_page=True);page.locator('#r66CloseSnapshot').click()
 page.locator('#m65Library').click();page.locator('[data-lib-open]').first.click()
 with page.expect_download() as d:page.locator('[data-lib="backup"]').click()
 backup=json.load(open(d.value.path()));open('work/v66-library-backup.json','w').write(json.dumps(backup));cli=subprocess.run(['node','scripts/replay-research.mjs','work/v66-library-backup.json'],capture_output=True,text=True);assert cli.returncode==0,cli.stderr;assert json.loads(cli.stdout)['matches']=={'development':True,'holdout':True}
 result['checks'].append('browser/CLI authoritative snapshot replay with exact recorded metrics, no provider refresh, retained historical chart and persisted numerical reproduction status')
 # Imported variants cannot change the original; their source remains unverified.
 original=backup['library']['reports'][0];variants=[]
 for title,change in [('Changed costs',lambda r:r['quantitative']['parameters'].__setitem__('spreadBps',30)),('Unsupported engine',lambda r:r['lineage'].__setitem__('engineVersion','99')),('Missing retained snapshot',lambda r:r['brief']['selected']['provenance'].__setitem__('hash','f'*64))]:
  entry=json.loads(json.dumps(original));entry['id']=title;entry['title']=title;entry.pop('reproduction',None);change(entry['record']);variants.append(entry)
 imported={'schema':'THN-BACKUP-6.5','library':{'schema':'THN-LIBRARY-6.5','reports':variants,'archives':[],'snapshots':[]}}
 control(page,'#d64Import').set_input_files({'name':'cases.json','mimeType':'application/json','buffer':json.dumps(imported).encode()});page.wait_for_selector('[data-lib="restore"]');assert page.evaluate('THNLibrary.entries().length')==1;page.locator('[data-lib="restore"]').click();assert page.evaluate('THNLibrary.entries().length')==4
 def open_case(title):page.locator('.l65-record').filter(has_text=title).locator('[data-lib-open]').click()
 open_case('Changed costs');expect(page.locator('.l65-saved-results')).to_contain_text('Imported / unverified research');page.locator('[data-r66-replay]').click();page.wait_for_function('THNLibrary.entries().find(e=>e.title==="Changed costs").reproduction?.status==="mismatch"',timeout=30000);assert 'Numerical mismatch' in page.locator('.r66-replay').inner_text();assert page.evaluate('THNLibrary.entries().find(e=>e.title==="Changed costs").record.unverified')
 open_case('Unsupported engine');assert page.locator('[data-r66-replay]').is_disabled();assert 'unsupported' in page.locator('.r66-replay').inner_text();open_case('Missing retained snapshot');assert page.locator('[data-r66-replay]').is_disabled();assert 'no fresh data' in page.locator('.r66-replay').inner_text()
 expect(page.locator('#l65SelectedCount')).to_have_text('0 / 4');expect(page.locator('[data-lib=compare]')).to_be_disabled()
 first_pick=page.locator('[data-lib-select]').nth(0);first_pick.check();expect(page.locator('#l65SelectedCount')).to_have_text('1 / 4');expect(page.locator('[data-lib=compare]')).to_be_disabled()
 for checkbox in page.locator('[data-lib-select]').all():checkbox.check()
 expect(page.locator('#l65SelectedCount')).to_have_text('4 / 4');expect(page.locator('#l65CompatibilityHint')).to_contain_text('Different engines')
 page.locator('[data-lib="compare"]').click();assert page.locator('#l65Comparison svg').count()==1;assert 'Different provider snapshots' in page.locator('#l65Comparison').inner_text();assert 'Different engines' in page.locator('#l65Comparison').inner_text();assert 'no strategy ranking' in page.locator('#l65Comparison').inner_text();page.screenshot(path='work/v66-comparison.png',full_page=True)
 result['checks'].append('changed-parameter mismatch, imported/unverified preservation, missing-snapshot and incompatible-engine reasons, and bounded four-case quantitative comparison with incompatible-data warnings')
 selection_storage=page.evaluate('localStorage.getItem("thn_research_library_v65")')
 first_pick.focus();first_pick.press('Space');expect(page.locator('#l65SelectedCount')).to_have_text('3 / 4');expect(page.locator('#l65Comparison svg')).to_have_count(0);expect(page.locator('#l65Comparison')).to_contain_text('Selection changed');expect(first_pick).to_be_focused()
 first_pick.press('Space');page.locator('[data-lib=compare]').click();expect(page.locator('#l65Comparison svg')).to_have_count(1)
 page.locator('[data-lib=clear-selection]').click();expect(page.locator('#l65SelectedCount')).to_have_text('0 / 4');expect(page.locator('[data-lib=compare]')).to_be_disabled();expect(page.locator('#l65Comparison')).to_be_empty()
 for title in ['Changed costs','Unsupported engine']:page.locator('.l65-record').filter(has_text=title).locator('[data-lib-select]').check()
 page.locator('#l65Search').fill('Changed costs');expect(page.locator('#l65SelectedCount')).to_have_text('2 / 4');expect(page.locator('#l65SelectionStatus')).to_contain_text('hidden by filters: 1');expect(page.locator('[data-lib=compare]')).to_be_enabled()
 page.locator('[data-lib=compare]').click();expect(page.locator('#l65Comparison')).to_contain_text('Unsupported engine')
 for width,lang,theme in [(1440,'en','dark'),(390,'ar','light'),(160,'ar','light')]:
  page.set_viewport_size({'width':width,'height':1050});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  expect(page.locator('#l65SelectedCount')).to_have_text('2 / 4');expect(page.locator('#l65CompatibilityHint')).to_contain_text('Different engines' if lang=='en' else 'محركات مختلفة');assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  if width!=160:page.locator('.l65-selection-guide').screenshot(path='work/comparison-selection-20261104/guide-'+str(width)+'-'+lang+'.png')
 page.set_viewport_size({'width':1600,'height':1050});page.locator('.terminal-topbar [data-language=en]').click();page.evaluate('document.documentElement.dataset.theme="dark"')
 page.locator('[data-lib=clear-selection]').click();page.locator('#l65Search').fill('');expect(page.locator('[data-lib-select]:checked')).to_have_count(0);assert page.evaluate('localStorage.getItem("thn_research_library_v65")')==selection_storage
 # Empty search recovery preserves comparison selection, report storage and sort.
 for title in ['Changed costs','Unsupported engine']:page.locator('.l65-record').filter(has_text=title).locator('[data-lib-select]').check()
 page.locator('#l65Sort').select_option('oldest');page.locator('#l65Search').fill('no-saved-report-matches-this-query')
 expect(page.locator('.l65-record')).to_have_count(0);expect(page.locator('.l65-list')).to_contain_text('No reports match these filters')
 expect(page.locator('#l65ResultsCount')).to_have_text('Showing 0 of '+str(page.evaluate('THNLibrary.entries().length'))+' saved reports')
 expect(page.locator('#l65SelectionStatus')).to_contain_text('hidden by filters: 2')
 page.locator('[data-lib=clear-filters]').focus();page.locator('[data-lib=clear-filters]').press('Enter')
 expect(page.locator('#l65Search')).to_be_focused();expect(page.locator('#l65Search')).to_have_value('');expect(page.locator('#l65Sort')).to_have_value('oldest')
 expect(page.locator('.l65-record')).to_have_count(page.evaluate('THNLibrary.entries().length'));expect(page.locator('#l65SelectedCount')).to_have_text('2 / 4')
 expect(page.locator('[data-lib=clear-filters]')).to_be_disabled();assert page.evaluate('localStorage.getItem("thn_research_library_v65")')==selection_storage
 page.locator('#l65Status').select_option('archived');expect(page.locator('.l65-record')).to_have_count(0)
 page.locator('[data-lib=clear-filters]').click();expect(page.locator('#l65Status')).to_have_value('all');page.locator('[data-lib=clear-selection]').click()
 for width,lang,theme in [(1440,'en','dark'),(390,'ar','light'),(160,'ar','light')]:
  page.set_viewport_size({'width':width,'height':1050});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  page.locator('#l65Search').fill('no-saved-report-matches-this-query');expect(page.locator('#l65ResultsCount')).to_contain_text('Showing 0 of' if lang=='en' else 'عرض 0 من')
  expect(page.locator('[data-lib=clear-filters]')).to_have_text('Clear filters' if lang=='en' else 'مسح عوامل التصفية');assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  if width!=160:page.locator('.l65-results-guide').screenshot(path='work/library-discovery-20261104/results-'+str(width)+'-'+lang+'.png')
  page.locator('[data-lib=clear-filters]').click();expect(page.locator('#l65Search')).to_be_focused()
 page.set_viewport_size({'width':1600,'height':1050});page.locator('.terminal-topbar [data-language=en]').click();page.evaluate('document.documentElement.dataset.theme="dark"')
 assert page.evaluate('localStorage.getItem("thn_research_library_v65")')==selection_storage
 result['checks'].append('Library result counts, distinct empty states and keyboard filter recovery preserve sorting, selection and storage across EN/AR layouts')
 result['checks'].append('selection count/limits, hidden filtered selections, shared compatibility guidance, keyboard focus, stale-result invalidation and clear action preserve stored reports')

 # Integrity failure is distinguished before submitting any replay to the server.
 preserved=page.evaluate('localStorage.getItem("thn_research_library_v65")');page.evaluate('()=>{const s=JSON.parse(localStorage.getItem("thn_research_library_v65"));s.snapshots[0].candles[0].volume+=1;localStorage.setItem("thn_research_library_v65",JSON.stringify(s))}');page.reload();page.wait_for_function('window.THNLibrary',timeout=45000);page.locator('#m65Library').click();page.locator('[data-lib-open]').first.click();page.locator('[data-r66-replay]').click();page.wait_for_function('document.querySelector(".r66-replay .q-status").textContent.includes("integrity failure")',timeout=15000);page.evaluate('(raw)=>localStorage.setItem("thn_research_library_v65",raw)',preserved);page.reload();page.wait_for_function('window.THNLibrary&&THNDecision.brief()?.selected',timeout=45000);page.locator('#m65Library').click();page.locator('[data-lib-open]').first.click()
 # A response ignoring AbortSignal must not apply after explicit cancel.
 page.evaluate('''(()=>{const native=fetch;window.originalReplayFetch=native;window.fetch=(url,o={})=>{if(String(url).endsWith('/api/research/replay')){const safe={...o};delete safe.signal;return native(url,safe).then(r=>new Promise(resolve=>{window.releaseReplay=()=>resolve(r)}));}return native(url,o)}})()''');before=page.evaluate('localStorage.getItem("thn_research_library_v65")');page.locator('[data-r66-replay]').click();page.wait_for_function('typeof window.releaseReplay==="function"',timeout=15000);page.locator('[data-r66-cancel]').click();page.evaluate('()=>{window.releaseReplay();window.fetch=window.originalReplayFetch}');page.wait_for_timeout(300);assert 'interrupted' in page.locator('.r66-replay').inner_text();assert page.evaluate('localStorage.getItem("thn_research_library_v65")')==before
 # Genuine retained research remains reproducible while provider endpoints fail.
 page.route('**/api/research/brief?**',lambda route:route.fulfill(status=503,content_type='application/json',body='{"ok":false}'));page.evaluate('THNDecision.reload()');page.wait_for_timeout(350);assert page.evaluate('THNDecision.brief()') is None;page.locator('[data-r66-replay]').click();page.wait_for_function('document.querySelector(".r66-replay .q-status").textContent.includes("Reproduced")',timeout=30000);page.unroute('**/api/research/brief?**');page.evaluate('THNDecision.reload()');page.wait_for_function('THNDecision.brief()',timeout=45000)
 result['checks'].append('tampered-candle integrity failure, interrupted response protection, unchanged records after cancellation and snapshot-only replay during provider failure')
 # A separately generated report with no historical evaluation must show missing results, not invented zero metrics.
 plain=b.new_page();plain.on('pageerror',lambda e:errors.append(str(e)));plain.route('https://**/*',lambda r:r.abort());plain.goto(BASE);plain.wait_for_function('THNDecision.brief()?.selected && THNResearch.series()')
 plain.locator('.nav-stack [data-view=ai]').click();plain.locator('#decisionWorkspace [data-decision=save]').click();plain.wait_for_function('THNLibrary.entries().length===1');plain.locator('#m65Library').click();plain.locator('[data-lib-open]').click()
 assert plain.evaluate('THNLibrary.entries()[0].record.quantitative') is None
 expect(plain.locator('#l65NoEvaluation')).to_contain_text('Missing results are not zero returns');expect(plain.locator('#l65SavedMetrics')).to_have_count(0);expect(plain.locator('[data-saved-validation-state=missing]')).to_have_count(10)
 for count in range(2,6):
  plain.locator('.nav-stack [data-view=ai]').click();plain.locator('#decisionWorkspace [data-decision=save]').click();plain.wait_for_function('(n)=>THNLibrary.entries().length===n',arg=count)
 plain.locator('#m65Library').click();plain_storage=plain.evaluate('localStorage.getItem("thn_research_library_v65")')
 for box in plain.locator('[data-lib-select]').all():box.check()
 expect(plain.locator('#l65SelectedCount')).to_have_text('5 / 4');expect(plain.locator('[data-lib=compare]')).to_be_disabled();expect(plain.locator('#l65SelectionStatus')).to_contain_text('Too many selected')
 plain.locator('[data-lib-select]').nth(4).uncheck();expect(plain.locator('#l65SelectedCount')).to_have_text('4 / 4');expect(plain.locator('[data-lib=compare]')).to_be_enabled()
 plain.locator('[data-lib=clear-selection]').click();expect(plain.locator('[data-lib=compare]')).to_be_disabled();assert plain.evaluate('localStorage.getItem("thn_research_library_v65")')==plain_storage
 # Incomplete but accepted legacy metadata must not turn selection into an unhandled error.
 incomplete=json.loads(json.dumps(backup['library']['reports'][0]));incomplete['id']='incomplete-quality';incomplete['title']='Incomplete quality metadata';incomplete.pop('reproduction',None);incomplete['record']['quantitative']['quality']['checks']='legacy incomplete metadata'
 complete=json.loads(json.dumps(backup['library']['reports'][0]));complete['id']='complete-quality';complete['title']='Good quantitative comparison case';complete.pop('reproduction',None)
 legacy_import={'schema':'THN-BACKUP-6.5','library':{'schema':'THN-LIBRARY-6.5','reports':[incomplete,complete],'archives':[],'snapshots':[]}}
 control(plain,'#d64Import').set_input_files({'name':'legacy-incomplete.json','mimeType':'application/json','buffer':json.dumps(legacy_import).encode()});plain.wait_for_selector('[data-lib=restore]');plain.locator('[data-lib=restore]').click();plain.wait_for_function('THNLibrary.entries().length===7')
 legacy_storage=plain.evaluate('localStorage.getItem("thn_research_library_v65")');plain.locator('.l65-record').filter(has_text='Incomplete quality metadata').locator('[data-lib-select]').check()
 plain.locator('.l65-record').filter(has_text='Good quantitative comparison case').locator('[data-lib-select]').check();expect(plain.locator('#l65SelectedCount')).to_have_text('2 / 4');expect(plain.locator('[data-lib=compare]')).to_be_disabled();expect(plain.locator('#l65CompatibilityHint')).to_contain_text('Compatibility unavailable')
 assert plain.evaluate('localStorage.getItem("thn_research_library_v65")')==legacy_storage
 plain.locator('[data-lib=clear-selection]').click()
 for box in plain.locator('.l65-record').filter(has_not_text='Incomplete quality metadata').locator('[data-lib-select]').all()[:2]:box.check()
 expect(plain.locator('[data-lib=compare]')).to_be_enabled()
 plain.locator('.l65-record').filter(has_text='Incomplete quality metadata').locator('[data-lib-open]').click();expect(plain.locator('[data-saved-validation-state=missing]')).to_have_count(10);expect(plain.locator('.l65-saved-validation')).to_contain_text('Imported / unverified research')
 assert plain.evaluate('localStorage.getItem("thn_research_library_v65")')==legacy_storage
 plain.locator('.l65-record').filter(has_text='Good quantitative comparison case').locator('[data-lib-open]').click();expect(plain.locator('.l65-saved-validation')).to_contain_text('not independently verified');expect(plain.locator('[data-saved-validation-state=passed]')).not_to_have_count(0)
 unknown=json.loads(json.dumps(complete));unknown['id']='unknown-criteria';unknown['title']='Unsupported recorded criteria';unknown['record']['quantitative']['quality']['criteriaVersion']='older-unknown';unknown['record']['quantitative'].pop('sensitivity',None);unknown['record']['quantitative']['walkForward']={'available':True,'folds':[{'fold':'1\" onmouseover=\"window.__savedFoldInjected=true','holdout':{'metrics':{'returnPct':1,'trades':1}}}]}
 unknown_import={'schema':'THN-BACKUP-6.5','library':{'schema':'THN-LIBRARY-6.5','reports':[unknown],'archives':[],'snapshots':[]}}
 control(plain,'#d64Import').set_input_files({'name':'unknown-criteria.json','mimeType':'application/json','buffer':json.dumps(unknown_import).encode()});plain.wait_for_selector('[data-lib=restore]');plain.locator('[data-lib=restore]').click();plain.wait_for_function('THNLibrary.entries().length===8')
 unknown_storage=plain.evaluate('localStorage.getItem("thn_research_library_v65")');plain.locator('.l65-record').filter(has_text='Unsupported recorded criteria').locator('[data-lib-open]').click();expect(plain.locator('[data-saved-validation-state=indeterminate]')).to_have_count(10);expect(plain.locator('.l65-saved-validation [onmouseover]')).to_have_count(0);assert not plain.evaluate('Boolean(window.__savedFoldInjected)')
 plain.locator('[data-validation-check=cost_robustness] summary').click();expect(plain.locator('[data-validation-check=cost_robustness] [data-validation-value=variantsMissing]')).to_contain_text('Stress variants and their assumptions were not retained');expect(plain.locator('.l65-saved-validation')).not_to_contain_text('≤ 40%');assert plain.evaluate('localStorage.getItem("thn_research_library_v65")')==unknown_storage;plain.close()
 # Current risk uses authoritative contract rules; visual alternatives and overlay toggles stay explicit.
 page.locator('.q-context [data-qgoto="ai"]').click();page.locator('[data-brief-plan]').first.click();control(page,'#qRisk_spread').fill('100');control(page,'#qRisk_slippage').fill('100');control(page,'#qRisk_commission').fill('100');page.locator('#workRiskForm button[type="submit"]').click();page.wait_for_function('THNDecision.plan()',timeout=15000);page.locator('[data-decision="savePlan"]').click();assert page.locator('#r66PlanVisual svg').count()==1;assert 'nominal risk budget' in page.locator('#decisionPlans').inner_text();page.locator('[data-decision="planChart"]').click();control(page,'#r66TogglePlan').click();assert page.evaluate('THNResearch.chart.showPlanOverlay') is False;control(page,'#r66TogglePlan').click();assert page.evaluate('THNResearch.chart.showPlanOverlay') is True
 result['checks'].append('authoritative risk-plan costs, explicit exceeded-budget warning, independent plan exposure visualization and chart overlay visibility toggle')
 # Repeated fast selection changes must settle on the newest context.
 for symbol in ['GBPUSD','USDJPY','EURUSD']:
  page.locator('#qSymbol').fill(symbol);page.locator('#qSymbol').press('Tab')
 page.wait_for_function('THNDecision.brief()?.symbol==="EURUSD"&&THNResearch.series()?.symbol==="EURUSD"',timeout=45000);assert page.evaluate('THNContext.get().symbol')=='EURUSD'
 views=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']
 for lang in ['en','ar']:
  page.locator('[data-language="'+lang+'"]').first.click();page.wait_for_timeout(250);page.set_viewport_size({'width':1600,'height':1050});page.add_script_tag(path=os.environ.get('AXE_PATH','work/node_modules/axe-core/axe.min.js'));assert page.request.get(BASE+'/api/health').json()['version'] in page.locator('#modelStatus').inner_text()
  if lang=='ar':assert page.locator('html').get_attribute('dir')=='rtl'
  for view in views:
   page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(200);v=page.evaluate('async()=>{const r=await axe.run(document.querySelector("#view-"+location.hash.slice(1)),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}');result['a11y'].append({'lang':lang,'view':view,'violations':v})
  for width in [390,820,1366]:
   page.set_viewport_size({'width':width,'height':900})
   for view in views:
    page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(150);result['layouts'].append({'lang':lang,'width':width,'view':view,'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth')})
  page.set_viewport_size({'width':1440,'height':1050});page.locator('.nav-stack [data-view="journal"]').click();page.locator('[data-lib-open]').first.click();page.screenshot(path='work/v66-library-'+lang+'.png',full_page=True);page.set_viewport_size({'width':390,'height':844});page.screenshot(path='work/v66-mobile-'+lang+'.png',full_page=True)
 page.set_viewport_size({'width':1440,'height':1050});page.locator('#themeBtn').click();page.wait_for_timeout(400)
 for view in ['dashboard','markets','trading','ai','risk','journal']:
  page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(200);v=page.evaluate('async()=>{const r=await axe.run(document.querySelector("#view-"+location.hash.slice(1)),{runOnly:{type:"tag",values:["wcag2a","wcag2aa"]}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}');result['a11y'].append({'lang':'ar-light','view':view,'violations':v})
 page.screenshot(path='work/v66-light.png',full_page=True);result['errors']=errors;open('work/v66-browser-results.json','w').write(json.dumps(result,indent=2));print(json.dumps(result,indent=2));assert not errors;assert not any(v['overflow'] for v in result['layouts']);assert not any(v['violations'] for v in result['a11y']);b.close()
