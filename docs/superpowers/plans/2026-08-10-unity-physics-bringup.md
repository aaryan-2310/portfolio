# Unity Physics Bring-Up (Sub-Project 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove Unity's built-in Rigidbody/PhysX physics supports true Newtonian space-flight behavior (momentum conservation, unbounded drift, force-driven acceleration, momentum-conserving collisions) before any flight controls, camera, or visuals are built on top of it.

**Architecture:** A throwaway Unity scene (`PhysicsSmokeTest.unity`) with project-wide zero gravity and three isolated cube `Rigidbody` test rigs, each with a self-asserting MonoBehaviour that logs a `RESULT: PASS`/`RESULT: FAIL` line to the Unity console once its scenario completes. Verification reads that line back via `Unity_ReadConsole` — no screenshot inspection.

**Tech Stack:** Unity 6000.5.8f1, Universal RP (URP) template project, built-in PhysX (`Rigidbody`, `BoxCollider`) — no external packages. Controlled via the connected `unity-mcp` MCP server tools (`Unity_CreateScript`, `Unity_ManageGameObject`, `Unity_ManageScene`, `Unity_ManageEditor`, `Unity_ReadConsole`, `Unity_RunCommand`).

**Spec:** [docs/superpowers/specs/2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md](../specs/2026-08-10-unity-flight-sim-roadmap-and-physics-bringup-design.md)

## Global Constraints

- **This plan's file paths are relative to the Unity project root `C:/Users/U6077517/SpaceSim`, NOT the portfolio repo** (`C:\usr\workspace\personal\portfolio`). The Unity project is a separate, currently ungitted directory — Task 1 initializes its own git repo. All `git` commands in this plan must run with cwd = the Unity project root.
- `Physics.gravity` must be `(0, 0, 0)` project-wide (Project Settings → Physics), not per-object.
- Every test `Rigidbody` must have `linearDamping = 0`, `angularDamping = 0`, `useGravity = false` set explicitly in code at `Start()` — never rely on component defaults (Unity's default `Rigidbody` ships with small nonzero damping).
- New scene lives at `Assets/Scenes/PhysicsSmokeTest.unity`, kept separate from `Assets/Scenes/SampleScene.unity`.
- Verification is numeric: each test script logs a final `RESULT: PASS` or `RESULT: FAIL` line via `Debug.Log`, read back with `Unity_ReadConsole` (`Action: Get`, `Types: [Log]`, `FilterText: "RESULT"`). Screenshots (`Unity_Camera_Capture`, `Unity_SceneView_Capture2DScene`) are sanity-check only, never the pass/fail evidence.
- Every Unity asset git-add must include its paired `.meta` file — never gitignore `*.meta`.
- No real ship model, no real player input (Input System), no camera work, no orbital mechanics — all explicitly out of scope per the spec.

---

### Task 1: Git-init the Unity project + baseline commit

**Files:**
- Create: `.gitignore` (Unity project root)
- Create: initial commit of the existing fresh-template project state (`Assets/`, `Packages/`, `ProjectSettings/`, `SpaceSim.slnx` excluded via gitignore, etc.)

**Interfaces:** None — infrastructure only.

- [ ] **Step 1: Create the Unity `.gitignore`**

Write `C:/Users/U6077517/SpaceSim/.gitignore`:

```gitignore
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]serSettings/
[Mm]emoryCaptures/
.vscode/
*.csproj
*.unityproj
*.sln
*.slnx
*.suo
*.tmp
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.VC.db
sysinfo.txt
*.stackdump
crashlytics-build.properties
```

- [ ] **Step 2: Init repo and make the baseline commit**

Run (cwd = `C:/Users/U6077517/SpaceSim`):

```bash
git init
git add .gitignore Assets Packages ProjectSettings
git status
```

Confirm `git status` shows `Assets/`, `Packages/`, `ProjectSettings/`, `.gitignore` staged and nothing under `Library/`, `Temp/`, `Logs/`, `UserSettings/`, `*.csproj`/`*.sln`/`*.slnx` staged. Then:

```bash
git commit -m "chore: baseline commit of fresh Unity 6000.5.8f1 URP project"
```

- [ ] **Step 3: Verify**

```bash
git log --oneline -1
git status --short
```

Expected: one commit, clean working tree.

---

### Task 2: Zero gravity + `PhysicsSmokeTest` scene

**Files:**
- Modify: `ProjectSettings/DynamicsManager.asset` (via `Physics.gravity`, not hand-edited)
- Create: `Assets/Scenes/PhysicsSmokeTest.unity`
- Create: `Assets/Scripts/PhysicsSmokeTest/` (folder, populated in later tasks)

**Interfaces:** None yet — later tasks add scripts under `Assets/Scripts/PhysicsSmokeTest/`.

- [ ] **Step 1: Set project-wide gravity to zero**

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        Physics.gravity = Vector3.zero;
        result.Log("Physics.gravity set to {0}", Physics.gravity);
    }
}
```

- [ ] **Step 2: Verify gravity is zero**

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        result.Log("Physics.gravity = {0}", Physics.gravity);
    }
}
```

