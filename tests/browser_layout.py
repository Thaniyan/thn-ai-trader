"""Chromium geometry gate for the shared shell, EN/AR and emulated browser zoom.
Viewport CSS width and DPR vary inversely, as with desktop browser page zoom.
Fixtures are offline; this is the actual production package, not a mock DOM.
"""
import os,json,pathlib,itertools
from playwright.sync_api import sync_playwright
out=pathlib.Path(os.environ.get('LAYOUT_OUTPUT','work/layout'));out.mkdir(parents=True,exist_ok=True)
geometry=r'''() => {
 const issues=[];
 const visible=e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
 const rect=e=>e.getBoundingClientRect();
 const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
 for(const selector of ['.nav-stack','.terminal-topbar','.topbar-controls','.topbar-brand','.brand-lockup','.language-switch','.global-sessions-bar']) {
  const parent=document.querySelector(selector);if(!parent||!visible(parent))continue;
  const kids=[...parent.children].filter(e=>visible(e)&&getComputedStyle(e).position!=='absolute');
  for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++)if(overlap(rect(kids[i]),rect(kids[j])))issues.push(selector+': siblings overlap '+i+'/'+j);
 }
 for(const e of document.querySelectorAll('.nav-stack .nav,.brand-text,.brand-titles,.topbar-controls button,.utc-clock-badge,.session-pill')) {
  if(!visible(e))continue;
  const box=rect(e),walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);
  let n;while(n=walker.nextNode())if(n.textContent.trim()){
   const range=document.createRange();range.selectNodeContents(n);
   for(const r of range.getClientRects())if(r.width&&r.height&&(r.left<box.left-2||r.right>box.right+2||r.top<box.top-2||r.bottom>box.bottom+2))issues.push(e.className+': text escapes box');
  }
 }
 const header=rect(document.querySelector('.terminal-topbar'));
 if(header.left < -1 || header.right>innerWidth+1)issues.push('header outside viewport');
 if(document.documentElement.scrollWidth>innerWidth+1)issues.push('page horizontal overflow');
 const sidebar=rect(document.querySelector('.sidebar'));
 if(overlap(sidebar,header))issues.push('sidebar/header overlap');
 return [...new Set(issues)];
}'''
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context();page=context.new_page()
 page.goto(os.environ['TEST_URL']);page.wait_for_selector('.work-heading');page.evaluate('document.fonts.ready');page.wait_for_timeout(300)
 cdp=context.new_cdp_session(page)
 for width,lang,zoom,theme in itertools.product([1920,1440,1280,1024,820,768,760,640,390,320],['en','ar'],[.8,1,1.25,1.5,2],['dark','light']):
  csswidth=round(width/zoom);height=round(900/zoom)
  page.set_viewport_size({'width':csswidth,'height':height})
  cdp.send('Emulation.setDeviceMetricsOverride',{'width':csswidth,'height':height,'deviceScaleFactor':zoom,'mobile':False})
  if page.locator('html').get_attribute('lang')!=lang:page.locator('.terminal-topbar [data-language="'+lang+'"]').click()
  page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
  page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(20)
  assert page.evaluate('innerWidth')==csswidth
  issues=page.evaluate(geometry)
  results.append(dict(width=width,cssWidth=csswidth,language=lang,zoom=zoom,theme=theme,issues=issues))
  if zoom==1 and width in [1440,1024,390] and theme=='dark':
   page.wait_for_timeout(250);page.screenshot(path=str(out/f'{width}-{lang}.png'))
  if zoom==2 and width in [1440,390] and theme=='dark':
   page.wait_for_timeout(250);page.screenshot(path=str(out/f'{width}-{lang}-zoom200.png'))
 (out/'geometry.json').write_text(json.dumps(results,indent=2))
 if os.environ.get('LAYOUT_BASELINE'):
  failed=[r for r in results if r['issues']];print(json.dumps({'baseline':True,'cases':len(results),'failures':len(failed),'examples':failed[:4]}));browser.close();raise SystemExit(0)
 # Sticky/reflow scroll stress and keyboard access to every offscreen mobile item.
 page.set_viewport_size({'width':390,'height':844})
 cdp.send('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':False})
 for lang in ['en','ar']:
  if page.locator('html').get_attribute('lang')!=lang:page.locator('.terminal-topbar [data-language="'+lang+'"]').click()
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   button=page.locator('.nav-stack [data-view="'+view+'"]');button.focus();button.press('Enter')
   page.wait_for_function("""(view)=>document.querySelector('.nav-stack [data-view=\"'+view+'\"]').classList.contains('active')""",arg=view)
   assert button.get_attribute('class').find('active')>=0,view
   assert button.evaluate('(e)=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1}'),view
  page.evaluate('window.scrollTo(0,500)');issues=page.evaluate(geometry)
  results.append(dict(language=lang,scroll=True,issues=issues))
 # Include the shared shell itself in accessibility scans, not only view content.
 scans=[]
 if os.environ.get('AXE_PATH'):
  source=pathlib.Path(os.environ['AXE_PATH']).read_text()
  page.route('**/__layout_axe.js',lambda r:r.fulfill(content_type='application/javascript',body=source))
  page.add_script_tag(url=os.environ['TEST_URL']+'/__layout_axe.js')
  for width,lang,theme in itertools.product([1440,390],['en','ar'],['dark','light']):
   page.set_viewport_size({'width':width,'height':900})
   cdp.send('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':False})
   page.locator('.terminal-topbar [data-language="'+lang+'"]').click()
   page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
   page.wait_for_timeout(250)
   violations=page.evaluate("""async()=> (await axe.run([...document.querySelectorAll('.sidebar,.terminal-topbar')],{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))""")
   scans.append(dict(width=width,language=lang,theme=theme,violations=violations))
  (out/'accessibility.json').write_text(json.dumps(scans,indent=2))
  assert not any(s['violations'] for s in scans),'Shared shell accessibility regression'
 browser.close()
(out/'geometry.json').write_text(json.dumps(results,indent=2))
failed=[r for r in results if r['issues']]
print(json.dumps({'cases':len(results),'failures':len(failed),'examples':failed[:4]}))
if failed and not os.environ.get('LAYOUT_BASELINE'):raise SystemExit('Shell overlap/containment regression')
