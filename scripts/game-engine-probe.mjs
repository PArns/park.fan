/**
 * park.fan Coaster — what does a real browser's graphics stack actually get?
 *
 * Every screenshot in this project is taken by `game-shot.mjs`, which forces `?engine=webgl2`
 * because headless Chromium has no WebGPU by default. So for the whole life of the branch nobody
 * had looked at what a visitor with `navigator.gpu` — every current Chrome and Edge — is served,
 * and the answer was **a black canvas with a working HUD on top of it**: the scene mounts, the
 * simulation runs, the panels fill with real numbers, and the 3D is never drawn.
 *
 * This script is the check that would have caught it. It launches Chromium twice — once as it
 * comes, once with WebGPU forced onto SwiftShader — and for each one loads `/game` with no engine
 * query at all, so what it exercises is the game's OWN choice rather than the harness's. It reports
 * which engine was picked, whether the world reached `ready`, every page error, and the mean
 * brightness of the canvas region of the screenshot, because "black" is a measurement and not an
 * impression.
 *
 *   node scripts/game-engine-probe.mjs
 *   node scripts/game-engine-probe.mjs --url=http://localhost:3000 --engine=webgpu
 *
 * `--engine=` overrides the game's choice for one pass, which is how the WebGPU path stays
 * reachable while it is being fixed. Needs a running site.
 *
 * ## What "black" looked like when this was written
 *
 * Under a forced WebGPU adapter: seven identical `Cannot read properties of undefined (reading
 * 'shaderLanguage')` before the first frame, `terrain` failing to start, repeated device loss, and
 * a canvas at `clearColor`. The cause is this project's deep-import rule meeting Babylon's shader
 * store — a material imported deep pulls its GLSL shader and nothing pulls the WGSL twin, so a
 * WebGPU engine has no shader for anything the game draws. See `core/capabilities.ts`.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
const base = args.url ?? 'http://localhost:3000';
const forced = args.engine ?? null;
const out = args.out ?? '.game-render/engine-probe';
const budgetMs = Number(args.timeout ?? 90000);

/** Chromium as a visitor has it, and Chromium with a software WebGPU adapter forced on. */
const PASSES = [
  {
    id: 'default',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  },
  {
    id: 'webgpu-capable',
    args: [
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan',
      '--use-webgpu-adapter=swiftshader',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  },
];

await mkdir(out, { recursive: true });
const results = [];
let bad = 0;

for (const pass of PASSES) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
    args: pass.args,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
  const url = `${base}/game${forced ? `?engine=${forced}` : ''}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

  const hasGpu = await page.evaluate(() => 'gpu' in navigator);
  let ready = false;
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    ready = await page.evaluate(() => globalThis.__parkfan_game?.ready === true).catch(() => false);
    if (ready) break;
    await page.waitForTimeout(1500);
  }
  // A few frames after ready, so the first render has actually happened.
  await page.waitForTimeout(4000);

  const kind = await page
    .evaluate(() => globalThis.__parkfan_game?.metrics?.().engine ?? null)
    .catch(() => null);
  const file = path.join(out, `${pass.id}.png`);
  await page.screenshot({ path: file });

  /**
   * Mean luminance of the canvas, read off the canvas rather than off the PNG.
   *
   * The HUD is opaque and sits over the right third of the frame, so a whole-screenshot average
   * would call a black park "lit" on the strength of the panels. This samples the drawing buffer
   * itself — which is what "did the 3D render" actually means — on a 64-point grid.
   */
  const luma = await page
    .evaluate(() => {
      const scene = globalThis.__parkfan_game?.scene?.();
      const canvas = document.querySelector('canvas');
      if (!scene || !canvas) return null;
      const probe = document.createElement('canvas');
      probe.width = 64;
      probe.height = 36;
      const ctx = probe.getContext('2d');
      if (!ctx) return null;
      try {
        ctx.drawImage(canvas, 0, 0, 64, 36);
      } catch {
        return null;
      }
      const { data } = ctx.getImageData(0, 0, 64, 36);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      return Number((sum / (data.length / 4)).toFixed(1));
    })
    .catch(() => null);

  await browser.close();

  // 4 of 255 is darker than this game's own night sky, which is what makes it a threshold rather
  // than a taste: a park at 23:00 measures in the twenties.
  const black = luma != null && luma < 4;
  const ok = ready && !black && errors.length === 0;
  if (!ok) bad += 1;
  results.push({ pass: pass.id, url, hasGpu, ready, engine: kind, luma, black, errors, file });
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} ${pass.id.padEnd(15)} navigator.gpu=${String(hasGpu).padEnd(5)} ` +
      `engine=${String(kind).padEnd(7)} ready=${String(ready).padEnd(5)} luma=${String(luma).padStart(5)}` +
      `${black ? ' · CANVAS IS BLACK' : ''}${errors.length ? ` · ${errors.length} page errors` : ''}`
  );
  for (const e of errors.slice(0, 4)) console.log(`       ✗ ${e}`);
}

await writeFile(path.join(out, 'report.json'), JSON.stringify({ base, forced, results }, null, 2));
console.log(`→ ${out}`);
process.exit(bad ? 1 : 0);
