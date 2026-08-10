# WLV-01 Procedural PBR Materials + Bevels + Compression — Design

> **2026-08-10.** Continues the same live Blender scene (`worldline-lab/shared/assets/wlv01.blend`)
> from the 2026-08-09 sessions. Driven by a conversation about pushing the model toward a more
> realistic, "modern standard" look while staying within web-delivery constraints.

## Why

Checked every material in the live scene (11 total): every single one has exactly 2 shader
nodes — Principled BSDF + Material Output. Flat color, uniform roughness/metalness, zero
procedural detail, zero texture maps. This is the actual gap behind "it should look more
realistic" — not geometry, not polycount, but the complete absence of surface detail and PBR
texture information.

Researched two external sources this session before settling on an approach:
- **Poly Haven's "Metal" texture category** (searched via its public API): almost entirely
  weathered/rusted/industrial (shipping containers, corrugated roofing, rusty shutters). No good
  match for the clean, restrained aesthetic already established (amber trim, painted panels,
  Starship-style stencils).
- **Sketchfab** (via Blender's Sketchfab integration): found the Smithsonian's Apollo 11 Command
  Module Interior/Exterior scans (CC0 public domain, real photogrammetry) — an authoritative
  realism reference, plus two well-executed fictional hard-surface ships (SF-1 White Ghost, Void
  Voyager) as technique references for panel-line/edge-wear execution. None are geometry we can
  drop in directly (wrong shape/scale for our cockpit layout), but they're useful as visual
  reference for the material work below.

**Decision**: build fully procedural materials in Blender's own shader nodes, informed by (not
literally sourced from) the Apollo CM reference, then bake to static textures for export. glTF
cannot carry a live procedural node graph — baking to image textures is mandatory for export
regardless of technique, so this was true no matter which path we picked.

## Scope

