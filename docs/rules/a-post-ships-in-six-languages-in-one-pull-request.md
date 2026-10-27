# A post ships in six languages in one pull request (REQUIREMENT)

Every blog post, guide and news post ships as six files, `content/blog/{de,en,nl,fr,es,it}/<slug>.md`,
with one `translationKey`, in the pull request that writes it. So does every later change to it: an
update with new dates or parks, a corrected fact, a `[!CORRECTION]` note.

- German is written first and the other five are derived from it, each as its own text
  ([writing rules §6](../writing/6-translation.md)).
- Nothing waits for the German to be approved before it is translated. There is no follow-up
  ticket „Übersetzungen: `<slug>`“. A change that touches only `de/` is not finished.
- All six carry the same `updatedAt`, or none of them does
  ([`updatedAt` is for new content](updated-at-is-for-new-content.md)).
- UI strings (`messages/*.json`) and page content under `app/[locale]/**/content/<locale>.tsx`
  follow the same rule.

## Why

While translations were separate tickets they fell behind twice in two weeks. On 2026-09-30 four
news posts existed only in German, the oldest for two weeks, and `/en/news/…` showed the fallback
notice all that time. On 2026-09-29 the German Halloween guide got Alton Towers and PortAventura
and a new `updatedAt`, and the other five languages stayed without either park, with every
check green, because all six files existed, the manifest compares `date` but not
`updatedAt`, and `check:untranslated` reads only `messages/`.

## Check

`pnpm check:blog-updated-at` (`scripts/check-blog-updated-at.mjs`) groups `content/blog/` by
`translationKey` and fails when a group has fewer than six files or its files disagree on
`updatedAt` (or, for news, on `time`). It runs in `.github/workflows/checks.yml` and in `prebuild`.
