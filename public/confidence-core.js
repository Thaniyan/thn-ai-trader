import {researchQuality} from './decision-core.js';

// Two deliberately separate measures: a legacy heuristic and historical checks.
// Neither estimates the chance of a profitable trade.
export function confidenceReview({analysis, evaluation, context, evaluationState={}}) {
  const matches = !!(analysis && analysis.symbol===context.symbol && analysis.timeframe===context.interval && analysis.evidence?.hash===context.datasetId);
  const tested = !!(evaluation && evaluation.symbol===context.symbol && evaluation.dataset.interval===context.interval && evaluation.dataset.hash===context.datasetId);
  const quality = researchQuality(tested ? evaluation : null);
  const current = tested && !evaluationState.dirty && !evaluationState.failed && !evaluationState.busy;
  return {
    analysis: matches ? analysis : null,
    confluence: matches && Number.isFinite(analysis.confidence) ? analysis.confidence : null,
    evaluation: tested ? evaluation : null,
    checks: quality.checks,
    passed: quality.checks.filter(c=>c.pass).length,
    quality: quality.label,
    testStatus: evaluationState.busy ? 'running' : evaluationState.failed ? 'failed' : !tested ? 'untested' : evaluationState.dirty ? 'changed' : 'complete',
    validationScore: current ? Math.round(quality.checks.filter(c=>c.pass).length/quality.checks.length*100) : null,
    probability: null
  };
}
