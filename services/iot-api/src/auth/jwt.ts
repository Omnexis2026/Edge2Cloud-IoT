import jwt, { type SignOptions } from "jsonwebtoken";
import {
  COOKIE_NAME,
  JWT_EXPIRES_IN,
  JWT_SECRET,
  IS_PROD,
} from "../config.js";

export interface JwtPayload {
  sub: string;
}

export function assertJwtSecret(): void {
  if (IS_PROD && (!JWT_SECRET || JWT_SECRET.length < 32)) {
    throw new Error(
      "JWT_SECRET must be set to a random string of at least 32 characters in production.",
    );
  }
}

export function signAccessToken(username: string): string {
  const opts: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "iot-api",
    audience: "iot-dashboard",
  };
  return jwt.sign({ sub: username }, JWT_SECRET, opts);
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "iot-api",
      audience: "iot-dashboard",
    });
    if (typeof decoded === "string" || !decoded || typeof decoded !== "object")
      return null;
    const sub = (decoded as jwt.JwtPayload).sub;
    if (typeof sub !== "string" || !sub) return null;
    return { sub };
  } catch {
    return null;
  }
}

export function readTokenFromRequest(req: {
  cookies?: Record<string, string>;
  headers: { authorization?: string };
}): string | undefined {
  const c = req.cookies?.[COOKIE_NAME];
  if (c) return c;
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return undefined;
}
