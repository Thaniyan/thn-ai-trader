// Input-only lossless compaction. Never hydrate or repair a model response.
export const LOCAL_REQUEST_VERSION='shared-provenance-2';
const hashKeys=new Set(['selectedHash','datasetHash']);
const defaultsKeys=['source','providerSymbol','status'];
const bytes=value=>Buffer.byteLength(JSON.stringify(value));
const copy=value=>JSON.parse(JSON.stringify(value));

export function packLocalEvidence(evidence){
 const original=copy(evidence);
 if(!Array.isArray(original.refs)||Object.hasOwn(original,'hashes')||Object.hasOwn(original,'refDefaults'))throw Error('Invalid evidence encoding');
 const defaults={};
 for(const key of defaultsKeys)if(original.refs.length>1&&original.refs.every(r=>Object.hasOwn(r,key)&&typeof r[key]==='string'&&r[key]===original.refs[0][key]))defaults[key]=original.refs[0][key];
 const inherited=Object.keys(defaults).length?{...original,refDefaults:defaults,refs:original.refs.map(r=>Object.fromEntries(Object.entries(r).filter(([k])=>!Object.hasOwn(defaults,k))))}:original;
 const withHashes=value=>{
  const counts=new Map();
  function visit(v){if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){if(hashKeys.has(k)&&typeof x==='string'&&/^[a-f0-9]{64}$/.test(x))counts.set(x,(counts.get(x)||0)+1);else visit(x);}}
  visit(value);const hashes=[...counts].filter(([,n])=>n>1).map(([v])=>v);if(!hashes.length)return value;
  const positions=new Map(hashes.map((v,i)=>[v,i]));
  function encode(v){if(!v||typeof v!=='object')return v;if(Array.isArray(v))return v.map(encode);return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,hashKeys.has(k)&&positions.has(x)?{$hash:positions.get(x)}:encode(x)]));}
  return {...encode(value),hashes};
 };
 // Small or heterogeneous evidence stays flat when sharing would cost more.
 return [original,inherited,withHashes(original),withHashes(inherited)].reduce((best,v)=>bytes(v)<bytes(best)?v:best,original);
}

export function unpackLocalEvidence(wire){
 const value=copy(wire),defaults=value.refDefaults||{},hashes=value.hashes||[];
 if(!Array.isArray(value.refs)||!Array.isArray(hashes)||new Set(hashes).size!==hashes.length||hashes.some(v=>typeof v!=='string'||!/^[a-f0-9]{64}$/.test(v))||!defaults||typeof defaults!=='object'||Array.isArray(defaults)||Object.keys(defaults).some(k=>!defaultsKeys.includes(k)||typeof defaults[k]!=='string'))throw Error('Invalid evidence encoding');
 delete value.refDefaults;delete value.hashes;
 function decode(v){if(!v||typeof v!=='object')return v;if(Array.isArray(v))return v.map(decode);return Object.fromEntries(Object.entries(v).map(([k,x])=>{
  if(hashKeys.has(k)&&x&&typeof x==='object'){
   if(Object.keys(x).length!==1||!Object.hasOwn(x,'$hash')||!Number.isSafeInteger(x.$hash)||x.$hash<0||x.$hash>=hashes.length)throw Error('Invalid evidence hash reference');
   return [k,hashes[x.$hash]];
  }
  return [k,decode(x)];
 }));}
 const decoded=decode(value);decoded.refs=decoded.refs.map(r=>({...defaults,...r}));return decoded;
}
