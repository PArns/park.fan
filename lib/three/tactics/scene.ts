/**
 * createTacticsScene — the three.js layer of Queue Tactics. Renders a park
 * plaza arena (hex board, bench, trees, string lights), procedural units,
 * and plays back the deterministic combat replay produced by
 * `lib/tactics/core/combat.ts`. It knows NOTHING about game rules — the sim
 * decided everything; this file only draws it.
 *
 * Real-world reference (per project convention "research first"): the layout
 * mirrors Teamfight Tactics' arena — 7×8 pointy-top hex board, player bench
 * strip in front, boards facing each other — dressed as a park plaza to fit
 * park.fan (string lights come on in the dark theme like a real park at
 * night).
 *
 * Public handle: resize / setTheme / setCamera / syncPlanning / highlight
 * APIs for drag & drop / playReplay / dispose. Client-only (WebGL), load
 * behind a `ssr:false` dynamic import.
 */

import * as THREE from 'three';
import {
  BENCH_SLOTS,
  BOARD_COLS,
  BOARD_ROWS,
  HALF_ROWS,
  hexToWorld,
  type Hex,
} from '@/lib/tactics/core/hex';
import type { CombatReplay } from '@/lib/tactics/core/types';
import { TICKS_PER_SECOND } from '@/lib/tactics/core/combat';
import { UNITS } from '@/lib/tactics/core/data';
import { ORIGIN_COLORS, THEMES, type ThemePalette } from './palette';
import { UnitVisual } from './units';

export type SceneTheme = 'light' | 'dark';
export type CameraPreset = 'default' | 'top' | 'side';

const HEX_SPACING = 1.04;
const BENCH_Z = -3.95;
const BENCH_SPACING = 0.82;

export interface PlanningUnitView {
  uid: string;
  defId: string;
  star: 1 | 2 | 3;
  team: 0 | 1;
  where: { kind: 'board'; hex: Hex } | { kind: 'bench'; index: number };
}

export type DropTarget = { kind: 'board'; hex: Hex } | { kind: 'bench'; index: number } | null;

export interface TacticsSceneOptions {
  theme: SceneTheme;
  onReady?: () => void;
  /** Tap on one of MY units (planning). */
  onTapUnit?: (uid: string) => void;
  /** Tap on an empty own-half hex / bench slot while something is selected. */
  onTapTarget?: (target: Exclude<DropTarget, null>) => void;
  /** Tap on nothing interactive. */
  onTapVoid?: () => void;
  /** Drag of one of my units ended over a target (null = cancelled). */
  onDrop?: (uid: string, target: DropTarget) => void;
  onReplayProgress?: (tick: number, total: number) => void;
  onReplayEnd?: () => void;
}

export interface TacticsSceneHandle {
  resize(w: number, h: number): void;
  setTheme(theme: SceneTheme): void;
  setCamera(preset: CameraPreset): void;
  /** Rebuild planning visuals (own board+bench and enemy board, global coords). */
  syncPlanning(units: PlanningUnitView[]): void;
  setSelected(uid: string | null): void;
  playReplay(replay: CombatReplay, speed: number): void;
  setReplaySpeed(speed: number): void;
  isReplaying(): boolean;
  /** Jump the running replay to its end (skip). */
  finishReplay(): void;
  dispose(): void;
}

/* ------------------------------------------------------------------ */

