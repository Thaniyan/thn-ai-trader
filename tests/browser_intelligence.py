"""Frozen-provider local acceptance; never a hosted/real-LLM claim."""
import os,json,pathlib,shutil
from playwright.sync_api import sync_playwright
url=os.environ.get('TEST_URL','http://127.0.0.1:3618')
out=pathlib.Path(os.environ.get('TEST_OUTPUT','/workspace/work/v7-evidence'));out.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,value):
 checks.append({'name':name,'passed':bool(value)});assert value,name
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];requests=[]
 page.on('pageerror',lambda error:errors.append(str(error)));page.on('request',lambda r:requests.append(r.url))
 page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort())
 page.goto(url);page.wait_for_function('window.THNIntelligence&&window.THNContext&&window.THNDecision?.brief()?.selected&&THNResearch.series()?.provenance.hash===THNContext.get().datasetId',timeout=30000)
 page.locator('.nav-stack [data-view="ai"]').click();page.locator('#i7Question').fill('Committee: challenge the bullish case');page.locator('#intelligenceAssistant form button').click();page.wait_for_function('THNIntelligence.result()',timeout=30000)
 check('Six deterministic specialists, no model or execution',page.evaluate('THNIntelligence.result().roles.length===6&&THNIntelligence.result().modelCalls===0&&THNIntelligence.result().financialExecution===false'))
 check('Citations bind actual snapshot identity',page.evaluate('THNIntelligence.result().roles.every(r=>r.references.every(id=>THNIntelligence.result().snapshot.refs.some(ref=>ref.id===id)))'))
 check('No order request from assistant',not any('/api/orders/' in u for u in requests))
 page.locator('#i7Question').fill('What are the biggest risks?');page.locator('#intelligenceAssistant form button').click();page.wait_for_function('THNIntelligence.result().roles[0].role==="risk"',timeout=30000)
 check('Follow-up preserves context',page.evaluate('THNIntelligence.result().snapshot.symbol===THNContext.get().symbol'))
 check('History persists with explicit deterministic identity',page.evaluate('JSON.parse(localStorage.getItem("thn_intelligence_history_v7")).length===4'))
 views=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings'];scans=[]
 for lang in ['en','ar']:
  page.locator('[data-language="'+lang+'"]').first.click()
  for theme in ['dark','light']:
   page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
   for width in [1440,390]:
    page.set_viewport_size({'width':width,'height':1000})
    for view in views:
     page.locator('.nav-stack [data-view="'+view+'"]').click();page.wait_for_timeout(80)
     check(f'{lang}/{theme}/{width}/{view}',page.locator('#view-'+view).is_visible() and not page.evaluate('document.documentElement.scrollWidth>innerWidth'))
    page.locator('.nav-stack [data-view="ai"]').click();page.screenshot(path=str(out/f'assistant-{lang}-{theme}-{width}.png'),full_page=True)
   if os.environ.get('AXE_PATH'):
    source=pathlib.Path(os.environ['AXE_PATH']).read_text();page.route('**/__axe.js',lambda r:r.fulfill(content_type='application/javascript',body=source));page.add_script_tag(url=url+'/__axe.js');page.wait_for_timeout(300)
    violations=page.evaluate('async()=> (await axe.run(document.querySelector("#view-ai"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))');scans.append({'lang':lang,'theme':theme,'violations':violations});(out/'a11y-partial.json').write_text(json.dumps(scans,indent=2));check('Accessibility '+lang+'/'+theme,not violations)
 page.locator('#i7Question').fill('ما أكبر المخاطر؟');page.locator('#intelligenceAssistant form button').click();page.wait_for_function('THNIntelligence.result()?.roles[0]?.role==="risk"&&/[\\u0600-\\u06ff]/.test(THNIntelligence.result().summary)',timeout=30000)
 check('Arabic request receives Arabic deterministic interpretation',page.evaluate('/[\\u0600-\\u06ff]/.test(THNIntelligence.result().summary)'))
 page.screenshot(path=str(out/'assistant-ar-live-390.png'),full_page=True)
 if os.environ.get('AXE_PATH'):
  violations=page.evaluate('async()=> (await axe.run(document.querySelector("#view-ai"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations');scans.append({'lang':'ar-live','theme':'light','violations':violations});check('Arabic response accessibility',not violations)
 page.locator('#intelligenceAssistant .i7-actions button').filter(has_text='Delete local history' if page.locator('html').get_attribute('lang')=='en' else 'حذف السجل المحلي').click()
 check('History deletion removes browser record',page.evaluate('localStorage.getItem("thn_intelligence_history_v7")===null'))
 check('No browser exceptions',not errors);(out/'browser-results.json').write_text(json.dumps({'checks':checks,'a11y':scans,'errors':errors},indent=2));b.close()
print(json.dumps({'passed':len(checks),'failed':0,'screenshots':9,'fixtureOnly':True}))
