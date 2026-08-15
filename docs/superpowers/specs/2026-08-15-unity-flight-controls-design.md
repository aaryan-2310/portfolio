# Unity Newtonian Flight Controls (Sub-Project 2) — Design

> **2026-08-15.** Sub-project 2 of the 6-sub-project Unity space-sim roadmap (see
> [2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md](2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md)).
> Builds directly on sub-project 1's verified-correct zero-gravity physics foundation
> (`PhysicsSmokeTest.unity`, SpaceSim commits `767d493`..`31f396e`).

## Why

Sub-project 1 proved Unity's Rigidbody/PhysX supports true Newtonian behavior — impulse
drift, force-driven acceleration, momentum-conserving collisions — but nothing was
controllable. Sub-project 2 puts real player input on top of that verified foundation: the
first point where "quality above all, genuine interactive space-sim" becomes something a
person can actually fly, rather than a passive physics proof.

## Scope

**In scope:** a new Input System action map for ship control, a controllable placeholder
ship object with full 6DOF Newtonian flight (no flight-assist, no auto-leveling, no
damping), a dedicated test scene, automated verification that each input axis maps to the
correct physics response, and a live playtest to confirm actual flight feel.

**Explicitly out of scope** (deferred to later sub-projects or simply not needed here):
- The real ship model — a placeholder box stands in; real-asset import is sub-project 6.
- A real flying-camera system — sub-project 3's job. This sub-project's camera is a
  minimal, unstyled follow script that exists only so the live playtest has something to
  look through, and is explicitly not a design decision binding sub-project 3.
- Gamepad/joystick support — keyboard + mouse only.
- A flight-assist / auto-damping toggle — the roadmap's confirmed decision is true
  Newtonian physics (zero damping, independent rotation/translation); an assist mode is a
  possible future addition on top of this foundation, not part of it.
- HUD, UI, or any visual feedback beyond the placeholder box's own transform (thruster
  visuals are sub-project 4).
