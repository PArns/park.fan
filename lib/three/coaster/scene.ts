/**
 * createCoasterScene — a small, self-contained three.js scene that runs ONE
 * coaster element (from the registry) on a meadow in front of a mountain, with
 * a transport-controlled train and three camera modes. Every glossary term that
 * has a player uses this exact factory, so the look stays consistent; only the
 * element data differs.
 *
 * Public handle: resize / setTheme / dispose plus play / pause / seek(0..1) /
 * setView('front'|'follow'|'onboard') and an onTick callback driving the UI.
 *
 * Client-only (WebGL). Load behind a `ssr:false` dynamic import.
 */

import * as THREE from 'three';
import {
  Tracker,
  createCtx,
  framesAlongCurve,
  frameAt,
  makeSkyTexture,
  buildMeadow,
  buildMountains,
  buildClouds,
  PAL,
  type CurveFrames,
} from './kit';
import { getCoasterElement, type ElementKeyPoint } from './elements';

export type CoasterView = 'front' | 'follow' | 'onboard';
export type SceneTheme = 'light' | 'dark';

export interface CoasterSceneOptions {
  element: string;
  theme: SceneTheme;
  reducedMotion?: boolean;
  view?: CoasterView;
  onReady?: () => void;
  /** Fired every frame with the current playhead (0..1) and whether it's playing. */
  onTick?: (progress: number, playing: boolean) => void;
}

export interface CoasterSceneHandle {
  resize(w: number, h: number): void;
  setTheme(theme: SceneTheme): void;
  play(): void;
  pause(): void;
  toggle(): boolean;
  seek(progress: number): void;
  setView(view: CoasterView): void;
  getProgress(): number;
  isPlaying(): boolean;
  readonly keyPoints: ElementKeyPoint[];
  readonly view: CoasterView;
  dispose(): void;
}

const DEG = Math.PI / 180;

