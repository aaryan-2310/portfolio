# WORLDLINE / WLV-01 — Progress & Pending Items Report

> **Updated 2026-08-08 (session 2).** This document supersedes the previous version.
> Read this first in any continuation session.

## Read these first, in order

1. [2026-08-08-worldline-brief.md](2026-08-08-worldline-brief.md) — the original master brief (verbatim from Aryan). All design decisions trace back to this.
2. [2026-08-08-worldline-tech-decisions.md](2026-08-08-worldline-tech-decisions.md) — round 1/2 rendering-engine bake-off. **Engine decision made: PlayCanvas is production.**
3. [2026-08-08-worldline-command-deck-plan.md](2026-08-08-worldline-command-deck-plan.md) — the phased plan for the command-deck, including two reversed architecture decisions (don't re-litigate).
4. [2026-08-08-wlv-01-design-brief.md](2026-08-08-wlv-01-design-brief.md) — real web research (NASA/Starship/Shuttle reference images, downloaded and examined).
5. **This document.**

## Critical context: decisions made this session

- **Engine: PlayCanvas** — chosen over Three.js as the production engine. `CameraFrame` was
  disabled because `postEffects` (required for lensing) is incompatible with frame passes.
  ACES tonemapping is set directly on the camera component instead. Bloom is missing (tradeoff).
- **Black hole**: BUILT — real Blender geometry (Blackbody-node colored via Shakura-Sunyaev
  T(r) profile + Novikov-Thorne inner gap). Lensing shader implemented in BOTH engines using
  α = 2r_s/b (Schwarzschild weak-field). Texture baked to 128×128 PNG (11 KB). ✓
- **HUD panels**: BUILT — 4 flat-plane meshes in Blender (HUD_Timeline, HUD_Constellation,
  HUD_Journal, HUD_System), content data in `shared/content.ts`, canvas textures wired in both
  engines. ✓
- **Exterior vessel**: BUILT and WIRED — `wlv01_exterior.glb` exported, toggle via EXTERIOR
  VIEW button in Three.js. Hero reveal camera at az=30° el=-15° fill=75% stored on
  `Camera_ExtReveal` object in Blender. ✓

## Resource map — exact paths

All paths relative to worktree root: `C:\usr\workspace\personal\portfolio\.claude\worktrees\eloquent-cerf-48a582\`

| What | Path |
|---|---|
| Dev server (run once) | `yarn --cwd worldline-lab dev` → `localhost:4330` |
| **Production engine** | `worldline-lab\playcanvas\main.ts` |
| Three.js reference build | `worldline-lab\three\main.ts` |
| Shared scene constants | `worldline-lab\shared\spec.ts` |
| Shared content data (missions, timeline, journal, system) | `worldline-lab\shared\content.ts` |
| HUD/metrics overlay | `worldline-lab\shared\hud.ts` |
| **Cockpit GLB** (deck + BH + HUD panels + stencils) | `worldline-lab\shared\assets\deck.glb` (~1.1 MB) |
| **Exterior GLB** | `worldline-lab\shared\assets\wlv01_exterior.glb` (~85 KB) |
| **BH emission texture** | `worldline-lab\shared\assets\bh_disk_emit.png` (11 KB) |
| Blender source | `worldline-lab\shared\assets\wlv01.blend` |
| Reference images | `C:\Users\U6077517\AppData\Local\Temp\claude\...\scratchpad\refs\` |
| Design docs | `docs\superpowers\specs\` |

## Current state — what's actually built and verified (session 2 complete)

### Cockpit / command deck (in `deck.glb`)
- Third-person camera, faceted bay window, seat with frame rails, console desks with overhead
  panels and second panel, cable runs, amber trim, hull rib. All verified in both engines.
- `Console_Interact` click-to-engage (camera fly-in, amber→teal, MISSION 002 text) — verified.
- **Panel/hatch stenciling**: `WLV 01` and `WLV 02` on left/right pillar inner faces (near
  base); `03` on `Console_Interact_Bezel` top edge. Small, restrained, Starship-style.
- **HUD panels** (4 flat planes): Timeline, Constellation, Journal, System — canvas textures
  drawn from `shared/content.ts` data. 4/4 wired and rendering in both engines.

### Black hole (in `deck.glb`, visible through cockpit window)
- `BH_EventHorizon` sphere at r_s = 2.0 (Schwarzschild radius). Pure black absorber material.
- `BH_AccretionDisk` annulus, r_ISCO=6.0 to r_out=40.0, 15° tilt (same as Interstellar's
  Gargantua), Novikov-Thorne thin-disk scale height h/r≈0.03. 48 rings × 128 segments.
- Material: Shakura-Sunyaev T(r) ∝ (r/r_ISCO)^(−3/4) × NT inner-gap correction, Doppler
  beaming g^4 with β = √(r_s/2r), baked to 128×128 sRGB PNG. T: 9500K inner → 2290K outer.
- **GR lensing shader** in BOTH engines: α = 2r_s/b, δu = 2·r_s²·d/|d|², photon sphere
  (1.5·r_s) renders black. BH screen pos projected per-frame from world coords.
- PlayCanvas: lensing runs as `camera.postEffects` (CameraFrame disabled). Three.js: `ShaderPass`
  between `RenderPass` and `UnrealBloomPass`.
- BH world pos: Three.js (−6, 3, −75) = Blender (−6, 75, 3).

### Exterior vessel (in `wlv01_exterior.glb`)
- Hull: mid-spine + shell, docking port (NASA NDS 800mm), radiators, aft engine assembly.
- **Aft fairing** (`Ext_AftFairing`): 8-sided frustum, r=1.45, wraps engine mount cluster.
  Replaces the strut-jumble that was the known blocker from session 1.
- **Hero reveal camera** (`Camera_ExtReveal`): az=30°, el=−15°, fill=75%, 35mm, stored on
  Camera_ExtReveal object in Blender. Vessel center (0.05, −11.84, 0.26) Blender.
- **Wired in Three.js**: `EXTERIOR VIEW` button toggles cockpit/exterior — DRAWS 238→39.
  Camera transitions to `EXT_CAM` pos in Three.js coords: (−10.72, −3.07, 5.62).
- **Not yet wired in PlayCanvas** — exterior toggle only in Three.js currently.

### Dev overlay / HUD
- Title bar click collapses/expands the metrics body (`shared/hud.ts`).
- Planet removed from both engines — black hole is the only deep-space object.

## Pending tasks, in priority order

### 1. Angular integration + routing (NEXT)
- `angular-three@4.x` requires Angular ≥20; this repo is on **Angular 19** — CONSTRAINT.
- PlayCanvas has no equivalent constraint. Integration path: load PlayCanvas as an ES module
  inside an Angular component; the `<canvas>` is the mount point.
- Route `/` → Angular shell (layout, nav) wrapping the PlayCanvas 3D viewport.
- The `worldline-lab/playcanvas/main.ts` logic needs to be ported into an Angular service or
  component (or simply bootstrapped in `ngAfterViewInit` against the canvas element).

### 2. Portfolio CMS content wiring
- `shared/content.ts` currently has hardcoded data. The real data lives in the CMS backend
  (Spring Boot API, already running in the sibling portfolio project).
- The Angular service layer (`src/app/core/services/`) already fetches projects and blogs via
  HTTP. Wire those into `shared/content.ts` equivalents so the HUD panels show live data.

### 3. Exterior vessel toggle in PlayCanvas
- `setExteriorMode()` only exists in `three/main.ts`. Port it to `playcanvas/main.ts`.
- The exterior GLB (`wlv01_exterior.glb`) needs to be loaded and the visibility toggle wired.

### 4. Bloom restoration in PlayCanvas
- CameraFrame was disabled to unblock lensing. Bloom quality degraded.
- Option: implement a simple Unreal-bloom-style PostEffect in the postEffects chain, after
  the lensing pass. `pc.BloomEffect` was not present in the current build — may need a custom
  shader pass or a newer PlayCanvas build.

### 5. SSR/prerender + mobile performance + bundle size
- Explicitly deferred per the original brief §32. No work started.
- PlayCanvas bundle at production will be large — needs code-splitting or lazy loading.

### 6. Angular ≥20 upgrade (blocking angular-three if Three.js is ever re-evaluated)
- Currently on Angular 19. `angular-three@4.x` requires ≥20.
- Only relevant if Three.js replaces PlayCanvas at a future decision point.

## Known unresolved technical notes (carry forward from session 1)

- **UV flip**: Three.js GLTFLoader needs `repeat.set(1,-1)` on display textures; PlayCanvas
  does NOT — verified empirically. Don't assume a fix transfers.
- **PlayCanvas `CameraFrame` ↔ `postEffects` conflict**: frame passes and postEffects scripts
  are mutually exclusive. Lensing works only after CameraFrame is removed. Document this if
  bloom is re-added via postEffects.
- **Blender curve→mesh UV bug**: `foreach_get length mismatch` on glTF export is caused by a
  phantom UV layer from curve→mesh conversion. Fix: clear `mesh.uv_layers` before export.
- **`bpy.ops.object.select_all` poll error**: use `obj.select_set(bool)` per-object instead.
- **Browser console stale cross-navigation history**: PlayCanvas errors can persist in the
  console after navigating to Three.js. Check timestamps before treating an error as current.
- **BH disk texture baked at 128×128 sRGB PNG** — stored at
  `worldline-lab\shared\assets\bh_disk_emit.png`. If Blender is re-opened and the disk
  material rebuilt from nodes, re-bake this texture before exporting deck.glb.
- Faceted multi-panel bay window (6 trapezoidal panes, domed taper, structural mullions) —
  replaces the old flat pane. Verified with planet/starfield showing through correctly in both
  engines.
- Seat: cushion, reclined back, headrest, pedestal, armrests — **plus this session's addition**:
  exposed frame rails around the padding + a numbered adjustment rail, per the real NASA Orion
  mockup finding. **Visually verified as present but not closely judged** — the seat is backlit
  from the main camera angle, so fine detail is hard to confirm without a dedicated close-up
  screenshot (not yet taken).
- Console desks (×2, flanking the seat): angled desktop surface, rotary knobs, slider, button
  cluster, riser to floor — **plus this session's addition**: a second overhead panel per desk
  (angled down, with switches), per the real Shuttle flight-deck finding that controls surround
  the operator from multiple angles. **Same caveat as seat** — added but not closely verified.
- `Console_Interact` — the real interactive console (right desk). Click-to-engage flies the
  camera in, swaps screen text idle↔engaged, changes light color amber→teal. **Fully verified
  working** in both engines, including the actual pixel-precision debugging that found and fixed
  two real bugs (UV-flip direction differs per engine; `CameraFrame` needs its own
  `sceneColorMap` setting, not the plain camera component's).
- Hull extension behind the seat (second rib, tapering side walls, rear bulkhead) — encloses the
  third-person camera instead of it floating past the floor's edge. Sits entirely behind camera,
  doesn't affect the main shot.
- Bevels + integrated amber trim lighting (dash edge, pillar edges, console edges, beam
  underside) — real emissive geometry, single accent hue.
- Two restrained cable runs (console→pedestal, console→dash) — **added this session**, exported
  successfully after fixing a real bug (curve→mesh conversion left a malformed UV layer that
  crashed the glTF exporter; fixed by clearing the phantom UV layer).

### Exterior vessel (WLV-01) — separate Blender collection `WLV01_EXTERIOR`, **NOT exported, NOT wired into deck.glb, NOT visible in either engine**
- Mid-spine with a wrapping hull shell (tapered cylinder) — fixed a real silhouette bug where the
  spine was bare struts with no continuous hull form.
- Docking port, sized to the real NASA NDS standard (800mm / 0.8m).
- Radiator panels (×2, flanking) — repositioned after a real bug where they occluded the whole
  profile silhouette from the side.
- Aft propulsion: engine housing + nozzle with real strut mounting (not a floating glow), RCS
  thruster clusters at the four extremities.
- **Known unfinished**: the aft section (engine mounts + RCS cluster) still reads as a jumble of
  struts, not a clean taper — last screenshot confirmed this, not yet fixed.
- **No exterior camera/reveal shot built** — this geometry has never been seen by anyone except
  via ad-hoc Blender viewport screenshots taken during construction.

### Research
- `2026-08-08-wlv-01-design-brief.md` — real research, 4 images actually downloaded and visually
  examined (not fabricated observations), plus real text research on Expanse/BSG/For All
  Mankind/Interstellar production philosophy. Grounded 3 concrete cockpit changes (seat frame,
  multi-angle console, cable runs) — all 3 implemented this session (see above).
- **Not yet applied**: panel/hatch stenciling (numbered labels like Starship's `01`/`03`) — was
  identified as finding #4 in the design brief but never built.

## Immediate next step (do this first in any continuation)

**The very last export (cockpit refinements: seat frame, console overhead panels, cable runs) is
only partially verified.** What's confirmed: it exported successfully (71 objects, 275.3KB, one
non-fatal "Cone.008 not valid" warning of unknown origin — investigate if anything looks visually
wrong near a cone-shaped object, though none should be in the cockpit-only export selection), and
Three.js renders it without visible breakage. **Not yet done:**
1. Check Three.js browser console for errors (`mcp__Claude_Browser__read_console_messages`) on
   this specific load — note the console-message tool has shown **stale cross-navigation
   history** before in this session (a PlayCanvas error kept appearing after navigating back to
   Three.js); don't mistake old errors for new ones — check timing/context.
2. Check PlayCanvas renders the same export correctly (navigate to
   `http://localhost:4330/playcanvas/`, same verification pattern used all session).
3. Click-test `Console_Interact` still engages correctly (the interaction wiring wasn't touched
   this session, but always re-verify after any GLB re-export).
4. Take a **dedicated close-up screenshot** of just the seat and just a console desk (not the
   full wide shot) to actually judge whether the new frame/panel detail reads well, since the
   main camera angle backlights both.

## Pending tasks, in priority order

### 1. ~~Save the Blender work to a real `.blend` file~~ — DONE
Saved to `worldline-lab\shared\assets\wlv01.blend` (169KB, saved as a copy so the live MCP
session was left running/unaffected). Covers both the verified cockpit and the un-exported
exterior vessel work. Note: `.blend` files aren't needed at runtime — this is purely for
re-editability, don't wire it into the web build. **If further Blender edits happen in a later
session, re-save over this file** — it's a snapshot as of 2026-08-08, not a live sync.

### 2. Finish verifying the latest cockpit export
See "Immediate next step" above.

### 3. Panel/hatch stenciling
From the WLV-01 brief, finding #4, not yet built. Add small numbered labels (Blender text
objects converted to mesh, or a baked-texture placard) to a hatch or panel edge — e.g. near the
`Console_Interact_Bezel` or on `Deck_Frame`. Real, restrained, per Starship's `01`/`03` reference.

