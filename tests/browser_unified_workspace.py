"""A complete market -> recommendation -> evidence -> risk -> saved-research workflow."""
import itertools,json,os,pathlib
from playwright.sync_api import sync_playwright,expect
out=pathlib.Path(os.environ.get('TEST_OUTPUT','work/unified-workspace'));out.mkdir(parents=True,exist_ok=True)
results={'profiles':[],'checks':[],'errors':[],'scope':'Offline provider fixtures; no model or live execution activated'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.route('https://**/*',lambda r:r.abort());page.on('pageerror',lambda e:results['errors'].append(str(e)));posts=[];page.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None)
 page.goto(os.environ['TEST_URL']);page.wait_for_function('window.THNWorkspace && THNConfidence.review().analysis && THNMarketTerminal.catalog().length');page.evaluate('window.__unifiedChart=THNResearch.chart')
 def go(view):page.locator('.nav-stack [data-view='+view+']').click()
 expect(page.locator('.nav-stack [data-view=journal]')).to_contain_text('Research Library');expect(page.locator('.nav-stack [data-view=portfolio]')).to_contain_text('Historical Lab')
 # Genuine UI selection refreshes technical analysis, not paid/model generation.
 before=len(posts);page.locator('#workspaceMarketSearch').click();expect(page.locator('#workspaceMarketQuery')).to_be_focused();page.locator('#workspaceMarketQuery').fill('GBPUSD');expect(page.locator('#workspaceMarketResults button')).to_have_count(1);page.keyboard.press('ArrowDown');expect(page.locator('[data-workspace-symbol=GBPUSD]')).to_be_focused();page.keyboard.press('Enter');expect(page.locator('#workspaceMarketDialog')).not_to_be_visible();page.wait_for_function('THNConfidence.review().analysis?.symbol==="GBPUSD" && !document.getElementById("analyzeBtn").disabled');assert page.evaluate('THNContext.get().symbol')=='GBPUSD';assert len([u for u in posts[before:] if u.endswith('/api/analyze')])==1;assert not [u for u in posts[before:] if u.endswith('/api/intelligence')]
 assert page.evaluate('THNWorkspace.recommendation().executionAuthorized') is False;assert page.evaluate('THNWorkspace.recommendation().entryQuoteVerified') is False;expect(page.locator('[data-recommendation-method]')).to_have_attribute('data-recommendation-method','deterministic');results['checks'].append('Explicit picker -> one automatic technical request, current context and honest rule-based recommendation')
 # Escape restores focus and cancellation does not select a market.
 page.locator('#workspaceMarketSearch').click();page.locator('#workspaceMarketQuery').fill('no-such-instrument');expect(page.locator('#workspaceMarketResults button')).to_have_count(0);page.keyboard.press('Escape');expect(page.locator('#workspaceMarketSearch')).to_be_focused();assert page.evaluate('THNContext.get().symbol')=='GBPUSD'
 go('ai');page.locator('[data-cockpit=record]').click();page.locator('#d64Thesis').fill('Preserve this research note');page.keyboard.press('Control+k');expect(page.locator('#workspaceMarketDialog')).to_be_visible();page.keyboard.press('Escape');expect(page.locator('#d64Thesis')).to_be_focused();expect(page.locator('#d64Thesis')).to_have_value('Preserve this research note');results['checks'].append('Keyboard picker navigation, empty results, Escape and original note focus')
 # Late technical responses cannot be promoted into a different market.
 held=[];page.route('**/api/analyze',lambda r:held.append(r));page.evaluate('THNWorkspace.selectMarket("USDJPY")');page.wait_for_function('document.getElementById("analyzeBtn").disabled');page.wait_for_function('THNContext.get().symbol==="USDJPY"');assert len(held)==1;page.evaluate('THNWorkspace.selectMarket("EURUSD")');page.wait_for_function('THNResearch.series()?.symbol==="EURUSD"');assert page.evaluate('THNWorkspace.recommendation().action')=='WAIT';response=held[0].fetch();held[0].fulfill(response=response);page.wait_for_function('document.getElementById("analyzeBtn").disabled');page.wait_for_function('THNContext.get().symbol==="EURUSD"');page.wait_for_function('THNResearch.series()?.symbol==="EURUSD"')
 page.wait_for_function('document.querySelector("#dashboardConfidenceValue").textContent==="—"');assert page.evaluate('THNConfidence.review().analysis') is None
 page.wait_for_function('window.THNEvolution')
 assert len(held)==2;response=held[1].fetch();held[1].fulfill(response=response);page.unroute('**/api/analyze');page.wait_for_function('THNConfidence.review().analysis?.symbol==="EURUSD"&&!document.getElementById("analyzeBtn").disabled');results['checks'].append('Rapid selections reject late old-context analysis and retain the newest market')
 # Returning to the same market must not coalesce an invalidated request.
 returned=[]
 def hold_return(route):
  returned.append(route);page.evaluate('(n)=>window.__returnedRequests=n',len(returned))
 page.route('**/api/analyze',hold_return)
 page.evaluate('()=>{window.__oldReturn=analyze();return true;}');page.wait_for_function('window.__returnedRequests===1')
 page.evaluate('THNContext.set({symbol:"GBPUSD"},"return-race")');page.wait_for_function('THNResearch.series()?.symbol==="GBPUSD"')
 page.evaluate('THNContext.set({symbol:"EURUSD"},"return-race")');page.wait_for_function('THNResearch.series()?.symbol==="EURUSD"')
 page.evaluate('()=>{document.getElementById("symbolInput").value="EURUSD";window.__newReturn=analyze();window.__sameReturn=analyze();return true;}');page.wait_for_function('window.__returnedRequests===2')
 assert page.evaluate('THNWorkspace.recommendation().action')=='WAIT'
 response=returned[1].fetch();returned[1].fulfill(response=response);page.evaluate('()=>Promise.all([window.__newReturn,window.__sameReturn])');assert len(returned)==2
 accepted=page.evaluate('JSON.stringify(THNConfidence.review().analysis)');assert accepted!='null'
 response=returned[0].fetch();returned[0].fulfill(response=response);page.evaluate('()=>window.__oldReturn');page.unroute('**/api/analyze');assert page.evaluate('JSON.stringify(THNConfidence.review().analysis)')==accepted
 results['checks'].append('Returning to a market starts a fresh request after invalidation; matching active requests coalesce and old responses cannot replace it')
 # Explicit review adds the authoritative committee explanation, never fake model claims.
 page.locator('#evoRunDesk').click();page.wait_for_function('document.getElementById("evoDeskRunStatus").textContent.startsWith("Review complete")');expect(page.locator('#evoDecisionDesk')).to_be_focused();expect(page.locator('#evoAssistantSummary')).to_have_text(page.evaluate('THNIntelligence.result().summary'));assert page.evaluate('THNIntelligence.result().modelCalls')==0;assert page.locator('#evoDecisionDesk').evaluate('(e)=>e.parentElement.classList.contains("pro-research-rail")')
 opener=page.locator('#evoDecisionDesk [data-evo=evidence]');opener.click();expect(page.locator('#evoEvidenceDialog')).to_be_visible();page.keyboard.press('Escape');expect(opener).to_be_focused();results['checks'].append('One chart with integrated recommendation, cited committee review and modal focus restoration')
 # The historical test remains a different measure from the recommendation.
 go('ai');page.locator('#analysisCockpit').get_by_role('button',name='Confidence test',exact=True).click();page.locator('#qRun').click();page.wait_for_function('THNConfidence.review().testStatus==="complete"');assert len(page.evaluate('THNConfidence.review().checks'))==10;assert page.evaluate('THNWorkspace.recommendation().probability') is None
 # Validate and save a separate hypothetical risk scenario using the original engine.
 go('risk')
 for key,value in {'planCapital':'10000','planRisk':'1','planEntry':'1.1','planStop':'1.09','planTarget':'1.12','planLeverage':'100','qRisk_spread':'0','qRisk_slippage':'0','qRisk_commission':'0'}.items():page.locator('#'+key).fill(value)
 page.locator('#planSide').select_option('BUY');page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('THNDecision.plan()?.inputValid');assert page.locator('#evoRisk').evaluate('(e)=>e.parentElement.classList.contains("workspace-risk-rail")');assert page.evaluate('THNWorkspace.recommendation().risk')=='within_budget'
 page.locator('#evoRisk [data-evo=save-plan]').click();page.wait_for_function('THNLibrary.entries().length===1');page.locator('[data-lib-open]').click();saved=page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)');expect(page.locator('#d64ReportReader')).to_be_visible();page.locator('[data-lib-risk]').click();page.locator('[data-research-risk=inputs]').click();page.locator('#planCapital').fill('20000');page.locator('#workRiskForm button[type=submit]').click();page.wait_for_function('document.getElementById("researchRiskStatus").textContent.includes("Comparable recorded assumptions")');page.locator('[data-research-risk=end]').click();expect(page.locator('[data-lib-risk]')).to_be_focused();assert page.evaluate('JSON.stringify(THNLibrary.entries()[0].record)')==saved;results['checks'].append('Historical validation -> risk engine -> Library -> new risk comparison -> immutable original record')
 # Real appearance controls, all nine sections, small screens and accessible picker.
 page.add_script_tag(path=os.environ['AXE_PATH'])
 for width,lang,theme in itertools.product([1440,768,390,160],['en','ar'],['dark','light']):
  page.set_viewport_size({'width':width,'height':1000});page.locator('.terminal-topbar [data-language='+lang+']').click()
  if page.locator('html').get_attribute('data-theme')!=theme:page.locator('#themeBtn').click()
  for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
   go(view);assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),(width,lang,theme,view)
   if view in ['dashboard','ai','risk','journal','settings'] and width in [1440,390] and (lang,theme) in [('en','dark'),('ar','light')]:
    page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/f'unified-{view}-{width}-{lang}-{theme}.png'),animations='disabled')
  go('ai');page.locator('[data-cockpit=record]').click();expect(page.locator('#d64Thesis')).to_have_value('Preserve this research note');assert page.evaluate('THNResearch.chart===window.__unifiedChart');assert page.locator('#qCandles').count()==1
  page.locator('#workspaceMarketSearch').click();page.locator('#workspaceMarketQuery').fill('الذهب' if lang=='ar' else 'gold');expect(page.locator('[data-workspace-symbol=XAUUSD]')).to_be_visible();assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  if width in [1440,390]:
   violations=page.evaluate('async()=>(await axe.run(document.getElementById("workspaceMarketDialog"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))');assert not violations,(width,lang,theme,violations)
  page.keyboard.press('Escape');results['profiles'].append([width,lang,theme])
 go('settings');expect(page.locator('#workspaceModelStatus')).to_contain_text('غير متصل');page.locator('[data-workspace-model]').click();expect(page.locator('#i71Pilot > summary')).to_be_focused();assert page.locator('#i71Pilot').evaluate('(e)=>e.open')
 assert page.evaluate('THNServiceHealth.get().capabilities.liveTrading') is False;assert page.evaluate('THNServiceHealth.get().capabilities.paperExecution') is False;assert not results['errors'];b.close()
(out/'unified-workspace-results.json').write_text(json.dumps(results,indent=2));print('PASS: unified market/recommendation/research/risk/Library journey, genuine-model boundaries, 16 bilingual/theme/layout profiles, keyboard and accessibility')
