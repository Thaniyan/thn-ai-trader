// Offline browser-only synthetic oscillating history. Not imported or packaged by
// production. Existing unit/system provider fixture is unchanged. Oscillation
// exercises real engine trades AND numerical cost sensitivity instead of zero trades.
const nativeFetch=globalThis.fetch,now=Math.floor(Date.now()/1000);
globalThis.fetch=async(url,options)=>{
 if(!String(url).startsWith('https://'))return nativeFetch(url,options);
 if(!String(url).includes('finance.yahoo.com'))return new Response('{}',{status:503});
 const u=new URL(url),interval=u.searchParams.get('interval')||'1h',step={'15m':900,'1h':3600,'1d':86400}[interval]||3600;
 const timestamp=Array.from({length:600},(_,i)=>now-(600-i)*step);
 const close=timestamp.map((_,i)=>1.1+Math.sin(i/8+1.5)*.025);
 return Response.json({chart:{result:[{timestamp,meta:{currency:'USD',exchangeName:'OFFLINE TEST FIXTURE',regularMarketTime:now},indicators:{quote:[{open:close.map(c=>c-.0003),high:close.map(c=>c+.001),low:close.map(c=>c-.001),close,volume:close.map(()=>100)}]}}]}});
};
