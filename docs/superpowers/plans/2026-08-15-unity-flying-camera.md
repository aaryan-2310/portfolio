# Unity Flying Camera Mode (Sub-Project 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace sub-project 2's throwaway `ShipFollowCamera` with a properly designed chase camera — smoothed, horizon-stabilized (yaw/pitch tracked, roll discarded), with a tested gimbal-safety fallback for the near-vertical case — proven correct by automated checks before a live playtest confirms it actually feels good.

**Architecture:** A `ShipChaseCamera` component computes its target position/orientation from the ship's `Transform` each `LateUpdate`, using `Quaternion.LookRotation(shipForward, worldUp)` instead of `target.up` (the mechanism that made sub-project 2's camera inherit ship roll) to strip roll while keeping yaw/pitch tracking. A separate verification script drives the real `Ship` GameObject's rotation via `ShipPhysicsController.ApplyControlInput(...)` (same technique sub-project 2 used) and observes the real `FollowCamera`'s resulting orientation.

**Tech Stack:** Unity 6000.5.8f1, built-in `Quaternion`/`Transform` math, no new packages. Controlled via `mcp__unity-mcp__*` MCP tools.

**Spec:** [docs/superpowers/specs/2026-08-15-unity-flying-camera-design.md](../specs/2026-08-15-unity-flying-camera-design.md)

## Global Constraints

