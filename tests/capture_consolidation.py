import os,json,pathlib
from playwright.sync_api import sync_playwright
out=pathlib.Path(os.environ['CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page();page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNEvolution&&THNDecision.brief()&&THNResearch.series()&&THNServiceHealth.get()')
 metrics={}
 for width,lang,theme in [(1440,'en','dark'),(1440,'en','light'),(390,'ar','light'),(768,'en','dark')]:
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   page.evaluate('(v)=>switchView(v)',view);page.locator('#view-'+view).wait_for(state='visible');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/(view+'-'+str(width)+'-'+lang+'-'+theme+'.png')),animations='disabled')
   if view=='trading':metrics[str(width)+lang+theme]=page.evaluate('''()=>({chartTop:document.querySelector('.q-canvas-shell').getBoundingClientRect().top,contextHeight:document.querySelector('.evo-context-shell').getBoundingClientRect().height,domNodes:document.querySelectorAll('*').length,chartControls:[...document.querySelectorAll('#view-trading button,#view-trading input,#view-trading select')].filter(e=>e.getClientRects().length).length})''')
 print(json.dumps(page.evaluate('''()=>Object.fromEntries([...document.querySelectorAll('.app-view')].map(v=>[v.id,[...v.children].map(e=>({tag:e.tagName,id:e.id,class:e.className,head:e.querySelector('h1,h2,h3,summary')?.textContent.slice(0,70)}))]))'''),indent=2));(out/'metrics.json').write_text(json.dumps(metrics,indent=2));b.close()
