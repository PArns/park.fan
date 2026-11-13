/**
 * Unit tests for the header's planner band: the trip-planner regions (`lib/navigation/trip-regions.ts`),
 * the band's data (`lib/navigation/planner-menu.ts`), the quick starts into the day planner
 * (`lib/planner/quick-start.ts`) and the plain-click rule they share with the park header's planner
 * link (`lib/utils/plain-click.ts`).
 *
 * The regions are a list a new region joins in one entry, and three readers take it on trust: the
 * band, the phone sheet and `pnpm check:header-links`. The parks are the locale's most opened,
 * without an entry that had no published hours ahead when the build read the geo structure
 * (Traumatica once its Halloween run is over). A quick start is a link to a park's page whose plain
 * click also names the park to the planner and asks for its wizard; a modified click must stay the
 * browser's, or "open in a new tab" would start the planner in this one.
 *
 * Needs the generated manifests and seed (`pnpm test:unit` writes them).
 *
 * Run: pnpm test:planner-menu
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRIP_REGIONS, tripRegion, tripRegionText } from '../lib/navigation/trip-regions.ts';
import {
  PLANNER_MENU_PARKS,
  getPlannerMenu,
  pickPlannerParks,
} from '../lib/navigation/planner-menu.ts';
import { EVENT_PARK_SLUGS } from '../lib/parks/event-parks.ts';
import { MOST_READ_SEED } from '../lib/blog/most-read-seed.generated.ts';
import { plannerQuickStarts, quickStartClick, startPlannerAt } from '../lib/planner/quick-start.ts';
import { plannerPagePark } from '../lib/planner/page-park.ts';
import { plannerUi } from '../lib/planner/ui-store.ts';
import { isPlainPrimaryClick } from '../lib/utils/plain-click.ts';
import { locales } from '../i18n/config.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
let passed = 0;
const test = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  else {
    failures++;
    console.error(
      `❌ ${name}\n   expected ${JSON.stringify(expected)}\n   got      ${JSON.stringify(actual)}`
    );
  }
};

// ── The regions ──────────────────────────────────────────────────────────────
test('at least one region', TRIP_REGIONS.length > 0, true);
test('region ids are unique', new Set(TRIP_REGIONS.map((r) => r.id)).size, TRIP_REGIONS.length);
for (const region of TRIP_REGIONS) {
  // Locale-relative: the i18n `Link` adds the prefix, and check:header-links adds it too.
  const relative = (href) => /^\/(?!(de|en|fr|it|nl|es)\/)/.test(href);
  test(`${region.id}: the planner link is locale-relative`, relative(region.href), true);
  test(`${region.id}: the calendar link is locale-relative`, relative(region.calendarHref), true);
  test(
    `${region.id}: the photo is in public/`,
    existsSync(join(root, 'public', region.photo.replace(/^\//, ''))),
    true
  );
  test(`${region.id}: found by id`, tripRegion(region.id) === region, true);
  test(`${region.id}: its facts are counts`, region.parkCount > 0 && region.maxDays > 0, true);
}
test(
  'Orlando opens its hub on the planner chapter',
  tripRegion('orlando')?.href,
  '/orlando#planner'
);
// The region route's park list, as the hub's tests snapshot it: the card's „16 Parks" is its length.
const orlandoRegion = JSON.parse(
  readFileSync(join(root, 'scripts/fixtures/orlando/region.json'), 'utf8')
);
test(
  'Orlando counts the parks its region route lists',
  tripRegion('orlando')?.parkCount,
  orlandoRegion.parks.length
);
test('Orlando is Floride in French', tripRegionText(tripRegion('orlando').area, 'fr'), 'Floride');
test('one name for every language', tripRegionText('Orlando', 'nl'), 'Orlando');
const japan = { en: 'Japan', de: 'Japan', fr: 'Japon', it: 'Giappone', nl: 'Japan', es: 'Japón' };
test('a per-locale name is the locale’s', tripRegionText(japan, 'it'), 'Giappone');
test('an unknown locale reads English', tripRegionText(japan, 'pt'), 'Japan');

// ── The band's parks ─────────────────────────────────────────────────────────
for (const locale of locales) {
  const { parks, regions } = getPlannerMenu(locale);
  const ended = new Set(
    (MOST_READ_SEED.parks?.[locale] ?? [])
      .filter((park) => park.hasHoursAhead === false)
      .map((park) => park.href)
  );
  test(`${locale}: one card per region`, regions.length, TRIP_REGIONS.length);
  test(
    `${locale}: the region's photo resolves`,
    regions.every((r) => r.photo !== null),
    true
  );
  test(`${locale}: at most ${PLANNER_MENU_PARKS} parks`, parks.length <= PLANNER_MENU_PARKS, true);
  test(`${locale}: some parks`, parks.length > 0, true);
  test(
    `${locale}: park pages only`,
    parks.every((p) => p.href.startsWith('/parks/')),
    true
  );
  test(`${locale}: no park twice`, new Set(parks.map((p) => p.href)).size, parks.length);
  test(
    `${locale}: no event`,
    parks.filter((p) => EVENT_PARK_SLUGS.has(p.slug)).map((p) => p.slug),
    []
  );
  test(
    `${locale}: nothing without hours ahead`,
    parks.filter((p) => ended.has(p.href)).map((p) => p.slug),
    []
  );
}

// ── Events stay out even with hours ahead ────────────────────────────────────
// Traumatica publishes its hours every September; the hours check alone would offer it again.
const counted = (slug, hasHoursAhead = true) => ({
  slug,
  name: slug,
  href: `/parks/europe/germany/rust/${slug}`,
  city: 'Rust',
  countrySlug: 'germany',
  hasHoursAhead,
});
for (const slug of EVENT_PARK_SLUGS) {
  test(
    `${slug} is never offered, hours or not`,
    pickPlannerParks([counted(slug), counted('europa-park')], [counted(slug)]).map((p) => p.slug),
    ['europa-park']
  );
}
test(
  'a park with no hours ahead waits for its dates',
  pickPlannerParks([counted('heide-park', false), counted('europa-park')], []).map((p) => p.slug),
  ['europa-park']
);
test(
  'the curated list tops up, without doubles, to six',
  pickPlannerParks(
    [counted('europa-park')],
    ['europa-park', 'a', 'b', 'c', 'd', 'e', 'f'].map((slug) => counted(slug))
  ).map((p) => p.slug),
  ['europa-park', 'a', 'b', 'c', 'd', 'e']
);

// ── The quick starts ─────────────────────────────────────────────────────────
const card = (slug, href) => ({ slug, name: slug, href, city: 'City', countrySlug: 'germany' });
const starts = plannerQuickStarts([
  card('phantasialand', '/parks/europe/germany/bruehl/phantasialand'),
  card('broken', '/parks/europe/germany'),
  card('europa-park', '/parks/europe/germany/rust/europa-park'),
]);
test(
  'the band keeps its order',
  starts.map((s) => s.slug),
  ['phantasialand', 'europa-park']
);
test('a card without geography is dropped', starts.length, 2);
test('the geography is the path’s', starts[0].geo, {
  continent: 'europe',
  country: 'germany',
  city: 'bruehl',
});
test('an empty list starts nothing', plannerQuickStarts([]), []);

// ── The open signal ──────────────────────────────────────────────────────────
const before = plannerUi.getWizardSnapshot();
startPlannerAt(starts[0], 'menu-park');
test('the park is named to the planner', plannerPagePark.getSnapshot()?.slug, 'phantasialand');
test('the wizard is asked for', plannerUi.getWizardSnapshot(), before + 1);
test('the way in is the menu’s park', plannerUi.getOpenSource(), 'menu-park');

const click = (over = {}) => ({
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...over,
});
test('a plain click is plain', isPlainPrimaryClick(click()), true);
for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
  test(`${key} leaves it to the browser`, isPlainPrimaryClick(click({ [key]: true })), false);
}
test('another button leaves it to the browser', isPlainPrimaryClick(click({ button: 1 })), false);
test(
  'a handled click is not taken twice',
  isPlainPrimaryClick(click({ defaultPrevented: true })),
  false
);

const wizard = plannerUi.getWizardSnapshot();
quickStartClick(starts[1], 'menu-park')(click({ metaKey: true }));
test('a new-tab click starts nothing', plannerUi.getWizardSnapshot(), wizard);
test('… and names no park', plannerPagePark.getSnapshot()?.slug, 'phantasialand');
quickStartClick(starts[1], 'menu-park')(click());
test(
  'a plain click starts the planner on its park',
  plannerPagePark.getSnapshot()?.slug,
  'europa-park'
);
test('… once', plannerUi.getWizardSnapshot(), wizard + 1);

console.log(`${failures === 0 ? '✅' : '❌'} planner menu: ${passed} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