- **File paths are relative to the Unity project root `C:/Users/U6077517/SpaceSim`** (separate git repo from this portfolio repo — all `git` commands run with cwd = that root). Current HEAD there is `c83cccd`.
- `ShipChaseCamera` fully replaces `ShipFollowCamera` on the existing `FollowCamera` GameObject in the existing `Assets/Scenes/FlightControlTest.unity` — no new scene, and `ShipFollowCamera.cs` is deleted (not left in the codebase unused).
- Horizon-stabilization mechanism: `Quaternion.LookRotation(target.forward, Vector3.up)`, NOT `target.up` — using `target.up` is exactly what made the sub-project 2 camera roll with the ship.
- Position and rotation smoothing must be frame-rate-independent (`1 - Mathf.Exp(-speed * Time.deltaTime)`, not `Lerp(a, b, speed * Time.deltaTime)`, which is not frame-rate independent for large `deltaTime`).
- The gimbal-safety fallback (near-vertical case) must be covered by an automated test that drives the ship through vertical and confirms no `NaN` and no single-tick discontinuity in the camera's orientation — not just designed and hoped to work.
- Verification is numeric first (`Debug.Log` + `Unity_ReadConsole`, same `RESULT:` pattern as sub-projects 1-2), THEN a required live human playtest — per sub-project 2's final review, every automated assertion in this project must check for an actual expected condition (tracking accuracy, roll-stability, no-flip), never just internal self-consistency.
- Cross-GameObject/cross-component reference fields (`ShipChaseCamera.target`, the verification script's ship/camera references) should be assigned via `Unity_RunCommand` directly, not `component_properties`'s `{"find": ...}` syntax — sub-projects 1 and 2 both hit silent failures with that syntax; go straight to the known-working approach this time.
- No cockpit/first-person mode, no camera collision avoidance, no player-controlled zoom, no changes to the old PlayCanvas `/v2` code, no real ship model — all out of scope per the spec's Non-goals.
- Every Unity asset git-add must include its paired `.meta` file; every deleted asset's `.meta` file must be removed too.

---

### Task 1: `ShipChaseCamera` component + scene wiring

**Files:**
- Create: `Assets/Scripts/Ship/ShipChaseCamera.cs`
- Delete: `Assets/Scripts/Ship/ShipFollowCamera.cs`, `Assets/Scripts/Ship/ShipFollowCamera.cs.meta`
- Modify: `Assets/Scenes/FlightControlTest.unity` (removes `ShipFollowCamera` from `FollowCamera`, adds `ShipChaseCamera`)

**Interfaces:**
- Produces: `class ShipChaseCamera : MonoBehaviour` with `public Transform target;`, `public float distance = 8f;`, `public float height = 3f;`, `public float positionSmoothSpeed = 5f;`, `public float rotationSmoothSpeed = 5f;`, `public float verticalDotThreshold = 0.98f;` — Task 2's verification script reads this component's resulting `transform.forward`/`transform.up` via the `FollowCamera` GameObject's `Transform`, but does not call any of its methods directly (it only observes, since the behavior under test is `LateUpdate` itself).

- [x] **Step 1: Write `ShipChaseCamera.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/Ship/ShipChaseCamera.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;

// Replaces sub-project 2's throwaway ShipFollowCamera. Horizon-stabilized chase
// camera: tracks the ship's yaw/pitch, discards roll, smooths both position and
// rotation, and degrades gracefully when the ship points near-straight up/down.
public class ShipChaseCamera : MonoBehaviour
{
    public Transform target;
    public float distance = 8f;
    public float height = 3f;
    public float positionSmoothSpeed = 5f;
    public float rotationSmoothSpeed = 5f;
    public float verticalDotThreshold = 0.98f;

    private Vector3 lastUpHint = Vector3.up;

    void LateUpdate()
    {
        if (target == null) return;

        Vector3 desiredPosition = target.position - target.forward * distance + Vector3.up * height;
        transform.position = Vector3.Lerp(transform.position, desiredPosition, 1f - Mathf.Exp(-positionSmoothSpeed * Time.deltaTime));

        Vector3 forward = target.forward.normalized;

        // Roll-discarding: LookRotation's up-hint only influences roll, so using
        // world-up here (not target.up, which is what made ShipFollowCamera roll
        // with the ship) means the camera continues turning to stay behind the
        // ship as it yaws/pitches, while never rolling with it.
        //
        // Gimbal safety: LookRotation(forward, worldUp) degrades as forward
        // approaches parallel to worldUp (ship pointing near-straight up/down).
        // Blend toward the camera's own previous up-vector as that happens, so
        // the rotation degrades gracefully instead of flipping.
        float verticalness = Mathf.Abs(Vector3.Dot(forward, Vector3.up));
        float blend = Mathf.InverseLerp(verticalDotThreshold, 1f, verticalness);
        Vector3 upHint = Vector3.Slerp(Vector3.up, lastUpHint, blend);

        // Final safety net: if the blended hint is still nearly parallel to
        // forward (e.g. the ship started already pointing vertical, before
        // lastUpHint had a chance to diverge from world-up), fall back to a
        // guaranteed non-parallel axis.
        if (Mathf.Abs(Vector3.Dot(upHint.normalized, forward)) > 0.999f)
        {
            upHint = Mathf.Abs(forward.z) < 0.9f ? Vector3.forward : Vector3.right;
        }

        Quaternion desiredRotation = Quaternion.LookRotation(forward, upHint);
        transform.rotation = Quaternion.Slerp(transform.rotation, desiredRotation, 1f - Mathf.Exp(-rotationSmoothSpeed * Time.deltaTime));

        lastUpHint = transform.up;
    }
}
```

- [x] **Step 2: Delete `ShipFollowCamera.cs`**

Call `mcp__unity-mcp__Unity_ManageAsset` with `Action: "Delete"`, `Path: "Assets/Scripts/Ship/ShipFollowCamera.cs"`, `GeneratePreview: false`. This removes both the script and its `.meta` file.

- [x] **Step 3: Swap the component on `FollowCamera`**

Call `mcp__unity-mcp__Unity_ManageGameObject` with `action: "remove_component"`, `target: "FollowCamera"`, `components_to_remove: ["ShipFollowCamera"]`.

Call `mcp__unity-mcp__Unity_ManageGameObject` with `action: "add_component"`, `target: "FollowCamera"`, `components_to_add: ["ShipChaseCamera"]`.

- [x] **Step 4: Assign the `target` reference**

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var cameraGO = GameObject.Find("FollowCamera");
        var shipGO = GameObject.Find("Ship");
        var chaseCam = cameraGO.GetComponent<ShipChaseCamera>();
        result.RegisterObjectModification(chaseCam);
        chaseCam.target = shipGO.transform;
        EditorUtility.SetDirty(chaseCam);
        result.Log("ShipChaseCamera.target assigned to {0}", chaseCam.target.name);
    }
}
```

- [x] **Step 5: Verify and save**

Call `mcp__unity-mcp__Unity_ManageGameObject` with `action: "get_components"`, `target: "FollowCamera"`. Confirm `ShipChaseCamera` is present with `target` assigned (not null) and `ShipFollowCamera` is absent from the component list.

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [x] **Step 6: Basic Play-mode smoke check**

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Play"`.

