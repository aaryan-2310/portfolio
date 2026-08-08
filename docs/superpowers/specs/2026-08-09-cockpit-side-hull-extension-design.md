# Cockpit Side-Hull Extension — Design

> **2026-08-09.** Scoped, model-only fix to the cockpit deck (`worldline-lab/shared/assets/wlv01.blend`,
> same live scene as [2026-08-09-wlv01-exterior-radiators-design.md](2026-08-09-wlv01-exterior-radiators-design.md)).

## Why

The cockpit reads as "floating" — the floor and ceiling/beam look like two disconnected slabs with
nothing solid connecting them at the sides, in the exact area the camera is pointed at.

Confirmed by bounding-box inspection of the live Blender scene (checked 2026-08-09):

- `Deck_Floor` + `Hull_Floor_Ext` form a continuous floor from Y −5.20 to +2.60 — no gap.
- `Hull_Bulkhead` caps the aft end (Y ≈ −5.0).
- `Hull_Side_L`/`R` — flat side-skin panels — only exist for Y **−3.75 to −1.55** (2.2 units).
- `Deck_Pillar_L`/`R` — the window/dash framing — starts at Y **1.00**.
- **Nothing exists between Y −1.55 and +1.00** (a 2.55-unit gap) — which is exactly where
  `Seat_Pedestal`/`Seat_Cushion` (Y −0.98 to −0.58) and `Console_Desk_L`/`R` (Y −0.87 to −0.03) sit.
  This is the main seating/console area the camera actually looks at.

All furniture in this gap stays within X ±1.33; the hull walls sit at X ±2.5 to ±2.7, so there is no
collision risk anywhere in the fix below.

## Design

Reproduce the existing aft rib-then-skin structural rhythm (`Hull_Rib2_L`/`R` + `Hull_Beam2`,
followed by a flat `Hull_Side_L`/`R` skin panel) across the gap, rather than one unbroken flat slab:

**New rib hoop**, centered at Y ≈ **−0.275** (the gap's midpoint), same 0.44-unit width and same
X/Z profile as the existing aft rib hoop:
- `Hull_Rib3_L`: X[−2.73,−2.27] Z[−1.31,1.41] (mirrored for `_R`)
- `Hull_Beam3`: X[−2.45,2.45] Z[1.24,1.46], spanning the full width to connect the two ribs overhead

**Two new flat skin panels**, same X/Z profile as `Hull_Side_L`/`R` (X[−2.71,−2.53] / mirrored,
Z[−1.05,0.95]), differing only in Y span:
- `Hull_Side2_L`/`R`: Y −1.55 to −0.495 (from the existing `Hull_Side_L`/`R`'s end to the new rib)
- `Hull_Side3_L`/`R`: Y −0.055 to +1.00 (from the new rib to `Deck_Pillar_L`/`R`)

Both new panels are 1.055 units long — symmetric on either side of the new rib.

**Material**: reuse `Hull_Side_L`'s existing material. No new material.

## Verification plan

Same method as the radiator work — numeric bounding-box checks are authoritative
(`get_viewport_screenshot` was unreliable during the radiator session; treat any repeat of that as a
known tooling issue, not a task blocker):

1. Confirm all 7 new objects (`Hull_Rib3_L`, `Hull_Rib3_R`, `Hull_Beam3`, `Hull_Side2_L`, `Hull_Side2_R`,
   `Hull_Side3_L`, `Hull_Side3_R`) exist with the exact X/Z profiles specified above.
2. Confirm continuity: `Hull_Side_L`'s far edge (Y −1.55) meets `Hull_Side2_L`'s near edge (Y −1.55,
   same point) with no gap; `Hull_Side2_L`'s far edge (Y −0.495) meets `Hull_Rib3_L`'s near edge;
   `Hull_Rib3_L`'s far edge (Y −0.055) meets `Hull_Side3_L`'s near edge; `Hull_Side3_L`'s far edge
   (Y +1.00) meets `Deck_Pillar_L`'s near edge (Y +1.00) — i.e. the full Y −3.75 to +1.50 span down
   the left (and mirrored right) side has zero gaps once this is built.
3. Confirm no collision with `Seat_Pedestal`, `Seat_Cushion`, `Console_Desk_L`/`R`, or
   `Console_Riser_L`/`R` (all within X ±1.33, well inside the new geometry's X ±2.27 to ±2.73 range).

## Explicit non-goals (this session)

Model-only, same as the radiator work: no export to any GLB, no engine wiring, no changes outside
the live Blender scene.
