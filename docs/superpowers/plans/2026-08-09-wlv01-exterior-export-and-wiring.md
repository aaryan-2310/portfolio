# WLV-01 GLB Re-export + Exterior Toggle Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-export `deck.glb` and `wlv01_exterior.glb` from the live Blender scene (now including this session's radiator and hull-gap work), then port the exterior-vessel toggle — currently Three.js-only — into the PlayCanvas lab build and the production Angular app.

**Architecture:** Task 1 is Blender-MCP export + asset copy + Three.js-baseline verification (no TypeScript changes). Tasks 2–3 port the exact pattern already proven in `worldline-lab/three/main.ts` (`EXT_CAM`, `exterior` group, `setExteriorMode()`) into PlayCanvas's `rig`/`camE` camera system, first in the lab build, then in production with an added UI button (production currently has zero overlay UI).

**Tech Stack:** Blender 4.x `bpy` (via MCP), TypeScript/PlayCanvas 2.x, Angular 20 standalone component with signals.

## Global Constraints

- **Coordinate values are fixed, taken verbatim from the proven Three.js implementation** — do not re-derive or adjust them:
  - `EXT_CAM = { pos: [-10.72, -3.07, 5.62], look: [0.05, 0.26, 11.84] }`
- Every `mcp__blender__*` tool call requires a `user_prompt` argument.
- This live Blender session's `bpy.data.filepath` is bound (it was set correctly at the end of the prior cockpit-hull-extension session) — `bpy.ops.export_scene.gltf` does not depend on this either way, since it takes an explicit `filepath` argument.
- Asset paths: lab assets live in `worldline-lab/shared/assets/`; production assets are a manual byte-identical copy in `src/assets/worldline/` (no build step keeps them in sync — copy explicitly after every export).
- Both PlayCanvas builds (lab and production) already load the deck GLB into a variable named `root` inside `deckAsset.on('load', ...)` — this plan captures it into an outer-scope `deckRoot` in both files, following the exact same pattern already used for `center`/`deckLoaded`.
- Do not modify `worldline-lab/three/main.ts` — it's the reference implementation this plan ports from, already working.

---

### Task 1: Re-export both GLBs and verify the Three.js baseline

**Files:**
- Modify (binary): `worldline-lab/shared/assets/deck.glb`, `worldline-lab/shared/assets/wlv01_exterior.glb`
- Modify (binary): `src/assets/worldline/deck.glb`, `src/assets/worldline/wlv01_exterior.glb`

**Interfaces:** None (binary assets; Tasks 2–3 consume the files by path, not by any TS interface).

- [ ] **Step 1: Export both GLBs from the live Blender scene**

Call `mcp__blender__execute_blender_code` with `user_prompt: "Re-exporting deck.glb and wlv01_exterior.glb from the live scene, now including this session's radiator and hull-gap additions."` and this code:

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
print("Exported deck.glb:", len(main_coll.objects), "objects")

bpy.ops.object.select_all(action='DESELECT')
ext_coll = bpy.data.collections['WLV01_EXTERIOR']
for obj in ext_coll.objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=r"C:\usr\workspace\personal\portfolio\worldline-lab\shared\assets\wlv01_exterior.glb",
    export_format='GLB',
    use_selection=True,
)
print("Exported wlv01_exterior.glb:", len(ext_coll.objects), "objects")
```

Expected: `Exported deck.glb: 89 objects` and `Exported wlv01_exterior.glb: 36 objects`.

(Note: an earlier run of this task found the 18 `Ext_Radiator_*` objects were linked to the wrong
collection — `Collection` instead of `WLV01_EXTERIOR` — a bug from an earlier session that slipped
past that task's review. It's been corrected directly in the live Blender scene: `Collection` is
now 89 objects, `WLV01_EXTERIOR` is 36 (18 original + 18 radiators). If your count differs from
these corrected numbers, stop and report — do not assume the original 107/18 figures.)

- [ ] **Step 2: Copy the re-exported GLBs to the production assets directory**

```bash
cp worldline-lab/shared/assets/deck.glb src/assets/worldline/deck.glb
cp worldline-lab/shared/assets/wlv01_exterior.glb src/assets/worldline/wlv01_exterior.glb
```

- [ ] **Step 3: Verify the Three.js baseline still renders correctly**

The Three.js lab build is the fastest way to catch an export regression before touching any code, since it's the known-working reference and needs zero changes to test.

Start the lab dev server: run `yarn --cwd worldline-lab dev` (or use the Browser tool's `preview_start`/`preview_list` if a `.claude/launch.json` entry for it doesn't exist yet — create one pointing at `worldline-lab`, port 4330). Navigate to `http://localhost:4330/three/`.

