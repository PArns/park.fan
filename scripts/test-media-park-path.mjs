/**
 * Tests for finding a park's photo by its path (`lib/media/park-path.mjs`). Paris and Anaheim are
 * both `disneyland-park`, and a lookup by slug alone put the Paris castle on Anaheim's page, its
 * cards, the California planner and the app export.
 *
 * Run: pnpm test:media-park-path
 */

import { imageParkKey, parkGeoPath, parkLookupKeys } from '../lib/media/park-path.mjs';
import { MEDIA_IMAGES, getParkBackground, getParkImages } from '../lib/media/index.ts';
import { MEDIA_PARK_PATH_BY_SLUG } from '../lib/media/manifest-parks.ts';
import { withParkCardImage, withRideCardImage } from '../lib/media/card-images.ts';
import { enrichParksWithImages, getCardImageMap } from '../lib/utils/park-assets.ts';
import { tripPlannerPhotos } from '../lib/trip-regions/plan-photos.ts';
import { rolesToYield, uniqueClaims } from '../lib/admin/media-unique-roles.ts';

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}\n      expected ${e}\n      got      ${a}`);
  }
}

const PARIS = 'europe/france/paris/disneyland-park';
const ANAHEIM = 'north-america/united-states/anaheim/disneyland-park';
const EFTELING = 'europe/netherlands/kaatsheuvel/efteling';

console.log('\nparkGeoPath');
check('the API url', parkGeoPath(`/v1/parks/${PARIS}`), PARIS);
check(
  'a ride’s API url names its park',
  parkGeoPath(`/v1/parks/${ANAHEIM}/attractions/space-mountain`),
  ANAHEIM
);
check('a page path with a locale', parkGeoPath(`/de/parks/${PARIS}`), PARIS);
check(
  'a ride page with query and hash',
  parkGeoPath(`/parks/${PARIS}/big-thunder-mountain?x=1#rides`),
  PARIS
);
check('the bare path', parkGeoPath(ANAHEIM), ANAHEIM);
check('a slug is no path', parkGeoPath('disneyland-park'), null);
check('a country is no park', parkGeoPath('/parks/europe/france'), null);
check('nothing', parkGeoPath(null), null);

// The committed table's shape: the first park of a slug, Paris for `disneyland-park`.
const TABLE = { 'disneyland-park': PARIS, efteling: EFTELING };

console.log('\nimageParkKey');
check(
  'Anaheim by its parkPath',
  imageParkKey({ park: 'disneyland-park', parkPath: ANAHEIM }, TABLE),
  ANAHEIM
);
check(
  'Paris by its parkPath',
  imageParkKey({ park: 'disneyland-park', parkPath: PARIS }, TABLE),
  PARIS
);
check(
  'a unique slug without parkPath takes the table’s path',
  imageParkKey({ park: 'efteling', parkPath: null }, TABLE),
  EFTELING
);
check(
  'a slug the table does not know keeps the slug',
  imageParkKey({ park: 'new-park' }, TABLE),
  'new-park'
);
check('no park, no key', imageParkKey({ park: null }, TABLE), null);
check(
  'a slug named like a prototype member stays a slug',
  imageParkKey({ park: 'constructor' }, TABLE),
  'constructor'
);

console.log('\nparkLookupKeys');
check('a bare slug means the table’s park', parkLookupKeys('disneyland-park', TABLE), [PARIS]);
check(
  'Anaheim by its API url',
  parkLookupKeys({ slug: 'disneyland-park', url: `/v1/parks/${ANAHEIM}` }, TABLE),
  [ANAHEIM]
);
check(
  'Paris by its page path',
  parkLookupKeys({ slug: 'disneyland-park', url: `/parks/${PARIS}` }, TABLE),
  [PARIS]
);
check(
  'a unique slug finds the same park with or without a url',
  [parkLookupKeys('efteling', TABLE), parkLookupKeys({ slug: 'efteling', url: null }, TABLE)],
  [[EFTELING], [EFTELING]]
);
check(
  'an unknown slug with a path tries the path, then the slug',
  parkLookupKeys({ slug: 'new-park', url: 'europe/x/y/new-park' }, TABLE),
  ['europe/x/y/new-park', 'new-park']
);
check('no park, no keys', parkLookupKeys(null, TABLE), []);

// --- The real database ---------------------------------------------------------------------

const PARIS_PHOTO = 'disneyland-park/background';
const ANAHEIM_PHOTO = 'disneyland-anaheim/sleeping-beauty-castle';
const ids = (images) => images.map((i) => i.id);

console.log('\nlib/media');
check(
  'the committed table maps the slug to Paris',
  MEDIA_PARK_PATH_BY_SLUG['disneyland-park'],
  PARIS
);
check(
  'Paris’ background by path',
  getParkBackground({ slug: 'disneyland-park', url: `/v1/parks/${PARIS}` })?.id,
  PARIS_PHOTO
);
check(
  'Anaheim’s background by path',
  getParkBackground({ slug: 'disneyland-park', url: `/v1/parks/${ANAHEIM}` })?.id,
  ANAHEIM_PHOTO
);
check('a bare slug still finds Paris', getParkBackground('disneyland-park')?.id, PARIS_PHOTO);
check(
  'Paris’ images hold no Anaheim photo',
  ids(getParkImages({ slug: 'disneyland-park', url: PARIS })).includes(ANAHEIM_PHOTO),
  false
);
check(
  'Anaheim’s images hold no Paris photo',
  ids(getParkImages({ slug: 'disneyland-park', url: ANAHEIM })).includes(PARIS_PHOTO),
  false
);

