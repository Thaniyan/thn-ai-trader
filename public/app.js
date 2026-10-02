const $ = id => document.getElementById(id);
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
let watchScanResults = [];
let currentAnalysis = null;
let tvWidget = null;
let currentLang = localStorage.getItem(langKey) || "en";
let soundEnabled = localStorage.getItem(soundKey) !== "false";
let watchHidden = localStorage.getItem(watchHiddenKey) === "true";
let watchSearchTerm = "";
let chartHover = { active: false, x: 0, y: 0 };
let audioCtx = null;
let toastTimeout = null;

const I18N = {
  en: {
    brandTagline: "AI-powered market intelligence",
    navDashboard: "Dashboard",
    navAnalysis: "AI Analysis",
    navWatchlist: "Watchlist",
    navChart: "TradingView",
    navRisk: "Risk Desk",
    navJournal: "Journal & Report",
    apiChecking: "Checking engine...",
    modelInitializing: "THN engine initializing",
    disclaimer: "Educational analysis only. Always verify with your broker, calendar, and risk plan.",
    topbarSub: "Professional multi-school AI trading workstation",
    options: "Options",
    language: "Language",
    toggleTheme: "Toggle Theme",
    heroEyebrow: "Professional AI trading workstation",
    heroSubtitle: "Enter one market code and the platform fetches data, analyzes the chart through multiple trading schools, builds a signal, calculates risk, and prepares an institutional-style report.",
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
    readyReportText: "Journal, checklist and institutional report",
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
    backtestSimulator: "Backtest Stress Simulator",
    estimatedProfile: "Estimated profile",
    tradeJournal: "Trade Journal",
    browserStorage: "Browser local storage",
    clearJournal: "Clear Journal",
    exportJournal: "Export Journal",
    institutionalReport: "Institutional Report",
    copyOrExport: "Copy or export",
    noReportYet: "No report yet.",
    copyReport: "Copy Report",
    exportTxt: "Export TXT",
    localAiActive: "Local AI active",
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
    estimatedWinRate: "Estimated Win Rate",
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
    confidenceLabel: "Confidence",
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
    brandTagline: "ذكاء سوقي مدعوم بالذكاء الاصطناعي",
    navDashboard: "لوحة التحكم",
    navAnalysis: "تحليل الذكاء الاصطناعي",
    navWatchlist: "قائمة المتابعة",
    navChart: "شارت TradingView",
    navRisk: "إدارة المخاطر",
    navJournal: "السجل والتقرير",
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
    backtestSimulator: "محاكي اختبار التحمل",
    estimatedProfile: "ملف تقديري",
    tradeJournal: "سجل التداول",
    browserStorage: "تخزين محلي في المتصفح",
    clearJournal: "مسح السجل",
    exportJournal: "تصدير السجل",
    institutionalReport: "تقرير احترافي",
    copyOrExport: "نسخ أو تصدير",
    noReportYet: "لا يوجد تقرير بعد.",
    copyReport: "نسخ التقرير",
    exportTxt: "تصدير TXT",
    localAiActive: "الذكاء المحلي نشط",
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
  volumeProfile: "Volume Profile",
  playbook: "Execution Playbook",
  playbookSub: "Professional action protocol",
  deskGovernance: "Desk Governance",
  deskGovernanceSub: "Trust, safety and operational filters",
  noProfessionalMap: "Run analysis to generate the professional market map.",
  mapLegendSupport: "Support",
  mapLegendResistance: "Resistance",
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
  institutionalChart: "Institutional chart",
  adaptiveScale: "Adaptive scale enabled",
  layerSmc: "SMC",
  technicalStoryboard: "Technical Storyboard",
  technicalStoryboardSub: "Institutional reading of the chart and execution context",
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
  clearInstitutionalView: "Clean institutional view",
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
  smcDeepTitle: "Institutional SMC & Liquidity Architecture",
  liquidityArchitecture: "Liquidity Pools (BSL / SSL)",
  orderBlocksDeep: "Institutional Order Blocks (OB)",
  fvgDeep: "Fair Value Gaps (FVG)",
  dealingRange: "Dealing Range & Equilibrium (50%)",
  macroEyebrow: "INSTITUTIONAL MACRO RADAR",
  macroTitle: "High-Impact Economic Calendar & Central Bank Radar",
  macroSafety: "Risk Filter Active",
  navMtfa: "🌐 Timeframe Matrix (MTFA)",
  navSmc: "🏛️ SMC & Order Flow",
  navMarketMap: "📊 Institutional Dual-Map",
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
  csvParseError: "Could not parse CSV file. Please check format."
});

