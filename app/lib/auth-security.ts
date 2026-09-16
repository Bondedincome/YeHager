import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64; // 64 bytes = 512 bits
const DIGEST = "sha256";
let devEphemeralTokenSecret: string | null = null;

function getTokenSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  const isDeployed =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    Boolean(process.env.FLY_APP_NAME);

  if (!secret) {
    if (isDeployed) {
      throw new Error("FATAL: JWT_SECRET environment variable is strictly required in deployed environments.");
    }
    if (!devEphemeralTokenSecret) {
      devEphemeralTokenSecret = crypto.randomBytes(32).toString("hex");
      console.warn(
        "⚠️ WARNING: JWT_SECRET not configured. Generated ephemeral runtime secret for isolated development session."
      );
    }
    return devEphemeralTokenSecret;
  }
  return secret;
}

/**
 * Generates a cryptographically random salt and hashes the password using PBKDF2.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { hash, salt };
}

/**
 * Derives a hash for a given password and salt.
 */
export function hashWithSalt(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
}

/**
 * Verifies a password against a stored hash and salt using constant-time comparison
 * to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, storedSalt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    const computedBuf = Buffer.from(computedHash, "hex");

    if (storedBuf.length !== computedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch {
    return false;
  }
}

export type TokenPayload = {
  sub?: string;
  userId: string;
  email: string;
  role: string;
  exp: number; // unix timestamp in seconds
  iat?: number;
};

/**
 * Generates a standard RFC 7519 HMAC-SHA256 signed JWT session token.
 * Fully compatible with NestJS JwtStrategy and Next.js session validation.
 */
export function generateToken(
  payload: { userId: string; email: string; role: string },
  expiresInHours = 72
): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = nowSec + expiresInHours * 3600;
  const normalizedRole = (payload.role || "customer").toLowerCase();

  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload = {
    sub: payload.userId,
    userId: payload.userId,
    email: payload.email,
    role: normalizedRole,
    iat: nowSec,
    exp,
  };

  const encHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getTokenSecret())
    .update(`${encHeader}.${encPayload}`)
    .digest("base64url");

  return `${encHeader}.${encPayload}.${signature}`;
}

/**
 * Verifies and decodes a standard HMAC-SHA256 signed session token (or legacy HMAC).
 * Uses constant-time comparison to prevent timing side channels.
 */
export function verifyToken(token: string): { valid: boolean; payload?: TokenPayload } {
  try {
    if (!token || typeof token !== "string") return { valid: false };
    const parts = token.split(".");

    // Standard 3-part JWT: header.payload.signature
    if (parts.length === 3) {
      const [encHeader, encPayload, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", getTokenSecret())
        .update(`${encHeader}.${encPayload}`)
        .digest("base64url");

      const sigBuf = Buffer.from(signature, "utf-8");
      const expectedBuf = Buffer.from(expectedSig, "utf-8");

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return { valid: false };
      }

      const rawPayload = JSON.parse(Buffer.from(encPayload, "base64url").toString("utf-8"));
      const nowSec = Math.floor(Date.now() / 1000);

      // Support exp in seconds or milliseconds
      const expSec = rawPayload.exp > 10000000000 ? Math.floor(rawPayload.exp / 1000) : rawPayload.exp;
      if (expSec && nowSec > expSec) {
        return { valid: false }; // Expired
      }

      const payload: TokenPayload = {
        sub: rawPayload.sub || rawPayload.userId,
        userId: rawPayload.userId || rawPayload.sub,
        email: rawPayload.email,
        role: String(rawPayload.role || "customer").toLowerCase(),
        exp: expSec,
        iat: rawPayload.iat,
      };

      return { valid: true, payload };
    }

    // Legacy 2-part fallback: payload.signature
    if (parts.length === 2) {
      const [encodedPayload, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", getTokenSecret())
        .update(encodedPayload)
        .digest("base64url");

      const sigBuf = Buffer.from(signature, "utf-8");
      const expectedBuf = Buffer.from(expectedSig, "utf-8");

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return { valid: false };
      }

      const rawPayload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
      if (Date.now() > rawPayload.exp) {
        return { valid: false };
      }

      return {
        valid: true,
        payload: {
          userId: rawPayload.userId || rawPayload.sub,
          email: rawPayload.email,
          role: String(rawPayload.role || "customer").toLowerCase(),
          exp: Math.floor(rawPayload.exp / 1000),
        },
      };
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export const AUTH_COOKIE_NAME = "yehagere_auth_token";

/**
 * Extracts session token from either Authorization Bearer header or HttpOnly Cookie.
 */
export function extractTokenFromRequest(request: Request): string | null {
  try {
    // 1. Check Authorization Bearer header
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) return token;
    }

    // 2. Check Cookie header
    const cookieHeader = request.headers.get("cookie") || "";
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));

      if (match) {
        const token = match.substring(AUTH_COOKIE_NAME.length + 1).trim();
        if (token) return decodeURIComponent(token);
      }
    }
  } catch {
    return null;
  }
  return null;
}

export type AuthResult = {
  authenticated: boolean;
  authorized?: boolean;
  payload?: TokenPayload;
  error?: string;
  status: number;
};

/**
 * Validates the session token from an incoming request.
 */
export function authenticateRequest(request: Request): AuthResult {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return {
      authenticated: false,
      authorized: false,
      error: "Authentication required. Please sign in with your atelier account.",
      status: 401,
    };
  }

  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return {
      authenticated: false,
      authorized: false,
      error: "Session token is invalid or has expired. Please sign in again.",
      status: 401,
    };
  }

  return {
    authenticated: true,
    authorized: true,
    payload: result.payload,
    status: 200,
  };
}

/**
 * Validates the session token AND enforces that the user has the 'admin' role.
 */
export function requireAdmin(request: Request): AuthResult {
  const auth = authenticateRequest(request);
  if (!auth.authenticated || !auth.payload) {
    return auth;
  }

  const role = String(auth.payload.role || "").toLowerCase();
  if (role !== "admin") {
    return {
      authenticated: true,
      authorized: false,
      payload: auth.payload,
      error: "Access denied. Administrator privileges required to access this resource.",
      status: 403,
    };
  }

  return {
    authenticated: true,
    authorized: true,
    payload: auth.payload,
    status: 200,
  };
}

/**
 * Validates password strength (min 8 chars, at least one letter and one number).
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number." };
  }
  return { valid: true };
}

/**
 * Calculates password strength score and criteria fulfillment for interactive UI indicators.
 */
export function getPasswordStrengthInfo(password: string): {
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
} {
  const p = password || "";
  const hasMinLength = p.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecial = /[^a-zA-Z0-9]/.test(p);

  let score = 0;
  if (hasMinLength) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let label: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  if (score >= 4) label = "Strong";
  else if (score === 3) label = "Good";
  else if (score === 2) label = "Fair";

  return { score, label, hasMinLength, hasLetter, hasNumber, hasSpecial };
}
