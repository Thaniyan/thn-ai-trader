/**
 * Authoritative Server-Side Risk Engine
 */

export const ASSET_CONTRACT_SPECS = {
  // Commodities / Metals
  XAUUSD: { contractSize: 100, pipSize: 0.1, minLot: 0.01, maxLot: 50.0, lotStep: 0.01, digits: 2, assetClass: "Commodity" },
  XAGUSD: { contractSize: 5000, pipSize: 0.005, minLot: 0.01, maxLot: 20.0, lotStep: 0.01, digits: 3, assetClass: "Commodity" },
  USOIL: { contractSize: 1000, pipSize: 0.01, minLot: 0.01, maxLot: 20.0, lotStep: 0.01, digits: 2, assetClass: "Commodity" },
  BRENT: { contractSize: 1000, pipSize: 0.01, minLot: 0.01, maxLot: 20.0, lotStep: 0.01, digits: 2, assetClass: "Commodity" },

  // Crypto
  BTCUSD: { contractSize: 1, pipSize: 1.0, minLot: 0.01, maxLot: 10.0, lotStep: 0.01, digits: 2, assetClass: "Crypto" },
  BTCUSDT: { contractSize: 1, pipSize: 1.0, minLot: 0.01, maxLot: 10.0, lotStep: 0.01, digits: 2, assetClass: "Crypto" },
  ETHUSD: { contractSize: 1, pipSize: 0.1, minLot: 0.05, maxLot: 50.0, lotStep: 0.01, digits: 2, assetClass: "Crypto" },
  ETHUSDT: { contractSize: 1, pipSize: 0.1, minLot: 0.05, maxLot: 50.0, lotStep: 0.01, digits: 2, assetClass: "Crypto" },

  // Major Indices
  SPX: { contractSize: 1, pipSize: 0.1, minLot: 0.1, maxLot: 50.0, lotStep: 0.1, digits: 2, assetClass: "Index" },
  NAS100: { contractSize: 1, pipSize: 0.1, minLot: 0.1, maxLot: 50.0, lotStep: 0.1, digits: 2, assetClass: "Index" },
  US30: { contractSize: 1, pipSize: 1.0, minLot: 0.1, maxLot: 50.0, lotStep: 0.1, digits: 1, assetClass: "Index" },

  // Default Forex standard specs
  DEFAULT_FOREX: { contractSize: 100000, pipSize: 0.0001, minLot: 0.01, maxLot: 100.0, lotStep: 0.01, digits: 5, assetClass: "Forex" },
  JPY_PAIR: { contractSize: 100000, pipSize: 0.01, minLot: 0.01, maxLot: 100.0, lotStep: 0.01, digits: 3, assetClass: "Forex" }
};

