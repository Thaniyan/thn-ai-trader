"""Actual-app fixture captures; never a visual prototype or Production proof."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import os,sys,subprocess,select,tempfile,json,time
fixture=Path(__file__).resolve().parents[2]/'tests/studio-snapshot-fixture.js'
root=Path(os.environ.get('CAPTURE_ROOT',str(Path(__file__).resolve().parents[2])));os.chdir(root);sys.path.insert(0,str(root/'tests'));from workspace_controls import control
out=Path(os.environ.get('CAPTURE_OUTPUT','/tmp/thn-studio-captures'));out.mkdir(parents=True,exist_ok=True);anchor=int(os.environ['TEST_SNAPSHOT_TIME']);results=[]
with tempfile.TemporaryDirectory(prefix='thn-studio-measure-') as private:
 env={**os.environ,'VERCEL':'1','THN_LOCAL_PAPER':'0','THN_AI_ENABLED':'0','THN_DATA_DIR':private}
 server=subprocess.Popen(['node','--import',os.environ.get('STUDIO_FIXTURE_IMPORT',str(fixture)),'tests/packaged-launch.mjs'],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 try:
  assert select.select([server.stdout],[],[],10)[0];line=server.stdout.readline().strip();assert line.startswith('THN_TEST_PORT='),line;url='http://127.0.0.1:'+line.split('=')[1]
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
   for width,lang,theme in [(1440,'en','dark'),(768,'en','dark'),(390,'ar','light')]:
    page=b.new_page(viewport={'width':width,'height':1000});page.add_init_script('Date.now=()=>'+str(anchor));page.route('https://**/*',lambda r:r.abort());req=[];errors=[];page.on('request',lambda r:req.append({'method':r.method,'url':r.url.removeprefix(url)}));page.on('pageerror',lambda e:errors.append(str(e)))
    t=time.monotonic();page.goto(url);page.wait_for_function('THNResearch.series()?.symbol==="EURUSD" && THNDecision.brief()?.selected && THNConfidence.review().analysis && THNLibrary');ready=time.monotonic()-t
    page.locator('#evoRunDesk').click();page.wait_for_function('document.getElementById("evoDeskRunStatus").textContent.startsWith("Review complete")',timeout=30000)
    page.locator('.nav-stack [data-view=portfolio]').click();control(page,'#qRun').click();page.wait_for_function('THNResearch.evaluation()&&!THNResearch.evaluationState().busy')
    page.locator('.nav-stack [data-view=ai]').click();control(page,'#d64Thesis').fill('EURUSD evidence review · immutable baseline')
    page.locator('.nav-stack [data-view=risk]').click();close=page.evaluate('THNResearch.series().candles.at(-1).close')
    for ident,value in {'planEntry':close,'planStop':close-.003,'planTarget':close+.006}.items():page.locator('#'+ident).fill(str(value))
    page.locator('#planSide').select_option('BUY');page.locator('#v75CostInclusive').check();page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()!==null');page.locator('#evoRisk [data-evo=save-plan]').click();page.wait_for_function('THNLibrary.entries().length===1')
    page.locator('.nav-stack [data-view=journal]').click();page.locator('[data-lib=snapshot]').click()
    page.locator('.terminal-topbar [data-language='+lang+']').click()
    if page.locator('html').get_attribute('data-theme')!=theme:page.locator('#themeBtn').click()
    for view in ['dashboard','trading','ai','portfolio','journal','risk']:
     page.locator('.nav-stack [data-view='+view+']').click();page.evaluate('window.scrollTo(0,0);document.querySelector(".terminal-main").scrollTop=0');page.screenshot(path=str(out/f'{view}-{width}-{lang}-{theme}.png'),animations='disabled')
     results.append({'view':view,'width':width,'language':lang,'theme':theme,'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),'height':page.locator('#view-'+view).bounding_box()['height'],'chartTop':page.locator('#qCandles').bounding_box()['y'] if view in ['dashboard','trading'] else None,'requests':len(req),'seriesRequests':len([r for r in req if '/api/research/series?' in r['url']]),'loadSeconds':ready,'errors':list(errors),'dataset':page.evaluate('THNResearch.series().provenance.hash')})
    page.close()
   b.close()
 finally:server.terminate();server.wait(timeout=10)
(out/'measurements.json').write_text(json.dumps({'snapshotTime':anchor,'fixture':'frozen synthetic closed observations; performance elapsed real','profiles':results},indent=2));print(json.dumps(results))
