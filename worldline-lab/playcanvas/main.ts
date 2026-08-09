/**
 * WORLDLINE bake-off — PLAYCANVAS build of the shared cockpit spec.
 * ROUND 2: cockpit hull loads from shared/assets/deck.glb (Blender-authored,
 * real reference PBR values), same file the three.js build loads. Everything
 * else — camera rig, lighting, bloom, interaction — unchanged from round 1.
 */
import * as pc from 'playcanvas';
import { C, G, CAM, CONSOLE, DISPLAY_LIGHT, REDUCED, drawScreen, drawEquirectEnv } from '../shared/spec';
import { drawTimeline, drawConstellation, drawJournal, drawSystem } from '../shared/content';
import { MetricsHud } from '../shared/hud';
import { BloomEffect } from '../shared/bloom';

const canvas = document.getElementById('app') as HTMLCanvasElement;
const app = new pc.Application(canvas, {
  mouse: new pc.Mouse(canvas),
  graphicsDeviceOptions: { antialias: true, alpha: false },
});
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.graphicsDevice.maxPixelRatio = Math.min(devicePixelRatio, 2);
addEventListener('resize', () => app.resizeCanvas());

const hud = new MetricsHud('PLAYCANVAS', () => app.stats.drawCalls.total);
hud.setDevice((app.graphicsDevice as any).isWebGPU ? 'WebGPU' : 'WebGL2');

const col = (hex: number) =>
  new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

/* ── IBL from the shared equirect painting ── */
let iblOk = false;
try {
  const envCv = document.createElement('canvas');
  drawEquirectEnv(envCv);
  const envTex = new pc.Texture(app.graphicsDevice, {
    width: envCv.width, height: envCv.height,
    format: pc.PIXELFORMAT_RGBA8, mipmaps: false,
  });
  envTex.setSource(envCv);
  const lighting = pc.EnvLighting.generateLightingSource(envTex);
  const atlas = pc.EnvLighting.generateAtlas(lighting);
  app.scene.envAtlas = atlas;
  app.scene.skyboxIntensity = 0.5;
  iblOk = true;
} catch (e) { console.warn('IBL setup failed', e); }
hud.flag('IBL (EnvLighting atlas)', iblOk, iblOk ? '' : 'lights only');

/* ── camera ── */
const camE = new pc.Entity('camera');
camE.addComponent('camera', {
  clearColor: new pc.Color(0.02, 0.023, 0.04),
  fov: CAM.fovDeg, nearClip: 0.05, farClip: 500,
});
try {
  (camE.camera as any).toneMapping = (pc as any).TONEMAP_ACES;
  hud.flag('Tonemap: ACES', true);
} catch { hud.flag('Tonemap: ACES', false); }
app.root.addChild(camE);
// Required for KHR_materials_transmission glass (previously provided by CameraFrame)
camE.camera!.requestSceneColorMap(true);

/* ── cockpit: Blender-authored GLB, real PBR materials baked in ── */
interface Display { e: pc.Entity; cv: HTMLCanvasElement; tex: pc.Texture; mat: pc.StandardMaterial; light: pc.Entity; }
const displays: Display[] = [];
// phase 2: the seat's headrest occludes the dash's center display from the new
// third-person camera (verified in-browser, both engines) — the interactive
// console moved to Console_Interact on the right console arm, within the
// seated figure's reach and visible past the seat. The 3 dash displays are
// now ambient-only (idle content, no hover/click).
let deckLoaded = false;
let deckRoot: pc.Entity | null = null;

function wireDisplay(
  entity: pc.Entity, title: string, lines: readonly string[],
  lightColor: pc.Color, lightPos: [number, number, number],
): Display {
  const cv = document.createElement('canvas');
  drawScreen(cv, title, lines, false);
  const tex = new pc.Texture(app.graphicsDevice, {
    width: cv.width, height: cv.height, format: pc.PIXELFORMAT_SRGBA8, mipmaps: true,
    flipY: false,   // verified empirically — see note at the load handler below
  });
  tex.setSource(cv);
  const mat = new pc.StandardMaterial();
  mat.diffuse = new pc.Color(0, 0, 0);
  mat.useMetalness = true; mat.metalness = 0; mat.gloss = 0.6;
  mat.emissive = new pc.Color(1, 1, 1);
  mat.emissiveMap = tex;
  mat.emissiveIntensity = 1.6;
  mat.update();
  (entity.render!.meshInstances[0] as any).material = mat;

  const light = new pc.Entity('dlight-' + title);
  light.addComponent('light', {
    type: 'omni', color: lightColor,
    intensity: DISPLAY_LIGHT.intensity, range: DISPLAY_LIGHT.range,
    castShadows: false,
  });
  light.setPosition(...lightPos);
  app.root.addChild(light);
  return { e: entity, cv, tex, mat, light };
}

