// Test-only deterministic provider payloads. Never loaded by production start commands.
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (!String(url).startsWith('https://')) return nativeFetch(url, options);
  const mode = process.env.TEST_PROVIDER_MODE;
  if (mode === 'down') return new Response('{}', { status: 503 });
  if (String(url).includes('binance.com')) return new Response('{}', { status: 503 });
  const stale = mode === 'stale';
  const now = Math.floor(Date.now()/1000) - (stale ? 86400 : 0);
  const interval = new URL(String(url)).searchParams.get('interval') || '1h';
  if (mode === 'partial' && interval === '1d') return new Response('{}', { status: 503 });
  const step = { '15m':900, '1h':3600, '1d':86400 }[interval] || 3600;
  const timestamp=Array.from({length:600},(_,i)=>now-(600-i)*step);
  const close=timestamp.map((_,i)=>1.08+i*.00001+Math.sin(i/4)*.0001);
  return Response.json({chart:{result:[{timestamp,meta:{currency:'USD',exchangeName:'TEST FIXTURE',regularMarketTime:now},indicators:{quote:[{open:close.map(c=>c-.00002),high:close.map(c=>c+.0001),low:close.map(c=>c-.0001),close,volume:close.map(()=>100)}]}}]}});
};
