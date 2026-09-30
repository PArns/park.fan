/**
 * The release rules for the public changelog, as far as files can show them.
 *
 * Run: pnpm check:changelog   (no network; runs this, then the changelog half of check:prose)
 *
 * The policy is docs/rules/a-version-is-a-unit-of-communication.md: a merge is not a version, the
 * PO decides one, and a cut is one pull request that moves three files together. A pull request
 * that is not a cut writes a fragment in `docs/changelog.d/` and touches none of the three. This
 * script checks that they moved together:
 *
 *   1. Every `content/changelog/<version>.md` is named after the version in its frontmatter, has a
 *      title, a summary and a `YYYY-MM-DD` date, and a `through` (a run of versions in one entry)
 *      lies between its own version and the next entry's.
 *   2. A higher version is never older than a lower one.
 *   3. `package.json` carries the newest published version. A worker's pull request never touches
 *      it, so a bump without an entry, or an entry without a bump, is a cut done by half. It is
 *      also what keeps the footer's version link (`components/common/build-info.tsx`) pointing at
 *      an anchor that exists.
 *   4. Every published entry that is not reconstructed has its `## <version> (<date>)` heading in
 *      `docs/changelog.md`, with the same date, and the log has no `## Unreleased` section: that
 *      is what a fragment is for (`scripts/lib/changelog-fragments.mjs`).
 *   5. Every fragment in `docs/changelog.d/` is one the cut can fold in as it stands.
 *   6. A highlight names a media database row that exists, and a published entry carries no
 *      `TODO` left over from the skeleton `pnpm release:cut` writes.
 *
 * What it cannot see is whether the entry says what a visitor gets, and whether a blog post slipped
 * in as a release item. That is the PO's read of the pull request.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { FRAGMENT_DIR, readFragments } from './lib/changelog-fragments.mjs';

const DIR = 'content/changelog';
const INTERNAL_LOG = 'docs/changelog.md';
const SEMVER = /^\d+\.\d+\.\d+$/;

const errors = [];
const fail = (where, msg) => errors.push(`${where}\n    ${msg}`);

function compare(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

/** Same normalisation as `lib/changelog/index.ts`: YAML turns an unquoted date into a Date. */
function isoDate(value) {
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  return null;
}

/* ------------------------------------------------------------------ 1. the entries */

const entries = [];
for (const name of readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
  const file = join(DIR, name);
  const { data, content } = matter(readFileSync(file, 'utf8'));
  const version = data.version == null ? '' : String(data.version);
  const date = isoDate(data.date);

  if (!SEMVER.test(version)) {
    fail(file, `version "${version}" is not x.y.z`);
    continue;
  }
  if (name !== `${version}.md`) fail(file, `file name must be ${version}.md`);
  if (!date) fail(file, 'date must be YYYY-MM-DD');
  if (!data.title) fail(file, 'title is missing');
  if (!data.summary) fail(file, 'summary is missing');
  if (data.mode != null && data.mode !== 'published' && data.mode !== 'draft')
    fail(file, `mode "${data.mode}" is neither published nor draft`);

  const through = data.through == null ? null : String(data.through);
  if (through !== null && (!SEMVER.test(through) || compare(through, version) <= 0))
    fail(file, `through "${through}" must be a version above ${version}`);

  for (const highlight of data.highlights ?? []) {
    const id = highlight?.image;
    if (!id || !existsSync(join('public/media', `${id}.json`)))
      fail(file, `highlight "${id}" is not in the media database (public/media/${id}.json)`);
  }

  if (data.mode !== 'draft' && /\bTODO\b/.test(`${data.title} ${data.summary} ${content}`))
    fail(file, 'published with a TODO from the release:cut skeleton still in it');

  entries.push({
    file,
    version,
    through,
    date,
    reconstructed: data.reconstructed === true,
    published: data.mode !== 'draft',
  });
}

entries.sort((a, b) => compare(b.version, a.version));

/* ------------------------------------------------------------------ 2. order */

for (let i = 0; i < entries.length - 1; i++) {
  const newer = entries[i];
  const older = entries[i + 1];
  if (newer.version === older.version) fail(newer.file, `version ${newer.version} appears twice`);
  if (newer.date && older.date && newer.date < older.date)
    fail(
      newer.file,
      `${newer.version} is dated ${newer.date}, before ${older.version} (${older.date})`
    );
  if (older.through && compare(older.through, newer.version) >= 0)
    fail(older.file, `through ${older.through} reaches into ${newer.version}`);
}

/* ------------------------------------------------------------------ 3. package.json */

const published = entries.filter((e) => e.published);
const newest = published[0];
const pkgVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
if (!newest) {
  fail(DIR, 'no published entry');
} else if (pkgVersion !== newest.version) {
  fail(
    'package.json',
    `version is ${pkgVersion}, the newest published entry is ${newest.version}. A cut changes both in one pull request; nothing else changes either.`
  );
}

/* ------------------------------------------------------------------ 4. the internal log */

const log = readFileSync(INTERNAL_LOG, 'utf8');
const headings = [...log.matchAll(/^## (.+)$/gm)].map((m) => ({ text: m[1], index: m.index }));
const versionHeadings = new Map();
for (const h of headings) {
  const m = h.text.match(/^(\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)/);
  if (m && !versionHeadings.has(m[1])) versionHeadings.set(m[1], { date: m[2], index: h.index });
}

for (const entry of published.filter((e) => !e.reconstructed)) {
  const heading = versionHeadings.get(entry.version);
  if (!heading) fail(INTERNAL_LOG, `no "## ${entry.version} (${entry.date}) – …" heading`);
  else if (heading.date !== entry.date)
    fail(
      INTERNAL_LOG,
      `${entry.version} is dated ${heading.date} here and ${entry.date} in ${entry.file}`
    );
}

const unreleased = headings.filter((h) => /^Unreleased\b/.test(h.text));
if (unreleased.length)
  fail(
    INTERNAL_LOG,
    `${unreleased.length} "## Unreleased" section(s), first: "${unreleased[0].text.slice(0, 70)}". ` +
      `A pull request writes its section to ${FRAGMENT_DIR}/PAR-<n>.md instead (${FRAGMENT_DIR}/README.md); ` +
      'the cut folds the fragments in here.'
  );

/* ------------------------------------------------------------------ 5. fragments */

// Undated: the order does not matter here, and `git log` per file would cost a process each.
const fragments = readFragments(FRAGMENT_DIR, { dated: false });
for (const fragment of fragments)
  for (const message of fragment.errors) fail(fragment.path, message);

/* ------------------------------------------------------------------ report */

if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  for (const e of errors) console.log(`  ${e}`);
}
console.log(
  `\n${errors.length} error(s). ${entries.length} entries, newest published ${newest?.version ?? 'none'}, package.json ${pkgVersion}, ${fragments.length} fragment(s) waiting for the next cut. Rules: docs/rules/a-version-is-a-unit-of-communication.md`
);
process.exit(errors.length ? 1 : 0);
