# Unity Newtonian Flight Controls (Sub-Project 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the player real, full-6DOF Newtonian control over a placeholder ship — keyboard + mouse input mapped to local-space force/torque on a `Rigidbody` — with the control-mapping code proven correct by automated checks before a live playtest confirms it actually feels right to fly.

**Architecture:** A new `Ship` action map in the existing Input System asset feeds a `ShipInputReader` (raw input → a plain `ShipControlInput` struct) which drives a separate `ShipPhysicsController` (struct → `AddForce`/`AddTorque`). The split means the automated verification harness can call `ShipPhysicsController.ApplyControlInput(...)` directly with synthetic values, without needing to simulate real keyboard/mouse events.

**Tech Stack:** Unity 6000.5.8f1, built-in PhysX (`Rigidbody`), Unity Input System package (already installed, no code-generation wrapper — actions are looked up by name at runtime via `InputActionAsset.FindActionMap`/`FindAction`). Controlled via `mcp__unity-mcp__*` MCP tools.

**Spec:** [docs/superpowers/specs/2026-08-15-unity-flight-controls-design.md](../specs/2026-08-15-unity-flight-controls-design.md)

## Global Constraints

- **File paths are relative to the Unity project root `C:/Users/U6077517/SpaceSim`** (a separate git repo from this portfolio repo — all `git` commands in this plan run with cwd = that root). Current HEAD there is `31f396e`.
- Full 6DOF, no flight-assist, no auto-leveling, no damping — `ShipPhysicsController` must explicitly zero `linearDamping`/`angularDamping`/`useGravity` on its `Rigidbody`, the same pattern sub-project 1 established.
- Keyboard + mouse only — no gamepad bindings.
- `Physics.gravity` is already `(0,0,0)` project-wide from sub-project 1 (a Project Setting, not per-scene) — no new gravity configuration needed.
- New scene `Assets/Scenes/FlightControlTest.unity`, kept separate from sub-project 1's `Assets/Scenes/PhysicsSmokeTest.unity`.
- Verification is numeric first (`Debug.Log` + `Unity_ReadConsole`, same `RESULT:` pattern as sub-project 1) for the control-mapping correctness, THEN a required live human playtest — per sub-project 1's final review, every automated check in this plan must assert an actual expected-magnitude/threshold, never just internal self-consistency (a check that would also pass on a completely inert/no-op controller is not acceptable).
- No real ship model (placeholder elongated box), no real camera system (throwaway follow script only), no HUD, no play-space design — all deferred to later sub-projects per the spec's Non-goals.
- Every Unity asset git-add must include its paired `.meta` file.

---

### Task 1: `Ship` input action map

**Files:**
- Modify: `Assets/InputSystem_Actions.inputactions` (adds a new `Ship` action map — the existing `Player` map is untouched)

**Interfaces:**
- Produces: an action map named `"Ship"` with three actions — `"Thrust"` (Vector3), `"Look"` (Vector2), `"Roll"` (float/Axis) — that Task 2's `ShipInputReader` looks up by these exact string names.

- [x] **Step 1: Confirm the exact built-in composite type names**

