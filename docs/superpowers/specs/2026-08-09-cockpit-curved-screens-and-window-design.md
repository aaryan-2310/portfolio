# Cockpit Curved Window + Screens + Identity/Nav Overlay — Design

> **2026-08-09.** Model-only work in the live Blender scene, continuing the same session as
> [2026-08-09-cockpit-side-hull-extension-design.md](2026-08-09-cockpit-side-hull-extension-design.md).
> Driven by a reference concept image the user shared, showing the intended portfolio-site
> aesthetic: a curved cockpit window/HUD-panel language, plus name/title/nav content integrated
> into the 3D scene rather than as a flat page overlay.

## Why

Two concrete gaps against the reference image, both about **flatness where the reference shows
curvature**, plus a **missing content layer**:

1. **The window is 6 flat trapezoidal facets, not a real curve.** Checked in the live Blender
   scene: `Deck_Window_0`..`5` fan across a ±50.8° arc (rotation.z from −0.887 to +0.887 rad) with
   hard edges between each flat pane — a faceted *approximation* of a dome, not a smooth surface.
2. **The 4 HUD panels are flat planes.** `HUD_Timeline`, `HUD_Constellation`, `HUD_Journal`,
   `HUD_System` (at X=±1.3, Y=1.88, various Z) are flat rectangles with canvas-baked emissive
   textures — functional, but flat where the reference shows curved display surfaces.
3. **No name/title/nav content exists anywhere in the scene.** The reference image shows
   "ARYAN MISHRA, SOFTWARE ENGINEER" + "OBSERVER" projected over the window's black-hole view, a
   top bar ("WORLDLINE // CONTROL DECK"), and bottom nav (NAVIGATION / TIMELINE / SYSTEM,
   HOME / WORK / ABOUT). None of this exists in the 3D scene or in production's Angular template.

## Decisions (made via the visual companion this session)

- **Placement (hybrid):** identity content (title bar + "OBSERVER" / name / role) is projected
  onto the window glass itself, following its curve. Navigation content lives on its own
  dedicated screen, not on the glass.
- **Curvature intensity:** moderate — "curved-monitor / aircraft-canopy" style, for both the
  window and the HUD panels. Not a subtle barely-there curve, not a full spherical bubble dome.
- **Scope of what gets curved:** the window and the 4 big HUD panels, plus the new nav screen.
  The small dash/console displays (`Display_Aux1`, `Display_Aux2`, `Display_Console`,
  `Console_Interact`) stay flat — they're embedded in the console desk surface, not standalone
  screens, and curving them wouldn't read the same way.

## Design

### 1. Window: replace 6 flat facets with one continuous curved surface

Replace `Deck_Window_0`..`5` with a single curved-glass mesh matching the same overall footprint
(same angular extent, ~101° total arc; same approximate Y-depth range, 0.82–1.95; same height
range, up to ~1.975 at the outer edge) — moderate curvature, smooth shading, no hard seams.

`Deck_Mullion_0`..`6` (the structural ribs currently marking the facet seams) are **repositioned
to sit as thin ribs against the new curved surface's tangent at their existing angular positions**,
not deleted — this preserves the structural-framing language already established (matches the
reference image's subtle window framing) while fixing the underlying glass to be a real curve
rather than hard dividing bars between flat panes.

Exact mesh construction (sphere-cap section vs. a bent/deformed grid) is an implementation
decision made interactively in Blender with visual verification, not prescribed here — organic
curved-surface modeling benefits from iterating against a screenshot, unlike the primitive-box
geometry in the radiator/hull-panel work.

### 2. HUD panels: curve the existing 4, in place

`HUD_Timeline`, `HUD_Constellation`, `HUD_Journal`, `HUD_System` keep their current positions,
rotations, and canvas-texture-driven content pipeline (`content.ts` → canvas 2D → baked emissive
texture, unchanged) — only the underlying mesh changes from flat plane to a moderately curved
surface (same curvature intensity as the window), with UV mapping adjusted so the existing baked
textures still map correctly without stretching/distortion.

### 3. New nav screen: horizontal strip on `Deck_Beam`

Rather than forcing a 5th panel into the existing 2×2 left/right layout, mount the nav content
(HOME / WORK / ABOUT + NAVIGATION / TIMELINE / SYSTEM) as a curved horizontal strip on
`Deck_Beam` — the overhead beam already spanning the full width above the dash (Z≈1.52), already
the right shape and position for a horizontal nav bar. New object, new canvas-texture content
(new draw function in `content.ts`/`spec.ts`, following the same pattern as the existing 4 panels).

### 4. Window glass HUD-projection overlay

A second, slightly-offset transparent plane matching the window's new curvature, positioned just
inside the cabin side of the glass, carrying an alpha-blended emissive canvas texture:
"WORLDLINE // CONTROL DECK" near the top, "OBSERVER" / "ARYAN MISHRA" / "SOFTWARE ENGINEER"
centered — projected over the black-hole view without modifying the actual window glass material
(`Deck_Glass`'s existing `KHR_materials_transmission` setup stays untouched).

## Verification plan

Same method established this session — numeric bounding-box/position checks plus visual
screenshot verification (the `get_viewport_screenshot` staleness issue from earlier sessions
should be re-checked; if it recurs, that's a known tooling issue, not a blocker):

1. New window mesh occupies the same overall footprint as the 6 facets it replaces (angular
   extent, Y-depth range, height range) — no gap/overlap with `Deck_Pillar_L`/`R` or the dash.
2. Repositioned mullions still align with the new curved surface (no floating/clipping).
3. HUD panels still render their existing canvas content correctly (no UV stretching) after the
   flat→curved mesh change.
4. New nav strip's canvas content is legible at its mounted size/distance from camera.
5. Window overlay text is legible against the black-hole backdrop, doesn't visually conflict with
   the accretion disk's brightness, and doesn't break the existing glass transmission/refraction
   look.

## Explicit non-goals (this phase)

- **Not in scope yet:** wiring the new nav strip's HOME/WORK/ABOUT links to actual site
  navigation/routing — this phase builds the geometry and static content; making it functionally
  clickable/routable is a follow-up once the geometry exists and is exported.
- No export to GLB, no engine wiring (same model-only boundary as the radiator/hull-gap work).
- No changes to the small dash/console displays (`Display_Aux1`/`2`, `Display_Console`,
  `Console_Interact`) — confirmed out of scope.
