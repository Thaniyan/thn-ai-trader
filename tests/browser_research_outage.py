from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/research/**',lambda route:route.continue_() if route.request.url.endswith('/api/research/plan') else route.fulfill(status=503,content_type='application/json',body=json.dumps({'ok':False,'code':'MARKET_DATA_UNAVAILABLE'})))
 page.goto(os.environ.get('TEST_URL','http://127.0.0.1:3012'));page.wait_for_function('window.THNResearch');page.wait_for_timeout(500)
 assert page.evaluate('THNResearch.series()') is None;assert page.locator('#qSeriesStatus').inner_text()=='Request unavailable. No substitute results are shown.';assert page.locator('#qFrames').inner_text()==''
 page.locator('.nav-stack [data-view="portfolio"]').click();page.locator('#qRun').click();page.wait_for_timeout(300);assert page.evaluate('THNResearch.result()') is None;assert 'no substitute results were generated' in page.locator('#q63Status').inner_text()
 page.locator('.nav-stack [data-view="risk"]').click();page.locator('#planSymbol').select_option('USDJPY')
 for key,value in {'planEntry':'150','planStop':'149','planTarget':'152','planLeverage':'20'}.items():page.locator('#'+key).fill(value)
 page.locator('#workRiskForm button').click();page.wait_for_function('THNDecision.plan()');plan=page.evaluate('THNDecision.plan()');assert plan['metrics']['slDollars']==100;assert plan['metrics']['requiredMargin']==750;assert plan['lots']==0.15
 page.locator('[data-language="ar"]').first.click();page.wait_for_timeout(300);page.locator('#qRun').evaluate('(button)=>button.click()');page.wait_for_timeout(300);assert 'بديلة' in page.locator('#q63Status').inner_text()
 assert not errors,errors
 print('PASS: provider outage clears research results in EN/AR; USDJPY plan 0.15 lots / $100 stop / $750 margin; no browser errors.')
 b.close()
