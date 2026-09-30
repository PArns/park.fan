/**
 * Pins the changelog fragments and the cut that folds them in.
 *
 * `scripts/lib/changelog-fragments.mjs` decides what a fragment may look like, and two scripts
 * depend on it agreeing with itself: `check:changelog` rejects a fragment the cut could not fold in
 * cleanly, and `release:cut` folds in only what the check accepts. The last part runs a real cut in
 * a scratch directory and reads the three files it changed, then runs the check against the result
 * twice: red while the public entry is still the skeleton, green once it is written.
 *
 * Run: pnpm test:changelog-fragments   (no network; writes only to the OS temp directory)
 */

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  insertRelease,
  isNewerVersion,
  parseFragment,
  renderRelease,
  sortFragments,
} from './lib/changelog-fragments.mjs';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));

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

// ── parseFragment ────────────────────────────────────────────────────────────
const GOOD = '### Der Footer verlinkt den Changelog\n\nText mit einer Zahl: 44 px.\n';

test('a heading and a body is a fragment', () => {
  const f = parseFragment('PAR-603.md', GOOD);
  assert.deepEqual(f.errors, []);
  assert.equal(f.title, 'Der Footer verlinkt den Changelog');
  assert.equal(f.body, 'Text mit einer Zahl: 44 px.');
});

test('file names: a ticket, a second PR on it, work without a ticket', () => {
  for (const name of ['PAR-603.md', 'PAR-603-2.md', 'more-menu-hub-chapters.md'])
    assert.deepEqual(parseFragment(name, GOOD).errors, [], name);
  for (const name of ['par-603.md', 'PAR 603.md', 'Mehr-Menü.md', 'PAR-603_x.md', '-x.md'])
    assert.equal(parseFragment(name, GOOD).errors.length, 1, name);
});

test('the first line has to be a ### heading', () => {
  assert.match(parseFragment('PAR-1.md', 'Text ohne Überschrift\n').errors[0], /first line/);
  assert.match(parseFragment('PAR-1.md', '## Unreleased – x\n\nText\n').errors[0], /first line/);
  assert.match(parseFragment('PAR-1.md', '#### x\n\nText\n').errors[0], /first line/);
});

test('a # or ## heading inside would end the section, #### is fine', () => {
  const bad = parseFragment('PAR-1.md', '### x\n\nText\n\n## Mehr\n\nText\n');
  assert.equal(bad.errors.length, 1);
  assert.match(bad.errors[0], /line 5/);
  assert.deepEqual(
    parseFragment('PAR-1.md', '### x\n\nText\n\n#### Nachtrag\n\nText\n').errors,
    []
  );
});

test('a rule line is refused: under a paragraph it is a setext heading', () => {
  assert.equal(parseFragment('PAR-1.md', '### x\n\nText\n---\n').errors.length, 1);
  assert.equal(parseFragment('PAR-1.md', '### x\n\nText\n\n* * *\n').errors.length, 1);
});

test('inside a closed code fence, anything goes; an open fence is an error', () => {
  const fenced = '### x\n\nText\n\n```md\n## heading\n---\n```\n';
  assert.deepEqual(parseFragment('PAR-1.md', fenced).errors, []);
  assert.match(parseFragment('PAR-1.md', '### x\n\n```\ncode\n').errors[0], /never closed/);
});

test('a heading with nothing under it is not an entry', () => {
  assert.match(parseFragment('PAR-1.md', '### x\n\n').errors[0], /no text/);
});

test('Windows line endings read the same', () => {
  assert.deepEqual(parseFragment('PAR-1.md', GOOD.replace(/\n/g, '\r\n')).errors, []);
});

// ── order, rendering, insertion ──────────────────────────────────────────────
test('newest first: commit time, then ticket number, undated counts as newest', () => {
  const order = sortFragments([
    { name: 'PAR-10.md', addedAt: 100 },
    { name: 'PAR-20.md', addedAt: 100 },
    { name: 'PAR-5.md', addedAt: 300 },
    { name: 'PAR-1.md', addedAt: null },
    { name: 'misc.md', addedAt: 100 },
  ]).map((f) => f.name);
  assert.deepEqual(order, ['PAR-1.md', 'PAR-5.md', 'PAR-20.md', 'PAR-10.md', 'misc.md']);
});

test('the release block: heading, one sentence, the sections as written', () => {
  const block = renderRelease({
    version: '2.14.0',
    date: '2026-10-05',
    title: 'Titel',
    fragments: [
      { title: 'A', body: 'Text A' },
      { title: 'B', body: 'Text B\n\n#### Nachtrag\n\nmehr' },
    ],
  });
  assert.match(
    block,
    /^## 2\.14\.0 \(2026-10-05\) – Titel\n\nGeschnitten am 2026-10-05 aus 2 Fragmenten/
  );
  assert.ok(block.includes('### A\n\nText A\n\n### B\n\nText B\n\n#### Nachtrag\n\nmehr\n'));
});

test('the block goes above the newest version, under the file header', () => {
  const log = '# Changelog\n\nKopf.\n\n---\n\n## 2.13.0 (2026-09-30) – alt\n\nText\n';
  const out = insertRelease(log, '## 2.14.0 (2026-10-05) – neu\n\nText\n');
  assert.ok(out.indexOf('## 2.14.0') < out.indexOf('## 2.13.0'));
  assert.ok(out.startsWith('# Changelog\n\nKopf.\n\n---\n\n## 2.14.0'));
});

test('semver comparison is numeric', () => {
  assert.equal(isNewerVersion('2.13.0', '2.9.9'), true);
  assert.equal(isNewerVersion('2.13.1', '2.13.0'), true);
  assert.equal(isNewerVersion('2.13.0', '2.13.0'), false);
  assert.equal(isNewerVersion('2.12.9', '2.13.0'), false);
});

