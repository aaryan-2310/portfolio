# Unity Space Environment (Sub-Project 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Unity's default procedural skybox and the placeholder `Sun` light with a real, Gaia-catalog-based starfield and true vacuum lighting.

**Architecture:** NASA's `starmap_2020_4k.exr` (real star-catalog data, already pre-composited by NASA — no external image processing needed) becomes the source texture for a `Skybox/Panoramic` material, assigned to the scene's `RenderSettings.skybox`. The existing placeholder `Sun` `Light` GameObject (added in sub-project 3's fix wave purely to make the ship visible during camera testing) gets reconfigured, not replaced, to actually look like a star in vacuum — enabled shadows, tuned intensity, and Unity's skybox-sourced ambient recomputed from the new (mostly black) sky.

**Tech Stack:** Unity 6000.5.8f1, URP's built-in `Skybox/Panoramic` shader (no new package). Controlled via `mcp__unity-mcp__*` MCP tools.

**Spec:** [docs/superpowers/specs/2026-08-22-unity-space-environment-design.md](../specs/2026-08-22-unity-space-environment-design.md)

## Global Constraints

- **File paths are relative to the Unity project root `C:/Users/U6077517/SpaceSim`** (separate git repo from this portfolio repo — all `git` commands run with cwd = that root). Current HEAD there is `b70a0d6`.
- The source file is `starmap_2020_4k.exr` (4096×2048, celestial/ICRF coordinates), confirmed downloadable at exactly `https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/starmap_2020_4k.exr` (verified via `curl -I`: `200 OK`, `Content-Length: 35997085`). Use this exact URL — don't substitute the galactic-coordinate or a different-resolution variant.
- No external image processing (no downsampling, no compositing separate layers) — the file is used exactly as downloaded. Unity imports `.exr` natively.
- Attribution is required by the data's license: "NASA/Goddard Space Flight Center Scientific Visualization Studio" for the imagery, "ESA/Gaia/DPAC" for the underlying star catalog. Recorded as a durable, git-tracked file (`Assets/Environment/CREDITS.md`) alongside the asset — there's no persistent C# script in this plan to put a code comment in, so a credits file is the equivalent durable record.
- No visual anchor/destination object, no play-space content, no thruster or camera work — out of scope per the spec.
- No automated numeric verification applies (this is visual/rendering configuration, not physics or control logic) — verification is a screenshot handoff, same pattern as sub-project 6.
- Every Unity asset git-add must include its paired `.meta` file.

---

### Task 1: Import the starfield, build the skybox, refresh ambient

**Files:**
- Create: `Assets/Environment/starmap_2020_4k.exr` (downloaded from NASA), `Assets/Environment/StarfieldSkybox.mat`, `Assets/Environment/CREDITS.md`
- Modify: `Assets/Scenes/FlightControlTest.unity` (assigns the new skybox, refreshes the ambient probe)

**Interfaces:**
- Produces: `Assets/Environment/StarfieldSkybox.mat` assigned as `RenderSettings.skybox` — Task 2 doesn't consume this directly (it only touches the `Sun` light and ambient values, which are downstream effects of this task, not a direct code interface).

- [x] **Step 1: Download the starfield and write the credits file**

```bash
mkdir -p /c/Users/U6077517/SpaceSim/Assets/Environment
curl -o /c/Users/U6077517/SpaceSim/Assets/Environment/starmap_2020_4k.exr \
  "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/starmap_2020_4k.exr"
ls -la /c/Users/U6077517/SpaceSim/Assets/Environment/starmap_2020_4k.exr
```

Expected file size: ~35997085 bytes (~34.3 MB). If it's significantly smaller (e.g. a few KB), the download failed (likely an HTML error page saved instead of the binary) — check the response before proceeding.

Write `Assets/Environment/CREDITS.md`:

```markdown
# Environment Asset Credits

## Starfield skybox — `starmap_2020_4k.exr`

Source: NASA Scientific Visualization Studio, "Deep Star Maps 2020"
https://svs.gsfc.nasa.gov/4851

Credit: NASA/Goddard Space Flight Center Scientific Visualization Studio.
Star data: ESA/Gaia/DPAC (Gaia DR2), plus Hipparcos-2 and Tycho-2 catalogs.

Used as-is (celestial/ICRF coordinates, 4K resolution) with no modification,
per the dataset's free-use-with-credit terms.
```

- [x] **Step 2: Trigger import and fix the texture's color-space setting**

Call `mcp__unity-mcp__Unity_ManageAsset` with `Action: "Import"`, `Path: "Assets/Environment/starmap_2020_4k.exr"`, `GeneratePreview: false`.

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Error", "Warning"]`, `Count: 20`. Expected: no errors.

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        string texPath = "Assets/Environment/starmap_2020_4k.exr";
        var importer = (TextureImporter)AssetImporter.GetAtPath(texPath);
        result.RegisterObjectModification(importer);
        // EXR data is linear/HDR, not sRGB-encoded — mark it correctly so
        // Unity doesn't apply an unwanted gamma conversion on sample.
        importer.sRGBTexture = false;
        importer.textureType = TextureImporterType.Default;
        EditorUtility.SetDirty(importer);
        importer.SaveAndReimport();

        var starTexture = AssetDatabase.LoadAssetAtPath<Texture2D>(texPath);
        result.Log("starTexture loaded: {0}, width={1}, height={2}",
            starTexture != null, starTexture != null ? starTexture.width : 0, starTexture != null ? starTexture.height : 0);
    }
}
```

Expected: `starTexture loaded: True, width=4096, height=2048`.

- [x] **Step 3: Confirm the Panoramic skybox shader's texture property name before using it**

Don't assume the property name — verify it. Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        Shader panoramicShader = Shader.Find("Skybox/Panoramic");
        result.Log("Skybox/Panoramic shader found: {0}", panoramicShader != null);
        if (panoramicShader == null) return;

        int propCount = panoramicShader.GetPropertyCount();
        for (int i = 0; i < propCount; i++)
        {
            result.Log("property[{0}] name={1} type={2}", i,
                panoramicShader.GetPropertyName(i), panoramicShader.GetPropertyType(i));
        }
    }
}
```

