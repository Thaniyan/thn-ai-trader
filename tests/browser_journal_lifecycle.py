from workspace_controls import control
"""Journal readiness, immediate rendering and persistence using genuine fixture-backed analysis."""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright,expect
from tradingview_protocol import EMBED_URL,TOOLBAR_ONLY
out=pathlib.Path(os.environ.get('PRO_OUTPUT','work/professional'));out.mkdir(parents=True,exist_ok=True)
results={'journeys':[],'layouts':[],'accessibility':[],'errors':[],'zoom':[],'touchTargets':[],'externalWidget':'External TradingView network not asserted by offline protocol tests'}
views=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']
geometry='''() => {const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;let issues=[];if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal page overflow');for(const q of ['.terminal-topbar','.topbar-controls','.language-switch','.nav-stack','.pro-mode-switch','.pro-market-controls']){const p=document.querySelector(q);if(!p||!visible(p))continue;const nodes=[...p.children].filter(e=>visible(e)&&getComputedStyle(e).position!=='absolute');for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(overlap(nodes[i].getBoundingClientRect(),nodes[j].getBoundingClientRect()))issues.push(q+' sibling collision');}return [...new Set(issues)];}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:results['errors'].append(str(e)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNProfessional&&window.THNLibrary&&THNResearch.series()&&THNDecision.brief()');page.wait_for_timeout(700)
 def go(v):
  button=page.locator('.nav-stack [data-view="'+v+'"]');button.focus();button.press('Enter');page.evaluate('scrollTo(0,0)');page.wait_for_timeout(70)
 # Real table -> API -> provider fixture -> provenance -> chart, no fake observations.
 go('markets');page.locator('#r66Search').fill('EURUSD');assert page.locator('#r66Markets tbody tr').count()==1
 page.locator('[data-pro-star="EURUSD"]').click();assert page.locator('[data-pro-star="EURUSD"]').get_attribute('aria-pressed')=='true'
 calls=[];page.on('request',lambda r:calls.append(r.url));page.locator('#proObserve').click();page.wait_for_function('!THNMarketObservations.busy()');assert page.evaluate('THNMarketObservations.get("EURUSD").value.close>0')
 before=len([u for u in calls if '/api/research/series?' in u]);page.locator('#proObserve').click();page.wait_for_function('!THNMarketObservations.busy()');assert len([u for u in calls if '/api/research/series?' in u])==before
 # Full bounded batch: the table does not fetch every catalog row.
 page.locator('#r66Search').fill('');batch=[];active=set();peak=[0]
 def began(r):
  if '/api/research/series?' in r.url:active.add(r);batch.append(r.url);peak[0]=max(peak[0],len(active))
 def ended(r):active.discard(r)
 page.on('request',began);page.on('requestfinished',ended);page.on('requestfailed',ended)
 page.locator('#proObserve').click();page.wait_for_function('!THNMarketObservations.busy()');assert len(batch)<=6 and peak[0]<=2,(len(batch),peak[0])
 page.remove_listener('request',began);page.remove_listener('requestfinished',ended);page.remove_listener('requestfailed',ended)
 page.locator('#r66Search').fill('EURUSD')
 # Public embed script protocol fixture is explicitly not proof of the real remote iframe.
 page.route(EMBED_URL,lambda r:r.fulfill(status=200,content_type='application/javascript',body=TOOLBAR_ONLY));page.locator('[data-pro-tv="EURUSD"]').click();assert page.locator('#chart').is_visible();assert not page.locator('.q-chart-panel').is_visible();page.wait_for_function('window.__widgets?.length>0');config=page.evaluate('__widgets.at(-1)');assert config['symbol']=='FX:EURUSD' and config['interval']=='60' and config['hide_side_toolbar']==False and config['hide_top_toolbar']==False and config['studies']==[] and config['support_host']=='https://www.tradingview.com'
 count=page.evaluate('__widgets.length');page.locator('#loadChartBtn').click();page.wait_for_function('(n)=>__widgets.length===n+1',arg=count);assert page.evaluate('__widgets.at(-1).symbol')=='FX:EURUSD'
 page.locator('#proResearchMode').click();assert page.locator('.q-chart-panel').is_visible()
 control(page,'#qDrawingMode').select_option('horizontal');canvas=page.locator('#qCandles');canvas.scroll_into_view_if_needed();canvas.click(position={'x':150,'y':130});assert page.evaluate('THNResearch.chart.drawings.some(d=>d.type==="horizontal")')
 page.reload();page.wait_for_function('window.THNProfessional&&THNResearch.series()');assert page.evaluate('THNResearch.chart.drawings.some(d=>d.type==="horizontal")')
 go('trading');canvas=page.locator('#qCandles');canvas.focus();page.keyboard.press('ArrowLeft');page.keyboard.press('+');page.keyboard.press('Home')
 assert page.evaluate('THNResearch.chart.offset')==0
 # Explicitly complete original analysis; series readiness alone does not promise it.
 page.locator('#proAnalyzeContext').click();page.wait_for_function('currentAnalysis?.symbol===THNContext.get().symbol&&!document.getElementById("proAnalyzeContext").disabled');go('trading')
 # Genuine deterministic engine -> saved report -> Library; ideas remain unverified.
 page.evaluate('THNLibrary.save(THNDecision.snapshot())');assert page.evaluate('THNLibrary.records().length')>0

 diagnostics=[]
 for lang in ['en','ar']:
  page.locator('.terminal-topbar [data-language="'+lang+'"]').click()
  label='EURUSD · '+('Research idea' if lang=='en' else 'فكرة بحث')
  for populated in [0,35]:
   for iteration in range(5):
    page.evaluate('(n)=>{writeJournal(Array.from({length:n},(_,i)=>({symbol:"OLD"+i,notes:"legacy"})));renderJournal();switchView("trading")}',populated)
    # Hold real analysis requests across reload: reproduce CI latency without fake analysis.
    held=[]
    def hold_analysis(route):held.append(route)
    page.route('**/api/analyze',hold_analysis)
    with page.expect_request(lambda r:'/api/analyze' in r.url and r.method=='POST'):
     page.reload();page.wait_for_function('window.THNProfessional&&window.THNRecords')
    page.wait_for_function('document.getElementById("analyzeBtn").disabled')
    page.locator('.terminal-topbar [data-language="'+lang+'"]').click()
    unavailable=page.evaluate("()=>{const before=localStorage.getItem(journalKey);saveJournal();return {analysisReady:!!currentAnalysis,unchanged:before===localStorage.getItem(journalKey),count:getJournal().length,notice:document.getElementById('statusMsg').textContent,toast:document.getElementById('toastReason').textContent,toastVisible:!document.getElementById('tradeToast').classList.contains('hidden')}}")
    assert not unavailable['analysisReady'] and unavailable['unchanged'] and unavailable['count']==populated,unavailable
    assert unavailable['notice']==('Run analysis first.' if lang=='en' else 'شغّل التحليل أولًا.'),unavailable
    assert unavailable['toastVisible'] and unavailable['toast']==unavailable['notice'],unavailable
    page.unroute('**/api/analyze',hold_analysis)
    for route in held:route.continue_()
    page.wait_for_function('!document.getElementById("analyzeBtn").disabled')
    # Explicit user action runs the authoritative deterministic engine for the current context.
    page.evaluate('switchView("trading")')
    with page.expect_response(lambda r:'/api/analyze' in r.url and r.request.method=='POST') as analysis_response:
     page.locator('#proAnalyzeContext').click()
    assert analysis_response.value.status==200
    page.wait_for_function('currentAnalysis?.symbol===THNContext.get().symbol&&!document.getElementById("proAnalyzeContext").disabled')
    # One JS task: no timer or browser automation delay can hide a stale render.
    state=page.evaluate("()=>{saveJournal();switchView('journal');const rows=getJournal();return {count:rows.length,kind:THNRecords.classify(rows[0]).kind,symbol:rows[0].symbol,selected:THNRecords.select(rows).length,rendered:document.querySelector('.pro-record-row b')?.textContent,stored:JSON.parse(localStorage.getItem(journalKey))[0]}}")
    diagnostics.append({'language':lang,'populated':populated,'iteration':iteration,'unavailable':unavailable,**state})
    print(json.dumps(diagnostics[-1]),flush=True)
    assert state['count']==populated+1 and state['kind']=='research_idea' and state['symbol']=='EURUSD' and state['selected']==0 and state['rendered']==label,state
    expect(page.locator('#proRecords').get_by_text(label,exact=True)).to_be_visible()
    inspect='Inspect original record' if lang=='en' else 'فحص السجل الأصلي'
    page.locator('#proRecords').get_by_role('button',name=inspect,exact=True).first.click()
    assert 'research_idea' in page.locator('#proRecordDetail').inner_text()
    assert state['stored']['verification']=='unverified' and 'pnl' not in state['stored']
    page.reload();page.wait_for_function('window.THNProfessional&&window.THNRecords')
    page.evaluate('switchView("journal")');expect(page.locator('#proRecords').get_by_text(label,exact=True)).to_be_visible()
    assert page.evaluate('THNRecords.select(getJournal()).length')==0
    page.evaluate('deleteJournalTrade(getJournal()[0].id)');expect(page.locator('#proRecords').get_by_text(label,exact=True)).to_have_count(0)
 (out/'journal-lifecycle.json').write_text(json.dumps(diagnostics,indent=2))
 b.close()
