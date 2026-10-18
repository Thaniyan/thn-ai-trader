import os,json,subprocess,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
root=str(Path(__file__).resolve().parents[1])
axe_path=Path(os.environ.get('AXE_PATH','/workspace/.tools/node_modules/axe-core/axe.min.js'))
if not axe_path.is_file():raise SystemExit('Set AXE_PATH to a locally installed axe-core/axe.min.js')
output=Path(os.environ.get('ACCESSIBILITY_OUTPUT','/tmp/thn-accessibility.json'))
server=subprocess.Popen(['node','tests/browser-server.mjs'],cwd=root,stdout=subprocess.PIPE,text=True)
try:
 url=server.stdout.readline().strip();results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':1000})
  page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort())
  page.goto(url);page.wait_for_function('()=>currentAnalysis!==null')
  theme=os.environ.get('ACCESSIBILITY_THEME','dark')
  assert theme in ['dark','light']
  page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
  from pathlib import Path
  page.route('**/__axe.js',lambda route:route.fulfill(content_type='application/javascript',body=axe_path.read_text()))
  page.add_script_tag(url=url+'/__axe.js')
  for lang in ['en','ar']:
   page.evaluate('(lang)=>setLanguage(lang)',lang)
   for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
    page.evaluate('(view)=>switchView(view)',view)
    scan=page.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:r.passes.length,incomplete:r.incomplete.map(v=>v.id)}}")
    results.append({'theme':theme,'lang':lang,'view':view,**scan})
  if os.environ.get('WORKSTATION_SCREENSHOT'):
   page.evaluate("setLanguage('en');switchView('dashboard')");page.screenshot(path=os.environ['WORKSTATION_SCREENSHOT'],full_page=True)
  browser.close()
 with output.open('w') as f:json.dump(results,f,indent=2)
 for item in results:
  if item['violations']:print(item['lang'],item['view'],[(v['id'],len(v['nodes'])) for v in item['violations']])
 assert all(not item['violations'] for item in results),'Accessibility violations recorded in '+str(output)
 print('Accessibility PASS: 18 EN/AR view scans; theme='+theme+'; CSP enforced, same-origin axe instrumentation; manual review still required.')
finally:
 server.terminate();server.wait(timeout=10)
