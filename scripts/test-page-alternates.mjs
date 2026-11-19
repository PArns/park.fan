/**
 * Pins what the pages' `<head>` says about their languages and their share card, now that every
 * page builds them through `buildAlternates`, `alternateLanguages` and `buildOpenGraphMetadata`
 * (`lib/utils/metadata.ts`): the canonical in the page's locale, an hreflang link per locale in the
 * order of `locales`, `x-default` on the English page, and the Open Graph fields each kind of page
 * had when it spelled them out itself.
 *
 * Run: pnpm test:page-alternates
 */

import assert from 'node:assert/strict';
import {
  alternateLanguages,
  buildAlternates,
  buildOpenGraphMetadata,
} from '../lib/utils/metadata.ts';
import { GLOSSARY_SEGMENTS } from '../lib/glossary/segments.ts';
import { PLANNER_SEGMENTS } from '../lib/planner/segments.ts';

let failures = 0;
let checks = 0;
function test(name, fn) {
  checks++;
  try {
    fn();
  } catch (error) {
    failures++;
    console.error(`✗ ${name}\n  ${error.message}`);
  }
}

const SITE = 'https://park.fan';

test('a page in every locale: canonical, six hreflang links in order, x-default last', () => {
  const alternates = buildAlternates('de', () => '/fancast');
  assert.equal(alternates.canonical, `${SITE}/de/fancast`);
  assert.deepEqual(Object.entries(alternates.languages), [
    ['en', `${SITE}/en/fancast`],
    ['de', `${SITE}/de/fancast`],
    ['fr', `${SITE}/fr/fancast`],
    ['it', `${SITE}/it/fancast`],
    ['nl', `${SITE}/nl/fancast`],
    ['es', `${SITE}/es/fancast`],
    ['x-default', `${SITE}/en/fancast`],
  ]);
});

test("the home page's path is empty, not a slash", () => {
  const alternates = buildAlternates('fr', () => '');
  assert.equal(alternates.canonical, `${SITE}/fr`);
  assert.equal(alternates.languages['x-default'], `${SITE}/en`);
  assert.equal(alternates.languages.nl, `${SITE}/nl`);
});

test('a localized segment per language, the English one for x-default', () => {
  const planner = buildAlternates('nl', (l) => `/${PLANNER_SEGMENTS[l]}`);
  assert.equal(planner.canonical, `${SITE}/nl/dagplanner`);
  assert.equal(planner.languages.de, `${SITE}/de/tagesplaner`);
  assert.equal(planner.languages['x-default'], `${SITE}/en/trip-planner`);
  const glossary = buildAlternates('it', (l) => `/${GLOSSARY_SEGMENTS[l]}`);
  assert.equal(glossary.canonical, `${SITE}/it/glossario`);
  assert.equal(glossary.languages['x-default'], `${SITE}/en/glossary`);
});

test('a listing names only the locales it exists in, and x-default only with an English page', () => {
  assert.deepEqual(
    alternateLanguages((l) => (l === 'de' || l === 'en' ? '/blog/page/2' : null)),
    {
      en: `${SITE}/en/blog/page/2`,
      de: `${SITE}/de/blog/page/2`,
      'x-default': `${SITE}/en/blog/page/2`,
    }
  );
  assert.deepEqual(
    alternateLanguages((l) => (l === 'de' ? '/blog/page/3' : null)),
    { de: `${SITE}/de/blog/page/3` }
  );
});

const card = {
  locale: 'de',
  title: 'Fancast',
  description: 'Wie sicher die Prognosen sind.',
  url: `${SITE}/de/fancast`,
  ogImageUrl: `${SITE}/api/og/de/fancast`,
};

test('the share card: a website in every other locale, its image named by the title', () => {
  const { openGraph, twitter } = buildOpenGraphMetadata(card);
  assert.equal(openGraph.type, 'website');
  assert.equal(openGraph.locale, 'de_DE');
  assert.deepEqual(openGraph.alternateLocale, ['en_US', 'fr_FR', 'it_IT', 'nl_NL', 'es_ES']);
  assert.equal(openGraph.siteName, 'park.fan');
  assert.deepEqual(openGraph.images, [
    { url: card.ogImageUrl, width: 1200, height: 630, alt: card.title },
  ]);
  assert.deepEqual(twitter, {
    card: 'summary_large_image',
    title: card.title,
    description: card.description,
    images: [card.ogImageUrl],
  });
});

test('an article, a profile, a page in one language and a post with its dates', () => {
  assert.equal(buildOpenGraphMetadata({ ...card, type: 'article' }).openGraph.type, 'article');
  const profile = buildOpenGraphMetadata({
    ...card,
    type: 'profile',
    imageAlt: 'Parky',
    alternateLocale: false,
  }).openGraph;
  assert.equal(profile.type, 'profile');
  assert.equal(profile.images[0].alt, 'Parky');
  assert.equal('alternateLocale' in profile, false);
  const post = buildOpenGraphMetadata({
    ...card,
    type: 'article',
    article: { publishedTime: '2026-11-01', modifiedTime: '2026-11-10', section: 'Guides' },
  }).openGraph;
  assert.equal(post.publishedTime, '2026-11-01');
  assert.equal(post.modifiedTime, '2026-11-10');
  assert.equal(post.section, 'Guides');
});

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
