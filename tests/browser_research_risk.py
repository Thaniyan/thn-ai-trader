"""Saved research -> separate authoritative plan -> immutable comparison; offline data."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
from workspace_controls import control
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/research-risk-20261105'));out.mkdir(parents=True,exist_ok=True)
result={'profiles':[],'errors':[],'source':'Offline provider fixtures; no execution or live broker verification'}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=browser.new_page(viewport={'width':1440,'height':1050});requests=[]
 page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:result['errors'].append(str(e)));page.on('request',lambda r:requests.append((r.method,r.url)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('THNResearch.series()?.symbol==="EURUSD" && THNDecision.brief()?.selected && THNLibrary')
 def go(view):page.locator('.nav-stack [data-view='+view+']').click();expect(page.locator('#view-'+view)).to_be_visible()
 def validate():
  page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()?.inputValid===true && THNDecision.plan().executionAuthorized===false')
 go('portfolio');page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluation()?.available')
 go('risk');page.locator('#planSymbol').select_option('EURUSD');page.locator('#planSide').select_option('BUY')
 for ident,val in {'planCapital':'10000','planRisk':'1','planEntry':'1.1','planStop':'1.09','planTarget':'1.12','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+ident).fill(val)
 page.locator('#d64Target2').fill('1.13');validate();expect(page.locator('#evoRisk [data-evo=save-plan]')).to_be_enabled();page.locator('#evoRisk [data-evo=save-plan]').click();page.wait_for_function('THNLibrary.entries().length===1')
 saved=page.evaluate('THNLibrary.entries()[0]');original=page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)');raw=page.evaluate('localStorage.getItem("thn_research_library_v65")');evaluations=sum('/api/research/evaluate' in url for _,url in requests)
 # Selection must not copy historical prices/capital over existing Risk Desk inputs.
 go('risk');page.locator('#planCapital').fill('15000');go('journal');page.locator('[data-lib-open]').click();page.locator('[data-lib-risk]').click()
 comparison=page.locator('#researchRiskComparison');expect(page.locator('#view-risk')).to_be_visible();expect(comparison.locator('#researchRiskTitle')).to_be_focused();expect(page.locator('#planCapital')).to_have_value('15000')
 expect(comparison).to_contain_text('not a validated scenario');comparison.locator('[data-research-risk=prepare]').click();expect(page.locator('#planCapital')).to_be_focused();expect(page.locator('#planCapital')).to_have_value('15000');expect(page.locator('#planEntry')).to_have_value('1.1');expect(page.locator('#planStop')).to_have_value('1.09');expect(page.locator('#planTarget')).to_have_value('1.12');assert page.evaluate('THNDecision.plan()') is None
 page.wait_for_function('THNResearch.series()?.symbol==="EURUSD" && THNDecision.brief()?.selected')
 page.locator('#planCapital').fill('20000');validate();expect(comparison.locator('#researchRiskStatus')).to_contain_text('Comparable recorded assumptions')
 current=page.evaluate('THNDecision.plan()')
 def delta(key):return comparison.locator('[data-research-risk-row="'+key+'"] [data-research-risk-delta]')
 expect(delta('capital')).to_have_text('10,000');expect(delta('budget')).to_have_text('100');expect(delta('plannedStopLossWithCosts')).to_have_text('100');expect(comparison).to_contain_text('Modeled stop exposure including costs increased')
 assert current['budget']==200 and current['executionAuthorized'] is False
 assert page.evaluate('localStorage.getItem("thn_research_library_v65")')==raw
 # Edits invalidate differences immediately; only the server can provide a replacement.
 page.locator('#planStop').fill('1.095');assert page.evaluate('THNDecision.plan()') is None;expect(delta('capital')).to_have_text('No validated estimate');validate();expect(comparison.locator('#researchRiskStatus')).to_contain_text('Comparable recorded assumptions')
 current=page.evaluate('THNDecision.plan()');expected=page.evaluate('(v)=>new Intl.NumberFormat("en-US",{maximumSignificantDigits:12}).format(v)',current['metrics']['requiredMargin']-saved['record']['plan']['metrics']['requiredMargin']);expect(delta('metrics.requiredMargin')).to_have_text(expected)
 page.route('**/api/research/brief?**',lambda r:r.fulfill(status=503,json={'ok':False,'code':'MARKET_DATA_UNAVAILABLE'}));page.evaluate('THNDecision.reload()');page.wait_for_function('THNDecision.brief()===null && THNDecision.failure()');expect(delta('capital')).to_contain_text('Withheld');expect(comparison).to_contain_text('Matching current market evidence is unavailable')
 page.unroute('**/api/research/brief?**');page.evaluate('THNDecision.reload()');page.wait_for_function('THNDecision.brief()?.selected');expect(comparison.locator('#researchRiskStatus')).to_contain_text('Comparable recorded assumptions')
 page.evaluate('THNContext.set({interval:"15m"},"comparison-regression")');page.wait_for_function('THNResearch.series()?.provenance.interval==="15m" && THNDecision.brief()?.interval==="15m"');expect(comparison).to_contain_text('Selected instrument or timeframe differs');expect(delta('capital')).to_have_text('No validated estimate')
 comparison.locator('[data-research-risk=prepare]').click();page.wait_for_function('THNResearch.series()?.provenance.interval==="1h" && THNDecision.brief()?.interval==="1h"');expect(page.locator('#planCapital')).to_have_value('20000');expect(page.locator('#planStop')).to_have_value('');expect(page.locator('#planEntry')).to_have_value('');expect(page.locator('#planTarget')).to_have_value('');expect(page.locator('#d64Target2')).to_have_value('');page.locator('#planEntry').fill('1.1');page.locator('#planStop').fill('1.095');page.locator('#planTarget').fill('1.12');validate();expect(comparison.locator('#researchRiskStatus')).to_contain_text('Comparable recorded assumptions');expect(delta('targets.1')).to_have_text('New value unavailable')
 page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,768,390,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1050});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  expect(comparison.locator('#researchRiskTitle')).to_have_text('Historical research → new risk scenario' if lang=='en' else 'البحث التاريخي ← سيناريو مخاطر جديد')
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),(width,lang,theme)
  assert comparison.evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(width,lang,theme)
  comparison.locator('.research-risk-table').focus();expect(comparison.locator('.research-risk-table')).to_be_focused()
  if width in [1440,390]:
   violations=page.evaluate('async()=> (await axe.run(document.getElementById("researchRiskComparison"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>v.id)');assert not violations,(width,lang,theme,violations)
  assert page.evaluate('localStorage.getItem("thn_research_library_v65")')==raw
  if (width,lang,theme) in [(1440,'en','dark'),(390,'ar','light')]:comparison.screenshot(path=str(out/('research-risk-'+str(width)+'-'+lang+'.png')))
  result['profiles'].append([width,lang,theme])
 page.set_viewport_size({'width':1440,'height':1050});page.locator('.terminal-topbar [data-language=en]').click();page.evaluate('document.documentElement.dataset.theme="dark"')
 # Escape ends only the comparison and restores access to the untouched report.
 comparison.locator('[data-research-risk=end]').focus();comparison.locator('[data-research-risk=end]').press('Escape');expect(comparison).to_be_hidden();expect(page.locator('#view-journal')).to_be_visible();expect(page.locator('[data-lib-risk]')).to_be_focused()
 assert page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')==original
 # A separately imported claim is never promoted to a trusted risk baseline.
 imported=json.loads(json.dumps(saved));imported['id']='imported-comparison';imported['title']='Unverified comparison';imported['record']['id']='unverified-comparison-record'
 legacy=json.loads(json.dumps(saved));legacy['id']='legacy-comparison';legacy['title']='Legacy without plan';legacy['record']['id']='legacy-comparison-record';legacy['record'].pop('plan')
 backup={'schema':'THN-BACKUP-6.5','library':{'schema':'THN-LIBRARY-6.5','reports':[imported,legacy],'archives':[],'snapshots':[]}}
 control(page,'#d64Import').set_input_files({'name':'comparison-cases.json','mimeType':'application/json','buffer':json.dumps(backup).encode()});page.wait_for_selector('[data-lib=restore]');page.locator('[data-lib=restore]').click();page.wait_for_function('THNLibrary.entries().length===3')
 for title,text in [('Unverified comparison','Imported/unverified research'),('Legacy without plan','No hypothetical plan was retained')]:
  page.locator('.l65-record').filter(has_text=title).locator('[data-lib-open]').click();page.locator('[data-lib-risk]').click();expect(comparison).to_contain_text(text);assert delta('capital').inner_text()!='10,000'
  if title=='Legacy without plan':expect(comparison.locator('[data-research-risk-row=capital] td').nth(0)).to_have_text('Not recorded')
  comparison.locator('[data-research-risk=end]').click();expect(comparison).to_be_hidden()
 assert page.evaluate('(id)=>JSON.stringify(THNLibrary.entries().find(e=>e.id===id).record)',saved['id'])==original
 assert sum('/api/research/evaluate' in url for _,url in requests)==evaluations
 assert page.evaluate('getJournal().length')==0
 assert not result['errors'],result['errors'];browser.close()
(out/'research-risk-results.json').write_text(json.dumps(result,indent=2));print('PASS: historical-to-current risk comparison, immutable records, validation/context guards, imports, cancellation and',len(result['profiles']),'profiles')