const currencies=new Set(['USD','EUR','GBP','JPY','CHF','CAD','AUD','NZD']);
const invalid=message=>Object.assign(Error(message),{status:400,code:'INVALID_RISK_INPUT'});
const money=value=>Number(value.toFixed(2));
// Budget reservations round upward; binary noise below 1e-8 cent is ignored.
const budgetMoney=value=>value>0?Math.max(1,Math.ceil(value*100-1e-8))/100:0;
export function getContractSpec(rawSymbol='EURUSD'){
  const symbol=String(rawSymbol).toUpperCase();
  if(ASSET_CONTRACT_SPECS[symbol]&&!['DEFAULT_FOREX','JPY_PAIR'].includes(symbol))return {...ASSET_CONTRACT_SPECS[symbol],quoteCurrency:symbol.endsWith('USDT')?'USDT':'USD'};
  if(/^[A-Z]{6}$/.test(symbol)&&currencies.has(symbol.slice(0,3))&&currencies.has(symbol.slice(3))&&symbol.slice(0,3)!==symbol.slice(3))return {...ASSET_CONTRACT_SPECS[symbol.endsWith('JPY')?'JPY_PAIR':'DEFAULT_FOREX'],baseCurrency:symbol.slice(0,3),quoteCurrency:symbol.slice(3)};
  throw invalid('Unsupported execution instrument');
}
export function conversionFactor(symbol,price,accountCurrency='USD',conversionRates={},priceCurrency){
  const spec=getContractSpec(symbol),quote=priceCurrency||spec.quoteCurrency;
  if(quote===accountCurrency)return 1;
  if(spec.baseCurrency===accountCurrency&&quote===spec.quoteCurrency)return 1/price;
  const rate=conversionRates[quote+accountCurrency];
  if(Number.isFinite(rate)&&rate>0)return rate;
  throw invalid('Verified currency conversion required for '+quote+'/'+accountCurrency);
}
export function calculateRequiredMargin({symbol,lots,price,leverage=200,accountCurrency='USD',conversionRates={},priceCurrency}){
  if(!Number.isFinite(lots)||lots<=0||!Number.isFinite(price)||price<=0||!Number.isFinite(leverage)||leverage<1||leverage>200)throw invalid('Finite positive price, lots and leverage (1–200) required');
  return budgetMoney(lots*getContractSpec(symbol).contractSize*price*conversionFactor(symbol,price,accountCurrency,conversionRates,priceCurrency)/leverage);
}
export function calculateOrderRisk({symbol,side='BUY',lots,currentPrice,entryPrice,stopLoss,takeProfit=0,leverage=200,accountCurrency='USD',conversionRates={},priceCurrency}){
  const price=currentPrice??entryPrice;
  if(!Number.isFinite(price)||price<=0||!Number.isFinite(lots)||lots<=0||!Number.isFinite(stopLoss)||stopLoss<=0||!Number.isFinite(takeProfit)||takeProfit<0)throw invalid('Valid price, lots, protective stop and target required');
  const spec=getContractSpec(symbol);
  const slDistance=Math.abs(price-stopLoss),tpDistance=takeProfit>0?Math.abs(takeProfit-price):0;
  const rawStopRisk=slDistance*spec.contractSize*lots*conversionFactor(symbol,stopLoss,accountCurrency,conversionRates,priceCurrency);
  const slDollars=money(rawStopRisk),slRiskUpperBound=budgetMoney(rawStopRisk);
  const tpDollars=takeProfit>0?money(tpDistance*spec.contractSize*lots*conversionFactor(symbol,takeProfit,accountCurrency,conversionRates,priceCurrency)):0;
  return {contractSize:spec.contractSize,notionalValue:money(lots*spec.contractSize*price*conversionFactor(symbol,price,accountCurrency,conversionRates,priceCurrency)),requiredMargin:calculateRequiredMargin({symbol,lots,price,leverage,accountCurrency,conversionRates,priceCurrency}),slDistance,slDollars,slRiskUpperBound,tpDistance,tpDollars,rrRatio:slDollars>0&&tpDollars>0?Number((tpDollars/slDollars).toFixed(2)):null,currency:accountCurrency,model:'Paper contract specifications; broker verification required'};
}
export function calculatePnl({symbol,side,lots,entryPrice,exitPrice,accountCurrency='USD',conversionRates={},priceCurrency}){
  if(![lots,entryPrice,exitPrice].every(v=>Number.isFinite(v)&&v>0))throw invalid('Invalid settlement values');
  return money((side==='BUY'?exitPrice-entryPrice:entryPrice-exitPrice)*getContractSpec(symbol).contractSize*lots*conversionFactor(symbol,exitPrice,accountCurrency,conversionRates,priceCurrency));
}
export function validateOrderRisk({account,order,currentPrice,conversionRates={},priceCurrency}){
  const reject=(code,reason)=>({approved:false,code,reason});
  if(!account||account.status!=='CONNECTED'||account.permissionLevel!=='TRADING_ENABLED'||account.broker!=='paper'||account.tradingMode!=='PAPER')return reject('PERMISSION_DENIED','Verified paper account with trading permission required');
  try{
    if(!['BUY','SELL','BUY LIMIT','SELL LIMIT'].includes(order.side))return reject('INVALID_SIDE','Unsupported order side');
    const spec=getContractSpec(order.symbol),lots=order.lots;
    if(!Number.isFinite(lots)||lots<spec.minLot||lots>spec.maxLot||Math.abs(lots/spec.lotStep-Math.round(lots/spec.lotStep))>1e-7)return reject('INVALID_VOLUME','Volume must satisfy instrument min, max and lot step');
    if(!Number.isFinite(currentPrice)||currentPrice<=0)return reject('INVALID_QUOTE','Finite positive provider price required');
    const price=order.side.includes('LIMIT')?order.entryPrice:currentPrice;
    if(!Number.isFinite(price)||price<=0)return reject('INVALID_ENTRY','Positive limit entry required');
    const buy=order.side.startsWith('BUY'),sl=order.stopLoss,tp=order.takeProfit??0;
    if(!Number.isFinite(sl)||sl<=0|| (buy?sl>=price:sl<=price))return reject('INVALID_STOP_LOSS','Protective stop must be on the correct side of entry');
    if(!Number.isFinite(tp)||tp<0||(tp>0&&(buy?tp<=price:tp>=price)))return reject('INVALID_TAKE_PROFIT','Target must be on the correct side of entry');
    if(order.side.includes('LIMIT')&&(buy?price>=currentPrice:price<=currentPrice))return reject('INVALID_ENTRY','Limit entry must be below market for buys and above for sells');
    const tick=10**(-spec.digits);
    if([sl,...(tp>0?[tp]:[]),...(order.side.includes('LIMIT')?[price]:[])].some(value=>Math.abs(value/tick-Math.round(value/tick))>1e-6))return reject('INVALID_PRICE_PRECISION','Levels must match instrument price precision');
    if(Math.abs(price-sl)<tick*2-1e-10)return reject('INVALID_STOP_DISTANCE','Stop must be at least two paper price ticks from entry');
    const riskMetrics=calculateOrderRisk({...order,currentPrice:price,accountCurrency:account.currency,leverage:account.leverage,conversionRates,priceCurrency});
    if(!Number.isFinite(account.balance)||account.balance<=0||!Number.isFinite(account.freeMargin)||riskMetrics.requiredMargin>account.freeMargin)return reject('INSUFFICIENT_MARGIN','Insufficient verified free margin');
    if(riskMetrics.slRiskUpperBound>account.balance*0.02)return reject('RISK_LIMIT_EXCEEDED','Single trade risk exceeds 2%');
    const openRisk=(account.positions||[]).reduce((sum,p)=>sum+Number(p.riskDollars||0),0)+(account.orders||[]).reduce((sum,p)=>sum+Number(p.riskDollars||0),0);
    if(openRisk+riskMetrics.slRiskUpperBound>account.balance*0.06)return reject('AGGREGATE_RISK_EXCEEDED','Aggregate stop risk exceeds 6%');
    if(Number(account.dailyRealizedPnl||0)<=-Number(account.dayStartBalance||account.balance)*0.05)return reject('DAILY_LOSS_LIMIT','Daily loss limit reached');
    if((account.positions||[]).length+(account.orders||[]).length>=15)return reject('MAX_POSITIONS_REACHED','Maximum positions and pending orders reached');
    return {approved:true,requiredMargin:riskMetrics.requiredMargin,riskMetrics};
  }catch(error){return reject(error.code||'INVALID_RISK_INPUT',error.message)}
}
