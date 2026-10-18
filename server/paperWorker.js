import crypto from 'node:crypto';
import {allAccountRecords,saveTradingAccounts} from './accountStore.js';
import {withTransaction,recordFill} from './storage.js';
import {getMarketData,getPaperPricing} from './marketData.js';
import {getBrokerAdapter} from './brokerAdapters.js';
import {calculatePnl,calculateOrderRisk,calculateRequiredMargin,getContractSpec,validateOrderRisk} from './riskEngine.js';
import {logAuditEvent} from './auditLogger.js';
export async function processPaperAccounts(){
  return withTransaction(async()=>{
    const accounts=allAccountRecords();
    for(const account of accounts){
      if(account.broker!=='paper'||account.tradingMode!=='PAPER'||account.permissionLevel!=='TRADING_ENABLED')continue;
      const today=new Date().toISOString().slice(0,10);
      if(account.riskDay!==today){account.riskDay=today;account.dayStartBalance=account.balance;account.dailyRealizedPnl=0}
      const adapter=getBrokerAdapter('paper');
      const blocked=[];
      const canOpen=!(await inspectPaperRecovery(account)).openingBlocked;
      account.orders=(account.orders||[]).filter(order=>order.expiresAt>Date.now());
      const symbols=[...new Set([...account.positions.map(p=>p.symbol),...account.orders.map(o=>o.symbol)])];
      for(const symbol of symbols){
        let market,pricing;
        try{market=await getMarketData(symbol,'intraday');pricing=await getPaperPricing(market,account.currency)}catch(error){blocked.push(symbol);for(const position of account.positions.filter(p=>p.symbol===symbol))position.pricingStatus='UNAVAILABLE';continue}
        const spec=getContractSpec(symbol);
          for(const pos of [...account.positions].filter(p=>p.symbol===symbol)){
            const price=Number((market.quotePrice+(pos.side==='BUY'?-1:1)*spec.pipSize*0.4).toFixed(spec.digits));
            pos.pricingStatus='CURRENT';pos.currentPrice=price;pos.floatingPnl=calculatePnl({symbol,side:pos.side,lots:pos.lots,entryPrice:pos.entryPrice,exitPrice:price,accountCurrency:account.currency,...pricing});
            pos.pnlR=pos.riskDollars>0?pos.floatingPnl/pos.riskDollars:null;
            const hit=pos.side==='BUY'?(price<=pos.sl||(pos.tp>0&&price>=pos.tp)):(price>=pos.sl||(pos.tp>0&&price<=pos.tp));
            if(hit){const fill=await adapter.closePosition(account,pos.ticket,1,market.quotePrice,pricing);account.positions=account.positions.filter(p=>p.ticket!==pos.ticket);account.balance=Number((account.balance+fill.realizedPnl).toFixed(2));account.dailyRealizedPnl+=fill.realizedPnl;recordFill({id:crypto.randomUUID(),accountId:account.id,symbol,side:pos.side,entryPrice:pos.entryPrice,stopLoss:pos.sl,riskDollars:pos.riskDollars,epoch:account.accountEpoch||"legacy",...fill,closedAt:new Date().toISOString(),reason:'SERVER_PROTECTION'},account.id);logAuditEvent({eventType:'SERVER_PROTECTION_CLOSE',accountId:account.id,symbol,details:{ticket:pos.ticket}})}
          }
          account.equity=Number((account.balance+account.positions.reduce((sum,p)=>sum+Number(p.floatingPnl||0),0)).toFixed(2));
          account.usedMargin=Number(account.positions.reduce((sum,p)=>sum+p.margin,0).toFixed(2));account.freeMargin=Math.max(0,Number((account.equity-account.usedMargin).toFixed(2)));
          if(!canOpen)continue;
          for(const order of [...account.orders].filter(o=>o.symbol===symbol)){
            const buy=order.side.startsWith('BUY'),crossed=buy?market.quotePrice+spec.pipSize*0.4<=order.entryPrice:market.quotePrice-spec.pipSize*0.4>=order.entryPrice;
            if(!crossed)continue;
            const payload={...order,side:buy?'BUY':'SELL'};
            const others=account.orders.filter(o=>o.id!==order.id);
            const risk=validateOrderRisk({account:{...account,orders:others},order:payload,currentPrice:market.quotePrice,...pricing});
            if(!risk.approved){account.orders=others;logAuditEvent({eventType:'PENDING_REJECTED',accountId:account.id,symbol,details:{code:risk.code}});continue}
            account.orders=others;account.freeMargin+=order.reservedMargin||0;
            const fill=await adapter.placeOrder(account,payload,market.quotePrice,pricing);account.positions.push(fill.position);account.orders=others;account.todayTradesCount++;logAuditEvent({eventType:'PENDING_FILLED',accountId:account.id,symbol,details:{ticket:fill.ticket}});
          }
          account.pricingStatus='VERIFIED_PAPER';account.lastSyncAt=new Date().toISOString();
      }
      account.equity=Number((account.balance+account.positions.reduce((sum,p)=>sum+Number(p.floatingPnl||0),0)).toFixed(2));
      account.usedMargin=Number(account.positions.reduce((sum,p)=>sum+p.margin,0).toFixed(2));
      account.pricingStatus=blocked.length?'DEGRADED':'VERIFIED_PAPER';account.pricingBlockedSymbols=blocked;
      const reserve=account.orders.reduce((sum,o)=>sum+(o.reservedMargin||0),0);
      account.freeMargin=Math.max(0,Number((account.equity-account.usedMargin-reserve).toFixed(2)));
      account.marginLevel=account.usedMargin>0?account.equity/account.usedMargin*100:999;
    }
    saveTradingAccounts();
  });
}
export function startPaperWorker({intervalMs=5000,processAccounts=processPaperAccounts}={}){
  let stopped=false,inFlight=null;
  const timer=setInterval(()=>{
    if(stopped||inFlight)return;
    inFlight=Promise.resolve().then(processAccounts).catch(error=>console.error('Paper worker failed:',error.message)).finally(()=>{inFlight=null});
  },intervalMs);
  timer.unref();
  return {async stop(){stopped=true;clearInterval(timer);await inFlight}};
}

