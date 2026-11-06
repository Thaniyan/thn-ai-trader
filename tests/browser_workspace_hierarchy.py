"""Chart-first hierarchy, real disclosure navigation, retained state and accessibility."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/m4-hierarchy'));out.mkdir(parents=True,exist_ok=True)
results={'profiles':[],'errors':[],'scope':'Offline synthetic provider fixtures, not Production acceptance'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:results['errors'].append(str(e)))
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNConfidence?.review().analysis && THNDecision.brief()?.selected && THNResearch.series()')
 page.evaluate('window.__hierarchyChart=THNResearch.chart');page.add_script_tag(path=os.environ['AXE_PATH'])
 def go(view):
  page.locator('.nav-stack [data-view='+view+']').click();page.evaluate('scrollTo(0,0)')
 groups={'schools':'researchSchools','scenario':'researchScenarios','evidence':'researchEvidence','record':'researchConclusion'}
 for width,lang,theme in itertools.product([1440,768,390],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);go('dashboard')
  assert page.locator('#qCandles').count()==1 and page.evaluate('THNResearch.chart===window.__hierarchyChart')
  chart=page.locator('#qCandles').bounding_box();visible=max(0,min(1000,chart['y']+chart['height'])-max(0,chart['y']))
  assert chart['y']<750 and visible>250,(width,lang,theme,chart,visible)
  expect(page.locator('#dashboardConfidenceValue')).to_have_text(str(page.evaluate('THNConfidence.review().confluence')))
  expect(page.locator('.home-consensus')).to_contain_text('Grade' if lang=='en' else 'التقدير')
  expect(page.locator('#dashboardEvidence')).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=str(out/f'hierarchy-dashboard-{width}-{lang}-{theme}.png'),animations='disabled')
  go('ai')
  for ident in groups.values():assert not page.locator('#'+ident).evaluate('(e)=>e.open')
  height=page.evaluate('document.documentElement.scrollHeight');assert height<(2500 if width>=768 else 3500),(width,lang,theme,height)
  expect(page.locator('#analysisCockpit .cockpit-quality')).to_be_visible();expect(page.locator('#analysisCockpit .cockpit-test')).to_be_visible()
  page.screenshot(path=str(out/f'hierarchy-ai-{width}-{lang}-{theme}.png'),animations='disabled')
  for action,ident in groups.items():
   page.locator('#analysisCockpit [data-cockpit='+action+']').click();summary=page.locator('#'+ident+' > summary');expect(summary).to_be_focused();assert summary.evaluate('(e)=>e.parentElement.open')
   if action=='schools':expect(page.locator('#schoolsGrid')).to_be_visible();expect(page.locator('#schoolsGrid .school-card')).to_have_count(8)
   if action=='record':expect(page.locator('#d64Thesis')).to_be_visible()
   summary.press('Space');assert not summary.evaluate('(e)=>e.parentElement.open');summary.press('Enter');assert summary.evaluate('(e)=>e.parentElement.open')
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   violations=page.evaluate('''async(id)=>(await axe.run(document.getElementById(id),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))''',ident);assert not violations,(width,lang,theme,ident,violations)
   summary.press('Enter')
  results['profiles'].append({'width':width,'language':lang,'theme':theme,'chartY':chart['y'],'visibleChartHeight':visible,'intelligenceHeight':height})
 # Source disclosure remains open and focused across translated owner rerenders.
 go('dashboard');page.locator('#dashboardDataStatus').click();page.locator('.terminal-topbar [data-language=en]').click();page.locator('#dashboardDataStatus').focus();page.evaluate('document.documentElement.lang="ar"');expect(page.locator('#dashboardDataStatus')).to_be_focused();assert page.locator('#dashboardEvidence details').evaluate('(e)=>e.open')
 # Disclosures and drafts survive owner rerenders and language changes.
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click();go('ai');page.locator('[data-cockpit=record]').click();page.locator('#d64Thesis').fill('Preserve this personal thesis');page.locator('.terminal-topbar [data-language=ar]').click();expect(page.locator('#d64Thesis')).to_have_value('Preserve this personal thesis');assert page.locator('#researchConclusion').evaluate('(e)=>e.open')
 page.locator('.terminal-topbar [data-language=en]').click();go('dashboard');page.locator('#dashboardConviction [data-cockpit=details]').click();expect(page.locator('#researchSchools > summary')).to_be_focused();expect(page.locator('#schoolsGrid')).to_be_visible()
 # Existing chart and evaluation entry points reveal the retained deeper brief.
 go('trading');page.locator('#proEvidenceLink').click();expect(page.locator('#researchEvidence > summary')).to_be_focused();expect(page.locator('#evoIntelligence')).to_be_visible()
 go('ai');page.locator('#analysisCockpit').get_by_role('button',name='Confidence test',exact=True).click();expect(page.locator('#confidenceTestTitle')).to_be_focused();page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"');assert len(page.evaluate('THNConfidence.review().checks'))==10
 original=page.evaluate('JSON.stringify(THNResearch.evaluation())');page.locator('#m65ReviewEvidence').click();expect(page.locator('#researchConclusion > summary')).to_be_focused();expect(page.locator('#d64Thesis')).to_have_value('Preserve this personal thesis');assert page.evaluate('JSON.stringify(THNResearch.evaluation())')==original
 assert page.evaluate('THNConfidence.review().probability') is None
 health=page.request.get(os.environ['TEST_URL']+'/api/health').json();assert health['capabilities']['liveTrading'] is False and health['capabilities']['paperExecution'] is False
 assert not results['errors'];b.close()
(out/'workspace-hierarchy-results.json').write_text(json.dumps(results,indent=2));print('PASS: chart coverage, 12 bilingual/theme/layout profiles, native keyboard disclosures, preserved drafts, context, evaluation and execution boundaries')
