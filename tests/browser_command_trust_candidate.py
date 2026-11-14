"""Controlled candidate fixtures check presentation boundaries, not live trade performance."""
import os,pathlib,json,itertools
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work'));out.mkdir(parents=True,exist_ok=True);result={'profiles':[],'errors':[],'fixture':'Controlled eligible/contradictory API responses over the original offline provider.'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ['CHROMIUM_PATH'],args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:result['errors'].append(str(e)));page.route('https://**/*',lambda r:r.abort());mode={'value':'eligible'}
 def analysis(route):
  response=route.fetch();data=response.json();entry=data['entry'];data.update({'decision':'BUY','consensusLabel':'BULLISH','confidence':80,'grade':'A','stopLoss':entry-.01,'targets':[entry+.002,entry+.004,entry+.006]});route.fulfill(response=response,json=data)
 def brief(route):
  response=route.fetch();data=response.json();data['complete']=True;data['conflicting']=mode['value']=='conflict'
  for frame in data['frames']:
   if frame['available']:frame['trend']='bearish' if mode['value']=='conflict' and frame['interval']=='1d' else 'bullish'
  for scenario in data['scenarios']:
   if scenario['direction']=='bullish':scenario.update({'readyForPlanning':True,'trigger':data['selected']['lastCandle']['close'],'invalidation':data['selected']['lastCandle']['close']-.01})
  route.fulfill(response=response,json=data)
 page.route('**/api/analyze',analysis);page.route('**/api/research/brief?**',brief);page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNCommand?.state().candidate!==null&&window.THNCommand?.state().fresh');saved=page.evaluate('JSON.stringify(THNLibrary.entries())')
 page.locator('[data-trust=candidate]').click();expect(page.locator('#trustCandidateEvidence')).to_contain_text('Observed engine entry reference');expect(page.locator('#trustCandidateEvidence')).to_contain_text('No R/R is asserted here');assert page.evaluate('THNDecision.plan()') is None
 candidate=page.evaluate('THNCommand.state().candidate');expect(page.locator('#trustCandidateEvidence .trust-fields>div')).to_have_count(5)
 actual=page.locator('#trustCandidateEvidence .trust-fields bdi').all_text_contents();assert actual==[str(candidate['entry']),str(candidate['stop']),*[str(v) for v in candidate['targets']]]
 page.locator('[data-trust=conditions]').click();expect(page.locator('#deskDecisionBriefTitle')).to_be_focused();assert page.locator('#deskDecisionBrief').evaluate('(e)=>e.open');assert page.locator('#deskDecisionBrief .desk-fact-link').count()>0
 page.locator('[data-trust=method]').click();expect(page.locator('#commandSourceTitle')).to_be_focused();expect(page.locator('#commandSourceDetails')).to_contain_text('0.28 × ATR')
 page.locator('#trustHeader [data-trust=risk]').click();expect(page.locator('#commandPlannerTitle')).to_be_focused();assert page.evaluate('THNDecision.plan()') is None
 for width,lang,theme in itertools.product([1440,768,390,320],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click();page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);expect(page.locator('#commandTrust')).to_have_attribute('data-candidate','eligible');expect(page.locator('#commandTrust')).to_have_attribute('data-probability','unavailable');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,lang,theme);assert page.evaluate('THNCommand.state().candidate')==candidate;assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved;result['profiles'].append([width,lang,theme])
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.terminal-topbar [data-language=en]').click();mode['value']='conflict';page.evaluate('THNCommand.pick("GBPUSD")');page.wait_for_function('THNContext.get().symbol==="GBPUSD"&&THNCommand.state().fresh&&THNDecision.brief()?.symbol==="GBPUSD"');expect(page.locator('#commandTrust')).to_have_attribute('data-candidate','unavailable');expect(page.locator('#trustCandidateEvidence')).to_contain_text('No eligible current trade candidate');expect(page.locator('#trustCandidateEvidence .trust-fields')).to_have_count(0);assert page.evaluate('THNCommand.state().candidate') is None
 mode['value']='eligible';page.evaluate('THNCommand.pick("USDJPY")');page.wait_for_function('THNContext.get().symbol==="USDJPY"&&THNCommand.state().fresh&&THNDecision.brief()?.symbol==="USDJPY"');expect(page.locator('#commandTrust')).to_have_attribute('data-candidate','unavailable');expect(page.locator('#trustCandidateEvidence')).to_contain_text('Provider currency mismatch');assert page.evaluate('THNCommand.state().candidate') is None
 page.evaluate('THNCommand.pick("USOIL")');page.wait_for_function('THNContext.get().symbol==="USOIL"&&THNCommand.state().fresh&&THNDecision.brief()?.symbol==="USOIL"');expect(page.locator('#commandTrust')).to_have_attribute('data-candidate','unavailable');assert page.evaluate('THNCommand.state().identity.proxy');expect(page.locator('#trustCandidateEvidence .trust-fields')).to_have_count(0);assert page.evaluate('JSON.stringify(THNLibrary.entries())')==saved
 assert not result['errors'],result['errors'];b.close()
(out/'command-trust-candidate-results.json').write_text(json.dumps(result,indent=2));print('PASS: 16 candidate profiles, retained levels, conditional evidence/methodology/planner, contradictory WAIT, quote currency mismatch, proxy rejection and immutable original records')