const deckAsset = new pc.Asset('deck', 'container',
  { url: new URL('../shared/assets/deck.glb', import.meta.url).href });
app.assets.add(deckAsset);
app.assets.load(deckAsset);
deckAsset.on('load', () => {
  const root = (deckAsset.resource as pc.ContainerResource).instantiateRenderEntity();
  deckRoot = root;
  root.enabled = !exteriorMode;
  app.root.addChild(root);
  root.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });

  // Verified empirically (corner-marker test): PlayCanvas's container loader
  // already samples these Blender-plane UVs correctly — no flip needed here,
  // unlike three.js's GLTFLoader. Each engine's glTF import path applies its
  // own convention; the round-1 assumption that the same fix would transfer
  // was wrong, and worth documenting so it isn't re-guessed later.
  const auxL = root.findByName('Display_Aux1') as pc.Entity | null;
  const consoleDash = root.findByName('Display_Console') as pc.Entity | null;
  const auxR = root.findByName('Display_Aux2') as pc.Entity | null;
  if (auxL) displays.push(wireDisplay(auxL, 'AUX SYS', ['NOMINAL', ''],
    col(C.amberHot), [G.display.xs[0], G.display.y + 0.18, G.display.z + 0.3]));
  if (consoleDash) displays.push(wireDisplay(consoleDash, 'MISSION CONSOLE', ['06 MISSIONS INDEXED', 'ARCHIVE NOMINAL'],
    col(C.amber), [G.display.xs[1], G.display.y + 0.18, G.display.z + 0.3]));
  if (auxR) displays.push(wireDisplay(auxR, 'AUX NAV', ['NOMINAL', ''],
    col(C.amberHot), [G.display.xs[2], G.display.y + 0.18, G.display.z + 0.3]));

  const interactE = root.findByName('Console_Interact') as pc.Entity | null;
  if (interactE) {
    center = wireDisplay(interactE, CONSOLE.idleTitle, CONSOLE.idleLines,
      col(C.amber), [0.62, -0.55 + 0.14 + 0.16, 0.80 - 0.24]);
    refreshAabb();
    hud.flag('Interactive console: Console_Interact (arm)', true);
  } else {
    hud.flag('Interactive console: Console_Interact (arm)', false, 'mesh not found in GLB');
  }
  deckLoaded = true;
  hud.flag('Geometry: Blender GLB (round 2)', true);
  hud.flag('Glass: material from GLB', !!root.findByName('Deck_Glass'));

  // Wire HUD panels — same emissive canvas pattern as dash displays, no UV flip needed
  const hudDefs: [string, (cv: HTMLCanvasElement) => void, number, number][] = [
    ['HUD_Timeline',      drawTimeline,      1024, 256],
    ['HUD_Constellation', drawConstellation,  512, 768],
    ['HUD_Journal',       drawJournal,        512, 768],
    ['HUD_System',        drawSystem,         512, 512],
  ];
  let hudCount = 0;
  for (const [meshName, drawFn, cw, ch] of hudDefs) {
    const e = root.findByName(meshName) as pc.Entity | null;
    if (!e) continue;
    // GLTF import wraps the mesh in a container node — find the render component
    // on the entity itself or its first child that has one
    let renderE: pc.Entity | null = e.render ? e : null;
    if (!renderE) {
      e.children.forEach((child: pc.GraphNode) => {
        if (!renderE && (child as pc.Entity).render) renderE = child as pc.Entity;
      });
    }
    if (!renderE) continue;
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    drawFn(cv);
    const tex = new pc.Texture(app.graphicsDevice, {
      width: cw, height: ch, format: pc.PIXELFORMAT_SRGBA8, mipmaps: true, flipY: false,
    });
    tex.setSource(cv);
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(0, 0, 0);
    mat.useMetalness = true; mat.metalness = 0;
    mat.emissive = new pc.Color(1, 1, 1);
    mat.emissiveMap = tex; mat.emissiveIntensity = 1.4;
    mat.update();
    (renderE.render!.meshInstances[0] as any).material = mat;
    hudCount++;
  }
  hud.flag(`HUD panels: ${hudCount}/4 wired`, hudCount === 4);
});
deckAsset.on('error', (err: string) => {
  console.error('deck.glb failed to load', err);
  hud.flag('Geometry: Blender GLB (round 2)', false, 'load failed — see console');
});

