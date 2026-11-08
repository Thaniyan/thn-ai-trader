import {instrumentIdentity} from './instrument-identity.js';

// Interpret existing evidence and planner outputs. No prices, position sizing,
// historical returns or execution permissions are calculated here.
export function recommendationReview({context={},series=null,analysis=null,brief=null,plan=null,review=null,reviewLanguage=null,language='en',now=Date.now(),busy=false}) {
  const reasons=[];
  const hash=context.datasetId;
  const same=(symbol,interval,dataset)=>symbol===context.symbol&&interval===context.interval&&dataset===hash&&typeof hash==='string'&&/^[a-f0-9]{64}$/.test(hash);
  const selected=!!(series&&same(series.symbol,series.provenance?.interval,series.provenance?.hash));
  const matchedAnalysis=!!(analysis&&same(analysis.symbol,analysis.timeframe,analysis.evidence?.hash));
  const matchedBrief=!!(brief&&same(brief.symbol,brief.interval,brief.selected?.provenance?.hash));
  const provenance=selected?series.provenance:null;
  const frames=matchedBrief&&Array.isArray(brief.frames)?brief.frames:[];
  const dated=p=>p?.status==='recent'&&Number.isFinite(p.lastTime)&&p.lastTime<=now;
  const frameSet=matchedBrief&&frames.length===3&&new Set(frames.map(f=>f?.interval)).size===3&&frames.every(f=>f&&['15m','1h','1d'].includes(f.interval)&&f.available&&dated(f.provenance));
  const identity=instrumentIdentity(context.symbol||'',provenance||{});
  let action='WAIT',direction=null,scenario=null,confirmation=false;
  if(!selected)reasons.push('history_unavailable');
  else if(!dated(provenance))reasons.push('history_stale');
  if(identity.proxy)reasons.push('proxy_context');
  if(selected&&(provenance.gapCount!==0||provenance.discardedRows!==0))reasons.push('data_quality');
  if(matchedAnalysis&&(!dated(analysis.evidence)||analysis.evidence.lastTime!==provenance?.lastTime))reasons.push('analysis_stale');
  if(!matchedAnalysis)reasons.push('analysis_required');
  else if(!Array.isArray(analysis.schools)||!analysis.schools.length||!Number.isFinite(analysis.confidence)||analysis.confidence<0||analysis.confidence>100)reasons.push('analysis_incomplete');
  if(!matchedBrief||!frameSet||!brief.complete)reasons.push('incomplete_frames');
  if(matchedBrief&&(brief.conflicting||new Set(frames.filter(f=>f?.available&&['bullish','bearish'].includes(f.trend)).map(f=>f.trend)).size>1))reasons.push('conflicting_frames');
  if(matchedAnalysis) {
    direction=analysis.consensusLabel==='BULLISH'?'bullish':analysis.consensusLabel==='BEARISH'?'bearish':null;
    if(!direction)reasons.push('neutral_consensus');
    if(direction&&frameSet&&frames.some(f=>f?.trend===(direction==='bullish'?'bearish':'bullish')))reasons.push('signal_disagreement');
    const signal=direction==='bullish'?'BUY':direction==='bearish'?'SELL':null;
    if(signal&&analysis.decision!==signal)reasons.push(analysis.decision===signal+' LIMIT'?'pending_pullback':'signal_disagreement');
    scenario=matchedBrief&&direction&&Array.isArray(brief.scenarios)?brief.scenarios.find(s=>s&&s.direction===direction&&s.readyForPlanning):null;
    if(direction&&!scenario)reasons.push('scenario_unavailable');
    if(scenario) {
      const {trigger,invalidation}=scenario,close=brief.selected?.lastCandle?.close;
      const valid=[trigger,invalidation,close].every(v=>Number.isFinite(v)&&v>0)&&(direction==='bullish'?invalidation<trigger:invalidation>trigger);
      confirmation=valid&&(direction==='bullish'?close>=trigger:close<=trigger);
      if(!confirmation)reasons.push('confirmation_pending');
    }
    if(!reasons.length)action=signal;
  }
  let matchedPlan=null;
  // The caller supplies only the existing snapshot builder's bound plan.
  if(plan&&selected&&same(plan.symbol,plan.context?.interval,plan.context?.datasetHash)&&plan.inputValid===true&&plan.executionAuthorized===false)matchedPlan=plan;
  const expectedSide=direction==='bullish'?'BUY':direction==='bearish'?'SELL':null;
  let risk='unreviewed';
  if(matchedPlan) {
    if(expectedSide&&matchedPlan.side!==expectedSide)risk='direction_mismatch';
    else if(!Number.isFinite(matchedPlan.budget)||!Number.isFinite(matchedPlan.plannedStopLossWithCosts)||!Number.isFinite(matchedPlan.metrics?.requiredMargin)||!Number.isFinite(matchedPlan.capital))risk='unavailable';
    else if(matchedPlan.plannedStopLossWithCosts>matchedPlan.budget||matchedPlan.metrics.requiredMargin>matchedPlan.capital){risk='over_budget';action='AVOID';reasons.unshift('risk_exceeded');}
    else risk='within_budget';
  }
  if(risk==='direction_mismatch'){reasons.push('plan_direction_mismatch');action='WAIT';}
  if(risk==='unreviewed'||risk==='unavailable')reasons.push('risk_review_required');
  if(busy&&action!=='AVOID'){action='WAIT';reasons.unshift('analysis_running');}
  const snapshot=review?.snapshot;
  const matchedReview=!!(review&&!review.unverified&&!review.contextWarning&&same(snapshot?.symbol,snapshot?.interval,snapshot?.selectedHash)&&snapshot.fresh===true&&Number.isFinite(snapshot.asOf)&&snapshot.asOf<=now&&now-snapshot.asOf<=600000&&reviewLanguage===language);
  const citations=review?.generation?.citations;
 const cited=Array.isArray(citations)&&citations.length>0&&citations.every(id=>Array.isArray(snapshot?.refs)&&snapshot.refs.some(ref=>ref?.id===id&&ref.availableAt<=snapshot.asOf));
 const model=cited&&matchedReview&&review.method==='llm-assisted'&&Number.isInteger(review.modelCalls)&&review.modelCalls>0&&typeof review.model==='string'&&review.model.trim().length>0&&['ollama','openai'].includes(review.provider)&&review.generation&&!review.providerFallback;
  const interpretation=matchedReview?{method:model?'llm-assisted':'deterministic',summary:String(review.summary||''),provider:model?review.provider:null,model:model?review.model:null,fallback:Boolean(review.providerFallback),citations:model?[...(review.generation.citations||[])]:[...new Set((Array.isArray(review.roles)?review.roles:[]).flatMap(r=>Array.isArray(r?.references)?r.references:[]))]}:null;
  return {action,bias:direction,phase:busy?'reviewing':!selected?'unavailable':action==='AVOID'?'blocked':['BUY','SELL'].includes(action)?risk==='within_budget'?'conditional_review':'risk_review':'waiting',reasons:[...new Set(reasons)],signal:matchedAnalysis?analysis.decision:null,confidence:matchedAnalysis&&Number.isFinite(analysis.confidence)?analysis.confidence:null,grade:matchedAnalysis?analysis.grade:null,schoolCount:matchedAnalysis?(Array.isArray(analysis.schools)?analysis.schools.length:0):0,availableFrames:matchedBrief?frames.filter(f=>f?.available).length:0,confirmation,scenario:scenario?{direction:scenario.direction,trigger:scenario.trigger,invalidation:scenario.invalidation,sourceHash:hash}:null,risk,plan:matchedPlan,interpretation,provenance,probability:null,executionAuthorized:false,entryQuoteVerified:false};
}

