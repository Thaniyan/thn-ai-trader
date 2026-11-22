"""Complete Command Center/API/worker flow; SYNTHETIC loopback protocol, no model."""
import os,pathlib,subprocess,select,json,itertools
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work'))/'day7';out.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['node','tests/pilot-browser-launch.mjs'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
 assert select.select([server.stdout],[],[],10)[0];line=server.stdout.readline().strip();assert line.startswith('THN_TEST_PORT='),line;url='http://127.0.0.1:'+line.split('=')[1]
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];posts=[]
  page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None)
  page.goto(url);page.wait_for_function('window.THNCommandInterpretation&&THNIntelligence.researchState().available&&THNCommand.state().fresh&&THNDecision.brief()?.selected.provenance.hash===THNContext.get().datasetId')
  page.locator('.nav-stack [data-view=dashboard]').click();page.locator('#interpretationOpen').click();page.locator('#interpretationLocal').evaluate('(e)=>e.open=true')
  assert page.locator('#interpretationMode option[value=llm]').is_disabled()
  page.locator('#interpretationToken').fill('test-only-operator-token');page.locator('[data-interpretation=check]').click();page.wait_for_function('THNIntelligence.researchState().runtimeInstalled&&!THNIntelligence.researchState().checking')
  assert page.evaluate('THNIntelligence.researchState().qualification')=='NOT_VERIFIED';assert not any(u.endswith('/api/intelligence') for u in posts),'Inventory must not generate'
  baseline=page.evaluate('JSON.stringify({plan:THNDecision.plan(),candidate:THNCommand.state().candidate})');page.locator('#interpretationMode').select_option('llm');page.locator('#interpretationQuestion').fill('Analyze');page.locator('#interpretationAsk').click();page.wait_for_function('THNIntelligence.view().current&&!THNIntelligence.researchState().busy')
  first=page.evaluate('THNIntelligence.result()');assert first['method']=='llm-assisted' and first['financialExecution']==False;assert first['interpretationStatus']['modelQualification']=='NOT_VERIFIED';assert first['generation']['snapshotId']==first['snapshot']['id'];expect(page.locator('#interpretationStatus')).to_contain_text('human review required')
  assert page.evaluate('JSON.stringify({plan:THNDecision.plan(),candidate:THNCommand.state().candidate})')==baseline;before=baseline;snapshot=first['snapshot']['id']
  page.locator('#interpretationQuestion').fill('Explain this evidence');page.locator('#interpretationAsk').click();page.wait_for_function('THNIntelligence.view().current&&THNIntelligence.result().conversation.turn===2&&!THNIntelligence.researchState().busy');assert page.evaluate('THNIntelligence.result().snapshot.id')==snapshot
  page.locator('.interpretation-citations [data-interpretation-ref="frame-1h"]').click();expect(page.locator('#interpretationReferences [data-evidence="frame-1h"]')).to_be_focused();page.locator('#interpretationReferences [data-evidence="frame-1h"]').press('Escape');expect(page.locator('.interpretation-citations [data-interpretation-ref="frame-1h"]')).to_be_focused()
  page.locator('[data-interpretation=save]').click();page.wait_for_function('THNLibrary.entries().some(e=>e.record.intelligence?.snapshot.id===THNIntelligence.result().snapshot.id)');assert page.evaluate('THNIntelligence.researchState().workflowNotice')=='SAVED'
  with page.expect_download() as downloaded:page.locator('[data-interpretation=export]').click()
  exported=json.loads(pathlib.Path(downloaded.value.path()).read_text());assert exported['method']=='llm-assisted' and 'conversation' not in exported;assert 'test-only-operator-token' not in json.dumps(exported)
  assert 'test-only-operator-token' not in page.evaluate('JSON.stringify(localStorage)');assert page.evaluate('JSON.stringify({plan:THNDecision.plan(),candidate:THNCommand.state().candidate})')==before
  before_posts=len(posts);page.locator('#interpretationQuestion').fill('test-only-operator-token');page.locator('#interpretationAsk').click();assert len(posts)==before_posts;expect(page.locator('.interpretation-failure')).to_contain_text('Question rejected');assert 'test-only-operator-token' not in page.evaluate('JSON.stringify(localStorage)');
  page.add_script_tag(path=os.environ['AXE_PATH']);profiles=[]
  for width,lang,theme in itertools.product([1440,768,390],['en','ar'],['dark','light']):
   page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,lang,theme)
   bad=page.evaluate('async()=>(await axe.run(document.getElementById("commandInterpretation"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))');assert not bad,(width,lang,theme,bad);profiles.append([width,lang,theme])
   if (width,lang,theme) in [(1440,'en','dark'),(1440,'ar','light'),(390,'ar','light')]:page.locator('#commandInterpretation').screenshot(path=str(out/f'research-{width}-{lang}-{theme}.png'),animations='disabled')
  page.set_viewport_size({'width':390,'height':1000});page.locator('#interpretationQuestion').fill('تحليل EURUSD');page.locator('#interpretationAsk').click();page.wait_for_function('THNIntelligence.view().current&&!THNIntelligence.researchState().busy');assert page.evaluate('THNIntelligence.result().method')=='llm-assisted';assert page.evaluate('/[\\u0600-\\u06ff]/.test(THNIntelligence.result().summary)');assert page.evaluate('document.documentElement.dir')=='rtl'
  # Hold an actual app response: cancellation/language must reject it even if transport ignores abort.
  page.evaluate('''()=>{const native=fetch;window.__day7Hold=false;window.fetch=async(u,o)=>{if(u==='/api/intelligence'&&window.__day7Hold){const r=await native(u,{...o,signal:undefined});window.__day7Held=true;await new Promise(resolve=>window.__day7Release=resolve);return r;}return native(u,o);};}''')
  accepted=page.evaluate('THNIntelligence.result().snapshot.id');page.evaluate('window.__day7Hold=true');page.locator('#interpretationAsk').click();page.wait_for_function('window.__day7Held');page.locator('[data-interpretation=cancel]').click();page.evaluate('window.__day7Hold=false;window.__day7Release()');assert not page.evaluate('THNIntelligence.view().current');assert page.evaluate('THNIntelligence.result().snapshot.id')==accepted
  assert not any('/api/orders/' in u or '/api/paper/' in u for u in posts);assert not errors,errors
  (out/'results.json').write_text(json.dumps({'syntheticRuntimeOnly':True,'actualModelQualification':'NOT_VERIFIED','profiles':profiles,'checks':['same-page inventory and explicit model selection','actual API and isolated worker','frozen followup','citation focus and Escape','Library save and credential-free export','EN/AR RTL and axe','cancelled late output refused','unchanged hypothetical plan and candidate','no execution calls'],'errors':errors},indent=2));b.close()
 print('PASS: Day7 complete same-page EN/AR research/API/worker flow,12 responsive axe profiles; SYNTHETIC protocol only, no model qualified')
finally:
 server.terminate();server.wait(timeout=5)
