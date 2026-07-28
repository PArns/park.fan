/**
 * Headless render harness for the glossary coaster player.
 *
 * The conventions require every animated figure to be *looked at* from all
 * three camera modes across the whole timeline, in both themes, before it
 * ships — a green build is not enough (docs/development/conventions.md §12).
 * This is the tool that makes that practical: it drives the real scene module
 * in Chromium via Playwright and writes one contact sheet per element.
 *
 *   node scripts/render-coaster-elements.mjs                 # every element
 *   node scripts/render-coaster-elements.mjs launch top-hat  # just these
 *   OUT=/tmp/sheets SAMPLES=0,0.5,1 node scripts/render-coaster-elements.mjs
 *
 * Output: OUT/<element>-<theme>.png — a 3 × 5 grid, one row per camera
 * (front / follow / onboard), one column per timeline position.
 *
 * Chromium ships with the container and PLAYWRIGHT_BROWSERS_PATH already
 * points at it; do not run `playwright install`.
 */
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT ?? path.join(ROOT, '.coaster-render');
const TMP = path.join(OUT, '.bundle');

const SAMPLES = (process.env.SAMPLES ?? '0.08,0.3,0.5,0.7,0.92').split(',').map(Number);
const VIEWS = ['front', 'follow', 'onboard'];
const THEMES = ['light', 'dark'];
const CELL = { w: 420, h: 264 };

/** Bundle the scene + element registry into one browser-ready IIFE. */
async function bundleScene() {
  await mkdir(TMP, { recursive: true });
  const entry = path.join(TMP, 'entry.ts');
  await writeFile(
    entry,
    `import { createCoasterScene } from '${path.join(ROOT, 'lib/three/coaster/scene.ts').replace(/\\/g, '/')}';\n` +
      `import { COASTER_ELEMENTS } from '${path.join(ROOT, 'lib/three/coaster/elements.ts').replace(/\\/g, '/')}';\n` +
      `(globalThis as any).__coaster = { createCoasterScene, COASTER_ELEMENTS };\n`
  );
  const res = await build({
    entryPoints: [entry],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'chrome120',
    write: false,
    logLevel: 'silent',
  });
  return res.outputFiles[0].text;
}

async function main() {
  const wanted = process.argv.slice(2);
  if (existsSync(OUT)) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const bundle = await bundleScene();

  // Prefer a Chromium already on the machine (CI images and the Claude Code
  // container ship one and block `playwright install`); fall back to whatever
  // Playwright manages locally.
  const preinstalled = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
  const browser = await chromium.launch({
    ...(existsSync(preinstalled) ? { executablePath: preinstalled } : {}),
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: CELL.w * SAMPLES.length, height: CELL.h * VIEWS.length },
    deviceScaleFactor: 1,
  });
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('  [page]', m.text());
  });
  await page.setContent('<!doctype html><body style="margin:0"></body>');
  await page.addScriptTag({ content: bundle });

  const ids = await page.evaluate(() => Object.keys(globalThis.__coaster.COASTER_ELEMENTS).sort());
  const targets = wanted.length ? ids.filter((id) => wanted.includes(id)) : ids;
  const unknown = wanted.filter((w) => !ids.includes(w));
  if (unknown.length) {
    console.error(`Unknown element(s): ${unknown.join(', ')}`);
    process.exitCode = 1;
  }

  for (const id of targets) {
    for (const theme of THEMES) {
      const errors = await page.evaluate(
        async ({ id, theme, views, samples, cell }) => {
          document.body.innerHTML = '';
          document.body.style.background = theme === 'dark' ? '#0b1020' : '#eef3fb';
          const problems = [];

          for (const view of views) {
            const row = document.createElement('div');
            row.style.display = 'flex';
            document.body.appendChild(row);

            for (const t of samples) {
              const canvas = document.createElement('canvas');
              canvas.style.width = `${cell.w}px`;
              canvas.style.height = `${cell.h}px`;
              canvas.style.display = 'block';
              row.appendChild(canvas);

              try {
                const scene = globalThis.__coaster.createCoasterScene(canvas, {
                  element: id,
                  theme,
                  reducedMotion: true,
                });
                scene.resize(cell.w, cell.h);
                // reducedMotion keeps the RAF loop off, so setView and seek
                // each render synchronously — view first, then the playhead.
                scene.setView(view);
                scene.seek(t);
                scene.seek(t); // second pass settles the eased follow camera
              } catch (err) {
                problems.push(`${id}/${theme}/${view}@${t}: ${err?.message ?? err}`);
              }
            }
          }
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return problems;
        },
        { id, theme, views: VIEWS, samples: SAMPLES, cell: CELL }
      );

      for (const e of errors) {
        console.error('  ✗', e);
        process.exitCode = 1;
      }
      const file = path.join(OUT, `${id}-${theme}.png`);
      await page.screenshot({ path: file });
      console.log(`  ✔ ${path.relative(ROOT, file)}`);
    }
  }

  await browser.close();
  await rm(TMP, { recursive: true, force: true });
  console.log(`\n${targets.length} element(s) → ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
