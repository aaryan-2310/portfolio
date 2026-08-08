# Cockpit Side-Hull Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 2.55-unit side-hull gap (Y −1.55 to +1.00) in the cockpit deck that makes the room read as "floating," by adding a new rib hoop plus two flat skin panels matching the existing aft hull structure — directly in the live Blender scene, model-only.

**Architecture:** All work happens through `mcp__blender__execute_blender_code` (bpy Python) against the same live, already-open Blender session used for the exterior radiator work, plus `mcp__blender__get_object_info` for verification. 7 new mesh objects total, each created via `primitive_cube_add` + explicit `dimensions`/`location`, then materialed by reusing `Hull_Side_L`'s existing material. Saved and committed once at the end.

**Tech Stack:** Blender 4.x `bpy` Python API via the Blender MCP bridge. No web/Angular/PlayCanvas code touched.

## Global Constraints

- **Model-only.** Do not export any GLB, do not touch `worldline-lab/three/main.ts`, `worldline-lab/playcanvas/main.ts`, or anything under `src/app/worldline/`.
- **Every Blender MCP tool call requires a `user_prompt` argument** — calls without it fail validation.
- Reference boundaries this plan assumes: `Hull_Side_L`/`R` end at Y **−1.55**; `Deck_Pillar_L`/`R` start at Y **+1.00**. All new geometry fills exactly that span.
- Exact object specs (center location computed as the midpoint of the stated X/Z/Y bounds; dimensions as (max−min) per axis):
  - `Hull_Rib3_L`: X[−2.73,−2.27] Y[−0.495,−0.055] Z[−1.31,1.41] → location (−2.5, −0.275, 0.05), dimensions (0.46, 0.44, 2.72)
  - `Hull_Rib3_R`: X[2.27,2.73] Y[−0.495,−0.055] Z[−1.31,1.41] → location (2.5, −0.275, 0.05), dimensions (0.46, 0.44, 2.72)
  - `Hull_Beam3`: X[−2.45,2.45] Y[−0.495,−0.055] Z[1.24,1.46] → location (0, −0.275, 1.35), dimensions (4.90, 0.44, 0.22)
  - `Hull_Side2_L`: X[−2.71,−2.53] Y[−1.55,−0.495] Z[−1.05,0.95] → location (−2.62, −1.0225, −0.05), dimensions (0.18, 1.055, 2.00)
  - `Hull_Side2_R`: X[2.53,2.71] Y[−1.55,−0.495] Z[−1.05,0.95] → location (2.62, −1.0225, −0.05), dimensions (0.18, 1.055, 2.00)
  - `Hull_Side3_L`: X[−2.71,−2.53] Y[−0.055,1.00] Z[−1.05,0.95] → location (−2.62, 0.4725, −0.05), dimensions (0.18, 1.055, 2.00)
  - `Hull_Side3_R`: X[2.53,2.71] Y[−0.055,1.00] Z[−1.05,0.95] → location (2.62, 0.4725, −0.05), dimensions (0.18, 1.055, 2.00)
- Material: reuse `Hull_Side_L`'s existing material (`Hull_Side_L.data.materials[0]`) on all 7 new objects. Do not create a new material.
- `get_viewport_screenshot` was unreliable (byte-identical/stale results) during the earlier radiator session. Treat a repeat of that as a known tooling issue to report, not a task blocker — bounding-box checks are authoritative.

---

### Task 1: Verify live Blender connection and confirm reference boundaries

**Files:** None (Blender MCP only).

**Interfaces:**
- Produces: confirmation that `Hull_Side_L`, `Hull_Side_R`, `Deck_Pillar_L`, `Deck_Pillar_R` have the boundaries this plan assumes, and that `Seat_Pedestal`, `Console_Desk_L`, `Console_Desk_R` sit within X ±1.33 (clear of the new hull geometry at X ±2.27 and beyond).

- [ ] **Step 1: Confirm the Blender MCP connection is live**

Call `mcp__blender__get_scene_info` with `user_prompt: "Confirming live Blender connection before extending the cockpit side hull."`

Expected: a JSON result with no error. Object count should be 118 (100 original + 18 radiators from the prior session) — if it's back to 100, the radiator work was lost; stop and report.

- [ ] **Step 2: Confirm reference object boundaries**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Re-confirming Hull_Side_L/R, Deck_Pillar_L/R, and cockpit furniture bounding boxes before adding new hull geometry, to catch any drift from the design-session snapshot."` and this code:

