from workspace_controls import control
"""Packaged browser trust journey; synthetic prices, no model/broker account."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright
out=pathlib.Path('work/trust');out.mkdir(parents=True,exist_ok=True)
legacy={'id':'legacy-original','date':'2026-01-01','symbol':'EURUSD','decision':'BUY','status':'WIN','pnl':200,'entry':1.1,'exitPrice':1.12,'risk':100,'notes':'Preserve original'}
key='thn_ai_trader_research_journal_v4'
checks=[];scans=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('if(!localStorage.getItem('+json.dumps(key)+'))localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps([legacy],separators=(',',':')))+')')
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNRecords&&window.THNDecision&&currentAnalysis');page.wait_for_timeout(500)
 original=page.evaluate('(k)=>localStorage.getItem(k)',key)
 assert page.evaluate('THNRecords.select(getJournal()).length')==0
 assert page.evaluate('(k)=>localStorage.getItem(k)',key)==original
 page.evaluate('for(let i=0;i<10;i++)saveJournal()')
 ideas=page.evaluate('getJournal().filter(r=>r.kind==="research_idea")');assert len(ideas)==10
 assert all('pnl' not in r and 'status' not in r and 'exitPrice' not in r for r in ideas)
 assert page.evaluate('getJournal().find(r=>r.id==="legacy-original")')==legacy
 checks.append('Ten ideas produce no WIN, exit or realized profit; legacy bytes interpreted without promotion')
 page.locator('.nav-stack [data-view="portfolio"]').click()
 assert page.locator('#kpiNetPnl').text_content()=='Unavailable'
 def capture_outcome(path):
  page.evaluate('''() => {const e=document.querySelector('#performanceAnalytics'),h=document.querySelector('.terminal-topbar').getBoundingClientRect().height;for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;document.documentElement.style.scrollBehavior='auto';e.style.scrollMarginTop=(h+25)+'px';e.scrollIntoView({block:'start',behavior:'instant'})}''')
  page.wait_for_timeout(800);page.screenshot(path=str(path))
 capture_outcome(out/'verified-unavailable.png')
 page.locator('#openLogTradeModalBtn').click()
 for id,value in {'manualSymbol':'EURUSD','manualEntry':'1.1','manualExit':'1.12','manualPnl':'200','manualRisk':'100','manualDate':'2026-01-02'}.items():page.locator('#'+id).fill(value)
 page.locator('#logTradeForm button[type="submit"]').click()
 assert page.locator('#kpiNetPnl').text_content()=='Unavailable'
 control(page,'#trustPerformanceSource').select_option('manual');assert page.locator('#kpiNetPnl').text_content()=='+$200.00'
 assert page.locator('#kpiProfitFactor').text_content()=='—'
 assert 'capital basis' in page.locator('#kpiNetPnlPct').text_content()
 assert 'unverified' in page.locator('#trustPerformanceState').inner_text() or 'No broker verification' in page.locator('#trustPerformanceState').inner_text()
 control(page,'#trustPerformanceSource').select_option('verified');assert page.locator('#kpiNetPnl').text_content()=='Unavailable'
 assert page.locator('#donutWinCount').text_content()=='Unavailable'
 checks.append('Manual outcome requires explicit fields, stays unverified, excluded by default; no fake capital/PF')
 # Actual file import preview and atomic failure; original data remains untouched.
 page.locator('.nav-stack [data-view="journal"]').click();page.locator('#m65JournalLegacy > summary').click();page.locator('#journalBulkImportBtn').click()
 before=page.evaluate('(k)=>localStorage.getItem(k)',key)
 page.locator('#csvFileInput').set_input_files({'name':'bad.csv','mimeType':'text/csv','buffer':b'symbol\nEURUSD'})
 page.wait_for_timeout(200);assert page.locator('#confirmBulkImportBtn').is_disabled()
 assert page.evaluate('(k)=>localStorage.getItem(k)',key)==before
 csv=b'date,symbol,decision,entry,exitPrice,risk,pnl,currency,kind,notes\n2026-01-01,EURUSD,SELL,1.12,1.1,100,50,USD,closed_trade,<img src=x onerror=window.__trustXss=1>'
 page.locator('#csvFileInput').set_input_files({'name':'reported.csv','mimeType':'text/csv','buffer':csv})
 page.wait_for_function('!document.querySelector("#confirmBulkImportBtn").disabled');page.locator('#confirmBulkImportBtn').click()
 assert page.evaluate('THNRecords.select(getJournal(),"import").length')==1
 assert page.evaluate('window.__trustXss||null') is None
 assert page.evaluate('getJournal().find(r=>r.id==="legacy-original")')==legacy
 with page.expect_download() as dl:page.locator('#exportJournalBtn').click()
 backup=json.loads(pathlib.Path(dl.value.path()).read_text());assert backup['schema']=='THN-RECORDS-1'
 assert legacy in backup['records'];assert page.evaluate('(s)=>THNRecords.parseBackup(s).records.filter(r=>THNRecords.classify(r).verification!=="unverified").length',json.dumps(backup))==0
 # Restore preview appends unverified interpretations; an interrupted replacement file invalidates it.
 page.locator('#journalBulkImportBtn').click()
 page.locator('#csvFileInput').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
 page.wait_for_function('!document.querySelector("#confirmBulkImportBtn").disabled')
 before=page.evaluate('(k)=>localStorage.getItem(k)',key)
 page.locator('#csvFileInput').set_input_files({'name':'interrupted.json','mimeType':'application/json','buffer':b'{"schema":"THN-RECORDS-1","records":['})
 page.wait_for_timeout(200);assert page.locator('#confirmBulkImportBtn').is_disabled()
 assert page.evaluate('(k)=>localStorage.getItem(k)',key)==before
 page.locator('#csvFileInput').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
 page.wait_for_function('!document.querySelector("#confirmBulkImportBtn").disabled');page.locator('#confirmBulkImportBtn').click()
 assert page.evaluate('getJournal().find(r=>r.id==="legacy-original")')==legacy
 assert page.evaluate('THNRecords.select(getJournal()).length')==0
 checks.append('File preview rejects incomplete CSV atomically; append/JSON export preserve old records and no verification authority')
 # Library compatibility remains the established report shape, not journal performance.
 page.evaluate('THNLibrary.save(THNDecision.snapshot())')
 assert page.evaluate('THNLibrary.records().length')>=1
 library=page.evaluate('JSON.stringify(localStorage.getItem("thn_research_library_v65"))')
 page.reload();page.wait_for_function('window.THNRecords&&window.THNLibrary')
 assert page.evaluate('JSON.stringify(localStorage.getItem("thn_research_library_v65"))')==library
 page.locator('#performanceAnalytics').evaluate("e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true}")
 checks.append('Existing research Library survives reload unchanged')
 source=pathlib.Path(os.environ['AXE_PATH']).read_text();page.add_script_tag(content=source)
 for language,theme,width in itertools.product(['en','ar'],['dark','light'],[1440,820,390]):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+language+'"]').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  assert ('غير موثقة' if language=='ar' else 'unverified') in page.locator('#trustPerformanceSource').inner_text()
  for view in ['dashboard','risk','portfolio','journal','ai']:
   button=page.locator('.nav-stack [data-view="'+view+'"]');button.focus();button.press('Enter');page.wait_for_timeout(200)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('.nav-stack [data-view="portfolio"]').focus();page.keyboard.press('Enter');control(page,'#trustPerformanceSource').select_option('manual');page.wait_for_timeout(600)
  assert ('غير موثقة' if language=='ar' else 'unverified') in page.locator('#trustPerformanceSource').inner_text()
  violations=page.evaluate('''async()=> (await axe.run(document.querySelector('#view-portfolio'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))''')
  scans.append({'language':language,'theme':theme,'width':width,'violations':violations})
  if width in [1440,390] and ((language,theme)==('en','dark') or (language,theme)==('ar','light')):capture_outcome(out/f'outcomes-{language}-{theme}-{width}.png')
 assert not any(v['violations'] for v in scans),scans
 # A corrupt journal cannot be silently repaired or overwritten by a new idea.
 page.evaluate('(k)=>localStorage.setItem(k,"{interrupted")',key);page.evaluate('saveJournal()')
 assert page.evaluate('(k)=>localStorage.getItem(k)',key)=='{interrupted'
 assert not errors,errors
 (out/'browser-results.json').write_text(json.dumps({'checks':checks,'a11y':scans,'errors':errors,'fixtureOnly':True},indent=2))
 print('PASS: trust journal/source/import/Library journeys; 12 populated Portfolio accessibility profiles; no real execution/model')
 b.close()
