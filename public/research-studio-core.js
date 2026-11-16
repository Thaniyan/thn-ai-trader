/* Read-only workspace projections. Never calculates financial returns or approvals. */
export function matchedSeries(context,series){return !!(series&&series.symbol===context?.symbol&&series.provenance?.interval===context.interval&&series.provenance.hash===context.datasetId);}
export function currentEvaluation(context,series,evaluation,state={}){
 return !!(matchedSeries(context,series)&&evaluation?.symbol===context.symbol&&evaluation.dataset?.interval===context.interval&&evaluation.dataset.hash===context.datasetId&&!state.dirty&&!state.busy&&!state.failed);
}
export function eventAvailability(event,interval){const span={'15m':900000,'1h':3600000,'1d':86400000}[interval];return Number.isFinite(event?.confirmedAt)&&span?event.confirmedAt+span:null;}
export function candleInspection(series,index){
 if(!series?.candles?.length||!Number.isInteger(index)||index<0||index>=series.candles.length)return null;
 const candle=series.candles[index],span={'15m':900000,'1h':3600000,'1d':86400000}[series.provenance.interval];
 return {index,candle:{...candle},volumeAvailable:series.provenance.volumeAvailable===true,indicators:Object.fromEntries(['ema20','ema50','rsi14','atr14'].map(k=>[k,series.indicators?.[k]?.[index]??null])),events:(series.events||[]).filter(e=>eventAvailability(e,series.provenance.interval)!==null&&eventAvailability(e,series.provenance.interval)<=candle.time+span&&e.index===index).map(e=>({...e})),hash:series.provenance.hash};
}
export function chartWindow(length,count,center){
 if(!Number.isInteger(length)||length<1)return null;
 const size=Math.max(Math.min(20,length),Math.min(length,Math.round(count))),index=Math.max(0,Math.min(length-1,Math.round(center)));
 const end=Math.max(size,Math.min(length,index+Math.ceil(size/2)));return {count:size,offset:length-end,index};
}
export function nearestBar(candles,time){
 if(!Array.isArray(candles)||!candles.length||!Number.isFinite(time))return -1;
 let low=0,high=candles.length-1;while(low<high){const m=Math.floor((low+high)/2);if(candles[m].time<time)low=m+1;else high=m;}
 return low>0&&Math.abs(candles[low-1].time-time)<=Math.abs(candles[low].time-time)?low-1:low;
}
export function workflowState({context,series,brief,evaluation,evaluationState,plan,entries=[]}){
 const data=matchedSeries(context,series),evidence=data&&brief?.symbol===context.symbol&&brief.interval===context.interval&&brief.selected?.provenance.hash===context.datasetId;
 const validation=currentEvaluation(context,series,evaluation,evaluationState),planning=evidence&&!!plan&&plan.symbol===context.symbol&&plan.context?.interval===context.interval&&plan.context?.datasetHash===context.datasetId;
 return {data,evidence,validation,planning,saved:entries.some(e=>e.record?.symbol===context?.symbol&&e.record.interval===context.interval&&e.record.brief?.selected?.provenance.hash===context.datasetId),executionAuthorized:false,probability:null};
}
export function appendCitation(value,citation,max=2000){
 if(typeof value!=='string'||typeof citation!=='string'||!citation)return {ok:false,value};
 if(value.includes(citation))return {ok:true,value};const next=(value?value+'\n':'')+citation;return next.length>max?{ok:false,value}:{ok:true,value:next};
}
// Display precision only: a nonzero recorded value must not become a false zero.
export function formatRecordedNumber(value,locale='en-US',digits=3){
 if(!Number.isFinite(value))return '—';
 const options=value!==0&&Math.abs(value)<10**(-digits)?{maximumSignificantDigits:3}:{maximumFractionDigits:digits};
 return new Intl.NumberFormat(locale,options).format(value);
}
