# WLV-01 Exterior Radiator Panels — Design

> **2026-08-09.** Scoped, model-only addition to the exterior vessel (`WLV01_EXTERIOR` collection
> in `worldline-lab/shared/assets/wlv01.blend`). Read
> [2026-08-08-worldline-pending-items.md](2026-08-08-worldline-pending-items.md) first for full
> context on the exterior vessel's current state.

## Why

The original brief and command-deck plan both call for radiator panels ("×2, flanking") on the
exterior vessel. The pending-items report describes them as built, then repositioned after a bug
where they occluded the ship's side silhouette. In the live Blender scene (checked 2026-08-09),
**no `Ext_Radiator*` object exists at all** — they are missing entirely, not just misplaced. This
spec covers building them from scratch, designed from the start to avoid the documented occlusion
bug.

## Constraint driving the design

`Camera_ExtReveal` (the hero reveal shot) sits well off to one side of the vessel — Blender
location `(-10.72, -5.62, -3.07)` vs. vessel center `(0.05, -11.84, 0.26)`, i.e. offset roughly
`(-10.77, +6.22, -3.33)` from center. That's a strongly side-on, slightly-forward, slightly-below
angle. Any large flat panel facing radially outward (perpendicular to the ship's long axis, which
is Y) risks presenting a big flat face directly to this camera — the exact failure mode described
in the pending-items report. The design below avoids this by keeping each individual panel's long
axis parallel to Y (fore-aft), so a side-on view sees them edge-on.

## Design: louvered strip

**Placement**: two symmetric strips flanking the spine (`Ext_Spine`, radius ~1.10), running
fore-aft along Y from **−8 to −13** (5 units). This sits cleanly between the forward RCS cluster
(~Y −5.2 to −6.6, near the docking collar) and the aft fairing (~Y −14.0 to −15.5), with margin on
both sides so nothing collides.

- Mounted at X ≈ ±1.3 to ±1.5 — just outside the spine's radius, similar offset to the existing
  RCS thruster clusters.
- **9 slats per side** (18 total), evenly spaced along the 5-unit run.
- Each slat: ~0.5 units long (Y) × ~0.35 wide (Z) × ~0.04 thick, canted ~15° off the hull surface
  (louvered, not flat-on) — visually similar in scale/density to the console
  toggle/knob greebling already on the cockpit deck (`Console_Toggle_*`, `Console_Knob_*`).
- Mounted on a thin backing rail against the spine surface (not free-floating).

**Material**: reuse the existing hull metal material shared by `Ext_Spine` / `Ext_EngineHousing`.
No new material — this is a pure geometry addition.

**Naming**: `Ext_Radiator_L_0`..`8` and `Ext_Radiator_R_0`..`8`, matching the existing
`Ext_RCS_Aft_L_0`-style convention used elsewhere in the exterior collection.

## Verification plan

The `get_viewport_screenshot` MCP tool returned byte-identical images across three different
camera/view setups during this session's investigation — a real, currently-unresolved tooling
issue, not evidence that the scene is static. Verification for this task will rely on:

1. Numeric bounding-box checks (as used to assess the aft section earlier) to confirm no overlap
   with the RCS clusters, docking collar, or aft fairing, and confirm the panels sit outside the
   spine's radius without penetrating it.
2. Re-attempting a visual screenshot after the build, on the chance the caching issue was
   transient. If it still fails, that's a separate, out-of-scope tooling problem to flag, not a
   blocker for this task.

## Explicit non-goals (this session)

Per direct confirmation: **model-only**. This spec does not cover:
- Exporting the updated geometry to `wlv01_exterior.glb`
- Wiring the exterior toggle into PlayCanvas (lab or production) or Three.js
- Any change to `worldline-lab/three/main.ts`, `worldline-lab/playcanvas/main.ts`, or
  `src/app/worldline/*`

Those remain open items on the pending-items list, to be picked up in a future session.
