/**
 * park.fan Coaster — the auto-exposure across a whole day.
 *
 * Three module critiques blame the same flat, dark 18:30 frame on `environment`, and this is the
 * measurement behind that. It walks the clock through seventeen times of day on the environment
 * showcase and prints the exposure, the contrast, the sun's intensity and the fog at each, marking
 * every hour that sits on `EXPOSURE_MIN` or `EXPOSURE_MAX`.
 *
 *   node scripts/game-exposure-curve.mjs                  # clear
 *   node scripts/game-exposure-curve.mjs --weather=storm  # and under weather
 *
 * Needs a running site. What it found the first time: ten of seventeen hours pinned at MAX, from
 * 18:00 right through to 06:00, so dusk, twilight, night and midnight are all metered identically —
 * and the metering only ever moves 1.82x across the entire day.
 */
import { chromium } from 'playwright';
const weather = process.argv.find((a) => a.startsWith('--weather='))?.slice(10) ?? '';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message).slice(0, 120)));
await p.goto(`http://localhost:3000/game?harness=1&speed=0&engine=webgl2&showcase=environment${weather ? '&weather=' + weather : ''}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForFunction(() => globalThis.__parkfan_game?.ready === true, null, { timeout: 120000 });
const rows = [];
for (const hhmm of ['05:00','06:00','07:00','08:00','10:00','12:00','14:00','16:00','17:30','18:00','18:30','19:00','19:30','20:00','21:00','22:00','00:00']) {
  const [h, m] = hhmm.split(':').map(Number);
  await p.evaluate((min) => globalThis.__parkfan_game.setTimeOfDay(min), h * 60 + m);
  await p.waitForTimeout(2600);
  const r = await p.evaluate(() => {
    const g = globalThis.__parkfan_game;
    const s = g.scene();
    const env = g.handle.handles.get('environment')?.api;
    const cur = env?.current?.(g.world().clock.minute, g.world().clock.day) ?? {};
    const sun = s.lights.find((l) => l.name === 'sun');
    return {
      exposure: Math.round((s.imageProcessingConfiguration?.exposure ?? 0) * 1000) / 1000,
      contrast: Math.round((s.imageProcessingConfiguration?.contrast ?? 0) * 1000) / 1000,
      fog: Math.round((s.fogDensity ?? 0) * 1e6) / 1e6,
      sunIntensity: sun ? Math.round(sun.intensity * 1000) / 1000 : null,
      night: cur.night != null ? Math.round(cur.night * 100) / 100 : null,
      cloud: cur.cloud != null ? Math.round(cur.cloud * 100) / 100 : null,
    };
  });
  rows.push({ at: hhmm, ...r });
}
const MAX = 3.6, MIN = 1.0;
console.log(`time    exposure  pinned  contrast  sunI   night cloud  fog`);
for (const r of rows) {
  const pin = r.exposure >= MAX - 0.001 ? 'MAX' : r.exposure <= MIN + 0.001 ? 'min' : '   ';
  console.log(`${r.at}   ${String(r.exposure).padStart(6)}   ${pin}    ${String(r.contrast).padStart(5)}  ${String(r.sunIntensity).padStart(6)}  ${String(r.night).padStart(4)} ${String(r.cloud).padStart(4)}  ${r.fog}`);
}
const pinned = rows.filter((r) => r.exposure >= MAX - 0.001).length;
console.log(`\npinned at MAX in ${pinned} of ${rows.length} sampled hours${weather ? ' (' + weather + ')' : ''}`);
if (errors.length) console.log('errors', errors);
await b.close();
