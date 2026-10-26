"""Real broker-selection UI, not a real broker/model integration or trade test."""
import os,json,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('BROKER_OUTPUT','work/broker-workspace'));out.mkdir(parents=True,exist_ok=True)
results={'profiles':[],'errors':[],'financialPosts':[],'realBrokerConnected':False};key='thn.broker-selection.v1'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 s=b.new_page(viewport={'width':1440,'height':1000});s.route('https://**/*',lambda r:r.abort());s.on('pageerror',lambda e:results['errors'].append(str(e)))
 s.on('request',lambda r:results['financialPosts'].append(r.url) if r.method=='POST' and any(x in r.url for x in ['/api/accounts','/api/broker','/api/orders','/api/positions']) else None)
 def go():
  s.locator('.nav-stack [data-view=brokers]').click();expect(s.locator('#bwCountry')).to_be_visible()
 s.goto(os.environ['TEST_URL']);s.wait_for_function('window.THNEvolution&&window.THNDecision&&THNResearch.series()');go()
 expect(s.locator('#bwCountry')).to_have_value('OM');assert s.locator('#bwCountry option').count()==250
 assert s.evaluate('(key)=>localStorage.getItem(key)',key) is None
 # A selectable country is a preference, never evidence of regional eligibility.
 for code in ['OM','AE','GB','OTHER','OM']:s.locator('#bwCountry').select_option(code)
 for broker in ['exness','mt5','xtb']:
  s.locator('[data-bw-broker='+broker+']').click();expect(s.locator('[data-bw-broker='+broker+']')).to_have_attribute('aria-pressed','true')
  expect(s.locator('#bwDetails button')).to_be_disabled();expect(s.locator('#bwDetails')).to_contain_text('NOT CONNECTED');expect(s.locator('#bwDetails')).to_contain_text('Regional eligibility not verified');assert s.locator('#bwDetails input').count()==0
  link=s.locator('#bwDetails .bw-actions a');assert link.get_attribute('href') in ['https://www.xtb.com/','https://www.exness.com/','https://www.metatrader5.com/'];assert link.get_attribute('rel')=='noopener noreferrer'
  expect(s.locator('.bw-api-note a')).to_have_text('Provider documentation')
  if broker=='xtb':expect(s.locator('.bw-api-note')).to_contain_text('14 March 2025')
  if broker=='exness':expect(s.locator('.bw-api-note')).to_contain_text('excluding standard MetaTrader accounts')
  if broker=='mt5':expect(s.locator('#bwDetails')).to_contain_text('MT5 is a platform, not a broker')
 s.reload();s.wait_for_function('window.THNEvolution');go();expect(s.locator('#bwCountry')).to_have_value('OM');expect(s.locator('[data-bw-broker=xtb]')).to_have_attribute('aria-pressed','true')
 # Genuine plan -> new manual capital invalidates that plan and only drafts the existing input.
 s.locator('.nav-stack [data-view=risk]').click();s.locator('#planSymbol').select_option('EURUSD');s.locator('#planSide').select_option('BUY')
 s.wait_for_function('THNResearch.series()?.symbol==="EURUSD"&&THNDecision.brief()?.symbol==="EURUSD"')
 for id,value in {'planCapital':'10000','planRisk':'1','planEntry':'1.1','planStop':'1.09','planTarget':'1.12','planLeverage':'100'}.items():s.locator('#'+id).fill(value)
 assert s.locator('#workRiskForm').evaluate('(el)=>el.checkValidity()')
 with s.expect_response(lambda r:'/api/research/plan' in r.url and r.request.method=='POST') as response:s.locator('#workRiskForm button[type=submit]').click()
 assert response.value.status==200;s.wait_for_function('THNDecision.plan()!==null');go()
 s.locator('#bwCapital').fill('2500.25');s.locator('#bwPlanningForm button').click();expect(s.locator('#view-risk')).to_be_visible();expect(s.locator('#planCapital')).to_have_value('2500.25');expect(s.locator('#planCapital')).to_be_focused();assert s.evaluate('THNDecision.plan()') is None
 assert s.evaluate('(key)=>Object.keys(JSON.parse(localStorage.getItem(key))).sort()',key)==['broker','country']
 go();s.locator('#bwCapital').fill('1.001');assert not s.locator('#bwCapital').evaluate('(el)=>el.checkValidity()');s.locator('#bwPlanningForm button').click();expect(s.locator('#view-brokers')).to_be_visible();expect(s.locator('#planCapital')).to_have_value('2500.25')
 # Draft preserved across genuine language/theme updates; selection does not navigate or infer.
 s.locator('#bwCapital').fill('5000')
 for lang in ['en','ar']:
  s.locator('.terminal-topbar [data-language='+lang+']').click();go();expect(s.locator('#bwCapital')).to_have_value('5000')
  expect(s.locator('#bwDetails')).to_contain_text('NOT CONNECTED' if lang=='en' else 'غير متصل')
  expect(s.locator('#bwDetails button')).to_be_disabled()
  for theme in ['dark','light']:
   s.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
   for width in [1440,768,390,240,160]:
    s.set_viewport_size({'width':width,'height':1000});assert not s.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    bad=s.locator('#proBrokerReadiness').evaluate('el=>[...el.querySelectorAll("button,select,input,article,dl,fieldset")].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>({id:n.id,tag:n.tagName,scroll:n.scrollWidth,width:n.clientWidth}))');assert not bad,bad
    if os.environ.get('AXE_PATH'):
     s.add_script_tag(content=pathlib.Path(os.environ['AXE_PATH']).read_text());violations=s.evaluate('async()=> (await axe.run(document.getElementById("proBrokerReadiness"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))');assert not violations,violations
    if width in [1440,390]:s.screenshot(path=str(out/f'broker-{lang}-{theme}-{width}.png'),animations='disabled',full_page=True)
    results['profiles'].append([lang,theme,width])
 # Storage failure never announces a saved preference or requests credentials.
 s.set_viewport_size({'width':1440,'height':1000});s.locator('.terminal-topbar [data-language=en]').click();go()
 s.evaluate('()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error("test storage refused")}}')
 s.locator('#bwCountry').select_option('AE');expect(s.locator('#bwSelectionStatus')).to_contain_text('storage unavailable');s.evaluate('()=>{Storage.prototype.setItem=window.originalSetItem}')
 s.evaluate('(key)=>localStorage.setItem(key,"{broken")',key);s.reload();s.wait_for_function('window.THNEvolution');go();expect(s.locator('#bwSelectionStatus')).to_contain_text('unreadable');assert s.evaluate('(key)=>localStorage.getItem(key)',key)=='{broken'
 assert not results['errors'],results['errors'];assert not results['financialPosts'],results['financialPosts'];b.close()
(out/'results.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps({'profiles':len(results['profiles']),'errors':results['errors'],'financialPosts':results['financialPosts'],'realBrokerConnected':False}))