/* ── exterior vessel — reveal mode. Coordinate mapping matches the three.js build:
   Blender (x,y,z) → engine (x, z, −y), same convention already shared by both engines
   (see BH_WORLD_PC below, identical value used in three.js's BH_WORLD). ── */
// Mirrored in src/app/worldline/worldline.service.ts — keep both in sync if EXT_CAM or
// setExteriorMode logic changes.
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
  exteriorRoot.enabled = exteriorMode;
  app.root.addChild(exteriorRoot);
  exteriorRoot.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });
  hud.flag('Exterior: WLV-01 vessel GLB', true);
});
exteriorAsset.on('error', (err: string) => {
  console.error('wlv01_exterior.glb failed to load', err);
  hud.flag('Exterior: WLV-01 vessel GLB', false, 'load failed');
});

/* ── exterior: key star billboard + starfield (planet removed — black hole is the backdrop) ── */

/* atmosphere rim + key star as additive billboards (canvas radial gradients) */
function glowBillboard(name: string, inner: string, mid: string, outer: string, size: number): pc.Entity {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const x = cv.getContext('2d')!;
  // three color stops with a small bright core (0→0.22) match the falloff curve
  // the three.js build gets from its Fresnel shader / 3-stop sprite gradient —
  // two stops here read as a fat wash rather than a rim glow.
  const g = x.createRadialGradient(128, 128, 4, 128, 128, 128);
  g.addColorStop(0, inner); g.addColorStop(0.22, mid); g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const tex = new pc.Texture(app.graphicsDevice, { width: 256, height: 256, format: pc.PIXELFORMAT_SRGBA8, mipmaps: true });
  tex.setSource(cv);
  const m = new pc.StandardMaterial();
  m.useLighting = false;
  m.diffuse = new pc.Color(0, 0, 0);
  m.emissive = new pc.Color(1, 1, 1);
  m.emissiveMap = tex;
  m.opacityMap = tex;
  m.blendType = pc.BLEND_ADDITIVE;
  m.depthWrite = false;
  m.update();
  const e = new pc.Entity(name);
  e.addComponent('render', { type: 'plane' });
  (e.render!.meshInstances[0] as any).material = m;
  e.setLocalScale(size, 1, size);
  e.setEulerAngles(90, 0, 0);   // pc plane defaults to facing +Y; stand it up to face the camera
  app.root.addChild(e);
  return e;
}
const keyGlow = glowBillboard('keyGlow',
  'rgba(255,236,200,1)', 'rgba(242,200,120,.45)', 'rgba(242,200,120,0)', 12);
keyGlow.setPosition(G.keyStar.x, G.keyStar.y, G.keyStar.z);

/* starfield: emissive star-map dome (idiomatic PC stand-in for point clouds) */
{
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#05060a'; x.fillRect(0, 0, 2048, 1024);
  for (let i = 0; i < G.starCount; i++) {
    const a = Math.random();
    x.fillStyle = `rgba(232,230,224,${0.2 + a * 0.8})`;
    x.fillRect(Math.random() * 2048, Math.random() * 1024, a > 0.93 ? 2.4 : 1.3, a > 0.93 ? 2.4 : 1.3);
  }
  const tex = new pc.Texture(app.graphicsDevice, { width: 2048, height: 1024, format: pc.PIXELFORMAT_SRGBA8, mipmaps: true });
  tex.setSource(cv);
  const m = new pc.StandardMaterial();
  m.useLighting = false;
  m.diffuse = new pc.Color(0, 0, 0);
  m.emissive = new pc.Color(1, 1, 1);
  m.emissiveMap = tex;
  m.cull = pc.CULLFACE_FRONT;
  m.update();
  const dome = new pc.Entity('stars');
  dome.addComponent('render', { type: 'sphere' });
  (dome.render!.meshInstances[0] as any).material = m;
  dome.setLocalScale(400, 400, 400);
  dome.setPosition(0, 0, -40);
  app.root.addChild(dome);
  (app as any)._starDome = dome;
  hud.flag('Stars: emissive dome (vs three Points)', true);
}

