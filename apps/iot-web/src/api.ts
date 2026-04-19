const API = "/api/iot";

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? res.statusText);
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchMe(): Promise<{ username: string } | null> {
  const res = await fetch(`${API}/auth/me`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Session check failed");
  const data = (await res.json()) as { user: { username: string } };
  return data.user;
}

export async function fetchDevices(): Promise<{
  devices: {
    id: string;
    name: string;
    online: boolean;
    lastSeen: string;
    rssi: number | null;
  }[];
}> {
  const res = await fetch(`${API}/devices`, { credentials: "include" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to load devices");
  return res.json() as Promise<{
    devices: {
      id: string;
      name: string;
      online: boolean;
      lastSeen: string;
      rssi: number | null;
    }[];
  }>;
}

export async function fetchLivePlaceholder(): Promise<{
  message: string;
  series: { t: string; value: number }[];
}> {
  const res = await fetch(`${API}/live`, { credentials: "include" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to load live data");
  return res.json() as Promise<{
    message: string;
    series: { t: string; value: number }[];
  }>;
}
