import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encryptSecret, maskAccountNumber } from "./encryption.js";
import { logAuditEvent } from "./auditLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ACCOUNTS_FILE = path.join(__dirname, "..", "trading_accounts.json");

let tradingAccounts = [];
const idempotencyKeys = new Map();

/**
 * Default Paper Trading Sandbox Account
 */
const DEFAULT_PAPER_ACCOUNT = {
  id: "acc_paper_sandbox_01",
  broker: "paper",
  brokerName: "THN Paper Trading Sandbox",
  platform: "THN Sandbox Engine",
  accountAlias: "Paper Trading Portfolio",
  accountNumber: "SBX-885012",
  accountNumberMasked: "•••• 5012",
  accountType: "paper",
  accountTypeName: "Paper Sandbox (Simulated)",
  currency: "USD",
  balance: 50000.0,
  equity: 50000.0,
  freeMargin: 50000.0,
  usedMargin: 0.0,
  marginLevel: 999.0,
  leverage: 200,
  tradingMode: "PAPER",
  permissionLevel: "TRADING_ENABLED",
  status: "CONNECTED",
  latencyMs: 1,
  dailyRealizedPnl: 0,
  todayTradesCount: 0,
  positions: [],
  orders: [],
  encryptedCredentials: null,
  lastSyncAt: new Date().toISOString(),
  createdAt: "2026-01-01T00:00:00.000Z"
};

export function loadTradingAccounts() {
  if (fs.existsSync(ACCOUNTS_FILE)) {
    try {
      const raw = fs.readFileSync(ACCOUNTS_FILE, "utf8");
      tradingAccounts = JSON.parse(raw);
      if (!Array.isArray(tradingAccounts)) tradingAccounts = [];
    } catch {
      tradingAccounts = [];
    }
  }

  // Ensure default paper trading account is always present
  if (!tradingAccounts.some(a => a.id === DEFAULT_PAPER_ACCOUNT.id)) {
    tradingAccounts.unshift(DEFAULT_PAPER_ACCOUNT);
    saveTradingAccounts();
  }

  return tradingAccounts;
}

export function saveTradingAccounts() {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(tradingAccounts, null, 2));
  } catch (err) {
    console.error("Failed to persist trading accounts:", err.message);
  }
}

/**
 * Returns sanitized DTO for frontend with zero plaintext secrets
 */
export function sanitizeAccountForClient(account) {
  if (!account) return null;
  return {
    id: account.id,
    broker: account.broker,
    brokerName: account.brokerName,
    platform: account.platform,
    accountAlias: account.accountAlias || account.brokerName,
    accountNumber: account.accountNumber,
    accountNumberMasked: account.accountNumberMasked || maskAccountNumber(account.accountNumber),
    accountType: account.accountType,
    accountTypeName: account.accountTypeName,
    currency: account.currency || "USD",
    balance: Number(account.balance || 0),
    equity: Number(account.equity || account.balance || 0),
    freeMargin: Number(account.freeMargin || account.balance || 0),
    usedMargin: Number(account.usedMargin || 0),
    marginLevel: Number(account.marginLevel || 999),
    leverage: Number(account.leverage || 200),
    tradingMode: account.tradingMode || (account.broker === "paper" ? "PAPER" : "LIVE"),
    permissionLevel: account.permissionLevel || "TRADING_ENABLED",
    status: account.status || "CONNECTED",
    latencyMs: account.latencyMs ?? (account.broker === "paper" ? 1 : null),
    dailyRealizedPnl: Number(account.dailyRealizedPnl || 0),
    todayTradesCount: Number(account.todayTradesCount || 0),
    positions: (account.positions || []).map(p => ({ ...p })),
    orders: (account.orders || []).map(o => ({ ...o })),
    lastSyncAt: account.lastSyncAt,
    createdAt: account.createdAt
  };
}

export function getAllSanitizedAccounts() {
  loadTradingAccounts();
  return tradingAccounts.map(sanitizeAccountForClient);
}

export function getAccountById(id) {
  loadTradingAccounts();
  return tradingAccounts.find(a => a.id === id || a.accountNumber === id);
}

/**
 * Add or link an external broker account safely
 */
