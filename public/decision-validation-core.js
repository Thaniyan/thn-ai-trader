import {trustEvidence} from './command-trust-core.js';

// Read-only labels over the original confidence/evaluation contracts.
export function decisionValidationEvidence(input){
 const data=trustEvidence(input),state=input.evaluationState||{},c=input.context||{};
 const series=input.series;
 const matched=!!(series&&series.symbol===c.symbol&&series.provenance?.interval===c.interval&&series.provenance.hash===c.datasetId);
 const provenance=matched?series.provenance:null;
 const status=state.busy?'running':state.failed?'failed':data.validationCurrent?'complete':input.evaluation?'stale':'untested';
 const reliability=!provenance?'unavailable':provenance.status==='stale'||input.model?.phase==='stale'?'stale':!data.current?'unavailable':provenance.gapCount>0?'gaps':provenance.status==='recent'?'current':'unavailable';
 return {status,reliability,confluence:data.current&&Number.isFinite(data.confluence)?data.confluence:null,passed:data.validationCurrent?data.checks.filter(check=>check.pass).length:null,total:data.validationCurrent?data.checks.length:null,retained:!!data.evaluation,provenance,probability:null};
}