Composite binding names (e.g. whether a 3D vector composite is registered as `"3DVector"`) must be confirmed against the actually-installed Input System package version before use — do not assume. Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        foreach (var name in InputSystem.ListComposites())
        {
            result.Log("composite: {0}", name);
        }
    }
}
```

Find the 3D vector composite name (expected `"3DVector"`) and the 1D axis composite name (expected `"1DAxis"`) in the logged output. If either differs from these expected values, use the actual logged name in Step 2 instead.

- [x] **Step 2: Build the `Ship` action map via the Input System's C# API**

Building it through `InputActionSetupExtensions` (the officially supported API) rather than hand-editing the `.inputactions` JSON avoids getting the composite-binding serialization format subtly wrong. Call `mcp__unity-mcp__Unity_RunCommand` with (replace `"3DVector"`/`"1DAxis"` below if Step 1 found different names):

```csharp
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        string path = "Assets/InputSystem_Actions.inputactions";
        var asset = AssetDatabase.LoadAssetAtPath<InputActionAsset>(path);
        result.RegisterObjectModification(asset);

        if (asset.FindActionMap("Ship") != null)
        {
            result.LogError("Ship map already exists — aborting to avoid duplicates.");
            return;
        }

        var map = asset.AddActionMap("Ship");

        var thrust = map.AddAction("Thrust", type: InputActionType.Value, expectedControlLayout: "Vector3");
        thrust.AddCompositeBinding("3DVector")
            .With("Up", "<Keyboard>/space")
            .With("Down", "<Keyboard>/leftCtrl")
            .With("Left", "<Keyboard>/a")
            .With("Right", "<Keyboard>/d")
            .With("Forward", "<Keyboard>/w")
            .With("Backward", "<Keyboard>/s");

        map.AddAction("Look", type: InputActionType.Value, binding: "<Mouse>/delta", expectedControlLayout: "Vector2");

        var roll = map.AddAction("Roll", type: InputActionType.Value, expectedControlLayout: "Axis");
        roll.AddCompositeBinding("1DAxis")
            .With("Negative", "<Keyboard>/q")
            .With("Positive", "<Keyboard>/e");

        EditorUtility.SetDirty(asset);
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        result.Log("Ship action map created: Thrust (composite, {0} bindings), Look (1 binding), Roll (composite, {1} bindings).",
            thrust.bindings.Count, roll.bindings.Count);
    }
}
```

If `AddCompositeBinding` throws because a composite name is wrong, that's Step 1 not being followed correctly — go back and use the exact logged name, don't guess a variant.

- [x] **Step 3: Verify the map**

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var asset = AssetDatabase.LoadAssetAtPath<InputActionAsset>("Assets/InputSystem_Actions.inputactions");
        var map = asset.FindActionMap("Ship");
        result.Log("Ship map found: {0}", map != null);
        foreach (var action in map.actions)
        {
            result.Log("action={0} type={1} expectedControlType={2} bindingCount={3}",
                action.name, action.type, action.expectedControlType, action.bindings.Count);
        }
    }
}
```

Expected: `Ship map found: True`, three actions logged — `Thrust` (bindingCount 7 = 1 composite + 6 parts), `Look` (bindingCount 1), `Roll` (bindingCount 3 = 1 composite + 2 parts).

- [x] **Step 4: Commit**

```bash
git add Assets/InputSystem_Actions.inputactions
git commit -m "feat: add Ship input action map (Thrust/Look/Roll)"
```

---

### Task 2: `ShipControlInput`, `ShipInputReader`, `ShipPhysicsController`

**Files:**
- Create: `Assets/Scripts/Ship/ShipControlInput.cs`
- Create: `Assets/Scripts/Ship/ShipInputReader.cs`
- Create: `Assets/Scripts/Ship/ShipPhysicsController.cs`

**Interfaces:**
- Produces: `struct ShipControlInput { public Vector3 thrust; public Vector3 torque; }` (public fields, no properties — a plain data carrier).
- Produces: `class ShipPhysicsController : MonoBehaviour` with `public float maxThrustForce = 10f;`, `public float maxTorqueForce = 5f;`, and `public void ApplyControlInput(ShipControlInput input)` — Task 3's placeholder ship and Task 4's test harness both call this directly.
- Produces: `class ShipInputReader : MonoBehaviour` with `public InputActionAsset actionsAsset;`, `public float mouseSensitivity = 0.1f;`, `public bool invertPitch = true;` — reads input each `FixedUpdate` and calls `GetComponent<ShipPhysicsController>().ApplyControlInput(...)`.
- Consumes: the `"Ship"` action map with `"Thrust"`/`"Look"`/`"Roll"` actions from Task 1.

- [x] **Step 1: Create the folder and the `ShipControlInput` struct**

Call `mcp__unity-mcp__Unity_ManageAsset` with `Action: "CreateFolder"`, `Path: "Assets/Scripts/Ship"`.

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/Ship/ShipControlInput.cs"`, `ScriptType: "Plain"`, `Contents`:

```csharp
using UnityEngine;

public struct ShipControlInput
{
    public Vector3 thrust; // local-space, magnitude 0-1 per axis
    public Vector3 torque; // x=pitch, y=yaw, z=roll, magnitude 0-1 per axis
}
```