Find the property of type `Texture` (there should be exactly one, most likely named `_MainTex` — Unity's built-in Panoramic skybox shader has used this name across recent versions, but confirm from the actual logged output before the next step, and substitute the real name if it differs).

- [x] **Step 4: Build the material, assign it, refresh ambient**

Call `mcp__unity-mcp__Unity_RunCommand` with (replace `_MainTex` if Step 3 found a different property name):

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var starTexture = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/Environment/starmap_2020_4k.exr");
        Shader panoramicShader = Shader.Find("Skybox/Panoramic");

        var skyMat = new Material(panoramicShader);
        skyMat.SetTexture("_MainTex", starTexture);
        AssetDatabase.CreateAsset(skyMat, "Assets/Environment/StarfieldSkybox.mat");
        result.RegisterObjectCreation(skyMat);

        RenderSettings.skybox = skyMat;

        // Ambient is sourced from the skybox (m_AmbientMode: 0, confirmed in the
        // live scene) — force Unity to recompute the ambient probe from the new
        // (mostly black) sky rather than leaving stale values from the old
        // default procedural skybox.
        DynamicGI.UpdateEnvironment();

        EditorUtility.SetDirty(skyMat);
        result.Log("skybox assigned: {0}, ambientSkyColor={1}", RenderSettings.skybox != null, RenderSettings.ambientSkyColor);
    }
}
```

Expected: `skybox assigned: True`, and `ambientSkyColor` reading something close to black (e.g. each channel well under `0.05`) — not the old default's blue-ish `(0.212, 0.227, 0.259)`. If it's still close to the old value, `DynamicGI.UpdateEnvironment()` may need the Editor to process a frame first — try calling `mcp__unity-mcp__Unity_ManageEditor` with `Action: "GetState"` (a harmless round-trip that lets pending Editor work flush) and re-check `RenderSettings.ambientSkyColor` via a fresh `Unity_RunCommand` log before concluding it didn't work.

- [x] **Step 5: Save the scene and take a sanity-check screenshot**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

Call `mcp__unity-mcp__Unity_SceneView_Capture2DScene` (or `Unity_Camera_Capture`) to confirm visually: the background should now show stars against black/near-black, not Unity's default blue gradient sky.

- [x] **Step 6: Commit**

```bash
git add Assets/Environment/starmap_2020_4k.exr Assets/Environment/starmap_2020_4k.exr.meta \
        Assets/Environment/StarfieldSkybox.mat Assets/Environment/StarfieldSkybox.mat.meta \
        Assets/Environment/CREDITS.md Assets/Environment.meta \
        Assets/Scenes/FlightControlTest.unity
