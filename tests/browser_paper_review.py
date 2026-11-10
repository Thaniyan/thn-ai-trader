"""Isolated local paper draft handoff; no model, no order submission, no real account."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import subprocess,tempfile,os,select,json,itertools
root=Path(__file__).resolve().parents[1];os.chdir(root)
out=Path(os.environ.get('PAPER_REVIEW_OUTPUT','work/paper-review'));out.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory(prefix='thn-paper-desk-') as private:
 env={**os.environ,'VERCEL':'','THN_LOCAL_PAPER':'1','THN_AI_ENABLED':'0','THN_DATA_DIR':private}
 server=subprocess.Popen(['node','--import','./tests/risk-provider-fixture.js','tests/packaged-launch.mjs'],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 try:
  assert select.select([server.stdout],[],[],10)[0];line=server.stdout.readline().strip();assert line.startswith('THN_TEST_PORT='),line;url='http://127.0.0.1:'+line.split('=')[1]
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);s=b.new_page(viewport={'width':1440,'height':1000},extra_http_headers={'Authorization':'Bearer test-only-operator-token'});s.route('https://**/*',lambda r:r.abort());risk_requests=[];s.on('request',lambda r:risk_requests.append(r.post_data_json) if r.method=='POST' and r.url.endswith('/api/risk/calculate') else None);financial=[];s.on('request',lambda r:financial.append(r.url) if r.method=='POST' and '/api/orders/' in r.url else None)
   s.goto(url);s.wait_for_function('window.THNEvolution&&THNResearch.series()&&THNDecision.brief()&&THNServiceHealth.get()?.capabilities.paperExecution');s.locator('#evoRunDesk').click();s.wait_for_function('document.getElementById("evoDeskRunStatus").textContent.startsWith("Review complete")',timeout=30000);print(s.evaluate('({outcome:THNIntelligence.result().outcome,fresh:THNIntelligence.result().snapshot.fresh,missing:THNIntelligence.result().snapshot.missing,complete:THNDecision.brief().complete,conflicting:THNDecision.brief().conflicting})'),flush=True)
   assert s.evaluate('THNIntelligence.result().outcome')=='conditional';s.locator('.nav-stack [data-view=risk]').click();close=s.evaluate('THNResearch.series().candles.at(-1).close');s.locator('#planEntry').fill(str(close));s.locator('#planStop').fill(str(close-.001));s.locator('#planTarget').fill(str(close+.002));s.locator('#planSide').select_option('BUY');s.locator('#v75CostInclusive').check();s.locator('#workRiskForm button[type=submit]').click();s.wait_for_function('THNDecision.plan()!==null');s.locator('#evoRisk [data-evo=save-plan]').click();s.wait_for_function('THNLibrary.entries().length===1');s.locator('.nav-stack [data-view=dashboard]').click();s.wait_for_selector('[data-evo=paper-review]');plan=s.evaluate('THNDecision.plan()');s.locator('[data-evo=paper-review]').click();expect(s.locator('#directOrderSymbol')).to_be_visible();assert s.locator('#directOrderSymbol').input_value()==plan['symbol'];assert float(s.locator('#directOrderLots').input_value())==plan['lots'];assert float(s.locator('#directOrderEntry').input_value())==plan['entry'];assert float(s.locator('#directOrderLeverage').input_value())==plan['leverage'];assert not financial
   # A failed or malformed read-only risk response can never imply execution approval.
   for ident,value in {'directOrderLots':'0.10','directOrderEntry':'1.1','directOrderLeverage':'20','directOrderSL':'1.09','directOrderTP':'1.12'}.items():s.locator('#'+ident).fill(value)
   s.route('**/api/risk/calculate',lambda r:r.abort())
   for width,lang,theme in [(1440,'en','dark'),(390,'ar','light')]:
    s.set_viewport_size({'width':width,'height':1000});s.locator('.terminal-topbar [data-language='+lang+']').click()
    if s.locator('html').get_attribute('data-theme')!=theme:s.locator('#themeBtn').click()
    s.locator('#checkOrderRiskBtn').click();expect(s.locator('#directOrderRiskResult')).to_contain_text('لم يصدر أي اعتماد' if lang=='ar' else 'no approval was issued');expect(s.locator('#directOrderRiskResult')).not_to_contain_text('verified');s.locator('#directOrderRiskResult').scroll_into_view_if_needed();assert not s.evaluate('document.documentElement.scrollWidth>innerWidth+1');s.screenshot(path=str(out/f'm1-risk-failure-after-{width}-{lang}-{theme}.png'),animations='disabled')
   s.unroute('**/api/risk/calculate');s.locator('.terminal-topbar [data-language=en]').click()
   if s.locator('html').get_attribute('data-theme')!='dark':s.locator('#themeBtn').click()
   s.set_viewport_size({'width':1440,'height':1000})
   for status,payload in [(503,{'ok':False,'error':'<img src=x onerror=alert(1)>'}),(200,{'ok':True,'metrics':{'requiredMargin':550}}),(200,{'ok':True,'metrics':{'requiredMargin':550,'slDollars':-100,'tpDollars':200,'rrRatio':2}}),(200,{'ok':True,'metrics':{'requiredMargin':'550','slDollars':100,'tpDollars':200,'rrRatio':2}})]:
    s.route('**/api/risk/calculate',lambda r,request,status=status,payload=payload:r.fulfill(status=status,json=payload));s.locator('#checkOrderRiskBtn').click();expect(s.locator('#directOrderRiskResult')).to_contain_text('Risk metrics unavailable or invalid');assert s.locator('#directOrderRiskResult img').count()==0;s.unroute('**/api/risk/calculate')
   s.route('**/api/risk/calculate',lambda r:r.fulfill(status=200,json={'ok':True,'metrics':{'requiredMargin':550,'slDollars':100,'tpDollars':200,'rrRatio':2}}));s.locator('#checkOrderRiskBtn').click();expect(s.locator('#directOrderRiskResult')).to_contain_text('Hypothetical estimate only');expect(s.locator('#directOrderRiskResult')).to_contain_text('$100.00');expect(s.locator('#directOrderRiskResult')).not_to_contain_text('APPROVED');s.unroute('**/api/risk/calculate');assert not financial;assert len(risk_requests)>=7 and all('balance' not in r for r in risk_requests)
   # Actual new contract: known numerical result, EN/AR errors, all responsive themes.
   profiles=[]
   for width,lang,theme in itertools.product([1440,768,390],['en','ar'],['dark','light']):
    s.set_viewport_size({'width':width,'height':1000});s.locator('.terminal-topbar [data-language='+lang+']').click()
    if s.locator('html').get_attribute('data-theme')!=theme:s.locator('#themeBtn').click()
    s.locator('#checkOrderRiskBtn').click();expect(s.locator('#directOrderRiskResult')).to_contain_text('تقدير افتراضي فقط' if lang=='ar' else 'Hypothetical estimate only');expect(s.locator('#directOrderRiskResult')).to_contain_text('١٠٠٫٠٠' if lang=='ar' else '$100.00');expect(s.locator('#directOrderRiskResult')).to_contain_text('٥٥٠٫٠٠' if lang=='ar' else '$550.00')
    if (width,lang,theme) in [(1440,'en','dark'),(390,'ar','light')]:
     s.locator('#directOrderRiskResult').scroll_into_view_if_needed();s.screenshot(path=str(out/f'm3-risk-success-{width}-{lang}-{theme}.png'),animations='disabled')
    s.locator('#directOrderLeverage').fill('-1');expect(s.locator('#directOrderRiskResult')).not_to_be_visible();s.locator('#checkOrderRiskBtn').click();expect(s.locator('#directOrderRiskResult')).to_contain_text('يجب أن تكون الرافعة' if lang=='ar' else 'Leverage must be between')
    s.locator('#directOrderRiskResult').scroll_into_view_if_needed();assert not s.evaluate('document.documentElement.scrollWidth>innerWidth+1');s.screenshot(path=str(out/f'm3-risk-validation-{width}-{lang}-{theme}.png'),animations='disabled')
    s.add_script_tag(path=os.environ['AXE_PATH']);violations=s.evaluate("async()=> (await axe.run(document.querySelector('#view-trading'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))");assert not violations,violations
    profiles.append({'width':width,'language':lang,'theme':theme,'exactRisk':100,'exactMargin':550,'validationLocalized':True,'axeViolations':violations});s.locator('#directOrderLeverage').fill('20')
   # No fallback volume, missing entry, or wrong-side stop can produce metrics.
   s.locator('.terminal-topbar [data-language=en]').click()
   for field,value,message in [('directOrderLots','0','Volume must satisfy'),('directOrderEntry','','Use finite numeric'),('directOrderSL','1.2','For BUY')]:
    old=s.locator('#'+field).input_value();s.locator('#'+field).fill(value);s.locator('#checkOrderRiskBtn').click();expect(s.locator('#directOrderRiskResult')).to_contain_text(message);s.locator('#'+field).fill(old)
   # A late result for old inputs must never replace the current draft.
   held=[];s.route('**/api/risk/calculate',lambda r:held.append(r));s.locator('#checkOrderRiskBtn').click();s.wait_for_function("document.querySelector('#directOrderRiskResult').textContent.includes('Checking')");assert len(held)==1
   response=held[0].fetch();s.locator('#directOrderEntry').fill('1.101');held[0].fulfill(response=response);expect(s.locator('#directOrderRiskResult')).not_to_be_visible();s.unroute('**/api/risk/calculate');s.locator('#directOrderEntry').fill('1.1')
   # Keyboard use and new provider identity clear old estimates without touching records.
   s.locator('#directOrderEntry').focus();s.keyboard.press('Tab');expect(s.locator('#directOrderLeverage')).to_be_focused()
   records=s.evaluate("localStorage.getItem('thn_research_library_v65')");assert records and s.evaluate('THNLibrary.entries().length')==1
   s.locator('#checkOrderRiskBtn').click();expect(s.locator('#directOrderRiskResult')).to_contain_text('Hypothetical estimate only')
   s.evaluate("THNContext.set({symbol:'GBPUSD'},'m3-test')");expect(s.locator('#directOrderRiskResult')).not_to_be_visible();s.locator('#checkOrderRiskBtn').click();expect(s.locator('#directOrderRiskResult')).to_contain_text('Context mismatched');assert s.evaluate("localStorage.getItem('thn_research_library_v65')")==records
   s.evaluate("THNContext.set({symbol:'EURUSD'},'m3-test')");s.wait_for_function("THNResearch.series()?.symbol==='EURUSD' && THNContext.get().datasetId===THNResearch.series().provenance.hash && THNDecision.brief()?.symbol==='EURUSD'")
   assert not financial;assert all(r['entryPrice']==1.1 for r in risk_requests[:7]);assert all('context' in r for r in risk_requests)
   (out/'m3-profiles.json').write_text(json.dumps({'profiles':profiles,'lateResponseRejected':True,'contextMismatchBlocked':True,'recordsUnchanged':True,'submittedOrders':len(financial),'fixture':True},indent=2))
   s.locator('.nav-stack [data-view=risk]').click();s.locator('#planEntry').fill(str(close));s.locator('#planStop').fill(str(close-.001));s.locator('#planTarget').fill(str(close+.002));s.locator('#planSide').select_option('BUY');s.locator('#v75CostInclusive').uncheck();s.locator('#workRiskForm button[type=submit]').click();s.wait_for_function('THNDecision.plan()!==null');assert s.evaluate('THNDecision.plan().plannedStopLossWithCosts>THNDecision.plan().budget');s.locator('.nav-stack [data-view=dashboard]').click();expect(s.locator('[data-evo=paper-review]')).to_have_count(0);print(json.dumps({'localPaperDraft':True,'overBudgetBlocked':True,'submittedOrders':len(financial),'realModelRun':False,'fixture':True}));b.close()
 finally:server.terminate();server.wait(timeout=10)