Check:
- `mcp__Claude_Browser__read_console_messages` — no new errors (ignore the pre-existing `node:worker_threads` CORS warning if it appears here too; that's unrelated to this task and specific to the Angular dev-server, not Vite's raw dev server used for `worldline-lab`).
- Take a screenshot — confirm the full cockpit scene renders (seat, both console desks, HUD panels, black hole visible through the window) with no missing/black geometry.
- Click the `EXTERIOR VIEW` HUD button — confirm the exterior vessel (now including the 18 radiator slats) appears and the camera transitions to it.
- Click it again — confirm it returns to the cockpit view, now showing the closed side-hull (no visible gap at the sides where the seat/console desks are).

If anything is missing, broken, or looks wrong compared to before the export, stop and report — do not proceed to Tasks 2–3 on top of a broken export.

- [ ] **Step 4: Commit the re-exported assets**

```bash
git add worldline-lab/shared/assets/deck.glb worldline-lab/shared/assets/wlv01_exterior.glb src/assets/worldline/deck.glb src/assets/worldline/wlv01_exterior.glb
git status --short
git commit -m "$(cat <<'EOF'
feat: re-export WLV-01 GLBs with radiators and hull-gap fix

Both deck.glb and wlv01_exterior.glb predated this session's Blender
work (18 radiator panels, 7 cockpit hull pieces). Re-exported from the
live scene and copied to both the lab and production asset
directories, which must stay byte-identical.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

Expected: `git status --short` (run before the commit) shows exactly these 4 files modified — if anything else shows as modified, stop and investigate before committing.

---

### Task 2: Wire the exterior toggle into the PlayCanvas lab build

**Files:**
- Modify: `worldline-lab/playcanvas/main.ts`

**Interfaces:**
- Consumes: `wlv01_exterior.glb` from Task 1 (must be complete first).
- Produces: nothing consumed by Task 3 — production is a separate, independent port of the same pattern, not a shared module.

- [ ] **Step 1: Write the failing check** (there's no test runner for this file — "failing check" here means: confirm the `EXTERIOR VIEW` button and exterior geometry do NOT exist yet)

Start the lab dev server if not already running (`yarn --cwd worldline-lab dev`, port 4330) and navigate to `http://localhost:4330/playcanvas/`. Confirm there is no `EXTERIOR VIEW` button in the dev HUD (only `RESET CAMERA` should be present). This confirms the baseline before the change.

- [ ] **Step 2: Declare `deckRoot` alongside the existing `deckLoaded`/`displays` state**

In `worldline-lab/playcanvas/main.ts`, find:

```typescript
let deckLoaded = false;

function wireDisplay(
```

Replace with:

```typescript
let deckLoaded = false;
let deckRoot: pc.Entity | null = null;

function wireDisplay(
```

- [ ] **Step 3: Capture `deckRoot` when the deck GLB loads**

Find:

```typescript
deckAsset.on('load', () => {
  const root = (deckAsset.resource as pc.ContainerResource).instantiateRenderEntity();
  app.root.addChild(root);
  root.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });
```

Replace with:

```typescript
deckAsset.on('load', () => {
  const root = (deckAsset.resource as pc.ContainerResource).instantiateRenderEntity();
  deckRoot = root;
  app.root.addChild(root);
  root.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });
```

