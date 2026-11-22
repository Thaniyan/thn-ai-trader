// Controlled WAIT history for session-capacity tests only. No real source or engine is changed.
import './browser-provider.js';
const fixture=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 const response=await fixture(url,options);
 if(!String(url).startsWith('https://')||!String(url).includes('finance.yahoo.com'))return response;
 const body=await response.json();
 for(const r of body.chart?.result||[]){const q=r.indicators.quote[0];q.open=q.open.map(()=>1.1);q.close=q.close.map(()=>1.1);q.high=q.high.map(()=>1.101);q.low=q.low.map(()=>1.099);}
 return Response.json(body);
};
