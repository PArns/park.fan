/**
 * Unit tests for the header's planner band: the trip-planner regions (`lib/navigation/trip-regions.ts`),
 * the quick starts into the day planner (`lib/planner/quick-start.ts`) and the plain-click rule
 * they share with the park header's planner link (`lib/utils/plain-click.ts`).
 *
 * The regions are a list a new region joins in one entry, and three readers take it on trust: the
 * band, the phone sheet and `pnpm check:header-links`. A quick start is a link to a park's page
 * whose plain click also names the park to the planner and asks for its wizard; a modified click
 * must stay the browser's, or "open in a new tab" would start the planner in this one.
 *
 * Run: pnpm test:planner-menu
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRIP_REGIONS, tripRegion, tripRegionName } from '../lib/navigation/trip-regions.ts';
import {
  QUICK_START_LIMIT,
  plannerQuickStarts,
  quickStartClick,
  startPlannerAt,
} from '../lib/planner/quick-start.ts';
import { plannerPagePark } from '../lib/planner/page-park.ts';
import { plannerUi } from '../lib/planner/ui-store.ts';
import { isPlainPrimaryClick } from '../lib/utils/plain-click.ts';

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
  test(
    `${region.id}: href is locale-relative`,
    /^\/(?!(de|en|fr|it|nl|es)\/)/.test(region.href),
    true
  );
  test(
    `${region.id}: the photo is in public/`,
    existsSync(join(root, 'public', region.photo.replace(/^\//, ''))),
    true
  );
  test(`${region.id}: found by id`, tripRegion(region.id) === region, true);
}
test(
  'Orlando opens its hub on the planner chapter',
  tripRegion('orlando')?.href,
  '/orlando#planner'
);
test('Orlando is Orlando in Dutch', tripRegionName(tripRegion('orlando'), 'nl'), 'Orlando');
const japan = {
  id: 'japan',
  name: { en: 'Japan', de: 'Japan', fr: 'Japon', it: 'Giappone', nl: 'Japan', es: 'Japón' },
  href: '/japan',
  photo: '',
};
test('a per-locale name is the locale’s', tripRegionName(japan, 'it'), 'Giappone');
test('an unknown locale reads English', tripRegionName(japan, 'pt'), 'Japan');

// ── The quick starts ─────────────────────────────────────────────────────────
const card = (slug, href, extra = {}) => ({
  slug,
  name: slug,
  href,
  city: 'City',
  countrySlug: 'germany',
  ...extra,
});
const rail = [
  card('phantasialand', '/parks/europe/germany/bruehl/phantasialand', {
    image: '/media/phantasialand/background-16x9.jpg?v=1',
  }),
  card('broken', '/parks/europe/germany'),
  card('europa-park', '/parks/europe/germany/rust/europa-park', {
    image: '/media/europa-park/x.jpg',
    imagePosition: '50% 40%',
  }),
  ...Array.from({ length: 8 }, (_, i) =>
    card(`park-${i}`, `/parks/europe/germany/city-${i}/park-${i}`)
  ),
];
const starts = plannerQuickStarts(rail);
test(
  'the rail keeps its order',
  starts.slice(0, 2).map((s) => s.slug),
  ['phantasialand', 'europa-park']
);
test(
  'a card without geography is dropped',
  starts.some((s) => s.slug === 'broken'),
  false
);
test('at most the limit', starts.length, QUICK_START_LIMIT);
test('a smaller limit holds', plannerQuickStarts(rail, 2).length, 2);
test('the geography is the path’s', starts[0].geo, {
  continent: 'europe',
  country: 'germany',
  city: 'bruehl',
});
test('no photo, no image field', 'image' in starts[2], false);
test(
  'a photo travels with its position',
  [starts[1].image, starts[1].imagePosition],
  ['/media/europa-park/x.jpg', '50% 40%']
);
test('an empty rail starts nothing', plannerQuickStarts([]), []);

// ── The open signal ──────────────────────────────────────────────────────────
const before = plannerUi.getWizardSnapshot();
startPlannerAt(starts[0], 'menu-park');
test('the park is named to the planner', plannerPagePark.getSnapshot()?.slug, 'phantasialand');
test('its photo goes along', plannerPagePark.getSnapshot()?.backgroundImage, starts[0].image);
test('the wizard is asked for', plannerUi.getWizardSnapshot(), before + 1);
test('the way in is the menu\u2019s park', plannerUi.getOpenSource(), 'menu-park');

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
