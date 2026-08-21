# Unity Ship Asset Import (Sub-Project 6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder box's visuals with the real Blender-authored `wlv01_exterior.glb` model, import `deck.glb` for future use, and prove nothing about the ship's physics or camera behavior regressed.

**Architecture:** glTFast imports both GLBs as Unity model assets. The exterior model's root is instantiated as a **child** of the existing `Ship` GameObject — `Rigidbody`/`BoxCollider`/`ShipPhysicsController`/`ShipInputReader` stay on the parent, untouched by name or signature, so sub-projects 2-3's tuning and automated tests keep working. The placeholder cube's own `MeshFilter`/`MeshRenderer` are removed once the real hierarchy is in place, and the collider is resized to match.

**Tech Stack:** Unity 6000.5.8f1, glTFast (`com.unity.cloud.gltfast`, Unity's first-party glTF/GLB importer — confirmed as the correct package ID via web search, since the connected Package Manager MCP tools can query/install a *known* package ID but can't search the registry by keyword). Controlled via `mcp__unity-mcp__*` MCP tools.

**Spec:** [docs/superpowers/specs/2026-08-22-unity-ship-asset-import-design.md](../specs/2026-08-22-unity-ship-asset-import-design.md)

## Global Constraints

- **File paths are relative to the Unity project root `C:/Users/U6077517/SpaceSim`** (separate git repo from this portfolio repo — all `git` commands run with cwd = that root). Current HEAD there is `104e14c`.
- **Source GLB files live in the portfolio repo**, at `C:/usr/workspace/personal/portfolio/worldline-lab/shared/assets/wlv01_exterior.glb` and `.../deck.glb` — they must be copied into the SpaceSim project's `Assets/` folder before Unity can import them; this is a plain filesystem copy, not a git operation between the two repos.
- `deck.glb` is imported and validated only — no scene wiring. `wlv01_exterior.glb` is the one that becomes the flying ship's visual.
- Collision stays a simple `BoxCollider`, not a mesh collider — resized to match the real model's bounding box, never replaced with an exact hull shape.
- `Ship`'s own `transform.localScale` gets reset to `(1,1,1)` — it was only ever stretching the placeholder cube primitive into an elongated box; the real model handles its own proportions, and leaving the old `(1,1,2.5)` stretch in place would double-scale the new child.
- The imported model is scaled to roughly match the placeholder's established length (`2.5` units, its longest/Z dimension), not the other way around — sub-project 2's `ShipControlMappingTest` and sub-project 3's `ShipCameraVerificationTest` both encode numeric expectations tuned to the placeholder's scale; rescaling the model preserves that tuning, rescaling the physics constants would require re-verifying it.
- **Important, non-obvious consequence of resizing the collider:** Unity auto-computes a `Rigidbody`'s inertia tensor from its collider's actual world-space dimensions. Changing `BoxCollider.size`/`center` (Task 2) will very likely change the computed inertia tensor, which changes how fast the ship *rotates* under a given torque pulse — this means Task 3's regression re-run may legitimately show **different numeric values** than sub-project 2/3's original runs, not identical ones. That's expected, not a bug — the pass/fail thresholds were set with generous margins specifically to absorb this. Only an actual `FAIL` line indicates a real regression worth investigating; different-but-passing numbers are fine.
- `ShipCameraVerificationTest` is the meaningful regression check here — it drives `Ship`'s own `Rigidbody`/`ShipPhysicsController` directly. `ShipControlMappingTest` uses a completely separate isolated test rig at `y=30` that never touches `Ship` at all — re-running it is a harmless bonus sanity check, not evidence about whether *this* plan's changes broke anything.
- Every Unity asset git-add must include its paired `.meta` file.

---

### Task 1: Install glTFast, import both GLBs

