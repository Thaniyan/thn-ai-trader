"""Readable citations -> immutable observations -> assistant draft / matched chart.
Real local analysis and committee APIs, offline provider fixtures, no model run.
"""
import os,json,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('EVIDENCE_OUTPUT','work/evidence-workflow'));out.mkdir(parents=True,exist_ok=True)
results={'profiles':[],'errors':[],'modelRun':False};posts=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);s=b.new_page(viewport={'width':1440,'height':1000});s.on('pageerror',lambda e:results['errors'].append(str(e)));s.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None);s.route('https://**/*',lambda r:r.abort())
 s.goto(os.environ['TEST_URL']);s.wait_for_function('window.THNEvolution&&window.THNIntelligence&&THNResearch.series()&&THNDecision.brief()')
 for lang in ['en','ar']:
  s.locator('.terminal-topbar [data-language='+lang+']').click();s.locator('.nav-stack [data-view=dashboard]').click()
  s.locator('#evoRunDesk').click();s.wait_for_function('(lang)=>!THNIntelligence.state().busy&&THNIntelligence.state().language===lang&&THNIntelligence.result()',arg=lang)
  s.wait_for_function('!document.getElementById("evoRunDesk").disabled');review=s.evaluate('THNIntelligence.result()');assert review['method']=='deterministic' and review['modelCalls']==0
  for theme in ['dark','light']:
   s.evaluate('(value)=>document.documentElement.dataset.theme=value',theme)
   for width in [1440,390,240,160]:
    s.set_viewport_size({'width':width,'height':844 if width==390 else 1000});opener=s.locator('#evoDecisionDesk [data-evo=evidence]');opener.click();modal=s.locator('#evoEvidenceDialog');expect(modal).to_be_visible();assert modal.locator('[data-evidence]').count()==len(review['snapshot']['refs']);assert modal.locator('[data-evidence]').first.get_attribute('data-evidence')=='frame-'+review['snapshot']['interval']
    for ref in review['snapshot']['refs']:
     card=modal.locator('[data-evidence="'+ref['id']+'"]');expect(card).to_contain_text(ref['source'])
     card.locator('details summary').click();expect(card.locator('pre')).to_contain_text(ref['datasetHash']);assert json.loads(card.locator('pre').inner_text())['inputs']==ref['inputs'];card.locator('details summary').click()
    assert not s.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    box=modal.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1
    assert s.evaluate('document.getElementById("evoEvidenceDialog").scrollWidth<=document.getElementById("evoEvidenceDialog").clientWidth+1')
    if os.environ.get('AXE_PATH'):
     s.add_script_tag(content=pathlib.Path(os.environ['AXE_PATH']).read_text());violations=s.evaluate('async()=> (await axe.run(document.getElementById("evoEvidenceDialog"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))');assert not violations,violations
    first=modal.locator('[data-evidence]').first;first.locator('summary').focus();s.keyboard.press('Enter');s.keyboard.press('Tab');expect(first.locator('pre')).to_be_focused()
    if os.environ.get('AXE_PATH') and width==390:
     raw_violations=s.evaluate('async()=> (await axe.run(document.getElementById("evoEvidenceDialog"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))');assert not raw_violations,raw_violations
    s.keyboard.press('Shift+Tab');s.keyboard.press('Enter');modal.evaluate('(el)=>el.scrollTop=0')
    if width in [1440,390]:s.screenshot(path=str(out/f'evidence-{lang}-{theme}-{width}.png'),animations='disabled')
    s.keyboard.press('Escape');expect(modal).not_to_be_visible();expect(opener).to_be_focused();results['profiles'].append([lang,theme,width])
  # Guided questions draft a real supported question, never silently submit inference.
  s.set_viewport_size({'width':1440,'height':1000});s.locator('#evoDecisionDesk [data-evo=evidence]').click();count=len(posts);s.locator('[data-evo=explain-evidence]').click();expect(s.locator('#evoEvidenceDialog')).not_to_be_visible();expect(s.locator('#view-ai')).to_be_visible();expect(s.locator('#i7Question')).to_be_focused();expect(s.locator('#i7Question')).not_to_be_empty();assert len(posts)==count
  s.locator('#i7PromptSuggestions button').nth(1).click();expect(s.locator('#i7Question')).to_be_focused();assert len(posts)==count
  s.locator('#intelligenceAssistant form button[type=submit]').click();s.wait_for_function('(lang)=>THNIntelligence.result()?.roles.length===6&&THNIntelligence.state().language===lang&&!THNIntelligence.state().busy',arg=lang)
  # Role citations open the original assistant evidence disclosure, not raw JSON alone.
  s.locator('#intelligenceAssistant .i7-committee button').first.click();expect(s.locator('#intelligenceAssistant [data-evidence]').first).to_be_visible();assert s.evaluate('document.activeElement.hasAttribute("data-evidence")')
  s.screenshot(path=str(out/f'assistant-evidence-{lang}.png'),animations='disabled')
  s.locator('.nav-stack [data-view=dashboard]').click();s.locator('#evoDecisionDesk [data-evo=evidence]').click();s.locator('[data-evo=evidence-chart]').click();expect(s.locator('#qCandles')).to_be_focused();assert s.evaluate('THNResearch.chart.offset===0&&THNResearch.chart.layers.ema&&THNResearch.chart.layers.levels');assert s.evaluate('THNIntelligence.result().snapshot.selectedHash===THNContext.get().datasetId')
 # A pending real request cannot have its draft overwritten by guided controls.
 s.locator('.nav-stack [data-view=ai]').click();held=[];s.route('**/api/intelligence',lambda route:held.append(route));s.locator('#i7Question').fill('Committee: challenge the market evidence');s.locator('#intelligenceAssistant form button[type=submit]').click();s.wait_for_function('THNIntelligence.state().busy');assert held
 for starter in s.locator('#i7PromptSuggestions button').all():expect(starter).to_be_disabled()
 assert s.evaluate('THNIntelligence.compose("Explain indicator methodology")') is False
 s.locator('.i7-actions button').filter(has_text='إلغاء').click();s.wait_for_function('!THNIntelligence.state().busy');held[0].abort();s.unroute('**/api/intelligence')
 for starter in s.locator('#i7PromptSuggestions button').all():expect(starter).to_be_enabled()
 s.locator('.nav-stack [data-view=trading]').click()
 # Changing the actual selected instrument clears the old review entry point.
 s.locator('#evoDecisionDesk [data-evo=evidence]').click();expect(s.locator('#evoEvidenceDialog')).to_be_visible();s.evaluate('THNContext.set({symbol:"GBPUSD",interval:"1h"},"acceptance-navigation")');expect(s.locator('#evoEvidenceDialog')).not_to_be_visible();s.wait_for_function('THNContext.get().symbol==="GBPUSD"&&THNResearch.series()?.symbol==="GBPUSD"');assert s.locator('#evoDecisionDesk [data-evo=evidence]').count()==0
 assert not any('/api/broker/' in path or '/api/accounts' in path or '/provider/check' in path for path in posts)
 assert not results['errors'],results['errors'];b.close()
(out/'results.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps({'profiles':len(results['profiles']),'errors':results['errors'],'realModelRun':False,'automaticInferenceRequests':0}))
