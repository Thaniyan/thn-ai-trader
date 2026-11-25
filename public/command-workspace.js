import {workspaceSummary,analyticalSummary} from './workspace-summary-core.js';
import {recommendationReason} from './recommendation-core.js';
import {escapeHTML as esc} from './decision-records.js';

// Consolidate existing owners and controls, preserving their nodes, state and
// original destinations. The same chart/form/evaluator/Library remain in use.
export function attachCommandWorkspace(){
 const $=id=>document.getElementById(id),home=$('view-dashboard'),tr=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
 document.documentElement.classList.add('cohesive-workspace');
 const more=document.createElement('details');more.id='workspaceMore';more.className='workspace-more';more.innerHTML='<summary id="workspaceMoreTitle"></summary><div id="workspaceMoreBody"></div>';home.append(more);
 const gate=document.createElement('section');gate.id='workspaceTicketGate';gate.dataset.commandPreserve='ticket-gate';gate.setAttribute('aria-labelledby','workspaceTicketGateTitle');
 const direction=document.createElement('span');direction.id='workspaceAnalyticalDirection';direction.dataset.commandPreserve='analytical-direction';
 const anchors=new Map();let cache='',queued=false,lastHome=true,homeChartOpen=$('commandAdvancedChart').open;
 $('commandAdvancedChart').addEventListener('toggle',()=>{if(home.classList.contains('view-active'))homeChartOpen=$('commandAdvancedChart').open;});
 function dock(node,parent){if(!node||!parent||node.parentElement===parent)return;if(!anchors.has(node)){const mark=document.createComment('retained '+(node.id||'workspace control'));node.before(mark);anchors.set(node,mark);}const focus=node.contains(document.activeElement)?document.activeElement:null;parent.append(node);focus?.focus({preventScroll:true});}
 function restore(node){const anchor=anchors.get(node);if(anchor?.isConnected&&node.previousSibling!==anchor)anchor.after(node);}
 const historyHead=$('qRefresh').closest('.panel-head');
 const chartPanel=document.querySelector('.q-chart-panel'),chartExtras=[...chartPanel.children].filter(n=>n.tagName==='DETAILS'||n.id==='proActiveTool'||n.matches('p[data-r=noteMethod]'));
 const legacy=[...home.children].find(n=>n.tagName==='BUTTON');
 // View restoration must finish in the navigation event, before any caller
 // inspects or opens progressive controls. The existing native toggle listener
 // owns the home preference; the legacy off-home expansion must not overwrite it.
 function syncChartDisclosure(){
  const active=home.classList.contains('view-active');
  if(active&&!lastHome)$('commandAdvancedChart').open=homeChartOpen;
  lastHome=active;
 }
 window.addEventListener('thn:view',syncChartDisclosure,{capture:true});
 function render(){
  const active=home.classList.contains('view-active');document.documentElement.classList.toggle('cohesive-home',active);
  syncChartDisclosure();
  more.querySelector('summary').textContent=tr('More tools & research activity','أدوات إضافية ونشاط البحث');
  if(!active){$('commandFeedNote').hidden=false;for(const node of [...chartExtras,$('commandLegend'),historyHead,$('qSeriesStatus'),$('commandLegacyActions'),$('commandFullReviewStatus'),$('evoAssistantAccess'),$('deskDecisionBrief'),$('trustReviewAction'),$('evoProviderState')])restore(node);return;}
  for(const node of [$('flowWatchlist'),$('precisionFooterLinks'),$('evoDashboard'),legacy,$('evoBriefDetails'),$('m65DashboardDetails'),$('studioJourney')])dock(node,$('workspaceMoreBody'));
  if(home.lastElementChild!==more)home.append(more);
  for(const node of [...chartExtras,$('commandLegacyActions'),$('commandLegend'),historyHead])dock(node,$('commandAdvancedChart'));
  // Keep refresh/export, history navigation and the original zoom nodes directly
  // usable. Only long metadata/drawing/legacy sections are progressive details.
  $('qRefresh').dataset.commandPreserve='history-refresh';$('qAnalysisExport').dataset.commandPreserve='history-export';dock($('qRefresh'),$('deskChartNavigation'));dock($('qAnalysisExport'),$('deskChartNavigation'));
  if(THNCommand.state().phase==='ready')dock($('qSeriesStatus'),$('commandAdvancedChart'));else restore($('qSeriesStatus'));
  $('commandFeedNote').hidden=THNProfessional.mode()==='research';
  $('evoAssistantAccess').textContent=tr('Full assistant','المساعد الكامل');$('evoAssistantAccess').dataset.commandPreserve='assistant-access';dock($('evoAssistantAccess'),$('precisionResearchNav'));
  $('interpretationOpen').dataset.commandPreserve='interpretation-access';dock($('interpretationOpen'),$('precisionResearchNav'));
  const explain=$('commandVerdict')?.querySelector('[data-command=reasoning]')||$('precisionResearchActions')?.querySelector('[data-command=reasoning]');dock(explain,$('workspaceMoreBody'));
  dock($('deskDecisionBrief'),$('commandRationale'));
  dock($('trustReviewAction'),$('heritageConfidenceTestActions'));
  const provider=$('evoProviderState');provider.dataset.commandPreserve='model-state';dock(provider,$('commandVerdict'));
  const setup=$('commandSetup'),m=THNCommand.state(),p=THNPrecision.review(),s=workspaceSummary(m,p);
  const analytical=analyticalSummary(m);
  const directionText=analytical.signal?`${tr('Engine hypothesis','فرضية المحرك')}: ${analytical.signal} · ${{bullish:tr('bullish','صاعد'),bearish:tr('bearish','هابط'),neutral:tr('neutral','محايد')}[analytical.bias]} · ${m.candidate?tr('research only','للبحث فقط'):tr('unqualified','غير مؤهلة')}`:tr('Analytical direction unavailable for the current context.','الاتجاه التحليلي غير متاح للسياق الحالي.');
  direction.textContent=directionText;direction.dataset.signal=analytical.signal||'unavailable';direction.setAttribute('dir','auto');if(m.candidate)direction.remove();else if(s.status==='wait')$('precisionStatus').replaceChildren(direction);else if(direction.previousElementSibling!==$('precisionStatus'))$('precisionStatus').after(direction);
  const reviewStatus=$('commandFullReviewStatus');reviewStatus.dataset.commandPreserve='review-status';const foreground=$('evoRunDesk').disabled||/Analysis unavailable|التحليل غير متاح/.test($('evoDeskRunStatus').textContent);if(foreground)restore(reviewStatus);else dock(reviewStatus,$('commandReasoning'));
  if(gate.parentElement!==setup)setup.append(gate);
  const levels=setup.querySelector('.command-levels');if(s.candidate){const detail=$('precisionSetupDetail');if(detail&&gate.previousElementSibling!==detail)detail.after(gate);}else if(levels&&gate.previousElementSibling!==levels)levels.after(gate);
  const reasons={source_identity_unverified:tr('Source identity is not verified.','هوية المصدر غير متحققة.'),currency_mismatch:tr('Source currency is unavailable or incompatible.','عملة المصدر غير متاحة أو غير متوافقة.'),contract_unavailable:tr('Contract specifications are unavailable.','مواصفات العقد غير متاحة.'),invalid_recorded_levels:tr('Recorded level geometry is invalid.','هندسة المستويات المسجلة غير صالحة.')};
  const next={identity:tr('Review the recorded product, quote currency and contract. No proxy or currency substitution is permitted.','راجع المنتج المسجل وعملة التسعير والعقد. لا يُسمح باستبدال المصدر أو العملة.'),quality:tr('Inspect recorded gaps and rejected rows. Source-quality blockers must be resolved before a setup can qualify.','افحص الفجوات والصفوف المرفوضة المسجلة. يجب حل موانع جودة المصدر قبل تأهل سيناريو.'),source:tr('Obtain fresh matching observations through the existing source, then review again. Do not reuse stale levels.','احصل على مشاهدات حديثة مطابقة من المصدر القائم ثم راجع مجدداً. لا تُعد استخدام مستويات قديمة.'),frames:tr('Review all three matching timeframes. Missing evidence is not agreement.','راجع الأطر الثلاثة المطابقة. غياب الأدلة لا يعني التوافق.'),risk:tr('Validate these recorded levels with explicit capital, risk, leverage and costs in the original planner.','تحقق من هذه المستويات المسجلة برأس مال ومخاطر ورافعة وتكاليف صريحة في المخطط الأصلي.'),confirmation:tr('Wait for the original recorded closed-candle condition; a pending hypothesis releases no eligible prices.','انتظر شرط الشمعة المغلقة الأصلي المسجل؛ لا تتيح الفرضية المعلقة أسعاراً مؤهلة.'),direction:tr('Wait for a coherent original assessment and recorded confirmation. A higher confluence score alone cannot qualify a trade.','انتظر تقييماً أصلياً متسقاً وتأكيداً مسجلاً. لا تؤهل درجة توافق أعلى وحدها صفقة.')}[s.next];
  const html=`<h3 id="workspaceTicketGateTitle">${s.candidate?tr('Recorded setup · risk review','سيناريو مسجل · مراجعة المخاطر'):tr('What is blocking this setup?','ما الذي يمنع هذا السيناريو؟')}</h3>${!s.candidate?`<ul>${s.primary.map(code=>`<li data-workspace-blocker="${esc(code)}">${esc(code==='data_quality'&&analytical.current?tr(`Quality: ${analytical.gaps??'unknown'} gaps; ${analytical.discardedRows??'unknown'} rejected rows.`, `الجودة: ${analytical.gaps??'غير معلوم'} فجوة؛ ${analytical.discardedRows??'غير معلوم'} صف مرفوض.`):reasons[code]||recommendationReason(code,document.documentElement.lang))}</li>`).join('')}</ul>`:''}<p><b>${tr('Next check','التحقق التالي')}: </b>${s.status==='eligible'?tr('Review activation, invalidation and opposing evidence. Research eligibility is never execution approval.','راجع التفعيل والإبطال والأدلة المعارضة. أهلية البحث ليست تصريح تنفيذ.'):esc(next)}</p><button type="button" class="ghost small" data-desk="source">${tr('Inspect source & all blockers','فحص المصدر وجميع الموانع')}</button>`;
  if(html!==cache){const focused=gate.contains(document.activeElement);gate.innerHTML=html;cache=html;if(focused)gate.querySelector('button')?.focus({preventScroll:true});}
  gate.dataset.status=s.status;gate.hidden=s.candidate;setup.dataset.workspaceStatus=s.status;
  if(s.status==='wait'){dock(setup.querySelector('.desk-no-setup'),$('precisionWaitingConditions'));const why=setup.querySelector('[data-trust=candidate]');if(why)why.textContent=tr('Why WAIT?','لماذا الانتظار؟');}
  const dataStatus=$('decisionDataStatus');if(m.warnings.includes('data_quality'))dataStatus.textContent=tr('Blocked · gaps / rejected rows','محجوبة · فجوات / صفوف مرفوضة');
  $('decisionDataLabel').textContent=tr('Data qualification','تأهيل البيانات');
  const why=$('trustReviewAction');why.textContent=tr('Explain score','تفسير الدرجة');why.setAttribute('aria-label',tr('Explain heuristic confluence and its limitations','تفسير التوافق الاستدلالي وحدوده'));
  $('commandRationaleTitle').querySelector('.precision-research-caption').textContent=tr('Research workspace · evidence, AI, history & notes','مساحة البحث · الأدلة والذكاء والتاريخ والملاحظات');
  $('commandAdvancedChartTitle').textContent=tr('Chart settings, drawings & original tools','إعدادات الرسم والرسومات والأدوات الأصلية');
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
 // Restore explicitly requested original advanced destinations before their
 // existing owner focuses them. Opening a disclosure never runs calculations.
 document.addEventListener('click',event=>{if(event.target.closest('#proDrawingDock [data-pro-draw=note]'))$('commandAdvancedChart').open=true;},true);
 document.addEventListener('click',e=>{if(e.target.closest('#proResearchMode,#proTradingViewMode'))schedule();});
 more.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented){more.open=false;$('workspaceMoreTitle').focus({preventScroll:true});}});
 function withdrawDirection(){direction.dataset.signal='unavailable';direction.textContent=tr('Analytical direction unavailable for the current context.','الاتجاه التحليلي غير متاح للسياق الحالي.');}
 for(const event of ['thn:context','thn:research-context'])window.addEventListener(event,withdrawDirection);
 for(const event of ['thn:command-render','thn:view','thn:plan'])window.addEventListener(event,schedule);
 for(const event of ['thn:context','thn:intelligence','thn:analysis','thn:series'])window.addEventListener(event,schedule);
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-theme']});
 window.THNCommandWorkspace={render,summary:()=>workspaceSummary(THNCommand.state(),THNPrecision.review())};render();
}