Object.assign(I18N.ar, {
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
  volumeProfile: "ملف الحجم",
  playbook: "بروتوكول التنفيذ",
  playbookSub: "خطة عمل احترافية",
  deskGovernance: "حوكمة منصة التداول",
  deskGovernanceSub: "مرشحات الثقة والسلامة والتشغيل",
  noProfessionalMap: "شغّل التحليل لإنشاء خريطة السوق الاحترافية.",
  mapLegendSupport: "دعم",
  mapLegendResistance: "مقاومة",
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
  institutionalChart: "شارت مؤسسي",
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
  clearInstitutionalView: "عرض مؤسسي واضح",
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
  if (!Number.isFinite(n)) return "--";
  return n.toLocaleString(currentLang === "ar" ? "ar-OM" : undefined, { maximumFractionDigits: digits });
};

const money = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return n.toLocaleString(currentLang === "ar" ? "ar-OM" : undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
};

const escapeHtml = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

function status(text) {
  $("statusMsg").textContent = text;
}

function translateStaticDom() {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", currentLang === "ar");
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  });
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
  localStorage.setItem(langKey, currentLang);
  translateStaticDom();
  renderJournal();
  renderWatchlist();
  renderAlerts();
  scannerRunning(Boolean(watchScanTimer));
  renderMapLayerButtons();
  if (currentAnalysis) renderAnalysis(currentAnalysis, { preserveChart: true });
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
  localStorage.setItem(setupKey, JSON.stringify(getPayload()));
}

function restoreSetup() {
  try {
    const saved = JSON.parse(localStorage.getItem(setupKey) || "null");
    if (!saved) return;
    if (saved.symbol) $("symbolInput").value = saved.symbol;
    if (saved.timeframe) $("timeframe").value = saved.timeframe;
    if (saved.accountBalance) $("accountBalance").value = saved.accountBalance;
    if (saved.riskPct) $("riskPct").value = saved.riskPct;
    if (saved.rewardRisk) $("rewardRisk").value = saved.rewardRisk;
    if (saved.sentiment) $("sentiment").value = saved.sentiment;
    if (saved.notes) $("notes").value = saved.notes;
  } catch {
    localStorage.removeItem(setupKey);
  }
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const health = await res.json();
    $("apiStatus").textContent = health.openaiEnabled ? t("openaiEnhanced") : t("localAiActive");
    $("modelStatus").textContent = `${health.app} v${health.version}`;
  } catch {
    $("apiStatus").textContent = t("serverOffline");
    $("modelStatus").textContent = t("runNpmFirst");
  }
}

async function analyze() {
  const payload = getPayload();
  saveSetup();
  status(t("analyzingStatus", { symbol: payload.symbol.toUpperCase() }));
  $("analyzeBtn").disabled = true;
  $("analyzeBtn").textContent = t("analyzing");
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.detail || data.error || "Analysis failed");
    currentAnalysis = data;
    renderAnalysis(data);
    loadChart(data.tvSymbol, data.tvInterval);
    status(t("completedStatus", { symbol: data.symbol }));
  } catch (error) {
    status(`${t("errorPrefix")}: ${error.message}`);
  } finally {
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
  renderReport(a);
  if (!options.preserveChart) return;
}