- [x] **Step 2: Write `ShipPhysicsController.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/Ship/ShipPhysicsController.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;

public class ShipPhysicsController : MonoBehaviour
{
    public float maxThrustForce = 10f;
    public float maxTorqueForce = 5f;

    private Rigidbody rb;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        rb.linearDamping = 0f;
        rb.angularDamping = 0f;
        rb.useGravity = false;
    }

    public void ApplyControlInput(ShipControlInput input)
    {
        rb.AddForce(transform.TransformDirection(input.thrust) * maxThrustForce, ForceMode.Force);
        rb.AddTorque(transform.TransformDirection(input.torque) * maxTorqueForce, ForceMode.Force);
    }
}
```

- [x] **Step 3: Write `ShipInputReader.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/Ship/ShipInputReader.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(ShipPhysicsController))]
public class ShipInputReader : MonoBehaviour
{
    public InputActionAsset actionsAsset;
    public float mouseSensitivity = 0.1f;
    public bool invertPitch = true;

    private InputActionMap shipMap;
    private InputAction thrustAction;
    private InputAction lookAction;
    private InputAction rollAction;
    private ShipPhysicsController physicsController;

    void OnEnable()
    {
        physicsController = GetComponent<ShipPhysicsController>();
        shipMap = actionsAsset.FindActionMap("Ship");
        thrustAction = shipMap.FindAction("Thrust");
        lookAction = shipMap.FindAction("Look");
        rollAction = shipMap.FindAction("Roll");
        shipMap.Enable();
    }

    void OnDisable()
    {
        shipMap?.Disable();
    }

    void FixedUpdate()
    {
        Vector3 thrust = thrustAction.ReadValue<Vector3>();
        Vector2 look = lookAction.ReadValue<Vector2>();
        float roll = rollAction.ReadValue<float>();

        ShipControlInput input;
        input.thrust = thrust;
        input.torque = new Vector3(
            (invertPitch ? -1f : 1f) * look.y * mouseSensitivity,
            look.x * mouseSensitivity,
            roll);

        physicsController.ApplyControlInput(input);
    }
}
```

- [x] **Step 4: Validate scripts compile**

Call `mcp__unity-mcp__Unity_ValidateScript` with `Uri: "Assets/Scripts/Ship/ShipInputReader.cs"`, `Level: "standard"`, `IncludeDiagnostics: true`. Expected: no errors. Repeat for `ShipPhysicsController.cs`.

- [x] **Step 5: Commit**

```bash
git add Assets/Scripts/Ship/ShipControlInput.cs Assets/Scripts/Ship/ShipControlInput.cs.meta \
        Assets/Scripts/Ship/ShipInputReader.cs Assets/Scripts/Ship/ShipInputReader.cs.meta \
        Assets/Scripts/Ship/ShipPhysicsController.cs Assets/Scripts/Ship/ShipPhysicsController.cs.meta \
        Assets/Scripts/Ship.meta
git commit -m "feat: add ShipControlInput/ShipInputReader/ShipPhysicsController"
```

---

### Task 3: `FlightControlTest` scene, placeholder ship, follow camera

**Files:**
- Create: `Assets/Scripts/Ship/ShipFollowCamera.cs`
- Create: `Assets/Scenes/FlightControlTest.unity`

**Interfaces:**
- Consumes: `ShipInputReader`, `ShipPhysicsController` (Task 2).
- Produces: a scene with a GameObject named `"Ship"` (the playable placeholder) that Task 4's test harness object coexists with (positioned far apart — see Step 3's note).

- [x] **Step 1: Write `ShipFollowCamera.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/Ship/ShipFollowCamera.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;

// Throwaway playtest scaffolding — NOT the real flying-camera system (that's a
// separate, later design). No smoothing, no collision avoidance, on purpose.
public class ShipFollowCamera : MonoBehaviour
{
    public Transform target;
    public float distance = 8f;
    public float height = 3f;

    void LateUpdate()
    {
        if (target == null) return;
        transform.position = target.position - target.forward * distance + Vector3.up * height;
        transform.LookAt(target.position);
    }
}
```

- [x] **Step 2: Create the scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Create"`, `Name: "FlightControlTest"`, `Path: "Assets/Scenes"`.

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Load"`, `Name: "FlightControlTest"`, `Path: "Assets/Scenes"`.

- [x] **Step 3: Create the placeholder ship**

