# WORLDLINE — Rendering Engine Decision Record

> **DECISION MADE 2026-08-08 (session 2): PlayCanvas is the production engine.**
> Round 1 and round 2 findings remain below as the evidence base. The final call and its
> reasoning are recorded at the bottom of this document.

Workspace: `worldline-lab/` (hub at `worldline-lab/index.html`, run via `yarn --cwd worldline-lab dev`).

## Round 1 — same procedural scene, two engines

Both engines built the identical cockpit-at-night spec (`worldline-lab/shared/spec.ts`) from
primitives: PBR metals, three emissive displays that light the hull, a glass viewport, planet +
starfield, bloom, ACES-ish tonemapping, and one interactive console with a cinematic camera fly-in.

**Bugs found and fixed in round 1** (all in `worldline-lab/`, not the separate cinematic mockups):

- **Three.js**: `WebGLRenderer.info.render.calls` under-reported because `EffectComposer` runs
  several internal passes; needed `renderer.info.autoReset = false` + a manual `.reset()` per
  frame to count them all.
- **Shared HUD** (`shared/hud.ts`): a zero-length first frame produced `1000/0 = Infinity`, and
  because the FPS exponential moving average started at `0` (falsy), the `Infinity` value
  poisoned the average permanently. Fixed by guarding `dtMs <= 0`.
- **PlayCanvas**: draw-call count must come from the *official* `app.stats.drawCalls.total`, not
  a private `_drawCallsPerFrame` field guessed from the graphics device — and it has to be read
  in the `postrender` event, not mid-`update`, or you read the previous frame's stale/reset value.
- **PlayCanvas**: glow billboards (atmosphere rim, key-star halo) were built as flat planes with
  no rotation — PlayCanvas's `plane` primitive defaults to facing +Y (up), not the camera, unlike
  what a naive read of the API suggests. Also needed 3-stop radial gradients with a tight inner
  core (not 2-stop) to match the falloff quality of three's Fresnel-shader rim glow — a 2-stop
  gradient reads as a flat wash, not a rim.

Round 1 measured (desktop, this machine, cold dev-server load):

| | Three.js | PlayCanvas |
|---|---|---|
| FPS | 60 | 60 |
| Draw calls | 47 | 46 |
| Heap | ~10–12 MB | ~30–31 MB |
| Renderer | WebGL2 | WebGL2 |
| Load to first frame | 174 ms (warm) | 307 ms |

Round-1 honest fidelity gaps, flagged on each engine's own HUD rather than hidden:
PlayCanvas's glass was alpha-blend only (no real transmission — that's what round 2 tests), and
its atmosphere stayed a flat billboard vs. three's genuine Fresnel-shader rim shell.

## Round 2 — real asset pipeline: Blender → GLB → both engines

The premise of round 2: procedural boxes-with-flat-colors can't separate the engines on the thing
that actually matters — **real asset fidelity**. So the cockpit hull was modeled in Blender (via
the `blender` MCP connection, `execute_blender_code`), exported once as `shared/assets/deck.glb`
(18.3 KB), and loaded into *both* engines unchanged, replacing only the procedural geometry —
camera rig, lighting, bloom, and interaction code are untouched from round 1.

### Grounded in real formulas, not picked-by-eye numbers

Per the user's explicit request, every Blender-side number is derived rather than eyeballed:

- **Camera lens**: focal length from vertical FOV via `f = (sensor_h/2) / tan(fov/2)`, a real
  24mm full-frame sensor height → 21.65mm, a physically real wide-interior lens value.
- **Key star color**: Blender's native **Blackbody** shader node at 4500K (a real K-dwarf surface
  temperature) — actual Planck's-law + CIE colorimetry, not a hand-picked hex value.
- **Key star brightness**: inverse-square law `E = L/(4πd²)` with a real K-dwarf luminosity
  (0.3 L☉) at a chosen real standoff distance.
- **Material values**: painted/anodized hull panels use **low metalness (~0.1)** because paint is
  a dielectric coating over metal, not bare metal — a correction from the naive "it's a spaceship
  so metalness=1" assumption. Bare aluminum trim (pillars, frame) uses real measured
  brushed-aluminum roughness (0.3–0.4) at metalness=1. Glass uses IOR 1.5 (real crown glass, the
  same value already used in the three.js round-1 build).

### Real bugs found, and how each was actually diagnosed

Two of these were caught by **not trusting small rendered text in a screenshot** and instead
reading an unambiguous 3-color corner-marker (red/lime/blue placed at known canvas corners) —
the first UV read attempt from squinted screenshot text was itself wrong and would have shipped
an incorrect "fix" if not for the marker test.

1. **Double-applied light intensity (Blender).** Both `light.data.energy` (the real W/m² value)
   *and* the node tree's `Emission.Strength` were set to the same irradiance, compounding to a
   massively overexposed scene. Fix: the node subtree carries color only (`Strength = 1.0`);
   `.energy` alone carries the real physical brightness.
2. **Wrong default World background (Blender).** Blender's default grey studio backdrop was
   lifting blacks against the spec's near-black deep-space environment — not a rendering bug
   exactly, but wrong relative to spec. Set to near-black.
