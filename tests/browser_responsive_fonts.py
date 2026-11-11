"""Fallback font metrics must not break the original geometry or retained evidence.
Additional coverage only; original suites, limits, fonts and timeouts are unchanged.
"""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/responsive-fonts'));out.mkdir(parents=True,exist_ok=True)
results={'profiles':[],'dashboardProfiles':[],'errors':[],'scope':'Offline fixtures; supplemental default/DejaVu/Liberation font-metric coverage'}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=browser.new_page(viewport={'width':768,'height':1000});page.route('https://**/*',lambda route:route.abort());page.on('pageerror',lambda error:results['errors'].append(str(error)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('THNStudio&&THNConfidence.review().analysis&&THNDecision.brief()?.selected');style=page.add_style_tag(content='/* supplemental font-metric profile */');dataset=page.evaluate('THNResearch.series().provenance.hash')
 def profile(font,width,language,theme):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+language+']').click()
  if page.locator('html').get_attribute('data-theme')!=theme:page.locator('#themeBtn').click()
  style.evaluate('(e,font)=>e.textContent=font==="default"?"":`body{font-family:"${font}",sans-serif!important}`',font)
 def geometry():return page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})')
 def go(view):page.locator('.nav-stack [data-view='+view+']').click()
 # Original default-page limits, with the same assessment and all original controls present.
 for font,width,language,theme in itertools.product(['default','DejaVu Sans','Liberation Sans'],[768,390],['en','ar'],['dark','light']):
  profile(font,width,language,theme);go('dashboard');page.evaluate('scrollTo(0,0)')
  chart=page.locator('#qCandles').bounding_box();visible=max(0,min(1000,chart['y']+chart['height'])-max(0,chart['y']))
  assert chart['y']<750 and visible>250,(font,width,language,theme,chart,visible)
  expect(page.locator('#dashboardConviction')).to_be_visible();expect(page.locator('#dashboardEvidence')).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  results['dashboardProfiles'].append({'font':font,'width':width,'language':language,'theme':theme,'chartY':chart['y'],'visibleChartHeight':visible,'headroom':750-chart['y']})
  if font=='DejaVu Sans' and width==390 and ((language,theme) in [('en','dark'),('ar','light')]):page.screenshot(path=str(out/f'fonts-dashboard-390-{language}-{theme}.png'),animations='disabled')
  go('ai');g=geometry();assert g['scroll']<=width+1,(font,width,language,theme,g);assert g['height']<(2500 if width>=768 else 3500),(font,width,language,theme,g)
  expect(page.locator('#analysisCockpit .cockpit-confidence')).to_be_visible();expect(page.locator('#analysisCockpit .cockpit-test')).to_be_visible();expect(page.locator('#i7Question')).to_be_visible();assert page.evaluate('THNResearch.evaluation()') is None
  if (font,width,language,theme)==('DejaVu Sans',768,'en','dark'):page.screenshot(path=str(out/'fonts-ai-768-dejavu.png'),full_page=True,animations='disabled')
  results['profiles'].append({'view':'ai','font':font,'width':width,'language':language,'theme':theme,**g})
 profile('default',768,'en','dark');go('ai');page.locator('#analysisCockpit').get_by_role('button',name='Confidence test',exact=True).click();page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"');recorded=page.evaluate('JSON.stringify(THNResearch.evaluation())')
 for font,width,language,theme in itertools.product(['default','DejaVu Sans','Liberation Sans'],[390,160],['en','ar'],['dark','light']):
  profile(font,width,language,theme);go('portfolio')
  for finding in page.locator('.confidence-finding').all():
   if not finding.evaluate('(e)=>e.open'):finding.locator('summary').click()
  expect(page.locator('#confidenceValidation .confidence-finding')).to_have_count(10);g=geometry();assert g['scroll']<=width+1,(font,width,language,theme,g)
  for selector in ['.studio-validation-line','.studio-validation-line>span','.confidence-finding>summary','.confidence-finding>summary>b']:
   clipped=page.locator(selector).evaluate_all('(nodes)=>nodes.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({text:e.textContent.trim(),width:e.clientWidth,scroll:e.scrollWidth}))');assert not clipped,(font,width,language,theme,selector,clipped)
  assert page.evaluate('JSON.stringify(THNResearch.evaluation())')==recorded;assert page.evaluate('THNResearch.series().provenance.hash')==dataset
  if (font,width,language,theme)==('DejaVu Sans',160,'en','dark'):page.locator('#confidenceValidation').screenshot(path=str(out/'fonts-validation-160-dejavu.png'),animations='disabled')
  results['profiles'].append({'view':'portfolio','font':font,'width':width,'language':language,'theme':theme,**g})
 assert page.evaluate('THNServiceHealth.get().capabilities.paperExecution') is False;assert page.evaluate('THNServiceHealth.get().capabilities.liveTrading') is False;assert not results['errors'];browser.close()
(out/'responsive-fonts-results.json').write_text(json.dumps(results,indent=2));print('PASS: 48 retained profiles plus 24 Dashboard font profiles; unchanged chart/page limits, readable verdicts and captions, all ten findings and immutable evaluation')
