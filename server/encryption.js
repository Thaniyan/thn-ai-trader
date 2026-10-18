import crypto from "node:crypto";
import {readState} from "./storage.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE = path.join(process.env.THN_DATA_DIR || path.join(__dirname,".."), ".vault_key");

function persistedCredentials() {
  let stored;
  try{stored=readState("accounts")}catch{throw Error("Cannot inspect persisted credentials; recovery required")}
  if(stored!==null&&!Array.isArray(stored))throw Error("Invalid persisted accounts; recovery required");
  const records=[...(stored||[])];
  const files=new Set([process.env.THN_DATA_DIR&&path.join(process.env.THN_DATA_DIR,"trading_accounts.json"),path.join(__dirname,"..","trading_accounts.json")].filter(Boolean));
  for(const file of files)if(fs.existsSync(file)){
    let legacy;
    try{legacy=JSON.parse(fs.readFileSync(file,"utf8"))}catch{throw Error("Cannot inspect legacy credentials; recovery required")}
    if(!Array.isArray(legacy))throw Error("Invalid legacy accounts; recovery required");
    records.push(...legacy);
  }
  if(records.some(record=>!record||typeof record!=="object"))throw Error("Invalid persisted accounts; recovery required");
  return records.filter(record=>record.encryptedCredentials).map(record=>record.encryptedCredentials);
}
function verifyKey(key,credentials){
  const keyId=crypto.createHash("sha256").update(key).digest("hex");
  for(const payload of credentials){
    try{
      if(payload.keyId&&payload.keyId!==keyId)throw Error();
      const decipher=crypto.createDecipheriv("aes-256-gcm",key,Buffer.from(payload.iv,"base64"));
      decipher.setAuthTag(Buffer.from(payload.authTag,"base64"));
      decipher.update(payload.data,"base64");decipher.final();
    }catch{throw Error("Encryption key cannot authenticate persisted credentials; restore the matching key")}
  }
  return key;
}
function getOrCreateSecretKey() {
  const credentials=persistedCredentials();
  if(process.env.APP_ENCRYPTION_KEY)return verifyKey(crypto.scryptSync(process.env.APP_ENCRYPTION_KEY,"thn_ai_salt",32),credentials);
  if(fs.existsSync(KEY_FILE)){
    const hex=fs.readFileSync(KEY_FILE,"utf8").trim();
    if(!/^[0-9a-f]{64}$/i.test(hex))throw Error("Invalid vault key; recovery required");
    return verifyKey(Buffer.from(hex,"hex"),credentials);
  }
  if(credentials.length)throw Error("Encryption key missing for persisted credentials; restore the matching key");
  const key=crypto.randomBytes(32);
  fs.writeFileSync(KEY_FILE,key.toString("hex"),{flag:"wx",mode:0o600});
  return key;
}
const SECRET_KEY=getOrCreateSecretKey();
const KEY_ID=crypto.createHash("sha256").update(SECRET_KEY).digest("hex");

const ALGORITHM = "aes-256-gcm";

/**
 * Encrypt sensitive credential payload
 */
export function encryptSecret(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(String(plainText), "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();
  return {
    version: 1,
    keyId: KEY_ID,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    data: encrypted
  };
}

/**
 * Decrypt sensitive credential payload
 */
export function decryptSecret(encryptedPayload) {
  if (!encryptedPayload || !encryptedPayload.data || !encryptedPayload.iv || !encryptedPayload.authTag) {
    return null;
  }
  try {
    const iv = Buffer.from(encryptedPayload.iv, "base64");
    const authTag = Buffer.from(encryptedPayload.authTag, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedPayload.data, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Mask account number for safe public display
 */
export function maskAccountNumber(accNum) {
  if (!accNum) return "••••";
  const str = String(accNum).trim();
  if (str.length <= 4) return `•••• ${str}`;
  return `•••• ${str.slice(-4)}`;
}

/**
 * Mask token or server name
 */
export function maskToken(token) {
  if (!token) return "";
  const str = String(token).trim();
  if (str.length <= 6) return "••••••••";
  return `${str.slice(0, 3)}••••${str.slice(-3)}`;
}
