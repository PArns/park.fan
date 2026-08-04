/**
 * Tests for the media database query layer (`lib/media`).
 *
 * Run: pnpm test:media
 *
 * Covers the behaviour that is easy to break silently: the search index agreeing
 * with the tokenizer that built it, role resolution preferring the canonical
 * image, and the GPS check classifying assignments correctly. A regression in any
 * of these produces no error — just images that quietly stop being found.
 */

import {
  getCollection,
  getHeroImages,
  getParkBackground,
  getParkImages,
  getRideImage,
  getRideImages,
  listTags,
  mediaStats,
  searchMedia,
} from '../lib/media/index.ts';
import { checkParkAssignment, distanceMeters, formatDistance } from '../lib/media/geo.ts';
import { getCreditLine, resolveMediaImage } from '../lib/media/text.ts';

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`✅ ${name}`);
  } else {
    failed += 1;
    console.log(
      `❌ ${name}\n   expected: ${JSON.stringify(expected)}\n   got:      ${JSON.stringify(actual)}`
    );
  }
}

function checkThat(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`✅ ${name}`);
  } else {
    failed += 1;
    console.log(`❌ ${name}${detail ? `\n   ${detail}` : ''}`);
  }
}

const ids = (images) => images.map((i) => i.id);

console.log('\n── database ─────────────────────────────────────────────────\n');

const stats = mediaStats();
checkThat('database is non-empty', stats.total > 0, `total=${stats.total}`);
checkThat(
  'every image has a src under /media',
  searchMedia().every((i) => i.src.startsWith('/media/'))
);
checkThat(
  'every image has intrinsic dimensions',
  searchMedia().every((i) => i.width > 0 && i.height > 0),
  ids(searchMedia().filter((i) => !i.width || !i.height)).join(', ')
);
checkThat('ids are unique', new Set(ids(searchMedia())).size === stats.total);

console.log('\n── search ───────────────────────────────────────────────────\n');

// Word-prefix search goes through the inverted index.
checkThat('prefix match finds the image', searchMedia({ q: 'arach' }).length > 0);
check(
  'prefix and full word agree',
  ids(searchMedia({ q: 'arach' })),
  ids(searchMedia({ q: 'arachnophobia' }))
);

// Mid-word fragments cannot come from a prefix index — they exercise the fallback.
checkThat('mid-word fragment falls back to substring', searchMedia({ q: 'phobia' }).length > 0);

// Diacritic folding: the German captions are full of umlauts.
checkThat('diacritics fold (grun → grün)', searchMedia({ q: 'grun' }).length > 0);

// Multi-word queries intersect rather than union.
const multi = searchMedia({ q: 'teddy baum' });
checkThat(
  'multi-word query intersects',
  multi.length > 0 && multi.length < searchMedia({ q: 'teddy' }).length
);

check('nonsense query returns nothing', searchMedia({ q: 'zzzznope' }).length, 0);
check('empty query returns everything', searchMedia({ q: '   ' }).length, stats.total);

// Search spans locales — this string exists only in the English caption.
checkThat('search covers non-German locales', searchMedia({ q: 'palm-sized' }).length > 0);

console.log('\n── filters ──────────────────────────────────────────────────\n');

checkThat('tag filter works', searchMedia({ tags: ['night'] }).length > 0);
checkThat(
  'tag filter ANDs',
  searchMedia({ tags: ['night', 'halloween'] }).length <= searchMedia({ tags: ['night'] }).length
);
checkThat('role filter works', searchMedia({ role: 'park-background' }).length > 0);
checkThat('park filter works', searchMedia({ park: 'toverland' }).length > 0);
check('filters compose with search', searchMedia({ q: 'troy', park: 'efteling' }).length, 0);
checkThat(
  'every tag is in the vocabulary report',
  listTags().every((t) => t.count > 0)
);

console.log('\n── roles ────────────────────────────────────────────────────\n');

checkThat(
  'park background resolves',
  getParkBackground('europa-park')?.id === 'europa-park/background'
);
check('unknown park has no background', getParkBackground('does-not-exist'), null);
check('null park slug is safe', getParkBackground(null), null);

const troy = getRideImage('toverland', 'troy');
checkThat('ride card resolves', troy?.id === 'toverland/troy', `got ${troy?.id}`);
checkThat('ride card is the one marked ride-card', troy?.roles.includes('ride-card'));