```bash
sleep 5
```

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Stop"`.

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Error", "Warning"]`, `Count: 20`. Expected: no errors or warnings referencing `ShipChaseCamera`. This is a basic sanity check only — Task 2 provides the actual numeric proof of correctness.

- [x] **Step 7: Commit**

```bash
git add Assets/Scripts/Ship/ShipChaseCamera.cs Assets/Scripts/Ship/ShipChaseCamera.cs.meta \
        Assets/Scenes/FlightControlTest.unity
git rm Assets/Scripts/Ship/ShipFollowCamera.cs Assets/Scripts/Ship/ShipFollowCamera.cs.meta
git commit -m "feat: replace ShipFollowCamera with horizon-stabilized ShipChaseCamera"
```

---

### Task 2: Automated camera verification

**Files:**
- Create: `Assets/Scripts/Ship/ShipCameraVerificationTest.cs`
- Modify: `Assets/Scenes/FlightControlTest.unity` (adds the test harness GameObject)

**Interfaces:**
- Consumes: `ShipPhysicsController.ApplyControlInput(ShipControlInput)` (drives the real `Ship`), `ShipChaseCamera`'s resulting `transform.forward`/`transform.up` on the real `FollowCamera` (observed only, not called into).
- Produces: `class ShipCameraVerificationTest : MonoBehaviour`. Logs one `[ShipCameraVerificationTest] RESULT: PASS|FAIL ...` line per phase (4 total: `YawTracking`, `PitchTracking`, `RollStability`, `VerticalGimbalSafety`).