Call `mcp__unity-mcp__Unity_ManageGameObject` with:
- `action: "create"`
- `name: "Ship"`
- `primitive_type: "Cube"`
- `position: [0, 0, 0]`
- `scale: [1, 1, 2.5]`
- `components_to_add: ["Rigidbody", "ShipPhysicsController", "ShipInputReader"]`
- `component_properties: {"Rigidbody": {"mass": 1.0, "useGravity": false}, "ShipInputReader": {"actionsAsset": "Assets/InputSystem_Actions.inputactions"}}`

(Scale `[1, 1, 2.5]` makes local +Z visibly the long/"forward" axis, matching `Transform.forward`. This scene is separate from sub-project 1's `PhysicsSmokeTest.unity` — Task 4's isolated test object will additionally be placed far from this ship, e.g. at a distinct Y-lane like sub-project 1 used, so a runaway physics response during automated testing can never physically reach the playable ship.)

- [x] **Step 4: Create the follow camera**

Call `mcp__unity-mcp__Unity_ManageGameObject` with:
- `action: "create"`
- `name: "FollowCamera"`
- `position: [0, 3, -8]`
- `components_to_add: ["Camera", "ShipFollowCamera"]`
- `component_properties: {"ShipFollowCamera": {"target": {"find": "Ship", "component": "Transform"}}}`

(The earlier physics smoke-test plan found `component_properties`'s `{"find": ..., "component": ...}` reference syntax unreliable via `create`/`modify`/`set_component_property`. If this doesn't take effect — check with `Unity_ManageGameObject get_components` on `FollowCamera` afterward — fall back to `Unity_RunCommand` to assign `GetComponent<ShipFollowCamera>().target` directly in C#, the same workaround used in that plan.)

- [x] **Step 5: Save and verify**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

Call `mcp__unity-mcp__Unity_ManageGameObject` with `action: "get_components"`, `target: "FollowCamera"`. Confirm `ShipFollowCamera.target` is assigned to the `Ship` GameObject's Transform, not `null`.

Call `mcp__unity-mcp__Unity_ManageGameObject` with `action: "get_components"`, `target: "Ship"`. Confirm `ShipInputReader.actionsAsset` is assigned (not `null`) and `Rigidbody.mass` reads `1`. Sub-project 1's final review found `component_properties` writes can silently fail beyond just cross-object references (it missed `useGravity`/mass on some objects there) — verify every field this step set, not only the reference ones. If anything is missing or wrong, use `mcp__unity-mcp__Unity_RunCommand` to assign it directly in C# (`GetComponent<ShipInputReader>().actionsAsset = AssetDatabase.LoadAssetAtPath<InputActionAsset>("Assets/InputSystem_Actions.inputactions")`, etc.), matching the workaround from that plan.

- [x] **Step 6: Commit**

```bash
git add Assets/Scripts/Ship/ShipFollowCamera.cs Assets/Scripts/Ship/ShipFollowCamera.cs.meta \
        Assets/Scenes/FlightControlTest.unity Assets/Scenes/FlightControlTest.unity.meta
git commit -m "feat: add FlightControlTest scene with placeholder ship and follow camera"
```

---

### Task 4: Automated control-mapping verification

**Files:**
- Create: `Assets/Scripts/Ship/ShipControlMappingTest.cs`
- Modify: `Assets/Scenes/FlightControlTest.unity` (adds the test harness GameObject)

**Interfaces:**
- Consumes: `ShipPhysicsController.ApplyControlInput(ShipControlInput)` (Task 2) — called directly with synthetic values, bypassing `ShipInputReader` entirely.
- Produces: `class ShipControlMappingTest : MonoBehaviour`. Logs one `[ShipControlMappingTest] RESULT: PASS|FAIL ...` line per phase (7 total: 3 thrust axes, 3 torque axes, 1 zero-input check).

- [x] **Step 1: Write `ShipControlMappingTest.cs`**

Call `mcp__unity-mcp__Unity_CreateScript` with `Path: "Assets/Scripts/Ship/ShipControlMappingTest.cs"`, `ScriptType: "MonoBehaviour"`, `Contents`:

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody), typeof(ShipPhysicsController))]
public class ShipControlMappingTest : MonoBehaviour
{
    public float phaseDurationSeconds = 1f;
    public float minTargetAxisUnits = 3f;
    public float maxOffAxisUnits = 0.05f;

    private Rigidbody rb;
    private ShipPhysicsController controller;
    private float elapsed;
    private int phaseIndex;
    private bool finished;