// ── a real cut in a scratch directory ────────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'release-cut-'));
const run = (script, args = []) =>
  spawnSync(process.execPath, [resolve(SCRIPTS, script), ...args], {
    cwd: dir,
    encoding: 'utf8',
  });

try {
  mkdirSync(join(dir, 'docs/changelog.d'), { recursive: true });
  mkdirSync(join(dir, 'content/changelog'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{\n  "name": "x",\n  "version": "2.13.0"\n}\n');
  writeFileSync(
    join(dir, 'docs/changelog.md'),
    '# Changelog\n\n---\n\n## 2.13.0 (2026-09-30) – alt\n\nText\n'
  );
  writeFileSync(
    join(dir, 'content/changelog/2.13.0.md'),
    "---\nversion: '2.13.0'\ndate: '2026-09-30'\ntitle: Old\nsummary: Old.\n---\n\n## Fixed\n\n- A fix.\n"
  );
  writeFileSync(join(dir, 'docs/changelog.d/README.md'), '# not a fragment\n');
  writeFileSync(join(dir, 'docs/changelog.d/PAR-700.md'), '### Sieben\n\nText sieben.\n');
  writeFileSync(join(dir, 'docs/changelog.d/PAR-800.md'), '### Acht\n\nText acht.\n');

  test('the check is green before the cut, with two fragments waiting', () => {
    const r = run('check-changelog.mjs');
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /2 fragment\(s\) waiting/);
  });

  test('a version that is not above the current one is refused, nothing written', () => {
    const r = run('release-cut.mjs', ['2.13.0', '--title', 'x']);
    assert.equal(r.status, 1);
    assert.ok(existsSync(join(dir, 'docs/changelog.d/PAR-700.md')));
  });

  test('a malformed fragment stops the cut, nothing written', () => {
    writeFileSync(join(dir, 'docs/changelog.d/PAR-900.md'), 'no heading\n');
    const r = run('release-cut.mjs', ['2.14.0', '--title', 'x', '--date', '2026-10-05']);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /PAR-900/);
    assert.match(readFileSync(join(dir, 'package.json'), 'utf8'), /"version": "2\.13\.0"/);
    rmSync(join(dir, 'docs/changelog.d/PAR-900.md'));
  });

  test('--dry-run changes nothing', () => {
    const r = run('release-cut.mjs', [
      '2.14.0',
      '--title',
      'x',
      '--date',
      '2026-10-05',
      '--dry-run',
    ]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(dir, 'docs/changelog.d/PAR-800.md')));
    assert.ok(!existsSync(join(dir, 'content/changelog/2.14.0.md')));
  });

  test('the cut folds, deletes, bumps and writes the skeleton', () => {
    const r = run('release-cut.mjs', ['2.14.0', '--title', 'Neu', '--date', '2026-10-05']);
    assert.equal(r.status, 0, r.stderr);
    const log = readFileSync(join(dir, 'docs/changelog.md'), 'utf8');
    // Not a git repository: no commit dates, so the higher ticket number is the newer one.
    assert.ok(log.indexOf('### Acht') < log.indexOf('### Sieben'), log);
    assert.ok(log.indexOf('## 2.14.0 (2026-10-05) – Neu') < log.indexOf('## 2.13.0'));
    assert.ok(!existsSync(join(dir, 'docs/changelog.d/PAR-700.md')));
    assert.ok(existsSync(join(dir, 'docs/changelog.d/README.md')), 'README stays');
    assert.equal(
      readFileSync(join(dir, 'package.json'), 'utf8'),
      '{\n  "name": "x",\n  "version": "2.14.0"\n}\n',
      'only the version changes'
    );
    assert.match(readFileSync(join(dir, 'content/changelog/2.14.0.md'), 'utf8'), /mode: draft/);
  });

  test('the check is red while the entry is the skeleton', () => {
    const r = run('check-changelog.mjs');
    assert.equal(r.status, 1);
    assert.match(r.stdout, /version is 2\.14\.0, the newest published entry is 2\.13\.0/);
  });

  test('publishing the skeleton with its TODOs is caught', () => {
    const path = join(dir, 'content/changelog/2.14.0.md');
    writeFileSync(path, readFileSync(path, 'utf8').replace('mode: draft', 'mode: published'));
    const r = run('check-changelog.mjs');
    assert.equal(r.status, 1);
    assert.match(r.stdout, /TODO/);
  });

  test('the check is green once the entry is written', () => {
    writeFileSync(
      join(dir, 'content/changelog/2.14.0.md'),
      "---\nversion: '2.14.0'\ndate: '2026-10-05'\ntitle: New\nsummary: New.\nmode: published\n---\n\n## New\n\n- A thing.\n"
    );
    const r = run('check-changelog.mjs');
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });

  test('an Unreleased section written straight into the log is refused', () => {
    const path = join(dir, 'docs/changelog.md');
    writeFileSync(
      path,
      readFileSync(path, 'utf8').replace('---\n\n', '---\n\n## Unreleased – direkt\n\nText\n\n')
    );
    const r = run('check-changelog.mjs');
    assert.equal(r.status, 1);
    assert.match(r.stdout, /docs\/changelog\.d\/PAR-<n>\.md instead/);
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// The repository's own fragments pass, so a broken one fails here as well as in the check.
test('the fragments in this repository are all foldable', () => {
  const out = execFileSync(process.execPath, [resolve(SCRIPTS, 'check-changelog.mjs')], {
    cwd: resolve(SCRIPTS, '..'),
    encoding: 'utf8',
  });
  assert.match(out, /^0 error\(s\)/m);
});

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
