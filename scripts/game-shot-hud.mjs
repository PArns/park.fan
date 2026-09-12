/**
 * How much of the park the HUD is standing on, measured rather than argued about.
 *
 * `scripts/game-shot.mjs` photographs the game; it says nothing about the chrome laid over it.
 * The round-1 critique of this skin was decided by one number — "69.3 % of the frame at
 * 1280x720" — and there was no way in this repo to reproduce it, so the second round would have
 * been a discussion about a figure only one side could take. This is that figure, and the four
 * others the same critique named, in one run per viewport.
 *
 *   node scripts/game-shot-hud.mjs --url=http://localhost:3001 --w=1280 --h=720 \
 *        --panels=park --tod=13:00 --out=.game-render/ui-r2 --tag=after
 *
 * It lives here rather than in `lib/game/ui/` for the reason `scripts/game-shot-bar.mjs` does: a
 * module folder is the module, and a harness that boots a browser is neither shipped nor imported
 * by it.
 *
 * ## Three coverage numbers, because "the HUD covers X" is three different claims
 *
 * - **hit** — `document.elementFromPoint` over a 240 x 240 grid (57,600 points, the critic's own
 *   count). This is what a POINTER meets: a transparent element with `pointer-events: auto` is a
 *   hit even though nothing is drawn there, and that is not a measurement artefact — a click on
 *   the park in that band does not reach the canvas.
 * - **ink** — the union of the rectangles of the elements that actually PAINT (a background colour
 *   with alpha, a background image, or a backdrop filter). This is what a reader sees covered.
 * - **scrim** — the two gradient veils, counted apart from both. They dim the park; they do not
 *   hide it, and folding them into either number above would make the HUD look twice its size.
 *
 * Each is split into the part this module owns and the part `tools` owns (`[data-build-bar]`), so
 * a change on one side of that line cannot be reported as a change on the other.
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

const base = args.url ?? 'http://localhost:3001';
const width = Number(args.w ?? 1280);
const height = Number(args.h ?? 720);
const tod = args.tod ?? '13:00';
const panels = (args.panels ?? '').split(',').filter(Boolean);
const stepTicks = Number(args.step ?? 0);
const tag = args.tag ?? 'hud';
const out = args.out ?? '.game-render/ui-hud';
/**
 * How long to let the layout settle after the panels are opened, before measuring.
 *
 * 3 s rather than 1: the park panel's network section appears while the path graph is still
 * being counted (`pathIslands` reads 2 for the first seconds of a boot and settles at 1), and a
 * measurement taken at 900 ms caught 73 px of a section that is not there when a player looks.
 */
const settleMs = Number(args.settle ?? 3000);
const label = `${tag}-${width}x${height}${panels.length ? `-${panels.join('+')}` : ''}`;

await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width, height } });
const console_ = { errors: [], warnings: [], hydration: [] };
page.on('console', (m) => {
  const text = m.text();
  if (/hydrat/i.test(text)) console_.hydration.push(text.slice(0, 300));
  if (m.type() === 'error') console_.errors.push(text.slice(0, 300));
  else if (m.type() === 'warning' && !/WebGPU Context Provider/.test(text))
    console_.warnings.push(text.slice(0, 300));
});
page.on('pageerror', (e) => console_.errors.push(`pageerror: ${e.message}`));

