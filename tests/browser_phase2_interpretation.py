"""Original assistant/Command Center integration; all model output is an OFFLINE MOCK."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work'));out.mkdir(parents=True,exist_ok=True)
rows=[];errors=[];posts=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000})
 page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None)
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNCommandInterpretation&&THNCommand.state().fresh&&THNDecision.brief()?.selected.provenance.hash===THNContext.get().datasetId')
 page.locator('.nav-stack [data-view=dashboard]').click();saved=page.evaluate('JSON.stringify(THNLibrary.entries())');plan=page.evaluate('JSON.stringify(THNDecision.plan())');chart=page.evaluate('window.__phase2Chart=THNResearch.chart;true')
 page.locator('#interpretationOpen').click();expect(page.locator('#interpretationTitle')).to_be_focused()
 page.evaluate('()=>{window.__phase2Settled=false;addEventListener("thn:command-render",()=>{if(THNIntelligence.view().phase==="ready"&&!THNIntelligence.state().busy)__phase2Settled=true;});}')
 page.locator('[data-interpretation=run]').click();page.wait_for_function('THNIntelligence.view().current&&!THNIntelligence.state().busy&&window.__phase2Settled');expect(page.locator('[data-interpretation=run]')).to_be_focused()
 assert page.evaluate('THNIntelligence.result().method==="deterministic"&&THNIntelligence.result().modelCalls===0&&THNIntelligence.result().financialExecution===false')
 expect(page.locator('#interpretationStatus')).to_contain_text('no model called');expect(page.locator('.interpretation-grid')).to_contain_text('Downward observations')
 page.locator('.interpretation-citations [data-interpretation-ref="frame-1h"]').click();expect(page.locator('#interpretationReferences [data-evidence="frame-1h"]')).to_be_focused();page.locator('#interpretationReferences [data-evidence="frame-1h"]').press('Escape');expect(page.locator('.interpretation-citations [data-interpretation-ref="frame-1h"]')).to_be_focused()
 page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,768,390,320,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
  if not page.evaluate('THNIntelligence.view().current'):
   page.locator('[data-interpretation=run]').click();page.wait_for_function('THNIntelligence.view().current&&!THNIntelligence.state().busy')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,lang,theme)
  assert page.evaluate('THNResearch.chart===__phase2Chart')
  bad=page.evaluate('async()=>(await axe.run(document.querySelector("#commandInterpretation"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))');assert not bad,(width,lang,theme,bad)
  rows.append([width,lang,theme])
  if (width,lang,theme) in [(1440,'en','dark'),(1440,'ar','light'),(390,'ar','light')]:page.locator('#commandInterpretation').screenshot(path=str(out/f'phase2-evidence-{width}-{lang}-{theme}.png'),animations='disabled')
 # A saved assistant selection must never silently replace the main chart context.
 entry=page.evaluate("()=>{const record=THNDecision.snapshot();record.intelligence=THNIntelligence.result();if(!THNLibrary.save(record))throw Error('Fixture save rejected');return THNLibrary.entries().find(e=>e.record.intelligence)?.id;}");assert entry
 saved=page.evaluate('JSON.stringify(THNLibrary.entries())')
 page.set_viewport_size({'width':1440,'height':1000})
 for launcher in ['interpretation','full-review']:
  page.locator('.nav-stack [data-view=ai]').click();page.locator('#i7Memory').select_option(entry);assert not page.evaluate('THNIntelligence.view().current')
  page.locator('.nav-stack [data-view=dashboard]').click()
  if launcher=='interpretation':page.locator('#interpretationOpen').click();page.locator('[data-interpretation=run]').click()
  else:page.locator('#evoRunDesk').click()
  page.wait_for_function('THNIntelligence.view().current&&!THNIntelligence.state().busy&&!document.getElementById("evoRunDesk").disabled')
  assert page.evaluate('!THNIntelligence.result().unverified&&THNIntelligence.result().snapshot.selectedHash===THNContext.get().datasetId')
  assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 # Requests that ignore transport cancellation still cannot repopulate a changed context.
 page.evaluate('''()=>{const native=window.fetch;window.__phase2Hold=false;window.fetch=async(url,options)=>{if(url==='/api/intelligence'&&window.__phase2Hold){const response=await native(url,{...options,signal:undefined});window.__phase2Held=true;await new Promise(resolve=>window.__phase2Release=resolve);return response;}return native(url,options);};}''')
 for action in ['cancel','language','assumptions','instrument']:
  page.evaluate('window.__phase2Hold=true;window.__phase2Held=false');page.locator('[data-interpretation=run]').click();page.wait_for_function('window.__phase2Held')
  before=page.evaluate('THNIntelligence.result().snapshot.id')
  if action=='cancel':
   page.locator('[data-interpretation=cancel]').click();expect(page.locator('[data-interpretation=run]')).to_be_focused()
  elif action=='language':page.locator('.terminal-topbar [data-language=en]').click()
  elif action=='assumptions':page.evaluate('THNContext.set({datasetId:"f".repeat(64)},"phase2-regression")')
  else:page.evaluate('THNWorkspace.selectMarket("BTCUSD")')
  page.evaluate('window.__phase2Hold=false;window.__phase2Release()');page.wait_for_function('!THNIntelligence.state().busy')
  assert page.evaluate('THNIntelligence.result().snapshot.id')==before,'Late result replaced retained record'
  if action!='cancel':assert not page.evaluate('THNIntelligence.view().current')
  if action in ['assumptions','instrument']:
   page.evaluate('THNWorkspace.refreshMarket()' if action=='assumptions' else 'THNWorkspace.selectMarket("EURUSD")');page.wait_for_function('THNResearch.series()?.symbol==="EURUSD"&&THNDecision.brief()?.symbol==="EURUSD"&&THNContext.get().datasetId===THNResearch.series()?.provenance.hash')
  page.locator('#interpretationOpen').click()
 # Offline mock of separately authorized LOCAL pilot only. No model/runtime is enabled.
 page.route('**/api/intelligence/provider',lambda r:r.fulfill(json={'available':True,'provider':'ollama','model':'offline-fixture','hostedDisabled':False}))
 page.reload();page.wait_for_function('window.THNIntelligence?.state().available&&THNDecision.brief()?.selected.provenance.hash===THNContext.get().datasetId')
 page.locator('.nav-stack [data-view=ai]').click();page.locator('#i71Token').fill('offline-test-only-token')
 page.route('**/api/intelligence/provider/check',lambda r:r.fulfill(json={'installed':True,'model':'offline-fixture','sizeBytes':1024,'digest':'a'*64}))
 page.get_by_role('button',name='Check local runtime',exact=True).click();page.locator('#i71Mode').select_option('llm')
 # Controlled candidate fixtures exercise BUY/SELL/WAIT without changing engines.
 candidate_fixture={'side':'BUY'}
 def candidate_analysis(route):
  response=route.fetch();data=response.json();entry=data['entry'];side=candidate_fixture['side'];sign=1 if side=='BUY' else -1
  data.update(decision=side,consensusLabel='BULLISH' if side=='BUY' else 'BEARISH' if side=='SELL' else 'NEUTRAL',confidence=80,grade='A',stopLoss=entry-sign*.01,targets=[entry+sign*.002,entry+sign*.004,entry+sign*.006]);route.fulfill(response=response,json=data)
 def candidate_brief(route):
  response=route.fetch();data=response.json();side=candidate_fixture['side'];direction='bullish' if side=='BUY' else 'bearish' if side=='SELL' else 'neutral';data.update(complete=True,conflicting=False)
  for frame in data['frames']:
   if frame['available']:frame['trend']=direction
  for scenario in data['scenarios']:
   if scenario['direction']==direction:scenario.update(readyForPlanning=True,trigger=data['selected']['lastCandle']['close'],invalidation=data['selected']['lastCandle']['close']+(-.01 if side=='BUY' else .01))
  route.fulfill(response=response,json=data)
 page.route('**/api/analyze',candidate_analysis);page.route('**/api/research/brief?**',candidate_brief)
 page.locator('.nav-stack [data-view=dashboard]').click();page.locator('#heritageMarkets [data-command="pick:GBPUSD"]').click();page.wait_for_function('THNCommand.state().candidate?.symbol==="GBPUSD"&&THNCommand.state().candidate?.side==="BUY"')
 malformed={'value':False}
 def generated(route):
  payload=route.request.post_data_json;payload['mode']='deterministic';response=route.fetch(post_data=json.dumps(payload));data=response.json();s=data['snapshot'];refs=[r for r in s['refs'] if r.get('interval')];ref=refs[0];trends={r.get('trend') for r in refs};summary='Review recorded direction and any opposing observations.'
  data.update(method='llm-assisted',provider='ollama',model='offline-fixture',modelCalls=1,summary=summary)
  data['generation']={'schema':'THN-GENERATION-7.1','snapshotId':s['id'],'symbol':s['symbol'],'interval':s['interval'],'summary':summary,'citations':[ref['id']],'claims':[{'reference':ref['id'],'field':'trend','value':ref['trend']}],'roles':[r['role'] for r in data['roles']],'evidenceState':'insufficient' if not s['fresh'] else 'conflicting' if {'bullish','bearish'}<=trends else 'consistent','uncertainties':['Opposing observations remain.'],'provider':'ollama','model':'offline-fixture'}
  if malformed['value']:data['generation']['claims'][0]['value']='fabricated'
  route.fulfill(response=response,json=data)
 page.route('**/api/intelligence',generated);page.locator('.nav-stack [data-view=dashboard]').click();page.locator('#interpretationOpen').click();page.wait_for_function('THNCommand.state().fresh');before_projection=page.evaluate('JSON.stringify({action:THNCommand.state().recommendation.action,candidate:THNCommand.state().candidate})');page.locator('[data-interpretation=run]').click();page.wait_for_function('THNIntelligence.view().current&&THNIntelligence.result().method==="llm-assisted"')
 assert page.evaluate('JSON.stringify({action:THNCommand.state().recommendation.action,candidate:THNCommand.state().candidate})')==before_projection
 expect(page.locator('#interpretationStatus')).to_contain_text('human review required');expect(page.locator('.interpretation-origin')).to_contain_text('ollama / offline-fixture')
 for side,symbol in [('SELL','EURUSD'),('WAIT','GBPUSD')]:
  candidate_fixture['side']=side;page.locator('#heritageMarkets [data-command="pick:'+symbol+'"]').click();page.wait_for_function('(side)=>THNCommand.state().fresh&&THNConfidence.review().analysis?.decision===side',arg=side)
  assert page.evaluate('THNCommand.state().candidate?.side||"WAIT"')==side
  before_projection=page.evaluate('JSON.stringify({action:THNCommand.state().recommendation.action,candidate:THNCommand.state().candidate})')
  page.locator('#interpretationOpen').click();page.locator('[data-interpretation=run]').click();page.wait_for_function('THNIntelligence.view().current&&THNIntelligence.result().method==="llm-assisted"&&!THNIntelligence.state().busy')
  assert page.evaluate('JSON.stringify({action:THNCommand.state().recommendation.action,candidate:THNCommand.state().candidate})')==before_projection
 accepted=page.evaluate('JSON.stringify(THNIntelligence.result())');malformed['value']=True;page.locator('[data-interpretation=run]').click();page.wait_for_function('THNIntelligence.view().phase==="error"&&!THNIntelligence.state().busy');assert page.evaluate('JSON.stringify(THNIntelligence.result())')==accepted;assert page.evaluate('THNCommand.state().verified_model_interpretation') is None;assert page.evaluate('THNWorkspace.recommendation().interpretation') is None
 assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved;assert page.evaluate('JSON.stringify(THNDecision.plan())')==plan
 assert not any('/api/order' in u or '/api/paper/' in u for u in posts);assert not page.evaluate('THNServiceHealth.get().capabilities.paperExecution');assert not errors,errors
 (out/'phase2-interpretation-results.json').write_text(json.dumps({'profiles':rows,'errors':errors,'mockModelOnly':True,'checks':['deterministic assistant reuse','source focus and Escape','EN/AR dark/light axe','cancel/language/hash/instrument late response rejection','strict simulated generation','BUY/SELL/WAIT and original level preservation','saved-to-current review boundaries','fabricated facts rejected','immutable library and plan','hosted execution off']},indent=2));b.close()
print('PASS: integrated interpretation,20 EN/AR/theme profiles,source accessibility,cancellation/context races,strict OFFLINE MOCK generation and unchanged financial safeguards')
