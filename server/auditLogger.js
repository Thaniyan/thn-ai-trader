import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_FILE = path.join(__dirname, "..", "audit_log.json");

let auditEvents = [];

function loadAuditEvents() {
  if (fs.existsSync(AUDIT_FILE)) {
    try {
      const raw = fs.readFileSync(AUDIT_FILE, "utf8");
      auditEvents = JSON.parse(raw);
      if (!Array.isArray(auditEvents)) auditEvents = [];
    } catch {
      auditEvents = [];
    }
  }
}

function saveAuditEvents() {
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditEvents.slice(0, 200), null, 2));
  } catch (err) {
    console.error("Failed to persist audit log:", err.message);
  }
}

loadAuditEvents();

export function logAuditEvent({ eventType, accountId, symbol, details, status = "SUCCESS", correlationId }) {
  const event = {
    id: `ev_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    correlationId: correlationId || `CORR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    timestamp: new Date().toISOString(),
    eventType,
    accountId: accountId || "SYSTEM",
    symbol: symbol || null,
    status,
    details: details || {}
  };

  // Ensure no password or token fields are recorded in audit logs
  if (event.details && typeof event.details === "object") {
    delete event.details.password;
    delete event.details.masterPassword;
    delete event.details.investorPassword;
    delete event.details.apiToken;
    delete event.details.secret;
  }

  auditEvents.unshift(event);
  if (auditEvents.length > 200) auditEvents = auditEvents.slice(0, 200);
  saveAuditEvents();

  console.log(`[AUDIT] [${event.timestamp}] [${event.eventType}] [${event.status}] - ${JSON.stringify(event.details)}`);
  return event;
}

export function getAuditEvents(limit = 50) {
  return auditEvents.slice(0, limit);
}
