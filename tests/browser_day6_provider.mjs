// Day6 ONLY: controlled offline histories for the existing authoritative engines.
// The reflected GBPUSD history exercises the BUY branch. No analysis, risk or
// eligibility algorithm is replaced. Never imported by application/packaging.
import './browser-provider.js';
const fixtureFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 const response=await fixtureFetch(url,options);
 if(!String(url).startsWith('https://')||!String(url).includes('finance.yahoo.com')||!['GBPUSD','AUDUSD'].some(s=>String(url).includes(s)))return response;
 const data=await response.json();
 for(const row of data.chart?.result||[]){
  const q=row.indicators.quote[0];
  if(String(url).includes('GBPUSD')){
   const oldHigh=q.high;q.open=q.open.map(v=>2.2-v);q.close=q.close.map(v=>2.2-v);
   q.high=q.low.map(v=>2.2-v);q.low=oldHigh.map(v=>2.2-v);
  }else{
   // Small but valid OHLC ranges exercise retained six-decimal price precision.
   for(const key of ['open','close','high','low'])q[key]=q[key].map(v=>1.1+(v-1.1)*.001);
  }
 }
 return Response.json(data,{status:response.status});
};
