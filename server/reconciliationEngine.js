import { getAccountById, saveTradingAccounts, sanitizeAccountForClient } from "./accountStore.js";
import { getBrokerAdapter } from "./brokerAdapters.js";
import { logAuditEvent } from "./auditLogger.js";

/**
 * THN Authoritative Reconciliation Engine
 * Continuously reconciles THN local state with live broker adapters.
 */
export async function reconcileAccount(accountId) {
  const account = getAccountById(accountId);
  if (!account) {
    throw new Error(`Account #${accountId} not found for reconciliation.`);
  }

  const adapter = getBrokerAdapter(account.broker);
  const now = new Date().toISOString();
  const discrepancies = [];

  try {
    const brokerAccountSnapshot = await adapter.fetchAccount(account);
    const brokerPositions = await adapter.fetchPositions(account);

    // 1. Reconcile Balance
    if (account.tradingMode === "LIVE" && brokerAccountSnapshot.balance != null) {
      const balanceDiff = Math.abs(account.balance - brokerAccountSnapshot.balance);
      if (balanceDiff > 0.01) {
        discrepancies.push({
          field: "balance",
          local: account.balance,
          broker: brokerAccountSnapshot.balance,
          difference: balanceDiff
        });
        account.balance = Number(brokerAccountSnapshot.balance);
      }
    }

    // 2. Reconcile Equity & Margin
    let calculatedUsedMargin = 0;
    (account.positions || []).forEach(pos => {
      calculatedUsedMargin += Number(pos.margin || 0);
    });
    calculatedUsedMargin = +calculatedUsedMargin.toFixed(2);

    if (Math.abs(Number(account.usedMargin || 0) - calculatedUsedMargin) > 0.05) {
      discrepancies.push({
        field: "usedMargin",
        local: account.usedMargin,
        calculated: calculatedUsedMargin
      });
      account.usedMargin = calculatedUsedMargin;
      account.freeMargin = Math.max(0, +(account.equity - calculatedUsedMargin).toFixed(2));
    }

    // 3. Reconcile Positions
    if (account.tradingMode === "LIVE") {
      const localTickets = new Set((account.positions || []).map(p => p.ticket));
      const brokerTickets = new Set((brokerPositions || []).map(p => p.ticket));

      for (const t of localTickets) {
        if (!brokerTickets.has(t)) {
          discrepancies.push({
            field: "position_orphan",
            ticket: t,
            issue: "Position recorded locally but closed or missing at broker"
          });
        }
      }
    }

    const isSynchronized = discrepancies.length === 0;
    account.reconciliationStatus = isSynchronized ? "SYNCHRONIZED" : "DISCREPANCY_RESOLVED";
    account.lastReconciledAt = now;
    account.lastSyncAt = now;

    saveTradingAccounts();

    logAuditEvent({
      eventType: "RECONCILIATION_COMPLETED",
      accountId: account.id,
      symbol: null,
      status: isSynchronized ? "SUCCESS" : "RESOLVED",
      details: {
        discrepanciesCount: discrepancies.length,
        discrepancies,
        status: account.reconciliationStatus
      }
    });

    return {
      ok: true,
      accountId: account.id,
      reconciledAt: now,
      status: account.reconciliationStatus,
      isSynchronized,
      discrepanciesCount: discrepancies.length,
      discrepancies,
      account: sanitizeAccountForClient(account)
    };
  } catch (err) {
    account.reconciliationStatus = "RECONCILIATION_FAILED";
    account.lastReconciledAt = now;
    saveTradingAccounts();

    logAuditEvent({
      eventType: "RECONCILIATION_FAILED",
      accountId: account.id,
      symbol: null,
      status: "ERROR",
      details: { error: err.message }
    });

    return {
      ok: false,
      accountId: account.id,
      reconciledAt: now,
      status: "RECONCILIATION_FAILED",
      error: err.message,
      account: sanitizeAccountForClient(account)
    };
  }
}
