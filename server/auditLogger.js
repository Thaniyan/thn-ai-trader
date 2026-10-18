import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import crypto from "node:crypto";
import {db,readState,writeState} from "./storage.js";
const redact=value=>Array.isArray(value)?value.map(redact):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).filter(([key])=>!/(password|token|secret|credential|authorization)/i.test(key)).map(([key,v])=>[key,redact(v)])):value;
if(!readState("legacyAuditImported")){
  const configured=process.env.THN_DATA_DIR&&path.join(process.env.THN_DATA_DIR,"audit_log.json");
  const legacy=configured&&fs.existsSync(configured)?configured:path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","audit_log.json");
  const events=fs.existsSync(legacy)?JSON.parse(fs.readFileSync(legacy,"utf8")):[];
  if(!Array.isArray(events))throw Error("Invalid legacy audit; recovery required");
  db.exec("BEGIN IMMEDIATE");try{for(const event of [...events].reverse())db.prepare("INSERT INTO audit(json) VALUES (?)").run(JSON.stringify(redact(event)));writeState("legacyAuditImported",true);db.exec("COMMIT")}catch(error){db.exec("ROLLBACK");throw error}
}
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


  event.details=redact(event.details);
  db.prepare("INSERT INTO audit(json) VALUES (?)").run(JSON.stringify(event));
  return event;
}

export function getAuditEvents(limit = 50) {
  return db.prepare("SELECT json FROM audit ORDER BY id DESC LIMIT ?").all(limit).map(row=>JSON.parse(row.json));
}
