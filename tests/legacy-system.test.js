import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function runTestSuite() {
  console.log("=================================================");
  console.log("   THN AI TRADER — AUTOMATED SYSTEM TEST SUITE   ");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• ${name} ... `);
      await fn();
      console.log("\x1b[32mPASSED\x1b[0m");
      passed++;
    } catch (err) {
      console.log("\x1b[31mFAILED\x1b[0m");
      console.error("  Error:", err.message);
      failed++;
    }
  }

  // TEST 1: Health Endpoint
  await test("System Health & Server Info", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.app, "THN AI Trader");
    assert.ok(data.serverTime);
  });

  // TEST 2: Account Store Integrity
  await test("Account Store & Security Vault", async () => {
    const res = await fetch(`${BASE_URL}/api/accounts`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.accounts));
    assert.ok(data.accounts.length > 0);

    const paperAcc = data.accounts.find(a => a.broker === "paper" || a.id === "acc_paper_sandbox_01");
    assert.ok(paperAcc, "Default sandbox account must exist");
    assert.equal(paperAcc.tradingMode, "PAPER");
    assert.ok(paperAcc.accountNumberMasked, "Account number must be masked");
    assert.equal(paperAcc.masterPassword, undefined, "Master password must never be exposed");
    assert.equal(paperAcc.investorPassword, undefined, "Investor password must never be exposed");
  });

  // TEST 3: Authoritative Risk Engine Calculation
  await test("Authoritative Risk Calculation Endpoint", async () => {
    const payload = {
      symbol: "EURUSD",
      entryPrice: 1.0850,
      stopLoss: 1.0800,
      takeProfit: 1.0950,
      lots: 1.0,
      balance: 50000,
      leverage: 200
    };
    const res = await fetch(`${BASE_URL}/api/risk/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    const riskData = data.riskAnalysis || data.metrics;
    assert.ok(riskData);
    assert.ok(riskData.requiredMargin > 0);
  });

  // TEST 4: Invalid Order Risk Validation
  await test("Risk Engine Pre-Trade Rejection (Negative TP for Buy)", async () => {
    const payload = {
      accountId: "acc_paper_sandbox_01",
      symbol: "EURUSD",
      side: "BUY",
      lots: 0.1,
      stopLoss: 1.0000,
      takeProfit: 1.0100 // Deliberately below market
    };
    const res = await fetch(`${BASE_URL}/api/orders/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.code, "INVALID_TAKE_PROFIT");
  });

  // TEST 5: Order Execution & Idempotency
  let executedTicket = null;
  const idempotencyKey = `test_key_${Date.now()}`;
  await test("Authoritative Order Execution & Idempotency", async () => {
    const payload = {
      accountId: "acc_paper_sandbox_01",
      symbol: "EURUSD",
      side: "BUY",
      lots: 0.2,
      stopLoss: 1.0500,
      takeProfit: 1.2500,
      idempotencyKey
    };

    // First execution
    const res1 = await fetch(`${BASE_URL}/api/orders/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.ok, true);
    assert.ok(data1.orderResult?.ticket);
    executedTicket = data1.orderResult.ticket;

    // Retry with identical idempotencyKey (must return idempotent cached result or safe handling)
    const res2 = await fetch(`${BASE_URL}/api/orders/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data2 = await res2.json();
    assert.ok(data2.ok);
    assert.equal(data2.orderResult?.ticket, executedTicket);
  });

  // TEST 6: Position Closing & PnL Accounting
  await test("Position Closing & PnL Settlement", async () => {
    assert.ok(executedTicket, "Ticket from previous order execution required");
    const payload = {
      accountId: "acc_paper_sandbox_01",
      ticket: executedTicket
    };
    const res = await fetch(`${BASE_URL}/api/positions/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.closeResult);
    assert.equal(data.closeResult.ticket, executedTicket);
    assert.ok(typeof data.closeResult.realizedPnl === "number");
  });

  // TEST 7: Sandbox Account Reset
  await test("Sandbox Reset Authoritative Balance Recovery", async () => {
    const res = await fetch(`${BASE_URL}/api/broker/reset-sandbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: "acc_paper_sandbox_01" })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.account.balance, 50000);
    assert.equal(data.account.positions.length, 0);
  });

  // TEST 8: Automated Reconciliation Engine
  await test("Reconciliation Engine & Integrity Audit", async () => {
    const res = await fetch(`${BASE_URL}/api/broker/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: "acc_paper_sandbox_01" })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.status, "SYNCHRONIZED");
    assert.equal(data.discrepanciesCount, 0);
  });

  // TEST 9: Immutable Server Audit Logs
  await test("Immutable Server Audit Logger Retrieval", async () => {
    const res = await fetch(`${BASE_URL}/api/audit-logs`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.events));
    assert.ok(data.events.length > 0);
    assert.ok(data.events[0].correlationId);
  });

  // TEST 10: Multi-Asset Quotes Feed
  await test("Multi-Asset Live Quotes Aggregator", async () => {
    const res = await fetch(`${BASE_URL}/api/market/quotes`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.quotes);
    const symbols = Object.keys(data.quotes);
    assert.ok(symbols.includes("EURUSD"));
    assert.ok(symbols.includes("XAUUSD"));
    assert.ok(data.quotes.EURUSD.close > 0);
  });

  console.log("-------------------------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
