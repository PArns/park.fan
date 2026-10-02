# A post ships in six languages in one pull request (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the
rule in one line and links here for the reasoning.

## The rule

Every blog post, guide and news post ships as six files, `content/blog/{de,en,nl,fr,es,it}/<slug>.md`,
with one `translationKey`, in the pull request that writes it. So does every later change to it: an
update with new dates or parks, a corrected fact, a `[!CORRECTION]` note.

- German is written first and the other five are derived from it, each as its own text
  ([docs/blog.md §6](../blog.md#6-german-is-the-source-the-other-five-are-derived)).
- Nothing waits for the German to be approved before it is translated. There is no follow-up
  ticket „Übersetzungen: `<slug>`“.
- A change that touches only `de/` is not finished.
- All six carry the same `updatedAt`, or none of them does
  ([`updatedAt` is for new content](updated-at-is-for-new-content.md)).

UI strings (`messages/*.json`) and page content under `app/[locale]/**/content/<locale>.tsx`
follow the same rule.

## How it is checked

`pnpm check:blog-updated-at` (`scripts/check-blog-updated-at.mjs`) groups `content/blog/` by
`translationKey` and fails when the files of a group disagree on `updatedAt`. It runs in
`checks.yml` and in `prebuild`, next to `check:untranslated`, and prints how many groups it
compared. A missing file is not caught by it; `pnpm generate:blog-manifest` and the count per
`translationKey` before review are.

## Why

Until 2026-10-01 a guide waited for its German to be approved, and its translation was a separate
ticket. The translations fell behind twice in two weeks:

- On 2026-09-30 four news posts existed only in German, the oldest since 16 September. `/en/news/…`
  showed the fallback notice for all of that time.
- On 2026-09-29 PAR-582 added Alton Towers and PortAventura to the German Halloween guide and moved
  its `updatedAt`. English, Dutch, French, Spanish and Italian stayed on 2026-09-25 with neither
  park until PAR-620. Every check was green: all six files existed, the manifest compares `date`
  but not `updatedAt`, and `check:untranslated` reads only `messages/`.

The new check, run against `main` before PAR-620, found two groups: the Halloween guide, and the
Parc Astérix guide, whose French carried `updatedAt: 2026-10-01` for four corrected facts that the
other five already had without the date.
