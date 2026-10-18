import http from "node:http";
if (typeof http.setGlobalProxyFromEnv === "function") http.setGlobalProxyFromEnv();
const TIMEFRAME_CONFIG = {
  h4:{range:"1mo",interval:"1h",tvInterval:"240",label:"H4"},
  scalp: { range: "5d", interval: "15m", tvInterval: "15", label: "Scalp" },
  intraday: { range: "1mo", interval: "1h", tvInterval: "60", label: "Intraday" },
  swing: { range: "6mo", interval: "1d", tvInterval: "D", label: "Swing" },
  position: { range: "2y", interval: "1d", tvInterval: "D", label: "Position" }
};

const SYMBOL_ALIASES = new Map([
  ["GOLD", { yahoo: "GC=F", tv: "OANDA:XAUUSD", display: "XAUUSD", assetClass: "Commodity" }],
  ["XAU", { yahoo: "GC=F", tv: "OANDA:XAUUSD", display: "XAUUSD", assetClass: "Commodity" }],
  ["XAUUSD", { yahoo: "GC=F", tv: "OANDA:XAUUSD", display: "XAUUSD", assetClass: "Commodity" }],
  ["SILVER", { yahoo: "SI=F", tv: "OANDA:XAGUSD", display: "XAGUSD", assetClass: "Commodity" }],
  ["XAGUSD", { yahoo: "SI=F", tv: "OANDA:XAGUSD", display: "XAGUSD", assetClass: "Commodity" }],
  ["USOIL", { yahoo: "CL=F", tv: "TVC:USOIL", display: "USOIL", assetClass: "Commodity" }],
  ["WTI", { yahoo: "CL=F", tv: "TVC:USOIL", display: "USOIL", assetClass: "Commodity" }],
  ["BRENT", { yahoo: "BZ=F", tv: "TVC:UKOIL", display: "BRENT", assetClass: "Commodity" }],
  ["BTC", { yahoo: "BTC-USD", tv: "BINANCE:BTCUSDT", display: "BTCUSD", assetClass: "Crypto" }],
  ["BTCUSD", { yahoo: "BTC-USD", tv: "BINANCE:BTCUSDT", display: "BTCUSD", assetClass: "Crypto" }],
  ["BTCUSDT", { yahoo: "BTC-USD", tv: "BINANCE:BTCUSDT", display: "BTCUSDT", assetClass: "Crypto" }],
  ["ETH", { yahoo: "ETH-USD", tv: "BINANCE:ETHUSDT", display: "ETHUSD", assetClass: "Crypto" }],
  ["ETHUSD", { yahoo: "ETH-USD", tv: "BINANCE:ETHUSDT", display: "ETHUSD", assetClass: "Crypto" }],
  ["ETHUSDT", { yahoo: "ETH-USD", tv: "BINANCE:ETHUSDT", display: "ETHUSDT", assetClass: "Crypto" }],
  ["SPX", { yahoo: "^GSPC", tv: "SP:SPX", display: "SPX", assetClass: "Index" }],
  ["NAS100", { yahoo: "^IXIC", tv: "OANDA:NAS100USD", display: "NAS100", assetClass: "Index" }],
  ["US30", { yahoo: "^DJI", tv: "OANDA:US30USD", display: "US30", assetClass: "Index" }]
]);

export function normalizeSymbol(rawSymbol = "EURUSD") {
  let raw = String(rawSymbol || "EURUSD").trim().toUpperCase();
  raw = raw.replace(/\s+/g, "");
  let tvPrefix = "";
  if (raw.includes(":")) {
    const parts = raw.split(":");
    tvPrefix = parts[0];
    raw = parts[1] || raw;
  }

  if (SYMBOL_ALIASES.has(raw)) return SYMBOL_ALIASES.get(raw);
  if (raw.endsWith("=X")) {
    const pair = raw.replace("=X", "");
    return { yahoo: raw, tv: `FX:${pair}`, display: pair, assetClass: "Forex" };
  }
  if (/^[A-Z]{6}$/.test(raw)) {
    const base = raw.slice(0, 3);
    const quote = raw.slice(3, 6);
    const cryptoBases = new Set(["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOG", "LTC"]);
    if (cryptoBases.has(base) && ["USD", "USDT"].includes(quote)) {
      return { yahoo: `${base}-USD`, tv: `BINANCE:${base}USDT`, display: raw, assetClass: "Crypto" };
    }
    return { yahoo: `${base}${quote}=X`, tv: tvPrefix ? `${tvPrefix}:${raw}` : `FX:${raw}`, display: raw, assetClass: "Forex" };
  }
  if (/^[A-Z]{3,5}USDT$/.test(raw)) {
    const base = raw.replace("USDT", "");
    return { yahoo: `${base}-USD`, tv: `BINANCE:${raw}`, display: raw, assetClass: "Crypto" };
  }
  return { yahoo: raw, tv: raw, display: raw, assetClass: "Stock" };
}

