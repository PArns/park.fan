/**
 * Unit tests for the park reference a blog widget fence names
 * (`lib/blog/widget-park.ts`) and for the widget branch of `extractInlineRefs`
 * (`lib/blog/derive.mjs`).
 *
 * Run: `pnpm test:widget-park-ref`
 *
 * A bare park slug is not unique. Exactly one collision exists in the catalogue:
 * `disneyland-park` is Paris AND Anaheim, and `parksBySlug` in the resolver is
 * last-write-wins over the geo walk, so the bare lookup answers Anaheim. Inline
 * `ref:` links could already say which park they meant — `parseRefKey` returns a
 * `geoPath` for the `/parks/…` form and `resolvePark` takes it as a second
 * argument. The widget fences could not, so a `stats-widget slug=disneyland-park`
 * in a post about Paris rendered Californian numbers with nothing in the output to
 * notice it by.
 *
 * Two properties are pinned here, and the second is the one a refactor breaks:
 * the long form resolves to slug + geoPath, and `key` stays the string the post
 * wrote — the prefetch stores under it and the render pass reads back by it, so
 * the two halves agree by construction rather than by both normalising the same
 * way.
 */
import assert from 'node:assert/strict';
import { parseWidgetParkRef, parseWidgetRideRef } from '../lib/blog/widget-park.ts';
import { extractInlineRefs } from '../lib/blog/derive.mjs';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('parseWidgetParkRef');

test('a bare slug keeps behaving exactly as it did', () => {
  assert.deepEqual(parseWidgetParkRef('efteling'), { key: 'efteling', slug: 'efteling' });
  // No geoPath at all, not an undefined one: `resolvePark` branches on its presence.
  assert.ok(!('geoPath' in parseWidgetParkRef('efteling')));
});

test('the long form splits into the slug and the path that disambiguates it', () => {
  assert.deepEqual(parseWidgetParkRef('/parks/europe/france/paris/disneyland-park'), {
    key: '/parks/europe/france/paris/disneyland-park',
    slug: 'disneyland-park',
    geoPath: 'europe/france/paris',
  });
  assert.deepEqual(parseWidgetParkRef('/parks/north-america/united-states/anaheim/disneyland-park'), {
    key: '/parks/north-america/united-states/anaheim/disneyland-park',
    slug: 'disneyland-park',
    geoPath: 'north-america/united-states/anaheim',
  });
});

test('the two Disneyland Parks keep separate keys, so one post may name both', () => {
  const paris = parseWidgetParkRef('/parks/europe/france/paris/disneyland-park');
  const anaheim = parseWidgetParkRef('/parks/north-america/united-states/anaheim/disneyland-park');
  assert.equal(paris.slug, anaheim.slug);
  assert.notEqual(paris.key, anaheim.key);
});

test('key is the written value, because that is what the render pass looks up by', () => {
  // Attributes reach here already trimmed; trimming again is what makes the two
  // halves agree when a fence is written with padding.
  assert.equal(parseWidgetParkRef('  efteling  ').key, 'efteling');
});

test('an empty attribute is no reference', () => {
  assert.equal(parseWidgetParkRef(''), null);
  assert.equal(parseWidgetParkRef('   '), null);
});

test('a malformed path degrades to a bare slug instead of resolving to nothing', () => {
  // Three segments is not the long form. Treating it as a slug reproduces today's
  // behaviour (a park-not-found notice naming what the post wrote) rather than
  // silently dropping the widget.
  assert.deepEqual(parseWidgetParkRef('/parks/europe/france'), {
    key: '/parks/europe/france',
    slug: '/parks/europe/france',
  });
});

console.log('parseWidgetRideRef');

test('the short form is unchanged', () => {
  assert.deepEqual(parseWidgetRideRef('efteling/joris-en-de-draak'), {
    parkKey: 'efteling',
    rideSlug: 'joris-en-de-draak',
  });
});

test('the long form keeps the park half as the key the prefetch stored', () => {
  assert.deepEqual(parseWidgetRideRef('/parks/europe/france/paris/disneyland-park/peter-pans-flight'), {
    parkKey: '/parks/europe/france/paris/disneyland-park',
    rideSlug: 'peter-pans-flight',
  });
});

test('a park without a ride, or a lone slug, is not a ride reference', () => {
  assert.equal(parseWidgetRideRef('efteling'), null);
  assert.equal(parseWidgetRideRef('/parks/europe/france/paris/disneyland-park'), null);
  assert.equal(parseWidgetRideRef(''), null);
});

console.log('extractInlineRefs — widget fences');

test('a map-widget on the long form records the park slug, not the whole path', () => {
  // The backlink index holds park slugs; recording `/parks/europe/…` there makes
  // `generate:blog-manifest` reject the entry as not a valid slug.
  const { parkSlugs, parkGeoPaths } = extractInlineRefs(
    '```map-widget slug=/parks/europe/france/paris/disneyland-park\n\n```'
  );
  assert.deepEqual([...parkSlugs], ['disneyland-park']);
  assert.equal(parkGeoPaths.get('disneyland-park'), 'europe/france/paris');
});

test('an attraction-widget on the long form indexes parkSlug/rideSlug', () => {
  const { parkSlugs, attractions, attractionGeoPaths } = extractInlineRefs(
    '```attraction-widget parkSlug=/parks/europe/france/paris/disneyland-park slug=phantom-manor\n\n```'
  );
  assert.deepEqual([...parkSlugs], ['disneyland-park']);
  assert.deepEqual([...attractions], ['disneyland-park/phantom-manor']);
  assert.equal(
    attractionGeoPaths.get('disneyland-park/phantom-manor'),
    'europe/france/paris'
  );
});

test('a bare fence still indexes exactly what it always did', () => {
  const { parkSlugs, parkGeoPaths } = extractInlineRefs('```map-widget slug=europa-park\n\n```');
  assert.deepEqual([...parkSlugs], ['europa-park']);
  assert.equal(parkGeoPaths.size, 0);
});

console.log(`\n${passed} passed`);