/* ── lighting ── */
const key = new pc.Entity('key');
key.addComponent('light', {
  type: 'directional', color: col(0xf2c878), intensity: 2.6,
  castShadows: true, shadowResolution: 1024, shadowDistance: 60,
  shadowBias: 0.05, normalOffsetBias: 0.02,
});
key.setPosition(30, 8, -18);
key.lookAt(0, 0, 0);            // directional light points along entity forward
app.root.addChild(key);
hud.flag('Shadows: PCF 1k', true);

const fill = new pc.Entity('fill');
fill.addComponent('light', { type: 'directional', color: col(0x24303e), intensity: 0.8, castShadows: false });
fill.setEulerAngles(-40, -30, 0);
app.root.addChild(fill);

/* ── post: CameraFrame disabled — postEffects (lensing) not compatible with frame passes ── */
// ACES tonemapping is already set on the camera component above.
// Bloom runs via a manual postEffects BloomEffect below, chained after the lensing pass.
hud.flag('Post: CameraFrame bloom', false, 'disabled — incompatible with postEffects lensing');

/* ── post: gravitational lensing — α = 2r_s/b (Schwarzschild weak field) ── */
// BH world pos Three.js(-6, 3, -75) matches the Blender GLB coordinate mapping.
const BH_WORLD_PC = new pc.Vec3(-6, 3, -75);
const BH_RS_WORLD  = 2.0;

const lensingShader = new pc.Shader(app.graphicsDevice, {
  attributes: { aPosition: pc.SEMANTIC_POSITION },
  vshader: `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vUv = aPosition * 0.5 + 0.5;
    }
  `,
  fshader: `
    precision mediump float;
    uniform sampler2D uColorBuffer;
    uniform vec2  uBHPos;
    uniform float uBHRadius;
    uniform float uStrength;
    uniform float uAspect;
    varying vec2 vUv;
    void main() {
      vec2 d = vec2((vUv.x - uBHPos.x) * uAspect, vUv.y - uBHPos.y);
      float dist = length(d);
      if (dist < uBHRadius * 1.5) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }
      float rs2 = uBHRadius * uBHRadius * uStrength;
      vec2 offset = 2.0 * rs2 * d / (dist * dist);
      offset.x /= uAspect;
      gl_FragColor = texture2D(uColorBuffer, clamp(vUv + offset, 0.001, 0.999));
    }
  `,
});

const lensingEffect = {
  needsDepthBuffer: false,
  bhPos:    new Float32Array([0.5, 0.5]),
  bhRadius: 0.005,
  strength: 1.0,
  aspect:   innerWidth / innerHeight,
  render(inputTarget: any, outputTarget: any, _rect: pc.Vec4) {
    const scope = app.graphicsDevice.scope;
    scope.resolve('uColorBuffer').setValue(inputTarget.colorBuffer);
    scope.resolve('uBHPos').setValue(this.bhPos);
    scope.resolve('uBHRadius').setValue(this.bhRadius);
    scope.resolve('uStrength').setValue(this.strength);
    scope.resolve('uAspect').setValue(this.aspect);
    (pc as any).drawQuadWithShader(app.graphicsDevice, outputTarget, lensingShader);
  },
};

let lensingOk = false;
try {
  camE.camera!.postEffects.addEffect(lensingEffect as any);
  lensingOk = true;
} catch (e) { console.warn('GravLensing PostEffect failed', e); }
hud.flag('Post: GR lensing (α=2r_s/b)', lensingOk, lensingOk ? '' : 'PostEffect unavailable');

