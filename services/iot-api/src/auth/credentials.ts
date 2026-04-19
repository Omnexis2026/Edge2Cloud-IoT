import bcrypt from "bcryptjs";
import { IOT_AUTH_PASSWORD_HASH, IOT_AUTH_USERNAME } from "../config.js";

export function isAuthConfigured(): boolean {
  return Boolean(IOT_AUTH_USERNAME && IOT_AUTH_PASSWORD_HASH);
}

export async function validatePassword(
  username: string,
  password: string,
): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  if (username !== IOT_AUTH_USERNAME) return false;
  return bcrypt.compare(password, IOT_AUTH_PASSWORD_HASH);
}
