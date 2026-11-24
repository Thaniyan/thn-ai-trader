// Presentation of original blockers only. No admission, price or risk calculation.
const priority=['history_unavailable','history_stale','analysis_stale','source_identity_unverified','currency_mismatch','proxy_context','contract_unavailable','data_quality','analysis_required','analysis_incomplete','incomplete_frames','conflicting_frames','signal_disagreement','neutral_consensus','invalid_recorded_levels','scenario_unavailable','pending_pullback','confirmation_pending','plan_direction_mismatch','risk_review_required'];
export function workspaceSummary(model,review){
 const warnings=Array.isArray(model?.warnings)?[...new Set(model.warnings.filter(v=>typeof v==='string'))]:[];
 const blockers=[...priority.filter(code=>warnings.includes(code)),...warnings.filter(code=>!priority.includes(code))];
 const sourceBlockers=blockers.filter(code=>['history_unavailable','history_stale','analysis_stale','source_identity_unverified','currency_mismatch','proxy_context','contract_unavailable','data_quality','incomplete_frames'].includes(code));
 const next=sourceBlockers.some(c=>['history_unavailable','history_stale','analysis_stale'].includes(c))?'source':sourceBlockers.some(c=>['source_identity_unverified','currency_mismatch','proxy_context','contract_unavailable'].includes(c))?'identity':sourceBlockers.includes('data_quality')?'quality':blockers.includes('incomplete_frames')?'frames':review?.candidate?'risk':blockers.some(c=>['pending_pullback','confirmation_pending'].includes(c))?'confirmation':'direction';
 return {status:['wait','conditional','eligible'].includes(review?.status)?review.status:'wait',candidate:!!review?.candidate,
  blockers,primary:blockers.filter(code=>code!=='risk_review_required'||review?.candidate).slice(0,2),dataState:sourceBlockers.length?'blocked':model?.fresh&&model?.sourceIdentityMatched?'matched':'unavailable',next,
  riskState:review?.validatedPlan?(review.risk==='within_budget'?'reviewed':'over_budget'):'unreviewed',probability:null,executionAuthorized:false};
}
