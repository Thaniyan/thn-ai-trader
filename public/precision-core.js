// Presentation only. Candidate eligibility and every financial value remain owned
// by commandAssessment/recommendationReview and the original risk engine.
export function precisionReview({model,reading,analysis,evidence}){
 const candidate=model?.fresh?model.candidate:null,r=model?.recommendation;
 const pending=!!(model?.fresh&&!candidate&&r?.scenario&&r.scenario.sourceHash===model.context.hash&&r.reasons?.some(v=>['confirmation_pending','pending_pullback'].includes(v))&&[...(model.warnings||[]),...(r.reasons||[])].every(v=>['confirmation_pending','pending_pullback','risk_review_required'].includes(v)));
 const status=candidate?(r.risk==='within_budget'?'eligible':'conditional'):pending?'conditional':'wait';
 const scenario=status!=='wait'&&model?.fresh&&r?.scenario?.sourceHash===model.context.hash?r.scenario:null;
 const bound=!!(model?.fresh&&analysis?.symbol===model.context.symbol&&analysis?.timeframe===model.context.interval&&analysis?.evidence?.hash===model.context.hash);
 const choose=(items,bias)=>{if(bound&&evidence?.matched&&Array.isArray(evidence.schools)){const retained=evidence.schools.filter(s=>s.bias===bias&&s.reasons?.length).map(s=>({id:s.id,name:s.name,bias:s.bias,text:s.reasons[0]}));if(retained.length)items=retained;}if(!bound||!Array.isArray(analysis.schools))return items?.[0]||null;const ranked=(items||[]).map(f=>({fact:f,score:analysis.schools[Number(f.id)]?.score})).filter(v=>Number.isFinite(v.score));return ranked.length?ranked.sort((a,b)=>b.score-a.score)[0].fact:items?.[0]||null;};
 const fact=candidate&&reading?.usable&&reading.directional?choose(reading.supporting,r?.action==='SELL'?'BEARISH':'BULLISH'):null;
 const counter=model?.fresh&&reading?.usable?choose(reading.opposing,r?.action==='SELL'?'BULLISH':'BEARISH'):null;
 return {status,candidate:candidate?structuredClone(candidate):null,scenario:scenario?{...scenario}:null,entryFact:fact?{...fact}:null,counterFact:counter?{...counter}:null,risk:r?.risk||'unreviewed',probability:null,executionAuthorized:false};
}