const MAX_QUOTE_AGE=120000;
const intervals={h4:3600000,scalp:900000,intraday:3600000,swing:86400000,position:86400000};
const cache=new Map(),pending=new Map(),failures=new Map(),queue=[];
let active=0,lastStatus={state:'UNAVAILABLE',reason:'No provider response observed'};
export function marketReadiness(){return {...lastStatus,activeRequests:active,cachedInstruments:cache.size}}
export function validateCandles(candles,now=Date.now()) {
  if(!Array.isArray(candles)||candles.length<35)throw Error('Insufficient valid candle history');
  let previous=0;
  for(const c of candles){
    if(![c.time,c.open,c.high,c.low,c.close,c.volume].every(Number.isFinite)||c.time<=previous||c.time>now||Math.min(c.open,c.high,c.low,c.close)<=0||c.volume<0||c.high<Math.max(c.open,c.close,c.low)||c.low>Math.min(c.open,c.close,c.high))throw Error('Invalid OHLC, timestamp, order or volume');
    previous=c.time;
  }
  return candles;
}
// Session gaps are allowed in whole bar steps. Without a verified exchange calendar,
// bounded closure allowances retain history but never authorize closed-market execution.
export function candleStatus(candles,timeframe,assetClass,now=Date.now()){
  validateCandles(candles,now);
  const step=timeframe==='h4'?14400000:intervals[timeframe];
  if(!step)throw Error('Unsupported timeframe');
  let adjacent=false;
  for(let i=1;i<candles.length;i++){
    const ratio=(candles[i].time-candles[i-1].time)/step;
    const dailySessionShift=step===86400000&&assetClass!=='Crypto'&&Math.abs(Math.abs(ratio-Math.round(ratio))-1/24)<1e-6;
    if((ratio<1&&!dailySessionShift)||(Math.abs(ratio-Math.round(ratio))>1e-6&&!dailySessionShift))throw Error('Candle timestamps inconsistent with requested timeframe');
    if(Math.abs(ratio-1)<1e-6||dailySessionShift&&ratio<2)adjacent=true;
  }
  if(!adjacent)throw Error("Missing expected timeframe cadence");
  const age=now-(candles.at(-1).time+step);
  if(age<0)throw Error("Unclosed candle in analysis history");
  const current=age>=0&&age<=step;
  const closureAllowance=assetClass==='Crypto'?step:Math.max(step,4*86400000);
  return {current,closureCompatible:!current&&age>=0&&age<=closureAllowance,lastClosedAt:candles.at(-1).time+step,ageMs:age};
}
export function classifyQuote(timestamp,now=Date.now()) {
  return Number.isFinite(timestamp)&&timestamp<=now+1000&&timestamp>0&&now-timestamp<=MAX_QUOTE_AGE;
}
export function assertPaperMarket(market){
  if(market?.provenance?.pricingProxy||market?.provenance?.instrumentMatch!==true)throw Object.assign(Error("Exact instrument data required; indicative proxies cannot authorize paper execution"),{status:502,code:"INSTRUMENT_UNVERIFIED"});
  if(!market?.provenance?.verified||market.provenance.candlesCurrent!==true||market.provenance.state!=='REAL'||!classifyQuote(market.marketTime)||!Number.isFinite(market.quotePrice)||market.quotePrice<=0)throw Object.assign(Error('Fresh verified provider price required; execution unavailable'),{status:502,code:'STALE_PRICE'});
}
async function limited(fn){
  if(active>=4){if(queue.length>=32)throw Object.assign(Error('Provider request capacity exceeded'),{status:429});await new Promise(resolve=>queue.push(resolve))}else active++;
  try{return await fn()}finally{if(queue.length)queue.shift()();else active--}
}
export function retryAfterSeconds(value,now=Date.now()) {
  if(!value)return 30;
  const seconds=/^\d+$/.test(value)?Number(value):(Date.parse(value)-now)/1000;
  return Number.isFinite(seconds)?Math.max(1,Math.ceil(seconds)):30;
}
async function json(url,timeout=7500){
  const response=await fetch(url,{signal:AbortSignal.timeout(timeout)});
  if(!response.ok)throw Object.assign(Error(`Provider HTTP ${response.status}`),{status:response.status===429?429:502,code:response.status===429?'PROVIDER_RATE_LIMITED':'MARKET_UNAVAILABLE',retryAfter:response.status===429?retryAfterSeconds(response.headers.get('Retry-After')):15});
  return response.json();
}
async function load(symbolInfo,timeframe){
  const cfg=TIMEFRAME_CONFIG[timeframe],step=intervals[timeframe],now=Date.now();
  const errors=[],causes=[];
  if(symbolInfo.assetClass==='Crypto'){
    try{
      const symbol=symbolInfo.display.replace(/(?:USDT|USD)$/,'')+'USDT';
      const data=await json(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe==="h4"?"4h":cfg.interval}&limit=300`);
      const all=data.map(k=>({time:Number(k[0]),open:Number(k[1]),high:Number(k[2]),low:Number(k[3]),close:Number(k[4]),volume:Number(k[5]),closeTime:Number(k[6])}));
      validateCandles(all,now);
      const quote=await json(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if(quote.symbol!==symbol)throw Error('Provider instrument identity mismatch');
      const bid=Number(quote.bidPrice),ask=Number(quote.askPrice);
      if(!Number.isFinite(bid)||!Number.isFinite(ask)||bid<=0||ask<bid)throw Error('Invalid provider bid/ask');
      return pack(symbolInfo,timeframe==='h4'?{...cfg,interval:'4h'}:cfg,all.filter(c=>c.closeTime<now),Number(quote.closeTime),(bid+ask)/2,'Binance','USDT',errors,0,timeframe);
    }catch(error){errors.push(error.message);causes.push(error)}
  }
  for(const host of ['query1.finance.yahoo.com','query2.finance.yahoo.com']){
    try{
      const data=await json(`https://${host}/v8/finance/chart/${encodeURIComponent(symbolInfo.yahoo)}?range=${cfg.range}&interval=${cfg.interval}&includePrePost=false`);
      const result=data.chart?.result?.[0],q=result?.indicators?.quote?.[0];
      if(!q)throw Error('Missing provider candles');
      if(result.meta?.symbol!==symbolInfo.yahoo)throw Error('Provider instrument identity mismatch');
      const all=result.timestamp.map((time,i)=>({time:time*1000,open:q.open[i],high:q.high[i],low:q.low[i],close:q.close[i],volume:q.volume?.[i]??0}));
      for(let i=0;i<all.length;i++)if(!Number.isFinite(all[i].time)||all[i].time>now||(i>0&&all[i].time<=all[i-1].time))throw Error("Invalid provider timestamp order");
      const empty=c=>[c.open,c.high,c.low,c.close].every(value=>value==null);
      const gapsSkipped=all.filter(empty).length,valid=all.filter(c=>!empty(c));
      validateCandles(valid,now);
      let closed=valid.filter(c=>c.time+step<=now);
      if(timeframe==="h4"){const buckets=new Map();for(const c of closed){const key=Math.floor(c.time/14400000)*14400000;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(c)}closed=[...buckets].filter(([time,cs])=>cs.length===4&&cs.every((c,i)=>i===0||c.time-cs[i-1].time===3600000)&&cs.at(-1).time+3600000<=now).map(([time,cs])=>({time:cs[0].time,open:cs[0].open,close:cs.at(-1).close,high:Math.max(...cs.map(c=>c.high)),low:Math.min(...cs.map(c=>c.low)),volume:cs.reduce((sum,c)=>sum+c.volume,0)}))}
      return pack(symbolInfo,timeframe==="h4"?{...cfg,interval:"4h"}:cfg,closed,Number(result.meta.regularMarketTime)*1000,Number(result.meta.regularMarketPrice??all.at(-1).close),'Yahoo Finance',result.meta.currency||'USD',errors,gapsSkipped,timeframe);
    }catch(error){errors.push(`${host}: ${error.message}`);causes.push(error)}
  }
  lastStatus={state:'UNAVAILABLE',observedAt:Date.now(),reason:errors.join('; ')};
  const throttled=causes.filter(error=>error.status===429);
  throw Object.assign(Error('Market data unavailable: '+errors.join('; ')),{status:throttled.length?429:502,code:throttled.length?'PROVIDER_RATE_LIMITED':'MARKET_UNAVAILABLE',retryAfter:throttled.length?Math.max(...throttled.map(error=>error.retryAfter)):15});
}
function pack(symbolInfo,cfg,candles,marketTime,quotePrice,provider,currency,errors,gapsSkipped=0,timeframe="intraday"){
  validateCandles(candles);
  if(!Number.isFinite(quotePrice)||quotePrice<=0)throw Error('Invalid provider quote');
  const history=candleStatus(candles,timeframe,symbolInfo.assetClass);
  const quoteFresh=classifyQuote(marketTime);
  const fresh=quoteFresh&&history.current;
  const pricingProxy=['Commodity','Index'].includes(symbolInfo.assetClass)||(provider==='Yahoo Finance'&&symbolInfo.display.endsWith('USDT'))||(provider==='Binance'&&symbolInfo.display.endsWith('USD'));
  const instrument=provider==='Binance'?symbolInfo.display.replace(/(?:USDT|USD)$/,'')+'USDT':symbolInfo.yahoo;
  const provenance={state:fresh?'REAL':'STALE',verified:history.current,fresh,quoteFresh,candlesCurrent:history.current,candleStatus:history.current?'CURRENT':history.closureCompatible?'SESSION_GAP':'STALE',lastClosedCandleAt:history.lastClosedAt,provider,instrument,instrumentMatch:!pricingProxy,pricingProxy,quoteAt:marketTime,observedAt:Date.now(),closedBarsOnly:true,executable:false,pricing:'Indicative provider data; paper execution only',fallbackErrors:errors,gapsSkipped};
  lastStatus={state:provenance.state,observedAt:Date.now(),provider};
  return {symbolInfo,candles,quotePrice,marketTime,source:pricingProxy?`${provider} (${instrument} indicative proxy for ${symbolInfo.display})`:provider,currency,exchangeName:provider,...cfg,provenance,warning:!history.current?'Candle history stale or session gap; opportunities and execution blocked':!quoteFresh?'Market quote stale or market closed; opportunities and execution blocked':pricingProxy?'Indicative underlying proxy, not an exact spot/CFD quote; actionable opportunities blocked':null};
}
export async function getMarketData(rawSymbol,timeframe='intraday'){
  if(!TIMEFRAME_CONFIG[timeframe])throw Object.assign(Error('Unsupported timeframe'),{status:400});
  if(typeof rawSymbol!=='string'||!/^[-A-Za-z0-9^=:.]{1,32}$/.test(rawSymbol))throw Object.assign(Error('Invalid instrument'),{status:400});
  const info=normalizeSymbol(rawSymbol),key=info.display+':'+timeframe;
  const hit=cache.get(key);if(hit&&Date.now()-hit.storedAt<5000){const data=hit.data;return pack(data.symbolInfo,{range:data.range,interval:data.interval,tvInterval:data.tvInterval,label:data.label},data.candles,data.marketTime,data.quotePrice,data.provenance.provider,data.currency,data.provenance.fallbackErrors,data.provenance.gapsSkipped,timeframe)}
  if(pending.has(key))return pending.get(key);
  const failure=failures.get(key);if(failure&&Date.now()<failure.until)throw Object.assign(Error(failure.message),{status:failure.status,code:failure.code,retryAfter:Math.max(1,Math.ceil((failure.until-Date.now())/1000))});
  failures.delete(key);
  const promise=limited(()=>load(info,timeframe)).then(data=>{if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(key,{data,storedAt:Date.now()});failures.delete(key);return data}).catch(error=>{if(failures.size>=256)failures.delete(failures.keys().next().value);const retryAfter=error.retryAfter||15;failures.set(key,{message:error.message,status:error.status||502,code:error.code||"MARKET_UNAVAILABLE",until:Date.now()+retryAfter*1000});throw error}).finally(()=>pending.delete(key));
  pending.set(key,promise);return promise;
}


export async function getPaperPricing(market,accountCurrency="USD"){
  assertPaperMarket(market);
  if(accountCurrency!=="USD")throw Object.assign(Error("Paper engine currently supports USD account settlement only"),{status:400});
  const priceCurrency=market.currency,conversionRates={};
  if(priceCurrency!=="USD"&&!market.symbolInfo.display.startsWith("USD")){
    if(!["GBP","EUR","JPY","CHF","CAD","AUD","NZD"].includes(priceCurrency))throw Object.assign(Error("Verified settlement conversion unavailable"),{status:502});
    const conversion=await getMarketData(priceCurrency+"USD","intraday");assertPaperMarket(conversion);conversionRates[priceCurrency+"USD"]=conversion.quotePrice;
  }
  return {priceCurrency,conversionRates};
}
