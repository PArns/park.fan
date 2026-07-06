/**
 * Procedural low-poly unit figures for Queue Tactics — no external assets.
 *
 * V2: every figure is a small RIG — torso, head with eyes, two arms on
 * shoulder pivots, a weapon in hand — driven by an animation state machine
 * (idle breathing, walk swing, attack with anticipation + strike, two-hand
 * cast pose, fall-over death). Flat-shaded for a chunky toy-box look.
 *
 * The CLASS shapes silhouette + weapon (tower shield & mace / sabre / bow /
 * crystal staff / medic pack), the ORIGIN (theme-park land) colours it and
 * adds headgear, the COST tints the base ring, the STAR level scales it and
 * adds pips. All animation here is cosmetic — the sim already decided
 * everything.
 */

import * as THREE from 'three';
import { UNITS } from '@/lib/tactics/core/data';
import { CLASS_ACCENTS, COST_COLORS, ORIGIN_COLORS } from './palette';

const geoCache = new Map<string, THREE.BufferGeometry>();
const matCache = new Map<string, THREE.MeshStandardMaterial>();

function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g as T;
}

function mat(
  color: number,
  opts: { emissive?: number; metal?: number; rough?: number; opacity?: number } = {}
): THREE.MeshStandardMaterial {
  const key = `${color}|${opts.emissive ?? 0}|${opts.metal ?? 0.12}|${opts.rough ?? 0.8}|${opts.opacity ?? 1}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      metalness: opts.metal ?? 0.12,
      roughness: opts.rough ?? 0.8,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissive ? 0.75 : 0,
      transparent: (opts.opacity ?? 1) < 1,
      opacity: opts.opacity ?? 1,
    });
    matCache.set(key, m);
  }
  return m;
}

function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const me = new THREE.Mesh(g, m);
  me.position.set(x, y, z);
  me.castShadow = true;
  return me;
}

/* ------------------------------------------------------------------ */
/* Rig construction                                                    */
/* ------------------------------------------------------------------ */

interface Rig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  /** Emissive mesh that flares while casting (staff crystal / gem). */
  focus: THREE.Mesh | null;
}

function buildArm(side: -1 | 1, skin: THREE.Material, sleeve: THREE.Material): THREE.Group {
  const arm = new THREE.Group();
  const upper = mesh(
    geo('arm', () => new THREE.CylinderGeometry(0.035, 0.03, 0.2, 6)),
    sleeve,
    0,
    -0.09,
    0
  );
  const hand = mesh(
    geo('hand', () => new THREE.SphereGeometry(0.042, 6, 5)),
    skin,
    0,
    -0.2,
    0
  );
  hand.name = 'hand';
  arm.add(upper, hand);
  arm.rotation.z = side * 0.16; // slight natural splay
  return arm;
}

function handOf(arm: THREE.Group): THREE.Object3D {
  return arm.getObjectByName('hand') ?? arm;
}

function buildRig(defId: string): Rig {
  const def = UNITS[defId];
  const origin = def?.origin ?? 'beasts';
  const clazz = def?.clazz ?? 'duelist';
  const oc = ORIGIN_COLORS[origin] ?? ORIGIN_COLORS.beasts;

  const ghostly = origin === 'spirits';
  const bodyMat = ghostly
    ? mat(oc.body, { emissive: oc.emissive, opacity: 0.85, rough: 0.4 })
    : mat(oc.body);
  const accentMat = mat(oc.accent, { metal: 0.5, rough: 0.35 });
  const classMat = mat(CLASS_ACCENTS[clazz] ?? 0xffffff, { metal: 0.55, rough: 0.3 });
  const skinMat =
    origin === 'robots'
      ? mat(0xaab6c2, { metal: 0.6, rough: 0.35 })
      : ghostly
        ? mat(0xd8d2ff, { emissive: 0x8a7fe0, opacity: 0.88, rough: 0.3 })
        : mat(0xe8c9a8, { rough: 0.6 });
  const darkMat = mat(0x23272f, { rough: 0.5 });

  const root = new THREE.Group();
  const torso = new THREE.Group();
  root.add(torso);
  const robed = clazz === 'mystic' || clazz === 'support';
  let focus: THREE.Mesh | null = null;

  /* ---- lower body ---- */
  if (robed) {
    torso.add(
      mesh(
        geo('robe', () => new THREE.ConeGeometry(0.19, 0.42, 8)),
        bodyMat,
        0,
        0.21,
        0
      )
    );
    torso.add(
      mesh(
        geo('robe-trim', () => new THREE.TorusGeometry(0.145, 0.02, 5, 10)),
        accentMat,
        0,
        0.14,
        0
      )
    );
  } else {
    for (const side of [-1, 1] as const) {
      torso.add(
        mesh(
          geo('leg', () => new THREE.CylinderGeometry(0.045, 0.055, 0.14, 6)),
          darkMat,
          side * 0.07,
          0.07,
          0
        )
      );
    }
  }

  /* ---- torso ---- */
  const bulky = clazz === 'guardian';
  const chest = mesh(
    geo(bulky ? 'chest-b' : 'chest', () =>
      bulky
        ? new THREE.CylinderGeometry(0.15, 0.2, 0.3, 8)
        : new THREE.CylinderGeometry(0.11, 0.15, 0.28, 8)
    ),
    bodyMat,
    0,
    robed ? 0.5 : 0.29,
    0
  );
  torso.add(chest);
  torso.add(
    mesh(
      geo('belt', () => new THREE.TorusGeometry(0.13, 0.022, 5, 10)),
      accentMat,
      0,
      robed ? 0.42 : 0.19,
      0
    )
  );
  if (bulky) {
    for (const side of [-1, 1] as const) {
      torso.add(
        mesh(
          geo('pauldron', () => new THREE.SphereGeometry(0.085, 7, 6)),
          classMat,
          side * 0.17,
          robed ? 0.62 : 0.42,
          0
        )
      );
    }
  }

  /* ---- head + face ---- */
  const head = new THREE.Group();
  head.position.y = robed ? 0.72 : 0.52;
  head.add(
    mesh(
      geo('head', () => new THREE.SphereGeometry(0.105, 9, 7)),
      skinMat,
      0,
      0,
      0
    )
  );
  for (const side of [-1, 1] as const) {
    head.add(
      mesh(
        geo('eye', () => new THREE.SphereGeometry(0.018, 5, 4)),
        darkMat,
        side * 0.042,
        0.015,
        0.092
      )
    );
  }
  torso.add(head);

  /* ---- origin headgear ---- */
  switch (origin) {
    case 'pirates': {
      head.add(
        mesh(
          geo('p-hat1', () => new THREE.CylinderGeometry(0.125, 0.15, 0.045, 8)),
          darkMat,
          0,
          0.085,
          0
        )
      );
      head.add(
        mesh(
          geo('p-hat2', () => new THREE.CylinderGeometry(0.055, 0.095, 0.075, 8)),
          darkMat,
          0,
          0.14,
          0
        )
      );
      head.add(
        mesh(
          geo('p-band', () => new THREE.TorusGeometry(0.09, 0.014, 4, 10)),
          accentMat,
          0,
          0.1,
          0
        )
      );
      break;
    }
    case 'royals': {
      const gold = mat(0xe3c35a, { metal: 0.85, rough: 0.25 });
      head.add(
        mesh(
          geo('ry-crown', () => new THREE.CylinderGeometry(0.085, 0.065, 0.06, 8)),
          gold,
          0,
          0.125,
          0
        )
      );
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        head.add(
          mesh(
            geo('ry-spike', () => new THREE.ConeGeometry(0.016, 0.045, 4)),
            gold,
            Math.cos(a) * 0.07,
            0.165,
            Math.sin(a) * 0.07
          )
        );
      }
      break;
    }
    case 'robots': {
      head.add(
        mesh(
          geo('rb-ant', () => new THREE.CylinderGeometry(0.011, 0.011, 0.11, 5)),
          mat(0x666f7a, { metal: 0.7 }),
          0,
          0.15,
          0
        )
      );
      head.add(
        mesh(
          geo('rb-tip', () => new THREE.SphereGeometry(0.024, 6, 5)),
          mat(0x37d0c4, { emissive: 0x2aa89e }),
          0,
          0.21,
          0
        )
      );
      head.add(
        mesh(
          geo('rb-visor', () => new THREE.BoxGeometry(0.14, 0.035, 0.02)),
          mat(0x37d0c4, { emissive: 0x1d7d76, rough: 0.3 }),
          0,
          0.015,
          0.095
        )
      );
      break;
    }
    case 'spirits': {
      const halo = mesh(
        geo('sp-halo', () => new THREE.TorusGeometry(0.095, 0.013, 5, 14)),
        mat(0xbcf3ff, { emissive: 0x9adfef, rough: 0.2 }),
        0,
        0.15,
        0
      );
      halo.rotation.x = Math.PI / 2.2;
      head.add(halo);
      break;
    }
    default: {
      for (const side of [-1, 1] as const) {
        const ear = mesh(
          geo('b-ear', () => new THREE.ConeGeometry(0.04, 0.11, 5)),
          bodyMat,
          side * 0.075,
          0.11,
          0
        );
        ear.rotation.z = side * -0.32;
        head.add(ear);
      }
    }
  }

  /* ---- arms + class weapons ---- */
  const armL = buildArm(-1, skinMat, bodyMat);
  const armR = buildArm(1, skinMat, bodyMat);
  const shoulderY = robed ? 0.62 : 0.42;
  armL.position.set(-0.15, shoulderY, 0);
  armR.position.set(0.15, shoulderY, 0);
  torso.add(armL, armR);

  switch (clazz) {
    case 'guardian': {
      // Tower shield (left) + mace (right).
      const shield = mesh(
        geo('g-shield', () => new THREE.CylinderGeometry(0.13, 0.155, 0.32, 6)),
        classMat,
        -0.02,
        -0.02,
        0.06
      );
      shield.rotation.x = Math.PI / 2;
      handOf(armL).add(shield);
      const mace = new THREE.Group();
      mace.add(
        mesh(
          geo('g-mace-h', () => new THREE.CylinderGeometry(0.016, 0.016, 0.26, 5)),
          darkMat,
          0,
          0.06,
          0
        )
      );
      mace.add(
        mesh(
          geo('g-mace-k', () => new THREE.DodecahedronGeometry(0.055)),
          classMat,
          0,
          0.21,
          0
        )
      );
      handOf(armR).add(mace);
      break;
    }
    case 'duelist': {
      const sabre = new THREE.Group();
      sabre.add(
        mesh(
          geo('d-blade', () => new THREE.BoxGeometry(0.026, 0.34, 0.05)),
          classMat,
          0,
          0.2,
          0
        )
      );
      sabre.add(
        mesh(
          geo('d-guard', () => new THREE.TorusGeometry(0.035, 0.011, 4, 8)),
          accentMat,
          0,
          0.035,
          0
        )
      );
      sabre.add(
        mesh(
          geo('d-tip', () => new THREE.ConeGeometry(0.024, 0.06, 4)),
          classMat,
          0,
          0.4,
          0
        )
      );
      handOf(armR).add(sabre);
      break;
    }
    case 'ranger': {
      const bow = new THREE.Group();
      const arc = mesh(
        geo('r-bow', () => new THREE.TorusGeometry(0.17, 0.016, 5, 12, Math.PI * 1.2)),
        mat(0x8a5a2e, { rough: 0.6 }),
        0,
        0,
        0
      );
      arc.rotation.z = -Math.PI * 0.1;
      const stringM = mesh(
        geo('r-string', () => new THREE.CylinderGeometry(0.005, 0.005, 0.3, 3)),
        mat(0xd8d2c8, { rough: 0.4 }),
        -0.05,
        0,
        0
      );
      bow.add(arc, stringM);
      bow.rotation.y = Math.PI / 2;
      handOf(armL).add(bow);
      torso.add(
        mesh(
          geo('r-quiver', () => new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6)),
          accentMat,
          -0.11,
          robed ? 0.55 : 0.35,
          -0.11
        )
      );
      break;
    }
    case 'mystic': {
      const staff = new THREE.Group();
      staff.add(
        mesh(
          geo('m-staff', () => new THREE.CylinderGeometry(0.014, 0.018, 0.52, 5)),
          mat(0x8a6a42, { rough: 0.7 }),
          0,
          0.14,
          0
        )
      );
      focus = mesh(
        geo('m-crystal', () => new THREE.OctahedronGeometry(0.055)),
        mat(0x9fd4ff, { emissive: 0x5aa9e8, rough: 0.25 }).clone(),
        0,
        0.45,
        0
      );
      staff.add(focus);
      handOf(armR).add(staff);
      break;
    }
    default: {
      // support — medic pack + short gem rod.
      torso.add(
        mesh(
          geo('s-pack', () => new THREE.CylinderGeometry(0.075, 0.075, 0.18, 8)),
          accentMat,
          0,
          robed ? 0.52 : 0.32,
          -0.14
        )
      );
      const rod = new THREE.Group();
      rod.add(
        mesh(
          geo('s-rod', () => new THREE.CylinderGeometry(0.013, 0.013, 0.3, 5)),
          mat(0x8a6a42, { rough: 0.7 }),
          0,
          0.08,
          0
        )
      );
      focus = mesh(
        geo('s-gem', () => new THREE.OctahedronGeometry(0.045)),
        mat(0x9ee6a5, { emissive: 0x4faf62, rough: 0.25 }).clone(),
        0,
        0.26,
        0
      );
      rod.add(focus);
      handOf(armR).add(rod);
      break;
    }
  }

  return { root, torso, head, armL, armR, focus };
}

function buildMinionRig(): Rig {
  const root = new THREE.Group();
  const torso = new THREE.Group();
  root.add(torso);
  const darkMat = mat(0x23272f, { rough: 0.5 });
  torso.add(
    mesh(
      geo('mn-body', () => new THREE.SphereGeometry(0.2, 9, 7)),
      mat(0xc9566a, { rough: 0.5 }),
      0,
      0.42,
      0
    )
  );
  torso.add(
    mesh(
      geo('mn-knot', () => new THREE.ConeGeometry(0.04, 0.06, 6)),
      mat(0x8c3b4a),
      0,
      0.2,
      0
    )
  );
  const head = new THREE.Group();
  head.position.y = 0.42;
  for (const side of [-1, 1] as const) {
    head.add(
      mesh(
        geo('eye', () => new THREE.SphereGeometry(0.018, 5, 4)),
        darkMat,
        side * 0.06,
        0.04,
        0.17
      )
    );
  }
  torso.add(head);
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  torso.add(armL, armR);
  return { root, torso, head, armL, armR, focus: null };
}

/* ------------------------------------------------------------------ */
/* Status bar sprite (canvas texture)                                  */
/* ------------------------------------------------------------------ */

class StatusBar {
  readonly sprite: THREE.Sprite;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private last = '';

  constructor(team: 0 | 1) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 96;
    this.canvas.height = 26;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false });
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(0.62, 0.17, 1);
    this.sprite.renderOrder = 10;
    this.draw(1, 0, 0, team);
  }

  draw(hpPct: number, shieldPct: number, manaPct: number, team: 0 | 1): void {
    const key = `${hpPct.toFixed(2)}|${shieldPct.toFixed(2)}|${manaPct.toFixed(2)}|${team}`;
    if (key === this.last) return;
    this.last = key;
    const c = this.ctx;
    const W = 96;
    c.clearRect(0, 0, W, 26);
    c.fillStyle = 'rgba(8,10,16,0.78)';
    c.fillRect(0, 0, W, 22);
    c.fillStyle =
      team === 0
        ? hpPct > 0.5
          ? '#46c46e'
          : hpPct > 0.25
            ? '#d9b13b'
            : '#d9534f'
        : hpPct > 0.5
          ? '#e05252'
          : '#a83232';
    c.fillRect(2, 2, (W - 4) * Math.max(0, Math.min(1, hpPct)), 11);
    if (shieldPct > 0) {
      c.fillStyle = 'rgba(235,240,255,0.92)';
      c.fillRect(2, 2, (W - 4) * Math.min(1, shieldPct), 4);
    }
    c.fillStyle = '#1d2634';
    c.fillRect(2, 14, W - 4, 6);
    c.fillStyle = '#4da3e8';
    c.fillRect(2, 14, (W - 4) * Math.max(0, Math.min(1, manaPct)), 6);
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
    (this.sprite.material as THREE.SpriteMaterial).dispose();
  }
}

/* ------------------------------------------------------------------ */
/* UnitVisual                                                          */
/* ------------------------------------------------------------------ */

export interface UnitVisualInfo {
  defId: string;
  star: 1 | 2 | 3;
  team: 0 | 1;
  uid: string;
}

/**
 * One placed figure: base ring + rigged body + status bar, plus the cosmetic
 * animation state machine the replay player drives.
 */
export class UnitVisual {
  readonly group: THREE.Group;
  readonly info: UnitVisualInfo;
  private rig: Rig;
  private starScale: number;
  private bar: StatusBar | null = null;
  private bobPhase: number;
  private attackT = 0;
  private attackLunge = new THREE.Vector3();
  private isRanged: boolean;
  private flashT = 0;
  private castT = 0;
  private dyingT = -1;
  private stunned = false;
  private stunSpin: THREE.Mesh | null = null;
  private flashables: THREE.MeshStandardMaterial[] = [];
  maxHp = 1;
  hp = 1;
  shield = 0;
  mana = 0;
  manaMax = 0;
  private moveFrom = new THREE.Vector3();
  private moveTo = new THREE.Vector3();
  private moveT = 1;
  private moveDur = 1;

  constructor(info: UnitVisualInfo, withBar: boolean) {
    this.info = info;
    this.group = new THREE.Group();
    this.bobPhase =
      (info.uid.charCodeAt(0) * 31 + info.uid.charCodeAt(info.uid.length - 1) * 7) % 100;

    const def = UNITS[info.defId];
    const isMinion = !def;
    this.isRanged = (def?.range ?? 1) > 1;

    const cost = def?.cost ?? 1;
    const ring = new THREE.Mesh(
      geo('base-ring', () => new THREE.TorusGeometry(0.3, 0.035, 8, 24)),
      mat(isMinion ? 0x555b66 : COST_COLORS[cost], { metal: 0.5, rough: 0.35 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    this.group.add(ring);

    const disc = new THREE.Mesh(
      geo('base-disc', () => new THREE.CylinderGeometry(0.29, 0.31, 0.04, 20)),
      mat(info.team === 0 ? 0x2f3d55 : 0x4a2f33, { rough: 0.85 })
    );
    disc.position.y = 0.02;
    disc.receiveShadow = true;
    this.group.add(disc);

    this.rig = isMinion ? buildMinionRig() : buildRig(info.defId);
    this.starScale = info.star === 1 ? 1.15 : info.star === 2 ? 1.3 : 1.48;
    this.rig.root.scale.setScalar(this.starScale);
    this.group.add(this.rig.root);

    if (!isMinion && info.star > 1) {
      const pipMat = mat(info.star === 2 ? 0xc7d3e6 : 0xf2c14e, {
        emissive: info.star === 2 ? 0x7787a3 : 0xd99b1d,
        metal: 0.6,
        rough: 0.3,
      });
      for (let i = 0; i < info.star; i++) {
        const pip = new THREE.Mesh(
          geo('star-pip', () => new THREE.OctahedronGeometry(0.035)),
          pipMat
        );
        pip.position.set((i - (info.star - 1) / 2) * 0.11, 0.98 * this.starScale, 0);
        this.group.add(pip);
      }
    }

    if (withBar) {
      this.bar = new StatusBar(info.team);
      this.bar.sprite.position.y = 1.08 * this.starScale;
      this.group.add(this.bar.sprite);
    }

    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
        this.flashables.push(o.material);
      }
    });

    this.group.rotation.y = info.team === 0 ? 0 : Math.PI;
  }

  setBarValues(): void {
    this.bar?.draw(
      this.hp / Math.max(1, this.maxHp),
      this.shield / Math.max(1, this.maxHp),
      this.manaMax > 0 ? this.mana / this.manaMax : 0,
      this.info.team
    );
  }

  placeAt(p: THREE.Vector3): void {
    this.group.position.copy(p);
    this.moveT = 1;
  }

  tweenTo(p: THREE.Vector3, durationSec: number): void {
    this.moveFrom.copy(this.group.position);
    this.moveTo.copy(p);
    this.moveT = 0;
    this.moveDur = Math.max(0.05, durationSec);
  }

  lungeTowards(p: THREE.Vector3): void {
    this.attackLunge.copy(p).sub(this.group.position).setY(0);
    if (this.attackLunge.lengthSq() > 0.0001) this.attackLunge.normalize();
    this.attackT = 0.001;
    this.group.rotation.y = Math.atan2(this.attackLunge.x, this.attackLunge.z);
  }

  flash(): void {
    this.flashT = 0.001;
  }

  castPulse(): void {
    this.castT = 0.001;
  }

  setStunned(on: boolean): void {
    if (on === this.stunned) return;
    this.stunned = on;
    if (on && !this.stunSpin) {
      const spin = new THREE.Mesh(
        geo('stun-ring', () => new THREE.TorusGeometry(0.16, 0.02, 6, 14)),
        mat(0xf2d14e, { emissive: 0xd9b13b, rough: 0.3 })
      );
      spin.position.y = 0.9 * this.starScale;
      spin.rotation.x = Math.PI / 2.5;
      this.stunSpin = spin;
      this.group.add(spin);
    }
    if (this.stunSpin) this.stunSpin.visible = on;
  }

  die(): void {
    if (this.dyingT < 0) this.dyingT = 0;
  }

  get dead(): boolean {
    return this.dyingT >= 1;
  }

  get dying(): boolean {
    return this.dyingT >= 0 && this.dyingT < 1;
  }

  /** Per-frame cosmetic update. */
  update(dt: number, elapsed: number): boolean {
    const { torso, armL, armR, head, focus } = this.rig;

    // Movement tween with a light hop.
    let walking = false;
    if (this.moveT < 1) {
      walking = true;
      this.moveT = Math.min(1, this.moveT + dt / this.moveDur);
      const e = this.moveT;
      this.group.position.lerpVectors(this.moveFrom, this.moveTo, e);
      this.group.position.y = Math.sin(e * Math.PI) * 0.1;
      if (this.moveT >= 1) this.group.position.y = 0;
      const d = this.moveTo.clone().sub(this.moveFrom).setY(0);
      if (d.lengthSq() > 0.001) this.group.rotation.y = Math.atan2(d.x, d.z);
    }

    if (this.dyingT < 0) {
      if (walking) {
        const swing = Math.sin(elapsed * 14 + this.bobPhase);
        armL.rotation.x = swing * 0.6;
        armR.rotation.x = -swing * 0.6;
        torso.rotation.z = swing * 0.05;
      } else if (this.attackT === 0 && this.castT === 0) {
        // Idle: breathing + gentle arm sway + head look-around.
        const b = Math.sin(elapsed * 2.1 + this.bobPhase);
        torso.position.y = b * 0.015;
        torso.rotation.z = 0;
        armL.rotation.x = b * 0.07;
        armR.rotation.x = -b * 0.07;
        head.rotation.y = Math.sin(elapsed * 0.6 + this.bobPhase) * 0.22;
      }
      if (this.stunSpin?.visible) this.stunSpin.rotation.z = elapsed * 6;
    }

    // Attack: anticipation (wind back) → strike (swing through) → recover.
    if (this.attackT > 0) {
      this.attackT += dt * 4.5;
      const t = this.attackT;
      if (t >= 1) {
        this.attackT = 0;
        armR.rotation.x = 0;
        armL.rotation.x = 0;
        torso.position.x = 0;
        torso.position.z = 0;
      } else if (this.isRanged) {
        // Raise bow arm, draw the string hand back, release.
        const k = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
        armL.rotation.x = -1.1;
        armR.rotation.x = -0.4 - k * 0.5;
      } else {
        const wind = t < 0.35 ? t / 0.35 : 0;
        const strike =
          t >= 0.35 && t < 0.65 ? (t - 0.35) / 0.3 : t >= 0.65 ? 1 - (t - 0.65) / 0.35 : 0;
        armR.rotation.x = wind * 0.9 - strike * 2.1;
        const lungeK = Math.sin(Math.min(1, t / 0.65) * Math.PI) * 0.14;
        torso.position.x = this.attackLunge.x * lungeK;
        torso.position.z = this.attackLunge.z * lungeK;
      }
    }

    // Cast: both arms up, focus crystal flares.
    if (this.castT > 0) {
      this.castT += dt * 2.8;
      const t = this.castT;
      if (t >= 1) {
        this.castT = 0;
        armL.rotation.x = 0;
        armR.rotation.x = 0;
        if (focus) {
          (focus.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.75;
        }
      } else {
        const k = Math.sin(t * Math.PI);
        armL.rotation.x = -k * 2.3;
        armR.rotation.x = -k * 2.3;
        if (focus) {
          (focus.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.75 + k * 2.2;
        }
      }
    }

    // Hit flash — clone materials lazily so we never mutate the shared cache.
    if (this.flashT > 0) {
      if (!this.clonedMats) this.cloneMaterials();
      this.flashT += dt * 7;
      const k = this.flashT >= 1 ? 0 : 1 - this.flashT;
      for (const m of this.flashables) {
        m.emissiveIntensity = Math.max((m.userData.baseEmissive as number) ?? 0, k * 0.9);
      }
      if (this.flashT >= 1) {
        this.flashT = 0;
        for (const m of this.flashables) {
          m.emissiveIntensity = (m.userData.baseEmissive as number) ?? 0;
        }
      }
    }

    // Death: keel over backwards, sink a little, fade out.
    if (this.dyingT >= 0 && this.dyingT < 1) {
      this.dyingT = Math.min(1, this.dyingT + dt * 1.5);
      const t = this.dyingT;
      this.rig.root.rotation.x = -Math.min(1, t * 1.6) * (Math.PI / 2.2);
      this.group.position.y = -0.25 * t;
      this.group.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
          const m = (o as THREE.Mesh).material as THREE.Material & { opacity: number };
          if (m && 'opacity' in m) {
            m.transparent = true;
            m.opacity = Math.min(m.opacity, 1 - t * 0.85);
          }
        }
      });
      return this.dyingT < 1;
    }
    return true;
  }

  private clonedMats = false;
  private cloneMaterials(): void {
    this.clonedMats = true;
    const cloned: THREE.MeshStandardMaterial[] = [];
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
        const c = o.material.clone();
        c.userData.baseEmissive = c.emissiveIntensity;
        if (c.emissive.getHex() === 0) c.emissive.setHex(0xffffff);
        o.material = c;
        cloned.push(c);
        if (this.rig.focus === o) this.rig.focus = o as THREE.Mesh;
      }
    });
    this.flashables = cloned;
  }

  dispose(): void {
    this.bar?.dispose();
    if (this.clonedMats) for (const m of this.flashables) m.dispose();
    // The casting focus material is cloned per figure even before a flash.
    if (!this.clonedMats && this.rig.focus) {
      (this.rig.focus.material as THREE.Material).dispose();
    }
  }
}
