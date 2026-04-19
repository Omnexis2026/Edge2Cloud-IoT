# Deploying the controller at the electric distribution board

Goal: a **repeatable** installation that an electrician can **inspect**, and that you can **swap** without rewiring the whole home.

## 1. Physical layout

| Element | Recommendation |
|---------|----------------|
| Enclosure | IP rating suitable for the location (garage vs habitable room); **metal** only with correct earthing if used near mains gear. |
| Separation | **Two zones** inside the enclosure: **mains / power switching** and **ELV logic** (ESP32, 5 V, sensors). Use an insulating partition or a **second** small enclosure snapped on DIN rail for ELV only. |
| DIN rail | Mount **RCBOs/MCBs**, **relay/contactors**, and **terminal blocks** on rail; keep **ESP32 PCB** off the mains rail unless it is a **certified** mains‑integrated product (usually it is not). |
| Service | Leave space for **cable bends**, **torque‑driver** access, and **future** expansion. |

## 2. “Plug and run” interfaces (field side)

Design the PCB or terminal block so that **field wiring** only goes to:

- **Mains out** (via electrician‑installed relay/contactors): labeled `L_OUT_x`, `N_OUT_x` if switching line‑neutral together is required by design.
- **ELV inputs**: `+5V`, `GND`, `ZONEx` (burglar NC loops), `GPIOx` for buttons or dry contacts.
- **Data**: no Ethernet on the minimal ESP32 PoC — Wi‑Fi only; plan **external antenna** placement if the enclosure is metal (attenuation).

Use **detachable** plugs (e.g. pluggable terminal blocks) only if they are **rated** for the wire gauge and **certified** for your use case.

## 3. Powering the ELV side

Preferred options:

1. **External 5 V USB adapter** (isolated) feeding only the ELV compartment through a **grommet** — simplest and easy to replace.
2. **DIN rail 5 V SELV supply** fed from a **dedicated** breaker — still requires correct design and installation by a qualified person.

**Never** tap 5 V from arbitrary mains nodes without a proper supply module.

## 4. Commissioning checklist (before loads are enabled)

- [ ] **No mains** on the relay outputs until **continuity** and **insulation** checks pass per local practice.
- [ ] **Verify** GPIO inputs with a multimeter: **NC zone closed** = expected idle voltage; **open** = alarm state.
- [ ] **MQTT** connects with **non‑default** credentials in production; device shows **online** state topic.
- [ ] **Firmware** `HOME_ID` matches broker ACLs and dashboards.
- [ ] **Label** the device ID (MAC‑based topic suffix) on the enclosure lid.

## 5. Maintenance

- Power down **mains** side before opening the mains zone; ELV can often be powered from a **separate** plug for safe firmware updates.
- Document **which breaker** feeds the ELV supply and the **relay** circuits.
