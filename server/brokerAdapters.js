import crypto from "node:crypto";
import { getContractSpec, calculateRequiredMargin, calculateOrderRisk, calculatePnl, validateOrderRisk } from "./riskEngine.js";

/**
 * Base Abstract Broker Adapter
 */
export class BaseBrokerAdapter {
  constructor(brokerId, name) {
    this.brokerId = brokerId;
    this.name = name;
  }

  async testConnection(credentials) {
    throw new Error("testConnection() not implemented");
  }

  async fetchAccount(accountRecord) {
    throw new Error("fetchAccount() not implemented");
  }

  async fetchPositions(accountRecord) {
    return [];
  }

  async fetchOrders(accountRecord) {
    return [];
  }

  async placeOrder(accountRecord, orderPayload, currentPrice) {
    throw new Error("placeOrder() not implemented");
  }

  async closePosition(accountRecord, positionId, volume, currentPrice) {
    throw new Error("closePosition() not implemented");
  }

  async getConnectionStatus(accountRecord) {
    return { status: "DISCONNECTED", latencyMs: null, message: "Adapter inactive" };
  }
}

/**
 * Paper Trading / Sandbox Adapter
 * Fully functional execution engine simulating live broker execution against live market quotes.
 */
export class PaperTradingAdapter extends BaseBrokerAdapter {
  constructor() {
    super("paper", "THN Paper Trading Sandbox");
  }

  async testConnection() {
    return {
      ok: true,
      status: "CONNECTED",
      latencyMs: 2,
      serverTime: new Date().toISOString(),
      provider: "THN Local Sandbox Engine",
      message: "Paper Trading sandbox engine is operational."
    };
  }

  async fetchAccount(account) {
    const acc = { ...account };
    acc.status = "CONNECTED";
    acc.lastSyncAt = new Date().toISOString();
    return acc;
  }

  async placeOrder(account, order, currentPrice, pricing={}) {
    if(order.side.includes("LIMIT")){return {ok:true,ticket:`PL-${crypto.randomUUID()}`,status:"PENDING",pendingOrder:{...order,id:crypto.randomUUID(),createdAt:new Date().toISOString(),expiresAt:Date.now()+86400000},message:"Paper limit order pending; no fill yet"}}
    const symbol = String(order.symbol).toUpperCase();
    const lots = Number(order.lots || order.volume || 0.01);
    const side = String(order.side).toUpperCase();
    const isBuy = side.includes("BUY");
    const spec = getContractSpec(symbol);

    // Apply 0.5 pip spread / slippage simulation
    const spreadOffset = (spec.pipSize || 0.0001) * 0.4;
    const executedPrice = isBuy ? +(currentPrice + spreadOffset).toFixed(spec.digits) : +(currentPrice - spreadOffset).toFixed(spec.digits);

    const requiredMargin = calculateRequiredMargin({
      symbol,
      lots,
      price: executedPrice,
      leverage: account.leverage || 200, accountCurrency:account.currency, ...pricing
    });

    const validation=validateOrderRisk({account,order,currentPrice:executedPrice,...pricing});
    if(!validation.approved)throw Object.assign(Error(validation.reason),{status:400,code:validation.code});
    const ticketId = `PT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const newPosition = {
      ticket: ticketId,
      id: ticketId,
      symbol,
      side,
      lots,
      entryPrice: executedPrice,
      currentPrice: executedPrice,
      sl: Number(order.stopLoss || 0),
      tp: Number(order.takeProfit || 0),
      margin: requiredMargin,
      riskDollars: validation.riskMetrics.slRiskUpperBound,
      priceCurrency:pricing.priceCurrency,
      floatingPnl: 0,
      pnlR: 0,
      multiplier: spec.contractSize,
      openedAt: new Date().toISOString(),
      comment: order.comment || "AI Assisted Paper Execution"
    };

    return {
      ok: true,
      ticket: ticketId,
      status: "FILLED",
      symbol,
      side,
      lots,
      executedPrice,
      slippagePips: 0.4,
      requiredMargin,
      position: newPosition,
      timestamp: new Date().toISOString(),
      message: `Paper order executed: ${side} ${lots} ${symbol} @ ${executedPrice}`
    };
  }

  async closePosition(account, positionId, volumeRatio = 1.0, currentPrice, pricing={}) {
    const posIndex = (account.positions || []).findIndex(p => p.ticket === positionId || p.id === positionId);
    if (posIndex === -1) {
      throw new Error(`Position #${positionId} not found in active account.`);
    }