### 4. Exterior vessel — finish the aft section
The engine-mount struts + RCS thruster clusters read as a disorganized jumble from the side
profile (confirmed via screenshot, not fixed). Needs another geometry pass — likely: wrap the
strut/RCS cluster area in a partial hull fairing so it tapers visually, similar to how the
`Ext_SpineShell` fix solved the same problem for the mid-section.

### 5. Exterior vessel — build a reveal camera / shot
No camera has ever looked at the exterior from a "hero" angle intended for actual use (only ad-
hoc debugging viewport screenshots exist). This matters if the exterior is meant to feed the
brief's boot-sequence concept ("system initialization → WLV-01 comes alive → ... → SPACE → ...
→ command deck") — an exterior approach/reveal shot before the camera settles into the cockpit.
Not started.

### 6. Exterior vessel — export and wire in
The exterior collection (`WLV01_EXTERIOR`) has never been exported to a GLB or referenced by
either engine. Once the aft section is fixed and a reveal camera exists, this needs its own
export (likely a separate `wlv01_exterior.glb`, kept apart from the interior `deck.glb` since
they're used in different camera contexts) and wiring into whichever engine ends up as the
production choice.

### 7. Black hole — geometry + lensing shader
Architecture decided (see "Critical context" above), nothing built yet:
- Disk + event-horizon geometry in Blender, Blackbody-node colored (same technique already used
  for the key light — real temperature-gradient color, not a picked hex value).
- Screen-space lensing post-process shader, one implementation per engine, driven by the real
  weak-field deflection formula. This is genuinely new shader work, not a Blender task.

### 8. HUD panel geometry (Timeline, Constellation, Journal, system readout)
Architecture decided (embedded geometry, not DOM overlay — see "Critical context"), nothing
built yet. Needs:
- New display-panel geometry in Blender (console arms or side panels), same pattern as the 3 dash
  displays and `Console_Interact`.
- A shared data model for missions/timeline/journal content — currently this data only exists
  inside the *separate, unmerged* `worldline.html` mockup artifact (published earlier this
  session, not part of `worldline-lab`), not in `shared/spec.ts`. Needs porting/extracting into
  `shared/spec.ts` or a new `shared/content.ts` so both engines read the same source.

### 9. Not started at all (explicitly deferred per the original brief, §32)
Angular integration, website routing, portfolio CMS content, production PlayCanvas/Three.js
final-engine decision (round 1/2 bake-off produced findings, not a final pick — see open
questions in `2026-08-08-worldline-tech-decisions.md`), SSR/prerender testing, mobile
performance, bundle-size measurement.

## Known unresolved technical notes (don't rediscover these from scratch)

- **`angular-three@4.x` requires Angular ≥20; this repo is on Angular 19.** Real constraint on
  the eventual Three.js-in-Angular integration path, noted in the tech-decisions doc.
- **UV flip direction is not consistent between engines** — verified empirically (corner-marker
  test) that Three.js's `GLTFLoader` needs `repeat.set(1,-1)` on display textures, PlayCanvas's
  container loader needs no flip at all, for the *same* GLB file. Don't assume a fix transfers.
- **PlayCanvas's `CameraFrame` (used for bloom) owns its own render-pass graph** — the plain
  `CameraComponent.requestSceneColorMap()` is silently a no-op once `CameraFrame` is active; the
  real fix is `cameraFrame.rendering.sceneColorMap = true`.
- **Curve-to-mesh conversion in Blender can leave a malformed/phantom UV layer** that crashes the
  glTF exporter with a cryptic `foreach_get length mismatch` error. Fix: clear
  `mesh.uv_layers` on the converted object before export if it has no texture needs.
- **`bpy.ops.object.select_all` can fail with a context/poll error** depending on Blender's UI
  state when called via the MCP bridge. Prefer setting `obj.select_set(bool)` directly on each
  object instead of relying on the operator.
- **The browser console-message tool accumulates history across same-tab navigations** — an
  error from a previous page (e.g. PlayCanvas) can still show up after navigating to a different
  page (e.g. Three.js) in the same tab. Always sanity-check against what's actually rendered
  before trusting a console error as current.
