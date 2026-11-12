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

// Compact, source-bound reading of retained facts; no new score, signal or levels.
export function decisionEvidence({evidence,model,brief}){
 const usable=!!(evidence?.matched&&model?.fresh),schools=usable?evidence.schools:[];
 const action=model?.recommendation?.action,side=action==='SELL'?'BEARISH':'BULLISH',opposite=side==='BULLISH'?'BEARISH':'BULLISH';
 const fact=bias=>schools.filter(s=>s.bias===bias&&s.reasons.length).slice(0,2).map(s=>({id:s.id,name:s.name,bias:s.bias,text:s.reasons[0]}));
 const available=usable?evidence.frames.filter(f=>f.status==='recent'&&f.trend):[];
 const directions=[...new Set(available.map(f=>f.trend))];
 const alignment=available.length!==3?'incomplete':directions.length>1?'mixed':directions[0]||'neutral';
 const sameBrief=brief?.symbol===model?.context?.symbol&&brief?.interval===model?.context?.interval&&brief?.selected?.provenance?.hash===model?.context?.hash;
 const scenarios=usable&&sameBrief&&Array.isArray(brief?.scenarios)?brief.scenarios.filter(s=>s&&['bullish','bearish'].includes(s.direction)&&Number.isFinite(s.trigger)&&s.trigger>0&&Number.isFinite(s.invalidation)&&s.invalidation>0).map(s=>({direction:s.direction,trigger:s.trigger,invalidation:s.invalidation})):[];
 return {usable,directional:usable&&['BUY','SELL'].includes(action),action:usable?action:'WAIT',supporting:fact(side),opposing:fact(opposite),alignment,availableFrames:available.length,scenarios,probability:null,executionAuthorized:false};
}

// Read the original chart's selected closed candle, never calculate substitute OHLC.
export function chartReading({context,series,visible=[],hover,plot,fresh}){
 if(!fresh||!series||series.symbol!==context.symbol||series.provenance?.interval!==context.interval||series.provenance?.hash!==context.datasetId||!visible.length)return null;
 const inspecting=!!(hover&&plot?.width>0&&hover.x>=plot.left&&hover.x<=plot.right);
 const index=inspecting?Math.min(visible.length-1,Math.max(0,Math.floor((hover.x-plot.left)/plot.width*visible.length))):visible.length-1;
 const candle=visible[index],original=series.candles.find(c=>c.time===candle.time);
 if(!original||!['open','high','low','close'].every(k=>Number.isFinite(original[k])&&original[k]===candle[k]))return null;
 const end=series.candles.findIndex(c=>c.time===visible.at(-1).time)+1,prior=series.candles.slice(Math.max(0,end-21),end-1);
 return {candle:structuredClone(original),inspected:inspecting,index:series.candles.indexOf(original),hash:context.datasetId,rangeSource:prior.length?{first:prior[0].time,last:prior.at(-1).time,count:prior.length}:null,executionAuthorized:false};
}
