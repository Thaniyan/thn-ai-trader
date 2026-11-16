import {escapeHTML as esc} from './decision-records.js';

// Reconcile THN's original identity with the current single owned workstation.
// This module presents retained results; it calculates no financial values.
export function attachHeritageDesk(){
 const $=id=>document.getElementById(id);
 const tr=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
 document.documentElement.classList.add('heritage-desk');
 const welcome=document.createElement('div');welcome.id='heritageWelcome';
 $('evoDeskLead').prepend(welcome);
 const markets=document.createElement('nav');markets.id='heritageMarkets';
 welcome.append(markets);
 const meaning=document.createElement('p');meaning.id='heritageLevelMeaning';meaning.setAttribute('role','status');
 let selected=null,lastContext='',queued=false;
 const meanings={
  E:['Entry is a recorded research reference, not an executable quote.','الدخول مرجع بحثي مسجل وليس سعر تنفيذ.'],
  SL:['The recorded stop is a risk reference; gaps and slippage can exceed it.','الوقف المسجل مرجع للمخاطر؛ قد تتجاوزه الفجوات والانزلاق.'],
  T:['Targets are independent recorded objectives, not a partial-exit allocation or promised return.','الأهداف مراجع مستقلة مسجلة وليست توزيع خروج جزئي أو عائداً مضموناً.']
 };
 function levelGuide(code){const key=code==='E'?'E':code==='SL'?'SL':'T';return tr(...meanings[key]);}
 function render(){
  const home=$('view-dashboard').classList.contains('view-active');
  document.documentElement.classList.toggle('heritage-home',home);
  const c=THNContext.get(),m=THNCommand.state(),review=THNPrecision.review();
  $('commandVerdict').dataset.heritageState=review.status;$('commandVerdict').dataset.heritageCandidate=String(!!review.candidate);
  if(home&&$('deskSourceStrip').parentElement!==$('precisionFooterLinks'))$('precisionFooterLinks').prepend($('deskSourceStrip'));
  const context=[c.symbol,c.interval,c.datasetId].join('|');if(context!==lastContext){lastContext=context;selected=null;}
  let intro=$('heritageIntro');if(!intro){intro=document.createElement('div');intro.id='heritageIntro';welcome.prepend(intro);}
  const introHTML=`<p class="heritage-eyebrow">${tr('THN / MARKET INTELLIGENCE','THN / أبحاث السوق')}</p><h2>${tr('Analyze your market.','حلل سوقك.')}</h2><p>${tr('Select an instrument. Review the evidence. Build a hypothetical plan.','اختر الأداة. افحص الأدلة. ابنِ خطة افتراضية.')}</p>`;
  if(intro.innerHTML!==introHTML)intro.innerHTML=introHTML;
  const mobile=matchMedia('(max-width:900px)').matches;const marketHost=mobile?$('commandSearch').parentElement:welcome;if(markets.parentElement!==marketHost)marketHost.append(markets);
  markets.setAttribute('aria-label',tr('Quick instrument selection','اختيار سريع للأداة'));
  const catalog=THNMarketTerminal.catalog();
  const codes=['EURUSD','GBPUSD','XAUUSD','BTCUSD','BTCUSDT'].filter(s=>catalog.some(v=>v.symbol===s)).slice(0,4);
  const signature=JSON.stringify([codes,c.symbol,document.documentElement.lang]);
  if(markets.dataset.signature!==signature){
   const focused=markets.contains(document.activeElement)?document.activeElement.dataset.command:null;
   markets.innerHTML=codes.map(s=>`<button type="button" class="ghost" data-command="pick:${esc(s)}" aria-pressed="${c.symbol===s}" title="${esc(THNWorkspace.marketName(s))}"><bdi>${esc(s)}</bdi></button>`).join('');markets.dataset.signature=signature;
   if(focused)markets.querySelector('[data-command="'+CSS.escape(focused)+'"]')?.focus({preventScroll:true});
  }
  const analyze=$('deskPrimaryActions').querySelector('[data-desk=analyze]');if(analyze)analyze.textContent=tr('Analyze market','تحليل السوق');
  const kicker=$('commandVerdict').querySelector('.command-kicker');
  if(kicker){const spans=kicker.querySelectorAll('span');if(spans[0])spans[0].textContent=tr('AI Decision Center','مركز القرار الذكي');if(spans[1])spans[1].textContent=c.symbol+' / '+c.interval;}
  const heading=$('commandVerdict').querySelector('h1');
  if(heading&&review.status==='wait')heading.textContent=tr('WAIT','انتظار');
  const setupKicker=$('commandSetup').querySelector('.command-kicker>span');
  if(setupKicker)setupKicker.textContent=tr('TRADE TICKET · HYPOTHETICAL','بطاقة التداول · افتراضية');
  let mode=$('heritageMethod');if(!mode){mode=document.createElement('p');mode.id='heritageMethod';}
  mode.textContent=tr('Rules · hosted model off','قواعد حتمية · النموذج المستضاف غير مفعل');
  if(mode.parentElement!==$('commandVerdict'))$('commandVerdict').append(mode);
  const levels=$('commandSetup').querySelector('.command-levels');
  const levelButtons=levels?.querySelectorAll('[data-desk^="level:"]')||[];
  if(review.candidate&&selected){
   meaning.textContent=levelGuide(selected);
   // Keep the sourced entry rationale immediately after the recorded levels.
   const detail=$('precisionSetupDetail');if(meaning.previousElementSibling!==detail)detail.after(meaning);
   for(const button of levelButtons){
    const key=button.dataset.desk.slice(6);if(key===selected)button.setAttribute('aria-describedby','heritageLevelMeaning');else button.removeAttribute('aria-describedby');button.title=levelGuide(key);
   }
  }else{meaning.remove();for(const b of levelButtons)b.removeAttribute('aria-describedby');}
  const inspect=$('commandSetup').querySelector('[data-trust=candidate]');if(inspect)inspect.textContent=tr('Why these levels?','لماذا هذه المستويات؟');
  if(review.candidate)for(const b of levelButtons){const guide=levelGuide(b.dataset.desk.slice(6));b.title=guide;const label=b.closest('dd')?.previousElementSibling?.textContent||'';b.setAttribute('aria-label',label+': '+b.textContent.trim()+'. '+guide);}
  $('commandAssessment').setAttribute('aria-label',tr('Decision Center and hypothetical Trade Ticket','مركز القرار وبطاقة التداول الافتراضية'));
  const note=$('precisionProbability');if(!window.THNDecisionValidation)note.textContent=tr('Heuristic evidence ≠ historical validation. Calibrated win probability is unavailable.','الأدلة الاستدلالية لا تعني تحققاً تاريخياً. احتمال الربح المعاير غير متاح.');
 }
 document.addEventListener('click',event=>{const action=event.target.closest('[data-desk]')?.dataset.desk;if(action?.startsWith('level:')){selected=action.slice(6);render();}});
 document.addEventListener('focusin',event=>{const action=event.target.closest('[data-desk]')?.dataset.desk;if(action?.startsWith('level:')){selected=action.slice(6);render();}});
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
 for(const event of ['thn:command-render','thn:view','thn:plan','thn:evaluation','thn:evaluation-state','thn:context','thn:analysis'])window.addEventListener(event,schedule);
 window.addEventListener('thn:catalog',schedule);matchMedia('(max-width:900px)').addEventListener('change',schedule);
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-theme']});
 window.THNHeritage={render};render();
}