- [ ] **Step 4: Load the exterior GLB, starting hidden**

Find:

```typescript
deckAsset.on('error', (err: string) => {
  console.error('deck.glb failed to load', err);
  hud.flag('Geometry: Blender GLB (round 2)', false, 'load failed — see console');
});

/* ── exterior: key star billboard + starfield (planet removed — black hole is the backdrop) ── */
```

Replace with:

```typescript
deckAsset.on('error', (err: string) => {
  console.error('deck.glb failed to load', err);
  hud.flag('Geometry: Blender GLB (round 2)', false, 'load failed — see console');
});

/* ── exterior vessel — reveal mode. Coordinate mapping matches the three.js build:
   Blender (x,y,z) → engine (x, z, −y), same convention already shared by both engines
   (see BH_WORLD_PC below, identical value used in three.js's BH_WORLD). ── */
const EXT_CAM = {
  pos:  [-10.72, -3.07,  5.62] as [number, number, number],
  look: [  0.05,  0.26, 11.84] as [number, number, number],
};
let exteriorRoot: pc.Entity | null = null;
let exteriorMode = false;
const exteriorAsset = new pc.Asset('exterior', 'container',
  { url: new URL('../shared/assets/wlv01_exterior.glb', import.meta.url).href });
app.assets.add(exteriorAsset);
app.assets.load(exteriorAsset);
exteriorAsset.on('load', () => {
  exteriorRoot = (exteriorAsset.resource as pc.ContainerResource).instantiateRenderEntity();
  exteriorRoot.enabled = false;
  app.root.addChild(exteriorRoot);
  exteriorRoot.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });
  hud.flag('Exterior: WLV-01 vessel GLB', true);
});
exteriorAsset.on('error', (err: string) => {
  console.error('wlv01_exterior.glb failed to load', err);
  hud.flag('Exterior: WLV-01 vessel GLB', false, 'load failed');
});

/* ── exterior: key star billboard + starfield (planet removed — black hole is the backdrop) ── */
```

- [ ] **Step 5: Add `setExteriorMode` and the dev-HUD button**

Find:

```typescript
function setEngaged(on: boolean) {
  if (!center || !deckLoaded || rig.engaged === on) return;
  rig.engaged = on;
  rig.animStart = performance.now();
  rig.fromP.copy(camE.getPosition());
  rig.fromL.copy(lookTmp);                 // resume the flight from the current gaze
  drawScreen(center.cv, on ? CONSOLE.engagedTitle : CONSOLE.idleTitle,
    on ? CONSOLE.engagedLines : CONSOLE.idleLines, on);
  center.tex.setSource(center.cv);
  center.light.light!.color = col(on ? C.teal : C.amber);
}
canvas.addEventListener('pointermove', e => {
```

Replace with:

```typescript
function setEngaged(on: boolean) {
  if (!center || !deckLoaded || rig.engaged === on) return;
  rig.engaged = on;
  rig.animStart = performance.now();
  rig.fromP.copy(camE.getPosition());
  rig.fromL.copy(lookTmp);                 // resume the flight from the current gaze
  drawScreen(center.cv, on ? CONSOLE.engagedTitle : CONSOLE.idleTitle,
    on ? CONSOLE.engagedLines : CONSOLE.idleLines, on);
  center.tex.setSource(center.cv);
  center.light.light!.color = col(on ? C.teal : C.amber);
}

function setExteriorMode(on: boolean) {
  if (exteriorMode === on) return;
  exteriorMode = on;
  if (deckRoot) deckRoot.enabled = !on;
  if (exteriorRoot) exteriorRoot.enabled = on;
  rig.animStart = performance.now();
  rig.fromP.copy(camE.getPosition());
  rig.fromL.copy(lookTmp);
  if (on) setEngaged(false);
}
hud.button('EXTERIOR VIEW', () => setExteriorMode(!exteriorMode));

canvas.addEventListener('pointermove', e => {
```

- [ ] **Step 6: Make the camera rig target the exterior view when active**

