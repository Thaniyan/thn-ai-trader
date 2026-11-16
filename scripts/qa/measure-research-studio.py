"""Repeatable local measurements; not WAN or Production performance claims."""
import os,pathlib,subprocess,select,time,json
from playwright.sync_api import sync_playwright
fixture=pathlib.Path(__file__).resolve().parents[2]/'tests/studio-snapshot-fixture.js'
root=pathlib.Path(os.environ.get('PERF_ROOT',str(pathlib.Path(__file__).resolve().parents[2])));os.chdir(root);rows=[]
s=subprocess.Popen(['node','--import',str(fixture),'tests/packaged-launch.mjs'],env={**os.environ,'VERCEL':'1','THN_LOCAL_PAPER':'0','THN_AI_ENABLED':'0'},stdout=subprocess.PIPE,text=True)
try:
 assert select.select([s.stdout],[],[],10)[0];url='http://127.0.0.1:'+s.stdout.readline().strip().split('=')[1]
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox'])
  for i in range(3):
   page=b.new_page(viewport={'width':1440,'height':1000});page.add_init_script('Date.now=()=>'+os.environ['TEST_SNAPSHOT_TIME']);page.route('https://**/*',lambda r:r.abort());t=time.monotonic();page.goto(url);page.wait_for_function('THNDecision.brief()?.selected&&THNResearch.series()');ready=(time.monotonic()-t)*1000;page.wait_for_load_state('networkidle')
   resources=page.evaluate('performance.getEntriesByType("resource").map(r=>({url:r.name,bytes:r.encodedBodySize,transfer:r.transferSize}))')
   page.locator('.nav-stack [data-view=portfolio]').click();t=time.monotonic();page.locator('#qRun').click();page.wait_for_function('THNResearch.evaluation()&&!THNResearch.evaluationState().busy');evaluation=(time.monotonic()-t)*1000
   page.locator('.nav-stack [data-view=risk]').click()
   for ident,value in {'planEntry':'1.1','planStop':'1.09','planTarget':'1.12'}.items():page.locator('#'+ident).fill(value)
   t=time.monotonic();page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()?.inputValid');planning=(time.monotonic()-t)*1000
   rows.append({'iteration':i,'readyMs':round(ready,2),'evaluationMs':round(evaluation,2),'planningMs':round(planning,2),'resources':len(resources),'encodedBytes':sum(r['bytes'] for r in resources),'javascriptBytes':sum(r['bytes'] for r in resources if '.js' in r['url'] and '/api/' not in r['url']),'cssBytes':sum(r['bytes'] for r in resources if '.css' in r['url']),'seriesRequests':len([r for r in resources if '/api/research/series?' in r['url']]),'seriesPaths':[r['url'].removeprefix(url) for r in resources if '/api/research/series?' in r['url']],'seriesBytes':sum(r['bytes'] for r in resources if '/api/research/series?' in r['url']),'dataset':page.evaluate('THNResearch.series().provenance.hash')});page.close()
  b.close()
finally:s.terminate();s.wait(timeout=5)
pathlib.Path(os.environ.get('PERF_OUTPUT','/tmp/thn-studio-performance.json')).write_text(json.dumps({'scope':'Local offline synthetic fixtures; cold browser pages; not WAN/Production performance','samples':rows},indent=2));print(json.dumps(rows))
