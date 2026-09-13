import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64; // 64 bytes = 512 bits
const DIGEST = "sha256";
const TOKEN_SECRET = process.env.AUTH_SECRET || "yehagere-atelier-secret-key-2026-secure-token-salt";

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
  userId: string;
  email: string;
  role: string;
  exp: number; // unix timestamp in ms
};

/**
 * Generates an HMAC-SHA256 signed session token.
 */
export function generateToken(payload: Omit<TokenPayload, "exp">, expiresInHours = 72): string {
  const exp = Date.now() + expiresInHours * 60 * 60 * 1000;
  const fullPayload: TokenPayload = { ...payload, exp };
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed session token.
 */
export function verifyToken(token: string): { valid: boolean; payload?: TokenPayload } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false };

    const [encodedPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(encodedPayload)
      .digest("base64url");

    const sigBuf = Buffer.from(signature, "utf-8");
    const expectedBuf = Buffer.from(expectedSig, "utf-8");

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false };
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (Date.now() > payload.exp) {
      return { valid: false }; // Expired
    }

    return { valid: true, payload };
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

  if (auth.payload.role !== "admin") {
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
