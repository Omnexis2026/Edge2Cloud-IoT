import mqtt from "mqtt";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHART_MAX_POINTS,
  MQTT_TOPICS,
  MQTT_WS_URL,
} from "../config";

export type MqttConnState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export interface DeviceInfo {
  id: string;
  name: string;
  online: boolean;
  rssi?: number;
  lastSeen: number;
}

export interface ChartPoint {
  at: number;
  temp: number;
  hum: number;
}

const STATUS_RE = /^devices\/([^/]+)\/status$/;
const SENSOR_RE = /^devices\/([^/]+)\/sensor\/(temperature|humidity)$/;

function parseStatusPayload(raw: string): {
  name?: string;
  online?: boolean;
  rssi?: number;
} {
  const t = raw.trim();
  if (!t) return {};
  try {
    const j = JSON.parse(t) as Record<string, unknown>;
    const name = typeof j.name === "string" ? j.name : undefined;
    const online =
      typeof j.online === "boolean"
        ? j.online
        : typeof j.state === "string"
          ? j.state === "online"
          : undefined;
    const rssi = typeof j.rssi === "number" ? j.rssi : undefined;
    return { name, online, rssi };
  } catch {
    const low = t.toLowerCase();
    if (low === "online" || low === "1" || low === "true")
      return { online: true };
    if (low === "offline" || low === "0" || low === "false")
      return { online: false };
    return {};
  }
}

export function useMqttDashboard(enabled: boolean, simulate: boolean) {
  const [mqttConn, setMqttConn] = useState<MqttConnState>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Map<string, DeviceInfo>>(() => new Map());
  const [series, setSeries] = useState<ChartPoint[]>([]);

  const lastTemp = useRef(22);
  const lastHum = useRef(48);

  const pushPoint = useCallback(() => {
    const at = Date.now();
    setSeries((prev) => {
      const next = [
        ...prev,
        { at, temp: lastTemp.current, hum: lastHum.current },
      ];
      if (next.length > CHART_MAX_POINTS) return next.slice(-CHART_MAX_POINTS);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!simulate) return;
    const id = window.setInterval(() => {
      lastTemp.current += (Math.random() - 0.5) * 0.4;
      lastTemp.current = Math.min(32, Math.max(16, lastTemp.current));
      lastHum.current += (Math.random() - 0.5) * 1.2;
      lastHum.current = Math.min(75, Math.max(25, lastHum.current));
      pushPoint();
    }, 2000);
    return () => window.clearInterval(id);
  }, [simulate, pushPoint]);

  useEffect(() => {
    if (!enabled || simulate) {
      return;
    }

    const client = mqtt.connect(MQTT_WS_URL, {
      reconnectPeriod: 3000,
      connectTimeout: 12_000,
      clientId: `web-dash-${Math.random().toString(36).slice(2, 10)}`,
    });
    const onConnect = () => {
      setMqttConn("connected");
      client.subscribe(
        [MQTT_TOPICS.deviceStatus, MQTT_TOPICS.sensors],
        (err) => {
          if (err) setLastError(err.message);
        },
      );
    };

    const onReconnect = () => setMqttConn("reconnecting");
    const onError = (e: Error) => {
      setLastError(e.message);
      setMqttConn("error");
    };
    const onClose = () => {
      setMqttConn((c) => (c === "connected" ? "reconnecting" : c));
    };

    const onMessage = (topic: string, payload: Uint8Array) => {
      const text = new TextDecoder().decode(payload);
      const now = Date.now();

      const st = topic.match(STATUS_RE);
      if (st) {
        const id = st[1];
        const parsed = parseStatusPayload(text);
        setDevices((prev) => {
          const next = new Map(prev);
          const cur = next.get(id);
          next.set(id, {
            id,
            name: parsed.name ?? cur?.name ?? id,
            online: parsed.online ?? cur?.online ?? true,
            rssi: parsed.rssi ?? cur?.rssi,
            lastSeen: now,
          });
          return next;
        });
        return;
      }

      const sn = topic.match(SENSOR_RE);
      if (sn) {
        const id = sn[1];
        const kind = sn[2];
        const v = Number.parseFloat(text.trim());
        if (!Number.isFinite(v)) return;

        if (kind === "temperature") lastTemp.current = v;
        else lastHum.current = v;

        setDevices((prev) => {
          const next = new Map(prev);
          const cur = next.get(id);
          next.set(id, {
            id,
            name: cur?.name ?? id,
            online: true,
            rssi: cur?.rssi,
            lastSeen: now,
          });
          return next;
        });
        pushPoint();
      }
    };

    client.on("connect", onConnect);
    client.on("reconnect", onReconnect);
    client.on("error", onError);
    client.on("close", onClose);
    client.on("message", onMessage);

    queueMicrotask(() => {
      setMqttConn("connecting");
      setLastError(null);
    });

    return () => {
      client.removeAllListeners();
      client.end(true);
    };
  }, [enabled, simulate, pushPoint]);

  const conn: MqttConnState =
    !enabled || simulate ? "idle" : mqttConn;

  return { conn, lastError, devices, series, brokerUrl: MQTT_WS_URL };
}