export function addTradingAccount({ broker, server, accountNumber, apiToken, permissionLevel = "READ_ONLY", currency = "USD", leverage = 200, balance = 0, tradingMode = "LIVE" }) {
  loadTradingAccounts();

  const brokerNames = {
    exness: "Exness (MT5 Bridge)",
    xtb: "XTB MENA (xStation 5)",
    mt5: "MetaTrader 5 (Universal)",
    paper: "THN Paper Trading Sandbox"
  };

  const platforms = {
    exness: "MetaTrader 5 Cloud Bridge",
    xtb: "xStation 5 Web API",
    mt5: "MetaTrader 5 Gateway",
    paper: "THN Sandbox Engine"
  };

  // Encrypt secrets at rest
  const encryptedCreds = encryptSecret(JSON.stringify({
    server,
    accountNumber,
    apiToken
  }));

  const newAcc = {
    id: `acc_${broker}_${Date.now()}`,
    broker,
    brokerName: brokerNames[broker] || broker.toUpperCase(),
    platform: platforms[broker] || "Broker API Gateway",
    accountAlias: `${broker.toUpperCase()} (${maskAccountNumber(accountNumber)})`,
    accountNumber,
    accountNumberMasked: maskAccountNumber(accountNumber),
    accountType: "standard",
    accountTypeName: "Live Trading Account",
    currency: currency.toUpperCase(),
    balance: broker === "paper" ? 50000.0 : Math.max(0, Number(balance || 0)),
    equity: broker === "paper" ? 50000.0 : Math.max(0, Number(balance || 0)),
    freeMargin: broker === "paper" ? 50000.0 : Math.max(0, Number(balance || 0)),
    usedMargin: 0,
    marginLevel: 999,
    leverage: Number(leverage) || 200,
    tradingMode: broker === "paper" ? "PAPER" : (tradingMode === "PAPER" ? "PAPER" : "LIVE"),
    permissionLevel: permissionLevel === "TRADING_ENABLED" ? "TRADING_ENABLED" : "READ_ONLY",
    status: broker === "paper" ? "CONNECTED" : (balance > 0 ? "CONNECTED_STANDBY" : "STANDBY_UNVERIFIED"),
    latencyMs: broker === "paper" ? 1 : null,
    reconciliationStatus: "SYNCHRONIZED",
    lastReconciledAt: new Date().toISOString(),
    dailyRealizedPnl: 0,
    todayTradesCount: 0,
    positions: [],
    orders: [],
    encryptedCredentials: encryptedCreds,
    lastSyncAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  tradingAccounts.unshift(newAcc);
  saveTradingAccounts();

  logAuditEvent({
    eventType: "ACCOUNT_CONNECTED",
    accountId: newAcc.id,
    details: {
      broker: newAcc.broker,
      maskedAccount: newAcc.accountNumberMasked,
      permissionLevel: newAcc.permissionLevel,
      tradingMode: newAcc.tradingMode
    }
  });

  return sanitizeAccountForClient(newAcc);
}

export function removeTradingAccount(accountId) {
  loadTradingAccounts();
  // Prevent deleting default paper sandbox
  if (accountId === DEFAULT_PAPER_ACCOUNT.id) {
    throw new Error("Default Paper Trading Sandbox cannot be deleted.");
  }
  const prevCount = tradingAccounts.length;
  tradingAccounts = tradingAccounts.filter(a => a.id !== accountId && a.accountNumber !== accountId);
  saveTradingAccounts();

  logAuditEvent({
    eventType: "ACCOUNT_DISCONNECTED",
    accountId,
    details: { removed: tradingAccounts.length < prevCount }
  });

  return getAllSanitizedAccounts();
}

/**
 * Idempotency validation to prevent double-execution
 */
export function checkAndStoreIdempotencyKey(key, ttlMs = 300000) {
  if (!key) return { isDuplicate: false };
  const now = Date.now();
  if (idempotencyKeys.has(key)) {
    const record = idempotencyKeys.get(key);
    if (now - record.timestamp < ttlMs) {
      return { isDuplicate: true, response: record.response };
    }
  }
  idempotencyKeys.set(key, { timestamp: now, response: null });

  // Clean stale keys periodically
  if (idempotencyKeys.size > 1000) {
    for (const [k, v] of idempotencyKeys.entries()) {
      if (now - v.timestamp > ttlMs) idempotencyKeys.delete(k);
    }
  }
  return { isDuplicate: false };
}

export function saveIdempotencyResponse(key, response) {
  if (key && idempotencyKeys.has(key)) {
    const existing = idempotencyKeys.get(key);
    existing.response = response;
  }
}

/**
 * Update positions and recalculate account equity / margin
 */
export function updateAccountStateWithQuotes(account, currentQuotesMap = {}) {
  let openPnl = 0;
  let totalMargin = 0;

  (account.positions || []).forEach(pos => {
    const q = currentQuotesMap[pos.symbol];
    if (q) {
      pos.currentPrice = q.bid || q.price || pos.currentPrice;
      const mult = pos.multiplier || 100000;
      const isBuy = pos.side.includes("BUY");
      const diff = isBuy ? (pos.currentPrice - pos.entryPrice) : (pos.entryPrice - pos.currentPrice);
      pos.floatingPnl = Number((diff * mult * pos.lots).toFixed(2));
      const riskDollars = Math.abs(pos.entryPrice - pos.sl) * mult * pos.lots;
      pos.pnlR = riskDollars > 0 ? Number((pos.floatingPnl / riskDollars).toFixed(1)) : 0;
    }
    openPnl += pos.floatingPnl || 0;
    totalMargin += pos.margin || 0;
  });

  account.equity = Math.max(0, +(account.balance + openPnl).toFixed(2));
  account.freeMargin = Math.max(0, +(account.equity - totalMargin).toFixed(2));
  account.usedMargin = +totalMargin.toFixed(2);
  account.marginLevel = totalMargin > 0 ? +((account.equity / totalMargin) * 100).toFixed(1) : 999.0;
  account.lastSyncAt = new Date().toISOString();

  return account;
}
