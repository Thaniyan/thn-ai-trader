import {observationExpiry} from './command-center-core.js';

// Label layout only. Original price coordinates remain untouched.
export function annotationLabels(points,plot){
 if(!plot||![plot.top,plot.bottom].every(Number.isFinite)||plot.bottom<=plot.top)return [];
 const labels=points.map(p=>({...p,labelY:Math.max(plot.top+11,Math.min(plot.bottom-3,p.y-4))})).sort((a,b)=>a.y-b.y);
 const gap=Math.min(14,Math.max(1,(plot.bottom-plot.top-14)/Math.max(1,labels.length-1)));
 for(let i=1;i<labels.length;i++)labels[i].labelY=Math.max(labels[i].labelY,labels[i-1].labelY+gap);
 if(labels.length)labels.at(-1).labelY=Math.min(plot.bottom-3,labels.at(-1).labelY);
 for(let i=labels.length-2;i>=0;i--)labels[i].labelY=Math.min(labels[i].labelY,labels[i+1].labelY-gap);
 return labels;
}

// Read-only evidence presentation. Eligibility, prices and risk stay authoritative.
export function commandEvidence({model,context={},series,brief,analysis,now=Date.now()}){
 const hash=context.datasetId;
 const same=(symbol,interval,id)=>symbol===context.symbol&&interval===context.interval&&id===hash&&typeof hash==='string'&&/^[a-f0-9]{64}$/.test(hash);
 const matched=!!(series&&same(series.symbol,series.provenance?.interval,series.provenance?.hash)&&brief&&same(brief.symbol,brief.interval,brief.selected?.provenance?.hash));
 const frames=['15m','1h','1d'].map(interval=>{
  const frame=matched&&Array.isArray(brief.frames)?brief.frames.find(f=>f.interval===interval):null,p=frame?.provenance,expiry=observationExpiry(p);
  const bound=!!(p&&/^[a-f0-9]{64}$/.test(p.hash||'')&&p.providerSymbol===series?.provenance.providerSymbol&&(interval!==context.interval||p.hash===hash));
  const current=!!(frame?.available&&bound&&p?.interval===interval&&p.status==='recent'&&expiry!==null&&now<=expiry&&p.lastTime+({'15m':900000,'1h':3600000,'1d':86400000}[interval])<=now);
  return {interval,selected:interval===context.interval,status:!frame?.available||!bound?'unavailable':current?'recent':'stale',trend:current&&['bullish','bearish','neutral'].includes(frame.trend)?frame.trend:null,source:p?.source??null,providerSymbol:p?.providerSymbol??null,hash:p?.hash??null,lastTime:p?.lastTime??null,ema20:current?frame.ema20:null,ema50:current?frame.ema50:null,rsi:current?frame.rsi:null,atr:current?frame.atr:null};
 });
 const validAnalysis=!!(model?.fresh&&analysis&&same(analysis.symbol,analysis.timeframe,analysis.evidence?.hash)&&analysis.evidence.lastTime===series?.provenance.lastTime);
 const schools=validAnalysis&&Array.isArray(analysis.schools)?analysis.schools.map((s,index)=>({id:String(index),name:s.name||s.id||s.key||'',bias:['BULLISH','BEARISH','NEUTRAL'].includes(s.bias)?s.bias:'UNKNOWN',reasons:Array.isArray(s.reasons)?s.reasons.filter(v=>typeof v==='string'):[],warnings:Array.isArray(s.warnings)?s.warnings.filter(v=>typeof v==='string'):[]})):[];
 return {matched,frames,schools,source:matched?{...series.provenance}:null,blockingReasons:Array.isArray(model?.warnings)?[...model.warnings]:[],candidate:model?.fresh&&matched&&model.candidate?.symbol===context.symbol&&model.candidate?.interval===context.interval&&model.candidate?.hash===hash&&model.candidate?.barTime===series?.provenance.lastTime?structuredClone(model.candidate):null,probability:null,executionAuthorized:false};
}
