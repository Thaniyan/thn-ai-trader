"""A+ acceptance uses real original engines; controlled candidate is not a live signal."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work'));out.mkdir(parents=True,exist_ok=True)
result={'profiles':[],'errors':[],'fixture':'Offline provider; controlled retained analysis, original risk calculation.'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:result['errors'].append(str(e)));posts=[];page.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None)
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNPrecision&&THNCommand.state().fresh&&THNDecision.brief()?.frames.length===3');page.locator('.nav-stack [data-view=dashboard]').click();page.evaluate('window.__precisionChart=THNResearch.chart');saved=page.evaluate('JSON.stringify(THNLibrary.entries())')
 assert not page.locator('#commandRationale').evaluate('(e)=>e.open');expect(page.locator('#precisionStatus')).to_have_attribute('data-state','wait');assert page.evaluate('THNPrecision.review().candidate') is None
 page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,1024,768,390,320],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.evaluate('scrollTo({top:0,behavior:"instant"})')
  expect(page.locator('#precisionStatus')).to_have_attribute('data-state','wait');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,lang,theme);assert page.evaluate('THNResearch.chart===window.__precisionChart');assert page.locator('#qCandles').count()==1
  assert page.locator('#deskPrimaryActions button').evaluate_all('(a)=>a.every(b=>b.getBoundingClientRect().height>=44)'),(width,lang,theme)
  for selector in ['#precisionStatus','#precisionSetupDetail','#precisionProbability']:
   bad=page.evaluate('async(s)=>(await axe.run(document.querySelector(s),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>v.id)',selector);assert not bad,(width,lang,theme,selector,bad)
  if width>=1024:
   boxes=page.locator('#commandChartHost,#commandAssessment').evaluate_all('(a)=>a.map(e=>e.getBoundingClientRect().toJSON())');assert boxes[0]['width']>boxes[1]['width'];assert abs(boxes[0]['y']-boxes[1]['y'])<2
  else:
   assert page.locator('#qCandles').bounding_box()['height']>=330
   assert page.locator('#precisionSetupDetail dd').evaluate_all('(a)=>a.every(e=>parseFloat(getComputedStyle(e).fontSize)>=14)')
  result['profiles'].append([width,lang,theme])
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click()
 # Existing pending engine candidate becomes Conditional, not a new eligibility rule.
 def analysis(route):
  response=route.fetch();d=response.json();e=d['entry'];d.update({'decision':'BUY','consensusLabel':'BULLISH','confidence':80,'grade':'A','stopLoss':e-.01,'targets':[e+.002,e+.004,e+.006]});route.fulfill(response=response,json=d)
 def brief(route):
  response=route.fetch();d=response.json();d['complete']=True;d['conflicting']=False
  for f in d['frames']:
   if f['available']:f['trend']='bullish'
  for s in d['scenarios']:
   if s['direction']=='bullish':s.update({'readyForPlanning':True,'trigger':d['selected']['lastCandle']['close'],'invalidation':d['selected']['lastCandle']['close']-.01})
  route.fulfill(response=response,json=d)
 page.route('**/api/analyze',analysis);page.route('**/api/research/brief?**',brief);page.evaluate('THNCommand.pick("GBPUSD")');page.wait_for_function('THNCommand.state().candidate?.symbol==="GBPUSD"');expect(page.locator('#precisionStatus')).to_have_attribute('data-state','conditional');candidate=page.evaluate('THNCommand.state().candidate');assert page.evaluate('THNPrecision.review().candidate')==candidate
 expect(page.locator('#precisionSetupDetail')).to_contain_text('Entry rationale');assert page.evaluate('THNPrecision.review().entryFact.text') in page.evaluate('THNConfidence.review().analysis.schools.flatMap(s=>s.reasons)');assert page.locator('#precisionSetupDetail').evaluate('(e)=>e.previousElementSibling.classList.contains("command-levels")')
 # Copy references is explicit and cannot size or execute; original form alone validates risk.
 before=len(posts);capital=page.locator('#planCapital').input_value();leverage=page.locator('#planLeverage').input_value();page.locator('[data-command=use-levels]').click();expect(page.locator('#planEntry')).to_be_focused();assert len(posts)==before;assert page.locator('#planCapital').input_value()==capital;assert page.locator('#planLeverage').input_value()==leverage
 for key,value in {'planCapital':'10000','planRisk':'1','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+key).fill(value)
 page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()?.inputValid&&THNCommand.state().recommendation.risk==="within_budget"');expect(page.locator('#precisionStatus')).to_have_attribute('data-state','eligible');expect(page.locator('#precisionStatus')).to_contain_text('not an order');assert page.evaluate('THNPrecision.review().probability') is None;assert page.evaluate('THNDecision.plan().executionAuthorized') is False
 # Validated research eligibility survives language/theme/size changes without changing the plan.
 validated=page.evaluate('JSON.stringify(THNDecision.plan())')
 for width,lang,theme in itertools.product([1440,390,320],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);expect(page.locator('#precisionStatus')).to_have_attribute('data-state','eligible');expect(page.locator('#precisionStatus')).to_contain_text('ليس أمراً' if lang=='ar' else 'not an order');expect(page.locator('#commandVerdict h1')).to_contain_text('مؤهل للمراجعة' if lang=='ar' else 'Eligible for review');assert page.evaluate('JSON.stringify(THNDecision.plan())')==validated;assert page.evaluate('THNPrecision.review().candidate')==candidate;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click()
 page.locator('#planCapital').fill('');page.wait_for_function('THNDecision.plan()===null');expect(page.locator('#precisionStatus')).to_have_attribute('data-state','conditional')
 # One research workspace and keyboard focus handoff retain original forms and notes.
 page.locator('[data-precision=notes]').click();expect(page.locator('#commandThesis')).to_be_focused();page.locator('#commandThesis').fill('A+ preserved research draft');page.locator('#commandThesis').press('Escape');expect(page.locator('[data-precision=notes]')).to_be_focused()
 page.locator('[data-precision=risk]').click();expect(page.locator('#commandPlannerTitle')).to_be_focused();page.locator('[data-precision=method]').click();expect(page.locator('#commandSourceTitle')).to_be_focused();assert page.locator('#workRiskForm').count()==1
 for lang in ['ar','en']:
  page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('document.documentElement.dataset.theme="light"');expect(page.locator('#commandThesis')).to_have_value('A+ preserved research draft');assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 # Actual context transition withdraws old levels synchronously, before delayed new analysis.
 held=[];page.route('**/api/analyze',lambda r:held.append(r));page.evaluate('THNCommand.pick("USDJPY")');page.wait_for_function('THNContext.get().symbol==="USDJPY"&&document.getElementById("analyzeBtn").disabled');expect(page.locator('#precisionStatus')).to_have_attribute('data-state','wait');assert page.evaluate('THNPrecision.review().candidate') is None
 for r in held:analysis(r)
 held.clear();page.wait_for_function('THNCommand.state().fresh&&THNDecision.brief()?.symbol==="USDJPY"');expect(page.locator('#precisionStatus')).to_have_attribute('data-state','wait');assert page.locator('#commandSetup .command-levels>div').count()==0 and page.locator('#commandSetup [data-command=use-levels]').count()==0;assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 assert not any('/api/order' in u or '/api/paper/' in u for u in posts);assert not page.evaluate('THNServiceHealth.get().capabilities.liveTrading');assert not page.evaluate('THNServiceHealth.get().capabilities.paperExecution');assert not result['errors'],result['errors'];b.close()
(out/'precision-results.json').write_text(json.dumps(result,indent=2));print('PASS: 20 A+ layout plus12 validated Eligible EN/AR/theme/size profiles, original Conditional→validated Eligible→invalidated lifecycle, sourced reason, keyboard workflow, immutable records and execution restrictions')
