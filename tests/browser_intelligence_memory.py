import json,os,pathlib,shutil
from playwright.sync_api import sync_playwright
url=os.environ.get('TEST_URL','http://127.0.0.1:3618');checks=[]
def check(name,value):checks.append({'name':name,'passed':bool(value)});assert value,name
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox']);page=browser.new_page()
 page.route('**/*',lambda r:r.continue_() if r.request.url.startswith(url) else r.abort());page.goto(url)
 page.wait_for_function('window.THNIntelligence&&THNDecision.brief()?.selected&&THNResearch.series()?.provenance.hash===THNContext.get().datasetId',timeout=30000)
 page.evaluate('THNIntelligence.ask("Committee challenge")');page.wait_for_function('THNIntelligence.result()?.roles.length===6',timeout=30000);page.locator('.nav-stack [data-view="ai"]').click()
 page.locator('#i7Thesis').fill('A conditional research thesis');page.locator('#i7Horizon').fill('4');page.get_by_role('button',name='Save committee to Library',exact=True).click()
 page.wait_for_function('THNLibrary.entries().some(e=>e.record.intelligence?.horizonHours===4)')
 check('Existing library stores committee, personal thesis and declared horizon',page.evaluate('THNLibrary.entries()[0].record.intelligence.personalThesis==="A conditional research thesis"'))
 entry=page.evaluate('THNLibrary.entries()[0].id');page.locator('#i7Memory').select_option(entry);page.evaluate('THNIntelligence.ask("What are the risks?")')
 check('Saved follow-up is explicitly unverified, not fresh provider evidence',page.evaluate('THNIntelligence.result().unverified===true&&THNIntelligence.result().snapshot.fresh===false&&THNIntelligence.result().modelCalls===0'))
 with page.expect_download():page.get_by_role('button',name='Review later observations',exact=True).click()
 check('Reflection appended without rewriting original library case',page.evaluate('THNLibrary.state().archives.some(e=>e.type==="note")&&THNLibrary.entries()[0].record.intelligence.horizonHours===4'))
 page.get_by_role('button',name='Use current chart context',exact=True).click();page.evaluate('THNIntelligence.ask("Analyze current evidence")');page.wait_for_function('THNIntelligence.result()')
 page.evaluate('''()=>{window.v7Old=THNIntelligence.result();window.v7Fetch=fetch;window.fetch=(u,o)=>String(u)==='/api/intelligence'&&JSON.parse(o.body).question==='slow'?new Promise(resolve=>window.v7Resolve=()=>resolve(new Response(JSON.stringify({...window.v7Old,ok:true}),{headers:{'Content-Type':'application/json'}}))):window.v7Fetch(u,o);void THNIntelligence.ask('slow')}''')
 page.evaluate('THNContext.set({symbol:"GBPUSD"},"adversarial-context-change")');page.wait_for_function('THNContext.get().symbol==="GBPUSD"&&THNDecision.brief()?.symbol==="GBPUSD"',timeout=30000)
 page.evaluate('THNIntelligence.ask("Analyze current evidence")');page.wait_for_function('THNIntelligence.result()?.snapshot.symbol==="GBPUSD"',timeout=30000);page.evaluate('window.v7Resolve();window.fetch=window.v7Fetch');page.wait_for_timeout(150)
 check('An old response ignoring AbortSignal cannot overwrite a newer instrument',page.evaluate('THNIntelligence.result().snapshot.symbol==="GBPUSD"'))
 page.evaluate('localStorage.setItem("thn_intelligence_history_v7","{broken")');page.reload();page.wait_for_function('window.THNIntelligence&&THNDecision.brief()?.symbol==="GBPUSD"',timeout=30000);page.evaluate('THNIntelligence.ask("Explain risk")')
 check('Corrupt history is preserved until explicit deletion',page.evaluate('localStorage.getItem("thn_intelligence_history_v7")==="{broken"'))
 browser.close()
pathlib.Path(os.environ.get('TEST_OUTPUT','work/v7')) .joinpath('memory-browser.json').write_text(json.dumps(checks,indent=2));print(json.dumps({'passed':len(checks),'failed':0}))
