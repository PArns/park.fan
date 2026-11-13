/**
 * Screenshots of the header's planner band with two regions, a layout no page can show while
 * Orlando is the only one. Bundles `scripts/fixtures/planner-menu/two-regions.tsx` (the real
 * `PlannerMenuPanel` with a made-up second region) for the browser, lays it into a page that loads
 * a running site's stylesheets, and shoots it in light and dark.
 *
 * Needs a running site for the CSS, fonts and photos: `pnpm build && pnpm start`, then
 *
 *     node scripts/shoot-planner-regions.mjs --base=http://localhost:3000 --out=/tmp/shots
 *
 * Writes `<out>/planner-two-regions-<locale>-<theme>.png` at 1280 px, two device pixels per px.
 */
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = path.join(ROOT, 'scripts/fixtures/planner-menu');
const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const BASE = arg('base', 'http://localhost:3000').replace(/\/$/, '');
const OUT = arg('out', path.join(ROOT, '.planner-regions'));

/** The fixture as one browser script, the router-bound modules swapped for plain stand-ins. */
async function bundle() {
  const stubs = {
    '@/i18n/navigation': path.join(FIXTURE, 'link.tsx'),
    'next/image': path.join(FIXTURE, 'image.tsx'),
  };
  const result = await build({
    entryPoints: [path.join(FIXTURE, 'two-regions.tsx')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'chrome120',
    jsx: 'automatic',
    write: false,
    logLevel: 'silent',
    tsconfig: path.join(ROOT, 'tsconfig.json'),
    define: { 'process.env.NODE_ENV': '"production"' },
    // Modules the panel reaches read other `process.env` names; in the page they are all unset.
    banner: { js: 'var process = { env: {} };' },
    plugins: [
      {
        name: 'fixture-stubs',
        setup(b) {
          b.onResolve({ filter: /^(@\/i18n\/navigation|next\/image)$/ }, (args) => ({
            path: stubs[args.path],
          }));
        },
      },
    ],
  });
  return result.outputFiles[0].text;
}

/** The stylesheets a served page of the site links, as absolute URLs. */
async function stylesheets() {
  const html = await (await fetch(`${BASE}/de/parks/europe/germany`)).text();
  return [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
}

const script = await bundle();
const css = await stylesheets();
if (css.length === 0) throw new Error(`no stylesheets at ${BASE}`);
mkdirSync(OUT, { recursive: true });

const preinstalled = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(preinstalled) ? { executablePath: preinstalled } : {}
);
for (const locale of ['de', 'en']) {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 760 },
      deviceScaleFactor: 2,
    });
    page.on('pageerror', (error) => console.error(`  [${locale} ${theme}]`, error.message));
    await page.setContent(
      `<!doctype html><html lang="${locale}" class="${theme === 'dark' ? 'dark' : ''}"><head>` +
        `<base href="${BASE}/">${css.map((href) => `<link rel="stylesheet" href="${href}">`).join('')}` +
        `</head><body class="bg-background text-foreground"><div id="root"></div></body></html>`,
      { waitUntil: 'networkidle' }
    );
    await page.addScriptTag({ content: script });
    await page.waitForSelector('[data-nav-panel] section');
    // The scenes' chunk is bundled in; let the photos load and the launch play once.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2200);
    const file = path.join(OUT, `planner-two-regions-${locale}-${theme}.png`);
    await page.screenshot({ path: file });
    console.log(`wrote ${file}`);
    await page.close();
  }
}
await browser.close();
