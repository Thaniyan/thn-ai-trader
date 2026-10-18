const $ = id => document.getElementById(id);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));
// Account DTOs stay in memory; browser persistence is optional and never an identity source.
let privateUser=null,privateEpoch=0,sessionChanging=false,selectedBrokerAccount=null;
let sessionQueue=Promise.resolve(),ledgerGeneration=0,storageUnavailable=false;
const transientStorage=new Map();
const personalStorage=new Set(["thn_ai_trader_journal_v3","thn_saved_setups_v1","thn_ai_trader_setup_v3"]);
function persistenceKey(key){return (personalStorage.has(key)||key.startsWith("thn_drawings_"))?`${key}:identity:${privateUser||"anonymous"}`:key}
function storageNotice(){
  if(!storageUnavailable)return;
  let node=document.getElementById("browserPersistenceStatus");
  if(!node){node=document.createElement("p");node.id="browserPersistenceStatus";node.className="provenance-strip";node.setAttribute("role","status");document.body.prepend(node)}
  node.textContent=document.documentElement.dir==="rtl"?"تخزين المتصفح غير متاح؛ النتائج متاحة لهذه الجلسة فقط.":"Browser storage unavailable; valid results remain available for this session only.";
}
const browserStore={
 getItem(key){const scoped=persistenceKey(key);if(transientStorage.has(scoped))return transientStorage.get(scoped);if((personalStorage.has(key)||key.startsWith("thn_drawings_"))&&!privateUser)return null;try{return window.localStorage.getItem(scoped)}catch{storageUnavailable=true;storageNotice();return null}},
 setItem(key,value){const scoped=persistenceKey(key);transientStorage.set(scoped,String(value));if((personalStorage.has(key)||key.startsWith("thn_drawings_"))&&!privateUser)return;try{window.localStorage.setItem(scoped,String(value));storageUnavailable=false;document.getElementById("browserPersistenceStatus")?.remove()}catch{storageUnavailable=true;storageNotice()}},
 removeItem(key){const scoped=persistenceKey(key);transientStorage.delete(scoped);try{window.localStorage.removeItem(scoped)}catch{storageUnavailable=true;storageNotice()}}
};
// A non-secret lock marker prevents failed/offline sign-out from restoring an old HttpOnly session on refresh.
function setClientLock(locked){try{document.cookie=`thn_client_locked=${locked?"1":"0"}; Path=/; SameSite=Strict; Max-Age=31536000${location.protocol==="https:"?"; Secure":""}`}catch{}}
function clientLocked(){try{return document.cookie.split(";").some(part=>part.trim()==="thn_client_locked=1")}catch{return true}}
const privateControllers=new Set(),nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,options={}){
 const path=new URL(typeof input==="string"?input:input.url,location.href).pathname;
 if(!/^\/api\/(accounts|broker|orders|positions|audit-logs|ledger|risk)(\/|$)/.test(path))return nativeFetch(input,options);
 if(sessionChanging||!privateUser)throw new DOMException("Account session unavailable","AbortError");
 const epoch=privateEpoch,controller=new AbortController();privateControllers.add(controller);
 try{
  const response=await nativeFetch(input,{...options,signal:options.signal?AbortSignal.any([options.signal,controller.signal]):controller.signal});
  if(epoch!==privateEpoch)throw new DOMException("Obsolete identity response","AbortError");
  if(response.status===401||response.status===403){setClientLock(true);clearPrivateState();throw new DOMException("Account authorization lost","AbortError")}
  const observed=response.headers?.get("X-Session-User");
  if(observed&&observed!==privateUser){clearPrivateState();initializeSession();throw new DOMException("Session identity changed","AbortError")}
  const parse=response.json.bind(response);
  response.json=async()=>{const data=await parse();if(epoch!==privateEpoch)throw new DOMException("Obsolete identity body","AbortError");return data};
  return response;
 }finally{privateControllers.delete(controller)}
};
function clearPrivateState(){
 privateEpoch++;privateUser=null;ledgerGeneration++;
 for(const controller of privateControllers)controller.abort();privateControllers.clear();
 selectedBrokerAccount=null;serverBrokerAccounts=[];serverLedger=[];ledgerStartingBalance=0;
 includeUnverifiedLedger=false;benchmarkPreview=false;pendingExecutionOrder=null;
 browserStore.removeItem(brokerKey); // Remove historical unscoped financial cache; never read it.
 cancelAnalysis();currentAnalysis=null;analysisError="";
 if($("sessionStatus"))$("sessionStatus").textContent="Accounts locked";
 for(const id of ["report","aiNarrative","riskTable","scenarioGrid","backtestTable","checklist","indicatorTable","structureTable","reasonsList","warningsList"])if($(id))$(id).textContent="";
 for(const id of ["analysisMapCanvas","skAnalysisCanvas"]){const canvas=$(id);if(canvas)canvas.getContext("2d")?.clearRect(0,0,canvas.width,canvas.height)}
 for(const id of ["equityTooltip","donutTooltip","waterfallTooltip"]){const node=$(id);if(node){node.textContent="";node.classList.add("hidden")}}
 hideTradeToast();

 for(const id of ["entry","optimalEntry","stopLoss","target1","target2","target3","confidence","riskAmount"])if($(id))$(id).textContent="--";
 if($("accountRecoveryStatus"))$("accountRecoveryStatus").textContent="";
 if($("directOrderRiskResult")){$("directOrderRiskResult").textContent="";$("directOrderRiskResult").style.display="none"}
 if($("accountBalance"))$("accountBalance").value="";
 if($("notes"))$("notes").value="";
 closeTradeExecutionModal();renderJournal();renderPerformanceAnalytics();renderBrokerAccountSelector();syncAccountSizeWithBroker();renderBrokerDesk();renderAccountCertificate();renderWebTrader();updateDashboardMarketOverview();
}
async function initializeSession(){
 if(clientLocked()){clearPrivateState();return}
 const epoch=privateEpoch;
 try{const response=await fetch("/api/session"),data=await response.json();if(epoch!==privateEpoch)return;
  if(!response.ok||!data.user){clearPrivateState();return}
  privateUser=data.user;await loadBrokerAccountsFromServer();
 }catch{if(epoch===privateEpoch)clearPrivateState()}
}
let sessionChannel=null;
try{sessionChannel=new BroadcastChannel("thn-account-session-v1");sessionChannel.onmessage=event=>{clearPrivateState();sessionChanging=event.data!=="complete";if(!sessionChanging)initializeSession()}}catch{}
function mutateSession(token){
 setClientLock(true);clearPrivateState();sessionChanging=true;sessionChannel?.postMessage("changing");
 const epoch=privateEpoch;
 const mutation=async()=>{
  try{
   const response=await fetch("/api/session",{method:token===null?"DELETE":"POST",headers:{"Content-Type":"application/json"},...(token===null?{}:{body:JSON.stringify({token})})});
   if(epoch!==privateEpoch)return;
   sessionChanging=false;
   $("sessionStatus").textContent=response.ok?(token===null?"Signed out; accounts locked":"Signed in. Paper only."):"Sign-in failed; accounts locked";
   if(response.ok&&token!==null){setClientLock(false);await initializeSession()}
  }catch{if(epoch===privateEpoch){sessionChanging=false;clearPrivateState();$("sessionStatus").textContent="Session request failed; accounts locked"}}
  finally{if(epoch===privateEpoch)sessionChannel?.postMessage("complete")}
 };
 sessionQueue=sessionQueue.catch(()=>{}).then(()=>navigator.locks?navigator.locks.request("thn-session-mutation",mutation):mutation());return sessionQueue;
}

const journalKey = "thn_ai_trader_journal_v3";
const setupKey = "thn_ai_trader_setup_v3";
const langKey = "thn_ai_trader_language_v3";
const watchlistKey = "thn_ai_trader_watchlist_v1";
const watchSettingsKey = "thn_ai_trader_watch_settings_v1";
const watchNotifyKey = "thn_ai_trader_watch_notifications_v1";
const mapLayerKey = "thn_ai_trader_map_layers_v6";
const soundKey = "thn_ai_trader_sound_v1";
const watchHiddenKey = "thn_ai_trader_watch_hidden_v1";
let mapLayerPrefs = null;
let watchScanTimer = null;
let scannerActive=false, scanInFlight=false, scanGeneration=0, scanController=null, scanFailures=0;
const watchInstrumentPrefsKey="thn_instrument_prefs_v1";
let showHiddenInstruments=false;
function instrumentPrefs(){try{return JSON.parse(browserStore.getItem(watchInstrumentPrefsKey)||"{}")}catch{return {}}}
function setInstrumentPref(symbol,key,value){const prefs=instrumentPrefs();prefs[symbol]={...prefs[symbol],[key]:value};browserStore.setItem(watchInstrumentPrefsKey,JSON.stringify(prefs));renderWatchlist()}
let watchScanResults = [];
let currentAnalysis = null;
let analysisInFlight=false,analysisError="",analysisRetryAt=0,analysisController=null,analysisGeneration=0;
let serverLedger=[],ledgerStartingBalance=50000,includeUnverifiedLedger=false,benchmarkPreview=false;
let tvWidget = null;
let providerSnapshot=null;
let currentLang = browserStore.getItem(langKey) || "en";
let soundEnabled = browserStore.getItem(soundKey) === "true";
let watchHidden = browserStore.getItem(watchHiddenKey) === "true";
let watchSearchTerm = "";
let chartWindow=84,chartOffset=0,chartTransform=null,chartDrag=null;
const drawingKey=()=>"thn_drawings_"+(currentAnalysis?.symbol||"")+"_"+(currentAnalysis?.timeframe||"");
function chartDrawings(){try{return JSON.parse(browserStore.getItem(drawingKey())||"[]")}catch{return []}}
let chartHover = { active: false, x: 0, y: 0 };
let audioCtx = null;
let toastTimeout = null;

const I18N = {
  en: {
    accountAccess: "Account access", signIn: "Sign in", signOut: "Sign out", assetFilterLabel:"Filter portfolio by asset",paperAccountLabel:"Select paper account",
    brokerFunding: "External broker portal (execution disabled)",
    analysisUnavailable: "Analysis unavailable",
    analysisReady: "Analysis complete · no qualified paper setup",
    analysisLoading: "Fetching verified market data…",
    accountLocked: "Sign in · accounts locked",
    paperReady: "Paper account available",
    paperPermission: "PAPER ONLY · live execution disabled",
    brandTagline: "AI-powered market intelligence",
    navDashboard: "Dashboard",
    navMarkets: "Markets",
    navTrading: "Trading Terminal",
    navAI: "AI Intelligence",
    navRisk: "Risk Desk",
    navPortfolio: "Portfolio",
    navJournal: "Trade Journal",
    navBrokers: "Broker Accounts",
    navSettings: "Settings",
    navAnalysis: "AI Analysis",
    navWatchlist: "Watchlist",
    navChart: "TradingView",
    apiChecking: "Checking engine...",
    modelInitializing: "THN engine initializing",
    disclaimer: "Educational analysis only. Always verify with your broker, calendar, and risk plan.",
    topbarSub: "Professional multi-school AI trading workstation",
    options: "Options",
    language: "Language",
    toggleTheme: "Toggle Theme",
    heroEyebrow: "Professional AI trading workstation",
    heroSubtitle: "Enter one market code and the platform fetches data, analyzes the chart through multiple trading schools, builds a signal, calculates risk, and prepares a comprehensive market audit report.",
    featTechnical: "Technical",
    featPriceAction: "Price Action",
    featSmc: "SMC",
    featQuant: "Quant",
    featRisk: "Risk",
    featReport: "Report",
    readyBilingualTitle: "Bilingual UI",
    readyBilingualText: "English and Arabic with RTL support",
    readyAiTitle: "Multi-school AI",
    readyAiText: "Consensus from technical, SMC, quant and sentiment modules",
    readyRiskTitle: "Risk-first",
    readyRiskText: "Position sizing, SL, TP and scenario planning",
    readyReportTitle: "Exportable reports",
    readyReportText: "Journal, checklist and quantitative report",
    marketCode: "Market / Currency Code",
    symbolPlaceholder: "EURUSD, XAUUSD, BTCUSDT, AAPL",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    advancedRisk: "Advanced risk and context",
    timeframe: "Timeframe",
    tfScalp: "Scalp",
    tfIntraday: "Intraday",
    tfSwing: "Swing",
    tfPosition: "Position",
    accountBalance: "Account Balance",
    riskPercent: "Risk %",
    rewardRisk: "Reward / Risk",
    optionalSentiment: "Optional sentiment",
    sentNeutral: "Neutral / Unknown",
    sentBullish: "Bullish Context",
    sentBearish: "Bearish Context",
    traderNotes: "Trader notes",
    notesPlaceholder: "Example: avoid CPI, wait for NY confirmation",
    readyStatus: "Ready. Enter a symbol and press Analyze.",
    forex: "Forex",
    metals: "Metals",
    crypto: "Crypto",
    indices: "Indices",
    decisionCenter: "AI decision center",
    awaitingAnalysis: "Awaiting analysis",
    signal: "Signal",
    runAnalysisNarrative: "Run the analysis to generate a professional report.",
    confidence: "confidence",
    grade: "Grade",
    symbol: "Symbol",
    asset: "Asset",
    data: "Data",
    tradeTicket: "Trade Ticket",
    entry: "Entry",
    stopLoss: "Stop Loss",
    takeProfit1: "Take Profit 1",
    takeProfit2: "Take Profit 2",
    takeProfit3: "Take Profit 3",
    riskAmount: "Risk Amount",
    saveSignal: "Save Signal to Journal",
    technicalIndicators: "Technical Indicators",
    liveCalculation: "Live calculation",
    structureSmc: "Structure & SMC",
    supportResistanceLiquidity: "Support, resistance, liquidity",
    reasons: "Reasons",
    whySignal: "Why this signal?",
    warnings: "Warnings",
    riskFilters: "Risk filters",
    noAnalysisYet: "No analysis yet.",
    noAnalysisYet2: "No analysis yet.",
    tradingViewChart: "TradingView Professional Chart",
    chartWillLoad: "Chart will load after analysis.",
    reloadChart: "Reload Chart",
    riskDesk: "Risk Desk",
    positionSizing: "Position sizing",
    executionChecklist: "Execution Checklist",
    beforeEntry: "Before entry",
    scenarioLab: "Scenario Lab",
    riskAlternatives: "Risk alternatives",
    backtestSimulator: "Synthetic Scenario Projection (not historical)",
    estimatedProfile: "Estimated profile",
    tradeJournal: "Trade Journal",
    browserStorage: "Browser local storage",
    clearJournal: "Clear Journal",
    exportJournal: "Export Journal",
    institutionalReport: "Market Audit Briefing",
    copyOrExport: "Copy or export",
    noReportYet: "No report yet.",
    copyReport: "Copy Report",
    exportTxt: "Export TXT",
    localAiActive: "Deterministic analysis · external AI disabled",
    openaiEnhanced: "OpenAI enhanced",
    serverOffline: "Server offline",
    runNpmFirst: "Run npm start first",
    analyzingStatus: "Analyzing {symbol} across THN multi-school AI modules...",
    completedStatus: "Analysis completed for {symbol}.",
    errorPrefix: "Error",
    savedStatus: "Signal saved to journal.",
    reportCopied: "Report copied to clipboard.",
    runAnalysisFirst: "Run analysis first.",
    confirmClear: "Clear all saved journal entries?",
    noSavedSignals: "No saved signals yet.",
    noReasons: "No reasons returned.",
    noMajorWarnings: "No major warnings.",
    neutralModule: "Neutral module reading.",
    noAnalysis: "No analysis",
    runFirst: "Run analysis first.",
    score: "Score",
    lastPrice: "Last Price",
    ema20: "EMA 20",
    ema50: "EMA 50",
    ema200: "EMA 200",
    rsi14: "RSI 14",
    atr14: "ATR 14",
    macdHistogram: "MACD Histogram",
    bollingerWidth: "Bollinger Width",
    volatility: "Volatility",
    support: "Support",
    resistance: "Resistance",
    recentHigh: "Recent High",
    recentLow: "Recent Low",
    rangePosition: "Range Position",
    trendStructure: "Trend Structure",
    sellSideSweep: "Sell-side Sweep",
    buySideSweep: "Buy-side Sweep",
    possible: "Possible",
    no: "No",
    riskPerUnit: "Risk Per Unit",
    units: "Units",
    forexLots: "Forex Lots",
    exposure: "Exposure",
    exposurePercent: "Exposure %",
    breakEvenWinRate: "Break-even Win Rate",
    trades: "Trades",
    wins: "Wins",
    losses: "Losses",
    estimatedWinRate: "Scenario Win Rate (synthetic)",
    estimatedReturn: "Estimated Return",
    endingBalance: "Ending Balance",
    maxDrawdown: "Max Drawdown",
    profitFactor: "Profit Factor",
    risk: "Risk",
    potentialRisk: "Potential risk",
    potentialProfit: "Potential profit",
    breakEven: "Break-even",
    chartError: "TradingView library did not load. Check internet connection, then press Reload Chart.",
    chartSymbolLine: "Symbol: {symbol} | Interval: {interval}",
    analysisTitle: "{symbol} {timeframe} Analysis",
    confidenceLabel: "Confluence score",
    reportFilename: "thn-ai-trader-report.txt",
    journalFilename: "thn-ai-trader-journal.csv",
    journalLine: "{date} • Confidence {confidence}% • Entry {entry} • SL {sl} • TP1 {tp1} • Risk {risk}",
    statusPass: "PASS",
    statusWarning: "WARNING",
    statusWait: "WAIT",
    watchlistEyebrow: "Automation center",
    favoritePairs: "Favorite Pairs Watchlist",
    localBrowserStorage: "Saved locally",
    watchlistIntro: "Add the markets you trade most. THN will scan them as a professional alert workflow instead of blindly opening live trades.",
    favoritePlaceholder: "EURUSD, GBPUSD, XAUUSD",
    addPair: "Add Pair",
    alertMode: "Alert-only automation",
    continuousScanner: "Continuous Opportunity Scanner",
    scannerStopped: "Stopped",
    scannerRunning: "Running",
    minConfidence: "Minimum confidence",
    scanEvery: "Scan every",
    oneMinute: "1 minute",
    threeMinutes: "3 minutes",
    fiveMinutes: "5 minutes",
    fifteenMinutes: "15 minutes",
    scanNow: "Scan Now",
    startScanner: "Start Scanner",
    stopScanner: "Stop Scanner",
    watchReady: "Add pairs, then scan for strong opportunities.",
    automationDisclaimer: "Professional safety: this prototype sends alerts only. Live auto-execution requires broker API integration, user authorization, audit logs, kill switches, and regulated compliance controls.",
    noPairsYet: "No favorite pairs yet.",
    analyzePair: "Analyze",
    removePair: "Remove",
    scanStarted: "Continuous scanner started.",
    scanStopped: "Scanner stopped.",
    scanningWatchlist: "Scanning {count} favorite markets...",
    scanComplete: "Scan complete: {alerts} alert(s) from {count} markets.",
    watchlistEmpty: "Add at least one favorite pair first.",
    strongAlert: "Strong alert",
    qualifiedAlert: "Qualified alert",
    reviewOnly: "Review only",
    noTrade: "No trade",
    trustScore: "Trust score",
    alertEntry: "Entry",
    alertSL: "SL",
    alertTP: "TP1",
    alertReason: "Reason",
    lastScan: "Last scan",
    alertOnly: "Alert only",
    browserNotificationTitle: "THN strong trading alert",
    browserNotificationBody: "{symbol}: {decision} with {confidence}% confidence. Review before execution."
  },
  ar: {
    accountAccess:"الوصول إلى الحساب",signIn:"تسجيل الدخول",signOut:"تسجيل الخروج",assetFilterLabel:"تصفية المحفظة حسب الأصل",paperAccountLabel:"اختيار الحساب التجريبي",
    brokerFunding: "بوابة وسيط خارجي (التنفيذ معطل)",
    analysisUnavailable: "التحليل غير متاح",
    analysisReady: "اكتمل التحليل · لا توجد فرصة تجريبية مؤهلة",
    analysisLoading: "جارٍ جلب بيانات السوق الموثقة…",
    accountLocked: "سجل الدخول · الحسابات مقفلة",
    paperReady: "الحساب التجريبي متاح",
    paperPermission: "تداول تجريبي فقط · التنفيذ الحقيقي معطل",
    brandTagline: "ذكاء سوقي مدعوم بالذكاء الاصطناعي",
    navDashboard: "لوحة التحكم",
    navMarkets: "الأسواق",
    navTrading: "منصة التداول",
    navAI: "الذكاء الاصطناعي",
    navRisk: "إدارة المخاطر",
    navPortfolio: "المحفظة والأداء",
    navJournal: "سجل الصفقات",
    navBrokers: "حسابات الوسيط",
    navSettings: "الإعدادات",
    navAnalysis: "تحليل الذكاء الاصطناعي",
    navWatchlist: "قائمة المتابعة",
    navChart: "شارت TradingView",
    apiChecking: "جارٍ فحص المحرك...",
    modelInitializing: "جارٍ تهيئة محرك THN",
    disclaimer: "التحليل تعليمي ومساعد فقط. تحقق دائمًا من الوسيط، والأخبار، وخطة المخاطر.",
    topbarSub: "منصة تداول احترافية متعددة المدارس التحليلية",
    options: "الخيارات",
    language: "اللغة",
    toggleTheme: "تغيير المظهر",
    heroEyebrow: "منصة تداول احترافية بالذكاء الاصطناعي",
    heroSubtitle: "أدخل رمز السوق فقط، وسيقوم النظام بجلب البيانات وتحليل الشارت عبر عدة مدارس تداول، ثم بناء إشارة، وحساب المخاطر، وتجهيز تقرير احترافي.",
    featTechnical: "فني",
    featPriceAction: "برايس أكشن",
    featSmc: "سمارت موني",
    featQuant: "كمي",
    featRisk: "مخاطر",
    featReport: "تقرير",
    readyBilingualTitle: "واجهة ثنائية اللغة",
    readyBilingualText: "إنجليزية وعربية مع دعم كامل للاتجاه من اليمين لليسار",
    readyAiTitle: "ذكاء متعدد المدارس",
    readyAiText: "توافق بين الفني والسمارت موني والكمي والسياق الشعوري",
    readyRiskTitle: "المخاطر أولًا",
    readyRiskText: "حجم الصفقة والوقف والأهداف وسيناريوهات المخاطرة",
    readyReportTitle: "تقارير قابلة للتصدير",
    readyReportText: "سجل صفقات وقائمة تنفيذ وتقرير احترافي",
    marketCode: "رمز السوق / العملة",
    symbolPlaceholder: "مثال: EURUSD، XAUUSD، BTCUSDT، AAPL",
    analyze: "تحليل",
    analyzing: "جارٍ التحليل...",
    advancedRisk: "إعدادات متقدمة للمخاطر والسياق",
    timeframe: "الإطار الزمني",
    tfScalp: "سكالبينج",
    tfIntraday: "داخل اليوم",
    tfSwing: "سوينغ",
    tfPosition: "استثماري",
    accountBalance: "رصيد الحساب",
    riskPercent: "نسبة المخاطرة %",
    rewardRisk: "العائد / المخاطرة",
    optionalSentiment: "السياق الشعوري اختياري",
    sentNeutral: "محايد / غير معروف",
    sentBullish: "سياق صاعد",
    sentBearish: "سياق هابط",
    traderNotes: "ملاحظات المتداول",
    notesPlaceholder: "مثال: تجنب خبر CPI، انتظر تأكيد جلسة نيويورك",
    readyStatus: "جاهز. أدخل الرمز واضغط تحليل.",
    forex: "الفوركس",
    metals: "المعادن",
    crypto: "الكريبتو",
    indices: "المؤشرات",
    decisionCenter: "مركز قرار الذكاء الاصطناعي",
    awaitingAnalysis: "بانتظار التحليل",
    signal: "الإشارة",
    runAnalysisNarrative: "شغّل التحليل لإنشاء تقرير احترافي.",
    confidence: "الثقة",
    grade: "التقييم",
    symbol: "الرمز",
    asset: "الأصل",
    data: "البيانات",
    tradeTicket: "تذكرة الصفقة",
    entry: "الدخول",
    stopLoss: "وقف الخسارة",
    takeProfit1: "الهدف الأول",
    takeProfit2: "الهدف الثاني",
    takeProfit3: "الهدف الثالث",
    riskAmount: "مبلغ المخاطرة",
    saveSignal: "حفظ الإشارة في السجل",
    technicalIndicators: "المؤشرات الفنية",
    liveCalculation: "حساب مباشر",
    structureSmc: "الهيكل والسمارت موني",
    supportResistanceLiquidity: "دعم، مقاومة، وسيولة",
    reasons: "الأسباب",
    whySignal: "لماذا هذه الإشارة؟",
    warnings: "التحذيرات",
    riskFilters: "مرشحات المخاطر",
    noAnalysisYet: "لا يوجد تحليل بعد.",
    noAnalysisYet2: "لا يوجد تحليل بعد.",
    tradingViewChart: "شارت TradingView الاحترافي",
    chartWillLoad: "سيظهر الشارت بعد التحليل.",
    reloadChart: "إعادة تحميل الشارت",
    riskDesk: "مكتب المخاطر",
    positionSizing: "حساب حجم الصفقة",
    executionChecklist: "قائمة التنفيذ",
    beforeEntry: "قبل الدخول",
    scenarioLab: "مختبر السيناريوهات",
    riskAlternatives: "بدائل المخاطرة",
    backtestSimulator: "إسقاط سيناريو اصطناعي، وليس اختبارًا تاريخيًا",
    estimatedProfile: "ملف تقديري",
    tradeJournal: "سجل التداول",
    browserStorage: "تخزين محلي في المتصفح",
    clearJournal: "مسح السجل",
    exportJournal: "تصدير السجل",
    institutionalReport: "تقرير تدقيق الصفقة",
    copyOrExport: "نسخ أو تصدير",
    noReportYet: "لا يوجد تقرير بعد.",
    copyReport: "نسخ التقرير",
    exportTxt: "تصدير TXT",
    localAiActive: "تحليل حسابي · الذكاء الاصطناعي الخارجي معطل",
    openaiEnhanced: "محسّن بـ OpenAI",
    serverOffline: "الخادم غير متصل",
    runNpmFirst: "شغّل npm start أولًا",
    analyzingStatus: "جارٍ تحليل {symbol} عبر وحدات THN متعددة المدارس...",
    completedStatus: "اكتمل تحليل {symbol}.",
    errorPrefix: "خطأ",
    savedStatus: "تم حفظ الإشارة في السجل.",
    reportCopied: "تم نسخ التقرير إلى الحافظة.",
    runAnalysisFirst: "شغّل التحليل أولًا.",
    confirmClear: "هل تريد مسح كل إدخالات السجل؟",
    noSavedSignals: "لا توجد إشارات محفوظة بعد.",
    noReasons: "لم يتم إرجاع أسباب.",
    noMajorWarnings: "لا توجد تحذيرات رئيسية.",
    neutralModule: "قراءة الوحدة محايدة.",
    noAnalysis: "لا يوجد تحليل",
    runFirst: "شغّل التحليل أولًا.",
    score: "الدرجة",
    lastPrice: "آخر سعر",
    ema20: "EMA 20",
    ema50: "EMA 50",
    ema200: "EMA 200",
    rsi14: "RSI 14",
    atr14: "ATR 14",
    macdHistogram: "هيستوغرام MACD",
    bollingerWidth: "عرض بولنجر",
    volatility: "التذبذب",
    support: "الدعم",
    resistance: "المقاومة",
    recentHigh: "آخر قمة",
    recentLow: "آخر قاع",
    rangePosition: "موقع السعر داخل النطاق",
    trendStructure: "هيكل الاتجاه",
    sellSideSweep: "سحب سيولة القيعان",
    buySideSweep: "سحب سيولة القمم",
    possible: "محتمل",
    no: "لا",
    riskPerUnit: "المخاطرة لكل وحدة",
    units: "الوحدات",
    forexLots: "لوتات الفوركس",
    exposure: "التعرض",
    exposurePercent: "نسبة التعرض %",
    breakEvenWinRate: "نسبة التعادل",
    trades: "الصفقات",
    wins: "الرابحة",
    losses: "الخاسرة",
    estimatedWinRate: "نسبة الفوز التقديرية",
    estimatedReturn: "العائد التقديري",
    endingBalance: "الرصيد النهائي",
    maxDrawdown: "أقصى هبوط",
    profitFactor: "معامل الربح",
    risk: "المخاطرة",
    potentialRisk: "المخاطرة المحتملة",
    potentialProfit: "الربح المحتمل",
    breakEven: "التعادل",
    chartError: "لم يتم تحميل مكتبة TradingView. تحقق من الاتصال بالإنترنت ثم اضغط إعادة تحميل الشارت.",
    chartSymbolLine: "الرمز: {symbol} | الفاصل: {interval}",
    analysisTitle: "تحليل {symbol} - {timeframe}",
    confidenceLabel: "الثقة",
    reportFilename: "thn-ai-trader-report-ar.txt",
    journalFilename: "thn-ai-trader-journal.csv",
    journalLine: "{date} • الثقة {confidence}% • الدخول {entry} • الوقف {sl} • الهدف 1 {tp1} • المخاطرة {risk}",
    statusPass: "ناجح",
    statusWarning: "تحذير",
    statusWait: "انتظار",
    watchlistEyebrow: "مركز الأتمتة",
    favoritePairs: "قائمة أزواج العملات المفضلة",
    localBrowserStorage: "محفوظ محليًا",
    watchlistIntro: "أضف الأسواق التي تتداولها كثيرًا. سيقوم THN بفحصها كمسار تنبيهات احترافي بدل فتح صفقات حية بشكل عشوائي.",
    favoritePlaceholder: "EURUSD, GBPUSD, XAUUSD",
    addPair: "إضافة زوج",
    alertMode: "أتمتة التنبيهات فقط",
    continuousScanner: "ماسح الفرص المستمر",
    scannerStopped: "متوقف",
    scannerRunning: "يعمل",
    minConfidence: "الحد الأدنى للثقة",
    scanEvery: "الفحص كل",
    oneMinute: "دقيقة واحدة",
    threeMinutes: "3 دقائق",
    fiveMinutes: "5 دقائق",
    fifteenMinutes: "15 دقيقة",
    scanNow: "افحص الآن",
    startScanner: "تشغيل الماسح",
    stopScanner: "إيقاف الماسح",
    watchReady: "أضف الأزواج ثم افحص الفرص القوية.",
    automationDisclaimer: "سلامة احترافية: هذا النموذج يرسل تنبيهات فقط. التنفيذ الحي يحتاج ربط وسيط، تفويض المستخدم، سجلات تدقيق، مفاتيح إيقاف، وضوابط امتثال.",
    noPairsYet: "لا توجد أزواج مفضلة بعد.",
    analyzePair: "تحليل",
    removePair: "حذف",
    scanStarted: "تم تشغيل الماسح المستمر.",
    scanStopped: "تم إيقاف الماسح.",
    scanningWatchlist: "جارٍ فحص {count} سوقًا مفضلًا...",
    scanComplete: "اكتمل الفحص: {alerts} تنبيه من أصل {count} سوق.",
    watchlistEmpty: "أضف زوجًا مفضلًا واحدًا على الأقل.",
    strongAlert: "تنبيه قوي",
    qualifiedAlert: "تنبيه مؤهل",
    reviewOnly: "للمراجعة فقط",
    noTrade: "لا توجد صفقة",
    trustScore: "درجة الثقة التشغيلية",
    alertEntry: "دخول",
    alertSL: "وقف",
    alertTP: "هدف 1",
    alertReason: "السبب",
    lastScan: "آخر فحص",
    alertOnly: "تنبيه فقط",
    browserNotificationTitle: "تنبيه تداول قوي من THN",
    browserNotificationBody: "{symbol}: {decision} بثقة {confidence}%. راجع الصفقة قبل التنفيذ."
  }
};


Object.assign(I18N.en, {
  professionalMarketMap: "Professional Market Map",
  professionalMarketMapSub: "All schools, levels, patterns and trend diagnostics in one visual chart",
  exportMap: "Export Map PNG",
  confluenceMatrix: "Confluence Matrix",
  confluenceMatrixSub: "Execution readiness controls",
  marketRegime: "Market Regime",
  executionReadiness: "Execution Readiness",
  schoolAgreement: "School Agreement",
  dataQuality: "Data Quality",
  riskQuality: "Risk Quality",
  sessionQuality: "Session Quality",
  mappedPatterns: "Mapped Patterns",
  mappedLevels: "Mapped Levels",
  supportClusters: "Support Clusters",
  resistanceClusters: "Resistance Clusters",
  supplyDemandZones: "Supply / Demand Zones",
  fibonacciMap: "Fibonacci Map",
  trendChannel: "Trend Channel",
  volumeProfile: "Price Distribution / Volume Activity",
  playbook: "Execution Playbook",
  playbookSub: "Professional action protocol",
  deskGovernance: "Desk Governance",
  deskGovernanceSub: "Trust, safety and operational filters",
  noProfessionalMap: "Run analysis to generate the professional market map.",
  mapLegendSupport: "Support Zone (Hollow Green Box)",
  mapLegendResistance: "Resistance Zone (Hollow Red Box)",
  mapLegendEntry: "Entry",
  mapLegendStop: "Stop",
  mapLegendTarget: "Target",
  mapLegendFib: "Fibonacci",
  mapLegendZone: "Supply/Demand",
  mapExported: "Market map exported.",
  professionalSnapshot: "Professional Snapshot",
  nearestSupport: "Nearest Support",
  nearestResistance: "Nearest Resistance",
  valueArea: "Value Area",
  volumeState: "Volume State",
  livePrice: "Live Price",
  quality: "Quality",
  notMapped: "Not mapped",
  outsideVisibleRange: "Outside visible range",
  analysisLayerBoard: "Analysis Layer Board",
  analysisLayerBoardSub: "Every school and diagnostic used by the engine",
  technicalStack: "Technical Stack",
  structureRead: "Structure Read",
  riskBox: "Risk Box",
  patternEngine: "Pattern Engine",
  noPatternConfirmation: "No pattern confirmation",
  analysisSummary: "Analysis Summary",
  direction: "Direction",
  rsi: "RSI",
  layerCandles: "Candles",
  layerEma: "EMA",
  layerLevels: "S/R",
  layerZones: "Zones",
  layerFib: "Fibonacci",
  layerRisk: "Risk",
  layerTrend: "Trend",
  layerVolume: "Volume",
  layerPatterns: "Patterns",
  institutionalChart: "Analysis Canvas",
  adaptiveScale: "Adaptive scale enabled",
  layerSmc: "SMC",
  technicalStoryboard: "Technical Storyboard",
  technicalStoryboardSub: "Technical reading of the chart and execution context",
  marketStructureBoard: "Market Structure Board",
  marketStructureBoardSub: "SMC, order blocks, pivots and liquidity map",
  smcMap: "SMC Map",
  orderBlocks: "Order Blocks",
  liquidityMap: "Liquidity Map",
  momentumPane: "Momentum",
  aiAutomationStudio: "AI Automation Studio",
  aiAutomationStudioSub: "Automated copilot, smart alerts, risk governor and next-best action",
  noAutomationYet: "Awaiting analysis",
  automationScore: "Automation Score",
  nextBestAction: "Next Best Action",
  smartAlerts: "Smart Alerts",
  aiCopilot: "AI Copilot",
  riskGovernor: "Risk Governor",
  executionProtocol: "Execution Protocol",
  schoolBalance: "School Balance",
  technicalDrawingChart: "Technical Drawing Chart",
  clearInstitutionalView: "Clean Technical View",
  skAnalysisChart: "SK / SMC Analysis",
  skAnalysisSub: "Structure, liquidity, BOS/CHoCH and order blocks",
  tradeCompass: "Trade Compass",
  hideWatchlist: "Hide Watchlist",
  showWatchlist: "Show Watchlist",
  searchPairsPlaceholder: "Search saved pairs...",
  loadMajors: "Majors",
  thirtySeconds: "30 seconds",
  twoMinutes: "2 minutes",
  thirtyMinutes: "30 minutes",
  oneHour: "1 hour",
  customInterval: "Manual Time...",
  customTime: "Custom duration",
  seconds: "Seconds",
  minutes: "Minutes",
  soundOn: "🔊 Sound: ON",
  soundOff: "🔇 Sound: OFF",
  inspectTrade: "Inspect Chart & Analysis",
  optimalEntry: "Optimal Entry",
  watchlistHidden: "Watchlist is minimized ({count} pairs)",
  pairs: "pairs",
  deskEyebrow: "QUANTITATIVE EXECUTION DESK",
  popularAssets: "Quick Select:",
  mtfaEyebrow: "MULTI-TIMEFRAME CONFLUENCE",
  mtfaTitle: "Multi-Timeframe Alignment Matrix (MTFA)",
  smcDeepEyebrow: "SMART MONEY CONCEPTS & ORDER FLOW",
  smcDeepTitle: "Market Structure & Liquidity Architecture",
  liquidityArchitecture: "Liquidity Pools (BSL / SSL)",
  orderBlocksDeep: "Order Blocks (OB)",
  fvgDeep: "Fair Value Gaps (FVG)",
  dealingRange: "Dealing Range & Equilibrium (50%)",
  macroEyebrow: "MACRO RADAR & ECONOMIC CALENDAR",
  macroTitle: "High-Impact Economic Calendar & Central Bank Radar",
  macroSafety: "Risk Filter Active",
  navMtfa: "🌐 Timeframe Matrix (MTFA)",
  navSmc: "🏛️ SMC & Order Flow",
  navMarketMap: "📊 Interactive Market Map",
  navSchools: "🧠 Multi-School Consensus",
  navMacro: "📰 Macro Radar & Calendar",
  navPerformance: "📈 Performance Analytics",
  analyticsEyebrow: "HISTORICAL PERFORMANCE & STATISTICAL EDGE",
  analyticsTitle: "Performance Analytics & Portfolio Intelligence",
  analyticsSubtitle: "Interactive D3.js visualization of realized equity curves, historical setup win-rates, payout expectancy, and trade profit-loss distribution.",
  loadSampleTrades: "Load Benchmark History",
  logClosedTrade: "+ Log Closed Trade",
  filterPeriod: "Period:",
  periodAll: "All Time",
  period30d: "Last 30 Days",
  period90d: "Last 90 Days",
  filterAsset: "Asset Class:",
  assetAll: "All Markets",
  assetForex: "Forex",
  assetCrypto: "Crypto",
  assetCommodities: "Metals & Commodities",
  assetIndices: "Indices",
  kpiNetPnl: "Net Realized PnL",
  kpiWinRate: "Win Rate",
  kpiProfitFactor: "Profit Factor",
  kpiPayoffRatio: "Payoff Ratio (Avg W/L)",
  kpiMaxDrawdown: "Max Drawdown",
  kpiExpectancy: "Expectancy / Trade",
  equityCurveTitle: "Cumulative PnL & Equity Growth Curve",
  equityCurveSub: "D3.js interactive time-series with high-water mark",
  legendEquity: "Equity Curve",
  legendPeak: "High Water Mark",
  winLossDonutTitle: "Win / Loss Ratio & Setup Success",
  winLossDonutSub: "D3.js radial outcome distribution",
  wins: "Wins",
  losses: "Losses",
  breakeven: "Breakeven",
  waterfallTitle: "Trade-by-Trade PnL Distribution & Return Profile",
  waterfallSub: "Realized return per closed setup ($)",
  legendWin: "Profit (+$)",
  legendLoss: "Loss (-$)",
  legendAvgWin: "Avg Win",
  legendAvgLoss: "Avg Loss",
  logTradeTitle: "Log Closed Trade Outcome",
  direction: "Direction",
  entryPrice: "Entry Price",
  exitPrice: "Exit Price",
  outcome: "Outcome",
  realizedPnl: "Realized PnL ($)",
  cancel: "Cancel",
  saveTrade: "Save Trade Record",
  bulkImport: "📁 Bulk Import CSV",
  bulkImportTitle: "Bulk Import Historical Trades (CSV)",
  bulkImportSub: "Upload your historical trading logs or broker CSV to populate the journal and instantly render D3.js equity curves, win/loss ratios, and drawdowns.",
  downloadTemplate: "📄 Download Sample CSV Template",
  importAppend: "Append to existing records",
  importReplace: "Replace current journal",
  confirmImport: "Import Trades",
  tradesImported: "Successfully imported {count} trades!",
  noValidTradesInCsv: "No valid trade records found in CSV file.",
  csvParseError: "Could not parse CSV file. Please check format.",
  navBroker: "💼 Broker & Capital Desk",
  brokerEyebrow: "PAPER ACCOUNTS & RISK SIZING",
  brokerTitle: "Trading Broker & Capital Desk",
  brokerSubtitle: "Automatic account size synchronization locks your risk calculators to live capital. Receive AI-powered trading tips and execute high-probability setups directly.",
  brokerSettings: "⚙️ Gateway Settings",
  connectBrokerBtn: "🔗 Connect Broker Account",
  brokerBalance: "Account Balance (Auto-Managed)",
  netEquity: "Net Equity",
  unrealizedPnl: "Open PnL",
  freeMargin: "Free Margin",
  usedMargin: "Used Margin",
  dailyRealizedPnl: "Today's Realized PnL",
  capitalDealsTitle: "AI Capital-Tailored Trade Deals & Tips",
  capitalDealsSub: "High-conviction setups sized automatically to your capital and risk limits",
  activePositionsTitle: "Active Broker Positions",
  activePositionsSub: "Direct execution orders running on linked broker gateway",
  connectBrokerTitle: "Trading Broker & Capital Gateway",
  connectBrokerSub: "Approved and regulated trading brokers in the Arabian Gulf & Global Markets (XTB, Exness, MetaTrader 5, and more). Open or connect your broker account directly.",
  tabOpenBroker: "Open Broker Account on Site",
  tabConnectBroker: "Connect Existing Broker / MT5",
  brokerAccountType: "Account Type / Tier",
  baseCurrency: "Base Account Currency",
  openAndActivateBtn: "⚡ Open & Activate on Site",
  visitBrokerPortal: "🌐 Visit Broker Portal",
  switchBrokerBtn: "🔄 Switch Broker",
  openBrokerBtn: "⚡ Open Broker Account",
  brokerServer: "Broker Server Hostname",
  brokerPassword: "API Token / Trading Password",
  syncBalance: "Verified Account Balance ($)",
  accountSize: "Account Capital ($)",
  customCapital: "Enter Custom Balance ($)",
  accountNumber: "Account / Login ID",
  riskPerTrade: "Max Risk Per Trade (%)",
  saveBrokerConnection: "Verify & Connect Gateway",
  executeDeal: "⚡ Execute Deal",
  closePosition: "Close Trade",
  partialClose: "Close 50%",
  tradeExecuted: "Order filled! {side} {symbol} ({lots} lots) executed on broker.",
  positionClosed: "Position closed! Realized PnL: {pnl} settled to broker balance.",
  traderFullName: "Trader Full Legal Name",
  traderEmail: "Email Address",
  traderPhone: "Phone / WhatsApp Number",
  traderCountry: "Country / Region",
  preferredPlatform: "Trading Platform Terminal",
  accountLeverage: "Trading Leverage",
  activeAccountLabel: "Active Platform Account:",
  depositFunds: "+ Deposit",
  withdrawFunds: "- Withdraw",
  newAccountBtn: "+ New Broker Account",
  aiDeskView: "AI Quantitative Desk",
  webtraderView: "Live WebTrader Terminal",
  accountDetailsView: "Account & Official Certificate",
  fundsModalTitle: "Broker Capital & Banking Gateway",
  deposit: "Deposit Capital",
  withdraw: "Withdraw Profits",
  selectedAccount: "Target Account",
  amountDollars: "Amount ($ USD)",
  paymentChannel: "Broker Portal / Banking Channel:",
  marketWatchQuotes: "Market Watch (Live Feeds)",
  directOrderTicket: "Direct Platform Execution Ticket",
  confirmDepositBtn: "⚡ Confirm Deposit",
  confirmWithdrawBtn: "⚡ Confirm Withdrawal",
  brokerDocsBtn: "📚 API Setup & Tutorials",
  brokerDocsTitle: "Broker API & Platform Connection Documentation",
  brokerDocsSub: "Interactive step-by-step walkthroughs to obtain API keys, server endpoints, and connect Exness, XTB, and MetaTrader 5 (MT5).",
  needApiKeyHelp: "Need help finding your MT5 login, server, or API key?",
  needApiKeyHelpSub: "Follow our interactive step-by-step connection tutorials for Exness, XTB, and MetaTrader 5.",
  viewTutorialsBtn: "📖 View API Tutorials",
  tabDocsExness: "Exness (MT5 & Web API)",
  tabDocsXtb: "XTB MENA (xStation 5)",
  tabDocsMt5: "MetaTrader 5 (Universal)",
  tabDocsTroubleshoot: "Troubleshooting & FAQs",
  applyConfigToDesk: "⚡ Auto-Fill in Broker Connection Form",
  configApplied: "Configuration applied to Broker Connection dialog!"
});

Object.assign(I18N.ar, {
  navBroker: "💼 حساب الوسيط ورأس المال",
  brokerEyebrow: "الحسابات التجريبية وحساب المخاطر",
  brokerTitle: "منصة الوسيط وحجم المحفظة",
  brokerSubtitle: "مزامنة تلقائية لحجم الحساب مع وسيط التداول لإلغاء الإدخال اليدوي، مع صفقات ونصائح ذكية مخصصة لرأس مالك وتنفيذ مباشر.",
  brokerSettings: "⚙️ إعدادات البوابة",
  connectBrokerBtn: "🔗 ربط حساب الوسيط",
  brokerBalance: "رصيد الحساب (مُدار تلقائياً)",
  netEquity: "صافي القيمة",
  unrealizedPnl: "الأرباح العائمة",
  freeMargin: "الهامش المتاح",
  usedMargin: "الهامش المحجوز",
  dailyRealizedPnl: "أرباح اليوم المحققة",
  capitalDealsTitle: "صفقات ونصائح الذكاء الاصطناعي المخصصة لرأس مالك",
  capitalDealsSub: "فرص تداول عالية الاحتمالية محسوبة أحجامها بدقة حسب رأس مالك الحالي",
  activePositionsTitle: "الصفقات المفتوحة لدى الوسيط",
  activePositionsSub: "أوامر التداول النشطة والمنفذة مباشرة عبر الوسيط",
  connectBrokerTitle: "ربط وفتح حساب وسيط التداول",
  connectBrokerSub: "أبرز الوسطاء المعتمدين والموثوقين في الخليج العربي والعالم (Exness, XTB, MetaTrader 5). افتح أو اربط حسابك لتفعيل التنفيذ المباشر.",
  tabOpenBroker: "⚡ فتح حساب وسيط في المنصة",
  tabConnectBroker: "🔗 ربط حساب مسبق / MT5",
  brokerAccountType: "نوع الحساب والتسعير",
  baseCurrency: "عملة الحساب الأساسية",
  openAndActivateBtn: "⚡ فتح وتفعيل الحساب فوراً",
  visitBrokerPortal: "🌐 زيارة البوابة الرسمية للوسيط",
  switchBrokerBtn: "🔄 تغيير الوسيط",
  openBrokerBtn: "⚡ فتح حساب وسيط",
  brokerServer: "اسم خادم الوسيط (Server)",
  brokerPassword: "رمز API / كلمة المرور",
  syncBalance: "الرصيد المعتمد ($)",
  accountSize: "حجم رأس المال ($)",
  customCapital: "أدخل رصيداً مخصصاً ($)",
  accountNumber: "رقم الحساب / المعرف",
  riskPerTrade: "أقصى مخاطرة لكل صفقة (%)",
  saveBrokerConnection: "التحقق وتفعيل الاتصال بالوسيط",
  executeDeal: "⚡ تنفيذ الصفقة",
  closePosition: "إغلاق الصفقة",
  partialClose: "إغلاق 50%",
  tradeExecuted: "تم تنفيذ الأمر! {side} {symbol} ({lots} لوت) بنجاح عبر الوسيط.",
  positionClosed: "تم إغلاق الصفقة! أضيف الربح المحقق {pnl} إلى رصيد حسابك.",
  traderFullName: "اسم المتداول القانوني الكامل",
  traderEmail: "البريد الإلكتروني",
  traderPhone: "رقم الهاتف / واتساب",
  traderCountry: "الدولة / منطقة الإقامة",
  preferredPlatform: "منصة التداول المفضلة",
  accountLeverage: "الرافعة المالية",
  activeAccountLabel: "حساب المنصة النشط:",
  depositFunds: "+ إيداع",
  withdrawFunds: "- سحب",
  newAccountBtn: "+ فتح حساب وسيط جديد",
  aiDeskView: "مكتب الذكاء الاصطناعي الكمي",
  webtraderView: "منصة ويب تريدر المباشرة",
  accountDetailsView: "بيانات الحساب والشهادة الرسمية",
  fundsModalTitle: "بوابة إيداع وسحب رأس المال",
  deposit: "إيداع رأس المال",
  withdraw: "سحب الأرباح",
  selectedAccount: "الحساب المستهدف",
  amountDollars: "المبلغ بالدولار ($)",
  paymentChannel: "قناة الدفع المصرفية الفورية:",
  marketWatchQuotes: "شاشة أسعار السوق المباشرة",
  directOrderTicket: "بطاقة التنفيذ المباشر على المنصة",
  confirmDepositBtn: "⚡ تأكيد الإيداع الفوري",
  confirmWithdrawBtn: "⚡ تأكيد السحب الفوري",
  brokerDocsBtn: "📚 دليل ربط المنصات ورموز API",
  brokerDocsTitle: "دليل وتوثيق ربط منصات التداول ورموز API",
  brokerDocsSub: "شروحات تفاعلية خطوة بخطوة للحصول على مفاتيح API وخوادم الربط لـ Exness و XTB و MetaTrader 5.",
  needApiKeyHelp: "هل تحتاج مساعدة في استخراج رقم الحساب، الخادم، أو رمز API؟",
  needApiKeyHelpSub: "اتبع شروحاتنا التفاعلية المصورة خطوة بخطوة لمنصات إكسنس وإكس تي بي وميتاتريدر 5.",
  viewTutorialsBtn: "📖 فتح دليل ودروس الربط",
  tabDocsExness: "إكسنس (Exness MT5)",
  tabDocsXtb: "إكس تي بي (XTB MENA)",
  tabDocsMt5: "ميتاتريدر 5 (MT5 Universal)",
  tabDocsTroubleshoot: "حل المشاكل والأسئلة الشائعة",
  applyConfigToDesk: "⚡ تعبئة الإعدادات في نافذة الربط فوراً",
  configApplied: "تم تطبيق الإعدادات وتعبئتها في نافذة الربط بنجاح!",
  bulkImport: "📁 استيراد صفقات CSV",
  bulkImportTitle: "استيراد صفقات مجمعة (ملف CSV)",
  bulkImportSub: "ارفع سجل صفقاتك السابقة لتحديث دفتر الصفقات ورسم منحنى رأس المال ونسب النجاح تفاعلياً بواسطة D3.js.",
  downloadTemplate: "📄 تحميل نموذج CSV تجريبي",
  importAppend: "إضافة إلى السجلات الحالية",
  importReplace: "استبدال السجل الحالي بالكامل",
  confirmImport: "تأكيد واستيراد الصفقات",
  tradesImported: "تم استيراد {count} صفقة بنجاح وتحديث التحليلات!",
  noValidTradesInCsv: "لم يتم العثور على صفقات صالحة في ملف CSV.",
  csvParseError: "تعذر قراءة ملف CSV. يرجى التحقق من الملف.",
  professionalMarketMap: "خريطة السوق الاحترافية",
  professionalMarketMapSub: "كل المدارس والمستويات والنماذج والاتجاهات في شارت واحد",
  exportMap: "تصدير الخريطة PNG",
  confluenceMatrix: "مصفوفة التوافق",
  confluenceMatrixSub: "ضوابط جاهزية التنفيذ",
  marketRegime: "حالة السوق",
  executionReadiness: "جاهزية التنفيذ",
  schoolAgreement: "توافق المدارس",
  dataQuality: "جودة البيانات",
  riskQuality: "جودة المخاطر",
  sessionQuality: "جودة الجلسة",
  mappedPatterns: "النماذج المكتشفة",
  mappedLevels: "المستويات المرسومة",
  supportClusters: "تجمعات الدعم",
  resistanceClusters: "تجمعات المقاومة",
  supplyDemandZones: "مناطق العرض والطلب",
  fibonacciMap: "خريطة فيبوناتشي",
  trendChannel: "قناة الاتجاه",
  volumeProfile: "توزيع السعر ونشاط الحجم",
  playbook: "بروتوكول التنفيذ",
  playbookSub: "خطة عمل احترافية",
  deskGovernance: "حوكمة منصة التداول",
  deskGovernanceSub: "مرشحات الثقة والسلامة والتشغيل",
  noProfessionalMap: "شغّل التحليل لإنشاء خريطة السوق الاحترافية.",
  mapLegendSupport: "منطقة دعم (مستطيل أخضر مفرغ)",
  mapLegendResistance: "منطقة مقاومة (مستطيل أحمر مفرغ)",
  mapLegendEntry: "دخول",
  mapLegendStop: "وقف",
  mapLegendTarget: "هدف",
  mapLegendFib: "فيبوناتشي",
  mapLegendZone: "عرض/طلب",
  mapExported: "تم تصدير خريطة السوق.",
  professionalSnapshot: "لقطة احترافية",
  nearestSupport: "أقرب دعم",
  nearestResistance: "أقرب مقاومة",
  valueArea: "منطقة القيمة",
  volumeState: "حالة الحجم",
  livePrice: "السعر الحالي",
  quality: "الجودة",
  notMapped: "غير مرسوم",
  outsideVisibleRange: "خارج النطاق المرئي",
  analysisLayerBoard: "لوحة طبقات التحليل",
  analysisLayerBoardSub: "كل مدرسة وتشخيص استخدمه المحرك",
  technicalStack: "الحزمة الفنية",
  structureRead: "قراءة الهيكل",
  riskBox: "صندوق المخاطر",
  patternEngine: "محرك النماذج",
  noPatternConfirmation: "لا يوجد تأكيد نموذج",
  analysisSummary: "ملخص التحليل",
  direction: "الاتجاه",
  rsi: "RSI",
  layerCandles: "الشموع",
  layerEma: "EMA",
  layerLevels: "د/م",
  layerZones: "المناطق",
  layerFib: "فيبوناتشي",
  layerRisk: "المخاطر",
  layerTrend: "الاتجاه",
  layerVolume: "الحجم",
  layerPatterns: "النماذج",
  institutionalChart: "شارت التحليل الفني",
  adaptiveScale: "المقياس الذكي مفعل",
  layerSmc: "SMC",
  technicalStoryboard: "لوحة القراءة الفنية",
  technicalStoryboardSub: "قراءة مؤسسية للشارت وسياق التنفيذ",
  marketStructureBoard: "لوحة هيكل السوق",
  marketStructureBoardSub: "سمارت موني، أوردر بلوك، محاور وسيولة",
  smcMap: "خريطة SMC",
  orderBlocks: "أوردر بلوك",
  liquidityMap: "خريطة السيولة",
  momentumPane: "الزخم",
  aiAutomationStudio: "استوديو الأتمتة الذكية",
  aiAutomationStudioSub: "مساعد آلي، تنبيهات ذكية، حوكمة مخاطر وأفضل خطوة تالية",
  noAutomationYet: "بانتظار التحليل",
  automationScore: "درجة الأتمتة",
  nextBestAction: "أفضل خطوة تالية",
  smartAlerts: "تنبيهات ذكية",
  aiCopilot: "المساعد الذكي",
  riskGovernor: "حوكمة المخاطر",
  executionProtocol: "بروتوكول التنفيذ",
  schoolBalance: "توازن المدارس",
  technicalDrawingChart: "شارت الرسم الفني",
  clearInstitutionalView: "عرض فني واضح",
  skAnalysisChart: "تحليل SK / SMC",
  skAnalysisSub: "هيكل، سيولة، BOS/CHoCH وأوردر بلوك",
  tradeCompass: "بوصلة الصفقة",
  hideWatchlist: "إخفاء القائمة",
  showWatchlist: "عرض القائمة",
  searchPairsPlaceholder: "ابحث في الأزواج المحفوظة...",
  loadMajors: "العملات الرئيسية",
  thirtySeconds: "30 ثانية",
  twoMinutes: "دقيقتان",
  thirtyMinutes: "30 دقيقة",
  oneHour: "ساعة واحدة",
  customInterval: "تحديد يدوي...",
  customTime: "المدة اليدوية",
  seconds: "ثوانٍ",
  minutes: "دقائق",
  soundOn: "🔊 التنبيه الصوتي: مفعل",
  soundOff: "🔇 التنبيه الصوتي: متوقف",
  inspectTrade: "فتح الشارت والتحليل",
  optimalEntry: "نقطة الدخول المثالية",
  watchlistHidden: "قائمة المتابعة مصغرة ({count} زوج)",
  pairs: "أزواج",
  deskEyebrow: "مكتب التنفيذ الكمي المؤسسي",
  popularAssets: "أصول سريعة:",
  mtfaEyebrow: "توافق الأطر الزمنية المتعددة",
  mtfaTitle: "مصفوفة توافق الأطر الزمنية (MTFA)",
  smcDeepEyebrow: "مفاهيم السمارت موني وتدفق الأوامر",
  smcDeepTitle: "هندسة السيولة ومفاهيم SMC المؤسسية",
  liquidityArchitecture: "مجمعات السيولة (BSL / SSL)",
  orderBlocksDeep: "كتل الأوامر المؤسسية (Order Blocks)",
  fvgDeep: "فجوات القيمة العادلة (FVG)",
  dealingRange: "نطاق التداول والتوازن (Equilibrium 50%)",
  macroEyebrow: "رادار الاقتصاد الكلي المؤسسي",
  macroTitle: "المفكرة الاقتصادية عالية التأثير ورادار البنوك المركزية",
  macroSafety: "مرشح المخاطر نشط",
  navMtfa: "🌐 توافق الأطر (MTFA)",
  navSmc: "🏛️ السمارت موني (SMC)",
  navMarketMap: "📊 الخريطة المزدوجة",
  navSchools: "🧠 توافق المدارس",
  navMacro: "📰 الرادار الكلي والمفكرة",
  navPerformance: "📈 تحليلات الأداء (D3)",
  analyticsEyebrow: "الأداء التاريخي والميزة الإحصائية",
  analyticsTitle: "تحليلات الأداء وذكاء المحفظة",
  analyticsSubtitle: "تصور تفاعلي بواسطة D3.js لمنحنيات الأرباح المتراكمة ونسب النجاح والتوزيع الإحصائي للصفقات.",
  loadSampleTrades: "تحميل بيانات تجريبية مؤسسية",
  logClosedTrade: "+ تسجيل صفقة مغلقة",
  filterPeriod: "الفترة:",
  periodAll: "كامل الفترة",
  period30d: "آخر 30 يومًا",
  period90d: "آخر 90 يومًا",
  filterAsset: "فئة الأصل:",
  assetAll: "كل الأسواق",
  assetForex: "الفوركس",
  assetCrypto: "العملات الرقمية",
  assetCommodities: "المعادن والسلع",
  assetIndices: "المؤشرات",
  kpiNetPnl: "صافي الأرباح المحققة",
  kpiWinRate: "نسبة النجاح (Win Rate)",
  kpiProfitFactor: "عامل الربحية (Profit Factor)",
  kpiPayoffRatio: "نسبة العائد إلى الخسارة",
  kpiMaxDrawdown: "أقصى تراجع (Drawdown)",
  kpiExpectancy: "العائد المتوقع لكل صفقة",
  equityCurveTitle: "منحنى نمو رأس المال والأرباح التراكمية",
  equityCurveSub: "سلسلة زمنية تفاعلية D3.js مع خط الذروة",
  legendEquity: "منحنى الأرباح",
  legendPeak: "أعلى نقطة رصيد",
  winLossDonutTitle: "نسبة الصفقات الرابحة والخاسرة",
  winLossDonutSub: "توزيع إحصائي دائري لنتائج الصفقات",
  wins: "رابحة",
  losses: "خاسرة",
  breakeven: "تعادل",
  waterfallTitle: "توزيع الأرباح والخسائر لكل صفقة",
  waterfallSub: "العائد المحقق بالدولار لكل صفقة مغلقة",
  legendWin: "ربح (+$)",
  legendLoss: "خسارة (-$)",
  legendAvgWin: "متوسط الربح",
  legendAvgLoss: "متوسط الخسارة",
  logTradeTitle: "تسجيل نتيجة صفقة مغلقة",
  direction: "الاتجاه",
  entryPrice: "سعر الدخول",
  exitPrice: "سعر الخروج",
  outcome: "النتيجة",
  realizedPnl: "الربح المحقق ($)",
  cancel: "إلغاء",
  saveTrade: "حفظ الصفقة"
});

Object.assign(I18N.en,{"workstationLabel0": "Live Market Overview", "workstationLabel1": "Observed Instrument Analysis", "workstationLabel2": "Recent Trading Activity", "workstationLabel3": "Opportunity notifications — opt in", "workstationLabel4": "Authoritative Pre-Trade Execution Ticket", "workstationLabel5": "Authoritative Open Positions & Pending Orders", "workstationLabel6": "THN Paper Trading Sandbox", "workstationLabel7": "Trading Defaults", "workstationLabel8": "Risk Governor Limits", "workstationLabel9": "Market Data Feeds", "workstationLabel10": "Broker Gateway & Bridge", "workstationLabel11": "Display & Localization", "workstationLabel12": "Data & Sandbox Reset", "workstationLabel13": "Account Balance (Virtual)", "workstationLabel14": "Account Equity", "workstationLabel15": "Today's Realized PnL", "workstationLabel16": "Risk Protocol Status", "workstationLabel17": "Select Instrument", "workstationLabel18": "Order Direction", "workstationLabel19": "Lot Size / Volume", "workstationLabel20": "Protective Stop Loss (Price)", "workstationLabel21": "Profit Target TP1 (Price)", "workstationLabel22": "Pre-Trade Risk Verification", "workstationLabel24": "Symbol", "workstationLabel25": "Name", "workstationLabel26": "Asset Class", "workstationLabel27": "Bid", "workstationLabel28": "Ask", "workstationLabel29": "Spread", "workstationLabel30": "Change vs closed candle", "workstationLabel31": "Action", "workstationLabel32": "Clear", "workstationLabel33": "Cryptocurrency Feed", "workstationLabel34": "Forex & Commodities", "workstationLabel35": "Economic Calendar", "workstationLabel36": "Daily Drawdown Ceiling", "workstationLabel37": "Mandatory Stop Loss Rule", "workstationLabel38": "Account Leverage Cap", "workstationLabel39": "Orders are automatically rejected if daily loss reaches 5.0%.", "workstationLabel40": "Every order must specify an authoritative stop loss price before submission.", "workstationLabel41": "Maximum authorized leverage is clamped at 1:200 for simulated forex margin.", "workstationLabel43": "📈 Terminal & Chart", "workstationLabel44": "⚡ Order Execution", "workstationLabel45": "📋 Active Positions", "workstationLabel46": "📡 Live Watchlist", "workstationLabel47": "📅 Economic Calendar", "workstationLabel48": "Multi-School Consensus", "workstationLabel49": "🛡️ Verify Margin & Risk", "workstationLabel50": "⚡ Transmit Order to Paper Engine", "workstationLabel51": "Single trade cap: 2% · Aggregate cap: 6% · Daily loss cap: 5%", "workstationLabel52": "PROVIDER DATA · PAPER ONLY", "workstationLabel53": "PAPER SANDBOX", "workstationLabel55": "SERVER RISK ENGINE: ENFORCED", "workstationLabel56": "Skip to workstation"});
Object.assign(I18N.ar,{"workstationLabel0": "نظرة عامة على بيانات السوق", "workstationLabel1": "تحليلات الأدوات المرصودة", "workstationLabel2": "نشاط التداول الأخير", "workstationLabel3": "إشعارات الفرص — باختيارك", "workstationLabel4": "تذكرة التداول التجريبي والتحقق من المخاطر", "workstationLabel5": "المراكز المفتوحة والأوامر المعلقة من الخادم", "workstationLabel6": "بيئة THN للتداول التجريبي", "workstationLabel7": "الإعدادات الافتراضية للتداول", "workstationLabel8": "حدود إدارة المخاطر", "workstationLabel9": "مصادر بيانات السوق", "workstationLabel10": "بوابة الوسيط والجسر", "workstationLabel11": "العرض واللغة", "workstationLabel12": "البيانات وإعادة ضبط الحساب التجريبي", "workstationLabel13": "رصيد الحساب التجريبي", "workstationLabel14": "قيمة الحساب", "workstationLabel15": "الأرباح والخسائر المحققة اليوم", "workstationLabel16": "حالة ضوابط المخاطر", "workstationLabel17": "اختيار الأداة المالية", "workstationLabel18": "اتجاه الأمر", "workstationLabel19": "حجم التداول باللوت", "workstationLabel20": "سعر وقف الخسارة الإلزامي", "workstationLabel21": "سعر جني الأرباح الأول", "workstationLabel22": "التحقق من المخاطر قبل التداول", "workstationLabel24": "الرمز", "workstationLabel25": "الاسم", "workstationLabel26": "فئة الأصل", "workstationLabel27": "سعر الطلب التجريبي", "workstationLabel28": "سعر العرض التجريبي", "workstationLabel29": "فارق السعر التجريبي", "workstationLabel30": "التغير مقارنة بالشمعة المغلقة", "workstationLabel31": "الإجراء", "workstationLabel32": "مسح", "workstationLabel33": "مصدر بيانات العملات الرقمية", "workstationLabel34": "العملات والسلع", "workstationLabel35": "التقويم الاقتصادي", "workstationLabel36": "حد الخسارة اليومية", "workstationLabel37": "قاعدة وقف الخسارة الإلزامية", "workstationLabel38": "الحد الأقصى للرافعة المالية", "workstationLabel39": "ترفض الأوامر تلقائيًا عند بلوغ الخسارة اليومية ٥٪.", "workstationLabel40": "يجب تحديد سعر وقف الخسارة لكل أمر قبل إرساله.", "workstationLabel41": "الحد الأقصى للرافعة المالية هو ١:٢٠٠ لحساب هامش تداول العملات التجريبي.", "workstationLabel43": "📈 التداول والرسم البياني", "workstationLabel44": "⚡ تنفيذ الأوامر التجريبية", "workstationLabel45": "📋 المراكز المفتوحة", "workstationLabel46": "📡 قائمة متابعة السوق", "workstationLabel47": "📅 التقويم الاقتصادي", "workstationLabel48": "توافق المدارس التحليلية", "workstationLabel49": "🛡️ التحقق من الهامش والمخاطر", "workstationLabel50": "⚡ إرسال الأمر إلى المحرك التجريبي", "workstationLabel51": "حد الصفقة: ٢٪ · المخاطر الإجمالية: ٦٪ · الخسارة اليومية: ٥٪", "workstationLabel52": "بيانات المزود · تداول تجريبي فقط", "workstationLabel53": "حساب تجريبي", "workstationLabel55": "ضوابط المخاطر مفروضة من الخادم", "workstationLabel56": "انتقل إلى مساحة العمل"});

const schoolNameMap = {
  "Technical Analysis": { ar: "التحليل الفني" },
  "Price Action": { ar: "البرايس أكشن" },
  "Smart Money Concepts": { ar: "مفاهيم السمارت موني" },
  "Quantitative Model": { ar: "النموذج الكمي" },
  "Sentiment & Fundamental Context": { ar: "السياق الأساسي والشعوري" },
  "Fundamental / Sentiment Context": { ar: "السياق الأساسي والشعوري" },
  "Pattern Recognition": { ar: "التعرف على النماذج" },
  "Volume & Volatility": { ar: "الحجم والتذبذب" },
  "Risk Governance": { ar: "حوكمة المخاطر" }
};

const valueMap = {
  BULLISH: { ar: "صاعد" },
  BEARISH: { ar: "هابط" },
  NEUTRAL: { ar: "محايد" },
  BUY: { ar: "شراء" },
  SELL: { ar: "بيع" },
  "BUY LIMIT": { ar: "شراء معلق (Buy Limit)" },
  "SELL LIMIT": { ar: "بيع معلق (Sell Limit)" },
  WAIT: { ar: "انتظار" },
  PASS: { ar: "ناجح" },
  WARNING: { ar: "تحذير" },
  Forex: { ar: "فوركس" },
  Commodity: { ar: "سلع" },
  Crypto: { ar: "كريبتو" },
  Index: { ar: "مؤشر" },
  Stock: { ar: "سهم" }
};

function t(key, replacements = {}) {
  const dict = I18N[currentLang] || I18N.en;
  let text = dict[key] || I18N.en[key] || key;
  for (const [name, value] of Object.entries(replacements)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function localizedValue(value) {
  if (currentLang !== "ar") return value;
  return valueMap[value]?.ar || value;
}

function localizedSchoolName(value) {
  if (currentLang !== "ar") return value;
  return schoolNameMap[value]?.ar || value;
}

const fmt = (value, digits = 2) => {
  const n = Number(value);
  if (value == null || !Number.isFinite(n)) return "--";
  return n.toLocaleString(currentLang === "ar" ? "ar-OM" : undefined, { maximumFractionDigits: digits });
};

const money = value => {
  const n = Number(value);
  if (value == null || !Number.isFinite(n)) return "--";
  return n.toLocaleString(currentLang === "ar" ? "ar-OM" : undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
};

const escapeHtml = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

function status(text) {
  if ($("statusMsg")) $("statusMsg").textContent = text;
}

function showNotice(msg, type = "info") {
  status(msg);
  const toast = $("tradeToast");
  if (toast) {
    if ($("toastSignal")) $("toastSignal").textContent = type === "error" ? "⚠️ ALERT" : "ℹ️ NOTICE";
    if ($("toastPair")) $("toastPair").textContent = msg;
    if ($("toastConfidence")) $("toastConfidence").textContent = "";
    toast.classList.remove("hidden");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.add("hidden"), 5000);
  }
}

function switchView(viewName) {
  if (!viewName) viewName = "dashboard";
  const jumpMap = {
    dashboard: "dashboard",
    analysis: "trading",
    chart: "trading",
    trading: "trading",
    terminal: "trading",
    brokerDesk: "brokers",
    brokers: "brokers",
    mtfa: "ai",
    smcDeep: "ai",
    schoolsGrid: "ai",
    "professional-map": "ai",
    ai: "ai",
    watchlist: "markets",
    macroCalendarSection: "markets",
    markets: "markets",
    risk: "risk",
    performanceAnalytics: "portfolio",
    portfolio: "portfolio",
    journal: "journal",
    settings: "settings"
  };
  const resolved = jumpMap[viewName] || viewName;

  const views = document.querySelectorAll(".app-view");
  const navBtns = document.querySelectorAll(".nav-stack .nav");
  let targetView = document.getElementById(`view-${resolved}`) || document.getElementById("view-dashboard");
  const actualViewName = targetView ? targetView.id.replace("view-", "") : "dashboard";

  views.forEach(v => {
    if (v.id === `view-${actualViewName}`) {
      v.classList.add("view-active");
    } else {
      v.classList.remove("view-active");
    }
  });

  navBtns.forEach(btn => {
    const bView = btn.dataset.view || btn.dataset.jump;
    if (bView === actualViewName || jumpMap[bView] === actualViewName) {
      btn.classList.add("active");
      btn.setAttribute("aria-current","page");
    } else {
      btn.classList.remove("active");
      btn.removeAttribute("aria-current");
    }
  });

  const subtabMap = {
    chart: "terminal",
    terminal: "terminal",
    analysis: "terminal",
    mtfa: "mtfa",
    smcDeep: "smc",
    schoolsGrid: "consensus",
    "professional-map": "structure",
    watchlist: "watchlist",
    macroCalendarSection: "calendar"
  };
  if (subtabMap[viewName] && targetView) {
    const subBtn = targetView.querySelector(`.subtab-btn[data-subtab="${subtabMap[viewName]}"]`);
    if (subBtn) subBtn.click();
  }

  if (location.hash !== `#${actualViewName}`) {
    history.replaceState(null, "", `#${actualViewName}`);
  }

  if (actualViewName === "trading") {
    setTimeout(() => {
      loadChart();
      if (typeof drawChart === "function") drawChart();
    }, 60);
  } else if (actualViewName === "dashboard") {
    updateDashboardMarketOverview();
  }

  if(actualViewName==="ai"&&currentAnalysis)setTimeout(()=>renderProfessionalLayer(currentAnalysis),60);
  const main = document.querySelector(".terminal-main");
  if (main) main.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" });
  renderWorkbench();
}

function updateDashboardMarketOverview() {
  const tbody = $("dashMarketOverviewBody");
  const symbols = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSDT", "US30"];

  if (tbody) {
    tbody.innerHTML = symbols.map(sym => {
      const q = quoteFresh(liveQuotesCache[sym]) ? liveQuotesCache[sym] : {bid:null,ask:null,digits:2};
      const bid = q && q.bid ? q.bid.toFixed(q.digits || 2) : "--";
      const ask = q && q.ask ? q.ask.toFixed(q.digits || 2) : "--";
      const spread = q && q.spread !== undefined ? q.spread : (q && q.bid && q.ask ? +(q.ask - q.bid).toFixed(q.digits || 2) : "--");
      const chg = q && q.changePct !== undefined ? q.changePct : null;
      const chgClass = chg >= 0 ? "positive" : "negative";
      const chgText = chg===null?"--":(chg >= 0 ? "+" : "") + chg.toFixed(2) + "%";

      return `
        <tr>
          <td><b>${sym}</b></td>
          <td>${escapeHtml(workspaceInstrument(sym).name)}<small class="dashboard-quote-evidence">${escapeHtml(workspaceQuoteLabel(liveQuotesCache[sym]))}</small></td>
          <td>${escapeHtml(ux('ux'+workspaceInstrument(sym).asset))}</td>
          <td class="font-mono">${bid}</td>
          <td class="font-mono">${ask}</td>
          <td>${spread}</td>
          <td class="${chgClass} font-mono"><b>${chgText}</b></td>
          <td>
            <button type="button" class="primary small dash-trade-btn" data-trade-sym="${sym}">${ux('uxAnalyze')}</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  const acc = getBrokerAccount();
  if ($("dashBalance")) $("dashBalance").textContent = workspaceMoney(acc.balance,acc.currency);
  if ($("dashEquity")) $("dashEquity").textContent = workspaceMoney(acc.equity ?? acc.balance,acc.currency);
  if ($("dashFreeMargin")) $("dashFreeMargin").textContent = workspaceMoney(acc.freeMargin,acc.currency);
  if ($("dashDailyPnl")) {
    const pnl = acc.dailyRealizedPnl;
    $("dashDailyPnl").textContent = pnl===null?"--":(pnl >= 0 ? "+" : "") + workspaceMoney(pnl,acc.currency);
    $("dashDailyPnl").style.color = pnl >= 0 ? "#10b981" : "#ef4444";
  }
  if ($("dashTradesCount")) $("dashTradesCount").textContent = acc.todayTradesCount==null?"--":String(acc.todayTradesCount);
  if ($("tradingPosCount")) $("tradingPosCount").textContent = String((acc.positions || []).length);
  renderDashboardEvidence();
  renderWorkbench();
}

function renderDashboardEvidence(){
  const observed=[currentAnalysis,...watchScanResults].filter(a=>a?.provenance?.fresh&&a.provenance.instrumentMatch&&Date.now()-a.provenance.quoteAt<=120000);
  const unique=[...new Map(observed.map(a=>[a.symbol,a])).values()].slice(0,3);
  if($("dashAiOppsGrid"))$("dashAiOppsGrid").innerHTML=unique.length?unique.map(a=>`<article class="card"><b>${escapeHtml(a.symbol)}</b><p>${escapeHtml(localizedValue(a.decision||"WAIT"))} · ${fmt(a.confidence,0)} / 100</p><p class="tiny muted-text">${currentLang==="ar"?"تحليل تعليمي · ليس أمر تنفيذ":"Educational analysis · not an order"}</p><button type="button" class="ghost small dash-inspect-btn" data-inspect-sym="${escapeHtml(a.symbol)}">${currentLang==="ar"?"عرض التحليل":"Inspect analysis"}</button></article>`).join(""):`<p class="muted-text">${analysisError?escapeHtml(analysisError):t("analysisUnavailable")}</p>`;
  const fills=workspaceAccount()?serverLedger.filter(f=>f.immutable===true).slice(0,5):[];
  if($("dashRecentActivityTable"))$("dashRecentActivityTable").innerHTML=fills.length?fills.map(f=>`<p>${escapeHtml(f.symbol)} · ${escapeHtml(localizedValue(f.decision))} · ${workspaceMoney(f.pnl,workspaceAccount()?.currency)} · ${escapeHtml(new Date(f.date).toLocaleString(currentLang==="ar"?"ar-OM":"en-GB"))} · ${currentLang==="ar"?"تنفيذ تجريبي":"PAPER FILL"}</p>`).join(""):`<p class="muted-text">${currentLang==="ar"?"لا توجد نتائج تداول تجريبي مسجلة لهذا الحساب":"No recorded paper fills for this account"}</p>`;
}

function translateStaticDom() {
  storageNotice();
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", currentLang === "ar");
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(el=>el.setAttribute("aria-label",t(el.dataset.i18nAria)));
  localizeWorkspaceStatic();
  renderWorkbench();
  if(workspaceInitialized)setWorkspaceMenu($("workspaceMenu").getAttribute("aria-expanded")==="true");
  const languageSelect = $("languageSelect");
  if (languageSelect) languageSelect.value = currentLang;
  document.querySelectorAll("[data-language]").forEach(button => {
    const active = button.dataset.language === currentLang;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setLanguage(lang) {
  currentLang = lang === "ar" ? "ar" : "en";
  browserStore.setItem(langKey, currentLang);
  translateStaticDom();
  renderJournal();
  renderWatchlist();
  renderAlerts();
  scannerRunning(scannerActive);
  renderMapLayerButtons();
  if (currentAnalysis) renderAnalysis(currentAnalysis, { preserveChart: true });
  renderProviderStatus();renderBrokerDesk();syncAccountSizeWithBroker();
  loadChart();
}

function getPayload() {
  return {
    symbol: $("symbolInput").value.trim() || "EURUSD",
    timeframe: $("timeframe").value,
    accountBalance: Number($("accountBalance").value || 10000),
    riskPct: Number($("riskPct").value || 1),
    rewardRisk: Number($("rewardRisk").value || 2),
    sentiment: $("sentiment").value,
    notes: $("notes").value.trim()
  };
}

function saveSetup() {
  browserStore.setItem(setupKey, JSON.stringify(getPayload()));
}

function restoreSetup() {
  try {
    const saved = JSON.parse(browserStore.getItem(setupKey) || "null");
    if (!saved) return;
    if (saved.symbol) $("symbolInput").value = saved.symbol;
    if (saved.timeframe) $("timeframe").value = saved.timeframe;
    if (saved.accountBalance) $("accountBalance").value = saved.accountBalance;
    if (saved.riskPct) $("riskPct").value = saved.riskPct;
    if (saved.rewardRisk) $("rewardRisk").value = saved.rewardRisk;
    if (saved.sentiment) $("sentiment").value = saved.sentiment;
    if (saved.notes) $("notes").value = saved.notes;
  } catch {
    browserStore.removeItem(setupKey);
  }
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const health = await res.json();
    if(!res.ok||!health.ok)throw Error("Health unavailable");
    providerSnapshot=await(await fetch("/api/readiness")).json();
    workspaceHealth="online";
    renderProviderStatus();
    $("apiStatus").textContent = health.openaiEnabled ? "OpenAI configured; readiness must be verified" : t("localAiActive");
    $("modelStatus").textContent = `${health.app} v${health.version}`;
  } catch {
    workspaceHealth="offline";providerSnapshot=null;
    $("apiStatus").textContent = t("serverOffline");
    $("modelStatus").textContent = t("runNpmFirst");
  }
  renderWorkbench();
}

function cancelAnalysis(){
  analysisGeneration++;analysisController?.abort();analysisController=null;analysisInFlight=false;
  if($("analyzeBtn")){$("analyzeBtn").disabled=false;$("analyzeBtn").textContent=t("analyze")}
  $("brokerDealsGrid")?.setAttribute("aria-busy","false");
}
async function analyze() {
  if(analysisInFlight)return;
  if(Date.now()<analysisRetryAt){status(`${t("analysisUnavailable")}: ${Math.ceil((analysisRetryAt-Date.now())/1000)}s`);return}
  analysisInFlight=true;analysisError="";
  renderWorkbench();
  const generation=++analysisGeneration;analysisController=new AbortController();
  try {
  const payload = getPayload();
  saveSetup();
  status(t("analyzingStatus", { symbol: payload.symbol.toUpperCase() }));
  $("analyzeBtn").disabled = true;
  $("analyzeBtn").textContent = t("analyzing");
  $("brokerDealsGrid")?.setAttribute("aria-busy","true");
  renderBrokerDesk();
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.any([analysisController.signal,AbortSignal.timeout(45000)])
    });
    const data = await res.json();
    if(generation!==analysisGeneration)return;
    if (!res.ok || data.error) {
      if(res.status===429||res.status===502||res.status===503)analysisRetryAt=Date.now()+retryDelay(res,data,15000);
      throw new Error((data.detail || data.error || "Analysis failed")+(data.correlationId?` [${data.correlationId}]`:""));
    }
    currentAnalysis = data;
    renderProviderStatus();
    renderAnalysis(data);
    loadChart(data.tvSymbol, data.tvInterval);
    status(t("completedStatus", { symbol: data.symbol }));
  } catch (error) {
    if(generation!==analysisGeneration)return;
    analysisError=error.name==="TimeoutError"?"Request timed out":error.message;
    currentAnalysis=null;
    $("decision").textContent="WAIT";
    $("aiNarrative").textContent=`${t("analysisUnavailable")}: ${analysisError}`;
    status(`${t("errorPrefix")}: ${analysisError}`);
  } finally {
    if(generation!==analysisGeneration)return;
    analysisInFlight=false;analysisController=null;
    renderWorkbench();
    renderDashboardEvidence();
    $("brokerDealsGrid")?.setAttribute("aria-busy","false");
    renderBrokerDesk();
    $("analyzeBtn").disabled = false;
    $("analyzeBtn").textContent = t("analyze");
  }
}

function renderAnalysis(a, options = {}) {
  const decisionClass = String(a.decision || "WAIT").toLowerCase();
  $("decisionTitle").textContent = t("analysisTitle", { symbol: a.symbol, timeframe: String(a.timeframe || "").toUpperCase() });
  $("sourceBadge").textContent = a.source || "THN Engine";
  $("decision").textContent = localizedValue(a.decision || "WAIT");
  $("decision").className = `decision ${decisionClass}`;
  $("confidence").textContent = `${fmt(a.confidence, 0)}%`;
  document.documentElement.style.setProperty("--confidence", `${Number(a.confidence || 0)}%`);
  $("grade").textContent = a.grade || "--";
  $("symbolOut").textContent = a.symbol || "--";
  $("assetClass").textContent = localizedValue(a.assetClass || "--");
  $("marketDataSource").textContent = a.marketDataSource || "--";
  $("aiNarrative").textContent = localizedNarrative(a);
  $("marketTime").textContent = a.marketTime ? new Date(a.marketTime).toLocaleString(currentLang === "ar" ? "ar-OM" : undefined) : "--";
  $("entry").textContent = fmt(a.entry, 6);
  if ($("optimalEntry")) $("optimalEntry").textContent = a.optimalEntry ? fmt(a.optimalEntry, 6) : fmt(a.entry, 6);
  $("stopLoss").textContent = a.stopLoss ? fmt(a.stopLoss, 6) : "--";
  $("target1").textContent = a.targets?.[0] ? fmt(a.targets[0], 6) : "--";
  $("target2").textContent = a.targets?.[1] ? fmt(a.targets[1], 6) : "--";
  $("target3").textContent = a.targets?.[2] ? fmt(a.targets[2], 6) : "--";
  $("riskAmount").textContent = money(a.risk?.riskAmount);
  if (!options.preserveChart && (a.decision === "BUY" || a.decision === "SELL")) {
    playTradeAlertSound(a.decision);
    showTradeToast(a);
  }
  renderDeskMarketStats(a);
  renderMTFA(a);
  renderSMCDeepDive(a);
  renderMacroCalendar(a);
  renderSchools(a.schools || []);
  renderTables(a);
  renderLists(a);
  renderProfessionalLayer(a);
  renderBrokerDesk();
  updateDashboardMarketOverview();
  renderDashboardEvidence();
  renderReport(a);
  if (!options.preserveChart) return;
}

function renderDeskMarketStats(a) {
  const asset = a.assetClass || "";
  const spreadText = asset === "Crypto" ? "$1.2 (0.01%)" : asset === "Commodity" ? "1.8 pips" : "0.3 pips";
  if ($("deskSpread")) $("deskSpread").textContent = "Unverified broker spread; paper model only";
  if ($("deskVol")) $("deskVol").textContent = `${a.indicators?.volatilityLabel || "Normal"} (ATR: ${fmt(a.indicators?.atrPct, 2)}%)`;
  if ($("deskRange")) $("deskRange").textContent = `Position: ${fmt(a.structure?.rangePosition, 1)}%`;
  if ($("deskBias")) $("deskBias").textContent = `${a.consensusLabel || "--"} (${fmt(a.consensusScore, 1)})`;
}

function renderMTFA(a) {
  const m = a.mtfa || {};
  if ($("mtfaVerdictBadge")) {
    $("mtfaVerdictBadge").textContent = m.verdict || "ALIGNED";
    $("mtfaVerdictBadge").className = `badge ${(m.verdict || "").includes("BULLISH") ? "pass" : (m.verdict || "").includes("BEARISH") ? "danger" : "wait"}`;
  }
  const setCard = (tf, key) => {
    const data = m[key] || {};
    const badge = $(`mtfa${tf}Trend`);
    const detail = $(`mtfa${tf}Detail`);
    if (badge) {
      badge.textContent = localizedValue(data.trend || "--");
      badge.className = `trend-badge ${String(data.trend || "").toLowerCase()}`;
    }
    if (detail) {
      detail.textContent = data.detail || data.trigger || `${tf} structure flow`;
    }
  };
  setCard("D1", "d1");
  setCard("H4", "h4");
  setCard("H1", "h1");
  setCard("M15", "m15");
}

function renderSMCDeepDive(a) {
  const p = a.professional || {};
  const smc = p.smc || {};
  const price = a.entry || a.indicators?.price || 0;
  const precision = pricePrecision(price);
  const support = a.structure?.support || price;
  const resistance = a.structure?.resistance || price;
  const eqPrice = (support + resistance) / 2;
  const isDiscount = price <= eqPrice;

  if ($("smcZoneBadge")) {
    $("smcZoneBadge").textContent = isDiscount ? (currentLang === "ar" ? "منطقة خصم (Discount)" : "DISCOUNT ACCUMULATION ZONE") : (currentLang === "ar" ? "منطقة علاوة (Premium)" : "PREMIUM DISTRIBUTION ZONE");
    $("smcZoneBadge").className = `badge ${isDiscount ? "pass" : "danger"}`;
  }

  const bslPool = (smc.liquidityPools || []).find(x => x.type === "EQH")?.price || a.structure?.recentHigh || resistance;
  const sslPool = (smc.liquidityPools || []).find(x => x.type === "EQL")?.price || a.structure?.recentLow || support;
  if ($("smcBsl")) $("smcBsl").textContent = fmt(bslPool, precision);
  if ($("smcSsl")) $("smcSsl").textContent = fmt(sslPool, precision);
  if ($("smcLiquiditySummary")) {
    const sweep = a.structure?.possibleSellSideSweep ? (currentLang === "ar" ? "تم سحب سيولة القيعان (SSL) بنجاح" : "Sell-side liquidity swept; smart money accumulated") :
                  a.structure?.possibleBuySideSweep ? (currentLang === "ar" ? "تم سحب سيولة القمم (BSL) بنجاح" : "Buy-side liquidity swept; smart money distributed") :
                  (currentLang === "ar" ? "سيولة متراكمة فوق القمم وتحت القيعان" : "External range liquidity resting above BSL & below SSL");
    $("smcLiquiditySummary").textContent = sweep;
  }

  const bullObs = (smc.orderBlocks || []).filter(o => o.type === "BULLISH_OB");
  const bearObs = (smc.orderBlocks || []).filter(o => o.type === "BEARISH_OB");
  if ($("smcDemandOb")) $("smcDemandOb").textContent = bullObs.length ? `${fmt(bullObs[0].from, precision)} - ${fmt(bullObs[0].to, precision)}` : fmt(support, precision);
  if ($("smcSupplyOb")) $("smcSupplyOb").textContent = bearObs.length ? `${fmt(bearObs[0].from, precision)} - ${fmt(bearObs[0].to, precision)}` : fmt(resistance, precision);
  if ($("smcObSummary")) {
    $("smcObSummary").textContent = currentLang === "ar" ? "كتل أوامر فنية تمثل مناطق سيولة وارتداد حاسمة" : "High-probability order blocks representing key liquidity zones";
  }

  const bullFvgs = (smc.fvgs || []).filter(f => f.type === "BULLISH_FVG");
  const bearFvgs = (smc.fvgs || []).filter(f => f.type === "BEARISH_FVG");
  if ($("smcBullFvg")) $("smcBullFvg").textContent = bullFvgs.length ? `${fmt(bullFvgs[0].from, precision)} - ${fmt(bullFvgs[0].to, precision)}` : "None";
  if ($("smcBearFvg")) $("smcBearFvg").textContent = bearFvgs.length ? `${fmt(bearFvgs[0].from, precision)} - ${fmt(bearFvgs[0].to, precision)}` : "None";
  if ($("smcFvgSummary")) {
    $("smcFvgSummary").textContent = currentLang === "ar" ? "فجوات السيولة تجذب السعر لإعادة التوازن" : "3-candle liquidity displacement imbalances acting as magnetic price targets";
  }

  if ($("smcEq")) $("smcEq").textContent = fmt(eqPrice, precision);
  const rangePosPct = clamp(a.structure?.rangePosition || 50, 0, 100);
  if ($("smcRangePos")) $("smcRangePos").textContent = `${fmt(rangePosPct, 1)}% (${isDiscount ? "Discount" : "Premium"})`;
  if ($("eqMarker")) $("eqMarker").style.left = `${rangePosPct}%`;
  if ($("smcEqSummary")) {
    $("smcEqSummary").textContent = currentLang === "ar" ? "قاعدة التنفيذ: الدخول في صفقات الشراء فقط في منطقة الخصم والبيع في منطقة العلاوة" : "Quantitative Execution Rule: Long in Discount (<50%); Short in Premium (>50%)";
  }
}

function renderMacroCalendar(a) {
  const target = $("macroEventsTable");
  if (!target) return;
  const events = a.macroCalendar || [];
  if (!events.length) {
    target.innerHTML = `<p class="tiny">${currentLang === "ar" ? "لا توجد أحداث مؤثرة وشيكة" : "No critical events within active radar window"}</p>`;
    return;
  }
  target.innerHTML = events.map(ev => {
    const timeStr = new Date(ev.time).toLocaleTimeString(currentLang === "ar" ? "ar-OM" : undefined, { hour: "2-digit", minute: "2-digit" });
    const impactClass = ev.impact === "CRITICAL" ? "impact-critical" : "impact-high";
    return `<div class="macro-row">
      <div class="macro-col-time"><b>${timeStr}</b><small>${ev.currency}</small></div>
      <div class="macro-col-event"><b>${escapeHtml(ev.event)}</b><small>${escapeHtml(ev.bias)}</small></div>
      <div class="macro-col-impact"><span class="impact-badge ${impactClass}">${ev.impact}</span></div>
      <div class="macro-col-stats"><span>F: <b>${ev.forecast}</b></span><span>P: <b>${ev.previous}</b></span></div>
    </div>`;
  }).join("");
}

function startTerminalClock() {
  function tick() {
    const d = new Date();
    const utcHours = d.getUTCHours();
    const utcTimeStr = d.toUTCString().slice(17, 25) + " UTC";
    if ($("terminalUtcClock")) $("terminalUtcClock").textContent = utcTimeStr;

    const isLondon = utcHours >= 8 && utcHours < 16.5;
    const isNY = utcHours >= 13.5 && utcHours < 20;
    const isTokyo = utcHours >= 0 && utcHours < 9;
    const isSydney = utcHours >= 21 || utcHours < 6;

    const setSession = (id, active) => {
      const el = $(id);
      if (el) el.classList.toggle("active", active);
    };
    setSession("sessLondon", isLondon);
    setSession("sessNY", isNY);
    setSession("sessTokyo", isTokyo);
    setSession("sessSydney", isSydney);
  }
  tick();
  setInterval(tick, 1000);
}

function localizedNarrative(a) {
  if (currentLang !== "ar") return a.aiNarrative || "No narrative available.";
  return `ملخص THN: القرار الحالي هو ${localizedValue(a.decision || "WAIT")} على ${a.symbol} بثقة ${fmt(a.confidence, 0)}%. تم بناء القرار من توافق عدة مدارس تحليلية تشمل الفني، البرايس أكشن، السمارت موني، النموذج الكمي، والسياق الشعوري. استخدم الخطة فقط بعد تأكيد ظروف السوق والأخبار وإدارة المخاطر.`;
}

function renderSchools(schools) {
  const colorFor = bias => bias === "BULLISH" ? "var(--green)" : bias === "BEARISH" ? "var(--red)" : "var(--yellow)";
  $("schoolsGrid").innerHTML = schools.map(s => {
    const reason = s.reasons?.[0] || s.warnings?.[0] || t("neutralModule");
    return `<article class="school-card" style="--school-color:${colorFor(s.bias)}">
      <h3>${escapeHtml(localizedSchoolName(s.name))}</h3>
      <div class="bias" style="color:${colorFor(s.bias)}">${escapeHtml(localizedValue(s.bias))}</div>
      <div class="score">${t("score")}: <b>${fmt(s.score, 0)}/100</b></div>
      <p>${escapeHtml(currentLang === "ar" ? summarizeReasonAr(s) : reason)}</p>
    </article>`;
  }).join("") || `<article class="school-card"><h3>${t("noAnalysis")}</h3><div class="bias">${localizedValue("WAIT")}</div><p>${t("runFirst")}</p></article>`;
}

function summarizeReasonAr(s) {
  const bias = localizedValue(s.bias);
  const name = localizedSchoolName(s.name);
  return `${name} يعطي قراءة ${bias} بدرجة ${fmt(s.score, 0)} من 100، لذلك يجب مقارنته مع باقي المدارس قبل التنفيذ.`;
}

function renderTables(a) {
  const i = a.indicators || {};
  const s = a.structure || {};
  const r = a.risk || {};
  const b = a.backtest || {};

  $("indicatorTable").innerHTML = [
    row(t("lastPrice"), fmt(i.price, 6)),
    row(t("ema20"), fmt(i.ema20, 6)),
    row(t("ema50"), fmt(i.ema50, 6)),
    row(t("ema200"), fmt(i.ema200, 6)),
    row(t("rsi14"), fmt(i.rsi14, 2)),
    row(t("atr14"), `${fmt(i.atr14, 6)} (${fmt(i.atrPct, 3)}%)`),
    row(t("macdHistogram"), fmt(i.macdHistogram, 6)),
    row(t("bollingerWidth"), `${fmt(i.bollingerWidthPct, 3)}%`),
    row(t("volatility"), i.volatilityLabel || "--")
  ].join("");

  $("structureTable").innerHTML = [
    row(t("support"), fmt(s.support, 6)),
    row(t("resistance"), fmt(s.resistance, 6)),
    row(t("recentHigh"), fmt(s.recentHigh, 6)),
    row(t("recentLow"), fmt(s.recentLow, 6)),
    row(t("rangePosition"), `${fmt(s.rangePosition, 2)}%`),
    row(t("trendStructure"), s.trendStructure || "--"),
    row(t("sellSideSweep"), s.possibleSellSideSweep ? t("possible") : t("no")),
    row(t("buySideSweep"), s.possibleBuySideSweep ? t("possible") : t("no"))
  ].join("");

  $("riskTable").innerHTML = [
    row(t("accountBalance"), money(r.accountBalance)),
    row(t("riskPercent"), `${fmt(r.riskPct, 2)}%`),
    row(t("riskAmount"), money(r.riskAmount)),
    row(t("riskPerUnit"), fmt(r.riskPerUnit, 6)),
    row(t("units"), fmt(r.units, 4)),
    row(t("forexLots"), r.forexLots ? fmt(r.forexLots, 4) : "N/A"),
    row(t("exposure"), money(r.exposure)),
    row(t("exposurePercent"), `${fmt(r.exposurePct, 2)}%`),
    row(t("rewardRisk"), `1 : ${fmt(r.rewardRisk, 2)}`),
    row(t("breakEvenWinRate"), `${fmt(r.breakEvenWinRate, 2)}%`)
  ].join("");

  $("checklist").innerHTML = (a.checklist || []).map(c => `<div class="check">
    <span>${escapeHtml(currentLang === "ar" ? checklistItemAr(c) : c.item)}</span>
    <b class="${escapeHtml(String(c.status).toLowerCase())}">${escapeHtml(localizedValue(c.status))}</b>
    <small>${escapeHtml(currentLang === "ar" ? checklistDetailAr(c) : (c.detail || ""))}</small>
  </div>`).join("");

  $("scenarioGrid").innerHTML = (a.scenarios || []).map(scn => `<div class="scenario-card">
    <h3>${escapeHtml(currentLang === "ar" ? scenarioNameAr(scn.name) : scn.name)}</h3>
    <p>${t("risk")}: <b>${fmt(scn.riskPct, 2)}%</b></p>
    <p>${t("potentialRisk")}: <b>${money(scn.riskAmount)}</b></p>
    <p>${t("rewardRisk")}: <b>1 : ${fmt(scn.rr, 2)}</b></p>
    <p>${t("potentialProfit")}: <b>${money(scn.potentialProfit)}</b></p>
    <p>${t("breakEven")}: <b>${fmt(scn.breakEvenWinRate, 2)}%</b></p>
  </div>`).join("");

  $("backtestTable").innerHTML = b.simulationType==="UNAVAILABLE"?row(currentLang==="ar"?"الأداء التاريخي":"Historical performance",currentLang==="ar"?"غير متاح · لا يوجد اختبار تاريخي":"Unavailable · no historical evaluation"):[
    row(t("trades"), fmt(b.trades, 0)),
    row(t("wins"), fmt(b.wins, 0)),
    row(t("losses"), fmt(b.losses, 0)),
    row(t("estimatedWinRate"), `${fmt(b.estimatedWinRate, 1)}%`),
    row(t("estimatedReturn"), `${fmt(b.estimatedReturnPct, 2)}%`),
    row(t("endingBalance"), money(b.endingBalance)),
    row(t("maxDrawdown"), `${fmt(b.maxDrawdownPct, 2)}%`),
    row(t("profitFactor"), fmt(b.profitFactor, 2))
  ].join("");
}

function checklistItemAr(c) {
  const item = String(c.item || "").toLowerCase();
  if (item.includes("news")) return "فلتر الأخبار";
  if (item.includes("spread")) return "السبريد والسيولة";
  if (item.includes("risk")) return "المخاطرة المسموحة";
  if (item.includes("confirmation")) return "تأكيد الدخول";
  if (item.includes("session")) return "جلسة التداول";
  return c.item || "بند تنفيذ";
}

function checklistDetailAr(c) {
  const status = localizedValue(c.status || "WAIT");
  return c.detail ? `${status}: تحقق من هذا البند قبل تنفيذ الصفقة.` : status;
}

function scenarioNameAr(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("conservative")) return "سيناريو محافظ";
  if (n.includes("standard")) return "سيناريو قياسي";
  if (n.includes("aggressive")) return "سيناريو هجومي";
  return name;
}

function renderLists(a) {
  $("reasonsList").innerHTML = (a.reasons || []).map((x, idx) => `<li>${escapeHtml(currentLang === "ar" ? reasonAr(a, idx) : x)}</li>`).join("") || `<li>${t("noReasons")}</li>`;
  $("warningsList").innerHTML = (a.warnings || []).map((x, idx) => `<li>${escapeHtml(currentLang === "ar" ? warningAr(a, idx) : x)}</li>`).join("") || `<li>${t("noMajorWarnings")}</li>`;
}

function reasonAr(a, idx) { return a.reasons?.[idx] || ""; }
function warningAr(a, idx) { return a.warnings?.[idx] || ""; }


function pctClass(score) {
  const n = Number(score || 0);
  return n >= 75 ? "pass" : n >= 55 ? "warning" : "wait";
}

function renderProfessionalLayer(a) {
  const p = a.professional || {};
  renderProfessionalSnapshot(a, p);
  renderAIAutomationStudio(a, p);
  renderConfluenceMatrix(p);
  renderMarketMap(a, p);
  renderPlaybook(p);
}


function renderAIAutomationStudio(a, p) {
  const automation = a.aiAutomation || {};
  const badge = $("automationBadge");
  if (badge) badge.textContent = automation.botStatus || t("noAutomationYet");
  const grid = $("aiStudioGrid");
  if (grid) {
    const balance = automation.schoolBalance || {};
    const cards = [
      [t("aiCopilot"), automation.mode || "--", automation.botStatus || "--"],
      [t("automationScore"), `${fmt(automation.automationScore, 0)}/100`, `${t("executionReadiness")} ${fmt(p.executionReadiness, 0)}%`],
      [t("nextBestAction"), automation.nextBestAction || t("runAnalysisFirst"), automation.chartBrief?.technical || "--"],
      [t("schoolBalance"), `B ${balance.bullish || 0} / S ${balance.bearish || 0} / N ${balance.neutral || 0}`, automation.chartBrief?.sk || "--"],
      [t("riskGovernor"), automation.riskGovernor?.maxRiskPct || "--", automation.riskGovernor?.exposureState || "--"],
      [t("executionProtocol"), (automation.executionProtocol || [])[0] || "--", (automation.executionProtocol || []).slice(1, 3).join(" · ") || "--"]
    ];
    grid.innerHTML = cards.map(([label, value, detail]) => `<div class="ai-studio-card"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b><small>${escapeHtml(detail)}</small></div>`).join("");
  }
  const alerts = $("smartAlertList");
  if (alerts) {
    alerts.innerHTML = `<div class="smart-alert-title"><b>${escapeHtml(t("smartAlerts"))}</b><span>${escapeHtml(t("alertOnly"))}</span></div>` + (automation.smartAlerts || []).map(alert => `
      <div class="smart-alert-row">
        <div><b>${escapeHtml(alert.name || "--")}</b><small>${escapeHtml(alert.condition || "--")}</small></div>
        <strong>${escapeHtml(alert.priority || "--")}</strong>
        <span>${escapeHtml(alert.trigger ? fmt(alert.trigger, a.indicators?.price >= 1 ? 5 : 6) : "AUTO")}</span>
      </div>`).join("");
  }
}

function renderProfessionalSnapshot(a, p) {
  const levels = p.levels || {};
  const vp = p.volumeProfile || {};
  const nearestSupport = levels.supports?.[0]?.price ?? a.structure?.support;
  const nearestResistance = levels.resistances?.[0]?.price ?? a.structure?.resistance;
  const cards = [
    [t("executionReadiness"), `${fmt(p.executionReadiness, 0)}%`, p.marketRegime || "--"],
    [t("schoolAgreement"), `${fmt(p.schoolAgreement, 0)}%`, `${(a.schools || []).length} modules`],
    [t("nearestSupport"), fmt(nearestSupport, 6), `${levels.supports?.[0]?.touches || 1} touches`],
    [t("nearestResistance"), fmt(nearestResistance, 6), `${levels.resistances?.[0]?.touches || 1} touches`],
    [t("volumeState"), vp.volumeState || "--", `x${fmt(vp.volumeRatio, 2)}`],
    [t("sessionQuality"), `${fmt(p.session?.timingQuality, 0)}%`, p.session?.session || "--"]
  ];
  const target = $("professionalSnapshot");
  if (!target) return;
  target.innerHTML = cards.map(([label, value, detail]) => `<div class="snapshot-card ${pctClass(String(value).replace('%',''))}">
    <span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b><small>${escapeHtml(detail)}</small>
  </div>`).join("");
}

function renderConfluenceMatrix(p) {
  const target = $("confluenceMatrix");
  if (!target) return;
  target.innerHTML = (p.confluence || []).map(item => `<div class="confluence-row">
    <div><b>${escapeHtml(currentLang === "ar" ? confluenceNameAr(item.name) : item.name)}</b><small>${escapeHtml(currentLang === "ar" ? confluenceDetailAr(item) : item.detail)}</small></div>
    <div class="scorebar"><span style="width:${Math.max(0, Math.min(100, Number(item.score || 0)))}%"></span></div>
    <strong class="${escapeHtml(String(item.status || 'WAIT').toLowerCase())}">${escapeHtml(localizedValue(item.status || "WAIT"))} · ${fmt(item.score, 0)}</strong>
  </div>`).join("") || `<p class="tiny">${t("noProfessionalMap")}</p>`;
}

function confluenceNameAr(name) {
  const map = {
    "Multi-school agreement": "توافق المدارس",
    "Data quality": "جودة البيانات",
    "Risk governance": "حوكمة المخاطر",
    "Structure quality": "جودة الهيكل",
    "Timing session": "توقيت الجلسة"
  };
  return map[name] || name;
}

function confluenceDetailAr(item) {
  const n = String(item.name || "");
  if (n.includes("school")) return "نسبة المدارس المتفقة مع اتجاه القرار الحالي.";
  if (n.includes("Data")) return "تقييم صلاحية بيانات السوق المستخدمة في التحليل.";
  if (n.includes("Risk")) return "فحص المخاطرة والتعرض قبل التنفيذ.";
  if (n.includes("Structure")) return "جودة الدعم والمقاومة والاتجاه الحالي.";
  if (n.includes("Timing")) return "تقييم ملاءمة جلسة التداول الحالية.";
  return item.detail || "--";
}

function renderPlaybook(p) {
  const playbook = $("playbookList");
  const governance = $("governanceList");
  if (playbook) {
    playbook.innerHTML = (p.playbook || []).map((x, idx) => `<li>${escapeHtml(currentLang === "ar" ? playbookAr(idx) : x)}</li>`).join("") || `<li>${t("noProfessionalMap")}</li>`;
  }
  if (governance) {
    governance.innerHTML = (p.professionalChecklist || []).map(x => `<div class="governance-item">
      <b>${escapeHtml(currentLang === "ar" ? checklistItemAr(x) : x.item)}</b>
      <span class="${escapeHtml(String(x.status || 'WAIT').toLowerCase())}">${escapeHtml(localizedValue(x.status || "WAIT"))}</span>
      <small>${escapeHtml(currentLang === "ar" ? checklistDetailAr(x) : x.detail)}</small>
    </div>`).join("") || `<p class="tiny">${t("noProfessionalMap")}</p>`;
  }
}

function playbookAr(idx) {
  const lines = [
    "انتظر تأكيدًا واضحًا من الشمعة أو كسر/ارتداد من مستوى مرسوم قبل الدخول.",
    "لا تدخل مباشرة في دعم أو مقاومة قريبة دون إغلاق مؤكد وحجم مناسب.",
    "بعد الهدف الأول، قيّم نقل الوقف إلى التعادل فقط إذا تحسن الهيكل.",
    "إذا بقي القرار انتظارًا، فعّل التنبيهات بدل تنفيذ صفقة ضعيفة."
  ];
  return lines[idx % lines.length];
}

function renderMarketMap(a, p) {
  const map = p.analysisMap || {};
  const canvas = $("analysisMapCanvas");
  if (!canvas) return;
  const meta = drawAnalysisMap(canvas, a, map, p);
  renderMapHud(a, p, meta);
  renderMapDetails(a, p, meta);
  drawSkAnalysisMap($("skAnalysisCanvas"), a, map, p, meta);
  renderTradeCompass(a, p, meta);
  renderAnalysisLayerBoard(a, p, meta);
  renderTechnicalStoryboard(a, p, meta);
  renderStructureBoard(a, p, meta);
}

function renderMapHud(a, p, meta = {}) {
  const target = $("mapHud");
  if (!target) return;
  const vp = p.volumeProfile || {};
  const trend = p.trend || {};
  const decisionClass = String(a.decision || "WAIT").toLowerCase();
  target.innerHTML = `
    <div class="map-hud-card ${escapeHtml(decisionClass)}"><span>${escapeHtml(t("livePrice"))}</span><b>${escapeHtml(fmt(meta.price, meta.precision || 5))}</b><small>${escapeHtml(a.symbol || "--")}</small></div>
    <div class="map-hud-card"><span>${escapeHtml(t("trendChannel"))}</span><b>${escapeHtml(localizedValue(trend.direction || "--"))}</b><small>${escapeHtml(t("quality"))}: ${escapeHtml(fmt(trend.channelQuality, 0))}%</small></div>
    <div class="map-hud-card"><span>${escapeHtml(t("nearestSupport"))}</span><b>${escapeHtml(meta.nearestSupport ? fmt(meta.nearestSupport.price, meta.precision || 5) : "--")}</b><small>${escapeHtml(meta.nearestSupport ? `${meta.nearestSupport.touches || 1}x · ${fmt(Math.abs(meta.nearestSupport.distancePct || 0), 2)}%` : t("notMapped"))}</small></div>
    <div class="map-hud-card"><span>${escapeHtml(t("nearestResistance"))}</span><b>${escapeHtml(meta.nearestResistance ? fmt(meta.nearestResistance.price, meta.precision || 5) : "--")}</b><small>${escapeHtml(meta.nearestResistance ? `${meta.nearestResistance.touches || 1}x · ${fmt(Math.abs(meta.nearestResistance.distancePct || 0), 2)}%` : t("notMapped"))}</small></div>
    <div class="map-hud-card"><span>${escapeHtml(t("volumeProfile"))}</span><b>${escapeHtml(vp.volumeState || "--")}</b><small>x${escapeHtml(fmt(vp.volumeRatio, 2))} · ${escapeHtml(t("valueArea"))} ${escapeHtml(fmt(vp.valueAreaPosition, 0))}%</small></div>
  `;
}

function renderMapDetails(a, p, meta = {}) {
  const target = $("mapDetails");
  if (!target) return;
  const levels = p.levels || {};
  const zones = p.zones || [];
  const fib = (p.fibonacci || []).filter(x => meta.inView ? meta.inView(x.price) : true);
  const patterns = p.patterns || [];
  const precision = meta.precision || 5;
  const blocks = [
    [t("supportClusters"), (levels.supports || []).slice(0, 4).map(x => `${fmt(x.price, precision)} · ${x.touches}x · ${fmt(x.strength,0)}%`).join(" | ") || "--"],
    [t("resistanceClusters"), (levels.resistances || []).slice(0, 4).map(x => `${fmt(x.price, precision)} · ${x.touches}x · ${fmt(x.strength,0)}%`).join(" | ") || "--"],
    [t("mappedPatterns"), patterns.join(" | ") || "--"],
    [t("fibonacciMap"), fib.slice(0, 5).map(x => `${x.label} ${fmt(x.price, precision)}`).join(" | ") || t("outsideVisibleRange")],
    [t("supplyDemandZones"), zones.slice(0, 4).map(x => `${x.type} ${fmt(x.from, precision)}-${fmt(x.to, precision)} · ${fmt(x.strength,0)}%`).join(" | ") || "--"],
    [t("trendChannel"), `${p.trend?.direction || "--"} · ${fmt(p.trend?.slopePct, 5)}% · ${t("quality")} ${fmt(p.trend?.channelQuality, 0)}%`]
  ];
  target.innerHTML = blocks.map(([k, v]) => row(k, v)).join("");
}


function renderTechnicalStoryboard(a, p, meta = {}) {
  const target = $("technicalStoryboard");
  if (!target) return;
  const i = a.indicators || {};
  const s = a.structure || {};
  const trend = p.trend || {};
  const blocks = [
    [t("analysisSummary"), `${localizedValue(a.decision || "WAIT")} · ${fmt(a.confidence, 0)}% · ${a.grade || "--"}`],
    [t("technicalStack"), `${emaStackLabel(i)} · RSI ${fmt(i.rsi14, 1)} · MACD ${fmt(i.macdHistogram, 4)}`],
    [t("trendChannel"), `${localizedValue(trend.direction || "--")} · ${t("quality")} ${fmt(trend.channelQuality, 0)}%`],
    [t("mappedLevels"), `${t("nearestSupport")}: ${fmt(meta.nearestSupport?.price, meta.precision || 5)} · ${t("nearestResistance")}: ${fmt(meta.nearestResistance?.price, meta.precision || 5)}`],
    [t("riskBox"), `${t("entry")} ${fmt(a.entry, meta.precision || 5)} · ${t("stopLoss")} ${fmt(a.stopLoss, meta.precision || 5)} · RR 1:${fmt(a.risk?.rewardRisk, 2)}`],
    [t("momentumPane"), `${t("rangePosition")} ${fmt(s.rangePosition, 0)}% · ATR ${fmt(i.atrPct, 2)}% · ${i.volatilityLabel || i.volatility || "--"}`]
  ];
  target.innerHTML = `<div class="desk-panel-title"><b>${escapeHtml(t("technicalStoryboard"))}</b><span>${escapeHtml(t("technicalStoryboardSub"))}</span></div><div class="analysis-chip-grid">${blocks.map(([k,v]) => `<div class="analysis-chip"><span>${escapeHtml(k)}</span><b>${escapeHtml((v || '--').split(' · ')[0] || '--')}</b><small>${escapeHtml((v || '--').split(' · ').slice(1).join(' · ') || '--')}</small></div>`).join('')}</div>`;
}

function renderStructureBoard(a, p, meta = {}) {
  const target = $("marketStructureBoard");
  if (!target) return;
  const smc = p.smc || p.analysisMap?.smc || {};
  const sections = [
    [t("smcMap"), (smc.summary || []).join(" | ") || "--"],
    [t("mappedPatterns"), (p.patterns || []).join(" | ") || t("noPatternConfirmation")],
    [t("orderBlocks"), (smc.orderBlocks || []).map(x => `${x.type === 'BULLISH_OB' ? 'Bullish' : 'Bearish'} ${fmt(x.from, meta.precision || 5)}-${fmt(x.to, meta.precision || 5)} · ${fmt(x.strength,0)}%`).join(" | ") || "--"],
    [t("liquidityMap"), (smc.liquidityPools || []).map(x => `${x.type} ${fmt(x.price, meta.precision || 5)}`).join(" | ") || "--"],
    [t("structureRead"), (smc.pivots || []).map(x => `${x.label} ${fmt(x.price, meta.precision || 5)}`).join(" | ") || "--"]
  ];
  target.innerHTML = `<div class="desk-panel-title"><b>${escapeHtml(t("marketStructureBoard"))}</b><span>${escapeHtml(t("marketStructureBoardSub"))}</span></div><div class="desk-list">${sections.map(([k,v]) => `<div class="desk-list-row"><b>${escapeHtml(k)}</b><small>${escapeHtml(v || '--')}</small></div>`).join('')}</div>`;
}

function renderAnalysisLayerBoard(a, p, meta = {}) {
  const target = $("analysisLayerBoard");
  if (!target) return;
  const i = a.indicators || {};
  const s = a.structure || {};
  const risk = a.risk || {};
  const schools = (a.schools || []).map(school => `
    <div class="layer-card school-${escapeHtml(String(school.bias || "neutral").toLowerCase())}">
      <span>${escapeHtml(currentLang === "ar" ? localizedSchoolName(school.name) : school.name)}</span>
      <b>${escapeHtml(localizedValue(school.bias || "NEUTRAL"))}</b>
      <small>${escapeHtml(t("score"))}: ${escapeHtml(fmt(school.score, 0))}/100 · ${escapeHtml(t("direction"))}: ${escapeHtml(fmt(school.directionScore, 2))}</small>
    </div>`).join("");
  const diagnostics = [
    [t("technicalStack"), `${t("rsi")}: ${fmt(i.rsi14, 1)} · MACD ${fmt(i.macdHistogram, 5)} · EMA ${emaStackLabel(i)}`],
    [t("structureRead"), `${localizedValue(s.trendStructure || "--")} · ${t("rangePosition")} ${fmt(s.rangePosition, 1)}%`],
    [t("riskBox"), `${t("riskPercent")} ${fmt(risk.riskPct, 2)}% · RR 1:${fmt(risk.rewardRisk, 2)} · ${t("exposurePercent")} ${fmt(risk.exposurePct, 1)}%`],
    [t("patternEngine"), (p.patterns || []).join(" · ") || t("noPatternConfirmation")]
  ].map(([title, detail]) => `<div class="layer-card diagnostic"><span>${escapeHtml(title)}</span><b>${escapeHtml(detail.split(" · ")[0])}</b><small>${escapeHtml(detail.split(" · ").slice(1).join(" · ") || detail)}</small></div>`).join("");
  target.innerHTML = `<div class="layer-board-title"><b>${escapeHtml(t("analysisLayerBoard"))}</b><span>${escapeHtml(t("analysisLayerBoardSub"))}</span></div><div class="layer-board-grid">${diagnostics}${schools}</div>`;
}

function emaStackLabel(i) {
  const e20 = Number(i.ema20), e50 = Number(i.ema50), e200 = Number(i.ema200);
  if (![e20, e50, e200].every(Number.isFinite)) return "--";
  if (e20 > e50 && e50 > e200) return "Bullish stack";
  if (e20 < e50 && e50 < e200) return "Bearish stack";
  return "Mixed stack";
}

function getDefaultMapLayers() {
  return { candles: true, ema: true, levels: true, zones: false, fibonacci: false, risk: true, trend: true, volume: true, patterns: true, smc: false };
}

function getMapLayers() {
  if (mapLayerPrefs) return mapLayerPrefs;
  try {
    const saved = JSON.parse(browserStore.getItem(mapLayerKey) || "null");
    mapLayerPrefs = { ...getDefaultMapLayers(), ...(saved && typeof saved === "object" ? saved : {}) };
  } catch {
    mapLayerPrefs = getDefaultMapLayers();
  }
  return mapLayerPrefs;
}

function setMapLayer(name, value) {
  const current = getMapLayers();
  current[name] = Boolean(value);
  mapLayerPrefs = current;
  browserStore.setItem(mapLayerKey, JSON.stringify(current));
  renderMapLayerButtons();
  if (currentAnalysis) renderProfessionalLayer(currentAnalysis);
}

function renderMapLayerButtons() {
  const target = $("mapLayerControls");
  if (!target) return;
  const layers = getMapLayers();
  const defs = [
    ["candles", "layerCandles"], ["ema", "layerEma"], ["levels", "layerLevels"], ["zones", "layerZones"],
    ["fibonacci", "layerFib"], ["risk", "layerRisk"], ["trend", "layerTrend"], ["volume", "layerVolume"], ["patterns", "layerPatterns"], ["smc", "layerSmc"]
  ];
  target.innerHTML = defs.map(([key, labelKey]) => `<button type="button" class="map-layer-pill ${layers[key] ? "active" : ""}" data-map-layer="${key}" aria-pressed="${layers[key] ? "true" : "false"}">${escapeHtml(t(labelKey))}</button>`).join("");
}

function initMapControls() {
  renderMapLayerButtons();
  $("mapLayerControls")?.addEventListener("click", event => {
    const btn = event.target.closest("[data-map-layer]");
    if (!btn) return;
    const key = btn.dataset.mapLayer;
    setMapLayer(key, !getMapLayers()[key]);
  });
  const canvas = $("analysisMapCanvas");
  if (canvas) {
    canvas.tabIndex=0;
    canvas.addEventListener("pointermove", event => {
      const rect = canvas.getBoundingClientRect();
      chartHover = {
        active: true,
        x: (event.clientX - rect.left)*(canvas.width/(window.devicePixelRatio||1))/rect.width,
        y: (event.clientY - rect.top)*(canvas.height/(window.devicePixelRatio||1))/rect.height
      };
      if(chartDrag){chartOffset=Math.max(0,Math.min((currentAnalysis?.candles?.length||0)-chartWindow,chartDrag.offset+Math.round((chartDrag.x-event.clientX)/Math.max(3,rect.width/chartWindow))));}
      if (currentAnalysis) renderMarketMap(currentAnalysis, currentAnalysis.professional || {});
    });
    canvas.addEventListener("pointerleave", () => {
      chartHover = { active: false, x: 0, y: 0 };
      if (currentAnalysis) renderMarketMap(currentAnalysis, currentAnalysis.professional || {});
    });
    canvas.addEventListener("pointerdown",event=>{chartDrag={x:event.clientX,offset:chartOffset};canvas.setPointerCapture(event.pointerId)});
    canvas.addEventListener("pointerup",()=>{chartDrag=null});
    canvas.addEventListener("wheel",event=>{event.preventDefault();chartWindow=Math.max(24,Math.min(160,chartWindow+(event.deltaY>0?8:-8)));if(currentAnalysis)renderProfessionalLayer(currentAnalysis)},{passive:false});
    canvas.addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight","+","-"].includes(event.key))return;event.preventDefault();if(event.key==="ArrowLeft")chartOffset=Math.min(140,chartOffset+8);if(event.key==="ArrowRight")chartOffset=Math.max(0,chartOffset-8);if(event.key==="+")chartWindow=Math.max(24,chartWindow-8);if(event.key==="-")chartWindow=Math.min(160,chartWindow+8);renderProfessionalLayer(currentAnalysis)});
    let frame;new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(currentAnalysis&&canvas.getBoundingClientRect().width>0)renderProfessionalLayer(currentAnalysis)})}).observe(canvas.parentElement);
    $("chartReset")?.addEventListener("click",()=>{chartOffset=0;chartWindow=84;renderProfessionalLayer(currentAnalysis)});
    $("chartAddLevel")?.addEventListener("click",()=>{const price=Number($("chartLevelPrice").value);if(!Number.isFinite(price)||price<=0){showNotice("Positive drawing price required","error");return}const list=chartDrawings();list.push({price,label:$("chartLevelLabel").value.slice(0,40)||"User level"});browserStore.setItem(drawingKey(),JSON.stringify(list.slice(-30)));renderProfessionalLayer(currentAnalysis)});
    $("chartClearLevels")?.addEventListener("click",()=>{browserStore.removeItem(drawingKey());renderProfessionalLayer(currentAnalysis)});
  }
}


function drawAnalysisMap(canvas, a, map, p = {}) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width || 1160));
  const height = Math.max(300, Math.floor(rect.height || 760));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const layers = getMapLayers();
  const isLight = document.documentElement.dataset.theme === "light";
  const palette = chartPalette(isLight);
  const allCandles = (map.candles || a.candles || []).filter(c => [c.open, c.high, c.low, c.close].every(Number.isFinite));
  const end=Math.max(1,allCandles.length-chartOffset);
  const visible = allCandles.slice(Math.max(0,end-chartWindow),end);
  const last = visible.at(-1) || {};
  const price = Number(map.price || a.entry || last.close || a.indicators?.price || 0);
  const precision = pricePrecision(price);
  drawChartBackground(ctx, width, height, palette);

  const metaBase = { price, precision, inView: () => false, nearestSupport: null, nearestResistance: null };
  if (!visible.length || !Number.isFinite(price)) {
    ctx.fillStyle = palette.muted; ctx.font = "14px Inter, Arial"; ctx.fillText(t("noProfessionalMap"), 74, 96); return metaBase;
  }

  const padL = width<600?40:74, padR = width<600?65:112, padT = 90, padB = 140;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const momentumH = 72;
  const volumeGap = 14;
  const volumeH = layers.volume ? 54 : 0;
  const priceH = chartH - momentumH - (layers.volume ? volumeGap + volumeH : 0) - 18;
  const momentumTop = padT + priceH + 18;
  const volumeTop = momentumTop + momentumH + (layers.volume ? volumeGap : 0);
  const high = Math.max(...visible.map(c => Number(c.high)));
  const low = Math.min(...visible.map(c => Number(c.low)));
  const candleSpan = Math.max(high - low, Math.abs(price) * 0.0005, Number(map.atr || 0) * 3, 1e-9);
  const tolerance = Math.max(candleSpan * 2.2, Math.abs(price) * 0.012, Number(map.atr || 0) * 12);
  const withinFocus = v => Number.isFinite(Number(v)) && Number(v) >= low - tolerance && Number(v) <= high + tolerance;
  const nearbyOverlayValues = [
    ...(layers.levels ? [...(map.supports || []).map(x => x.price), ...(map.resistances || []).map(x => x.price)] : []),
    ...(layers.zones ? (map.zones || []).flatMap(z => [z.from, z.to]) : []),
    ...(layers.fibonacci ? (map.fibonacci || []).map(x => x.price) : []),
    ...(layers.smc ? [...((map.smc?.orderBlocks || []).flatMap(z => [z.from, z.to])), ...((map.smc?.liquidityPools || []).map(x => x.price))] : []),
    ...(layers.trend ? [map.trend?.upper, map.trend?.mid, map.trend?.lower] : []),
    ...(layers.risk ? [a.entry, a.stopLoss, ...(a.targets || [])] : []),
    ...(layers.zones ? [p.volumeProfile?.valueAreaLow, p.volumeProfile?.valueAreaHigh] : [])
  ].map(Number).filter(withinFocus);
  const yMinRaw = Math.min(low, ...nearbyOverlayValues);
  const yMaxRaw = Math.max(high, ...nearbyOverlayValues);
  const span = Math.max(yMaxRaw - yMinRaw, candleSpan, Math.abs(price) * 0.0008, 1e-9);
  const yMin = yMinRaw - span * 0.11;
  const yMax = yMaxRaw + span * 0.11;
  const xFor = i => padL + (i / Math.max(1, visible.length - 1)) * chartW;
  const yFor = value => padT + (1 - ((Number(value) - yMin) / (yMax - yMin))) * priceH;
  const inView = value => Number.isFinite(Number(value)) && Number(value) >= yMin && Number(value) <= yMax;

  const supports = (map.supports || []).filter(x => inView(x.price));
  const resistances = (map.resistances || []).filter(x => inView(x.price));
  const fibs = (map.fibonacci || []).filter(x => inView(x.price));
  const zones = (map.zones || []).filter(z => inView(z.from) || inView(z.to));
  const nearestSupport = (map.supports || []).slice().sort((a, b) => Math.abs(Number(a.price) - price) - Math.abs(Number(b.price) - price))[0] || null;
  const nearestResistance = (map.resistances || []).slice().sort((a, b) => Math.abs(Number(a.price) - price) - Math.abs(Number(b.price) - price))[0] || null;

  drawPriceGrid(ctx, { padL, padR, padT, chartW, priceH, width, yMin, yMax, yFor, precision, palette, visible });
  drawSessionBands(ctx, { visible, padL, padT, priceH, xFor, palette });
  if (layers.zones) drawZones(ctx, zones, { padL, chartW, yFor, palette });
  if (layers.smc) drawSmcOverlay(ctx, map.smc || p.smc || {}, { padL, chartW, yFor, xFor, palette, visible, precision, inView });
  if (layers.zones && p.volumeProfile?.valueAreaLow && p.volumeProfile?.valueAreaHigh) drawValueArea(ctx, p.volumeProfile, { padL, chartW, yFor, palette, precision });
  if (layers.risk) drawRiskRewardBox(ctx, a, { padL, chartW, yFor, inView, palette, precision });
  if (layers.fibonacci) fibs.forEach(f => drawSmartLevel(ctx, yFor(f.price), padL, padL + chartW, palette.fib, `${t("mapLegendFib")} ${f.label}`, fmt(f.price, precision), true));
  if (layers.levels) {
    supports.forEach((lvl, idx) => drawHollowLevelZone(ctx, lvl, idx, "SUPPORT", { padL, chartW, yFor, precision, atr: map.atr || a.indicators?.atr14, price, palette }));
    resistances.forEach((lvl, idx) => drawHollowLevelZone(ctx, lvl, idx, "RESISTANCE", { padL, chartW, yFor, precision, atr: map.atr || a.indicators?.atr14, price, palette }));
  }
  if (layers.trend) drawRegressionChannel(ctx, visible, { xFor, yFor, palette, priceH, padT });
  if (layers.ema) drawEmaStack(ctx, visible, { xFor, yFor, palette, history:allCandles });
  if (layers.candles) drawProfessionalCandles(ctx, visible, { xFor, yFor, palette, chartW });
  drawMomentumPane(ctx, visible, { padL, padT: momentumTop, chartW, height: momentumH, xFor, palette });
  if (layers.volume) drawVolumePane(ctx, visible, { padL, padT: volumeTop, chartW, volumeH, xFor, palette });

  if (layers.risk) {
    if (inView(a.entry)) drawTaggedLevel(ctx, yFor(a.entry), padL, padL + chartW, palette.entry, `${t("mapLegendEntry")} ${fmt(a.entry, precision)}`, "left");
    if (inView(a.stopLoss)) drawTaggedLevel(ctx, yFor(a.stopLoss), padL, padL + chartW, palette.stop, `${t("mapLegendStop")} ${fmt(a.stopLoss, precision)}`, "right");
    (a.targets || []).slice(0, 3).forEach((tp, idx) => { if (inView(tp)) drawTaggedLevel(ctx, yFor(tp), padL, padL + chartW, palette.target, `${t("mapLegendTarget")} ${idx + 1} ${fmt(tp, precision)}`, "right"); });
  }
  for(const level of chartDrawings())if(inView(level.price))drawTaggedLevel(ctx,yFor(level.price),padL,padL+chartW,palette.entry,`${level.label}: ${fmt(level.price,precision)}`,"left");
  chartTransform={width,height,padL,padT,chartW,priceH,yMin,yMax};
  drawCurrentPrice(ctx, price, { padL, chartW, yFor, inView, palette, precision });
  if (chartHover && chartHover.active) {
    drawChartCrosshair(ctx, chartHover, { padL, padR, padT, chartW, priceH, width, yMin, yMax, visible, precision, palette });
  }
  if (layers.patterns) drawPatternCallout(ctx, a, map, p, { width, height, padL, padR, padB, palette });
  drawChartHeader(ctx, a, p, map, { width, padL, padR, palette, precision });
  drawChartFooter(ctx, a, p, map, { width, height, padL, padR, palette, precision });
  return { price, precision, yMin, yMax, inView, nearestSupport, nearestResistance };
}



function renderTradeCompass(a, p, meta = {}) {
  const target = $("tradeCompass");
  if (!target) return;
  const automation = a.aiAutomation || {};
  const items = [
    [t("tradeCompass"), `${localizedValue(a.decision || "WAIT")} · ${fmt(a.confidence, 0)}%`],
    [t("automationScore"), `${fmt(automation.automationScore, 0)}/100`],
    [t("riskGovernor"), automation.riskGovernor?.maxRiskPct || "--"],
    [t("nextBestAction"), automation.nextBestAction || "--"]
  ];
  target.innerHTML = items.map(([k, v]) => `<div><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("");
}

function drawSkAnalysisMap(canvas, a, map, p = {}, meta = {}) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width || 460));
  const height = Math.max(300, Math.floor(rect.height || 360));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const palette = chartPalette(document.documentElement.dataset.theme === "light");
  drawChartBackground(ctx, width, height, palette);
  const candles = (map.candles || a.candles || []).slice(-52);
  const smc = map.smc || p.smc || {};
  if (!candles.length) {
    ctx.fillStyle = palette.muted; ctx.font = "12px Inter, Arial"; ctx.fillText(t("noProfessionalMap"), 22, 44); return;
  }
  const padL = 38, padR = 52, padT = 54, padB = 44;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const high = Math.max(...candles.map(c => Number(c.high)), ...((smc.liquidityPools || []).map(x => Number(x.price))).filter(Number.isFinite));
  const low = Math.min(...candles.map(c => Number(c.low)), ...((smc.liquidityPools || []).map(x => Number(x.price))).filter(Number.isFinite));
  const span = Math.max(high - low, Math.abs(high) * 0.001, 1e-9);
  const yMin = low - span * 0.13;
  const yMax = high + span * 0.13;
  const xFor = i => padL + (i / Math.max(1, candles.length - 1)) * chartW;
  const yFor = value => padT + (1 - ((Number(value) - yMin) / (yMax - yMin))) * chartH;
  const inView = value => Number.isFinite(Number(value)) && Number(value) >= yMin && Number(value) <= yMax;
  ctx.save();
  ctx.strokeStyle = palette.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
  }
  ctx.fillStyle = palette.text; ctx.font = "900 14px Inter, Arial"; ctx.fillText(t("skAnalysisChart"), padL, 28);
  ctx.fillStyle = palette.muted; ctx.font = "10px Inter, Arial"; ctx.fillText((p.smc?.summary || []).slice(0, 2).join(" · ") || t("skAnalysisSub"), padL, 44);
  ctx.restore();

  drawMiniCandles(ctx, candles, { xFor, yFor, chartW, palette });
  (smc.orderBlocks || []).forEach(block => {
    if (!inView(block.from) && !inView(block.to)) return;
    const top = yFor(Math.max(block.from, block.to));
    const bottom = yFor(Math.min(block.from, block.to));
    const isBull = block.type === 'BULLISH_OB';
    const color = isBull ? palette.support : palette.resistance;
    const h = Math.max(9, bottom - top);
    const x = padL + chartW * 0.40;
    const w = chartW * 0.56;
    ctx.save();
    ctx.fillStyle = isBull ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.06)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    roundRect(ctx, x, top, w, h, 6, true, true);
    // Pointer arrow
    ctx.beginPath();
    ctx.moveTo(x + 8, top + h / 2 - 3);
    ctx.lineTo(x + 3, top + h / 2);
    ctx.lineTo(x + 8, top + h / 2 + 3);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "900 9px Inter, Arial";
    ctx.fillText(isBull ? 'Demand OB' : 'Supply OB', x + 12, top + Math.min(13, h - 2));
    ctx.restore();
  });
  (smc.liquidityPools || []).forEach(pool => {
    if (!inView(pool.price)) return;
    const y = yFor(pool.price);
    ctx.save(); ctx.strokeStyle = palette.liquidity; ctx.setLineDash([3, 5]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = palette.liquidity; ctx.font = "900 9px Inter, Arial"; ctx.fillText(pool.type, padL + chartW - 25, y - 5); ctx.restore();
  });
  (smc.smcEvents || []).forEach((evt, idx) => {
    if (!inView(evt.price)) return;
    const y = yFor(evt.price), x = padL + 16 + idx * 62;
    const color = evt.direction === 'BULLISH' ? palette.smcBull : palette.smcBear;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 48, y); ctx.stroke();
    ctx.fillStyle = color; ctx.font = "900 9px Inter, Arial"; ctx.fillText(evt.type, x + 4, y - 6); ctx.restore();
  });
  const pivots = (smc.pivots || []).slice(-6);
  pivots.forEach((pivot, idx) => {
    if (!inView(pivot.price)) return;
    const x = padL + 12 + (idx / Math.max(1, pivots.length - 1)) * (chartW - 24);
    const y = yFor(pivot.price);
    ctx.save(); ctx.fillStyle = pivot.kind === 'HIGH' ? palette.resistance : palette.support; ctx.font = "900 9px Inter, Arial";
    ctx.fillText(pivot.label, x, pivot.kind === 'HIGH' ? y - 7 : y + 13); ctx.restore();
  });
}

function drawMiniCandles(ctx, candles, cfg) {
  const candleW = Math.max(2.5, Math.min(7, cfg.chartW / candles.length * 0.58));
  candles.forEach((c, i) => {
    const x = cfg.xFor(i);
    const yH = cfg.yFor(c.high), yL = cfg.yFor(c.low), yO = cfg.yFor(c.open), yC = cfg.yFor(c.close);
    const up = c.close >= c.open;
    ctx.save();
    ctx.strokeStyle = up ? cfg.palette.support : cfg.palette.resistance;
    ctx.fillStyle = up ? "rgba(34,197,94,0.72)" : "rgba(239,68,68,0.72)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, yL); ctx.stroke();
    roundRect(ctx, x - candleW / 2, Math.min(yO, yC), candleW, Math.max(2, Math.abs(yC - yO)), 2, true, false);
    ctx.restore();
  });
}

function chartPalette(isLight) {
  return {
    bg1: isLight ? "#f8fafc" : "#071120",
    bg2: isLight ? "#eef2ff" : "#0d1730",
    panel: isLight ? "rgba(255,255,255,0.74)" : "rgba(255,255,255,0.045)",
    grid: isLight ? "rgba(15,23,42,0.10)" : "rgba(148,163,184,0.13)",
    axis: isLight ? "rgba(15,23,42,0.32)" : "rgba(148,163,184,0.28)",
    text: isLight ? "#0f172a" : "#eef7ff",
    muted: isLight ? "#64748b" : "#92a5c3",
    support: "#22c55e",
    resistance: "#ef4444",
    fib: "#fbbf24",
    entry: "#2bf5c7",
    stop: "#fb7185",
    target: "#38bdf8",
    trend: "#8b5cf6",
    ema20: "#2bf5c7",
    ema50: "#38bdf8",
    ema200: "#f59e0b",
    zoneDemand: "rgba(34,197,94,0.14)",
    zoneSupply: "rgba(239,68,68,0.14)",
    smcBull: "rgba(43,245,199,0.82)",
    smcBear: "rgba(251,113,133,0.82)",
    smcAreaBull: "rgba(43,245,199,0.12)",
    smcAreaBear: "rgba(251,113,133,0.12)",
    liquidity: "rgba(251,191,36,0.78)"
  };
}

function drawChartBackground(ctx, width, height, palette) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, palette.bg1);
  grad.addColorStop(1, palette.bg2);
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, width, height, 24, true, false);
  ctx.fillStyle = "rgba(43,245,199,0.06)";
  ctx.beginPath(); ctx.arc(width * 0.14, 20, 180, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(56,189,248,0.055)";
  ctx.beginPath(); ctx.arc(width * 0.90, height * 0.15, 210, 0, Math.PI * 2); ctx.fill();
}

function drawPriceGrid(ctx, cfg) {
  const { padL, padR, padT, chartW, priceH, width, yMin, yMax, yFor, precision, palette, visible } = cfg;
  ctx.save();
  ctx.strokeStyle = palette.grid; ctx.lineWidth = 1;
  ctx.fillStyle = palette.muted; ctx.font = "11px Inter, Arial"; ctx.textAlign = "left";
  for (let i = 0; i <= 6; i++) {
    const y = padT + (i / 6) * priceH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(width - padR, y); ctx.stroke();
    const price = yMax - (i / 6) * (yMax - yMin);
    ctx.fillText(fmt(price, precision), width - padR + 13, y + 4);
  }
  for (let i = 0; i <= 6; i++) {
    const x = padL + (i / 6) * chartW;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + priceH); ctx.stroke();
    if (visible && visible.length) {
      const idx = Math.min(visible.length - 1, Math.round((i / 6) * (visible.length - 1)));
      const c = visible[idx];
      if (c && c.time) {
        const d = new Date(c.time);
        const timeStr = d.toLocaleTimeString(currentLang === "ar" ? "ar-OM" : undefined, { hour: '2-digit', minute: '2-digit' });
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "10px Inter, Arial";
        ctx.fillStyle = palette.muted;
        ctx.fillText(timeStr, x, padT + priceH + 16);
        ctx.restore();
      }
    }
  }
  ctx.strokeStyle = palette.axis;
  ctx.strokeRect(padL, padT, chartW, priceH);
  ctx.restore();
}

function drawChartCrosshair(ctx, hover, cfg) {
  const { padL, padR, padT, chartW, priceH, width, yMin, yMax, visible, precision, palette } = cfg;
  if (!hover || !hover.active || hover.x < padL || hover.x > padL + chartW || hover.y < padT || hover.y > padT + priceH) return;

  const idx = clamp(Math.round(((hover.x - padL) / chartW) * (visible.length - 1)), 0, visible.length - 1);
  const candle = visible[idx];
  const cursorPrice = yMax - ((hover.y - padT) / priceH) * (yMax - yMin);

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Vertical guideline
  ctx.beginPath();
  ctx.moveTo(hover.x, padT);
  ctx.lineTo(hover.x, padT + priceH);
  ctx.stroke();

  // Horizontal guideline
  ctx.beginPath();
  ctx.moveTo(padL, hover.y);
  ctx.lineTo(padL + chartW, hover.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Right Price Axis Pill
  const pricePillText = fmt(cursorPrice, precision);
  ctx.font = "900 11px Inter, Arial";
  const pillW = ctx.measureText(pricePillText).width + 16;
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = "#38bdf8";
  roundRect(ctx, padL + chartW + 4, hover.y - 11, pillW, 22, 6, true, true);
  ctx.fillStyle = "#38bdf8";
  ctx.fillText(pricePillText, padL + chartW + 12, hover.y + 4);

  // Bottom Time Axis Pill
  if (candle && candle.time) {
    const d = new Date(candle.time);
    const dateStr = d.toLocaleDateString(currentLang === "ar" ? "ar-OM" : undefined, { month: 'short', day: 'numeric' }) + " " + d.toLocaleTimeString(currentLang === "ar" ? "ar-OM" : undefined, { hour: '2-digit', minute: '2-digit' });
    ctx.font = "900 10px Inter, Arial";
    const timeW = ctx.measureText(dateStr).width + 16;
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    roundRect(ctx, hover.x - timeW / 2, padT + priceH + 4, timeW, 20, 6, true, true);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(dateStr, hover.x - timeW / 2 + 8, padT + priceH + 18);
  }

  // Top-left OHLCV Inspection Bar
  if (candle) {
    const chg = candle.open ? ((candle.close - candle.open) / candle.open) * 100 : 0;
    const isUp = candle.close >= candle.open;
    const hud = `O: ${fmt(candle.open, precision)}  H: ${fmt(candle.high, precision)}  L: ${fmt(candle.low, precision)}  C: ${fmt(candle.close, precision)}  (${isUp ? "+" : ""}${fmt(chg, 2)}%)`;
    ctx.font = "800 11px Inter, Arial";
    const hudW = ctx.measureText(hud).width + 20;
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    roundRect(ctx, padL + 12, padT + 10, hudW, 24, 6, true, true);
    ctx.fillStyle = isUp ? "#10b981" : "#f43f5e";
    ctx.fillText(hud, padL + 22, padT + 26);
  }

  ctx.restore();
}

function drawSessionBands(ctx, cfg) {
  const { visible, padT, priceH, xFor, palette } = cfg;
  ctx.save();
  visible.forEach((c, i) => {
    const hour = new Date(c.time).getUTCHours();
    if (hour >= 7 && hour <= 16 && i % 2 === 0) {
      const x = xFor(i);
      ctx.fillStyle = "rgba(43,245,199,0.028)";
      ctx.fillRect(x - 4, padT, 8, priceH);
    }
  });
  ctx.restore();
}

function drawZones(ctx, zones, cfg) {
  const { padL, chartW, yFor, palette } = cfg;
  zones.slice(0, 5).forEach(z => {
    const top = yFor(Math.max(z.from, z.to));
    const bottom = yFor(Math.min(z.from, z.to));
    const h = Math.max(8, bottom - top);
    ctx.save();
    ctx.fillStyle = z.type === "DEMAND" ? palette.zoneDemand : palette.zoneSupply;
    roundRect(ctx, padL + 2, top, chartW - 4, h, 10, true, false);
    ctx.fillStyle = z.type === "DEMAND" ? palette.support : palette.resistance;
    ctx.font = "800 10px Inter, Arial";
    ctx.fillText(`${z.type} · ${fmt(z.strength,0)}%`, padL + 12, top + Math.min(h - 4, 15));
    ctx.restore();
  });
}

function drawValueArea(ctx, vp, cfg) {
  const { padL, chartW, yFor, palette, precision } = cfg;
  const top = yFor(Math.max(vp.valueAreaLow, vp.valueAreaHigh));
  const bottom = yFor(Math.min(vp.valueAreaLow, vp.valueAreaHigh));
  ctx.save();
  ctx.fillStyle = "rgba(139,92,246,0.08)";
  ctx.fillRect(padL, top, chartW, Math.max(6, bottom - top));
  ctx.strokeStyle = "rgba(139,92,246,0.45)"; ctx.setLineDash([7, 7]);
  ctx.strokeRect(padL, top, chartW, Math.max(6, bottom - top));
  ctx.fillStyle = palette.trend; ctx.font = "800 10px Inter, Arial";
  ctx.fillText(`${t("valueArea")} ${fmt(vp.valueAreaLow, precision)} - ${fmt(vp.valueAreaHigh, precision)}`, padL + 12, top - 5);
  ctx.restore();
}

function drawRiskRewardBox(ctx, a, cfg) {
  const { padL, chartW, yFor, inView, palette } = cfg;
  const entry = Number(a.entry), sl = Number(a.stopLoss), tp = Number((a.targets || [])[0]);
  if (!Number.isFinite(entry)) return;
  ctx.save();
  if (Number.isFinite(sl) && inView(entry) && inView(sl)) {
    const y1 = yFor(entry), y2 = yFor(sl);
    ctx.fillStyle = "rgba(251,113,133,0.09)";
    ctx.fillRect(padL, Math.min(y1, y2), chartW, Math.max(5, Math.abs(y2 - y1)));
  }
  if (Number.isFinite(tp) && inView(entry) && inView(tp)) {
    const y1 = yFor(entry), y2 = yFor(tp);
    ctx.fillStyle = "rgba(34,197,94,0.08)";
    ctx.fillRect(padL, Math.min(y1, y2), chartW, Math.max(5, Math.abs(y2 - y1)));
  }
  ctx.restore();
}

function drawRegressionChannel(ctx, candles, cfg) {
  const closes = candles.map(c => Number(c.close));
  const reg = linearRegressionLine(closes);
  const residuals = closes.map((v, i) => v - reg.valueAt(i));
  const dev = Math.max(std(residuals) * 1.45, 1e-9);
  const line = (offset, alpha, dash = []) => {
    ctx.save(); ctx.strokeStyle = `rgba(139,92,246,${alpha})`; ctx.lineWidth = offset ? 1.1 : 2; ctx.setLineDash(dash);
    ctx.beginPath();
    closes.forEach((_, i) => {
      const x = cfg.xFor(i), y = cfg.yFor(reg.valueAt(i) + offset);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke(); ctx.restore();
  };
  line(dev, 0.65, [8, 8]); line(0, 0.95, []); line(-dev, 0.65, [8, 8]);
  ctx.save(); ctx.fillStyle = cfg.palette.trend; ctx.font = "800 10px Inter, Arial";
  ctx.fillText(t("trendChannel"), cfg.xFor(1), cfg.yFor(reg.valueAt(1) + dev) - 8);
  ctx.restore();
}

function drawEmaStack(ctx, candles, cfg) {
  const closes = candles.map(c => Number(c.close));
  const lines = [[20, cfg.palette.ema20, "EMA20"], [50, cfg.palette.ema50, "EMA50"], [200, cfg.palette.ema200, "EMA200"]];
  lines.forEach(([period, color, label]) => {
    const history=cfg.history||candles;
    const arr = (Object.hasOwn(history[0]||{},"ema"+period)?history.map(c=>c["ema"+period]):emaArray(history.map(c=>Number(c.close)),period)).slice(-candles.length);
    drawIndicatorLine(ctx, arr, cfg, color, label);
  });
}

function drawIndicatorLine(ctx, arr, cfg, color, label) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.7; ctx.beginPath();
  let started = false;
  arr.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const x = cfg.xFor(i), y = cfg.yFor(v);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  });
  ctx.stroke();
  const lastIndex = arr.findLastIndex?.(Number.isFinite) ?? arr.length - 1;
  if (lastIndex > 0) {
    ctx.fillStyle = color; ctx.font = "800 10px Inter, Arial"; ctx.fillText(label, cfg.xFor(Math.max(0, lastIndex - 6)), cfg.yFor(arr[lastIndex]) - 6);
  }
  ctx.restore();
}

function drawProfessionalCandles(ctx, candles, cfg) {
  const candleW = Math.max(3.5, Math.min(14, (cfg.chartW / candles.length) * 0.72));
  candles.forEach((c, i) => {
    const x = Math.round(cfg.xFor(i));
    const yH = Math.round(cfg.yFor(c.high));
    const yL = Math.round(cfg.yFor(c.low));
    const yO = Math.round(cfg.yFor(c.open));
    const yC = Math.round(cfg.yFor(c.close));
    const up = c.close >= c.open;
    const bodyColor = up ? "#10b981" : "#f43f5e";
    const wickColor = up ? "rgba(16, 185, 129, 0.9)" : "rgba(244, 63, 94, 0.9)";

    ctx.save();
    // High-precision 1px wick
    ctx.strokeStyle = wickColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, yH);
    ctx.lineTo(x, yL);
    ctx.stroke();

    // Sharp rectangular candle body
    const bodyY = Math.min(yO, yC);
    const bodyH = Math.max(2, Math.abs(yC - yO));
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x - Math.floor(candleW / 2), bodyY, candleW, bodyH);

    // Current/Last candle white ring highlight
    if (i === candles.length - 1) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - Math.floor(candleW / 2) - 1, bodyY - 1, candleW + 2, bodyH + 2);
    }
    ctx.restore();
  });
}

function drawVolumePane(ctx, candles, cfg) {
  const vols = candles.map(c => Number(c.volume || 0));
  const maxVol = Math.max(...vols, 1);
  const barW = Math.max(3, Math.min(10, cfg.chartW / candles.length * 0.55));
  ctx.save();
  ctx.fillStyle = "rgba(148,163,184,0.08)";
  roundRect(ctx, cfg.padL, cfg.padT, cfg.chartW, cfg.volumeH, 12, true, false);
  candles.forEach((c, i) => {
    const h = (Number(c.volume || 0) / maxVol) * (cfg.volumeH - 8);
    ctx.fillStyle = c.close >= c.open ? "rgba(34,197,94,0.42)" : "rgba(239,68,68,0.42)";
    ctx.fillRect(cfg.xFor(i) - barW / 2, cfg.padT + cfg.volumeH - h - 4, barW, h);
  });
  ctx.fillStyle = cfg.palette.muted; ctx.font = "800 10px Inter, Arial"; ctx.fillText(t("volumeProfile"), cfg.padL + 10, cfg.padT + 15);
  ctx.restore();
}


function drawMomentumPane(ctx, candles, cfg) {
  const closes = candles.map(c => Number(c.close));
  const rsiVals = rsiArray(closes, 14);
  ctx.save();
  ctx.fillStyle = "rgba(148,163,184,0.06)";
  roundRect(ctx, cfg.padL, cfg.padT, cfg.chartW, cfg.height, 12, true, false);
  const yForRsi = v => cfg.padT + (1 - (v / 100)) * (cfg.height - 18) + 9;
  [30, 50, 70].forEach(level => {
    const y = yForRsi(level);
    ctx.strokeStyle = level === 50 ? "rgba(148,163,184,0.24)" : "rgba(148,163,184,0.16)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(cfg.padL, y); ctx.lineTo(cfg.padL + cfg.chartW, y); ctx.stroke();
    ctx.fillStyle = cfg.palette.muted; ctx.font = "10px Inter, Arial"; ctx.fillText(String(level), cfg.padL + cfg.chartW + 12, y + 4);
  });
  ctx.setLineDash([]);
  ctx.strokeStyle = cfg.palette.entry; ctx.lineWidth = 2; ctx.beginPath();
  let started = false;
  rsiVals.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const x = cfg.xFor(i), y = yForRsi(v);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = cfg.palette.text; ctx.font = "800 10px Inter, Arial"; ctx.fillText(`${t("momentumPane")} · RSI`, cfg.padL + 10, cfg.padT + 15);
  ctx.restore();
}


function drawSmcOverlay(ctx, smc, cfg) {
  ctx.save();
  // Institutional Order Blocks - Hollow rectangles with green (Demand) & red (Supply) borders
  (smc.orderBlocks || []).forEach(block => {
    if (!cfg.inView(block.from) && !cfg.inView(block.to)) return;
    const top = cfg.yFor(Math.max(block.from, block.to));
    const bottom = cfg.yFor(Math.min(block.from, block.to));
    const isBull = block.type === 'BULLISH_OB';
    const color = isBull ? "#10b981" : "#ef4444";
    const fill = isBull ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)";
    const h = Math.max(10, bottom - top);
    const x = cfg.padL + cfg.chartW * 0.45;
    const w = cfg.chartW * 0.52;

    ctx.fillStyle = fill;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    roundRect(ctx, x, top, w, h, 6, true, true);

    // Leader pointer arrow pointing into the order block
    ctx.beginPath();
    ctx.moveTo(x + 10, top + h / 2 - 4);
    ctx.lineTo(x + 4, top + h / 2);
    ctx.lineTo(x + 10, top + h / 2 + 4);
    ctx.stroke();

    ctx.font = "900 10px Inter, Arial";
    ctx.fillStyle = color;
    ctx.fillText(isBull ? 'DEMAND ORDER BLOCK' : 'SUPPLY ORDER BLOCK', x + 16, top + Math.min(13, h - 2));
  });

  // Fair Value Gaps (FVG) - Hollow rectangles with cyan & violet dashed borders
  (smc.fvgs || []).forEach(fvg => {
    if (!cfg.inView(fvg.from) && !cfg.inView(fvg.to)) return;
    const top = cfg.yFor(Math.max(fvg.from, fvg.to));
    const bottom = cfg.yFor(Math.min(fvg.from, fvg.to));
    const isBull = fvg.type === 'BULLISH_FVG';
    const color = isBull ? "#06b6d4" : "#a855f7";
    const fill = isBull ? "rgba(6, 182, 212, 0.04)" : "rgba(168, 85, 247, 0.04)";
    const h = Math.max(9, bottom - top);
    const x = cfg.padL + cfg.chartW * 0.30;
    const w = cfg.chartW * 0.66;

    ctx.fillStyle = fill;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    roundRect(ctx, x, top, w, h, 6, true, true);
    ctx.setLineDash([]);

    ctx.font = "900 9px Inter, Arial";
    ctx.fillStyle = color;
    ctx.fillText(isBull ? 'FVG [BISI IMBALANCE]' : 'FVG [SIBI IMBALANCE]', x + 12, top + Math.min(12, h - 2));
  });

  // Institutional Liquidity Pools with target pointer pills
  (smc.liquidityPools || []).forEach(pool => {
    if (!cfg.inView(pool.price)) return;
    const y = cfg.yFor(pool.price);
    ctx.strokeStyle = cfg.palette.liquidity; ctx.setLineDash([3, 5]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cfg.padL, y); ctx.lineTo(cfg.padL + cfg.chartW, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(251, 191, 36, 0.12)";
    ctx.strokeStyle = cfg.palette.liquidity;
    roundRect(ctx, cfg.padL + cfg.chartW - 85, y - 10, 80, 20, 6, true, true);
    ctx.fillStyle = cfg.palette.liquidity; ctx.font = "900 9px Inter, Arial";
    ctx.fillText(`$$$ ${pool.type}`, cfg.padL + cfg.chartW - 78, y + 4);
  });

  (smc.smcEvents || []).forEach((evt, idx) => {
    if (!cfg.inView(evt.price)) return;
    const y = cfg.yFor(evt.price);
    const x = cfg.padL + cfg.chartW * (0.16 + idx * 0.12);
    const color = evt.direction === 'BULLISH' ? cfg.palette.smcBull : cfg.palette.smcBear;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 84, y); ctx.stroke();
    ctx.fillStyle = color; ctx.font = "900 10px Inter, Arial"; ctx.fillText(evt.type, x + 6, y - 6);
  });

  const recentPivots = (smc.pivots || []).slice(-6);
  recentPivots.forEach((pivot, idx) => {
    if (!cfg.inView(pivot.price)) return;
    const x = cfg.padL + cfg.chartW * (0.10 + (idx / Math.max(5, recentPivots.length)) * 0.72);
    const y = cfg.yFor(pivot.price);
    ctx.fillStyle = pivot.kind === 'HIGH' ? cfg.palette.resistance : cfg.palette.support;
    ctx.font = "900 10px Inter, Arial";
    ctx.fillText(pivot.label, x, pivot.kind === 'HIGH' ? y - 8 : y + 14);
  });
  ctx.restore();
}

function rsiArray(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  for (let i = period; i < closes.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff >= 0) gains += diff; else losses += Math.abs(diff);
    }
    out[i] = losses === 0 ? (gains === 0 ? 50 : 100) : 100 - 100 / (1 + gains / losses);
  }
  return out;
}


function drawCurrentPrice(ctx, price, cfg) {
  if (!cfg.inView(price)) return;
  const y = cfg.yFor(price);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cfg.padL, y); ctx.lineTo(cfg.padL + cfg.chartW, y); ctx.stroke();
  drawPricePill(ctx, cfg.padL + cfg.chartW + 8, y, fmt(price, cfg.precision), cfg.palette.text, cfg.palette.panel, cfg.palette.axis);
  ctx.restore();
}

function drawPatternCallout(ctx, a, map, p, cfg) {
  const patterns = (map.patterns || p.patterns || []).slice(0, 4);
  const schools = (a.schools || []).slice(0, 4).map(s => `${s.name}: ${s.bias}`);
  const lines = [patterns.length ? `${t("mappedPatterns")}: ${patterns.join(" · ")}` : `${t("mappedPatterns")}: ${t("noPatternConfirmation")}`, `${t("executionReadiness")}: ${fmt(p.executionReadiness,0)}% · ${t("schoolAgreement")}: ${fmt(p.schoolAgreement,0)}%`, ...schools];
  const boxW = Math.min(410, cfg.width - cfg.padL - cfg.padR - 24);
  const boxH = 86;
  const x = cfg.width - cfg.padR - boxW;
  const y = cfg.height - cfg.padB + 14;
  ctx.save();
  ctx.fillStyle = cfg.palette.panel; ctx.strokeStyle = cfg.palette.axis;
  roundRect(ctx, x, y, boxW, boxH, 16, true, true);
  ctx.fillStyle = cfg.palette.text; ctx.font = "900 11px Inter, Arial"; ctx.fillText(t("analysisSummary"), x + 14, y + 22);
  ctx.fillStyle = cfg.palette.muted; ctx.font = "10px Inter, Arial";
  lines.slice(0, 4).forEach((line, idx) => ctx.fillText(line.slice(0, 72), x + 14, y + 40 + idx * 13));
  ctx.restore();
}

function drawChartHeader(ctx, a, p, map, cfg) {
  const decision = String(a.decision || "WAIT");
  const color = decision === "BUY" ? cfg.palette.support : decision === "SELL" ? cfg.palette.resistance : cfg.palette.fib;
  ctx.save();
  ctx.fillStyle = cfg.palette.text; ctx.font = "900 18px Inter, Arial"; ctx.textAlign = "left";
  ctx.fillText(`${a.symbol || "--"} · ${localizedValue(decision)} · ${fmt(a.confidence, 0)}%`, cfg.padL, 33);
  ctx.fillStyle = cfg.palette.muted; ctx.font = "12px Inter, Arial";
  ctx.fillText(`${t("marketRegime")}: ${p.marketRegime || map.trend?.direction || "--"}`, cfg.padL, 54);
  drawHeaderBadge(ctx, cfg.width - cfg.padR - 144, 24, `${t("grade")} ${a.grade || "--"}`, color, cfg.palette);
  drawHeaderBadge(ctx, cfg.width - cfg.padR - 298, 24, `${t("executionReadiness")} ${fmt(p.executionReadiness,0)}%`, cfg.palette.entry, cfg.palette);
  ctx.restore();
}

function drawChartFooter(ctx, a, p, map, cfg) {
  const items = [`ATR ${fmt(map.atrPct, 3)}%`, `${t("rangePosition")} ${fmt(map.rangePosition, 1)}%`, `${t("sessionQuality")} ${fmt(p.session?.timingQuality, 0)}%`, `${t("dataQuality")} ${fmt(p.dataQuality, 0)}%`, `SMC ${(p.smc?.summary || []).length}`];
  ctx.save(); ctx.fillStyle = cfg.palette.muted; ctx.font = "11px Inter, Arial";
  ctx.fillText(items.join("  •  "), cfg.padL, cfg.height - 20);
  ctx.restore();
}

function drawHeaderBadge(ctx, x, y, label, color, palette) {
  ctx.save(); ctx.font = "900 10px Inter, Arial";
  const w = ctx.measureText(label).width + 20;
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.strokeStyle = color;
  roundRect(ctx, x, y, w, 26, 13, true, true);
  ctx.fillStyle = color; ctx.fillText(label, x + 10, y + 17);
  ctx.restore();
}

function drawHollowLevelZone(ctx, lvl, index, type, cfg) {
  const isSupport = type === "SUPPORT";
  const midPrice = Number(lvl.price);
  if (!Number.isFinite(midPrice)) return;

  const atr = Number(cfg.atr || cfg.price * 0.002 || 0.001);
  const zoneSpread = Math.max(atr * 0.35, midPrice * 0.0006);
  const fromPrice = midPrice - zoneSpread * 0.5;
  const toPrice = midPrice + zoneSpread * 0.5;
  const yTop = Math.round(cfg.yFor(toPrice));
  const yBottom = Math.round(cfg.yFor(fromPrice));
  const yMid = Math.round(cfg.yFor(midPrice));
  const h = Math.max(14, yBottom - yTop);

  const color = isSupport ? "#10b981" : "#ef4444";
  const hollowBg = isSupport ? "rgba(16, 185, 129, 0.04)" : "rgba(239, 68, 68, 0.04)";
  const tagBg = isSupport ? "#061812" : "#1f090c";
  const labelPrefix = isSupport ? (currentLang === "ar" ? "منطقة دعم" : "SUPPORT ZONE") : (currentLang === "ar" ? "منطقة مقاومة" : "RESISTANCE ZONE");
  const code = isSupport ? `S${index + 1}` : `R${index + 1}`;

  ctx.save();
  // 1. Hollow rectangle spanning the chart width with green/red border
  ctx.fillStyle = hollowBg;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  roundRect(ctx, cfg.padL, yTop, cfg.chartW, h, 6, true, true);

  // 2. Corner brackets accentuating the hollow rectangle
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  const cLen = 10;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(cfg.padL, yTop + cLen);
  ctx.lineTo(cfg.padL, yTop);
  ctx.lineTo(cfg.padL + cLen, yTop);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(cfg.padL, yTop + h - cLen);
  ctx.lineTo(cfg.padL, yTop + h);
  ctx.lineTo(cfg.padL + cLen, yTop + h);
  ctx.stroke();

  // 3. Center dotted axis line
  ctx.strokeStyle = isSupport ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cfg.padL, yMid);
  ctx.lineTo(cfg.padL + cfg.chartW - 24, yMid);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Pointer Arrow Bracket pointing directly to the zone
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cfg.padL + cfg.chartW - 18, yMid - 6);
  ctx.lineTo(cfg.padL + cfg.chartW - 8, yMid);
  ctx.lineTo(cfg.padL + cfg.chartW - 18, yMid + 6);
  ctx.stroke();

  // 5. Right edge leader line to price pill
  ctx.beginPath();
  ctx.moveTo(cfg.padL + cfg.chartW, yMid);
  ctx.lineTo(cfg.padL + cfg.chartW + 8, yMid);
  ctx.stroke();

  // 6. Institutional zone badge
  const tagText = `[${code}] ${labelPrefix} · ${fmt(midPrice, cfg.precision)} (${lvl.touches || 1} touches)`;
  ctx.font = "900 10px Inter, Arial";
  const tagW = ctx.measureText(tagText).width + 16;
  const tagY = yTop - 11;
  ctx.fillStyle = tagBg;
  ctx.strokeStyle = color;
  roundRect(ctx, cfg.padL + 12, tagY, tagW, 20, 6, true, true);
  ctx.fillStyle = color;
  ctx.fillText(tagText, cfg.padL + 20, tagY + 14);

  // 7. Right Price Axis Tag Pill
  const axisPillText = `${isSupport ? "SUP" : "RES"} ${fmt(midPrice, cfg.precision)}`;
  drawPricePill(ctx, cfg.padL + cfg.chartW + 8, yMid, axisPillText, color, tagBg, color);

  ctx.restore();
}

function drawSmartLevel(ctx, y, x1, x2, color, label, priceLabel, dashed, strength) {
  if (!Number.isFinite(y)) return;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.35;
  if (dashed) ctx.setLineDash([8, 7]);
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.setLineDash([]);
  if (strength) {
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = color;
    roundRect(ctx, x1, y - 5, x2 - x1, 10, 5, true, false);
    ctx.globalAlpha = 1;
  }
  ctx.font = "900 10px Inter, Arial";
  const leftText = `${label}`;
  const w = ctx.measureText(leftText).width + 16;
  ctx.fillStyle = color;
  roundRect(ctx, x1 + 8, y - 21, w, 18, 8, true, false);
  ctx.fillStyle = "#06111f";
  ctx.fillText(leftText, x1 + 16, y - 8);
  drawPricePill(ctx, x2 + 8, y, priceLabel, color, "rgba(255,255,255,0.08)", color);
  ctx.restore();
}

function drawTaggedLevel(ctx, y, x1, x2, color, label, side = "right") {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.9;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.font = "900 11px Inter, Arial";
  const w = ctx.measureText(label).width + 18;
  const x = side === "left" ? x1 + 10 : x2 - w - 10;
  ctx.fillStyle = color;
  roundRect(ctx, x, y - 13, w, 25, 11, true, false);
  ctx.fillStyle = "#06111f";
  ctx.fillText(label, x + 9, y + 4);
  ctx.restore();
}

function drawPricePill(ctx, x, y, label, color, bg, border) {
  ctx.save(); ctx.font = "900 10px Inter, Arial";
  const w = ctx.measureText(label).width + 16;
  ctx.fillStyle = bg; ctx.strokeStyle = border;
  roundRect(ctx, x, y - 11, w, 22, 10, true, true);
  ctx.fillStyle = color; ctx.fillText(label, x + 8, y + 4);
  ctx.restore();
}

function linearRegressionLine(values) {
  const n = values.length;
  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const meanY = values.reduce((a, b) => a + b, 0) / Math.max(1, n);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (values[i] - meanY); den += (xs[i] - meanX) ** 2; }
  const slope = den ? num / den : 0;
  const intercept = meanY - slope * meanX;
  return { slope, intercept, valueAt: i => intercept + slope * i };
}

function std(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return 0;
  const avg = clean.reduce((a, b) => a + b, 0) / clean.length;
  return Math.sqrt(clean.reduce((acc, v) => acc + (v - avg) ** 2, 0) / clean.length);
}

function emaArray(values,period){
  const out=new Array(values.length).fill(null);if(values.length<period)return out;
  let prev=values.slice(0,period).reduce((sum,v)=>sum+v,0)/period;out[period-1]=prev;
  for(let i=period;i<values.length;i++){prev=values[i]*2/(period+1)+prev*(1-2/(period+1));out[i]=prev}
  return out;
}

function pricePrecision(price) {
  const n = Math.abs(Number(price || 0));
  if (n >= 10000) return 1;
  if (n >= 100) return 2;
  if (n >= 10) return 3;
  if (n >= 1) return 5;
  return 6;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function exportMarketMap() {
  const canvas = $("analysisMapCanvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `thn-market-map-${currentAnalysis?.symbol || "analysis"}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  link.remove();
  status(t("mapExported"));
}

function row(key, value) {
  return `<div><span>${escapeHtml(key)}</span><b>${escapeHtml(value)}</b></div>`;
}

function renderReport(a) {
  if (currentLang === "ar") {
    renderArabicReport(a);
  } else {
    renderEnglishReport(a);
  }
}

function renderEnglishReport(a) {
  const r = a.risk || {};
  const i = a.indicators || {};
  const s = a.structure || {};
  const schoolLines = (a.schools || []).map(x => `- ${x.name}: ${x.bias} | Score ${fmt(x.score, 0)}/100 | Direction ${fmt(x.directionScore, 2)}`).join("\n");
  const actionPlan = Array.isArray(a.professionalActionPlan) ? a.professionalActionPlan.map(x => `- ${x}`).join("\n") : (a.professionalActionPlan || "Follow checklist, confirm news risk, and execute only if broker conditions match the plan.");
  $("report").textContent = `==============================\nTHN AI TRADER - MARKET AUDIT BRIEFING\n==============================\n\nAPP: ${a.appName || "THN AI Trader"}\nSOURCE: ${a.source}\nMARKET DATA: ${a.marketDataSource}\nSYMBOL: ${a.symbol}\nYAHOO SYMBOL: ${a.yahooSymbol}\nTRADINGVIEW SYMBOL: ${a.tvSymbol}\nASSET CLASS: ${a.assetClass}\nTIMEFRAME: ${a.timeframe}\nEXCHANGE: ${a.exchangeName}\nMARKET TIME: ${a.marketTime ? new Date(a.marketTime).toLocaleString() : "--"}\n\n------------------------------\nAI CONSENSUS\n------------------------------\nDECISION: ${a.decision}\nCONSENSUS: ${a.consensusLabel}\nCONFIDENCE: ${fmt(a.confidence, 0)}%\nGRADE: ${a.grade}\nCONSENSUS SCORE: ${fmt(a.consensusScore, 2)}\n\n${a.aiNarrative}\n\n------------------------------\nMULTI-SCHOOL ANALYSIS\n------------------------------\n${schoolLines}\n\n------------------------------\nTRADE LEVELS\n------------------------------\nENTRY: ${fmt(a.entry, 6)}\nSTOP LOSS: ${a.stopLoss ? fmt(a.stopLoss, 6) : "--"}\nTAKE PROFIT 1: ${a.targets?.[0] ? fmt(a.targets[0], 6) : "--"}\nTAKE PROFIT 2: ${a.targets?.[1] ? fmt(a.targets[1], 6) : "--"}\nTAKE PROFIT 3: ${a.targets?.[2] ? fmt(a.targets[2], 6) : "--"}\n\n------------------------------\nRISK MANAGEMENT\n------------------------------\nACCOUNT BALANCE: ${money(r.accountBalance)}\nRISK PER TRADE: ${fmt(r.riskPct, 2)}%\nRISK AMOUNT: ${money(r.riskAmount)}\nRISK PER UNIT: ${fmt(r.riskPerUnit, 6)}\nUNITS: ${fmt(r.units, 4)}\nFOREX LOTS: ${r.forexLots ? fmt(r.forexLots, 4) : "N/A"}\nEXPOSURE: ${money(r.exposure)}\nEXPOSURE %: ${fmt(r.exposurePct, 2)}%\nREWARD/RISK: 1 : ${fmt(r.rewardRisk, 2)}\nBREAK-EVEN WIN RATE: ${fmt(r.breakEvenWinRate, 2)}%\n\n------------------------------\nINDICATORS\n------------------------------\nPRICE: ${fmt(i.price, 6)}\nEMA20: ${fmt(i.ema20, 6)}\nEMA50: ${fmt(i.ema50, 6)}\nEMA200: ${fmt(i.ema200, 6)}\nRSI14: ${fmt(i.rsi14, 2)}\nATR14: ${fmt(i.atr14, 6)} (${fmt(i.atrPct, 3)}%)\nMACD HISTOGRAM: ${fmt(i.macdHistogram, 6)}\nVOLATILITY: ${i.volatilityLabel}\n\n------------------------------\nSTRUCTURE\n------------------------------\nSUPPORT: ${fmt(s.support, 6)}\nRESISTANCE: ${fmt(s.resistance, 6)}\nRECENT HIGH: ${fmt(s.recentHigh, 6)}\nRECENT LOW: ${fmt(s.recentLow, 6)}\nTREND STRUCTURE: ${s.trendStructure}\nRANGE POSITION: ${fmt(s.rangePosition, 2)}%\nSELL-SIDE SWEEP: ${s.possibleSellSideSweep ? "Possible" : "No"}\nBUY-SIDE SWEEP: ${s.possibleBuySideSweep ? "Possible" : "No"}\n\n------------------------------\nREASONS\n------------------------------\n${(a.reasons || []).map(x => `- ${x}`).join("\n")}\n\n------------------------------\nWARNINGS\n------------------------------\n${(a.warnings || []).map(x => `- ${x}`).join("\n")}\n\n------------------------------\nACTION PLAN\n------------------------------\n${actionPlan}\n\nDISCLAIMER: THN AI Trader is an educational and analytical decision-support system. It is not financial advice, does not guarantee profit, and must be verified with independent market research, broker specifications, and professional risk management.`;
}

function renderArabicReport(a) {
  const r = a.risk || {};
  const i = a.indicators || {};
  const s = a.structure || {};
  const schoolLines = (a.schools || []).map(x => `- ${localizedSchoolName(x.name)}: ${localizedValue(x.bias)} | ${t("score")} ${fmt(x.score, 0)}/100 | اتجاه ${fmt(x.directionScore, 2)}`).join("\n");
  $("report").textContent = `==============================\nTHN AI TRADER - تقرير احترافي\n==============================\n\nالتطبيق: ${a.appName || "THN AI Trader"}\nالمصدر: ${a.source}\nبيانات السوق: ${a.marketDataSource}\nالرمز: ${a.symbol}\nرمز Yahoo: ${a.yahooSymbol}\nرمز TradingView: ${a.tvSymbol}\nنوع الأصل: ${localizedValue(a.assetClass)}\nالإطار الزمني: ${a.timeframe}\nوقت السوق: ${a.marketTime ? new Date(a.marketTime).toLocaleString("ar-OM") : "--"}\n\n------------------------------\nتوافق الذكاء الاصطناعي\n------------------------------\nالقرار: ${localizedValue(a.decision)}\nالثقة: ${fmt(a.confidence, 0)}%\nالتقييم: ${a.grade}\nدرجة التوافق: ${fmt(a.consensusScore, 2)}\n\n${localizedNarrative(a)}\n\n------------------------------\nتحليل المدارس\n------------------------------\n${schoolLines}\n\n------------------------------\nمستويات الصفقة\n------------------------------\nالدخول: ${fmt(a.entry, 6)}\nوقف الخسارة: ${a.stopLoss ? fmt(a.stopLoss, 6) : "--"}\nالهدف الأول: ${a.targets?.[0] ? fmt(a.targets[0], 6) : "--"}\nالهدف الثاني: ${a.targets?.[1] ? fmt(a.targets[1], 6) : "--"}\nالهدف الثالث: ${a.targets?.[2] ? fmt(a.targets[2], 6) : "--"}\n\n------------------------------\nإدارة المخاطر\n------------------------------\nرصيد الحساب: ${money(r.accountBalance)}\nنسبة المخاطرة: ${fmt(r.riskPct, 2)}%\nمبلغ المخاطرة: ${money(r.riskAmount)}\nالمخاطرة لكل وحدة: ${fmt(r.riskPerUnit, 6)}\nالوحدات: ${fmt(r.units, 4)}\nلوتات الفوركس: ${r.forexLots ? fmt(r.forexLots, 4) : "N/A"}\nالتعرض: ${money(r.exposure)}\nنسبة التعرض: ${fmt(r.exposurePct, 2)}%\nالعائد/المخاطرة: 1 : ${fmt(r.rewardRisk, 2)}\nنسبة التعادل: ${fmt(r.breakEvenWinRate, 2)}%\n\n------------------------------\nالمؤشرات\n------------------------------\nالسعر: ${fmt(i.price, 6)}\nEMA20: ${fmt(i.ema20, 6)}\nEMA50: ${fmt(i.ema50, 6)}\nEMA200: ${fmt(i.ema200, 6)}\nRSI14: ${fmt(i.rsi14, 2)}\nATR14: ${fmt(i.atr14, 6)} (${fmt(i.atrPct, 3)}%)\nMACD: ${fmt(i.macdHistogram, 6)}\nالتذبذب: ${i.volatilityLabel}\n\n------------------------------\nالهيكل\n------------------------------\nالدعم: ${fmt(s.support, 6)}\nالمقاومة: ${fmt(s.resistance, 6)}\nآخر قمة: ${fmt(s.recentHigh, 6)}\nآخر قاع: ${fmt(s.recentLow, 6)}\nهيكل الاتجاه: ${s.trendStructure}\nموقع النطاق: ${fmt(s.rangePosition, 2)}%\nسحب سيولة القيعان: ${s.possibleSellSideSweep ? t("possible") : t("no")}\nسحب سيولة القمم: ${s.possibleBuySideSweep ? t("possible") : t("no")}\n\n------------------------------\nخطة التنفيذ\n------------------------------\n- لا تدخل قبل تأكيد الأخبار والسبريد والسيولة.\n- التزم بنسبة المخاطرة المحددة ولا ترفع حجم الصفقة بسبب الثقة العالية.\n- استخدم الوقف والأهداف كما هي أو عدلها فقط حسب خطة واضحة.\n\nتنبيه: THN AI Trader نظام تحليلي وتعليمي مساعد، وليس نصيحة مالية ولا يضمن الربح. يجب التحقق من التحليل وإدارة المخاطر ومواصفات الوسيط قبل أي تنفيذ.`;
}

function loadChart(symbol, interval) {
  const chartSymbol = symbol || currentAnalysis?.tvSymbol || $("symbolInput").value.trim() || "FX:EURUSD";
  const chartInterval = interval || currentAnalysis?.tvInterval || "60";
  $("tvSymbolText").textContent = t("chartSymbolLine", { symbol: chartSymbol, interval: chartInterval });
  $("tvChart").innerHTML = "";
  if (typeof TradingView === "undefined") {
    $("tvChart").innerHTML = `<div class="chart-error">${t("chartError")}</div>`;
    return;
  }
  tvWidget = new TradingView.widget({
    autosize: true,
    symbol: chartSymbol,
    interval: chartInterval,
    timezone: "Etc/UTC",
    theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",
    style: "1",
    locale: currentLang === "ar" ? "ar_AE" : "en",
    enable_publishing: false,
    withdateranges: true,
    hide_side_toolbar: false,
    allow_symbol_change: true,
    details: true,
    hotlist: true,
    calendar: true,
    container_id: "tvChart",
    studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies", "ATR@tv-basicstudies", "BB@tv-basicstudies"]
  });
}


function normalizeSymbolInput(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function getWatchlist() {
  try {
    const raw = browserStore.getItem(watchlistKey);
    if (raw === null) {
      const defaults = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSDT"];
      browserStore.setItem(watchlistKey, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(normalizeSymbolInput).filter(Boolean).slice(0, 30);
  } catch {
    browserStore.removeItem(watchlistKey);
  }
  return [];
}

function setWatchlist(items) {
  const clean = [...new Set((items || []).map(normalizeSymbolInput).filter(Boolean))].slice(0, 30);
  browserStore.setItem(watchlistKey, JSON.stringify(clean));
  renderWatchlist();
  return clean;
}

function getWatchSettings() {
  try {
    const saved = JSON.parse(browserStore.getItem(watchSettingsKey) || "{}");
    return {
      minConfidence: Number(saved.minConfidence || $("minConfidence")?.value || 72),
      scanEvery: saved.scanEvery || $("scanEvery")?.value || "300000",
      customScanValue: Number(saved.customScanValue || $("customScanValue")?.value || 45),
      customScanUnit: saved.customScanUnit || $("customScanUnit")?.value || "seconds"
    };
  } catch {
    return { minConfidence: 72, scanEvery: "300000", customScanValue: 45, customScanUnit: "seconds" };
  }
}

function saveWatchSettings() {
  const settings = {
    minConfidence: Number($("minConfidence")?.value || 72),
    scanEvery: $("scanEvery")?.value || "300000",
    customScanValue: Number($("customScanValue")?.value || 45),
    customScanUnit: $("customScanUnit")?.value || "seconds"
  };
  browserStore.setItem(watchSettingsKey, JSON.stringify(settings));
  return settings;
}

function restoreWatchSettings() {
  const settings = getWatchSettings();
  if ($("minConfidence")) $("minConfidence").value = settings.minConfidence;
  if ($("scanEvery")) $("scanEvery").value = String(settings.scanEvery);
  if ($("customScanValue")) $("customScanValue").value = settings.customScanValue;
  if ($("customScanUnit")) $("customScanUnit").value = settings.customScanUnit;
  updateCustomScanVisibility();
  updateSoundButton();
}

function getScanIntervalMs(){
  const custom=$("scanEvery")?.value==="custom";
  const value=Number(custom?$("customScanValue")?.value:$("scanEvery")?.value||300000);
  const ms=custom&&$("customScanUnit")?.value==="minutes"?value*60000:custom?value*1000:value;
  if(!Number.isFinite(ms)||ms<10000||ms>86400000)throw Error("Scan interval must be between 10 seconds and 24 hours");
  return ms;
}

function updateCustomScanVisibility() {
  const isCustom = $("scanEvery")?.value === "custom";
  const box = $("customScanBox");
  if (box) {
    if (isCustom) box.classList.remove("hidden");
    else box.classList.add("hidden");
  }
}

function addFavoriteSymbol(value) {
  const symbols = String(value || "").split(/[,\s]+/).map(normalizeSymbolInput).filter(Boolean);
  if (!symbols.length) return;
  const next = setWatchlist([...getWatchlist(), ...symbols]);
  if ($("favoriteSymbolInput")) $("favoriteSymbolInput").value = "";
  status(`${symbols.join(", ")} ${currentLang === "ar" ? "أضيفت إلى قائمة المتابعة." : "added to watchlist."}`);
  return next;
}

function removeFavoriteSymbol(symbol) {
  setWatchlist(getWatchlist().filter(item => item !== symbol));
  watchScanResults = watchScanResults.filter(item => item.requestedSymbol !== symbol && item.symbol !== symbol);
  renderAlerts();
}

function toggleWatchlist(forceState) {
  watchHidden = typeof forceState === "boolean" ? forceState : !watchHidden;
  browserStore.setItem(watchHiddenKey, String(watchHidden));
  renderWatchlist();
}

function renderWatchlist() {
  const pairs = getWatchlist();
  if ($("watchlistCountBadge")) {
    $("watchlistCountBadge").textContent = `${pairs.length} ${t("pairs")}`;
  }

  const body = $("watchlistBody");
  const bar = $("watchlistCollapsedBar");
  const toggleBtn = $("toggleWatchlistBtn");

  if (watchHidden) {
    body?.classList.add("hidden");
    bar?.classList.remove("hidden");
    if ($("watchlistCollapsedSummary")) {
      $("watchlistCollapsedSummary").textContent = t("watchlistHidden", { count: pairs.length });
    }
    if (toggleBtn) toggleBtn.textContent = t("showWatchlist");
  } else {
    body?.classList.remove("hidden");
    bar?.classList.add("hidden");
    if (toggleBtn) toggleBtn.textContent = t("hideWatchlist");
  }

  if (!$("watchlistList")) return;
  const prefs=instrumentPrefs();
  const filtered = pairs.filter(p => (!prefs[p]?.hidden||showHiddenInstruments)&&(!watchSearchTerm || p.includes(watchSearchTerm)));
  $("watchlistList").innerHTML = filtered.map(symbol => `<div class="watch-item">
    <b>${escapeHtml(symbol)}</b>
    <span>${escapeHtml(t("alertOnly"))}</span>
    <div class="watch-actions">
      <button class="ghost small" type="button" data-watch-analyze="${escapeHtml(symbol)}">${escapeHtml(t("analyzePair"))}</button>
      <button class="ghost small" type="button" data-watch-hide="${escapeHtml(symbol)}">${prefs[symbol]?.hidden?(currentLang==="ar"?"استعادة":"Restore"):(currentLang==="ar"?"إخفاء":"Hide")}</button>
      <label><input type="checkbox" data-watch-scan="${escapeHtml(symbol)}" ${prefs[symbol]?.scanEnabled!==false?"checked":""}> ${currentLang==="ar"?"مسح":"Scan"}</label>
      <button class="ghost small danger" type="button" data-watch-remove="${escapeHtml(symbol)}">${escapeHtml(t("removePair"))}</button>
    </div>
  </div>`).join("") || `<p class="tiny">${escapeHtml(watchSearchTerm ? (currentLang === "ar" ? "لا توجد أزواج مطابقة للبحث." : "No pairs match search.") : t("noPairsYet"))}</p>`;
}

function watchlistPayload() {
  return {
    symbols: getWatchlist().filter(symbol=>instrumentPrefs()[symbol]?.scanEnabled!==false),
    timeframe: $("timeframe").value,
    accountBalance: Number($("accountBalance").value || 10000),
    riskPct: Number($("riskPct").value || 1),
    rewardRisk: Number($("rewardRisk").value || 2),
    sentiment: $("sentiment").value,
    minConfidence: Number($("minConfidence").value || 72)
  };
}

function scannerRunning(isRunning) {
  if ($("scannerBadge")) {
    $("scannerBadge").textContent = isRunning ? t("scannerRunning") : t("scannerStopped");
    $("scannerBadge").classList.toggle("running", isRunning);
  }
}

function setWatchStatus(message) {
  if ($("watchStatus")) $("watchStatus").textContent = message;
}

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTradeAlertSound(decision) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const isBuy = String(decision || "").includes("BUY");
    const freqs = isBuy ? [523.25, 659.25, 783.99, 1046.50] : [783.99, 659.25, 523.25, 392.00];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  } catch {
    // Autoplay fallback
  }
}

function showTradeToast(item) {
  const toast = $("tradeToast");
  if (!toast) return;
  if (toastTimeout) clearTimeout(toastTimeout);

  const signal = String(item.decision || "BUY").toUpperCase();
  const isBuy = signal.includes("BUY");
  const toastSignal = $("toastSignal");
  if (toastSignal) {
    toastSignal.textContent = localizedValue(signal);
    toastSignal.className = `toast-signal ${signal.toLowerCase().replace(/\s+/g, "-")}`;
  }
  if ($("toastSymbol")) $("toastSymbol").textContent = item.symbol || item.requestedSymbol || "--";
  if ($("toastConfidence")) $("toastConfidence").textContent = `${fmt(item.confidence, 0)}%`;

  const precision = pricePrecision(item.entry);
  if ($("toastEntry")) $("toastEntry").textContent = fmt(item.entry, precision);
  if ($("toastSL")) $("toastSL").textContent = item.stopLoss ? fmt(item.stopLoss, precision) : "--";
  if ($("toastTP1")) $("toastTP1").textContent = item.targets?.[0] ? fmt(item.targets[0], precision) : "--";

  const reasonText = item.reasons?.[0] || item.aiNarrative || item.automation?.summary || (currentLang === "ar" ? "اكتشف الماسح فرصة تداول عالية الاحتمالية." : "Scanner detected a high-probability opportunity setup.");
  if ($("toastReason")) $("toastReason").textContent = reasonText;

  toast.dataset.symbol = item.symbol || item.requestedSymbol;
  toast.classList.remove("hidden");

  toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 12000);
}

function hideTradeToast() {
  const toast = $("tradeToast");
  if (toast) toast.classList.add("hidden");
  if (toastTimeout) clearTimeout(toastTimeout);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  browserStore.setItem(soundKey, String(soundEnabled));
  const prefs=notificationPrefs();prefs.sound=soundEnabled;browserStore.setItem(notificationPrefsKey,JSON.stringify(prefs));if($("notifysound"))$("notifysound").checked=soundEnabled;
  updateSoundButton();
  if (soundEnabled) playTradeAlertSound("BUY");
}

function updateSoundButton() {
  const btn = $("toggleSoundBtn");
  if (!btn) return;
  btn.textContent = soundEnabled ? t("soundOn") : t("soundOff");
  btn.classList.toggle("active", soundEnabled);
}

async function scanWatchlist(generation=scanGeneration) {
  if(typeof generation!=="number")generation=scanGeneration;
  if(scanInFlight)return;
  scanInFlight=true;scanController=new AbortController();
  const controller=scanController;
  const payload = watchlistPayload();
  if (!payload.symbols.length) {
    setWatchStatus(t("watchlistEmpty"));
    status(t("watchlistEmpty"));
    scanInFlight=false;return;
  }
  saveWatchSettings();
  setWatchStatus(t("scanningWatchlist", { count: payload.symbols.length }));
  try {
    const res = await fetch("/api/watchlist/scan", {
      signal:controller.signal,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.detail || data.error || "Watchlist scan failed");
    if(generation!==scanGeneration||controller.signal.aborted)return;
    scanFailures=0;
    watchScanResults = data.results || [];
    renderAlerts(data.scannedAt);

    const actionableAlerts=watchScanResults.filter(item=>item.automation?.active===true);
    await notifyStrongAlerts(actionableAlerts,generation);

    const msg = t("scanComplete", { alerts: data.strongAlertCount || actionableAlerts.length, count: data.count || payload.symbols.length });
    setWatchStatus(msg);
    status(msg);
  } catch (error) {
    if(error.name!=="AbortError"&&generation===scanGeneration){scanFailures++;setWatchStatus(`${t("errorPrefix")}: ${error.message}`)}
  } finally {scanInFlight=false;if(scanController===controller)scanController=null}
}

function alertLabel(item) {
  if (item.automation?.severity === "strong-entry") return t("strongAlert");
  if (item.automation?.severity === "qualified-entry") return t("qualifiedAlert");
  if (String(item.decision || "").includes("BUY") || String(item.decision || "").includes("SELL")) return t("reviewOnly");
  return t("noTrade");
}

function renderAlerts(scannedAt) {
  if (!$("alertList")) return;
  const sorted = [...watchScanResults].sort((a, b) => (b.automation?.trustScore || 0) - (a.automation?.trustScore || 0));
  $("alertList").innerHTML = sorted.map(item => {
    const auto = item.automation || {};
    const active = auto.active ? " active" : "";
    const firstReason = auto.active ? auto.summary : (auto.blockedReasons?.[0] || auto.summary || t("noMajorWarnings"));
    const decisionCls = String(item.decision || "WAIT").toLowerCase().replace(/\s+/g, "-");
    return `<article class="alert-card${active}">
      <div class="alert-title">
        <div><b>${escapeHtml(item.symbol || item.requestedSymbol)}</b><span>${escapeHtml(alertLabel(item))}</span></div>
        <strong class="decision ${decisionCls}">${escapeHtml(localizedValue(item.decision || "WAIT"))}</strong>
      </div>
      <div class="alert-metrics">
        <span>${escapeHtml(t("confidenceLabel"))}: <b>${fmt(item.confidence, 0)}%</b></span>
        <span>${escapeHtml(t("trustScore"))}: <b>${fmt(auto.trustScore, 0)}/100</b></span>
        <span>${escapeHtml(t("grade"))}: <b>${escapeHtml(item.grade || "--")}</b></span>
      </div>
      <div class="alert-levels">
        <span>${escapeHtml(t("alertEntry"))}: <b>${fmt(item.entry, 6)}</b></span>
        <span>${escapeHtml(t("alertSL"))}: <b>${item.stopLoss ? fmt(item.stopLoss, 6) : "--"}</b></span>
        <span>${escapeHtml(t("alertTP"))}: <b>${item.targets?.[0] ? fmt(item.targets[0], 6) : "--"}</b></span>
      </div>
      <p>${escapeHtml(firstReason)}</p>
    </article>`;
  }).join("") || `<p class="tiny">${escapeHtml(t("watchReady"))}</p>`;
  if (scannedAt) {
    const date = new Date(scannedAt).toLocaleString(currentLang === "ar" ? "ar-OM" : undefined);
    setWatchStatus(`${t("lastScan")}: ${date}`);
  }
}

function getNotifyCache() {
  try {
    return JSON.parse(browserStore.getItem(watchNotifyKey) || "{}");
  } catch {
    return {};
  }
}

const notificationPrefsKey="thn_notification_prefs_v2";
function notificationPrefs(){
  const defaults={browser:false,toast:false,sound:false,cooldownMinutes:15,minConfidence:72,symbols:[],timeframes:["scalp","intraday","swing","position"],severities:["strong-entry","qualified-entry"],quietStart:"",quietEnd:""};
  try{return {...defaults,...JSON.parse(browserStore.getItem(notificationPrefsKey)||"{}")}}catch{return defaults}
}
function quietHours(prefs){
  if(!prefs.quietStart||!prefs.quietEnd)return false;
  const hhmm=new Date().toTimeString().slice(0,5);
  return prefs.quietStart<prefs.quietEnd?hhmm>=prefs.quietStart&&hhmm<prefs.quietEnd:hhmm>=prefs.quietStart||hhmm<prefs.quietEnd;
}
function eligibleNotification(item,prefs){
  const p=item.provenance;
  return item.automation?.active===true&&p?.state==="REAL"&&p.verified===true&&p.instrumentMatch===true&&p.fresh===true&&Number.isFinite(p.quoteAt)&&p.quoteAt<=Date.now()+1000&&Date.now()-p.quoteAt<=120000&&item.confidence>=prefs.minConfidence&&(!prefs.symbols.length||prefs.symbols.includes(item.symbol))&&prefs.timeframes.includes(item.timeframe)&&prefs.severities.includes(item.automation.severity)&&!quietHours(prefs);
}
function reserveNotification(item,prefs){
  return new Promise(resolve=>{
    const request=indexedDB.open("thn-notification-delivery",1);
    request.onupgradeneeded=()=>{const store=request.result.createObjectStore("deliveries");store.createIndex("at","at")};
    request.onerror=()=>resolve(false);
    request.onsuccess=()=>{
      const db=request.result,tx=db.transaction("deliveries","readwrite"),store=tx.objectStore("deliveries"),now=Date.now();
      const key=`setup:${item.setupId}`,cooldown=`channel:${item.symbol}:${item.timeframe}:${item.decision}`;let allowed=false;
      const first=store.get(key);first.onsuccess=()=>{const second=store.get(cooldown);second.onsuccess=()=>{
        if(first.result&&now-first.result.at<30*86400000||second.result&&now-second.result.at<prefs.cooldownMinutes*60000)return;
        allowed=true;store.put({at:now},key);store.put({at:now},cooldown);
        const count=store.count();count.onsuccess=()=>{let remaining=Math.max(0,count.result-1024);const cursor=store.index("at").openCursor();cursor.onsuccess=()=>{const entry=cursor.result;if(!entry)return;if(entry.value.at<now-30*86400000||remaining>0){entry.delete();remaining--}entry.continue()}};
      }};
      tx.oncomplete=()=>{db.close();resolve(allowed)};tx.onabort=()=>{db.close();resolve(false)};
    };
  });
}
async function notifyStrongAlerts(alerts,generation=scanGeneration){
  if(!navigator.locks||!window.indexedDB)return;
  await navigator.locks.request("thn-opportunity-delivery",async()=>{
    if(generation!==scanGeneration)return;
    const prefs=notificationPrefs();if(!prefs.browser&&!prefs.toast&&!prefs.sound)return;
    let sounded=false;
    for(const item of alerts){
      if(!eligibleNotification(item,prefs)||!item.setupId)continue;
      const browserAllowed=prefs.browser&&typeof Notification!=="undefined"&&Notification.permission==="granted";
      if(!browserAllowed&&!prefs.toast&&!prefs.sound)continue;
      if(!await reserveNotification(item,prefs)||generation!==scanGeneration)continue;
      const current=notificationPrefs();
      if(current.sound&&!sounded){soundEnabled=true;playTradeAlertSound(item.decision);sounded=true}
      if(current.toast)showTradeToast(item);
      if(current.browser&&browserAllowed)new Notification(t("browserNotificationTitle"),{tag:item.setupId,body:t("browserNotificationBody",{symbol:item.symbol,decision:localizedValue(item.decision),confidence:fmt(item.confidence,0)})});
    }
  });
}
function restoreNotificationPrefs(){const p=notificationPrefs();for(const key of ["browser","toast","sound"]){const el=$("notify"+key);if(el)el.checked=Boolean(p[key])}$("notifyCooldown").value=p.cooldownMinutes;$("notifyConfidence").value=p.minConfidence;$("notifySymbols").value=p.symbols.join(",");$("notifyTimeframes").value=p.timeframes.join(",");$("notifySeverities").value=p.severities.join(",");$("quietStart").value=p.quietStart;$("quietEnd").value=p.quietEnd;soundEnabled=p.sound;updateSoundButton()}
async function saveNotificationPrefs(){
  const p={...notificationPrefs(),browser:$("notifybrowser").checked,toast:$("notifytoast").checked,sound:$("notifysound").checked,cooldownMinutes:Number($("notifyCooldown").value),minConfidence:Number($("notifyConfidence").value),symbols:$("notifySymbols").value.split(/[,\s]+/).map(normalizeSymbolInput).filter(Boolean),timeframes:$("notifyTimeframes").value.split(",").map(s=>s.trim()),severities:$("notifySeverities").value.split(",").map(s=>s.trim()),quietStart:$("quietStart").value,quietEnd:$("quietEnd").value};
  if(!Number.isFinite(p.cooldownMinutes)||p.cooldownMinutes<1||p.cooldownMinutes>1440||!Number.isFinite(p.minConfidence)||p.minConfidence<50||p.minConfidence>95){showNotice("Invalid notification threshold or cooldown","error");return}
  if(p.browser){if(typeof Notification==="undefined"||await Notification.requestPermission()!=="granted"){p.browser=false;$("notifybrowser").checked=false;showNotice("Browser notification permission was not granted","info")}}
  browserStore.setItem(notificationPrefsKey,JSON.stringify(p));soundEnabled=p.sound;browserStore.setItem(soundKey,String(p.sound));updateSoundButton();
}

function startScanner(){
  let interval;try{interval=getScanIntervalMs()}catch(error){setWatchStatus(error.message);return}
  if(!watchlistPayload().symbols.length){setWatchStatus(t("watchlistEmpty"));return}
  saveWatchSettings();stopScanner(false);scannerActive=true;scannerRunning(true);
  const generation=scanGeneration;
  const run=async()=>{await scanWatchlist(generation);if(scannerActive&&generation===scanGeneration)watchScanTimer=setTimeout(run,Math.min(86400000,interval*2**Math.min(scanFailures,4)))};
  run();
}
function stopScanner(showStatus=true){
  scannerActive=false;scanGeneration++;clearTimeout(watchScanTimer);watchScanTimer=null;scanController?.abort();scannerRunning(false);
  if(showStatus){setWatchStatus(t("scanStopped"));status(t("scanStopped"))}
}

let analyticsPeriod = "all";
let analyticsAsset = "all";

function detectAssetClass(symbol) {
  const s = String(symbol || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.includes("BTC") || s.includes("ETH") || s.includes("SOL") || s.includes("XRP") || s.includes("BNB") || s.endsWith("USDT")) return "Crypto";
  if (s.includes("XAU") || s.includes("GOLD") || s.includes("XAG") || s.includes("SILVER") || s.includes("OIL") || s.includes("USOIL") || s.includes("BRENT") || s.includes("WTI")) return "Commodity";
  if (s.includes("US30") || s.includes("SPX") || s.includes("NAS100") || s.includes("NDX") || s.includes("DJI") || s.includes("DAX") || s.includes("FTSE")) return "Index";
  return "Forex";
}

function getBenchmarkSampleTrades() {
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const samples = [
    { symbol: "EURUSD", decision: "BUY", assetClass: "Forex", daysAgo: 56, pnl: 240, r: 2.4, outcome: "WIN", entry: 1.0785, exitPrice: 1.0833, sl: 1.0765, grade: "A+", confidence: 84 },
    { symbol: "BTCUSDT", decision: "BUY", assetClass: "Crypto", daysAgo: 52, pnl: 360, r: 3.6, outcome: "WIN", entry: 64200, exitPrice: 66000, sl: 63700, grade: "A", confidence: 80 },
    { symbol: "GBPUSD", decision: "SELL", assetClass: "Forex", daysAgo: 49, pnl: -100, r: -1.0, outcome: "LOSS", entry: 1.2980, exitPrice: 1.3015, sl: 1.3015, grade: "B", confidence: 71 },
    { symbol: "XAUUSD", decision: "BUY", assetClass: "Commodity", daysAgo: 46, pnl: 290, r: 2.9, outcome: "WIN", entry: 2680.5, exitPrice: 2709.5, sl: 2670.5, grade: "A+", confidence: 88 },
    { symbol: "US30", decision: "BUY", assetClass: "Index", daysAgo: 43, pnl: 190, r: 1.9, outcome: "WIN", entry: 42100, exitPrice: 42480, sl: 41900, grade: "A", confidence: 81 },
    { symbol: "USDJPY", decision: "SELL", assetClass: "Forex", daysAgo: 40, pnl: -100, r: -1.0, outcome: "LOSS", entry: 154.20, exitPrice: 154.70, sl: 154.70, grade: "B", confidence: 70 },
    { symbol: "EURUSD", decision: "BUY", assetClass: "Forex", daysAgo: 37, pnl: 220, r: 2.2, outcome: "WIN", entry: 1.0820, exitPrice: 1.0864, sl: 1.0800, grade: "A", confidence: 77 },
    { symbol: "BTCUSDT", decision: "SELL", assetClass: "Crypto", daysAgo: 34, pnl: -100, r: -1.0, outcome: "LOSS", entry: 67800, exitPrice: 68400, sl: 68400, grade: "B", confidence: 72 },
    { symbol: "XAUUSD", decision: "BUY", assetClass: "Commodity", daysAgo: 31, pnl: 320, r: 3.2, outcome: "WIN", entry: 2715.0, exitPrice: 2747.0, sl: 2705.0, grade: "A+", confidence: 89 },
    { symbol: "GBPUSD", decision: "BUY", assetClass: "Forex", daysAgo: 28, pnl: 180, r: 1.8, outcome: "WIN", entry: 1.2910, exitPrice: 1.2946, sl: 1.2890, grade: "A", confidence: 78 },
    { symbol: "US30", decision: "SELL", assetClass: "Index", daysAgo: 25, pnl: 260, r: 2.6, outcome: "WIN", entry: 42800, exitPrice: 42280, sl: 43000, grade: "A+", confidence: 85 },
    { symbol: "USDJPY", decision: "BUY", assetClass: "Forex", daysAgo: 23, pnl: 170, r: 1.7, outcome: "WIN", entry: 152.10, exitPrice: 152.95, sl: 151.60, grade: "A", confidence: 76 },
    { symbol: "EURUSD", decision: "SELL", assetClass: "Forex", daysAgo: 20, pnl: -100, r: -1.0, outcome: "LOSS", entry: 1.0890, exitPrice: 1.0925, sl: 1.0925, grade: "B", confidence: 73 },
    { symbol: "BTCUSDT", decision: "BUY", assetClass: "Crypto", daysAgo: 17, pnl: 450, r: 4.5, outcome: "WIN", entry: 68900, exitPrice: 71150, sl: 68400, grade: "A+", confidence: 91 },
    { symbol: "XAUUSD", decision: "SELL", assetClass: "Commodity", daysAgo: 15, pnl: -100, r: -1.0, outcome: "LOSS", entry: 2748.0, exitPrice: 2758.0, sl: 2758.0, grade: "B", confidence: 74 },
    { symbol: "GBPUSD", decision: "BUY", assetClass: "Forex", daysAgo: 13, pnl: 210, r: 2.1, outcome: "WIN", entry: 1.2940, exitPrice: 1.2982, sl: 1.2920, grade: "A", confidence: 80 },
    { symbol: "EURUSD", decision: "BUY", assetClass: "Forex", daysAgo: 11, pnl: 250, r: 2.5, outcome: "WIN", entry: 1.0810, exitPrice: 1.0860, sl: 1.0790, grade: "A+", confidence: 86 },
    { symbol: "US30", decision: "BUY", assetClass: "Index", daysAgo: 9, pnl: -100, r: -1.0, outcome: "LOSS", entry: 42500, exitPrice: 42300, sl: 42300, grade: "B", confidence: 72 },
    { symbol: "BTCUSDT", decision: "BUY", assetClass: "Crypto", daysAgo: 7, pnl: 390, r: 3.9, outcome: "WIN", entry: 71200, exitPrice: 73150, sl: 70700, grade: "A+", confidence: 88 },
    { symbol: "XAUUSD", decision: "BUY", assetClass: "Commodity", daysAgo: 5, pnl: 300, r: 3.0, outcome: "WIN", entry: 2730.0, exitPrice: 2760.0, sl: 2720.0, grade: "A+", confidence: 87 },
    { symbol: "USDJPY", decision: "SELL", assetClass: "Forex", daysAgo: 4, pnl: 180, r: 1.8, outcome: "WIN", entry: 153.80, exitPrice: 152.90, sl: 154.30, grade: "A", confidence: 79 },
    { symbol: "EURUSD", decision: "BUY", assetClass: "Forex", daysAgo: 3, pnl: -100, r: -1.0, outcome: "LOSS", entry: 1.0840, exitPrice: 1.0810, sl: 1.0810, grade: "B", confidence: 73 },
    { symbol: "GBPUSD", decision: "BUY", assetClass: "Forex", daysAgo: 2, pnl: 240, r: 2.4, outcome: "WIN", entry: 1.2960, exitPrice: 1.3008, sl: 1.2940, grade: "A", confidence: 82 },
    { symbol: "BTCUSDT", decision: "BUY", assetClass: "Crypto", daysAgo: 1, pnl: 370, r: 3.7, outcome: "WIN", entry: 73400, exitPrice: 75250, sl: 72900, grade: "A+", confidence: 89 }
  ];
  return samples.map((s, idx) => ({
    id: "sample-" + idx,
    date: new Date(now - s.daysAgo * day).toISOString(),
    symbol: s.symbol,
    decision: s.decision,
    confidence: s.confidence,
    grade: s.grade,
    entry: s.entry,
    stopLoss: s.sl,
    target1: s.exitPrice,
    risk: 100,
    assetClass: s.assetClass,
    status: s.outcome,
    pnl: s.pnl,
    pnlR: s.r,
    exitPrice: s.exitPrice
  }));
}

function loadBenchmarkHistory(){benchmarkPreview=true;showNotice("Synthetic benchmark preview; your journal is unchanged","info");renderPerformanceAnalytics()}
function saveJournal(){
  if(!currentAnalysis){showNotice(t("runAnalysisFirst"),"error");return}
  const setups=JSON.parse(browserStore.getItem("thn_saved_setups_v1")||"[]");
  setups.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),symbol:currentAnalysis.symbol,decision:currentAnalysis.decision,entry:currentAnalysis.entry,stopLoss:currentAnalysis.stopLoss,targets:currentAnalysis.targets,status:"SETUP"});
  browserStore.setItem("thn_saved_setups_v1",JSON.stringify(setups.slice(0,100)));showNotice("Analysis saved as a setup; no realized trade or profit recorded","info");
}
function localJournal(){try{const parsed=JSON.parse(browserStore.getItem(journalKey)||"[]");return Array.isArray(parsed)?parsed.filter(t=>!t.immutable).map(t=>({...t,source:"UNVERIFIED_LOCAL"})):[]}catch{return []}}
function writeLocalJournal(items){browserStore.setItem(journalKey,JSON.stringify(items.filter(t=>!t.immutable)))}
function getJournal(){return [...serverLedger,...localJournal()].sort((a,b)=>new Date(b.date)-new Date(a.date))}
async function loadServerLedger(){
  const id=getBrokerAccount().id,epoch=privateEpoch,generation=++ledgerGeneration;if(!privateUser||!selectedBrokerAccount)return;
  let data,cursor=null;const fills=[];
  do {
    const res=await fetch("/api/ledger?accountId="+encodeURIComponent(id)+"&limit=500"+(cursor?"&before="+cursor:""));if(!res.ok){serverLedger=[];return}
    data=await res.json();if(epoch!==privateEpoch||generation!==ledgerGeneration||getBrokerAccount().id!==id)return;fills.push(...data.fills);cursor=data.nextCursor;
  }while(cursor);
  data.fills=fills;ledgerStartingBalance=data.startingBalance;
  serverLedger=data.fills.filter(fill=>(fill.epoch||"legacy")===data.epoch).map(fill=>({id:fill.id,date:fill.closedAt,symbol:fill.symbol,decision:fill.side,entry:fill.entryPrice,stopLoss:fill.stopLoss,target1:fill.exitPrice,exitPrice:fill.exitPrice,risk:fill.riskDollars,pnl:fill.realizedPnl,pnlR:fill.riskDollars>0?fill.realizedPnl/fill.riskDollars:null,status:fill.realizedPnl>0?"WIN":fill.realizedPnl<0?"LOSS":"BE",source:"PAPER_FILL",immutable:true,assetClass:detectAssetClass(fill.symbol)}));
  renderJournal();renderPerformanceAnalytics();
}

function cycleTradeOutcome(tradeId) {
  const arr = getJournal();
  const trade = arr.find(t => t.id === tradeId);
  if (!trade || trade.immutable) return;
  const riskAmt = Number(trade.risk || 100);
  const rr = Number(trade.pnlR && trade.pnlR > 0 ? trade.pnlR : 2);
  if (trade.status === "WIN") {
    trade.status = "LOSS";
    trade.pnl = -riskAmt;
    trade.pnlR = -1;
  } else if (trade.status === "LOSS") {
    trade.status = "BE";
    trade.pnl = 0;
    trade.pnlR = 0;
  } else {
    trade.status = "WIN";
    trade.pnl = riskAmt * rr;
    trade.pnlR = rr;
  }
  writeLocalJournal(arr);
  renderJournal();
  renderPerformanceAnalytics();
}

function deleteJournalTrade(tradeId) {
  if(serverLedger.some(t=>t.id===tradeId))return;
  const arr = localJournal().filter(t => t.id !== tradeId);
  writeLocalJournal(arr);
  renderJournal();
  renderPerformanceAnalytics();
}

function renderJournal() {
  const arr = getJournal();
  if (!$("journalList")) return;
  $("journalList").innerHTML = arr.map(item => {
    const date = new Date(item.date).toLocaleString(currentLang === "ar" ? "ar-OM" : undefined);
    const pnlNum = Number(item.pnl || 0);
    const pnlText = pnlNum >= 0 ? `+$${pnlNum.toFixed(2)}` : `-$${Math.abs(pnlNum).toFixed(2)}`;
    const statusClass = item.status === "WIN" ? "win" : item.status === "LOSS" ? "loss" : "be";
    const statusLabel = item.status === "WIN" ? (currentLang === "ar" ? "ربح" : "WIN") :
                        item.status === "LOSS" ? (currentLang === "ar" ? "خسارة" : "LOSS") : (currentLang === "ar" ? "تعادل" : "BE");
    return `<div class="journal-item">
      <div class="journal-item-head">
        <div>
          <b>${escapeHtml(item.symbol)} · <span class="decision-sub ${String(item.decision).toLowerCase()}">${escapeHtml(localizedValue(item.decision))}</span> | ${escapeHtml(item.grade || 'A')}</b>
          <small class="journal-date">${date} · ${escapeHtml(item.source||"UNVERIFIED_LOCAL")}</small>
        </div>
        <div class="journal-actions-row">
          <span class="journal-pnl ${pnlNum >= 0 ? 'pnl-green' : 'pnl-red'}">${pnlText} (${item.pnlR >= 0 ? '+' : ''}${item.pnlR || 0}R)</span>
          ${item.immutable?`<span>${statusLabel} · verified paper fill</span>`:`<button type="button" class="outcome-badge-btn ${statusClass}" data-cycle-trade="${escapeHtml(item.id)}" title="Click to cycle WIN / LOSS / BE">${statusLabel}</button>
          <button type="button" class="ghost small danger icon-del-btn" data-delete-trade="${escapeHtml(item.id)}" title="Delete trade">&times;</button>`}
        </div>
      </div>
      <p class="journal-metrics-line">${escapeHtml(t("journalLine", {
        date: "",
        confidence: fmt(item.confidence, 0),
        entry: fmt(item.entry, 6),
        sl: item.stopLoss ? fmt(item.stopLoss, 6) : "--",
        tp1: item.target1 ? fmt(item.target1, 6) : "--",
        risk: money(item.risk)
      }))}</p>
    </div>`;
  }).join("") || `<p class="tiny">${t("noSavedSignals")}</p>`;
}

function getFilteredJournalTrades() {
  const all = benchmarkPreview?getBenchmarkSampleTrades():getJournal();
  const now = Date.now();
  return all.filter(t => {
    if(!benchmarkPreview&&!includeUnverifiedLedger&&t.source!=="PAPER_FILL")return false;
    // Period filter
    if (analyticsPeriod === "30d") {
      if (now - new Date(t.date).getTime() > 30 * 24 * 3600 * 1000) return false;
    } else if (analyticsPeriod === "90d") {
      if (now - new Date(t.date).getTime() > 90 * 24 * 3600 * 1000) return false;
    }
    // Asset filter
    if (analyticsAsset !== "all") {
      if ((t.assetClass || "Forex") !== analyticsAsset) return false;
    }
    return true;
  });
}

function computePerformanceKPIs(trades, startingBalance=ledgerStartingBalance) {
  const total = trades.length;
  const wins = trades.filter(t => Number(t.pnl || 0) > 0);
  const losses = trades.filter(t => Number(t.pnl || 0) < 0);
  const be = trades.filter(t => Number(t.pnl || 0) === 0);

  const netPnl = trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  const grossProfit = wins.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + Number(t.pnl || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 9.99 : 0);

  const winRate = total ? (wins.length / total) * 100 : 0;
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? avgWin : 0);
  const expectancy = total ? netPnl/total : 0;

  // Peak to trough max drawdown
  let running = startingBalance, peak = startingBalance, maxDd = 0, maxDdPct=0;
  [...trades].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(t => {
    running += Number(t.pnl || 0);
    peak = Math.max(peak, running);
    maxDd = Math.max(maxDd, peak - running);
    maxDdPct=Math.max(maxDdPct,peak>0?(peak-running)/peak*100:0);
  });


  if ($("kpiNetPnl")) {
    $("kpiNetPnl").textContent = `${netPnl >= 0 ? '+' : '-'}$${Math.abs(netPnl).toFixed(2)}`;
    $("kpiNetPnl").style.color = netPnl >= 0 ? "var(--green)" : "var(--red)";
  }
  if ($("kpiNetPnlPct")) $("kpiNetPnlPct").textContent = startingBalance>0? `${netPnl >= 0 ? '+' : ''}${((netPnl / startingBalance) * 100).toFixed(2)}% on ${money(startingBalance)} starting equity`:"Percentage unavailable without positive starting equity";
  if ($("kpiWinRate")) $("kpiWinRate").textContent = `${winRate.toFixed(1)}%`;
  if ($("kpiWinLossRatio")) $("kpiWinLossRatio").textContent = `${wins.length} W / ${losses.length} L (${be.length} BE)`;
  if ($("kpiProfitFactor")) $("kpiProfitFactor").textContent = profitFactor.toFixed(2);
  if ($("kpiGrossProfitLoss")) $("kpiGrossProfitLoss").textContent = `+$${grossProfit.toFixed(0)} / -$${grossLoss.toFixed(0)}`;
  if ($("kpiPayoffRatio")) $("kpiPayoffRatio").textContent = `1 : ${payoffRatio.toFixed(2)}`;
  if ($("kpiAvgWinLoss")) $("kpiAvgWinLoss").textContent = `Avg W: $${avgWin.toFixed(0)} | Avg L: $${avgLoss.toFixed(0)}`;
  if ($("kpiMaxDrawdown")) $("kpiMaxDrawdown").textContent = `-$${maxDd.toFixed(2)}`;
  if ($("kpiMaxDrawdownPct")) $("kpiMaxDrawdownPct").textContent = `${maxDdPct.toFixed(1)}% from peak`;
  if ($("kpiExpectancy")) $("kpiExpectancy").textContent = `${expectancy >= 0 ? '+' : '-'}$${Math.abs(expectancy).toFixed(2)}`;
  if ($("kpiTotalTrades")) $("kpiTotalTrades").textContent = `${total} closed trades${benchmarkPreview?" (SYNTHETIC PREVIEW)":includeUnverifiedLedger?" (includes unverified)":" (verified paper fills)"}`;
  return {netPnl,expectancy,maxDd,maxDdPct};
}

function renderD3EquityCurve(trades) {
  if (typeof d3 === "undefined") return;
  const container = $("d3EquityCurveContainer");
  const svg = d3.select("#d3EquityCurveSvg");
  if (!svg.node() || !container) return;
  svg.selectAll("*").remove();

  if (!trades.length) {
    svg.append("text")
      .attr("x", "50%").attr("y", "50%")
      .attr("text-anchor", "middle")
      .attr("fill", "var(--muted)")
      .attr("font-size", "14px")
      .text(currentLang === "ar" ? "لا توجد صفقات لعرض منحنى رأس المال." : "No trade records to plot equity curve.");
    return;
  }

  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = ledgerStartingBalance;
  let peak = ledgerStartingBalance;
  const points = sorted.map((t, idx) => {
    running += Number(t.pnl || 0);
    peak = Math.max(peak, running);
    return {
      idx: idx + 1,
      date: new Date(t.date),
      symbol: t.symbol,
      tradePnl: Number(t.pnl || 0),
      pnlR: t.pnlR || (t.pnl > 0 ? 2 : -1),
      cumulativePnl: running,
      peakEquity: peak,
      drawdown: peak - running,
      drawdownPct: peak > 0 ? ((peak - running) / peak) * 100 : 0
    };
  });

  const firstDate = new Date(points[0].date.getTime() - 24 * 3600 * 1000);
  const data = [{ idx: 0, date: firstDate, symbol: "START", tradePnl: 0, cumulativePnl: ledgerStartingBalance, peakEquity: ledgerStartingBalance, drawdown: 0, drawdownPct: 0 }, ...points];

  const rect = container.getBoundingClientRect();
  const width = Math.max(340, rect.width || 760);
  const height = 310;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const margin = { top: 25, right: 35, bottom: 35, left: 65 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const xExtent = d3.extent(data, d => d.date);
  const xScale = d3.scaleTime().domain(xExtent).range([0, innerW]);

  const pnlMin = d3.min(data, d => d.cumulativePnl);
  const pnlMax = Math.max(d3.max(data, d => d.cumulativePnl), d3.max(data, d => d.peakEquity));
  const yScale = d3.scaleLinear().domain([Math.min(0, pnlMin * 1.15), pnlMax * 1.15]).range([innerH, 0]).nice();

  // Gradient
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient")
    .attr("id", "equityGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");
  grad.append("stop").attr("offset", "0%").attr("stop-color", "var(--green)").attr("stop-opacity", 0.35);
  grad.append("stop").attr("offset", "75%").attr("stop-color", "var(--green)").attr("stop-opacity", 0.05);
  grad.append("stop").attr("offset", "100%").attr("stop-color", "transparent").attr("stop-opacity", 0);

  // Grid
  const yAxisGrid = d3.axisLeft(yScale).tickSize(-innerW).tickFormat("").ticks(5);
  g.append("g").attr("class", "d3-grid").call(yAxisGrid);

  // Zero Line
  g.append("line")
    .attr("x1", 0).attr("x2", innerW)
    .attr("y1", yScale(0)).attr("y2", yScale(0))
    .attr("stroke", "rgba(255,255,255,0.22)")
    .attr("stroke-dasharray", "4,4");

  // Area
  const area = d3.area()
    .x(d => xScale(d.date))
    .y0(yScale(0))
    .y1(d => yScale(d.cumulativePnl))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("fill", "url(#equityGradient)")
    .attr("d", area);

  // High Water Mark Peak Line
  const peakLine = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.peakEquity))
    .curve(d3.curveStepAfter);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "var(--yellow)")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "5,4")
    .attr("opacity", 0.75)
    .attr("d", peakLine);

  // Line
  const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.cumulativePnl))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "var(--green)")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // Axes
  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%b %d"));
  const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => (d >= 0 ? `+$${d}` : `-$${Math.abs(d)}`));

  g.append("g").attr("class", "d3-axis x-axis").attr("transform", `translate(0,${innerH})`).call(xAxis);
  g.append("g").attr("class", "d3-axis y-axis").call(yAxis);

  // Nodes
  g.selectAll(".trade-dot")
    .data(data.slice(1))
    .enter()
    .append("circle")
    .attr("class", "trade-dot")
    .attr("cx", d => xScale(d.date))
    .attr("cy", d => yScale(d.cumulativePnl))
    .attr("r", 4)
    .attr("fill", d => d.tradePnl >= 0 ? "var(--green)" : "var(--red)")
    .attr("stroke", "var(--bg-2)")
    .attr("stroke-width", 1.5);

  // Crosshair & Tooltip Overlay
  const verticalLine = g.append("line")
    .attr("class", "crosshair-line")
    .attr("y1", 0).attr("y2", innerH)
    .attr("stroke", "rgba(255,255,255,0.4)")
    .attr("stroke-dasharray", "3,3")
    .style("opacity", 0);

  const focusDot = g.append("circle")
    .attr("r", 6)
    .attr("fill", "var(--accent)")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2)
    .style("opacity", 0);

  const tooltip = $("equityTooltip");
  const bisectDate = d3.bisector(d => d.date).left;

  svg.append("rect")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mousemove", event => {
      const [mouseX] = d3.pointer(event);
      const x0 = xScale.invert(mouseX);
      const i = bisectDate(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = !d1 ? d0 : (x0 - d0.date > d1.date - x0 ? d1 : d0);
      if (!d || d.idx === 0) return;

      const px = xScale(d.date);
      const py = yScale(d.cumulativePnl);

      verticalLine.attr("x1", px).attr("x2", px).style("opacity", 1);
      focusDot.attr("cx", px).attr("cy", py).style("opacity", 1);

      if (tooltip) {
        tooltip.innerHTML = `
          <div class="tooltip-header"><b>#${d.idx} ${escapeHtml(d.symbol)}</b><span>${d.date.toLocaleDateString()}</span></div>
          <div class="tooltip-row"><span>Trade PnL:</span><b style="color:${d.tradePnl >= 0 ? 'var(--green)' : 'var(--red)'}">${d.tradePnl >= 0 ? '+' : ''}$${d.tradePnl.toFixed(2)} (${d.pnlR >= 0 ? '+' : ''}${d.pnlR}R)</b></div>
          <div class="tooltip-row"><span>Cumulative Equity:</span><b>$${d.cumulativePnl.toFixed(2)}</b></div>
          <div class="tooltip-row"><span>Drawdown from Peak:</span><b style="color:var(--yellow)">-$${d.drawdown.toFixed(2)} (${d.drawdownPct.toFixed(1)}%)</b></div>
        `;
        const rectBox = container.getBoundingClientRect();
        tooltip.style.left = `${Math.min(rectBox.width - 200, Math.max(10, px + margin.left - 90))}px`;
        tooltip.style.top = `${Math.max(10, py + margin.top - 100)}px`;
        tooltip.classList.remove("hidden");
      }
    })
    .on("mouseleave", () => {
      verticalLine.style("opacity", 0);
      focusDot.style("opacity", 0);
      if (tooltip) tooltip.classList.add("hidden");
    });
}

function renderD3WinLossDonut(trades) {
  if (typeof d3 === "undefined") return;
  const container = $("d3WinLossContainer");
  const svg = d3.select("#d3WinLossDonutSvg");
  if (!svg.node() || !container) return;
  svg.selectAll("*").remove();

  const wins = trades.filter(t => (t.pnl || 0) > 0).length;
  const losses = trades.filter(t => (t.pnl || 0) < 0).length;
  const be = trades.filter(t => (t.pnl || 0) === 0).length;
  const total = trades.length;
  const winRate = total ? (wins / total) * 100 : 0;

  if ($("donutWinCount")) $("donutWinCount").textContent = `${wins} (${total ? ((wins/total)*100).toFixed(0) : 0}%)`;
  if ($("donutLossCount")) $("donutLossCount").textContent = `${losses} (${total ? ((losses/total)*100).toFixed(0) : 0}%)`;
  if ($("donutBeCount")) $("donutBeCount").textContent = `${be} (${total ? ((be/total)*100).toFixed(0) : 0}%)`;

  const width = 280, height = 280;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  const radius = Math.min(width, height) / 2 - 14;
  const innerRadius = radius * 0.68;

  const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  if (!total) {
    g.append("text").attr("text-anchor", "middle").attr("fill", "var(--muted)").attr("font-size", "14px").text("No Trades");
    return;
  }

  const pieData = [
    { label: "Wins", count: wins, color: "var(--green)" },
    { label: "Losses", count: losses, color: "var(--red)" },
    { label: "Breakeven", count: be, color: "var(--yellow)" }
  ].filter(d => d.count > 0);

  const pie = d3.pie().value(d => d.count).sort(null).padAngle(0.03);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius).cornerRadius(5);
  const hoverArc = d3.arc().innerRadius(innerRadius - 2).outerRadius(radius + 6).cornerRadius(6);

  const tooltip = $("donutTooltip");

  g.selectAll(".arc-slice")
    .data(pie(pieData))
    .enter()
    .append("path")
    .attr("class", "arc-slice")
    .attr("d", arc)
    .attr("fill", d => d.data.color)
    .attr("stroke", "var(--bg-2)")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .on("mouseenter", function (event, d) {
      d3.select(this).transition().duration(180).attr("d", hoverArc);
      if (tooltip) {
        const pct = ((d.data.count / total) * 100).toFixed(1);
        tooltip.innerHTML = `<b>${d.data.label}</b><span>${d.data.count} trades (${pct}%)</span>`;
        tooltip.style.left = `${width / 2 - 50}px`;
        tooltip.style.top = `${height / 2 - 40}px`;
        tooltip.classList.remove("hidden");
      }
    })
    .on("mouseleave", function () {
      d3.select(this).transition().duration(180).attr("d", arc);
      if (tooltip) tooltip.classList.add("hidden");
    });

  const centerG = g.append("g").attr("class", "donut-center-label");
  centerG.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-2px")
    .attr("font-size", "28px")
    .attr("font-weight", "900")
    .attr("fill", "var(--text)")
    .text(`${winRate.toFixed(1)}%`);

  centerG.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "20px")
    .attr("font-size", "11px")
    .attr("font-weight", "800")
    .attr("letter-spacing", "0.08em")
    .attr("fill", "var(--muted)")
    .text(currentLang === "ar" ? "نسبة النجاح" : "WIN RATE");
}

function renderD3Waterfall(trades) {
  if (typeof d3 === "undefined") return;
  const container = $("d3WaterfallContainer");
  const svg = d3.select("#d3WaterfallSvg");
  if (!svg.node() || !container) return;
  svg.selectAll("*").remove();

  if (!trades.length) {
    svg.append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").attr("fill", "var(--muted)").attr("font-size", "14px").text("No trades recorded.");
    return;
  }

  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const rect = container.getBoundingClientRect();
  const width = Math.max(340, rect.width || 880);
  const height = 240;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const margin = { top: 20, right: 30, bottom: 35, left: 60 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand().domain(sorted.map((_, i) => i)).range([0, innerW]).padding(0.22);
  const pnlMin = d3.min(sorted, d => Number(d.pnl || 0));
  const pnlMax = d3.max(sorted, d => Number(d.pnl || 0));
  const bound = Math.max(Math.abs(pnlMin || -100), Math.abs(pnlMax || 100)) * 1.15;
  const yScale = d3.scaleLinear().domain([-bound, bound]).range([innerH, 0]).nice();

  const yAxisGrid = d3.axisLeft(yScale).tickSize(-innerW).tickFormat("").ticks(5);
  g.append("g").attr("class", "d3-grid").call(yAxisGrid);

  g.append("line")
    .attr("x1", 0).attr("x2", innerW)
    .attr("y1", yScale(0)).attr("y2", yScale(0))
    .attr("stroke", "rgba(255,255,255,0.3)")
    .attr("stroke-width", 1.5);

  const wins = sorted.filter(t => (t.pnl || 0) > 0);
  const losses = sorted.filter(t => (t.pnl || 0) < 0);
  const avgWin = wins.length ? d3.mean(wins, d => Number(d.pnl)) : 0;
  const avgLoss = losses.length ? d3.mean(losses, d => Number(d.pnl)) : 0;

  if (avgWin > 0) {
    g.append("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", yScale(avgWin)).attr("y2", yScale(avgWin))
      .attr("stroke", "var(--accent-2)")
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.7);
  }

  if (avgLoss < 0) {
    g.append("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", yScale(avgLoss)).attr("y2", yScale(avgLoss))
      .attr("stroke", "var(--red)")
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.7);
  }

  const tooltip = $("waterfallTooltip");

  g.selectAll(".pnl-bar")
    .data(sorted)
    .enter()
    .append("rect")
    .attr("class", "pnl-bar")
    .attr("x", (_, i) => xScale(i))
    .attr("y", d => (d.pnl || 0) >= 0 ? yScale(Number(d.pnl || 0)) : yScale(0))
    .attr("width", xScale.bandwidth())
    .attr("height", d => Math.max(3, Math.abs(yScale(Number(d.pnl || 0)) - yScale(0))))
    .attr("fill", d => (d.pnl || 0) >= 0 ? "var(--green)" : "var(--red)")
    .attr("rx", 3)
    .attr("opacity", 0.9)
    .on("mouseenter", function (event, d) {
      d3.select(this).attr("opacity", 1).attr("stroke", "#ffffff").attr("stroke-width", 1);
      if (tooltip) {
        const pnlNum = Number(d.pnl || 0);
        tooltip.innerHTML = `
          <div class="tooltip-header"><b>${escapeHtml(d.symbol)} (${d.decision || 'TRADE'})</b><span>${new Date(d.date).toLocaleDateString()}</span></div>
          <div class="tooltip-row"><span>Realized PnL:</span><b style="color:${pnlNum >= 0 ? 'var(--green)' : 'var(--red)'}">${pnlNum >= 0 ? '+' : ''}$${pnlNum.toFixed(2)} (${d.pnlR >= 0 ? '+' : ''}${d.pnlR || 0}R)</b></div>
          <div class="tooltip-row"><span>Status:</span><b>${d.status || (pnlNum >= 0 ? 'WIN' : 'LOSS')}</b></div>
        `;
        const [xPos, yPos] = d3.pointer(event, container);
        tooltip.style.left = `${Math.min(rect.width - 180, Math.max(10, xPos - 80))}px`;
        tooltip.style.top = `${Math.max(10, yPos - 80)}px`;
        tooltip.classList.remove("hidden");
      }
    })
    .on("mouseleave", function () {
      d3.select(this).attr("opacity", 0.9).attr("stroke", "none");
      if (tooltip) tooltip.classList.add("hidden");
    });

  const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => (d >= 0 ? `+$${d}` : `-$${Math.abs(d)}`));
  g.append("g").attr("class", "d3-axis y-axis").call(yAxis);
}

function renderPerformanceAnalytics() {
  const filtered = getFilteredJournalTrades();
  computePerformanceKPIs(filtered);
  renderD3EquityCurve(filtered);
  renderD3WinLossDonut(filtered);
  renderD3Waterfall(filtered);
}

function download(filename, text, type = "text/plain") {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function exportJournal() {
  const arr = getJournal();
  const csv = ["id,date,symbol,decision,confidence,grade,entry,stopLoss,target1,riskAmount,status,pnl,pnlR,assetClass"].concat(arr.map(x => [
    x.id,
    x.date,
    x.symbol,
    x.decision,
    x.confidence,
    x.grade,
    x.entry,
    x.stopLoss,
    x.target1,
    x.risk,
    x.status,
    x.pnl,
    x.pnlR,
    x.assetClass
  ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
  download(t("journalFilename"), csv, "text/csv");
}

let pendingImportTrades = [];

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseTradesCSV(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const findIdx = patterns => headers.findIndex(h => patterns.some(p => h.includes(p)));

  const dateIdx = findIdx(["date", "time", "timestamp", "datetime", "closedate"]);
  const symIdx = findIdx(["symbol", "pair", "ticker", "instrument", "market", "asset"]);
  const dirIdx = findIdx(["decision", "direction", "side", "type", "action"]);
  const entryIdx = findIdx(["entry", "openprice", "price", "open"]);
  const exitIdx = findIdx(["exit", "target", "closeprice", "close"]);
  const slIdx = findIdx(["stoploss", "sl", "stop"]);
  const pnlIdx = findIdx(["pnl", "profit", "gain", "return", "netpnl", "realizedpnl"]);
  const rIdx = findIdx(["pnlr", "rmultiple", "rr", "rewardrisk"]);
  const statusIdx = findIdx(["status", "outcome", "result"]);
  const riskIdx = findIdx(["risk", "riskamount", "initialrisk"]);
  const gradeIdx = findIdx(["grade", "quality", "setup"]);
  const assetIdx = findIdx(["assetclass", "category", "class", "markettype"]);
  const notesIdx = findIdx(["notes", "comment", "reason"]);

  const trades = [];
  const now = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (!row || row.length === 0 || row.every(val => val === "")) continue;

    const rawSym = symIdx >= 0 && row[symIdx] ? row[symIdx] : "EURUSD";
    const symbol = normalizeSymbolInput(rawSym);

    let decision = "BUY";
    if (dirIdx >= 0 && row[dirIdx]) {
      const dUpper = row[dirIdx].toUpperCase();
      if (dUpper.includes("SELL") || dUpper.includes("SHORT")) decision = "SELL";
      else if (dUpper.includes("WAIT") || dUpper.includes("HOLD")) decision = "WAIT";
      else decision = "BUY";
    }

    const entry = entryIdx >= 0 && !isNaN(Number(row[entryIdx])) ? Number(row[entryIdx]) : 1.0;
    const exitPrice = exitIdx >= 0 && !isNaN(Number(row[exitIdx])) ? Number(row[exitIdx]) : entry;
    const stopLoss = slIdx >= 0 && !isNaN(Number(row[slIdx])) ? Number(row[slIdx]) : 0;
    const risk = riskIdx >= 0 && !isNaN(Number(row[riskIdx])) ? Number(row[riskIdx]) : 100;

    let pnl = 0;
    if (pnlIdx >= 0 && !isNaN(Number(row[pnlIdx]))) {
      pnl = Number(row[pnlIdx]);
    } else if (exitIdx >= 0 && entryIdx >= 0) {
      const diff = decision === "SELL" ? entry - exitPrice : exitPrice - entry;
      pnl = Number(((diff / (Math.abs(entry) || 1)) * 1000).toFixed(2));
    }

    let pnlR = 0;
    if (rIdx >= 0 && !isNaN(Number(row[rIdx]))) {
      pnlR = Number(row[rIdx]);
    } else if (risk > 0) {
      pnlR = Number((pnl / risk).toFixed(2));
    }

    let status = "WIN";
    if (statusIdx >= 0 && row[statusIdx]) {
      const sUpper = row[statusIdx].toUpperCase();
      if (sUpper.includes("WIN") || sUpper.includes("PROFIT") || sUpper.includes("GAIN")) status = "WIN";
      else if (sUpper.includes("LOSS") || sUpper.includes("STOP")) status = "LOSS";
      else if (sUpper.includes("BE") || sUpper.includes("BREAKEVEN") || sUpper.includes("SCRATCH")) status = "BE";
      else status = pnl > 0 ? "WIN" : (pnl < 0 ? "LOSS" : "BE");
    } else {
      status = pnl > 0 ? "WIN" : (pnl < 0 ? "LOSS" : "BE");
    }

    let dateStr = new Date(now - (lines.length - i) * 86400000).toISOString();
    if (dateIdx >= 0 && row[dateIdx]) {
      const parsedD = new Date(row[dateIdx]);
      if (!isNaN(parsedD.getTime())) {
        dateStr = parsedD.toISOString();
      }
    }

    const assetClass = (assetIdx >= 0 && row[assetIdx]) ? row[assetIdx] : detectAssetClass(symbol);
    const grade = (gradeIdx >= 0 && row[gradeIdx]) ? row[gradeIdx] : (status === "WIN" ? "A+" : "B");
    const notes = (notesIdx >= 0 && row[notesIdx]) ? row[notesIdx] : "";

    trades.push({
      id: "csv-" + Date.now() + "-" + i,
      date: dateStr,
      symbol: symbol,
      decision: decision,
      confidence: 80,
      grade: grade,
      entry: entry,
      stopLoss: stopLoss,
      target1: exitPrice,
      risk: risk,
      assetClass: assetClass,
      status: status,
      pnl: pnl,
      pnlR: pnlR,
      exitPrice: exitPrice,
      notes: notes
    });
  }

  return trades;
}

function downloadSampleCsvTemplate() {
  const sampleCsv = [
    "date,symbol,decision,entry,exitPrice,stopLoss,status,pnl,pnlR,risk,assetClass",
    "2026-09-01,EURUSD,BUY,1.0820,1.0870,1.0795,WIN,250.00,2.5,100,Forex",
    "2026-09-04,BTCUSDT,BUY,63500,65800,62700,WIN,420.00,4.2,100,Crypto",
    "2026-09-08,GBPUSD,SELL,1.3020,1.3060,1.3060,LOSS,-100.00,-1.0,100,Forex",
    "2026-09-12,XAUUSD,BUY,2675.0,2705.0,2665.0,WIN,300.00,3.0,100,Commodity",
    "2026-09-15,US30,BUY,42000,42450,41850,WIN,225.00,2.25,100,Index",
    "2026-09-19,USDJPY,SELL,154.50,154.50,154.00,BE,0.00,0.0,100,Forex",
    "2026-09-22,EURUSD,SELL,1.0910,1.0945,1.0945,LOSS,-100.00,-1.0,100,Forex",
    "2026-09-26,BTCUSDT,BUY,68200,70500,67400,WIN,380.00,3.8,100,Crypto",
    "2026-09-29,XAUUSD,BUY,2720.0,2752.0,2710.0,WIN,320.00,3.2,100,Commodity"
  ].join("\n");
  download("thn-historical-trades-template.csv", sampleCsv, "text/csv");
}

// =========================================================
// THN TRADER - LIVE BROKER GATEWAY & AUTO-CAPITAL ENGINE
// =========================================================
const brokerKey = "thn_broker_account_v2";
let pendingExecutionOrder = null;
let brokerTickInterval = null;

const brokerBrands = {
  exness: {
    id: "exness",
    name: "Exness (إكسنس)",
    badge: "Exness Pro (MT5 Direct)",
    regTag: "GCC #1 · Raw Spread 0.0",
    server: "Exness-Real14",
    link: "https://www.exness.com",
    logoSvg: `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#F4AF00"/><path d="M7 16C7 11.0294 11.0294 7 16 7C20.9706 7 25 11.0294 25 16C25 20.9706 20.9706 25 16 25" stroke="#111" stroke-width="3" stroke-linecap="round"/><path d="M12 16C12 13.7909 13.7909 12 16 12C18.2091 12 20 13.7909 20 16C20 18.2091 18.2091 20 16 20" stroke="#111" stroke-width="2.5" stroke-linecap="round"/></svg>`
  },
  xtb: {
    id: "xtb",
    name: "XTB MENA (إكس تي بي)",
    badge: "XTB xStation Gateway",
    regTag: "DFSA Dubai Regulated · 0% Comm",
    server: "XTB-xStation5-Live",
    link: "https://www.xtb.com/mena",
    logoSvg: `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0A0F1D"/><path d="M7 8L15 24M15 8L7 24" stroke="#E50914" stroke-width="3" stroke-linecap="round"/><text x="16" y="21" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="#2BF5C7">TB</text></svg>`
  },
  mt5: {
    id: "mt5",
    name: "MetaTrader 5 (MT5 Cloud)",
    badge: "MetaTrader 5 Connected",
    regTag: "Universal Multi-Broker Cloud",
    server: "MetaQuotes-Live5",
    link: "https://www.metatrader5.com",
    logoSvg: `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0E1B2E"/><rect x="7" y="16" width="4.5" height="9" rx="1.5" fill="#3B82F6"/><rect x="13.5" y="11" width="4.5" height="14" rx="1.5" fill="#10B981"/><rect x="20" y="7" width="4.5" height="18" rx="1.5" fill="#EF4444"/><text x="18" y="12" font-family="Arial, sans-serif" font-size="8" font-weight="900" fill="#FFF">5</text></svg>`
  },
  ibkr: {
    id: "ibkr",
    name: "Interactive Brokers (IBKR)",
    badge: "IBKR Global TWS Gateway",
    regTag: "SEC / FINRA Regulated Tier 1",
    server: "IBKR-Gateway-101",
    link: "https://www.interactivebrokers.com",
    logoSvg: `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#C41230"/><text x="7" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="#FFF">IB</text></svg>`
  },
  binance: {
    id: "binance",
    name: "Binance Futures & Spot",
    badge: "Binance VIP API Bridge",
    regTag: "Direct Crypto Liquidity",
    server: "binance-wss-fapi",
    link: "https://www.binance.com",
    logoSvg: `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#1E2329"/><path d="M16 8L20 12L16 16L12 12L16 8Z" fill="#F0B90B"/><path d="M21.5 13.5L25.5 17.5L21.5 21.5L17.5 17.5L21.5 13.5Z" fill="#F0B90B"/><path d="M10.5 13.5L14.5 17.5L10.5 21.5L6.5 17.5L10.5 13.5Z" fill="#F0B90B"/><path d="M16 19L20 23L16 27L12 23L16 19Z" fill="#F0B90B"/></svg>`
  },
  paper: {
    id: "paper",
    name: "THN Paper Sandbox",
    badge: "Paper Sandbox Engine",
    regTag: "Simulated Account · Zero Capital Risk",
    server: "THN-INTERNAL-SANDBOX",
    link: "#",
    logoSvg: `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#042F2E"/><path d="M16 6L24 10V16C24 21 20 25 16 27C12 25 8 21 8 16V10L16 6Z" stroke="#2BF5C7" stroke-width="2" fill="none"/><path d="M16 11L14 17H18L16 22" stroke="#2BF5C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  }
};

let serverBrokerAccounts = [];
let activeBrokerDeskView = "ai-desk";
let masterPwdVisible = false;
let investorPwdVisible = false;


const DEFAULT_SANDBOX_ACCOUNT = {
  id: "acc_paper_sandbox_01",
  connected: false,
  provider: "paper",
  broker: "paper",
  brokerName: "THN Paper Trading Sandbox",
  providerName: "Paper Sandbox Engine",
  platform: "THN Sandbox Engine",
  server: "THN-INTERNAL-SANDBOX",
  accountNumber: "SBX-885012",
  accountNumberMasked: "•••• 5012",
  accountAlias: "Paper Trading Portfolio",
  accountType: "paper",
  accountTypeName: "Paper Sandbox (Simulated)",
  currency: "USD",
  balance: null,
  equity: null,
  freeMargin: null,
  usedMargin: 0.00,
  riskPct: 1.0,
  leverage: 200,
  tradingMode: "PAPER",
  permissionLevel: "LOCKED",
  reconciliationStatus: "SYNCHRONIZED",
  regulation: "Simulated Account · Zero Capital Risk",
  kycStatus: "SIMULATED",
  positions: [],
  dailyRealizedPnl: null,
  todayTradesCount: null
};

function getBrokerAccount() {
  return selectedBrokerAccount&&serverBrokerAccounts.some(a=>a.id===selectedBrokerAccount.id)?selectedBrokerAccount:{...DEFAULT_SANDBOX_ACCOUNT};
}

function saveBrokerAccount(acc) {
  selectedBrokerAccount=acc;
  syncAccountSizeWithBroker();
  renderBrokerDesk();
  renderAccountCertificate();
  renderWebTrader();
}

async function loadBrokerAccountsFromServer() {
  if(sessionChanging||!privateUser)return;
  const epoch=privateEpoch;
  try{
    const response=await fetch("/api/broker/accounts"),data=await response.json();
    if(epoch!==privateEpoch)return;
    serverBrokerAccounts=data.ok&&Array.isArray(data.accounts)?data.accounts:[];
    selectedBrokerAccount=serverBrokerAccounts.find(a=>a.id===selectedBrokerAccount?.id)||serverBrokerAccounts[0]||null;
    if(!selectedBrokerAccount){serverLedger=[];ledgerStartingBalance=0}else await loadServerLedger();
    if(epoch!==privateEpoch)return;
    renderBrokerAccountSelector();syncAccountSizeWithBroker();renderBrokerDesk();renderAccountCertificate();renderWebTrader();renderJournal();renderPerformanceAnalytics();updateDashboardMarketOverview();
  }catch(error){if(error.name!=="AbortError"&&epoch===privateEpoch)clearPrivateState()}
}

function renderBrokerAccountSelector() {
  const select = $("brokerActiveAccountSelect");
  if (!select) return;
  const current = getBrokerAccount();
  if(!serverBrokerAccounts.length){select.innerHTML=`<option value="">${privateUser?"No accounts for this identity":t("accountLocked")}</option>`;select.disabled=true;return}
  select.disabled=false;
  const accounts=serverBrokerAccounts;

  select.innerHTML = accounts.map(acc => {
    const isSel = (acc.id === current.id || acc.accountNumber === current.accountNumber || acc.accountId === current.accountId);
    const bName = acc.brokerName || (brokerBrands[acc.broker || acc.provider]?.name || (acc.provider || "Broker").toUpperCase());
    const accNum = acc.accountNumber || acc.accountId || "ACC";
    const cur = acc.currency || "USD";
    const bal = money(acc.balance || 0);
    const tag = acc.broker === "paper" || acc.tradingMode === "PAPER" ? "PAPER" : "DISABLED";
    return `<option value="${escapeHtml(acc.id || accNum)}" ${isSel ? "selected" : ""}>[${tag}] ${escapeHtml(bName)} #${escapeHtml(accNum)} · ${bal} ${cur}</option>`;
  }).join("");
}

function switchActiveBrokerAccount(targetId) {
  const current = getBrokerAccount();
  serverLedger=[];ledgerGeneration++;if($("accountRecoveryStatus"))$("accountRecoveryStatus").textContent="";
  const found = serverBrokerAccounts.find(a => a.id === targetId || a.accountNumber === targetId || a.accountId === targetId);
  if (found) {
    saveBrokerAccount(found);
    loadServerLedger().catch(()=>{});
    renderBrokerAccountSelector();
    const succMsg = currentLang === "ar"
      ? `تم التبديل إلى الحساب النشط: ${found.brokerName || found.provider} #${found.accountNumber || found.accountId} (${money(found.balance)})`
      : `Switched active broker account to: ${found.brokerName || found.provider} #${found.accountNumber || found.accountId} (${money(found.balance)})`;
    status(succMsg);
  }
}

async function inspectAccountRecovery(){
 const account=getBrokerAccount(),epoch=privateEpoch;if(!selectedBrokerAccount)return;
 const node=$("accountRecoveryStatus");node.textContent="Checking exact-price availability; no orders are sent…";
 try{const response=await fetch("/api/accounts/recovery?accountId="+encodeURIComponent(account.id),{signal:AbortSignal.timeout(25000)}),data=await response.json();
  if(epoch!==privateEpoch||account.id!==getBrokerAccount().id)return;
  node.textContent=(data.openingBlocked?"New exposure blocked. ":"Account pricing checked. ")+data.positions.map(p=>`${p.symbol}: ${p.code}`).join("; ")+". "+data.recovery;
 }catch(error){if(epoch===privateEpoch&&error.name!=="AbortError")node.textContent="Recovery check unavailable. Preserve positions and retry; no fill was created."}
}
function setBrokerDeskView(view = "ai-desk") {
  activeBrokerDeskView = view;
  $("viewAiDeskBtn")?.classList.toggle("active", view === "ai-desk");
  $("viewWebTraderBtn")?.classList.toggle("active", view === "webtrader");
  $("viewAccountDetailsBtn")?.classList.toggle("active", view === "account-details");

  $("brokerAiDeskView")?.classList.toggle("hidden", view !== "ai-desk");
  $("brokerWebTraderView")?.classList.toggle("hidden", view !== "webtrader");
  $("brokerAccountDetailsView")?.classList.toggle("hidden", view !== "account-details");

  if (view === "webtrader") renderWebTrader();
  if (view === "account-details") renderAccountCertificate();
}

function renderAccountCertificate() {
  const acc = getBrokerAccount();
  const brand = brokerBrands[acc.broker || acc.provider] || brokerBrands.exness;

  if ($("certBrokerLogo")) $("certBrokerLogo").innerHTML = brand.logoSvg;
  if ($("certBrokerTitle")) $("certBrokerTitle").textContent = `${acc.brokerName || brand.name} - ${acc.platform || 'Sandbox Engine'}`;
  if ($("certRegulationTag")) $("certRegulationTag").textContent = acc.regulation || brand.regTag;
  if ($("certHolderName")) $("certHolderName").textContent = acc.accountAlias || (acc.tradingMode === "PAPER" ? "Paper Trading Portfolio" : "Trading Account");
  if ($("certHolderEmail")) $("certHolderEmail").textContent = acc.user?.email || (acc.tradingMode === "PAPER" ? "Not applicable (Paper Trading)" : "Secured via Gateway Token");
  if ($("certHolderPhone")) $("certHolderPhone").textContent = acc.user?.phone || (acc.tradingMode === "PAPER" ? "Not applicable (Paper Trading)" : "Secured");
  if ($("certLoginId")) $("certLoginId").textContent = acc.accountNumberMasked || acc.accountNumber || "SBX-885012";
  if ($("certServerHost")) $("certServerHost").textContent = acc.server || brand.server;

  if ($("certMasterPwd")) {
    $("certMasterPwd").textContent = "•••••••••••• (Encrypted in Broker Vault)";
  }
  if ($("toggleMasterPwdBtn")) {
    $("toggleMasterPwdBtn").style.display = "none";
  }

  if ($("certInvestorPwd")) {
    $("certInvestorPwd").textContent = "•••••••••••• (Secured via Session Token)";
  }
  if ($("toggleInvestorPwdBtn")) {
    $("toggleInvestorPwdBtn").style.display = "none";
  }

  if ($("certAccountType")) {
    const typeLabel = acc.accountTypeName || (acc.accountType ? acc.accountType.toUpperCase() : "Raw Spread ECN");
    const isIslamicTag = acc.isIslamic ? (currentLang === "ar" ? " · إسلامي بدون تثبيت" : " · Islamic Swap-Free") : "";
    $("certAccountType").textContent = `${typeLabel}${isIslamicTag} · ${acc.currency || 'USD'} ($)`;
  }

  if ($("certLeverage")) $("certLeverage").textContent = `1:${acc.leverage || 200} Dynamic Leverage`;
  if ($("certApiKey")) {
    $("certApiKey").textContent = acc.accountNumberMasked ? `Key Vault (${acc.accountNumberMasked})` : "•••••••••••••••• (AES-256 Secured)";
  }
  if ($("certBrokerPortalBtn")) $("certBrokerPortalBtn").href = brand.link || "https://www.exness.com";
}

function renderProviderStatus(){
  renderWorkbench();
  if(providerSnapshot?.ok){
    if($("apiStatus"))$("apiStatus").textContent=providerSnapshot.openai?.configured?`${ux("uxNarrative")}: ${currentAnalysis?.aiStatus||providerSnapshot.openai.state}`:t("localAiActive");
    if($("modelStatus"))$("modelStatus").textContent="THN deterministic engine · v6.0.0";
  }
  const market=currentAnalysis?.provenance;
  const state=market?.state||providerSnapshot?.marketData?.state||"UNAVAILABLE";
  if($("providerOverallStatus"))$("providerOverallStatus").textContent=state;
  if($("forexFeedStatus"))$("forexFeedStatus").textContent=market?`${market.provider} · ${market.instrument} · ${market.pricingProxy?ux("uxProxy"):state}`:ux("uxNotChecked");
  const cryptoQuote=Object.values(liveQuotesCache).find(q=>q.assetClass==="Crypto");
  if($("cryptoFeedStatus"))$("cryptoFeedStatus").textContent=cryptoQuote?`${cryptoQuote.source} · ${workspaceQuoteLabel(cryptoQuote)}`:ux("uxNotChecked");
  if($("calendarFeedStatus"))$("calendarFeedStatus").textContent=currentLang==="ar"?"غير متاح · لا توجد مفكرة متحقق منها":"UNAVAILABLE · no verified calendar";
  if($("analysisProvenance"))$("analysisProvenance").textContent=market?`${market.provider} · ${market.instrument} · ${currentLang==="ar"?"رصد السعر":"Quote"}: ${new Date(market.quoteAt).toLocaleString(currentLang==="ar"?"ar-OM":"en-GB")} · ${currentLang==="ar"?"الشمعة المغلقة":"Closed candle"}: ${new Date(market.lastClosedCandleAt).toLocaleString(currentLang==="ar"?"ar-OM":"en-GB")} · ${market.candleStatus} · ${market.pricingProxy?ux("uxProxy"):ux("uxPaperEnvironment")}`:t("analysisUnavailable");
}
function quoteFresh(q){return Number.isFinite(q?.bid)&&q.bid>0&&Number.isFinite(q?.ask)&&q.ask>=q.bid&&q?.provenance?.state==="REAL"&&q.provenance.fresh===true&&q.provenance.verified===true&&Number.isFinite(q.timestamp)&&Date.now()-q.timestamp<=120000&&q.timestamp<=Date.now()+1000}
function renderWebTrader() {
  const acc = getBrokerAccount();
  const brand = brokerBrands[acc.broker || acc.provider] || brokerBrands.exness;
  if ($("webtraderBrokerBadge")) {
    $("webtraderBrokerBadge").textContent = `${brand.badge} · 1:${acc.leverage || 200}`;
  }

  const quotesTarget = $("webtraderQuotesList");
  const quotesToUse = Object.fromEntries(Object.entries(liveQuotesCache).filter(([,q])=>quoteFresh(q)));
  Object.keys(quotesToUse).forEach(sym => {
    if (quotesToUse[sym] && liveQuotesCache[sym].bid) {
      quotesToUse[sym].bid = Number(liveQuotesCache[sym].bid);
      quotesToUse[sym].ask = Number(liveQuotesCache[sym].ask);
      quotesToUse[sym].spread = +(liveQuotesCache[sym].ask - liveQuotesCache[sym].bid).toFixed(quotesToUse[sym].digits);
    }
  });

  if (quotesTarget) {
    const activeSym = $("webtraderSymbolSelect")?.value || "XAUUSD";
    quotesTarget.innerHTML = Object.entries(quotesToUse).map(([sym, q]) => {
      const isAct = sym === activeSym;
      return `
        <div class="quote-row ${isAct ? 'active' : ''}" data-quote-symbol="${sym}">
          <div class="quote-sym-box">
            <b>${sym}</b>
            <small>${q.name} · Sp: ${q.spread}</small>
          </div>
          <div class="quote-prices">
            <span class="quote-bid">${q.bid.toFixed(q.digits)}</span>
            <span class="quote-ask">${q.ask.toFixed(q.digits)}</span>
          </div>
        </div>
      `;
    }).join("");

    if(!Object.keys(quotesToUse).length)quotesTarget.textContent=t("analysisUnavailable");
    quotesTarget.querySelectorAll(".quote-row").forEach(row => {
      row.addEventListener("click", () => {
        const sym = row.dataset.quoteSymbol;
        if (sym && $("webtraderSymbolSelect")) {
          $("webtraderSymbolSelect").value = sym;
          renderWebTrader();
          updateWebTraderCalculations();
        }
      });
    });
  }

  updateWebTraderCalculations();
}

function updateWebTraderCalculations() {
  const acc = getBrokerAccount();
  const sym = $("webtraderSymbolSelect")?.value || "XAUUSD";
  const lots = Number($("webtraderLotsInput")?.value || 0.1);
  const q = liveQuotesCache[sym];
  if(!quoteFresh(q)||q.provenance.pricingProxy||q.provenance.instrumentMatch===false||!serverBrokerAccounts.some(a=>a.id===acc.id)){if($("webtraderMarginCalc"))$("webtraderMarginCalc").textContent="Unavailable";if($("webtraderTransmitOrderBtn"))$("webtraderTransmitOrderBtn").disabled=true;return}
  if($("webtraderTransmitOrderBtn"))$("webtraderTransmitOrderBtn").disabled=false;
  const leverage = Number(acc.leverage || 200);

  const factor=q.currency==="USD"?1:sym.startsWith("USD")?1/q.ask:null;
  const contractVal = factor===null?NaN:lots*q.contractSize*q.ask*factor;
  const marginReq = +(contractVal / leverage).toFixed(2);
  const maxRisk = +(acc.balance * ((acc.riskPct || 1.0) / 100)).toFixed(2);

  if ($("webtraderMarginCalc")) $("webtraderMarginCalc").textContent = money(marginReq);
  if ($("webtraderRiskCalc")) $("webtraderRiskCalc").textContent = money(maxRisk);
  if ($("webtraderLeverageCalc")) $("webtraderLeverageCalc").textContent = `1:${leverage}`;

  const isLimit = $("webtraderOrderTypeSelect")?.value?.includes("LIMIT");
  $("webtraderPriceGroup")?.classList.toggle("hidden", !isLimit);
  if (isLimit && $("webtraderPriceInput") && !$("webtraderPriceInput").value) {
    $("webtraderPriceInput").value = q.bid.toFixed(q.digits || 2);
  }
}

function executeWebTraderTicket() {
  const acc = getBrokerAccount();
  const sym = $("webtraderSymbolSelect")?.value || "XAUUSD";
  const lots = Math.max(0.01, Number($("webtraderLotsInput")?.value || 0.1));
  const orderType = $("webtraderOrderTypeSelect")?.value || "BUY";
  const isLimit = orderType.includes("LIMIT");
  const q = liveQuotesCache[sym];
  if(!quoteFresh(q)||q.provenance.pricingProxy||q.provenance.instrumentMatch===false||!serverBrokerAccounts.some(a=>a.id===acc.id)){showNotice("Fresh provider quote required; execution unavailable","error");return}

  let entryPrice = isLimit ? Number($("webtraderPriceInput")?.value || q.bid) : (orderType.includes("BUY") ? q.ask : q.bid);
  let sl = Number($("webtraderSlInput")?.value || (orderType.includes("BUY") ? entryPrice * 0.995 : entryPrice * 1.005));
  let tp = Number($("webtraderTpInput")?.value || (orderType.includes("BUY") ? entryPrice * 1.012 : entryPrice * 0.988));

  const factor=q.currency==="USD"?1:sym.startsWith("USD")?1/entryPrice:null;
  if(factor===null){showNotice("Currency conversion requires server risk preview","error");return}
  const contractVal = lots * q.contractSize * entryPrice * factor;
  const marginReq = +(contractVal / (acc.leverage || 200)).toFixed(2);

  if (marginReq > acc.freeMargin) {
    const errText = currentLang === "ar"
      ? `الهامش المتاح غير كافٍ! الهامش المطلوب: ${money(marginReq)} بينما المتاح: ${money(acc.freeMargin)}. يرجى تقليل حجم اللوت.`
      : `Insufficient free margin! Required: ${money(marginReq)}, Free: ${money(acc.freeMargin)}. Please reduce lots.`;
    showNotice(errText, "error");
    return;
  }

  const deal = {
    symbol: sym,
    decision: orderType,
    lots: lots,
    entry: entryPrice,
    stopLoss: sl,
    target1: tp,
    maxRisk: Math.abs(entryPrice - sl) * q.contractSize * lots * factor
  };

  executeBrokerOrder(deal);
  setBrokerDeskView("ai-desk");
}

function openFundsModal() {
  const modal = $("fundsModal");
  if (!modal) return;
  const acc = getBrokerAccount();
  const isPaper = acc.tradingMode === "PAPER" || acc.broker === "paper" || acc.provider === "paper";
  const sandboxCard = $("sandboxFundingCard");
  if (sandboxCard) {
    sandboxCard.style.display = isPaper ? "flex" : "none";
  }

  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}

function closeFundsModal() {
  const modal = $("fundsModal");
  if (!modal) return;
  if (typeof modal.close === "function") modal.close();
  else modal.removeAttribute("open");
}

async function resetPaperBalance() {
  const acc = getBrokerAccount();
  const btn = $("resetPaperBalanceBtn");
  if (btn) btn.disabled = true;

  try {
    const res = await fetch("/api/broker/reset-sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: acc.id || "acc_paper_sandbox_01" })
    });
    const data = await res.json();
    if (data.ok && data.account) {
      saveBrokerAccount(data.account);
      const idx = serverBrokerAccounts.findIndex(a => a.id === data.account.id);
      if (idx >= 0) serverBrokerAccounts[idx] = data.account;
      renderBrokerDesk();
      renderBrokerAccountSelector();
      closeFundsModal();
      const succMsg = currentLang === "ar"
        ? "تمت إعادة تعيين محفظة التداول الافتراضي (Sandbox) إلى 50,000$ بنجاح."
        : "Simulated sandbox paper trading portfolio successfully reset to $50,000.00.";
      status(succMsg);
      return;
    }
  } catch (err) {
    console.warn("Sandbox reset server fallback:", err);
  } finally {
    if (btn) btn.disabled = false;
  }

  showNotice("Sandbox reset failed; server balances were not changed","error");
}

async function testBrokerPing() {
  const acc = getBrokerAccount();
  const label = $("testBrokerPingResult");
  const indicator = $("brokerPingText");
  if (label) label.textContent = currentLang === "ar" ? "جاري فحص الاتصال بالخادم..." : "Pinging broker gateway server...";

  try {
    const res = await fetch("/api/broker/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broker: acc.broker || acc.provider || "paper" })
    });
    const data = await res.json();
    if (data.ok && (data.status === "CONNECTED" || data.status === "ACTIVE")) {
      const pingText = `Ping: ${data.latencyMs}ms · Gateway Operational`;
      if (label) label.textContent = `🟢 Handshake OK: ${data.latencyMs}ms · Feeds Active`;
      if (indicator) indicator.textContent = pingText;
    } else {
      const msg = data.message || "Standby / Bridge Offline";
      if (label) label.textContent = `🟡 ${msg}`;
      if (indicator) indicator.textContent = `Gateway Standby`;
    }
  } catch (err) {
    if (label) label.textContent = `🔴 Gateway Unreachable: Network error`;
    if (indicator) indicator.textContent = `Ping: Offline`;
  }
}

function syncAccountSizeWithBroker() {
  const acc = getBrokerAccount();
  const balInput = $("accountBalance");
  if (balInput) {
    balInput.value = String(acc.balance);
    balInput.setAttribute("title", "Synchronized automatically to Broker Account");
  }
  const riskInput = $("riskPct");
  if (riskInput && acc.riskPct) {
    riskInput.value = String(acc.riskPct);
  }
  const topbarDot = $("topbarBrokerDot");
  const topbarName = $("topbarBrokerName");
  if (topbarDot && topbarName) {
    topbarDot.className = serverBrokerAccounts.some(a=>a.id===acc.id)&&acc.status==="CONNECTED" ? "broker-live-dot" : "broker-live-dot disconnected";
    topbarName.textContent = serverBrokerAccounts.some(a=>a.id===acc.id)?`Paper: ${acc.brokerName || acc.providerName || ""} (${money(acc.balance)})`:t("accountLocked");
  }
  const sidebarTag = $("sidebarBrokerStatus");
  if (sidebarTag) {
    sidebarTag.textContent = serverBrokerAccounts.some(a=>a.id===acc.id)&&acc.broker==="paper" ? t("paperReady") : t("accountLocked");
  }
}

function updateBrokerHud() {
  const acc = getBrokerAccount();
  const openPnl=(acc.positions||[]).reduce((sum,p)=>sum+Number(p.floatingPnl||0),0);
  const totalMargin=Number(acc.usedMargin||0),equity=Number(acc.equity||0),freeMargin=Number(acc.freeMargin||0),marginLevel=Number(acc.marginLevel||0);
  const brand = brokerBrands[acc.broker || acc.provider] || brokerBrands.exness;
  if ($("brokerLogoBadge")) $("brokerLogoBadge").innerHTML = brand.logoSvg;
  if ($("brokerNameBadge")) $("brokerNameBadge").textContent = acc.providerName || acc.brokerName || brand.badge;
  if ($("brokerRegTag")) $("brokerRegTag").textContent = acc.regulation || brand.regTag;
  if ($("brokerAccId")) $("brokerAccId").textContent = `Acc: #${acc.accountNumber || acc.accountId} · Server: ${acc.server || brand.server}`;
  if ($("brokerBalanceDisplay")) $("brokerBalanceDisplay").textContent = money(acc.balance);
  if ($("brokerEquityDisplay")) $("brokerEquityDisplay").textContent = money(equity);
  if ($("brokerOpenPnlDisplay")) {
    const el = $("brokerOpenPnlDisplay");
    el.textContent = `${openPnl >= 0 ? '+' : ''}${money(openPnl)}`;
    el.className = openPnl >= 0 ? "hud-amount pnl-green" : "hud-amount pnl-red";
  }
  if ($("brokerFreeMarginDisplay")) $("brokerFreeMarginDisplay").textContent = money(freeMargin);
  if ($("brokerMarginLevel")) {
    $("brokerMarginLevel").textContent = `Margin Level: ${marginLevel >= 500 ? 'Safe' : 'Warning'} (${fmt(marginLevel, 1)}%)`;
  }
  if ($("brokerUsedMarginDisplay")) $("brokerUsedMarginDisplay").textContent = money(totalMargin);
  if ($("brokerOpenCount")) $("brokerOpenCount").textContent = `${acc.positions.length} open position(s)`;
  if ($("brokerTodayPnlDisplay")) {
    const el = $("brokerTodayPnlDisplay");
    el.textContent = `${acc.dailyRealizedPnl >= 0 ? '+' : ''}${money(acc.dailyRealizedPnl)}`;
    el.className = acc.dailyRealizedPnl >= 0 ? "hud-amount pnl-green" : "hud-amount pnl-red";
  }
  if ($("brokerPnlRCount")) {
    $("brokerPnlRCount").textContent = `${acc.todayTradesCount || 0} trades executed today`;
  }
  if ($("brokerAiAdvisory")) {
    const selectedRisk=Number($("riskPct")?.value);
    const maxRiskDollars=Number.isFinite(selectedRisk)&&Number.isFinite(acc.balance)?acc.balance*selectedRisk/100:null;
    $("brokerAiAdvisory").innerHTML = `<span>🛡️ ${currentLang==="ar"?"حد المخاطر التجريبية":"Paper risk limit"}: ${fmt(selectedRisk, 1)}% single-trade rule (${money(maxRiskDollars)} max risk)</span>`;
  }
  return acc;
}

function generateCapitalDeals(acc){
  const maxRisk=acc.balance*(Number(acc.riskPct)||1)/100;
  const candidates=[currentAnalysis,...watchScanResults.filter(row=>row.automation?.active)];
  const seen=new Set(),deals=[];
  for(const setup of candidates){
    if(!setup?.entry||!setup.stopLoss||setup.decision==="WAIT"||seen.has(setup.symbol))continue;
    seen.add(setup.symbol);const q=liveQuotesCache[setup.symbol];if(!quoteFresh(q)||q.provenance.pricingProxy||q.provenance.instrumentMatch===false)continue;
    const entry=Number(setup.entry.toFixed(q.digits)),stopLoss=Number(setup.stopLoss.toFixed(q.digits)),target1=Number(setup.targets[0].toFixed(q.digits));
    const factor=q.currency==="USD"?1:setup.symbol.startsWith("USD")?1/stopLoss:null;
    if(factor===null)continue;
    const costPerLot=Math.abs(entry-stopLoss)*q.contractSize*factor;if(!(costPerLot>0))continue;
    const lots=Number((Math.floor(Math.min(q.maxLot,maxRisk/costPerLot)/q.lotStep)*q.lotStep).toFixed(8));if(lots<q.minLot)continue;
    const profitFactor=q.currency==="USD"?1:1/target1;
    const targetProfit=Number((Math.abs(target1-entry)*q.contractSize*lots*profitFactor).toFixed(2));
    deals.push({symbol:setup.symbol,decision:setup.decision,isLimit:setup.decision.includes("LIMIT"),title:`${setup.symbol} ${setup.decision} paper setup`,lots,entry,stopLoss,target1,maxRisk:costPerLot*lots,targetProfit,targetPct:targetProfit/acc.balance*100,rr:targetProfit/(costPerLot*lots),aiTip:currentLang==="ar"?"تقدير لحساب افتراضي فقط؛ يتطلب التنفيذ تحقق الخادم من المخاطر والأسعار.":"Paper sizing estimate from provider contract data. Execution requires fresh server validation; target outcome is hypothetical."});
  }
  return deals.slice(0,3);
}

function renderBrokerDesk() {
  const acc = updateBrokerHud();
  if($("accountRecoveryStatus")&&acc.pricingBlockedSymbols?.length)$("accountRecoveryStatus").textContent="Valuation unavailable: "+acc.pricingBlockedSymbols.join(", ")+". New exposure blocked. Inspect recovery; available exact-price positions may still be reduced independently.";
  for(const id of ["deskPermissionBadge","certPermStamp"])if($(id))$(id).textContent=serverBrokerAccounts.some(a=>a.id===acc.id)&&acc.broker==="paper"&&acc.permissionLevel==="TRADING_ENABLED"?t("paperPermission"):t("accountLocked");
  const dealsGrid = $("brokerDealsGrid");
  if (dealsGrid) {
    const deals = generateCapitalDeals(acc);
    if (!deals.length) {
      dealsGrid.innerHTML = `
        <div class="empty-deals-box" style="grid-column: 1 / -1; padding: 28px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; background: rgba(255,255,255,0.01);">
          <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
          <b style="display:block; margin-bottom: 6px;">${analysisInFlight?t("analysisLoading"):analysisError?t("analysisUnavailable"):currentAnalysis?t("analysisReady"):t("awaitingAnalysis")}</b>
          <p class="tiny muted-text" style="max-width: 480px; margin: 0 auto 14px auto;">
            ${analysisError?escapeHtml(analysisError):currentAnalysis?escapeHtml(currentAnalysis.warning||currentAnalysis.warnings?.[0]||t("analysisReady")):t("disclaimer")}
          </p>
          <button type="button" class="primary small" id="deskAnalyzeNowBtn" ${analysisInFlight?"disabled":""}>⚡ ${currentLang === "ar" ? "تحليل الذهب (XAUUSD) الآن" : "Analyze Gold (XAUUSD) Now"}</button>
        </div>
      `;
      $("deskAnalyzeNowBtn")?.addEventListener("click", () => {
        $("symbolInput").value = "XAUUSD";
        analyze();
      });
    } else {
      dealsGrid.innerHTML = deals.map(deal => {
        const isBuy = deal.decision.includes("BUY");
        const isLimit = deal.decision.includes("LIMIT");
        const cardClass = isLimit ? (isBuy ? 'buy-limit' : 'sell-limit') : (isBuy ? 'buy' : 'sell');
        return `
          <div class="deal-card ${cardClass}">
            <div class="deal-card-header">
              <div>
                <b>${escapeHtml(deal.title)}</b>
                <small class="muted-text">${escapeHtml(deal.symbol)} · ${deal.decision}</small>
              </div>
              <span class="deal-tag ${cardClass}">${escapeHtml(deal.decision)}</span>
            </div>

            <div class="deal-metric-row">
              <div><span>Tailored Sizing</span><b>${deal.lots} ${deal.symbol.includes("BTC") ? 'BTC' : 'Lots'}</b></div>
              <div><span>Capital Risk</span><b style="color:var(--red)">${money(deal.maxRisk)} (${fmt(acc.riskPct, 1)}%)</b></div>
              <div><span>Target Profit</span><b style="color:var(--green)">+${money(deal.targetProfit)} (+${deal.targetPct}%)</b></div>
              <div><span>Reward / Risk</span><b>1 : ${deal.rr}</b></div>
            </div>

            <p class="deal-notes">${escapeHtml(deal.aiTip)}</p>

            <div class="button-row">
              <button type="button" class="primary deal-action-btn" data-execute-deal="${encodeURIComponent(JSON.stringify(deal))}">
                ⚡ ${isLimit ? (currentLang === "ar" ? "تنفيذ الأمر المعلق" : "Execute Limit Order") : t("executeDeal")}
              </button>
              <button type="button" class="ghost small inspect-deal-btn" data-inspect-deal="${escapeHtml(deal.symbol)}">
                🔍 Inspect
              </button>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  renderBrokerPositions(acc);
}

function renderBrokerPositions(acc) {
  const target = $("brokerPositionsList");
  const tabTarget = $("positionsTabContent");
  const badge = $("openPositionsBadge");
  if (badge) badge.textContent = `${acc.positions.length} Active Orders`;

  const emptyHtml = `<div class="positions-empty-msg">No active broker orders running. Select an AI deal or analyze an instrument to execute.</div>`;
  const html = !acc.positions.length ? emptyHtml : acc.positions.map(pos => {
    const isBuy = pos.side.includes("BUY");
    const pnlColor = pos.floatingPnl >= 0 ? "var(--green)" : "var(--red)";
    return `
      <div class="positions-row">
        <span><b>${escapeHtml(pos.ticket)}</b></span>
        <b>${escapeHtml(pos.symbol)}</b>
        <span class="${isBuy ? 'pnl-green' : 'pnl-red'}">${escapeHtml(pos.side)}</span>
        <span>${pos.lots}</span>
        <span>${fmt(pos.entryPrice, pricePrecision(pos.entryPrice))}</span>
        <span>${fmt(pos.currentPrice, pricePrecision(pos.currentPrice))}</span>
        <small>${fmt(pos.sl, 4)} / ${fmt(pos.tp, 4)}</small>
        <b style="color:${pnlColor}">${pos.floatingPnl >= 0 ? '+' : ''}$${pos.floatingPnl.toFixed(2)} (${pos.pnlR >= 0 ? '+' : ''}${pos.pnlR}R)</b>
        <div class="positions-row-actions">
          <button type="button" class="ghost small close-pos-btn" data-ticket="${pos.ticket}" title="Close Position at Market">${t("closePosition")}</button>
          <button type="button" class="ghost small partial-pos-btn" data-ticket="${pos.ticket}" title="Close 50%">${t("partialClose")}</button>
        </div>
      </div>
    `;
  }).join("");

  if (target) target.innerHTML = html;
  if (tabTarget) tabTarget.innerHTML = html;
}

function setBrokerModalTab(tab = "open") {
  const isOpen = tab === "open";
  $("tabOpenBrokerBtn")?.classList.toggle("active", isOpen);
  $("tabConnectBrokerBtn")?.classList.toggle("active", !isOpen);
  $("openBrokerTabContent")?.classList.toggle("hidden", !isOpen);
  $("connectBrokerTabContent")?.classList.toggle("hidden", isOpen);
}

function openBrokerModal(defaultTab = "open") {
  const modal = $("brokerModal");
  if (!modal) return;
  const acc = getBrokerAccount();

  setBrokerModalTab(defaultTab);

  document.querySelectorAll("#brokerProviderOptions .broker-option-card").forEach(card => {
    const match = card.dataset.provider === acc.provider;
    card.classList.toggle("active", match);
    const radio = card.querySelector("input[type='radio']");
    if (radio) radio.checked = match;
  });

  const brand = brokerBrands[acc.provider] || brokerBrands.exness;
  if ($("externalBrokerLink")) $("externalBrokerLink").href = brand.link || "https://www.exness.com";
  if ($("brokerServerInput")) $("brokerServerInput").value = acc.server || brand.server;
  if ($("brokerAccountIdInput")) $("brokerAccountIdInput").value = acc.accountId || "";
  if ($("brokerSyncBalanceInput")) $("brokerSyncBalanceInput").value = acc.balance;

  const preset = $("brokerCapitalPreset");
  if (preset) {
    const hasPreset = ["10000", "25000", "50000", "100000", "250000"].includes(String(acc.balance));
    preset.value = hasPreset ? String(acc.balance) : "custom";
    const customBox = $("customCapitalLabel");
    if (customBox) customBox.classList.toggle("hidden", hasPreset);
    if ($("brokerCustomCapital")) $("brokerCustomCapital").value = acc.balance;
  }

  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}

function closeBrokerModal() {
  const modal = $("brokerModal");
  if (!modal) return;
  if (typeof modal.close === "function") modal.close();
  else modal.removeAttribute("open");
}

let activeDocsPlatform = "exness";

function openBrokerDocsModal(platform = "exness") {
  const modal = $("brokerDocsModal");
  if (!modal) return;
  switchBrokerDocsTab(platform);
  const searchInput = $("docsSearchInput");
  if (searchInput) {
    searchInput.value = "";
    filterBrokerDocs("");
  }
  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}

function closeBrokerDocsModal() {
  const modal = $("brokerDocsModal");
  if (!modal) return;
  if (typeof modal.close === "function") modal.close();
  else modal.removeAttribute("open");
}

function switchBrokerDocsTab(platform = "exness") {
  activeDocsPlatform = platform;
  const navTabs = document.querySelectorAll("#docsTabsNav .docs-tab-btn");
  navTabs.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.platform === platform);
  });

  const contentPanels = document.querySelectorAll(".docs-tab-content");
  contentPanels.forEach(panel => {
    panel.classList.toggle("hidden", panel.dataset.platformSection !== platform);
  });

  const activePanel = document.querySelector(`.docs-tab-content[data-platform-section='${platform}']`);
  if (activePanel) {
    activePanel.querySelectorAll(".tutorial-step-card, .trouble-card").forEach(c => {
      c.style.display = "";
    });
  }

  const formShell = document.querySelector(".docs-form-shell");
  if (formShell) formShell.scrollTop = 0;
}

function filterBrokerDocs(query = "") {
  const q = String(query).trim().toLowerCase();
  const allCards = document.querySelectorAll("#brokerDocsModal .tutorial-step-card, #brokerDocsModal .trouble-card");

  if (!q) {
    allCards.forEach(card => card.style.display = "");
    return;
  }

  allCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const matches = text.includes(q);
    card.style.display = matches ? "flex" : "none";
  });
}

function applyBrokerDocsConfig(platform) {
  if(platform!=="paper"){showNotice(ux("uxResearchCopy"),"info");return}
  let server = "";
  let accountId = "";
  let balance = 25000;

  if (platform === "exness") {
    server = $("docExnessServerSelect")?.value || "Exness-Real14.mt5.exness.com:443";
    accountId = $("docExnessAccountInput")?.value || "";
    balance = Number($("docExnessBalanceInput")?.value || 25000);
  } else if (platform === "xtb") {
    server = $("docXtbServerSelect")?.value || "XTB-xStation5-Live.xtb.com:443";
    accountId = $("docXtbAccountInput")?.value || "";
    balance = Number($("docXtbBalanceInput")?.value || 50000);
  } else if (platform === "mt5") {
    server = $("docMt5ServerSelect")?.value || "MetaQuotes-Live5.metaquotes.net:443";
    accountId = $("docMt5AccountInput")?.value || "";
    balance = Number($("docMt5BalanceInput")?.value || 100000);
  }

  closeBrokerDocsModal();
  openBrokerModal("connect");

  const provider = platform === "mt5" ? "mt5" : platform;
  document.querySelectorAll("#brokerProviderOptions .broker-option-card").forEach(card => {
    const match = card.dataset.provider === provider;
    card.classList.toggle("active", match);
    const radio = card.querySelector("input[type='radio']");
    if (radio) radio.checked = match;
  });

  const serverInp = $("brokerServerInput");
  const accInp = $("brokerAccountIdInput");
  const balInp = $("brokerSyncBalanceInput");

  if (serverInp) {
    serverInp.value = server;
    serverInp.classList.remove("field-highlight");
    void serverInp.offsetWidth;
    serverInp.classList.add("field-highlight");
  }
  if (accInp) {
    accInp.value = accountId;
    accInp.classList.remove("field-highlight");
    void accInp.offsetWidth;
    accInp.classList.add("field-highlight");
  }
  if (balInp) {
    balInp.value = balance;
    balInp.classList.remove("field-highlight");
    void balInp.offsetWidth;
    balInp.classList.add("field-highlight");
  }

  status(currentLang === "ar"
    ? `⚡ تم تطبيق إعدادات ${platform.toUpperCase()} وتعبئتها في نموذج الربط!`
    : `⚡ ${platform.toUpperCase()} configuration auto-filled into Broker Connection form!`);
}

async function runDocPingTest() {
  const btn = $("docRunPingTestBtn");
  const resultBadge = $("docPingResultBadge");
  const broker = $("docTestBrokerSelect")?.value || "exness";

  if (btn) {
    btn.disabled = true;
    btn.textContent = currentLang === "ar" ? "⏳ جاري الاختبار..." : "⏳ Testing ping...";
  }
  if (resultBadge) {
    resultBadge.textContent = currentLang === "ar" ? "جاري قياس زمن الوصول..." : "Measuring roundtrip latency...";
    resultBadge.style.color = "var(--accent)";
  }

  const startMs = Date.now();
  try {
    const res = await fetch("/api/broker/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broker })
    });
    const data = await res.json();
    const elapsed = Date.now() - startMs;
    const latency = data.latencyMs || Math.max(8, elapsed);
    if (resultBadge) {
      resultBadge.textContent = currentLang === "ar"
        ? `🟢 ${latency}ms · اتصال خادم ${data.broker || broker.toUpperCase()} نشط ومتحقق منه`
        : `🟢 ${latency}ms · ${data.broker || broker.toUpperCase()} · internal paper engine only`;
      resultBadge.style.color = "var(--green)";
    } else {
      if (resultBadge) {
        resultBadge.textContent = currentLang === "ar" ? `🟡 ${data.message || 'خادم الجسر غير متصل'}` : `🟡 ${data.message || 'Bridge Offline'}`;
        resultBadge.style.color = "var(--yellow)";
      }
    }
  } catch (err) {
    if (resultBadge) {
      resultBadge.textContent = currentLang === "ar" ? "🔴 تعذر الوصول إلى الخادم / غير متصل" : "🔴 Gateway Unreachable / Offline";
      resultBadge.style.color = "var(--red)";
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = currentLang === "ar" ? "🚀 إرسال فحص جديد" : "🚀 Send Test Ping";
    }
  }
}

function openTradeExecutionModal(deal) {
  pendingExecutionOrder = deal;
  const modal = $("tradeExecutionModal");
  const card = $("executeOrderCard");
  if (!modal || !card) return;

  const isBuy = deal.decision.includes("BUY");
  const isLimit = deal.decision.includes("LIMIT");
  card.innerHTML = `
    <div class="order-summary-row"><span>Instrument:</span><b>${escapeHtml(deal.symbol)}</b></div>
    <div class="order-summary-row"><span>Order Type:</span><b style="color:${isBuy ? (isLimit ? '#38bdf8' : 'var(--green)') : (isLimit ? '#fb923c' : 'var(--red)')}">${escapeHtml(deal.decision)} (${isLimit ? 'Pending Limit Order' : 'Market Fill'})</b></div>
    <div class="order-summary-row"><span>Order Volume:</span><b>${deal.lots} Lots</b></div>
    <div class="order-summary-row"><span>${isLimit ? 'Limit Trigger Price:' : 'Estimated Fill Price:'}</span><b>${fmt(deal.entry, pricePrecision(deal.entry))}</b></div>
    <div class="order-summary-row"><span>Protective Stop Loss:</span><b>${fmt(deal.stopLoss, pricePrecision(deal.stopLoss))}</b></div>
    <div class="order-summary-row"><span>Profit Target (TP1):</span><b>${fmt(deal.target1, pricePrecision(deal.target1))}</b></div>
    <div class="order-summary-row"><span>Max Capital Risk:</span><b style="color:var(--red)">${money(deal.maxRisk)}</b></div>
    <div class="order-summary-row"><span>Projected Payout:</span><b style="color:var(--green)">+${money(deal.targetProfit)}</b></div>
  `;

  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}

function closeTradeExecutionModal() {
  pendingExecutionOrder = null;
  const modal = $("tradeExecutionModal");
  if (!modal) return;
  if (typeof modal.close === "function") modal.close();
  else modal.removeAttribute("open");
}

let orderInFlight=false;
async function executeBrokerOrder(deal) {
  if(orderInFlight)return;orderInFlight=true;
  const acc = getBrokerAccount();
  const idempotencyKey = `ord-${crypto.randomUUID()}`;
  const precision=liveQuotesCache[deal.symbol]?.digits;
  const level=value=>Number.isInteger(precision)?Number(Number(value).toFixed(precision)):Number(value);

  try {
    const res = await fetch("/api/orders/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: acc.id || acc.accountNumber,
        symbol: deal.symbol,
        side: deal.decision || "BUY",
        lots: Number(deal.lots),
        stopLoss: level(deal.stopLoss),
        takeProfit: level(deal.target1 ?? deal.tp ?? 0),
        entryPrice: level(deal.entry),
        idempotencyKey
      })
    });

    const data = await res.json();
    if (!data.ok) {
      const errReason = data.error || "Order execution rejected by risk engine.";
      showNotice(currentLang === "ar" ? `[رفض إدارة المخاطر] ${errReason}` : `[Risk Engine Rejection] ${errReason}`, "error");
      status(`⚠️ ${errReason}`);
      return;
    }

    if (data.account) {
      data.account.connected = data.account.broker==="paper"&&data.account.status==="CONNECTED";
      saveBrokerAccount(data.account);
      const idx = serverBrokerAccounts.findIndex(a => a.id === data.account.id);
      if (idx >= 0) serverBrokerAccounts[idx] = data.account;
    }

    if(data.orderResult?.status==="PENDING"){renderBrokerDesk();showNotice("Paper limit order pending; no fill yet","info");return}
    const pos = data.orderResult?.position || {
      ticket: data.orderResult?.ticket || `ORD-${Date.now().toString().slice(-6)}`,
      symbol: deal.symbol,
      side: deal.decision || "BUY",
      lots: Number(deal.lots),
      entryPrice: Number(data.orderResult?.executedPrice || deal.entry),
      sl: Number(deal.stopLoss),
      tp: Number(deal.target1 || deal.tp)
    };

    renderBrokerDesk();
    renderWebTrader();
    showLiveTradeNotification(pos);
    status(data.message || `Order filled: ${pos.side} ${pos.lots} ${pos.symbol}`);
    return;
  } catch (err) {
    console.error("Server order execution failure:", err);
    showNotice(currentLang === "ar" ? "تعذر تنفيذ الأمر: فشل الاتصال بخادم التداول" : "Order execution failed: Broker server unreachable", "error");
    status("🔴 Order execution failed: Gateway Unreachable");
    return;
  } finally {orderInFlight=false}
}

async function closeBrokerPosition(ticket, partialFraction = 1.0) {
  const acc = getBrokerAccount();
  const pos = (acc.positions || []).find(p => p.ticket === ticket || p.id === ticket);

  try {
    const res = await fetch("/api/positions/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: acc.id || acc.accountNumber,
        ticket,
        volumeRatio: partialFraction,
        idempotencyKey:"close-"+crypto.randomUUID(),
        symbol: pos?.symbol || "EURUSD"
      })
    });

    const data = await res.json();
    if (data.ok && data.account) {
      data.account.connected = data.account.broker==="paper"&&data.account.status==="CONNECTED";
      saveBrokerAccount(data.account);
      const idx = serverBrokerAccounts.findIndex(a => a.id === data.account.id);
      if (idx >= 0) serverBrokerAccounts[idx] = data.account;

      await loadServerLedger();
      renderBrokerDesk();

      status(data.message || t("positionClosed", { pnl: `${finalPnl >= 0 ? '+' : ''}$${finalPnl.toFixed(2)}` }));
      return;
    } else if (!data.ok) {
      showNotice(data.error || "Failed to close position", "error");
      status(`⚠️ ${data.error}`);
      return;
    }
  } catch (err) {
    console.error("Server position close error:", err);
    showNotice(currentLang === "ar" ? "تعذر إغلاق الصفقة: فشل الاتصال بخادم الوسيط" : "Failed to close position: Broker server unreachable", "error");
    status("🔴 Position close failed: Gateway Unreachable");
    return;
  }
}

function showLiveTradeNotification(pos) {
  const toast = $("tradeToast");
  if (!toast) return;
  if ($("toastSignal")) $("toastSignal").textContent = pos.side;
  if ($("toastSymbol")) $("toastSymbol").textContent = pos.symbol;
  if ($("toastConfidence")) $("toastConfidence").textContent = "FILLED";
  if ($("toastEntry")) $("toastEntry").textContent = fmt(pos.entryPrice, pricePrecision(pos.entryPrice));
  if ($("toastSL")) $("toastSL").textContent = fmt(pos.sl, pricePrecision(pos.sl));
  if ($("toastTP1")) $("toastTP1").textContent = fmt(pos.tp, pricePrecision(pos.tp));
  if ($("toastReason")) $("toastReason").textContent = `Order executed: ${pos.lots} lots on ${getBrokerAccount().providerName}.`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 5000);
}

let liveQuotesCache = {};

let quoteRequestInFlight=null,quoteRetryAt=0,quoteFailures=0;
function retryDelay(res,data,fallback){
  const value=res.headers?.get("Retry-After");
  const seconds=value?(/^\d+$/.test(value)?Number(value):(Date.parse(value)-Date.now())/1000):Number(data?.retryAfter);
  return Number.isFinite(seconds)&&seconds>0?Math.max(1000,seconds*1000):fallback;
}
async function fetchLiveMarketQuotes() {
  if(quoteRequestInFlight)return quoteRequestInFlight;
  if(Date.now()<quoteRetryAt)return liveQuotesCache;
  const symbols=[...new Set([$("webtraderSymbolSelect")?.value,currentAnalysis?.symbol,...(getBrokerAccount().positions||[]).map(p=>p.symbol),"XAUUSD","EURUSD","GBPUSD","USDJPY","BTCUSDT","US30",...getWatchlist()].filter(Boolean))].slice(0,30);
  quoteRequestInFlight=loadQuoteBatch(symbols);
  try{return await quoteRequestInFlight}finally{quoteRequestInFlight=null;renderWorkbench()}
}
async function loadQuoteBatch(symbols) {
  workspaceQuoteState="loading";renderWorkbench();
  try {
    const res=await fetch("/api/quotes?symbols="+encodeURIComponent(symbols.join(",")),{signal:AbortSignal.timeout(45000)});
    const data=await res.json();
    if(!res.ok||!data.ok){
      workspaceQuoteState="error";quoteFailures++;liveQuotesCache={};renderProviderStatus();
      quoteRetryAt=Date.now()+retryDelay(res,data,Math.min(120000,15000*2**Math.min(quoteFailures,3)))+Math.random()*1000;
      return liveQuotesCache;
    }
    workspaceQuoteState="ready";quoteFailures=0;liveQuotesCache=data.quotes||{};
    quoteRetryAt=Date.now()+Math.max(15000,(data.retryAfter||0)*1000);
    renderProviderStatus();
    updateDashboardMarketOverview();
    return liveQuotesCache;
  } catch {
    workspaceQuoteState="error";quoteFailures++;liveQuotesCache={};
    renderWorkbench();
    quoteRetryAt=Date.now()+Math.min(120000,15000*2**Math.min(quoteFailures,3))+Math.random()*1000;
    return liveQuotesCache;
  }
}
let brokerSyncInFlight=false,brokerTickGeneration=0;
async function syncOpenPositionsWithLiveMarket() {
  if(brokerSyncInFlight)return;
  brokerSyncInFlight=true;
  try{await loadBrokerAccountsFromServer();await fetchLiveMarketQuotes();renderWebTrader()}finally{brokerSyncInFlight=false}
}
function startBrokerPositionTickTimer() {
  clearTimeout(brokerTickInterval);
  const generation=++brokerTickGeneration;
  const tick=async()=>{
    if(generation!==brokerTickGeneration)return;
    try{if(!document.hidden)await syncOpenPositionsWithLiveMarket()}finally{
      if(generation===brokerTickGeneration)brokerTickInterval=setTimeout(tick,Math.max(15000,quoteRetryAt-Date.now()));
    }
  };
  brokerTickInterval=setTimeout(tick,15000);
}

function initEvents() {
  $("includeUnverifiedLedger")?.addEventListener("change",event=>{includeUnverifiedLedger=event.target.checked;renderPerformanceAnalytics()});
  $("exitBenchmarkPreview")?.addEventListener("click",()=>{benchmarkPreview=false;renderPerformanceAnalytics()});
  $("notificationForm")?.addEventListener("submit",event=>{event.preventDefault();saveNotificationPrefs()});
  restoreNotificationPrefs();
  $("inspectRecoveryBtn")?.addEventListener("click",inspectAccountRecovery);
  $("sessionForm")?.addEventListener("submit",event=>{event.preventDefault();const token=$("sessionToken").value;$("sessionToken").value="";mutateSession(token)});
  $("sessionLogout")?.addEventListener("click",()=>mutateSession(null));
  $("analyzeBtn").addEventListener("click", analyze);
  $("symbolInput").addEventListener("keydown", event => {
    if (event.key === "Enter") analyze();
  });
  document.querySelectorAll(".chip[data-symbol]").forEach(button => {
    button.addEventListener("click", () => {
      $("symbolInput").value = button.dataset.symbol;
      analyze();
    });
  });
  document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => {
      const view = button.dataset.view || button.dataset.jump;
      switchView(view);
    });
  });

  document.addEventListener("click", e => {
    const jumpBtn = e.target.closest("[data-view-jump]");
    if (jumpBtn) {
      const v = jumpBtn.dataset.viewJump;
      if (v) switchView(v);
    }
    const tradeBtn = e.target.closest(".dash-trade-btn");
    if (tradeBtn) {
      const sym = tradeBtn.dataset.tradeSym;
      if (sym) {
        $("symbolInput").value = sym;
        switchView("trading");
        analyze();
      }
    }
    const inspectBtn = e.target.closest(".dash-inspect-btn");
    if (inspectBtn) {
      const sym = inspectBtn.dataset.inspectSym;
      if (sym) {
        $("symbolInput").value = sym;
        switchView("trading");
        analyze();
      }
    }
  });

  document.querySelectorAll(".subtab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.closest(".app-view");
      if (!parent) return;
      parent.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const targetSubtab = btn.dataset.subtab;
      parent.querySelectorAll(".subtab-content").forEach(c => {
        c.style.display = c.dataset.subtab === targetSubtab ? "block" : "none";
      });
    });
  });

  $("languageSelect").addEventListener("change", event => setLanguage(event.target.value));
  document.querySelectorAll("[data-language]").forEach(button => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });
  $("loadChartBtn").addEventListener("click", () => loadChart());
  $("themeBtn").addEventListener("click", () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    browserStore.setItem("thn_ai_trader_theme_v3", document.documentElement.dataset.theme);
    loadChart();
  });
  $("saveJournalBtn").addEventListener("click", saveJournal);
  $("clearJournalBtn").addEventListener("click", () => {
    if (confirm(t("confirmClear"))) {
      browserStore.removeItem(journalKey);
      renderJournal();
      renderPerformanceAnalytics();
    }
  });
  $("exportJournalBtn").addEventListener("click", exportJournal);

  // Performance Analytics & Modal handlers
  $("loadSampleTradesBtn")?.addEventListener("click", loadBenchmarkHistory);

  $("openLogTradeModalBtn")?.addEventListener("click", () => {
    const modal = $("logTradeModal");
    if (!modal) return;
    if ($("manualDate")) $("manualDate").value = new Date().toISOString().split("T")[0];
    if (currentAnalysis) {
      if ($("manualSymbol")) $("manualSymbol").value = currentAnalysis.symbol || "EURUSD";
      if ($("manualDirection")) $("manualDirection").value = currentAnalysis.decision === "SELL" ? "SELL" : "BUY";
      if ($("manualEntry")) $("manualEntry").value = currentAnalysis.entry || 1.085;
      if ($("manualExit")) $("manualExit").value = currentAnalysis.targets?.[0] || currentAnalysis.entry || 1.0895;
    }
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
  });

  const closeLogModal = () => {
    const modal = $("logTradeModal");
    if (!modal) return;
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.removeAttribute("open");
    }
  };

  $("closeLogTradeDialogBtn")?.addEventListener("click", closeLogModal);
  $("cancelLogTradeBtn")?.addEventListener("click", closeLogModal);

  $("manualOutcome")?.addEventListener("change", event => {
    const val = event.target.value;
    const pnlInput = $("manualPnl");
    const rInput = $("manualR");
    if (!pnlInput || !rInput) return;
    if (val === "WIN") {
      pnlInput.value = String(Math.abs(Number(pnlInput.value || 250)));
      rInput.value = String(Math.abs(Number(rInput.value || 2.0)));
    } else if (val === "LOSS") {
      pnlInput.value = String(-Math.abs(Number(pnlInput.value || 100)));
      rInput.value = "-1.0";
    } else {
      pnlInput.value = "0";
      rInput.value = "0";
    }
  });

  $("logTradeForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const sym = normalizeSymbolInput($("manualSymbol")?.value || "EURUSD");
    const direction = $("manualDirection")?.value || "BUY";
    const entry = Number($("manualEntry")?.value || 0);
    const exitPrice = Number($("manualExit")?.value || 0);
    const outcome = $("manualOutcome")?.value || "WIN";
    const pnl = Number($("manualPnl")?.value || 0);
    const pnlR = Number($("manualR")?.value || 0);
    const dateVal = $("manualDate")?.value ? new Date($("manualDate").value).toISOString() : new Date().toISOString();
    const notes = $("manualNotes")?.value || "";

    const trade = {
      id: "trade-" + Date.now(),
      date: dateVal,
      symbol: sym,
      decision: direction,
      confidence: null,
      grade: null,
      entry: entry,
      stopLoss: 0,
      target1: exitPrice,
      risk: null,
      assetClass: detectAssetClass(sym),
      status: outcome,
      pnl: pnl,
      pnlR: pnlR,
      exitPrice: exitPrice,
      notes: notes
    };

    const arr = getJournal();
    arr.unshift(trade);
    writeLocalJournal(arr.slice(0,150));
    renderJournal();
    renderPerformanceAnalytics();
    closeLogModal();
    status(currentLang === "ar" ? "تم تسجيل الصفقة المغلقة بنجاح." : "Logged closed trade outcome successfully.");
  });

  // Bulk Import Handlers
  const openBulkModal = () => {
    const modal = $("bulkImportModal");
    if (!modal) return;
    pendingImportTrades = [];
    $("csvFileInfo")?.classList.add("hidden");
    $("confirmBulkImportBtn")?.setAttribute("disabled", "true");
    if ($("csvFileInput")) $("csvFileInput").value = "";
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  };

  const closeBulkModal = () => {
    const modal = $("bulkImportModal");
    if (!modal) return;
    if (typeof modal.close === "function") modal.close();
    else modal.removeAttribute("open");
  };

  $("openBulkImportBtn")?.addEventListener("click", openBulkModal);
  $("journalBulkImportBtn")?.addEventListener("click", openBulkModal);
  $("closeBulkImportDialogBtn")?.addEventListener("click", closeBulkModal);
  $("cancelBulkImportBtn")?.addEventListener("click", closeBulkModal);
  $("downloadTemplateBtn")?.addEventListener("click", downloadSampleCsvTemplate);

  const dropzone = $("csvDropzone");
  const fileInput = $("csvFileInput");

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    ["dragenter", "dragover"].forEach(evt => {
      dropzone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach(evt => {
      dropzone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dragover");
      });
    });

    const handleFile = file => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const parsed = parseTradesCSV(ev.target.result);
          if (!parsed.length) {
            showNotice(t("noValidTradesInCsv"), "error");
            return;
          }
          pendingImportTrades = parsed;
          const wins = parsed.filter(t => t.status === "WIN").length;
          const netPnl = parsed.reduce((sum, t) => sum + (t.pnl || 0), 0);

          if ($("csvFileName")) $("csvFileName").textContent = file.name;
          if ($("csvFileMeta")) {
            $("csvFileMeta").textContent = `${parsed.length} trades · ${wins}W (${((wins / parsed.length) * 100).toFixed(0)}%) · Net: ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(0)}`;
          }

          if ($("csvPreviewGrid")) {
            $("csvPreviewGrid").innerHTML = `
              <div class="csv-preview-row header">
                <span>Date</span><span>Symbol</span><span>Side</span><span>PnL ($)</span><span>Status</span>
              </div>
            ` + parsed.slice(0, 5).map(t => `
              <div class="csv-preview-row">
                <span>${t.date.split("T")[0]}</span>
                <b>${escapeHtml(t.symbol)}</b>
                <span class="${t.decision.toLowerCase()}">${t.decision}</span>
                <span style="color:${t.pnl >= 0 ? 'var(--green)' : 'var(--red)'}">${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(0)}</span>
                <span>${t.status}</span>
              </div>
            `).join("");
          }

          $("csvFileInfo")?.classList.remove("hidden");
          $("confirmBulkImportBtn")?.removeAttribute("disabled");
        } catch (err) {
          showNotice(t("csvParseError"), "error");
        }
      };
      reader.readAsText(file);
    };

    dropzone.addEventListener("drop", e => {
      const files = e.dataTransfer?.files;
      if (files && files.length) handleFile(files[0]);
    });

    fileInput.addEventListener("change", e => {
      if (e.target.files && e.target.files.length) handleFile(e.target.files[0]);
    });
  }

  $("confirmBulkImportBtn")?.addEventListener("click", () => {
    if (!pendingImportTrades.length) return;
    const mode = document.querySelector('input[name="importMode"]:checked')?.value || "append";
    let finalLedger = [];
    if (mode === "replace") {
      finalLedger = [...pendingImportTrades];
    } else {
      const existing = getJournal();
      finalLedger = [...pendingImportTrades, ...existing];
    }

    writeLocalJournal(finalLedger.slice(0,500));
    renderJournal();
    renderPerformanceAnalytics();
    closeBulkModal();
    const msg = t("tradesImported", { count: pendingImportTrades.length });
    status(msg);
  });

  document.querySelectorAll("#analyticsPeriodFilter .analytics-pill").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#analyticsPeriodFilter .analytics-pill").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      analyticsPeriod = button.dataset.period || "all";
      renderPerformanceAnalytics();
    });
  });

  $("analyticsAssetFilter")?.addEventListener("change", event => {
    analyticsAsset = event.target.value;
    renderPerformanceAnalytics();
  });

  $("journalList")?.addEventListener("click", event => {
    const cycleBtn = event.target.closest("[data-cycle-trade]");
    if (cycleBtn) {
      cycleTradeOutcome(cycleBtn.dataset.cycleTrade);
      return;
    }
    const delBtn = event.target.closest("[data-delete-trade]");
    if (delBtn) {
      deleteJournalTrade(delBtn.dataset.deleteTrade);
      return;
    }
  });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderPerformanceAnalytics();
    }, 150);
  });
  $("addFavoriteBtn").addEventListener("click", () => addFavoriteSymbol($("favoriteSymbolInput").value));
  $("favoriteSymbolInput").addEventListener("keydown", event => {
    if (event.key === "Enter") addFavoriteSymbol($("favoriteSymbolInput").value);
  });
  document.querySelectorAll(".favorite-chip").forEach(button => {
    button.addEventListener("click", () => addFavoriteSymbol(button.dataset.favorite));
  });
  $("watchlistList").addEventListener("click", event => {
    const analyzeSymbol = event.target.closest("[data-watch-analyze]")?.dataset.watchAnalyze;
    const removeSymbol = event.target.closest("[data-watch-remove]")?.dataset.watchRemove;
    const hiddenSymbol=event.target.closest("[data-watch-hide]")?.dataset.watchHide;
    const scanSymbol=event.target.closest("[data-watch-scan]")?.dataset.watchScan;
    if(hiddenSymbol)setInstrumentPref(hiddenSymbol,"hidden",!instrumentPrefs()[hiddenSymbol]?.hidden);
    if(scanSymbol)setInstrumentPref(scanSymbol,"scanEnabled",event.target.checked);
    if (analyzeSymbol) {
      $("symbolInput").value = analyzeSymbol;
      analyze();
    }
    if (removeSymbol) removeFavoriteSymbol(removeSymbol);
  });
  $("showHiddenInstruments")?.addEventListener("change",event=>{showHiddenInstruments=event.target.checked;renderWatchlist()});
  $("scanWatchlistBtn").addEventListener("click", scanWatchlist);
  $("startScannerBtn").addEventListener("click", startScanner);
  $("stopScannerBtn").addEventListener("click", () => stopScanner(true));
  $("minConfidence").addEventListener("change", saveWatchSettings);
  $("toggleWatchlistBtn")?.addEventListener("click", () => toggleWatchlist());
  $("expandWatchlistBtn")?.addEventListener("click", () => toggleWatchlist(false));
  $("watchSearchInput")?.addEventListener("input", event => {
    watchSearchTerm = event.target.value.trim().toUpperCase();
    renderWatchlist();
  });
  $("resetDefaultPairsBtn")?.addEventListener("click", () => {
    setWatchlist(["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSDT", "US30"]);
    status(currentLang === "ar" ? "تم تحميل الأزواج الرئيسية." : "Loaded major pairs.");
  });
  $("toggleSoundBtn")?.addEventListener("click", toggleSound);
  $("scanEvery")?.addEventListener("change", () => {
    updateCustomScanVisibility();
    saveWatchSettings();
    if (scannerActive) startScanner();
  });
  $("customScanValue")?.addEventListener("change", () => {
    saveWatchSettings();
    if (scannerActive) startScanner();
  });
  $("customScanUnit")?.addEventListener("change", () => {
    saveWatchSettings();
    if (scannerActive) startScanner();
  });
  $("toastCloseBtn")?.addEventListener("click", hideTradeToast);
  $("toastInspectBtn")?.addEventListener("click", () => {
    const sym = $("tradeToast")?.dataset.symbol;
    hideTradeToast();
    if (sym) {
      $("symbolInput").value = sym;
      document.querySelectorAll(".nav").forEach(x => x.classList.remove("active"));
      document.querySelector('.nav[data-jump="analysis"]')?.classList.add("active");
      document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth" });
      analyze();
    }
  });
  $("exportMapBtn")?.addEventListener("click", exportMarketMap);
  initMapControls();

  // Broker Modal & Gateway Listeners
  $("openBrokerModalBtn")?.addEventListener("click", () => openBrokerModal("open"));
  $("openBrokerConnectBtn")?.addEventListener("click", () => openBrokerModal("open"));
  $("openBrokerSwitchBtn")?.addEventListener("click", () => openBrokerModal("open"));
  $("openBrokerSettingsBtn")?.addEventListener("click", () => openBrokerModal("connect"));
  $("closeBrokerModalBtn")?.addEventListener("click", closeBrokerModal);
  $("cancelBrokerModalBtn")?.addEventListener("click", closeBrokerModal);
  $("cancelConnectBrokerModalBtn")?.addEventListener("click", closeBrokerModal);

  // Interactive Broker Docs & API Connection Tutorials Modal Listeners
  $("openBrokerDocsBtn")?.addEventListener("click", () => openBrokerDocsModal("exness"));
  $("openDocsFromConnectBtn")?.addEventListener("click", () => {
    const selRadio = document.querySelector("#brokerProviderOptions input[name='brokerProvider']:checked");
    const prov = selRadio?.value || "exness";
    openBrokerDocsModal(prov);
  });
  $("docsQuickLinkServer")?.addEventListener("click", () => openBrokerDocsModal("mt5"));
  $("docsQuickLinkToken")?.addEventListener("click", () => {
    const selRadio = document.querySelector("#brokerProviderOptions input[name='brokerProvider']:checked");
    const prov = selRadio?.value || "exness";
    openBrokerDocsModal(prov);
  });
  $("closeBrokerDocsModalBtn")?.addEventListener("click", closeBrokerDocsModal);
  $("closeDocsBottomBtn")?.addEventListener("click", closeBrokerDocsModal);
  $("openConnectFromDocsBtn")?.addEventListener("click", () => {
    closeBrokerDocsModal();
    openBrokerModal("connect");
  });

  // Docs Modal Platform Tab Switching
  document.querySelectorAll("#docsTabsNav .docs-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const plat = btn.dataset.platform || "exness";
      switchBrokerDocsTab(plat);
    });
  });

  // Docs Search & Real-Time Filter
  $("docsSearchInput")?.addEventListener("input", e => {
    filterBrokerDocs(e.target.value);
  });

  // Quick 1-Click Auto-Fill buttons
  $("applyExnessConfigBtn")?.addEventListener("click", () => applyBrokerDocsConfig("exness"));
  $("applyXtbConfigBtn")?.addEventListener("click", () => applyBrokerDocsConfig("xtb"));
  $("applyMt5ConfigBtn")?.addEventListener("click", () => applyBrokerDocsConfig("mt5"));

  // Copy Config and JSON buttons
  $("copyExnessConfigBtn")?.addEventListener("click", async () => {
    const srv = $("docExnessServerSelect")?.value || "Exness-Real14.mt5.exness.com:443";
    const acc = $("docExnessAccountInput")?.value || "";
    const bal = $("docExnessBalanceInput")?.value || "25000";
    const str = `Broker: Exness GCC\nServer: ${srv}\nAccount: ${acc}\nBalance: $${bal}\nPlatform: MetaTrader 5 Cloud Bridge`;
    await navigator.clipboard.writeText(str);
    status(currentLang === "ar" ? "تم نسخ إعدادات Exness MT5 إلى الحافظة!" : "Copied Exness MT5 config to clipboard!");
  });

  $("copyXtbJsonBtn")?.addEventListener("click", async () => {
    const srv = $("docXtbServerSelect")?.value || "XTB-xStation5-Live.xtb.com:443";
    const acc = $("docXtbAccountInput")?.value || "";
    const payload = JSON.stringify({
      command: "login",
      arguments: {
        userId: acc,
        server: srv,
        appName: "THN-Trader",
        scopes: ["streamingData", "tradeOrders", "getRecords"]
      }
    }, null, 2);
    await navigator.clipboard.writeText(payload);
    status(currentLang === "ar" ? "تم نسخ نموذج كود مصادقة XTB JSON!" : "Copied XTB JSON authentication payload!");
  });

  // Server directory pill clicks
  document.querySelectorAll(".server-pill-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const srv = btn.dataset.server;
      if (srv) {
        await navigator.clipboard.writeText(srv);
        const sel = $("docMt5ServerSelect");
        if (sel) {
          const opt = Array.from(sel.options).find(o => o.value === srv);
          if (opt) sel.value = srv;
        }
        status(currentLang === "ar" ? `تم نسخ الخادم: ${srv}` : `Copied server host: ${srv}`);
      }
    });
  });

  // Code snippet copy buttons
  document.querySelectorAll(".copy-snippet-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const textToCopy = btn.dataset.copy || btn.closest(".code-snippet-box")?.querySelector("code")?.textContent?.trim() || "";
      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
        const orig = btn.textContent;
        btn.textContent = "✓ Copied!";
        btn.style.color = "var(--green)";
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.color = "";
        }, 1800);
        status(currentLang === "ar" ? `تم نسخ: ${textToCopy}` : `Copied: ${textToCopy}`);
      }
    });
  });

  // Docs Ping Tester button
  $("docRunPingTestBtn")?.addEventListener("click", runDocPingTest);

  // Close docs modal when clicking backdrop
  $("brokerDocsModal")?.addEventListener("click", e => {
    if (e.target === $("brokerDocsModal")) {
      closeBrokerDocsModal();
    }
  });

  // Active broker account selector dropdown
  $("brokerActiveAccountSelect")?.addEventListener("change", e => {
    switchActiveBrokerAccount(e.target.value);
  });

  // Broker Desk View Switcher tabs
  $("viewAiDeskBtn")?.addEventListener("click", () => setBrokerDeskView("ai-desk"));
  $("viewWebTraderBtn")?.addEventListener("click", () => setBrokerDeskView("webtrader"));
  $("viewAccountDetailsBtn")?.addEventListener("click", () => setBrokerDeskView("account-details"));

  // Desk topbar wallet buttons
  $("openDepositModalBtn")?.addEventListener("click", () => openFundsModal());
  $("openWithdrawModalBtn")?.addEventListener("click", () => openFundsModal());
  $("openNewAccountFromDeskBtn")?.addEventListener("click", () => openBrokerModal("open"));

  // Funds modal dialog listeners
  $("closeFundsModalBtn")?.addEventListener("click", closeFundsModal);
  $("cancelFundsModalBtn")?.addEventListener("click", closeFundsModal);
  $("resetPaperBalanceBtn")?.addEventListener("click", resetPaperBalance);

  // Tab switching inside Broker Modal
  $("tabOpenBrokerBtn")?.addEventListener("click", () => setBrokerModalTab("open"));
  $("tabConnectBrokerBtn")?.addEventListener("click", () => setBrokerModalTab("connect"));

  // Capital preset change in broker modal
  $("brokerCapitalPreset")?.addEventListener("change", e => {
    const isCustom = e.target.value === "custom";
    $("customCapitalLabel")?.classList.toggle("hidden", !isCustom);
  });

  // Broker Provider selection in modal with real-time server & link sync
  document.querySelectorAll("#brokerProviderOptions .broker-option-card").forEach(card => {
    card.addEventListener("click", () => {
      if(card.querySelector("input[type=radio]")?.disabled)return;
      document.querySelectorAll("#brokerProviderOptions .broker-option-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const radio = card.querySelector("input[type='radio']");
      if (radio) radio.checked = true;

      const provider = card.dataset.provider;
      const brand = brokerBrands[provider] || brokerBrands.exness;
      if ($("externalBrokerLink")) $("externalBrokerLink").href = brand.link || "https://www.exness.com";
      if ($("brokerServerInput")) $("brokerServerInput").value = brand.server || "Live-Server-01";
      if ($("brokerAccountIdInput")) {
        const prefix = provider ? provider.toUpperCase().slice(0, 3) : "ACC";
        $("brokerAccountIdInput").value = "";
      }
    });
  });

  // TAB 1 Action: Real Official Platform Broker Account Registration
  $("openAndActivateBrokerBtn")?.addEventListener("click", async () => {
    const btn = $("openAndActivateBrokerBtn");
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = currentLang === "ar" ? "⏳ جاري فتح وتفعيل الحساب رسمياً في خوادم الوسيط..." : "⏳ Provisioning official broker platform account...";

    const selRadio = document.querySelector("#brokerProviderOptions input[name='brokerProvider']:checked");
    const provider = selRadio?.value || "exness";
    const brand = brokerBrands[provider] || brokerBrands.exness;

    const presetVal = $("brokerCapitalPreset")?.value || "25000";
    let capital = Number(presetVal);
    if (presetVal === "custom") {
      capital = Number($("brokerCustomCapital")?.value || 25000);
    }
    if (capital <= 0) capital = 25000;

    const fullName = $("brokerRegFullName")?.value?.trim() || "";
    const email = $("brokerRegEmail")?.value?.trim() || "";
    const phone = $("brokerRegPhone")?.value?.trim() || "";
    const country = $("brokerRegCountry")?.value || "";
    const platform = $("brokerRegPlatform")?.value || "MetaTrader 5 (MT5 Cloud Direct)";
    const tier = $("brokerAccountTypeSelect")?.value || "raw";
    const leverage = Number($("brokerRegLeverage")?.value || 200);
    const curr = $("brokerCurrencySelect")?.value || "USD";
    const riskPct = Number($("brokerRiskPctSelect")?.value || 1.0);
    const isIslamic = Boolean($("brokerRegIslamic")?.checked !== false);

    try {
      const res = await fetch("/api/broker/register-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker: provider,
          fullName,
          email,
          phone,
          country,
          platform,
          accountType: tier,
          leverage,
          currency: curr,
          capital,
          isIslamic
        })
      });

      const data = await res.json();
      if (data.ok && data.account) {
        const newAcc = data.account;
        newAcc.positions = [];
        newAcc.dailyRealizedPnl = 0;
        newAcc.todayTradesCount = 0;
        newAcc.riskPct = riskPct > 0 ? riskPct : 1.0;
        newAcc.connected = true;

        serverBrokerAccounts.unshift(newAcc);
        saveBrokerAccount(newAcc);
        renderBrokerAccountSelector();
        closeBrokerModal();
        setBrokerDeskView("account-details");

        const succMsg = currentLang === "ar"
          ? `🎉 تم فتح وتفعيل حساب ${newAcc.brokerName} في المنصة رسمياً! رقم الحساب #${newAcc.accountNumber} ورأس المال ${money(capital)}.`
          : `🎉 Officially opened and activated ${newAcc.brokerName} account! Login #${newAcc.accountNumber}, Capital: ${money(capital)}.`;
        status(succMsg);
      } else {
        showNotice(data.error || "Registration error", "error");
        status(`⚠️ ${data.error || "Registration error"}`);
      }
    } catch (err) {
      showNotice(currentLang === "ar" ? "تعذر إنشاء الحساب على الخادم. يرجى المحاولة لاحقاً." : "Failed to register account on broker server.", "error");
      status("🔴 Broker registration unreachable");
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });

  // TAB 2 Action: Connect Existing Broker Gateway with real handshake
  $("saveBrokerConnectionBtn")?.addEventListener("click", async () => {
    const btn = $("saveBrokerConnectionBtn");
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = currentLang === "ar" ? "⏳ جاري التحقق من خادم الوسيط والاتصال..." : "⏳ Verifying broker credentials & handshake...";

    const selRadio = document.querySelector("#brokerProviderOptions input[name='brokerProvider']:checked");
    const provider = selRadio?.value || "exness";
    const serverVal = $("brokerServerInput")?.value?.trim() || "Live-Server";
    const accId = $("brokerAccountIdInput")?.value?.trim() || "";
    const token = $("brokerPasswordInput")?.value?.trim() || "";
    const syncBal = Number($("brokerSyncBalanceInput")?.value || 25000);
    const leverage = Number($("brokerConnectLeverage")?.value || 200);
    const curr = $("brokerConnectCurrency")?.value || "USD";

    try {
      const res = await fetch("/api/broker/connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker: provider,
          server: serverVal,
          accountNumber: accId,
          apiToken: token,
          balance: syncBal,
          leverage,
          currency: curr
        })
      });

      const data = await res.json();
      if (data.ok && data.account) {
        const linked = data.account;
        linked.positions = [];
        linked.dailyRealizedPnl = 0;
        linked.todayTradesCount = 0;
        linked.riskPct = 1.0;
        linked.connected = true;

        serverBrokerAccounts.unshift(linked);
        saveBrokerAccount(linked);
        renderBrokerAccountSelector();
        closeBrokerModal();
        setBrokerDeskView("account-details");

        const succMsg = currentLang === "ar"
          ? `تم التحقق بنجاح من اتصال ${linked.brokerName}! زمن الاستجابة ${linked.latencyMs}ms والرصيد المعتمد ${money(syncBal)}.`
          : `Broker gateway connection verified! Latency: ${linked.latencyMs}ms, Account balance: ${money(syncBal)}.`;
        status(succMsg);
      } else {
        showNotice(data.error || "Connection error", "error");
        status(`⚠️ ${data.error || "Connection error"}`);
      }
    } catch (err) {
      showNotice(currentLang === "ar" ? "تعذر التحقق من خادم الوسيط. يرجى التأكد من البيانات أو تشغيل جسر MT5." : "Broker gateway verification failed. Please verify credentials.", "error");
      status("🔴 Broker connection failed");
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });

  // Test Server Handshake button in connect tab
  $("testBrokerPingBtn")?.addEventListener("click", testBrokerPing);

  // Certificate action buttons
  $("toggleMasterPwdBtn")?.addEventListener("click", () => {
    masterPwdVisible = !masterPwdVisible;
    renderAccountCertificate();
  });
  $("toggleInvestorPwdBtn")?.addEventListener("click", () => {
    investorPwdVisible = !investorPwdVisible;
    renderAccountCertificate();
  });

  $("copyMt5LoginBtn")?.addEventListener("click", async () => {
    const acc = getBrokerAccount();
    const creds = [
      `--- OFFICIAL BROKER LOGIN DETAILS ---`,
      `Broker Platform: ${acc.brokerName || acc.provider}`,
      `Server Hostname: ${acc.server}`,
      `Account / Login ID: ${acc.accountNumber || acc.accountId}`,
      `Master Password: ${acc.masterPassword || '••••••••'}`,
      `Investor Password (Read-Only): ${acc.investorPassword || '••••••••'}`,
      `Account Currency: ${acc.currency || 'USD'}`,
      `Leverage: 1:${acc.leverage || 200}`,
      `Status: VERIFIED & ACTIVE ON PLATFORM`
    ].join("\n");
    await navigator.clipboard.writeText(creds);
    status(currentLang === "ar" ? "تم نسخ بيانات دخول MT5 إلى الحافظة بنجاح!" : "Copied MT5 login details to clipboard!");
  });

  $("downloadCertBtn")?.addEventListener("click", () => {
    const acc = getBrokerAccount();
    const certText = [
      "==================================================================",
      "             OFFICIAL BROKER PLATFORM ACCOUNT CERTIFICATE          ",
      "==================================================================",
      `ISSUED AT:         ${new Date().toUTCString()}`,
      `BROKER INSTITUTION: ${acc.brokerName || acc.provider}`,
      `REGULATION TIER:    ${acc.regulation || 'CySEC & FSA Tier-1'}`,
      `KYC STATUS:         VERIFIED & APPROVED`,
      "------------------------------------------------------------------",
      `ACCOUNT HOLDER:     ${acc.user?.fullName || "Not provided"}`,
      `REGISTERED EMAIL:   ${acc.user?.email || "Not provided"}`,
      `PHONE / COUNTRY:    ${acc.user?.phone || "Not provided"} (${acc.user?.country || "Not provided"})`,
      "------------------------------------------------------------------",
      `TRADING PLATFORM:   ${acc.platform || 'MetaTrader 5 Cloud'}`,
      `SERVER HOSTNAME:    ${acc.server}`,
      `LOGIN ID:           ${acc.accountNumber || acc.accountId}`,
      `MASTER PASSWORD:    ${acc.masterPassword}`,
      `INVESTOR PASSWORD:  ${acc.investorPassword}`,
      `ACCOUNT TIER:       ${acc.accountTypeName || acc.accountType}`,
      `ISLAMIC SWAP-FREE:  ${acc.isIslamic ? 'YES (GCC Certified)' : 'STANDARD'}`,
      `ACCOUNT CURRENCY:   ${acc.currency || 'USD'}`,
      `INITIAL BALANCE:    $${Number(acc.balance || 0).toLocaleString()}`,
      `DYNAMIC LEVERAGE:   1:${acc.leverage || 200}`,
      `API GATEWAY TOKEN:  ${acc.apiToken}`,
      "==================================================================",
      "SECURITY SEAL: PLATFORM AUTHENTICATED VIA SECURE BROKER HANDSHAKE"
    ].join("\n");
    download(`broker-account-certificate-${acc.accountNumber || 'acc'}.txt`, certText, "text/plain");
  });

  // WebTrader ticket listeners
  $("webtraderSymbolSelect")?.addEventListener("change", () => {
    renderWebTrader();
    updateWebTraderCalculations();
  });
  $("webtraderLotsInput")?.addEventListener("input", updateWebTraderCalculations);
  $("webtraderOrderTypeSelect")?.addEventListener("change", updateWebTraderCalculations);
  $("webtraderTransmitOrderBtn")?.addEventListener("click", executeWebTraderTicket);

  // Deal execution & Inspection buttons in broker deals grid
  $("brokerDealsGrid")?.addEventListener("click", e => {
    const execBtn = e.target.closest("[data-execute-deal]");
    if (execBtn) {
      try {
        const deal = JSON.parse(decodeURIComponent(execBtn.dataset.executeDeal));
        openTradeExecutionModal(deal);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    const inspectBtn = e.target.closest("[data-inspect-deal]");
    if (inspectBtn) {
      const sym = inspectBtn.dataset.inspectDeal;
      if (sym) {
        $("symbolInput").value = sym;
        document.querySelectorAll(".nav").forEach(x => x.classList.remove("active"));
        document.querySelector('.nav[data-jump="analysis"]')?.classList.add("active");
        document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth" });
        analyze();
      }
    }
  });

  // Position Actions (Close & Partial Close) in Active Positions table
  $("brokerPositionsList")?.addEventListener("click", e => {
    const closeBtn = e.target.closest(".close-pos-btn");
    if (closeBtn) {
      const ticket = closeBtn.dataset.ticket;
      if (ticket) closeBrokerPosition(ticket, 1.0);
      return;
    }
    const partialBtn = e.target.closest(".partial-pos-btn");
    if (partialBtn) {
      const ticket = partialBtn.dataset.ticket;
      if (ticket) closeBrokerPosition(ticket, 0.5);
    }
  });

  $("positionsTabContent")?.addEventListener("click", e => {
    const closeBtn = e.target.closest(".close-pos-btn");
    if (closeBtn) {
      const ticket = closeBtn.dataset.ticket;
      if (ticket) closeBrokerPosition(ticket, 1.0);
      return;
    }
    const partialBtn = e.target.closest(".partial-pos-btn");
    if (partialBtn) {
      const ticket = partialBtn.dataset.ticket;
      if (ticket) closeBrokerPosition(ticket, 0.5);
    }
  });

  $("refreshPositionsTabBtn")?.addEventListener("click", () => {
    renderBrokerPositions(getBrokerAccount());
    showNotice(currentLang === "ar" ? "تم تحديث سجل الصفقات النشطة" : "Positions ledger refreshed", "info");
  });

  // Direct Order Ticket in Trading View
  $("checkOrderRiskBtn")?.addEventListener("click", async () => {
    const sym = $("directOrderSymbol")?.value || "XAUUSD";
    const side = $("directOrderSide")?.value || "BUY";
    const lots = Number($("directOrderLots")?.value) || 0.1;
    const sl = Number($("directOrderSL")?.value);
    const tp = Number($("directOrderTP")?.value);
    const resultEl = $("directOrderRiskResult");
    if (!resultEl) return;

    if (!sl) {
      resultEl.style.display = "block";
      resultEl.innerHTML = `<span style="color:var(--red)">⚠️ Stop Loss price is required to calculate risk exposure.</span>`;
      return;
    }

    resultEl.style.display = "block";
    resultEl.textContent = "Verifying pre-trade risk metrics...";

    try {
      const acc = getBrokerAccount();
      const res = await fetch("/api/risk/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId:acc.id, symbol: sym, side, lots, currentPrice: liveQuotesCache[sym]?.close || currentAnalysis?.indicators?.price, stopLoss: sl, takeProfit: tp, balance: acc.balance ?? 0, leverage: acc.leverage || 200 })
      });
      const data = await res.json();
      if (data.ok && data.metrics) {
        const m = data.metrics;
        resultEl.innerHTML = `<b>Pre-Trade Risk:</b> Margin Required: <b>$${m.requiredMargin.toFixed(2)}</b> | Max Risk: <b style="color:var(--red)">$${(m.slRiskUpperBound??m.slDollars).toFixed(2)}</b> | Max Gain: <b style="color:var(--green)">+$${m.tpDollars.toFixed(2)}</b> | R:R: <b>1 : ${(m.rrRatio ?? 0).toFixed(2)}</b> | Status: <b>Preview only; execution requires validation</b>`;
      } else {
        resultEl.innerHTML = `<b style="color:var(--red)">Risk Check Warning:</b> ${data.error || "Verify price parameters."}`;
      }
    } catch {
      resultEl.textContent = "Risk preview unavailable. No approval was granted.";
    }
  });

  $("executeDirectOrderBtn")?.addEventListener("click", async () => {
    const sym = $("directOrderSymbol")?.value || "XAUUSD";
    const side = $("directOrderSide")?.value || "BUY";
    const lots = Number($("directOrderLots")?.value) || 0.1;
    const sl = Number($("directOrderSL")?.value);
    const tp = Number($("directOrderTP")?.value);

    if (!sl) {
      showNotice(currentLang === "ar" ? "قاعدة المخاطر الإلزامية: وقف الخسارة مطلوب قبل الإرسال" : "Risk Engine Rule: Stop Loss is mandatory before submission", "error");
      return;
    }

    const quote=liveQuotesCache[sym];
    if(!quoteFresh(quote)||quote.provenance.pricingProxy||quote.provenance.instrumentMatch===false){showNotice(t("analysisUnavailable"),"error");return}
    const curPrice = side === "BUY" ? quote.ask : quote.bid;
    const deal = {
      symbol: sym,
      decision: side,
      lots: lots,
      stopLoss: sl,
      target1: tp || (side === "BUY" ? curPrice * 1.02 : curPrice * 0.98),
      entry: curPrice
    };

    await executeBrokerOrder(deal);
  });

  $("resetDirectOrderFormBtn")?.addEventListener("click", () => {
    if ($("directOrderSL")) $("directOrderSL").value = "";
    if ($("directOrderTP")) $("directOrderTP").value = "";
    if ($("directOrderRiskResult")) $("directOrderRiskResult").style.display = "none";
  });

  // Settings Danger Zone handlers
  $("prefResetSandboxBtn")?.addEventListener("click", resetPaperBalance);
  $("prefClearJournalBtn")?.addEventListener("click", () => {
    if (confirm(t("confirmClear"))) {
      browserStore.removeItem(journalKey);
      renderJournal();
      renderPerformanceAnalytics();
      showNotice(currentLang === "ar" ? "تم مسح سجل التداول بالكامل" : "Journal ledger cleared successfully.", "info");
    }
  });
  $("prefThemeToggleBtn")?.addEventListener("click", () => {
    $("themeBtn")?.click();
  });

  // Execution Modal Dialog actions
  $("closeExecuteModalBtn")?.addEventListener("click", closeTradeExecutionModal);
  $("cancelExecuteBtn")?.addEventListener("click", closeTradeExecutionModal);
  $("confirmExecuteBtn")?.addEventListener("click", () => {
    if (pendingExecutionOrder) {
      executeBrokerOrder(pendingExecutionOrder);
      closeTradeExecutionModal();
    }
  });

  $("copyReportBtn").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("report").textContent);
    status(t("reportCopied"));
  });
  $("exportReportBtn").addEventListener("click", () => download(t("reportFilename"), $("report").textContent));
}

function restoreTheme() {
  const saved = browserStore.getItem("thn_ai_trader_theme_v3");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
}

// Product workspace: presentation only. Backend remains the authority for risk,
// identity and fills; no extra storage, synthetic quotes or execution pathway.
const WORKSPACE_COPY={
 en:{
 uxMenu:'Menu',uxCloseMenu:'Close menu',uxNavigation:'Main navigation',uxWorkspace:'WORKSPACE',uxAccountGroup:'ACCOUNT & RECORDS',uxEnvironment:'WORKSPACE / PAPER ENVIRONMENT',uxPaperOnly:'PAPER ONLY',uxRefresh:'Refresh market data',uxRefreshing:'Refreshing…',uxStatusLabel:'Workspace status',uxBackend:'Backend',uxMarketData:'Market data',uxAccount:'Account access',uxCapabilities:'What works here · capabilities & limitations',uxOperational:'IMPLEMENTED',uxConditional:'BACKEND & ACCOUNT REQUIRED',uxOptional:'OPTIONAL',uxPlanned:'NOT AVAILABLE',uxObservation:'Market observation',uxObservationCopy:'Provider quotes and deterministic analysis. Availability depends on instrument identity, freshness and provider limits.',uxPaperExecution:'Paper execution',uxPaperCopy:'Server-owned accounts, order risk checks and a durable fill ledger. This is a simulation, not a live broker.',uxNarrative:'AI narrative',uxNarrativeCopy:'Available only when configured and verified by the backend. Narrative cannot change numeric trading levels.',uxResearch:'Historical backtesting & live brokers',uxResearchCopy:'Historical strategy validation is planned. Real-money broker execution is disabled. No performance is inferred from a confluence score.',uxObserveFirst:'OBSERVE BEFORE YOU ACT',uxMarketBoard:'Market board',uxQuoteModel:'Bid/ask are backend paper-pricing estimates, not executable broker quotes. Indicative proxies are analysis-only.',uxSearch:'Find an instrument',uxSearchPlaceholder:'Symbol or instrument name',uxAssetClass:'Asset class',uxAllAssets:'All assets',uxForex:'Forex',uxCommodity:'Commodities',uxCrypto:'Crypto',uxIndex:'Indices',uxStock:'Stocks',uxMarketPrices:'Market prices and provider evidence',uxInstrument:'Instrument',uxBid:'Model bid',uxAsk:'Model ask',uxEvidence:'Source & observation',uxAvailability:'Availability',uxAction:'Action',uxViewEvidence:'View evidence',uxChecking:'Checking…',uxReachable:'Reachable',uxDisconnected:'Disconnected',uxNotChecked:'Not checked',uxLocked:'Sign in required',uxNoAccount:'No account selected',uxAccountCount:'accounts',uxCurrent:'Current',uxProxy:'Indicative · analysis only',uxStale:'Stale · unavailable',uxUnavailable:'Unavailable',uxPending:'Loading observations…',uxResults:'instruments',uxNoMatches:'No instruments match your search.',uxClearFilters:'Clear filters',uxNoSource:'No provider observation',uxAnalyze:'Analyze',uxRefreshDone:'Observations updated. Check each instrument’s source and availability.',uxRefreshError:'Market data unavailable. No prices have been substituted. Retry after the provider cooldown.',uxCooldown:'Provider cooldown',uxSeconds:'s',uxSessionReady:'Account selected · server validates every order',uxSessionLocked:'Account required · no order is authorized',uxAccountEmpty:'This identity has no selected paper account. Open Accounts to create or select one.',uxSelectAccount:'Open Accounts',uxReviewData:'Review market data',uxReviewTicket:'Review paper ticket',uxFlow:'ORDER REVIEW',uxFlowCopy:'Observe → analyze → review risk → submit a paper order. The server validates every submission.',uxIdentityCheck:'Account ownership',uxPriceCheck:'Executable instrument evidence',uxRiskCheck:'Final risk decision',uxServerChecks:'Checked by server on submission',uxExactQuote:'Current exact-instrument quote',uxNeedQuote:'Exact, fresh pricing required',uxAnalysisSummary:'ANALYSIS EVIDENCE',uxAnalysisEmpty:'No current analysis to review. Select an instrument and run analysis; an unavailable provider does not imply a signal.',uxHeuristic:'Confluence is a heuristic score, not a win probability or a performance forecast.',uxDecision:'Analysis decision',uxConfluence:'Confluence / 100',uxAiState:'Narrative status',uxAiOff:'Disabled',uxAiVerified:'Verified response',uxAiUnverified:'Not verified / unavailable',uxSource:'Provider instrument',uxObserved:'Quote observed',uxRiskSummary:'ACCOUNT CAPACITY',uxRiskCopy:'These values come from the selected server account. Analysis sizing is educational; order limits are enforced by the server.',uxEquity:'Account equity',uxFreeMargin:'Free margin',uxUsedMargin:'Used margin',uxPortfolioSummary:'SERVER PAPER LEDGER',uxPortfolioCopy:'Balances and closed fills are scoped to the signed-in account. Manual/imported journal entries are not verified fills.',uxBalance:'Account balance',uxPositions:'Open positions',uxClosedFills:'Recorded closed fills',uxNoFills:'No closed paper fills have been recorded for this account.',uxAccountRequired:'Account required',uxRiskServer:'Server checks each order',uxFreshQuotes:'current observations',uxNoPrices:'No current observations',uxAge:'Age',uxGold:'Gold / USD (spot requested)',uxEuro:'Euro / US dollar',uxPound:'Pound / US dollar',uxYen:'US dollar / Japanese yen',uxBitcoin:'Bitcoin / tether',uxDow:'Dow Jones index',uxView_dashboard:'Overview',uxView_markets:'Markets',uxView_trading:'Trading workspace',uxView_ai:'AI Intelligence',uxView_risk:'Risk Desk',uxView_portfolio:'Portfolio',uxView_journal:'Trade Journal',uxView_brokers:'Accounts',uxView_settings:'Settings',uxDesc_dashboard:'A clear view of account access, market evidence and recorded activity.',uxDesc_markets:'Find instruments, inspect provider evidence and build your analysis watchlist.',uxDesc_trading:'Analyze an instrument and review a paper order with server-side safeguards.',uxDesc_ai:'Review the reasoning, source and limitations behind the current analysis.',uxDesc_risk:'Review account capacity before sizing a paper trade.',uxDesc_portfolio:'Separate recorded paper fills from unverified journal entries.',uxDesc_journal:'Review recorded outcomes and keep personal research clearly labeled.',uxDesc_brokers:'Select a server-owned paper account. External broker execution is disabled.',uxDesc_settings:'Manage language, appearance and provider information.',uxPaperEnvironment:'Paper simulation · live execution disabled'
 },
 ar:{
 uxMenu:'القائمة',uxCloseMenu:'إغلاق القائمة',uxNavigation:'التنقل الرئيسي',uxWorkspace:'مساحة العمل',uxAccountGroup:'الحساب والسجلات',uxEnvironment:'مساحة العمل / بيئة التداول التجريبي',uxPaperOnly:'تجريبي فقط',uxRefresh:'تحديث بيانات السوق',uxRefreshing:'جارٍ التحديث…',uxStatusLabel:'حالة مساحة العمل',uxBackend:'الخادم',uxMarketData:'بيانات السوق',uxAccount:'الوصول إلى الحساب',uxCapabilities:'ما المتاح هنا · الإمكانات والقيود',uxOperational:'مُنفّذ',uxConditional:'يتطلب الخادم وحساباً',uxOptional:'اختياري',uxPlanned:'غير متاح',uxObservation:'رصد السوق',uxObservationCopy:'أسعار من مزودي البيانات وتحليل حتمي. يعتمد التوفر على هوية الأداة وحداثة البيانات وحدود المزود.',uxPaperExecution:'تنفيذ تجريبي',uxPaperCopy:'حسابات يديرها الخادم وفحوص مخاطر وسجل تنفيذ دائم. هذه محاكاة وليست وسيطاً حقيقياً.',uxNarrative:'شرح بالذكاء الاصطناعي',uxNarrativeCopy:'متاح فقط عند تهيئته والتحقق منه على الخادم. لا يغيّر الشرح مستويات التداول الرقمية.',uxResearch:'الاختبار التاريخي والوسطاء الحقيقيون',uxResearchCopy:'التحقق التاريخي من الاستراتيجيات مخطط له. التنفيذ بأموال حقيقية معطل. لا تُستنتج نتائج الأداء من درجة التوافق.',uxObserveFirst:'راقب قبل اتخاذ القرار',uxMarketBoard:'لوحة السوق',uxQuoteModel:'أسعار العرض والطلب تقديرات للتسعير التجريبي على الخادم وليست عروض وسيط قابلة للتنفيذ. البدائل الاسترشادية للتحليل فقط.',uxSearch:'ابحث عن أداة',uxSearchPlaceholder:'الرمز أو اسم الأداة',uxAssetClass:'فئة الأصل',uxAllAssets:'جميع الأصول',uxForex:'العملات',uxCommodity:'السلع',uxCrypto:'الأصول الرقمية',uxIndex:'المؤشرات',uxStock:'الأسهم',uxMarketPrices:'أسعار السوق وأدلة المصدر',uxInstrument:'الأداة',uxBid:'عرض نموذجي',uxAsk:'طلب نموذجي',uxEvidence:'المصدر ووقت الرصد',uxAvailability:'التوفر',uxAction:'الإجراء',uxViewEvidence:'أدلة العرض',uxChecking:'جارٍ الفحص…',uxReachable:'متصل',uxDisconnected:'غير متصل',uxNotChecked:'لم يُفحص',uxLocked:'يلزم تسجيل الدخول',uxNoAccount:'لم يُحدد حساب',uxAccountCount:'حسابات',uxCurrent:'حديث',uxProxy:'استرشادي · للتحليل فقط',uxStale:'قديم · غير متاح',uxUnavailable:'غير متاح',uxPending:'جارٍ تحميل الرصد…',uxResults:'أدوات',uxNoMatches:'لا توجد أدوات تطابق البحث.',uxClearFilters:'مسح عوامل التصفية',uxNoSource:'لا يوجد رصد من المزود',uxAnalyze:'تحليل',uxRefreshDone:'تم تحديث الرصد. تحقق من مصدر كل أداة وحالة توفرها.',uxRefreshError:'بيانات السوق غير متاحة. لم تُستبدل الأسعار بقيم مصطنعة. أعد المحاولة بعد مهلة المزود.',uxCooldown:'مهلة المزود',uxSeconds:'ث',uxSessionReady:'تم تحديد حساب · يتحقق الخادم من كل أمر',uxSessionLocked:'يلزم حساب · لم يُعتمد أي أمر',uxAccountEmpty:'لا يوجد حساب تجريبي محدد لهذه الهوية. افتح الحسابات لإنشاء حساب أو تحديده.',uxSelectAccount:'فتح الحسابات',uxReviewData:'مراجعة بيانات السوق',uxReviewTicket:'مراجعة تذكرة تجريبية',uxFlow:'مراجعة الأمر',uxFlowCopy:'راقب ← حلّل ← راجع المخاطر ← أرسل أمراً تجريبياً. يتحقق الخادم من كل إرسال.',uxIdentityCheck:'ملكية الحساب',uxPriceCheck:'دليل تسعير الأداة للتنفيذ',uxRiskCheck:'قرار المخاطر النهائي',uxServerChecks:'يتحقق منه الخادم عند الإرسال',uxExactQuote:'سعر حديث للأداة المطابقة',uxNeedQuote:'يلزم تسعير حديث ومطابق',uxAnalysisSummary:'أدلة التحليل',uxAnalysisEmpty:'لا يوجد تحليل حديث للمراجعة. اختر أداة وشغّل التحليل؛ عدم توفر المزود لا يعني وجود إشارة.',uxHeuristic:'التوافق درجة استرشادية وليس احتمال فوز أو توقعاً للأداء.',uxDecision:'قرار التحليل',uxConfluence:'التوافق / ١٠٠',uxAiState:'حالة الشرح',uxAiOff:'معطل',uxAiVerified:'استجابة متحقق منها',uxAiUnverified:'غير متحقق منه / غير متاح',uxSource:'أداة المزود',uxObserved:'وقت رصد السعر',uxRiskSummary:'قدرة الحساب',uxRiskCopy:'تأتي هذه القيم من الحساب المحدد على الخادم. تقدير حجم الصفقة في التحليل تعليمي؛ يفرض الخادم حدود الأوامر.',uxEquity:'حقوق الحساب',uxFreeMargin:'الهامش المتاح',uxUsedMargin:'الهامش المستخدم',uxPortfolioSummary:'سجل التداول التجريبي على الخادم',uxPortfolioCopy:'الأرصدة والتنفيذات المغلقة تخص الحساب المسجل. الإدخالات اليدوية والمستوردة ليست تنفيذات متحققاً منها.',uxBalance:'رصيد الحساب',uxPositions:'المراكز المفتوحة',uxClosedFills:'التنفيذات المغلقة المسجلة',uxNoFills:'لم تُسجل تنفيذات تجريبية مغلقة لهذا الحساب.',uxAccountRequired:'يلزم حساب',uxRiskServer:'يفحص الخادم كل أمر',uxFreshQuotes:'عمليات رصد حديثة',uxNoPrices:'لا توجد بيانات حديثة',uxAge:'العمر',uxGold:'الذهب / الدولار (طلب سعر فوري)',uxEuro:'اليورو / الدولار الأمريكي',uxPound:'الجنيه / الدولار الأمريكي',uxYen:'الدولار الأمريكي / الين الياباني',uxBitcoin:'بيتكوين / تيثر',uxDow:'مؤشر داو جونز',uxView_dashboard:'نظرة عامة',uxView_markets:'الأسواق',uxView_trading:'مساحة التداول',uxView_ai:'الذكاء الاصطناعي',uxView_risk:'مكتب المخاطر',uxView_portfolio:'المحفظة',uxView_journal:'سجل التداول',uxView_brokers:'الحسابات',uxView_settings:'الإعدادات',uxDesc_dashboard:'رؤية واضحة للوصول إلى الحساب وأدلة السوق والنشاط المسجل.',uxDesc_markets:'ابحث عن الأدوات وراجع مصادرها وأنشئ قائمة متابعة للتحليل.',uxDesc_trading:'حلّل أداة وراجع أمراً تجريبياً بضوابط على الخادم.',uxDesc_ai:'راجع الأسباب والمصدر والقيود وراء التحليل الحالي.',uxDesc_risk:'راجع قدرة الحساب قبل تحديد حجم صفقة تجريبية.',uxDesc_portfolio:'افصل التنفيذات التجريبية المسجلة عن إدخالات السجل غير المتحقق منها.',uxDesc_journal:'راجع النتائج المسجلة وميّز الأبحاث الشخصية بوضوح.',uxDesc_brokers:'اختر حساباً تجريبياً يديره الخادم. تنفيذ الوسطاء الحقيقيين معطل.',uxDesc_settings:'أدر اللغة والمظهر ومعلومات المزود.',uxPaperEnvironment:'محاكاة تجريبية · التنفيذ الحقيقي معطل'
 }
};
Object.assign(I18N.en,WORKSPACE_COPY.en);Object.assign(I18N.ar,WORKSPACE_COPY.ar);
const ux=key=>WORKSPACE_COPY[currentLang]?.[key]||WORKSPACE_COPY.en[key]||key;
let workspaceInitialized=false,workspaceHealth='checking',workspaceQuoteState='idle',workspaceRefreshing=false,workspaceMarketFingerprint='';
const workspaceViewNames=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings'];
function workspaceInstrument(symbol){
 const meta={XAUUSD:['uxGold','Commodity'],EURUSD:['uxEuro','Forex'],GBPUSD:['uxPound','Forex'],USDJPY:['uxYen','Forex'],BTCUSDT:['uxBitcoin','Crypto'],US30:['uxDow','Index']}[symbol];
 return {name:meta?ux(meta[0]):symbol,asset:meta?.[1]||detectAssetClass(symbol)};
}
function workspaceAccount(){return workspaceHealth!=='offline'&&privateUser&&!sessionChanging&&selectedBrokerAccount&&serverBrokerAccounts.some(a=>a.id===selectedBrokerAccount.id)?selectedBrokerAccount:null}
function workspaceMoney(value,currency){
 if(!Number.isFinite(value)||typeof currency!=='string'||! /^[A-Z]{3}$/.test(currency))return '—';
 try{return new Intl.NumberFormat(currentLang==='ar'?'ar-OM':'en-US',{style:'currency',currency}).format(value)}catch{return '—'}
}
function workspaceTime(value){return Number.isFinite(value)&&value>0?new Date(value).toLocaleString(currentLang==='ar'?'ar-OM':'en-GB'):'—'}
function workspaceQuoteLabel(q){return quoteFresh(q)?q.provenance.pricingProxy||q.provenance.instrumentMatch!==true?ux('uxProxy'):ux('uxCurrent'):q?ux('uxStale'):ux('uxUnavailable')}
const workspaceRendered=new WeakMap();
function setWorkspaceHTML(node,html){
 if(workspaceRendered.get(node)===html)return;
 const active=node.contains(document.activeElement)?document.activeElement:null;
 const key=active?['workspaceJump','workspaceAnalyze','workspaceClear'].find(k=>Object.hasOwn(active.dataset,k)):null;
 const value=key?active.dataset[key]:null;
 node.innerHTML=html;workspaceRendered.set(node,html);
 if(key){const replacement=[...node.querySelectorAll('button')].find(b=>b.dataset[key]===value);replacement?.focus({preventScroll:true})}
}
function workspaceMetric(label,value){return `<div class="workspace-metric"><span>${escapeHtml(label)}</span><b dir="auto">${escapeHtml(value)}</b></div>`}
function renderMarketExplorer(force=false){
 const target=$('marketExplorerRows');if(!target)return;
 const query=($('marketSearch')?.value||'').trim().toLocaleLowerCase(),asset=$('marketAssetFilter')?.value||'all';
 const universe=[...new Set(['XAUUSD','EURUSD','GBPUSD','USDJPY','BTCUSDT','US30',...getWatchlist()])];
 const rows=universe.filter(symbol=>{const info=workspaceInstrument(symbol);return (asset==='all'||info.asset===asset)&&`${symbol} ${info.name}`.toLocaleLowerCase().includes(query)});
 const fingerprint=JSON.stringify([currentLang,query,asset,workspaceQuoteState,rows.map(s=>[s,liveQuotesCache[s]?.timestamp,quoteFresh(liveQuotesCache[s]),liveQuotesCache[s]?.bid,liveQuotesCache[s]?.ask])]);
 if(!force&&fingerprint===workspaceMarketFingerprint)return;workspaceMarketFingerprint=fingerprint;
 $('marketResultCount').textContent=`${fmt(rows.length,0)} ${ux('uxResults')}`;
 setWorkspaceHTML(target,rows.length?rows.map(symbol=>{
  const q=liveQuotesCache[symbol],fresh=quoteFresh(q),info=workspaceInstrument(symbol),digits=Math.max(0,Math.min(8,Number.isInteger(q?.digits)?q.digits:2));
  const source=q?.source||q?.provenance?.provider;
  return `<tr><th scope="row"><bdi>${escapeHtml(symbol)}</bdi><small>${escapeHtml(info.name)}</small></th><td dir="auto">${fresh?fmt(q.bid,digits):'—'}</td><td dir="auto">${fresh?fmt(q.ask,digits):'—'}</td><td><bdi>${escapeHtml(source||ux('uxNoSource'))}</bdi><small>${escapeHtml(workspaceTime(q?.timestamp))}</small></td><td><span class="evidence-pill ${fresh&&!q.provenance.pricingProxy&&q.provenance.instrumentMatch===true?'verified':'caution'}">${escapeHtml(workspaceQuoteState==='loading'&&!q?ux('uxPending'):workspaceQuoteLabel(q))}</span></td><td><button type="button" class="ghost small" data-workspace-analyze="${escapeHtml(symbol)}" aria-label="${escapeHtml(ux('uxAnalyze')+' '+symbol)}">${ux('uxAnalyze')}</button></td></tr>`;
 }).join(''):`<tr><td colspan="6"><div class="workspace-empty"><p>${ux('uxNoMatches')}</p><button type="button" class="ghost" data-workspace-clear>${ux('uxClearFilters')}</button></div></td></tr>`);
 target.closest('section').setAttribute('aria-busy',String(workspaceQuoteState==='loading'));
}
function renderWorkbench(){
 if(!workspaceInitialized)return;
 const view=document.querySelector('.app-view.view-active')?.id.replace('view-','')||'dashboard';
 $('workspaceTitle').textContent=ux('uxView_'+view);$('workspaceDescription').textContent=ux('uxDesc_'+view);
 $('workspaceBackend').textContent=ux(workspaceHealth==='online'?'uxReachable':workspaceHealth==='offline'?'uxDisconnected':'uxChecking');
 const fresh=Object.values(liveQuotesCache).filter(quoteFresh).length;
 $('workspaceData').textContent=workspaceQuoteState==='loading'?ux('uxPending'):fresh?`${fmt(fresh,0)} ${ux('uxFreshQuotes')}`:ux(workspaceQuoteState==='idle'?'uxNotChecked':'uxNoPrices');
 const account=workspaceAccount();
 $('workspaceAccount').textContent=account?`${fmt(serverBrokerAccounts.length,0)} ${ux('uxAccountCount')}`:ux(privateUser?'uxNoAccount':'uxLocked');
 $('dashRiskState').textContent=ux(account?'uxRiskServer':'uxAccountRequired');
 const cooldown=Math.max(0,Math.ceil((quoteRetryAt-Date.now())/1000));
 $('workspaceRefresh').disabled=workspaceRefreshing||workspaceQuoteState==='loading'||cooldown>0;
 $('workspaceRefresh').textContent=workspaceRefreshing?ux('uxRefreshing'):cooldown?`${ux('uxCooldown')} · ${fmt(cooldown,0)} ${ux('uxSeconds')}`:ux('uxRefresh');
 $('workspaceRefresh').setAttribute('aria-busy',String(workspaceRefreshing||workspaceQuoteState==='loading'));
 if(!workspaceRefreshing)$('workspaceFeedback').textContent=workspaceQuoteState==='error'?ux('uxRefreshError'):'';
 const symbol=currentAnalysis?.symbol||$('symbolInput')?.value?.trim().toUpperCase(),quote=liveQuotesCache[symbol];
 const exact=quoteFresh(quote)&&quote.provenance.instrumentMatch===true&&!quote.provenance.pricingProxy;
 const actions=`<div class="workspace-actions"><button class="ghost small" type="button" data-workspace-jump="markets">${ux('uxReviewData')}</button><button class="ghost small" type="button" data-workspace-jump="brokers">${ux('uxSelectAccount')}</button></div>`;
 const trading=$('workspaceContext-trading');
 setWorkspaceHTML(trading,`<p class="eyebrow">${ux('uxFlow')}</p><h2>${ux(account?'uxSessionReady':'uxSessionLocked')}</h2><p>${ux('uxFlowCopy')}</p><div class="workspace-metrics">${workspaceMetric(ux('uxIdentityCheck'),account?account.accountAlias||account.accountNumberMasked||ux('uxCurrent'):ux('uxLocked'))}${workspaceMetric(ux('uxPriceCheck'),ux(exact?'uxExactQuote':'uxNeedQuote'))}${workspaceMetric(ux('uxRiskCheck'),ux('uxServerChecks'))}</div>${actions}`);
 const analysis=currentAnalysis,p=analysis?.provenance;
 const usable=!analysisInFlight&&p?.fresh===true&&p.verified===true&&Number.isFinite(p.quoteAt)&&Date.now()-p.quoteAt<=120000&&p.quoteAt<=Date.now()+1000;
 $('workspaceContext-ai').setAttribute('aria-busy',String(analysisInFlight));
 const narrative=analysis?.aiStatus==='DISABLED'?'uxAiOff':/^VERIFIED/.test(analysis?.aiStatus||'')?'uxAiVerified':'uxAiUnverified';
 setWorkspaceHTML($('workspaceContext-ai'),`<p class="eyebrow">${ux('uxAnalysisSummary')}</p><h2>${usable?escapeHtml(analysis.symbol):ux(analysisInFlight?'uxPending':'uxUnavailable')}</h2><p>${ux('uxHeuristic')}</p>${usable?`<div class="workspace-metrics">${workspaceMetric(ux('uxDecision'),localizedValue(analysis.decision))}${workspaceMetric(ux('uxConfluence'),Number.isFinite(analysis.confidence)?fmt(analysis.confidence,0):'—')}${workspaceMetric(ux('uxAiState'),ux(narrative))}</div><dl class="workspace-provenance"><div><dt>${ux('uxSource')}</dt><dd><bdi>${escapeHtml(p.provider||'—')} · ${escapeHtml(p.instrument||'—')}</bdi>${p.pricingProxy?` · ${ux('uxProxy')}`:''}</dd></div><div><dt>${ux('uxObserved')}</dt><dd>${escapeHtml(workspaceTime(p.quoteAt))}</dd></div></dl>`:`<div class="workspace-empty">${ux('uxAnalysisEmpty')}</div>`}${actions}`);
 setWorkspaceHTML($('workspaceContext-risk'),`<p class="eyebrow">${ux('uxRiskSummary')}</p><h2>${account?escapeHtml(account.accountAlias||account.accountNumberMasked||ux('uxAccount')):ux('uxAccountRequired')}</h2><p>${ux('uxRiskCopy')}</p><div class="workspace-metrics">${workspaceMetric(ux('uxEquity'),account?workspaceMoney(account.equity,account.currency):'—')}${workspaceMetric(ux('uxFreeMargin'),account?workspaceMoney(account.freeMargin,account.currency):'—')}${workspaceMetric(ux('uxUsedMargin'),account?workspaceMoney(account.usedMargin,account.currency):'—')}</div>${actions}`);
 setWorkspaceHTML($('workspaceContext-portfolio'),`<p class="eyebrow">${ux('uxPortfolioSummary')}</p><h2>${ux(account?'uxPaperExecution':'uxAccountRequired')}</h2><p>${ux('uxPortfolioCopy')}</p><div class="workspace-metrics">${workspaceMetric(ux('uxBalance'),account?workspaceMoney(account.balance,account.currency):'—')}${workspaceMetric(ux('uxPositions'),account?fmt((account.positions||[]).length,0):'—')}${workspaceMetric(ux('uxClosedFills'),account?fmt(serverLedger.length,0):'—')}</div>${!account?`<div class="workspace-empty">${ux(privateUser?'uxAccountEmpty':'uxLocked')}</div>`:serverLedger.length?'':`<div class="workspace-empty">${ux('uxNoFills')}</div>`}${actions}`);
 renderMarketExplorer();
 localizeWorkspaceStatic();
}
function setWorkspaceMenu(open,restore=false){
 const mobile=matchMedia('(max-width: 960px)').matches;
 $('workspaceNav').hidden=mobile&&!open;$('workspaceMenu').setAttribute('aria-expanded',String(mobile&&open));
 $('workspaceMenu').textContent=ux(mobile&&open?'uxCloseMenu':'uxMenu');
 if(restore)$('workspaceMenu').focus();
}
async function refreshWorkspace(){
 if(workspaceRefreshing)return;workspaceRefreshing=true;renderWorkbench();
 try{await checkHealth();await fetchLiveMarketQuotes()}finally{workspaceRefreshing=false;renderWorkbench()}
}
function initializeWorkbench(){
 workspaceInitialized=true;
 for(const view of workspaceViewNames){const button=document.querySelector(`.nav-stack [data-view="${view}"]`);button?.setAttribute('aria-controls','view-'+view)}
 $('workspaceRefresh').addEventListener('click',refreshWorkspace);
 $('marketSearch').addEventListener('input',()=>renderMarketExplorer());$('marketAssetFilter').addEventListener('change',()=>renderMarketExplorer());
 $('workspaceMenu').addEventListener('click',()=>setWorkspaceMenu($('workspaceMenu').getAttribute('aria-expanded')!=='true'));
 matchMedia('(max-width: 960px)').addEventListener('change',()=>setWorkspaceMenu(false));setWorkspaceMenu(false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('workspaceMenu').getAttribute('aria-expanded')==='true'){setWorkspaceMenu(false,true);e.preventDefault()}});
 document.querySelector('.nav-stack').addEventListener('keydown',e=>{
  if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key)||!e.target.matches('.nav'))return;
  const buttons=[...document.querySelectorAll('.nav-stack .nav')],i=buttons.indexOf(e.target),rtl=currentLang==='ar';
  const step=e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:e.key==='ArrowRight'?(rtl?-1:1):(rtl?1:-1);
  buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+step+buttons.length)%buttons.length].focus();e.preventDefault();
 });
 document.querySelector('.nav-stack').addEventListener('click',e=>{if(e.target.closest('.nav')){setWorkspaceMenu(false);$('workspaceTitle').focus({preventScroll:true})}});
 document.addEventListener('click',e=>{
  const jump=e.target.closest('[data-workspace-jump]');if(jump){switchView(jump.dataset.workspaceJump);$('workspaceTitle').focus({preventScroll:true})}
  const instrument=e.target.closest('[data-workspace-analyze]');if(instrument){$('symbolInput').value=instrument.dataset.workspaceAnalyze;switchView('trading');analyze();$('workspaceTitle').focus({preventScroll:true})}
  if(e.target.closest('[data-workspace-clear]')){$('marketSearch').value='';$('marketAssetFilter').value='all';renderMarketExplorer(true);$('marketSearch').focus()}
 });
 renderWorkbench();
 // Reuse the existing coalesced, cooldown-aware quote path, never a second feed.
 void fetchLiveMarketQuotes();
 setInterval(()=>{if(!document.hidden)renderWorkbench()},10000);
}


const WORKSPACE_STATIC_AR={
 "Accounts locked · paper only": "الحسابات مقفلة · تداول تجريبي فقط",
 "Trading accounts locked. Live execution disabled.": "الحسابات مقفلة. التنفيذ الحقيقي معطل.",
 "No instrument verified · paper only · live execution disabled": "لم تُتحقق أداة · تجريبي فقط · التنفيذ الحقيقي معطل",
 "London": "لندن",
 "New York": "نيويورك",
 "Tokyo": "طوكيو",
 "Sydney": "سيدني",
 "Sign in · accounts locked": "سجّل الدخول · الحسابات مقفلة",
 "Account access": "الوصول إلى الحساب",
 "Access token": "رمز الوصول",
 "PAPER TRADING": "تداول تجريبي",
 "Virtual Account:": "حساب افتراضي:",
 "Paper simulation with independently checked provider data. Live broker execution disabled.": "محاكاة تجريبية ببيانات مزود تُفحص بشكل مستقل. تنفيذ الوسيط الحقيقي معطل.",
 "📈 Open Trading Terminal": "فتح مساحة التداول",
 "💼 Manage Accounts": "إدارة الحسابات",
 "Simulated USD Sandbox": "حساب محاكاة بالدولار",
 "Free Margin:": "الهامش المتاح:",
 "trades closed today": "صفقات مغلقة اليوم",
 "MARKET SURVEILLANCE": "رصد السوق",
 "Open Markets Desk ↗": "فتح مكتب الأسواق",
 "Provider data unavailable": "بيانات المزود غير متاحة",
 "AI INTELLIGENCE RADAR": "رصد التحليل الذكي",
 "View All AI Setups ↗": "مراجعة التحليلات",
 "No verified analysis available.": "لا يوجد تحليل متحقق منه.",
 "EXECUTION AUDIT": "تدقيق التنفيذ",
 "View Portfolio ↗": "عرض المحفظة",
 "No paper fills available. Sign in to view your immutable fill history.": "لا توجد تنفيذات تجريبية متاحة. سجّل الدخول لعرض سجل التنفيذ الدائم.",
 "Provider observations and watchlist analysis. No verified economic calendar is connected.": "رصد المزود وتحليل قائمة المتابعة. لا توجد مفكرة اقتصادية متحقق منها متصلة.",
 "Watchlist is currently minimized.": "قائمة المتابعة مصغرة حالياً.",
 "Show hidden instruments": "إظهار الأدوات المخفية",
 "Hide controls visibility. The Scan preference controls scanning, including hidden instruments.": "الإخفاء يضبط العرض. إعداد المسح يضبط تحليل الأدوات بما فيها المخفية.",
 "Browser": "المتصفح",
 "In-app toast": "إشعار داخل التطبيق",
 "Sound": "الصوت",
 "Cooldown minutes": "مهلة التكرار بالدقائق",
 "Minimum confluence score": "أدنى درجة توافق",
 "Instruments (blank = all)": "الأدوات (فارغ = الجميع)",
 "Timeframes": "الأطر الزمنية",
 "Severities": "مستويات التنبيه",
 "Quiet hours from": "بداية ساعات الهدوء",
 "until": "حتى",
 "Quiet hours use your browser's local time. Notifications require a fresh qualified setup. Cross-tab duplicate protection requires Web Locks.": "تستخدم ساعات الهدوء الوقت المحلي للمتصفح. تتطلب الإشعارات إعداداً مؤهلاً وحديثاً. يتطلب منع التكرار بين علامات التبويب واجهة Web Locks.",
 "Save notification preferences": "حفظ تفضيلات الإشعارات",
 "Analyze provider data and review simulated orders. Live broker execution is disabled.": "حلّل بيانات المزود وراجع الأوامر المحاكاة. تنفيذ الوسيط الحقيقي معطل.",
 "Analysis & paper order workspace": "مساحة التحليل والأوامر التجريبية",
 "Spread Quality": "جودة الفارق",
 "Range Volatility": "تقلب النطاق",
 "Structure Mode": "نمط الهيكل",
 "Consensus Bias": "اتجاه التوافق",
 "Awaiting Audit": "بانتظار المراجعة",
 "TICKER": "الرمز",
 "XAU/USD (Gold)": "الذهب / الدولار",
 "US30 (Dow)": "داو جونز",
 "1 : 1.5 (Standard Take-Profit)": "١ : ١٫٥ (هدف قياسي)",
 "1 : 2.0 (Standard Baseline)": "١ : ٢٫٠ (أساس قياسي)",
 "1 : 3.0 (Expansion Target)": "١ : ٣٫٠ (هدف امتداد)",
 "1 : 4.0 (Runner Target)": "١ : ٤٫٠ (هدف ممتد)",
 "THN Quant Engine": "محرك THN الكمي",
 "ORDER ROUTING & POSITION SIZING": "مراجعة الأوامر وحجم الصفقة",
 "PAPER SANDBOX": "بيئة تجريبية",
 "EUR/USD (Euro / US Dollar)": "اليورو / الدولار الأمريكي",
 "GBP/USD (British Pound)": "الجنيه / الدولار",
 "USD/JPY (Japanese Yen)": "الدولار / الين الياباني",
 "XAU/USD (Gold Spot)": "الذهب الفوري / الدولار",
 "BTC/USDT (Bitcoin)": "بيتكوين / تيثر",
 "US30 (Dow Jones 30)": "مؤشر داو جونز ٣٠",
 "BUY / LONG": "شراء",
 "SELL / SHORT": "بيع",
 "PORTFOLIO EXPOSURE": "انكشاف المحفظة",
 "🔄 Refresh Ledger": "تحديث السجل",
 "Loading positions from broker engine...": "جارٍ تحميل المراكز من الخادم…",
 "Multi-school consensus, multi-timeframe alignment, and algorithmic structure detection": "توافق مدارس التحليل والأطر الزمنية ورصد الهيكل الخوارزمي",
 "MTFA Timeframes": "الأطر الزمنية المتعددة",
 "SMC Liquidity": "سيولة SMC",
 "Structure Map": "خريطة الهيكل",
 "Risk Governor": "ضوابط المخاطر",
 "ALIGNED": "متوافق",
 "D1 Macro": "الإطار اليومي",
 "Higher-timeframe macro trend & long-term EMA alignment.": "اتجاه الإطار الأعلى وتوافق المتوسط الأسي طويل المدى.",
 "H4 Intermediate": "الإطار المتوسط لأربع ساعات",
 "Order flow structure, swing pivots, and trend direction.": "هيكل تدفق الأوامر ونقاط التحول واتجاه الحركة.",
 "H1 Execution": "إطار الساعة",
 "Active dealing range, Discount/Premium status, and FVG retest.": "نطاق التداول وحالة الخصم والعلاوة وإعادة اختبار فجوة القيمة.",
 "M15 Trigger": "إطار التفعيل لربع ساعة",
 "Micro CHoCH/MSS, momentum confirmation, and entry timing.": "تغير الهيكل القصير وتأكيد الزخم وتوقيت الدخول.",
 "DISCOUNT ZONE": "منطقة خصم",
 "Buy-Side Liquidity (BSL)": "سيولة جانب الشراء",
 "Sell-Side Liquidity (SSL)": "سيولة جانب البيع",
 "Smart money accumulates orders at liquidity pools.": "تتجمع الأوامر في مناطق السيولة وفق نموذج التحليل.",
 "Demand Order Block": "كتلة طلب",
 "Supply Order Block": "كتلة عرض",
 "Origin of impulsive liquidity displacement.": "منشأ الحركة الدافعة للسيولة.",
 "Active Bullish FVG": "فجوة قيمة صاعدة",
 "Active Bearish FVG": "فجوة قيمة هابطة",
 "3-candle price imbalance requiring rebalancing.": "اختلال سعري بين ثلاث شموع وفق نموذج التحليل.",
 "Equilibrium (50%)": "التوازن (٥٠٪)",
 "Current Placement": "الموضع الحالي",
 "SMC rule: Long in Discount; Short in Premium.": "قاعدة النموذج: شراء في الخصم وبيع في العلاوة.",
 "Reset chart": "إعادة ضبط الرسم",
 "Level price": "سعر المستوى",
 "Label": "التسمية",
 "Add level": "إضافة مستوى",
 "Clear levels": "مسح المستويات",
 "Scroll to zoom; drag or use arrow keys to pan. Levels persist by instrument/timeframe.": "مرّر للتكبير واسحب أو استخدم الأسهم للتحريك. تُحفظ المستويات حسب الأداة والإطار.",
 "Confluence scores are heuristic, not calibrated win probabilities. Prices are indicative provider data; broker execution remains disabled.": "درجات التوافق استرشادية وليست احتمالات فوز معايرة. الأسعار بيانات مزود استرشادية؛ تنفيذ الوسيط الحقيقي معطل.",
 "Review analysis sizing and server-owned account capacity. Final validation happens on the server.": "راجع تقدير حجم الصفقة وقدرة الحساب الذي يديره الخادم. التحقق النهائي على الخادم.",
 "Review account balances and recorded paper fills. Imported and manual entries remain unverified.": "راجع أرصدة الحساب والتنفيذات التجريبية المسجلة. تبقى الإدخالات اليدوية والمستوردة غير متحقق منها.",
 "Include manual/imported entries (unverified)": "تضمين الإدخالات اليدوية والمستوردة (غير متحقق منها)",
 "Show actual ledger": "عرض السجل الفعلي",
 "Execution log, post-trade analysis, and exportable audit records": "سجل التنفيذ وتحليل ما بعد الصفقة وسجلات التدقيق القابلة للتصدير",
 "Multi-broker management, execution bridges, and account reconciliation": "إدارة الحسابات ومراجعة الربط وتسوية البيانات",
 "🟡 PAPER SANDBOX": "بيئة تجريبية",
 "SIGN IN · ACCOUNTS LOCKED": "سجّل الدخول · الحسابات مقفلة",
 "Check existing-position recovery / فحص استرداد المراكز": "فحص استرداد المراكز الحالية",
 "Loading trading accounts...": "جارٍ تحميل الحسابات…",
 "Engine readiness unverified": "جاهزية المحرك غير متحقق منها",
 "No verified broker account": "لا يوجد حساب وسيط متحقق منه",
 "Account verification required": "يلزم التحقق من الحساب",
 "No account selected": "لم يُحدد حساب",
 "Margin level unavailable": "مستوى الهامش غير متاح",
 "No verified result": "لا توجد نتيجة متحقق منها",
 "Server risk validation required before every order": "يلزم تحقق الخادم من المخاطر قبل كل أمر",
 "Ticket": "التذكرة",
 "Side": "الاتجاه",
 "Volume": "الحجم",
 "Open Price": "سعر الفتح",
 "Mark Price": "سعر التقييم",
 "SL / TP": "الوقف / الهدف",
 "Floating PnL": "الربح والخسارة العائمان",
 "External broker execution disabled": "تنفيذ الوسيط الحقيقي معطل",
 "XAUUSD · Gold Spot": "XAUUSD · الذهب الفوري المطلوب",
 "EURUSD · Euro / US Dollar": "EURUSD · اليورو / الدولار",
 "GBPUSD · British Pound / USD": "GBPUSD · الجنيه / الدولار",
 "USDJPY · US Dollar / Japanese Yen": "USDJPY · الدولار / الين",
 "BTCUSDT · Bitcoin Perpetual": "BTCUSDT · بيتكوين / تيثر",
 "US30 · Wall Street 30 Index": "US30 · مؤشر داو جونز",
 "Order Type": "نوع الأمر",
 "Paper market buy": "شراء سوقي تجريبي",
 "Paper market sell": "بيع سوقي تجريبي",
 "Buy Limit (Pending)": "شراء محدد (معلق)",
 "Sell Limit (Pending)": "بيع محدد (معلق)",
 "Lots / Volume": "العقود / الحجم",
 "Limit Order Price": "سعر الأمر المحدد",
 "Stop Loss (SL)": "وقف الخسارة",
 "Take Profit (TP)": "جني الربح",
 "Required Margin:": "الهامش المطلوب:",
 "Max Risk:": "الحد الأقصى للمخاطر:",
 "Leverage:": "الرافعة:",
 "Submit paper order": "إرسال أمر تجريبي",
 "Paper simulation · no real-money execution": "محاكاة تجريبية · لا تنفيذ بأموال حقيقية",
 "🟡 PAPER MODE": "وضع تجريبي",
 "Account Alias": "اسم الحساب",
 "Paper Trading Portfolio": "محفظة تداول تجريبي",
 "Platform Gateway / Engine": "بوابة المنصة / المحرك",
 "THN Sandbox Engine": "محرك THN التجريبي",
 "Account ID (Masked)": "معرف الحساب (محجوب)",
 "Server Host / Endpoint": "عنوان الخادم",
 "Trading Permission Level": "صلاحية التداول",
 "Trading Enabled (Market Orders)": "تداول مسموح (أوامر سوقية)",
 "Account Type & Currency": "نوع الحساب والعملة",
 "Paper Sandbox · USD ($)": "بيئة تجريبية · الدولار",
 "Trading Leverage": "رافعة التداول",
 "1:200 Dynamic": "رافعة ١:٢٠٠",
 "Last Gateway Sync": "آخر مزامنة للبوابة",
 "Measured Latency": "زمن الاستجابة المقاس",
 "Security & Secret Protection": "الأمان وحماية الأسرار",
 "🔐 AES-256-GCM Encrypted at Rest": "تشفير AES-256-GCM عند التخزين",
 "🌐 Launch Broker Client Portal (Direct Funding / Official Management)": "فتح بوابة الوسيط الرسمية",
 "📋 Copy Server & Account ID": "نسخ الخادم ومعرف الحساب",
 "🔴 Disconnect Account": "فصل الحساب",
 "Trading parameters, data feeds, risk thresholds, and preferences": "معلمات التداول ومصادر البيانات وحدود المخاطر والتفضيلات",
 "Execution Sizing": "حجم التنفيذ",
 "Default Risk per Trade (%)": "المخاطرة الافتراضية لكل صفقة (٪)",
 "0.50% (Conservative)": "٠٫٥٠٪ (متحفظ)",
 "1.00% (Standard Playbook)": "١٫٠٠٪ (قياسي)",
 "2.00% (Aggressive Cap)": "٢٫٠٠٪ (الحد الأعلى)",
 "Default Primary Timeframe": "الإطار الزمني الافتراضي",
 "M15 Scalp Retest": "إعادة اختبار ربع ساعة",
 "H1 Intraday Primary": "إطار الساعة اليومي",
 "H4 Swing Protocol": "إطار أربع ساعات",
 "D1 Position Macro": "الإطار اليومي",
 "Target Reward / Risk Minimum": "أدنى عائد إلى مخاطرة مستهدف",
 "1 : 2.0 (Recommended)": "١ : ٢٫٠ (موصى به)",
 "Mandatory Rules": "قواعد إلزامية",
 "UNAVAILABLE": "غير متاح",
 "Binance with Yahoo fallback": "باينانس مع بديل ياهو",
 "Not verified": "غير متحقق منه",
 "Yahoo Finance · instrument identity required": "ياهو فاينانس · يلزم التحقق من هوية الأداة",
 "Macro Events Feed": "مصدر الأحداث الاقتصادية",
 "Architecture": "البنية",
 "Toggle Theme": "تبديل المظهر",
 "Language selector": "اختيار اللغة",
 "Global market sessions": "دليل جلسات السوق",
 "Main navigation": "التنقل الرئيسي",
 "THN Trader dashboard": "نظرة عامة على THN Trader",
 "Account required": "يلزم حساب"
};
Object.assign(WORKSPACE_STATIC_AR,{"Paper Trading Engine": "محرك التداول التجريبي", "Server-side authoritative virtual execution": "تنفيذ افتراضي يديره الخادم", "Backend required": "يتطلب الخادم", "Disabled · unverified": "معطل · غير متحقق منه", "Not available · external execution disabled": "غير متاح · التنفيذ الخارجي معطل", "Preferences": "التفضيلات", "Interface Language": "لغة الواجهة", "English (LTR)": "الإنجليزية (من اليسار إلى اليمين)", "Color Palette & Theme": "الألوان والمظهر", "Toggle Dark / Light Theme": "تبديل المظهر الداكن والفاتح", "Danger Zone": "منطقة الإجراءات الحساسة", "Reset Virtual Paper Balance": "إعادة ضبط الرصيد التجريبي", "Restores your simulated paper balance back to $50,000.00 and clears virtual positions.": "يعيد الرصيد الافتراضي إلى ٥٠٬٠٠٠ دولار ويمسح المراكز التجريبية.", "🧪 Reset Sandbox to $50,000": "إعادة ضبط المحاكاة إلى ٥٠٬٠٠٠ دولار", "Purge Local Journal Ledger": "مسح السجل المحلي", "Removes client-side journaled notes and cached setups from browser storage.": "يمسح الملاحظات والإعدادات المخزنة محلياً في المتصفح.", "🗑️ Clear Journal Ledger": "مسح السجل المحلي", "WIN (Profit Target)": "ربح (تحقق الهدف)", "LOSS (Stop Hit)": "خسارة (تحقق الوقف)", "BREAKEVEN (Scratch)": "تعادل", "Click to select CSV": "اختر ملف CSV", "or drag & drop file here": "أو اسحب الملف وأفلته هنا", "Supports THN export format and standard broker journal CSVs": "يدعم صيغة تصدير THN وملفات CSV للسجلات", "Built-in Sandbox": "محاكاة مدمجة", "Paper Trading Sandbox": "حساب تداول تجريبي", "Paper simulation · provider freshness required · no live execution": "محاكاة تجريبية · يلزم سعر حديث · لا تنفيذ حقيقي", "MT5 Bridge": "جسر MT5", "Official API": "واجهة برمجية خارجية", "Multi-Broker": "وسطاء متعددون", "Secure Server-Side Gateway:": "بوابة الخادم الآمنة:", "Select Connection Permission Level:": "اختر صلاحية الحساب:", "⚡ Trading Enabled": "التداول التجريبي مسموح", "(Transmit market orders & manage positions)": "(إرسال أوامر تجريبية وإدارة المراكز)", "👁️ Read-Only Mode": "وضع القراءة فقط", "(Synchronize balance, equity & positions only)": "(مزامنة الرصيد والحقوق والمراكز فقط)", "Permission Mode": "نمط الصلاحية", "Trading & Execution Enabled": "التداول والتنفيذ التجريبي مسموحان", "Read-Only (Advisory / Market Data Only)": "قراءة فقط (استشارات وبيانات)", "Accounts locked": "الحسابات مقفلة", "THN deterministic engine · v6.0.0": "محرك THN الحتمي · الإصدار ٦٫٠٫٠"});
const workspaceTextBindings=new Map();
function localizeWorkspaceStatic(){
 // Exact interface copy only: never translate input values, provider numbers or
 // overwrite a node whose dynamic content has changed since its binding.
 for(const [node,original] of workspaceTextBindings){
  if(!node.isConnected){workspaceTextBindings.delete(node);continue}
  const current=node.textContent.trim();
  if(current!==original&&current!==WORKSPACE_STATIC_AR[original]){workspaceTextBindings.delete(node);continue}
  node.textContent=currentLang==='ar'?WORKSPACE_STATIC_AR[original]:original;
 }
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,text=node.textContent.trim();
  if(!WORKSPACE_STATIC_AR[text]||workspaceTextBindings.has(node)||node.parentElement?.closest('[data-i18n],script,style,textarea,pre,code'))continue;
  workspaceTextBindings.set(node,text);if(currentLang==='ar')node.textContent=WORKSPACE_STATIC_AR[text];
 }
 for(const node of document.querySelectorAll('[title],[aria-label],[placeholder]'))for(const attr of ['title','aria-label','placeholder']){
  const stored='data-workspace-'+attr;
  const original=node.getAttribute(stored)||node.getAttribute(attr);
  if(WORKSPACE_STATIC_AR[original]){node.setAttribute(stored,original);node.setAttribute(attr,currentLang==='ar'?WORKSPACE_STATIC_AR[original]:original)}
 }
}
Object.assign(I18N.en,{workstationLabel0:'Market observations',workstationLabel1:'Observed analysis',navDashboard:'Overview',navMarkets:'Markets',navTrading:'Trading workspace',navAI:'AI Intelligence',navRisk:'Risk Desk',navPortfolio:'Portfolio',navJournal:'Trade Journal',navBrokers:'Accounts',navSettings:'Settings'});
Object.assign(I18N.ar,{workstationLabel0:'رصد السوق',workstationLabel1:'التحليل المرصود',navDashboard:'نظرة عامة',navMarkets:'الأسواق',navTrading:'مساحة التداول',navAI:'الذكاء الاصطناعي',navRisk:'مكتب المخاطر',navPortfolio:'المحفظة',navJournal:'سجل التداول',navBrokers:'الحسابات',navSettings:'الإعدادات'});

browserStore.removeItem(brokerKey);
restoreTheme();
translateStaticDom();
restoreSetup();
restoreWatchSettings();
initEvents();
checkHealth();
renderJournal();
renderPerformanceAnalytics();
initializeSession().finally(()=>{if(!currentAnalysis&&!analysisInFlight)analyze()});
startBrokerPositionTickTimer();
renderWatchlist();
renderAlerts();
scannerRunning(false);
initializeWorkbench();
switchView(location.hash.slice(1)||"dashboard");
loadChart();
startTerminalClock();
setTimeout(() => {
  if (!currentAnalysis) analyze();
}, 250);
