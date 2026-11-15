// The contribute link carries its park or ride in the fragment, so every park and ride page links
// one URL per language; a link with the entity in the query gets a 308 to the fragment form.
// See lib/contribute/prefill-keys.ts.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildContributeHref, parseEntityFromHash } from '../lib/contribute/prefill.ts';
import { contributeQueryRedirect } from '../lib/contribute/prefill-keys.ts';

const ride = {
  type: 'attraction',
  id: 'a9b2cc99-8ece-4caa-a1df-6d0dcd774ad5',
  name: 'Chevauchée Fantastique',
  slug: 'chevauchee-fantastique-2',
  url: '/parks/europe/france/dolancourt/nigloland/chevauchee-fantastique-2',
  country: 'France',
  parentParkName: 'Nigloland',
};

test('a park or ride page links the bare page, the entity in the fragment', () => {
  const href = buildContributeHref(ride, 'nl');
  assert.ok(href.startsWith('/nl/contribute#type=attraction&id='), href);
  assert.ok(!href.includes('?'), href);
  assert.equal(buildContributeHref(ride).split('#')[0], '/contribute');
});

test('the form reads back what the link wrote, with or without the #', () => {
  const fragment = buildContributeHref(ride).split('#')[1];
  assert.deepEqual(parseEntityFromHash(`#${fragment}`), ride);
  assert.deepEqual(parseEntityFromHash(fragment), ride);
});

test('a fragment that names no valid entity preselects nothing', () => {
  assert.equal(parseEntityFromHash(''), null);
  assert.equal(parseEntityFromHash('#upload'), null);
  assert.equal(parseEntityFromHash('#type=planet&id=x&name=y&slug=z'), null);
  assert.equal(parseEntityFromHash('#type=park&id=x&name=y&slug=z&url=https://evil.example'), null);
});

test('a link with the entity in the query moves it into the fragment', () => {
  const query = new URLSearchParams({
    type: 'park',
    id: '60695a74-612f-4b09-b053-4768f1fe1910',
    name: 'Liseberg',
    slug: 'liseberg',
    url: '/parks/europe/sweden/gothenburg/liseberg',
    country: 'Sweden',
    mc: 'cache-buster',
  });
  const target = contributeQueryRedirect('/nl/contribute', query);
  assert.ok(target?.startsWith('/nl/contribute#type=park&id=60695a74'), target);
  assert.ok(!target.includes('mc='), target);
  assert.deepEqual(parseEntityFromHash(target.split('#')[1])?.name, 'Liseberg');
});

test('other paths and queries without an entity are left alone', () => {
  const entity = new URLSearchParams({ type: 'park', id: 'x' });
  assert.equal(contributeQueryRedirect('/de/contribute', new URLSearchParams()), null);
  assert.equal(contributeQueryRedirect('/de/contribute', new URLSearchParams({ mc: 'x' })), null);
  assert.equal(contributeQueryRedirect('/de/contribute/thanks', entity), null);
  assert.equal(contributeQueryRedirect('/xx/contribute', entity), null);
  assert.equal(contributeQueryRedirect('/contribute', entity), null);
});