    const pos = account.positions[posIndex];
    const spec = getContractSpec(pos.symbol);
    if(!Number.isFinite(volumeRatio)||volumeRatio<=0||volumeRatio>1)throw Object.assign(Error("Close ratio must be >0 and <=1"),{status:400});
    const originalLots=pos.lots;
    const closingLots=Number((Math.floor((originalLots*volumeRatio+1e-10)/spec.lotStep)*spec.lotStep).toFixed(8));
    if(closingLots<spec.minLot)throw Object.assign(Error("Partial close below minimum lot; close the whole position"),{status:400});
    const remainingLots=Number((originalLots-closingLots).toFixed(8));
    if(remainingLots>0&&remainingLots<spec.minLot)throw Object.assign(Error("Remaining position below minimum lot"),{status:400});
    const exitPrice=Number((currentPrice+(pos.side==="BUY"?-1:1)*spec.pipSize*0.4).toFixed(spec.digits));
    const realizedPnl=calculatePnl({symbol:pos.symbol,side:pos.side,lots:closingLots,entryPrice:pos.entryPrice,exitPrice,accountCurrency:account.currency,...pricing});
    const isPartial=remainingLots>0;
    const remainingPosition=isPartial?{...pos,lots:remainingLots,margin:Number((pos.margin*remainingLots/originalLots).toFixed(2)),riskDollars:Number((pos.riskDollars*remainingLots/originalLots).toFixed(2))}:null;

    return {
      ok: true,
      ticket: positionId,
      closedLots: closingLots,
      exitPrice,
      realizedPnl,
      isPartial,
      remainingPosition,
      timestamp: new Date().toISOString()
    };
  }

  async getConnectionStatus() {
    return {
      status: "CONNECTED",
      latencyMs: 1,
      tradingPermission: "TRADING_ENABLED",
      lastSyncAt: new Date().toISOString(),
      message: "Internal Paper Engine Running"
    };
  }
}

// Deliberately fail closed: these gateways have not passed broker contract tests.
class DisabledExternalAdapter extends BaseBrokerAdapter {
  async testConnection() { return {ok:false,status:"DISABLED_UNVERIFIED",latencyMs:null,message:"Live broker integration awaits verified authentication and sandbox contract tests"}; }
  async fetchAccount() { throw new Error("Unverified broker snapshot unavailable"); }
  async fetchPositions() { throw new Error("Unverified broker positions unavailable"); }
  async placeOrder() { throw new Error("Live execution disabled"); }
  async closePosition() { throw new Error("Live execution disabled"); }
  async getConnectionStatus() { return this.testConnection(); }
}
export class ExnessMt5BridgeAdapter extends DisabledExternalAdapter { constructor(){super("exness","Exness MT5")} }
export class XtbXStationAdapter extends DisabledExternalAdapter { constructor(){super("xtb","XTB")} }
export class Mt5UniversalAdapter extends DisabledExternalAdapter { constructor(){super("mt5","MT5")} }

/**
 * Broker Adapter Registry
 */
export const brokerAdapters = {
  paper: new PaperTradingAdapter(),
  exness: new ExnessMt5BridgeAdapter(),
  xtb: new XtbXStationAdapter(),
  mt5: new Mt5UniversalAdapter()
};

export function getBrokerAdapter(brokerId = "paper") {
  const key = String(brokerId).toLowerCase();
  if (!brokerAdapters[key]) throw Object.assign(new Error("Unknown broker"),{status:400});
  return brokerAdapters[key];
}