Find:

```typescript
  const target = rig.engaged ? CAM.focus : CAM.base;
  const k = REDUCED ? 1 : Math.min(1, (performance.now() - rig.animStart) / CAM.transitionMs);
  const e = easeInOut(k);
  const tp = new pc.Vec3(...target.pos as [number, number, number]);
  const tl = new pc.Vec3(...target.look as [number, number, number]);
  const p = new pc.Vec3().lerp(rig.fromP, tp, e);
  lookTmp.lerp(rig.fromL, tl, e);

  const idle = REDUCED || rig.engaged ? 0 : Math.sin(rig.t * (Math.PI * 2) / CAM.idlePeriodS);
  camE.setPosition(
    p.x + rig.px * CAM.parallax,
    p.y - rig.py * CAM.parallax * 0.6,
    p.z + idle * CAM.idleAmpZ);
  camE.lookAt(lookTmp.x + rig.px * 0.24, lookTmp.y - rig.py * 0.18, lookTmp.z);
```

Replace with:

```typescript
  const target = exteriorMode ? EXT_CAM : (rig.engaged ? CAM.focus : CAM.base);
  const k = REDUCED ? 1 : Math.min(1, (performance.now() - rig.animStart) / CAM.transitionMs);
  const e = easeInOut(k);
  const tp = new pc.Vec3(...target.pos as [number, number, number]);
  const tl = new pc.Vec3(...target.look as [number, number, number]);
  const p = new pc.Vec3().lerp(rig.fromP, tp, e);
  lookTmp.lerp(rig.fromL, tl, e);

  const idle = REDUCED || rig.engaged || exteriorMode ? 0 : Math.sin(rig.t * (Math.PI * 2) / CAM.idlePeriodS);
  const px = exteriorMode ? 0 : rig.px * CAM.parallax;
  const py = exteriorMode ? 0 : rig.py * CAM.parallax * 0.6;
  camE.setPosition(p.x + px, p.y - py, p.z + idle * CAM.idleAmpZ);
  camE.lookAt(lookTmp.x + (exteriorMode ? 0 : rig.px * 0.24), lookTmp.y - (exteriorMode ? 0 : rig.py * 0.18), lookTmp.z);
```

- [ ] **Step 7: Verify in the browser**

Reload `http://localhost:4330/playcanvas/`. Confirm:
- No console errors (`mcp__Claude_Browser__read_console_messages`).
- An `EXTERIOR VIEW` button now appears in the dev HUD, alongside `RESET CAMERA`.
- Clicking it transitions the camera to the exterior vessel view (radiators visible on both flanks) and hides the cockpit.
- Clicking it again returns to the cockpit view with no visible side-hull gap.
- `Console_Interact` still works (click-to-engage still functions when not in exterior mode) — the interaction wiring wasn't touched, but re-verify after any camera-rig change.

- [ ] **Step 8: Commit**

```bash
git add worldline-lab/playcanvas/main.ts
git commit -m "$(cat <<'EOF'
feat: wire exterior vessel toggle into PlayCanvas lab build

Ports the exact pattern already proven in worldline-lab/three/main.ts
(EXT_CAM coordinates, visibility swap, camera-rig lerp) into the
PlayCanvas lab build. Loads wlv01_exterior.glb alongside the deck,
starting hidden; EXTERIOR VIEW dev-HUD button toggles between them.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire the exterior toggle into production, with a UI button

**Files:**
- Modify: `src/app/worldline/worldline.service.ts`
- Modify: `src/app/worldline/worldline.component.ts`

**Interfaces:**
- Consumes: `wlv01_exterior.glb` from Task 1; the porting pattern validated in Task 2 (same logic, independently applied — this file shares no module with the lab build).
- Produces: `WorldlineService.toggleExterior(): void` — a public method Task 3's own component step calls; nothing outside this task depends on it.

- [ ] **Step 1: Confirm the baseline** (no test runner here either — confirm current behavior before changing it)

Start the production dev server (`yarn start`, port 4200) and navigate to `http://localhost:4200/v2`. Confirm there is no visible button overlay — just the bare 3D canvas. This confirms the baseline.

