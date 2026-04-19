import type { DeviceInfo } from "../hooks/useMqttDashboard";

type Props = {
  device: DeviceInfo;
};

function formatAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function DeviceCard({ device }: Props) {
  const ok = device.online;
  return (
    <article className={`device-card ${ok ? "device-card--online" : ""}`}>
      <div className="device-card__head">
        <span
          className="device-card__dot"
          aria-hidden
          title={ok ? "Online" : "Offline"}
        />
        <h3 className="device-card__title">{device.name}</h3>
      </div>
      <p className="device-card__id">{device.id}</p>
      <dl className="device-card__meta">
        <div>
          <dt>Signal</dt>
          <dd>
            {device.rssi != null ? `${device.rssi} dBm` : "—"}
          </dd>
        </div>
        <div>
          <dt>Last seen</dt>
          <dd>{formatAgo(device.lastSeen)}</dd>
        </div>
      </dl>
    </article>
  );
}
