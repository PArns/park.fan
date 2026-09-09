/**
 * Unit tests for the favorites band's geometry (`lib/utils/favorites-band-plan.ts`).
 *
 * Two properties are worth guarding. The first is the one the function exists for:
 * **every card in the band is the same width**, whatever the split between the groups —
 * the fault it was written against drew 336 px park cards beside 179 px ride cards and
 * stood the band 868 px tall.
 *
 * The second is that the alerts group did not move anything. It added a second row-shaped
 * group, so `rowGroups` is a count now rather than a boolean, and every band that existed
 * before it must plan byte-for-byte as it did — which is checkable, because the old
 * arithmetic is a closed form.
 *
 * Run: pnpm test:favorites-band
 */

import {
  CARD_GAP,
  CARD_MAX,
  CARD_MIN,
  GROUP_GAP,
  MAX_CARDS,
  VENUE_BASIS,
  planBand,
  shareTracks,
  stackBelow,
} from '../lib/utils/favorites-band-plan.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

/** What `planBand` did before the alerts group existed, transcribed from `git show`. */
function planBandBefore(width, counts) {
  const STACK_BELOW = 2 * CARD_MIN + CARD_GAP + GROUP_GAP + VENUE_BASIS;
  if (width <= 0) return null;
  const wanted = [Math.min(counts.parks, MAX_CARDS), Math.min(counts.attractions, MAX_CARDS)];
  const cardGroups = wanted.filter((w) => w > 0).length;
  const venues = counts.shows + counts.restaurants > 0;
  const groups = cardGroups + (venues ? 1 : 0);
  const stacked = groups > 1 && width < STACK_BELOW;
  if (cardGroups === 0) return { stacked, card: 0, parks: 0, attractions: 0 };
  const forCards = stacked ? width : width - (groups - 1) * GROUP_GAP - (venues ? VENUE_BASIS : 0);
  const sharers = stacked ? 1 : cardGroups;
  const tracks = Math.max(sharers, Math.floor((forCards + CARD_GAP) / (CARD_MIN + CARD_GAP)));
  const cols = stacked ? wanted.map((w) => (w > 0 ? tracks : 0)) : shareTracks(tracks, wanted);
  const used = stacked ? tracks : cols.reduce((a, b) => a + b, 0);
  const card = Math.floor(Math.min(CARD_MAX, (forCards - (used - sharers) * CARD_GAP) / used));
  return { stacked, card, parks: cols[0], attractions: cols[1] };
}

const show = (plan) => (plan === null ? 'null' : JSON.stringify(plan));

// The widths the band is actually opened at. 992 is the narrowest anybody reaches — the nav
// row that holds the trigger needs a 1024 px header, and the trip planner insets it by 448
// at the wide end. 1248 is a 1280 px window's container.
const WIDTHS = [992, 1120, 1248, 1440, 1824];

// ---------------------------------------------------------------------------
// The alerts group changed nothing for a band that does not have one
// ---------------------------------------------------------------------------

const COUNT_SHAPES = [
  { parks: 0, attractions: 0, shows: 0, restaurants: 0 },
  { parks: 1, attractions: 0, shows: 0, restaurants: 0 },
  { parks: 3, attractions: 5, shows: 0, restaurants: 0 },
  { parks: 3, attractions: 5, shows: 3, restaurants: 0 },
  { parks: 8, attractions: 8, shows: 2, restaurants: 4 },
  { parks: 0, attractions: 6, shows: 1, restaurants: 0 },
  { parks: 12, attractions: 1, shows: 0, restaurants: 2 },
];

for (const width of WIDTHS) {
  for (const counts of COUNT_SHAPES) {
    const rowGroups = counts.shows + counts.restaurants > 0 ? 1 : 0;
    test(
      `unchanged at ${width} px for ${JSON.stringify(counts)}`,
      () => show(planBand(width, counts, rowGroups)),
      show(planBandBefore(width, counts))
    );
  }
}

test(
  'stackBelow with no row group is the number it was with one',
  () => `${stackBelow(0)}/${stackBelow(1)}`,
  `${2 * CARD_MIN + CARD_GAP + GROUP_GAP + VENUE_BASIS}/${2 * CARD_MIN + CARD_GAP + GROUP_GAP + VENUE_BASIS}`
);

test(
  'a second row group raises the stacking floor by one slice',
  () => stackBelow(2) - stackBelow(1),
  GROUP_GAP + VENUE_BASIS
);

// ---------------------------------------------------------------------------
// One card width, and the groups fit the band
// ---------------------------------------------------------------------------

/** What the row of groups actually measures, given a plan. */
function bandUsed(plan, counts, rowGroups) {
  const cardGroups = [plan.parks, plan.attractions].filter((c) => c > 0);
  const groups = cardGroups.length + rowGroups;
  const cards = cardGroups.reduce((sum, cols) => sum + cols * plan.card + (cols - 1) * CARD_GAP, 0);
  return cards + rowGroups * VENUE_BASIS + Math.max(0, groups - 1) * GROUP_GAP;
}

for (const width of WIDTHS) {
  for (const rowGroups of [0, 1, 2]) {
    for (const counts of [
      { parks: 3, attractions: 5 },
      { parks: 1, attractions: 8 },
      { parks: 8, attractions: 8 },
      { parks: 2, attractions: 0 },
    ]) {
      const plan = planBand(width, counts, rowGroups);
      test(
        `fits the band at ${width} px, ${rowGroups} row group(s), ${counts.parks}p/${counts.attractions}a`,
        () => (plan.stacked ? 'stacked' : bandUsed(plan, counts, rowGroups) <= width),
        plan.stacked ? 'stacked' : true
      );
      test(
        `card stays inside [${CARD_MIN}, ${CARD_MAX}] at ${width} px, ${rowGroups} row group(s), ${counts.parks}p/${counts.attractions}a`,
        () => plan.card >= CARD_MIN && plan.card <= CARD_MAX,
        true
      );
    }
  }
}

// The regression the function was written for, now with the alerts group beside the venues.
test(
  'three parks and five rides get equal-width cards with two row groups at 1440',
  () => {
    const plan = planBand(1440, { parks: 3, attractions: 5 }, 2);
    return `card=${plan.card} parks=${plan.parks} rides=${plan.attractions} stacked=${plan.stacked}`;
  },
  // 1440 − 3 group gaps − 2 × 208 leaves 928 for the cards, which is five 168 px tracks;
  // the rides take three of them and the parks two, at one width for all five.
  'card=178 parks=2 rides=3 stacked=false'
);

test(
  'a band with only row groups plans no cards',
  () => show(planBand(1248, { parks: 0, attractions: 0 }, 2)),
  show({ stacked: false, card: 0, parks: 0, attractions: 0 })
);

test('no width, no plan', () => show(planBand(0, { parks: 3, attractions: 5 }, 1)), 'null');

// ---------------------------------------------------------------------------
// shareTracks
// ---------------------------------------------------------------------------

// Both spare tracks go to the rides: after the first, 5/3 still beats 3/2.
test(
  'five rides outbid three parks for both spare tracks',
  () => shareTracks(4, [3, 5]).join(','),
  '1,3'
);
test(
  'a group never gets more tracks than it has cards',
  () => shareTracks(9, [2, 3]).join(','),
  '2,3'
);
test('an empty group gets none', () => shareTracks(4, [0, 5]).join(','), '0,4');

// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `THREW: ${error.message}`;
  }
  if (result === testCase.expected) {
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