- [ ] **Step 2: Add the `exteriorToggleFn` field and public `toggleExterior()` method**

In `src/app/worldline/worldline.service.ts`, find:

```typescript
  private app: pc.Application | null = null;
  private pointerMoveFn?: (e: PointerEvent) => void;
  private pointerDownFn?: (e: PointerEvent) => void;
  private keyDownFn?: (e: KeyboardEvent) => void;
  private resizeFn?: () => void;
```

Replace with:

```typescript
  private app: pc.Application | null = null;
  private pointerMoveFn?: (e: PointerEvent) => void;
  private pointerDownFn?: (e: PointerEvent) => void;
  private keyDownFn?: (e: KeyboardEvent) => void;
  private resizeFn?: () => void;
  private exteriorToggleFn?: () => void;
```

Find:

```typescript
  destroy(): void {
    if (!this.app) return;
    this.pointerMoveFn && window.removeEventListener('pointermove', this.pointerMoveFn);
    this.pointerDownFn && window.removeEventListener('pointerdown', this.pointerDownFn);
    this.keyDownFn && window.removeEventListener('keydown', this.keyDownFn);
    this.resizeFn && window.removeEventListener('resize', this.resizeFn);
    this.app.destroy();
    this.app = null;
  }
```

Replace with:

```typescript
  destroy(): void {
    if (!this.app) return;
    this.pointerMoveFn && window.removeEventListener('pointermove', this.pointerMoveFn);
    this.pointerDownFn && window.removeEventListener('pointerdown', this.pointerDownFn);
    this.keyDownFn && window.removeEventListener('keydown', this.keyDownFn);
    this.resizeFn && window.removeEventListener('resize', this.resizeFn);
    this.app.destroy();
    this.app = null;
  }

  toggleExterior(): void {
    this.exteriorToggleFn?.();
  }
```

- [ ] **Step 3: Declare `deckRoot` and capture it on load**

Find:

```typescript
    // Deck GLB
    const displays: Display[] = [];
    let deckLoaded = false;
    let center: Display | undefined;
```

Replace with:

```typescript
    // Deck GLB
    const displays: Display[] = [];
    let deckLoaded = false;
    let center: Display | undefined;
    let deckRoot: pc.Entity | null = null;
```

Find:

```typescript
    deckAsset.on('load', () => {
      const root = (deckAsset.resource as pc.ContainerResource).instantiateRenderEntity();
      app.root.addChild(root);
      root.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });
```

Replace with:

```typescript
    deckAsset.on('load', () => {
      const root = (deckAsset.resource as pc.ContainerResource).instantiateRenderEntity();
      deckRoot = root;
      app.root.addChild(root);
      root.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });
```

- [ ] **Step 4: Load the exterior GLB, starting hidden**

Find:

```typescript
        (renderE.render!.meshInstances[0] as any).material = mat;
      }
    });

    // Key star billboard
```

Replace with:

```typescript
        (renderE.render!.meshInstances[0] as any).material = mat;
      }
    });

    // Exterior vessel — reveal mode. Coordinate mapping matches the three.js/PlayCanvas lab
    // builds (both share this convention already — see BH_WORLD below).
    const EXT_CAM = {
      pos:  [-10.72, -3.07,  5.62] as [number, number, number],
      look: [  0.05,  0.26, 11.84] as [number, number, number],
    };
    let exteriorRoot: pc.Entity | null = null;
    let exteriorMode = false;
    const exteriorAsset = new pc.Asset('exterior', 'container', { url: '/assets/worldline/wlv01_exterior.glb' });
    app.assets.add(exteriorAsset);
    app.assets.load(exteriorAsset);
    exteriorAsset.on('load', () => {
      exteriorRoot = (exteriorAsset.resource as pc.ContainerResource).instantiateRenderEntity();
      exteriorRoot.enabled = false;
      app.root.addChild(exteriorRoot);
      exteriorRoot.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });
    });
    exteriorAsset.on('error', (err: string) => console.error('wlv01_exterior.glb failed to load', err));

    // Key star billboard
```

