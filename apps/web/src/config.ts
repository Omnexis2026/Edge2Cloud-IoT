/** WebSocket URL for Mosquitto (see infra/docker-compose: port 9001). */
export const MQTT_WS_URL =
  import.meta.env.VITE_MQTT_WS_URL ?? "ws://127.0.0.1:9001";

/** Subscribe to these patterns — match your firmware topic layout. */
export const MQTT_TOPICS = {
  deviceStatus: "devices/+/status",
  sensors: "devices/+/sensor/#",
} as const;

export const CHART_MAX_POINTS = 48;