git commit -m "feat: import NASA Deep Star Maps 2020 starfield as the scene skybox"
```

(Check `git status --short` first — glTFast-style importers sometimes generate extra files; include anything under `Assets/Environment/` that appeared as a result of the import.)

---

### Task 2: True vacuum lighting for the `Sun` light

**Files:**
- Modify: `Assets/Scenes/FlightControlTest.unity` (reconfigures the existing `Sun` `Light` component — shadows enabled, intensity tuned)

**Interfaces:** None — this task only changes serialized values on an existing component, no new code or cross-task interface.

- [x] **Step 1: Load the scene and enable shadows on `Sun`**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Load"`, `Name: "FlightControlTest"`, `Path: "Assets/Scenes"` (if not already the active scene).

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var sunGO = GameObject.Find("Sun");
        var light = sunGO.GetComponent<Light>();
        result.RegisterObjectModification(light);

        // Space has no atmosphere to scatter light and soften shadow edges —
        // hard shadows are the physically honest choice for a directional
        // "star" light, not a stylistic one.
        light.shadows = LightShadows.Hard;
        light.intensity = 3f; // starting point — tune in Step 2 based on the screenshot

        EditorUtility.SetDirty(light);
        result.Log("Sun light configured: shadows={0}, intensity={1}", light.shadows, light.intensity);
    }
}
```

- [x] **Step 2: Save, screenshot, and tune intensity visually**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

Call `mcp__unity-mcp__Unity_SceneView_Capture2DScene` (or `Unity_Camera_Capture`) framing the `Ship`.

Judge the result against these criteria, not a specific target number:
- The ship's hull should read with clear form and shading (visible highlights and shadow gradients across the hull's panels), not flat/silhouetted.
- No blown-out, fully-white highlights on the hull's brightest surfaces.
- The background stays essentially black except for the stars themselves — no washed-out haze.

If the ship looks too dark/flat, increase `light.intensity` (try `5`, then `8` if still not enough) via another `Unity_RunCommand` call setting `light.intensity` directly on the same `Light` component, re-screenshot, repeat. If it looks overexposed, decrease it. Once satisfied, note the final chosen value for the report — there's no single "correct" number here, only "looks convincingly like a spacecraft lit by a real star in vacuum."

- [x] **Step 3: Commit**

```bash
git add Assets/Scenes/FlightControlTest.unity
git commit -m "feat: configure true vacuum lighting for the Sun light (shadows, tuned intensity)"
```

---

## Final Verification

After Task 2, the scene shows the real ship against a real, Gaia-catalog-based starfield, lit by a single directional light with hard shadows and minimal skybox-sourced ambient — no more default procedural sky, no more placeholder lighting. There's no automated check for this (it's visual configuration, not logic), so the actual acceptance signal is the screenshots taken in both tasks — hand them to your human partner. If the lighting intensity or shadow softness still doesn't look right once seen at full resolution, that's a quick follow-up (`Light.intensity`/`Light.shadows` on the `Sun` GameObject), not a re-open of this plan.

This closes sub-project 5. Sub-project 4 (thruster VFX, using the built-in Particle System per the researched ecosystem survey — VFX Graph is unavailable on WebGL) is next.

**Known follow-up, tracked separately, not part of this plan:** `Ship/wlv01_exterior/Ext_AftFairing` is still on glTFast's fallback default material (fully metallic, fully rough, no diffuse response) — a pre-existing gap from sub-project 6's import, made visible now that the environment is dark instead of a bright default sky. Flagged as its own follow-up task rather than fixed here, since fixing it would reopen an already-closed plan's scope.

---

## Execution Record

Both tasks executed via subagent-driven-development, per-task reviews skipped per standing instruction (one final review only). Full ledger with every controller ruling: `.superpowers/sdd/2026-08-22-unity-space-environment/progress.md` (deleted after this plan closes — this section is the durable summary).

**SpaceSim commit history** (`C:/Users/U6077517/SpaceSim`, building on sub-project 6's `b70a0d6`):
- `39fc3dd` — Task 1: import the starfield, build the skybox, refresh ambient
- `9e3dffa` — Task 2: true vacuum lighting for the `Sun` light
- `30f2ff1` — Git LFS configured for forward-only `*.exr`/`*.glb` tracking (user-requested during final review triage, not a retroactive history migration — that would rewrite every commit hash referenced throughout this session's documentation)
- `ae19267` — `CREDITS.md` licensing-language precision fix
- `aeb1f41` — final-review fix wave (WebGL texture format, measured lighting)

**Two real findings caught and self-corrected by implementers, no escalation needed:** Task 1's import script (as written in the plan) omitted `maxTextureSize`, silently halving the texture to 2048×1024 — caught via self-review, fixed to the correct 4096×2048 before committing. Separately, the plan's own verification criterion checked the wrong `RenderSettings` field (`ambientSkyColor`, which is Trilight-mode-only) for confirming the ambient refresh — the implementer correctly identified `ambientProbe` as the field that actually matters for this scene's Skybox ambient mode, and verified against that instead.

**Final whole-branch review** (opus, range `b70a0d6..9e3dffa`) verified extensively via live Unity queries rather than trusting the diff or either party's claims — confirmed the texture's actual resolution and color-space settings, confirmed every asset reference resolves with no dangling `{fileID: 0}`, and independently verified the ambient-mode correction by reading which `RenderSettings` field Unity's own shaders actually consume for Skybox mode, backed by two discriminators (a 12× magnitude jump and a hue-order flip that a stale value couldn't produce). Found 3 Important findings, no Critical:
1. **Fixed** (commit `aeb1f41`): the WebGL texture platform override was never set, so Unity would resolve the starfield to 8-bit LDR `DXT5` at build time — clipping HDR star brightness and banding across the near-black gradients. A spec-required setting the plan's script silently dropped. Overrode with `RGB9E5` (HDR-capable, uncompressed), verified via readback.
2. **Fixed** (commit `aeb1f41`): the screenshot-tuned `Sun.intensity=3` was never checked against actual pixel values, and with zero `Volume`/tonemapper components in the scene, URP hard-clips at 1.0 with no headroom — a screenshot can't visually distinguish a value just over 1.0 from exactly 1.0. Measured via pixel readback (not just re-judged by eye): p95-of-hull-pixels at intensity 3 was `1.087`, closely matching the reviewer's own analytical prediction (`~1.17`) and confirming the finding was real, not speculative. Reduced to intensity `2` (p95 = `0.733`, comfortably non-clipping) using a p95 threshold rather than literal single-pixel max — a small specular-glint pixel population clips at any reasonable intensity, and chasing zero clipped pixels anywhere would underexpose the entire hull to avoid a physically normal artifact. Also set a deliberate light direction (`(35, 200, 0)`, confirmed via close-up render to give real three-quarter shading, not a flat face) and enabled realistic color temperature (`6570K`, reusing the scene's existing dormant value) — both explicitly requested by the spec ("deliberately chosen values") but dropped by the plan, which only tuned intensity.
3. **Not fixed here, flagged as a follow-up** (see above): `Ext_AftFairing`'s missing material — confirmed pre-existing from sub-project 6, not introduced by this plan.

**Final committed scene/asset state** (`FlightControlTest.unity`, `starmap_2020_4k.exr.meta` in the SpaceSim repo) reflects the fix wave — read those files directly for the authoritative current values (intensity, direction, color temperature, WebGL texture format) rather than the plan's own Task 2 code block above, which shows the pre-review starting values.
