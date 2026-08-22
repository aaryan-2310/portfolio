# Unity Space Environment (Sub-Project 5) — Design

> **2026-08-22.** Sub-project 5 of the 7-sub-project Unity space-sim roadmap (see
> [2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md](2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md)).
> Built on the real ship model (sub-project 6, complete) and informed by a
> researched survey of the URP/WebGL-compatible environment-rendering ecosystem
> done earlier this session.

## Why

The `FlightControlTest` scene currently has Unity's default procedural skybox
(no custom environment at all) and a placeholder `Sun` Directional Light added
during sub-project 3's fix wave purely to make the ship visible during camera
testing — not designed, just present. Per the milestone's scope freeze (one
hero spacecraft + physically convincing flight + extremely high visual
fidelity + realistic space environment — no NPC ships, no ship library, no
procedural universe), this sub-project replaces both with a real, physically
grounded environment: an actual star catalog rendered as the sky, and lighting
that behaves like vacuum, not like Unity's default outdoor-daylight rig.

## Scope

**In scope:** import NASA's "Deep Star Maps 2020" (`starmap_2020_4k.exr`, built
from real Gaia DR2/Hipparcos-2/Tycho-2 catalog data) as the scene's skybox via
URP's `Skybox/Panoramic` shader, and replace the placeholder `Sun` light with a
properly configured single Directional Light plus correctly minimal ambient —
"true vacuum lighting": stark shadows, no bounce/fill light beyond whatever the
mostly-black starfield contributes naturally through skybox-sourced ambient.

**Explicitly out of scope:**
- Any visual anchor to fly toward (a planet, station, or other object) — the
  roadmap's original "what's actually flown through/toward" framing is
  deliberately narrowed for this pass to just the sky and lighting; a
  destination/objective is a separate, bigger question ("what's the play
  space") not being opened here.
- Compositing the Milky-Way-background and bright-stars-foreground layers
  separately for independent tuning — NASA's main `starmap_2020_4k.exr` file
  is already a pre-composited combination of both; using it directly avoids
  needing any external image-compositing step. Separate-layer tuning is a
  possible future refinement if the combined map doesn't read dramatically
  enough on its own, not part of this pass.
- Galactic-coordinate or higher-resolution (8K+) variants — celestial
  (ICRF/J2000) coordinates at 4K (34.3MB) is the right fit: correct for a
  3D scene and small enough to not need external downsampling.
- User-facing attribution UI on the eventual portfolio page — NASA/ESA credit
  is required by the data's license, but since the space-sim isn't wired into
  the live portfolio site yet, this pass records the credit at the code level
  (a comment near the skybox setup + the plan's execution record); user-facing
  placement is a decision for whenever the site-integration work happens.
- Thruster VFX (sub-project 4, next after this) or any camera changes
  (sub-project 3, already complete).

## Design

### 1. Acquiring and importing the starfield

Download `starmap_2020_4k.exr` (4096×2048, celestial/ICRF coordinates, 34.3MB)
directly from NASA's SVS page (`https://svs.gsfc.nasa.gov/4851`) into
`Assets/Environment/` in the SpaceSim Unity project. Unity imports `.exr`
natively — no external processing needed. Import settings: mark as a
Default/HDR texture (not sRGB — EXR data is already linear), set an
appropriate max size and compression format for the WebGL build target (the
source is already an efficient 4K resolution; the import-settings step is
about choosing a runtime-compressed format suited to a browser deployment, not
further downsampling).

### 2. Skybox material

Create a `Material` using URP's built-in `Skybox/Panoramic` shader, assign the
imported EXR as its source texture, and set it as `RenderSettings.skybox` for
the `FlightControlTest` scene. This is a single texture-sample shader —
negligible runtime cost, no additional package needed (confirmed during the
earlier research pass).

### 3. Lighting: true vacuum lighting

Replace the placeholder `Sun` light's configuration (not necessarily the
GameObject itself) with deliberately chosen values: a single Directional Light
representing the star the ship is near, with realistic color temperature and
an intensity that reads convincingly against the now-mostly-black skybox — not
Unity's default daylight-rig intensity, which was tuned for an outdoor-scene
default that no longer applies. Check the scene's Environment Lighting source
(Lighting Settings → Environment): if it's set to pull ambient from the
skybox (likely the default), the new mostly-black starfield should already
suppress ambient naturally — verify this visually rather than assuming, and
only add explicit ambient-intensity tuning if the result looks wrong (either
too flat from leftover ambient, or so dark the ship reads as a silhouette with
no separation from the background).

### 4. Attribution

Add a code comment at the point the skybox material/texture is set up, crediting
"NASA/Goddard Space Flight Center Scientific Visualization Studio" and
"ESA/Gaia/DPAC" per the data's license terms. Record the same credit in this
plan's execution record for durability.

### 5. Verification

No automated check applies here — this is visual/rendering configuration, not
physics or control logic, so there's nothing numeric to assert. Verification
is a screenshot handoff (same pattern as sub-project 6): capture the
`FlightControlTest` scene showing the ship against the new starfield and
lighting, for the user to confirm it looks right. No live-flying gate needed.

## Non-goals

Restated from Scope: no visual anchor/destination object, no separate-layer
starfield compositing, no galactic-coordinate or 8K+ variants, no user-facing
attribution UI, no thruster or camera work.
