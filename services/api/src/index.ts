import path from "node:path";
import Fastify from "fastify";
import mqtt, { MqttClient } from "mqtt";
import {
  countTelemetry,
  insertTelemetry,
  openTelemetryDb,
  recentTelemetry,
} from "./db.js";

const app = Fastify({ logger: true });

const port = Number(process.env.PORT ?? 3000);

function resolveMqttUrl(): string {
  const explicit = process.env.MQTT_URL?.trim();
  if (explicit) {
    return explicit;
  }
  const host = process.env.MQTT_HOST ?? "127.0.0.1";
  const portMqtt = process.env.MQTT_PORT ?? "1883";
  const user = process.env.MQTT_USER;
  const pass = process.env.MQTT_PASSWORD;
  if (user != null && user !== "" && pass != null && pass !== "") {
    return `mqtt://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${portMqtt}`;
  }
  return `mqtt://${host}:${portMqtt}`;
}

const mqttUrl = resolveMqttUrl();

/** Match firmware topics in `firmware/esp32/src/main.c` */
const topicTelemetry = process.env.MQTT_TOPIC_TELEMETRY ?? "home/+/device/+/telemetry";
const topicState = process.env.MQTT_TOPIC_STATE ?? "home/+/device/+/state";

const sqlitePath =
  process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "telemetry.db");
const db = openTelemetryDb(sqlitePath);

const MAX_SNAPSHOT = 1000;

let mqttClient: MqttClient | null = null;

function connectMqtt(): MqttClient {
  const client = mqtt.connect(mqttUrl, {
    reconnectPeriod: 2000,
    connectTimeout: 10_000,
  });
  client.on("error", (err) => {
    app.log.error({ err }, "MQTT error");
  });
  client.on("connect", () => {
    app.log.info({ mqttUrl: mqttUrl.replace(/:[^:@]+@/, ":****@") }, "MQTT connected");
    const topics = [topicTelemetry, topicState];
    client.subscribe(topics, { qos: 0 }, (err) => {
      if (err) {
        app.log.error({ err }, "MQTT subscribe failed");
      } else {
        app.log.info({ topics }, "MQTT subscribed");
      }
    });
  });
  client.on("message", (topic, payload) => {
    const receivedAt = new Date().toISOString();
    insertTelemetry(db, {
      topic,
      payload: payload.toString("utf8"),
      receivedAt,
    });
  });
  return client;
}

app.get("/health", async () => ({
  ok: true,
  mqtt: mqttClient?.connected ?? false,
  mqttStoredMessages: countTelemetry(db),
}));

app.get("/version", async () => ({ name: "home-api", version: "0.1.0" }));

app.get<{ Querystring: { limit?: string } }>("/mqtt/snapshot", async (request) => {
  const raw = Number(request.query.limit ?? 50);
  const limit = Number.isFinite(raw)
    ? Math.min(Math.max(Math.trunc(raw), 1), MAX_SNAPSHOT)
    : 50;
  return {
    topics: { telemetry: topicTelemetry, state: topicState },
    total: countTelemetry(db),
    messages: recentTelemetry(db, limit),
  };
});

const start = async () => {
  mqttClient = connectMqtt();
  await app.listen({ port, host: "0.0.0.0" });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
