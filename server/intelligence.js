import crypto from 'node:crypto';
import {INTERVAL_MS} from './research.js';
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const ROLES=['technical','quantitative','bull','bear','risk','manager'];
export function evidenceSnapshot(brief,{asOf=brief.asOf,evaluation=null,riskPlan=null}={}){
 if(!brief||!/^[A-Z0-9^=:.\-]{1,32}$/.test(brief.symbol)||!INTERVAL_MS[brief.interval]||!Number.isFinite(asOf)||asOf>brief.asOf)throw Error('Invalid evidence context');
 const refs=[],missing=[];
 // Structure timestamps identify confirmation-bar OPEN; evidence is available only at its close.
 const eventAvailableAt=e=>e.confirmedAt+INTERVAL_MS[brief.interval];
 for(const f of brief.frames||[]){
  const p=f.provenance,selectedIdentity=brief.selected?.provenance;
  if(selectedIdentity?.providerSymbol&&p?.providerSymbol&&selectedIdentity.providerSymbol!==p.providerSymbol||selectedIdentity?.currency&&p?.currency&&selectedIdentity.currency!==p.currency){missing.push('provider-identity:'+f.interval);continue;}
  if(!f.available||!p||!Number.isFinite(p.lastTime)||!/^[a-f0-9]{64}$/.test(p.hash)||!INTERVAL_MS[f.interval]||p.lastTime+INTERVAL_MS[f.interval]>asOf){missing.push(f.interval);continue;}
  if(!['bullish','bearish','neutral'].includes(f.trend))throw Error('Invalid trend');
  const inputs={};for(const k of ['close','ema20','ema50','rsi','atr','support','resistance'])if(Number.isFinite(f[k]))inputs[k]=f[k];
  if(p.gapCount)missing.push('gaps:'+f.interval);if(p.discardedRows)missing.push('discarded-rows:'+f.interval);
  refs.push({id:'frame-'+f.interval,interval:f.interval,trend:f.trend,source:p.source,providerSymbol:p.providerSymbol,datasetHash:p.hash,availableAt:p.lastTime+INTERVAL_MS[f.interval],status:p.status,inputs});
 }
 const selected=brief.selected?.provenance;if(!selected)missing.push('selected-history');
 let quant=null;
 if(evaluation&&evaluation.dataset.hash===selected?.hash){const a=evaluation.development.metrics,b=evaluation.holdout.metrics;quant={datasetHash:evaluation.dataset.hash,development:a,holdout:b,minimumTrades:evaluation.split.minimumTrades,parameters:evaluation.parameters,walkForward:evaluation.walkForward.summary};refs.push({id:'evaluation',source:'THN deterministic evaluator',datasetHash:evaluation.dataset.hash,availableAt:asOf,status:'evaluated',inputs:{trades:b.trades,returnPct:b.returnPct,maxDrawdownPct:b.maxDrawdownPct}});}
 if(selected?.hash){for(const [index,event]of (brief.selected?.events||[]).filter(e=>Number.isFinite(e.confirmedAt)&&eventAvailableAt(e)<=asOf).slice(-6).entries())refs.push({id:'event-'+index,kind:'structure',label:String(event.type).slice(0,80),source:'THN causal structure engine',datasetHash:selected.hash,availableAt:eventAvailableAt(event),status:'historical_observation',inputs:Number.isFinite(event.price)?{price:event.price}:{}});}
 if(riskPlan&&riskPlan.symbol===brief.symbol&&selected?.hash)refs.push({id:'risk-plan',source:'THN deterministic hypothetical planner; user assumptions',datasetHash:selected.hash,availableAt:asOf,status:'hypothetical',inputs:{capital:riskPlan.capital,riskPct:riskPlan.riskPct,entry:riskPlan.entry,stop:riskPlan.stop,lots:riskPlan.lots,budget:riskPlan.budget,lossWithCosts:riskPlan.plannedStopLossWithCosts,requiredMargin:riskPlan.metrics.requiredMargin}});
 const value={schema:'THN-EVIDENCE-7',symbol:brief.symbol,interval:brief.interval,asOf,engineVersion:'6.6/6.3',selectedHash:selected?.hash||null,refs,missing,
  events:(brief.selected?.events||[]).filter(e=>Number.isFinite(e.confirmedAt)&&eventAvailableAt(e)<=asOf).slice(-12).map(e=>({type:e.type,time:eventAvailableAt(e)})),
  limitations:['No predictive probabilities','No verified news, sentiment or macro publications','Historical evaluation and risk plans require explicitly selected verified records'],
  quantitative:quant,fresh:missing.length===0&&refs.some(r=>r.interval)&&refs.filter(r=>r.interval).every(r=>r.status==='recent')};
 return {...value,id:hash(value)};
}
export function routeQuestion(question){
 if(typeof question!=='string'||!question.trim()||question.length>1500)throw Error('Question must contain 1–1500 characters');
 if(/execute|place.*order|buy now|sell now|نفذ|تنفيذ.*صفق/i.test(question))return ['risk'];
 if(/committee|debate|challenge|oppos|لجنة|تحد|معارض/i.test(question))return ROLES;
 if(/bullish|bull case|صعود/i.test(question))return ['technical','bull','risk','manager'];
 if(/bearish|bear case|هبوط/i.test(question))return ['technical','bear','risk','manager'];
 if(/risk|مخاطر/i.test(question))return ['risk','manager'];
 if(/histor|quant|strategy|backtest|compare|تاريخ|استرات|إحصائ|قارن/i.test(question))return ['quantitative','manager'];
 return ['technical','manager'];
}
export function validateReview(review,snapshot){
 if(!review||!ROLES.includes(review.role)||!Array.isArray(review.references)||review.references.some(id=>!snapshot.refs.some(r=>r.id===id)))throw Error('Invalid evidence citation');
 for(const key of ['supporting','contradictory','missing','uncertainties','invalidation'])if(!Array.isArray(review[key])||review[key].length>12||review[key].some(s=>typeof s!=='string'||s.length>400))throw Error('Invalid specialist schema');
 if(typeof review.hypothesis!=='string'||review.hypothesis.length>500)throw Error('Invalid hypothesis');return review;
}
export function committee(snapshot,question,language='en'){
 const ar=language==='ar',roles=routeQuestion(question),bull=snapshot.refs.filter(r=>r.trend==='bullish'),bear=snapshot.refs.filter(r=>r.trend==='bearish');
 const txt=(en,arabic)=>ar?arabic:en;
 const symbols=['EURUSD','GBPUSD','USDJPY','AUDUSD','NZDUSD','USDCHF','USDCAD','XAUUSD','XAGUSD','BTCUSD','BTCUSDT','ETHUSD','US30','NAS100','SPX500','USOIL','BRENT'];
 const mismatch=symbols.some(symbol=>symbol!==snapshot.symbol&&(question.toUpperCase().match(/[A-Z][A-Z0-9]{2,9}/g)||[]).includes(symbol));
 if(mismatch)return {schema:'THN-COMMITTEE-7',method:'deterministic',snapshot,roles:[],model:null,provider:null,modelCalls:0,outcome:'context_mismatch',summary:txt('The question names a different instrument. Select it explicitly before research; no ticker was switched.','يسمي السؤال أداة مختلفة. اخترها صراحةً قبل البحث؛ لم تُغيَّر الأداة.'),followUps:[],navigation:{view:'trading',symbol:snapshot.symbol,interval:snapshot.interval},financialExecution:false};
 const conflicting=bull.length>0&&bear.length>0;
 const reviews=roles.map(role=>{
  const relevant=role==='bull'?bull:role==='bear'?bear:role==='quantitative'?snapshot.refs.filter(r=>r.id==='evaluation'):role==='technical'?snapshot.refs.filter(r=>r.interval||r.kind==='structure'):snapshot.refs;
  const review={role,references:(role==='bull'||role==='bear'?[...bull,...bear]:relevant).map(r=>r.id),supporting:[],contradictory:[],missing:[...snapshot.missing],uncertainties:[txt('Direction is a rule-based interpretation, not a forecast.','الاتجاه تفسير قائم على قواعد وليس توقعاً.')],hypothesis:'',invalidation:[txt('Revisit if the dataset changes or evidence becomes stale.','أعد المراجعة عند تغير البيانات أو تقادم الأدلة.')],reviewStatus:'deterministic'};
  if(role==='technical')review.supporting=relevant.map(r=>r.kind==='structure'?`Structure: ${r.label}`:`${r.interval}: ${r.trend}`);
  if(role==='bull'||role==='bear'){
   review.supporting=relevant.map(r=>`${r.interval}: ${r.trend} · ${r.id}`);
   if(!relevant.length)review.missing.push(txt('No selected directional observation supports this thesis.','لا تدعم أي مشاهدة اتجاهية محددة هذه الفرضية.'));
   review.contradictory=(role==='bull'?bear:bull).map(r=>`${r.interval}: ${r.trend}`);
   review.hypothesis=txt('Conditional thesis only; no order or price target is authorized.','فرضية مشروطة فقط؛ لا يُصرح بأمر أو سعر مستهدف.');
  }
  if(role==='quantitative'&&snapshot.quantitative){const q=snapshot.quantitative;review.supporting.push(txt('Historical metrics were recomputed by the unchanged quantitative engine.','أُعيد حساب المقاييس التاريخية بالمحرك الكمي دون تغييره.'));if(q.holdout.trades<q.minimumTrades)review.missing.push(txt('Inadequate holdout trade count.','عدد صفقات الاختبار الخارجي غير كافٍ.'));if(q.holdout.returnPct<=0)review.contradictory.push(txt('Recorded holdout return is not positive.','العائد المسجل خارج العينة غير موجب.'));review.uncertainties.push(txt('Historical outcomes do not validate future returns; inspect drawdown, costs and repeated holdout use.','النتائج التاريخية لا تثبت العوائد المستقبلية؛ راجع التراجع والتكاليف وتكرار اختبار العينة.'));}
  if(role==='quantitative'&&!snapshot.quantitative)review.missing.push(txt('No server-verified historical evaluation was selected for this request. No performance claim can be made.','لم يُحدد تقييم تاريخي موثق على الخادم لهذا الطلب؛ لا يمكن ادعاء أداء.'));
  if(role==='risk'){
   const plan=snapshot.refs.find(r=>r.id==='risk-plan')?.inputs;if(plan){if(plan.lossWithCosts>plan.budget)review.contradictory.push(txt('Computed costs exceed the nominal stop budget.','التكاليف المحسوبة تتجاوز ميزانية الوقف الاسمية.'));if(plan.requiredMargin>plan.capital)review.contradictory.push(txt('Required margin exceeds hypothetical capital.','الهامش المطلوب يتجاوز رأس المال الافتراضي.'));}
   review.supporting=[txt('Financial execution is outside this assistant. Capital is hypothetical.','التنفيذ المالي خارج صلاحيات المساعد. رأس المال افتراضي.')];
   review.uncertainties.push(txt('Stops, gaps, slippage and contract identity require independent risk review.','تتطلب الوقفات والفجوات والانزلاق وهوية العقد مراجعة مخاطر مستقلة.'));
  }
  if(role==='manager')review.hypothesis=txt(conflicting?'Conflicting evidence: retain both hypotheses; no forced trade.':snapshot.fresh?'Review directional evidence; no predictive probability or execution conclusion.':'Insufficient or stale evidence: no-trade research outcome.',conflicting?'أدلة متعارضة: احتفظ بالفرضيتين دون فرض صفقة.':snapshot.fresh?'راجع الأدلة الاتجاهية دون احتمالات تنبؤية أو استنتاج تنفيذي.':'أدلة غير كافية أو متقادمة: نتيجة بحث بلا تداول.');
  return validateReview(review,snapshot);
 });
 return {schema:'THN-COMMITTEE-7',method:'deterministic',snapshot,roles:reviews,model:null,provider:null,modelCalls:0,outcome:!snapshot.fresh?'insufficient':conflicting?'conflicting':'conditional',summary:reviews.find(r=>r.role==='manager')?.hypothesis||reviews[0].supporting[0],followUps:[txt('Challenge the bullish hypothesis','تحدَّ الفرضية الصعودية'),txt('Explain the biggest risks','اشرح أكبر المخاطر')],navigation:{view:'trading',symbol:snapshot.symbol,interval:snapshot.interval},financialExecution:false};
}
