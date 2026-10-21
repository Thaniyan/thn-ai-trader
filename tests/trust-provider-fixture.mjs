// Offline data-boundary regression only; never packaged or used at runtime.
import './provider-fixture.js';
const original=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
  const response=await original(url,options);
  if(!String(url).includes('finance.yahoo.com')||!response.ok)return response;
  const data=await response.json(),r=data.chart.result[0],q=r.indicators.quote[0];
  r.timestamp.push(Math.floor(Date.now()/1000));
  for(const [key,value] of Object.entries({open:1.2,high:1.21,low:1.19,close:1.2,volume:100}))q[key].push(value);
  return Response.json(data);
};
