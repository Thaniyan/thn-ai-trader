import './analysis-cockpit.js';
import {recommendationReview,recommendationTitle,recommendationReason} from './recommendation-core.js';

const $=id=>document.getElementById(id);
const tr=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
const go=view=>document.querySelector(`.nav-stack [data-view="${view}"]`).click();
const titles={dashboard:['Trading Command Center','مركز تحليل التداول'],markets:['Markets','اكتشاف الأسواق'],trading:['Chart','منصة الرسم'],ai:['AI Research','بحث الذكاء'],risk:['Risk Desk','تخطيط المخاطر'],portfolio:['Historical Lab','المختبر التاريخي'],journal:['Research Library','مكتبة الأبحاث'],brokers:['Broker Accounts','اتصالات الوسطاء'],settings:['Settings','إعدادات المساحة']};
const descriptions={dashboard:['One market. A clear recommendation. Your next research step.','سوق واحد. توصية واضحة. خطوتك البحثية التالية.'],markets:['Find a market, inspect its source, then open the shared workspace.','اختر سوقاً وافحص مصدره ثم افتح مساحة العمل المشتركة.'],trading:['Read the chart alongside the recommendation and its conditions.','اقرأ الرسم مع التوصية وشروطها.'],ai:['Understand the recommendation, challenge its evidence and test your thesis.','افهم التوصية وتحدّ أدلتها واختبر فرضيتك.'],risk:['Validate your assumptions before considering a position.','تحقق من افتراضاتك قبل التفكير في مركز.'],portfolio:['Test fixed strategy rules on separate historical windows.','اختبر قواعد استراتيجية ثابتة على نوافذ تاريخية منفصلة.'],journal:['Revisit saved evidence, compare scenarios and preserve the original record.','راجع الأدلة المحفوظة وقارن السيناريوهات واحفظ السجل الأصلي.'],brokers:['Inspect supported capabilities before connecting any account.','افحص الإمكانات المدعومة قبل توصيل أي حساب.'],settings:['Appearance, research preferences and genuine model availability.','المظهر وتفضيلات البحث وتوفر النموذج الفعلي.']};
const purpose=document.createElement('p');purpose.id='workspacePurpose';purpose.className='workspace-purpose';$('proRouteTitle').after(purpose);
const searchButton=document.createElement('button');searchButton.id='workspaceMarketSearch';searchButton.type='button';searchButton.className='ghost workspace-market-search';searchButton.setAttribute('aria-haspopup','dialog');document.querySelector('.topbar-controls').prepend(searchButton);
const dialog=document.createElement('dialog');dialog.id='workspaceMarketDialog';dialog.className='workspace-market-dialog';dialog.setAttribute('aria-labelledby','workspaceMarketTitle');
dialog.innerHTML='<header><h2 id="workspaceMarketTitle"></h2><button type="button" class="ghost" id="workspaceMarketClose"></button></header><label for="workspaceMarketQuery" id="workspaceMarketLabel"></label><input id="workspaceMarketQuery" autocomplete="off" spellcheck="false" aria-controls="workspaceMarketResults"><p id="workspaceMarketNote"></p><div id="workspaceMarketResults"></div><p id="workspaceMarketEmpty" role="status"></p>';
document.body.append(dialog);let returnFocus=null,activeIndex=-1;
const marketNames={XAUUSD:['Gold','الذهب'],XAGUSD:['Silver','الفضة'],BTCUSD:['Bitcoin','بيتكوين'],BTCUSDT:['Bitcoin','بيتكوين'],ETHUSD:['Ethereum','إيثريوم'],EURUSD:['Euro / US Dollar','اليورو / الدولار'],GBPUSD:['British Pound / US Dollar','الجنيه الإسترليني / الدولار'],USDJPY:['US Dollar / Japanese Yen','الدولار / الين']};
function results(){return [...$('workspaceMarketResults').querySelectorAll('button')];}
function filterMarkets(){
 const query=$('workspaceMarketQuery').value.trim().toUpperCase(),items=THNMarketTerminal.catalog().filter(v=>`${v.symbol} ${v.providerSymbol} ${v.category} ${(marketNames[v.symbol]||[]).join(' ')}`.toUpperCase().includes(query)).slice(0,40);
 $('workspaceMarketResults').replaceChildren();activeIndex=-1;
 for(const item of items){const b=document.createElement('button');b.type='button';b.className='workspace-market-option';b.dataset.workspaceSymbol=item.symbol;const name=document.createElement('bdi'),detail=document.createElement('small');name.textContent=item.symbol;detail.textContent=(marketNames[item.symbol]?tr(...marketNames[item.symbol])+' · ':'')+item.category+' · '+item.providerSymbol;b.append(name,detail);b.onclick=()=>selectMarket(item.symbol);$('workspaceMarketResults').append(b);}
 $('workspaceMarketEmpty').textContent=items.length?'':tr('No matching instrument in the supported catalog.','لا أداة مطابقة في القائمة المدعومة.');
}
function openMarkets(){if($('proTerminal').classList.contains('pro-focused'))$('proChartFocus').click();returnFocus=document.activeElement;filterMarkets();dialog.showModal();$('workspaceMarketQuery').focus();}
searchButton.onclick=openMarkets;$('workspaceMarketClose').onclick=()=>dialog.close();$('workspaceMarketQuery').oninput=filterMarkets;
dialog.addEventListener('close',()=>{const prior=returnFocus;returnFocus=null;if(prior?.isConnected)prior.focus({preventScroll:true});});
dialog.addEventListener('keydown',event=>{
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const list=results();if(!list.length)return;activeIndex=activeIndex<0?(event.key==='ArrowDown'?0:list.length-1):(activeIndex+(event.key==='ArrowDown'?1:-1)+list.length)%list.length;list[activeIndex].focus();}
 if(event.key==='Enter'&&document.activeElement===$('workspaceMarketQuery')){const first=results()[0];if(first){event.preventDefault();first.click();}}
});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!dialog.open)openMarkets();}});
let intent=null,analysisBusy=false;
function selectMarket(symbol){
 dialog.close();go('dashboard');THNContext.set({symbol},'workspace-market-picker');intent={symbol,interval:THNContext.get().interval};void maybeAnalyze();
}
async function maybeAnalyze(){
 if(!intent||analysisBusy||$('analyzeBtn').disabled)return;
 const c=THNContext.get(),s=THNResearch.series();
 if(c.symbol!==intent.symbol||c.interval!==intent.interval){intent=null;return;}
 if(!s||s.symbol!==c.symbol||s.provenance.interval!==c.interval||s.provenance.hash!==c.datasetId)return;
 intent=null;if(THNConfidence.review().analysis)return;
 analysisBusy=true;$('symbolInput').value=c.symbol;$('timeframe').value=({'15m':'scalp','1h':'intraday','1d':'swing'})[c.interval];
 try{await analyze();}finally{analysisBusy=false;THNEvolution.refresh();schedule();void maybeAnalyze();}
}
for(const id of ['qSymbol','qInterval'])$(id).addEventListener('change',()=>{const c=THNContext.get();intent={symbol:c.symbol,interval:c.interval};void maybeAnalyze();});
// Automatic technical analysis is requested only by an explicit market choice.
// Opening a saved report, changing appearance, or rendering a view never runs it.
for(const event of ['thn:series','thn:research-context'])window.addEventListener(event,()=>void maybeAnalyze());
window.addEventListener('thn:context',()=>{const c=THNContext.get();if(intent&&(intent.symbol!==c.symbol||intent.interval!==c.interval))intent=null;});
new MutationObserver(()=>{THNEvolution.refresh();schedule();if(!$('analyzeBtn').disabled)void maybeAnalyze();}).observe($('analyzeBtn'),{attributes:true,attributeFilter:['disabled']});
document.addEventListener('click',event=>{const picked=event.target.closest('#view-markets [data-r66-select],#view-markets [data-r66-chart],#view-markets [data-evo-symbol]');if(picked){intent={symbol:THNContext.get().symbol,interval:THNContext.get().interval};void maybeAnalyze();}});
// Retain the original technical controls and values in one compact source audit.
const technical=document.createElement('details');technical.id='workspaceTechnicalDetails';technical.className='workspace-technical-details';const technicalSummary=document.createElement('summary');technical.append(technicalSummary);const contextSummary=$('proChartSummary');contextSummary.before(technical);technical.append(contextSummary);
// Put the actual Library ahead of the manual register; storage and record owners stay unchanged.
$('evoJournal').after($('decisionReports'));
const modelCard=document.createElement('article');modelCard.id='workspaceModelStatus';modelCard.className='panel workspace-model-status';$('evoSettings').after(modelCard);
function openModelSettings(){go('ai');const pilot=$('i71Pilot');pilot.open=true;pilot.querySelector('summary').focus({preventScroll:true});pilot.scrollIntoView({block:'start'});}
modelCard.addEventListener('click',event=>{if(event.target.closest('[data-workspace-model]'))openModelSettings();});
function confidenceLabel(label){return label==='BULLISH'?tr('Bullish consensus','توافق صعودي'):label==='BEARISH'?tr('Bearish consensus','توافق هبوطي'):tr('Wait for confirmation','انتظر التأكيد');}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
function render(){
 const view=document.querySelector('.view-active')?.id.replace('view-','')||'dashboard',language=document.documentElement.lang,c=THNContext.get();
 $('proRouteTitle').textContent=tr(...titles[view]);purpose.textContent=tr(...descriptions[view]);
 for(const el of document.querySelectorAll('.nav-stack [data-view]')){const key=el.dataset.view;el.querySelector('span').textContent=key==='dashboard'?tr('Command Center','مركز التحليل'):tr(...titles[key]);}
 searchButton.textContent=matchMedia('(max-width:760px)').matches?tr('Find','بحث'):tr('Find market','اختيار سوق')+' · Ctrl K';
 if(matchMedia('(max-width:760px)').matches){$('evoAssistantAccess').textContent='AI';$('evoAssistantAccess').setAttribute('aria-label',tr('Open research assistant','فتح مساعد البحث'));}searchButton.setAttribute('aria-label',tr('Find a market · Control K','اختيار سوق · Control K'));
 $('workspaceMarketTitle').textContent=tr('Choose your market','اختر سوقك');$('workspaceMarketClose').textContent=tr('Close · Esc','إغلاق · Esc');$('workspaceMarketLabel').textContent=tr('Symbol, provider symbol or asset class','الرمز أو رمز المزود أو فئة الأصل');$('workspaceMarketQuery').placeholder=tr('Search EURUSD, gold, crypto…','ابحث EURUSD أو gold أو crypto…');$('workspaceMarketNote').textContent=tr('Choose an instrument to open its chart and refresh technical analysis. Prices load from the existing provider; no model is called automatically.','اختر أداة لفتح رسمها وتحديث تحليلها الفني. تُجلب الأسعار من المزود القائم؛ لا يُستدعى نموذج تلقائياً.');
 technicalSummary.textContent=tr('Price context & reference levels','سياق السعر والمستويات المرجعية');
 const state=THNIntelligence.state();
 modelCard.innerHTML=`<p class="eyebrow">${tr('AI CONNECTION','اتصال الذكاء')}</p><h2>${state.available?tr('Model configured · verify inference','النموذج مُعد · تحقق من الاستدلال'):tr('Local Ollama not connected','أولاما المحلي غير متصل')}</h2><p>${state.available?tr('Use the authorized local pilot controls to check the installed model and request a grounded explanation.','استخدم ضوابط التجربة المحلية المصرح بها لفحص النموذج المثبت وطلب تفسير موثق.'):tr('Recommendations currently use explicit research rules. Genuine AI explanations require an installed model, a running local service and authorized configuration. No model is connected to this application.','تستخدم التوصيات حالياً قواعد بحث صريحة. تتطلب التفسيرات المولدة نموذجاً مثبتاً وخدمة محلية عاملة وإعداداً مصرحاً به. لا يتصل نموذج بهذا التطبيق.')}</p><button type="button" class="ghost" data-workspace-model>${tr('Inspect model availability','فحص توفر النموذج')}</button>`;
 const labels={trading:['Chart','الرسم'],ai:['AI Research','بحث الذكاء'],portfolio:['Historical Lab','المختبر التاريخي'],risk:['Risk plan','خطة المخاطر']};
 for(const el of $('evoFlow').querySelectorAll('[data-qgoto]'))if(labels[el.dataset.qgoto])el.textContent=tr(...labels[el.dataset.qgoto]);
 $('m65Library').textContent=tr('Research Library','مكتبة الأبحاث')+' · '+THNLibrary.entries().length;
 const review=THNConfidence.review();let plan=null;try{plan=THNDecision.snapshot().plan;}catch{}
 const rec=recommendationReview({context:c,series:THNResearch.series(),analysis:review.analysis,brief:THNDecision.brief(),plan,review:THNIntelligence.result(),reviewLanguage:state.language,language,busy:analysisBusy||state.busy||$('analyzeBtn').disabled});
 const homeTitle=document.querySelector('#dashboardConviction .home-consensus h2');
 if(homeTitle){homeTitle.textContent=rec.action==='WAIT'?tr('WAIT · no entry','انتظر · لا دخول'):rec.action==='BUY'?tr('BUY setup','سيناريو شراء'):rec.action==='SELL'?tr('SELL setup','سيناريو بيع'):tr('AVOID entry','تجنب الدخول');const host=homeTitle.parentElement;let bias=$('workspaceConsensus');if(!bias){bias=document.createElement('span');bias.id='workspaceConsensus';homeTitle.after(bias);}bias.textContent=confidenceLabel(review.analysis?.consensusLabel);host.firstElementChild.textContent=tr('RECOMMENDATION & CONFIDENCE','التوصية والثقة');}
 const title=document.querySelector('#analysisCockpit .cockpit-decision h3');if(title){title.textContent=recommendationTitle(rec,language);title.dataset.recommendationAction=rec.action;const explanation=title.nextElementSibling;if(explanation?.tagName==='P')explanation.textContent=rec.reasons.slice(0,2).map(code=>recommendationReason(code,language)).join(' ')||tr('Review the current quote and validate hypothetical risk before entry.','راجع السعر الحالي وتحقق من المخاطر الافتراضية قبل الدخول.');}
 $('cockpitTitle').textContent=tr('Analysis & trading recommendation','التحليل وتوصية التداول');
 $('evoRunDesk').textContent=$('evoRunDesk').disabled?tr('Reviewing market…','جار مراجعة السوق…'):tr('Analyze & recommend','تحليل وتوصية');
}
for(const event of ['thn:view','thn:analysis','thn:decision','thn:series','thn:intelligence','thn:evaluation','thn:plan','thn:library','thn:desk-state'])window.addEventListener(event,schedule);
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-theme']});
window.THNWorkspace={openMarkets,selectMarket,refreshMarket:()=>{const c=THNContext.get();intent={symbol:c.symbol,interval:c.interval};$('qRefresh').click();THNDecision.reload();$('qMTFRefresh').click();void maybeAnalyze();},openModelSettings,marketName:(symbol,language=document.documentElement.lang)=>marketNames[symbol]?.[language==='ar'?1:0]||symbol,recommendation:()=>{const c=THNContext.get(),confidence=THNConfidence.review();let plan=null;try{plan=THNDecision.snapshot().plan;}catch{}return recommendationReview({context:c,series:THNResearch.series(),analysis:confidence.analysis,brief:THNDecision.brief(),plan,review:THNIntelligence.result(),reviewLanguage:THNIntelligence.state().language,language:document.documentElement.lang,busy:analysisBusy||THNIntelligence.state().busy||$('analyzeBtn').disabled});}};
render();