// A park whose slug is its own, with a background and no parkPath: the path changes nothing.
const unique = MEDIA_IMAGES.find(
  (i) =>
    i.park &&
    !i.parkPath &&
    i.roles.includes('park-background') &&
    i.park !== 'disneyland-park' &&
    MEDIA_PARK_PATH_BY_SLUG[i.park]
);
check('the database has a unique-slug park with a background', Boolean(unique), true);
if (unique) {
  const path = MEDIA_PARK_PATH_BY_SLUG[unique.park];
  check(
    `${unique.park}: by slug and by path, the same photo`,
    [getParkBackground(unique.park)?.id, getParkBackground({ slug: unique.park, url: path })?.id],
    [unique.id, unique.id]
  );
}

console.log('\ncard map');
const map = JSON.parse(JSON.stringify(getCardImageMap()));
const src = (fields) => fields.backgroundImage?.split('?')[0] ?? null;
check('Paris’ card', map.parks[PARIS]?.[0].split('?')[0], `/media/${PARIS_PHOTO}.jpg`);
check('Anaheim’s card', map.parks[ANAHEIM]?.[0].split('?')[0], `/media/${ANAHEIM_PHOTO}.jpg`);
check('a bare slug resolves to Paris’ path', map.paths['disneyland-park'], PARIS);
check(
  'browser: an Anaheim park object gets Anaheim’s photo',
  src(withParkCardImage(map, { slug: 'disneyland-park', url: `/v1/parks/${ANAHEIM}` })),
  `/media/${ANAHEIM_PHOTO}.jpg`
);
check(
  'browser: a slug-only park object gets Paris’',
  src(withParkCardImage(map, { slug: 'disneyland-park' })),
  `/media/${PARIS_PHOTO}.jpg`
);
check(
  'server: the same answers',
  enrichParksWithImages([
    { slug: 'disneyland-park', url: `/v1/parks/${ANAHEIM}` },
    { slug: 'disneyland-park', url: `/v1/parks/${PARIS}` },
  ]).map(src),
  [`/media/${ANAHEIM_PHOTO}.jpg`, `/media/${PARIS_PHOTO}.jpg`]
);
// Both parks have a ride of this slug; only the path tells their cards apart.
const twins = {
  parks: {},
  rides: {
    [`${PARIS}/pirates`]: ['/paris.jpg', '50% 50%'],
    [`${ANAHEIM}/pirates`]: ['/anaheim.jpg', '50% 50%'],
  },
  paths: { 'disneyland-park': PARIS },
};
check(
  'a ride finds its park through its own url',
  withRideCardImage(twins, {
    slug: 'pirates',
    url: `/v1/parks/${ANAHEIM}/attractions/pirates`,
    park: { slug: 'disneyland-park' },
  }).backgroundImage,
  '/anaheim.jpg'
);
check(
  'its park’s url wins',
  withRideCardImage(twins, {
    slug: 'pirates',
    park: { slug: 'disneyland-park', url: `/parks/${ANAHEIM}` },
  }).backgroundImage,
  '/anaheim.jpg'
);
check(
  'a slug-only ride means Paris',
  withRideCardImage(twins, { slug: 'pirates', park: { slug: 'disneyland-park' } }).backgroundImage,
  '/paris.jpg'
);
check(
  'a ride without a park gets no photo',
  withRideCardImage(twins, { slug: 'pirates', park: null }).backgroundImage,
  null
);

console.log('\nplanner');
const photos = tripPlannerPhotos({
  parks: [
    { slug: 'disneyland-park', path: `/parks/${ANAHEIM}` },
    {
      slug: 'disney-california-adventure-park',
      path: '/parks/north-america/united-states/anaheim/disney-california-adventure-park',
    },
  ],
});
check(
  'the California planner’s Disneyland day shows Anaheim',
  photos['disneyland-park']?.src.split('?')[0],
  `/media/${ANAHEIM_PHOTO}.jpg`
);

console.log('\nunique roles');
const parisHolder = { park: 'disneyland-park', parkPath: PARIS, roles: ['park-background'] };
const anaheimHolder = { park: 'disneyland-park', parkPath: ANAHEIM, roles: ['park-background'] };
check('Anaheim claims its own path', uniqueClaims(anaheimHolder), [`park-background:${ANAHEIM}`]);
check(
  'Anaheim’s background takes nothing from Paris',
  rolesToYield(new Set(uniqueClaims(anaheimHolder)), parisHolder),
  []
);
check(
  'a second Paris background does take it',
  rolesToYield(new Set(uniqueClaims({ ...parisHolder })), parisHolder),
  ['park-background']
);

console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