// The migration fixed a filename/slug drift: the file is maximus-blitzbahn.jpeg,
// the API slug is maximus-blitz-bahn. Before the sidecar, this lookup found nothing.
checkThat(
  'ride slug is decoupled from the filename',
  getRideImage('toverland', 'maximus-blitz-bahn')?.id === 'toverland/maximus-blitzbahn',
  `got ${getRideImage('toverland', 'maximus-blitz-bahn')?.id}`
);

// A ride may have several photos across collections; the card is one of them.
const troyAll = getRideImages('toverland', 'troy');
checkThat('ride images span collections', troyAll.length >= 1);
checkThat('ride card is among the ride images', ids(troyAll).includes(troy.id));

checkThat('hero pool is non-empty', getHeroImages().length > 0);
checkThat(
  'hero pool excludes park backgrounds',
  getHeroImages().every((i) => !i.roles.includes('park-background'))
);
checkThat(
  'hero pool narrows to a park',
  getHeroImages('toverland').every((i) => i.park === 'toverland')
);

console.log('\n── collections ──────────────────────────────────────────────\n');

checkThat('collection lookup works', getCollection('toverland-halloween').length > 0);
checkThat(
  'leading slash is tolerated',
  getCollection('/toverland-halloween').length === getCollection('toverland-halloween').length
);
checkThat('unknown collection is empty', getCollection('nope').length === 0);

// The point of the unified pool: a Halloween shoot is its own collection but its
// images still answer park queries for the park they show.
const cthulhu = searchMedia({ q: 'cthulhu' })[0];
checkThat(
  'collection and park are independent',
  cthulhu?.collection === 'halloween-2026' && cthulhu?.park === 'toverland',
  `${cthulhu?.collection} / ${cthulhu?.park}`
);
checkThat(
  'that image is reachable from its park',
  ids(getParkImages('toverland')).includes(cthulhu.id)
);

console.log('\n── text & credit ────────────────────────────────────────────\n');

const arach = searchMedia({ q: 'arachnophobia' })[0];
checkThat('alt resolves in German', Boolean(resolveMediaImage(arach, 'de').alt));
checkThat(
  'alt resolves in English',
  resolveMediaImage(arach, 'en').alt !== resolveMediaImage(arach, 'de').alt
);
checkThat('missing locale falls back, never empty', resolveMediaImage(troy, 'fr').alt.length > 0);
check('credit line renders', getCreditLine(troy), '© Patrick Arns');
check(
  'uncredited image has no credit line',
  getCreditLine({
    ...troy,
    credit: { author: null, license: 'unknown', source: null, sourceUrl: null, year: null },
  }),
  null
);
check(
  'licensed image names its licence',
  getCreditLine({ ...troy, credit: { ...troy.credit, license: 'cc-by-4.0', year: 2025 } }),
  '© 2025 Patrick Arns (CC BY 4.0)'
);

console.log('\n── geo ──────────────────────────────────────────────────────\n');

const PARKS = [
  { slug: 'toverland', name: 'Toverland', latitude: 51.3966, longitude: 5.9834 },
  { slug: 'efteling', name: 'Efteling', latitude: 51.6499, longitude: 5.0493 },
  { slug: 'europa-park', name: 'Europa-Park', latitude: 48.2669, longitude: 7.7222 },
];

checkThat(
  'distance is symmetric-ish and sane',
  Math.round(distanceMeters({ lat: 51.6499, lon: 5.0493, source: 'exif' }, PARKS[1])) < 50
);
check('distance formats', formatDistance(840), '840 m');
check('distance formats in km', formatDistance(2_400), '2.4 km');
// Past 10 km the decimal is noise for a "which park is this" check.
check('distance drops the decimal when far', formatDistance(12_400), '12 km');

const efBg = getParkBackground('efteling');
checkThat(
  'GPS confirms a correct assignment',
  checkParkAssignment(efBg, PARKS).status === 'match',
  JSON.stringify(checkParkAssignment(efBg, PARKS))
);

checkThat(
  'GPS contradicts a wrong assignment',
  checkParkAssignment({ ...efBg, park: 'europa-park' }, PARKS).status === 'mismatch'
);

checkThat(
  'no GPS yields no verdict',
  checkParkAssignment({ ...efBg, gps: null }, PARKS).status === 'no-gps'
);

checkThat(
  'unassigned image gets a suggestion',
  checkParkAssignment({ ...efBg, park: null }, PARKS).status === 'suggestion'
);

checkThat(
  'coordinates far from every park say so',
  checkParkAssignment({ ...efBg, gps: { lat: 0, lon: 0, source: 'exif' } }, PARKS).status ===
    'no-park-nearby'
);

console.log('\n' + '='.repeat(62));
console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
console.log('🎉 Media database behaves.\n');