**In scope**, covering the 4 highest-impact materials plus two supporting steps:
- `Hull_Mid_Painted` (35 objects), `Hull_Dark_Painted` (17 objects), `Trim_Brushed_Aluminum` (44
  objects), `Viewport_Glass` (1 object, but the camera's focal point in every shot).
- A Bevel modifier pass on every object using the 3 hard-surface hero materials (not glass, not
  emissive displays).
- Baking + re-pointing materials to use baked textures for export.
- GLB compression (Draco geometry + KTX2 texture compression via `@gltf-transform/cli`, confirmed
  runnable via `npx --yes @gltf-transform/cli` — version 4.4.2 verified this session).

**Explicitly out of scope** (separate future work, not part of this plan):
- The other 7 materials (`Display_Emissive_Amber`, `Engine_Heat_Discolor`,
  `Mat_BH_AccretionDisk`, `Mat_BH_EventHorizon`, `Mat_Stencil`, `Thermal_Radiator`,
  `Trim_Light_Amber`) — lower usage count or already serve a specific function (emissive
  displays, black hole) that doesn't need the same treatment.
- Engine wiring / production integration of the new baked textures (same phased pattern as prior
  sessions: model → export → wire, as separate steps once each is verified).
- Hand-crafted (Substance Painter-style) wear/damage authoring — not reachable via any connected
  tool; procedural is the ceiling for this pass.

## Design

### 1. Bevels

Add a Bevel modifier (width ≈0.004m, 2 segments, limit method "Angle") to every object using
`Hull_Mid_Painted`, `Hull_Dark_Painted`, or `Trim_Brushed_Aluminum`. This alone changes how every
edge in the scene catches light — real metal edges are never perfectly sharp, and most of these
objects are simple boxes with completely sharp corners today.

### 2. Procedural PBR material recipes

Each material gets rebuilt with real node-graph detail, then baked (Section 3) rather than kept
as a live procedural graph at export time:

- **`Hull_Mid_Painted` / `Hull_Dark_Painted`**: low metallic (~0.0–0.2, paint over metal), subtle
  low-frequency Noise-Texture-driven base-color variation (~5–10% blend factor — real painted
  panels are not perfectly uniform), and edge wear via the Geometry node's Pointiness output:
  convex edges blend toward a bare-metal color and higher roughness, mimicking chipped paint at
  corners — informed by what's visible in the Apollo CM scan's real weathering pattern, not a
  copy of its textures.
- **`Trim_Brushed_Aluminum`**: high metallic (~0.9), a stretched Noise or Wave texture (elongated
  along one axis) driving anisotropic-looking brushed streaks, tighter roughness range than the
  painted hull materials.
- **`Viewport_Glass`**: keep the existing `KHR_materials_transmission` setup; add a very slight
  roughness/normal imperfection (subtle noise bump) instead of a perfectly clean, artificial-
  looking glass surface.

### 3. Baking workflow

Several existing objects likely have default/unwrapped-poorly UVs (never audited for texture
baking use before, only for the flat-color/no-texture materials they've had until now). Before
baking: verify each object using the 4 hero materials has a non-overlapping UV layout suitable
for baking (Smart UV Project where needed). Then, per material: bake Base Color, Roughness,
Normal, and Metallic passes to 2048×2048 images (Cycles bake, one bake target per material,
covering all objects that share it), and re-point that material's Principled BSDF inputs from
the procedural nodes to the baked Image Texture nodes. The procedural node graph stays in the
`.blend` file (not deleted) for future re-editing; the baked version is what actually exports.

### 4. Export + compression

Re-export `deck.glb` and `wlv01_exterior.glb` (same collection-based selective export already
used this session), copy to both asset directories as before, then run:

```bash
npx --yes @gltf-transform/cli optimize deck.glb deck.optimized.glb --compress draco --texture-compress ktx2 --simplify false
```

**`--simplify false` is required, not optional** — `optimize`'s default (`--simplify true`,
verified against the installed CLI's own `--help` this session) reduces mesh geometry via
meshoptimizer, which risks distorting the carefully-tuned low-poly curved surfaces built earlier
this session (the curved window is 34 vertices, HUD panels 26 each — simplification has no
useful target here and only downside risk). `--compress draco` must also be passed explicitly,
since the tool's own default compression method is `meshopt`, not `draco`. Verify the compressed
file still renders correctly in all three engines and record the before/after file size.

## Verification plan

Material tuning is far more visually iterative than any geometry work done this session so far —
color/roughness/bump values are genuinely hard to get right without seeing them rendered. Budget
for multiple look-and-adjust passes, not a one-shot build. The Blender viewport-screenshot tool
has been inconsistent this session (sometimes fresh, sometimes stale, camera-angle switching via
script has never visibly worked) — attempt it for each material, but don't block on it; a
render via `bpy.ops.render.render` (actual Cycles/EEVEE render, not a viewport screenshot) may be
more reliable for checking material appearance and is worth trying as an alternative.

1. After each material's node graph is built (before baking): render a close-up test shot,
   confirm the edge-wear/brushed-streak/base-color-variation effects are visible and not
   overdone (err toward restrained, matching the established aesthetic — not a heavily weathered
   look).
2. After baking: confirm the baked textures visually match the pre-bake procedural preview (a
   common baking failure mode is UV seams or resolution mismatches producing visibly different
   results).
3. After bevels: confirm no object's silhouette changed enough to reopen already-closed
   collision/gap checks from prior sessions (the hull, HUD panels, and window all had explicit
   collision verification earlier — a bevel modifier shouldn't meaningfully change bounding boxes,
   but confirm rather than assume).
4. After export + compression: render/screenshot in all three engines (Three.js lab, PlayCanvas
   lab, production) and confirm textures load correctly — KTX2 support requires the
   `KHR_texture_basisu` extension, which needs verification that PlayCanvas 2.x and the Three.js
   version in use both support it (if either doesn't, fall back to compressing textures as
   regular JPG/PNG at reduced resolution instead of KTX2, and Draco-compress geometry only).

## Explicit non-goals

- No production/engine wiring in this pass (matches the established model → export → wire
  phasing).
- No changes to the other 7 materials.
- No hand-authored (Substance-style) textures — procedural only.
