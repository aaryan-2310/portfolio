# Cockpit Curved Window + Screens + Identity/Nav Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cockpit's 6-facet flat window with one smooth curved surface, curve the 4 existing HUD panels in place, and add two new placeholder screen objects (a nav strip and a window-glass identity overlay) — all model-only, in the live Blender scene.

**Architecture:** All work happens through `mcp__blender__execute_blender_code` (bpy/bmesh Python) against the live session. Curved surfaces are built procedurally via `bmesh` rather than Blender's interactive modeling tools, so exact geometry is reproducible and reviewable as code. New screen objects follow the exact pattern the existing HUD panels already use: a UV-mapped mesh with a material slot, no baked text — actual canvas-drawn content is wired at runtime in TypeScript in a future session (explicitly out of scope here, per the design's non-goals).

**Tech Stack:** Blender 4.x `bpy`/`bmesh` Python API via the Blender MCP bridge.

## Global Constraints

- **Model-only.** No GLB export, no engine wiring, no changes to `content.ts`/`spec.ts`/any TypeScript file.
- Window's existing footprint (measured from the live scene, verify in Task 1 before trusting these): total arc ±50.8°, Z range −0.15 (bottom, ~constant across all panes) to 1.825 (top, center pane) tapering to 1.126 (top, outer panes), Y range 0.82 (outer panes) to 1.949 (center panes, the deepest/farthest point). Existing glass material: `Viewport_Glass`.
- **Curvature intensity is "moderate/curved-monitor style"** per the approved design — not subtle, not a full dome. For the window, this means smoothing the existing facet arc into a continuous curve of roughly the same depth (radius ≈ 3.2, derived from and consistent with the existing facets' measured proportions — shown in Task 1). For the smaller HUD panels, this means a proportionally subtler curve (sagitta ≈ 8% of half-width) matching real curved-monitor proportions, not the window's deep dome curve.
- HUD panel positions/rotations/names are unchanged — only their mesh data changes from flat to curved. Existing panel material names (used only as a carryover, since the runtime JS replaces materials anyway): `HUD_Timeline` uses `Display_Emissive_Amber`.
- `Deck_Dash` (X ±2.2, Y 1.058–2.042, Z −0.918 to −0.242) already hosts the three ambient dash displays (`Display_Aux1`, `Display_Console`, `Display_Aux2`) at Z≈−0.22 — there's no clean uncluttered space there for a new object. The nav strip mounts on `Deck_Beam` (X ±2.5, Y 0.8–1.2, Z 1.395–1.645) instead — an uncluttered overhead surface. This is a deliberate deviation from the reference image's bottom-nav composition, made for physical space reasons; flag it for the user to weigh in on if they feel strongly about bottom vs. overhead placement.
- Every `mcp__blender__*` tool call requires a `user_prompt` argument.
- This live session's `bpy.data.filepath` is bound to `wlv01.blend` (confirmed at the end of the prior cockpit-hull-extension session) — use `bpy.ops.wm.save_as_mainfile(filepath=...)` for the final save regardless, matching the established safe pattern (never rely on `save_mainfile()` alone).
- `get_viewport_screenshot` returned stale/cached images in an earlier session — a known tooling issue. If it recurs, note it and rely on bounding-box/vertex-count checks as the authoritative verification, per that session's precedent.

---

### Task 1: Rebuild the window as one smooth curved surface

**Files:** None (Blender scene only).

**Interfaces:**
- Produces: one new object named `Deck_Window` (mesh, replacing the 6 `Deck_Window_0..5` objects), plus repositioned `Deck_Mullion_0..6`. Later tasks don't depend on this object's exact name, but Task 4 (the glass overlay) is positioned relative to the same curvature formula introduced here.

- [ ] **Step 1: Verify the window's current footprint matches this plan's assumptions**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Re-verifying the window panes' bounding boxes before rebuilding them as a curved surface, to confirm the plan's assumed footprint is still accurate."` and this code:

```python
import bpy

for name in ['Deck_Window_0', 'Deck_Window_2', 'Deck_Window_5']:
    obj = bpy.data.objects[name]
    bbox = [obj.matrix_world @ v.co for v in obj.data.vertices]
    xs = [v.x for v in bbox]; ys = [v.y for v in bbox]; zs = [v.z for v in bbox]
    print(f"{name}: X[{min(xs):.3f},{max(xs):.3f}] Y[{min(ys):.3f},{max(ys):.3f}] Z[{min(zs):.3f},{max(zs):.3f}] mat={obj.data.materials[0].name if obj.data.materials else None}")
```

Expected (allow ±0.05 drift): `Deck_Window_2` (center pane) reaches Z≈1.825 at its top and Y≈2.076 at its deepest point; `Deck_Window_0`/`5` (outer panes) reach only Z≈1.13 at the top. Material is `Viewport_Glass` on all three. If these differ substantially, stop and report — the formula in Step 2 is derived from these measurements.

- [ ] **Step 2: Build the new curved window mesh**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Building a single smooth curved-glass mesh to replace the 6 flat window facets, using a cylindrical-arc formula with a dome-like vertical taper derived from the existing facets' measured proportions."` and this code:

```python
import bpy, bmesh, math

HALF_ANGLE_DEG = 50.8   # matches the existing facets' total arc
RADIUS = 3.2            # derived from existing facets: half_width(2.48)/sin(50.8deg) ~= 3.2,
                        # and sagitta at that radius (~1.18) matches the measured depth (~1.13) closely
Y_APEX = 1.949          # matches Deck_Window_2's deepest Y (the old center pane)
Z_BOTTOM = -0.15        # matches the near-constant bottom edge across all old panes
Z_TOP_CENTER = 1.825    # matches Deck_Window_2's top Z
Z_TOP_EDGE = 1.126      # matches Deck_Window_0/5's top Z
SEGMENTS = 16

half_angle = math.radians(HALF_ANGLE_DEG)

mesh = bpy.data.meshes.new('Deck_Window')
obj = bpy.data.objects.new('Deck_Window', mesh)
bpy.context.collection.objects.link(obj)

bm = bmesh.new()
bottom_verts, top_verts = [], []
for i in range(SEGMENTS + 1):
    t = -half_angle + (2 * half_angle) * i / SEGMENTS
    x = RADIUS * math.sin(t)
    y = Y_APEX - RADIUS * (1 - math.cos(t))
    taper = (1 - math.cos(t)) / (1 - math.cos(half_angle))  # 0 at center, 1 at the edges
    z_top = Z_TOP_CENTER - (Z_TOP_CENTER - Z_TOP_EDGE) * taper
    bottom_verts.append(bm.verts.new((x, y, Z_BOTTOM)))
    top_verts.append(bm.verts.new((x, y, z_top)))

uv_layer = bm.loops.layers.uv.new('UVMap')
for i in range(SEGMENTS):
    face = bm.faces.new((bottom_verts[i], bottom_verts[i + 1], top_verts[i + 1], top_verts[i]))
    u0, u1 = i / SEGMENTS, (i + 1) / SEGMENTS
    face.loops[0][uv_layer].uv = (u0, 0)
    face.loops[1][uv_layer].uv = (u1, 0)
    face.loops[2][uv_layer].uv = (u1, 1)
    face.loops[3][uv_layer].uv = (u0, 1)

bm.normal_update()
bm.to_mesh(mesh)
bm.free()
for poly in mesh.polygons:
    poly.use_smooth = True

old_pane = bpy.data.objects.get('Deck_Window_2')
if old_pane and old_pane.data.materials:
    obj.data.materials.append(old_pane.data.materials[0])

print("Built Deck_Window: verts", len(mesh.vertices), "polys", len(mesh.polygons), "material", obj.data.materials[0].name if obj.data.materials else None)
```

Expected: `Built Deck_Window: verts 34 polys 16 material Viewport_Glass`.

- [ ] **Step 3: Verify the new mesh's footprint matches the old one, then delete the 6 old panes**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the new curved window's bounding box matches the old faceted window's overall footprint before deleting the old panes."` and this code:

```python
import bpy

new_obj = bpy.data.objects['Deck_Window']
bbox = [new_obj.matrix_world @ v.co for v in new_obj.data.vertices]
xs = [v.x for v in bbox]; ys = [v.y for v in bbox]; zs = [v.z for v in bbox]
print(f"Deck_Window (new): X[{min(xs):.3f},{max(xs):.3f}] Y[{min(ys):.3f},{max(ys):.3f}] Z[{min(zs):.3f},{max(zs):.3f}]")

assert abs(min(xs) - (-2.48)) < 0.1, f"X min drifted: {min(xs)}"
assert abs(max(xs) - 2.48) < 0.1, f"X max drifted: {max(xs)}"
assert abs(min(ys) - 0.77) < 0.15, f"Y min (edge depth) drifted: {min(ys)}"
assert abs(max(zs) - 1.825) < 0.05, f"Z max (center height) drifted: {max(zs)}"
print("Footprint matches the old faceted window within tolerance.")

for i in range(6):
    old = bpy.data.objects.get(f'Deck_Window_{i}')
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
print("Removed the 6 old flat window panes.")
```

Expected: the assertions pass, then `Removed the 6 old flat window panes.` If an assertion fails, stop and report rather than adjusting the tolerance to force a pass.

- [ ] **Step 4: Reposition the 7 mullions to lie against the new curve**

The mullions are now purely decorative structural ribs (the hard pane seams they used to mark no longer exist as geometry boundaries) — evenly distribute them across the same arc, oriented to match the curve's local tangent at each point.

Call `mcp__blender__execute_blender_code` with `user_prompt: "Repositioning the 7 window mullions to sit evenly against the new curved window surface, oriented to match the curve's tangent at each point, since they no longer mark real pane-to-pane seams."` and this code:

```python
import bpy, math

RADIUS = 3.2
Y_APEX = 1.949
HALF_ANGLE_DEG = 50.8
half_angle = math.radians(HALF_ANGLE_DEG)
N = 7

for i in range(N):
    t = -half_angle + (2 * half_angle) * i / (N - 1)
    x = RADIUS * math.sin(t)
    y = Y_APEX - RADIUS * (1 - math.cos(t))
    obj = bpy.data.objects.get(f'Deck_Mullion_{i}')
    if not obj:
        print(f"Deck_Mullion_{i}: MISSING")
        continue
    z = obj.location.z  # keep each mullion's existing height placement
    obj.location = (x, y, z)
    obj.rotation_euler = (obj.rotation_euler.x, obj.rotation_euler.y, t)
    print(f"Deck_Mullion_{i}: repositioned to {math.degrees(t):.1f} deg, loc=({x:.3f},{y:.3f},{z:.3f})")
```

Expected: 7 lines of repositioning output, no `MISSING` entries.

- [ ] **Step 5: Visual check and no commit yet**

Call `mcp__blender__get_viewport_screenshot` with `user_prompt: "Visual check of the new curved window and repositioned mullions before moving to the next task."` — if it's stale/unchanged from a prior screenshot, that's the known tooling issue; the Step 3 bounding-box assertions are the authoritative check. No commit yet — Task 5 saves and commits everything at the end.

---

### Task 2: Curve the 4 existing HUD panels in place

**Files:** None (Blender scene only).

**Interfaces:**
- Consumes: nothing from Task 1 (independent geometry).
- Produces: `HUD_Timeline`, `HUD_Constellation`, `HUD_Journal`, `HUD_System` keep their existing names/locations/rotations; only `.data` (the mesh) changes.

- [ ] **Step 1: Verify current panel dimensions**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Re-verifying the 4 HUD panels' current dimensions before curving them, to confirm the plan's assumptions are still accurate."` and this code:

```python
import bpy

for name in ['HUD_Timeline', 'HUD_Constellation', 'HUD_Journal', 'HUD_System']:
    obj = bpy.data.objects[name]
    print(f"{name}: dims={tuple(round(d, 3) for d in obj.dimensions)} loc={tuple(round(v, 3) for v in obj.location)}")
```

Expected (allow ±0.05 drift): `HUD_Timeline` dims ≈ `(1.8, 0.42, 0.0)`, `HUD_Constellation` ≈ `(1.2, 1.0, 0.0)`, `HUD_Journal` ≈ `(1.2, 0.8, 0.0)`, `HUD_System` ≈ `(1.2, 0.6, 0.0)`. If these differ substantially, stop and report before proceeding — the curving function below reads `obj.dimensions` live, so it self-adapts to small drift, but a large difference means something else changed.

- [ ] **Step 2: Curve all 4 panels**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Curving the 4 HUD panels in place, replacing each flat plane mesh with a moderately curved one of the same width/height, preserving position, rotation, and material."` and this code:

```python
import bpy, bmesh, math

def curve_panel_mesh(obj_name, sagitta_ratio=0.08):
    obj = bpy.data.objects[obj_name]
    width = obj.dimensions.x
    height = obj.dimensions.z if obj.dimensions.z > 0.001 else obj.dimensions.y
    half_width = width / 2
    sagitta = half_width * sagitta_ratio
    R = (half_width ** 2 + sagitta ** 2) / (2 * sagitta)
    half_angle = math.asin(min(half_width / R, 1.0))

    SEGMENTS = 12
    mesh = bpy.data.meshes.new(obj_name + '_curved')
    bm = bmesh.new()
    bottom_verts, top_verts = [], []
    for i in range(SEGMENTS + 1):
        t = -half_angle + (2 * half_angle) * i / SEGMENTS
        x = R * math.sin(t)
        y = -(R * (1 - math.cos(t)))
        bottom_verts.append(bm.verts.new((x, y, -height / 2)))
        top_verts.append(bm.verts.new((x, y, height / 2)))
    uv_layer = bm.loops.layers.uv.new('UVMap')
    for i in range(SEGMENTS):
        face = bm.faces.new((bottom_verts[i], bottom_verts[i + 1], top_verts[i + 1], top_verts[i]))
        u0, u1 = i / SEGMENTS, (i + 1) / SEGMENTS
        face.loops[0][uv_layer].uv = (u0, 0)
        face.loops[1][uv_layer].uv = (u1, 0)
        face.loops[2][uv_layer].uv = (u1, 1)
        face.loops[3][uv_layer].uv = (u0, 1)
    bm.normal_update()

    old_materials = list(obj.data.materials)
    old_mesh = obj.data
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    for mat in old_materials:
        mesh.materials.append(mat)

    obj.data = mesh
    bpy.data.meshes.remove(old_mesh)
    return obj

for name in ['HUD_Timeline', 'HUD_Constellation', 'HUD_Journal', 'HUD_System']:
    result = curve_panel_mesh(name)
    print(f"Curved {name}: verts={len(result.data.vertices)} polys={len(result.data.polygons)}")
```

Expected: 4 lines, each `verts=26 polys=12`.

- [ ] **Step 3: Verify object transforms are unchanged and UV layer exists**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the 4 curved HUD panels kept their original world positions and have a valid UV layer, so runtime canvas textures will still map correctly."` and this code:

```python
import bpy

expected_locs = {
    'HUD_Timeline': (-1.3, 1.88, 1.0),
    'HUD_Constellation': (1.3, 1.88, 0.65),
    'HUD_Journal': (-1.3, 1.88, -0.25),
    'HUD_System': (1.3, 1.88, -0.25),
}
for name, expected in expected_locs.items():
    obj = bpy.data.objects[name]
    actual = tuple(round(v, 3) for v in obj.location)
    assert all(abs(a - e) < 0.01 for a, e in zip(actual, expected)), f"{name} location changed: {actual} vs expected {expected}"
    assert obj.data.uv_layers, f"{name} has no UV layer"
    print(f"{name}: location unchanged ({actual}), UV layer present")

print("All 4 panels verified.")
```

Expected: 4 confirmation lines plus `All 4 panels verified.`, no `AssertionError`.

- [ ] **Step 4: No commit yet** (Task 5 saves and commits everything).

---

### Task 3: Add the nav strip on `Deck_Beam`

**Files:** None (Blender scene only).

**Interfaces:**
- Produces: one new object `HUD_Nav` — a placeholder-material curved strip. No draw function or content wiring (out of scope; a future session adds the canvas-texture content, following the exact pattern the other 4 `HUD_*` panels already use).

- [ ] **Step 1: Verify `Deck_Beam`'s current position**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Re-verifying Deck_Beam's bounding box before mounting the new nav strip on it."` and this code:

```python
import bpy

obj = bpy.data.objects['Deck_Beam']
bbox = [obj.matrix_world @ v.co for v in obj.data.vertices]
xs = [v.x for v in bbox]; ys = [v.y for v in bbox]; zs = [v.z for v in bbox]
print(f"Deck_Beam: X[{min(xs):.3f},{max(xs):.3f}] Y[{min(ys):.3f},{max(ys):.3f}] Z[{min(zs):.3f},{max(zs):.3f}] mat={obj.data.materials[0].name if obj.data.materials else None}")
```

Expected (allow ±0.05 drift): X[-2.5,2.5] Y[0.8,1.2] Z[1.395,1.645], material `Hull_Dark_Painted`.

- [ ] **Step 2: Build the nav strip**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Building the new curved nav strip mounted on the underside of Deck_Beam, following the same UV-mapped-plane pattern as the other HUD panels."` and this code:

```python
import bpy, bmesh, math

WIDTH = 4.0
HEIGHT = 0.28
SAGITTA_RATIO = 0.08
half_width = WIDTH / 2
sagitta = half_width * SAGITTA_RATIO
R = (half_width ** 2 + sagitta ** 2) / (2 * sagitta)
half_angle = math.asin(min(half_width / R, 1.0))
SEGMENTS = 14

mesh = bpy.data.meshes.new('HUD_Nav')
obj = bpy.data.objects.new('HUD_Nav', mesh)
bpy.context.collection.objects.link(obj)

bm = bmesh.new()
bottom_verts, top_verts = [], []
for i in range(SEGMENTS + 1):
    t = -half_angle + (2 * half_angle) * i / SEGMENTS
    x = R * math.sin(t)
    y = -(R * (1 - math.cos(t)))
    bottom_verts.append(bm.verts.new((x, y, -HEIGHT / 2)))
    top_verts.append(bm.verts.new((x, y, HEIGHT / 2)))
uv_layer = bm.loops.layers.uv.new('UVMap')
for i in range(SEGMENTS):
    face = bm.faces.new((bottom_verts[i], bottom_verts[i + 1], top_verts[i + 1], top_verts[i]))
    u0, u1 = i / SEGMENTS, (i + 1) / SEGMENTS
    face.loops[0][uv_layer].uv = (u0, 0)
    face.loops[1][uv_layer].uv = (u1, 0)
    face.loops[2][uv_layer].uv = (u1, 1)
    face.loops[3][uv_layer].uv = (u0, 1)
bm.normal_update()
bm.to_mesh(mesh)
bm.free()
for poly in mesh.polygons:
    poly.use_smooth = True

beam = bpy.data.objects.get('Deck_Beam')
if beam and beam.data.materials:
    obj.data.materials.append(beam.data.materials[0])

# Mount on the beam's underside (Z=1.395, its viewer-facing bottom edge), facing down and toward the viewer.
obj.location = (0.0, 0.95, 1.35)
obj.rotation_euler = (math.radians(100), 0.0, 0.0)  # tilt so the curved face angles down toward the seat

print("Built HUD_Nav: verts", len(mesh.vertices), "polys", len(mesh.polygons), "loc", tuple(round(v,3) for v in obj.location))
```

Expected: `Built HUD_Nav: verts 30 polys 14 loc (0.0, 0.95, 1.35)`.

- [ ] **Step 3: Verify no collision with `Deck_Beam` or the window**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the new nav strip doesn't clip into Deck_Beam or the curved window."` and this code:

```python
import bpy

def world_bbox(name):
    obj = bpy.data.objects[name]
    bbox = [obj.matrix_world @ v.co for v in obj.data.vertices]
    xs = [v.x for v in bbox]; ys = [v.y for v in bbox]; zs = [v.z for v in bbox]
    return (min(xs), max(xs)), (min(ys), max(ys)), (min(zs), max(zs))

nav_x, nav_y, nav_z = world_bbox('HUD_Nav')
beam_x, beam_y, beam_z = world_bbox('Deck_Beam')
window_x, window_y, window_z = world_bbox('Deck_Window')

print(f"HUD_Nav: X{nav_x} Y{nav_y} Z{nav_z}")
print(f"Deck_Beam: X{beam_x} Y{beam_y} Z{beam_z}")
print(f"Deck_Window: X{window_x} Y{window_y} Z{window_z}")

assert nav_x[0] > beam_x[0] and nav_x[1] < beam_x[1], "Nav strip extends past Deck_Beam's width"
assert nav_z[1] <= beam_z[0] + 0.05, f"Nav strip (top Z {nav_z[1]:.3f}) overlaps Deck_Beam (bottom Z {beam_z[0]:.3f})"
print("No collision with Deck_Beam. Check the printed bounds above against Deck_Window by eye -- they're in different Z ranges (nav ~1.2-1.5, window up to 1.825) so no automatic check is needed, but confirm visually in Step 4.")
```

Expected: the two assertions pass, followed by the printed note. If either fails, adjust `HUD_Nav`'s `location`/`HEIGHT` in Step 2 and re-run — this is exactly the kind of parameter a first attempt may need to tune, per the design spec's note that curved-surface placement benefits from iteration.

- [ ] **Step 4: Visual check, no commit yet**

Call `mcp__blender__get_viewport_screenshot` with `user_prompt: "Visual check of the new nav strip's placement under the overhead beam."` — same known-stale-screenshot caveat as Task 1 applies; the Step 3 checks are authoritative.

---

### Task 4: Add the window-glass identity overlay

**Files:** None (Blender scene only).

**Interfaces:**
- Consumes: the exact curvature formula from Task 1 (`RADIUS = 3.2`, `Y_APEX = 1.949`, `HALF_ANGLE_DEG = 50.8`), reused here at a slightly smaller radius so the overlay sits just inside the glass without z-fighting.
- Produces: one new object `Deck_WindowOverlay` — a placeholder-material curved plane. No baked text (future session's job, same as `HUD_Nav`).

- [ ] **Step 1: Build the overlay plane**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Building a transparent overlay plane just inside the curved window glass, using the same curvature formula at a slightly smaller radius to avoid z-fighting, for future identity-content projection."` and this code:

```python
import bpy, bmesh, math

HALF_ANGLE_DEG = 50.8
RADIUS = 3.15  # 0.05 less than Deck_Window's 3.2, so this sits just inside the glass
Y_APEX = 1.949
Z_BOTTOM = 0.2   # narrower vertical range than the full window -- just the upper-center area
                 # where the reference image's title/name text sits, not the whole glass
Z_TOP = 1.5
SEGMENTS = 16

half_angle = math.radians(HALF_ANGLE_DEG)

mesh = bpy.data.meshes.new('Deck_WindowOverlay')
obj = bpy.data.objects.new('Deck_WindowOverlay', mesh)
bpy.context.collection.objects.link(obj)

bm = bmesh.new()
bottom_verts, top_verts = [], []
for i in range(SEGMENTS + 1):
    t = -half_angle + (2 * half_angle) * i / SEGMENTS
    x = RADIUS * math.sin(t)
    y = Y_APEX - RADIUS * (1 - math.cos(t))
    bottom_verts.append(bm.verts.new((x, y, Z_BOTTOM)))
    top_verts.append(bm.verts.new((x, y, Z_TOP)))
uv_layer = bm.loops.layers.uv.new('UVMap')
for i in range(SEGMENTS):
    face = bm.faces.new((bottom_verts[i], bottom_verts[i + 1], top_verts[i + 1], top_verts[i]))
    u0, u1 = i / SEGMENTS, (i + 1) / SEGMENTS
    face.loops[0][uv_layer].uv = (u0, 0)
    face.loops[1][uv_layer].uv = (u1, 0)
    face.loops[2][uv_layer].uv = (u1, 1)
    face.loops[3][uv_layer].uv = (u0, 1)
bm.normal_update()
bm.to_mesh(mesh)
bm.free()
for poly in mesh.polygons:
    poly.use_smooth = True

print("Built Deck_WindowOverlay: verts", len(mesh.vertices), "polys", len(mesh.polygons))
```

Expected: `Built Deck_WindowOverlay: verts 34 polys 16`.

- [ ] **Step 2: Verify it sits inside the glass with no collision**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the identity overlay sits just inside the curved window glass across its full width, with no part poking through."` and this code:

```python
import bpy

def world_bbox(name):
    obj = bpy.data.objects[name]
    bbox = [obj.matrix_world @ v.co for v in obj.data.vertices]
    xs = [v.x for v in bbox]; ys = [v.y for v in bbox]; zs = [v.z for v in bbox]
    return (min(xs), max(xs)), (min(ys), max(ys)), (min(zs), max(zs))

overlay_x, overlay_y, overlay_z = world_bbox('Deck_WindowOverlay')
window_x, window_y, window_z = world_bbox('Deck_Window')

print(f"Deck_WindowOverlay: X{overlay_x} Y{overlay_y} Z{overlay_z}")
print(f"Deck_Window: X{window_x} Y{window_y} Z{window_z}")

assert overlay_y[1] <= window_y[1], f"Overlay (max Y {overlay_y[1]:.3f}) pokes through the glass (max Y {window_y[1]:.3f})"
assert overlay_z[0] >= window_z[0] and overlay_z[1] <= window_z[1], "Overlay Z range extends outside the window's Z range"
print("Overlay sits inside the glass, no collision.")
```

Expected: `Overlay sits inside the glass, no collision.` with no `AssertionError`. If it fails, this is exactly the kind of placement a curved-surface build may need one iteration on — adjust `Z_BOTTOM`/`Z_TOP`/`RADIUS` in Step 1 and re-run, rather than forcing the assertion to pass.

- [ ] **Step 3: Visual check, no commit yet**

Call `mcp__blender__get_viewport_screenshot` with `user_prompt: "Visual check of the identity overlay's position relative to the window and the black hole view behind it."` — same known-stale-screenshot caveat applies; Step 2's checks are authoritative.

---

### Task 5: Save and commit

**Files:**
- Modify (binary): `worldline-lab/shared/assets/wlv01.blend`, `worldline-lab/shared/assets/wlv01.blend1`

**Interfaces:**
- Consumes: all geometry from Tasks 1–4.
- Produces: nothing — terminal task.

- [ ] **Step 1: Final full-scene object count check**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Final check of the full scene object count before saving -- confirming Deck_Window_0..5 are gone, Deck_Window/HUD_Nav/Deck_WindowOverlay exist, and the 4 HUD panels are still present."` and this code:

```python
import bpy

for i in range(6):
    assert bpy.data.objects.get(f'Deck_Window_{i}') is None, f"Deck_Window_{i} should have been deleted in Task 1"

for name in ['Deck_Window', 'HUD_Nav', 'Deck_WindowOverlay', 'HUD_Timeline', 'HUD_Constellation', 'HUD_Journal', 'HUD_System']:
    assert bpy.data.objects.get(name) is not None, f"MISSING: {name}"

print("Object count:", len(bpy.data.objects))
print("All expected objects present, old window panes removed.")
```

Expected: no `AssertionError` — the `assert` statements are the real check. The printed object
count is informational only (it will be 125 from the prior session, minus 6 removed
`Deck_Window_*` panes, plus 3 new objects — but treat the asserts above as authoritative if the
arithmetic ever seems to disagree).

- [ ] **Step 2: Save the Blender file**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Saving the Blender file now that the curved window, curved HUD panels, and two new placeholder screens are built and verified."` and this code:

```python
import bpy
bpy.ops.wm.save_as_mainfile(filepath=r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\wlv01.blend")
print("Saved:", bpy.data.filepath, "| object count:", len(bpy.data.objects))
```

Expected: prints the target path with no error.

- [ ] **Step 3: Commit**

```bash
git add worldline-lab/shared/assets/wlv01.blend worldline-lab/shared/assets/wlv01.blend1
git status --short
git commit -m "$(cat <<'EOF'
feat: curve cockpit window + HUD panels, add nav strip and window overlay

Replaces the 6-facet flat window with one smooth curved surface
(cylindrical arc + dome-like vertical taper, matching the old facets'
measured proportions), curves the 4 existing HUD panels in place
(moderate curved-monitor style), and adds two new placeholder screen
objects: HUD_Nav (mounted on Deck_Beam, since Deck_Dash has no room
left) and Deck_WindowOverlay (sits just inside the glass, for future
identity-content projection).

Model-only -- no export, no engine wiring, no canvas-texture content
wired yet (both new screens follow the existing HUD_* pattern: a
UV-mapped mesh, actual pixels drawn at runtime in a future session).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

Expected: `git status --short` (run before the commit) shows only the two `.blend`/`.blend1` files — if anything else shows as modified, stop and investigate before committing.

---

## Post-plan state

The pending-items report should note the window/HUD-panel curvature and the two new placeholder
screens as built (not part of this plan's scope — a documentation follow-up). Wiring
`HUD_Nav`/`Deck_WindowOverlay`'s actual content (nav links, identity text) and exporting/wiring
all of this into the engines remains open, matching the same phased pattern already used for the
exterior vessel (model → export/wire as separate sessions).
