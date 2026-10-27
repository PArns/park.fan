# A version is a unit of communication, not a build artifact (REQUIREMENT)

The site deploys continuously, so **a merge is not a version and a ticket is not a version**. A
version bundles everything that became visible since the last one, and it is cut when there is
something to tell people.

- **The PO decides** when a version is cut, its number and its public items: at a cycle boundary
  (Monday) or when enough visible change has piled up, never more often than weekly and never less
  often than monthly.
- **The number follows what a visitor can see.** MINOR (`x.Y.0`) once at least one new visible
  capability (a page, a flow, a behaviour somebody would notice) has landed since the last cut;
  PATCH (`x.y.Z`) for fixes and small improvements only. MAJOR is kept for a relaunch (the last was
  2.0 in December 2025, when the site was rebuilt).
- **Two files carry a release, and they are not copies.** `docs/changelog.md` is the internal log:
  German, one section per pull request, naming components and measurements. Between cuts those
  sections wait as fragments in `docs/changelog.d/`, so two open pull requests never edit the same
  lines. `content/changelog/<version>.md` is the public entry: English, written by hand for a
  visitor. Nothing parses one into the other.
- **A blog or news post is never a release item.** It is content, and it belongs in the feed.

| Who                                   | Does                                                                                                                                             | Never                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Any pull request                      | Writes its section as a fragment, `docs/changelog.d/PAR-<n>.md` ([format](../changelog.d/README.md)). A post, a photo or a news item needs none. | Writes into `docs/changelog.md`, bumps `version` in `package.json`, touches `content/changelog/`. |
| The PO                                | Decides the number and the items and files them as a ticket `Release x.y.z`: one line per item with the fragment or PR it comes from.            | Writes the pull request itself, lists a blog post, cuts a version per ticket.                     |
| The runner that takes `Release x.y.z` | Writes the cut below as one pull request, with exactly the items of the ticket.                                                                  | Adds or drops an item on its own; a doubtful one goes back to the PO as a question.               |
| Anyone, correcting a published entry  | Fixes the wrong fact in `content/changelog/<version>.md` in an ordinary pull request.                                                            | Changes a published version number or date, other than to correct it to what the history shows.   |

## Cutting a version: one pull request

1. Number: MINOR if the fragments contain one new visible capability, PATCH otherwise.
2. `pnpm release:cut x.y.z --title "<German title>"` (`--dry-run` first). It folds every fragment
   under `## x.y.z (<today>) – <title>` at the top of `docs/changelog.md`, deletes the fragment files,
   sets `version` in `package.json` and writes `content/changelog/x.y.z.md` as a `mode: draft`
   skeleton. It refuses to run while a fragment is malformed.
3. Write `content/changelog/x.y.z.md` for a visitor (`## New`, `## Improved`, `## Fixed`), leaving
   out admin screens, CI and tooling, docs, refactors without a number a visitor would feel, and
   every post. Prefer a number to an adjective, looked up in the section it comes from. Then set
   `mode: published`. The footer's version links this entry (`components/common/build-info.tsx`),
   which is why `package.json` and the newest published entry must agree.
4. Merge `main` in before review. A fragment that landed meanwhile is folded in by hand under the
   same heading and its file deleted; `pnpm check:changelog` lists what is still waiting.
5. The date is the day the pull request merges, Europe/Berlin. A pull request that merges a day
   later gets its date corrected in both files before the merge.
6. Run `pnpm check:changelog`, then the review pass of
   [writing rules §7.2](../writing/7-review.md#72-the-review-pass) on the new entry, recorded in the pull
   request. Title the pull request `Release x.y.z`.

A highlight screenshot is optional; it goes into `public/media/changelog/` under the ordinary sidecar
rules ([media database](media-database.md)) with `tags: ["diagram"]` and no `park` or `ride`.

## Why

Before 2.12.0 the number in `package.json` moved with nearly every push (2.7.0 to 2.7.14 in five
weeks), which told a visitor nothing. 2.13.0 bundled 128 commits and 44 internal sections into 22
public items. Publishing the internal prose verbatim is how a changelog turns into a commit list.

The entries up to 2.11.6 were written afterwards from the commit history (PAR-320) and carry
`reconstructed: true`, shown as a badge. Their versions and dates are the repository's where one
exists (the `package.json` bumps, the headings of `docs/changelog.md`), assigned where the code kept
one number for weeks, and an entry covering several bumps names the last in `through`. A
reconstructed entry is never extended with anything the history does not show, and no number is
assigned between 2.12.0 and a later cut: from 2.12.0 on, every version is a real one.

## Check

`pnpm check:changelog` (CI, `.github/workflows/checks.yml`) has two halves.
`scripts/check-changelog.mjs` checks the release structure: file name and version, title, summary and
date, versions and dates in order, `through` below the next entry, `package.json` equal to the newest
published entry, every published, non-reconstructed entry's heading in `docs/changelog.md` with the
same date, no `## Unreleased` section, every fragment foldable as it stands
(`scripts/lib/changelog-fragments.mjs`), no skeleton `TODO` in a published entry, every highlight in
the media database. `scripts/check-prose.mjs --only=changelog` applies [the writing rules](../writing/README.md) to
the entries, the honesty family as an error, and one rule of the changelog's own: a list item may not
open on bold. `pnpm test:changelog-fragments` runs a whole cut in a scratch directory. Whether an
entry says what a visitor gets is the PO's read.

The page is `/en/changelog`, English only; `/changelog` and the other locale spellings are 308s in
`next.config.ts` `redirects()`, which runs before the proxy. Authoring contract for the entries:
[`content/changelog/README.md`](../../content/changelog/README.md).
