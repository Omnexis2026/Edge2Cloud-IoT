# Home automation platform (monorepo)

Self‑hosted IoT stack: **ESP32** devices, **MQTT** broker, **Node API**, **React** web app, and (planned) **Flutter** mobile — see **[docs/project-overview.md](docs/project-overview.md)** for:

- What this is for in **daily use**
- **POC vs production‑ready** (current status)
- How to combine this with **your existing website and hosting**

## Quick layout

| Path | Role |
|------|------|
| `firmware/esp32/` | ESP‑IDF firmware (PlatformIO); Wi‑Fi + MQTT to Mosquitto |
| `services/broker/` | Mosquitto config, ACL, `passwd` (MQTT auth — change defaults for production) |
| `services/api/` | Backend API |
| `apps/web/` | Web dashboard (Vite + React) |
| `apps/iot-web/` | Secure IoT dashboard UI (served under `/iot`) |
| `services/iot-api/` | Express API: JWT auth, protects `/iot` and `/api/iot/*` |
| `apps/mobile/` | Mobile app (placeholder until Flutter is added) |
| `infra/` | `docker-compose.yml` for broker + API |

## Run locally (Docker)

After cloning, create the broker password file (ignored by git so your own hashes are never pushed):

```bash
copy services\broker\passwd.example services\broker\passwd
```

On macOS/Linux: `cp services/broker/passwd.example services/broker/passwd`. To use a different MQTT password, regenerate with `mosquitto_passwd` and set matching values in `infra/.env` and firmware menuconfig.

```bash
docker compose -f infra/docker-compose.yml up --build
```

API: `http://localhost:3000/health` — MQTT: `1883`, WebSockets: `9001`. The broker **requires** username/password (default user `home` / password `home-dev-change-me`, overridable via `infra/.env` and `services/broker/passwd`). Telemetry is stored in SQLite (`api_data` volume in Docker). Recent rows: `http://localhost:3000/mqtt/snapshot`.

### ESP32 firmware (ESP‑IDF)

From `firmware/esp32`: install [PlatformIO](https://platformio.org/), set Wi‑Fi and broker URI to your **PC’s LAN IP** (not `localhost`) and port `1883`, then build and flash:

```bash
pio run -t menuconfig   # HA_WIFI_* , HA_MQTT_BROKER_URI , HA_MQTT_USERNAME , HA_MQTT_PASSWORD (match broker)
pio run -t upload
pio device monitor
```

The API subscribes to `home/+/device/+/telemetry` and `home/+/device/+/state` so you can confirm traffic via `/mqtt/snapshot` or Docker logs for `infra-api-1`. To change the MQTT password, regenerate `services/broker/passwd` with `mosquitto_passwd`, update `infra/.env`, flash matching credentials on the ESP, and restart the stack.

### Secure IoT dashboard (`/iot`)

1. Create `services/iot-api/.env` from `services/iot-api/.env.example` (set `JWT_SECRET`, `IOT_AUTH_USERNAME`, `IOT_AUTH_PASSWORD_HASH` from `npm run hash-password`).
2. Build the React app: `cd apps/iot-web && npm install && npm run build`.
3. Run the API with the built UI: `cd services/iot-api && set IOT_WEB_DIST=..\..\apps\iot-web\dist` (Windows) or `IOT_WEB_DIST=../../apps/iot-web/dist` (Unix), then `npm run dev` or `npm start` after `npm run build`.

Docker: `docker compose -f infra/docker-compose.yml up --build iot-api` — set `JWT_SECRET`, `IOT_AUTH_USERNAME`, and `IOT_AUTH_PASSWORD_HASH` in `infra/.env` (see `infra/.env.example`). Then open `http://localhost:4010/iot/login`.

## API dev without Docker

```bash
cd services/api
cp .env.example .env   # set MQTT_USER / MQTT_PASSWORD (or MQTT_URL) to match broker
npm install
npm run dev
```

---

More detail: ** [docs/project-overview.md](docs/project-overview.md)**.
