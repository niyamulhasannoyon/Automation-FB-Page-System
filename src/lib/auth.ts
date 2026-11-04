import { UserSession } from "@/types";

const JWT_SECRET =
  process.env.JWT_SECRET || "fb_autopage_jwt_secret_token_2025_secure_production";

export const DEMO_USER: UserSession = {
  userId: "user_demo",
  email: "demo@autopage.io",
  name: "Demo Merchant (Live)",
  role: "merchant",
};

export const ADMIN_USER: UserSession = {
  userId: "user_admin",
  email: "admin@autopage.io",
  name: "Super Admin (Owner)",
  role: "admin",
};

/**
 * Base64URL string encoding and decoding helpers
 */
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Imports HMAC key using standard Web Crypto API
 */
async function getCryptoKey(): Promise<CryptoKey> {
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  return globalThis.crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs a JWT token with 7 days expiration by default
 */
export async function signJwt(
  payload: UserSession,
  expiresInSeconds: number = 7 * 24 * 60 * 60
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(claims));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await getCryptoKey();
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(dataToSign)
  );

  const sigB64 = bufferToBase64Url(signatureBuffer);
  return `${dataToSign}.${sigB64}`;
}

/**
 * Verifies a JWT token and returns UserSession or null
 */
export async function verifyJwt(token: string): Promise<UserSession | null> {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    const key = await getCryptoKey();
    const signatureBytes = base64UrlToBuffer(sigB64);

    const isValid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(payloadB64);
    const claims = JSON.parse(payloadJson);

    // Expiry check
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      return null;
    }

    return {
      userId: claims.userId,
      email: claims.email,
      name: claims.name,
      role: claims.role || "merchant",
    };
  } catch (err) {
    console.warn("[Auth] Token verification failed:", err);
    return null;
  }
}

/**
 * Secure password hashing using SHA-256 with salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = base64UrlEncode(String(Date.now() + Math.random()));
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${salt}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  storedHash?: string
): Promise<boolean> {
  if (!storedHash || !password) return false;

  // Handle plain demo and admin password checks
  if (
    (storedHash === "demo123456" && password === "demo123456") ||
    (storedHash === "admin123456" && password === "admin123456")
  ) {
    return true;
  }

  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    return storedHash === password;
  }

  const [salt, expectedHash] = parts;
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const actualHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return actualHash === expectedHash;
}

/**
 * Extracts UserSession from Next.js request cookies or Authorization header
 */
export async function getSessionUser(req: Request): Promise<UserSession | null> {
  try {
    // 1. Check Authorization Bearer header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const user = await verifyJwt(token);
      if (user) return user;
    }

    // 2. Check cookie header
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match && match[1]) {
      const token = decodeURIComponent(match[1]);
      const user = await verifyJwt(token);
      if (user) return user;
    }

    return null;
  } catch {
    return null;
  }
}