Expected log: `Physics.gravity = (0.0, 0.0, 0.0)`.

- [ ] **Step 3: Create the `PhysicsSmokeTest` scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Create"`, `Name: "PhysicsSmokeTest"`, `Path: "Assets/Scenes"`.

Then call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Load"`, `Name: "PhysicsSmokeTest"`, `Path: "Assets/Scenes"` to make it the active scene (all subsequent GameObject creation in Tasks 3-5 targets this scene).

- [ ] **Step 4: Create the scripts folder and save the scene**

Call `mcp__unity-mcp__Unity_ManageAsset` with `Action: "CreateFolder"`, `Path: "Assets/Scripts"` (parent must exist before creating the subfolder below — this project has no `Assets/Scripts` folder yet).

Call `mcp__unity-mcp__Unity_ManageAsset` with `Action: "CreateFolder"`, `Path: "Assets/Scripts/PhysicsSmokeTest"`.

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [ ] **Step 5: Verify scene is active and gravity persisted**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "GetActive"`. Expected: `name: "PhysicsSmokeTest"`, `path: "Assets/Scenes/PhysicsSmokeTest.unity"`.

- [ ] **Step 6: Commit**

```bash
git add Assets/Scenes/PhysicsSmokeTest.unity Assets/Scenes/PhysicsSmokeTest.unity.meta \
        Assets/Scripts.meta Assets/Scripts/PhysicsSmokeTest.meta ProjectSettings/DynamicsManager.asset
git commit -m "feat: add PhysicsSmokeTest scene, zero project gravity"
```

(The `Assets/Scripts/PhysicsSmokeTest` folder itself has no committable content yet beyond its `.meta` file — a truly empty folder has nothing else to add; that's expected, Task 3 adds the first script into it.)

---

### Task 3: Impulse + drift test

**Files:**
- Create: `Assets/Scripts/PhysicsSmokeTest/ImpulseDriftTest.cs`
- Modify: `Assets/Scenes/PhysicsSmokeTest.unity` (adds `ImpulseDriftTest` GameObject)

**Interfaces:**
- Produces: `ImpulseDriftTest : MonoBehaviour` with public fields `impulseDirection` (Vector3), `impulseMagnitude` (float), `sampleIntervalSeconds` (float), `totalDurationSeconds` (float), `speedToleranceUnits` (float). Logs `[ImpulseDriftTest] RESULT: PASS|FAIL maxDeviation=<f> tolerance=<f>` when `elapsed >= totalDurationSeconds`.

- [ ] **Step 1: Write `ImpulseDriftTest.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/PhysicsSmokeTest/ImpulseDriftTest.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;

public class ImpulseDriftTest : MonoBehaviour
{
    public Vector3 impulseDirection = new Vector3(1f, 0f, 0f);
    public float impulseMagnitude = 10f;
    public float sampleIntervalSeconds = 2f;
    public float totalDurationSeconds = 10f;
    public float speedToleranceUnits = 0.001f;

