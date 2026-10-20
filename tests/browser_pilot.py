"""Actual browser/API/loopback HTTP pilot using a SYNTHETIC protocol fixture.
No weights or real generative model are run; never count this as model-quality evidence.
"""
import os,pathlib,subprocess,select,json,itertools
from playwright.sync_api import sync_playwright
out=pathlib.Path('work/v71');out.mkdir(parents=True,exist_ok=True)
s=subprocess.Popen(['node','tests/pilot-browser-launch.mjs'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
 assert select.select([s.stdout],[],[],10)[0];line=s.stdout.readline().strip();assert line.startswith('THN_TEST_PORT='),line;url='http://127.0.0.1:'+line.split('=')[1]
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url)
  page.wait_for_function('window.THNIntelligence&&window.THNContext?.get()?.datasetId&&THNDecision?.brief()?.selected');page.locator('.nav-stack [data-view="ai"]').click();page.wait_for_selector('#i71Token');page.locator('#i71Token').fill('test-only-operator-token');page.get_by_role('button',name='Check local runtime',exact=True).click();page.wait_for_function('!document.querySelector("#i71Mode option[value=llm]").disabled');page.locator('#i71Mode').select_option('llm')
  def ask(q):
   page.locator('#i7Question').fill(q);page.locator('#intelligenceAssistant form button').click();page.wait_for_function('!document.querySelector("#intelligenceAssistant form button").disabled');return page.evaluate('THNIntelligence.result()')
  a=ask('Analyze');assert a['method']=='llm-assisted',a;assert a['modelCalls']==1 and a['financialExecution']==False;identity=a['snapshot']['id'];assert page.locator('.i71-generation').is_visible()
  with page.expect_download() as download:page.get_by_role('button',name='Export evidence & brief',exact=True).click()
  exported=json.loads(pathlib.Path(download.value.path()).read_text());assert 'conversation' not in exported;assert 'test-only-operator-token' not in json.dumps(exported)
  follow=ask('Explain this evidence');assert follow['snapshot']['id']==identity and follow['conversation']['turn']==2
  committee=ask('Committee challenge');assert len(committee['roles'])==6 and committee['modelCalls']==1
  page.locator('.i7-committee button').first.click();assert page.locator('#intelligenceAssistant [data-evidence]').first.is_visible()
  assert 'test-only-operator-token' not in page.evaluate('JSON.stringify(localStorage)')
  bad=ask('Malformed');assert bad['method']=='deterministic' and 'providerFallback' in bad;assert page.locator('.i71-generation').count()==0
  page.locator('#i7Question').fill('Slow');page.locator('#intelligenceAssistant form button').click();page.wait_for_timeout(100);page.get_by_role('button',name='Cancel',exact=True).click();assert not page.locator('#intelligenceAssistant form button').is_disabled();page.wait_for_timeout(200)
  page.get_by_role('button',name='New evidence conversation',exact=True).click();page.locator('.terminal-topbar [data-language="ar"]').click();ar=ask('اشرح المخاطر');assert ar['method']=='llm-assisted' and len(ar['roles'])==2;assert any('\u0600'<=c<='\u06ff' for c in ar['summary'])
  scans=[]
  source=pathlib.Path(os.environ['AXE_PATH']).read_text();page.route('**/__pilot_axe.js',lambda r:r.fulfill(content_type='application/javascript',body=source));page.add_script_tag(url=url+'/__pilot_axe.js')
  for lang,theme,width in itertools.product(['en','ar'],['dark','light'],[1440,390]):
   page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language="'+lang+'"]').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);page.wait_for_timeout(250)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   violations=page.evaluate('''async()=> (await axe.run(document.querySelector('#intelligenceAssistant'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))''');scans.append(dict(language=lang,theme=theme,width=width,violations=violations))
   page.screenshot(path=str(out/f'pilot-{lang}-{theme}-{width}.png'),full_page=True)
  (out/'pilot-accessibility.json').write_text(json.dumps(scans,indent=2));assert not any(s['violations'] for s in scans),scans
  # Storage failures keep the original record and do not persist authentication.
  page.reload();page.locator('.nav-stack [data-view="ai"]').click();page.wait_for_selector('#i71Token');assert page.locator('#i71Token').input_value()=='';assert page.locator('#i71Mode').input_value()=='deterministic'
  assert not errors,errors;(out/'pilot-browser.json').write_text(json.dumps({'syntheticModelOnly':True,'realModelRun':False,'frozenFollowup':True,'selectiveCommittee':True,'malformedFallback':True,'cancelled':True,'arabicGenerationFixture':True,'credentialPersistence':False,'accessibilityScans':len(scans),'errors':errors},indent=2));b.close()
 print('PASS: synthetic loopback browser pilot, frozen followups, EN/AR, cancellation, invalid-output fallback and 8 accessibility scans; NO REAL MODEL')
finally:
 s.terminate();s.wait(timeout=5)