const labels={
 analysis_running:['The assessment is updating; wait for the current result.','يجري تحديث التقييم؛ انتظر النتيجة الحالية.'],
 history_unavailable:['Selected market history is unavailable.','سجل السوق المختار غير متاح.'],
 data_quality:['Observed gaps, omitted rows or unavailable quality counts limit entry assessment.','تحد الفجوات والصفوف المحذوفة أو غياب عدادات الجودة من تقييم الدخول.'],
 analysis_stale:['The analytical snapshot is stale or its timestamp differs from the selected history.','اللقطة التحليلية قديمة أو يختلف وقتها عن السجل المختار.'],
 history_stale:['History is stale or its time cannot be verified.','السجل قديم أو لا يمكن التحقق من وقته.'],
 proxy_context:['Provider observations are a proxy for a different contract.','مشاهدات المزود بديل لعقد مختلف.'],
 analysis_incomplete:['Analytical confidence or school evidence is incomplete.','أدلة الثقة التحليلية أو المدارس ناقصة.'],
 analysis_required:['A matching technical analysis is required.','يلزم تحليل فني مطابق.'],
 incomplete_frames:['Independent timeframe evidence is incomplete or stale.','أدلة الأطر المستقلة ناقصة أو قديمة.'],
 conflicting_frames:['Timeframes disagree; wait rather than force a direction.','تختلف الأطر الزمنية؛ انتظر بدلاً من فرض اتجاه.'],
 neutral_consensus:['The analysis schools do not establish a directional consensus.','لا تثبت المدارس التحليلية توافقاً اتجاهياً.'],
 pending_pullback:['The recorded signal requires a pullback; it is not an immediate entry.','تتطلب الإشارة المسجلة تصحيحاً؛ ليست دخولاً فورياً.'],
 signal_disagreement:['The directional signals disagree.','تختلف الإشارات الاتجاهية.'],
 scenario_unavailable:['No complete confirmation/invalidation scenario is available.','لا يتوفر سيناريو تأكيد وإبطال مكتمل.'],
 confirmation_pending:['The latest closed candle has not confirmed the scenario trigger.','لم تؤكد آخر شمعة مغلقة مستوى السيناريو.'],
 risk_exceeded:['Modeled stop exposure or margin exceeds the supplied budget.','يتجاوز تعرض الوقف أو الهامش النموذجي الميزانية المدخلة.'],
 plan_direction_mismatch:['The hypothetical plan is for the opposite direction.','الخطة الافتراضية تخص الاتجاه المعاكس.'],
 risk_review_required:['Review a separate hypothetical risk plan before considering entry.','راجع خطة مخاطر افتراضية منفصلة قبل التفكير في الدخول.']
};
export function recommendationReason(code,language='en'){return labels[code]?.[language==='ar'?1:0]||code;}
export function recommendationTitle(model,language='en'){
 const i=language==='ar'?1:0;
 return ({BUY:['BUY setup · conditional','سيناريو شراء · مشروط'],SELL:['SELL setup · conditional','سيناريو بيع · مشروط'],AVOID:['AVOID · risk limits exceeded','تجنب · تجاوز حدود المخاطر'],WAIT:model.phase==='unavailable'?['WAIT · data unavailable','انتظر · البيانات غير متاحة']:['WAIT · no confirmed entry','انتظر · لا دخول مؤكد']})[model.action]?.[i]||['WAIT','انتظر'][i];
}
