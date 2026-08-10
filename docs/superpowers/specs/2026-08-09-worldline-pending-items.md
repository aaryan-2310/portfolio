# WORLDLINE / WLV-01 — Progress & Pending Items Report (Session 3)

> **Updated 2026-08-09.** This document supersedes
> [2026-08-08-worldline-pending-items.md](2026-08-08-worldline-pending-items.md), which had
> accumulated internal contradictions (e.g. it claimed panel stenciling was both "built" and
> "never built" in two different sections) and several claims that turned out to be stale when
> checked against the live Blender scene this session (seat frame rails, a second console
> overhead panel). **Trust this document's "Verified" markers over the old one's prose.**

## Read these first, in order

1. [2026-08-08-worldline-brief.md](2026-08-08-worldline-brief.md) — original master brief.
2. [2026-08-08-worldline-tech-decisions.md](2026-08-08-worldline-tech-decisions.md) — engine bake-off. **PlayCanvas is production.**
3. [2026-08-08-worldline-command-deck-plan.md](2026-08-08-worldline-command-deck-plan.md) — phased command-deck plan.
4. **This document.**

The specs/plans listed in "What shipped this session" below are the authoritative record of
*why* each change was made — this document is the *status rollup*, not a replacement for them.

## What shipped this session (2026-08-09), in order

| # | Change | Spec/Plan | Commits |
|---|---|---|---|
| 1 | Restored PlayCanvas bloom (production + lab) — ported the engine's own reference `posteffect-bloom` implementation since PlayCanvas 2.x has no standalone `BloomEffect` class | — (no spec doc; small fix) | `ed9d317` |
| 2 | Fixed `ng serve` dev-server crash on `/v2` (`node:worker_threads`/CORS error) via `angular.json`'s `prebundle.exclude` | — (no spec doc; small fix) | `47022b8` |
| 3 | Built 18 exterior radiator panels (louvered strip, both flanks) — previously speced but never built | [2026-08-09-wlv01-exterior-radiators-design.md](2026-08-09-wlv01-exterior-radiators-design.md) / [...-plan.md](../plans/2026-08-09-wlv01-exterior-radiators.md) | `4a58be8` |
| 4 | Closed the cockpit's "floating" side-hull gap (Y −1.55 to +1.00 had zero side geometry — exactly where the seat/console desks sit) | [2026-08-09-cockpit-side-hull-extension-design.md](2026-08-09-cockpit-side-hull-extension-design.md) / [...-plan.md](../plans/2026-08-09-cockpit-side-hull-extension.md) | `ef973d8` |
| 5 | Re-exported `deck.glb`/`wlv01_exterior.glb` with the radiators + hull fix; **found and fixed a real bug**: the radiators were linked to the wrong Blender collection, so they were silently absent from the exterior GLB despite being "done" in #3 | [2026-08-09-wlv01-exterior-export-and-wiring-design.md](2026-08-09-wlv01-exterior-export-and-wiring-design.md) / [...-plan.md](../plans/2026-08-09-wlv01-exterior-export-and-wiring.md) | `ef86d51`, `35b3350` |
| 6 | Wired the exterior-vessel view toggle (previously Three.js-only) into the PlayCanvas lab build and **into production** — real, shipped feature: bottom-right button at `/v2`, amber/teal states | same as #5 | `b741382`, `d5fa930` |
| 7 | Final review on #5/#6 found 2 Important findings (GLB-load race, component/service state desync) — fixed and re-reviewed clean | same as #5 | `9b479f4` |
| 8 | Curved the cockpit window (6 flat facets → 1 smooth surface), curved the 4 HUD panels in place, added 2 new placeholder screens (`HUD_Nav`, `Deck_WindowOverlay`) — driven by a reference concept image | [2026-08-09-cockpit-curved-screens-and-window-design.md](2026-08-09-cockpit-curved-screens-and-window-design.md) / [...-plan.md](../plans/2026-08-09-cockpit-curved-screens-and-window.md) | `608abc4` |
| 9 | Final review on #8 found 2 Critical findings (all 5 new/changed screens built on swapped local axes — lying ~81° off-camera instead of facing the viewer; window overlay coincident with the glass instead of in front of it) — **fixed, not yet re-reviewed** | same as #8 | `1f831d2` |

**Item #9's fix has not been through its scoped re-review yet** — that's the immediate next step
in any continuation session, before touching anything else in the cockpit. See "Immediate next
step" below.

## Verified current state of the live Blender scene (`wlv01.blend`)

Checked directly via Blender MCP this session, not inherited from old notes:

- **Cockpit (`Collection`, 121 objects as of commit `1f831d2`)**: deck, seat (plain-box geometry —
  the old report's "frame rails + adjustment rail" claim was checked and found false, never
  built), 2 console desks with real knob/toggle/slider/button greeble, `Console_Interact`
  (verified working click-to-engage in both PlayCanvas builds), 4 curved HUD panels
  (`HUD_Timeline`/`Constellation`/`Journal`/`System` — now curved and axis-fixed, verified facing
  the camera with dot product 0.96–0.999), 1 new curved nav strip (`HUD_Nav`, geometry only, no
  content wired), 1 curved window (`Deck_Window`, replacing the 6 old facets) + 7 repositioned
  mullions, 1 window overlay (`Deck_WindowOverlay`, geometry + placeholder material only, no
  content wired, verified sitting a uniform 0.03 units in front of the glass), 7 hull pieces
  closing the side gap, panel/hatch stencils (`Stencil_WLV_01`/`02`, `Stencil_Console_03` —
  verified present, contrary to the old report's contradictory claims), black hole
  (`BH_EventHorizon`/`BH_AccretionDisk`), cable runs.
- **Exterior (`WLV01_EXTERIOR` collection, 36 objects)**: spine, docking port/collar, engine
  housing/mounts/nozzle, RCS thruster clusters (fwd + aft), 18 radiator panels (correctly linked
  as of `35b3350` — verified 0 stray links to `Collection`).
- **Exported and matching the live scene**: `deck.glb`/`wlv01_exterior.glb` in both
  `worldline-lab/shared/assets/` and `src/assets/worldline/` (must stay byte-identical — verified
  via checksum after `ef86d51`). **These exports predate item #8/#9** (the curved window/screens
  work) — they do NOT yet include the curved geometry. See pending items below.

