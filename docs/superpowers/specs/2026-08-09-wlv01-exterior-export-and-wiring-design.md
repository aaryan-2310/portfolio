# WLV-01 GLB Re-export + Exterior Toggle Wiring — Design

> **2026-08-09.** Covers: re-exporting the two GLBs from the live Blender scene (now including the
> radiator panels and cockpit side-hull fix from earlier today), and wiring the exterior-vessel
> toggle — which currently exists only in the Three.js reference build — into both the PlayCanvas
> lab build and the production Angular app.

## Why

`Ext_Radiator_*` (18 objects) and `Hull_Rib3_*`/`Hull_Side2_*`/`Hull_Side3_*`/`Hull_Beam3` (7 objects)
were added directly in the live Blender scene this session but never exported. The currently-shipped
`deck.glb` and `wlv01_exterior.glb` (in both `worldline-lab/shared/assets/` and
`src/assets/worldline/`, byte-identical copies) predate all of it.

Separately: `wlv01_exterior.glb` has never been rendered anywhere except the Three.js reference
build. Production (`src/app/worldline/`) and the PlayCanvas lab build
(`worldline-lab/playcanvas/main.ts`) have no exterior-vessel code at all.

## Part 1: Re-export

The Blender scene has two collections that map directly to the two GLBs:
- `Collection` (107 objects — everything except the exterior vessel: `Deck_*`, `Console_*`,
  `Hull_*`, `Seat_*`, `Trim_*`, `Cable_*`, `Stencil_*`, `HUD_*`, `BH_*`, plus `Camera_ExtReveal`
  and `Key_Star`) → export selected to `deck.glb`.
- `WLV01_EXTERIOR` (18 objects, all `Ext_*`) → export selected to `wlv01_exterior.glb`.

Export via `bpy.ops.export_scene.gltf(filepath=..., export_format='GLB', use_selection=True)` after
selecting each collection's objects. Copy both resulting files to **both** asset directories
(`worldline-lab/shared/assets/` and `src/assets/worldline/`) — they must stay byte-identical, same
as today.

**Risk**: a wrong export setting could subtly break geometry that already works (UV flip
direction, material export, curve-derived meshes), not just the new additions — this bit the
project before per the pending-items report's "curve→mesh phantom UV layer" note. Mitigation:
after export, visually verify **the whole scene**, not just the new geometry, in both engines
before treating this as done.

## Part 2: PlayCanvas wiring (lab + production, same logic in both)

Reference implementation: `worldline-lab/three/main.ts` (`EXT_CAM`, `exterior` group,
`setExteriorMode()`, lines 53–64 and 344–353). Porting, not redesigning:

- Load `wlv01_exterior.glb` into its own root entity, alongside the existing deck-GLB load,
  starting hidden (`enabled = false` on the PlayCanvas entity, mirroring Three.js's
  `exterior.visible = false`).
- Reuse the exact camera coordinates already proven in Three.js (both engines already share this
  convention — see the identical `BH_WORLD` value used in both):
  - `EXT_CAM = { pos: [-10.72, -3.07, 5.62], look: [0.05, 0.26, 11.84] }`
- Add an `exteriorMode` boolean alongside the existing `rig.engaged` state (both
  `worldline.service.ts` and `worldline-lab/playcanvas/main.ts` already have this `rig` object with
  a `{pos, look}` lerp/easing system driving `CAM.base` ↔ `CAM.focus`). `exteriorMode` becomes a
  third target using the same lerp: when on, target is `EXT_CAM`; when off, falls back to whichever
  of `CAM.base`/`CAM.focus` currently applies.
- On toggle: swap deck-root/exterior-root visibility (mirrors Three.js's
  `cockpit.visible = !on; exterior.visible = on`), and exit console-engaged state if currently
  engaged (mirrors Three.js's `if (on) setEngaged(false)`).
- Preload the exterior GLB alongside the deck GLB at startup, same as Three.js does — it's ~90KB,
  not worth the complexity of lazy-loading on first toggle.

## Part 3: Toggle UI

**Production** (`src/app/worldline/worldline.component.ts` currently has zero overlay UI — just a
bare canvas): add a small bespoke button, bottom-right corner, using the scene's own palette
(`C.amber` `#d9a648` idle, `C.teal` `#5fb8a8` when exterior mode is active — same teal already used
for the console "engaged" indicator, so the color language stays consistent with the 3D scene
itself rather than the site's global design tokens). Calls a new `toggleExterior()` method on
`WorldlineService`.

**PlayCanvas lab**: reuse the existing `hud.button('EXTERIOR VIEW', ...)` dev-HUD pattern already
used by Three.js (`MetricsHud` is shared across both lab builds) — no new UI needed.

## Verification plan

1. Re-export both GLBs; visually verify the **entire** scene (not just new geometry) still renders
   correctly in the Three.js lab build first, since it's the known-working baseline and the fastest
   way to catch an export regression before touching PlayCanvas or production.
2. Wire and verify PlayCanvas lab (`localhost:4330`, per the existing dev-server convention).
3. Wire and verify production (`ng serve` / `yarn start`, `/v2` route) — confirm the toggle button
   appears, click-toggles the view, camera transitions smoothly, and toggling back restores the
   cockpit view and any in-progress console-engaged state correctly.
4. Confirm the `node:worker_threads` dev-server issue (fixed earlier this session via
   `prebundle.exclude` in `angular.json`) doesn't regress — it shouldn't, since this change doesn't
   touch that config.

## Explicit non-goals

- No changes to the aft-section geometry, reveal-camera object, or anything else already covered
  by prior specs.
- No SSR/prerender/bundle-size work (tracked separately in the pending-items report).
- No changes to the CMS content-wiring gap (also tracked separately).
