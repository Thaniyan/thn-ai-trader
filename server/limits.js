const buckets=new Map();
export function allowRequest(identity,kind,limit,now=Date.now()){
  const key=identity+':'+kind;
  for(const [k,b] of buckets)if(now-b.start>=60000)buckets.delete(k);
  if(!buckets.has(key)){if(buckets.size>=10000)return false;buckets.set(key,{start:now,count:0})}
  const bucket=buckets.get(key);return ++bucket.count<=limit;
}
export async function mapConcurrent(items,fn,concurrency=3){
  const output=new Array(items.length);let next=0;
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{while(next<items.length){const index=next++;output[index]=await fn(items[index],index)}}));
  return output;
}