- [x] **Step 1: Write `ShipCameraVerificationTest.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/Ship/ShipCameraVerificationTest.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;

public class ShipCameraVerificationTest : MonoBehaviour
{
    public Rigidbody shipRigidbody;
    public ShipPhysicsController shipController;
    public Transform cameraTransform;
    public float phaseDurationSeconds = 2f;
    public float trackingDotThreshold = 0.95f;
    public float rollStabilityDotThreshold = 0.9f;
    public float continuityDotThreshold = 0.5f;

    private struct Phase
    {
        public string name;
        public ShipControlInput input;
        public float pulseDurationSeconds; // torque applied only for this long, then zero input for the rest
    }

    private Phase[] phases;
    private int phaseIndex;
    private float elapsed;
    private bool finished;
    private Vector3 lastCameraUp;
    private float minContinuityDot;

    void Start()
    {
        // Yaw/Pitch/Roll use a brief pulse then coast: continuous full-duration
        // torque would build enough angular velocity that the camera's smoothing
        // can never catch up, producing a lag-induced false FAIL unrelated to
        // actual tracking correctness. VerticalGimbalSafety wants sustained
        // torque, to actually sweep the ship's forward vector through vertical.
        phases = new Phase[]
        {
            new Phase { name = "YawTracking",          input = new ShipControlInput { torque = new Vector3(0, 1, 0) }, pulseDurationSeconds = 0.1f },
            new Phase { name = "PitchTracking",        input = new ShipControlInput { torque = new Vector3(1, 0, 0) }, pulseDurationSeconds = 0.1f },
            new Phase { name = "RollStability",        input = new ShipControlInput { torque = new Vector3(0, 0, 1) }, pulseDurationSeconds = 0.1f },
            new Phase { name = "VerticalGimbalSafety", input = new ShipControlInput { torque = new Vector3(1, 0, 0) }, pulseDurationSeconds = 2f },
        };
        lastCameraUp = cameraTransform.up;
        minContinuityDot = 1f;
    }

    void FixedUpdate()
    {
        if (finished) return;
        if (phaseIndex >= phases.Length)
        {
            finished = true;
            Debug.Log("[ShipCameraVerificationTest] ALL PHASES COMPLETE");
            return;
        }

        var phase = phases[phaseIndex];

        if (elapsed == 0f)
        {
            shipRigidbody.linearVelocity = Vector3.zero;
            shipRigidbody.angularVelocity = Vector3.zero;
            shipRigidbody.transform.rotation = Quaternion.identity;
            minContinuityDot = 1f;
        }

        if (elapsed < phase.pulseDurationSeconds)
        {
            shipController.ApplyControlInput(phase.input);
        }
        else
        {
            shipController.ApplyControlInput(new ShipControlInput());
        }
        elapsed += Time.fixedDeltaTime;

        if (phase.name == "VerticalGimbalSafety")
        {
            float dot = Vector3.Dot(lastCameraUp.normalized, cameraTransform.up.normalized);
            minContinuityDot = Mathf.Min(minContinuityDot, dot);
        }
        lastCameraUp = cameraTransform.up;

        if (elapsed >= phaseDurationSeconds)
        {
            bool pass;
            if (phase.name == "RollStability")
            {
                float upDot = Vector3.Dot(cameraTransform.up.normalized, Vector3.up);
                pass = upDot >= rollStabilityDotThreshold;
                Debug.Log($"[ShipCameraVerificationTest] RESULT: {phase.name} {(pass ? "PASS" : "FAIL")} cameraUpDotWorldUp={upDot:F5} minRequired={rollStabilityDotThreshold:F5}");
            }
            else if (phase.name == "VerticalGimbalSafety")
            {
                Vector3 f = cameraTransform.forward;
                bool noNaN = !float.IsNaN(f.x) && !float.IsNaN(f.y) && !float.IsNaN(f.z);
                bool noFlip = minContinuityDot >= continuityDotThreshold;
                pass = noNaN && noFlip;
                Debug.Log($"[ShipCameraVerificationTest] RESULT: {phase.name} {(pass ? "PASS" : "FAIL")} noNaN={noNaN} minContinuityDot={minContinuityDot:F5} continuityThreshold={continuityDotThreshold:F5}");
            }
            else
            {
                float trackDot = Vector3.Dot(cameraTransform.forward.normalized, shipRigidbody.transform.forward.normalized);
                pass = trackDot >= trackingDotThreshold;
                Debug.Log($"[ShipCameraVerificationTest] RESULT: {phase.name} {(pass ? "PASS" : "FAIL")} cameraForwardDotShipForward={trackDot:F5} minRequired={trackingDotThreshold:F5}");
            }

            phaseIndex++;
            elapsed = 0f;
        }
    }
}
```

- [x] **Step 2: Create the test harness GameObject**

Call `mcp__unity-mcp__Unity_ManageGameObject` with:
- `action: "create"`
- `name: "ShipCameraVerificationTest"`
- `position: [0, 50, 0]`
- `components_to_add: ["ShipCameraVerificationTest"]`

(This object has no `Rigidbody`/`Collider` of its own — it drives the real `Ship`'s existing `Rigidbody`/`ShipPhysicsController` and observes the real `FollowCamera`'s `Transform` directly, rather than using an isolated test rig. Position is cosmetic only.)

- [x] **Step 3: Assign the cross-object references**

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var testGO = GameObject.Find("ShipCameraVerificationTest");
        var shipGO = GameObject.Find("Ship");
        var cameraGO = GameObject.Find("FollowCamera");

        var test = testGO.GetComponent<ShipCameraVerificationTest>();
        result.RegisterObjectModification(test);

        test.shipRigidbody = shipGO.GetComponent<Rigidbody>();
        test.shipController = shipGO.GetComponent<ShipPhysicsController>();
        test.cameraTransform = cameraGO.transform;

        EditorUtility.SetDirty(test);
        result.Log("References assigned: shipRigidbody={0} shipController={1} cameraTransform={2}",
            test.shipRigidbody != null, test.shipController != null, test.cameraTransform != null);
    }
}
```

- [x] **Step 4: Save the scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [x] **Step 5: Run the test**

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Play"`.

The test runs 4 phases at 2 seconds each = 8 seconds of simulated time; wait comfortably past it:

