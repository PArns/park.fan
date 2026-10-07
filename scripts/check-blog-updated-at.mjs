/**
 * Every translation of a post carries the same `updatedAt`.
 *
 * Run: pnpm check:blog-updated-at   (pure local data, no API, no server)
 *
 * A post, guide or news item ships in all six languages in the same pull request, and so does every
 * later update to it (docs/rules/a-post-ships-in-six-languages-in-one-pull-request.md). `updatedAt`
 * moves only when a post gets new content (docs/rules/updated-at-is-for-new-content.md), so two
 * translations with different dates mean one of them got content the other did not.
 *
 * It happened on 2026-09-29: PAR-582 added Alton Towers and PortAventura to the German Halloween
 * guide and moved its `updatedAt`, and the other five stayed on 2026-09-25 without either park
 * until PAR-620. Every existing check was green: all six files existed, `generate:blog-manifest`
 * compares `date` but not `updatedAt`, and `check:untranslated` only reads `messages/`.
 *
 * A group where no file has `updatedAt` (every news post) passes. A group where some files have it
 * and some do not fails: that is the same gap, with the missing date standing for the old one. A
 * group with fewer than six files fails too, because a missing locale has no date to disagree with.
 *
 * News carries one more field the six files must agree on: `time`, the `HH:MM` it went out, in
 * Europe/Berlin. Several news posts share a day, and the listings, the feed and the news sitemap
 * order a day by it (docs/rules/news-is-set-apart-from-the-articles.md#order-within-a-day). A news
 * post without one fails, and so does a value that is not a quoted `HH:MM`: unquoted, YAML may
 * read `09:23` as the number 563.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const BLOG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../content/blog');
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];

/** gray-matter turns an unquoted date into a Date; compare both forms as YYYY-MM-DD. */
function day(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/** The shape `time` must have; the same pattern as `POST_TIME` in lib/blog/published-at.ts. */
const POST_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** `news` or a category below it, as `isNewsCategory` in lib/blog/paths.ts decides it. */
function isNews(category) {
  return category === 'news' || String(category ?? '').startsWith('news/');
}

/** translationKey → [{ locale, file, updatedAt, time, news }] */
const groups = new Map();
for (const locale of LOCALES) {
  const dir = path.join(BLOG_DIR, locale);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const { data } = matter(readFileSync(path.join(dir, file), 'utf8'));
    if (!data.translationKey) continue;
    if (!groups.has(data.translationKey)) groups.set(data.translationKey, []);
    groups.get(data.translationKey).push({
      locale,
      file,
      updatedAt: day(data.updatedAt),
      time: data.time ?? null,
      news: isNews(data.category),
    });
  }
}

const mismatches = [];
const incomplete = [];
const badTimes = [];
let withDate = 0;
let newsGroups = 0;
for (const [key, entries] of groups) {
  const missing = LOCALES.filter((l) => !entries.some((e) => e.locale === l));
  if (missing.length > 0) incomplete.push({ key, missing });
  const dates = new Set(entries.map((e) => e.updatedAt));
  if (dates.size > 1) mismatches.push({ key, entries });
  else if (!dates.has(null)) withDate += 1;

  const news = entries.some((e) => e.news);
  if (news) newsGroups += 1;
  const times = new Set(entries.map((e) => e.time));
  const malformed = entries.some(
    (e) => (news || e.time !== null) && !(typeof e.time === 'string' && POST_TIME.test(e.time))
  );
  if (malformed || times.size > 1) badTimes.push({ key, entries });
}

if (mismatches.length === 0 && incomplete.length === 0 && badTimes.length === 0) {
  console.log(
    `✅ All ${groups.size} translationKey groups have six files and one updatedAt ` +
      `(${withDate} carry an updatedAt, ${groups.size - withDate} have none); ` +
      `all ${newsGroups} news groups carry one time.`
  );
  process.exit(0);
}

if (badTimes.length > 0) {
  console.error(
    `❌ ${badTimes.length} translationKey groups have a missing, malformed or differing time:\n`
  );
  for (const { key, entries } of badTimes) {
    console.error(`  ${key}`);
    for (const { locale, file, time } of entries) {
      console.error(`      ${locale}/${file}   ${time === null ? '(none)' : JSON.stringify(time)}`);
    }
  }
  console.error(
    `\nEvery news post carries \`time: 'HH:MM'\`, quoted, in Europe/Berlin, the same in all six\n` +
      `files: the moment it went out (docs/rules/news-is-set-apart-from-the-articles.md).\n`
  );
}

if (incomplete.length > 0) {
  console.error(`❌ ${incomplete.length} of ${groups.size} translationKey groups miss a locale:\n`);
  for (const { key, missing } of incomplete)
    console.error(`  ${key}   missing: ${missing.join(', ')}`);
  console.error('');
}
if (mismatches.length === 0) process.exit(1);

console.error(
  `❌ ${mismatches.length} of ${groups.size} translationKey groups disagree on updatedAt:\n`
);
for (const { key, entries } of mismatches) {
  console.error(`  ${key}`);
  for (const { locale, file, updatedAt } of entries) {
    console.error(`      ${locale}/${file}   ${updatedAt ?? '(none)'}`);
  }
}
console.error(
  `\nOne translation got new content the others did not. Bring the others up to it in the same\n` +
    `pull request and give all of them the same updatedAt\n` +
    `(docs/rules/a-post-ships-in-six-languages-in-one-pull-request.md).`
);
process.exit(1);