```python
import bpy

for name in ['Hull_Side_L', 'Hull_Side_R', 'Deck_Pillar_L', 'Deck_Pillar_R',
             'Seat_Pedestal', 'Console_Desk_L', 'Console_Desk_R']:
    obj = bpy.data.objects.get(name)
    if obj is None:
        print(f"{name}: MISSING")
        continue
    bbox = [obj.matrix_world @ v.co for v in obj.data.vertices]
    xs = [v.x for v in bbox]; ys = [v.y for v in bbox]; zs = [v.z for v in bbox]
    print(f"{name}: X[{min(xs):.2f},{max(xs):.2f}] Y[{min(ys):.2f},{max(ys):.2f}] Z[{min(zs):.2f},{max(zs):.2f}]")
```

Expected output (from the design session — verify it still matches):
```
Hull_Side_L: X[-2.71,-2.53] Y[-3.75,-1.55] Z[-1.05,0.95]
Hull_Side_R: X[2.53,2.71] Y[-3.75,-1.55] Z[-1.05,0.95]
Deck_Pillar_L: X[-2.93,-2.17] Y[1.00,1.50] Z[-1.31,1.71]
Deck_Pillar_R: X[2.17,2.93] Y[1.00,1.50] Z[-1.31,1.71]
Seat_Pedestal: X[-0.14,0.14] Y[-0.94,-0.66] Z[-1.00,-0.61]
Console_Desk_L: X[-1.33,-0.57] Y[-0.87,-0.03] Z[-0.67,-0.47]
Console_Desk_R: X[0.57,1.33] Y[-0.87,-0.03] Z[-0.67,-0.47]
```

If any object is `MISSING` or the numbers differ by more than ~0.1 units, stop and report — this plan's exact placements assume these values.

- [ ] **Step 3: No commit** (read-only verification task).

---

### Task 2: Build the new rib hoop and verify

**Files:** None (Blender scene only).

**Interfaces:**
- Consumes: `Hull_Side_L`'s material (`bpy.data.objects['Hull_Side_L'].data.materials[0]`).
- Produces: `Hull_Rib3_L`, `Hull_Rib3_R`, `Hull_Beam3` — three objects Task 3's continuity check and Task 4's material/naming check both depend on existing with these exact names and bounds.

- [ ] **Step 1: Create the rib hoop**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Creating the new rib hoop (two vertical ribs + one overhead beam) that will sit at the midpoint of the cockpit side-hull gap."` and this code:

```python
import bpy

def create_hull_piece(name, location, dimensions):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = dimensions
    hull_side = bpy.data.objects.get('Hull_Side_L')
    if hull_side and hull_side.data.materials:
        obj.data.materials.append(hull_side.data.materials[0])
    return obj

rib_l = create_hull_piece('Hull_Rib3_L', (-2.5, -0.275, 0.05), (0.46, 0.44, 2.72))
rib_r = create_hull_piece('Hull_Rib3_R', (2.5, -0.275, 0.05), (0.46, 0.44, 2.72))
beam  = create_hull_piece('Hull_Beam3',  (0.0, -0.275, 1.35), (4.90, 0.44, 0.22))

print("Created:", [o.name for o in (rib_l, rib_r, beam)])
```

Expected: prints `Created: ['Hull_Rib3_L', 'Hull_Rib3_R', 'Hull_Beam3']`.

- [ ] **Step 2: Verify bounding boxes**

Call `mcp__blender__get_object_info` three times (once per object: `Hull_Rib3_L`, `Hull_Rib3_R`, `Hull_Beam3`), each with `user_prompt: "Verifying the new rib hoop piece's bounding box and material match the plan's exact spec."`

Expected `world_bounding_box` for each (allow ±0.01 for floating point):
- `Hull_Rib3_L`: X[-2.73,-2.27] Y[-0.495,-0.055] Z[-1.31,1.41]
- `Hull_Rib3_R`: X[2.27,2.73] Y[-0.495,-0.055] Z[-1.31,1.41]
- `Hull_Beam3`: X[-2.45,2.45] Y[-0.495,-0.055] Z[1.24,1.46]

Each response's `materials` list must be non-empty (matching `Hull_Side_L`'s material). If empty, `Hull_Side_L` has no material assigned — stop and report rather than proceeding unmaterialed.

- [ ] **Step 3: No commit** (final save + commit happens in Task 5).

---