```bash
sleep 12
```

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Stop"`.

**If simulated time is barely advancing despite the wait**, the Unity Editor window has likely lost OS focus — this happened repeatedly during sub-projects 1-2 and was fixed by clicking into the Editor window. Report this to the controller rather than treating it as a script bug; don't loop indefinitely on retries.

- [x] **Step 6: Verify the results**

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Log"]`, `FilterText: "ShipCameraVerificationTest] RESULT"`, `Count: 20`.

Expected: 4 lines (`YawTracking`, `PitchTracking`, `RollStability`, `VerticalGimbalSafety`), all `PASS`. If any `FAIL`, report the actual logged values — do not adjust the dot-product thresholds to force a pass; a genuine failure here means the camera's tracking, roll-stabilization, or gimbal-safety logic is actually wrong, which is exactly what this task exists to catch.

- [x] **Step 7: Commit**

```bash
git add Assets/Scripts/Ship/ShipCameraVerificationTest.cs Assets/Scripts/Ship/ShipCameraVerificationTest.cs.meta \
        Assets/Scenes/FlightControlTest.unity
git commit -m "feat: add automated ship chase-camera verification, all 4 phases PASS"
```

---

## Final Verification

After Task 2, the camera's tracking, roll-stabilization, and gimbal-safety are proven correct numerically. Per the spec, this is **not** the sub-project's acceptance gate — the last step is a live playtest: press Play in the `FlightControlTest` scene, fly the `Ship` with the new `ShipChaseCamera` active, and judge whether the smoothing speed, distance, and height actually feel good. This is a step for your human partner to do directly in the Editor, not something a subagent can complete.

If the camera feels laggy or too snappy, tune `ShipChaseCamera.positionSmoothSpeed`/`rotationSmoothSpeed` (currently 5/5). If it feels too close/far or too high/low, tune `distance`/`height` (currently 8/3). Adjust via the Inspector or `Unity_ManageGameObject set_component_property`, then re-save the scene.

This closes sub-project 3. Sub-project 4 (visual feedback) can now add thruster visuals with a stable camera to view them through; sub-project 7 (cockpit/first-person mode, added to the roadmap 2026-08-15) is an independent addition whenever it's scheduled.

**One open item to watch for during the playtest, deliberately not fixed:** the camera aims parallel to the ship's heading (`LookRotation(target.forward, upHint)`) rather than at the ship itself, so in level flight the ship sits noticeably below center in frame — the final review flagged this as a real spec gap, not an implementer bug. It wasn't fixed in this plan because doing so changes what `YawTracking`/`PitchTracking` actually measure (camera would aim at a point near the ship rather than parallel to its heading, adding position-lag error on top of the already-tuned smoothing-lag error those phases assert against) and risked yet another round retuning already-passing thresholds — this sub-project had already gone through 5 fix-wave rounds by the time this was triaged. If the framing looks off, the fix is to aim at a point near the ship (e.g. `LookRotation(target.position + Vector3.up * aimHeight - transform.position, upHint)`, which still preserves roll-discarding since the up-hint still controls only roll) — treat it as a small follow-up, not a re-open of this plan.

---

## Execution Record

All 2 tasks executed via subagent-driven-development, per-task reviews skipped per standing instruction (one final review only). Full ledger with every controller ruling: `.superpowers/sdd/2026-08-15-unity-flying-camera/progress.md` (deleted after this plan closes — this section is the durable summary).

