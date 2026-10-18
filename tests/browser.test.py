import subprocess,os,shutil
from playwright.sync_api import sync_playwright

server=subprocess.Popen(['node','tests/browser-server.mjs'],stdout=subprocess.PIPE,text=True)
try:
    url=server.stdout.readline().strip()
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1440,'height':1000})
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort())
        page.goto(url)
        page.wait_for_function('()=>currentAnalysis !== null')
        page.wait_for_timeout(200)
        assert not errors,errors
        assert page.evaluate('typeof clamp')=='function'
        assert page.evaluate('typeof resetPaperBalance')=='function'
        assert not page.evaluate('document.getElementById("statusText")?.textContent.includes("clamp")')
        page.evaluate("switchView('watchlist')")
        page.evaluate("setInstrumentPref('EURUSD','hidden',true)")
        assert page.locator('[data-watch-hide="EURUSD"]').count()==0
        page.locator('#showHiddenInstruments').check()
        assert page.locator('[data-watch-hide="EURUSD"]').inner_text()=='Restore'
        page.locator('[data-watch-scan="EURUSD"]').uncheck()
        assert 'EURUSD' not in page.evaluate('watchlistPayload().symbols')
        page.locator('[data-watch-hide="EURUSD"]').click()
        assert page.evaluate("instrumentPrefs().EURUSD.hidden")==False
        assert page.evaluate("instrumentPrefs().EURUSD.scanEnabled")==False
        assert page.evaluate("()=>{document.getElementById('scanEvery').value='custom';document.getElementById('customScanValue').value='45';return getScanIntervalMs()}")==45000
        assert page.evaluate("()=>{document.getElementById('customScanValue').value='1';try{getScanIntervalMs();return false}catch{return true}}")==True
        flight=page.evaluate("""async()=>{
          const original=window.fetch;let requests=0;
          window.fetch=(url,options)=>url==='/api/watchlist/scan'?new Promise((resolve,reject)=>{requests++;const timer=setTimeout(()=>resolve({ok:true,json:async()=>({results:[],count:1})}),200);options.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))})}):original(url,options);
          await Promise.all([scanWatchlist(),scanWatchlist()]);
          const first=requests;watchScanResults=[{symbol:'sentinel'}];const pending=scanWatchlist();stopScanner();await pending;
          window.fetch=original;return {first,after:watchScanResults[0].symbol,inFlight:scanInFlight};
        }""")
        assert flight=={'first':1,'after':'sentinel','inFlight':False},flight
        assert page.evaluate('notificationPrefs().browser')==False
        assert page.evaluate('notificationPrefs().toast')==False
        assert page.evaluate('notificationPrefs().sound')==False
        page.evaluate("window.notifyCount=0;showTradeToast=()=>notifyCount++;window.sampleOpportunity={setupId:'dedupe-test',symbol:'EURUSD',timeframe:'intraday',decision:'BUY',confidence:80,automation:{active:true,severity:'qualified-entry'},provenance:{state:'REAL',verified:true,instrumentMatch:true,fresh:true,quoteAt:Date.now()}}")
        page.evaluate('notifyStrongAlerts([sampleOpportunity])')
        assert page.evaluate('notifyCount')==0
        assert page.evaluate("eligibleNotification({...sampleOpportunity,automation:{...sampleOpportunity.automation,active:false}},notificationPrefs())")==False
        page.evaluate("()=>{localStorage.setItem(notificationPrefsKey,JSON.stringify({...notificationPrefs(),toast:true}));window.held=navigator.locks.request('thn-opportunity-delivery',()=>new Promise(resolve=>window.releaseNotificationLock=resolve));return true}")
        second=page.context.new_page()
        second.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort())
        second.goto(url)
        second.wait_for_function('()=>currentAnalysis !== null')
        second.evaluate("()=>{window.notifyCount=0;showTradeToast=()=>notifyCount++;window.sampleOpportunity={setupId:'dedupe-test',symbol:'EURUSD',timeframe:'intraday',decision:'BUY',confidence:80,automation:{active:true,severity:'qualified-entry'},provenance:{state:'REAL',verified:true,instrumentMatch:true,fresh:true,quoteAt:Date.now()}};window.notifyDone=false;notifyStrongAlerts([sampleOpportunity]).then(()=>notifyDone=true);return true}")
        page.evaluate('window.notifyDone=false;notifyStrongAlerts([sampleOpportunity]).then(()=>notifyDone=true);releaseNotificationLock()')
        page.wait_for_function('()=>notifyDone')
        second.wait_for_function('()=>notifyDone')
        counts=page.evaluate('notifyCount')+second.evaluate('notifyCount')
        if counts!=1: print({'count':counts,'prefs':page.evaluate('notificationPrefs()'),'cache':page.evaluate('getNotifyCache()'),'eligible':page.evaluate('eligibleNotification(sampleOpportunity,notificationPrefs())')},flush=True)
        assert counts==1
        page.evaluate("localStorage.setItem(notificationPrefsKey,JSON.stringify({...notificationPrefs(),toast:false}));notifyStrongAlerts([{...sampleOpportunity,setupId:'after-opt-out'}])")
        counts=page.evaluate('notifyCount')+second.evaluate('notifyCount')
        if counts!=1: print({'count':counts,'prefs':page.evaluate('notificationPrefs()'),'cache':page.evaluate('getNotifyCache()'),'eligible':page.evaluate('eligibleNotification(sampleOpportunity,notificationPrefs())')},flush=True)
        assert counts==1
        second.close()
        page.evaluate("switchView('professional-map')")
        for width in [390,768,1440]:
            page.set_viewport_size({'width':width,'height':1000})
            page.wait_for_timeout(250)
            dimensions=page.evaluate("()=>{const c=document.getElementById('analysisMapCanvas'),r=c.getBoundingClientRect();return {viewport:innerWidth,document:document.documentElement.scrollWidth,css:r.width,logical:c.width/devicePixelRatio}}")
            if dimensions['document']>width: print(page.evaluate("()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth).slice(0,15).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right}))"),flush=True)
            assert dimensions['document']<=width,dimensions
            assert abs(dimensions['css']-dimensions['logical'])<2,dimensions
        page.locator('#chartLevelPrice').fill('1.08')
        page.locator('#chartLevelLabel').fill('Support note')
        page.locator('#chartAddLevel').click()
        assert page.evaluate('chartDrawings()[0].label')=='Support note'
        page.locator('#analysisMapCanvas').focus()
        page.keyboard.press('+')
        assert page.evaluate('chartWindow')==76
        page.locator('#chartReset').click()
        assert page.evaluate('chartWindow')==84
        page.evaluate("liveQuotesCache={};updateWebTraderCalculations()")
        assert page.locator('#webtraderTransmitOrderBtn').is_disabled()
        journal=page.evaluate("()=>{const before=getJournal().length;saveJournal();return {before,after:getJournal().length,saved:JSON.parse(browserStore.getItem('thn_saved_setups_v1'))[0]}}")
        assert journal['before']==journal['after']
        assert journal['saved']['status']=='SETUP'
        assert 'pnl' not in journal['saved']
        preview=page.evaluate("()=>{const before=localStorage.getItem(journalKey);loadBenchmarkHistory();return {before,after:localStorage.getItem(journalKey)}}")
        assert preview['before']==preview['after']
        metrics=page.evaluate("computePerformanceKPIs([{pnl:100,date:'2026-01-01'},{pnl:-50,date:'2026-01-02'},{pnl:0,date:'2026-01-03'}],50000)")
        assert abs(metrics['expectancy']-50/3)<1e-9
        assert metrics['maxDd']==50
        assert abs(metrics['maxDdPct']-50/50100*100)<1e-9
        sizing=page.evaluate("()=>{liveQuotesCache.US30={bid:42000,ask:42001,timestamp:Date.now(),provenance:{state:'REAL',fresh:true,verified:true,instrumentMatch:true},currency:'USD',digits:1,contractSize:1,minLot:0.1,maxLot:50,lotStep:0.1};currentAnalysis={symbol:'US30',decision:'BUY',entry:42000,stopLoss:41900,targets:[42200]};watchScanResults=[];return generateCapitalDeals({balance:50000,riskPct:1})[0]}")
        assert sizing['lots']==5
        assert sizing['maxRisk']==500
        assert sizing['targetProfit']==1000
        page.evaluate("analyze()")
        for lang in ['en','ar']:
            page.evaluate("setLanguage('"+lang+"');switchView('professional-map')")
            for width in [390,768,1440]:
                page.set_viewport_size({'width':width,'height':1000});page.wait_for_timeout(100)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        high=context.new_page();high.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort())
        high.goto(url);high.wait_for_function('()=>currentAnalysis !== null');high.evaluate("switchView('professional-map')")
        # DPR2 is checked in a separate context, while the shared context above tests cross-tab storage.
        dpr=browser.new_context(viewport={'width':390,'height':1000},device_scale_factor=2)
        hp=dpr.new_page();hp.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort());hp.goto(url);hp.wait_for_function('()=>currentAnalysis !== null');hp.evaluate("switchView('professional-map')");hp.bring_to_front();hp.wait_for_function("()=>{const c=document.getElementById('analysisMapCanvas');return c.getBoundingClientRect().width>0&&Math.abs(c.width/devicePixelRatio-c.getBoundingClientRect().width)<2}",timeout=5000)
        assert hp.evaluate("()=>{const c=document.getElementById('analysisMapCanvas');return Math.abs(c.width/devicePixelRatio-c.getBoundingClientRect().width)<2}")
        dpr.close();high.close()
        # The journal must follow server cursors without losing realized fills.
        ledger_pages=[]
        def ledger_route(route):
            ledger_pages.append(route.request.url)
            second_page='before=10' in route.request.url
            route.fulfill(json={"ok":True,"fills":[{"id":"page-2" if second_page else "page-1","epoch":"pagination-test","closedAt":"2026-01-01T00:00:00Z","symbol":"EURUSD","side":"BUY","realizedPnl":5,"riskDollars":10}],"nextCursor":None if second_page else 10,"epoch":"pagination-test","startingBalance":12345})
        page.locator('#sessionToken').fill('test-only-operator-token');page.locator('#sessionForm button[type="submit"]').click();page.wait_for_function('()=>serverBrokerAccounts.length>0')
        page.route('**/api/ledger?*',ledger_route)
        page.evaluate('async()=>{await loadServerLedger()}')
        assert len(ledger_pages)==2
        assert page.evaluate('serverLedger.map(f=>f.id)')==['page-1','page-2']
        assert page.evaluate('ledgerStartingBalance')==12345
        # Actual zero equity/free margin must survive dashboard rendering.
        zero=page.evaluate("()=>{const saved=selectedBrokerAccount;const original=serverBrokerAccounts;const zero={id:'zero-test',balance:1000,equity:0,freeMargin:0,usedMargin:0};serverBrokerAccounts=[zero];selectedBrokerAccount=zero;updateDashboardMarketOverview();const result={equity:document.getElementById('dashEquity').textContent,margin:document.getElementById('dashFreeMargin').textContent,expected:money(0)};serverBrokerAccounts=original;selectedBrokerAccount=saved;return result}")
        assert zero['equity']==zero['expected']
        assert zero['margin']==zero['expected']
        page.unroute('**/api/ledger?*',ledger_route)
        # Real browser cookie authentication and paper ticket against isolated fixtures.
        page.locator('#sessionToken').fill('test-only-operator-token')
        page.locator('#sessionForm button[type="submit"]').click()
        page.wait_for_function('()=>serverBrokerAccounts.length>0')
        assert page.locator('#sessionToken').input_value()==''
        page.evaluate("async()=>{quoteRetryAt=0;await fetchLiveMarketQuotes()}")
        page.evaluate("switchView('trading')")
        page.locator('#view-trading .subtab-btn[data-subtab="ticket"]').click()
        page.locator('#directOrderSymbol').select_option('EURUSD')
        page.locator('#directOrderLots').fill('0.10')
        page.locator('#directOrderSL').fill('1.08')
        page.locator('#directOrderTP').fill('1.095')
        with page.expect_response('**/api/risk/calculate') as risk_response:
            page.locator('#checkOrderRiskBtn').click()
        assert risk_response.value.status==200
        with page.expect_response('**/api/orders/execute') as order_response:
            page.locator('#executeDirectOrderBtn').click()
        assert order_response.value.status==200
        assert order_response.value.json()['account']['positions'][0]['symbol']=='EURUSD'
        page.locator('#sessionLogout').click()
        page.wait_for_function('()=>serverBrokerAccounts.length===0')
        assert page.evaluate('currentAnalysis?.provenance?.executable') in [False,None]
        # Incident regression through the actual Gold button, with CSP enforced.
        page.evaluate("setLanguage('en');switchView('brokers');analysisRetryAt=0;analysisError='';currentAnalysis=null;renderBrokerDesk()")
        requests=[]
        def gold_failure(route):
            requests.append(route.request.url)
            route.fulfill(status=502,headers={'Content-Type':'application/json','Retry-After':'15'},json={'ok':False,'code':'MARKET_UNAVAILABLE','error':'Gold provider unavailable','correlationId':'browser-incident'})
        page.route('**/api/analyze',gold_failure)
        page.locator('#deskAnalyzeNowBtn').click()
        page.wait_for_function('()=>!analysisInFlight && analysisError.includes("Gold provider unavailable")')
        assert 'Analysis unavailable' in page.locator('#brokerDealsGrid').inner_text()
        assert 'Gold provider unavailable' in page.locator('#brokerDealsGrid').inner_text()
        assert page.locator('#analyzeBtn').is_enabled()
        page.locator('#deskAnalyzeNowBtn').click()
        assert len(requests)==1, 'cooldown must prevent repeated Gold calls'
        # Quota handling suspends quote refresh; concurrent calls share one request.
        quota=page.evaluate("""async()=>{
          const original=window.fetch;let calls=0;
          window.fetch=async(url,options)=>url.startsWith('/api/quotes')?(calls++,new Response(JSON.stringify({ok:false,retryAfter:60}),{status:429,headers:{'Retry-After':'60','Content-Type':'application/json'}})):original(url,options);
          quoteRetryAt=0;await Promise.all([fetchLiveMarketQuotes(),fetchLiveMarketQuotes()]);await fetchLiveMarketQuotes();window.fetch=original;
          return {calls,delay:quoteRetryAt-Date.now(),empty:Object.keys(liveQuotesCache).length===0};
        }""")
        assert quota['calls']==1 and quota['delay']>=59000 and quota['empty'],quota
        # Account switches preserve the selected account's authoritative positions and counters.
        switched=page.evaluate("""()=>{
          const selected={...DEFAULT_SANDBOX_ACCOUNT,id:'selected',positions:[],dailyRealizedPnl:0,todayTradesCount:0,balance:0,equity:0,freeMargin:0,permissionLevel:'READ_ONLY'};
          serverBrokerAccounts=[selected];switchActiveBrokerAccount('selected');
          return {positions:getBrokerAccount().positions.length,pnl:getBrokerAccount().dailyRealizedPnl,trades:getBrokerAccount().todayTradesCount,balance:getBrokerAccount().balance,label:document.getElementById('brokerActiveAccountSelect').textContent};
        }""")
        assert switched['positions']==0 and switched['pnl']==0 and switched['trades']==0 and switched['balance']==0
        assert '[PAPER]' in switched['label'] and 'LIVE REAL' not in switched['label']
        # Every navigation view remains functional at mobile widths in both directions.
        for lang in ['en','ar']:
            page.evaluate("setLanguage('"+lang+"')")
            assert page.locator('html').get_attribute('dir')==('rtl' if lang=='ar' else 'ltr')
            for width in [390,768,1440]:
                page.set_viewport_size({'width':width,'height':1000})
                for view in ['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings']:
                    if page.locator('#workspaceMenu').is_visible() and not page.locator('#workspaceNav').is_visible():
                        page.locator('#workspaceMenu').click()
                    page.locator('.nav-stack [data-view="'+view+'"]').click()
                    assert page.locator('#view-'+view).is_visible()
                    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(lang,width,view)
        assert not errors,errors
        browser.close()
        print('Browser regression (CSP enforced): navigation EN/AR, responsive charts, Gold outage, quote quota, account isolation, scanner, notifications, ledger and sizing PASS')
finally:
    server.terminate();server.wait(timeout=10)
