# WORLDLINE — Command Deck Completion Plan

> **Status: COMPLETE as of 2026-08-08 (session 2).** All gap-table items below are built and
> verified. The remaining work is Angular integration and CMS wiring — tracked in the
> pending items report.
>
> Original plan built on [2026-08-08-worldline-brief.md](2026-08-08-worldline-brief.md) (§4, §7,
> §9, §13, §14) and [2026-08-08-worldline-tech-decisions.md](2026-08-08-worldline-tech-decisions.md).

## Reference

A concept render of the fully realized HOME / Command Deck station: third-person view from
behind a seated observer, looking out a panoramic windshield at a black hole with a tilted
accretion disk. Four HUD panels float around the viewport — top-left **Worldline Timeline**
(years 2019–2027, milestone markers, a "NOW 2026" point), top-right **Project Constellation**
(a node graph of missions, e.g. "Mission 002 — Job Hunt — Career Intelligence System"),
bottom-left **Journal Transmissions**, bottom-right a system/orbital readout — plus a top nav
strip (`← ABOUT · HOME · WORK →`). The cockpit itself shows real detail: console arms flanking
the seat with individual switches/sliders, structural ribs around the window, worn/greebled
surfaces.

This is the brief's own target for the HOME station, not a new direction — the gap is between
what's built and what §7 already called for.

## Current state (session 2 — fully built)

`deck.glb` is now ~1.1 MB and contains the complete cockpit + black hole + HUD panels:

- `worldline-lab/shared/assets/deck.glb` — seat, console desks (with overhead panels, switches,
  cable runs), faceted 6-pane bay window, hull ribs, amber trim, stencils (WLV 01/02/03),
  3 dash displays, Console_Interact, BH_EventHorizon, BH_AccretionDisk, 4 HUD panels.
- `worldline-lab/shared/assets/wlv01_exterior.glb` — exterior vessel (spine, docking port,
  radiators, engine, aft fairing), 85 KB.
- `worldline-lab/shared/assets/wlv01.blend` — Blender source for all geometry.
- Camera: third-person, verified in both engines (`CAM.base.pos = [0, 0.55, 3.4]`).
- `worldline-lab/shared/content.ts` — all content data (missions, signals, timeline, system).

## Gap table — **all items complete ✓**

| Element | Reference | Session 2 result |
|---|---|---|
| Camera | Third-person, behind seat | ✓ Third-person, verified both engines |
| Seat | Seat back + headrest + frame rails | ✓ Seat with frame rails, adjustment rail |
| Console arms | Two arms, switches/sliders/overhead panel | ✓ Both desks, knobs, sliders, overhead panels, cable runs |
| Windshield | Angled, multi-facet, panoramic | ✓ 6 trapezoidal panes, domed taper, mullions |
| Frame detail | Structural ribs, seams, wear | ✓ Ribs, rear bulkhead, stencils |
| Black hole | Tilted accretion disk, visible through window | ✓ Shakura-Sunyaev geometry + GR lensing shader |
| Timeline | Top-left HUD, years 2019–2026 | ✓ HUD_Timeline, canvas-drawn, wired both engines |
| Constellation | Top-right HUD, mission node graph | ✓ HUD_Constellation, 6 missions from content.ts |
| Journal | Bottom-left HUD, transmissions | ✓ HUD_Journal, 3 signals from content.ts |
| System readout | Bottom-right HUD, vessel status | ✓ HUD_System, live computed from content.ts |

## Architecture decisions

**Revised 2026-08-08**: superseded the two decisions below after explicit direction — "everything
would be geometry, realistic and with backing physics." Kept here with the reasoning so the
reversal (and its one real technical limit) is traceable, not silently overwritten.

### Black hole: real disk + event-horizon geometry, plus a formula-driven lensing shader

The accretion disk and event horizon are real Blender geometry (a torus/disk mesh), colored by
real astrophysics rather than a picked gradient: temperature-gradient color from Doppler beaming
and gravitational redshift (matter orbiting toward the camera reads hotter/bluer, the far side
redder/dimmer) — the same Blackbody-node technique already used for the key light.

One piece cannot be geometry no matter how far this goes: **gravitational lensing is spacetime
curving how light from everything else reaches the camera — a distortion of the whole background,
not a shape.** Even Interstellar's actual VFX (Double Negative, built from Kip Thorne's equations)
rendered this with a custom ray-tracer, not polygons. Decided depth: a **screen-space post-process
shader driven by the real weak-field deflection formula** (α ≈ 4GM/(rc²)), applied per-engine
(Three.js post pass, PlayCanvas equivalent) — not a full per-pixel geodesic ray-marcher (rejected:
real-time cost, effectively a rendering-research project on its own) and not skipped (rejected:
without the warped-background/Einstein-ring effect it reads as a glowing donut, not a black hole).
Real formula, real-time performance, geometry everywhere the physics allows it to be geometry.

### HUD panels: embedded display geometry, not a DOM overlay

Timeline, Constellation, Journal, and the system readout become more instances of the pattern
already proven for the three dash displays (`Display_Aux1/Console/Aux2`): real plane geometry in
Blender, positioned within the cockpit (console arms, side panels), each driven by a canvas
texture built from real data (missions, timeline events, journal entries) rather than a flat hex
color. This is actually a *better* fit for the brief's own §18 diegetic-navigation principle than
a DOM overlay would have been — the interface literally exists inside the world, not floating
over it.

This does **not** remove the brief's §29/§38 requirement for a non-3D fallback (screen readers,
no-WebGL, reduced motion) — that's a separate, still-required accessibility path, orthogonal to
what the primary 3D experience is made of.

## Phased plan

1. **Camera reframe.** Move `CAM.base` to a third-person over-the-shoulder position in
   `shared/spec.ts`. Cheapest change, and every geometry decision after this is judged against
   the new shot — do it first.
2. **Seat + console-arm geometry** in Blender, via the `blender` MCP connection
   (`execute_blender_code`), same workflow as `deck.glb`'s original build: real PBR values,
   verified empirically (viewport screenshots), re-exported to `deck.glb`.
3. **Windshield reshape + frame detail pass.** Re-cut `Deck_Glass` to the angled/panoramic shape,
   add rib/seam detail to the frame bars.
4. **Black hole**: disk + event-horizon geometry in Blender (real temperature-gradient color via
   Blackbody nodes, real orbital motion), positioned in the new window view, plus the
   formula-driven lensing post-process shader — one shader implementation per engine.
5. **HUD panel geometry**: model the Timeline/Constellation/Journal/system-readout displays into
   the cockpit (console arms, side panels) in Blender, extend `shared/spec.ts` (or a new
   `shared/content.ts`) with the missions/timeline/journal data both engines will read from —
   today that data only exists inside the disconnected `worldline.html` mockup — and drive each
   new display's canvas texture from it, the same technique already used for the 3 dash displays.

## Open questions before starting

- How much console-arm detail is worth modeling vs. faking with normal/roughness texture maps
  (real geometry per switch vs. a baked panel texture) — a real scope/time trade-off.
- Whether HUD panel content (missions, timeline, journal) stays hand-authored placeholder data
  for now, or should pull from the live CMS API this portfolio already has — the brief's §35
  says the immersive layer must stay compatible with real CMS content, so placeholder data now
  should be shaped like the eventual real shape.
- Confirm which phase to start on — the reframe (1) is a hard prerequisite for judging 2–5, since
  every new geometry piece (seat, consoles, HUD displays, black hole) gets placed relative to the
  new third-person shot, not the old first-person one.
