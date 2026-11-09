// Stable offline provider snapshot for the longer paper-review matrix.
// The original fixture regenerates every bar timestamp at each request; after
// the real 30s market cache expires that correctly invalidates retained hashes.
// Reuse identical provider responses here. Application clocks/cache are untouched;
// stale/changed/unavailable rejection is tested independently in risk-preview tests.
import './provider-fixture.js';
const fixtureFetch=globalThis.fetch,responses=new Map();
globalThis.fetch=async(url,options)=>{
 if(!String(url).startsWith('https://'))return fixtureFetch(url,options);
 const key=String(url);
 if(!responses.has(key))responses.set(key,fixtureFetch(url,options).then(async r=>({body:await r.text(),status:r.status,headers:[...r.headers]})));
 const r=await responses.get(key);return new Response(r.body,{status:r.status,headers:r.headers});
};
