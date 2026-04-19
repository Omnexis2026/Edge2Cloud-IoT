import { Router } from "express";
import type { AuthedRequest } from "../auth/middleware.js";
import { requireApiAuth } from "../auth/middleware.js";

/**
 * All routes mounted under /api/iot — protected except where mounted separately.
 */
export function createIotRouter(): Router {
  const r = Router();
  r.use(requireApiAuth);

  r.get("/devices", (_req: AuthedRequest, res) => {
    res.json({
      devices: [
        {
          id: "demo-1",
          name: "Gateway",
          online: true,
          lastSeen: new Date().toISOString(),
          rssi: -62,
        },
        {
          id: "demo-2",
          name: "Sensor node",
          online: false,
          lastSeen: new Date(Date.now() - 3600_000).toISOString(),
          rssi: null,
        },
      ],
    });
  });

  r.get("/live", (_req: AuthedRequest, res) => {
    res.json({
      message: "Live telemetry will stream here (MQTT / WebSocket integration).",
      series: [] as { t: string; value: number }[],
    });
  });

  return r;
}
