# Hardware — PCBs, electric‑board deployment, burglar zones

This folder describes **how to mount and wire** a home‑automation controller next to (or inside) a **domestic distribution board** in a **plug‑and‑play** way: clear separation between **mains** and **extra‑low voltage**, labeled terminals, and test points so you can commission safely.

## What is here

| Path | Purpose |
|------|---------|
| [SAFETY_AND_COMPLIANCE.md](SAFETY_AND_COMPLIANCE.md) | **Read first.** Mains rules, separation, who may install what. |
| [electric-board-deployment.md](electric-board-deployment.md) | Enclosure, DIN rail, routing, commissioning checklist. |
| [circuits/home-automation-controller.md](circuits/home-automation-controller.md) | Block diagram, power tree, relay outputs, interfaces to this repo’s ESP32 firmware. |
| [circuits/burglar-alarm-zones.md](circuits/burglar-alarm-zones.md) | Intrusion **NC zones**, tamper, EOL wiring, GPIO mapping (optional `firmware/esp32` burglar module). |
| [bom/home-automation-controller-bom.csv](bom/home-automation-controller-bom.csv) | Suggested BOM for a **low‑voltage control board** (order parts to match your region and electrician’s spec). |

## Relationship to software in this repo

- **ESP32 firmware** (`firmware/esp32/`): Wi‑Fi + MQTT topics `home/{homeId}/device/{deviceId}/…`. Optional **burglar zone** inputs publish JSON on the **telemetry** topic when enabled in menuconfig.
- **Backend / dashboards**: consume telemetry and commands as you extend the API and UI.

## “Plug and run” meaning

Here it means: **documented connectors**, **one documented low‑voltage supply**, **labeled field wiring**, and **factory/ bench tests** before energizing loads — not “unbox and touch live mains without an electrician.”