- [ ] **Step 5: Add `setExteriorMode` and wire it to `this.exteriorToggleFn`**

Find:

```typescript
    const setEngaged = (on: boolean) => {
      if (!center || !deckLoaded || rig.engaged === on) return;
      rig.engaged = on;
      rig.animStart = performance.now();
      rig.fromP.copy(camE.getPosition());
      rig.fromL.copy(lookTmp);
      drawScreen(center.cv, on ? CONSOLE.engagedTitle : CONSOLE.idleTitle,
        on ? CONSOLE.engagedLines : CONSOLE.idleLines, on);
      center.tex.setSource(center.cv);
      center.light.light!.color = col(on ? C.teal : C.amber);
    };

    this.pointerMoveFn = (e: PointerEvent) => {
```

Replace with:

```typescript
    const setEngaged = (on: boolean) => {
      if (!center || !deckLoaded || rig.engaged === on) return;
      rig.engaged = on;
      rig.animStart = performance.now();
      rig.fromP.copy(camE.getPosition());
      rig.fromL.copy(lookTmp);
      drawScreen(center.cv, on ? CONSOLE.engagedTitle : CONSOLE.idleTitle,
        on ? CONSOLE.engagedLines : CONSOLE.idleLines, on);
      center.tex.setSource(center.cv);
      center.light.light!.color = col(on ? C.teal : C.amber);
    };

    const setExteriorMode = (on: boolean) => {
      if (exteriorMode === on) return;
      exteriorMode = on;
      if (deckRoot) deckRoot.enabled = !on;
      if (exteriorRoot) exteriorRoot.enabled = on;
      rig.animStart = performance.now();
      rig.fromP.copy(camE.getPosition());
      rig.fromL.copy(lookTmp);
      if (on) setEngaged(false);
    };
    this.exteriorToggleFn = () => setExteriorMode(!exteriorMode);

    this.pointerMoveFn = (e: PointerEvent) => {
```

- [ ] **Step 6: Make the camera rig target the exterior view when active**

Find:

```typescript
      const target = rig.engaged ? CAM.focus : CAM.base;
      const k = REDUCED ? 1 : Math.min(1, (performance.now() - rig.animStart) / CAM.transitionMs);
      const e = easeInOut(k);
      const tp = new pc.Vec3(...target.pos as [number,number,number]);
      const tl = new pc.Vec3(...target.look as [number,number,number]);
      const p = new pc.Vec3().lerp(rig.fromP, tp, e);
      lookTmp.lerp(rig.fromL, tl, e);

      const idle = REDUCED || rig.engaged ? 0 : Math.sin(rig.t * (Math.PI * 2) / CAM.idlePeriodS);
      camE.setPosition(
        p.x + rig.px * CAM.parallax,
        p.y - rig.py * CAM.parallax * 0.6,
        p.z + idle * CAM.idleAmpZ);
      camE.lookAt(lookTmp.x + rig.px * 0.24, lookTmp.y - rig.py * 0.18, lookTmp.z);
```

Replace with:

```typescript
      const target = exteriorMode ? EXT_CAM : (rig.engaged ? CAM.focus : CAM.base);
      const k = REDUCED ? 1 : Math.min(1, (performance.now() - rig.animStart) / CAM.transitionMs);
      const e = easeInOut(k);
      const tp = new pc.Vec3(...target.pos as [number,number,number]);
      const tl = new pc.Vec3(...target.look as [number,number,number]);
      const p = new pc.Vec3().lerp(rig.fromP, tp, e);
      lookTmp.lerp(rig.fromL, tl, e);

      const idle = REDUCED || rig.engaged || exteriorMode ? 0 : Math.sin(rig.t * (Math.PI * 2) / CAM.idlePeriodS);
      const px = exteriorMode ? 0 : rig.px * CAM.parallax;
      const py = exteriorMode ? 0 : rig.py * CAM.parallax * 0.6;
      camE.setPosition(p.x + px, p.y - py, p.z + idle * CAM.idleAmpZ);
      camE.lookAt(lookTmp.x + (exteriorMode ? 0 : rig.px * 0.24), lookTmp.y - (exteriorMode ? 0 : rig.py * 0.18), lookTmp.z);
```

