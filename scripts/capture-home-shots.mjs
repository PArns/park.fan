/**
 * The screenshots on the homepage's phones, taken from the real pages on a phone in each of the six
 * languages: for the tour (`HomeTour`) a park page's live waits, its crowd calendar and a ride's
 * day; for the favourites intro (`FavoritesIntro`) a park page with its star just pressed and the
 * menu with a visitor's favourites. Live data, so take the tour while Europa-Park is open and the
 * favourites while Tokyo Disneyland and Tokyo DisneySea are, which is while Europe sleeps; Parky's
 * chat comes from `capture-parky-shots.mjs`.
 *
 * Needs a running site: `pnpm build && pnpm start -p 3100`, then
 * `node scripts/capture-home-shots.mjs --base=http://localhost:3100` (`--locale=de` for one
 * language, `--shot=favorite,favorites-menu` for some of the shots). Writes
 * `public/media/home/<locale>/{park,calendar,ride,favorite,favorites-menu}.webp`.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { PHONE } from './lib/phone-device.mjs';
import { TOUR_PARK } from '../lib/home/tour-park.mjs';

const base =
  process.argv.find((arg) => arg.startsWith('--base='))?.slice(7) ?? 'http://localhost:3000';
const only = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9);
const onlyShots = process.argv
  .find((arg) => arg.startsWith('--shot='))
  ?.slice(7)
  .split(',');

const PARK = TOUR_PARK.path;
const RIDE = `${PARK}/silver-star`;
const TOKYO_DISNEYLAND = 'parks/asia/japan/tokyo/tokyo-disneyland';

/** A favourites cookie as `saveFavoritesToCookies` writes it. */
const favoritesCookie = (parks, attractions = []) => ({
  parks,
  attractions,
  shows: [],
  restaurants: [],
});

/**
 * The menu's favourites with a wait each, as on a day the parks are open. The parks are ours with
 * photos, so every row has its picture, and the request is the real one: only the live fields of
 * its answer are set (`mockLive`), so the shot does not wait for both parks to open.
 */
const MENU_LIVE = {
  parks: {
    '313ca334-c04f-4855-bfd9-c8beb7a00d98': { wait: 25, crowd: 'moderate' }, // Phantasialand
    'e119ba74-0e0e-49f2-bf33-d4db83722b32': { wait: 30, crowd: 'moderate' }, // Europa-Park
  },
  attractions: {
    '4249fed8-46f7-4848-abae-57cf7953c9b2': { wait: 35, crowd: 'moderate' }, // Taron
    '026b7257-d76a-41f5-bcc4-551549467697': { wait: 15, crowd: 'low' }, // Black Mamba
    '6605cc00-e3cd-4a50-ae89-c8b98c2e5dea': { wait: 25, crowd: 'moderate' }, // Silver Star
    'd3b7a1af-d32c-4f2b-a5c4-2aec353c180a': { wait: 45, crowd: 'high' }, // Voltron Nevera
  },
};

/** Opens every favourite in `/v1/favorites`'s answer with its wait from {@link MENU_LIVE}. */
function mockLive(data) {
  for (const park of data.parks ?? []) {
    const live = MENU_LIVE.parks[park.id];
    if (!live) continue;
    park.status = 'OPERATING';
    park.analytics = { ...park.analytics, avgWaitTime: live.wait, crowdLevel: live.crowd };
  }
  for (const ride of data.attractions ?? []) {
    const live = MENU_LIVE.attractions[ride.id];
    if (!live) continue;
    ride.status = 'OPERATING';
    ride.effectiveStatus = 'OPERATING';
    ride.crowdLevel = live.crowd;
    ride.queues = [{ queueType: 'STANDBY', status: 'OPERATING', waitTime: live.wait }];
  }
  return data;
}

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
 * (`top`, run in the browser, so it can only use what it is handed). `favorites` is the cookie the
 * shot is taken with, `live` rewrites the favourites request's answer, and `prepare` acts on the
 * page before the shot.
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
  {
    name: 'favorite',
    // Open while Europe sleeps, so its live waits are real whenever the tour's park is closed.
    path: () => TOKYO_DISNEYLAND,
    favorites: favoritesCookie(['9158aa77-ee0b-4e4e-b656-ef513623026f']),
    // The title's star, pressed, in a ring of its own amber: the one thing a reader looks for.
    prepare: (page) =>
      page.evaluate(() => {
        const star = document.querySelector('main button[aria-pressed] svg.h-6')?.closest('button');
        if (!star) return;
        Object.assign(star.style, {
          borderRadius: '9999px',
          padding: '10px',
          margin: '-10px',
          background: 'rgb(251 191 36 / 0.14)',
          boxShadow:
            '0 0 0 2px rgb(251 191 36 / 0.9), 0 0 0 10px rgb(251 191 36 / 0.18), 0 0 36px 14px rgb(251 191 36 / 0.35)',
        });
      }),
  },
  {
    name: 'favorites-menu',
    path: () => TOKYO_DISNEYLAND,
    favorites: favoritesCookie(Object.keys(MENU_LIVE.parks), Object.keys(MENU_LIVE.attractions)),
    live: mockLive,
    // The burger sheet, open on the page: the favourites stand under the newest news post.
    prepare: async (page) => {
      await page.locator('header button:has(svg.lucide-menu)').click();
      await page.waitForTimeout(2_500);
    },
  },
];

/** Floating things that belong to a visitor's session, not to the page being shown. */
const HIDE = `
  .tsqd-parent-container, nextjs-portal,
  [class*="bottom-[max(1rem,env(safe-area-inset-bottom))]"],
  [class*="planner-wide:right-[var(--planner"] { display: none !important; }
`;

async function capture(browser, locale, shot) {
  const context = await browser.newContext({
    ...PHONE,
    locale: BROWSER_LOCALE[locale],
    timezoneId: 'Europe/Berlin',
    colorScheme: 'dark',
  });
  if (shot.favorites) {
    await context.addCookies([
      { name: 'favorites', value: encodeURIComponent(JSON.stringify(shot.favorites)), url: base },
    ]);
  }
  const page = await context.newPage();
  if (shot.live) {
    await page.route(
      // The relay (`/api/favorites`) or the API itself, whichever `browserApiUrl` picks.
      (url) => /\/(api|v1)\/favorites$/.test(url.pathname),
      async (route) => {
        const response = await route.fetch();
        await route.fulfill({ response, json: shot.live(await response.json()) });
      }
    );
  }
  await page.goto(`${base}/${locale}/${shot.path(locale)}?assistant=off`, {
    waitUntil: 'load',
    timeout: 300_000,
  });
  await page.addStyleTag({ content: HIDE });
  // Long enough for the live data and the page's images to arrive.
  await page.waitForTimeout(6_000);
  if (shot.top) {
    const top = await page.evaluateHandle(shot.top);
    await page.evaluate((element) => {
      if (element) window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 56);
    }, top);
  }
  await shot.prepare?.(page);
  await page.waitForTimeout(1_500);
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 82 }).toFile(`public/media/home/${locale}/${shot.name}.webp`);
  console.log(`  ✓ ${locale}/${shot.name}.webp`);
  await context.close();
}

const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
);
for (const locale of Object.keys(CALENDAR)) {
  if (only && locale !== only) continue;
  mkdirSync(`public/media/home/${locale}`, { recursive: true });
  for (const shot of SHOTS) {
    if (onlyShots && !onlyShots.includes(shot.name)) continue;
    await capture(browser, locale, shot);
  }
}
await browser.close();
