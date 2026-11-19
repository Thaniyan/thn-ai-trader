// Aggregate observations only. Never changes rows, timestamps, hashes or eligibility.
const evidence=new WeakMap(),stepMs={'15m':900000,'1h':3600000,'1d':86400000};
const validTime=t=>Number.isFinite(t)&&t>0&&t<=8640000000000000;
const symbol=v=>typeof v==='string'&&/^[A-Za-z0-9^=:.\-]{1,32}$/.test(v)?v:null;
const buckets=['missing_ohlc','nonfinite_or_nonnumeric_ohlc','nonpositive_ohlc','invalid_ohlc_geometry','other_adapter_rejection'];
export function recordProviderRows(rows,kept,{provider,requestedSymbol,meta={}}={}){
 meta=meta&&typeof meta==='object'&&!Array.isArray(meta)?meta:{};
 if(rows.length>20000){evidence.set(kept,{state:'limit_exceeded'});return;}
 const accepted=new Set(kept),rejections=Object.fromEntries(buckets.map(k=>[k,0])),rejectedTimes=[];
 let retainedInvalidTime=0;
 for(const r of rows){
  if(accepted.has(r)){if(!validTime(r.time))retainedInvalidTime++;continue;}
  const values=[r.open,r.high,r.low,r.close];
  const reason=values.some(v=>v==null)?buckets[0]:values.some(v=>typeof v!=='number'||!Number.isFinite(v))?buckets[1]:values.some(v=>v<=0)?buckets[2]:r.high<Math.max(r.open,r.close)||r.low>Math.min(r.open,r.close)?buckets[3]:buckets[4];
  rejections[reason]++;rejectedTimes.push(validTime(r.time)?r.time:null);
 }
 let timezone=null;
 if(typeof meta.exchangeTimezoneName==='string'&&/^[A-Za-z0-9_+\-/]{1,80}$/.test(meta.exchangeTimezoneName))try{new Intl.DateTimeFormat('en',{timeZone:meta.exchangeTimezoneName}).format(0);timezone=meta.exchangeTimezoneName;}catch{}
 evidence.set(kept,{state:'recorded',rawCount:rows.length,acceptedCount:kept.length,rejections,rejectedTimes,retainedInvalidTime,
  metadata:{provider:provider==='binance'?'binance':'yahoo',requestedSymbol:symbol(requestedSymbol),reportedSymbol:symbol(meta.symbol),reportedCurrency:typeof meta.currency==='string'&&/^[A-Za-z]{3,8}$/.test(meta.currency)?meta.currency:null,
   reportedProductType:typeof meta.instrumentType==='string'&&/^[A-Za-z_\-]{1,30}$/.test(meta.instrumentType)?meta.instrumentType:null,
   reportedTimezone:timezone,reportedUtcOffsetSeconds:Number.isInteger(meta.gmtoffset)&&Math.abs(meta.gmtoffset)<=50400?meta.gmtoffset:null,
   reportedGranularity:typeof meta.dataGranularity==='string'&&/^[0-9]{1,3}[mhdwk]{1,2}$/.test(meta.dataGranularity)?meta.dataGranularity:null,
   currentSessionMetadataPresent:Number.isFinite(meta.currentTradingPeriod?.regular?.start)&&Number.isFinite(meta.currentTradingPeriod?.regular?.end),
   observationTimeBasis:provider==='binance'?'last_kline_open_not_exchange_clock':'provider_regular_market_time',calendarVerified:false,providerAuthenticated:false}});
}
// UTC weekend overlap is a timestamp shape, NOT a verified exchange closure.
function weekendOverlap(start,end){
 if(!validTime(start)||!validTime(end)||end<=start)return false;
 if(end-start>=7*86400000)return true;
 for(let t=Math.floor(start/86400000)*86400000;t<end;t+=86400000){const day=new Date(t).getUTCDay();if((day===0||day===6)&&Math.max(start,t)<Math.min(end,t+86400000))return true;}
 return false;
}
export function marketDiagnostics(market,series){
 const p=series.provenance,rows=series.candles,step=stepMs[p.interval],raw=evidence.get(market.candles);
 const gaps={count:0,utcWeekendOverlap:0,otherUtcShape:0,durationBuckets:{under6h:0,from6hTo36h:0,from36hTo96h:0,atLeast96h:0}},alignment={daily23h:0,daily24h:0,daily25h:0,otherDailySpacing:0,invalidSelectedTimeCount:0,utcHourCounts:Array(24).fill(0),utcMinuteCounts:Array(60).fill(0)};
 for(let i=0;i<rows.length;i++){
  if(validTime(rows[i].time)){const date=new Date(rows[i].time);alignment.utcHourCounts[date.getUTCHours()]++;alignment.utcMinuteCounts[date.getUTCMinutes()]++;}else alignment.invalidSelectedTimeCount++;
  if(!i)continue;const delta=rows[i].time-rows[i-1].time;
  if(p.interval==='1d')alignment[delta===23*3600000?'daily23h':delta===86400000?'daily24h':delta===25*3600000?'daily25h':'otherDailySpacing']++;
  // Same frozen counter predicate, used only to explain its existing total.
  if(delta>step*1.5){gaps.count++;gaps[weekendOverlap(rows[i-1].time+step,rows[i].time)?'utcWeekendOverlap':'otherUtcShape']++;gaps.durationBuckets[delta<6*3600000?'under6h':delta<36*3600000?'from6hTo36h':delta<96*3600000?'from36hTo96h':'atLeast96h']++;}
 }
 const excluded=market.candles.filter(r=>r.time+step>Math.min(p.providerTime,market.evidence?.asOf??Infinity)).length;
 const locations={beforeSelected:0,withinSelected:0,afterSelected:0,unknownTime:0};
 if(raw?.state==='recorded')for(const time of raw.rejectedTimes)locations[time===null?'unknownTime':time<p.firstTime?'beforeSelected':time>p.lastTime?'afterSelected':'withinSelected']++;
 return {schema:'THN-DATA-QUALITY-1',symbol:market.symbolInfo?.display||null,interval:p.interval,datasetHash:p.hash,
  originalCounters:{gapCount:p.gapCount,discardedRows:p.discardedRows},
  adapter:raw?.state==='recorded'?{state:'recorded',scope:'full_provider_response',rawCount:raw.rawCount,acceptedCount:raw.acceptedCount,rejectedCount:raw.rejectedTimes.length,rejectionReasons:{...raw.rejections},rejectionLocations:locations,retainedInvalidTimestampCount:raw.retainedInvalidTime}: {state:'unavailable'},
  selectedWindow:{scope:'retained_closed_tail',count:rows.length,firstTime:p.firstTime,lastTime:p.lastTime,excludedNotClosedOrAfterObservation:excluded,trimmedClosedRows:Math.max(0,market.candles.length-excluded-rows.length)},
  gaps,alignment,metadata:raw?.state==='recorded'?{...raw.metadata}:null,
  reconciliation:{gapsMatch:gaps.count===p.gapCount,rejectionsMatch:raw?.state==='recorded'?raw.rejectedTimes.length===p.discardedRows:null},
  expectedClosureCount:null,unexplainedGapCount:null,calendarState:'UNVERIFIED',qualificationChanged:false,executionAuthorized:false};
}