export function createCoasterScene(
  canvas: HTMLCanvasElement,
  opts: CoasterSceneOptions
): CoasterSceneHandle {
  const def = getCoasterElement(opts.element);
  if (!def) throw new Error(`Unknown coaster element: ${opts.element}`);
  const duration = def.duration ?? 9;

  const track = new Tracker();
  const ctx = createCtx(track);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const dayFog = new THREE.Fog(0xdce8ec, 70, 200);
  const nightFog = new THREE.Fog(0x101a36, 60, 190);
  scene.fog = dayFog;

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);

  // -- Lights --------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6b7f55, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(-30, 40, 30);
  scene.add(sun);
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  // -- Sky / environment ---------------------------------------------------
  const daySky = makeSkyTexture(track, false);
  const nightSky = makeSkyTexture(track, true);
  scene.background = daySky;

  const world = new THREE.Group();
  scene.add(world);
  world.add(buildMeadow(ctx));
  world.add(buildMountains(ctx));
  const clouds = buildClouds(ctx);
  world.add(clouds.group);

  // -- Track + train -------------------------------------------------------
  const N = Math.max(150, def.points.length * 18);
  const pts = def.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const frames: CurveFrames = framesAlongCurve(pts, N, { closed: false, roll: def.roll });

  const gauge = 0.36;
  const railR = 0.12;
  const railMat = ctx.lit({ color: PAL.rail, roughness: 0.6 }, 0.22);
  const railGlow = railMat; // shared
  const left: THREE.Vector3[] = [];
  const right: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    const off = frames.rights[i].clone().multiplyScalar(gauge);
    left.push(frames.points[i].clone().add(off));
    right.push(frames.points[i].clone().sub(off));
  }
  for (const arr of [left, right]) {
    const c = new THREE.CatmullRomCurve3(arr, false, 'catmullrom', 0.5);
    const tube = new THREE.Mesh(
      ctx.track.geo(new THREE.TubeGeometry(c, N, railR, 7, false)),
      railGlow
    );
    world.add(tube);
  }
  // spine tube (centre rail box) for a chunkier, single-track read
  {
    const c = new THREE.CatmullRomCurve3(frames.points, false, 'catmullrom', 0.5);
    const spine = new THREE.Mesh(
      ctx.track.geo(new THREE.TubeGeometry(c, N, railR * 0.6, 6, false)),
      ctx.mat({ color: 0x33415a, roughness: 0.8 })
    );
    world.add(spine);
  }
  // cross-ties
  const tieMat = ctx.mat({ color: PAL.tie, roughness: 1 });
  const tieGeo = ctx.track.geo(new THREE.BoxGeometry(gauge * 2.4, 0.08, 0.18));
  for (let i = 0; i <= N; i += 4) {
    const mid = left[i].clone().add(right[i]).multiplyScalar(0.5);
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.copy(mid);
    const m = new THREE.Matrix4().makeBasis(
      frames.rights[i],
      frames.ups[i],
      frames.tangents[i].clone().negate()
    );
    tie.quaternion.setFromRotationMatrix(m);
    world.add(tie);
  }
  // support columns: low/mid structure only (skip the high apex so nothing spears the figure)
  const supMat = ctx.mat({ color: PAL.support, roughness: 1 });
  for (let i = 4; i <= N - 4; i += 9) {
    const p = frames.points[i];
    if (p.y > 1.8 && p.y < 6.5) {
      const h = p.y - 0.2;
      const col = new THREE.Mesh(
        ctx.track.geo(new THREE.CylinderGeometry(0.12, 0.16, h, 6)),
        supMat
      );
      col.position.set(p.x, h / 2, p.z);
      world.add(col);
    }
  }
  // central pylon for tall figures (loop / hill) so they read as supported
  const box = new THREE.Box3().setFromPoints(frames.points);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  if (size.y > 8) {
    const h = Math.max(2, box.min.y) + (size.y * 0.5 - box.min.y);
    const pyH = center.y - 0.5;
    const pylon = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(0.18, 0.24, pyH, 8)),
      supMat
    );
    pylon.position.set(center.x, pyH / 2, center.z - 0.6);
    world.add(pylon);
    void h;
  }

  // train
  const CARS = 4;
  const carGapT = 0.014;
  const cars: THREE.Mesh[] = [];
  const carGeo = ctx.track.geo(new THREE.BoxGeometry(gauge * 1.8, 0.5, 1.25));
  for (let k = 0; k < CARS; k++) {
    const car = new THREE.Mesh(
      carGeo,
      ctx.lit({ color: k === 0 ? PAL.carLead : PAL.car, roughness: 0.5, flatShading: false }, 0.4)
    );
    world.add(car);
    cars.push(car);
  }

  // -- Camera framing ------------------------------------------------------
  let view: CoasterView = opts.view ?? 'front';
  const frontPos = new THREE.Vector3();
  const frontTarget = center.clone();
  function computeFront(aspect: number) {
    const fovV = 50 * DEG;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * Math.max(aspect, 0.6));
    // Frame the ELEMENT, not the long approach track: drive distance from the
    // height + a capped horizontal window so the figure fills the frame.
    const halfV = Math.max(size.y, 6) / 2 + 1.4;
    const halfH = Math.min(Math.max(size.x, 8), 16) / 2 + 1;
    const dist = Math.max(halfV / Math.tan(fovV / 2), halfH / Math.tan(fovH / 2)) * 1.12 + size.z;
    frontPos.set(center.x, center.y, center.z + dist);
    frontTarget.copy(center);
  }
  computeFront(1.6);

  // -- Animation state -----------------------------------------------------
  const reduced = !!opts.reducedMotion;
  let progress = 0;
  let playing = !reduced;
  // start a reduced-motion frame at the most illustrative key-point
  if (reduced) {
    const apex =
      def.keyPoints.find((k) => /invert|airtime|celest/i.test(k.label)) ??
      def.keyPoints[Math.floor(def.keyPoints.length / 2)];
    progress = apex ? apex.t : 0.5;
  }

  // scratch
  const f0 = {
    pos: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    up: new THREE.Vector3(),
    right: new THREE.Vector3(),
  };
  const carBasis = new THREE.Matrix4();
  const _lookM = new THREE.Matrix4();
  const _quat = new THREE.Quaternion();
  const desiredPos = new THREE.Vector3();
  const desiredUp = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const _side = new THREE.Vector3();
  const _wup = new THREE.Vector3(0, 1, 0);
  let camStarted = false;

  function placeTrain() {
    for (let k = 0; k < CARS; k++) {
      const t = THREE.MathUtils.clamp(progress - k * carGapT, 0, 1);
      frameAt(frames, t, f0);
      cars[k].position.copy(f0.pos).addScaledVector(f0.up, 0.26);
      carBasis.makeBasis(f0.right, f0.up, f0.tangent.clone().negate());
      cars[k].quaternion.setFromRotationMatrix(carBasis);
    }
  }

  function updateCamera(snap: boolean) {
    // lead car frame drives follow / onboard
    frameAt(frames, progress, f0);
    if (view === 'front') {
      desiredPos.copy(frontPos);
      desiredUp.set(0, 1, 0);
      lookTarget.copy(frontTarget);
    } else if (view === 'follow') {
      // 3/4 chase from behind + above + to one side, in WORLD up (stable through
      // inversions); the horizontal tangent keeps it from going edge-on.
      desiredUp.set(0, 1, 0);
      const fwdH = tmp.set(f0.tangent.x, 0, f0.tangent.z);
      if (fwdH.lengthSq() < 0.04) fwdH.set(0, 0, 1);
      fwdH.normalize();
      _side.set(fwdH.z, 0, -fwdH.x); // horizontal perpendicular
      desiredPos
        .copy(f0.pos)
        .addScaledVector(fwdH, -6.5)
        .addScaledVector(_side, 3.2)
        .addScaledVector(_wup, 3.4);
      lookTarget.copy(f0.pos).addScaledVector(fwdH, 1.5);
    } else {
      // onboard — sit at the front seat (ahead of the lead car centre), look
      // forward; up rolls with the frame so the view inverts through the figure.
      desiredUp.copy(f0.up);
      desiredPos.copy(f0.pos).addScaledVector(f0.up, 0.5).addScaledVector(f0.tangent, 0.5);
      lookTarget.copy(f0.pos).addScaledVector(f0.tangent, 7).addScaledVector(f0.up, 0.15);
    }
    // Matrix4.lookAt uses the CAMERA convention (-z faces the target); building
    // the quaternion this way avoids the inverted facing a plain Object3D.lookAt
    // would give.
    _lookM.lookAt(desiredPos, lookTarget, desiredUp);
    _quat.setFromRotationMatrix(_lookM);
    if (snap || !camStarted) {
      camera.position.copy(desiredPos);
      camera.quaternion.copy(_quat);
      camStarted = true;
    } else {
      const k = view === 'front' ? 0.12 : 0.5;
      camera.position.lerp(desiredPos, k);
      camera.quaternion.slerp(_quat, k);
    }
  }

  // -- Theme ----------------------------------------------------------------
  function applyTheme(theme: SceneTheme) {
    const night = theme === 'dark';
    scene.background = night ? nightSky : daySky;
    scene.fog = night ? nightFog : dayFog;
    hemi.intensity = night ? 0.35 : 0.9;
    hemi.color.set(night ? 0x223052 : 0xffffff);
    hemi.groundColor.set(night ? 0x0c1428 : 0x6b7f55);
    sun.intensity = night ? 0.55 : 2.0;
    sun.color.set(night ? 0x9fb4e0 : 0xffffff);
    ambient.intensity = night ? 0.18 : 0.35;
    renderer.toneMappingExposure = night ? 0.95 : 1.0;
  }
  applyTheme(opts.theme);

  // -- Render loop ----------------------------------------------------------
  let raf = 0;
  let last = performance.now();
  let disposed = false;
  let readyFired = false;

  function renderFrame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (playing && !reduced) {
      progress += dt / duration;
      if (progress >= 1) progress -= 1; // loop (restart)
    }
    clouds.update(now / 1000);
    placeTrain();
    updateCamera(false);
    renderer.render(scene, camera);
    opts.onTick?.(progress, playing);
    if (!readyFired) {
      readyFired = true;
      opts.onReady?.();
    }
    if (!disposed && !reduced) raf = requestAnimationFrame(renderFrame);
  }

  // initial placement + first render
  placeTrain();
  updateCamera(true);
  renderer.render(scene, camera);
  if (reduced) {
    requestAnimationFrame(() => opts.onReady?.());
  } else {
    raf = requestAnimationFrame(renderFrame);
  }

  // -- Handle ---------------------------------------------------------------
  return {
    keyPoints: def.keyPoints,
    get view() {
      return view;
    },
    resize(w: number, h: number) {
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      computeFront(camera.aspect);
      if (view === 'front') updateCamera(true);
    },
    setTheme(theme: SceneTheme) {
      applyTheme(theme);
      if (reduced) renderer.render(scene, camera);
    },
    play() {
      if (reduced || playing) return;
      playing = true;
      last = performance.now();
      raf = requestAnimationFrame(renderFrame);
    },
    pause() {
      playing = false;
    },
    toggle() {
      if (playing) this.pause();
      else this.play();
      return playing;
    },
    seek(p: number) {
      progress = THREE.MathUtils.clamp(p, 0, 1);
      placeTrain();
      updateCamera(!playing); // snap when paused/scrubbing, ease while playing
      if (!playing || reduced) renderer.render(scene, camera);
      opts.onTick?.(progress, playing);
    },
    setView(v: CoasterView) {
      view = v;
      camStarted = false; // re-seat the camera cleanly on the new view
      if (!playing || reduced) {
        updateCamera(true);
        renderer.render(scene, camera);
      }
    },
    getProgress() {
      return progress;
    },
    isPlaying() {
      return playing;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      track.dispose();
      renderer.dispose();
    },
  };
}