**Files:**
- Modify: `Packages/manifest.json` (adds the `com.unity.cloud.gltfast` dependency, plus glTFast's own transitive dependencies, added automatically by the Package Manager)
- Create: `Assets/Models/wlv01_exterior.glb`, `Assets/Models/deck.glb` (copied from the portfolio repo, then imported by Unity)

**Interfaces:**
- Produces: two loadable model assets at `Assets/Models/wlv01_exterior.glb` and `Assets/Models/deck.glb` — Task 2 loads the exterior one via `AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Models/wlv01_exterior.glb")`.

- [ ] **Step 1: Install glTFast**

Call `mcp__unity-mcp__Unity_PackageManager_ExecuteAction` with `operation: "Add"`, `package: "com.unity.cloud.gltfast"`, `version: "6.10.3"`.

If this specific version is no longer resolvable (package registries move — check the error message if the call fails), retry with an empty/omitted version if the tool allows it, or check `https://docs.unity3d.com/Packages/com.unity.cloud.gltfast@latest` for the current version and use that instead. Don't guess a version number — confirm one.

- [ ] **Step 2: Verify the install**

Call `mcp__unity-mcp__Unity_PackageManager_GetData` with `packageID: "com.unity.cloud.gltfast"`, `installedOnly: true`. Expected: a result confirming the package is installed (not an empty/not-found response).

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "GetState"` and confirm `IsCompiling: false` before proceeding (installing a package triggers a domain reload).

- [ ] **Step 3: Copy the GLB source files**

```bash
mkdir -p /c/Users/U6077517/SpaceSim/Assets/Models
cp "/c/usr/workspace/personal/portfolio/worldline-lab/shared/assets/wlv01_exterior.glb" /c/Users/U6077517/SpaceSim/Assets/Models/
cp "/c/usr/workspace/personal/portfolio/worldline-lab/shared/assets/deck.glb" /c/Users/U6077517/SpaceSim/Assets/Models/
```

- [ ] **Step 4: Trigger import and verify**

Call `mcp__unity-mcp__Unity_ManageAsset` with `Action: "Import"`, `Path: "Assets/Models"`, `GeneratePreview: false` (importing the folder picks up both new files).

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Error", "Warning"]`, `Count: 30`. Expected: no errors, and no warnings mentioning "shader", "material", or either filename — a missing-shader/pink-material problem shows up here at import time, not later.

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var exterior = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Models/wlv01_exterior.glb");
        var deck = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Models/deck.glb");
        result.Log("exterior loaded: {0}, deck loaded: {1}", exterior != null, deck != null);
        if (exterior != null)
        {
            var renderers = exterior.GetComponentsInChildren<Renderer>(true);
            result.Log("exterior renderer count: {0}", renderers.Length);
        }
    }
}
```

Expected: both `true`, and a nonzero exterior renderer count (confirms it's a real multi-object hierarchy, not an empty import).

- [ ] **Step 5: Commit**

```bash
git add Packages/manifest.json Packages/packages-lock.json \
        Assets/Models/wlv01_exterior.glb Assets/Models/wlv01_exterior.glb.meta \
        Assets/Models/deck.glb Assets/Models/deck.glb.meta \
        Assets/Models.meta
git commit -m "feat: install glTFast, import wlv01_exterior.glb and deck.glb"
```

(glTFast may generate additional `.meta` files or a small number of extracted texture/material sub-assets alongside the `.glb` files — check `git status --short` before committing and include anything under `Assets/Models/` that appeared as a result of the import.)

---

### Task 2: Wire the exterior model into `Ship`

**Files:**
- Modify: `Assets/Scenes/FlightControlTest.unity` (adds the exterior model as a child of `Ship`, removes `Ship`'s placeholder `MeshFilter`/`MeshRenderer`, resizes `BoxCollider`, resets `Ship.transform.localScale`)

**Interfaces:**
- Consumes: `Assets/Models/wlv01_exterior.glb` (Task 1).
- Produces: `Ship` GameObject with the real model as a child, `Ship.transform.localScale == (1,1,1)`, `BoxCollider` resized to match — Task 3's regression tests read `Ship`'s `Rigidbody`/`ShipPhysicsController` exactly as before (unchanged component names/fields), so nothing downstream needs new interface knowledge.

- [ ] **Step 1: Load the scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Load"`, `Name: "FlightControlTest"`, `Path: "Assets/Scenes"`.