const query = new URLSearchParams({ harness: '1', speed: '0', engine: 'webgl2' });
await page.goto(`${base}/game?${query}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page
  .waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, { timeout: 180000 })
  .catch(() => console_.errors.push('timeout: world:ready never fired'));

const m = /^(\d{1,2}):(\d{2})$/.exec(tod);
await page.evaluate(
  (minute) => globalThis.__parkfan_game?.setTimeOfDay(minute),
  m ? Number(m[1]) * 60 + Number(m[2]) : 780
);

if (stepTicks > 0) {
  const before = await page.evaluate(() => globalThis.__parkfan_game.metrics().tick);
  await page.evaluate((n) => globalThis.__parkfan_game.step(n), stepTicks);
  const deadline = Date.now() + 120000;
  let tick = before;
  while (tick < before + stepTicks && Date.now() < deadline) {
    await page.waitForTimeout(250);
    tick = await page.evaluate(() => globalThis.__parkfan_game.metrics().tick).catch(() => tick);
  }
}

// The panels to open, through the same public api a foreign module would use.
await page.evaluate((ids) => {
  const ui = globalThis.__parkfan_game?.handle?.module?.('ui');
  if (!ui) return;
  for (const id of ui.openPanels()) ui.close(id);
  for (const id of ids) ui.open(id);
}, panels);
/**
 * Wait for the first FRAME, not just for the boot.
 *
 * `ready` means the world is built; the telemetry's `live` flag means a frame has arrived from
 * the worker, and until it does the park panel carries a three-line note saying the simulation is
 * not running. Under SwiftShader that gap is seconds, so a measurement taken on the clock caught
 * 73 px of panel that is not there when a person looks at it — 534 px against 461 in two runs of
 * the same viewport.
 */
await page
  .waitForFunction(
    () => globalThis.__parkfan_game?.handle?.module?.('ui')?.telemetry?.().live === true,
    null,
    { timeout: 60000 }
  )
  .catch(() => console_.warnings.push('telemetry never reported a frame'));
await page.waitForTimeout(settleMs);

const measurement = await page.evaluate(() => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const N = 240;
  const hudRoot = document.querySelector('[data-game-hud]');
  const inBuild = (el) => !!el.closest?.('[data-build-bar]');

  // ── 1. hit test: what a pointer meets ────────────────────────────────────────────────────
  const hit = { hud: 0, build: 0, park: 0 };
  for (let iy = 0; iy < N; iy++) {
    for (let ix = 0; ix < N; ix++) {
      const el = document.elementFromPoint(((ix + 0.5) * W) / N, ((iy + 0.5) * H) / N);
      if (!el) hit.park++;
      else if (inBuild(el)) hit.build++;
      else if (hudRoot?.contains(el)) hit.hud++;
      else hit.park++;
    }
  }

  // ── 2. ink: the union of the rectangles that actually paint ──────────────────────────────
  const alphaOf = (colour) => {
    const m = /rgba?\(([^)]+)\)/.exec(colour ?? '');
    if (!m) return 0;
    const parts = m[1].split(/[,/]/).map((s) => parseFloat(s));
    return parts.length > 3 ? parts[3] : 1;
  };
  const masks = {
    hud: new Uint8Array(N * N),
    build: new Uint8Array(N * N),
    scrim: new Uint8Array(N * N),
  };
  const mark = (mask, r) => {
    const x0 = Math.max(0, Math.ceil((r.left * N) / W - 0.5));
    const x1 = Math.min(N - 1, Math.floor((r.right * N) / W - 0.5));
    const y0 = Math.max(0, Math.ceil((r.top * N) / H - 0.5));
    const y1 = Math.min(N - 1, Math.floor((r.bottom * N) / H - 0.5));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) mask[y * N + x] = 1;
  };
  const painted = [];
  for (const el of hudRoot ? hudRoot.querySelectorAll('*') : []) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    const paints =
      alphaOf(cs.backgroundColor) > 0.02 ||
      (cs.backgroundImage && cs.backgroundImage !== 'none') ||
      ((cs.backdropFilter ?? cs.webkitBackdropFilter) || 'none') !== 'none';
    if (!paints) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > H) continue;
    const kind = el.hasAttribute('data-hud-scrim') ? 'scrim' : inBuild(el) ? 'build' : 'hud';
    mark(masks[kind], r);
    painted.push({ kind, w: Math.round(r.width), h: Math.round(r.height) });
  }
  const cells = N * N;
  let ink = { hud: 0, build: 0, scrim: 0, any: 0 };
  for (let i = 0; i < cells; i++) {
    if (masks.hud[i]) ink.hud++;
    if (masks.build[i]) ink.build++;
    if (masks.scrim[i] && !masks.hud[i] && !masks.build[i]) ink.scrim++;
    if (masks.hud[i] || masks.build[i]) ink.any++;
  }

  // ── 3. the panels: is every row reachable? ───────────────────────────────────────────────
  const panels = [...document.querySelectorAll('[data-panel]')].map((el) => {
    const body = el.querySelector('[data-panel-body]');
    const r = el.getBoundingClientRect();
    return {
      id: el.getAttribute('data-panel'),
      rect: {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      },
      bodyH: body ? body.clientHeight : null,
      contentH: body ? body.scrollHeight : null,
      hiddenPx: body ? Math.max(0, body.scrollHeight - body.clientHeight) : null,
      scrollable: body ? getComputedStyle(body).overflowY : null,
      belowViewport: Math.round(Math.max(0, r.bottom - H)),
    };
  });

  // ── 4. the build tray: does anything paint outside its own body? ─────────────────────────
  const boxOf = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      bottom: Math.round(r.bottom),
    };
  };
  const tray = document.querySelector('[data-build-tray]');
  let trayBreak = null;
  if (tray) {
    const tr = tray.getBoundingClientRect();
    const escapees = [];
    for (const child of tray.querySelectorAll('*')) {
      const cr = child.getBoundingClientRect();
      if (cr.height < 2 || cr.width < 2) continue;
      if (cr.bottom > tr.bottom + 1) {
        const cs = getComputedStyle(child);
        const paints =
          alphaOf(cs.backgroundColor) > 0.02 ||
          (cs.backgroundImage && cs.backgroundImage !== 'none');
        escapees.push({
          cls: child.className?.toString?.().slice(0, 60) ?? '',
          paints: !!paints,
          top: Math.round(cr.top),
          bottom: Math.round(cr.bottom),
          overhang: Math.round(cr.bottom - tr.bottom),
        });
      }
    }
    trayBreak = {
      rect: {
        x: Math.round(tr.x),
        y: Math.round(tr.y),
        w: Math.round(tr.width),
        h: Math.round(tr.height),
        bottom: Math.round(tr.bottom),
      },
      scrollH: tray.scrollHeight,
      clientH: tray.clientHeight,
      squashedBy: Math.max(0, tray.scrollHeight - tray.clientHeight),
      escapees: escapees.slice(0, 12),
      escapeeCount: escapees.length,
    };
  }

  return {
    viewport: { W, H },
    hit: {
      points: cells,
      hudPct: +((hit.hud / cells) * 100).toFixed(1),
      buildPct: +((hit.build / cells) * 100).toFixed(1),
      totalPct: +(((hit.hud + hit.build) / cells) * 100).toFixed(1),
      parkPct: +((hit.park / cells) * 100).toFixed(1),
    },
    ink: {
      hudPct: +((ink.hud / cells) * 100).toFixed(1),
      buildPct: +((ink.build / cells) * 100).toFixed(1),
      totalPct: +((ink.any / cells) * 100).toFixed(1),
      scrimOnlyPct: +((ink.scrim / cells) * 100).toFixed(1),
      surfaces: painted.length,
    },
    boxes: {
      topRow: boxOf('[data-hud-top]'),
      bottomStack: boxOf('[data-hud-bottom]'),
      dock: boxOf('[data-panel-dock]'),
      buildBar: boxOf('[data-build-bar]'),
      notices: boxOf('[data-hud-notices]'),
      rail: boxOf('[data-hud-rail]'),
    },
    panels,
    trayBreak,
    docScroll: {
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    },
  };
});

await page.screenshot({ path: path.join(out, `${label}.png`) });
const report = {
  url: `${base}/game`,
  label,
  viewport: { width, height },
  tod,
  panelsOpened: panels,
  stepTicks,
  ...measurement,
  console: console_,
};
await writeFile(path.join(out, `${label}.json`), JSON.stringify(report, null, 2));
await browser.close();

const { hit, ink } = measurement;
console.log(
  `${label}\n` +
    `  hit  total ${hit.totalPct}%  (ui ${hit.hudPct} + build ${hit.buildPct})  park ${hit.parkPct}%\n` +
    `  ink  total ${ink.totalPct}%  (ui ${ink.hudPct} + build ${ink.buildPct})  scrim only ${ink.scrimOnlyPct}%\n` +
    `  panels ${measurement.panels.map((p) => `${p.id} h=${p.rect.h} hidden=${p.hiddenPx}`).join(' · ') || '—'}\n` +
    `  tray ${measurement.trayBreak ? `h=${measurement.trayBreak.rect.h} squashed=${measurement.trayBreak.squashedBy} escapees=${measurement.trayBreak.escapeeCount}` : '—'}\n` +
    `  errors ${console_.errors.length} · hydration ${console_.hydration.length}`
);
