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
 page.locator('#view-ai.view-active #analysisCockpit').get_by_role('button',name='Confidence test',exact=True).click();expect(page.locator('#qRun')).to_be_visible();assert page.locator('#qBacktestForm fieldset').count()==3
 pending=[];page.route('**/api/research/evaluate',lambda r:pending.append(r));page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus === "running"');page.locator('#qParam_spread').fill('6');response=pending[0].fetch();pending[0].fulfill(response=response);page.wait_for_function('THNConfidence.review().testStatus === "changed"');assert page.evaluate('THNConfidence.review().validationScore') is None;page.unroute('**/api/research/evaluate')
 page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus === "complete"')
 m=page.evaluate('(()=>{const m=THNConfidence.review();return {score:m.validationScore,passed:m.passed,checks:m.checks.length,probability:m.probability};})()')
 assert m['checks']==10 and m['score']==m['passed']*10 and m['probability'] is None
 expect(page.locator('.confidence-checks li')).to_have_count(10)
 recorded=page.evaluate('JSON.stringify(THNResearch.evaluation())')
 evaluation=page.evaluate('THNResearch.evaluation()')
 for check in page.evaluate('THNConfidence.review().checks'):
  finding=page.locator('[data-validation-check="'+check['code']+'"]');expect(finding).to_have_attribute('data-pass',str(check['pass']).lower());finding.locator('summary').click();expect(finding.locator('dl')).to_be_visible();assert finding.locator('[data-validation-value]').count()>0
  expect(finding.locator('p').first).not_to_be_empty()
  finding.locator('summary').click()
 def shown(key):return page.locator('[data-validation-value="'+key+'"]')
 def number(value):return page.evaluate('(v)=>Number.isFinite(v)?new Intl.NumberFormat("en-US",{maximumFractionDigits:6}).format(v):"Unavailable"',value)
 for code,keys in [('trade_count',['trades']),('holdout_positive',['returnPct','expectancy']),('development_positive',['returnPct','expectancy']),('expectancy_retained',['averageR'])]:
  finding=page.locator('[data-validation-check="'+code+'"]');finding.locator('summary').click()
  for window in ['development','holdout']:
   for key in keys:expect(finding.locator('[data-validation-value="'+window+'-'+key+'"]')).to_have_text(number(evaluation[window]['metrics'].get(key)))
  finding.locator('summary').click()
 expect(shown('development-period')).to_have_text(page.evaluate('(e)=>[e.development.sample.firstTime,e.development.sample.lastTime].map(v=>new Date(v).toISOString().replace("T"," ").slice(0,19)+" UTC").join(" → ")',evaluation))
 expect(shown('costs')).to_have_text(' / '.join(number(evaluation['parameters'][k]) for k in ['spreadBps','slippageBps','commissionBps']))
 sample=page.locator('[data-validation-check=trade_count]');sample.locator('summary').click();expect(sample.locator('[data-validation-value=minimumTrades]')).to_have_text(number(evaluation['split']['minimumTrades']));sample.locator('[data-validation-control]').click();expect(page.locator('#qMinimumTrades')).to_be_focused();assert page.evaluate('JSON.stringify(THNResearch.evaluation())')==recorded
 sample.locator('summary').click()
 for code in ['cost_robustness','parameter_robustness']:
  finding=page.locator('[data-validation-check="'+code+'"]');finding.locator('summary').click()
  variants=[v for v in evaluation['sensitivity'] if (v['kind']=='parameter')==(code=='parameter_robustness')]
  expect(finding.locator('[data-validation-value=variants]')).to_have_text(str(len(variants)))
  for i,v in enumerate(variants):
   for window in ['development','holdout']:expect(finding.locator('[data-validation-value="variant-'+str(i)+'-'+window+'"]')).to_have_text(number(v[window]['metrics']['returnPct']))
  finding.locator('summary').click()
 for key,metric in [('profitFactor','profitFactor'),('sharpePerBar','sharpePerBar'),('averageR','averageR')]:expect(page.locator('[data-validation-check=defined_metrics] [data-validation-value='+key+']')).to_have_text(number(evaluation['holdout']['metrics'][metric]))
 # Keep open evidence accessible in EN/AR, both themes and narrow layouts.
 page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,768,390,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  for detail in page.locator('.confidence-finding').all():
   if not detail.get_attribute('open')=='' :detail.locator('summary').click()
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),(width,lang,theme)
  expect(page.locator('#confidenceRecordedTitle')).to_have_text('Recorded evaluation evidence' if lang=='en' else 'أدلة التقييم المسجلة')
  if width in [1440,390]:
   violations=page.evaluate('async()=> (await axe.run(document.getElementById("confidenceValidation"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>v.id)');assert not violations,(width,lang,theme,violations)
  assert page.evaluate('JSON.stringify(THNResearch.evaluation())')==recorded
  if (width,lang,theme) in [(1440,'en','dark'),(390,'ar','light')]:page.locator('#confidenceValidation').screenshot(path=str(out/('validation-evidence-'+str(width)+'-'+lang+'.png')))
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click();page.evaluate('document.documentElement.dataset.theme="dark"')

 # Exercise missing fold evidence and insufficient history through the real engine.
 short_start=page.evaluate('(e)=>new Date(e.development.sample.firstTime).toISOString().slice(0,10)',evaluation)
 short_end=page.evaluate('(e)=>new Date(e.development.sample.firstTime+12*86400000).toISOString().slice(0,10)',evaluation)
 page.locator('#qStart').fill(short_start);page.locator('#qEnd').fill(short_end);page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"')
 assert not page.evaluate('THNResearch.evaluation().walkForward.available')
 fold=page.locator('[data-validation-check=walk_consistency]');fold.locator('summary').click();expect(fold.locator('[data-validation-value=walkUnavailable]')).to_contain_text(str(page.evaluate('THNResearch.evaluation().walkForward.requiredEligibleBars')));expect(fold).to_have_attribute('data-pass','false')
 page.locator('#qEnd').fill(short_start);page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="failed"');assert page.evaluate('THNConfidence.review().validationScore') is None;expect(page.locator('.confidence-recorded')).to_contain_text('Retained report, not current validation')
 page.locator('#qStart').fill('');page.locator('#qEnd').fill('');page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"')
 # Unrecognized report labels remain text, even under a hostile response fixture.
 hostile_label='<img src=x onerror="window.__validationInjected=true">'
 def label_fixture(route):
  response=route.fetch();body=response.json();body['sensitivity'][0]['label']=hostile_label;route.fulfill(response=response,json=body)
 page.route('**/api/research/evaluate',label_fixture);page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"')
 hostile=page.locator('[data-validation-check=parameter_robustness]');hostile.locator('summary').click();expect(hostile.locator('dt')).to_contain_text(['Recorded variants',hostile_label,'Development return %','Holdout return %','Higher parameter','Development return %','Holdout return %']);expect(page.locator('#confidenceValidation img')).to_have_count(0);expect(page.locator('#qResult img')).to_have_count(0);assert not page.evaluate('Boolean(window.__validationInjected)')
 page.unroute('**/api/research/evaluate',label_fixture);page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"')
 page.locator('#qParam_spread').fill('8');assert page.evaluate('THNConfidence.review().testStatus')=='changed';assert page.evaluate('THNConfidence.review().validationScore') is None;expect(page.locator('.confidence-recorded')).to_contain_text('Retained report, not current validation')
 page.route('**/api/research/evaluate',lambda r:r.fulfill(status=503,json={'ok':False,'code':'MARKET_DATA_UNAVAILABLE'}))
 page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus === "failed"');assert page.evaluate('THNConfidence.review().validationScore') is None
 page.unroute('**/api/research/evaluate');page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus === "complete"')
 # Prove context changes cannot attach the retained score to another market.
 page.evaluate('THNContext.set({symbol:"USDJPY"},"confidence-test")');assert page.evaluate('THNConfidence.review().validationScore') is None
 assert page.evaluate('THNConfidence.review().confluence') is None;expect(page.locator('#confidenceRecordedTitle')).to_have_count(0);expect(page.locator('[data-validation-check]')).to_have_count(0)
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
