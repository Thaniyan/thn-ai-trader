"""Confidence restoration: real engine results, lifecycle, responsive EN/AR and axe."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/comprehensive-review'));out.mkdir(parents=True,exist_ok=True)
result={'profiles':[],'errors':[],'data':'Offline provider fixtures; no live performance claims'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:result['errors'].append(str(e)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNConfidence && THNDecision.brief() && THNResearch.series()')
 def go(view):
  page.locator('.nav-stack [data-view='+view+']').click()
  expect(page.locator('#view-'+view)).to_be_visible()
 go('ai');page.locator('[data-cockpit=analyze]').click();page.wait_for_function('document.getElementById("evoDeskRunStatus").textContent.startsWith("Review complete")')
 expect(page.locator('#schoolsGrid')).to_be_visible();assert page.locator('#schoolsGrid .school-card').count()==8
 assert page.evaluate('THNConfidence.review().probability') is None
 page.evaluate('window.__confidenceChart=THNResearch.chart');scenario=page.locator('#confidencePlaybook [data-evo^="scenario:"]').first;expect(scenario).to_be_visible();scenario.click();expect(page.locator('#view-risk')).to_be_visible();assert float(page.locator('#planEntry').input_value())>0;assert page.locator('#planEntry').input_value()!=page.locator('#planStop').input_value();assert page.evaluate('THNDecision.plan()') is None;assert page.evaluate('THNResearch.chart===window.__confidenceChart');go('ai')
 page.locator('[data-cockpit=test]').first.click();expect(page.locator('#qRun')).to_be_visible();assert page.locator('#qBacktestForm fieldset').count()==3
 pending=[];page.route('**/api/research/evaluate',lambda r:pending.append(r));page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus === "running"');page.locator('#qParam_spread').fill('6');response=pending[0].fetch();pending[0].fulfill(response=response);page.wait_for_function('THNConfidence.review().testStatus === "changed"');assert page.evaluate('THNConfidence.review().validationScore') is None;page.unroute('**/api/research/evaluate')
 page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus === "complete"')
 m=page.evaluate('(()=>{const m=THNConfidence.review();return {score:m.validationScore,passed:m.passed,checks:m.checks.length,probability:m.probability};})()')
 assert m['checks']==10 and m['score']==m['passed']*10 and m['probability'] is None
 expect(page.locator('.confidence-checks li')).to_have_count(10)
 page.locator('#qParam_spread').fill('8');assert page.evaluate('THNConfidence.review().testStatus')=='changed';assert page.evaluate('THNConfidence.review().validationScore') is None
 page.route('**/api/research/evaluate',lambda r:r.fulfill(status=503,json={'ok':False,'code':'MARKET_DATA_UNAVAILABLE'}))
 page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus === "failed"');assert page.evaluate('THNConfidence.review().validationScore') is None
 page.unroute('**/api/research/evaluate');page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus === "complete"')
 # Prove context changes cannot attach the retained score to another market.
 page.evaluate('THNContext.set({symbol:"USDJPY"},"confidence-test")');assert page.evaluate('THNConfidence.review().validationScore') is None
 assert page.evaluate('THNConfidence.review().confluence') is None
 page.wait_for_function('THNResearch.series()?.symbol === "USDJPY" && THNDecision.brief()?.symbol === "USDJPY"')
 go('ai');expect(page.locator('[data-cockpit=analyze]')).to_be_enabled();page.locator('[data-cockpit=analyze]').click();page.wait_for_function('THNConfidence.review().analysis?.symbol === "USDJPY" && document.getElementById("evoDeskRunStatus").textContent.startsWith("Review complete")');expect(page.locator('#schoolsGrid')).to_be_visible()
 page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,1024,768,390,240,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
  for view in ['ai','portfolio']:
   go(view);assert not page.evaluate('document.documentElement.scrollWidth > innerWidth+1'),(width,lang,theme,view)
   for selector in ['#analysisCockpit','.confidence-form-group']:
    for node in page.locator(selector).all():
     if node.is_visible():assert node.evaluate('e=>e.scrollWidth <= e.clientWidth+1'),(selector,width,lang,theme,view)
   if view=='ai':expect(page.locator('.cockpit-gauge strong')).to_have_text(str(page.evaluate('THNConfidence.review().confluence')))
   if width in [1440,390]:
    violations=page.evaluate('async()=> (await axe.run(document.querySelector(".view-active"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))')
    assert not violations,(width,lang,theme,view,violations)
    if view=='ai':expect(page.locator('.cockpit-gauge strong')).to_have_text(str(page.evaluate('THNConfidence.review().confluence')))
   result['profiles'].append([width,lang,theme,view])
   if width in [1440,390] and (lang,theme) in [('en','dark'),('ar','light')]:
    page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/('confidence-'+view+'-'+str(width)+'-'+lang+'-'+theme+'.png')))
 assert not result['errors'],result['errors'];b.close()
(out/'confidence-results.json').write_text(json.dumps(result,indent=2));print('PASS confidence lifecycle and',len(result['profiles']),'responsive profiles')
