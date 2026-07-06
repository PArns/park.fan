/**
 * Procedural low-poly unit figures for Queue Tactics — no external assets.
 * The CLASS shapes the silhouette (tank, blade fighter, archer, caster,
 * support bot), the ORIGIN (theme-park land) colours it and adds headgear,
 * the COST tints the base ring, the STAR level scales it and adds pips.
 *
 * Every figure exposes animation primitives (bob / lunge / flash / cast /
 * sink) used by the replay player; all animation here is cosmetic — the sim
 * has already decided everything.
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
  const key = `${color}|${opts.emissive ?? 0}|${opts.metal ?? 0.15}|${opts.rough ?? 0.75}|${opts.opacity ?? 1}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      metalness: opts.metal ?? 0.15,
      roughness: opts.rough ?? 0.75,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissive ? 0.7 : 0,
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
/* Figure construction                                                 */
/* ------------------------------------------------------------------ */

function buildBody(clazz: string, origin: string): THREE.Group {
  const g = new THREE.Group();
  const oc = ORIGIN_COLORS[origin] ?? ORIGIN_COLORS.beasts;
  const bodyMat =
    origin === 'spirits'
      ? mat(oc.body, { emissive: oc.emissive, opacity: 0.82, rough: 0.4 })
      : mat(oc.body);
  const accentMat = mat(oc.accent, { metal: 0.45, rough: 0.4 });
  const classMat = mat(CLASS_ACCENTS[clazz] ?? 0xffffff, { metal: 0.55, rough: 0.35 });

  switch (clazz) {
    case 'guardian': {
      // Broad, armoured cone body + kite shield.
      g.add(
        mesh(
          geo('g-body', () => new THREE.CylinderGeometry(0.16, 0.26, 0.42, 8)),
          bodyMat,
          0,
          0.28,
          0
        )
      );
      g.add(
        mesh(
          geo('g-pauld', () => new THREE.SphereGeometry(0.1, 8, 6)),
          accentMat,
          -0.2,
          0.46,
          0
        )
      );
      g.add(
        mesh(
          geo('g-pauld', () => new THREE.SphereGeometry(0.1, 8, 6)),
          accentMat,
          0.2,
          0.46,
          0
        )
      );
      const shield = mesh(
        geo('g-shield', () => new THREE.CylinderGeometry(0.16, 0.11, 0.34, 6)),
        classMat,
        0.24,
        0.3,
        0.14
      );
      shield.rotation.x = Math.PI / 2.3;
      g.add(shield);
      break;
    }
    case 'duelist': {
      // Slim body, forward stance, one long blade.
      g.add(
        mesh(
          geo('d-body', () => new THREE.CylinderGeometry(0.11, 0.16, 0.44, 8)),
          bodyMat,
          0,
          0.3,
          0
        )
      );
      g.add(
        mesh(
          geo('d-belt', () => new THREE.TorusGeometry(0.13, 0.025, 6, 12)),
          accentMat,
          0,
          0.32,
          0
        )
      );
      const blade = mesh(
        geo('d-blade', () => new THREE.BoxGeometry(0.035, 0.42, 0.07)),
        classMat,
        0.2,
        0.36,
        0.1
      );
      blade.rotation.z = -0.5;
      blade.rotation.x = 0.35;
      g.add(blade);
      const hilt = mesh(
        geo('d-hilt', () => new THREE.BoxGeometry(0.09, 0.03, 0.03)),
        accentMat,
        0.14,
        0.24,
        0.05
      );
      hilt.rotation.z = -0.5;
      g.add(hilt);
      break;
    }
    case 'ranger': {
      // Slender + cloak hint + bow arc.
      g.add(
        mesh(
          geo('r-body', () => new THREE.CylinderGeometry(0.12, 0.17, 0.42, 8)),
          bodyMat,
          0,
          0.29,
          0
        )
      );
      g.add(
        mesh(
          geo('r-quiver', () => new THREE.CylinderGeometry(0.045, 0.045, 0.22, 6)),
          accentMat,
          -0.13,
          0.42,
          -0.1
        )
      );
      const bow = mesh(
        geo('r-bow', () => new THREE.TorusGeometry(0.2, 0.02, 6, 14, Math.PI * 1.15)),
        mat(0x8a5a2e, { rough: 0.6 }),
        0.19,
        0.34,
        0.06
      );
      bow.rotation.y = Math.PI / 2;
      bow.rotation.z = Math.PI / 2 - 0.6;
      g.add(bow);
      break;
    }
    case 'mystic': {
      // Robe cone + floating orb.
      g.add(
        mesh(
          geo('m-robe', () => new THREE.ConeGeometry(0.2, 0.5, 9)),
          bodyMat,
          0,
          0.25,
          0
        )
      );
      g.add(
        mesh(
          geo('m-trim', () => new THREE.TorusGeometry(0.155, 0.02, 6, 12)),
          accentMat,
          0,
          0.18,
          0
        )
      );
      const orb = mesh(
        geo('m-orb', () => new THREE.SphereGeometry(0.06, 10, 8)),
        mat(0xbfe6ff, { emissive: 0x77bbee, rough: 0.2 }),
        0.2,
        0.5,
        0.08
      );
      orb.name = 'orb';
      g.add(orb);
      break;
    }
    default: {
      // support — rounded helper bot / medic with staff.
      g.add(
        mesh(
          geo('s-body', () => new THREE.SphereGeometry(0.18, 10, 8)),
          bodyMat,
          0,
          0.28,
          0
        )
      );
      g.add(
        mesh(
          geo('s-belly', () => new THREE.SphereGeometry(0.1, 8, 6)),
          accentMat,
          0,
          0.24,
          0.11
        )
      );
      const staff = mesh(
        geo('s-staff', () => new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6)),
        mat(0x8a6a42),
        0.2,
        0.32,
        0
      );
      staff.rotation.z = -0.15;
      g.add(staff);
      g.add(
        mesh(
          geo('s-gem', () => new THREE.OctahedronGeometry(0.06)),
          mat(0x9ee6a5, { emissive: 0x4faf62, rough: 0.3 }),
          0.235,
          0.58,
          0
        )
      );
      break;
    }
  }

  // Head + origin headgear.
  const headY = clazz === 'mystic' ? 0.56 : 0.58;
  const head = mesh(
    geo('head', () => new THREE.SphereGeometry(0.11, 10, 8)),
    origin === 'robots'
      ? mat(0xaab6c2, { metal: 0.6, rough: 0.35 })
      : mat(0xe8c9a8, { rough: 0.6 }),
    0,
    headY,
    0
  );
  if (origin === 'spirits')
    head.material = mat(0xd8d2ff, { emissive: 0x8a7fe0, opacity: 0.85, rough: 0.3 });
  g.add(head);

  switch (origin) {
    case 'pirates': {
      const hat = mesh(
        geo('p-hat', () => new THREE.CylinderGeometry(0.13, 0.16, 0.05, 8)),
        mat(0x2f2a26),
        0,
        headY + 0.09,
        0
      );
      g.add(hat);
      g.add(
        mesh(
          geo('p-hat2', () => new THREE.CylinderGeometry(0.06, 0.1, 0.07, 8)),
          mat(0x2f2a26),
          0,
          headY + 0.14,
          0
        )
      );
      break;
    }
    case 'royals': {
      const crown = mesh(
        geo('ry-crown', () => new THREE.CylinderGeometry(0.09, 0.07, 0.07, 8)),
        mat(0xe3c35a, { metal: 0.8, rough: 0.25 }),
        0,
        headY + 0.12,
        0
      );
      g.add(crown);
      break;
    }
    case 'robots': {
      const ant = mesh(
        geo('rb-ant', () => new THREE.CylinderGeometry(0.012, 0.012, 0.12, 5)),
        mat(0x666f7a, { metal: 0.7 }),
        0,
        headY + 0.14,
        0
      );
      g.add(ant);
      g.add(
        mesh(
          geo('rb-tip', () => new THREE.SphereGeometry(0.025, 6, 5)),
          mat(0x37d0c4, { emissive: 0x2aa89e }),
          0,
          headY + 0.21,
          0
        )
      );
      break;
    }
    case 'spirits': {
      const halo = mesh(
        geo('sp-halo', () => new THREE.TorusGeometry(0.1, 0.014, 6, 16)),
        mat(0xbcf3ff, { emissive: 0x9adfef, rough: 0.2 }),
        0,
        headY + 0.14,
        0
      );
      halo.rotation.x = Math.PI / 2;
      g.add(halo);
      break;
    }
    default: {
      // beasts — two ears.
      for (const side of [-1, 1]) {
        const ear = mesh(
          geo('b-ear', () => new THREE.ConeGeometry(0.045, 0.12, 6)),
          mat(0x6d8f3e),
          side * 0.08,
          headY + 0.12,
          0
        );
        ear.rotation.z = side * -0.3;
        g.add(ear);
      }
    }
  }
  return g;
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
    // HP
    c.fillStyle =
      team === 0 ? (hpPct > 0.5 ? '#46c46e' : hpPct > 0.25 ? '#d9b13b' : '#d9534f') : '#d9534f';
    if (team === 1) c.fillStyle = hpPct > 0.5 ? '#e05252' : '#a83232';
    c.fillRect(2, 2, (W - 4) * Math.max(0, Math.min(1, hpPct)), 11);
    // Shield overlays on top of HP
    if (shieldPct > 0) {
      c.fillStyle = 'rgba(235,240,255,0.92)';
      c.fillRect(2, 2, (W - 4) * Math.min(1, shieldPct), 4);
    }
    // Mana
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
 * One placed figure: base ring + procedural body + status bar, plus all the
 * cosmetic animation state the replay player drives.
 */
