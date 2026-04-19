import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  COOKIE_NAME,
  COOKIE_PATH,
  cookieSecure,
} from "../config.js";
import { isAuthConfigured, validatePassword } from "../auth/credentials.js";
import { signAccessToken } from "../auth/jwt.js";
import type { AuthedRequest } from "../auth/middleware.js";
import { requireApiAuth } from "../auth/middleware.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createAuthRouter(): Router {
  const r = Router();

  r.post("/login", loginLimiter, async (req, res) => {
    if (!isAuthConfigured()) {
      res.status(503).json({
        error: "Authentication is not configured (missing IOT_AUTH_* env).",
      });
      return;
    }
    const username = typeof req.body?.username === "string" ? req.body.username : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!username || !password) {
      res.status(400).json({ error: "username and password required" });
      return;
    }
    const ok = await validatePassword(username, password);
    if (!ok) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const token = signAccessToken(username);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: "lax",
      path: COOKIE_PATH,
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ ok: true, username });
  });

  r.post("/logout", (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: COOKIE_PATH });
    res.json({ ok: true });
  });

  r.get("/me", requireApiAuth, (req: AuthedRequest, res) => {
    res.json({ user: { username: req.user!.username } });
  });

  return r;
}
