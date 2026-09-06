import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '.game-render/critic-track-probe';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl-draft-extensions'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text().slice(0,500)}`));
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto('http://localhost:3000/game?harness=1&speed=0&engine=webgl2&showcase=track', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, { timeout: 180000 });
await page.waitForTimeout(6000);

// scene inventory
const inv = await page.evaluate(() => {
  const s = globalThis.__parkfan_game.scene();
  const meshes = s.meshes.map((m) => ({
    name: m.name, tris: (m.getTotalIndices?.() ?? 0) / 3, verts: m.getTotalVertices?.() ?? 0,
    mat: m.material?.name ?? null, enabled: m.isEnabled?.() ?? true, lod: (m.getLODLevels?.() ?? []).length,
  }));
  return {
    meshCount: s.meshes.length,
    materials: s.materials.map((m) => m.name),
    textures: s.textures.map((t) => `${t.name}:${t.getSize?.()?.width ?? '?'}`),
    track: meshes.filter((m) => /track|coaster|rail|tie|spine|support|footing|column/i.test(m.name + ' ' + (m.mat ?? ''))),
    all: meshes.sort((a,b)=>b.tris-a.tris).slice(0, 25),
    lights: s.lights.map((l) => ({ name: l.name, type: l.getClassName?.() })),
  };
});
await writeFile(out + '/inventory.json', JSON.stringify(inv, null, 2));

async function shot(name, { alpha, beta, radius, target, tod }) {
  await page.evaluate(({ alpha, beta, radius, target, tod }) => {
    const g = globalThis.__parkfan_game;
    if (tod != null) g.setTimeOfDay(tod);
    const c = g.scene().activeCamera;
    if ('alpha' in c) { c.alpha = alpha; c.beta = beta; c.radius = radius; c.target.set(target[0], target[1], target[2]); }
  }, { alpha, beta, radius, target, tod });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${name}.png` });
  const m = await page.evaluate(() => globalThis.__parkfan_game.metrics());
  return { name, drawCalls: m.drawCalls, triangles: m.triangles };
}

const shots = [];
// Nordwind is at origin [-140,10,60] running east-west. Loop should be somewhere along +x.
shots.push(await shot('loop-side', { alpha: Math.PI, beta: 1.45, radius: 70, target: [-40, 22, 60], tod: 12*60 }));
shots.push(await shot('loop-side2', { alpha: Math.PI, beta: 1.45, radius: 70, target: [0, 22, 60], tod: 12*60 }));
shots.push(await shot('loop-side3', { alpha: Math.PI, beta: 1.45, radius: 70, target: [40, 22, 60], tod: 12*60 }));
shots.push(await shot('loop-side4', { alpha: Math.PI, beta: 1.45, radius: 70, target: [80, 22, 60], tod: 12*60 }));
shots.push(await shot('station-hunt', { alpha: Math.PI*0.75, beta: 1.3, radius: 60, target: [-130, 14, 60], tod: 12*60 }));
shots.push(await shot('wood-close', { alpha: Math.PI*0.9, beta: 1.35, radius: 80, target: [-60, 16, -60], tod: 12*60 }));
shots.push(await shot('wood-ov', { alpha: -Math.PI/2.6, beta: 1.1, radius: 200, target: [-40, 12, -60], tod: 12*60 }));
await writeFile(out + '/shots.json', JSON.stringify({ shots, logs }, null, 2));
await browser.close();
console.log(JSON.stringify(shots, null, 1));
console.log('--- logs ---');
for (const l of logs) console.log(l);
