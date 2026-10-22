import os,pathlib,json,itertools
from playwright.sync_api import sync_playwright
out=pathlib.Path(os.environ['CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNProfessional&&THNDecision.brief()&&THNResearch.series()')
 if os.environ.get('EVOLUTION'):page.wait_for_function('window.THNEvolution')
 for width,lang,theme in itertools.product([1440,390],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   page.evaluate('(v)=>switchView(v)',view);page.locator('#view-'+view).wait_for(state='visible');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/(view+'-'+str(width)+'-'+lang+'-'+theme+'.png')),full_page=False,animations="disabled")
 b.close()