    private Rigidbody rb;
    private float elapsed;
    private float nextSampleTime;
    private float baselineSpeed;
    private bool baselineCaptured;
    private float maxDeviation;
    private bool finished;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        rb.linearDamping = 0f;
        rb.angularDamping = 0f;
        rb.useGravity = false;
        rb.AddForce(impulseDirection.normalized * impulseMagnitude, ForceMode.Impulse);
        nextSampleTime = sampleIntervalSeconds;
    }

    void FixedUpdate()
    {
        if (finished) return;

        elapsed += Time.fixedDeltaTime;
        float speed = rb.linearVelocity.magnitude;

        if (!baselineCaptured)
        {
            baselineSpeed = speed;
            baselineCaptured = true;
            Debug.Log($"[ImpulseDriftTest] baseline speed={baselineSpeed:F5}");
        }

        if (elapsed >= nextSampleTime)
        {
            float deviation = Mathf.Abs(speed - baselineSpeed);
            maxDeviation = Mathf.Max(maxDeviation, deviation);
            Debug.Log($"[ImpulseDriftTest] t={elapsed:F2}s speed={speed:F5} deviation={deviation:F5}");
            nextSampleTime += sampleIntervalSeconds;
        }

        if (elapsed >= totalDurationSeconds)
        {
            finished = true;
            bool pass = maxDeviation <= speedToleranceUnits;
            Debug.Log($"[ImpulseDriftTest] RESULT: {(pass ? "PASS" : "FAIL")} maxDeviation={maxDeviation:F5} tolerance={speedToleranceUnits:F5}");
        }
    }
}
```

- [ ] **Step 2: Create the test GameObject**

Call `mcp__unity-mcp__Unity_ManageGameObject` with:
- `action: "create"`
- `name: "ImpulseDriftTest"`
- `primitive_type: "Cube"`
- `position: [-5, 20, 0]`
- `components_to_add: ["Rigidbody", "ImpulseDriftTest"]`
- `component_properties: {"Rigidbody": {"mass": 1.0, "useGravity": false}}`

(`y: 20` — see the note on lane separation in Task 5's Step 2. This object drifts unbounded along X for the whole test; it must never share a Y-lane with anything that could be in its path.)

- [ ] **Step 3: Save the scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [ ] **Step 4: Run the test**

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Play"`.

Wait for the test's real-time duration (the script runs for `totalDurationSeconds` = 10s of in-editor time; wait comfortably past it):

```bash
sleep 12
```

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Stop"`.

- [ ] **Step 5: Verify the result**

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Log"]`, `FilterText: "ImpulseDriftTest] RESULT"`.