    private struct Phase
    {
        public string name;
        public ShipControlInput input;
        public bool isTorque; // false = check linearVelocity, true = check angularVelocity
        public int axisIndex; // 0=x, 1=y, 2=z
        public bool checkZero; // true = assert no motion at all (the zero-input phase)
    }

    private Phase[] phases;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        controller = GetComponent<ShipPhysicsController>();
        rb.linearDamping = 0f;
        rb.angularDamping = 0f;
        rb.useGravity = false;

        phases = new Phase[]
        {
            new Phase { name = "ThrustForward", input = new ShipControlInput { thrust = new Vector3(0, 0, 1) }, isTorque = false, axisIndex = 2 },
            new Phase { name = "ThrustStrafe",  input = new ShipControlInput { thrust = new Vector3(1, 0, 0) }, isTorque = false, axisIndex = 0 },
            new Phase { name = "ThrustVertical",input = new ShipControlInput { thrust = new Vector3(0, 1, 0) }, isTorque = false, axisIndex = 1 },
            new Phase { name = "TorquePitch",   input = new ShipControlInput { torque = new Vector3(1, 0, 0) }, isTorque = true,  axisIndex = 0 },
            new Phase { name = "TorqueYaw",     input = new ShipControlInput { torque = new Vector3(0, 1, 0) }, isTorque = true,  axisIndex = 1 },
            new Phase { name = "TorqueRoll",    input = new ShipControlInput { torque = new Vector3(0, 0, 1) }, isTorque = true,  axisIndex = 2 },
            new Phase { name = "ZeroInput",     input = new ShipControlInput(), isTorque = false, axisIndex = 0, checkZero = true },
        };
    }

    void FixedUpdate()
    {
        if (finished) return;
        if (phaseIndex >= phases.Length)
        {
            finished = true;
            Debug.Log("[ShipControlMappingTest] ALL PHASES COMPLETE");
            return;
        }

        if (elapsed == 0f)
        {
            rb.linearVelocity = Vector3.zero;
            rb.angularVelocity = Vector3.zero;
            // ApplyControlInput's torque is local-space (transform.TransformDirection),
            // by design — pitch/yaw/roll always mean "relative to the ship's current
            // facing," which is correct for a flight controller. But this test checks
            // world-space rb.angularVelocity against fixed world axes, so it must also
            // reset orientation between phases — otherwise a rotation left over from an
            // earlier torque phase misaligns local and world axes for every phase after
            // it, producing spurious off-axis "leakage" that isn't actually a mapping bug.
            transform.rotation = Quaternion.identity;
        }

        var phase = phases[phaseIndex];
        controller.ApplyControlInput(phase.input);
        elapsed += Time.fixedDeltaTime;

        if (elapsed >= phaseDurationSeconds)
        {
            Vector3 result = phase.isTorque ? rb.angularVelocity : rb.linearVelocity;
            bool pass;
            if (phase.checkZero)
            {
                pass = result.magnitude <= maxOffAxisUnits;
                Debug.Log($"[ShipControlMappingTest] RESULT: {phase.name} {(pass ? "PASS" : "FAIL")} magnitude={result.magnitude:F5} tolerance={maxOffAxisUnits:F5}");
            }
            else
            {
                float targetComponent = result[phase.axisIndex];
                float offAxisMagnitude = (result - Vector3.Scale(result, UnitVector(phase.axisIndex))).magnitude;
                bool targetOk = Mathf.Abs(targetComponent) >= minTargetAxisUnits;
                bool offAxisOk = offAxisMagnitude <= maxOffAxisUnits;
                pass = targetOk && offAxisOk;
                Debug.Log($"[ShipControlMappingTest] RESULT: {phase.name} {(pass ? "PASS" : "FAIL")} targetAxis={phase.axisIndex} targetComponent={targetComponent:F5} minRequired={minTargetAxisUnits:F5} offAxisMagnitude={offAxisMagnitude:F5} offAxisTolerance={maxOffAxisUnits:F5}");
            }

            phaseIndex++;
            elapsed = 0f;
        }
    }

    private static Vector3 UnitVector(int axisIndex)
    {
        Vector3 v = Vector3.zero;
        v[axisIndex] = 1f;
        return v;
    }
}
```

- [x] **Step 2: Create the test harness GameObject**

Call `mcp__unity-mcp__Unity_ManageGameObject` with:
- `action: "create"`
- `name: "ShipControlMappingTest"`
- `primitive_type: "Cube"`
- `position: [0, 30, 0]`
- `components_to_add: ["Rigidbody", "ShipPhysicsController", "ShipControlMappingTest"]`
- `component_properties: {"Rigidbody": {"mass": 1.0, "useGravity": false}}`

(`y: 30` keeps this object permanently isolated from the playable `Ship` at `y: 0`, following the same Y-lane-separation reasoning sub-project 1 used — this object never applies Y-axis force from thrust/torque phases other than the deliberate `ThrustVertical` phase, which moves it a small, bounded distance over 1 second, nowhere near the playable ship's lane.)

- [x] **Step 3: Save the scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [x] **Step 4: Run the test**

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Play"`.

