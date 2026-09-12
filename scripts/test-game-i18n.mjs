/** Every game string exists in every complete locale and no value is the raw key. */
import assert from 'node:assert/strict';
import { en } from '@/lib/game/i18n/en.ts';
import { de } from '@/lib/game/i18n/de.ts';
import { createTranslator } from '@/lib/game/i18n/index.ts';

const keys = Object.keys(en);
for (const k of keys) {
  assert.ok(typeof de[k] === 'string' && de[k].length > 0, `de is missing "${k}"`);
  assert.ok(!/—/.test(en[k]) && !/—/.test(de[k]), `"${k}" contains an em dash`);
  assert.ok(!/ehrlich/i.test(de[k]), `"${k}" uses "ehrlich"`);
}
for (const k of Object.keys(de)) assert.ok(k in en, `de has an extra key "${k}"`);
const t = createTranslator('de');
assert.equal(t('hud.day', { day: 3 }), 'Tag 3');
assert.equal(createTranslator('it')('hud.cash'), 'Cash', 'unknown locale falls back to en');

/**
 * Plurals. The table shipped "Limonade hat 1 Einheiten nachgefüllt." for as long as it had this
 * string, so the singular is the case worth pinning, in both directions.
 */
assert.equal(
  t('log.shop.restock', { name: 'Limonade', units: 1 }),
  'Limonade hat 1 Einheit nachgefüllt.'
);
assert.equal(
  t('log.shop.restock', { name: 'Eisdiele', units: 7 }),
  'Eisdiele hat 7 Einheiten nachgefüllt.'
);
assert.equal(
  t('log.shop.restock', { name: 'Limonade', units: 0 }),
  'Limonade hat 0 Einheiten nachgefüllt.',
  'German counts zero as plural'
);
const ten = createTranslator('en');
assert.equal(ten('log.shop.restock', { name: 'Soda', units: 1 }), 'Soda took 1 unit of stock.');
assert.equal(ten('log.shop.restock', { name: 'Soda', units: 3 }), 'Soda took 3 units of stock.');

/**
 * A locale with no table of its own takes English arms, so it must take ENGLISH plural rules too.
 * French counts zero as `one`, which asked of an English sentence gives "took 0 unit of stock".
 */
assert.equal(
  createTranslator('fr')('log.shop.restock', { name: 'Soda', units: 0 }),
  'Soda took 0 units of stock.',
  'a fallback table is judged by its own language'
);

/** A plural argument with no variable is left standing rather than guessed at. */
assert.match(
  t('log.shop.restock', { name: 'Limonade' }),
  /\{units, plural,/,
  'a missing count must be visible, not silently the "other" arm'
);

console.log(`✓ game i18n: ${keys.length} keys × en/de, plurals en/de/fr`);