export async function inspectPaperRecovery(account){
  const positions=[];
  for(const position of account.positions||[]){
    try{const market=await getMarketData(position.symbol,"intraday");await getPaperPricing(market,account.currency);
      positions.push({ticket:position.ticket,symbol:position.symbol,canReduce:account.permissionLevel==="TRADING_ENABLED",code:account.permissionLevel==="TRADING_ENABLED"?"EXACT_PRICE_AVAILABLE":"PERMISSION_DENIED"});
    }catch(error){positions.push({ticket:position.ticket,symbol:position.symbol,canReduce:false,code:error.code||"MARKET_UNAVAILABLE"})}
  }
  return {positions,openingBlocked:account.permissionLevel!=="TRADING_ENABLED"||account.status!=="CONNECTED"||positions.some(p=>!p.canReduce),pendingOrdersCancelable:true,policy:"Reduction only with fresh exact-instrument data. No supplied, stale or proxy fill price is accepted.",recovery:"Cancel pending orders without a fill; retry closes when exact fresh data is available. Preserve database and matching keys. Never reset or fabricate a close to clear a legacy position."};
}
export async function refreshPaperRisk(account){
  const updates=[];
  for(const pos of account.positions||[]){
    let market,pricing;
    try{market=await getMarketData(pos.symbol,"intraday");pricing=await getPaperPricing(market,account.currency)}
    catch(error){throw Object.assign(Error("New exposure blocked: an existing position cannot be valued with fresh exact-instrument data. Use account recovery; priced positions can still be reduced independently."),{status:409,code:"EXPOSURE_VALUATION_UNAVAILABLE",causeCode:error.code||"MARKET_UNAVAILABLE"})}
    const spec=getContractSpec(pos.symbol),price=Number((market.quotePrice+(pos.side==="BUY"?-1:1)*spec.pipSize*0.4).toFixed(spec.digits));
    updates.push([pos,{riskDollars:calculateOrderRisk({symbol:pos.symbol,side:pos.side,lots:pos.lots,currentPrice:pos.entryPrice,stopLoss:pos.sl,takeProfit:pos.tp||0,leverage:account.leverage,accountCurrency:account.currency,...pricing}).slRiskUpperBound,
      margin:calculateRequiredMargin({symbol:pos.symbol,lots:pos.lots,price:pos.entryPrice,leverage:account.leverage,accountCurrency:account.currency,...pricing}),currentPrice:price,
      floatingPnl:calculatePnl({symbol:pos.symbol,side:pos.side,lots:pos.lots,entryPrice:pos.entryPrice,exitPrice:price,accountCurrency:account.currency,...pricing})}]);
  }
  for(const [pos,update] of updates)Object.assign(pos,update);
  const day=new Date().toISOString().slice(0,10);if(account.riskDay!==day){account.riskDay=day;account.dayStartBalance=account.balance;account.dailyRealizedPnl=0}
  account.equity=Number((account.balance+(account.positions||[]).reduce((sum,p)=>sum+Number(p.floatingPnl||0),0)).toFixed(2));
  account.usedMargin=(account.positions||[]).reduce((sum,p)=>sum+p.margin,0);
  account.freeMargin=Math.max(0,account.equity-account.usedMargin-(account.orders||[]).reduce((sum,o)=>sum+Number(o.reservedMargin||0),0));
}
