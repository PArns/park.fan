# A version is a unit of communication, not a build artifact (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the procedure and the checks.

This site deploys continuously, so **a merge is not a version** and **a ticket is not a version**.
A version bundles everything that became visible since the last one, and it is drawn when there
is something to tell people. The authoring contract for the public entries is
[`content/changelog/README.md`](../../content/changelog/README.md).

## The rule

- The PO decides when a version is cut, its number and what goes into the public entry: at a
  cycle boundary (Monday) or when enough visible change has piled up, never more often than weekly
  and never less often than monthly. 2.13.0 bundled 128 commits and 44 internal sections into 22
  public items.
- The number follows what a visitor can see. MINOR (`x.Y.0`) once at least one new visible
  capability has landed since the last cut: a page, a flow, a behaviour somebody would notice.
  PATCH (`x.y.Z`) for a bundle of fixes and small improvements with no new capability. MAJOR is
  kept for a relaunch; the last one was 2.0 in December 2025, when the site was rebuilt from
  scratch, and a website has no breaking change to offer the people reading it.
- Two files carry a release, and they are not two copies of one thing. `docs/changelog.md` is
  the internal log: German, one section per pull request, naming components and measurements,
  written for whoever touches the code next. Between cuts those sections wait as fragments in
  `docs/changelog.d/`, one file each, so two open pull requests never edit the same lines. `content/changelog/<version>.md` is the public entry: English,
  written by hand for a visitor when the version is cut. Nothing parses one into the other, and
  nothing should; publishing the internal prose verbatim is how a changelog turns into a commit
  list.
- A blog or news post is never a release item. It ships in the same build, but it is content,
  not product, and it belongs in the feed.

## Who does what

| Who                                      | Does                                                                                                                                                                    | Never                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Any pull request (cloud or local runner) | Writes its section as a fragment, `docs/changelog.d/PAR-<n>.md` ([format](../changelog.d/README.md)). A post, a photo or a news item needs none.                        | Writes into `docs/changelog.md`, bumps `version` in `package.json`, touches `content/changelog/`. |
| The PO                                   | Decides the number and the items, and files them as a ticket `Release x.y.z` (frontend, Cloud, current cycle): one line per item with the fragment or PR it comes from. | Writes the pull request itself, lists a blog post, cuts a version per ticket.                     |
| The runner that takes `Release x.y.z`    | Writes the cut below as one pull request, with exactly the items of the ticket.                                                                                         | Adds or drops an item on its own; a missing or doubtful one goes back to the PO as a question.    |
| Anyone, correcting a published entry     | Fixes the wrong fact in `content/changelog/<version>.md` in an ordinary pull request.                                                                                   | Changes a published version number or date, other than to correct it to what the history shows.   |

The PO reviews and merges the release pull request like any other, and checks the prose evidence
of step 6 before it does.

## Cutting a version: one pull request

1. Number: MINOR if the fragments contain one new visible capability, PATCH otherwise.
2. Run `pnpm release:cut x.y.z --title "<German title>"` (`--dry-run` first to read it). It folds
   every fragment under `## x.y.z (<today>) – <title>` at the top of `docs/changelog.md`, newest
   first, deletes the fragment files, sets `version` in `package.json` and writes
   `content/changelog/x.y.z.md` as a `mode: draft` skeleton. It refuses to run while a fragment is
   malformed, and changes nothing then.
3. Write `content/changelog/x.y.z.md` from the folded sections for a visitor:
   `## New`, `## Improved`, `## Fixed`. Leave out admin screens, CI and tooling, docs, refactors
   without a number a visitor would feel, and every blog or news post. Prefer a number to an
   adjective, and look each one up in the section or commit it comes from. Then set
   `mode: published`. The footer's version links to this entry (`components/common/build-info.tsx`),
   which is why `package.json` and the newest published entry have to agree.
4. Merge `main` in before the release pull request is reviewed. A fragment that landed in the
   meantime is folded in by hand under the same heading, as `### <title>` and its text, and its
   file deleted; `pnpm check:changelog` lists what is still waiting.
5. The date is the day the pull request merges, Europe/Berlin, the same rule as a news post. A pull
   request that merges a day later gets its date corrected before the merge, in both files.
6. Run `pnpm check:changelog`, then the review pass of
   [`docs/blog.md` §7.2](../blog.md#72-the-review-pass) on the new entry, recorded in the pull
   request as `Prosa-Review: …`. Title the pull request `Release x.y.z`.

A highlight screenshot is optional. It is stored in `public/media/changelog/` under the ordinary
sidecar rules ([media database](media-database.md)) with `tags: ["diagram"]` and no `park`/`ride`,
because a picture of our own interface is not a photograph of a park.

## What the checks enforce

`pnpm check:changelog` runs in CI (`.github/workflows/checks.yml`) and has two halves.

`scripts/check-changelog.mjs` checks the release structure: the file name matches the version,
title, summary and date are there, a higher version is never older than a lower one, a `through`
stays below the next entry, `package.json` equals the newest published entry, every published
entry that is not reconstructed has its heading with the same date in `docs/changelog.md`, the log
holds no `## Unreleased` section, every fragment is one the cut can fold in as it stands
(`scripts/lib/changelog-fragments.mjs`), a published entry carries no `TODO` from the skeleton, and
each highlight exists in the media database. `pnpm test:changelog-fragments` runs a whole cut in a
scratch directory against the same code.

`scripts/check-prose.mjs --only=changelog` applies the writing rules of
[`docs/blog.md`](../blog.md) to the entries, with the honesty family as an error because every
sentence there is about us. One rule is the changelog's own: a list item may not open on bold.
2.12.0 shipped with sixteen items shaped `- **A short claim.** The explanation`, the chat-window
layout §4.2 names, and the collection's README prescribed it.

What neither can see is whether the entry says what a visitor gets. That is the PO's read.

## The history before 2.12.0

Versions were not cut before 2.12.0: the number in `package.json` moved with nearly every push,
2.7.0 to 2.7.14 in five weeks. The entries up to 2.11.0 were written in September 2026 from the
commit history (PAR-320) and carry `reconstructed: true`, which the page shows as a badge. Their
versions and dates are the ones the repository carried: the `package.json` bumps, or the version
headings of `docs/changelog.md` where it has them (2.9.0 to 2.11.0; its 2.10.x dates are the
log's, 7 and 10 June, while `package.json` only reached 2.10.0 on 20 July). One entry covers a
run of versions through `through`. 0.2.0 to 1.2.0 is the first site, which the December rebuild
replaced file for file. A reconstructed entry is never extended with anything the history does not
show.

## The page

`/en/changelog`, English only. `/changelog` and the five other locale spellings are permanent (308) redirects in
`next.config.ts`, which is where they have to be: `redirects()` runs before the proxy, and the
proxy would otherwise resolve the bare path against Accept-Language. The footer links it on every
page with `hrefLang="en"`, and the list at the top of the page (`ChangelogIndex`) jumps to any
version by number and date.
