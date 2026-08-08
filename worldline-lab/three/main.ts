/**
 * WORLDLINE bake-off — THREE.JS build of the shared cockpit spec.
 * ROUND 2: the cockpit hull is no longer procedural boxes — it's
 * shared/assets/deck.glb, modeled in Blender via the blender-mcp connection,
 * with real reference PBR values (painted-metal metalness correction, real
 * brushed-aluminum roughness, real glass IOR). Everything else — camera rig,
 * lighting, bloom, interaction — is unchanged from round 1, so fidelity/cost
 * differences are attributable to the asset, not to a re-tuned scene.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { C, G, CAM, CONSOLE, DISPLAY_LIGHT, REDUCED, drawScreen, drawEquirectEnv } from '../shared/spec';
import { drawTimeline, drawConstellation, drawJournal, drawSystem } from '../shared/content';
import { MetricsHud } from '../shared/hud';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const hud = new MetricsHud('THREE.JS', () => renderer.info.render.calls);
hud.setDevice(renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);

/* ── image-based lighting from the shared equirect painting ── */
const envCv = document.createElement('canvas');
drawEquirectEnv(envCv);
const envTex = new THREE.CanvasTexture(envCv);
envTex.mapping = THREE.EquirectangularReflectionMapping;
envTex.colorSpace = THREE.SRGBColorSpace;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromEquirectangular(envTex).texture;
scene.environmentIntensity = 0.7;
hud.flag('IBL (PMREM equirect)', true);

const camera = new THREE.PerspectiveCamera(CAM.fovDeg, innerWidth / innerHeight, 0.05, 500);

/* ── cockpit: Blender-authored GLB, real PBR materials baked in ── */
const cockpit = new THREE.Group();
scene.add(cockpit);

/* ── exterior vessel — reveal mode ── */
// Coordinate mapping: Blender (x,y,z) → Three.js (x, z, −y)
// Hero camera: Blender (−10.72, −5.62, −3.07) → Three.js (−10.72, −3.07, 5.62)
// Look target (vessel center): Blender (0.05, −11.84, 0.26) → Three.js (0.05, 0.26, 11.84)
const EXT_CAM = {
  pos:  [-10.72, -3.07,  5.62] as [number, number, number],
  look: [  0.05,  0.26, 11.84] as [number, number, number],
};
const exterior = new THREE.Group();
exterior.visible = false;
scene.add(exterior);
let exteriorMode = false;

interface Display { mesh: THREE.Mesh; cv: HTMLCanvasElement; tex: THREE.CanvasTexture; light: THREE.PointLight; }
const displays: Display[] = [];
// phase 2: the seat's headrest occludes the dash's center display from the new
// third-person camera (verified in-browser, both engines) — the interactive
// console moved to Console_Interact on the right console arm, within the
// seated figure's reach and visible past the seat. The 3 dash displays are
// now ambient-only (idle content, no hover/click).
let interactDisplay: Display | undefined;
let deckLoaded = false;