export class UnitVisual {
  readonly group: THREE.Group;
  readonly info: UnitVisualInfo;
  private body: THREE.Group;
  private bar: StatusBar | null = null;
  private bobPhase: number;
  private lungeT = 0;
  private lungeDir = new THREE.Vector3();
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
  /** World-position tween for combat movement. */
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
    const origin = def?.origin ?? 'beasts';
    const clazz = def?.clazz ?? 'duelist';

    // Cost ring (grey/green/blue/purple/gold) — minions get a dark ring.
    const cost = def?.cost ?? 1;
    const ringColor = isMinion ? 0x555b66 : COST_COLORS[cost];
    const ring = new THREE.Mesh(
      geo('base-ring', () => new THREE.TorusGeometry(0.3, 0.035, 8, 24)),
      mat(ringColor, { metal: 0.5, rough: 0.35 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    this.group.add(ring);

    const disc = new THREE.Mesh(
      geo('base-disc', () => new THREE.CylinderGeometry(0.29, 0.31, 0.04, 20)),
      mat(info.team === 0 ? 0x2f3d55 : 0x4a2f33, { rough: 0.8 })
    );
    disc.position.y = 0.02;
    disc.receiveShadow = true;
    this.group.add(disc);

    this.body = isMinion ? buildMinionBody() : buildBody(clazz, origin);
    const starScale = info.star === 1 ? 1 : info.star === 2 ? 1.14 : 1.3;
    this.body.scale.setScalar(starScale);
    this.group.add(this.body);

    // Star pips.
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
        pip.position.set((i - (info.star - 1) / 2) * 0.11, 0.95 * starScale, 0);
        this.group.add(pip);
      }
    }

    if (withBar) {
      this.bar = new StatusBar(info.team);
      this.bar.sprite.position.y = 1.06 * starScale;
      this.group.add(this.bar.sprite);
    }

    // Collect materials we can emissive-flash (skip shared cache concerns by
    // cloning materials only on first flash — see flash()).
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
        this.flashables.push(o.material);
      }
    });

    // Face the enemy side.
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
    this.lungeDir.copy(p).sub(this.group.position).setY(0);
    if (this.lungeDir.lengthSq() > 0.0001) this.lungeDir.normalize();
    this.lungeT = 0.001;
    // Face the victim.
    const angle = Math.atan2(this.lungeDir.x, this.lungeDir.z);
    this.group.rotation.y = angle;
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
      spin.position.y = 0.85;
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

  /** Per-frame cosmetic update; returns false once fully sunk (removable). */
  update(dt: number, elapsed: number): boolean {
    // Movement tween with a light hop.
    if (this.moveT < 1) {
      this.moveT = Math.min(1, this.moveT + dt / this.moveDur);
      const e = this.moveT;
      this.group.position.lerpVectors(this.moveFrom, this.moveTo, e);
      this.group.position.y = Math.sin(e * Math.PI) * 0.12;
      if (this.moveT >= 1) this.group.position.y = 0;
      const d = this.moveTo.clone().sub(this.moveFrom).setY(0);
      if (d.lengthSq() > 0.001) this.group.rotation.y = Math.atan2(d.x, d.z);
    }

    // Idle bob (skip while dying).
    if (this.dyingT < 0) {
      this.body.position.y = Math.sin(elapsed * 2.2 + this.bobPhase) * 0.02;
      if (this.stunSpin?.visible) this.stunSpin.rotation.z = elapsed * 6;
    }

    // Attack lunge.
    if (this.lungeT > 0) {
      this.lungeT += dt * 6;
      const k = this.lungeT >= 1 ? 0 : Math.sin(this.lungeT * Math.PI) * 0.16;
      this.body.position.x = this.lungeDir.x * k;
      this.body.position.z = this.lungeDir.z * k;
      if (this.lungeT >= 1) {
        this.lungeT = 0;
        this.body.position.x = 0;
        this.body.position.z = 0;
      }
    }

    // Hit flash — clone materials lazily the first time so we never mutate
    // the shared cache.
    if (this.flashT > 0) {
      if (!this.clonedMats) {
        this.cloneMaterials();
      }
      this.flashT += dt * 7;
      const k = this.flashT >= 1 ? 0 : 1 - this.flashT;
      for (const m of this.flashables) {
        m.emissiveIntensity = Math.max((m.userData.baseEmissive as number) ?? 0, k * 0.9);
      }
      if (this.flashT >= 1) {
        this.flashT = 0;
        for (const m of this.flashables)
          m.emissiveIntensity = (m.userData.baseEmissive as number) ?? 0;
      }
    }

    // Cast pulse: quick scale pop.
    if (this.castT > 0) {
      this.castT += dt * 4;
      const k = this.castT >= 1 ? 0 : Math.sin(this.castT * Math.PI) * 0.12;
      const starScale = this.info.star === 1 ? 1 : this.info.star === 2 ? 1.14 : 1.3;
      this.body.scale.setScalar(starScale * (1 + k));
      if (this.castT >= 1) this.castT = 0;
    }

    // Death: sink + shrink.
    if (this.dyingT >= 0 && this.dyingT < 1) {
      this.dyingT = Math.min(1, this.dyingT + dt * 1.6);
      this.group.position.y = -0.5 * this.dyingT;
      this.group.scale.setScalar(1 - 0.6 * this.dyingT);
      this.group.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
          const m = (o as THREE.Mesh).material as THREE.Material;
          if (m && 'opacity' in m) {
            m.transparent = true;
            (m as THREE.Material & { opacity: number }).opacity = Math.min(
              (m as THREE.Material & { opacity: number }).opacity,
              1 - this.dyingT * 0.9
            );
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
      }
    });
    this.flashables = cloned;
  }

  dispose(): void {
    this.bar?.dispose();
    if (this.clonedMats) for (const m of this.flashables) m.dispose();
  }
}

function buildMinionBody(): THREE.Group {
  const g = new THREE.Group();
  // A runaway park balloon-critter: bobbing sphere + string + little feet.
  g.add(
    mesh(
      geo('mn-body', () => new THREE.SphereGeometry(0.2, 10, 8)),
      mat(0xc9566a, { rough: 0.5 }),
      0,
      0.42,
      0
    )
  );
  g.add(
    mesh(
      geo('mn-knot', () => new THREE.ConeGeometry(0.04, 0.06, 6)),
      mat(0x8c3b4a),
      0,
      0.2,
      0
    )
  );
  g.add(
    mesh(
      geo('mn-eye', () => new THREE.SphereGeometry(0.035, 6, 5)),
      mat(0x1c2230, { rough: 0.3 }),
      -0.06,
      0.46,
      0.17
    )
  );
  g.add(
    mesh(
      geo('mn-eye', () => new THREE.SphereGeometry(0.035, 6, 5)),
      mat(0x1c2230, { rough: 0.3 }),
      0.06,
      0.46,
      0.17
    )
  );
  return g;
}
