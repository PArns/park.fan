/**
 * Screenshots of the header's planner band with two to four regions, a layout no page can show
 * while Orlando is the only live region. Bundles `scripts/fixtures/planner-menu/regions.tsx` (the
 * real `PlannerMenuPanel` with the coming regions as fixture data) for the browser, lays it into a
 * page that loads a running site's stylesheets, and shoots it in light and dark, per region count
 * and width. Every shot also checks that no region's name is cut: a name taller than one line is
 * fine, one wider than its tile is a failure.
 *
 * Needs a running site for the CSS, fonts and photos: `pnpm build && pnpm start`, then
 *
 *     node scripts/shoot-planner-regions.mjs --base=http://localhost:3000 --out=/tmp/shots
 *     node scripts/shoot-planner-regions.mjs --regions=4 --widths=390,1024,1440
 *
 * Writes `<out>/planner-<n>-regions-<width>-<locale>-<theme>.png`, two device pixels per px.
 * Defaults: two and four regions, at 390, 1024 and 1440 px.
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
const COUNTS = arg('regions', '2,4').split(',').map(Number);
const WIDTHS = arg('widths', '390,1024,1440').split(',').map(Number);

/** The fixture as one browser script, the router-bound modules swapped for plain stand-ins. */
async function bundle() {
  const stubs = {
    '@/i18n/navigation': path.join(FIXTURE, 'link.tsx'),
    'next/image': path.join(FIXTURE, 'image.tsx'),
  };
  const result = await build({
    entryPoints: [path.join(FIXTURE, 'regions.tsx')],
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
let failures = 0;
for (const count of COUNTS) {
  for (const width of WIDTHS) {
    for (const locale of ['de', 'en']) {
      for (const theme of ['light', 'dark']) {
        const page = await browser.newPage({
          viewport: { width, height: width < 768 ? 1400 : 900 },
          deviceScaleFactor: 2,
        });
        page.on('pageerror', (error) => console.error(`  [${locale} ${theme}]`, error.message));
        await page.setContent(
          `<!doctype html><html lang="${locale}" data-regions="${count}" class="${theme === 'dark' ? 'dark' : ''}"><head>` +
            `<base href="${BASE}/">${css.map((href) => `<link rel="stylesheet" href="${href}">`).join('')}` +
            `</head><body class="bg-background text-foreground"><div id="root"></div></body></html>`,
          { waitUntil: 'networkidle' }
        );
        await page.addScriptTag({ content: script });
        await page.waitForSelector('[data-nav-panel] section');
        // The scenes' chunk is bundled in; let the photos load and the launch play once.
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2200);
        // A tile's name may wrap, never run past its tile.
        const cut = await page.$$eval('[data-nav-panel] a.group.relative', (tiles) =>
          tiles.flatMap((tile) => {
            const name = tile.querySelector('.text-xl');
            if (!name) return [];
            const box = tile.getBoundingClientRect();
            const text = name.getBoundingClientRect();
            return text.right > box.right + 0.5 || name.scrollWidth > name.clientWidth + 0.5
              ? [name.textContent]
              : [];
          })
        );
        if (cut.length > 0) {
          failures += 1;
          console.error(
            `  cut at ${count} regions, ${width} px, ${locale} ${theme}: ${cut.join(', ')}`
          );
        }
        const file = path.join(OUT, `planner-${count}-regions-${width}-${locale}-${theme}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`wrote ${file}`);
        await page.close();
      }
    }
  }
}
await browser.close();
if (failures > 0) process.exit(1);
