# Burglar / intrusion zones (NC loops) — wiring and firmware

This document describes **Normally Closed (NC)** wired zones suitable for **door/window magnetic contacts** and **PIR NC outputs** (verify your sensor is **NC** — many PIRs are **open‑collector** or **relay**; match the interface).

## Electrical model (secure vs alarm)

Typical wired alarm: loop is **closed** when secure and **opens** on intrusion or cut cable (depending on EOL wiring).

For a **simple** GPIO interface (one contact to GND):

| Condition | Loop | GPIO (with internal pull‑up **enabled**) |
|-----------|------|------------------------------------------|
| Secure | Closed | **LOW** |
| Alarm / cut | Open | **HIGH** |

Firmware in this repo treats **HIGH** as **alarm** when pull‑up is enabled (see `burglar_zones.c`).

## End‑of‑line (EOL) resistors (recommended)

Professional panels use **EOL** networks so the panel can distinguish **short** vs **open** vs **normal**. A full EOL design is **not** implemented in the sample firmware (it is **binary** per zone). For production, consider:

- A **panel‑grade** zone input with **analog** or **multi‑threshold** measurement, or
- Off‑the‑shelf **burglar zone interface** modules that output a **clean dry contact** to the ESP32.

## Tamper

- **Enclosure tamper**: separate NC loop in series or parallel per your standard; wire to its own GPIO or combine logically in firmware later.

## Pin mapping

Configure in **menuconfig** under “Burglar zones”:

- `CONFIG_HA_BURGLAR_ENABLE`
- `CONFIG_HA_ZONE0_GPIO` … `CONFIG_HA_ZONE3_GPIO` — set to **GPIO number** or **−1** to disable a slot.

**Important:** Avoid strapping pins used for **flash / JTAG** on your specific module; consult your **ESP32‑DevKitC** (or your board) pinout.

## Telemetry format (optional module)

Published on the existing **telemetry** topic as JSON, e.g.:

```json
{"uptime_ms":12345,"zones":[{"id":0,"ok":true},{"id":1,"ok":false}]}
```

`ok: false` means **not secure** (alarm / open loop) for that zone.

## Safety

- **Do not** connect **mains‑powered** PIRs directly to ESP32 GPIO. Use the sensor’s **rated** low‑voltage output or a **relay**.
