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

// Account ownership is checked by the HTTP boundary. Query before limiting so other
// accounts can neither hide this history nor leak into a page.
export function getOrderHistory(accountId,{limit=100,before}={}){
  if(!Number.isInteger(limit)||limit<1||limit>500||before!==undefined&&(!Number.isSafeInteger(before)||before<1))throw Object.assign(Error('Invalid order history pagination'),{status:400});
  const rows=db.prepare(`SELECT id,json FROM audit WHERE json_extract(json,'$.accountId')=? AND (json_extract(json,'$.eventType') LIKE 'ORDER_%' OR json_extract(json,'$.eventType') LIKE 'PENDING_%' OR json_extract(json,'$.eventType') IN ('SERVER_PROTECTION_CLOSE','POSITION_CLOSED')) ${before===undefined?'':'AND id < ?'} ORDER BY id DESC LIMIT ?`).all(accountId,...(before===undefined?[]:[before]),limit+1);
  return {events:rows.slice(0,limit).map(r=>JSON.parse(r.json)),nextCursor:rows.length>limit?rows[limit-1].id:null};
}
