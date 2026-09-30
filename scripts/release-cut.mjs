/**
 * Cut a version: the mechanical half of a release pull request.
 *
 * Run: pnpm release:cut <x.y.z> --title "<German title for the internal log>" [--date YYYY-MM-DD]
 *      pnpm release:cut <x.y.z> --title "…" --dry-run   (print, change nothing)
 *
 * What it does, in this order, and nothing else:
 *
 *   1. folds every fragment in `docs/changelog.d/` under `## x.y.z (date) – title` at the top of
 *      `docs/changelog.md`, newest first, and deletes the fragment files;
 *   2. sets `version` in `package.json`;
 *   3. writes `content/changelog/x.y.z.md` as a `mode: draft` skeleton, unless that file exists.
 *
 * The public entry is the other half and is written by hand from the sections it just folded in
 * (docs/rules/a-version-is-a-unit-of-communication.md). Until it is published, `pnpm
 * check:changelog` fails on purpose: `package.json` names a version the page does not show.
 *
 * It refuses to cut when a fragment is malformed, when there is no fragment at all, or when the
 * version is not above the current one; nothing is written in that case.
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import {
  FRAGMENT_DIR,
  insertRelease,
  isNewerVersion,
  readFragments,
  renderRelease,
} from './lib/changelog-fragments.mjs';

const LOG = 'docs/changelog.md';
const PACKAGE = 'package.json';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const version = args.find((a) => /^\d+\.\d+\.\d+$/.test(a));
const title = flag('title');
const dryRun = args.includes('--dry-run');
/** The merge day in Europe/Berlin, which is the date a release carries. */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const date = flag('date') ?? today;

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!version || !title)
  fail('usage: pnpm release:cut <x.y.z> --title "<title>" [--date YYYY-MM-DD] [--dry-run]');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`--date "${date}" is not YYYY-MM-DD`);
if (/—/.test(title)) fail('the title takes no em dash; the heading already has "–" before it');

const pkgRaw = readFileSync(PACKAGE, 'utf8');
const current = JSON.parse(pkgRaw).version;
if (!isNewerVersion(version, current)) fail(`${version} is not above package.json's ${current}`);

const fragments = readFragments();
const broken = fragments.filter((f) => f.errors.length);
if (broken.length)
  fail(
    `fix these fragments first (pnpm check:changelog):\n` +
      broken.map((f) => `  ${f.path}\n    ${f.errors.join('\n    ')}`).join('\n')
  );
if (!fragments.length) fail(`${FRAGMENT_DIR}/ holds no fragment; there is nothing to cut`);

const block = renderRelease({ version, date, title, fragments });
const entryPath = `content/changelog/${version}.md`;
const skeleton = `---
version: '${version}'
date: '${date}'
title: TODO one sentence about the release, never the version number
summary: >
  TODO one paragraph: what a visitor gets out of this release.
mode: draft
---

## New

- TODO

## Improved

- TODO

## Fixed

- TODO
`;

if (dryRun) {
  console.log(block);
  console.log(`— would delete ${fragments.length} fragment(s):`);
  for (const f of fragments) console.log(`  ${f.path}`);
  console.log(`— would set package.json ${current} → ${version}`);
  console.log(
    existsSync(entryPath) ? `— ${entryPath} exists, left alone` : `— would write ${entryPath}`
  );
  process.exit(0);
}

writeFileSync(LOG, insertRelease(readFileSync(LOG, 'utf8'), block));
for (const f of fragments) unlinkSync(f.path);
// A string replacement, not JSON.stringify: the file keeps its own key order and formatting.
writeFileSync(PACKAGE, pkgRaw.replace(/("version":\s*")[^"]+(")/, `$1${version}$2`));
const wroteEntry = !existsSync(entryPath);
if (wroteEntry) writeFileSync(entryPath, skeleton);

console.log(
  `✓ ${version} (${date}): ${fragments.length} fragment(s) folded into ${LOG}, package.json ${current} → ${version}` +
    (wroteEntry ? `, ${entryPath} written as a draft` : '') +
    `.\n  Next: write the public entry, set mode: published, run pnpm check:changelog.`
);
