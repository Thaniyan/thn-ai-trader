"""Connected desk acceptance. Real local APIs with offline provider fixtures; no model run."""
import os,json,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('ASSISTED_OUTPUT','work/assisted-desk'));out.mkdir(parents=True,exist_ok=True)
checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);s=b.new_page(viewport={'width':1440,'height':1000});errors=[];requests=[]
 s.on('pageerror',lambda e:errors.append(str(e)));s.on('request',lambda r:requests.append((r.method,r.url,r.post_data)));s.route('https://**/*',lambda r:r.abort())
 s.goto(os.environ['TEST_URL']);s.wait_for_function('window.THNIntelligence&&window.THNEvolution&&THNResearch.series()&&THNDecision.brief()')
 def go(view):s.locator('.nav-stack [data-view='+view+']').click();expect(s.locator('#view-'+view)).to_be_visible()
 expect(s.locator('#evoDeskLead #qSymbol')).to_be_visible();expect(s.locator('#evoProviderState')).to_contain_text('model not connected');assert s.locator('#qSymbol').count()==1
 with s.expect_response(lambda r:r.url.endswith('/api/intelligence') and r.request.method=='POST') as review:
  s.locator('#evoRunDesk').click()
 data=review.value.json();assert review.value.status==200 and data['method']=='deterministic' and data['modelCalls']==0 and data['financialExecution'] is False
 assert len(data['roles'])==6;assert all(ref in {r['id'] for r in data['snapshot']['refs']} for role in data['roles'] for ref in role['references'])
 s.wait_for_function('document.getElementById("evoDeskRunStatus").textContent.startsWith("Review complete")');expect(s.locator('#evoAssistantSummary')).to_have_text(data['summary']);expect(s.locator('#evoDecisionDesk')).to_be_focused()
 assert s.locator('#evoDecisionDesk').bounding_box()['y']>=-1
 if data['outcome']=='insufficient':expect(s.locator('#evoDecisionOutcome')).to_contain_text('Wait')
 assert set(s.evaluate('Object.keys(THNIntelligence.state())'))=={'available','hostedDisabled','provider','model','mode','busy','method','language'}
 checks.append('One click -> actual analysis API -> six-role cited deterministic review; no model/financial authority; result receives focus')
 previous_structure=s.evaluate('THNResearch.chart.layers.smc');s.locator('#qCandles').focus();s.keyboard.press('ArrowLeft');assert s.evaluate('THNResearch.chart.offset')>0
 s.locator('#evoDecisionDesk [data-evo="reasoning-chart"]').click();expect(s.locator('#view-trading')).to_be_visible();assert s.locator('#proTerminal').count()==1 and s.locator('#evoDecisionDesk').count()==1
 assert s.evaluate('THNResearch.chart.layers.ema&&THNResearch.chart.layers.levels');expect(s.locator('#qCandles')).to_be_focused();assert s.evaluate('THNResearch.chart.layers.smc')==previous_structure;assert s.evaluate('THNResearch.chart.offset')==0
 checks.append('Same chart and same review node in Terminal; latest matched viewport, actual EMA/level layers and explicit structure preference preserved')
 go('risk');s.locator('#planEntry').fill('1.1');s.locator('#planStop').fill('1.09');s.locator('#planTarget').fill('1.12');s.locator('#planSide').select_option('BUY');s.locator('#workRiskForm button[type=submit]').click();s.wait_for_function('THNDecision.plan()!==null')
 s.locator('[data-decision=planChart]').click();expect(s.locator('#qCandles')).to_be_visible();assert s.evaluate('THNResearch.chart.planLevels.entry')==1.1
 expect(s.locator('#evoDecisionDesk')).to_contain_text('Your validated-input plan');expect(s.locator('#evoDecisionDesk')).to_contain_text(s.evaluate('THNPresentation.price(THNDecision.plan().entry,THNContext.get().symbol)'));assert s.locator('#evoDecisionDesk [data-evo=paper-review]').count()==0
 checks.append('Actual deterministic plan -> original entry/stop/target overlay; hosted paper draft unavailable')
 # A pending old-context response must not become the next instrument's reasoning.
 go('dashboard');held=[];s.route('**/api/intelligence',lambda r:held.append(r));s.locator('#evoRunDesk').click();s.wait_for_function('THNIntelligence.state().busy');assert held
 s.locator('#qSymbol').fill('GBPUSD');s.locator('#qSymbol').press('Tab');s.wait_for_function('THNContext.get().symbol==="GBPUSD"&&THNResearch.series()?.symbol==="GBPUSD"');expect(s.locator('#evoDeskRunStatus')).to_contain_text('Market changed');expect(s.locator('#evoAssistantSummary')).to_contain_text('Run the market review');held[0].abort();s.unroute('**/api/intelligence');expect(s.locator('#evoRunDesk')).to_be_enabled()
 checks.append('Context switch cancels pending review, clears matched explanation and never restores old trade parameters')
 # Rejected analysis cannot reuse a prior successful object as a false new success.
 s.route('**/api/analyze',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"Acceptance provider failure"}'))
 before=len([r for r in requests if r[0]=='POST' and r[1].endswith('/api/intelligence')]);s.locator('#evoRunDesk').click();expect(s.locator('#evoDeskRunStatus')).to_contain_text('Analysis unavailable');assert len([r for r in requests if r[0]=='POST' and r[1].endswith('/api/intelligence')])==before;s.unroute('**/api/analyze')
 checks.append('Failed analysis produces honest unavailable state, not false completion or a second review request')
 # Actual navigation and context controls reflow; no horizontally clipped sections.
 for lang in ['en','ar']:
  s.set_viewport_size({'width':390,'height':844});s.locator('.terminal-topbar [data-language='+lang+']').click()
  if lang=='ar':expect(s.locator('#evoDeskRunStatus')).not_to_contain_text('Analysis unavailable');expect(s.locator('#evoAssistantSummary')).not_to_have_text(data['summary'])
  assert s.locator('.terminal-topbar').bounding_box()['y']<s.locator('.sidebar').bounding_box()['y']
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   nav=s.locator('.nav-stack [data-view='+view+']');r=nav.bounding_box();assert r and r['x']>=-1 and r['x']+r['width']<=391;go(view)
  go('dashboard');expect(s.locator('#evoDeskLead #qSymbol')).to_be_visible();s.screenshot(path=str(out/(lang+'-mobile.png')),full_page=True)
 s.locator('#evoAssistantAccess').click();expect(s.locator('#view-ai')).to_be_visible();expect(s.locator('#i7Question')).to_be_focused();assert s.evaluate('THNContext.get().symbol')=='GBPUSD'
 checks.append('EN/AR mobile branding precedes all nine visible navigation choices; one context input survives view switches')
 assert not any(method=='POST' and ('/api/broker/' in url or '/api/accounts' in url) for method,url,body in requests)
 assert not errors,errors
 b.close()
(out/'results.json').write_text(json.dumps({'checks':checks,'pageErrors':errors,'realModelRun':False,'scope':'Offline provider fixtures, actual local HTTP analysis/planning; no hosted/live financial mutations'},indent=2)+'\n');print(json.dumps({'checks':len(checks),'errors':errors,'realModelRun':False}))
