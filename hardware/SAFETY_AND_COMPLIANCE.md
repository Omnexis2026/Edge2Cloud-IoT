# Safety and compliance (mandatory reading)

This project mixes **extra‑low voltage (ELV)** electronics with documentation that may be used **near mains distribution equipment**. Incorrect work can cause **fire, shock, injury, or death**.

## Non‑negotiable rules

1. **Mains work** (anything on the building’s fixed installation side of a breaker, including breaker terminals and outgoing circuits) must be performed **only** by a **qualified person** according to **local electrical regulations** (e.g. national wiring rules, periodic inspection, RCD/RCBO requirements).
2. **Do not** route LV sensor or data cables in the same cable bundle as mains conductors **without** following separation rules for your jurisdiction (ducts, insulation, spacing, and fire performance).
3. **Relays controlling mains loads** must use **approved** modules or contactors rated for the **voltage, current, and load type** (resistive vs inductive vs capacitive). Inductive loads (motors, some LED drivers) need appropriate **suppression** where required.
4. **Earthing and bonding**: follow local rules. Any metal enclosure that can become live under fault must be **properly earthed** when your installation requires it.
5. **Burglar / intrusion wiring**: treat **bell / siren** and **mains‑powered** panels per the same rules as above. **Battery‑only** external sounders still have installation constraints (height, tamper, environment).

## What this repository provides

- **Design guidance** and **example low‑voltage interfaces** for an ESP32‑class controller.
- **No certification**: PCB layouts, BOMs, and diagrams are **examples** until you have them reviewed for **your** region, supply voltage, and installation class.

## Recommended architecture for a safe “panel‑adjacent” build

- **Mains section**: breakers, RCDs/RCBOs, utility meter — **untouched** by hobby PCBs.
- **Approved switching**: relay modules or contactors on **DIN rail** with **screw terminals** and **clear ratings**.
- **ELV section**: 5 V / 3.3 V supply derived from a **safety‑isolated** adapter or a **SELV** circuit designed per standards, in a **separate** compartment or enclosure zone.
- **Clear barrier** between mains and ELV: physical partition, strain relief, and **labels**.

If you are unsure, **stop** and involve a licensed electrician before energizing.