- Any play-space boundaries, obstacles, or objectives (sub-project 5, explicitly deferred
  until this sub-project shows what's feasible).

## Design

### 1. Input action map

A new `Ship` action map added to the existing `Assets/InputSystem_Actions.inputactions`
asset (the pre-existing `Player` map — Move/Look/Attack/Interact/Crouch/Jump/Sprint, all
unused template leftovers from the Universal 3D template — is left untouched; it belongs to
no feature in this project and isn't this sub-project's concern to clean up).

Three actions in the `Ship` map:
- **`Thrust`** (Vector3, 3D Vector Composite): `W`/`S` → forward/back, `A`/`D` → strafe
  left/right, `Space`/`Left Ctrl` → up/down. Represents a desired local-space thrust
  direction, each axis in `[-1, 1]`.
- **`Look`** (Vector2, mouse delta): X-axis drives yaw, Y-axis drives pitch.
- **`Roll`** (1D Axis): `Q`/`E` → roll left/right, range `[-1, 1]`.

Keyboard + mouse only — no gamepad bindings (see Scope).

### 2. Architecture: split input reader + physics controller

Two components, matching the approved split (chosen specifically because it makes the
verification approach in Section 4 tractable without needing to simulate real input-device
events):

- **`ShipInputReader`** (`MonoBehaviour`): reads the three `Ship` actions once per frame via
  the Input System's generated C# wrapper class, applies a `mouseSensitivity` scaling
  factor to `Look`, and exposes the current frame's input as a plain, dependency-free
  struct:
  ```csharp
  public struct ShipControlInput
  {
      public Vector3 thrust; // local-space, magnitude 0-1 per axis
      public Vector3 torque; // x=pitch, y=yaw, z=roll, magnitude 0-1 per axis
  }
  ```
  `ShipInputReader` has no knowledge of Rigidbody, forces, or physics — its only job is
  translating raw input into this struct.

- **`ShipPhysicsController`** (`MonoBehaviour`): consumes a `ShipControlInput` each
  `FixedUpdate` (read from `ShipInputReader` when both are present on the same GameObject,
  or injectable directly for the automated verification harness — see Section 4) and
  applies it to the Rigidbody:
  - `rb.AddForce(transform.TransformDirection(input.thrust) * maxThrustForce, ForceMode.Force)`
  - `rb.AddTorque(transform.TransformDirection(input.torque) * maxTorqueForce, ForceMode.Force)`

  `maxThrustForce` and `maxTorqueForce` are public tunable fields (single scalars, not
  per-axis — no requirement yet for asymmetric axis strength, and adding it later if needed
  is a small, backward-compatible change). `ShipPhysicsController.Start()` explicitly sets
  `rb.linearDamping = 0`, `rb.angularDamping = 0`, `rb.useGravity = false` — the same
  zero-damping pattern sub-project 1 established, load-bearing here because any leftover
  damping would silently reintroduce the flight-assist behavior the roadmap explicitly
  decided against.

  `Physics.gravity` is already `(0, 0, 0)` project-wide from sub-project 1 (a Project
  Setting, not a per-scene value) — nothing new to configure.

### 3. Scene + placeholder objects

New scene `Assets/Scenes/FlightControlTest.unity`, kept separate from sub-project 1's
`PhysicsSmokeTest.unity` (that scene stays a pure automated-physics-proof scene; this one is
for interactive control, a different purpose).

- **Placeholder ship**: an elongated box (non-uniform scale so local +Z is visibly the long
  axis, i.e. "forward" is unambiguous when watching it fly) with `Rigidbody` + `BoxCollider`
  + `ShipInputReader` + `ShipPhysicsController`.
- **Placeholder camera**: a plain `LateUpdate`-driven follow script — camera position
  tracks a fixed offset behind and above the ship (`ship.position - ship.forward * distance
  + Vector3.up * height`), looks at the ship, no smoothing, no collision avoidance. Purely
  functional scaffolding for the live playtest in Section 4; not a sub-project-3 design
  artifact.

### 4. Verification

**Automated (proves the control mapping is wired correctly):** a test harness in the same
spirit as sub-project 1's self-asserting scripts — constructs synthetic `ShipControlInput`
values directly (bypassing `ShipInputReader` and any real input device entirely) and feeds
them straight to `ShipPhysicsController`, then asserts via `Debug.Log`/`RESULT:` lines (read
back through `Unity_ReadConsole`, the same numeric pattern established in sub-project 1)
that:
- Each of the 3 thrust axes (forward/back, strafe, vertical), tested in isolation, produces
  linear velocity purely along that local axis, with the other two axes' velocity
  components staying within a small tolerance of zero (no cross-axis leakage).
- Each of the 3 torque axes (pitch, yaw, roll), tested in isolation, produces angular
  velocity purely around that local axis, with the other two axes' angular velocity
  components staying near zero.
- A zero `ShipControlInput` (all fields default) produces zero net force/torque — the
  Rigidbody's velocity stays exactly at whatever it already was (proves the controller
  never applies phantom forces when there's no input).

Exact test structure (how many objects, whether phases run sequentially on one Rigidbody or
in parallel on multiple, precise tolerances) is an implementation-plan decision, not fixed
here — it should follow whichever of sub-project 1's two patterns (multiple simultaneous
Y-lane-separated objects, or sequential phases on one object) fits best once the actual
tolerances and force magnitudes are chosen.

**Manual (proves it's actually fun/correct to fly, which no log line can prove):** once the
automated checks pass, you press Play in the Unity Editor and fly the placeholder ship
yourself — full 6DOF, no assist — using the follow camera to judge whether translation and
rotation feel responsive and correctly oriented before this sub-project is called done. This
is the sub-project's real acceptance gate; the automated checks only prove the wiring is
correct, not that the result feels right.

## Non-goals

Restated from Scope for clarity: no real ship model, no real camera system, no gamepad
support, no flight-assist toggle, no HUD, no play-space design. Each belongs to a specific
later sub-project on the roadmap, not this one.
