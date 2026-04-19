# Home automation platform — overview & hosting

This document explains what the project is for in **day‑to‑day life**, whether it is a **proof of concept** or a **finished product**, and how it can relate to **your own website and hosting**.

---

## What kind of application is this?

This repo targets a **self‑hosted home automation system**: small computers at home (e.g. ESP32 boards) talk to a **message broker** (MQTT); a **backend API** registers users/devices and can relay commands; **mobile** and **web** apps are the control panels.

### How you would use it on a daily basis (when fully built)

| Scenario | What you do | What the system does |
|----------|-------------|----------------------|
| **Lights & plugs** | Tap a tile or use a scene | Relays on ESP32 boards turn circuits on/off; state is remembered where configured |
| **Sensors** | Glance at the app | Temperature, motion, door contact, etc. update in near real time |
| **Climate** | Set schedule or manual | Control HVAC‑related relays or thermostats (depending on wiring and firmware) |
| **Scenes** | One tap (“Good night”, “Away”) | Multiple devices change together |
| **Cameras** *(later phase)* | Open live view or playback | RTSP cameras via a gateway (WebRTC/HLS), not raw RTSP on the public internet |
| **Away from home** | Same app, signed in | Commands go through a **secure remote path** (API + tunnel/VPN), not open ports to MQTT |

None of that requires trusting a single cloud vendor for core control—you run the **hub** (broker + API) on hardware you control (Raspberry Pi, NAS, mini‑PC).

---

## Is this a POC or a “ready” project?

**Today, this repository is a foundation / Phase‑A scaffold, not a turnkey product.**

| Layer | Typical “ready for real homes” expectations | Current state in this repo |
|-------|---------------------------------------------|----------------------------|
| Broker (Mosquitto) | TLS, passwords/certs, topic ACLs | Password file + ACL in repo (default dev user `home`); anonymous disabled — still add **TLS** and rotate secrets for production |
| API | Auth (login), user/home registry, audit, rate limits | Fastify: health, MQTT subscribe with auth, SQLite telemetry + `/mqtt/snapshot` — **not** a full product API yet |
| Web app | Login, rooms, devices, safe CORS | Vite/React template — **dashboard not wired** to real features |
| Mobile | Flutter app, push notifications | Placeholder folder — **not implemented** |
| ESP32 firmware | Wi‑Fi, MQTT, topics, OTA, provisioning | ESP‑IDF PoC: Wi‑Fi + MQTT + telemetry/state topics; OTA and provisioning **not** done yet |

So: treat this as a **POC / starting point** you extend into a **production‑ready** system by following the phased plan (LAN MVP → cameras → cloud hybrid → automation). “Ready” means you complete those phases **and** security (TLS, secrets, VLANs, backups).

---

## Your own website and hosting — how they fit

Your **public website** (on shared hosting, VPS, or static host) and your **home automation hub** usually play **different roles**. They can still work together cleanly.

### 1. Recommended mental model

- **Public site** (`https://yoursite.com`): marketing, blog, contact, maybe a **login page** that only points to or redirects into the private control experience.
- **Home hub** (at your house): MQTT broker, API, recordings (if any), ESP devices. **This is where real‑time control and device secrets live.**

Trying to run the **broker** or **raw device traffic** on cheap shared hosting usually does not work well (always‑on sockets, MQTT, UDP/WebRTC). The usual pattern is **hub at home** + optional **cloud API** for accounts.

### 2. Practical integration patterns

**A. Link from your website (simplest)**  
Add a button: “Open home dashboard” linking to a URL that only works when you are allowed in:

- **Tailscale** or **WireGuard**: link opens `https://…` served only on your tailnet; or  
- **Cloudflare Tunnel** (or similar): `https://home.yoursite.com` → tunnel to your API/dashboard at home **with HTTPS** on the edge.

Your main site stays on your current host; you do **not** need to move the whole project there.

**B. Subdomain on your domain**  
Configure DNS:

- `yoursite.com` → your existing hosting (unchanged).  
- `home.yoursite.com` (or `app.yoursite.com`) → tunnel or VPS that forwards to the hub with **TLS**.

Users (you and family) bookmark the subdomain; visitors to the main site never see the control panel unless they have accounts and links.

**C. API on the host, hub at home (hybrid)**  
If you later deploy a **small auth/account service** on your VPS, it can issue tokens while the **home hub** still executes device commands (outbound connection from home to cloud, or VPN). This matches the “hybrid connectivity” idea in the architecture plan: **LAN for speed**, **remote path** when off‑network.

**D. What to avoid**  
- Exposing **MQTT (port 1883)** or **unauthenticated APIs** directly to the open internet.  
- Putting **device passwords** or **broker credentials** in public web pages or client‑side JS without a proper backend.

---

## Summary

- **Daily use**: A finished version of this stack is the app you open to **control your house**—lights, sensors, scenes, and later cameras—with optional secure remote access.  
- **Right now**: The repo is **POC / early scaffold**, not a packaged “install and forget” product until you implement phases and security.  
- **Your website**: Keep hosting your **public site** there; point **`home.` / `app.`** subdomains or VPN/tunnel solutions at your **home hub**, and use HTTPS and proper auth for anything exposed beyond the LAN.

For architecture detail and phased delivery, see the plan file you started from (`home_automation_platform_*.plan.md`).