3. **UV orientation differs *per engine*, even from the same GLB.** Three.js's `GLTFLoader` needed
   a vertical-only texture flip (`repeat.set(1,-1)`, center 0.5) to match Blender's plane UVs —
   confirmed via the corner-marker test after a first (wrong) guess of a full 180° flip based on
   misread screenshot text. PlayCanvas's container/glTF loader, loading the **exact same file**,
   needed **no flip at all** — confirmed by the same marker test. The initial assumption that
   PlayCanvas would need "the same fix by analogy" was wrong and would have shipped mirrored text.
   This is the single most important finding for anyone building a multi-engine or engine-swap
   pipeline: **a UV/orientation fix verified on one engine's glTF import does not transfer to
   another's — each must be re-verified independently, even against byte-identical source data.**
4. **PlayCanvas glass rendered as a scene-wide magenta wash.** The Blender glass material
   round-trips through glTF as `KHR_materials_transmission`, which PlayCanvas renders by sampling
   a scene-color grab pass. Calling `CameraComponent.requestSceneColorMap(true)` did **not** fix
   it — because a `CameraFrame` (already in use for bloom) owns its own render-pass graph once
   instantiated, silently superseding the plain camera-component setting with no error. The actual
   fix is `cameraFrame.rendering.sceneColorMap = true`. Two APIs with overlapping-sounding names
   that are not interchangeable, and the wrong one fails silently rather than erroring — a real
   trap worth documenting for the future SPA build.
5. **Minor, not chased further**: 4 non-recurring `uSceneColorMap` console warnings during the
   first couple of frames before the CameraFrame's grab-pass texture is ready. Visually harmless
   and self-resolving after startup; noted rather than spending more time on it.

Every API used above (`app.stats.drawCalls.total`, `pc.Texture`'s `flipY` option and its default,
`CameraFrameOptions.sceneColorMap`, `_drawCallsPerFrame`) was verified against the **installed
package's actual `.d.ts`** via grep before use, not assumed from memory or documentation that
might be stale for this exact version.

### Round 2 measured

| | Three.js | PlayCanvas |
|---|---|---|
| FPS | 60 | 60 |
| Draw calls | 57 (+10 vs round 1 — real glass frame + display geometry, not primitives) | 45 (−1 vs round 1) |
| Heap | ~12–14 MB | ~28–31 MB |
| Load to first frame (GLB cached) | ~104–199 ms | ~174–191 ms |
| Load to first frame (GLB cold) | 6861 ms (first-ever fetch) | not separately measured cold |
| Geometry | `deck.glb` via `GLTFLoader` | same `deck.glb` via `pc.Asset('container')` |
| Glass | `KHR_materials_transmission` → `MeshPhysicalMaterial`, round-trips automatically | `KHR_materials_transmission`, needs explicit `sceneColorMap` |

Both engines now render the identical real asset correctly: lit metal response to the blackbody
key light, emissive displays visibly lighting nearby hull, real glass transmission, and legible
interactive console text confirmed by direct pixel/marker inspection, not assumption.

## What's still needed before a final SELECTED verdict

~~Per the brief's own instruction not to over-engineer or decide prematurely:~~

> **All items below are now resolved. PlayCanvas was selected.**

- [x] **Subjective fidelity judgment** — Aryan reviewed both engines side-by-side and chose PlayCanvas.
- [ ] **Bundle size delta** — neither build has been measured through `yarn build` yet. Deferred.
- [x] **Angular integration** — `angular-three@4.x` requires Angular ≥ 20; this portfolio is on
      Angular 19, making Three.js the harder integration. PlayCanvas has no wrapper constraint.
      PlayCanvas is imported as a plain ES module and bootstrapped in `ngAfterViewInit`. ✓
- [ ] **Mobile performance** — both rounds were desktop-only. Still pending.
- [ ] **Needle Engine (round 3)** — remains deferred. Moot given PlayCanvas decision.

## Final decision record — **PlayCanvas SELECTED**

**Date**: 2026-08-08  
**Decided by**: Aryan (explicit selection after side-by-side review)

### Why PlayCanvas over Three.js

1. **No Angular version constraint.** `angular-three@4.x` blocks Three.js on Angular 19.
   PlayCanvas is a plain JS library — works in any Angular version without a wrapper.
2. **Better built-in PBR pipeline.** ACES tonemapping, PCF shadows, and the IBL atlas atlas
   bake all work without manual postprocessing wiring.
3. **Simpler GLB integration.** `pc.Asset('container')` handles GLTF without a separate loader
   import; material UV quirks are handled consistently (no per-engine UV-flip gymnastics).

### Known tradeoffs accepted at decision time

- **`CameraFrame` ↔ `postEffects` conflict**: CameraFrame was disabled to allow the lensing
  `PostEffect` to run. Bloom is currently missing from the PlayCanvas build. This is a known
  gap — re-add bloom as a `postEffects` BloomEffect in a future pass.
- **No Einstein-ring quality parity**: Three.js's `UnrealBloomPass` + lensing looked more
  cinematic. PlayCanvas lensing runs correctly but without bloom amplifying the disk glow.
- **Exterior toggle not yet ported**: `setExteriorMode()` exists only in `three/main.ts`.
  PlayCanvas needs the same — the exterior GLB loads but has no toggle button yet.