- [ ] **Step 2: Instantiate the model, reset Ship's scale, resize the collider, remove the placeholder mesh**

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var shipGO = GameObject.Find("Ship");
        result.RegisterObjectModification(shipGO);

        // Ship's own scale was only ever stretching the placeholder cube
        // primitive into an elongated box. The real model handles its own
        // proportions — leaving the old stretch in place would double-scale
        // the child we're about to add.
        shipGO.transform.localScale = Vector3.one;

        var modelAsset = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Models/wlv01_exterior.glb");
        var instance = (GameObject)PrefabUtility.InstantiatePrefab(modelAsset, shipGO.transform);
        result.RegisterObjectCreation(instance);
        instance.transform.localPosition = Vector3.zero;
        instance.transform.localRotation = Quaternion.identity;
        instance.transform.localScale = Vector3.one;

        // Measure the model's natural (unscaled) bounding size.
        var renderers = instance.GetComponentsInChildren<Renderer>();
        Bounds naturalBounds = renderers[0].bounds;
        for (int i = 1; i < renderers.Length; i++) naturalBounds.Encapsulate(renderers[i].bounds);

        // Uniformly scale so the model's longest (Z, forward/aft) dimension
        // matches the placeholder's established length of 2.5 units.
        float targetLength = 2.5f;
        float naturalLength = naturalBounds.size.z;
        float scaleFactor = targetLength / naturalLength;
        instance.transform.localScale = Vector3.one * scaleFactor;

        // Re-measure after scaling to size the collider correctly.
        renderers = instance.GetComponentsInChildren<Renderer>();
        Bounds scaledBounds = renderers[0].bounds;
        for (int i = 1; i < renderers.Length; i++) scaledBounds.Encapsulate(renderers[i].bounds);
        Vector3 localCenter = shipGO.transform.InverseTransformPoint(scaledBounds.center);
        Vector3 localSize = scaledBounds.size; // Ship's scale is now (1,1,1), so world size == local size

        var boxCollider = shipGO.GetComponent<BoxCollider>();
        boxCollider.center = localCenter;
        boxCollider.size = localSize;

        // Remove the placeholder cube's visual mesh — the real model replaces it.
        var meshFilter = shipGO.GetComponent<MeshFilter>();
        var meshRenderer = shipGO.GetComponent<MeshRenderer>();
        if (meshFilter != null) Object.DestroyImmediate(meshFilter);
        if (meshRenderer != null) Object.DestroyImmediate(meshRenderer);

        EditorUtility.SetDirty(shipGO);
        result.Log("naturalLength={0:F3} scaleFactor={1:F3} colliderSize={2} colliderCenter={3}",
            naturalLength, scaleFactor, localSize, localCenter);
    }
}
```

Read the logged `naturalLength`/`scaleFactor`/`colliderSize`/`colliderCenter` values — you'll need them for the sanity check in Step 4.

**Assumption worth checking, not blindly trusting:** this script normalizes against `naturalBounds.size.z`, assuming the ship's long axis lands on Z after import (matching Unity's own forward-is-+Z convention, which glTFast's standard glTF-to-Unity axis conversion should produce automatically). If the logged `naturalLength` looks implausibly small or large relative to `naturalBounds`'s other two dimensions (add a quick follow-up `Unity_RunCommand` to log the full `naturalBounds.size` if unsure), the model's long axis may have landed on X or Y instead — in that case, change `naturalBounds.size.z` to whichever axis is actually dominant before proceeding, rather than shipping an obviously wrong scale.

- [ ] **Step 3: Save the scene**

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [ ] **Step 4: Verify the wiring**

Call `mcp__unity-mcp__Unity_ManageGameObject` with `action: "get_components"`, `target: "Ship"`. Confirm: no `MeshFilter`/`MeshRenderer` on `Ship` itself, `Rigidbody`/`BoxCollider`/`ShipPhysicsController`/`ShipInputReader` all still present, `transform.scale` reads `(1,1,1)`, `BoxCollider.size`/`center` match the values logged in Step 2.

Take a screenshot to sanity-check the model visually: call `mcp__unity-mcp__Unity_SceneView_Capture2DScene` (or `Unity_Camera_Capture` if that fits better) framing `Ship`. **If the model looks offset from where the collider/camera expect it to be** (e.g. floating away from the ship's actual position, or oddly rotated), the GLB's authored pivot doesn't sit at its own geometric origin — adjust `instance.transform.localPosition`/`localRotation` in a follow-up `Unity_RunCommand` call (not a guess — inspect the offset direction/magnitude in the screenshot first) until it sits correctly, then re-save.

- [ ] **Step 5: Commit**

```bash
git add Assets/Scenes/FlightControlTest.unity
git commit -m "feat: wire wlv01_exterior.glb into Ship, replacing the placeholder cube"
```

---

### Task 3: Regression verification + handoff

**Files:**
- Modify: `Assets/Scenes/FlightControlTest.unity` (temporarily re-enables, then re-disables, `ShipCameraVerificationTest` and `ShipControlMappingTest`)

**Interfaces:**
- Consumes: `ShipCameraVerificationTest`, `ShipControlMappingTest` (both from earlier sub-projects, currently `enabled: false` in the saved scene).

- [ ] **Step 1: Re-enable both regression-check components**

Call `mcp__unity-mcp__Unity_RunCommand` with:

```csharp
using UnityEngine;
using UnityEditor;

internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var camTest = GameObject.Find("ShipCameraVerificationTest").GetComponent<ShipCameraVerificationTest>();
        var mapTest = GameObject.Find("ShipControlMappingTest").GetComponent<ShipControlMappingTest>();
        result.RegisterObjectModification(camTest);
        result.RegisterObjectModification(mapTest);
        camTest.enabled = true;
        mapTest.enabled = true;
        EditorUtility.SetDirty(camTest);
        EditorUtility.SetDirty(mapTest);
        result.Log("re-enabled both regression harnesses");
    }
}
```

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [ ] **Step 2: Run both harnesses**

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Play"`.

`ShipCameraVerificationTest` runs 4 phases totaling ~9.5s; `ShipControlMappingTest` runs 7 phases totaling ~7s — both run concurrently in the same Play session. Wait comfortably past the longer one:

```bash
sleep 14
```

Call `mcp__unity-mcp__Unity_ManageEditor` with `Action: "Stop"`.

**If simulated time is barely advancing despite the wait**, the Unity Editor window has likely lost OS focus — this has recurred across every sub-project's Play-mode verification so far, sometimes severely (a full stall, not just slowdown). Report this to the controller rather than looping indefinitely; asking the user to click into the Editor window has resolved it every time.

- [ ] **Step 3: Verify the results**

Call `mcp__unity-mcp__Unity_ReadConsole` with `Action: "Get"`, `Types: ["Log"]`, `FilterText: "RESULT"`, `Count: 20`.

Expected: 4 lines from `ShipCameraVerificationTest` (`YawTracking`, `PitchTracking`, `RollStability`, `VerticalGimbalSafety`) and 7 lines from `ShipControlMappingTest` (`ThrustForward`, `ThrustStrafe`, `ThrustVertical`, `TorquePitch`, `TorqueYaw`, `TorqueRoll`, `ZeroInput`), all `PASS`.

**Per the Global Constraints note above: the `ShipCameraVerificationTest` numeric values (e.g. `maxDesiredRotationJumpDegrees`, the tracking dot products) may legitimately differ from sub-project 3's original run — a resized collider changes the ship's computed inertia tensor, which changes its angular response.** Different-but-passing numbers are expected and fine. Only report a `FAIL` line as a problem — don't try to make the numbers match the old run exactly.

If any line reads `FAIL`, report the actual values and do not adjust thresholds to force a pass — investigate whether the collider resize in Task 2 produced something genuinely wrong (e.g. a wildly oversized or offset collider) before assuming it's just expected drift.

- [ ] **Step 4: Re-disable both regression-check components**

Same pattern as Step 1, but setting `enabled = false` on both — they shouldn't run during normal Play sessions (they'd disrupt a live flight the same way sub-project 3's final review flagged for `ShipCameraVerificationTest` alone).

Call `mcp__unity-mcp__Unity_ManageScene` with `Action: "Save"`.

- [ ] **Step 5: Take a handoff screenshot**

Call `mcp__unity-mcp__Unity_SceneView_Capture2DScene` (or `Unity_Camera_Capture`) framing `Ship` with its real model, for the user to visually confirm it looks right. This is the sub-project's actual acceptance signal per the spec — no live-flying requirement, just visual confirmation.

- [ ] **Step 6: Commit**

```bash
git add Assets/Scenes/FlightControlTest.unity
git commit -m "chore: verify no regression after real-model wiring, re-disable test harnesses"
```

---

## Final Verification

After Task 3, the real `wlv01_exterior.glb` model is flying in place of the placeholder box, with both regression harnesses confirming sub-project 2's control mapping and sub-project 3's camera behavior still work correctly against it (accounting for the expected inertia-tensor shift from the resized collider). `deck.glb` is imported and validated, ready for whenever sub-project 7 (cockpit view) wires it up. Hand the screenshot to your human partner — if the model's scale, position, or orientation looks wrong, that's a quick follow-up (adjust `distance`/`height` on `ShipChaseCamera`, or the model's `localPosition`/`localScale` on `Ship`), not a re-open of this plan.

This closes sub-project 6. Sub-project 4 (visual feedback) can now build thruster effects anchored to the real engine/nozzle geometry instead of guessed positions on a box.
