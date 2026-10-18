import {performance} from 'node:perf_hooks';
import {startTestServer} from './harness.mjs';
const server=await startTestServer();
try{
  const samples=await Promise.all(Array.from({length:20},async()=>{const start=performance.now();const res=await fetch(server.url+'/api/watchlist/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbols:['EURUSD','XAUUSD','USDJPY']})});const data=await res.json();if(res.status!==200||data.count!==3)throw Error('Load regression: unexpected scan response');return performance.now()-start}));
  samples.sort((a,b)=>a-b);console.log(JSON.stringify({scenario:'20 concurrent fixture scans x 3 instruments',requests:samples.length,p50Ms:samples[9],p95Ms:samples[18],p99Ms:samples[19],note:'Local deterministic fixtures; not a measurement of real provider capacity or production latency'},null,2));
}finally{await server.stop()}