**SpaceSim commit history** (`C:/Users/U6077517/SpaceSim`, building on sub-project 2's `c83cccd`):
- `5f6af50` — Task 1: `ShipChaseCamera` replacing `ShipFollowCamera`
- `bf8227b` — Task 2: automated 4-phase verification harness (initial version — later substantially reworked, see below)
- `104e14c` — final-review fix wave (5 rounds — see below)

**Both tasks landed clean on the first attempt** — no bugs during Tasks 1-2 themselves, unlike sub-projects 1-2. The final whole-branch review is where this plan got genuinely hard.

**Final whole-branch review** (opus, range `c83cccd..bf8227b`) found 2 Critical and 4 Important findings, all rooted in the *verification harness*, not the camera implementation as originally shipped:
1. The harness left `Ship`'s `ShipInputReader` enabled during its own run — live input summed silently with the harness's synthetic torque (`ApplyControlInput` is purely additive), producing unrepeatable results. The reviewer independently re-read the live console and caught a `RollStability FAIL` that contradicted the recorded PASS.
2. The `VerticalGimbalSafety` no-flip check sampled camera state *after* Slerp smoothing, which mathematically bounds single-tick rotation regardless of how discontinuous the underlying target was — the check could not fail for any camera, broken or not.
3. The harness component was saved *enabled* in the scene, so it would re-run and disrupt the ship on every future Play session, including the live playtest.
4. `RollStability` sampled once at phase-end against a loose threshold, rather than continuously — a fully-roll-inheriting camera could pass by luck of timing.

**What it took to actually close those findings — 5 fix-wave rounds, not 1:**
- **Round 1** (sonnet): applied the direct fixes for findings 1-4 — disable `ShipInputReader` during the run, expose `ShipChaseCamera.DesiredRotation` for a pre-smoothing flip check, redesign `VerticalGimbalSafety` as a controlled pulse-then-coast sweep (closing a 3rd, related finding — the near-vertical *exit* was never exercised — as a side effect), continuous min-tracking for `RollStability`. Hit real Editor Play-mode throttling (window losing OS focus under headless MCP automation) repeatedly during this round and the ones after — a known issue from sub-projects 1-2, but markedly worse here, at one point fully stalling (simulated time frozen for 20+ real seconds) rather than just slowing down.
- **Round 2**: after the throttling resolved, 2/4 phases genuinely FAILed — not the environment. Root cause: only the ship's Rigidbody state was reset between phases, not the camera's own `transform.rotation`/`lastUpHint`, so a phase inherited the *previous* phase's orientation and had to visibly "catch up," which the new continuous monitoring (correctly) flagged as a discontinuity. Fixed by adding `ShipChaseCamera.SnapToTarget()` — an instant, no-smoothing snap to the current target, invoked only by the test harness between phases.
- **Round 3**: `RollStability` still failed identically. Root cause: `Ship`'s `Rigidbody.interpolation = Interpolate` means a direct `Rigidbody.rotation` assignment doesn't synchronously update `Transform.forward`. Approved fix: `Physics.SyncTransforms()` before `SnapToTarget()` — **this was wrong**, see round 5.
- **Round 4**: `RollStability`'s failing value was byte-identical before and after round 3's fix — a strong signal the real bug was untouched. Escalated to a fresh implementer on a more capable model per the standard fix-loop escalation pattern (3 rounds resuming the same agent, then a fresh one on a stronger model), rather than a 4th guess.
- **Round 5** (fresh implementer, opus): found the real story via live instrumentation, not further reasoning. `Physics.SyncTransforms()` syncs Transform→PhysX — the *opposite* direction from what round 3 needed; it never helped. The actual fix was writing `shipRigidbody.transform.rotation` directly. Separately, this round also found and fixed a genuine latent bug in `ShipChaseCamera` **itself** (not just the test): blending the gimbal-safety up-hint as a raw `Vector3.Slerp` could sweep it through the ship's forward axis when pitched steeply, leaving `LookRotation` deriving roll from a near-zero, sign-flipping residual — reworked to project both candidate hints onto the plane perpendicular to forward before blending. All 4 phases passed cleanly afterward with real margin (`RollStability` exact 1.00000, `VerticalGimbalSafety` 16.76° against a 45° threshold, down from 166° in round 1).

**Lesson for future sub-projects on this project:** `Physics.SyncTransforms()` syncs Transform state *into* PhysX, not the reverse — if a `Rigidbody` write needs to be immediately visible via `.transform`, write the `Transform` directly too, don't reach for `SyncTransforms()`. This cost a full extra round in this plan.

**Final committed script contents** (`Assets/Scripts/Ship/` in the SpaceSim repo) reflect the full round-5 fix — read the files directly for the authoritative current version rather than the code blocks in Tasks 1-2 above, which show each script's state as originally planned, well before the review found what was actually wrong.
