/* Bounded descriptive comparison. No ranking, future probabilities or significance claims. */
export function compareResearch(entries){
  if(!Array.isArray(entries)||entries.length<2||entries.length>4)throw Error('Select two to four cases.');
  const rows=entries.map(e=>{const r=e.record,p=r.brief.selected.provenance,q=r.quantitative;return {id:e.id,title:e.title,symbol:r.symbol,interval:r.interval,provider:p.source,providerSymbol:p.providerSymbol,hash:p.hash,coverage:[p.firstTime,p.lastTime],gaps:p.gapCount,omitted:p.discardedRows,engine:r.lineage?.engineVersion||'6.3',strategy:q?.parameters.strategy??null,direction:q?.parameters.direction??null,parameters:q?.parameters??null,windows:q?.split??null,development:q?.development??null,holdout:q?.holdout??null,sensitivity:q?.sensitivity??[],walkForward:q?.walkForward??null,quality:q?.quality??null,imported:Boolean(r.imported)};});
  const same=fn=>new Set(rows.map(r=>JSON.stringify(fn(r)))).size===1;
  const compatibility={instrument:same(r=>r.symbol),timeframe:same(r=>r.interval),dataset:same(r=>[r.provider,r.providerSymbol,r.hash]),windows:same(r=>r.windows),engine:same(r=>r.engine)};
  const warnings=Object.entries(compatibility).filter(([,v])=>!v).map(([key])=>'different_'+key);
  if(rows.some(r=>!r.holdout))warnings.push('missing_quantitative');
  if(rows.some(r=>r.imported))warnings.push('unverified_imports');
  if(rows.some(r=>!r.quality?.checks?.find(c=>c.code==='trade_count')?.pass))warnings.push('trade_count_unconfirmed');
  if(rows.some(r=>r.gaps||r.omitted))warnings.push('gaps_or_omissions');
  const baseline=rows[0];const changes=rows.slice(1).map(r=>({id:r.id,parametersChanged:JSON.stringify(r.parameters)!==JSON.stringify(baseline.parameters),datasetChanged:r.hash!==baseline.hash,windowsChanged:JSON.stringify(r.windows)!==JSON.stringify(baseline.windows),holdoutReturnDelta:r.holdout&&baseline.holdout?r.holdout.returnPct-baseline.holdout.returnPct:null,drawdownDelta:r.holdout&&baseline.holdout?r.holdout.maxDrawdownPct-baseline.holdout.maxDrawdownPct:null}));
  return {rows,compatibility,warnings,changes,methodologicallyAligned:Object.values(compatibility).every(Boolean),ranked:false,probability:null};
}
export function signedBarValues(rows,key){return rows.map(row=>({label:row.title,value:Number.isFinite(row.holdout?.[key])?row.holdout[key]:null}));}