- [ ] **Step 7: Replace `worldline.component.ts` with the button-enabled version**

Replace the entire contents of `src/app/worldline/worldline.component.ts` with:

```typescript
import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ViewEncapsulation, inject, signal } from '@angular/core';
import { WorldlineService } from './worldline.service';

@Component({
  selector: 'app-worldline',
  standalone: true,
  template: `
    <canvas #wlCanvas></canvas>
    <button class="exterior-toggle" [class.active]="exteriorActive()" (click)="onToggleExterior()">
      {{ exteriorActive() ? 'COCKPIT VIEW' : 'EXTERIOR VIEW' }}
    </button>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; position: relative; }
    canvas { display: block; width: 100% !important; height: 100% !important; outline: none; }
    .exterior-toggle {
      position: absolute;
      bottom: 24px;
      right: 24px;
      padding: 10px 18px;
      font-family: monospace;
      font-size: 12px;
      letter-spacing: 0.08em;
      color: #d9a648;
      background: rgba(10, 12, 18, 0.55);
      border: 1px solid rgba(217, 166, 72, 0.4);
      border-radius: 4px;
      backdrop-filter: blur(6px);
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
    }
    .exterior-toggle:hover { border-color: rgba(217, 166, 72, 0.8); }
    .exterior-toggle.active {
      color: #5fb8a8;
      border-color: rgba(95, 184, 168, 0.6);
    }
  `],
  encapsulation: ViewEncapsulation.Emulated,
})
export class WorldlineComponent implements OnInit, OnDestroy {
  @ViewChild('wlCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly wl = inject(WorldlineService);

  readonly exteriorActive = signal(false);

  ngOnInit(): void {
    this.wl.init(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.wl.destroy();
  }

  onToggleExterior(): void {
    this.exteriorActive.set(!this.exteriorActive());
    this.wl.toggleExterior();
  }
}
```

- [ ] **Step 8: Verify in the browser**

Reload `http://localhost:4200/v2`. Confirm:
- No console errors, no build failures.
- The `EXTERIOR VIEW` button appears bottom-right, amber-colored.
- Clicking it: label changes to `COCKPIT VIEW`, button turns teal, camera transitions to the exterior vessel view, cockpit hides.
- Clicking it again: returns to the cockpit view, button reverts to amber `EXTERIOR VIEW`.
- `yarn lint` passes on the two changed files with no new errors (pre-existing unrelated `prefer-inject` errors elsewhere in the codebase are not this task's concern).
- No regression of the `node:worker_threads` dev-server issue fixed earlier this session (`angular.json`'s `prebundle.exclude`) — the `/v2` route must still load cleanly under `yarn start` with no CORS/chunk-load errors in the console. This task doesn't touch `angular.json`, so it shouldn't regress, but confirm rather than assume.

- [ ] **Step 9: Commit**

```bash
git add src/app/worldline/worldline.service.ts src/app/worldline/worldline.component.ts
git commit -m "$(cat <<'EOF'
feat: wire exterior vessel toggle into production, with a UI button

Ports the same pattern from the PlayCanvas lab build into production.
Since production has no dev HUD, adds a bespoke bottom-right toggle
button using the scene's own amber/teal palette (matching the console
"engaged" state color language) instead of the site's global design
tokens, so it reads as part of the 3D experience rather than site chrome.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Post-plan state

After Task 3, the pending-items report's "Exterior vessel toggle in PlayCanvas" item should be marked done (not part of this plan's scope — a documentation follow-up, not a blocking step).
