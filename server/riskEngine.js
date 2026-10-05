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

export function getContractSpec(rawSymbol = "EURUSD") {
  const sym = String(rawSymbol).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (ASSET_CONTRACT_SPECS[sym]) return ASSET_CONTRACT_SPECS[sym];
  if (sym.includes("JPY")) return ASSET_CONTRACT_SPECS.JPY_PAIR;
  if (sym.includes("BTC") || sym.includes("ETH") || sym.includes("SOL")) return ASSET_CONTRACT_SPECS.BTCUSD;
  return ASSET_CONTRACT_SPECS.DEFAULT_FOREX;
}

export function calculateRequiredMargin({ symbol, lots, price, leverage = 200 }) {
  const spec = getContractSpec(symbol);
  const safeLev = Math.max(1, Math.min(2000, Number(leverage) || 200));
  const notionalValue = Number(lots) * spec.contractSize * Number(price);
  const margin = notionalValue / safeLev;
  return Number(margin.toFixed(2));
}

export function calculateOrderRisk({ symbol, side, lots, currentPrice, entryPrice, stopLoss, takeProfit, leverage = 200 }) {
  const spec = getContractSpec(symbol);
  const isBuy = String(side).toUpperCase().includes("BUY");
  const pLots = Number(lots) || 0.01;
  const pPrice = Number(currentPrice ?? entryPrice) || 0;
  const pSl = Number(stopLoss) || 0;
  const pTp = Number(takeProfit) || 0;

  const requiredMargin = calculateRequiredMargin({ symbol, lots: pLots, price: pPrice, leverage });

  let slDistance = 0;
  let slDollars = 0;
  if (pSl > 0) {
    slDistance = Math.abs(pPrice - pSl);
    slDollars = slDistance * spec.contractSize * pLots;
  }

  let tpDistance = 0;
  let tpDollars = 0;
  if (pTp > 0) {
    tpDistance = Math.abs(pTp - pPrice);
    tpDollars = tpDistance * spec.contractSize * pLots;
  }

  const rrRatio = slDistance > 0 && tpDistance > 0 ? Number((tpDistance / slDistance).toFixed(2)) : null;

  return {
    contractSize: spec.contractSize,
    notionalValue: +(pLots * spec.contractSize * pPrice).toFixed(2),
    requiredMargin,
    slDistance: +slDistance.toFixed(spec.digits),
    slDollars: +slDollars.toFixed(2),
    tpDistance: +tpDistance.toFixed(spec.digits),
    tpDollars: +tpDollars.toFixed(2),
    rrRatio
  };
}

/**
 * Validates order before submission to any adapter
 */
export function validateOrderRisk({ account, order, currentPrice }) {
  if (!account) {
    return { approved: false, code: "ACCOUNT_REQUIRED", reason: "Active trading account is required." };
  }

  if (account.permissionLevel === "READ_ONLY") {
    return {
      approved: false,
      code: "PERMISSION_DENIED",
      reason: "Account is in READ-ONLY mode. Live order submission is blocked."
    };
  }

  const symbol = String(order.symbol || "").toUpperCase();
  const spec = getContractSpec(symbol);
  const lots = Number(order.lots || order.volume || 0);

  // Volume validation
  if (!Number.isFinite(lots) || lots < spec.minLot) {
    return {
      approved: false,
      code: "INVALID_VOLUME",
      reason: `Order volume ${lots} is below minimum allowed lot size (${spec.minLot}) for ${symbol}.`
    };
  }

  if (lots > spec.maxLot) {
    return {
      approved: false,
      code: "MAX_VOLUME_EXCEEDED",
      reason: `Order volume ${lots} exceeds maximum single order cap (${spec.maxLot}) for ${symbol}.`
    };
  }

  // Margin validation
  const leverage = account.leverage || 200;
  const requiredMargin = calculateRequiredMargin({ symbol, lots, price: currentPrice, leverage });
  const availableMargin = account.freeMargin ?? account.balance ?? 0;

  if (requiredMargin > availableMargin) {
    return {
      approved: false,
      code: "INSUFFICIENT_MARGIN",
      reason: `Insufficient free margin: Required $${requiredMargin.toLocaleString()} exceeds available $${availableMargin.toLocaleString()}.`
    };
  }

  // Directional Price & SL/TP validation
  const isBuy = String(order.side).toUpperCase().includes("BUY");
  const sl = Number(order.stopLoss || 0);
  const tp = Number(order.takeProfit || 0);

  if (sl > 0) {
    if (isBuy && sl >= currentPrice) {
      return {
        approved: false,
        code: "INVALID_STOP_LOSS",
        reason: `For BUY orders, Stop Loss (${sl}) must be strictly below current market price (${currentPrice}).`
      };
    }
    if (!isBuy && sl <= currentPrice) {
      return {
        approved: false,
        code: "INVALID_STOP_LOSS",
        reason: `For SELL orders, Stop Loss (${sl}) must be strictly above current market price (${currentPrice}).`
      };
    }
  }

  if (tp > 0) {
    if (isBuy && tp <= currentPrice) {
      return {
        approved: false,
        code: "INVALID_TAKE_PROFIT",
        reason: `For BUY orders, Take Profit (${tp}) must be strictly above current market price (${currentPrice}).`
      };
    }
    if (!isBuy && tp >= currentPrice) {
      return {
        approved: false,
        code: "INVALID_TAKE_PROFIT",
        reason: `For SELL orders, Take Profit (${tp}) must be strictly below current market price (${currentPrice}).`
      };
    }
  }

  // Single-trade max risk percentage rule (max 5%)
  const riskMetrics = calculateOrderRisk({ symbol, side: order.side, lots, currentPrice, stopLoss: sl, takeProfit: tp });
  if (sl > 0 && account.balance > 0) {
    const riskPct = (riskMetrics.slDollars / account.balance) * 100;
    if (riskPct > 5.0) {
      return {
        approved: false,
        code: "RISK_LIMIT_EXCEEDED",
        reason: `Single-trade risk (${riskPct.toFixed(1)}% / $${riskMetrics.slDollars}) exceeds maximum institutional risk ceiling (5.0%). Reduce lot size.`
      };
    }
  }

  // Max open positions rule
  const openCount = (account.positions || []).length;
  if (openCount >= 15) {
    return {
      approved: false,
      code: "MAX_POSITIONS_REACHED",
      reason: `Maximum concurrent open positions limit (15) reached for this account. Close open trades first.`
    };
  }

  return {
    approved: true,
    requiredMargin,
    riskMetrics
  };
}
