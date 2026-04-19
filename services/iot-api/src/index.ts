import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { IS_PROD, PORT, resolveWebDist } from "./config.js";
import {
  assertJwtSecret,
  readTokenFromRequest,
  verifyAccessToken,
} from "./auth/jwt.js";
import { createAuthRouter } from "./routes/auth.js";
import { createIotRouter } from "./routes/iot.js";

assertJwtSecret();

const app = express();
const webDist = resolveWebDist();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: IS_PROD
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        }
      : false,
  }),
);
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "iot-api" });
});

app.use("/api/iot/auth", createAuthRouter());
app.use("/api/iot", createIotRouter());

/** Static assets for SPA (must be before HTML fallback). */
app.use(
  "/iot/assets",
  express.static(path.join(webDist, "assets"), {
    maxAge: IS_PROD ? "7d" : 0,
    index: false,
  }),
);

function sendSpaIndex(res: express.Response): void {
  res.sendFile(path.join(webDist, "index.html"));
}

function allowUnauthenticatedSpa(req: express.Request): boolean {
  return req.path === "/iot/login" || req.path.startsWith("/iot/login/");
}

function hasValidSession(req: express.Request): boolean {
  const token = readTokenFromRequest(req);
  if (!token) return false;
  return verifyAccessToken(token) !== null;
}

/**
 * Protect HTML routes under /iot: require JWT (cookie) except /iot/login and assets.
 */
app.get(/^\/iot(\/.*)?$/, (req, res, next) => {
  if (req.path.startsWith("/iot/assets")) {
    return next();
  }
  if (allowUnauthenticatedSpa(req)) {
    return sendSpaIndex(res);
  }
  if (!hasValidSession(req)) {
    res.redirect(302, "/iot/login");
    return;
  }
  sendSpaIndex(res);
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`iot-api listening on http://0.0.0.0:${PORT}`);
  console.log(`SPA dist: ${webDist}`);
});