Expected: exactly one line, `[ImpulseDriftTest] RESULT: PASS maxDeviation=0.00000 tolerance=0.00100` (deviation should be at or near `0.00000` — true momentum conservation, no hidden drag). If `FAIL`, inspect the intermediate `t=...s speed=...` log lines from the same filter without `"RESULT"` to see where velocity changed, and check `Rigidbody.linearDamping`/`angularDamping` were actually zeroed (re-check Step 1's code, not a config issue elsewhere).

- [ ] **Step 6: Commit**

```bash
git add Assets/Scripts/PhysicsSmokeTest/ImpulseDriftTest.cs Assets/Scripts/PhysicsSmokeTest/ImpulseDriftTest.cs.meta \
        Assets/Scenes/PhysicsSmokeTest.unity
git commit -m "feat: add impulse+drift physics smoke test, verified PASS"
```

---

### Task 4: Continuous thrust test

**Files:**
- Create: `Assets/Scripts/PhysicsSmokeTest/ContinuousThrustTest.cs`
- Modify: `Assets/Scenes/PhysicsSmokeTest.unity` (adds `ContinuousThrustTest` GameObject)

**Interfaces:**
- Produces: `ContinuousThrustTest : MonoBehaviour` with public fields `thrustDirection` (Vector3), `thrustForce` (float), `thrustDurationSeconds` (float), `holdDurationSeconds` (float), `holdToleranceUnits` (float). Logs `[ContinuousThrustTest] RESULT: PASS|FAIL monotonicIncrease=<bool> maxHoldDeviation=<f> tolerance=<f>` when `elapsed >= thrustDurationSeconds + holdDurationSeconds`.

- [ ] **Step 1: Write `ContinuousThrustTest.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/PhysicsSmokeTest/ContinuousThrustTest.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;

public class ContinuousThrustTest : MonoBehaviour
{
    public Vector3 thrustDirection = new Vector3(0f, 0f, 1f);
    public float thrustForce = 5f;
    public float thrustDurationSeconds = 5f;
    public float holdDurationSeconds = 5f;
    public float holdToleranceUnits = 0.001f;

    private Rigidbody rb;
    private float elapsed;
    private bool thrusting = true;
    private float previousSampledSpeed = -1f;
    private bool thrustIncreasedMonotonically = true;
    private float lastSpeedWhileThrusting;
    private bool holdBaselineCaptured;
    private float holdBaselineSpeed;
    private float maxHoldDeviation;
    private bool finished;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        rb.linearDamping = 0f;
        rb.angularDamping = 0f;
        rb.useGravity = false;
    }

    void FixedUpdate()
    {
        if (finished) return;

        elapsed += Time.fixedDeltaTime;

        if (thrusting)
        {
            rb.AddForce(thrustDirection.normalized * thrustForce, ForceMode.Force);
            float speed = rb.linearVelocity.magnitude;
            if (previousSampledSpeed >= 0f && speed < previousSampledSpeed - 0.0001f)
            {
                thrustIncreasedMonotonically = false;
            }
            previousSampledSpeed = speed;
            lastSpeedWhileThrusting = speed;

            if (elapsed >= thrustDurationSeconds)
            {
                thrusting = false;
                Debug.Log($"[ContinuousThrustTest] thrust released at t={elapsed:F2}s speed={lastSpeedWhileThrusting:F5} monotonicIncrease={thrustIncreasedMonotonically}");
            }
        }
        else
        {
            float speed = rb.linearVelocity.magnitude;
            if (!holdBaselineCaptured)
            {
                holdBaselineSpeed = speed;
                holdBaselineCaptured = true;
            }
            float deviation = Mathf.Abs(speed - holdBaselineSpeed);
            maxHoldDeviation = Mathf.Max(maxHoldDeviation, deviation);

            if (elapsed >= thrustDurationSeconds + holdDurationSeconds)
            {
                finished = true;
                bool pass = thrustIncreasedMonotonically && maxHoldDeviation <= holdToleranceUnits;
                Debug.Log($"[ContinuousThrustTest] RESULT: {(pass ? "PASS" : "FAIL")} monotonicIncrease={thrustIncreasedMonotonically} maxHoldDeviation={maxHoldDeviation:F5} tolerance={holdToleranceUnits:F5}");
            }
        }
    }
}
```

- [ ] **Step 2: Create the test GameObject**

Call `mcp__unity-mcp__Unity_ManageGameObject` with:
- `action: "create"`
- `name: "ContinuousThrustTest"`
- `primitive_type: "Cube"`
- `position: [0, 40, 0]`
- `components_to_add: ["Rigidbody", "ContinuousThrustTest"]`
- `component_properties: {"Rigidbody": {"mass": 1.0, "useGravity": false}}`

(`y: 40` — see the note on lane separation in Task 5's Step 2. At `thrustForce=5`/`mass=1` this object covers tens of units in Z well before the thrust phase ends; it needs its own permanently-clear lane, not just a few units of initial offset.)

- [ ] **Step 3: Save the scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [ ] **Step 4: Run the test**

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Play"`.

The script runs for `thrustDurationSeconds + holdDurationSeconds` = 10s of in-editor time:

```bash
sleep 12
```

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Stop"`.

- [ ] **Step 5: Verify the result**

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Log"]`, `FilterText: "ContinuousThrustTest] RESULT"`.

Expected: `[ContinuousThrustTest] RESULT: PASS monotonicIncrease=True maxHoldDeviation=0.00000 tolerance=0.00100`. If `FAIL` on `monotonicIncrease`, check the object isn't colliding with anything else in the scene (it shouldn't be, but confirm no stray collider overlap from Task 3's object — different `position` values should prevent this). If `FAIL` on `maxHoldDeviation`, damping wasn't actually zero — re-check Step 1.

- [ ] **Step 6: Commit**

```bash
git add Assets/Scripts/PhysicsSmokeTest/ContinuousThrustTest.cs Assets/Scripts/PhysicsSmokeTest/ContinuousThrustTest.cs.meta \
        Assets/Scenes/PhysicsSmokeTest.unity
git commit -m "feat: add continuous thrust physics smoke test, verified PASS"
```

---

### Task 5: Collision momentum conservation test

**Files:**
- Create: `Assets/Scripts/PhysicsSmokeTest/CollisionMomentumTest.cs`
- Modify: `Assets/Scenes/PhysicsSmokeTest.unity` (adds `CollisionBodyA` and `CollisionBodyB` GameObjects)

**Interfaces:**
- Produces: `CollisionMomentumTest : MonoBehaviour` with public fields `otherBody` (Rigidbody), `initialVelocitySelf` (Vector3), `initialVelocityOther` (Vector3), `momentumToleranceFraction` (float). Logs `[CollisionMomentumTest] RESULT: PASS|FAIL relativeError=<f> tolerance=<f>` from `OnCollisionEnter`.
- Consumes: nothing from Tasks 3-4 — fully self-contained.

- [ ] **Step 1: Write `CollisionMomentumTest.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/PhysicsSmokeTest/CollisionMomentumTest.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;

public class CollisionMomentumTest : MonoBehaviour
{
    public Rigidbody otherBody;
    public Vector3 initialVelocitySelf = new Vector3(4f, 0f, 0f);
    public Vector3 initialVelocityOther = new Vector3(-2f, 0f, 0f);
    public float momentumToleranceFraction = 0.01f;

    private Rigidbody rb;
    private Vector3 lastVelocitySelf;
    private Vector3 lastVelocityOther;
    private bool resultLogged;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        rb.linearDamping = 0f;
        rb.angularDamping = 0f;
        rb.useGravity = false;
        rb.linearVelocity = initialVelocitySelf;

        if (otherBody != null)
        {
            otherBody.linearDamping = 0f;
            otherBody.angularDamping = 0f;
            otherBody.useGravity = false;
            otherBody.linearVelocity = initialVelocityOther;
        }

        lastVelocitySelf = rb.linearVelocity;
        lastVelocityOther = otherBody != null ? otherBody.linearVelocity : Vector3.zero;
    }

    void FixedUpdate()
    {
        if (resultLogged) return;
        lastVelocitySelf = rb.linearVelocity;
        lastVelocityOther = otherBody != null ? otherBody.linearVelocity : Vector3.zero;
    }

    void OnCollisionEnter(Collision collision)
    {
        if (resultLogged || otherBody == null) return;

        Vector3 momentumBefore = rb.mass * lastVelocitySelf + otherBody.mass * lastVelocityOther;
        Vector3 momentumAfter = rb.mass * rb.linearVelocity + otherBody.mass * otherBody.linearVelocity;

        float beforeMag = momentumBefore.magnitude;
        float diff = (momentumAfter - momentumBefore).magnitude;
        float relativeError = beforeMag > 0.0001f ? diff / beforeMag : diff;

        bool pass = relativeError <= momentumToleranceFraction;
        resultLogged = true;

        Debug.Log($"[CollisionMomentumTest] momentumBefore={momentumBefore} momentumAfter={momentumAfter}");
        Debug.Log($"[CollisionMomentumTest] RESULT: {(pass ? "PASS" : "FAIL")} relativeError={relativeError:F5} tolerance={momentumToleranceFraction:F5}");
    }
}
```

- [ ] **Step 2: Create the two colliding GameObjects**

Call `mcp__unity-mcp__Unity_ManageGameObject` with:
- `action: "create"`
- `name: "CollisionBodyB"`
- `primitive_type: "Cube"`
- `position: [5, 0, 0]`
- `components_to_add: ["Rigidbody"]`
- `component_properties: {"Rigidbody": {"mass": 5.0, "useGravity": false}}`

Then call `mcp__unity-mcp__Unity_ManageGameObject` with:
- `action: "create"`
- `name: "CollisionBodyA"`
- `primitive_type: "Cube"`
- `position: [-5, 0, 0]`
- `components_to_add: ["Rigidbody", "CollisionMomentumTest"]`
- `component_properties: {"Rigidbody": {"mass": 2.0, "useGravity": false}, "CollisionMomentumTest": {"otherBody": {"find": "CollisionBodyB", "component": "Rigidbody"}}}`

**Lane separation across all three tests (`y` coordinate, not `z`):** none of the three test scripts ever apply force along Y, so each test's group is placed on its own permanent Y-lane and can never re-enter another test's lane no matter how far it travels: `ImpulseDriftTest` at `y=20` (drifts unbounded along X), `ContinuousThrustTest` at `y=40` (accelerates unbounded along Z — at `thrustForce=5`/`mass=1` it covers tens of units before the thrust phase even ends), `CollisionBodyA`/`CollisionBodyB` at `y=0` (move only along X, converging then separating along the same line). A same-Y, few-units-of-Z offset would NOT be sufficient here — both `ImpulseDriftTest` and `ContinuousThrustTest` cover far more distance than a small fixed offset over a 10s window, so only an axis none of them ever moves along (Y) gives permanent isolation.

- [ ] **Step 3: Save the scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [ ] **Step 4: Run the test**

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Play"`.

At `initialVelocitySelf = (4,0,0)` and `initialVelocityOther = (-2,0,0)` starting 10 units apart (`x = -5` and `x = 5`), closing speed is 6 units/s — collision happens well under 2s. Wait for it, plus margin for all three tests' scripts to also finish so a single console read covers everything:

```bash
sleep 12
```

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Stop"`.

- [ ] **Step 5: Verify the result**

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Log"]`, `FilterText: "CollisionMomentumTest] RESULT"`.

