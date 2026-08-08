/**
 * WORLDLINE bake-off — shared scene contract.
 *
 * Every engine prototype builds THIS scene, from THESE numbers.
 * If a prototype deviates (an engine can't express something), it must
 * say so in its on-screen HUD flags and in the decision record.
 *
 * Scene: a spacecraft cockpit at night.
 *  - PBR metals with varied roughness (floor, dash, pillars, overhead beam)
 *  - three emissive instrument displays; each CASTS light on nearby metal
 *  - glass viewport with a planet outside, lower right
 *  - starfield + one bright distant star (key light source)
 *  - idle camera dolly; pointer parallax
 *  - ONE interactive console (center display): hover highlights,
 *    click flies the camera in (cinematic transition), Esc/click returns
 *  - bloom post-processing; ACES-style tonemapping
 *  - reduced-motion: no idle dolly, instant camera cuts
 */

/** palette — warm instrumentation emerging from darkness */
export const C = {
  amber: 0xd9a648,
  amberHot: 0xf2c878,
  teal: 0x5fb8a8,          // console "engaged" state
  hullDark: 0x14161c,
  hullMid: 0x2a2e38,
  planet: 0x36414f,
  starWhite: 0xe8e6e0,
} as const;

/** cockpit geometry (metres-ish) */
export const G = {
  floor:   { w: 6.0, h: 0.1, d: 4.0, y: -1.05, z: -0.6, rough: 0.5,  metal: 0.85 },
  dash:    { w: 4.4, h: 0.5, d: 0.9, y: -0.58, z: -1.55, tiltX: -0.21, rough: 0.35, metal: 0.9 },
  pillar:  { w: 0.35, h: 3.0, d: 0.5, x: 2.55, y: 0.2, z: -1.25, leanZ: 0.14, rough: 0.55, metal: 0.8 },
  beam:    { w: 5.0, h: 0.25, d: 0.4, y: 1.52, z: -1.0, rough: 0.4, metal: 0.9 },
  glass:   { w: 5.6, h: 2.6, y: 0.42, z: -2.05, tiltX: 0.07 },
  display: { w: 0.98, h: 0.55, y: -0.22, z: -1.24, tiltX: -0.26, xs: [-1.5, 0, 1.5] },
  planet:  { r: 14, x: 9.5, y: -3.2, z: -46 },
  keyStar: { x: 30, y: 8, z: -18 },   // camera-side of the planet → lit crescent faces us
  starCount: 3000,
} as const;

/** camera rig */
export const CAM = {
  fovDeg: 58,
  // third-person: behind and above where the seat goes (phase 2), looking
  // over the observer's shoulder toward the window. Revisit once the seat
  // mesh exists — this is judged by eye, not derived from a formula.
  base:  { pos: [0, 0.55, 3.4], look: [0, 0.42, -2.6] },
  // close-up on Console_Interact (right console arm, web pos [0.62,-0.25,0.56]) —
  // updated when the interactive console moved off the dash in phase 2.
  focus: { pos: [0.62, 0.05, 1.15], look: [0.62, -0.20, 0.40] },
  idleAmpZ: 0.18, idlePeriodS: 14, parallax: 0.06,
  transitionMs: 1600,
} as const;

/** display light: each screen is backed by a point light of this strength */
export const DISPLAY_LIGHT = { intensity: 0.55, range: 1.7 } as const;

/** what the center console shows in each state */
export const CONSOLE = {
  idleTitle: 'MISSION CONSOLE',
  idleLines: ['06 MISSIONS INDEXED', 'ARCHIVE NOMINAL', '▸ SELECT TO ENGAGE'],
  engagedTitle: 'MISSION 002 — JOB HUNT',
  engagedLines: ['GEMINI PARSE · 95%', 'KAFKA LAG · 0 MS', 'STATUS · ACTIVE'],
} as const;

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** draw an instrument screen into a 2d canvas — identical for every engine */
export function drawScreen(
  cv: HTMLCanvasElement, title: string, lines: readonly string[], engaged = false,
): void {
  const x = cv.getContext('2d')!;
  const W = (cv.width = 512), H = (cv.height = 288);
  x.fillStyle = '#07080b';
  x.fillRect(0, 0, W, H);
  const col = engaged ? '#6fd0bd' : '#d9a648';
  x.strokeStyle = col; x.globalAlpha = 0.9; x.lineWidth = 3;
  x.strokeRect(10, 10, W - 20, H - 20);
  x.globalAlpha = 0.25;
  for (let y = 26; y < H - 14; y += 8) { x.beginPath(); x.moveTo(14, y); x.lineTo(W - 14, y); x.stroke(); }
  x.globalAlpha = 1;
  x.fillStyle = col;
  x.font = '700 34px Consolas, monospace';
  x.fillText(title, 28, 62);
  x.font = '26px Consolas, monospace';
  lines.forEach((l, i) => x.fillText(l, 28, 122 + i * 46));
  x.fillStyle = engaged ? 'rgba(111,208,189,.14)' : 'rgba(217,166,72,.12)';
  x.fillRect(10, 10, W - 20, H - 20);
}

/** equirect environment (for IBL + reflections) — same painting per engine */
export function drawEquirectEnv(cv: HTMLCanvasElement): void {
  const x = cv.getContext('2d')!;
  const W = (cv.width = 1024), H = (cv.height = 512);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#05060a'); g.addColorStop(0.55, '#0a0c12');
  g.addColorStop(0.72, '#1a1410'); g.addColorStop(0.78, '#3a2a14');
  g.addColorStop(0.82, '#1a1410'); g.addColorStop(1, '#05060a');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // warm key-star hotspot
  const r = x.createRadialGradient(W * 0.72, H * 0.38, 4, W * 0.72, H * 0.38, 130);
  r.addColorStop(0, 'rgba(255,220,160,1)'); r.addColorStop(0.2, 'rgba(242,200,120,.5)');
  r.addColorStop(1, 'rgba(242,200,120,0)');
  x.fillStyle = r; x.fillRect(0, 0, W, H);
  // stars
  for (let i = 0; i < 900; i++) {
    const a = Math.random();
    x.fillStyle = `rgba(232,230,224,${0.25 + a * 0.7})`;
    x.fillRect(Math.random() * W, Math.random() * H * 0.7, a > 0.92 ? 2 : 1, a > 0.92 ? 2 : 1);
  }
}
