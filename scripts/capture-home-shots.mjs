/**
 * The screenshots in the homepage's tour (`HomeTour`), taken from the real pages on a phone in each
 * of the six languages: a park page's live waits, its crowd calendar and a ride's day. Live data, so
 * take them while the park is open; Parky's chat comes from `capture-parky-shots.mjs`.
 *
 * Needs a running site: `pnpm build && pnpm start -p 3100`, then
 * `node scripts/capture-home-shots.mjs --base=http://localhost:3100` (`--locale=de` for one).
 * Writes `public/home/<locale>/{park,calendar,ride}.webp`.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { chromium, devices } from 'playwright';
import sharp from 'sharp';

const base =
  process.argv.find((arg) => arg.startsWith('--base='))?.slice(7) ?? 'http://localhost:3000';
const only = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9);

const PARK = 'parks/europe/germany/rust/europa-park';
const RIDE = `${PARK}/silver-star`;

/** The calendar's segment per locale, as `PARK_CALENDAR_SEGMENTS` names it. */
const CALENDAR = {
  en: 'wait-time-calendar',
  de: 'wartezeiten-kalender',
  fr: 'calendrier-temps-attente',
  it: 'calendario-tempi-attesa',
  nl: 'wachttijden-kalender',
  es: 'calendario-tiempos-espera',
};

/** The browser language per locale, so the page offers no other language in a banner. */
const BROWSER_LOCALE = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  nl: 'nl-NL',
  es: 'es-ES',
};

/**
 * Each shot: the page, and the element that sits right under the 48 px header, found in the page
 * (`top`, run in the browser, so it can only use what it is handed).
 */
const SHOTS = [
  {
    name: 'park',
    path: () => PARK,
    top: () => document.querySelector('[id$="-trigger-attractions"]'),
  },
  {
    name: 'calendar',
    path: (locale) => `${PARK}/${CALENDAR[locale]}`,
    // The month grid's chapter, the one after the best days.
    top: () => {
      const sections = [...document.querySelectorAll('main section')];
      return sections[sections.findIndex((s) => s.querySelector('#best-days-heading')) + 1];
    },
  },
  { name: 'ride', path: () => RIDE, top: () => document.querySelector('section#live') },
];

/** Floating things that belong to a visitor's session, not to the page being shown. */
const HIDE = `
  .tsqd-parent-container, nextjs-portal,
  [class*="bottom-[max(1rem,env(safe-area-inset-bottom))]"],
  [class*="planner-wide:right-[var(--planner"] { display: none !important; }
`;

async function capture(browser, locale, shot) {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: BROWSER_LOCALE[locale],
    timezoneId: 'Europe/Berlin',
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await page.goto(`${base}/${locale}/${shot.path(locale)}?assistant=off`, {
    waitUntil: 'load',
    timeout: 300_000,
  });
  await page.addStyleTag({ content: HIDE });
  // Long enough for the live data and the page's images to arrive.
  await page.waitForTimeout(6_000);
  const top = await page.evaluateHandle(shot.top);
  await page.evaluate((element) => {
    if (element) window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 56);
  }, top);
  await page.waitForTimeout(1_500);
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 82 }).toFile(`public/home/${locale}/${shot.name}.webp`);
  console.log(`  ✓ ${locale}/${shot.name}.webp`);
  await context.close();
}

const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
);
for (const locale of Object.keys(CALENDAR)) {
  if (only && locale !== only) continue;
  mkdirSync(`public/home/${locale}`, { recursive: true });
  for (const shot of SHOTS) await capture(browser, locale, shot);
}
await browser.close();