### Task 3: Build the two skin panels and verify continuity

**Files:** None (Blender scene only).

**Interfaces:**
- Consumes: `Hull_Rib3_L`/`R`'s Y boundaries from Task 2 (−0.495 and −0.055) to verify continuity against.
- Produces: `Hull_Side2_L`, `Hull_Side2_R`, `Hull_Side3_L`, `Hull_Side3_R` — Task 4 depends on these existing with these exact names.

- [ ] **Step 1: Create the two skin panel pairs**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Creating the two flat skin panel pairs that fill the space between Hull_Side_L/R, the new rib hoop, and Deck_Pillar_L/R, closing the cockpit side-hull gap."` and this code:

```python
import bpy

def create_hull_piece(name, location, dimensions):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = dimensions
    hull_side = bpy.data.objects.get('Hull_Side_L')
    if hull_side and hull_side.data.materials:
        obj.data.materials.append(hull_side.data.materials[0])
    return obj

s2l = create_hull_piece('Hull_Side2_L', (-2.62, -1.0225, -0.05), (0.18, 1.055, 2.00))
s2r = create_hull_piece('Hull_Side2_R', (2.62, -1.0225, -0.05), (0.18, 1.055, 2.00))
s3l = create_hull_piece('Hull_Side3_L', (-2.62, 0.4725, -0.05), (0.18, 1.055, 2.00))
s3r = create_hull_piece('Hull_Side3_R', (2.62, 0.4725, -0.05), (0.18, 1.055, 2.00))

print("Created:", [o.name for o in (s2l, s2r, s3l, s3r)])
```

Expected: prints all 4 names.

- [ ] **Step 2: Verify continuity (no gaps, no overlaps) and no furniture collision**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the full Y -3.75 to +1.50 left/right hull span has no gaps or overlaps once the new panels and rib hoop are in place, and that nothing collides with the seat or console desks."` and this code:

```python
import bpy

def y_bounds(name):
    obj = bpy.data.objects[name]
    bbox = [obj.matrix_world @ v.co for v in obj.data.vertices]
    ys = [v.y for v in bbox]
    return min(ys), max(ys)

# Left-side chain, in Y order: Hull_Side_L -> Hull_Side2_L -> Hull_Rib3_L -> Hull_Side3_L -> Deck_Pillar_L
chain = ['Hull_Side_L', 'Hull_Side2_L', 'Hull_Rib3_L', 'Hull_Side3_L', 'Deck_Pillar_L']
bounds = [(name, *y_bounds(name)) for name in chain]
for name, ymin, ymax in bounds:
    print(f"{name}: Y[{ymin:.3f},{ymax:.3f}]")

TOL = 0.02
for a, b in zip(bounds, bounds[1:]):
    gap = b[1] - a[2]  # next.ymin - prev.ymax
    assert abs(gap) < TOL, f"GAP/OVERLAP between {a[0]} (ends {a[2]:.3f}) and {b[0]} (starts {b[1]:.3f}): {gap:.3f}"

print("Left chain continuous, no gaps/overlaps.")

# Right-side chain (mirrored, same Y values)
chain_r = ['Hull_Side_R', 'Hull_Side2_R', 'Hull_Rib3_R', 'Hull_Side3_R', 'Deck_Pillar_R']
bounds_r = [(name, *y_bounds(name)) for name in chain_r]
for a, b in zip(bounds_r, bounds_r[1:]):
    gap = b[1] - a[2]
    assert abs(gap) < TOL, f"GAP/OVERLAP between {a[0]} (ends {a[2]:.3f}) and {b[0]} (starts {b[1]:.3f}): {gap:.3f}"

print("Right chain continuous, no gaps/overlaps.")

# Furniture collision check: all furniture X must stay within +/-1.33, hull starts at X +/-2.27
furniture = ['Seat_Pedestal', 'Console_Desk_L', 'Console_Desk_R']
for name in furniture:
    obj = bpy.data.objects[name]
    bbox = [obj.matrix_world @ v.co for v in obj.data.vertices]
    xs = [v.x for v in bbox]
    assert max(abs(x) for x in xs) < 2.27, f"{name} X-extent {max(abs(x) for x in xs):.3f} reaches into new hull geometry (starts at X=2.27)"

print("No furniture collision.")
```

Expected: prints all Y bounds in order, `Left chain continuous, no gaps/overlaps.`, `Right chain continuous, no gaps/overlaps.`, `No furniture collision.` — no `AssertionError`.

