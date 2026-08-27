# WLV-01 Procedural PBR Materials + Bevels + Compression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4 highest-impact flat materials (`Hull_Mid_Painted`, `Hull_Dark_Painted`, `Trim_Brushed_Aluminum`, `Viewport_Glass`) with procedurally-detailed PBR materials baked to textures, add bevels to hard-surface geometry, and ship a compressed GLB.

**Architecture:** All work happens through `mcp__blender__execute_blender_code` (bpy Python) against the live Blender session. Procedural shader-node graphs are built first and verified visually, then baked to 2048×2048 image textures (glTF cannot carry a live node graph — this step is mandatory, not optional), then exported and compressed via `@gltf-transform/cli`.

**Tech Stack:** Blender 5.2.0 LTS `bpy`/`bmesh` Python API via the Blender MCP bridge; `@gltf-transform/cli` v4.4.2+ (run via `npx --yes @gltf-transform/cli`, confirmed working this session) for GLB compression.

## Global Constraints

- **Model-only for Tasks 1–5.** No changes to any TypeScript/Angular file. Tasks 6–7 touch only the exported `.glb` binary assets, not engine code.
- **Verified Blender version: 5.2.0 LTS.** Principled BSDF socket names in this version:
  `Base Color`, `Metallic`, `Roughness`, `IOR`, `Normal`, `Transmission Weight` (NOT
  `Transmission`), `Specular IOR Level` (NOT `Specular`). Do not use older-version socket names
  from memory — they will raise `KeyError`.
- **`ShaderNodeMix` has multiple same-named sockets per data type; index by position, not by
  name.** Verified this session for `data_type='RGBA'`: inputs `[0]`=Factor(float, enabled),
  `[6]`=A(color, enabled), `[7]`=B(color, enabled); output `[2]`=Result(color, enabled). For
  `data_type='FLOAT'`: inputs `[0]`=Factor, `[2]`=A, `[3]`=B; output `[0]`=Result. Using
  `mix.inputs['A']` will silently grab the wrong (disabled) socket — always use the verified
  indices above.
- **Existing tuned base values to preserve** (verified this session, don't replace with
  arbitrary new numbers):
  - `Hull_Mid_Painted`: Base Color `(0.165, 0.180, 0.220, 1.0)`, Metallic `0.12`, Roughness `0.42`
  - `Hull_Dark_Painted`: Base Color `(0.078, 0.086, 0.110, 1.0)`, Metallic `0.10`, Roughness `0.50`
  - `Trim_Brushed_Aluminum`: Base Color `(0.545, 0.573, 0.596, 1.0)`, Metallic `1.0`, Roughness `0.34`
  - `Viewport_Glass`: Transmission Weight `1.0`, IOR `1.5`, Roughness `0.04`
- Bevel scope: objects using `Hull_Mid_Painted`, `Hull_Dark_Painted`, or `Trim_Brushed_Aluminum`
  only — not `Viewport_Glass`, not emissive display materials.
- Every `mcp__blender__*` tool call requires a `user_prompt` argument.
- This live session's `bpy.data.filepath` should be bound to `wlv01.blend` — use
  `bpy.ops.wm.save_as_mainfile(filepath=...)` for saves, never `save_mainfile()` with no bound
  path, and never open/reload the file to "fix" a save error (discards in-memory work).
- `get_viewport_screenshot` has been inconsistent this session (sometimes fresh, sometimes
  stale). For this plan specifically, prefer `bpy.ops.render.render(write_still=True)` with a
  file output for checking material appearance — an actual render is more reliable evidence of
  what a material looks like than a viewport screenshot, and material work needs this more than
  any prior task this session.
- Material tuning is inherently iterative. Every task below includes a render-and-adjust loop.
  Budget for 2–3 iterations per material as normal, not a sign something is wrong.

---

### Task 1: Add bevels to hard-surface objects

**Files:** None (Blender scene only).

**Interfaces:** Produces: a `Bevel` modifier on every object using the 3 hard-surface hero
materials. No later task depends on the modifier's exact parameters.

- [ ] **Step 1: Add the bevel modifier**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Adding a bevel modifier to every hard-surface object using the 3 hero materials, so edges catch light realistically instead of being perfectly sharp."` and this code:

```python
import bpy

HERO_HARD_SURFACE_MATS = {'Hull_Mid_Painted', 'Hull_Dark_Painted', 'Trim_Brushed_Aluminum'}

targets = []
for obj in bpy.data.objects:
    if obj.type != 'MESH' or not obj.data.materials:
        continue
    mat_names = {m.name for m in obj.data.materials if m}
    if mat_names & HERO_HARD_SURFACE_MATS:
        targets.append(obj)

count = 0
for obj in targets:
    if any(m.type == 'BEVEL' for m in obj.modifiers):
        continue  # already has one, skip
    bevel = obj.modifiers.new(name='Bevel', type='BEVEL')
    bevel.width = 0.004
    bevel.segments = 2
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = 0.523599  # 30 degrees in radians
    count += 1

print(f"Added bevel modifier to {count} of {len(targets)} matching objects (rest already had one).")
```

Expected: prints a count. Given the material inventory checked this session (35 + 17 + 44
object-material assignments, with overlap since some objects use multiple materials), expect
roughly 60–90 unique objects.

- [ ] **Step 2: Verify no unexpected side effects**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the bevel modifiers didn't change any object's overall bounding box significantly, since bevels should be a subtle edge treatment, not a silhouette change."` and this code:

```python
import bpy

# Spot-check 3 objects across different material groups — bevel should shrink/round
# corners by roughly the bevel width (0.004), not meaningfully change overall dimensions.
for name in ['Console_Interact', 'Hull_Rib3_L', 'Console_Btn_L_0_1']:
    obj = bpy.data.objects.get(name)
    if not obj:
        print(f"{name}: not found, skipping")
        continue
    has_bevel = any(m.type == 'BEVEL' for m in obj.modifiers)
    print(f"{name}: has_bevel={has_bevel} dimensions={tuple(round(d,4) for d in obj.dimensions)}")
```

Expected: `has_bevel=True` for all three (they all use one of the 3 hero materials), and
dimensions should look sane (not zero, not wildly different from what you'd expect for these
small objects — dimensions include the bevel's effect since it's a modifier, but a 0.004 bevel
on objects that are centimeters-to-meters in scale should not visibly distort proportions).

- [ ] **Step 3: Render a quick before/after comparison**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Rendering a quick still to visually confirm the bevels are having a visible, subtle effect."` and this code:

```python
import bpy
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 600
bpy.context.scene.render.filepath = "//bevel_check.png"
bpy.context.scene.camera = bpy.data.objects.get('Deck_Camera')
bpy.ops.render.render(write_still=True)
print("Rendered to:", bpy.path.abspath(bpy.context.scene.render.filepath))
```

Then call `mcp__blender__get_viewport_screenshot` as a secondary check (may or may not show the
actual render — note whichever tool actually shows the rendered result usefully). The bevel
effect is subtle by design (0.004m width) — don't expect a dramatic visual difference, just
confirm no errors occurred and the scene still renders.

- [ ] **Step 4: Save (no commit yet — Task 7 handles the final save+commit for this whole plan... actually each task should still checkpoint the .blend given how much work this is)**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Saving progress after the bevel pass."` and this code:

```python
import bpy
bpy.ops.wm.save_as_mainfile(filepath=r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\wlv01.blend")
print("Saved.")
```

No git commit yet — this plan commits once at the very end (Task 7), matching the pattern used
for all prior Blender-only plans this session (the `.blend` binary diff isn't meaningfully
reviewable per-task anyway).

---

### Task 2: Build procedural painted-hull materials (`Hull_Mid_Painted`, `Hull_Dark_Painted`)

**Files:** None (Blender scene only).

**Interfaces:** Consumes: the verified base color/metallic/roughness values from Global
Constraints. Produces: both materials' node trees gain a procedural chain feeding Base Color,
Roughness, Metallic, and Normal — Task 5 (baking) consumes these node trees as its bake source.

- [ ] **Step 1: Build the shared recipe function and apply to both materials**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Building procedural PBR node graphs for the two painted-hull materials: subtle base-color variation plus edge-wear (chipped paint revealing bare metal at convex corners), driven by the Geometry node's Pointiness output."` and this code:

```python
import bpy

def build_painted_hull_material(mat_name, base_color, base_metallic, base_roughness):
    mat = bpy.data.materials[mat_name]
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')

    bare_metal_color = (0.62, 0.64, 0.66, 1.0)
    bare_metal_roughness = 0.28
    bare_metal_metallic = 0.85

    # --- Edge-wear mask from surface pointiness ---
    geo = nodes.new('ShaderNodeNewGeometry')
    geo.location = (-1200, 300)
    edge_ramp = nodes.new('ShaderNodeValToRGB')
    edge_ramp.name = 'EdgeWearRamp'
    edge_ramp.location = (-1000, 300)
    edge_ramp.color_ramp.elements[0].position = 0.45
    edge_ramp.color_ramp.elements[1].position = 0.65
    links.new(geo.outputs['Pointiness'], edge_ramp.inputs['Factor'])

    # --- Subtle low-frequency base-color variation ---
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-1200, 0)
    noise.inputs['Scale'].default_value = 3.0
    noise.inputs['Detail'].default_value = 2.0
    noise_ramp = nodes.new('ShaderNodeValToRGB')
    noise_ramp.location = (-1000, 0)
    noise_ramp.color_ramp.elements[0].position = 0.4
    noise_ramp.color_ramp.elements[1].position = 0.6
    links.new(noise.outputs['Fac'], noise_ramp.inputs['Factor'])

    # Base color: mix a slightly lighter variant in via noise (RGBA Mix: in[0]=Factor, in[6]=A, in[7]=B, out[2]=Result)
    variant_color = tuple(min(1.0, c * 1.15) if i < 3 else c for i, c in enumerate(base_color))
    color_variation_mix = nodes.new('ShaderNodeMix')
    color_variation_mix.data_type = 'RGBA'
    color_variation_mix.name = 'ColorVariationMix'
    color_variation_mix.location = (-700, 100)
    color_variation_mix.inputs[0].default_value = 0.08
    color_variation_mix.inputs[6].default_value = base_color
    color_variation_mix.inputs[7].default_value = variant_color
    links.new(noise_ramp.outputs['Color'], color_variation_mix.inputs[0])

    # Base color: then mix toward bare metal at edges
    edge_color_mix = nodes.new('ShaderNodeMix')
    edge_color_mix.data_type = 'RGBA'
    edge_color_mix.name = 'EdgeColorMix'
    edge_color_mix.location = (-400, 100)
    edge_color_mix.inputs[7].default_value = bare_metal_color
    links.new(edge_ramp.outputs['Color'], edge_color_mix.inputs[0])
    links.new(color_variation_mix.outputs[2], edge_color_mix.inputs[6])
    links.new(edge_color_mix.outputs[2], bsdf.inputs['Base Color'])

    # Roughness: mix toward bare-metal roughness at edges (FLOAT Mix: in[0]=Factor, in[2]=A, in[3]=B, out[0]=Result)
    rough_mix = nodes.new('ShaderNodeMix')
    rough_mix.data_type = 'FLOAT'
    rough_mix.name = 'RoughnessEdgeMix'
    rough_mix.location = (-400, -150)
    rough_mix.inputs[2].default_value = base_roughness
    rough_mix.inputs[3].default_value = bare_metal_roughness
    links.new(edge_ramp.outputs['Color'], rough_mix.inputs[0])
    links.new(rough_mix.outputs[0], bsdf.inputs['Roughness'])

    # Metallic: mix toward bare-metal metallic at edges
    metal_mix = nodes.new('ShaderNodeMix')
    metal_mix.data_type = 'FLOAT'
    metal_mix.name = 'MetallicEdgeMix'
    metal_mix.location = (-400, -350)
    metal_mix.inputs[2].default_value = base_metallic
    metal_mix.inputs[3].default_value = bare_metal_metallic
    links.new(edge_ramp.outputs['Color'], metal_mix.inputs[0])
    links.new(metal_mix.outputs[0], bsdf.inputs['Metallic'])

    # Normal: subtle bump from the same noise texture (fine orange-peel-paint texture)
    bump = nodes.new('ShaderNodeBump')
    bump.name = 'SurfaceBump'
    bump.location = (-400, -550)
    bump.inputs['Strength'].default_value = 0.15
    bump.inputs['Distance'].default_value = 0.02
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

    return mat

build_painted_hull_material('Hull_Mid_Painted', (0.165, 0.180, 0.220, 1.0), 0.12, 0.42)
build_painted_hull_material('Hull_Dark_Painted', (0.078, 0.086, 0.110, 1.0), 0.10, 0.50)
print("Built procedural node graphs for both painted-hull materials.")
```

Expected: prints the confirmation with no error. If a `KeyError` occurs on a socket name, do not
guess a fix — call `[s.name for s in <node>.inputs]` on the failing node to see its actual
sockets in this Blender version, then correct the name and retry.

- [ ] **Step 2: Verify the node graph is fully connected**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the new procedural nodes are actually linked into the Principled BSDF, not just created and left disconnected."` and this code:

```python
import bpy

for mat_name in ['Hull_Mid_Painted', 'Hull_Dark_Painted']:
    mat = bpy.data.materials[mat_name]
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    for socket_name in ['Base Color', 'Roughness', 'Metallic', 'Normal']:
        inp = bsdf.inputs[socket_name]
        assert inp.is_linked, f"{mat_name}: {socket_name} is not linked to anything"
    print(f"{mat_name}: Base Color, Roughness, Metallic, and Normal are all linked.")
```

