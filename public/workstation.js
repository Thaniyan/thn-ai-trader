/* Integrated research workstation. All displayed market observations carry provenance. */
(() => {
  const $ = id => document.getElementById(id);
  // Keep the whole keyboard-focused tab visible in the horizontal mobile dock.
  document.querySelector('.nav-stack').addEventListener('focusin', event => {
    if (matchMedia('(max-width:760px)').matches && event.target.matches('.nav')) {
      event.target.scrollIntoView({block:'nearest', inline:'nearest'});
    }
  });
  const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSDT', 'US30'];
  const classes = {XAUUSD:'Commodity',EURUSD:'Forex',GBPUSD:'Forex',USDJPY:'Forex',BTCUSDT:'Crypto',US30:'Index'};
  const en = {
    command:'Market command center',commandSub:'Observe the market. Test the evidence. Define your risk.',research:'RESEARCH · LIVE EXECUTION DISABLED',coverage:'Provider coverage',selected:'Selected instrument',verifiedOnly:'Verified observations only',shared:'Shared across your workspace',method:'Analysis methodology',deterministic:'Deterministic',scoreNote:'Confluence scores are not probabilities',accountState:'Account availability',unavailable:'Unavailable',noLedger:'No hosted account ledger',observation:'MARKET OBSERVATION',watch:'Instrument watch',refresh:'Refresh quotes',closeNote:'Provider candle closes · indicative observations, no executable bid/ask',instrument:'Instrument',last:'Last close',change:'Candle change',provenance:'Provider / freshness',focus:'INSTRUMENT FOCUS',analyze:'Open analytical terminal ↗',plan:'Plan position risk',process:'RESEARCH PROCESS',workflow:'From observation to a defensible plan',discover:'Discover',discoverSub:'Search instruments and verify their source.',evidence:'Inspect evidence',evidenceSub:'Review structure, conflicts and invalidation.',size:'Size the risk',sizeSub:'Set a stop, a target and a capital budget.',availability:'CAPABILITIES',honestState:'Know your operating state',marketData:'Market data',onRequest:'Provider requests, no continuous feed guarantee',aiModel:'AI model',localEngine:'Deterministic engine; no model output claimed',paper:'Paper trading',localOnly:'Opt-in local engine only',journal:'Journal',browserOnly:'Browser-local research notes, not broker records',discovery:'INSTRUMENT DISCOVERY',verifiedWatch:'Provider observations',search:'Search instruments',all:'All',commodities:'Commodities',crypto:'Crypto',indices:'Indices',pretrade:'PRE-TRADE RESEARCH',planner:'Position sizing laboratory',hypothetical:'HYPOTHETICAL CAPITAL · USD',plannerNote:'Planning inputs are estimates, never authoritative account balances. USD-quoted contracts and USD-base FX with conversion; broker terms may differ.',direction:'Direction',capital:'Planning capital (USD)',riskPercent:'Risk budget (%)',entry:'Entry price',stop:'Stop loss',target:'Target',leverage:'Planning leverage',calculate:'Calculate position',fillPlan:'Enter a complete trade plan to calculate volume, risk and margin.',loading:'Requesting provider observations…',failed:'Providers are unavailable. No substitute prices are shown.',recent:'Recent',stale:'Stale / session may be closed',inspect:'Inspect',empty:'No matching instruments.',noChart:'No verified candle history available.',chartLoading:'Loading provider history…',invalid:'Enter positive values. Risk must be at most 5%, leverage at most 200, and stop/target must match direction.',belowMin:'Risk budget is below the minimum contract volume. Reduce stop distance or revise the budget.',lots:'Lots (rounded down)',loss:'Planned stop risk',reward:'Planned target reward',margin:'Estimated margin',ratio:'Reward / risk',budget:'Risk budget',marginWarning:'Estimated margin exceeds planning capital.',costs:'Excludes spread, fees, slippage and gaps. A stop does not guarantee the exit price.',modelConfigured:'Model configured; availability depends on each request.',localPaper:'Local paper engine enabled',refreshDone:'Provider responses received. Stale observations remain labeled.',timestamp:'Provider time',analysisNote:'Deterministic technical evidence. Scores are heuristic confluence, not calibrated win probabilities. Analysis is unavailable when verified market data cannot be obtained.'
  };
  const ar = {
    command:'مركز قيادة الأسواق',commandSub:'راقب السوق. اختبر الأدلة. حدد مخاطرتك.',research:'بيئة بحث · التداول الحقيقي معطل',coverage:'تغطية مزودي البيانات',selected:'الأداة المختارة',verifiedOnly:'بيانات موثقة فقط',shared:'مشتركة بين أقسام المنصة',method:'منهجية التحليل',deterministic:'تحليل حتمي',scoreNote:'درجات التوافق ليست احتمالات ربح',accountState:'حالة الحساب',unavailable:'غير متاح',noLedger:'لا يوجد سجل حساب مستضاف',observation:'مراقبة السوق',watch:'قائمة الأدوات',refresh:'تحديث الأسعار',closeNote:'إغلاق شموع المزود · بيانات استرشادية دون أسعار تنفيذ',instrument:'الأداة',last:'آخر إغلاق',change:'تغير الشمعة',provenance:'المزود / حداثة البيانات',focus:'الأداة قيد الدراسة',analyze:'فتح منصة التحليل ↗',plan:'تخطيط مخاطر الصفقة',process:'مسار البحث',workflow:'من المراقبة إلى خطة قابلة للتقييم',discover:'اكتشف',discoverSub:'ابحث عن الأدوات وتحقق من مصدرها.',evidence:'افحص الأدلة',evidenceSub:'راجع الهيكل والتعارضات وحدود إبطال السيناريو.',size:'حدد المخاطرة',sizeSub:'حدد الوقف والهدف وميزانية المخاطر.',availability:'الإمكانات',honestState:'تعرف على حالة التشغيل',marketData:'بيانات السوق',onRequest:'طلبات للمزود دون ضمان تغذية مستمرة',aiModel:'نموذج الذكاء الاصطناعي',localEngine:'محرك حتمي؛ لا ندعي وجود مخرجات نموذج',paper:'التداول التجريبي',localOnly:'محرك محلي اختياري فقط',journal:'السجل',browserOnly:'ملاحظات بحث محلية بالمتصفح وليست سجلات وسيط',discovery:'اكتشاف الأدوات',verifiedWatch:'بيانات المزود',search:'ابحث عن الأدوات',all:'الكل',commodities:'السلع',crypto:'العملات الرقمية',indices:'المؤشرات',pretrade:'بحث ما قبل التداول',planner:'مختبر حجم الصفقة',hypothetical:'رأس مال افتراضي · دولار أمريكي',plannerNote:'مدخلات التخطيط تقديرية وليست أرصدة حساب معتمدة. لعقود الدولار والعملات التي يكون الدولار أساسها مع التحويل؛ قد تختلف شروط الوسيط.',direction:'الاتجاه',capital:'رأس المال التخطيطي (دولار)',riskPercent:'ميزانية المخاطر (%)',entry:'سعر الدخول',stop:'وقف الخسارة',target:'الهدف',leverage:'الرافعة التخطيطية',calculate:'حساب حجم الصفقة',fillPlan:'أدخل خطة مكتملة لحساب الحجم والمخاطرة والهامش.',loading:'جار طلب بيانات المزود…',failed:'المزودون غير متاحين. لا نعرض أسعاراً بديلة.',recent:'حديثة',stale:'قديمة / قد تكون الجلسة مغلقة',inspect:'فحص',empty:'لا توجد أدوات مطابقة.',noChart:'لا يتوفر سجل شموع موثق.',chartLoading:'جار تحميل سجل المزود…',invalid:'أدخل قيماً موجبة. الحد الأقصى للمخاطرة ٥٪ وللرافعة ٢٠٠، ويجب توافق الوقف والهدف مع الاتجاه.',belowMin:'ميزانية المخاطر أقل من الحد الأدنى لحجم العقد. راجع مسافة الوقف أو الميزانية.',lots:'اللوت (مقرب لأسفل)',loss:'مخاطرة الوقف',reward:'العائد المخطط',margin:'الهامش التقديري',ratio:'العائد / المخاطرة',budget:'ميزانية المخاطر',marginWarning:'الهامش التقديري يتجاوز رأس المال التخطيطي.',costs:'لا يشمل السبريد والرسوم والانزلاق والفجوات. الوقف لا يضمن سعر الخروج.',modelConfigured:'النموذج مهيأ؛ يتوقف توفره على كل طلب.',localPaper:'المحرك التجريبي المحلي مفعل',refreshDone:'تم استلام ردود المزودين مع تمييز البيانات القديمة.',timestamp:'وقت المزود',analysisNote:'أدلة فنية حتمية. الدرجات توافق استدلالي وليست احتمالات ربح معايرة. لا يتاح التحليل عند تعذر الحصول على بيانات موثقة.'
  };
  const t = key => (document.documentElement.lang === 'ar' ? ar : en)[key] || en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = (v,d=5) => Number.isFinite(v) ? new Intl.NumberFormat(document.documentElement.lang === 'ar'?'ar-OM':'en-US',{maximumFractionDigits:d}).format(v) : '—';
  let selected = window.THNContext?.get().symbol || 'EURUSD';
  let quotes = {}, asset = 'all', busy = false, focusRequest = 0, capabilities = {};
  function state(q) {
    if (!q || !Number.isFinite(q.close) || !q.timestamp) return 'unavailable';
    return Date.now() - (q.marketTime || q.timestamp) > 7200000 ? 'stale' : 'recent';
  }
  function provenance(q) {
    const status = state(q);
    return `<span class="work-source">${esc(q?.source || '—')}${q?.providerSymbol ? ' · '+esc(q.providerSymbol) : ''}</span>${q?.instrumentNote === 'Futures proxy, not spot' ? '<small>'+ (document.documentElement.lang === 'ar' ? 'عقد آجل بديل وليس سعراً فورياً' : 'Futures proxy, not spot')+'</small>' : ''}<small class="work-fresh ${status}">${t(status)}${q?.timestamp ? ' · '+esc(new Date(q.marketTime || q.timestamp).toLocaleString(document.documentElement.lang === 'ar'?'ar-OM':'en-GB',{timeZone:'UTC'}))+' UTC' : ''}</small>`;
  }
  function render() {
    document.querySelectorAll('[data-w]').forEach(el => el.textContent = t(el.dataset.w));
    $('workSearch').placeholder = t('search');
    if($('workUseScenario'))$('workUseScenario').textContent=document.documentElement.lang==='ar'?'استخدام السيناريو في مختبر المخاطر':'Use analysis scenario in Risk Desk';
    $('workCoverage').textContent = `${symbols.filter(s => state(quotes[s]) !== 'unavailable').length} / 6`;
    $('workSelected').textContent = selected;
    $('workAccount').textContent = capabilities.paperExecution ? t('localPaper') : t('unavailable');
    $('workPaper').textContent = capabilities.paperExecution ? t('localPaper') : t('localOnly');
    $('workModel').textContent = capabilities.modelConfigured ? t('modelConfigured') : t('localEngine');
    $('workQuotes').innerHTML = symbols.map(sym => {
      const q=quotes[sym];const change = Number.isFinite(q?.changePct) ? `${number(q.changePct,2)}%` : '—';
      return `<tr class="${selected===sym?'selected':''}"><td><b dir="ltr">${sym}</b><small>${esc(classes[sym])}</small></td><td class="work-number">${number(q?.close)}</td><td class="work-number">${change}</td><td>${provenance(q)}</td><td><button class="ghost small" type="button" data-focus="${sym}" aria-label="${t('inspect')} ${sym}">${t('inspect')} ↗</button></td></tr>`;
    }).join('');
    const search = $('workSearch').value.toLowerCase();
    const matches=symbols.filter(s=>(asset==='all'||classes[s]===asset)&&`${s} ${classes[s]}`.toLowerCase().includes(search));
    $('workDiscovery').innerHTML = matches.length ? matches.map(sym=>`<button type="button" class="work-instrument ${selected===sym?'selected':''}" data-focus="${sym}"><b dir="ltr">${sym}</b><span class="work-number">${number(quotes[sym]?.close)}</span>${provenance(quotes[sym])}</button>`).join('') : `<p>${t('empty')}</p>`;
    $('focusSymbol').textContent=selected;
    $('focusPrice').textContent=number(quotes[selected]?.close);
    $('focusState').textContent=t(state(quotes[selected]));
    $('focusProvider').textContent=quotes[selected]?.source ? `${quotes[selected].source} · ${quotes[selected].providerSymbol || ''}` : t('unavailable');
    $('focusTimestamp').textContent=quotes[selected]?.timestamp ? `${t('timestamp')}: ${new Date(quotes[selected].marketTime || quotes[selected].timestamp).toISOString()}` : t('noChart');
    const focusSeries=window.THNResearch?.series?.();if(focusSeries?.symbol===selected&&focusSeries.provenance.interval===window.THNContext?.get().interval){const p=focusSeries.provenance;$('focusPrice').textContent=number(focusSeries.candles.at(-1)?.close);$('focusState').textContent=t(p.status);$('focusProvider').textContent=p.source+' · '+p.providerSymbol+' · '+p.interval;$('focusTimestamp').textContent=t('timestamp')+': '+new Date(p.lastTime).toISOString();}
    document.querySelectorAll('.nav-stack .nav').forEach(b=> b.setAttribute('aria-current',b.classList.contains('active')?'page':'false'));
  }
  async function refresh() {
    if(busy) return; busy=true; $('workRefresh').disabled=true; $('workQuoteState').textContent=t('loading');
    try {
      const r=await fetch('/api/quotes',{signal:AbortSignal.timeout(25000)});
      if(!r.ok) throw Error('Unavailable'); const data=await r.json();
      quotes=data.quotes || {};
      liveQuotesCache=quotes;
      $('workQuoteState').textContent=symbols.some(s=>state(quotes[s])!=='unavailable')?t('refreshDone'):t('failed');
    } catch {quotes={}; liveQuotesCache={};$('workQuoteState').textContent=t('failed');}
    finally {busy=false;$('workRefresh').disabled=false;render();loadFocus();}
  }
  function select(sym) {
    if(!/^[A-Z0-9^=:.\-]{1,32}$/.test(sym))return;selected=sym;THNPreferences.setItem('thn_focus',sym);
    window.THNContext?.set({symbol:sym},'markets');
    $('symbolInput').value=sym;
    if([...$('planSymbol').options].some(o=>o.value===sym))$('planSymbol').value=sym;
    $('planEntry').value=Number.isFinite(quotes[sym]?.close)?quotes[sym].close:'';
    $('planStop').value='';$('planTarget').value='';$('planResult').textContent=t('fillPlan');
    render();loadFocus();
  }
  async function loadFocus() {
    const request=++focusRequest;const sym=selected;const interval=window.THNContext?.get().interval || '1h';
    $('focusChart').textContent=t('chartLoading');
    try {
      const shared=window.THNResearch?.series?.();let data;if(shared?.symbol===sym&&shared.provenance.interval===interval)data=shared;else{const r=await fetch(`/api/research/series?symbol=${encodeURIComponent(sym)}&interval=${interval}`,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();data=await r.json();}if(request!==focusRequest)return;
      const candles=(data.candles||[]).filter(c=>Number.isFinite(c.close)).slice(-160);
      if(data.provenance){$('focusPrice').textContent=number(candles.at(-1)?.close);$('focusProvider').textContent=`${data.provenance.source} · ${data.provenance.providerSymbol} · ${interval}`;$('focusTimestamp').textContent=`${t('timestamp')}: ${new Date(data.provenance.lastTime).toISOString()}`;$('focusState').textContent=t(data.provenance.status);} if(candles.length<2)throw Error();
      const values=candles.map(c=>c.close), min=Math.min(...values),max=Math.max(...values),range=max-min || 1;
      const points=values.map((v,i)=>`${(i/(values.length-1)*480).toFixed(1)},${(110-(v-min)/range*100).toFixed(1)}`).join(' ');
      $('focusChart').innerHTML=`<svg viewBox="0 0 480 120" role="img" aria-label="${esc(sym)} ${esc(data.provenance?.source || data.source)}"><path d="M0 110H480 M0 60H480 M0 10H480" class="work-chart-grid"/><polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
    } catch {if(request===focusRequest)$('focusChart').textContent=t('noChart');}
  }
  window.addEventListener('thn:series',()=>{render();loadFocus();});
  $('workRefresh').addEventListener('click',refresh);
  $('workSearch').addEventListener('input',render);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-focus]');if(btn)select(btn.dataset.focus);
    const filter=e.target.closest('[data-asset]');if(filter){asset=filter.dataset.asset;document.querySelectorAll('[data-asset]').forEach(b=>{b.classList.toggle('active',b===filter);b.setAttribute('aria-pressed',String(b===filter));});render();}
    if(e.target.closest('.nav-stack .nav, [data-view-jump], .subtab-btn')){render();setTimeout(()=>{if(currentAnalysis)renderProfessionalLayer(currentAnalysis);},80);}
  });
  $('workAnalyze').addEventListener('click',()=>{$('symbolInput').value=selected;switchView('trading');analyze();});
  $('planSymbol').addEventListener('change',()=>select($('planSymbol').value));
  $('workRiskForm').addEventListener('submit',async e=>{
    e.preventDefault();const result=$('planResult');const symbol=$('planSymbol').value;
    const [capital,risk,entry,stop,target,leverage]=['planCapital','planRisk','planEntry','planStop','planTarget','planLeverage'].map(id=>Number($(id).value));
    const buy=$('planSide').value==='BUY';
    if(![capital,risk,entry,stop,target,leverage].every(v=>Number.isFinite(v)&&v>0)||risk>5||leverage>200||(buy?!(stop<entry&&target>entry):!(stop>entry&&target<entry))){result.textContent=t('invalid');return;}
    const specs={EURUSD:[100000,.01,.01,100],GBPUSD:[100000,.01,.01,100],XAUUSD:[100,.01,.01,50],BTCUSDT:[1,.01,.01,10],US30:[1,.1,.1,50],USDJPY:[100000,.01,.01,100]};
    const [contract,step,min,max]=specs[symbol];const budget=capital*risk/100;const conversion=symbol.startsWith("USD")?1/entry:1;
    const lots=Math.min(max,Math.floor((budget/(Math.abs(entry-stop)*contract*conversion)+1e-10)/step)*step);
    if(lots<min){result.textContent=t('belowMin');return;}
    const button=e.submitter;button.disabled=true;result.textContent=t('loading');
    try {
      const r=await fetch('/api/risk/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol,side:buy?'BUY':'SELL',lots,entryPrice:entry,stopLoss:stop,takeProfit:target,leverage}),signal:AbortSignal.timeout(8000)});
      const data=await r.json();if(!r.ok||!data.ok)throw Error();const m=data.metrics;
      result.innerHTML=`<div class="work-result-grid">${[['lots',number(lots,2)],['budget','$'+number(budget,2)],['loss','$'+number(m.slDollars,2)],['reward','$'+number(m.tpDollars,2)],['ratio',number(m.rrRatio,2)+' : 1'],['margin','$'+number(m.requiredMargin,2)]].map(([k,v])=>`<div><small>${t(k)}</small><b>${v}</b></div>`).join('')}</div><p>${m.requiredMargin>capital?t('marginWarning')+' ':''}${t('costs')}</p>`;
    }catch{result.textContent=t('failed');}finally{button.disabled=false;}
  });
  // Language updates reuse the original terminal language controls.
  new MutationObserver(()=>{render();$('workQuoteState').textContent=busy?t('loading'):t('closeNote');$('planResult').textContent=t('fillPlan');}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  const transfer=document.createElement('button');transfer.type='button';transfer.className='ghost small';transfer.id='workUseScenario';
  transfer.textContent=document.documentElement.lang==='ar'?'استخدام السيناريو في مختبر المخاطر':'Use analysis scenario in Risk Desk';
  transfer.addEventListener('click',()=>{
    if(!currentAnalysis || !currentAnalysis.stopLoss || !currentAnalysis.targets?.[0])return;
    const a=currentAnalysis;if(![...$('planSymbol').options].some(o=>o.value===a.symbol))return;
    select(a.symbol);$('planEntry').value=a.entry;$('planStop').value=a.stopLoss;$('planTarget').value=a.targets[0];$('planSide').value=a.decision.includes('SELL')?'SELL':'BUY';switchView('risk');
  });
  transfer.disabled=true;$('view-ai').prepend(transfer);
  window.addEventListener('thn:analysis',e=>{transfer.disabled=!e.detail.stopLoss || !e.detail.targets?.[0] || ![...$('planSymbol').options].some(o=>o.value===e.detail.symbol);});
  const note=document.createElement('p');note.className='work-analysis-note';note.dataset.w='analysisNote';
  $('view-ai').prepend(note);
  const availability=document.createElement('p');availability.className='work-analysis-note';availability.dataset.w='localOnly';$('view-brokers').prepend(availability);
  $('loadSampleTradesBtn')?.setAttribute('disabled','');
  fetch('/api/health').then(r=>r.json()).then(data=>{capabilities={...data.capabilities,modelConfigured:data.openaiEnabled};render();}).catch(()=>{});
  window.addEventListener('thn:context',e=>{if(selected!==e.detail.symbol)select(e.detail.symbol);else loadFocus();});
  select(selected);render();refresh();
})();
