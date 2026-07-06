/**
 * Park environment for the Queue Tactics arena: sky, paved plaza, trees,
 * string lights with fake-bloom glow sprites, striped circus tents, drifting
 * balloons and — the park.fan signature — a slowly turning Ferris wheel with
 * night lights behind the enemy board.
 *
 * Everything is procedural (no assets) and theme-aware. `update(dt)` drives
 * the ambient motion (wheel rotation, hanging gondolas, balloon drift).
 *
 * Real-world reference (convention #12, research first): classic European
 * fairground Ferris wheel — two parallel rim rings joined by spokes, gondolas
 * PIVOTING freely at rim joints so they always hang plumb while the wheel
 * turns, A-frame supports either side, rim bulbs lit at night.
 */

import * as THREE from 'three';
import type { ThemePalette } from './palette';

export interface ParkEnvironment {
  group: THREE.Group;
  /** Ambient animation (wheel, gondolas, balloons). */
  update(dt: number): void;
  /** Re-colour for the active theme; returns the new sky texture. */
  applyTheme(pal: ThemePalette, dark: boolean): THREE.CanvasTexture;
  dispose(): void;
}

function canvas2d(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!];
}

/* ------------------------------------------------------------------ */
/* Sky & ground textures                                               */
/* ------------------------------------------------------------------ */

