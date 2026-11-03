"""The owner-requested changes must be visible on the actual landing page."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/dashboard-correction'));out.mkdir(parents=True,exist_ok=True)
results={'profiles':[],'errors':[],'source':'Offline provider fixtures; not production quotes'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:results['errors'].append(str(e)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNConfidence && THNConfidence.review().analysis && THNDecision.brief()');page.evaluate('window.__landingChart=THNResearch.chart')
 expect(page.locator('#evoLeadTitle')).to_have_text('THN AI TRADER')
 expect(page.locator('#dashboardConfidenceValue')).to_have_text(str(page.evaluate('THNConfidence.review().confluence')))
 a=page.evaluate('THNConfidence.review().analysis')
 expected_consensus={'BULLISH':'Bullish consensus','BEARISH':'Bearish consensus'}.get(a['consensusLabel'],'Wait for confirmation')
 expect(page.locator('#dashboardConviction .home-consensus h2')).to_have_text(expected_consensus)
 expect(page.locator('#dashboardConviction .home-consensus p')).to_have_text('Grade '+a['grade']+' · '+str(len(a['schools']))+' analysis schools')
 expect(page.locator('#dashboardEvidence > div').nth(0).locator('strong')).to_have_text(page.evaluate('THNPresentation.price(THNResearch.series().candles.at(-1).close,THNContext.get().symbol)'))
 expect(page.locator('#dashboardEvidence > div').nth(1).locator('strong')).to_have_text(str(page.evaluate('THNDecision.brief().frames.filter(f=>f.available).length'))+' / 3')
 expect(page.locator('#dashboardEvidence > div').nth(2).locator('strong')).to_have_text('Not tested')
 page.locator('#dashboardConviction [data-cockpit=details]').click();expect(page.locator('#view-ai')).to_be_visible();expect(page.locator('#cockpitTitle')).to_be_focused()
 page.locator('.nav-stack [data-view=dashboard]').click();page.locator('#dashboardEvidence [data-cockpit=test]').click();expect(page.locator('#view-portfolio')).to_be_visible();expect(page.locator('#confidenceTestTitle')).to_be_focused();expect(page.locator('#qRun')).to_be_visible();page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"');page.locator('.nav-stack [data-view=dashboard]').click();expect(page.locator('#dashboardEvidence > div').nth(2).locator('strong')).to_have_text(str(page.evaluate('THNConfidence.review().passed'))+' / 10')
 page.locator('.nav-stack [data-view=dashboard]').click();page.locator('#qSymbol').fill('USDJPY');page.locator('#qSymbol').press('Tab');page.wait_for_function('THNContext.get().symbol==="USDJPY"');expect(page.locator('#dashboardConfidenceValue')).to_have_text('—');assert page.evaluate('THNResearch.chart===window.__landingChart')
 page.wait_for_function('THNResearch.series()?.symbol==="USDJPY" && THNDecision.brief()?.symbol==="USDJPY"');page.locator('#evoRunDesk').click();page.wait_for_function('document.getElementById("evoDeskRunStatus").textContent.startsWith("Review complete")');page.evaluate('scrollTo(0,0)');expect(page.locator('#dashboardConfidenceValue')).to_have_text(str(page.evaluate('THNConfidence.review().confluence')))
 # The offline provider deliberately reports USD for every Yahoo symbol.
 # Require the exact observed currency, not an assumed canonical quote currency.
 observation=page.evaluate('({symbol:THNContext.get().symbol,interval:THNContext.get().interval,currency:THNResearch.series().provenance.currency})')
 assert observation['symbol']=='USDJPY'
 expect(page.locator('#dashboardEvidence > div').nth(0).locator('small')).to_have_text(observation['symbol']+' / '+observation['interval']+' · '+observation['currency'])
 page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,1024,768,390,240,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.locator('.nav-stack [data-view=dashboard]').click();page.evaluate('scrollTo(0,0)')
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),(width,lang,theme)
  for selector in ['#dashboardConviction','#dashboardEvidence']:
   expect(page.locator(selector)).to_be_visible();assert page.locator(selector).evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(selector,width,lang,theme)
  if width in [1440,390]:
   violations=page.evaluate('async()=> (await axe.run(document.querySelector("#evoDeskLead"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))');assert not violations,(width,lang,theme,violations)
  results['profiles'].append([width,lang,theme])
 assert not results['errors'];b.close()
(out/'dashboard-confidence-results.json').write_text(json.dumps(results,indent=2));print('PASS: landing confidence, live context, navigation, chart ownership and 24 profiles')
