# WLV-01 Unity Flight-Sim Roadmap + Sub-Project 1 (Physics Bring-Up) Design

> **2026-08-10.** Major architectural pivot: the `/v2` PlayCanvas 3D experience (cockpit, exterior
> vessel, materials, exterior-toggle feature — all built earlier this session and in prior
> sessions) will be **fully replaced** by a Unity WebGL interactive space-sim, prioritizing
> "best-in-class quality" over the smaller footprint PlayCanvas offered. This document records
> the roadmap decomposition and the detailed design for the first sub-project.

## Why the pivot

Discussed at length in conversation (not repeated in full here): the ambition moved from "polish
the existing PlayCanvas hero scene" to "build a genuine interactive space-sim with real Newtonian
flight physics, quality above all." That ambition doesn't fit PlayCanvas's physics story well
(Ammo.js WASM isn't bundled in the npm package and needs separate sourcing) and benefits from
Unity's mature physics/rendering ecosystem. The user explicitly chose quality over the bundle-size
and rewrite costs this implies (Unity WebGL builds are typically tens of MB vs. PlayCanvas's
~200KB core; everything built in PlayCanvas this session — cockpit, exterior vessel, materials,
the exterior-toggle feature already live in production — gets replaced, not extended).

**Verified, not assumed** (via web search this session): HDRP does not support WebGL, and still
doesn't support the emerging WebGPU path as of Unity 6.1 — Unity's own 2026 platform strategy
confirms continued investment goes to URP for web/cross-platform, not HDRP. **This project uses
URP**, not HDRP — confirmed as already configured in the connected Unity project (fresh Unity
6000.5.8f1 project, Universal 3D template, `PC_RPAsset`/`Mobile_RPAsset` present, new Input
System package already installed).

## Roadmap: 7 sub-projects

Each gets its own spec → plan → build cycle. Order respects dependencies:

1. **Physics bring-up** *(no dependencies — this document)*: prove Unity's built-in physics
   (Rigidbody/PhysX, zero external packages needed) behaves correctly for Newtonian space flight
   before building anything user-facing on top of it.
2. **Newtonian flight controls** *(needs #1)*: real input (new Input System, already installed)
   mapped to force/torque on the ship's rigid body. Degrees-of-freedom (full 6DOF vs. constrained)
   is an open question for that spec. Apply the **engineering-grounded lens** (see below): decompose
   the propulsion/RCS layout as a real subsystem before mapping input to force/torque.
3. **Flying camera mode** *(needs #2)*: replaces the old static `EXT_CAM` reveal shot entirely
   (per the "fully replace" decision) — chase-cam vs. other options TBD in that spec.
4. **Visual feedback** *(needs #2)*: thruster particles (URP-compatible VFX Graph), engine glow
   tied to throttle, speed sensation. Apply the **engineering-grounded lens**: drive these visuals
   from the propulsion subsystem's actual state (throttle → fuel flow → thrust → exhaust), not as
   decoration bolted onto the hull.
5. **Play space** *(needs #1, informs #3's bounds)*: what's actually flown through/toward —
   explicitly deferred until physics bring-up shows what's feasible.
6. **Asset pipeline into Unity**: bringing the existing Blender-authored GLB assets (`deck.glb`,
   `wlv01_exterior.glb`, with today's radiator/hull-fix/curved-window/PBR-materials work) into
   Unity via the **glTFast** (or UnityGLTF) package, rather than re-modeling from scratch. Not
   strictly ordered relative to 2-5 — needed whenever the real ship model (rather than a
   placeholder) is required. Sub-project 1 deliberately does NOT need this (see below). Apply the
   **engineering-grounded lens**: preserve component-level object structure on import (engine
   housing/nozzle/gimbal as separate nodes, not one fused mesh) wherever sub-projects 2/4 need to
   drive a part independently.
7. **Cockpit / first-person camera mode** *(needs #2)*: a toggleable first-person view from the
   ship's cockpit, alongside sub-project 3's chase camera. Added 2026-08-15 — was one of the
   options considered for sub-project 3 (chase-cam vs. cockpit vs. both), which chose chase-cam
   only; tracked here rather than left unscheduled. Unordered relative to #4-#6; not started.

### Design lens for sub-projects 2, 4, 6: engineering-grounded subsystems

Decided 2026-08-16, folded in rather than spun up as standing infrastructure: no new Claude Code
agents (`spacecraft-systems-engineer`, `physics-reviewer`), no four-layer asset ontology, no
runtime digital-twin/telemetry API. WLV-01 is one hero ship for a portfolio site, not a
multi-vessel sim — docking, deployable radiators, and landing-gear actuation stay out of scope
unless a future sub-project actually needs them. What *is* adopted, applied inline when each of
these three sub-projects gets its own brainstorming cycle:

- **Subsystem decomposition before mapping.** For sub-project 2, work out the propulsion/RCS
  layout as a real system first — how many thrusters, where, opposing pairs for pure rotation vs.
  offset for combined translation+rotation, gimbaled main engine or fixed — *then* map Input
  System actions to the forces/torques that layout actually produces. Not "map WASD to
  AddForce/AddTorque and call it done."
- **Physics-plausibility check, not a separate review agent.** Before finalizing sub-project 2's
  thruster placement, sanity-check by hand (or ask in the same session) whether the claimed
  authority is real: does this RCS arrangement actually produce the yaw/pitch/roll authority the
  design assumes, given where the thrusters sit relative to the center of mass? This is a question
  asked during that spec's own design section, not a standing gate run by a dedicated agent.
  Mirrors the discipline sub-project 1 already applies to momentum (logged, asserted, not
  eyeballed) and that the in-flight PBR-materials plan already applies to surface detail (anchored
  to a real Apollo CM reference, not invented).
- **State-driven visuals, not decoration.** Sub-project 4's thruster/engine-glow VFX should read
  from the propulsion subsystem's actual per-thruster/throttle state established in sub-project 2,
  so visual intensity tracks real thrust rather than an independently-tuned particle system.
- **Component-preserving import.** Sub-project 6's GLB import should keep the physical parts that
  sub-projects 2/4 need to drive individually — main-engine nozzle, any gimbal mount, thruster
  nozzles — as separately addressable objects/nodes in the Unity scene graph, not baked into one
  static mesh, *if* those sub-projects end up needing to move or light a specific part
  independently. Don't restructure the existing export for parts nothing yet drives.

## Sub-Project 1: Physics Bring-Up — detailed design

### Scope

Pure infrastructure validation. No visible feature, no real ship model — a placeholder cube
proves the physics setup is correct before anything is built on top of it. Explicitly chosen over
importing the real ship model now, to keep this sub-project decoupled from the glTFast import
question (sub-project 6) and to reduce variables while validating physics specifically.

### Global project setting

`Physics.gravity` set to `(0, 0, 0)` in Project Settings → Physics. This is a project-wide
setting (not per-object) — space flight has no ambient gravitational pull in this design; the
ship only moves via applied thrust. (Orbital mechanics around the black hole, if ever wanted, is
explicitly out of scope — would be a future, much more advanced addition, not part of this
roadmap.)

### Test scene

New scene: `Assets/Scenes/PhysicsSmokeTest.unity` — kept separate from `SampleScene.unity` and
any future real game scene specifically so this throwaway validation can be deleted later without
touching real content.

### Three isolated test objects

Each a plain `GameObject` (Unity primitive cube) with `Rigidbody` + `BoxCollider`. Critically,
**`Rigidbody.linearDamping` and `Rigidbody.angularDamping` must be explicitly set to `0`** —
Unity's default `Rigidbody` ships with a small nonzero drag value, which would make the "infinite
drift" test pass on a false premise (the object would still be slowly decelerating, just slowly
enough to not notice over a short test).

1. **`ImpulseDriftTest`**: on `Start()`, one `rb.AddForce(direction * impulseMagnitude, ForceMode.Impulse)`.
   Then log `rb.linearVelocity.magnitude` every 2 seconds for at least 10 seconds via
   `Debug.Log`. **Pass condition**: logged magnitude stays constant within float tolerance
   (±0.001) across all samples — proves true momentum conservation, no hidden drag.
2. **`ContinuousThrustTest`**: a `bool thrusting` flag (toggled by a simple test-harness script,
   not real player input — that's sub-project 2's job) drives `rb.AddForce(thrustDirection *
   thrustForce, ForceMode.Force)` every `FixedUpdate()` while `true`. Log velocity magnitude each
   `FixedUpdate` while thrusting (should visibly increase call-over-call) and for 5 seconds after
   `thrusting` is set `false` (should stay constant, not decay). **Pass condition**: velocity
   increases monotonically while thrusting, then holds constant after release.
3. **`CollisionMomentumTest`**: two rigid bodies with known, different masses, positioned on a
   guaranteed collision course with known initial velocities. On `OnCollisionEnter`, log both
   bodies' velocity and compute total momentum (`m₁v₁ + m₂v₂` as a `Vector3`) immediately before
   and immediately after the collision frame. **Pass condition**: total momentum vector matches
   within tolerance (±1%) before vs. after — proves the collision system conserves momentum
   realistically, not just "something visually happened."

### Verification method

**Numeric, not visual.** All three tests log through `Debug.Log`, read back via
`Unity_ReadConsole` (Action: Get, Types: [Log]). This matches the pattern established all session
with the Blender work — logged/asserted numeric values proved far more reliable than screenshot
tools for verifying whether something actually worked (the Blender viewport-screenshot tool had
real, repeated staleness issues this session). `Unity_SceneView_Capture2DScene` or
`Unity_Camera_Capture` may be used as an additional sanity check, but the pass/fail criteria are
the logged numbers, not a screenshot.

### Explicit non-goals (this sub-project)

- No real ship model — placeholder cubes only (glTFast import is sub-project 6, pulled in only
  when actually needed).
- No real player input — the "continuous thrust" test uses a scripted flag, not the Input System
  (that's sub-project 2).
- No camera work, no visual effects, no play-space design.
- No orbital mechanics / gravitational simulation around the black hole or any other body.

## Explicit non-goals (whole roadmap document)

- This document does not spec sub-projects 2-6 in detail — each gets its own brainstorming cycle
  once its dependencies are met, per the decomposition principle ("too large for a single spec").
- No commitment yet on exact flight-control scheme (DOF, input mapping) — deferred to
  sub-project 2's own spec.
- No commitment yet on play-space scale/objectives — deferred to sub-project 5's own spec.