If an `AssertionError` is raised, stop and report the exact mismatch rather than adjusting the plan's exact values yourself.

- [ ] **Step 3: No commit** (final save + commit happens in Task 5).

---

### Task 4: Verify material and naming compliance across all 7 new objects

**Files:** None (Blender scene only).

**Interfaces:**
- Consumes: all 7 objects from Tasks 2–3.
- Produces: nothing consumed by later tasks — this is a pure verification gate before Task 5.

- [ ] **Step 1: Verify naming and material**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Final verification that all 7 new hull objects exist, follow the naming convention, and share the same material as Hull_Side_L."` and this code:

```python
import bpy

expected = ['Hull_Rib3_L', 'Hull_Rib3_R', 'Hull_Beam3',
            'Hull_Side2_L', 'Hull_Side2_R', 'Hull_Side3_L', 'Hull_Side3_R']

hull_side = bpy.data.objects['Hull_Side_L']
assert hull_side.data.materials, "Hull_Side_L has no material to compare against"
ref_mat = hull_side.data.materials[0]

for name in expected:
    obj = bpy.data.objects.get(name)
    assert obj is not None, f"MISSING: {name}"
    assert obj.data.materials, f"No material on {name}"
    assert obj.data.materials[0] is ref_mat, f"{name} material is not the same datablock as Hull_Side_L's"

print(f"All 7 objects present and materialed with {ref_mat.name}.")
```

Expected: `All 7 objects present and materialed with <material name>.` with no `AssertionError`.

- [ ] **Step 2: No commit** (final save + commit happens in Task 5).

---

### Task 5: Visual verification, save, and commit

**Files:**
- Modify (binary): `worldline-lab/shared/assets/wlv01.blend`
- Modify (binary, Blender auto-backup — already tracked in git per existing repo convention): `worldline-lab/shared/assets/wlv01.blend1`

**Interfaces:**
- Consumes: the 7 new objects from Tasks 2–4.
- Produces: nothing consumed by later tasks — terminal task for this plan.

- [ ] **Step 1: Attempt a fresh visual screenshot**

Call `mcp__blender__get_viewport_screenshot` with `user_prompt: "Attempting a fresh viewport screenshot to visually confirm the cockpit side-hull gap is now closed."`

If it shows real, different geometry from prior screenshots: good, record as successful visual verification. If it's stale/unchanged: known tooling issue (see Global Constraints) — not a task failure. The Task 3 continuity checks are authoritative either way.

- [ ] **Step 2: Save the Blender file**

**Important:** do not call `bpy.ops.wm.save_mainfile()` — this live session's `bpy.data.filepath` is empty (confirmed during the prior radiator session; this is expected, not an error), and that call fails/requires opening the file first, which would discard all in-memory work. Use `save_as_mainfile` instead, which writes the current in-memory scene to the target path without opening or discarding anything.

Call `mcp__blender__execute_blender_code` with `user_prompt: "Saving the Blender file now that the cockpit side-hull extension is built and verified, using save_as_mainfile since this live session's filepath is unbound."` and this code:

```python
import bpy
bpy.ops.wm.save_as_mainfile(filepath=r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\wlv01.blend")
print("Saved:", bpy.data.filepath, "| object count:", len(bpy.data.objects))
```

Expected: prints the target path and an object count of 125 (118 + 7 new).

- [ ] **Step 3: Commit the updated Blender file**

```bash
git add worldline-lab/shared/assets/wlv01.blend worldline-lab/shared/assets/wlv01.blend1
git status --short
git commit -m "$(cat <<'EOF'
feat: close cockpit side-hull gap

Adds a new rib hoop (Hull_Rib3_L/R + Hull_Beam3) and two flat skin
panels (Hull_Side2_L/R, Hull_Side3_L/R) that close the 2.55-unit gap
between Hull_Side_L/R and Deck_Pillar_L/R -- exactly where the seat and
console desks sit. Fixes the cockpit reading as "floating": floor and
ceiling previously had no connecting side geometry in the main
seating/console area.

Model-only change -- no export, no engine wiring.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds, `git status --short` (run before the commit) shows only the two `.blend`/`.blend1` files as modified — if any other file shows as modified, stop and investigate before committing.

---

## Post-plan state

After Task 5, the pending-items report's cockpit section should note the side-hull gap as fixed (not part of this plan's scope — a documentation follow-up, not a blocking step).
