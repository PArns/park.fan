/**
 * Unit tests for `lib/parks/park-brands.ts`: which parks a brand page lists and in what order.
 * Membership is the park's name, so La Ronde (owned by Six Flags, not named for it) stays off and
 * the Hurricane Harbor water parks are on.
 *
 * Run: `pnpm test:park-brands`
 */
import assert from 'node:assert/strict';
import {
  brandParksByCountry,
  isBrandPark,
  parkBrandOf,
  SIX_FLAGS,
  UNIVERSAL,
} from '../lib/parks/park-brands.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const park = (slug, name) => ({ id: slug, slug, name, country: '', attractionCount: 1 });
const city = (slug, parks) => ({
  slug,
  name: slug,
  parks,
  parkCount: parks.length,
  openParkCount: 0,
});
const geo = {
  continents: [
    {
      slug: 'asia',
      name: 'Asia',
      countries: [
        {
          slug: 'saudi-arabia',
          name: 'Saudi Arabia',
          code: 'SA',
          cities: [city('qiddiya', [park('six-flags-qiddiya-city', 'Six Flags Qiddiya City')])],
        },
      ],
    },
    {
      slug: 'north-america',
      name: 'North America',
      countries: [
        {
          slug: 'canada',
          name: 'Canada',
          code: 'CA',
          cities: [city('montreal', [park('la-ronde', 'La Ronde')])],
        },
        {
          slug: 'united-states',
          name: 'United States',
          code: 'US',
          cities: [
            city('gurnee', [
              park('hurricane-harbor-chicago', 'Hurricane Harbor Chicago'),
              park('six-flags-great-america', 'Six Flags Great America'),
            ]),
            city('sandusky', [park('cedar-point', 'Cedar Point')]),
            city('arlington', [park('six-flags-over-texas', 'NEW: Six Flags Over Texas')]),
          ],
        },
      ],
    },
  ],
};

test('a park is the brand’s when its name starts with it', () => {
  assert.equal(isBrandPark(SIX_FLAGS, 'Six Flags Magic Mountain'), true);
  assert.equal(isBrandPark(SIX_FLAGS, 'six flags over texas'), true);
  assert.equal(isBrandPark(SIX_FLAGS, 'NEW: Six Flags Over Texas'), true);
});

test('the water parks count by the name they keep in the catalog', () => {
  assert.equal(isBrandPark(SIX_FLAGS, 'Hurricane Harbor Phoenix!'), true);
  assert.equal(isBrandPark(SIX_FLAGS, 'Hurricane Harbor'), true);
  assert.equal(isBrandPark(SIX_FLAGS, 'Hurricane Harbour Resort'), false);
});

test('owned by the company is not enough, and neither is the word alone', () => {
  assert.equal(isBrandPark(SIX_FLAGS, 'La Ronde'), false);
  assert.equal(isBrandPark(SIX_FLAGS, 'Six Flagstaff Fun Park'), false);
  assert.equal(parkBrandOf('Cedar Point'), null);
  assert.equal(parkBrandOf('Six Flags Fiesta Texas'), SIX_FLAGS);
});

test('countries with the most parks first, theme parks before water parks, then by shown name', () => {
  // "NEW: Six Flags Over Texas" reads "Six Flags Over Texas" on the page, so it sorts after
  // "Great America", not before it.
  const countries = brandParksByCountry(geo, SIX_FLAGS);
  assert.deepEqual(
    countries.map((c) => [c.countrySlug, c.parks.map((p) => p.park.slug)]),
    [
      [
        'united-states',
        ['six-flags-great-america', 'six-flags-over-texas', 'hurricane-harbor-chicago'],
      ],
      ['saudi-arabia', ['six-flags-qiddiya-city']],
    ]
  );
});

test('each brand claims its own parks and not another word that starts the same', () => {
  assert.equal(parkBrandOf('Universal Studios Japan'), UNIVERSAL);
  assert.equal(parkBrandOf('Universal Volcano Bay'), UNIVERSAL);
  assert.equal(parkBrandOf('Universal Epic Universe'), UNIVERSAL);
  assert.equal(isBrandPark(UNIVERSAL, 'Universe of Energy'), false);
  assert.equal(isBrandPark(UNIVERSAL, 'Six Flags Magic Mountain'), false);
  assert.equal(parkBrandOf('Six Flags Magic Mountain'), SIX_FLAGS);
});

test('a country without a brand park is left out', () => {
  const countries = brandParksByCountry(geo, SIX_FLAGS);
  assert.equal(
    countries.some((c) => c.countrySlug === 'canada'),
    false
  );
});

console.log(`\n${passed} assertions passed.`);
