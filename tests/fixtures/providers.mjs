import fs from "node:fs";
import path from "node:path";
// Only loaded by the isolated test subprocess; never an application data mode.
const prices = { 'EURUSD=X':1.085, 'GBPUSD=X':1.25, 'USDJPY=X':150, 'GC=F':2735, '^DJI':42000, 'BTC-USD':84000 };
if(process.env.THN_TEST_LEGACY_AUDIT)fs.writeFileSync(path.join(process.env.THN_DATA_DIR,"audit_log.json"),JSON.stringify([{id:"legacy-event",accountId:"acc_paper_sandbox_01",correlationId:"legacy",details:{nested:{password:"test-only-value",message:"preserved"}}}]));
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(String(input));
  if(url.hostname==='api.openai.com'){if(process.env.THN_TEST_OPENAI_MODE==='outage')return new Response('{}',{status:503});if(process.env.THN_TEST_OPENAI_MODE==='rate-limit')return new Response('{}',{status:429});if(process.env.THN_TEST_OPENAI_MODE==='timeout')return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));const narrative={aiNarrative:'Cautious mocked narrative',professionalActionPlan:['Review data'],extraWarnings:[]};if(process.env.THN_TEST_OPENAI_MODE==='invalid')narrative.entry=999;return Response.json({choices:[{message:{content:JSON.stringify(narrative)}}]})}
  if (url.hostname === 'api.binance.com') return new Response('{}', {status:503});
  if (!['query1.finance.yahoo.com','query2.finance.yahoo.com'].includes(url.hostname)) return originalFetch(input,options);
  if(process.env.THN_TEST_COUNT_REQUESTS){const countFile=path.join(process.env.THN_DATA_DIR,'provider-count.txt');fs.appendFileSync(countFile,'request\n')}
  const modeFile=path.join(process.env.THN_DATA_DIR,'test-provider-mode.txt');
  const mode=fs.existsSync(modeFile)?fs.readFileSync(modeFile,'utf8').trim():process.env.THN_TEST_PROVIDER_MODE;
  if(mode==='invalid-json')return new Response('{invalid');
  if(mode==='timeout')throw new DOMException('Fixture timeout','TimeoutError');
  if(mode==='outage')return new Response('{}',{status:503});
  if(mode==='rate-limit')return new Response('{}',{status:429,headers:{'Retry-After':'60'}});
  if(mode==='partial'&&url.pathname.endsWith('GC%3DF'))return new Response('{}',{status:503});
  const symbol = decodeURIComponent(url.pathname.split('/').at(-1));
  const control=path.join(process.env.THN_DATA_DIR,"test-price.json");
  const price = fs.existsSync(control)?(JSON.parse(fs.readFileSync(control))[symbol]||prices[symbol]||100):(prices[symbol]||100);
  const step = url.searchParams.get('interval') === '1d' ? 86400000 : url.searchParams.get('interval') === '15m' ? 900000 : 3600000;
  const now = Math.floor(Date.now()/1000);
  const count=mode==='long'?480:240;
  const close = Array.from({length:count},(_,i)=>price*(1+Math.sin(i/7)*0.0002)); close[count-1]=price;
  const response={chart:{result:[{meta:{symbol:mode==='wrong-symbol'?'WRONG':symbol,currency:symbol==='USDJPY=X'?'JPY':'USD',regularMarketTime:mode==='stale'?now-86400:now-Number(process.env.THN_TEST_QUOTE_AGE_SECONDS||0),regularMarketPrice:price,exchangeName:'TEST_FIXTURE'},timestamp:close.map((_,i)=>now-(count-i)*step/1000-(mode==='old-history'?363*86400:0)),indicators:{quote:[{open:close,close,high:close.map(v=>v*1.001),low:close.map(v=>v*0.999),volume:close.map(()=>1000)}]}}]}};
  if(mode==='empty'){const q=response.chart.result[0].indicators.quote[0];for(const key of ['open','high','low','close'])q[key][0]=null;}
  const meta=response.chart.result[0].meta;
  if(mode==='missing-price')delete meta.regularMarketPrice;
  if(mode==='missing-currency')delete meta.currency;
  if(mode==='wrong-currency')meta.currency='GBP';
  if(mode==='invalid-delay')meta.exchangeDataDelayedBy='15';
  if(mode==='missing-time')delete meta.regularMarketTime;
  if(mode==='future-time')meta.regularMarketTime=now+120;
  if(mode==='delayed')meta.exchangeDataDelayedBy=15;
  return Response.json(response);
};
