import {precisionReview} from './precision-core.js';

// Display binding only. Every level and monetary outcome belongs to an existing
// engine. A validated separate scenario is not validation of this Ticket.
export function ticketPlanBinding(candidate,plan){
 if(!candidate||!plan)return 'unreviewed';
 if(plan.inputValid!==true||plan.executionAuthorized!==false)return 'unavailable';
 const c=plan.context;
 if(plan.symbol!==candidate.symbol||plan.side!==candidate.side||c?.symbol!==candidate.symbol||c?.interval!==candidate.interval||c?.datasetHash!==candidate.hash||c?.dataTimestamp!==candidate.barTime||(c?.sourceInterval!=null&&c.sourceInterval!==candidate.interval)||(c?.sourceDatasetHash!=null&&c.sourceDatasetHash!==candidate.hash))return 'context_mismatch';
 if(plan.entry!==candidate.entry||plan.stop!==candidate.stop||!Array.isArray(plan.targets)||plan.targets.length!==candidate.targets.length||plan.targets.some((v,i)=>v!==candidate.targets[i]))return 'levels_mismatch';
 return 'matched';
}

export function ticketAssessment(input){
 const p=precisionReview(input),plan=input.model?.recommendation?.plan;
 const binding=ticketPlanBinding(p.candidate,plan);
 // Preserve the original engine decision and risk result. Only the Ticket's
 // review label is withheld when a separate plan cannot validate its prices.
 return {...p,status:p.status==='eligible'&&binding!=='matched'?'conditional':p.status,planBinding:binding,
  validatedPlan:binding==='matched'?structuredClone(plan):null};
}

export function ticketRiskState(assessment,planning={}){
 if(!assessment?.candidate)return 'blocked';
 if(planning.state==='pending')return 'pending';
 if(planning.state==='rejected')return 'rejected';
 if(['context_mismatch','levels_mismatch','unavailable'].includes(assessment.planBinding))return assessment.planBinding;
 if(assessment.validatedPlan)return assessment.risk==='within_budget'?'matched':'over_budget';
 return planning.state==='stale'?'changed':'unreviewed';
}
