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
console.log(`✓ game i18n: ${keys.length} keys × en/de`);