function wireDisplay(
  mesh: THREE.Mesh, title: string, lines: readonly string[],
  lightColor: number, lightPos: [number, number, number],
): Display {
  // the GLB display panels carry Blender's static emissive material; swap in a
  // canvas texture here so each screen can show live content at runtime.
  const cv = document.createElement('canvas');
  drawScreen(cv, title, lines, false);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Verified empirically (corner-marker test): Blender's plane V coordinate
  // is inverted relative to three's own PlaneGeometry; U matches already.
  tex.center.set(0.5, 0.5);
  tex.repeat.set(1, -1);
  mesh.material = new THREE.MeshStandardMaterial({
    color: 0x000000, roughness: 0.4, metalness: 0,
    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.6,
  });
  const light = new THREE.PointLight(lightColor, DISPLAY_LIGHT.intensity, DISPLAY_LIGHT.range, 2);
  light.position.set(...lightPos);
  cockpit.add(light);
  return { mesh, cv, tex, light };
}

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  new URL('../shared/assets/deck.glb', import.meta.url).href,
  gltf => {
    const root = gltf.scene;
    root.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = obj.receiveShadow = true;
      // real Blender glass -> KHR_materials_transmission round-trips through
      // GLTFLoader as MeshPhysicalMaterial already; nothing to override.
    });
    cockpit.add(root);
    const byName = (n: string) => root.getObjectByName(n) as THREE.Mesh | undefined;
    const auxL = byName('Display_Aux1'), consoleDash = byName('Display_Console'), auxR = byName('Display_Aux2');
    if (auxL) displays.push(wireDisplay(auxL, 'AUX SYS', ['NOMINAL', ''],
      C.amberHot, [G.display.xs[0], G.display.y + 0.18, G.display.z + 0.3]));
    if (consoleDash) displays.push(wireDisplay(consoleDash, 'MISSION CONSOLE', ['06 MISSIONS INDEXED', 'ARCHIVE NOMINAL'],
      C.amber, [G.display.xs[1], G.display.y + 0.18, G.display.z + 0.3]));
    if (auxR) displays.push(wireDisplay(auxR, 'AUX NAV', ['NOMINAL', ''],
      C.amberHot, [G.display.xs[2], G.display.y + 0.18, G.display.z + 0.3]));

    const interactMesh = byName('Console_Interact');
    if (interactMesh) {
      interactDisplay = wireDisplay(interactMesh, CONSOLE.idleTitle, CONSOLE.idleLines,
        C.amber, [0.62, -0.55 + 0.14 + 0.16, 0.80 - 0.24]);
      hud.flag('Interactive console: Console_Interact (arm)', true);
    } else {
      hud.flag('Interactive console: Console_Interact (arm)', false, 'mesh not found in GLB');
    }
    deckLoaded = true;
    hud.flag('Geometry: Blender GLB (round 2)', true);
    hud.flag('Glass: KHR_materials_transmission', !!byName('Deck_Glass'));

    // Wire HUD panels — same emissive canvas pattern as dash displays
    const hudDefs: [string, (cv: HTMLCanvasElement) => void, number, number][] = [
      ['HUD_Timeline',      drawTimeline,     1024, 256],
      ['HUD_Constellation', drawConstellation, 512, 768],
      ['HUD_Journal',       drawJournal,       512, 768],
      ['HUD_System',        drawSystem,        512, 512],
    ];
    let hudCount = 0;
    for (const [meshName, drawFn, cw, ch] of hudDefs) {
      const mesh = byName(meshName);
      if (!mesh) continue;
      const cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      drawFn(cv);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.center.set(0.5, 0.5); tex.repeat.set(1, -1);  // UV flip: same GLTFLoader quirk
      (mesh.material as THREE.MeshStandardMaterial) = new THREE.MeshStandardMaterial({
        color: 0x000000, roughness: 0.4, metalness: 0,
        emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.4,
        transparent: true, side: THREE.DoubleSide,
      });
      hudCount++;
    }
    hud.flag(`HUD panels: ${hudCount}/4 wired`, hudCount === 4);
  },
  undefined,
  err => {
    console.error('deck.glb failed to load', err);
    hud.flag('Geometry: Blender GLB (round 2)', false, 'load failed — see console');
  },
);

gltfLoader.load(
  new URL('../shared/assets/wlv01_exterior.glb', import.meta.url).href,
  gltf => {
    gltf.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) obj.castShadow = obj.receiveShadow = true;
    });
    exterior.add(gltf.scene);
    hud.flag('Exterior: WLV-01 vessel GLB', true);
  },
  undefined,
  err => {
    console.error('wlv01_exterior.glb failed to load', err);
    hud.flag('Exterior: WLV-01 vessel GLB', false, 'load failed');
  },
);

/* ── exterior: stars + key star (planet removed — black hole is the backdrop) ── */

const starGeo = new THREE.BufferGeometry();
{
  const pos = new Float32Array(G.starCount * 3);
  for (let i = 0; i < G.starCount; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1), r = 150 + Math.random() * 100;
    pos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    pos[i * 3 + 1] = Math.cos(ph) * r * 0.7;
    pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r - 40;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
}
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  color: C.starWhite, size: 0.9, sizeAttenuation: true,
  transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
}));
scene.add(stars);

const keyStarSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = cv.getContext('2d')!;
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,236,200,1)'); g.addColorStop(0.25, 'rgba(242,200,120,.6)');
    g.addColorStop(1, 'rgba(242,200,120,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  })(),
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
keyStarSprite.position.set(G.keyStar.x, G.keyStar.y, G.keyStar.z);
keyStarSprite.scale.setScalar(14);
scene.add(keyStarSprite);

/* ── lighting: one warm key (the distant star), planet bounce, cold fill ── */
const key = new THREE.DirectionalLight(0xf2c878, 3.2);
key.position.set(G.keyStar.x, G.keyStar.y, G.keyStar.z);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 10; key.shadow.camera.far = 80;
(key.shadow.camera as THREE.OrthographicCamera).left = -6;
(key.shadow.camera as THREE.OrthographicCamera).right = 6;
(key.shadow.camera as THREE.OrthographicCamera).top = 6;
(key.shadow.camera as THREE.OrthographicCamera).bottom = -6;
scene.add(key);
scene.add(new THREE.HemisphereLight(0x24303e, 0x0a0b0e, 0.8));   // planet-shine / hull bounce
const coolFill = new THREE.DirectionalLight(0x2a3442, 0.7);      // cold counter-fill from aft
coolFill.position.set(-4, 3, 9);
scene.add(coolFill);

/* ── post: bloom + gravitational lensing ── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Gravitational lensing post-pass: weak-field GR deflection α = 2r_s/b
// UV offset: δu = 2·r_s_screen·d / |d|²  (aspect-corrected, falls off as 1/b)
// Inside photon sphere (1.5·r_s): black — light captured by the singularity.
// BH world pos in Three.js: Blender(-6, 75, 3) → Three.js(-6, 3, -75)
const BH_WORLD  = new THREE.Vector3(-6, 3, -75);
const BH_RS_WORLD = 2.0;   // Schwarzschild radius (scene units)
const _bhNDC  = new THREE.Vector3();
const _bhEdge = new THREE.Vector3();

const lensingShader = {
  uniforms: {
    tDiffuse:   { value: null as THREE.Texture | null },
    uBHPos:     { value: new THREE.Vector2(0.5, 0.5) },  // screen UV [0,1]
    uBHRadius:  { value: 0.005 },   // event horizon radius in screen UV
    uStrength:  { value: 1.0 },     // 1.0 = physically correct α = 2r_s/b
    uAspect:    { value: innerWidth / innerHeight },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2  uBHPos;     // BH centre, screen UV
    uniform float uBHRadius;  // r_s projected to screen UV
    uniform float uStrength;  // lensing multiplier
    uniform float uAspect;    // viewport width/height
    varying vec2 vUv;

    void main() {
      // Aspect-correct distance so circles project correctly on non-square screens
      vec2 d = vec2((vUv.x - uBHPos.x) * uAspect, vUv.y - uBHPos.y);
      float dist = length(d);

      // Inside photon sphere r_ph = 1.5·r_s: pure absorption (appears black)
      float rPh = uBHRadius * 1.5;
      if (dist < rPh) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

      // Weak-field deflection: δu = 2·r_s·r_s / |d|² in aspect-corrected space
      // Source: Schwarzschild metric, α = 4GM/bc² = 2r_s/b (Einstein 1916)
      float rs2 = uBHRadius * uBHRadius * uStrength;
      vec2  offset = 2.0 * rs2 * d / (dist * dist);
      offset.x /= uAspect;   // un-correct back to UV space

      gl_FragColor = texture2D(tDiffuse, clamp(vUv + offset, 0.001, 0.999));
    }
  `,
};

const lensingPass = new ShaderPass(lensingShader);
composer.addPass(lensingPass);

const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.32, 0.65, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());
hud.flag('Post: UnrealBloom', true);
hud.flag('Post: GR lensing (α=2r_s/b)', true);
hud.flag('Shadows: PCFSoft 1k', true);

/* ── camera rig ── */
const rig = {
  t: 0, engaged: false, anim: 0, from: { p: new THREE.Vector3(), l: new THREE.Vector3() },
  pos: new THREE.Vector3(...CAM.base.pos), look: new THREE.Vector3(...CAM.base.look),
  px: 0, py: 0, tpx: 0, tpy: 0,
};
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

addEventListener('pointermove', e => {
  rig.tpx = (e.clientX / innerWidth - 0.5) * 2;
  rig.tpy = (e.clientY / innerHeight - 0.5) * 2;
});

/* ── interaction: centre console ── */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hover = false;
function setEngaged(on: boolean) {
  if (!deckLoaded || !interactDisplay || rig.engaged === on) return;
  rig.engaged = on;
  rig.anim = performance.now();
  rig.from.p.copy(rig.pos); rig.from.l.copy(rig.look);
  const d = interactDisplay;
  drawScreen(d.cv, on ? CONSOLE.engagedTitle : CONSOLE.idleTitle,
    on ? CONSOLE.engagedLines : CONSOLE.idleLines, on);
  d.tex.needsUpdate = true;
  d.light.color.set(on ? C.teal : C.amber);
}
addEventListener('pointerdown', e => {
  if (!deckLoaded || !interactDisplay) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (ray.intersectObject(interactDisplay.mesh).length) setEngaged(!rig.engaged);
});
addEventListener('pointermove', e => {
  if (!deckLoaded || !interactDisplay) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const h = ray.intersectObject(interactDisplay.mesh).length > 0;
  if (h !== hover) {
    hover = h;
    document.body.style.cursor = h ? 'pointer' : '';
    (interactDisplay.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = h ? 2.3 : 1.6;
  }
});
addEventListener('keydown', e => { if (e.key === 'Escape') setEngaged(false); });
hud.button('RESET CAMERA', () => setEngaged(false));

function setExteriorMode(on: boolean) {
  exteriorMode = on;
  cockpit.visible = !on;
  exterior.visible = on;
  // Snap camera to reveal position; animation handled in the render loop
  rig.anim = performance.now();
  rig.from.p.copy(rig.pos); rig.from.l.copy(rig.look);
  if (on) setEngaged(false);  // exit console engage if switching to exterior
}
hud.button('EXTERIOR VIEW', () => setExteriorMode(!exteriorMode));

/* ── frame loop ── */
renderer.info.autoReset = false;      // composer runs several passes; count them all
let last = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min(now - last, 50); last = now;
  renderer.info.reset();
  rig.t += dt / 1000;

  rig.px += (rig.tpx - rig.px) * 0.06;
  rig.py += (rig.tpy - rig.py) * 0.06;

  let target: { pos: [number,number,number]; look: [number,number,number] };
  if (exteriorMode) target = EXT_CAM;
  else if (rig.engaged) target = CAM.focus;
  else target = CAM.base;
  const k = REDUCED ? 1 : Math.min(1, (now - rig.anim) / CAM.transitionMs);
  const e = easeInOut(k);
  rig.pos.set(...target.pos as [number, number, number]).lerpVectors(rig.from.p,
    new THREE.Vector3(...target.pos), e);
  rig.look.lerpVectors(rig.from.l, new THREE.Vector3(...target.look), e);

  const idle = REDUCED || rig.engaged || exteriorMode ? 0 : Math.sin(rig.t * (Math.PI * 2) / CAM.idlePeriodS);
  const px = exteriorMode ? 0 : rig.px * CAM.parallax;
  const py = exteriorMode ? 0 : rig.py * CAM.parallax * 0.6;
  camera.position.set(rig.pos.x + px, rig.pos.y - py, rig.pos.z + idle * CAM.idleAmpZ);
  camera.lookAt(rig.look.x + (exteriorMode ? 0 : rig.px * 0.24), rig.look.y - (exteriorMode ? 0 : rig.py * 0.18), rig.look.z);

  if (!REDUCED) {
    stars.rotation.y += dt * 0.0000045;
  }

  // Update lensing pass: project BH world pos + r_s edge to screen UV each frame
  camera.updateMatrixWorld();
  _bhNDC.copy(BH_WORLD).project(camera);
  _bhEdge.set(BH_WORLD.x + BH_RS_WORLD, BH_WORLD.y, BH_WORLD.z).project(camera);
  lensingPass.uniforms['uBHPos'].value.set(_bhNDC.x * 0.5 + 0.5, _bhNDC.y * 0.5 + 0.5);
  lensingPass.uniforms['uBHRadius'].value = Math.abs((_bhEdge.x - _bhNDC.x) * 0.5);
  lensingPass.uniforms['uAspect'].value = innerWidth / innerHeight;

  composer.render();
  hud.tick(dt);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  lensingPass.uniforms['uAspect'].value = innerWidth / innerHeight;
});
