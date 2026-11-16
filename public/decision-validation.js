import {decisionValidationEvidence} from './decision-validation-core.js';

export function attachDecisionValidation(){
 const $=id=>document.getElementById(id),tr=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
 const mount=document.createElement('div');mount.id='heritageDecisionConfidence';mount.dataset.commandPreserve='decision-validation';
 const root=document.createElement('section');root.id='decisionValidation';mount.append(root);root.setAttribute('aria-label',tr('Decision evidence and historical validation','أدلة القرار والتحقق التاريخي'));
 root.innerHTML='<div id="heritageConfidenceTestActions"><div id="decisionConfluenceHost"></div><button type="button" class="ghost small" id="heritageConfidenceTestAction" data-trust="test" aria-controls="trustTest"></button></div><dl id="decisionValidationStatus" aria-live="polite"><div><dt id="decisionHistoryLabel"></dt><dd id="decisionHistoryStatus"><span id="decisionHistoryState"></span><bdi dir="ltr" id="decisionHistoryCount"></bdi><span id="decisionHistoryMeaning"></span></dd></div><div><dt id="decisionDataLabel"></dt><dd id="decisionDataStatus"></dd></div></dl>';
 let queued=false;
 function render(){
  const home=$('view-dashboard').classList.contains('view-active');
  const compact=matchMedia('(max-width:900px)').matches;
  // Initialize connected owned markup even when a persisted route opens outside Dashboard.
  if(mount.parentElement!==$('commandVerdict'))$('commandVerdict').append(mount);
  if(home){
   const verdict=$('commandVerdict'),actions=verdict.querySelector(':scope>.q-actions');
   if(actions&&!actions.children.length&&!actions.textContent.trim())actions.replaceChildren();
   const host=compact?$('commandQuickAssessment'):$('evoDeskLead');
   if(verdict.parentElement!==host)host.prepend(verdict);
   if($('dashboardConviction').parentElement!==$('decisionConfluenceHost'))$('decisionConfluenceHost').append($('dashboardConviction'));
   let limits=$('heritageConfidenceLimits');if(!limits){limits=document.createElement('div');limits.id='heritageConfidenceLimits';limits.setAttribute('role','note');root.append(limits);}
   if($('precisionProbability').parentElement!==limits)limits.append($('precisionProbability'));
   if($('precisionSchoolContextTitle'))$('precisionSchoolContextTitle').textContent=tr('Evidence','الأدلة');
   if($('precisionStatus').dataset.state==='eligible')$('precisionStatus').textContent=tr('Research only · not an order','للبحث فقط · ليس أمراً');
   $('precisionProbability').textContent=tr('Fixed-rule test, not this individual setup. Calibrated win probability unavailable.','اختبار قواعد ثابتة، لا هذا السيناريو الفردي. احتمال الربح المعاير غير متاح.');
  }
  root.setAttribute('aria-label',tr('Decision evidence and historical validation','أدلة القرار والتحقق التاريخي'));
  const data=decisionValidationEvidence({model:THNCommand.state(),context:THNContext.get(),analysis:THNConfidence.review().analysis,evaluation:THNResearch.evaluation?.(),evaluationState:THNResearch.evaluationState?.(),series:THNResearch.series()});
  root.dataset.validation=data.status;root.dataset.reliability=data.reliability;
  if(home){const value=data.confluence===null?'—':String(data.confluence);$('dashboardConfidenceValue').textContent=value;const ring=$('dashboardConviction').querySelector('.home-confidence-ring');const score=ring?.querySelector(':scope>div');if(score){score.id='heritageConfidenceEvidence';const denominator=score.querySelector('small');if(denominator)denominator.textContent='/ 100';}ring?.setAttribute('aria-label',tr('Heuristic evidence strength: ','قوة الأدلة الاستدلالية: ')+value+'/100');if($('precisionSchoolContextTitle'))$('precisionSchoolContextTitle').textContent=data.confluence===null?tr('Unavailable','غير متاحة'):tr('Evidence','الأدلة');}
  const label={untested:tr('Not tested','لم يُختبر'),running:tr('Running…','جار الاختبار…'),failed:tr('Failed · retry','فشل · أعد المحاولة'),stale:tr('Stale · review','قديم · راجع'),complete:tr('Complete','مكتمل')}[data.status];
  $('decisionHistoryLabel').textContent=tr('Fixed-rule test','اختبار قواعد ثابتة');
  $('decisionHistoryState').textContent=label;
  $('decisionHistoryCount').textContent=data.passed===null?'':` · ${data.passed}/${data.total} `;
  $('decisionHistoryMeaning').textContent=data.passed===null?'':tr('met','مستوفاة');
  $('decisionHistoryStatus').title=tr('Passed requirements are not a win rate. This evaluates fixed rules, not this individual trade.','المتطلبات الناجحة ليست معدل فوز. يقيم الاختبار قواعد ثابتة وليس هذه الصفقة المفردة.');
  $('decisionDataLabel').textContent=tr('Data reliability','موثوقية البيانات');
  $('decisionDataStatus').textContent={current:tr('Recent · matched','حديثة · مطابقة'),stale:tr('Stale','قديمة'),gaps:tr('Gaps · review','فجوات · راجع'),unavailable:tr('Unavailable','غير متاحة')}[data.reliability];
  $('decisionDataStatus').title=data.provenance?[data.provenance.source,data.provenance.providerSymbol,Number.isFinite(data.provenance.lastTime)?new Date(data.provenance.lastTime).toISOString():''].filter(Boolean).join(' · '):tr('No matching current source evidence.','لا أدلة مصدر حالية مطابقة.');
  const view=data.status==='complete'||data.status==='stale'&&data.retained;
  const action=$('heritageConfidenceTestAction');action.dataset.trust=view?'history':'test';action.setAttribute('aria-controls',view?'trustHistorical':'trustTest');action.disabled=false;
  action.textContent=data.status==='running'?tr('Running…','جار الاختبار…'):view?tr('View test','عرض الاختبار'):tr('Test','اختبار');action.setAttribute('aria-label',data.status==='running'?tr('Inspect running historical test','فحص الاختبار التاريخي الجاري'):view?tr('View original historical validation','عرض التحقق التاريخي الأصلي'):tr('Open original historical confidence test','فتح اختبار الثقة التاريخي الأصلي'));
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
 for(const event of ['thn:command-render','thn:view','thn:analysis','thn:evaluation','thn:evaluation-state','thn:context','thn:series'])window.addEventListener(event,render);
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-theme']});matchMedia('(max-width:900px)').addEventListener('change',schedule);
 window.THNDecisionValidation={render};render();
}
