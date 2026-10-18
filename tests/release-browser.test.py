"""CSP-enforced blocker regressions; provider fixtures only, no paid calls."""
import subprocess,json,os,shutil
from playwright.sync_api import sync_playwright
server=subprocess.Popen(['node','tests/browser-server.mjs'],stdout=subprocess.PIPE,text=True)
checks=0
try:
 url=server.stdout.readline().strip()
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path,args=['--no-sandbox'])
  context=browser.new_context();page=context.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  def isolate(route):route.continue_() if route.request.url.startswith(url) else route.abort()
  page.route('**/*',isolate);page.goto(url);page.wait_for_function('()=>currentAnalysis!==null')
  def login(token,user):
   page.locator('#sessionToken').fill(token);page.locator('#sessionForm button[type="submit"]').click()
   page.wait_for_function('(user)=>privateUser===user&&!sessionChanging',arg=user)
   page.wait_for_function('()=>!brokerSyncInFlight')
  login('test-only-operator-token','operator');page.wait_for_function('()=>serverBrokerAccounts.length>0')
  created=page.request.post(url+'/api/accounts/connect',data={'broker':'paper','balance':12345.67,'accountNumber':'BROWSER-PRIVACY-2345'});assert created.status==200
  account_id=created.json()['account']['id']
  page.evaluate('(id)=>loadBrokerAccountsFromServer().then(()=>switchActiveBrokerAccount(id))',account_id)
  assert page.evaluate('localStorage.getItem(brokerKey)') is None
  checks+=1
  # Hold a real private response body beyond the identity transition; AbortSignal alone cannot protect this case.
  page.evaluate("""()=>{const parse=Response.prototype.json;let once=true;Response.prototype.json=async function(){const data=await parse.call(this);if(once&&this.url.includes('/api/broker/accounts')){once=false;return new Promise(resolve=>window.releaseOldBody=()=>resolve(data))}return data};void loadBrokerAccountsFromServer()}""")
  page.wait_for_function('()=>typeof releaseOldBody==="function"')
  page.evaluate('()=>{document.getElementById("report").textContent="PRIVATE-REPORT-2345";document.getElementById("riskTable").textContent="PRIVATE-RISK-2345"}')
  login('test-only-other-token','other');page.wait_for_function('()=>serverBrokerAccounts.length===0')
  page.evaluate('releaseOldBody()');page.wait_for_timeout(100)
  assert page.evaluate('serverBrokerAccounts.length')==0 and page.evaluate('selectedBrokerAccount') is None
  assert page.locator('#brokerBalanceDisplay').inner_text()=='--'
  for view in ['dashboard','journal','portfolio','brokers']:
   page.evaluate('(view)=>switchView(view)',view)
   assert '12,345.67' not in page.locator('body').inner_text()
  assert 'PRIVATE-REPORT-2345' not in page.locator('body').text_content()
  assert 'PRIVATE-RISK-2345' not in page.locator('body').text_content()
  checks+=1
  page.reload();page.wait_for_function('()=>privateUser==="other"');assert page.evaluate('serverBrokerAccounts.length')==0
  checks+=1
  # Failed identity changes revoke old server cookies and clear synchronously.
  login('test-only-operator-token','operator');page.wait_for_function('()=>serverBrokerAccounts.length>0')
  page.locator('#sessionToken').fill('wrong-credentials-value');page.locator('#sessionForm button[type="submit"]').click()
  assert page.evaluate('serverBrokerAccounts.length')==0
  page.wait_for_function('()=>!sessionChanging');assert page.request.get(url+'/api/accounts').status==401
  checks+=1
  # Cross-tab logout invalidates account state immediately through the session channel.
  login('test-only-operator-token','operator');page.wait_for_function('()=>serverBrokerAccounts.length>0')
  second=context.new_page();second.route('**/*',isolate);second.goto(url);second.wait_for_function('()=>privateUser==="operator"&&serverBrokerAccounts.length>0')
  second.locator('#sessionLogout').click();page.wait_for_function('()=>privateUser===null&&serverBrokerAccounts.length===0')
  assert page.evaluate('selectedBrokerAccount') is None
  second.close();checks+=1
  # Permission loss also clears account-specific state.
  login('test-only-operator-token','operator');page.wait_for_function('()=>serverBrokerAccounts.length>0')
  page.route('**/api/broker/accounts',lambda route:route.fulfill(status=403,json={'ok':False,'error':'Permission lost'}))
  page.evaluate('async()=>{await loadBrokerAccountsFromServer()}');assert page.evaluate('privateUser') is None
  assert page.evaluate('serverBrokerAccounts.length')==0
  page.unroute('**/api/broker/accounts');checks+=1
  login('test-only-operator-token','operator');page.wait_for_function('()=>serverBrokerAccounts.length>0')
  # Quota failure does not destroy analysis, and repeated calls remain single-flight.
  storage=page.evaluate("""async()=>{
   const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota exhausted','QuotaExceededError')};
   try{analysisRetryAt=0;await Promise.all([analyze(),analyze()]);return {valid:!!currentAnalysis,inFlight:analysisInFlight,warning:document.getElementById('browserPersistenceStatus')?.textContent}}finally{Storage.prototype.setItem=original}
  }""")
  assert storage['valid'] and not storage['inFlight'] and storage['warning'];checks+=1
  # Cancellation and timeout always release controls; obsolete results cannot replace newer results.
  canceled=page.evaluate("""async()=>{
   const original=window.fetch;window.fetch=(url,options)=>url==='/api/analyze'?new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true})):original(url,options);
   analysisRetryAt=0;const pending=analyze();cancelAnalysis();await pending;window.fetch=original;await analyze();return {inFlight:analysisInFlight,valid:!!currentAnalysis,enabled:!document.getElementById('analyzeBtn').disabled};
  }""")
  assert canceled=={'inFlight':False,'valid':True,'enabled':True};checks+=1
  timed=page.evaluate("""async()=>{
   const originalFetch=window.fetch,timeout=AbortSignal.timeout;AbortSignal.timeout=()=>timeout(20);
   window.fetch=(url,options)=>url==='/api/analyze'?new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true})):originalFetch(url,options);
   try{await analyze();return {inFlight:analysisInFlight,error:analysisError,enabled:!document.getElementById('analyzeBtn').disabled}}finally{window.fetch=originalFetch;AbortSignal.timeout=timeout}
  }""")
  assert not timed['inFlight'] and timed['enabled'] and timed['error']=='Request timed out';checks+=1
  page.evaluate('async()=>{analysisRetryAt=0;await analyze()}');assert page.evaluate('currentAnalysis!==null')
  # Failed offline logout keeps the UI locked even when the server cookie cannot be revoked.
  page.route('**/api/session',lambda route:route.abort() if route.request.method=='DELETE' else route.continue_())
  page.locator('#sessionLogout').click();page.wait_for_function('()=>!sessionChanging&&privateUser===null')
  page.unroute('**/api/session');page.reload();page.wait_for_function('()=>currentAnalysis!==null')
  assert page.evaluate('privateUser') is None and page.evaluate('serverBrokerAccounts.length')==0
  checks+=1
  # Storage disabled before startup must not prevent initialization or valid analysis.
  disabled=browser.new_context();disabled.add_init_script("for(const method of ['getItem','setItem','removeItem'])Storage.prototype[method]=function(){throw new DOMException('Storage disabled','SecurityError')}")
  dp=disabled.new_page();dp.route('**/*',isolate);dp.goto(url);dp.wait_for_function('()=>currentAnalysis!==null&&!analysisInFlight')
  assert dp.locator('#browserPersistenceStatus').is_visible();disabled.close();checks+=1
  assert not errors,errors
  browser.close()
 print(json.dumps({'suite':'release blocker browser regressions','passed':checks,'failed':0,'CSP':'enforced','providers':'isolated fixtures'}))
finally:server.terminate();server.wait(timeout=10)
