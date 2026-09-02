/**
 * German copy pasted verbatim into the other five locales.
 *
 * Run: pnpm check:untranslated   (pure local data, no API, no server)
 *
 * All copy in this project is written in German first, so the failure mode is always the same
 * direction: a commit rewrites `messages/de.json` and carries the German text into `en`, `nl`,
 * `fr`, `es` and `it` because the keys have to exist there. The keys then *do* exist, every
 * structural check passes, and the German ships. `pnpm validate:translations` compares the set of
 * keys and never looks at a value; `pnpm check:client-messages` asks which namespaces reach the
 * client. Neither can see this, and nothing else reads these files at all.
 *
 * It shipped on 2026-09-02: #378 rewrote four chapter headings and two leads on the homepage, and
 * `/en` served "Wartezeiten für jede Bahn, alle fünf Minuten neu" over the live table, with the
 * same six strings German in all five locales — thirty strings on the most-visited page the site
 * has, through a green build.
 *
 * **The rule is two signals, and the first one alone is not enough.** "Identical to the German" on
 * its own flags 113 keys in a healthy tree: `Blog`, `Status`, `Single Rider`, `Rope Drop`,
 * `Europa-Park, Taron, Efteling …`, plus everything Dutch happens to spell the way German does
 * (`Laden…`, `Morgen`, `Kalender`, `Historie`, `Minuten`, `Land`). Those are correct translations
 * and a check that lists them gets muted. So a value is only reported when it is identical to the
 * German **and** reads as a German sentence: it carries one of the marker words below, or an `ß`,
 * or runs to five words or more.
 *
 * Every marker is a German function word that is **not** a word in any of the five target
 * languages, which is why the obvious ones are missing: `alle` and `noch` are Dutch, `wie` is
 * Dutch for "who", `was` and `am` and `hat` are English, `es` is Spanish for "is", `morgen` is
 * Dutch for "tomorrow", and `die` is Dutch besides. Each of those would fire on a correct
 * translation. The word list catches short strings a length threshold would miss; the length
 * threshold catches German with no function word in it. Neither half is redundant.
 *
 * Backtested over the last thirteen revisions of `messages/`: red on #378, green on all twelve
 * others, with no allowlist. If a real coincidence ever trips it — a brand name that happens to
 * contain a marker — extend `ALLOWED`, with the reason, rather than widening the rule.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MESSAGES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../messages');
const SOURCE_LOCALE = 'de';
const TARGET_LOCALES = ['en', 'nl', 'fr', 'es', 'it'];

/** German function words that are not words in en, nl, fr, es or it. See the docblock. */
const GERMAN_MARKERS = new Set(
  (
    'und oder aber auch nur schon immer sehr ' +
    'der den dem des das ein eine einen einem einer eines ' +
    'nicht kein keine keinen keinem ' +
    'für von mit auf aus bei nach über unter durch gegen ohne zwischen dazu damit dabei ' +
    'ist sind war waren wird werden wurde haben kann können soll muss müssen ' +
    'wir uns unser unsere ihre sie ich dir dich dein deine sich ' +
    'im zum zur beim vom ins jede jeder jedes mehr viele viel heute'
  ).split(' ')
);

/** A German string of this many words is untranslated even without a marker word. */
const LONG_ENOUGH = 5;

/** Keys whose value is legitimately the German one and trips the rule anyway. Empty on purpose. */
const ALLOWED = new Set();

function flatten(value, prefix = '', out = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, full, out);
    else out.set(full, child);
  }
  return out;
}

/**
 * The words of a string, with ICU placeholders and rich-text tags removed: `{park}` and `<term>`
 * carry no language, and counting them would let `{start} – {end}` pass for a sentence.
 */
function words(text) {
  return text
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => /\p{L}/u.test(word));
}

/** Why this value reads as German, or `null` if it does not. */
function germanTell(text) {
  const parts = words(text);
  const marker = parts.find((word) => GERMAN_MARKERS.has(word.toLowerCase()));
  if (marker) return `German word "${marker}"`;
  if (/ß/.test(text)) return 'German "ß"';
  if (parts.length >= LONG_ENOUGH) return `${parts.length} words`;
  return null;
}

const read = (locale) =>
  flatten(JSON.parse(readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf-8')));

const german = read(SOURCE_LOCALE);
const findings = [];
let compared = 0;

for (const locale of TARGET_LOCALES) {
  for (const [key, value] of read(locale)) {
    if (typeof value !== 'string' || value !== german.get(key)) continue;
    compared += 1;
    if (ALLOWED.has(key)) continue;
    const tell = germanTell(value);
    if (tell) findings.push({ locale, key, value, tell });
  }
}

if (findings.length === 0) {
  console.log(
    `✅ No German left in the other locales — ${german.size} keys × ${TARGET_LOCALES.length} ` +
      `locales, ${compared} values identical to the German and all of them legitimately so.`
  );
  process.exit(0);
}

const byKey = new Map();
for (const finding of findings) {
  if (!byKey.has(finding.key)) byKey.set(finding.key, { ...finding, locales: [] });
  byKey.get(finding.key).locales.push(finding.locale);
}

console.error(
  `❌ ${findings.length} untranslated value(s) in ${byKey.size} key(s) — ` +
    `the German is still there:\n`
);
for (const { key, value, tell, locales } of byKey.values()) {
  console.error(`  ${key}   [${locales.join(', ')}]   (${tell})`);
  console.error(`      ${JSON.stringify(value)}`);
}
console.error(
  `\nTranslate these in messages/<locale>.json. The keys exist, so validate:translations is green\n` +
    `and the build would ship the German — which is how #378 put six German headings on /en.\n` +
    `If a value is genuinely the same word in both languages, add its key to ALLOWED in\n` +
    `scripts/check-untranslated.mjs with the reason.`
);
process.exit(1);