export function createTacticsScene(
  canvas: HTMLCanvasElement,
  opts: TacticsSceneOptions
): TacticsSceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);

  /* ---------------- lights ---------------- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 0.8);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(6, 12, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -7;
  sun.shadow.camera.right = 7;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);
  // Warm plaza lights: emissive bulbs alone don't illuminate, so two cheap
  // point lights carry the string-light glow onto the board at night.
  const plazaLightA = new THREE.PointLight(0xffc575, 0, 16, 1.8);
  plazaLightA.position.set(-3.4, 3.4, -1.2);
  const plazaLightB = new THREE.PointLight(0xffc575, 0, 16, 1.8);
  plazaLightB.position.set(3.4, 3.4, 1.6);
  scene.add(plazaLightA, plazaLightB);

  /* ---------------- board tiles ---------------- */
  const tileGeo = new THREE.CylinderGeometry(
    0.5 * HEX_SPACING * 0.95,
    0.5 * HEX_SPACING * 0.98,
    0.14,
    6
  );
  const tileMat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 });
  const tileCount = BOARD_COLS * BOARD_ROWS;
  const tiles = new THREE.InstancedMesh(tileGeo, tileMat, tileCount);
  tiles.receiveShadow = true;
  tiles.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(tileCount * 3), 3);
  const tileIndex = (c: number, r: number) => r * BOARD_COLS + c;
  {
    const m = new THREE.Matrix4();
    const rot = new THREE.Matrix4().makeRotationY(Math.PI / 6); // pointy-top
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const { x, z } = hexToWorld({ col: c, row: r }, HEX_SPACING);
        m.makeTranslation(x, -0.07, z).multiply(rot);
        tiles.setMatrixAt(tileIndex(c, r), m);
      }
    }
    tiles.instanceMatrix.needsUpdate = true;
  }
  scene.add(tiles);

  /* ---------------- bench pads ---------------- */
  const benchGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.1, 6);
  const benchMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const benchPads: THREE.Mesh[] = [];
  const benchX = (i: number) => (i - (BENCH_SLOTS - 1) / 2) * BENCH_SPACING;
  for (let i = 0; i < BENCH_SLOTS; i++) {
    const pad = new THREE.Mesh(benchGeo, benchMat);
    pad.rotation.y = Math.PI / 6;
    pad.position.set(benchX(i), -0.06, BENCH_Z);
    pad.receiveShadow = true;
    scene.add(pad);
    benchPads.push(pad);
  }

  /* ---------------- park environment ---------------- */
  const env = new THREE.Group();
  scene.add(env);
  const groundMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  {
    // Plaza island the board sits on.
    const plazaMat = new THREE.MeshStandardMaterial({ roughness: 0.95 });
    plazaMat.name = 'plaza';
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.9, 0.5, 28), plazaMat);
    plaza.position.y = -0.4;
    plaza.receiveShadow = true;
    env.add(plaza);
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(14, 15.5, 1.2, 30), groundMat);
    ground.position.y = -1.15;
    ground.receiveShadow = true;
    env.add(ground);
  }

  const treeFoliageMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const treeTrunkMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const treePositions: [number, number][] = [
    [-6.3, -3.2],
    [6.3, -3.0],
    [-6.8, 1.6],
    [6.8, 1.8],
    [-5.2, 5.4],
    [5.2, 5.6],
    [0, 6.9],
  ];
  for (const [x, z] of treePositions) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.7, 7), treeTrunkMat);
    trunk.position.y = 0.35;
    trunk.castShadow = true;
    tree.add(trunk);
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.62 - i * 0.16, 0.7, 8), treeFoliageMat);
      cone.position.y = 0.85 + i * 0.42;
      cone.castShadow = true;
      tree.add(cone);
    }
    tree.position.set(x, 0, z);
    const s = 0.9 + ((x * 7 + z * 13 + 100) % 10) / 25;
    tree.scale.setScalar(s);
    env.add(tree);
  }

  // String lights between poles around the plaza — the park-at-night touch.
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffe6b0,
    emissive: 0xffb84d,
    emissiveIntensity: 0,
    roughness: 0.4,
  });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x88919f, roughness: 0.6 });
  {
    const bulbGeo = new THREE.SphereGeometry(0.065, 6, 5);
    const polePositions: [number, number][] = [
      [-5.6, -4.4],
      [0, -5.6],
      [5.6, -4.4],
      [6.4, 0.6],
      [4.6, 5.2],
      [-4.6, 5.2],
      [-6.4, 0.6],
    ];
    const poles: THREE.Vector3[] = [];
    for (const [x, z] of polePositions) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.1, 7), poleMat);
      pole.position.set(x, 1.05, z);
      pole.castShadow = true;
      env.add(pole);
      poles.push(new THREE.Vector3(x, 2.05, z));
    }
    for (let i = 0; i < poles.length; i++) {
      const a = poles[i];
      const b = poles[(i + 1) % poles.length];
      const bulbs = 7;
      for (let k = 1; k < bulbs; k++) {
        const f = k / bulbs;
        const p = a.clone().lerp(b, f);
        p.y -= Math.sin(f * Math.PI) * 0.35; // catenary-ish sag
        const bulb = new THREE.Mesh(bulbGeo, lanternMat);
        bulb.position.copy(p);
        env.add(bulb);
      }
    }
  }

  /* ---------------- unit containers ---------------- */
  const planningGroup = new THREE.Group();
  const combatGroup = new THREE.Group();
  const fxGroup = new THREE.Group();
  scene.add(planningGroup, combatGroup, fxGroup);

  const planningVisuals = new Map<string, UnitVisual>();
  let combatVisuals = new Map<string, UnitVisual>();

  /* ---------------- theme ---------------- */
  let pal: ThemePalette = THEMES[opts.theme];
  function applyTheme(theme: SceneTheme): void {
    pal = THEMES[theme];
    scene.background = new THREE.Color(pal.skyBottom);
    scene.fog = new THREE.Fog(pal.fog, 18, 42);
    hemi.color.setHex(pal.hemiSky);
    hemi.groundColor.setHex(pal.hemiGround);
    hemi.intensity = pal.hemiIntensity;
    sun.color.setHex(pal.sun);
    sun.intensity = pal.sunIntensity;
    ambient.color.setHex(pal.ambient);
    ambient.intensity = theme === 'dark' ? 0.35 : 0.25;
    groundMat.color.setHex(pal.ground);
    (
      env.children[0] as THREE.Mesh & { material: THREE.MeshStandardMaterial }
    ).material.color.setHex(theme === 'dark' ? 0x39415a : 0xb7ac98);
    benchMat.color.setHex(pal.benchPad);
    treeFoliageMat.color.setHex(pal.treeFoliage);
    treeTrunkMat.color.setHex(pal.treeTrunk);
    lanternMat.emissiveIntensity = pal.lanternIntensity;
    const plazaGlow = pal.lanternIntensity > 0 ? 14 : 0;
    plazaLightA.intensity = plazaGlow;
    plazaLightB.intensity = plazaGlow;
    paintTiles();
  }

  /* ---------------- tile painting (hover/valid/select) ---------------- */
  let highlightHexes = new Set<string>();
  let hoverHex: Hex | null = null;
  const colOwn = new THREE.Color();
  const colEnemy = new THREE.Color();
  const colHl = new THREE.Color(0x63d68f);
  const colHover = new THREE.Color(0xffffff);
  function paintTiles(): void {
    colOwn.setHex(pal.tileOwn);
    colEnemy.setHex(pal.tileEnemy);
    const c = new THREE.Color();
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let cx = 0; cx < BOARD_COLS; cx++) {
        const own = r < HALF_ROWS;
        c.copy(own ? colOwn : colEnemy);
        if ((cx + r) % 2 === 1) c.multiplyScalar(0.93);
        const key = `${cx},${r}`;
        if (highlightHexes.has(key)) c.lerp(colHl, 0.45);
        if (hoverHex && hoverHex.col === cx && hoverHex.row === r) c.lerp(colHover, 0.35);
        tiles.setColorAt(tileIndex(cx, r), c);
      }
    }
    if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
  }

  /* ---------------- camera ---------------- */
  let aspect = 1;
  let preset: CameraPreset = 'default';
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const wantPos = new THREE.Vector3();
  const wantTarget = new THREE.Vector3();
  function presetVectors(p: CameraPreset): {
    pos: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
  } {
    const portrait = aspect < 0.9;
    const zoom = portrait ? 1.42 : 1;
    switch (p) {
      case 'top':
        return {
          pos: new THREE.Vector3(0, 13.2 * zoom, -2.6),
          target: new THREE.Vector3(0, 0, 0.1),
          fov: 44,
        };
      case 'side':
        return {
          pos: new THREE.Vector3(-8.6 * zoom, 3.2, -2.6),
          target: new THREE.Vector3(0, 0.4, 0.6),
          fov: 44,
        };
      default:
        return {
          pos: new THREE.Vector3(0, 8.4 * zoom, -7.9 * zoom),
          target: new THREE.Vector3(0, 0, -0.1),
          fov: portrait ? 50 : 46,
        };
    }
  }
  function snapCamera(): void {
    const v = presetVectors(preset);
    wantPos.copy(v.pos);
    wantTarget.copy(v.target);
    camPos.copy(v.pos);
    camTarget.copy(v.target);
    camera.fov = v.fov;
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    camera.updateProjectionMatrix();
  }

  /* ---------------- picking (math, no raycast against meshes) -------- */
  const ray = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  function pickPoint(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    ray.setFromCamera(ndc, camera);
    const p = new THREE.Vector3();
    return ray.ray.intersectPlane(groundPlane, p) ? p : null;
  }
  function worldToHex(p: THREE.Vector3): Hex | null {
    let best: Hex | null = null;
    let bestD = 0.55 * HEX_SPACING;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const { x, z } = hexToWorld({ col: c, row: r }, HEX_SPACING);
        const d = Math.hypot(p.x - x, p.z - z);
        if (d < bestD) {
          bestD = d;
          best = { col: c, row: r };
        }
      }
    }
    return best;
  }
  function worldToBench(p: THREE.Vector3): number | null {
    if (Math.abs(p.z - BENCH_Z) > 0.55) return null;
    let best: number | null = null;
    let bestD = 0.5;
    for (let i = 0; i < BENCH_SLOTS; i++) {
      const d = Math.abs(p.x - benchX(i));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }
  function unitAtPoint(p: THREE.Vector3): UnitVisual | null {
    let best: UnitVisual | null = null;
    let bestD = 0.45;
    for (const v of planningVisuals.values()) {
      if (v.info.team !== 0) continue;
      const d = Math.hypot(p.x - v.group.position.x, p.z - v.group.position.z);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  /* ---------------- planning sync ---------------- */
  const posOfPlace = (where: PlanningUnitView['where']): THREE.Vector3 => {
    if (where.kind === 'board') {
      const { x, z } = hexToWorld(where.hex, HEX_SPACING);
      return new THREE.Vector3(x, 0, z);
    }
    return new THREE.Vector3(benchX(where.index), 0, BENCH_Z);
  };

  let selectedUid: string | null = null;
  let selectRing: THREE.Mesh | null = null;

  function syncPlanning(units: PlanningUnitView[]): void {
    const seen = new Set<string>();
    for (const u of units) {
      seen.add(u.uid);
      let v = planningVisuals.get(u.uid);
      const sig = `${u.defId}|${u.star}|${u.team}`;
      if (v && (v.group.userData.sig as string) !== sig) {
        planningGroup.remove(v.group);
        v.dispose();
        v = undefined;
      }
      if (!v) {
        v = new UnitVisual({ uid: u.uid, defId: u.defId, star: u.star, team: u.team }, false);
        v.group.userData.sig = sig;
        planningGroup.add(v.group);
        planningVisuals.set(u.uid, v);
      }
      v.placeAt(posOfPlace(u.where));
    }
    for (const [uid, v] of planningVisuals) {
      if (!seen.has(uid)) {
        planningGroup.remove(v.group);
        v.dispose();
        planningVisuals.delete(uid);
      }
    }
    updateSelectRing();
  }

  function updateSelectRing(): void {
    if (!selectRing) {
      selectRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.03, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0x7fd4ff })
      );
      selectRing.rotation.x = Math.PI / 2;
      scene.add(selectRing);
    }
    const v = selectedUid ? planningVisuals.get(selectedUid) : null;
    selectRing.visible = !!v && !replay;
    if (v) {
      selectRing.position.copy(v.group.position);
      selectRing.position.y = 0.05;
    }
  }

  /* ---------------- input (tap + drag) ---------------- */
  let pointerDown = false;
  let dragging: UnitVisual | null = null;
  let downAt = { x: 0, y: 0 };
  let downUnit: UnitVisual | null = null;

  function onPointerDown(e: PointerEvent): void {
    if (replay) return;
    pointerDown = true;
    downAt = { x: e.clientX, y: e.clientY };
    const p = pickPoint(e.clientX, e.clientY);
    downUnit = p ? unitAtPoint(p) : null;
    canvas.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent): void {
    if (replay) return;
    const p = pickPoint(e.clientX, e.clientY);
    if (!pointerDown) {
      const h = p ? worldToHex(p) : null;
      const changed = JSON.stringify(h) !== JSON.stringify(hoverHex);
      hoverHex = h;
      if (changed) paintTiles();
      return;
    }
    if (!dragging && downUnit && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 12) {
      dragging = downUnit;
    }
    if (dragging && p) {
      dragging.group.position.set(p.x, 0.35, p.z);
      const h = worldToHex(p);
      const changed = JSON.stringify(h) !== JSON.stringify(hoverHex);
      hoverHex = h && h.row < HALF_ROWS ? h : null;
      if (changed) paintTiles();
    }
  }
  function onPointerUp(e: PointerEvent): void {
    if (replay) return;
    pointerDown = false;
    const p = pickPoint(e.clientX, e.clientY);
    if (dragging) {
      const uid = dragging.info.uid;
      let target: DropTarget = null;
      if (p) {
        const bench = worldToBench(p);
        const hex = worldToHex(p);
        if (bench !== null) target = { kind: 'bench', index: bench };
        else if (hex && hex.row < HALF_ROWS) target = { kind: 'board', hex };
      }
      dragging = null;
      hoverHex = null;
      paintTiles();
      opts.onDrop?.(uid, target);
      downUnit = null;
      return;
    }
    // Tap.
    if (downUnit) {
      opts.onTapUnit?.(downUnit.info.uid);
    } else if (p) {
      const bench = worldToBench(p);
      const hex = worldToHex(p);
      if (bench !== null) opts.onTapTarget?.({ kind: 'bench', index: bench });
      else if (hex && hex.row < HALF_ROWS) opts.onTapTarget?.({ kind: 'board', hex });
      else opts.onTapVoid?.();
    } else {
      opts.onTapVoid?.();
    }
    downUnit = null;
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);

  /* ---------------- FX ---------------- */
  interface Fx {
    obj: THREE.Object3D;
    update(dt: number): boolean; // false = done
  }
  const fxList: Fx[] = [];
  const fxSphereGeo = new THREE.SphereGeometry(0.07, 8, 6);
  const fxRingGeo = new THREE.TorusGeometry(0.5, 0.045, 8, 26);

  function spawnProjectile(from: THREE.Vector3, to: THREE.Vector3, color: number): void {
    const m = new THREE.Mesh(fxSphereGeo, new THREE.MeshBasicMaterial({ color }));
    m.position.copy(from).setY(0.55);
    fxGroup.add(m);
    const dur = 0.18;
    let t = 0;
    fxList.push({
      obj: m,
      update(dt) {
        t += dt / dur;
        if (t >= 1) return false;
        m.position.lerpVectors(from, to, t);
        m.position.y = 0.55 + Math.sin(t * Math.PI) * 0.35;
        return true;
      },
    });
  }
  function spawnRing(at: THREE.Vector3, color: number): void {
    const m = new THREE.Mesh(fxRingGeo, new THREE.MeshBasicMaterial({ color, transparent: true }));
    m.position.copy(at).setY(0.1);
    m.rotation.x = Math.PI / 2;
    m.scale.setScalar(0.3);
    fxGroup.add(m);
    let t = 0;
    fxList.push({
      obj: m,
      update(dt) {
        t += dt / 0.45;
        if (t >= 1) return false;
        m.scale.setScalar(0.3 + t * 1.6);
        (m.material as THREE.MeshBasicMaterial).opacity = 1 - t;
        return true;
      },
    });
  }
  function spawnHealSparkles(target: UnitVisual): void {
    const g = new THREE.Group();
    const mMat = new THREE.MeshBasicMaterial({ color: 0x7fe08f, transparent: true });
    const parts: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(fxSphereGeo, mMat);
      s.scale.setScalar(0.45);
      s.position.set(Math.sin(i * 2.4) * 0.22, 0.15 + i * 0.06, Math.cos(i * 2.4) * 0.22);
      g.add(s);
      parts.push(s);
    }
    fxGroup.add(g);
    let t = 0;
    fxList.push({
      obj: g,
      update(dt) {
        t += dt / 0.8;
        if (t >= 1) return false;
        g.position.copy(target.group.position);
        for (const p of parts) p.position.y += dt * 0.9;
        mMat.opacity = 1 - t;
        return true;
      },
    });
  }

  /* ---------------- replay playback ---------------- */
  interface ReplayState {
    replay: CombatReplay;
    time: number; // in ticks (float)
    eventIndex: number;
    speed: number;
    stunUntil: Map<string, number>;
    done: boolean;
  }
  let replay: ReplayState | null = null;

  function hexPos(h: Hex): THREE.Vector3 {
    const { x, z } = hexToWorld(h, HEX_SPACING);
    return new THREE.Vector3(x, 0, z);
  }

  function playReplay(r: CombatReplay, speed: number): void {
    clearReplay();
    planningGroup.visible = false;
    if (selectRing) selectRing.visible = false;
    combatVisuals = new Map();
    for (const s of r.spawns) {
      const v = new UnitVisual({ uid: s.uid, defId: s.defId, star: s.star, team: s.team }, true);
      v.maxHp = s.maxHp;
      v.hp = s.hp;
      v.mana = s.mana;
      v.manaMax = s.manaMax;
      v.shield = 0;
      v.setBarValues();
      v.placeAt(hexPos(s.hex));
      combatGroup.add(v.group);
      combatVisuals.set(s.uid, v);
    }
    replay = { replay: r, time: 0, eventIndex: 0, speed, stunUntil: new Map(), done: false };
  }

  function clearReplay(): void {
    for (const v of combatVisuals.values()) {
      combatGroup.remove(v.group);
      v.dispose();
    }
    combatVisuals.clear();
    for (const fx of fxList) fxGroup.remove(fx.obj);
    fxList.length = 0;
    replay = null;
    planningGroup.visible = true;
    updateSelectRing();
  }

  function processReplayEvents(upToTick: number, instant = false): void {
    if (!replay) return;
    const { replay: r } = replay;
    while (replay.eventIndex < r.events.length && r.events[replay.eventIndex].t <= upToTick) {
      const e = r.events[replay.eventIndex++];
      const v = 'uid' in e ? combatVisuals.get(e.uid) : undefined;
      const tv = 'target' in e && e.target ? combatVisuals.get(e.target) : undefined;
      switch (e.type) {
        case 'move':
          if (v) {
            if (instant) v.placeAt(hexPos(e.to));
            else v.tweenTo(hexPos(e.to), e.ticks / (TICKS_PER_SECOND * replay.speed));
          }
          break;
        case 'attack':
          if (v && tv && !instant) {
            v.lungeTowards(tv.group.position);
            if (e.projectile) {
              const def = UNITS[v.info.defId];
              const color = def ? ORIGIN_COLORS[def.origin].accent : 0xffffff;
              spawnProjectile(v.group.position.clone(), tv.group.position.clone(), color);
            }
          }
          break;
        case 'damage':
          if (tv) {
            tv.hp = e.hpAfter;
            tv.shield = e.shieldAfter;
            tv.setBarValues();
            if (!instant) tv.flash();
          }
          break;
        case 'heal':
          if (tv) {
            tv.hp = e.hpAfter;
            tv.setBarValues();
            if (!instant) spawnHealSparkles(tv);
          }
          break;
        case 'shield':
          if (tv) {
            tv.shield += e.amount;
            tv.setBarValues();
          }
          break;
        case 'mana':
          if (v) {
            v.mana = e.mana;
            v.setBarValues();
          }
          break;
        case 'cast':
          if (v && !instant) {
            v.castPulse();
            const def = UNITS[v.info.defId];
            const color = def ? ORIGIN_COLORS[def.origin].accent : 0xffffff;
            if (e.ability === 'slam' || e.ability === 'rally') spawnRing(v.group.position, color);
            else if ((e.ability === 'aoe' || e.ability === 'volley') && tv)
              spawnRing(tv.group.position, color);
            else if (tv)
              spawnProjectile(v.group.position.clone(), tv.group.position.clone(), color);
          }
          break;
        case 'stun':
          if (tv && replay) {
            replay.stunUntil.set(e.target, e.t + e.ticks);
            tv.setStunned(true);
          }
          break;
        case 'death':
          if (v) v.die();
          break;
        case 'end':
          replay.done = true;
          break;
      }
    }
  }

  /* ---------------- main loop ---------------- */
  let disposed = false;
  let raf = 0;
  const clock = new THREE.Clock();
  let elapsed = 0;

  function frame(): void {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, clock.getDelta());
    elapsed += dt;

    // Camera easing (also handles aspect-based reframe).
    const v = presetVectors(preset);
    wantPos.copy(v.pos);
    wantTarget.copy(v.target);
    camPos.lerp(wantPos, Math.min(1, dt * 4));
    camTarget.lerp(wantTarget, Math.min(1, dt * 4));
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    if (Math.abs(camera.fov - v.fov) > 0.1) {
      camera.fov += (v.fov - camera.fov) * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
    }

    // Planning visuals idle.
    if (!replay) {
      for (const u of planningVisuals.values()) u.update(dt, elapsed);
      updateSelectRing();
    }

    // Replay advance.
    if (replay && !replay.done) {
      replay.time += dt * TICKS_PER_SECOND * replay.speed;
      processReplayEvents(Math.floor(replay.time));
      opts.onReplayProgress?.(Math.min(replay.time, replay.replay.ticks), replay.replay.ticks);
      // Stun expiry.
      for (const [uid, until] of replay.stunUntil) {
        if (replay.time >= until) {
          combatVisuals.get(uid)?.setStunned(false);
          replay.stunUntil.delete(uid);
        }
      }
    }
    if (replay) {
      for (const [uid, u] of combatVisuals) {
        u.update(dt * (replay.done ? 1 : replay.speed), elapsed);
        if (u.dead) {
          combatGroup.remove(u.group);
          u.dispose();
          combatVisuals.delete(uid);
        }
      }
      if (replay.done) {
        // Let death animations finish, then hand control back.
        const anyDying = [...combatVisuals.values()].some((u) => u.dying);
        if (!anyDying) {
          const cb = opts.onReplayEnd;
          clearReplay();
          cb?.();
        }
      }
    }

    // FX.
    for (let i = fxList.length - 1; i >= 0; i--) {
      if (!fxList[i].update(dt * (replay ? replay.speed : 1))) {
        fxGroup.remove(fxList[i].obj);
        fxList.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  // Pause rendering when the tab is hidden (battery care in the queue).
  function onVisibility(): void {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (!disposed) {
      clock.getDelta();
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener('visibilitychange', onVisibility);

  applyTheme(opts.theme);
  snapCamera();
  raf = requestAnimationFrame(frame);
  queueMicrotask(() => opts.onReady?.());

  /* ---------------- handle ---------------- */
  return {
    resize(w: number, h: number) {
      renderer.setSize(w, h, false);
      // In landscape the bottom sheet (shop) covers ~1/4 of the screen, so
      // render the visible part of a virtually taller frame — the arena
      // shifts up out from under the HUD without changing the camera.
      const portrait = h > w * 1.05;
      if (portrait) {
        camera.clearViewOffset();
        aspect = w / h;
      } else {
        const fullH = h * 1.3;
        camera.setViewOffset(w, fullH, 0, 0, w, h);
        aspect = w / fullH;
      }
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    },
    setTheme(theme: SceneTheme) {
      applyTheme(theme);
    },
    setCamera(p: CameraPreset) {
      preset = p;
    },
    syncPlanning(units: PlanningUnitView[]) {
      syncPlanning(units);
    },
    setSelected(uid: string | null) {
      selectedUid = uid;
      highlightHexes = new Set();
      if (uid) {
        for (let r = 0; r < HALF_ROWS; r++) {
          for (let c = 0; c < BOARD_COLS; c++) highlightHexes.add(`${c},${r}`);
        }
      }
      paintTiles();
      updateSelectRing();
    },
    playReplay(r: CombatReplay, speed: number) {
      playReplay(r, speed);
    },
    setReplaySpeed(speed: number) {
      if (replay) replay.speed = speed;
    },
    isReplaying() {
      return replay !== null;
    },
    finishReplay() {
      if (!replay) return;
      replay.time = replay.replay.ticks + 1;
      processReplayEvents(Number.MAX_SAFE_INTEGER, true);
      const cb = opts.onReplayEnd;
      clearReplay();
      cb?.();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      clearReplay();
      for (const v of planningVisuals.values()) v.dispose();
      planningVisuals.clear();
      renderer.dispose();
    },
  };
}
