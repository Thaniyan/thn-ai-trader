// Explicit SYNTHETIC source-quality fixture. The original adapter/closed-bar
// engine reject one genuinely invalid geometry row per synthetic Yahoo response.
// No real provider, eligible market Ticket or actual model is qualified here.
import './browser-provider.js';
const base=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 const r=await base(url,options);
 if(String(url).includes('finance.yahoo.com')){
  const data=await r.json();
  for(const row of data.chart?.result||[]){const q=row.indicators.quote[0];q.high[0]=q.low[0]*.9;Object.assign(row.meta,{instrumentType:'CURRENCY'});}
  return Response.json(data,{status:r.status});
 }
 return r;
};
