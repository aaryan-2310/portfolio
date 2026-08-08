import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import * as pc from 'playcanvas';
import { C, G, CAM, CONSOLE, DISPLAY_LIGHT, REDUCED, drawScreen, drawEquirectEnv } from './spec';
import { drawTimeline, drawConstellation, drawJournal, drawSystem } from './content';

interface Display {
  e: pc.Entity;
  cv: HTMLCanvasElement;
  tex: pc.Texture;
  mat: pc.StandardMaterial;
  light: pc.Entity;
}

@Injectable({ providedIn: 'root' })
export class WorldlineService implements OnDestroy {
  private app: pc.Application | null = null;
  private pointerMoveFn?: (e: PointerEvent) => void;
  private pointerDownFn?: (e: PointerEvent) => void;
  private keyDownFn?: (e: KeyboardEvent) => void;
  private resizeFn?: () => void;

  private readonly zone = inject(NgZone);

  constructor() {}

  init(canvas: HTMLCanvasElement): void {
    // All WebGL + RAF work runs outside Angular's zone — no spurious CD per frame
    this.zone.runOutsideAngular(() => this._bootstrap(canvas));
  }

  destroy(): void {
    if (!this.app) return;
    this.pointerMoveFn && window.removeEventListener('pointermove', this.pointerMoveFn);
    this.pointerDownFn && window.removeEventListener('pointerdown', this.pointerDownFn);
    this.keyDownFn && window.removeEventListener('keydown', this.keyDownFn);
    this.resizeFn && window.removeEventListener('resize', this.resizeFn);
    this.app.destroy();
    this.app = null;
  }

  ngOnDestroy(): void { this.destroy(); }

