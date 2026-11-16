// Read-only presentation of existing assessments. No new score or financial formula.
export function trustEvidence({model,analysis,evaluation,evaluationState={},context={}}){
 const current=!!(model?.fresh&&analysis&&analysis.symbol===context.symbol&&analysis.timeframe===context.interval&&analysis.evidence?.hash===context.datasetId);
 const review=model?.confidence;
 const retained=!!(evaluation&&evaluation.symbol===context.symbol&&evaluation.dataset?.interval===context.interval&&evaluation.dataset.hash===context.datasetId);
 const complete=retained&&review?.testStatus==='complete'&&!evaluationState.busy&&!evaluationState.dirty&&!evaluationState.failed;
 return {
  current,confluence:current?review?.confluence??null:null,
  scoreInputs:current?{weightedConsensus:Number.isFinite(analysis.consensusScore)?analysis.consensusScore:null,directionalSchools:analysis.schools.filter(s=>['BULLISH','BEARISH'].includes(s.bias)).length,totalSchools:analysis.schools.length,riskWarningCount:null}:null,
  schools:current?analysis.schools.map((s,i)=>({id:i,name:s.name||s.id||'',bias:s.bias,reasons:[...s.reasons],warnings:Array.isArray(s.warnings)?[...s.warnings]:[]})):[],
  evaluation:retained?evaluation:null,validationCurrent:complete,checks:retained?review?.checks||[]:[],status:review?.testStatus||'untested',
  candidate:current&&model.candidate?structuredClone(model.candidate):null,
  blockers:[...(model?.warnings||[])],probability:null,executionAuthorized:false
 };
}
