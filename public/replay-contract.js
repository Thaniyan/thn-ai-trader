/* Shared compatibility and exact recorded-field comparison; no alternate numerical engine. */
export const REPLAY_ENGINE='6.3';
export function replayEngine(report){
  const version=report.lineage?.engineVersion||report.lineage?.evaluationVersion;
  if(version)return version;
  return /^6\.[456](?:\.|$)/.test(report.analysisVersion||'')?'6.3':null;
}
export function recordedDifferences(stored,computed,window,path=''){
  const differences=[];
  if(stored&&typeof stored==='object'){
    for(const key of Object.keys(stored))differences.push(...recordedDifferences(stored[key],computed?.[key],window,path?path+'.'+key:key));
  }else if(stored!==computed){
    differences.push({window,field:path,stored:stored??null,recomputed:computed??null,delta:typeof stored==='number'&&typeof computed==='number'?computed-stored:null});
  }
  return differences;
}
