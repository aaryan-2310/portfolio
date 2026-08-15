# Unity Flying Camera Mode (Sub-Project 3) — Design

> **2026-08-15.** Sub-project 3 of the 7-sub-project Unity space-sim roadmap (see
> [2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md](2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md)).
> Builds directly on sub-project 2's verified Newtonian flight controls
> (`ShipInputReader`/`ShipPhysicsController`/`ShipControlInput`, SpaceSim commits
> `31f396e`..`c83cccd`).

## Why

Sub-project 2 shipped a throwaway `ShipFollowCamera` — explicitly scaffolding, no smoothing,
no collision avoidance, orientation matched the ship 1:1 including roll — just enough to
playtest whether the controls felt right. That playtest passed. This sub-project replaces it
with a properly designed camera, and also replaces the old PlayCanvas `/v2` experience's
static `EXT_CAM` reveal shot (a fixed position/fixed look-at external view — never designed
to track a freely-moving 6DOF ship, and made moot by the "fully replace `/v2` with Unity"
decision made earlier this roadmap).

## Scope

**In scope:** a `ShipChaseCamera` component in the existing `FlightControlTest.unity` scene,
replacing `ShipFollowCamera` entirely — position tracking behind-and-above the ship, smoothed
position and rotation, horizon-stabilized orientation (yaw and pitch follow the ship, roll is
discarded), and an explicit, tested fallback for the near-vertical gimbal edge case. Automated
verification of the tracking/stabilization/gimbal-safety properties, followed by a live
playtest for feel — same split established in sub-project 2.

**Explicitly out of scope:**
- Cockpit / first-person view — considered as an option for this sub-project, not chosen;
  tracked separately as sub-project 7 on the roadmap.
- Camera collision avoidance — nothing to collide with until sub-project 5 (play space)
  introduces obstacles.
- Player-controlled zoom/distance adjustment — `distance`/`height` stay Inspector-tunable
  constants, not exposed to input.
- Any changes to the old PlayCanvas `/v2` code — already superseded by the "fully replace"
  decision; this sub-project doesn't touch it.
- The real ship model — still the placeholder box from sub-project 2 (asset import is
  sub-project 6, independently schedulable).

## Design

### 1. Tracking

`ShipChaseCamera` (`MonoBehaviour`) holds a `Transform target` (the ship), plus tunable
`distance`/`height` (starting at 8/3, matching `ShipFollowCamera`'s existing values). Each
frame, it computes a target position (`target.position - target.forward * distance +
Vector3.up * height`) and a target orientation, then smooths toward both rather than
snapping — a rigid instant-follow camera would feel jerky the moment horizon-stabilization
(Section 2) is actively correcting for ship roll.

### 2. Horizon-stabilized orientation (roll discarded, yaw/pitch followed)

The target orientation is computed as `Quaternion.LookRotation(target.forward, Vector3.up)`
— using **world-up**, not `target.up` (the mechanism `ShipFollowCamera` used, which is exactly
why it inherited the ship's roll). Because `target.forward` already encodes the ship's yaw and
pitch but `LookRotation`'s up-hint only influences roll, this single change makes the camera
continue turning to stay behind the ship as it yaws or pitches, while never rolling with it —
the horizon stays level regardless of how much the ship barrel-rolls.

### 3. Gimbal-safety fallback

`LookRotation(forward, worldUp)` degrades as `forward` approaches parallel to `worldUp` (the
ship pointing near-straight up or down) — a real case in unassisted 6DOF flight, and the same
*class* of failure (not the same bug) that broke sub-project 2's camera once already. The
implementation plan must include an explicit fallback: when `forward` and `worldUp` are
nearly parallel (a dot-product threshold near ±1), blend the up-hint toward the camera's own
previous up-vector instead of world-up, so the computed rotation degrades gracefully rather
than flipping or producing `NaN`. This must be covered by an automated test that drives the
ship to point straight up and straight down and confirms the camera's orientation stays
well-defined (no `NaN`, no discontinuous flip) throughout — proactively, rather than
discovered via a live playtest crash the way the previous class of bug was.

### 4. Verification

**Automated** (same `Debug.Log`/`RESULT:` + `Unity_ReadConsole` numeric pattern as sub-projects
1-2): drive the ship through a scripted sequence of orientations (yaw only, pitch only, roll
only, and the near-vertical edge case from Section 3) and assert (a) the camera's computed
forward direction tracks the ship's yaw/pitch within tolerance, (b) the camera's roll component
stays near zero regardless of the ship's actual roll, (c) no `NaN`/flip occurs during the
vertical-pointing case. **Manual:** once automated checks pass, a live playtest — fly the ship
with the new camera active and judge whether the smoothing speed, distance, and height actually
feel good. This is the sub-project's real acceptance gate, same as sub-project 2.

## Non-goals

Restated from Scope: no cockpit/first-person mode (sub-project 7), no camera collision
avoidance (sub-project 5), no player-controlled zoom, no PlayCanvas `/v2` changes, no real
ship model (sub-project 6).