Expected: `[CollisionMomentumTest] RESULT: PASS relativeError=0.00000 tolerance=0.01000`. If `FAIL`, first confirm a collision actually happened at all (look for the `momentumBefore=...momentumAfter=...` line under the same script's tag without `"RESULT"` — if that line is entirely missing, the two cubes never touched: check their `position`/velocity values from Step 2 put them on a genuine collision course) before suspecting the physics engine itself.

- [ ] **Step 6: Run all three tests together and do a combined final check**

This step confirms nothing regressed across the three GameObjects sharing one scene. Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Play"`, wait, then `Action: "Stop"`:

```bash
sleep 12
```

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Log"]`, `FilterText: "RESULT"`, `Count: 20`.

Expected: three `RESULT: PASS` lines, one per script (`ImpulseDriftTest`, `ContinuousThrustTest`, `CollisionMomentumTest`).

- [ ] **Step 7: Commit**

```bash
git add Assets/Scripts/PhysicsSmokeTest/CollisionMomentumTest.cs Assets/Scripts/PhysicsSmokeTest/CollisionMomentumTest.cs.meta \
        Assets/Scenes/PhysicsSmokeTest.unity
git commit -m "feat: add collision momentum conservation smoke test, verified PASS"
```

---

## Final Verification

After Task 5, all three pass conditions from the spec are proven simultaneously in one scene:
1. Impulse + infinite drift (no hidden damping).
2. Continuous thrust producing monotonic acceleration, followed by a stable coast (no decay after release).
3. Momentum-conserving collision between differently-massed bodies.

This closes sub-project 1. Sub-project 2 (Newtonian flight controls) can now build real player input on top of a verified-correct physics foundation — it should reuse the same "zero damping, explicit force application" pattern established here, and can delete or keep this smoke-test scene as a reference (not part of this plan's scope to decide).
