import { db, readState, writeState } from "./storage.js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encryptSecret, maskAccountNumber } from "./encryption.js";
import { logAuditEvent } from "./auditLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configuredLegacy=process.env.THN_DATA_DIR&&path.join(process.env.THN_DATA_DIR,"trading_accounts.json");
const ACCOUNTS_FILE = configuredLegacy&&fs.existsSync(configuredLegacy)?configuredLegacy:path.join(__dirname,"..","trading_accounts.json");

let tradingAccounts = [];


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
  const stored=readState("accounts");
  if(stored)tradingAccounts=stored;
  else if(fs.existsSync(ACCOUNTS_FILE)){tradingAccounts=JSON.parse(fs.readFileSync(ACCOUNTS_FILE,"utf8"));if(!Array.isArray(tradingAccounts))throw Error("Invalid legacy account store");}
  else tradingAccounts=[];
  if(!tradingAccounts.some(a=>a.id===DEFAULT_PAPER_ACCOUNT.id)){tradingAccounts.unshift(structuredClone(DEFAULT_PAPER_ACCOUNT));saveTradingAccounts()}
  return tradingAccounts;
}
export function saveTradingAccounts(){writeState("accounts",tradingAccounts)}
export function allAccountRecords(){return loadTradingAccounts()}

/**
 * Returns sanitized DTO for frontend with zero plaintext secrets
 */
function financial(value,fallback=0){
  if(value===undefined||value===null)return fallback;
  if(typeof value!=="number"||!Number.isFinite(value))throw Object.assign(Error("Invalid persisted financial state"),{status:503});
  return value;
}
export function sanitizeAccountForClient(account) {
  if (!account) return null;
  return {
    id: account.id,
    ownerId: account.ownerId || "operator",
    accountEpoch:account.accountEpoch||"legacy",
    startingBalance:financial(account.startingBalance,50000),
    pricingStatus:account.pricingStatus||"UNVERIFIED",
    pricingBlockedSymbols:account.pricingBlockedSymbols||[],
    broker: account.broker,
    brokerName: account.brokerName,
    platform: account.platform,
    accountAlias: account.accountAlias || account.brokerName,
    accountNumber: account.accountNumberMasked || maskAccountNumber(account.accountNumber),
    accountNumberMasked: account.accountNumberMasked || maskAccountNumber(account.accountNumber),
    accountType: account.accountType,
    accountTypeName: account.accountTypeName,
    currency: account.currency || "USD",
    balance: financial(account.balance),
    equity: financial(account.equity,financial(account.balance)),
    freeMargin: financial(account.freeMargin,0),
    usedMargin: financial(account.usedMargin),
    marginLevel: financial(account.marginLevel,999),
    leverage: financial(account.leverage,200),
    tradingMode: account.tradingMode || (account.broker === "paper" ? "PAPER" : "LIVE"),
    permissionLevel: account.permissionLevel || "READ_ONLY",
    status: account.status || "UNVERIFIED",
    latencyMs: account.latencyMs ?? (account.broker === "paper" ? 1 : null),
    dailyRealizedPnl: financial(account.dailyRealizedPnl),
    todayTradesCount: financial(account.todayTradesCount),
    positions: (account.positions || []).map(p => ({ ...p })),
    orders: (account.orders || []).map(o => ({ ...o })),
    lastSyncAt: account.lastSyncAt,
    createdAt: account.createdAt
  };
}

export function getAllSanitizedAccounts(ownerId) {
  loadTradingAccounts();
  return tradingAccounts.filter(a=>!ownerId||(a.ownerId||"operator")===ownerId).map(sanitizeAccountForClient);
}

export function getAccountById(id) {
  loadTradingAccounts();
  return tradingAccounts.find(a => a.id === id || a.accountNumber === id);
}

/**
 * Add or link an external broker account safely
 */
export function addTradingAccount({ ownerId = "operator", broker, server, accountNumber, apiToken, permissionLevel = "READ_ONLY", currency = "USD", leverage = 200, balance = 0, tradingMode = "LIVE" }) {
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

  if (!Number.isFinite(balance) || balance < 0) throw Object.assign(new Error("Balance must be a finite non-negative number"), {status:400});

  // Encrypt secrets at rest
  const encryptedCreds = encryptSecret(JSON.stringify({
    server,
    accountNumber,
    apiToken
  }));

  const newAcc = {
    id: `acc_${broker}_${crypto.randomUUID()}`,
    ownerId,
    broker,
    brokerName: brokerNames[broker] || broker.toUpperCase(),
    platform: platforms[broker] || "Broker API Gateway",
    accountAlias: `${broker.toUpperCase()} (${maskAccountNumber(accountNumber)})`,
    accountNumber,
    accountNumberMasked: maskAccountNumber(accountNumber),
    accountType: broker === "paper" ? "paper" : "standard",
    accountTypeName: broker === "paper" ? "Paper Trading Account" : "Unverified External Account",
    currency: currency.toUpperCase(),
    balance: balance,
    equity: balance,
    freeMargin: balance,
    startingBalance: balance,
    accountEpoch: crypto.randomUUID(),
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
export function checkAndStoreIdempotencyKey(key,payload) {
  if(typeof key!=="string"||key.length<1||key.length>128)throw Object.assign(Error("Idempotency key required (1–128 characters)"),{status:400});
  const hash=crypto.createHash("sha256").update(JSON.stringify(Object.fromEntries(Object.entries(payload).sort(([a],[b])=>a.localeCompare(b))))).digest("hex");
  const record=db.prepare("SELECT hash,json FROM idempotency WHERE key=?").get(key);
  if(record){if(record.hash!==hash)throw Object.assign(Error("Idempotency key reused with different request"),{status:409});return {isDuplicate:true,response:record.json?JSON.parse(record.json):null}}
  db.prepare("INSERT INTO idempotency(key,hash) VALUES (?,?)").run(key,hash);
  return {isDuplicate:false};
}
export function saveIdempotencyResponse(key,response){db.prepare("UPDATE idempotency SET json=? WHERE key=?").run(JSON.stringify(response),key)}

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
