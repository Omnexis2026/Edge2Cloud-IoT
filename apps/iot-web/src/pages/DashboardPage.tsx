import { useEffect, useState } from "react";
import { fetchDevices, fetchLivePlaceholder } from "../api.js";
import { useSession } from "../session.js";

export function DashboardPage() {
  const { user, logout } = useSession();
  const [devices, setDevices] = useState<
    {
      id: string;
      name: string;
      online: boolean;
      lastSeen: string;
      rssi: number | null;
    }[]
  >([]);
  const [liveMsg, setLiveMsg] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [d, l] = await Promise.all([
          fetchDevices(),
          fetchLivePlaceholder(),
        ]);
        if (cancelled) return;
        setDevices(d.devices);
        setLiveMsg(l.message);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Signed in</p>
          <h1 className="title title--sm">IoT dashboard</h1>
          <p className="muted">Welcome, {user?.username}</p>
        </div>
        <button className="btn btn--ghost" type="button" onClick={() => void logout()}>
          Log out
        </button>
      </header>

      {err && (
        <p className="error banner" role="alert">
          {err}
        </p>
      )}

      <section className="panel">
        <h2 className="h2">Device status</h2>
        <div className="grid">
          {devices.map((d) => (
            <article key={d.id} className={`tile ${d.online ? "tile--on" : ""}`}>
              <div className="tile__head">
                <span className="dot" aria-hidden />
                <h3 className="tile__title">{d.name}</h3>
              </div>
              <p className="mono muted">{d.id}</p>
              <dl className="dl">
                <div>
                  <dt>State</dt>
                  <dd>{d.online ? "Online" : "Offline"}</dd>
                </div>
                <div>
                  <dt>Last seen</dt>
                  <dd>{new Date(d.lastSeen).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>RSSI</dt>
                  <dd>{d.rssi != null ? `${d.rssi} dBm` : "—"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="h2">Live data</h2>
        <div className="placeholder">
          <p className="muted">{liveMsg || "Loading…"}</p>
          <div className="chart-ph" aria-hidden />
        </div>
      </section>
    </div>
  );
}