The test runs 7 phases at 1 second each = 7 seconds of simulated time; wait comfortably past it:

```bash
sleep 12
```

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Stop"`.

**If simulated time is barely advancing despite the wait** (check the intermediate phase-completion logs' timing), the Unity Editor window has likely lost OS focus — this exact issue occurred repeatedly during sub-project 1's execution and was fixed by clicking into the Editor window. Report this to the controller rather than treating it as a script bug; don't loop indefinitely on retries.

- [x] **Step 5: Verify the results**

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Log"]`, `FilterText: "ShipControlMappingTest] RESULT"`, `Count: 20`.

Expected: 7 lines, one per phase (`ThrustForward`, `ThrustStrafe`, `ThrustVertical`, `TorquePitch`, `TorqueYaw`, `TorqueRoll`, `ZeroInput`), all `PASS`. If any `FAIL`, report the actual logged values — do not adjust `minTargetAxisUnits`/`maxOffAxisUnits` to force a pass; a genuine failure here means the input-to-physics mapping is wrong (e.g. an axis swap or sign error), which is exactly the class of bug this task exists to catch.

- [x] **Step 6: Commit**

```bash
git add Assets/Scripts/Ship/ShipControlMappingTest.cs Assets/Scripts/Ship/ShipControlMappingTest.cs.meta \
        Assets/Scenes/FlightControlTest.unity
git commit -m "feat: add automated ship control-mapping verification, all 7 phases PASS"
```

---

## Final Verification

After Task 4, the control-mapping code is proven correct: each of the 6 control axes produces motion purely along its own local axis with no cross-axis leakage, and zero input produces zero motion. This is **not** the sub-project's acceptance gate — per the spec, flight *feel* can't be proven by a log line. The last step is a live playtest: press Play in the `FlightControlTest` scene, and fly the `Ship` object yourself (WASD + Space/Ctrl for thrust, mouse for pitch/yaw, Q/E for roll) to confirm it's responsive and correctly oriented. This is a step for your human partner to do directly in the Editor, not something a subagent can complete — report the automated results and hand off for this final check.

If pitch feels inverted, flip `ShipInputReader.invertPitch` on the `Ship` GameObject. If the ship feels too sluggish or too twitchy, tune `ShipPhysicsController.maxThrustForce`/`maxTorqueForce` (currently 10/5) or `ShipInputReader.mouseSensitivity` (currently 0.1) directly in the Inspector or via `Unity_ManageGameObject set_component_property`, then re-save the scene.

This closes sub-project 2. Sub-project 3 (flying camera mode) replaces `ShipFollowCamera` with a properly designed system; sub-project 4 (visual feedback) adds thruster visuals tied to the same `ShipControlInput` values already flowing through `ShipPhysicsController`.

**One thing to notice during your playtest, not yet decided:** the `Thrust` action's `3DVector` composite defaults to `Analog` mode, so pressing two thrust keys at once (e.g. `W`+`A`) produces a diagonal thrust vector of magnitude ≈1.73×, not 1×. For a ship with independent per-axis thrusters this is arguably more physically honest than clamping to 1×, but it wasn't a deliberate design decision — it's worth forming an opinion on while flying.

---

## Execution Record

All 4 tasks executed via subagent-driven-development, per-task reviews skipped per standing instruction (one final review only). Full ledger with every controller ruling: `.superpowers/sdd/2026-08-15-unity-flight-controls/progress.md` (deleted after this plan closes — this section is the durable summary).

