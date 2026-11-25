// Bounded, aggregate-only observation shapes. No calendar or admission policy.
const validTime=t=>Number.isFinite(t)&&t>0&&t<=8640000000000000;
const timing=()=>({weekdayCounts:Array(7).fill(0),hourCounts:Array(24).fill(0),unknownTime:0});
function localClock(timezone){
 if(!timezone)return null;
 try{const f=new Intl.DateTimeFormat('en-US-u-ca-iso8601-nu-latn',{timeZone:timezone,weekday:'short',hour:'2-digit',hourCycle:'h23',timeZoneName:'longOffset'});return t=>{const p=Object.fromEntries(f.formatToParts(t).map(x=>[x.type,x.value])),day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday),hour=Number(p.hour),m=/^GMT(?:([+-])(\d{2}):(\d{2}))?$/.exec(p.timeZoneName||'');return day>=0&&hour>=0&&hour<24&&m?{day,hour,offset:m[1]?(m[1]==='-'?-1:1)*(Number(m[2])*60+Number(m[3])):0}:null;};}catch{return null;}
}
function observe(target,time,clock){
 if(!validTime(time)){target.unknownTime++;return null;}
 let point;try{point=clock?clock(time):{day:new Date(time).getUTCDay(),hour:new Date(time).getUTCHours()};}catch{target.unknownTime++;return null;}
 if(!point){target.unknownTime++;return null;}
 target.weekdayCounts[point.day]++;target.hourCounts[point.hour]++;return point;
}
function category(clock){return {count:0,utcTiming:timing(),localTiming:clock?timing():null,runs:{runCount:0,longestRun:0,lengthBuckets:{one:0,from2To5:0,from6To20:0,atLeast21:0}}};}
export function rowDetailCollector(timezone){
 const clock=localClock(timezone),missing={...category(clock),fieldOrder:['open','high','low','close'],missingMaskCounts:Array(16).fill(0),nullFieldCounts:Array(4).fill(0),absentFieldCounts:Array(4).fill(0),allFourNull:0,allFourAbsent:0,mixedOrPartial:0},geometry={...category(clock),comparisonOrder:['high_below_open','high_below_close','low_above_open','low_above_close','high_below_low'],comparisonMaskCounts:Array(32).fill(0),boundaryCounts:{highBelowOpen:0,highBelowClose:0,lowAboveOpen:0,lowAboveClose:0,rangeInverted:0},severityBasis:'maximum_boundary_violation_divided_by_max_ohlc_times_10000',severityBuckets:{under0_01bp:0,from0_01To1bp:0,from1To10bp:0,atLeast10bp:0}},points=[];
 let lastIndex=-2,lastKind=null,runLength=0;
 const closeRun=()=>{if(!lastKind||!runLength)return;const r=(lastKind==='missing_ohlc'?missing:geometry).runs;r.runCount++;r.longestRun=Math.max(r.longestRun,runLength);r.lengthBuckets[runLength===1?'one':runLength<=5?'from2To5':runLength<=20?'from6To20':'atLeast21']++;};
 return {add(row,reason,index){
  points.push({time:validTime(row.time)?row.time:null,kind:reason==='missing_ohlc'?'missing':reason==='invalid_ohlc_geometry'?'geometry':'other'});
  const group=reason==='missing_ohlc'?missing:reason==='invalid_ohlc_geometry'?geometry:null;
  if(!group){closeRun();lastKind=null;runLength=0;lastIndex=index;return;}
  if(lastKind===reason&&lastIndex+1===index)runLength++;else{closeRun();lastKind=reason;runLength=1;}lastIndex=index;
  group.count++;observe(group.utcTiming,row.time);if(group.localTiming)observe(group.localTiming,row.time,clock);
  const values=[row.open,row.high,row.low,row.close];
  if(group===missing){let mask=0;values.forEach((v,i)=>{if(v==null)mask|=1<<i;if(v===null)missing.nullFieldCounts[i]++;if(v===undefined)missing.absentFieldCounts[i]++;});missing.missingMaskCounts[mask]++;missing[values.every(v=>v===null)?'allFourNull':values.every(v=>v===undefined)?'allFourAbsent':'mixedOrPartial']++;}
  else{const tests=[row.high<row.open,row.high<row.close,row.low>row.open,row.low>row.close,row.high<row.low];Object.keys(geometry.boundaryCounts).forEach((key,i)=>{if(tests[i])geometry.boundaryCounts[key]++;});geometry.comparisonMaskCounts[tests.reduce((m,v,i)=>m|(v?1<<i:0),0)]++;const reference=Math.max(...values),violation=Math.max(0,row.open-row.high,row.close-row.high,row.low-row.open,row.low-row.close,row.low-row.high)/reference*10000;geometry.severityBuckets[violation<.01?'under0_01bp':violation<1?'from0_01To1bp':violation<10?'from1To10bp':'atLeast10bp']++;}
 },finish(){closeRun();lastKind=null;return {report:{scope:'full_provider_response',timezone:clock?timezone:null,missing,geometry},points};}};
}
function bound(points,time,inclusive){let lo=0,hi=points.length;while(lo<hi){const mid=(lo+hi)>>>1;if(points[mid].time<time||inclusive&&points[mid].time===time)lo=mid+1;else hi=mid;}return lo;}
export function gapShapeDetails(rows,step,timezone,points){
 const clock=localClock(timezone),valid=Array.isArray(points)?points.filter(p=>validTime(p.time)).sort((a,b)=>a.time-b.time):[],prefix={missing:[0],geometry:[0],other:[0]};
 for(const p of valid)for(const kind of Object.keys(prefix))prefix[kind].push(prefix[kind].at(-1)+(p.kind===kind?1:0));
 const result={scope:'retained_closed_tail',spacingBasis:'adjacent_bar_open_delta',count:0,utcDepartures:timing(),utcArrivals:timing(),localDepartures:clock?timing():null,localArrivals:clock?timing():null,offsetChanges:{changed:0,unchanged:0,unknown:0},correlation:{missingOnly:0,geometryOnly:0,mixedOrOther:0,noRejectedTimestamp:0,notObservable:0,rowsInsideGaps:{missing:0,geometry:0,other:0},unknownRejectedTimeCount:Array.isArray(points)?points.length-valid.length:null}};
 for(let i=1;i<rows.length;i++){
  const a=rows[i-1].time,b=rows[i].time;if(!(b-a>step*1.5))continue;result.count++;observe(result.utcDepartures,a);observe(result.utcArrivals,b);
  let start=null,end=null;if(clock){start=observe(result.localDepartures,a,clock);end=observe(result.localArrivals,b,clock);}result.offsetChanges[!start||!end?'unknown':start.offset===end.offset?'unchanged':'changed']++;
  if(!Array.isArray(points)){result.correlation.notObservable++;continue;}
  const lo=bound(valid,a,true),hi=bound(valid,b,false),n=Object.fromEntries(Object.entries(prefix).map(([k,v])=>[k,v[hi]-v[lo]]));for(const k of Object.keys(n))result.correlation.rowsInsideGaps[k]+=n[k];result.correlation[n.other||n.missing&&n.geometry?'mixedOrOther':n.missing?'missingOnly':n.geometry?'geometryOnly':'noRejectedTimestamp']++;
 }
 return result;
}
