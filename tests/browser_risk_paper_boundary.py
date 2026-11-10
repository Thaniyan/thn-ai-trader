"""PR17 review: explicit preview/account boundary; isolated local synthetic paper only."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import os,subprocess,tempfile,select,json,re
root=Path(__file__).resolve().parents[1];os.chdir(root)
out=Path(os.environ.get('RISK_BOUNDARY_OUTPUT','work/risk-paper-boundary'));out.mkdir(parents=True,exist_ok=True)
results={'scope':'Synthetic local paper only; no broker or model','profiles':[]}
def start(private,mode='up'):
 env={**os.environ,'VERCEL':'','THN_LOCAL_PAPER':'1','THN_AI_ENABLED':'0','THN_DATA_DIR':private,'TEST_PROVIDER_MODE':mode}
 server=subprocess.Popen(['node','--import','./tests/risk-provider-fixture.js','tests/packaged-launch.mjs'],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 assert select.select([server.stdout],[],[],10)[0];line=server.stdout.readline().strip();assert line.startswith('THN_TEST_PORT='),line
 return server,'http://127.0.0.1:'+line.split('=')[1]
def ticket(page,url,lang='en',width=1440):
 page.set_viewport_size({'width':width,'height':1050});page.route('https://**/*',lambda r:r.abort());page.goto(url)
 page.wait_for_function('THNResearch.series()&&THNContext.get().datasetId&&THNServiceHealth.get()?.capabilities.paperExecution')
 page.locator('.nav-stack [data-view=trading]').click();page.locator('#proTradingArchive > summary').click();page.locator('#view-trading .subtab-btn[data-subtab=ticket]').click()
 page.locator('.terminal-topbar [data-language='+lang+']').click()
 if lang=='ar' and page.locator('html').get_attribute('data-theme')!='light':page.locator('#themeBtn').click()
 for ident,value in {'directOrderSymbol':'EURUSD','directOrderSide':'BUY'}.items():page.locator('#'+ident).select_option(value)
 for ident,value in {'directOrderLots':'0.10','directOrderEntry':'1.1','directOrderLeverage':'2000','directOrderSL':'1.08','directOrderTP':'1.12'}.items():page.locator('#'+ident).fill(value)
 expect(page.locator('#directOrderBoundary')).to_contain_text('1:2000');expect(page.locator('#directOrderBoundary')).to_contain_text(re.compile(r'1:200(?![0-9])'))
with tempfile.TemporaryDirectory(prefix='thn-boundary-review-') as private:
 server,url=start(private)
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
   for lang,width in [('en',1440),('ar',390)]:
    page=browser.new_page();orders=[];previews=[];errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:orders.append(r.post_data_json) if r.url.endswith('/api/orders/execute') and r.method=='POST' else None);page.on('request',lambda r:previews.append(r.post_data_json) if r.url.endswith('/api/risk/calculate') and r.method=='POST' else None)
    ticket(page,url,lang,width)
    expect(page.locator('#directOrderBoundary')).to_contain_text('الرافعتان مختلفتان' if lang=='ar' else 'Leverage differs')
    expect(page.locator('#directOrderBoundary')).to_contain_text('قد يختلف السعر عن الدخول الافتراضي' if lang=='ar' else 'price may differ from the hypothetical entry')
    page.locator('#checkOrderRiskBtn').click();expect(page.locator('#directOrderRiskResult')).to_contain_text('تقدير افتراضي فقط' if lang=='ar' else 'Hypothetical estimate only');assert not orders
    assert previews[-1]['leverage']==2000;assert previews[-1]['entryPrice']==1.1
    # Empty fields are explicit missing values, never silently coerced/defaulted.
    for field in ['directOrderEntry','directOrderLeverage','directOrderTP']:
     old=page.locator('#'+field).input_value();page.locator('#'+field).fill('');page.locator('#checkOrderRiskBtn').click();expect(page.locator('#directOrderRiskResult')).to_contain_text('لا تُقبل الحقول الفارغة' if lang=='ar' else 'blank inputs are not values')
     name={'directOrderEntry':'entryPrice','directOrderLeverage':'leverage','directOrderTP':'takeProfit'}[field];assert previews[-1][name] is None
     page.locator('#executeDirectOrderBtn').click();expect(page.locator('#tradeExecutionModal')).not_to_be_visible();assert not orders;page.locator('#'+field).fill(old)
    # Delayed results cannot survive a language change, account availability change or context switch.
    for change in ['language','context','account']:
     held=[];page.route('**/api/risk/calculate',lambda r:held.append(r));page.locator('#checkOrderRiskBtn').click();page.wait_for_function("document.getElementById('directOrderRiskResult').textContent.includes('…')");assert len(held)==1;response=held[0].fetch()
     if change=='language':page.locator('.terminal-topbar [data-language='+('ar' if lang=='en' else 'en')+']').click()
     elif change=='context':page.evaluate("THNContext.set({symbol:'GBPUSD'},'review-test')")
     else:
      page.route('**/api/broker/accounts',lambda r:r.fulfill(status=503,json={'ok':False}));page.evaluate('loadBrokerAccountsFromServer()');expect(page.locator('#directOrderBoundary')).to_contain_text('غير متاحة' if lang=='ar' else 'unavailable')
     held[0].fulfill(response=response);expect(page.locator('#directOrderRiskResult')).not_to_be_visible();page.unroute('**/api/risk/calculate')
     if change=='language':page.locator('.terminal-topbar [data-language='+lang+']').click()
     elif change=='context':page.evaluate("THNContext.set({symbol:'EURUSD'},'review-test')");page.wait_for_function("THNResearch.series()?.symbol==='EURUSD' && THNContext.get().datasetId===THNResearch.series()?.provenance.hash && THNDecision.brief()?.symbol==='EURUSD'")
     else:page.unroute('**/api/broker/accounts');page.evaluate('loadBrokerAccountsFromServer()');expect(page.locator('#directOrderBoundary')).to_contain_text(re.compile(r'1:200(?![0-9])'))
    # Network/provider unavailability never leaves a valid estimate behind.
    page.route('**/api/risk/calculate',lambda r:r.fulfill(status=503,json={'ok':False,'messages':{'en':'Current market evidence could not be verified.','ar':'تعذر التحقق من أدلة السوق الحالية.'}}));page.locator('#checkOrderRiskBtn').click();expect(page.locator('#directOrderRiskResult')).to_contain_text('تعذر التحقق' if lang=='ar' else 'could not be verified');page.unroute('**/api/risk/calculate')
    # Matching preview leverage is equally explicit; neither preview can place an order.
    page.locator('#directOrderLeverage').fill('200');page.locator('#checkOrderRiskBtn').click();expect(page.locator('#directOrderRiskResult')).to_contain_text('تقدير افتراضي فقط' if lang=='ar' else 'Hypothetical estimate only');expect(page.locator('#directOrderBoundary')).not_to_contain_text('الرافعتان مختلفتان' if lang=='ar' else 'Leverage differs');assert not orders
    page.locator('#directOrderLeverage').fill('2000');page.locator('#checkOrderRiskBtn').click();expect(page.locator('#directOrderRiskResult')).to_contain_text('1:2000')
    page.locator('#executeDirectOrderBtn').click();expect(page.locator('#tradeExecutionModal')).to_be_visible();expect(page.locator('#paperReviewTitle')).to_have_text('مراجعة طلب محاكاة محلية' if lang=='ar' else 'Review local paper request');expect(page.locator('#executeOrderDesc')).to_contain_text('1:2000');expect(page.locator('#executeOrderDesc')).to_contain_text(re.compile(r'1:200(?![0-9])'));expect(page.locator('#executeOrderCard')).not_to_contain_text('Estimated Fill Price');assert not orders
    page.keyboard.press('Escape');expect(page.locator('#tradeExecutionModal')).not_to_be_visible();expect(page.locator('#executeDirectOrderBtn')).to_be_focused();assert not orders
    page.locator('#executeDirectOrderBtn').click();page.evaluate("THNContext.set({symbol:'GBPUSD'},'review-modal-test')");expect(page.locator('#tradeExecutionModal')).not_to_be_visible();assert not orders
    page.evaluate("THNContext.set({symbol:'EURUSD'},'review-modal-test')");page.wait_for_function("THNResearch.series()?.symbol==='EURUSD' && THNContext.get().datasetId===THNResearch.series()?.provenance.hash && THNDecision.brief()?.symbol==='EURUSD'")
    page.locator('#executeDirectOrderBtn').click();page.add_script_tag(path=os.environ['AXE_PATH']);violations=page.evaluate("async()=> (await axe.run(document.getElementById('tradeExecutionModal'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations");assert not violations,violations
    contrast=page.evaluate('''()=>{const rgb=s=>s.match(/[0-9.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}),lum=s=>{const v=rgb(s);return v[0]*.2126+v[1]*.7152+v[2]*.0722},bg=lum(getComputedStyle(document.getElementById('tradeExecutionModal')).backgroundColor);return ['paperReviewTitle','executeOrderDesc'].map(id=>{const fg=lum(getComputedStyle(document.getElementById(id)).color);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)})}''');assert all(v>=4.5 for v in contrast),contrast
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1');page.screenshot(path=str(out/f'paper-boundary-{width}-{lang}.png'),animations='disabled')
    # The explicit confirmation is the only browser action submitting a local paper order.
    with page.expect_response(lambda r:r.url.endswith('/api/orders/execute') and r.request.method=='POST') as placed:page.locator('#confirmExecuteBtn').click()
    data=placed.value.json();assert data['ok'],data;assert len(orders)==1;assert 'leverage' not in orders[0] and 'entryPrice' not in orders[0] and 'currentPrice' not in orders[0];assert data['account']['leverage']==200;assert data['orderResult']['executedPrice']!=1.1
    assert data['orderResult']['requiredMargin']>5.5;assert not errors,errors
    results['profiles'].append({'language':lang,'width':width,'previewLeverage':2000,'paperAccountLeverage':200,'executedPrice':data['orderResult']['executedPrice'],'hypotheticalEntry':1.1,'ordersAfterExplicitConfirmOnly':len(orders),'axeViolations':len(violations),'textContrastRatios':contrast,'blankInputsRejected':['entry','leverage','target'],'lateResponsesInvalidated':['language','context','account'],'obsoleteConfirmationCanceled':True,'escapeRestoresFocus':True,'errors':errors});page.close()
   browser.close()
 finally:server.terminate();server.wait(timeout=10)
# Actual stale provider evidence, not a synthetic UI-only status override.
with tempfile.TemporaryDirectory(prefix='thn-boundary-stale-') as private:
 server,url=start(private,'stale')
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
   for lang,width in [('en',1440),('ar',390)]:
    page=b.new_page();ticket(page,url,lang,width);assert page.evaluate('THNResearch.series().provenance.status')=='stale';page.locator('#checkOrderRiskBtn').click();expect(page.locator('#directOrderRiskResult')).to_contain_text('أدلة السوق المحفوظة قديمة' if lang=='ar' else 'Retained market evidence is stale');page.close()
   b.close();results['actualStaleProviderRejectedENAR']=True
 finally:server.terminate();server.wait(timeout=10)
(out/'risk-paper-boundary.json').write_text(json.dumps(results,indent=2));print(json.dumps(results))