## Immediate next step (do this first in any continuation)

1. **Scope the re-review of commit `1f831d2`** (the axis-convention + overlay-placement fix).
   Verify: all 5 objects' face normals still point toward `Deck_Camera` (dot > 0.5, ideally
   >0.9), the window overlay's per-angle gap from the glass is uniform (~0.03, not just checked
   at the bbox extremes), and nothing else regressed. Use
   `mcp__blender__execute_blender_code` directly against the live scene — the geometry is the
   evidence, not the (still generally unreliable-for-viewport-angle-switching) screenshot tool.
2. Commit the still-untracked plan doc
   (`docs/superpowers/plans/2026-08-09-cockpit-curved-screens-and-window.md`).
3. Once clean, this closes out item #8/#9's SDD workspace
   (`.superpowers/sdd/2026-08-09-cockpit-curved-screens-and-window/`, delete after).

## Pending, in priority order

### 1. Export + wire the curved window/HUD panels/new screens (item #8/#9 above)
The currently-shipped `deck.glb` predates the window/HUD-panel curving and the two new
placeholder screens. Once the re-review in "Immediate next step" passes, this needs the same
export→copy→verify pipeline already proven for the radiators (spec #5 above): re-export
`deck.glb`, copy to both asset directories, visually verify in all three engines before treating
it as shippable.

### 2. Wire content into `HUD_Nav` and `Deck_WindowOverlay`
Both are geometry-only placeholders right now (UV-mapped mesh, placeholder material, no baked
text — deliberately, matching how the other 4 HUD panels work: pixels are drawn at runtime via
canvas, not baked into the GLB). Per the approved design
([2026-08-09-cockpit-curved-screens-and-window-design.md](2026-08-09-cockpit-curved-screens-and-window-design.md)):
- `HUD_Nav`: HOME / WORK / ABOUT + NAVIGATION / TIMELINE / SYSTEM — needs a new draw function in
  `content.ts`/`spec.ts` (production) and the lab equivalent, following the exact pattern the 4
  existing panels use, then wiring in `worldline.service.ts` / `worldline-lab/playcanvas/main.ts`
  (same `find(meshName)` → canvas → texture pattern already there for `HUD_Timeline` etc.).
- `Deck_WindowOverlay`: "WORLDLINE // CONTROL DECK" (top) + "OBSERVER" / name / role (center),
  alpha-blended emissive over the black-hole view. Same wiring pattern, but needs `blendType` set
  for transparency (the other 4 panels are opaque emissive; this one must not occlude the glass
  behind it).
- The nav strip's actual links (HOME/WORK/ABOUT → real site routes) are explicitly a separate,
  later step per the design's non-goals — this item is content/rendering only.

### 3. Portfolio CMS content wiring
Still fully unwired — `content.ts` has hardcoded data (missions/timeline/journal/system), no
`HttpClient` calls anywhere in `worldline.service.ts`. The Angular service layer already used
elsewhere in the app (`src/app/core/services/`) is the pattern to follow.

### 4. SSR/prerender + mobile performance + bundle size
Not started. Explicitly deferred per the original brief. `worldline-component` chunk is large
(~35KB gzipped in the last production build check; PlayCanvas itself dominates it).

## Known tooling notes (carry forward, don't rediscover)

- **`bpy.data.filepath` on the live MCP session is expected to be bound** to `wlv01.blend` as of
  this session's end (confirmed via `save_as_mainfile`) — but if a future session finds it
  unbound again, that's not an error: use `save_as_mainfile(filepath=...)`, never
  `save_mainfile()` with no existing filepath, and never "open"/reload the file to "fix" a save
  error — that discards all in-memory work. This bit a near-miss earlier this session (caught by
  the security scanner before any damage) and a real BLOCKED report from an implementer later.
- **`get_viewport_screenshot` reliability is inconsistent, not uniformly broken.** Some calls this
  session returned genuinely fresh renders; others returned stale/cached images across different
  camera setups; switching the viewport to look through a named camera object
  (`bpy.ops.view3d.view_camera()` via `temp_override`) has never visibly taken effect in any
  screenshot this session, on either issue. Treat screenshots as a sanity check only — bounding
  box / vertex / face-normal assertions against the live scene are the authoritative verification
  method established this session, and should stay that way until the tooling issue is actually
  root-caused.
- **A flat/curved-mesh axis-convention trap**: this session's existing HUD panel objects (built in
  an earlier session) use local-Y-as-height, local-Z-as-surface-normal — not the more "obvious"
  local-Z-as-height convention. Any future geometry built to attach to these objects' existing
  rotations must match this convention (verified the hard way in item #9 above — check face
  normals against the camera, not just bounding boxes, whenever building geometry that must face
  a specific direction).
- **Collection membership is not covered by bounding-box/name/material checks.** Item #5's bug
  (radiators in the wrong collection) passed every check in the original radiator task's review
  except this one. Any future task that adds objects to `WLV01_EXTERIOR` vs. `Collection` should
  explicitly verify `bpy.data.collections[...].objects` membership, not just object existence.
