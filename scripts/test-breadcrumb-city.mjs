// Regression tests for the city crumb on park, ride, calendar and stats pages.
//
// A city with a single park has no page of its own: `[city]/page.tsx` answers it with a 308 to
// that park. The breadcrumb linked it anyway, so every page of those parks (103 of 210 on
// 2026-09-24) pointed its trail and its BreadcrumbList JSON-LD at a redirect back to the park
// the reader was already on. The crumb is now left out whenever `cityHasOwnPage()` says no,
// which asks the same `city.parks.length > 1` the city page redirects by.
import {
  generateAttractionBreadcrumbs,
  generateParkBreadcrumbs,
} from '../lib/utils/breadcrumb-utils.ts';
import { cityHasOwnPage } from '../lib/utils/redirect-utils.ts';
import { runCases } from './lib/run-cases.mjs';
import { json, withFetch } from './lib/fake-fetch.mjs';

const city = (slug, parkCount) => ({
  name: slug,
  slug,
  parkCount,
  openParkCount: 0,
  parks: Array.from({ length: parkCount }, (_, i) => ({ slug: `${slug}-park-${i}` })),
});

const continents = [
  {
    name: 'Europe',
    slug: 'europe',
    countryCount: 1,
    parkCount: 3,
    openParkCount: 0,
    countries: [
      {
        name: 'Germany',
        slug: 'germany',
        code: 'DE',
        cityCount: 2,
        parkCount: 3,
        openParkCount: 0,
        cities: [city('bruehl', 1), city('rust', 2)],
      },
    ],
  },
];

const labels = {
  continent: 'europe',
  country: 'germany',
  continentName: 'Europa',
  countryName: 'Deutschland',
  parkName: 'Park',
  homeLabel: 'Start',
  continentsLabel: 'Parks',
};

const urls = (result) => result.breadcrumbs.map((b) => b.url);

const testCases = [
  {
    name: 'park trail: no city crumb when the city has no page',
    run: async () =>
      urls(
        generateParkBreadcrumbs({
          ...labels,
          city: 'bruehl',
          cityName: 'Brühl',
          cityHasPage: false,
        })
      ).includes('/parks/europe/germany/bruehl'),
    expected: false,
  },
  {
    name: 'park trail: the city crumb stays when the city has a page',
    run: async () =>
      urls(
        generateParkBreadcrumbs({ ...labels, city: 'rust', cityName: 'Rust', cityHasPage: true })
      ).includes('/parks/europe/germany/rust'),
    expected: true,
  },
  {
    name: 'ride trail: no city crumb, and the park crumb is still there',
    run: async () =>
      JSON.stringify(
        urls(
          generateAttractionBreadcrumbs({
            ...labels,
            city: 'bruehl',
            cityName: 'Brühl',
            cityHasPage: false,
            parkSlug: 'phantasialand',
            attractionName: 'Taron',
          })
        ).slice(-2)
      ),
    expected: JSON.stringify([
      '/parks/europe/germany',
      '/parks/europe/germany/bruehl/phantasialand',
    ]),
  },
  // First among the cases that fetch: the process keeps the last continents document it read and
  // answers from it when the API fails (`getContinentsOrLastGood`), so "unreachable and nothing
  // read yet" can only be tested before anything has been read.
  {
    name: 'cityHasOwnPage: an unreachable API, with nothing read before, keeps the crumb',
    run: () =>
      withFetch(
        async () => json({ error: 'boom' }, 500),
        () => cityHasOwnPage('europe', 'germany', 'bruehl')
      ),
    expected: true,
  },
  {
    name: 'cityHasOwnPage: one park is no page',
    run: () =>
      withFetch(
        async () => json(continents),
        () => cityHasOwnPage('europe', 'germany', 'bruehl')
      ),
    expected: false,
  },
  {
    name: 'cityHasOwnPage: two parks are a page',
    run: () =>
      withFetch(
        async () => json(continents),
        () => cityHasOwnPage('europe', 'germany', 'rust')
      ),
    expected: true,
  },
  {
    name: 'cityHasOwnPage: a city the snapshot does not know keeps its crumb',
    run: () =>
      withFetch(
        async () => json(continents),
        () => cityHasOwnPage('europe', 'germany', 'atlantis')
      ),
    expected: true,
  },
  {
    name: 'cityHasOwnPage: an unreachable API answers from the last document read',
    run: () =>
      withFetch(
        async () => json({ error: 'boom' }, 500),
        () => cityHasOwnPage('europe', 'germany', 'bruehl')
      ),
    expected: false,
  },
];

await runCases(testCases);
