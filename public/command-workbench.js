import {commandEvidence} from './command-evidence.js';
import {escapeHTML as esc} from './decision-records.js';
import {recommendationReason} from './recommendation-core.js';

export function attachCommandWorkbench(){
 const $=id=>document.getElementById(id),tr=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
 const stamp=v=>Number.isFinite(v)?new Date(v).toISOString().replace('T',' ').slice(0,19)+' UTC':'—';
 const number=v=>Number.isFinite(v)?new Intl.NumberFormat(document.documentElement.lang==='ar'?'ar-OM':'en-US',{maximumFractionDigits:5}).format(v):'—';
 const button=(action,en,ar,attrs='')=>`<button type="button" class="ghost small" data-desk="${esc(action)}" ${attrs}>${tr(en,ar)}</button>`;
 const create=(tag,id,parent)=>{const el=document.createElement(tag);el.id=id;parent.append(el);return el;};
 const lead=$('evoDeskLead'),actions=create('div','deskPrimaryActions',lead);actions.className='desk-primary-actions';
 const source=create('div','deskSourceStrip',$('view-dashboard'));lead.after(source);source.className='desk-source-strip';
 const horizons=create('section','deskHorizons',$('commandAssessment'));$('commandVerdict').after(horizons);
 const ledger=create('section','deskEvidenceWorkbench',$('view-dashboard'));$('commandGrid').after(ledger);ledger.className='desk-evidence-workbench';
 const retained=create('section','deskRetainedContext',$('view-dashboard'));ledger.after(retained);retained.className='desk-retained-context';const provenance=$('evoProvenanceTitle').parentElement,provenanceHome=document.createComment('retained source disclosure');provenance.before(provenanceHome);
 const feed=$('commandFeedNote'),feedHome=document.createComment('independent-feed notice');feed.before(feedHome);
 const chartStatus=create('div','deskChartStatus',$('commandChartHost'));$('commandFeedNote').after(chartStatus);chartStatus.className='desk-chart-status';
 let filter='all',selectedLevel=null,contextKey='',returnFocus=null,returnFocusKey=null;
 const cache=new WeakMap();
 function replace(host,markup){
  if(cache.get(host)===markup)return;
  const active=host.contains(document.activeElement)?document.activeElement:null,key=active?.dataset.desk,id=active?.id;
  const open=[...host.querySelectorAll('details[id]')].map(n=>[n.id,n.open]);host.innerHTML=markup;cache.set(host,markup);
  for(const [id,value]of open){const node=host.querySelector('#'+CSS.escape(id));if(node)node.open=value;}
  if(id)host.querySelector('#'+CSS.escape(id))?.focus({preventScroll:true});else if(key)host.querySelector('[data-desk="'+CSS.escape(key)+'"]')?.focus({preventScroll:true});
 }
 const trend=v=>({bullish:tr('Upward','صاعد'),bearish:tr('Downward','هابط'),neutral:tr('Neutral','محايد')})[v]||tr('Unavailable','غير متاح');
 const reason=code=>({contract_unavailable:tr('Contract specification unavailable.','مواصفات العقد غير متاحة.'),currency_mismatch:tr('Provider currency does not match the instrument.','عملة المزود لا تطابق الأداة.'),invalid_recorded_levels:tr('Recorded levels fail direction or ordering checks.','تفشل المستويات المسجلة في شروط الاتجاه أو الترتيب.')}[code]||recommendationReason(code,document.documentElement.lang));
 const bias=v=>({BULLISH:tr('Bullish','صعودي'),BEARISH:tr('Bearish','هبوطي'),NEUTRAL:tr('Neutral','محايد')})[v]||tr('Unclassified','غير مصنف');
 function evidence(model=THNCommand.state()){const context=THNContext.get();return commandEvidence({model,context,series:THNResearch.series(),brief:THNDecision.brief(),analysis:THNConfidence.review().analysis});}
 function returnTarget(){return returnFocus?.isConnected?returnFocus:(returnFocusKey?document.querySelector('[data-desk="'+CSS.escape(returnFocusKey)+'"]'):null)||$('qCandles');}
 function focusSection(id){returnFocus=document.activeElement;returnFocusKey=returnFocus?.dataset.desk||null;const el=$(id);el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({block:'start',behavior:'instant'});}
 function decorateChart(model=THNCommand.state()){
  const p=THNResearch.chart.plot,svg=$('commandOverlay'),points=THNCommand.coordinates();
  svg.querySelectorAll('[data-desk-zone]').forEach(n=>n.remove());if(!model.candidate)selectedLevel=null;
  if(model.candidate&&p&&points.length){
   const entry=points.find(v=>v.label==='E'),stop=points.find(v=>v.label==='SL'),target=points.filter(v=>v.label.startsWith('T')).at(-1);
   for(const [name,end,color]of [['risk',stop,'var(--red)'],['reference',target,'var(--green)']])if(entry&&end){
    const rect=document.createElementNS(svg.namespaceURI,'rect');for(const [key,value]of Object.entries({x:p.left,y:Math.min(entry.y,end.y),width:p.width,height:Math.abs(entry.y-end.y),fill:color,'fill-opacity':'.055','data-desk-zone':name}))rect.setAttribute(key,String(value));svg.prepend(rect);
   }
  }
  svg.querySelectorAll('[data-level]').forEach(n=>{n.setAttribute('data-active',String(n.dataset.level===selectedLevel));});
  const visible=selectedLevel?points.find(v=>v.label===selectedLevel):null;
  const title=!model.candidate?tr('No eligible current levels. Review the matching evidence first.','لا مستويات حالية مؤهلة. راجع الأدلة المطابقة أولاً.'):selectedLevel?(visible?tr('Highlighted on the analysis chart: ','محدد على الرسم التحليلي: '):tr('Outside the visible price range: ','خارج نطاق السعر المرئي: '))+selectedLevel:tr('Recorded levels follow the chart’s actual price coordinates.','تتبع المستويات المسجلة إحداثيات السعر الفعلية للرسم.');
  replace(chartStatus,`<span role="status" id="deskLevelStatus">${esc(title)}</span>${button('source-bar','Locate source candle','تحديد شمعة المصدر',model.candidate?'':'disabled')}<small>${tr('Reference zones · no order, sizing or expected return','مناطق مرجعية · لا أمر أو حجم أو عائد متوقع')}</small>`);
  $('commandSetup').querySelectorAll('.command-levels>div').forEach((row,index)=>{
   const label=['E','SL','T1','T2','T3'][index],dd=row.querySelector('dd');if(!dd)return;
   const value=model.candidate?(index===0?model.candidate.entry:index===1?model.candidate.stop:model.candidate.targets[index-2]):null;const text=number(value);
   if(!model.candidate||!Number.isFinite(value)){if(dd.querySelector('button'))dd.textContent='—';return;}
   if(dd.querySelector('button')?.dataset.desk!==('level:'+label)||dd.textContent!==text)dd.innerHTML=button('level:'+label,esc(text),esc(text),`aria-label="${esc(tr('Inspect recorded ','فحص المرجع المسجل ')+label)}"`);
   dd.querySelector('button')?.setAttribute('aria-pressed',String(selectedLevel===label));
  });
 }
 const originalDraw=THNResearch.chart.draw.bind(THNResearch.chart);THNResearch.chart.draw=function(){originalDraw();decorateChart();};
 function render(){
  const home=$('view-dashboard').classList.contains('view-active');if(home){if(provenance.parentElement!==retained)retained.append(provenance);}else provenanceHome.after(provenance);
  const plot=$('qCandles').closest('.q-canvas-shell').parentElement;if(home&&THNProfessional.mode()==='research'){if(feed.previousElementSibling!==plot)plot.after(feed);}else feedHome.after(feed);if(chartStatus.previousElementSibling!==feed&&home&&THNProfessional.mode()==='research')feed.after(chartStatus);
  if(matchMedia('(max-width:1100px)').matches){if(source.previousElementSibling!==$('commandGrid'))$('commandGrid').after(source);}else if(source.parentElement!==lead)lead.append(source);
  const conviction=$('dashboardConviction');if(conviction.parentElement===$('commandAssessment')&&conviction.nextElementSibling!==horizons)conviction.after(horizons);
  const c=THNContext.get(),m=THNCommand.state(),e=evidence(m),key=[c.symbol,c.interval,c.datasetId].join('|');if(key!==contextKey||!m.candidate){selectedLevel=null;contextKey=key;}
  replace(actions,button('analyze','Run evidence review','تشغيل مراجعة الأدلة',m.phase==='loading'?'disabled':'')+button('evidence','Cross-check evidence','تدقيق الأدلة')+(m.phase==='loading'?button('cancel','Cancel review','إلغاء المراجعة'):''));
  source.dataset.phase=m.phase;replace(source,`<div><span class="desk-status-dot" aria-hidden="true"></span><strong>${esc(c.symbol)} <bdi>${esc(c.interval)}</bdi></strong><span>${tr('Closed-bar observations','مشاهدات شموع مغلقة')}</span></div><div><bdi>${esc(e.source?.providerSymbol||'—')}</bdi><span>${tr('Closed bar opened','افتتاح الشمعة المغلقة')}: <bdi>${stamp(e.source?.lastTime)}</bdi></span></div>${button('source','Source & context','المصدر والسياق')}<small>${m.fresh?tr('Recent at retrieval · not a live quote','حديثة عند الاسترجاع · ليست سعراً حياً'):tr('Current context not verified · refresh or complete analysis','السياق الحالي غير متحقق · حدث البيانات أو أكمل التحليل')}</small>`);
  replace(horizons,`<div class="desk-section-caption">${tr('INDEPENDENT TIMEFRAMES','الأطر الزمنية المستقلة')}</div><div class="desk-horizon-grid">${e.frames.map(f=>`<button type="button" data-desk="frame:${f.interval}" data-trend="${f.trend||'unavailable'}" aria-label="${esc(tr('Inspect recorded ','فحص الأدلة المسجلة ')+f.interval)}"><bdi>${f.interval}</bdi><strong>${trend(f.trend)}</strong><small>${f.status==='recent'?tr('Recorded','مسجل'):f.status==='stale'?tr('Stale','قديم'):tr('Missing','مفقود')}</small></button>`).join('')}</div>`);
  const counts={all:e.schools.length,BULLISH:e.schools.filter(s=>s.bias==='BULLISH').length,BEARISH:e.schools.filter(s=>s.bias==='BEARISH').length,NEUTRAL:e.schools.filter(s=>s.bias==='NEUTRAL').length};
  replace(ledger,`<header class="desk-ledger-header"><div><p class="eyebrow">${tr('EVIDENCE CROSS-CHECK','تدقيق الأدلة')}</p><h2 id="deskEvidenceTitle">${tr('See the agreement. Inspect the opposition.','شاهد التوافق وافحص الأدلة المعارضة.')}</h2><p>${tr('Independent observations share a market context, not a calibrated probability.','تشترك المشاهدات المستقلة في سياق السوق وليست احتمالاً معايراً.')}</p></div>${button('return','Return to chart','العودة للرسم')}</header><div class="desk-ledger-grid"><section><h3>${tr('Recorded multi-timeframe evidence','أدلة الأطر المتعددة المسجلة')}</h3><div class="desk-frame-ledger">${e.frames.map(f=>`<details id="deskFrame-${f.interval}" data-frame="${f.interval}"><summary><bdi>${f.interval}</bdi><strong>${trend(f.trend)}</strong><span>${f.selected?tr('Selected context','السياق المختار'):tr('Independent frame','إطار مستقل')}</span></summary><div><p>${f.status==='recent'?tr('Recent closed observations','مشاهدات مغلقة حديثة'):tr('Evidence missing or stale; no replacement is assumed.','الأدلة مفقودة أو قديمة؛ لا يُفترض بديل.')}</p><dl>${[['EMA20',f.ema20],['EMA50',f.ema50],['RSI',f.rsi],['ATR',f.atr]].map(([k,v])=>`<div><dt>${k}</dt><dd><bdi>${number(v)}</bdi></dd></div>`).join('')}</dl><p>${esc(f.source||'—')} / <bdi>${esc(f.providerSymbol||'—')}</bdi></p><small>${stamp(f.lastTime)}</small><code>${esc(f.hash||'—')}</code>${button('context:'+f.interval,'Open this market timeframe','فتح إطار السوق هذا',f.status==='recent'?'':'disabled')}</div></details>`).join('')}</div><details id="deskSourceCertificate"><summary>${tr('Dataset identity & provenance','هوية البيانات ومصدرها')}</summary><div><p>${esc(e.source?.source||'—')} / ${esc(e.source?.providerSymbol||'—')}</p><code>${esc(e.source?.hash||'—')}</code><p>${stamp(e.source?.lastTime)}</p><p>${tr('Dataset identity links observations; it does not authenticate imported or saved records. Closed history is not a provider execution quote.','تربط هوية البيانات المشاهدات ولا توثق السجلات المستوردة أو المحفوظة. التاريخ المغلق ليس عرض سعر تنفيذ من المزود.')}</p>${button('source-details','Open retained methodology','فتح المنهجية المحفوظة')}</div></details></section><section><h3>${tr('What supports or challenges the view?','ما الذي يدعم الرؤية أو يعارضها؟')}</h3><div class="desk-school-filters" role="group" aria-label="${tr('School evidence filter','تصفية أدلة المدارس')}">${['all','BULLISH','BEARISH','NEUTRAL'].map(v=>button('filter:'+v,(v==='all'?'All':{BULLISH:'Bullish',BEARISH:'Bearish',NEUTRAL:'Neutral'}[v])+' · '+counts[v],(v==='all'?'الكل':{BULLISH:'صعودي',BEARISH:'هبوطي',NEUTRAL:'محايد'}[v])+' · '+counts[v],`aria-pressed="${filter===v}"`)).join('')}</div><p class="desk-evidence-limit">${tr('Price-derived heuristics; no live news, fundamental or sentiment feed. Counts are not independent votes or a success rate.','استدلالات مشتقة من السعر؛ لا تدفق حي للأخبار أو الأساسيات أو المشاعر. الأعداد ليست أصواتاً مستقلة أو نسبة نجاح.')}</p><div class="desk-school-list">${e.schools.filter(s=>filter==='all'||s.bias===filter).map(s=>`<details id="deskSchool-${s.id}" data-school-bias="${s.bias}"><summary><span>${esc(document.documentElement.lang==='ar'&&window.localizedSchoolName?window.localizedSchoolName(s.name):s.name)}</span><b>${bias(s.bias)}</b></summary><div><p>${esc(document.documentElement.lang==='ar'&&window.summarizeReasonAr?window.summarizeReasonAr(s):s.reasons.join(' · ')||tr('No retained explanatory detail.','لا تفاصيل تفسيرية محفوظة.'))}</p>${s.warnings.map(w=>`<p>${esc(w)}</p>`).join('')}</div></details>`).join('')||`<p>${e.schools.length?tr('No retained schools in this filter. Other evidence can still disagree.','لا مدارس محفوظة في هذه التصفية. قد تختلف الأدلة الأخرى.'):tr('Matching fresh school evidence unavailable.','أدلة مدارس حديثة مطابقة غير متاحة.')}</p>`}</div><div class="desk-conditions"><h3>${tr('Requirements still to review','متطلبات لا تزال بحاجة للمراجعة')}</h3><ul>${e.blockingReasons.map(code=>`<li>${esc(reason(code))}</li>`).join('')||`<li>${tr('No additional data blocker recorded. Hypothetical risk still needs explicit validation.','لم يُسجل مانع بيانات إضافي. لا تزال المخاطر الافتراضية تحتاج تحققاً صريحاً.')}</li>`}</ul>${button('planner','Review hypothetical assumptions','مراجعة الافتراضات الافتراضية')}${button('reasoning','Inspect full reasoning','فحص التفسير الكامل')}</div></section></div>`);
  decorateChart(m);
 }
 document.addEventListener('click',event=>{
  if(event.target.closest('#proResearchMode,#proTradingViewMode'))render();const action=event.target.closest('[data-desk]')?.dataset.desk;if(!action)return;
  if(action==='analyze')$('commandVerdict').querySelector('[data-command=analyze]')?.click();
  if(action==='cancel')document.querySelector('[data-command=cancel]')?.click();
  if(action==='evidence')focusSection('deskEvidenceTitle');
  if(action==='source'){focusSection('deskSourceCertificate');$('deskSourceCertificate').open=true;}
  if(action==='return'){const target=returnTarget();target.focus({preventScroll:true});$('proTerminal').scrollIntoView({block:'start'});}
  if(action==='source-details'){$('commandRationale').open=true;$('commandSourceDetails').open=true;$('commandSourceTitle').focus();}
  if(action.startsWith('frame:')){const details=$('deskFrame-'+action.slice(6));details.open=true;focusSection(details.id);details.querySelector('summary').focus({preventScroll:true});}
  if(action.startsWith('filter:')){filter=action.slice(7);render();}
  if(action.startsWith('context:')){const frame=action.slice(8);if(!evidence().frames.some(f=>f.interval===frame&&f.status==='recent'))return;$('qInterval').value=frame;$('qInterval').dispatchEvent(new Event('change',{bubbles:true}));$('qCandles').focus({preventScroll:true});}
  if(action.startsWith('level:')){if(!THNCommand.state().candidate)return;selectedLevel=action.slice(6);decorateChart();$('deskChartStatus').scrollIntoView({block:'center'});}
  if(action==='source-bar'){const candidate=THNCommand.state().candidate,s=THNResearch.series();if(!candidate||candidate.hash!==s?.provenance.hash)return;const index=s.candles.findIndex(v=>v.time===candidate.barTime);if(index>=0){THNStudio.inspect(index);$('studioInspectorTitle').focus();}}
  if(action==='planner'){$('commandPlanner').open=true;$('commandPlannerTitle').focus();}
  if(action==='reasoning'){$('commandRationale').open=true;$('commandRationaleTitle').focus();}
 });
 ledger.addEventListener('keydown',event=>{if(event.key==='Escape'&&returnFocus){returnTarget().focus({preventScroll:true});event.preventDefault();}});
 window.addEventListener('thn:command-render',render);render();
}
