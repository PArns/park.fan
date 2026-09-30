/**
 * Changelog fragments: one file per pull request under `docs/changelog.d/`, folded into
 * `docs/changelog.md` only when a version is cut.
 *
 * Every pull request used to write its section on top of `docs/changelog.md`, so any two that were
 * open at the same time touched the same lines: 54 of the 309 commits on main in September 2026
 * edited that file, and the release pull request for 2.13.0 hit a conflict there with #684 before
 * it was an hour old. A fragment is a file of its own, so two pull requests never write the same
 * lines. The backend repository has worked this way since PAR-257 (`docs/changelog.d/PAR-<n>.md`,
 * `pnpm changelog:merge`), and the file name follows it.
 *
 * The rules live here once, for `scripts/check-changelog.mjs` (CI), `scripts/release-cut.mjs` (the
 * cut) and `scripts/test-changelog-fragments.mjs`. Authoring contract:
 * `docs/changelog.d/README.md`.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const FRAGMENT_DIR = 'docs/changelog.d';

/**
 * `PAR-603.md` for a ticket, `PAR-603-2.md` for a second pull request on it before the next cut,
 * and a kebab-case name for work without a ticket (`more-menu-hub-chapters.md`). Lower case after
 * the ticket id, so the name never depends on the file system's case rules; `par-603.md` is
 * refused, because the sort would not read it as a ticket.
 */
const FRAGMENT_NAME = /^(?:PAR-\d+(?:-[a-z0-9]+)*|(?!par-\d)[a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

/** A line that would end a section: `#` or `##` outside a code fence. */
const SECTION_HEADING = /^#{1,2}\s/;
/** A line of only `-`, `=` or `*`: a thematic break, or a setext heading under a paragraph. */
const RULE_LINE = /^\s*(?:[-=*]\s*){3,}$/;
const FENCE = /^\s*(```|~~~)/;

/**
 * Parse and check one fragment. Returns `{ title, body, errors }`; `errors` is empty for a
 * fragment the cut can fold in as it stands.
 */
export function parseFragment(name, raw) {
  const errors = [];
  if (!FRAGMENT_NAME.test(name))
    errors.push(
      `file name "${name}": use PAR-<n>.md for a ticket, or a kebab-case name for work without one`
    );

  const text = raw.replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n');
  const first = lines[0] ?? '';
  const heading = first.match(/^###\s+(.+?)\s*$/);
  if (!heading) errors.push('the first line must be "### <title>"');

  let inFence = false;
  lines.slice(1).forEach((line, i) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (SECTION_HEADING.test(line))
      errors.push(`line ${i + 2}: a "#" or "##" heading; a fragment is one section, use "####"`);
    if (RULE_LINE.test(line))
      errors.push(`line ${i + 2}: a line of only "-", "=" or "*"; use a blank line instead`);
  });
  if (inFence) errors.push('a code fence is opened and never closed');

  const body = lines.slice(1).join('\n').trim();
  if (heading && !body) errors.push('no text under the heading');

  return { title: heading ? heading[1] : '', body, errors };
}

/**
 * When a fragment reached the branch: the commit that added it, as a Unix time. `null` when git
 * cannot say (a file not committed yet, or a clone too shallow to reach the commit).
 */
function addedAt(path) {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--format=%ct', '-1', '--', path], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out ? Number(out) : null;
  } catch {
    return null;
  }
}

const ticketNumber = (name) => Number(name.match(/^PAR-(\d+)/)?.[1] ?? 0);

/**
 * Newest first, the order the internal log has always had: by the commit that added the file,
 * then by ticket number, then by name. A fragment git cannot date sorts as the newest, because
 * the only way to have one is to have just written it.
 */
export function sortFragments(fragments) {
  return [...fragments].sort(
    (a, b) =>
      (b.addedAt ?? Infinity) - (a.addedAt ?? Infinity) ||
      ticketNumber(b.name) - ticketNumber(a.name) ||
      a.name.localeCompare(b.name)
  );
}

/** Every fragment in `dir`, parsed, newest first. `README.md` is the contract, not a fragment. */
export function readFragments(dir = FRAGMENT_DIR, { dated = true } = {}) {
  let names;
  try {
    names = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');
  } catch {
    return [];
  }
  return sortFragments(
    names.map((name) => {
      const path = join(dir, name);
      return {
        name,
        path,
        addedAt: dated ? addedAt(path) : null,
        ...parseFragment(name, readFileSync(path, 'utf8')),
      };
    })
  );
}

/** The block a cut writes: the version heading, one sentence, then every fragment as it stands. */
export function renderRelease({ version, date, title, fragments }) {
  const intro =
    `Geschnitten am ${date} aus ${fragments.length} Fragment${fragments.length === 1 ? '' : 'en'} ` +
    `in \`docs/changelog.d/\`. Der öffentliche Eintrag ist \`content/changelog/${version}.md\`. ` +
    'Neueste Abschnitte zuerst.';
  const sections = fragments.map((f) => `### ${f.title}\n\n${f.body}`);
  return [`## ${version} (${date}) – ${title}`, intro, ...sections].join('\n\n') + '\n';
}

/**
 * `log` with `block` inserted above its first `## ` heading, which is where the newest version
 * goes. A log without one gets the block at the end.
 */
export function insertRelease(log, block) {
  const match = log.match(/^## /m);
  if (!match) return `${log.replace(/\s*$/, '\n\n')}${block}`;
  return `${log.slice(0, match.index)}${block}\n${log.slice(match.index)}`;
}

/** `a` is above `b` as semver. */
export function isNewerVersion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] > pb[i];
  return false;
}
