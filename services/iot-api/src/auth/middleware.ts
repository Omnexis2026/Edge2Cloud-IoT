import type { NextFunction, Request, Response } from "express";
import { readTokenFromRequest, verifyAccessToken } from "./jwt.js";

export interface AuthedRequest extends Request {
  user?: { username: string };
}

export function requireApiAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = readTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.user = { username: payload.sub };
  next();
}

export function requireHtmlAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = readTokenFromRequest(req);
  if (!token) {
    res.redirect(302, "/iot/login");
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.redirect(302, "/iot/login");
    return;
  }
  next();
}
