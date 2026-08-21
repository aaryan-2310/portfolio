# Unity Ship Asset Import (Sub-Project 6) — Design

> **2026-08-22.** Sub-project 6 of the 7-sub-project Unity space-sim roadmap (see
> [2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md](2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md)).
> **Pulled forward out of its nominal order**: while brainstorming sub-project 4
> (visual feedback), it became clear that building thruster effects against the
> placeholder box (no defined engine/nozzle positions) meant inventing mount
> points that would just be thrown away once the real model arrived. The roadmap
> already noted sub-project 6 is "not strictly ordered relative to 2-5 — needed
> whenever the real ship model is required" — that point is now.

## Why

Sub-projects 1-3 (physics, flight controls, chase camera) were deliberately built
and verified against a placeholder box, decoupling core-systems work from the
asset pipeline. That decoupling served its purpose — three solid sub-projects
shipped without waiting on this. But sub-project 4 (visual feedback) needs real
engine geometry to mean anything, and every sub-project after it benefits from
flying the actual Blender-authored ship (`wlv01_exterior.glb`, `deck.glb`) rather
than a stand-in.

## Scope

**In scope:** install glTFast, import both existing GLB assets
(`worldline-lab/shared/assets/wlv01_exterior.glb`, `deck.glb` — the same files
already used by the production PlayCanvas `/v2` experience), wire
`wlv01_exterior.glb` into the `FlightControlTest` scene's `Ship` GameObject as a
child hierarchy, resize `Ship`'s `BoxCollider` to match, scale the imported model
to the placeholder's existing footprint, and verify nothing regressed.

**Explicitly out of scope:**
- `deck.glb` scene integration — imported and validated as an asset only; wiring
  it up (presumably for a cockpit view) is sub-project 7's job, not yet scheduled.
- Material/texture polish — GLB materials get wired up as glTFast imports them;
  if something looks visually wrong, that's a follow-up, not a blocker here.
- Mesh-accurate collision — `BoxCollider` stays a simple primitive shape (see
  Design §3).
- Any changes to the PlayCanvas `/v2` production code or assets — already
  superseded by the "fully replace with Unity" decision made earlier in this
  roadmap.
- Resuming the paused PBR-materials plan from an earlier session
  (`docs/superpowers/plans/2026-08-10-wlv01-pbr-materials.md`) — separate,
  unrelated work; this sub-project imports the GLBs as they exist today.
- Sub-project 4's actual thruster/glow work — this sub-project only clears the
  path for it by providing real geometry.

## Design

### 1. Import mechanism

Install `com.unity.formats.gltf.editor` (glTFast) — Unity's first-party GLB/glTF
importer. Chosen over UnityGLTF: our assets are static meshes with PBR materials
and no animation/skinning, so UnityGLTF's extra animation-import surface adds
nothing here, and glTFast is the more actively maintained default for this case.
Import both `wlv01_exterior.glb` and `deck.glb`; glTFast auto-generates a prefab
per imported GLB.

### 2. Wiring the exterior model into the flying ship

`wlv01_exterior.glb` imports as a multi-object hierarchy (hull, radiators,
docking port, engine, RCS thrusters — per the earlier Blender sessions' work),
not a single mesh, so it can't simply replace the placeholder box's
`MeshFilter`. Instead, the imported model's root is instantiated as a **child**
of the existing `Ship` GameObject in `FlightControlTest.unity`. `Rigidbody`,
`BoxCollider`, `ShipPhysicsController`, and `ShipInputReader` all stay on the
parent `Ship` object, untouched — every constant sub-projects 2-3 tuned
(`maxThrustForce`, `maxTorqueForce`, camera `distance`/`height`) and every
automated test that verified them stays valid, since none of it depends on what
`Ship` visually contains. The placeholder box's own `MeshFilter`/`MeshRenderer`
are removed once the real child hierarchy is in place.

### 3. Collision shape stays a simple primitive

`Ship` keeps a `BoxCollider` (resized to roughly match the imported model's
bounding box), not a mesh collider tracing the real hull. Mesh colliders are
expensive and behave unreliably on dynamic `Rigidbody`s, and there is nothing to
collide with precisely yet — sub-project 5 (play space) hasn't started. Exact
hull-shaped collision is a future refinement if it ever actually matters
gameplay-wise, not a default to reach for now.

### 4. Scale reconciliation

The imported model's root gets scaled to roughly match the placeholder box's
existing footprint (`~1×1×2.5` local units), rather than rescaling the ship's
physics constants and camera distance to the model's native size. This is the
lower-risk direction: sub-project 2's `ShipControlMappingTest` and sub-project
3's camera verification harness both encode specific numeric expectations tied
to the placeholder's scale (expected speeds, angular rates, tracking-dot
thresholds) — rescaling the *model* to fit those leaves all of that tuning and
verification work intact; rescaling the *physics* to fit the model's native size
would require retuning and re-verifying constants that already passed review.

### 5. Verification

**Automated regression check:** re-enable and re-run sub-project 2's
`ShipControlMappingTest` and sub-project 3's `ShipCameraVerificationTest` (both
currently disabled in the saved scene, per their own plans' final steps) against
the scene with the real model attached. Same `RESULT:` numeric pattern as every
prior sub-project — this proves the hierarchy change didn't silently alter mass,
collider bounds, or anything else those tests depend on, rather than assuming it
didn't.

**Automated import-correctness checks:** confirm via `Unity_ReadConsole` that
the import produced no missing-shader/pink-material errors or warnings; confirm
via `Unity_ManageGameObject`/scene inspection that the imported hierarchy is
correctly parented under `Ship` and that `BoxCollider` bounds roughly match the
visual mesh's bounds (a sanity check, not exact-fit).

**Manual:** a screenshot for the user to confirm the ship actually looks like
the intended model. This sub-project is an asset swap, not new behavior, so
there's no "does it feel right" playtest gate the way flight controls or the
camera had — visual confirmation is enough.

## Non-goals

Restated from Scope: no `deck.glb` scene wiring, no material/texture polish
pass, no mesh-accurate collision, no PlayCanvas `/v2` changes, no PBR-materials
plan revival, no sub-project 4 work itself.