function renderDeskMarketStats(a) {
  const asset = a.assetClass || "";
  const spreadText = asset === "Crypto" ? "$1.2 (0.01%)" : asset === "Commodity" ? "1.8 pips" : "0.3 pips";
  if ($("deskSpread")) $("deskSpread").textContent = spreadText;
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
    $("smcObSummary").textContent = currentLang === "ar" ? "كتل أوامر مؤسسية غير ممتلئة تمثل مناطق ارتداد حاسمة" : "High-probability institutional order blocks representing unmitigated liquidity flow";
  }

  const bullFvgs = (smc.fvgs || []).filter(f => f.type === "BULLISH_FVG");
  const bearFvgs = (smc.fvgs || []).filter(f => f.type === "BEARISH_FVG");
  if ($("smcBullFvg")) $("smcBullFvg").textContent = bullFvgs.length ? `${fmt(bullFvgs[0].from, precision)} - ${fmt(bullFvgs[0].to, precision)}` : "None";
  if ($("smcBearFvg")) $("smcBearFvg").textContent = bearFvgs.length ? `${fmt(bearFvgs[0].from, precision)} - ${fmt(bearFvgs[0].to, precision)}` : "None";
  if ($("smcFvgSummary")) {
    $("smcFvgSummary").textContent = currentLang === "ar" ? "فجوات السيولة الناتجة عن الاندفاع المؤسسي تسحب السعر لإعادة التوازن" : "3-candle liquidity displacement imbalances acting as magnetic institutional targets";
  }

  if ($("smcEq")) $("smcEq").textContent = fmt(eqPrice, precision);
  const rangePosPct = clamp(a.structure?.rangePosition || 50, 0, 100);
  if ($("smcRangePos")) $("smcRangePos").textContent = `${fmt(rangePosPct, 1)}% (${isDiscount ? "Discount" : "Premium"})`;
  if ($("eqMarker")) $("eqMarker").style.left = `${rangePosPct}%`;
  if ($("smcEqSummary")) {
    $("smcEqSummary").textContent = currentLang === "ar" ? "القاعدة المؤسسية: الدخول في صفقات الشراء فقط في منطقة الخصم والبيع في منطقة العلاوة" : "Institutional Execution Law: Long in Discount (<50%); Short in Premium (>50%)";
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

  $("backtestTable").innerHTML = [
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

function reasonAr(a, idx) {
  const reasons = [
    `التوافق العام بين المدارس التحليلية يشير إلى ${localizedValue(a.decision || "WAIT")} بدرجة ثقة ${fmt(a.confidence, 0)}%.`,
    `المؤشرات الفنية وهيكل السعر تم تحويلهما إلى درجة موحدة للمقارنة بدل الاعتماد على مؤشر واحد فقط.`,
    `مستويات الدخول والوقف والأهداف مبنية على التذبذب الحالي وهيكل الدعم والمقاومة.`,
    `النظام لا يعطي أمر تنفيذ مباشر؛ بل يعطي خطة يجب تأكيدها قبل الدخول.`
  ];
  return reasons[idx % reasons.length];
}

function warningAr(a, idx) {
  const warnings = [
    "لا تدخل إذا كان هناك خبر قوي أو سبريد مرتفع أو سيولة ضعيفة.",
    "قلل المخاطرة إذا كانت الثقة أقل من 70% أو كان السعر قريبًا جدًا من مستوى مقاومة/دعم مهم.",
    "تأكد من مطابقة حجم العقد وقيمة النقطة مع وسيطك قبل التنفيذ.",
    "استخدم وقف الخسارة دائمًا ولا ترفع المخاطرة بسبب إشارة واحدة."
  ];
  return warnings[idx % warnings.length];
}


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
    const saved = JSON.parse(localStorage.getItem(mapLayerKey) || "null");
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
  localStorage.setItem(mapLayerKey, JSON.stringify(current));
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
    canvas.addEventListener("mousemove", event => {
      const rect = canvas.getBoundingClientRect();
      chartHover = {
        active: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      if (currentAnalysis) renderMarketMap(currentAnalysis, currentAnalysis.professional || {});
    });
    canvas.addEventListener("mouseleave", () => {
      chartHover = { active: false, x: 0, y: 0 };
      if (currentAnalysis) renderMarketMap(currentAnalysis, currentAnalysis.professional || {});
    });
  }
}


function drawAnalysisMap(canvas, a, map, p = {}) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(980, Math.floor(rect.width || 1160));
  const height = Math.max(700, Math.floor(rect.height || 760));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const layers = getMapLayers();
  const isLight = document.documentElement.dataset.theme === "light";
  const palette = chartPalette(isLight);
  const allCandles = (map.candles || a.candles || []).filter(c => [c.open, c.high, c.low, c.close].every(Number.isFinite));
  const visible = allCandles.slice(-84);
  const last = visible.at(-1) || {};
  const price = Number(map.price || a.entry || last.close || a.indicators?.price || 0);
  const precision = pricePrecision(price);
  drawChartBackground(ctx, width, height, palette);

  const metaBase = { price, precision, inView: () => false, nearestSupport: null, nearestResistance: null };
  if (!visible.length || !Number.isFinite(price)) {
    ctx.fillStyle = palette.muted; ctx.font = "14px Inter, Arial"; ctx.fillText(t("noProfessionalMap"), 74, 96); return metaBase;
  }

  const padL = 74, padR = 112, padT = 90, padB = 140;
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
  if (layers.levels) supports.forEach(lvl => drawSmartLevel(ctx, yFor(lvl.price), padL, padL + chartW, palette.support, `${t("mapLegendSupport")} · ${lvl.touches}x`, fmt(lvl.price, precision), false, lvl.strength));
  if (layers.levels) resistances.forEach(lvl => drawSmartLevel(ctx, yFor(lvl.price), padL, padL + chartW, palette.resistance, `${t("mapLegendResistance")} · ${lvl.touches}x`, fmt(lvl.price, precision), false, lvl.strength));
  if (layers.trend) drawRegressionChannel(ctx, visible, { xFor, yFor, palette, priceH, padT });
  if (layers.ema) drawEmaStack(ctx, visible, { xFor, yFor, palette });
  if (layers.candles) drawProfessionalCandles(ctx, visible, { xFor, yFor, palette, chartW });
  drawMomentumPane(ctx, visible, { padL, padT: momentumTop, chartW, height: momentumH, xFor, palette });
  if (layers.volume) drawVolumePane(ctx, visible, { padL, padT: volumeTop, chartW, volumeH, xFor, palette });

  if (layers.risk) {
    if (inView(a.entry)) drawTaggedLevel(ctx, yFor(a.entry), padL, padL + chartW, palette.entry, `${t("mapLegendEntry")} ${fmt(a.entry, precision)}`, "left");
    if (inView(a.stopLoss)) drawTaggedLevel(ctx, yFor(a.stopLoss), padL, padL + chartW, palette.stop, `${t("mapLegendStop")} ${fmt(a.stopLoss, precision)}`, "right");
    (a.targets || []).slice(0, 3).forEach((tp, idx) => { if (inView(tp)) drawTaggedLevel(ctx, yFor(tp), padL, padL + chartW, palette.target, `${t("mapLegendTarget")} ${idx + 1} ${fmt(tp, precision)}`, "right"); });
  }
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
  const width = Math.max(360, Math.floor(rect.width || 460));
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
    ctx.save();
    ctx.fillStyle = block.type === 'BULLISH_OB' ? palette.smcAreaBull : palette.smcAreaBear;
    ctx.strokeStyle = block.type === 'BULLISH_OB' ? palette.smcBull : palette.smcBear;
    roundRect(ctx, padL + chartW * 0.45, top, chartW * 0.50, Math.max(7, bottom - top), 8, true, true);
    ctx.fillStyle = block.type === 'BULLISH_OB' ? palette.smcBull : palette.smcBear;
    ctx.font = "900 9px Inter, Arial"; ctx.fillText(block.type === 'BULLISH_OB' ? 'Bullish OB' : 'Bearish OB', padL + chartW * 0.48, top + 13);
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
    const arr = emaArray(closes, period);
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
  (smc.orderBlocks || []).forEach(block => {
    if (!cfg.inView(block.from) && !cfg.inView(block.to)) return;
    const top = cfg.yFor(Math.max(block.from, block.to));
    const bottom = cfg.yFor(Math.min(block.from, block.to));
    const color = block.type === 'BULLISH_OB' ? cfg.palette.smcBull : cfg.palette.smcBear;
    const fill = block.type === 'BULLISH_OB' ? cfg.palette.smcAreaBull : cfg.palette.smcAreaBear;
    ctx.fillStyle = fill;
    ctx.strokeStyle = color;
    roundRect(ctx, cfg.padL + cfg.chartW * 0.62, top, cfg.chartW * 0.34, Math.max(8, bottom - top), 8, true, true);
    ctx.font = "900 10px Inter, Arial"; ctx.fillStyle = color;
    ctx.fillText(block.type === 'BULLISH_OB' ? 'Bullish OB' : 'Bearish OB', cfg.padL + cfg.chartW * 0.64, top + 14);
  });

  (smc.liquidityPools || []).forEach(pool => {
    if (!cfg.inView(pool.price)) return;
    const y = cfg.yFor(pool.price);
    ctx.strokeStyle = cfg.palette.liquidity; ctx.setLineDash([3, 5]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cfg.padL, y); ctx.lineTo(cfg.padL + cfg.chartW, y); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = cfg.palette.liquidity; ctx.font = "900 10px Inter, Arial";
    ctx.fillText(pool.type, cfg.padL + cfg.chartW - 34, y - 6);
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
    out[i] = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
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

function emaArray(values, period) {
  const k = 2 / (period + 1);
  const out = [];
  let prev = null;
  values.forEach((v, idx) => {
    if (!Number.isFinite(v)) { out.push(null); return; }
    prev = prev === null ? v : (v * k + prev * (1 - k));
    out.push(idx < Math.min(period, values.length) / 3 ? null : prev);
  });
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
  $("report").textContent = `==============================\nTHN AI TRADER - INSTITUTIONAL REPORT\n==============================\n\nAPP: ${a.appName || "THN AI Trader"}\nSOURCE: ${a.source}\nMARKET DATA: ${a.marketDataSource}\nSYMBOL: ${a.symbol}\nYAHOO SYMBOL: ${a.yahooSymbol}\nTRADINGVIEW SYMBOL: ${a.tvSymbol}\nASSET CLASS: ${a.assetClass}\nTIMEFRAME: ${a.timeframe}\nEXCHANGE: ${a.exchangeName}\nMARKET TIME: ${a.marketTime ? new Date(a.marketTime).toLocaleString() : "--"}\n\n------------------------------\nAI CONSENSUS\n------------------------------\nDECISION: ${a.decision}\nCONSENSUS: ${a.consensusLabel}\nCONFIDENCE: ${fmt(a.confidence, 0)}%\nGRADE: ${a.grade}\nCONSENSUS SCORE: ${fmt(a.consensusScore, 2)}\n\n${a.aiNarrative}\n\n------------------------------\nMULTI-SCHOOL ANALYSIS\n------------------------------\n${schoolLines}\n\n------------------------------\nTRADE LEVELS\n------------------------------\nENTRY: ${fmt(a.entry, 6)}\nSTOP LOSS: ${a.stopLoss ? fmt(a.stopLoss, 6) : "--"}\nTAKE PROFIT 1: ${a.targets?.[0] ? fmt(a.targets[0], 6) : "--"}\nTAKE PROFIT 2: ${a.targets?.[1] ? fmt(a.targets[1], 6) : "--"}\nTAKE PROFIT 3: ${a.targets?.[2] ? fmt(a.targets[2], 6) : "--"}\n\n------------------------------\nRISK MANAGEMENT\n------------------------------\nACCOUNT BALANCE: ${money(r.accountBalance)}\nRISK PER TRADE: ${fmt(r.riskPct, 2)}%\nRISK AMOUNT: ${money(r.riskAmount)}\nRISK PER UNIT: ${fmt(r.riskPerUnit, 6)}\nUNITS: ${fmt(r.units, 4)}\nFOREX LOTS: ${r.forexLots ? fmt(r.forexLots, 4) : "N/A"}\nEXPOSURE: ${money(r.exposure)}\nEXPOSURE %: ${fmt(r.exposurePct, 2)}%\nREWARD/RISK: 1 : ${fmt(r.rewardRisk, 2)}\nBREAK-EVEN WIN RATE: ${fmt(r.breakEvenWinRate, 2)}%\n\n------------------------------\nINDICATORS\n------------------------------\nPRICE: ${fmt(i.price, 6)}\nEMA20: ${fmt(i.ema20, 6)}\nEMA50: ${fmt(i.ema50, 6)}\nEMA200: ${fmt(i.ema200, 6)}\nRSI14: ${fmt(i.rsi14, 2)}\nATR14: ${fmt(i.atr14, 6)} (${fmt(i.atrPct, 3)}%)\nMACD HISTOGRAM: ${fmt(i.macdHistogram, 6)}\nVOLATILITY: ${i.volatilityLabel}\n\n------------------------------\nSTRUCTURE\n------------------------------\nSUPPORT: ${fmt(s.support, 6)}\nRESISTANCE: ${fmt(s.resistance, 6)}\nRECENT HIGH: ${fmt(s.recentHigh, 6)}\nRECENT LOW: ${fmt(s.recentLow, 6)}\nTREND STRUCTURE: ${s.trendStructure}\nRANGE POSITION: ${fmt(s.rangePosition, 2)}%\nSELL-SIDE SWEEP: ${s.possibleSellSideSweep ? "Possible" : "No"}\nBUY-SIDE SWEEP: ${s.possibleBuySideSweep ? "Possible" : "No"}\n\n------------------------------\nREASONS\n------------------------------\n${(a.reasons || []).map(x => `- ${x}`).join("\n")}\n\n------------------------------\nWARNINGS\n------------------------------\n${(a.warnings || []).map(x => `- ${x}`).join("\n")}\n\n------------------------------\nACTION PLAN\n------------------------------\n${actionPlan}\n\nDISCLAIMER: THN AI Trader is an educational and analytical decision-support system. It is not financial advice, does not guarantee profit, and must be verified with independent market research, broker specifications, and professional risk management.`;
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
    const raw = localStorage.getItem(watchlistKey);
    if (raw === null) {
      const defaults = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSDT"];
      localStorage.setItem(watchlistKey, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(normalizeSymbolInput).filter(Boolean).slice(0, 30);
  } catch {
    localStorage.removeItem(watchlistKey);
  }
  return [];
}

function setWatchlist(items) {
  const clean = [...new Set((items || []).map(normalizeSymbolInput).filter(Boolean))].slice(0, 30);
  localStorage.setItem(watchlistKey, JSON.stringify(clean));
  renderWatchlist();
  return clean;
}

function getWatchSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(watchSettingsKey) || "{}");
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
  localStorage.setItem(watchSettingsKey, JSON.stringify(settings));
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

function getScanIntervalMs() {
  const selectVal = $("scanEvery")?.value;
  if (selectVal === "custom") {
    const val = Math.max(5, Number($("customScanValue")?.value || 30));
    const unit = $("customScanUnit")?.value || "seconds";
    const ms = unit === "minutes" ? val * 60 * 1000 : val * 1000;
    return Math.max(10000, ms);
  }
  return Math.max(10000, Number(selectVal || 300000));
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
  localStorage.setItem(watchHiddenKey, String(watchHidden));
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
  const filtered = pairs.filter(p => !watchSearchTerm || p.includes(watchSearchTerm));
  $("watchlistList").innerHTML = filtered.map(symbol => `<div class="watch-item">
    <b>${escapeHtml(symbol)}</b>
    <span>${escapeHtml(t("alertOnly"))}</span>
    <div class="watch-actions">
      <button class="ghost small" type="button" data-watch-analyze="${escapeHtml(symbol)}">${escapeHtml(t("analyzePair"))}</button>
      <button class="ghost small danger" type="button" data-watch-remove="${escapeHtml(symbol)}">${escapeHtml(t("removePair"))}</button>
    </div>
  </div>`).join("") || `<p class="tiny">${escapeHtml(watchSearchTerm ? (currentLang === "ar" ? "لا توجد أزواج مطابقة للبحث." : "No pairs match search.") : t("noPairsYet"))}</p>`;
}

function watchlistPayload() {
  return {
    symbols: getWatchlist(),
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
    const isBuy = decision === "BUY";
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
  const isBuy = signal === "BUY";
  const toastSignal = $("toastSignal");
  if (toastSignal) {
    toastSignal.textContent = localizedValue(signal);
    toastSignal.className = `toast-signal ${isBuy ? "buy" : "sell"}`;
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
  localStorage.setItem(soundKey, String(soundEnabled));
  updateSoundButton();
  if (soundEnabled) playTradeAlertSound("BUY");
}

function updateSoundButton() {
  const btn = $("toggleSoundBtn");
  if (!btn) return;
  btn.textContent = soundEnabled ? t("soundOn") : t("soundOff");
  btn.classList.toggle("active", soundEnabled);
}

async function scanWatchlist() {
  const payload = watchlistPayload();
  if (!payload.symbols.length) {
    setWatchStatus(t("watchlistEmpty"));
    status(t("watchlistEmpty"));
    return;
  }
  saveWatchSettings();
  setWatchStatus(t("scanningWatchlist", { count: payload.symbols.length }));
  try {
    const res = await fetch("/api/watchlist/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.detail || data.error || "Watchlist scan failed");
    watchScanResults = data.results || [];
    renderAlerts(data.scannedAt);
    
    // Opportunities triggering alert sound, floating toast, and browser notification
    const actionableAlerts = watchScanResults.filter(item => 
      item.automation?.active || 
      (Number(item.confidence || 0) >= (payload.minConfidence || 70) && (item.decision === "BUY" || item.decision === "SELL"))
    );
    
    if (actionableAlerts.length) {
      const topAlert = actionableAlerts[0];
      playTradeAlertSound(topAlert.decision);
      showTradeToast(topAlert);
      notifyStrongAlerts(actionableAlerts);
    }
    
    const msg = t("scanComplete", { alerts: data.strongAlertCount || actionableAlerts.length, count: data.count || payload.symbols.length });
    setWatchStatus(msg);
    status(msg);
  } catch (error) {
    setWatchStatus(`${t("errorPrefix")}: ${error.message}`);
  }
}

function alertLabel(item) {
  if (item.automation?.severity === "strong-entry") return t("strongAlert");
  if (item.automation?.severity === "qualified-entry") return t("qualifiedAlert");
  if (item.decision === "BUY" || item.decision === "SELL") return t("reviewOnly");
  return t("noTrade");
}

function renderAlerts(scannedAt) {
  if (!$("alertList")) return;
  const sorted = [...watchScanResults].sort((a, b) => (b.automation?.trustScore || 0) - (a.automation?.trustScore || 0));
  $("alertList").innerHTML = sorted.map(item => {
    const auto = item.automation || {};
    const active = auto.active ? " active" : "";
    const firstReason = auto.active ? auto.summary : (auto.blockedReasons?.[0] || auto.summary || t("noMajorWarnings"));
    return `<article class="alert-card${active}">
      <div class="alert-title">
        <div><b>${escapeHtml(item.symbol || item.requestedSymbol)}</b><span>${escapeHtml(alertLabel(item))}</span></div>
        <strong class="decision ${String(item.decision || "WAIT").toLowerCase()}">${escapeHtml(localizedValue(item.decision || "WAIT"))}</strong>
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
    return JSON.parse(localStorage.getItem(watchNotifyKey) || "{}");
  } catch {
    return {};
  }
}

function notifyStrongAlerts(alerts) {
  if (!alerts.length || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const cache = getNotifyCache();
  const now = Date.now();
  for (const item of alerts) {
    const key = `${item.symbol}-${item.decision}`;
    if (cache[key] && now - cache[key] < 15 * 60 * 1000) continue;
    cache[key] = now;
    new Notification(t("browserNotificationTitle"), {
      body: t("browserNotificationBody", { symbol: item.symbol, decision: localizedValue(item.decision), confidence: fmt(item.confidence, 0) })
    });
  }
  localStorage.setItem(watchNotifyKey, JSON.stringify(cache));
}

function startScanner() {
  const pairs = getWatchlist();
  if (!pairs.length) {
    setWatchStatus(t("watchlistEmpty"));
    return;
  }
  saveWatchSettings();
  stopScanner(false);
  const interval = getScanIntervalMs();
  watchScanTimer = setInterval(scanWatchlist, interval);
  scannerRunning(true);
  setWatchStatus(t("scanStarted"));
  status(t("scanStarted"));
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
  scanWatchlist();
}

function stopScanner(showStatus = true) {
  if (watchScanTimer) clearInterval(watchScanTimer);
  watchScanTimer = null;
  scannerRunning(false);
  if (showStatus) {
    setWatchStatus(t("scanStopped"));
    status(t("scanStopped"));
  }
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

function loadBenchmarkHistory() {
  const benchmark = getBenchmarkSampleTrades();
  localStorage.setItem(journalKey, JSON.stringify(benchmark));
  renderJournal();
  renderPerformanceAnalytics();
  status(currentLang === "ar" ? "تم تحميل سجل الأداء الإحصائي المعياري." : "Loaded benchmark performance history.");
}

function saveJournal() {
  if (!currentAnalysis) {
    alert(t("runAnalysisFirst"));
    return;
  }
  const arr = getJournal();
  const riskAmt = Number(currentAnalysis.risk?.riskAmount || 100);
  const rr = Number(currentAnalysis.risk?.rewardRisk || 2);
  const simulatedPnl = currentAnalysis.decision === "BUY" || currentAnalysis.decision === "SELL" ? riskAmt * rr : 0;
  arr.unshift({
    id: "trade-" + Date.now(),
    date: new Date().toISOString(),
    symbol: currentAnalysis.symbol,
    decision: currentAnalysis.decision,
    confidence: currentAnalysis.confidence,
    grade: currentAnalysis.grade,
    entry: currentAnalysis.entry,
    stopLoss: currentAnalysis.stopLoss,
    target1: currentAnalysis.targets?.[0],
    risk: riskAmt,
    assetClass: currentAnalysis.symbolInfo?.assetClass || currentAnalysis.assetClass || detectAssetClass(currentAnalysis.symbol),
    status: currentAnalysis.decision === "WAIT" ? "BE" : "WIN",
    pnl: simulatedPnl,
    pnlR: rr,
    exitPrice: currentAnalysis.targets?.[0] || currentAnalysis.entry
  });
  localStorage.setItem(journalKey, JSON.stringify(arr.slice(0, 100)));
  renderJournal();
  renderPerformanceAnalytics();
  status(t("savedStatus"));
}

function getJournal() {
  try {
    const raw = localStorage.getItem(journalKey);
    if (raw === null) {
      const benchmark = getBenchmarkSampleTrades();
      localStorage.setItem(journalKey, JSON.stringify(benchmark));
      return benchmark;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    if (Array.isArray(parsed) && parsed.length === 0) return [];
  } catch {
    localStorage.removeItem(journalKey);
  }
  return [];
}

function cycleTradeOutcome(tradeId) {
  const arr = getJournal();
  const trade = arr.find(t => t.id === tradeId);
  if (!trade) return;
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
  localStorage.setItem(journalKey, JSON.stringify(arr));
  renderJournal();
  renderPerformanceAnalytics();
}

function deleteJournalTrade(tradeId) {
  const arr = getJournal().filter(t => t.id !== tradeId);
  localStorage.setItem(journalKey, JSON.stringify(arr));
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
          <small class="journal-date">${date}</small>
        </div>
        <div class="journal-actions-row">
          <span class="journal-pnl ${pnlNum >= 0 ? 'pnl-green' : 'pnl-red'}">${pnlText} (${item.pnlR >= 0 ? '+' : ''}${item.pnlR || 0}R)</span>
          <button type="button" class="outcome-badge-btn ${statusClass}" data-cycle-trade="${escapeHtml(item.id)}" title="Click to cycle WIN / LOSS / BE">${statusLabel}</button>
          <button type="button" class="ghost small danger icon-del-btn" data-delete-trade="${escapeHtml(item.id)}" title="Delete trade">&times;</button>
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
  const all = getJournal();
  const now = Date.now();
  return all.filter(t => {
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

function computePerformanceKPIs(trades) {
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
  const expectancy = total ? (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss) : 0;

  // Peak to trough max drawdown
  let running = 0, peak = 0, maxDd = 0;
  [...trades].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(t => {
    running += Number(t.pnl || 0);
    peak = Math.max(peak, running);
    maxDd = Math.max(maxDd, peak - running);
  });
  const maxDdPct = peak > 0 ? (maxDd / peak) * 100 : 0;

  if ($("kpiNetPnl")) {
    $("kpiNetPnl").textContent = `${netPnl >= 0 ? '+' : '-'}$${Math.abs(netPnl).toFixed(2)}`;
    $("kpiNetPnl").style.color = netPnl >= 0 ? "var(--green)" : "var(--red)";
  }
  if ($("kpiNetPnlPct")) $("kpiNetPnlPct").textContent = `${netPnl >= 0 ? '+' : ''}${((netPnl / 10000) * 100).toFixed(1)}% on $10k base`;
  if ($("kpiWinRate")) $("kpiWinRate").textContent = `${winRate.toFixed(1)}%`;
  if ($("kpiWinLossRatio")) $("kpiWinLossRatio").textContent = `${wins.length} W / ${losses.length} L (${be.length} BE)`;
  if ($("kpiProfitFactor")) $("kpiProfitFactor").textContent = profitFactor.toFixed(2);
  if ($("kpiGrossProfitLoss")) $("kpiGrossProfitLoss").textContent = `+$${grossProfit.toFixed(0)} / -$${grossLoss.toFixed(0)}`;
  if ($("kpiPayoffRatio")) $("kpiPayoffRatio").textContent = `1 : ${payoffRatio.toFixed(2)}`;
  if ($("kpiAvgWinLoss")) $("kpiAvgWinLoss").textContent = `Avg W: $${avgWin.toFixed(0)} | Avg L: $${avgLoss.toFixed(0)}`;
  if ($("kpiMaxDrawdown")) $("kpiMaxDrawdown").textContent = `-$${maxDd.toFixed(2)}`;
  if ($("kpiMaxDrawdownPct")) $("kpiMaxDrawdownPct").textContent = `${maxDdPct.toFixed(1)}% from peak`;
  if ($("kpiExpectancy")) $("kpiExpectancy").textContent = `${expectancy >= 0 ? '+' : '-'}$${Math.abs(expectancy).toFixed(2)}`;
  if ($("kpiTotalTrades")) $("kpiTotalTrades").textContent = `${total} closed trades`;
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
  let running = 0;
  let peak = 0;
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
  const data = [{ idx: 0, date: firstDate, symbol: "START", tradePnl: 0, cumulativePnl: 0, peakEquity: 0, drawdown: 0, drawdownPct: 0 }, ...points];

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
  const pnlMax = Math.max(d3.max(data, d => d.cumulativePnl), d3.max(data, d => d.peakEquity), 500);
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

function initEvents() {
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
      document.querySelectorAll(".nav").forEach(x => x.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.jump).scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  $("languageSelect").addEventListener("change", event => setLanguage(event.target.value));
  document.querySelectorAll("[data-language]").forEach(button => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });
  $("loadChartBtn").addEventListener("click", () => loadChart());
  $("themeBtn").addEventListener("click", () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("thn_ai_trader_theme_v3", document.documentElement.dataset.theme);
    loadChart();
  });
  $("saveJournalBtn").addEventListener("click", saveJournal);
  $("clearJournalBtn").addEventListener("click", () => {
    if (confirm(t("confirmClear"))) {
      localStorage.removeItem(journalKey);
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
      confidence: 82,
      grade: outcome === "WIN" ? "A+" : outcome === "BE" ? "B" : "B-",
      entry: entry,
      stopLoss: 0,
      target1: exitPrice,
      risk: Math.abs(pnl) || 100,
      assetClass: detectAssetClass(sym),
      status: outcome,
      pnl: pnl,
      pnlR: pnlR,
      exitPrice: exitPrice,
      notes: notes
    };

    const arr = getJournal();
    arr.unshift(trade);
    localStorage.setItem(journalKey, JSON.stringify(arr.slice(0, 150)));
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
            alert(t("noValidTradesInCsv"));
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
          alert(t("csvParseError"));
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

    localStorage.setItem(journalKey, JSON.stringify(finalLedger.slice(0, 500)));
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
    if (analyzeSymbol) {
      $("symbolInput").value = analyzeSymbol;
      analyze();
    }
    if (removeSymbol) removeFavoriteSymbol(removeSymbol);
  });
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
    if (watchScanTimer) startScanner();
  });
  $("customScanValue")?.addEventListener("change", () => {
    saveWatchSettings();
    if (watchScanTimer) startScanner();
  });
  $("customScanUnit")?.addEventListener("change", () => {
    saveWatchSettings();
    if (watchScanTimer) startScanner();
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
  $("copyReportBtn").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("report").textContent);
    status(t("reportCopied"));
  });
  $("exportReportBtn").addEventListener("click", () => download(t("reportFilename"), $("report").textContent));
}

function restoreTheme() {
  const saved = localStorage.getItem("thn_ai_trader_theme_v3");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
}

restoreTheme();
translateStaticDom();
restoreSetup();
restoreWatchSettings();
initEvents();
checkHealth();
renderJournal();
renderPerformanceAnalytics();
renderWatchlist();
renderAlerts();
scannerRunning(false);
loadChart();
startTerminalClock();
setTimeout(() => {
  if (!currentAnalysis) analyze();
}, 250);