  private _bootstrap(canvas: HTMLCanvasElement): void {
    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      graphicsDeviceOptions: { antialias: true, alpha: false },
    });
    this.app = app;
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.graphicsDevice.maxPixelRatio = Math.min(devicePixelRatio, 2);

    this.resizeFn = () => app.resizeCanvas();
    window.addEventListener('resize', this.resizeFn);

    const col = (hex: number) =>
      new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

    // IBL
    try {
      const envCv = document.createElement('canvas');
      drawEquirectEnv(envCv);
      const envTex = new pc.Texture(app.graphicsDevice, {
        width: envCv.width, height: envCv.height, format: pc.PIXELFORMAT_RGBA8, mipmaps: false,
      });
      envTex.setSource(envCv);
      const lighting = pc.EnvLighting.generateLightingSource(envTex);
      const atlas = pc.EnvLighting.generateAtlas(lighting);
      app.scene.envAtlas = atlas;
      app.scene.skyboxIntensity = 0.5;
    } catch (e) { console.warn('IBL setup failed', e); }

    // Camera
    const camE = new pc.Entity('camera');
    camE.addComponent('camera', {
      clearColor: new pc.Color(0.02, 0.023, 0.04),
      fov: CAM.fovDeg, nearClip: 0.05, farClip: 500,
    });
    try { (camE.camera as any).toneMapping = (pc as any).TONEMAP_ACES; } catch { /* noop */ }
    app.root.addChild(camE);
    camE.camera!.requestSceneColorMap(true);

    // Deck GLB
    const displays: Display[] = [];
    let deckLoaded = false;
    let center: Display | undefined;

    const wireDisplay = (
      entity: pc.Entity, title: string, lines: readonly string[],
      lightColor: pc.Color, lightPos: [number, number, number],
    ): Display => {
      const cv = document.createElement('canvas');
      drawScreen(cv, title, lines, false);
      const tex = new pc.Texture(app.graphicsDevice, {
        width: cv.width, height: cv.height, format: pc.PIXELFORMAT_SRGBA8, mipmaps: true, flipY: false,
      });
      tex.setSource(cv);
      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0, 0, 0);
      mat.useMetalness = true; mat.metalness = 0; mat.gloss = 0.6;
      mat.emissive = new pc.Color(1, 1, 1);
      mat.emissiveMap = tex; mat.emissiveIntensity = 1.6;
      mat.update();
      (entity.render!.meshInstances[0] as any).material = mat;
      const light = new pc.Entity('dlight-' + title);
      light.addComponent('light', {
        type: 'omni', color: lightColor,
        intensity: DISPLAY_LIGHT.intensity, range: DISPLAY_LIGHT.range, castShadows: false,
      });
      light.setPosition(...lightPos);
      app.root.addChild(light);
      return { e: entity, cv, tex, mat, light };
    };

    const deckAsset = new pc.Asset('deck', 'container', { url: '/assets/worldline/deck.glb' });
    app.assets.add(deckAsset);
    app.assets.load(deckAsset);
    deckAsset.on('load', () => {
      const root = (deckAsset.resource as pc.ContainerResource).instantiateRenderEntity();
      app.root.addChild(root);
      root.findComponents('render').forEach((r: any) => { r.castShadows = true; r.receiveShadows = true; });

      const find = (n: string) => root.findByName(n) as pc.Entity | null;
      const auxL = find('Display_Aux1'), cDash = find('Display_Console'), auxR = find('Display_Aux2');
      if (auxL) displays.push(wireDisplay(auxL, 'AUX SYS', ['NOMINAL', ''],
        col(C.amberHot), [G.display.xs[0], G.display.y + 0.18, G.display.z + 0.3]));
      if (cDash) displays.push(wireDisplay(cDash, 'MISSION CONSOLE', ['06 MISSIONS INDEXED', 'ARCHIVE NOMINAL'],
        col(C.amber), [G.display.xs[1], G.display.y + 0.18, G.display.z + 0.3]));
      if (auxR) displays.push(wireDisplay(auxR, 'AUX NAV', ['NOMINAL', ''],
        col(C.amberHot), [G.display.xs[2], G.display.y + 0.18, G.display.z + 0.3]));

      const interactE = find('Console_Interact');
      if (interactE) {
        center = wireDisplay(interactE, CONSOLE.idleTitle, CONSOLE.idleLines,
          col(C.amber), [0.62, -0.55 + 0.14 + 0.16, 0.80 - 0.24]);
        aabb.center.copy(center.e.getPosition());
        aabb.halfExtents.set(0.10, 0.07, 0.08);
      }
      deckLoaded = true;

      const hudDefs: [string, (cv: HTMLCanvasElement) => void, number, number][] = [
        ['HUD_Timeline',      drawTimeline,      1024, 256],
        ['HUD_Constellation', drawConstellation,  512, 768],
        ['HUD_Journal',       drawJournal,        512, 768],
        ['HUD_System',        drawSystem,         512, 512],
      ];
      for (const [meshName, drawFn, cw, ch] of hudDefs) {
        const e = find(meshName);
        if (!e) continue;
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
      }
    });

    // Key star billboard
    const buildBillboard = (
      name: string, inner: string, mid: string, outer: string, size: number,
    ): pc.Entity => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      const x = cv.getContext('2d')!;
      const g = x.createRadialGradient(128, 128, 4, 128, 128, 128);
      g.addColorStop(0, inner); g.addColorStop(0.22, mid); g.addColorStop(1, outer);
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      const tex = new pc.Texture(app.graphicsDevice, { width: 256, height: 256, format: pc.PIXELFORMAT_SRGBA8, mipmaps: true });
      tex.setSource(cv);
      const m = new pc.StandardMaterial();
      m.useLighting = false; m.diffuse = new pc.Color(0, 0, 0);
      m.emissive = new pc.Color(1, 1, 1); m.emissiveMap = tex; m.opacityMap = tex;
      m.blendType = pc.BLEND_ADDITIVE; m.depthWrite = false; m.update();
      const e = new pc.Entity(name);
      e.addComponent('render', { type: 'plane' });
      (e.render!.meshInstances[0] as any).material = m;
      e.setLocalScale(size, 1, size); e.setEulerAngles(90, 0, 0);
      app.root.addChild(e);
      return e;
    };
    const keyGlow = buildBillboard('keyGlow',
      'rgba(255,236,200,1)', 'rgba(242,200,120,.45)', 'rgba(242,200,120,0)', 12);
    keyGlow.setPosition(G.keyStar.x, G.keyStar.y, G.keyStar.z);

    // Starfield dome
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
      m.useLighting = false; m.diffuse = new pc.Color(0, 0, 0);
      m.emissive = new pc.Color(1, 1, 1); m.emissiveMap = tex;
      m.cull = pc.CULLFACE_FRONT; m.update();
      const dome = new pc.Entity('stars');
      dome.addComponent('render', { type: 'sphere' });
      (dome.render!.meshInstances[0] as any).material = m;
      dome.setLocalScale(400, 400, 400); dome.setPosition(0, 0, -40);
      app.root.addChild(dome);
      (app as any)._starDome = dome;
    }

    // Lights
    const key = new pc.Entity('key');
    key.addComponent('light', {
      type: 'directional', color: col(0xf2c878), intensity: 2.6,
      castShadows: true, shadowResolution: 1024, shadowDistance: 60,
      shadowBias: 0.05, normalOffsetBias: 0.02,
    });
    key.setPosition(30, 8, -18); key.lookAt(0, 0, 0);
    app.root.addChild(key);
    const fill = new pc.Entity('fill');
    fill.addComponent('light', { type: 'directional', color: col(0x24303e), intensity: 0.8, castShadows: false });
    fill.setEulerAngles(-40, -30, 0);
    app.root.addChild(fill);

    // GR lensing post-effect
    const BH_WORLD = new pc.Vec3(-6, 3, -75);
    const BH_RS = 2.0;
    const lensingShader = new pc.Shader(app.graphicsDevice, {
      attributes: { aPosition: pc.SEMANTIC_POSITION },
      vshader: `attribute vec2 aPosition;varying vec2 vUv;
        void main(){gl_Position=vec4(aPosition,0.,1.);vUv=aPosition*.5+.5;}`,
      fshader: `precision mediump float;uniform sampler2D uColorBuffer;
        uniform vec2 uBHPos;uniform float uBHRadius,uStrength,uAspect;varying vec2 vUv;
        void main(){vec2 d=vec2((vUv.x-uBHPos.x)*uAspect,vUv.y-uBHPos.y);float dist=length(d);
          if(dist<uBHRadius*1.5){gl_FragColor=vec4(0,0,0,1);return;}
          float rs2=uBHRadius*uBHRadius*uStrength;
          vec2 off=2.*rs2*d/(dist*dist);off.x/=uAspect;
          gl_FragColor=texture2D(uColorBuffer,clamp(vUv+off,.001,.999));}`,
    });
    const lensing = {
      needsDepthBuffer: false,
      bhPos: new Float32Array([0.5, 0.5]),
      bhRadius: 0.005, strength: 1.0, aspect: canvas.width / canvas.height,
      render(inp: any, out: any, _rect: pc.Vec4) { // eslint-disable-line @typescript-eslint/no-unused-vars
        const s = app.graphicsDevice.scope;
        s.resolve('uColorBuffer').setValue(inp.colorBuffer);
        s.resolve('uBHPos').setValue(this.bhPos);
        s.resolve('uBHRadius').setValue(this.bhRadius);
        s.resolve('uStrength').setValue(this.strength);
        s.resolve('uAspect').setValue(this.aspect);
        (pc as any).drawQuadWithShader(app.graphicsDevice, out, lensingShader);
      },
    };
    try { camE.camera!.postEffects.addEffect(lensing as any); } catch (e) { console.warn('lensing failed', e); }

    // Camera rig
    const rig = {
      t: 0, engaged: false, animStart: 0,
      fromP: new pc.Vec3(...CAM.base.pos as [number,number,number]),
      fromL: new pc.Vec3(...CAM.base.look as [number,number,number]),
      px: 0, py: 0, tpx: 0, tpy: 0,
    };
    const easeInOut = (k: number) => k < 0.5 ? 4*k*k*k : 1 - Math.pow(-2*k+2,3)/2;
    const aabb = new pc.BoundingBox();
    const lookTmp = new pc.Vec3(...CAM.base.look as [number,number,number]);

    const rayHitsConsole = (sx: number, sy: number): boolean => {
      if (!center) return false;
      const cam = camE.camera!;
      const near = cam.screenToWorld(sx, sy, cam.nearClip);
      const far = cam.screenToWorld(sx, sy, cam.farClip);
      const dir = new pc.Vec3().sub2(far, near).normalize();
      return aabb.intersectsRay(new pc.Ray(near, dir));
    };

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
      rig.tpx = (e.clientX / innerWidth - 0.5) * 2;
      rig.tpy = (e.clientY / innerHeight - 0.5) * 2;
      if (!center) return;
      const h = rayHitsConsole(e.clientX, e.clientY);
      document.body.style.cursor = h ? 'pointer' : '';
      if (center) { center.mat.emissiveIntensity = h ? 2.3 : 1.6; center.mat.update(); }
    };
    this.pointerDownFn = (e: PointerEvent) => {
      if (center && rayHitsConsole(e.clientX, e.clientY)) setEngaged(!rig.engaged);
    };
    this.keyDownFn = (e: KeyboardEvent) => { if (e.key === 'Escape') setEngaged(false); };
    window.addEventListener('pointermove', this.pointerMoveFn);
    window.addEventListener('pointerdown', this.pointerDownFn);
    window.addEventListener('keydown', this.keyDownFn);

    const bhScreen = new pc.Vec3();
    const bhEdgeW = new pc.Vec3();
    const bhEdgeS = new pc.Vec3();

    app.on('update', (dt: number) => {
      rig.t += dt;
      rig.px += (rig.tpx - rig.px) * 0.06;
      rig.py += (rig.tpy - rig.py) * 0.06;

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

      if (!REDUCED) {
        const dome = (app as any)._starDome as pc.Entity;
        dome?.rotate(0, dt * 0.26, 0);
      }

      // Update lensing uniforms
      camE.camera!.worldToScreen(BH_WORLD, bhScreen);
      lensing.bhPos[0] = bhScreen.x / innerWidth;
      lensing.bhPos[1] = 1.0 - bhScreen.y / innerHeight;
      bhEdgeW.set(BH_WORLD.x + BH_RS, BH_WORLD.y, BH_WORLD.z);
      camE.camera!.worldToScreen(bhEdgeW, bhEdgeS);
      lensing.bhRadius = Math.abs((bhEdgeS.x - bhScreen.x) / innerWidth);
      lensing.aspect = innerWidth / innerHeight;
    });

    app.on('postrender', () => { /* no HUD in production */ });
    app.start();
  }
}
