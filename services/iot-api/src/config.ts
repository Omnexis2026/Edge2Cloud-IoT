import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PORT = Number(process.env.PORT ?? 4010);
export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const IS_PROD = NODE_ENV === "production";

/** Required in production; dev fallback only for local testing. */
export const JWT_SECRET =
  process.env.JWT_SECRET ?? (IS_PROD ? "" : "dev-only-change-me-min-32-chars!!");

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

export const COOKIE_NAME = "iot_token";
export const COOKIE_PATH = "/";

export const IOT_AUTH_USERNAME = process.env.IOT_AUTH_USERNAME ?? "";
export const IOT_AUTH_PASSWORD_HASH = process.env.IOT_AUTH_PASSWORD_HASH ?? "";

/** Public URL of this app (for docs / future redirects). */
export const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN ?? "";

/**
 * Path to Vite build output (apps/iot-web/dist) copied as public/ in Docker
 * or pointed at via IOT_WEB_DIST in dev.
 */
export function resolveWebDist(): string {
  const envPath = process.env.IOT_WEB_DIST;
  if (envPath && existsSync(envPath)) return path.resolve(envPath);
  const dockerPublic = path.join(__dirname, "../public");
  if (existsSync(path.join(dockerPublic, "index.html"))) return dockerPublic;
  const monorepoGuess = path.resolve(__dirname, "../../../apps/iot-web/dist");
  if (existsSync(path.join(monorepoGuess, "index.html"))) return monorepoGuess;
  return dockerPublic;
}

export function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return IS_PROD;
}