// Bloom, chained after lensing so the lensed disk glow blooms too. PlayCanvas 2.x has no
// standalone BloomEffect postEffect class (real bloom lives inside CameraFrame's render-pass
// graph, incompatible with the manual postEffects lensing above) — this runs its own
// extract/blur/combine chain instead.
let bloomOk = false;
try {
  const bloom = new BloomEffect(app.graphicsDevice);
  bloom.bloomThreshold = 0.35; bloom.blurAmount = 5; bloom.bloomIntensity = 0.7;
  camE.camera!.postEffects.addEffect(bloom as any);
  bloomOk = true;
} catch (e) { console.warn('Bloom PostEffect failed', e); }
hud.flag('Post: bloom (postEffects)', bloomOk, bloomOk ? '' : 'PostEffect unavailable');

/* ── camera rig + interaction (same maths as the three build) ── */
const rig = {
  t: 0, engaged: false, animStart: 0,
  fromP: new pc.Vec3(...CAM.base.pos), fromL: new pc.Vec3(...CAM.base.look),
  px: 0, py: 0, tpx: 0, tpy: 0,
};
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
addEventListener('pointermove', e => {
  rig.tpx = (e.clientX / innerWidth - 0.5) * 2;
  rig.tpy = (e.clientY / innerHeight - 0.5) * 2;
});

// populated once deck.glb loads (see deckAsset.on('load', ...) above)
let center: Display | undefined;
const aabb = new pc.BoundingBox();
function refreshAabb() {
  if (!center) return;
  aabb.center.copy(center.e.getPosition());
  // Console_Interact (0.20 x 0.14) is much smaller than the old dash display
  // (0.98 x 0.55) it replaced as the click target — half-extents must match
  // the actual screen size or the hit-test area won't match what's visible.
  aabb.halfExtents.set(0.10, 0.07, 0.08);
}

let hover = false;
function rayHitsConsole(sx: number, sy: number): boolean {
  if (!center) return false;
  const cam = camE.camera!;
  const near = cam.screenToWorld(sx, sy, cam.nearClip);
  const far = cam.screenToWorld(sx, sy, cam.farClip);
  const dir = new pc.Vec3().sub2(far, near).normalize();
  return aabb.intersectsRay(new pc.Ray(near, dir));
}
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
  if (!center) return;
  const h = rayHitsConsole(e.clientX, e.clientY);
  if (h !== hover) {
    hover = h;
    document.body.style.cursor = h ? 'pointer' : '';
    center.mat.emissiveIntensity = h ? 2.3 : 1.6;
    center.mat.update();
  }
});
canvas.addEventListener('pointerdown', e => {
  if (center && rayHitsConsole(e.clientX, e.clientY)) setEngaged(!rig.engaged);
});
addEventListener('keydown', e => { if (e.key === 'Escape') setEngaged(false); });
hud.button('RESET CAMERA', () => setEngaged(false));

const lookTmp = new pc.Vec3(...CAM.base.look as [number, number, number]);
app.on('update', (dt: number) => {
  rig.t += dt;
  rig.px += (rig.tpx - rig.px) * 0.06;
  rig.py += (rig.tpy - rig.py) * 0.06;

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

  if (!REDUCED) {
    const dome = (app as any)._starDome as pc.Entity;
    dome.rotate(0, dt * 0.26, 0);
  }

  // Update lensing uniforms: project BH world pos to screen UV each frame
  if (lensingEffect) {
    const bhScreen = new pc.Vec3();
    camE.camera!.worldToScreen(BH_WORLD_PC, bhScreen);
    lensingEffect.bhPos[0] = bhScreen.x / innerWidth;
    lensingEffect.bhPos[1] = 1.0 - bhScreen.y / innerHeight; // flip Y: PlayCanvas Y from top

    // Project BH edge (r_s offset in X) to get screen-space radius
    const bhEdgeW = new pc.Vec3(BH_WORLD_PC.x + BH_RS_WORLD, BH_WORLD_PC.y, BH_WORLD_PC.z);
    const bhEdgeS = new pc.Vec3();
    camE.camera!.worldToScreen(bhEdgeW, bhEdgeS);
    lensingEffect.bhRadius = Math.abs((bhEdgeS.x - bhScreen.x) / innerWidth);
    lensingEffect.aspect = innerWidth / innerHeight;
  }
});
// postrender: the frame's draw calls are counted by this point (mid-'update' is too early).
app.on('postrender', () => hud.tick(app.stats.frame.dt * 1000));

app.start();
