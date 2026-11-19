"""THN identity reconciliation: real catalog/context/level inspection, not new financial engines."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work'));out.mkdir(parents=True,exist_ok=True);result={'profiles':[],'errors':[],'source':'Offline original provider; controlled candidate fixture is not a live signal.'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:result['errors'].append(str(e)));posts=[];page.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None)
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNHeritage&&THNCommand.state().fresh&&THNMarketTerminal.catalog().length');page.locator('.nav-stack [data-view=dashboard]').click();saved=page.evaluate('JSON.stringify(THNLibrary.entries())');page.evaluate('window.__heritageChart=THNResearch.chart')
 expect(page.locator('#commandVerdict')).to_contain_text('AI Decision Center');expect(page.locator('#commandSetup')).to_contain_text('TRADE TICKET');expect(page.locator('#commandVerdict h1')).to_have_text('WAIT');expect(page.locator('#heritageMethod')).to_contain_text('hosted model off');assert page.locator('#commandSetup .command-levels>div').count()==0
 # Confidence review is in the verdict panel, and delegates to the original tester.
 expect(page.locator('#heritageDecisionConfidence')).to_be_visible()
 expect(page.locator('#heritageConfidenceLimits')).to_contain_text('not this individual setup')
 assert page.locator('#heritageConfidenceEvidence').inner_text()=='—' or '/ 100' in page.locator('#heritageConfidenceEvidence').inner_text()
 before_test=len(posts)
 page.locator('#heritageConfidenceTestAction').click()
 expect(page.locator('#trustTestTitle')).to_be_focused()
 assert page.locator('#trustTest').evaluate('(el)=>el.open')
 assert page.locator('#commandRationale').evaluate('(el)=>el.open')
 assert len(posts)==before_test,'Opening historical validation must never submit a test'
 page.locator('#trustTestTitle').press('Escape')
 expect(page.locator('#heritageConfidenceTestAction')).to_be_focused()
 # Real supported catalog selection delegates to the existing context owner.
 page.locator('#heritageMarkets [data-command="pick:GBPUSD"]').click();page.wait_for_function('THNContext.get().symbol==="GBPUSD"&&THNCommand.state().fresh&&THNDecision.brief()?.symbol==="GBPUSD"');expect(page.locator('#commandVerdict .command-kicker')).to_contain_text('GBPUSD');assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 def analysis(route):
  response=route.fetch();d=response.json();e=d['entry'];d.update({'decision':'BUY','consensusLabel':'BULLISH','confidence':80,'grade':'A','stopLoss':e-.01,'targets':[e+.002,e+.004,e+.006]});route.fulfill(response=response,json=d)
 def brief(route):
  response=route.fetch();d=response.json();d['complete']=True;d['conflicting']=False
  for f in d['frames']:
   if f['available']:f['trend']='bullish'
  for s in d['scenarios']:
   if s['direction']=='bullish':s.update({'readyForPlanning':True,'trigger':d['selected']['lastCandle']['close'],'invalidation':d['selected']['lastCandle']['close']-.01})
  route.fulfill(response=response,json=d)
 page.route('**/api/analyze',analysis);page.route('**/api/research/brief?**',brief);page.locator('#heritageMarkets [data-command="pick:EURUSD"]').click();page.wait_for_function('THNCommand.state().candidate?.symbol==="EURUSD"');candidate=page.evaluate('THNCommand.state().candidate');before=len(posts)
 for key,phrase in [('E','not an executable quote'),('SL','gaps and slippage'),('T1','not a partial-exit allocation')]:
  control=page.locator('#commandSetup [data-desk="level:'+key+'"]');control.focus();expect(page.locator('#heritageLevelMeaning')).to_contain_text(phrase);control.press('Enter');expect(control).to_have_attribute('aria-describedby','heritageLevelMeaning');assert page.locator('#commandSetup [aria-describedby=heritageLevelMeaning]').count()==1;assert page.evaluate('THNPrecision.review().candidate')==candidate
 assert len(posts)==before;assert page.evaluate('THNDecision.plan()') is None;assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 page.locator('#commandSetup [data-trust=candidate]').click();expect(page.locator('#trustCandidateTitle')).to_be_focused();assert page.locator('#commandRationale').evaluate('(e)=>e.open');page.locator('#trustCandidateTitle').press('Escape');expect(page.locator('#commandSetup [data-trust=candidate]')).to_be_focused();page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,1024,390,320],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.locator('.nav-stack [data-view=dashboard]').click();expect(page.locator('#heritageMethod')).to_contain_text('النموذج المستضاف غير مفعل' if lang=='ar' else 'hosted model off');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,lang,theme)
  assert page.evaluate('THNResearch.chart===window.__heritageChart');assert page.locator('#qCandles').count()==1;assert page.evaluate('THNCommand.state().candidate')==candidate;assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
  for selector in ['#heritageWelcome','#commandVerdict','#commandSetup']:
   bad=page.evaluate('async(s)=>(await axe.run(document.querySelector(s),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>v.id)',selector);assert not bad,(width,lang,theme,selector,bad)
  if width<901:
   page.locator('#commandChooseButton').click();expect(page.locator('#commandSearch')).to_be_focused();assert page.locator('#commandChooser #heritageMarkets button').count()>0;page.locator('#commandSearch').press('Escape');expect(page.locator('#commandChooseButton')).to_be_focused()
  result['profiles'].append([width,lang,theme])
 # New context must withdraw the original price references and level explanation.
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click()
 # Observe withdrawal at the actual transition, not after a scheduling-dependent
 # round trip: the controlled fixture also permits a NEW valid BTCUSD candidate.
 page.evaluate("()=>{window.__heritageTransition=null;addEventListener('thn:context',()=>{window.__heritageTransition={symbol:THNContext.get().symbol,candidate:THNPrecision.review().candidate,meaning:!!document.getElementById('heritageLevelMeaning')};},{once:true});}")
 page.locator('#heritageMarkets [data-command="pick:BTCUSD"]').click();page.wait_for_function('THNContext.get().symbol==="BTCUSD"&&window.__heritageTransition')
 assert page.evaluate('__heritageTransition.symbol')=='BTCUSD';assert page.evaluate('__heritageTransition.candidate') is None;assert not page.evaluate('__heritageTransition.meaning')
 expect(page.locator('#heritageLevelMeaning')).to_have_count(0);assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 # New completed evidence may qualify; it must never contain the old instrument,
 # dataset or chart identity. No financial result is suppressed to satisfy a test.
 page.wait_for_function('THNCommand.state().fresh&&THNDecision.brief()?.symbol==="BTCUSD"')
 result['instrumentSwitch']={'transition':page.evaluate('__heritageTransition'),'completedCandidate':page.evaluate('THNPrecision.review().candidate')}
 assert page.evaluate('(()=>{const candidate=THNPrecision.review().candidate,c=THNContext.get();return !candidate||candidate.symbol===c.symbol&&candidate.interval===c.interval&&candidate.hash===c.datasetId&&candidate.hash===THNResearch.chart.data.provenance.hash;})()')
 assert not any('/api/order' in u or '/api/paper/' in u for u in posts);assert not page.evaluate('THNServiceHealth.get().capabilities.paperExecution');assert not result['errors'],result['errors'];b.close()
(out/'heritage-results.json').write_text(json.dumps(result,indent=2));print('PASS: catalog-owned selection, recorded level meaning and keyboard/source handoffs,16 EN/AR/theme profiles, immutable records, stale withdrawal and hosted restrictions')
