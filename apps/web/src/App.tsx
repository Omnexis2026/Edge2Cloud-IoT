import { useMemo, useState } from "react";
import { DeviceCard } from "./components/DeviceCard";
import { TelemetryChart } from "./components/TelemetryChart";
import { useMqttDashboard } from "./hooks/useMqttDashboard";

function connLabel(
  state: "idle" | "connecting" | "connected" | "reconnecting" | "error",
): string {
  switch (state) {
    case "connecting":
      return "Connecting…";
    case "connected":
      return "Live";
    case "reconnecting":
      return "Reconnecting…";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}

export default function App() {
  const [mqttOn, setMqttOn] = useState(true);
  const [simulate, setSimulate] = useState(false);

  const { conn, lastError, devices, series, brokerUrl } = useMqttDashboard(
    mqttOn,
    simulate,
  );

  const deviceList = useMemo(
    () =>
      [...devices.values()].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [devices],
  );

  const chartEmpty =
    simulate || !mqttOn
      ? "Start the broker or enable MQTT to stream sensor data here."
      : conn === "connected"
        ? "Publish to devices/{id}/sensor/temperature|humidity to plot values."
        : "Waiting for broker…";

  return (
    <div className="dash">
      <header className="dash__header">
        <div>
          <p className="dash__eyebrow">Home IoT</p>
          <h1 className="dash__title">Dashboard</h1>
          <p className="dash__subtitle">
            Device health and live telemetry. Browser clients use the broker{" "}
            <strong>WebSocket</strong> listener (port <code>9001</code>).
          </p>
        </div>
        <div className="dash__header-actions">
          <span
            className={`conn-pill conn-pill--${conn}`}
            title={lastError ?? undefined}
          >
            <span className="conn-pill__dot" aria-hidden />
            {connLabel(conn)}
          </span>
        </div>
      </header>

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Connection</h2>
          <p className="panel__desc">
            MQTT over WebSockets: <code className="inline-code">{brokerUrl}</code>
          </p>
        </div>
        <div className="controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={mqttOn}
              onChange={(e) => {
                setMqttOn(e.target.checked);
                if (e.target.checked) setSimulate(false);
              }}
            />
            Connect to broker
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={simulate}
              onChange={(e) => {
                setSimulate(e.target.checked);
                if (e.target.checked) setMqttOn(false);
              }}
            />
            Simulate chart (offline demo)
          </label>
        </div>
        {lastError && mqttOn && (
          <p className="panel__error" role="alert">
            {lastError}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Devices</h2>
          <p className="panel__desc">
            Subscribes to <code className="inline-code">devices/+/status</code> and{" "}
            <code className="inline-code">devices/+/sensor/#</code>. Example: publish{" "}
            <code className="inline-code">{"{\"name\":\"Kitchen\",\"online\":true}"}</code>{" "}
            to <code className="inline-code">devices/kitchen/status</code>.
          </p>
        </div>
        {deviceList.length === 0 ? (
          <p className="muted">
            No devices yet. When firmware publishes status, cards appear here.
          </p>
        ) : (
          <div className="device-grid">
            {deviceList.map((d) => (
              <DeviceCard key={d.id} device={d} />
            ))}
          </div>
        )}
      </section>

      <section className="panel panel--chart">
        <div className="panel__head">
          <h2 className="panel__title">Live telemetry</h2>
          <p className="panel__desc">
            Numeric payloads on{" "}
            <code className="inline-code">devices/&lt;id&gt;/sensor/temperature</code>{" "}
            and <code className="inline-code">…/humidity</code> update the chart.
          </p>
        </div>
        <TelemetryChart
          data={series}
          emptyHint={
            series.length === 0 ? chartEmpty : ""
          }
        />
      </section>
    </div>
  );
}