Expected: 2 confirmation lines, no `AssertionError`.

- [ ] **Step 3: Render and visually check, iterate if needed**

Render via the same pattern as Task 1 Step 3, framing a close-up of a hull surface (e.g. move
`Deck_Camera` temporarily, or just render the existing view and inspect a hull panel within it).
Confirm: the edge-wear effect is visible at convex corners but restrained (not looking heavily
damaged/weathered — this should read as "clean modern hardware," matching the established
aesthetic), and base-color variation is subtle, not blotchy. If the effect is too strong or too
weak, adjust `color_variation_mix.inputs[0]` (currently 0.08), the `edge_ramp` color-ramp
positions (currently 0.45/0.65 — narrower gap = sharper edge transition), or `bump.inputs['Strength']`
(currently 0.15) and re-render. This is expected iteration, not a sign of failure.

- [ ] **Step 4: Save**

Same save pattern as Task 1 Step 4.

---

### Task 3: Build procedural `Trim_Brushed_Aluminum` material

**Files:** None (Blender scene only).

**Interfaces:** Consumes: verified base values from Global Constraints. Produces: node tree with
a bump-mapped anisotropic-looking streak pattern — Task 5 bakes this.

- [ ] **Step 1: Build the brushed-metal recipe**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Building a procedural brushed-aluminum material with directional streak micro-detail via a stretched wave texture feeding a bump map."` and this code:

```python
import bpy

mat = bpy.data.materials['Trim_Brushed_Aluminum']
nt = mat.node_tree
nodes = nt.nodes
links = nt.links
bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')

# Stretch the wave pattern along one axis to simulate directional brushing
mapping = nodes.new('ShaderNodeMapping')
mapping.location = (-1400, 0)
mapping.inputs['Scale'].default_value = (1.0, 40.0, 1.0)  # stretched heavily along Y

texcoord = nodes.new('ShaderNodeTexCoord')
texcoord.location = (-1600, 0)
links.new(texcoord.outputs['Object'], mapping.inputs['Vector'])

wave = nodes.new('ShaderNodeTexWave')
wave.location = (-1200, 0)
wave.inputs['Scale'].default_value = 80.0
wave.inputs['Distortion'].default_value = 0.5
links.new(mapping.outputs['Vector'], wave.inputs['Vector'])

bump = nodes.new('ShaderNodeBump')
bump.name = 'BrushedStreakBump'
bump.location = (-700, -200)
bump.inputs['Strength'].default_value = 0.08
bump.inputs['Distance'].default_value = 0.01
links.new(wave.outputs['Fac'], bump.inputs['Height'])
links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

# Subtle roughness variation using the same wave pattern (FLOAT Mix: in[0]=Factor, in[2]=A, in[3]=B, out[0]=Result)
rough_ramp = nodes.new('ShaderNodeValToRGB')
rough_ramp.location = (-1000, -400)
rough_ramp.color_ramp.elements[0].position = 0.3
rough_ramp.color_ramp.elements[1].position = 0.7
links.new(wave.outputs['Fac'], rough_ramp.inputs['Factor'])

rough_mix = nodes.new('ShaderNodeMix')
rough_mix.data_type = 'FLOAT'
rough_mix.name = 'RoughnessStreakMix'
rough_mix.location = (-700, -400)
rough_mix.inputs[2].default_value = 0.28
rough_mix.inputs[3].default_value = 0.40
links.new(rough_ramp.outputs['Color'], rough_mix.inputs[0])
links.new(rough_mix.outputs[0], bsdf.inputs['Roughness'])

print("Built procedural brushed-aluminum node graph.")
```

Expected: prints confirmation with no error.

- [ ] **Step 2: Verify linkage**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the brushed-aluminum material's Normal and Roughness inputs are linked to the new procedural chain."` and this code:

```python
import bpy
mat = bpy.data.materials['Trim_Brushed_Aluminum']
bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
assert bsdf.inputs['Normal'].is_linked, "Normal not linked"
assert bsdf.inputs['Roughness'].is_linked, "Roughness not linked"
print("Trim_Brushed_Aluminum: Normal and Roughness are linked.")
```

Expected: confirmation, no `AssertionError`.

- [ ] **Step 3: Render and visually check, iterate if needed**

Same render pattern as before, framing a console knob/toggle/button (these use
`Trim_Brushed_Aluminum` per the material inventory). Confirm the brushed-streak direction looks
intentional (not random noise) and isn't so strong it reads as scratched/damaged rather than
brushed. Adjust `mapping.inputs['Scale']`, `wave.inputs['Scale']`/`Distortion`, or
`bump.inputs['Strength']` and re-render as needed.

