import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE = path.join(__dirname, "..", ".vault_key");

function getOrCreateSecretKey() {
  if (process.env.APP_ENCRYPTION_KEY) {
    return crypto.scryptSync(process.env.APP_ENCRYPTION_KEY, "thn_ai_salt", 32);
  }
  if (fs.existsSync(KEY_FILE)) {
    try {
      const hex = fs.readFileSync(KEY_FILE, "utf8").trim();
      if (hex.length === 64) return Buffer.from(hex, "hex");
    } catch {
      // Fallback to generating new
    }
  }
  const newKey = crypto.randomBytes(32);
  try {
    fs.writeFileSync(KEY_FILE, newKey.toString("hex"), { mode: 0o600 });
  } catch {
    // In restricted environments
  }
  return newKey;
}

const SECRET_KEY = getOrCreateSecretKey();
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
