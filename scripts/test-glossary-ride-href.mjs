/**
 * Pins which glossary links get the live chip in the blog's `glossary-widget`
 * (`lib/blog/glossary-ride-href.ts`): a ride path in any of the six locales, and nothing else.
 *
 * Run: pnpm test:glossary-ride-href
 */
import assert from 'node:assert/strict';
import { parseGlossaryRideHref } from '../lib/blog/glossary-ride-href.ts';

const ride = '/parks/europe/france/plailly/parc-asterix/toutatis';
for (const locale of ['de', 'en', 'nl', 'fr', 'es', 'it']) {
  assert.deepEqual(parseGlossaryRideHref(`/${locale}${ride}`), {
    geoPath: 'europe/france/plailly',
    parkSlug: 'parc-asterix',
    rideSlug: 'toutatis',
  });
}
assert.equal(parseGlossaryRideHref(`/de${ride}/`)?.rideSlug, 'toutatis', 'trailing slash');
assert.equal(
  parseGlossaryRideHref('/de/parks/europe/france/plailly/parc-asterix'),
  null,
  'park link'
);
assert.equal(parseGlossaryRideHref(`https://park.fan/de${ride}`), null, 'external URL');
assert.equal(parseGlossaryRideHref(`/de${ride}?x=1`), null, 'query falls back to the plain link');
assert.equal(parseGlossaryRideHref(`/de${ride}/extra`), null, 'sixth segment');
assert.equal(parseGlossaryRideHref('/de/glossar/single-rider'), null, 'glossary link');
console.log('glossary ride href: all cases passed');
