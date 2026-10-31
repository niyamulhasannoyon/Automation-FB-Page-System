import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit recommended IV for GCM
const PREFIX = "enc:v1:";

/**
 * Derives a 32-byte encryption key from the environment variable ENCRYPTION_KEY.
 * Falls back to a deterministic SHA-256 hash if none or invalid key provided.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.trim().length > 0) {
    const trimmed = envKey.trim();
    // If 64 hex characters, parse directly
    if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) {
      return Buffer.from(trimmed, "hex");
    }
    // Otherwise derive 32 bytes using SHA-256
    return crypto.createHash("sha256").update(trimmed).digest();
  }

  // Fallback for local development / evaluation
  const fallbackSecret = "fb_autopage_master_aes256_encryption_key_fallback_2025";
  return crypto.createHash("sha256").update(fallbackSecret).digest();
}

/**
 * Encrypts a sensitive Facebook Page Access Token at rest using AES-256-GCM
 */
export function encryptToken(plainText: string): string {
  if (!plainText || typeof plainText !== "string") {
    return "";
  }

  // Avoid double encryption
  if (plainText.startsWith(PREFIX)) {
    return plainText;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("[Crypto] Failed to encrypt token:", err);
    return plainText; // Fail-safe return
  }
}

/**
 * Decrypts an AES-256-GCM encrypted token.
 * If the input is not encrypted (e.g. legacy or demo tokens), returns it as-is.
 */
export function decryptToken(cipherText: string): string {
  if (!cipherText || typeof cipherText !== "string") {
    return "";
  }

  // Not an encrypted string, return as plaintext
  if (!cipherText.startsWith(PREFIX)) {
    return cipherText;
  }

  try {
    const parts = cipherText.slice(PREFIX.length).split(":");
    if (parts.length !== 3) {
      return cipherText;
    }

    const [ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("[Crypto] Failed to decrypt token (check ENCRYPTION_KEY):", err);
    return cipherText;
  }
}

/**
 * Masks a token for safe transmission to the frontend (e.g. "EAA...9a4f")
 * Ensures raw secrets are NEVER exposed in client API responses.
 */
export function maskToken(token: string): string {
  if (!token || typeof token !== "string") {
    return "••••••••";
  }

  // If token is encrypted, decrypt first so we mask the actual token format
  const rawToken = token.startsWith(PREFIX) ? decryptToken(token) : token;

  if (rawToken.startsWith("demo_")) {
    return `demo_••••${rawToken.slice(-4)}`;
  }

  if (rawToken.length <= 10) {
    return "••••••••";
  }

  // For Meta tokens (usually starts with EAA)
  const prefix = rawToken.slice(0, 3);
  const suffix = rawToken.slice(-4);
  return `${prefix}...${suffix}`;
}