- [ ] **Step 4: Save**

Same save pattern as before.

---

### Task 4: Refine `Viewport_Glass`

**Files:** None (Blender scene only).

**Interfaces:** Consumes: verified `Viewport_Glass` values (Transmission Weight 1.0, IOR 1.5,
Roughness 0.04). Produces: a subtle normal/roughness imperfection — Task 5 bakes this (note:
Base Color and Metallic for glass don't need baking, since the "look" comes from
transmission/IOR, not a texture — only bake what's actually varying spatially).

- [ ] **Step 1: Add subtle imperfection**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Adding a very subtle procedural imperfection to the window glass material so it doesn't look artificially perfect."` and this code:

```python
import bpy

mat = bpy.data.materials['Viewport_Glass']
nt = mat.node_tree
nodes = nt.nodes
links = nt.links
bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')

noise = nodes.new('ShaderNodeTexNoise')
noise.location = (-800, 0)
noise.inputs['Scale'].default_value = 8.0
noise.inputs['Detail'].default_value = 3.0

bump = nodes.new('ShaderNodeBump')
bump.name = 'GlassImperfectionBump'
bump.location = (-400, 0)
bump.inputs['Strength'].default_value = 0.03  # very subtle -- this is glass, not textured metal
bump.inputs['Distance'].default_value = 0.005
links.new(noise.outputs['Fac'], bump.inputs['Height'])
links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

print("Added subtle glass imperfection.")
```

Expected: prints confirmation, no error.

- [ ] **Step 2: Verify and render**

Verify `bsdf.inputs['Normal'].is_linked` is `True` (same assertion pattern as prior tasks), then
render a view through the window. The effect should be nearly invisible at normal viewing
distance — if it's visibly distorting the black hole view behind the glass, reduce
`bump.inputs['Strength']` further (glass imperfection should be felt, not seen).

- [ ] **Step 3: Save**

Same save pattern as before.

---

### Task 5: Bake all 4 materials to textures and re-point for export

**Files:** None (Blender scene only).

**Interfaces:** Consumes: the procedural node graphs from Tasks 2–4. Produces: baked 2048×2048
images per material, and each material's Principled BSDF now reads from `ShaderNodeTexImage`
nodes instead of the live procedural chain (the procedural chain stays in the node tree,
disconnected, for future re-editing). Task 6 exports the result.

- [ ] **Step 1: Audit UVs on objects using the 4 hero materials**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Checking whether objects using the 4 hero materials have a UV layer suitable for baking -- baking requires non-overlapping UVs."` and this code:

```python
import bpy

HERO_MATS = {'Hull_Mid_Painted', 'Hull_Dark_Painted', 'Trim_Brushed_Aluminum', 'Viewport_Glass'}
no_uv = []
for obj in bpy.data.objects:
    if obj.type != 'MESH' or not obj.data.materials:
        continue
    mat_names = {m.name for m in obj.data.materials if m}
    if mat_names & HERO_MATS:
        if not obj.data.uv_layers:
            no_uv.append(obj.name)

print(f"{len(no_uv)} objects using hero materials have NO UV layer:", no_uv[:20])
```

Expected: prints a count. If any objects lack a UV layer, add one before baking:

```python
import bpy

for name in no_uv:  # reuse the list from the previous step, or re-run the check inline
    obj = bpy.data.objects[name]
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project()
    bpy.ops.object.mode_set(mode='OBJECT')
print(f"Added Smart UV Project to {len(no_uv)} objects.")
```

Only run this second block if the first block's count was greater than 0.

- [ ] **Step 2: Bake each material's maps**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Baking Base Color, Roughness, and Normal passes for each of the 4 hero materials to 2048x2048 images, then re-pointing each material's Principled BSDF to read from the baked images instead of the live procedural chain."` and this code:

```python
import bpy

bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 32
RES = 2048

def bake_and_repoint(mat_name, bake_normal=True, bake_roughness=True):
    mat = bpy.data.materials[mat_name]
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')

    objs = [o for o in bpy.data.objects if o.type == 'MESH' and o.data.materials
            and mat_name in [m.name for m in o.data.materials if m]]
    if not objs:
        print(f"{mat_name}: no objects use this material, skipping")
        return

    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]

    baked_images = {}

    # --- Base Color ---
    img_color = bpy.data.images.new(f"{mat_name}_BaseColor", width=RES, height=RES)
    tex_color = nodes.new('ShaderNodeTexImage')
    tex_color.name = 'BakedBaseColor'
    tex_color.image = img_color
    tex_color.select = True
    nodes.active = tex_color
    bpy.context.scene.render.bake.use_pass_direct = False
    bpy.context.scene.render.bake.use_pass_indirect = False
    bpy.context.scene.render.bake.use_pass_color = True
    bpy.ops.object.bake(type='DIFFUSE')
    baked_images['BaseColor'] = img_color
    tex_color.location = (-1800, 400)

    # --- Roughness ---
    if bake_roughness:
        img_rough = bpy.data.images.new(f"{mat_name}_Roughness", width=RES, height=RES)
        img_rough.colorspace_settings.name = 'Non-Color'
        tex_rough = nodes.new('ShaderNodeTexImage')
        tex_rough.name = 'BakedRoughness'
        tex_rough.image = img_rough
        tex_rough.select = True
        nodes.active = tex_rough
        bpy.ops.object.bake(type='ROUGHNESS')
        baked_images['Roughness'] = img_rough
        tex_rough.location = (-1800, 100)

    # --- Normal ---
    if bake_normal:
        img_normal = bpy.data.images.new(f"{mat_name}_Normal", width=RES, height=RES)
        img_normal.colorspace_settings.name = 'Non-Color'
        tex_normal = nodes.new('ShaderNodeTexImage')
        tex_normal.name = 'BakedNormal'
        tex_normal.image = img_normal
        tex_normal.select = True
        nodes.active = tex_normal
        bpy.ops.object.bake(type='NORMAL')
        baked_images['Normal'] = img_normal
        tex_normal.location = (-1800, -200)

    # --- Re-point BSDF inputs to the baked images ---
    links.new(tex_color.outputs['Color'], bsdf.inputs['Base Color'])
    if bake_roughness:
        links.new(tex_rough.outputs['Color'], bsdf.inputs['Roughness'])
    if bake_normal:
        normal_map_node = nodes.new('ShaderNodeNormalMap')
        normal_map_node.location = (-1400, -200)
        links.new(tex_normal.outputs['Color'], normal_map_node.inputs['Color'])
        links.new(normal_map_node.outputs['Normal'], bsdf.inputs['Normal'])

    print(f"{mat_name}: baked {list(baked_images.keys())} and re-pointed BSDF inputs.")

bake_and_repoint('Hull_Mid_Painted')
bake_and_repoint('Hull_Dark_Painted')
bake_and_repoint('Trim_Brushed_Aluminum')
bake_and_repoint('Viewport_Glass', bake_roughness=False)  # glass roughness stays a flat value; only normal varies
```

Expected: 4 confirmation lines, no error. **This step is the most likely to need iteration** —
if `bpy.ops.object.bake()` raises an error about "no active image" or similar, check that
`tex_color`/`tex_rough`/`tex_normal` is genuinely the active node (`nodes.active`) at the moment
of each bake call, not just selected — Cycles bakes to whichever image node is *active*, and
forgetting to update `nodes.active` before each bake call is the most common mistake with this
API.

- [ ] **Step 3: Verify the bake actually produced non-blank images**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Verifying the baked images actually contain varied pixel data, not a blank/solid-color image, which would indicate the bake silently failed or baked the wrong source."` and this code:

```python
import bpy

for img_name in ['Hull_Mid_Painted_BaseColor', 'Hull_Mid_Painted_Roughness', 'Trim_Brushed_Aluminum_Normal']:
    img = bpy.data.images.get(img_name)
    assert img is not None, f"MISSING: {img_name}"
    pixels = list(img.pixels)  # RGBA floats, flat array
    # Sample a handful of pixels across the image and confirm they're not all identical
    # (a fully blank/failed bake would produce a uniform color)
    n_pixels = len(pixels) // 4
    sample_indices = [0, n_pixels // 4, n_pixels // 2, (3 * n_pixels) // 4, n_pixels - 1]
    samples = [tuple(round(pixels[i*4+c], 4) for c in range(4)) for i in sample_indices]
    unique_samples = set(samples)
    print(f"{img_name}: {len(unique_samples)} unique values among 5 samples: {samples}")
    assert len(unique_samples) > 1, f"{img_name} appears to be a flat/blank bake (all sampled pixels identical)"

print("Bakes contain varied data, not blank images.")
```

Expected: prints sample values with more than 1 unique value each, then the final confirmation.
If any bake shows all-identical samples, that material's bake failed silently — go back to Step
2 and check the `nodes.active` issue noted above before re-baking just that material.

- [ ] **Step 4: Save**

Same save pattern as before.

---

### Task 6: Export both GLBs and verify the Three.js baseline

**Files:**
- Modify (binary): `worldline-lab/shared/assets/deck.glb`, `worldline-lab/shared/assets/wlv01_exterior.glb`
- Modify (binary): `src/assets/worldline/deck.glb`, `src/assets/worldline/wlv01_exterior.glb`
- Modify (binary): `worldline-lab/shared/assets/wlv01.blend`, `worldline-lab/shared/assets/wlv01.blend1`

**Interfaces:** Consumes: the baked materials from Task 5. Produces: exported GLBs for Task 7 to
compress.

- [ ] **Step 1: Export both GLBs**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Exporting both GLBs now that the 4 hero materials have real baked PBR textures, using the same collection-based selective export used earlier this session."` and this code:

```python
import bpy

bpy.ops.object.select_all(action='DESELECT')
main_coll = bpy.data.collections['Collection']
for obj in main_coll.objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\deck.glb",
    export_format='GLB',
    use_selection=True,
)
print("Exported deck.glb")

bpy.ops.object.select_all(action='DESELECT')
ext_coll = bpy.data.collections['WLV01_EXTERIOR']
for obj in ext_coll.objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\wlv01_exterior.glb",
    export_format='GLB',
    use_selection=True,
)
print("Exported wlv01_exterior.glb")
```

Expected: two confirmation lines, no error. Note the exact object counts are NOT re-stated here
as a hard assertion, since prior sessions found the "expected" counts drift as the scene
changes — instead, verify by file size:

```python
import os
for path in [
    r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\deck.glb",
    r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\wlv01_exterior.glb",
]:
    size = os.path.getsize(path)
    print(f"{path}: {size} bytes")
    assert size > 500000, f"{path} is suspiciously small ({size} bytes) for a file that should now include baked 2K textures"
```

Expected: both files noticeably larger than before (baked 2K textures add real weight) — assert
catches a badly broken/near-empty export, not an exact target size.

- [ ] **Step 2: Copy to the production assets directory**

```bash
cp worldline-lab/shared/assets/deck.glb src/assets/worldline/deck.glb
cp worldline-lab/shared/assets/wlv01_exterior.glb src/assets/worldline/wlv01_exterior.glb
```

- [ ] **Step 3: Verify the Three.js baseline still renders correctly**

Start the lab dev server if not already running (`yarn --cwd worldline-lab dev`, port 4330 —
check `.claude/launch.json` for the `worldline-lab` entry added earlier this session) and
navigate to `http://localhost:4330/three/`. Confirm:
- No new console errors (`mcp__Claude_Browser__read_console_messages`).
- The cockpit renders with visibly different material quality than before — hull panels should
  show subtle color variation and edge highlighting, console trim should show a brushed-metal
  look, the window should look slightly less artificially perfect.
- Nothing is missing, black, or obviously broken (a common baking-gone-wrong symptom is a fully
  black or fully white material where a bake failed but still got wired in).
- Toggle to the exterior view and confirm the same absence-of-breakage there too.

- [ ] **Step 4: Save the `.blend` and commit everything so far**

```python
import bpy
bpy.ops.wm.save_as_mainfile(filepath=r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\wlv01.blend")
print("Saved.")
```

```bash
git add worldline-lab/shared/assets/wlv01.blend worldline-lab/shared/assets/wlv01.blend1 worldline-lab/shared/assets/deck.glb worldline-lab/shared/assets/wlv01_exterior.glb src/assets/worldline/deck.glb src/assets/worldline/wlv01_exterior.glb
git status --short
git commit -m "$(cat <<'EOF'
feat: add procedural PBR materials, bevels, and re-export WLV-01 GLBs

Rebuilds the 4 highest-impact materials (Hull_Mid_Painted,
Hull_Dark_Painted, Trim_Brushed_Aluminum, Viewport_Glass) with real
procedural PBR detail -- edge wear via surface pointiness, subtle
base-color variation, brushed-metal streaks, glass imperfection --
informed by a Smithsonian Apollo CM reference scan (not copied from
it). Adds a bevel modifier to hard-surface objects. Bakes all four
materials to 2048x2048 textures (glTF can't carry a live procedural
graph) and re-exports both GLBs.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

Expected: `git status --short` shows exactly the 6 files listed — if anything else shows as
modified, stop and investigate before committing.

---

### Task 7: Compress the GLBs via gltf-transform

**Files:**
- Modify (binary): `worldline-lab/shared/assets/deck.glb`, `worldline-lab/shared/assets/wlv01_exterior.glb`
- Modify (binary): `src/assets/worldline/deck.glb`, `src/assets/worldline/wlv01_exterior.glb`

**Interfaces:** Consumes: the exported GLBs from Task 6. Produces: nothing — terminal task.

- [ ] **Step 1: Record pre-compression file sizes**

```bash
ls -la worldline-lab/shared/assets/deck.glb worldline-lab/shared/assets/wlv01_exterior.glb
```

- [ ] **Step 2: Compress both GLBs**

```bash
cd worldline-lab/shared/assets
npx --yes @gltf-transform/cli optimize deck.glb deck.compressed.glb --compress draco --texture-compress ktx2 --simplify false
npx --yes @gltf-transform/cli optimize wlv01_exterior.glb wlv01_exterior.compressed.glb --compress draco --texture-compress ktx2 --simplify false
```

**`--simplify false` is required** — the tool's default (`true`) would reduce mesh geometry via
meshoptimizer, risking distortion of the carefully-tuned low-poly curved surfaces built earlier
this session (the curved window is 34 vertices — there is no useful simplification target here,
only downside risk). **`--compress draco` must be explicit** too — the tool's own default
compression method is `meshopt`, not `draco`.

- [ ] **Step 3: Compare file sizes and replace the originals**

```bash
ls -la worldline-lab/shared/assets/*.glb
```

Confirm the `.compressed.glb` files are meaningfully smaller than the originals (KTX2 texture
compression typically gives a large reduction versus raw PNG/JPG inside a GLB). If they are:

```bash
mv worldline-lab/shared/assets/deck.compressed.glb worldline-lab/shared/assets/deck.glb
mv worldline-lab/shared/assets/wlv01_exterior.compressed.glb worldline-lab/shared/assets/wlv01_exterior.glb
cp worldline-lab/shared/assets/deck.glb src/assets/worldline/deck.glb
cp worldline-lab/shared/assets/wlv01_exterior.glb src/assets/worldline/wlv01_exterior.glb
```

- [ ] **Step 4: Verify the compressed files render correctly in all three engines**

KTX2 textures require the `KHR_texture_basisu` glTF extension to be supported by the loading
engine. Check each:

1. **Three.js lab** (`http://localhost:4330/three/`): reload, check console for errors mentioning
   `KHR_texture_basisu`, `ktx2`, or `basis`. Three.js's `GLTFLoader` needs a `KTX2Loader`
   registered with a transcoder path to support this — check `worldline-lab/three/main.ts` for
   whether one is already wired. If not, this is a real gap: either add one, or this engine
   can't consume KTX2 and the compression step needs a different texture format for it.
2. **PlayCanvas lab** (`http://localhost:4330/playcanvas/`): PlayCanvas 2.x has built-in
   `KHR_texture_basisu` support in its container asset loader — reload and check console for
   errors, and confirm the model still renders with textures visible (not black/missing).
3. **Production** (`http://localhost:4200/v2`, `yarn start`): same check as PlayCanvas lab, since
   production uses the same PlayCanvas engine.

**If Three.js can't load KTX2 without additional loader setup that's out of this plan's scope**:
that's a real, concrete finding — report it rather than silently working around it. A reasonable
fallback discussed in the design spec is to compress textures as regular JPG/PNG at reduced
resolution instead of KTX2 for the files Three.js needs, while keeping Draco geometry
compression (which Three.js's `GLTFLoader` supports out of the box via `DRACOLoader`, same as
today). Whether to pursue that fallback is a judgment call for the controller/human, not
something to decide unilaterally mid-task if it comes to that — report and stop rather than
silently downgrading the compression scheme.

- [ ] **Step 5: Commit**

```bash
git add worldline-lab/shared/assets/deck.glb worldline-lab/shared/assets/wlv01_exterior.glb src/assets/worldline/deck.glb src/assets/worldline/wlv01_exterior.glb
git status --short
git commit -m "$(cat <<'EOF'
perf: compress WLV-01 GLBs with Draco geometry + KTX2 textures

Real PBR textures from the materials pass meaningfully increased file
size. Compresses both GLBs via @gltf-transform/cli (Draco geometry
compression, KTX2/Basis texture compression), explicitly disabling
mesh simplification since the low-poly curved surfaces built earlier
this session have no useful simplification target and only downside
risk from it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

Expected: `git status --short` shows exactly the 4 GLB files.

---

## Post-plan state

The pending-items report should note the 4 hero materials as upgraded (not part of this plan's
scope — a documentation follow-up). The other 7 materials, hand-authored wear detail, and any
KTX2-support gap found in Task 7 remain open for future sessions.