function makeSky(dark: boolean): THREE.CanvasTexture {
  const [c, ctx] = canvas2d(512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  if (dark) {
    g.addColorStop(0, '#060a1c');
    g.addColorStop(0.45, '#14224c');
    g.addColorStop(1, '#3d5590');
  } else {
    g.addColorStop(0, '#3f93e8');
    g.addColorStop(0.55, '#8ac6f4');
    g.addColorStop(1, '#d9f0fd');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  if (dark) {
    // Stars — denser towards the top, deterministic scatter.
    for (let i = 0; i < 140; i++) {
      const x = (i * 137.5) % 512;
      const y = ((i * 89.7) % 300) * (0.4 + ((i * 53) % 100) / 160);
      const r = 0.5 + ((i * 31) % 10) / 9;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + ((i * 17) % 50) / 100})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Moon with a soft halo.
    const moon = ctx.createRadialGradient(400, 90, 4, 400, 90, 60);
    moon.addColorStop(0, 'rgba(240,246,255,0.95)');
    moon.addColorStop(0.18, 'rgba(230,240,255,0.8)');
    moon.addColorStop(1, 'rgba(230,240,255,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(320, 10, 160, 160);
  } else {
    // Soft cloud puffs.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const puff = (x: number, y: number, s: number) => {
      for (const [dx, dy, r] of [
        [0, 0, 26],
        [22, 6, 20],
        [-24, 8, 18],
        [8, -10, 18],
      ] as const) {
        ctx.beginPath();
        ctx.ellipse(x + dx * s, y + dy * s, r * s, r * 0.62 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    puff(110, 110, 1);
    puff(360, 70, 0.8);
    puff(250, 180, 0.6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Irregular paving blotches — direction-free so polar cap UVs don't matter. */
function makePaving(base: string, dark: boolean): THREE.CanvasTexture {
  const [c, ctx] = canvas2d(256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    const x = (i * 97.3) % 256;
    const y = (i * 57.7) % 256;
    const r = 3 + ((i * 41) % 12);
    const l = ((i * 13) % 24) - 12;
    ctx.fillStyle = `rgba(${l > 0 ? '255,255,255' : '0,0,20'},${Math.abs(l) / (dark ? 130 : 190)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

/** Radial soft glow for fake bloom around bulbs. */
function makeGlow(): THREE.CanvasTexture {
  const [c, ctx] = canvas2d(64);
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,215,140,0.9)');
  g.addColorStop(0.4, 'rgba(255,190,110,0.35)');
  g.addColorStop(1, 'rgba(255,180,100,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function makeStripes(a: string, b: string): THREE.CanvasTexture {
  const [c, ctx] = canvas2d(128);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? a : b;
    ctx.fillRect(i * 16, 0, 16, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */

export function buildParkEnvironment(): ParkEnvironment {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  /* ---------- ground ---------- */
  const plazaMat = track(new THREE.MeshStandardMaterial({ roughness: 0.95 }));
  const plaza = new THREE.Mesh(track(new THREE.CylinderGeometry(6.6, 7.1, 0.5, 36)), plazaMat);
  plaza.position.y = -0.4;
  plaza.receiveShadow = true;
  group.add(plaza);

  const grassMat = track(new THREE.MeshStandardMaterial({ roughness: 1 }));
  const ground = new THREE.Mesh(track(new THREE.CylinderGeometry(16, 17.5, 1.2, 36)), grassMat);
  ground.position.y = -1.15;
  ground.receiveShadow = true;
  group.add(ground);

  /* ---------- trees ---------- */
  const foliageMat = track(new THREE.MeshStandardMaterial({ roughness: 0.9 }));
  const trunkMat = track(new THREE.MeshStandardMaterial({ roughness: 0.9 }));
  const trunkGeo = track(new THREE.CylinderGeometry(0.09, 0.13, 0.7, 7));
  const coneGeos = [0, 1, 2].map((i) => track(new THREE.ConeGeometry(0.62 - i * 0.16, 0.7, 8)));
  for (const [x, z] of [
    [-6.6, -3.4],
    [6.6, -3.2],
    [-7.4, 1.4],
    [7.4, 1.6],
    [-12.0, 3.0],
    [5.6, 6.4],
  ] as const) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.35;
    trunk.castShadow = true;
    tree.add(trunk);
    coneGeos.forEach((geo, i) => {
      const cone = new THREE.Mesh(geo, foliageMat);
      cone.position.y = 0.85 + i * 0.42;
      cone.castShadow = true;
      tree.add(cone);
    });
    tree.position.set(x, 0, z);
    tree.scale.setScalar(0.9 + (((x * 7 + z * 13 + 100) % 10) as number) / 25);
    group.add(tree);
  }

  /* ---------- string lights + glow sprites ---------- */
  const bulbMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffe6b0,
      emissive: 0xffb84d,
      emissiveIntensity: 0,
      roughness: 0.4,
    })
  );
  const poleMat = track(new THREE.MeshStandardMaterial({ color: 0x88919f, roughness: 0.6 }));
  const glowTex = track(makeGlow());
  const glowMat = track(
    new THREE.SpriteMaterial({
      map: glowTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    })
  );
  {
    const bulbGeo = track(new THREE.SphereGeometry(0.06, 6, 5));
    const poleGeo = track(new THREE.CylinderGeometry(0.07, 0.09, 2.1, 7));
    const polePositions: [number, number][] = [
      [-5.9, -4.6],
      [0, -5.9],
      [5.9, -4.6],
      [6.8, 0.6],
      [4.9, 5.6],
      [-4.9, 5.6],
      [-6.8, 0.6],
    ];
    const tops: THREE.Vector3[] = [];
    for (const [x, z] of polePositions) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 1.05, z);
      pole.castShadow = true;
      group.add(pole);
      tops.push(new THREE.Vector3(x, 2.05, z));
    }
    for (let i = 0; i < tops.length; i++) {
      const a = tops[i];
      const b = tops[(i + 1) % tops.length];
      for (let k = 1; k < 7; k++) {
        const f = k / 7;
        const p = a.clone().lerp(b, f);
        p.y -= Math.sin(f * Math.PI) * 0.35;
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.copy(p);
        group.add(bulb);
        const glow = new THREE.Sprite(glowMat);
        glow.position.copy(p);
        glow.scale.setScalar(0.55);
        group.add(glow);
      }
    }
  }

  /* ---------- Ferris wheel (the park.fan landmark) ---------- */
  const wheel = new THREE.Group();
  const wheelPivot = new THREE.Group(); // rotates
  const gondolas: THREE.Group[] = [];
  const wheelLightMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffd9a0,
      emissive: 0xffa94d,
      emissiveIntensity: 0,
      roughness: 0.4,
    })
  );
  {
    const R = 3.1;
    const steelMat = track(
      new THREE.MeshStandardMaterial({ color: 0x9aa6b8, roughness: 0.5, metalness: 0.5 })
    );
    const rimGeo = track(new THREE.TorusGeometry(R, 0.08, 8, 40));
    for (const zOff of [-0.4, 0.4]) {
      const rim = new THREE.Mesh(rimGeo, steelMat);
      rim.position.z = zOff;
      wheelPivot.add(rim);
    }
    const spokeGeo = track(new THREE.CylinderGeometry(0.045, 0.045, R * 2, 6));
    for (let i = 0; i < 6; i++) {
      for (const zOff of [-0.4, 0.4]) {
        const spoke = new THREE.Mesh(spokeGeo, steelMat);
        spoke.rotation.z = (i / 6) * Math.PI;
        spoke.position.z = zOff;
        wheelPivot.add(spoke);
      }
    }
    const hub = new THREE.Mesh(track(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 10)), steelMat);
    hub.rotation.x = Math.PI / 2;
    wheelPivot.add(hub);

    // Rim lights + fake-bloom glow sprites (read as a light ring at night).
    const lightGeo = track(new THREE.SphereGeometry(0.12, 6, 5));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const l = new THREE.Mesh(lightGeo, wheelLightMat);
      l.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      wheelPivot.add(l);
      const glow = new THREE.Sprite(glowMat);
      glow.position.copy(l.position);
      glow.scale.setScalar(0.9);
      wheelPivot.add(glow);
    }

    // Gondolas pivot at rim joints so they hang plumb while the wheel turns.
    const gondolaBody = track(new THREE.CylinderGeometry(0.18, 0.23, 0.26, 8));
    const gondolaRoof = track(new THREE.ConeGeometry(0.23, 0.17, 8));
    const gondolaColors = [0xc94f4f, 0x3f8cc9, 0xe0a33a, 0x53a860, 0x8a63c9, 0xc9699a];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const g = new THREE.Group();
      g.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      const m = track(
        new THREE.MeshStandardMaterial({
          color: gondolaColors[i % gondolaColors.length],
          roughness: 0.6,
        })
      );
      const body = new THREE.Mesh(gondolaBody, m);
      body.position.y = -0.34;
      const roof = new THREE.Mesh(gondolaRoof, m);
      roof.position.y = -0.13;
      g.add(body, roof);
      wheelPivot.add(g);
      gondolas.push(g);
    }

    // A-frame supports + base.
    const legGeo = track(new THREE.CylinderGeometry(0.09, 0.13, R + 1.4, 7));
    for (const zOff of [-0.55, 0.55]) {
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(legGeo, steelMat);
        leg.position.set(side * 1.5, (R + 1.4) / 2 - 0.6, zOff);
        leg.rotation.z = side * -0.32;
        wheel.add(leg);
      }
    }
    const base = new THREE.Mesh(track(new THREE.BoxGeometry(4.4, 0.35, 1.9)), steelMat);
    base.position.y = -0.5;
    wheel.add(base);

    wheelPivot.position.y = R + 0.7;
    wheel.add(wheelPivot);
    wheel.position.set(-6.5, -0.55, 12.0);
    wheel.rotation.y = 0.35;
    group.add(wheel);
  }

  /* ---------- circus tents ---------- */
  const tentTexA = track(makeStripes('#c94f4f', '#f2e8d8'));
  const tentTexB = track(makeStripes('#3f6fc9', '#f2e8d8'));
  const flagMat = track(
    new THREE.MeshStandardMaterial({ color: 0xe0a33a, side: THREE.DoubleSide })
  );
  for (const [x, z, tex, s] of [
    [8.5, 13.5, tentTexA, 0.85],
    [12.5, 9.0, tentTexB, 0.7],
  ] as const) {
    const tent = new THREE.Group();
    const wallMat = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    const roofMat = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    const wall = new THREE.Mesh(track(new THREE.CylinderGeometry(1.5, 1.6, 1.1, 12)), wallMat);
    wall.position.y = 0.55;
    const roof = new THREE.Mesh(track(new THREE.ConeGeometry(1.85, 1.5, 12)), roofMat);
    roof.position.y = 1.85;
    const flag = new THREE.Mesh(track(new THREE.PlaneGeometry(0.45, 0.28)), flagMat);
    flag.position.set(0.22, 2.75, 0);
    tent.add(wall, roof, flag);
    tent.position.set(x, 0, z);
    tent.scale.setScalar(s);
    tent.castShadow = true;
    group.add(tent);
  }

  /* ---------- drifting balloons ---------- */
  const balloons: { g: THREE.Group; speed: number; phase: number }[] = [];
  {
    const bodyGeo = track(new THREE.SphereGeometry(0.16, 8, 7));
    const knotGeo = track(new THREE.ConeGeometry(0.035, 0.06, 6));
    const colors = [0xd9534f, 0xe0a33a, 0x3f8cc9, 0x8a63c9];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const m = track(new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.35 }));
      const body = new THREE.Mesh(bodyGeo, m);
      const knot = new THREE.Mesh(knotGeo, m);
      knot.position.y = -0.19;
      g.add(body, knot);
      // Keep balloon lanes far from the camera (which sits around z ≈ -12).
      g.position.set(-9 + i * 6, 1 + i * 2.0, 9 + (i % 2) * 4);
      group.add(g);
      balloons.push({ g, speed: 0.32 + i * 0.07, phase: i * 1.7 });
    }
  }

  /* ---------- theme + animation ---------- */
  let elapsed = 0;

  return {
    group,
    update(dt: number) {
      elapsed += dt;
      wheelPivot.rotation.z += dt * 0.14;
      for (const g of gondolas) g.rotation.z = -wheelPivot.rotation.z; // hang plumb
      for (const b of balloons) {
        b.g.position.y += dt * b.speed;
        b.g.position.x += Math.sin(elapsed * 0.7 + b.phase) * dt * 0.25;
        if (b.g.position.y > 9.5) b.g.position.y = 0.5;
      }
    },
    applyTheme(pal: ThemePalette, dark: boolean) {
      plazaMat.color.setHex(dark ? 0x4d5a7a : 0xbdb09a);
      plazaMat.map?.dispose();
      plazaMat.map = track(makePaving(dark ? '#4d5a7a' : '#bdb09a', dark));
      plazaMat.needsUpdate = true;
      grassMat.color.setHex(pal.ground);
      foliageMat.color.setHex(pal.treeFoliage);
      trunkMat.color.setHex(pal.treeTrunk);
      bulbMat.emissiveIntensity = pal.lanternIntensity;
      wheelLightMat.emissiveIntensity = dark ? 3.2 : 0;
      glowMat.opacity = dark ? 0.75 : 0;
      return track(makeSky(dark));
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