**SpaceSim commit history** (`C:/Users/U6077517/SpaceSim`, building on sub-project 1's `31f396e`):
- `8213f4d` — Task 1: `Ship` input action map
- `cf5a6e8` — Task 2: `ShipControlInput`/`ShipInputReader`/`ShipPhysicsController`
- `ddeb035` — Task 3: `FlightControlTest.unity` scene, placeholder ship, follow camera
- `f509215` — Task 4: automated control-mapping verification (round 2 — round 1 caught a real test-harness bug, see below)
- `48a584e` — final-review fix wave

**Two real bugs found and fixed during execution**, both in this plan's own script text, not implementer error — both implementers correctly refused to fudge a FAIL rather than force a pass:
1. **Task 4, round 1:** `ShipControlMappingTest` reset `linearVelocity`/`angularVelocity` between phases but never `transform.rotation`. `TorquePitch` (which runs while still at identity, so its own check passes clean) left the object rotated; that leftover rotation misaligned local vs. world axes for `TorqueYaw`/`TorqueRoll` after it — 2 genuine `FAIL`s with real off-axis leakage (6-8 units), not a mapping bug in `ApplyControlInput` itself. Fixed by resetting `transform.rotation = Quaternion.identity` alongside the velocity resets.
2. **Input System package tooling** (Task 1, not a script bug but a real environment finding): `InputSystem.ListComposites()` doesn't exist in the installed package version, and `AssetDatabase.SaveAssets()` silently no-ops on the `.inputactions` asset's custom JSON importer. Worked around via empirical composite-name testing and the documented `InputActionAsset.ToJson()`/reimport round-trip, independently verified safe by the final reviewer (parsed both JSON versions, confirmed the pre-existing `Player`/`UI` maps were byte-identical apart from behavior-neutral schema-default fields).

**Final whole-branch review** (opus, range `31f396e..f509215`) found 5 Important findings, all fixed and re-verified in one fix wave (commit `48a584e`):
1. `ShipControlMappingTest`'s axis assertions used `Mathf.Abs()`, so a fully inverted control mapping would still `PASS` — could catch axis swaps but not sign errors. Fixed by asserting the correct sign directly.
2. The `ZeroInput` phase zeroed velocity then checked it stayed zero — the exact "passes on an inert controller" shape sub-project 1's review ruled unacceptable, and it never checked for phantom torque or a damping regression. Fixed to seed a known nonzero linear+angular velocity and assert both are preserved.
3. `ShipInputReader` read mouse `Look` delta inside `FixedUpdate`, making rotation sensitivity frame-rate dependent — directly corrupts the live playtest's judgment of pitch/yaw feel. Fixed by accumulating in `Update()` and consuming in `FixedUpdate()`.
4. `ShipFollowCamera` used world-up, which gimbal-flips when the ship pitches through vertical — routine in unassisted 6DOF and corrupts the playtest's ability to judge pitch/roll. Fixed to use `target.up` and explicit `LookRotation`.
5. `ShipInputReader`'s action lookups were unguarded despite the ledger's own evidence that `actionsAsset` assignment had already silently failed once (Task 3). Added guards with specific error logging.

Also fixed in the same wave: `ShipPhysicsController` missing `RequireComponent`/using `Start()` instead of `Awake()` (Minors), and 3 scene-level playtest-quality issues — serialized `angularDamping: 0.05` (runtime-corrected but misleading in the Inspector), no light source, and `Ship`'s Rigidbody missing interpolation (visible stutter at 50Hz).

One new Minor surfaced *during* the fix wave itself (not from the review): the `get_components` MCP tool's reflection-based inspection duplicates `MeshFilter`/`Renderer` instances (a `.mesh`/`.material` vs `.sharedMesh`/`.sharedMaterial` gotcha) — self-reported by the implementer, independently confirmed by the controller (embedded `Mesh` blocks named "Cube Instance" now serialized in the scene instead of a shared built-in-asset reference), parked as functionally inert scene bloat, not worth a third fix round.

**Final committed script contents** (`Assets/Scripts/Ship/` in the SpaceSim repo) reflect both the Task-4 fix and the final-review fix wave — read the files directly for the authoritative current version rather than the code blocks in Tasks 2-4 above, which show each script's state as originally planned.
