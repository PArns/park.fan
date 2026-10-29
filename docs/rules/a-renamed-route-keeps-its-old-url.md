# A renamed or moved route keeps its old URL alive (REQUIREMENT)

A change that renames or moves a URL (a park or ride slug, a post slug, a localized path segment, a
locale segment) ships the permanent redirect (308) from the old URL in the same pull request.

- **Pick the mechanism that already owns the case:**
  - a renamed post or a park the API no longer answers under its old slug: `redirects()` in
    `next.config.ts` (`renamedPosts`, `renamedParks`), once with `/:locale/…` and once without a
    locale prefix;
  - a localized segment (`/de/glossar`, `/fr/glossaire`): a rewrite to the English route folder in
    `rewrites()` plus the cross-locale and wrong-segment 308s in `redirects()`, and a new segment
    goes into both blocks (`localeSegments`);
  - an unprefixed path whose target does not depend on the visitor: `proxy.ts`
    (`lib/i18n/unprefixed-redirect.ts`);
  - a slug that only data can resolve: the lookups in `lib/utils/redirect-utils.ts`
    (`findRelocatedParkRedirect`, `findRenamedParkRedirect`, `findParkPageRedirect`),
    `findMovedRideRedirect` (`lib/parks/closed-ride.ts`) and `findTermByAnySlug`
    (`lib/glossary/translations.ts`), called from the page.
- **Never hard-code a locale in a destination** (`/en/parks/…`). Keep the locale as `:locale`, or
  leave the bare path to `proxy.ts` and next-intl, which pick the reader's language.
- **Check the API before adding a park rule**: `curl -sI https://api.park.fan/v1/parks/<geo>/<slug>`.
  If the API 301s the old slug, add nothing: the park page follows it and 308s to the real path on
  its own. A static pair there races upstream, and when upstream flipped four park slugs back it
  turned their pages into redirect loops (Aug 2026). A static rule is only for an old slug the API
  answers with 404.
- **On a crawled surface, a redirect that can be decided from the URL goes into `proxy.ts`**, not a
  render: [a redirect thrown from a render carries the layout as its body](a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md).

## Why

Without the redirect, every indexed link to the old URL becomes a 404 that Google keeps in its
index and keeps crawling, and the ranking the page earned is lost. Unprefixed paths are crawled
although nothing links them, and next-intl's 307 to the `Accept-Language` locale sent Googlebot to a
404, so `proxy.ts` answers them with a 308 first
([routing → locale prefix](../architecture/routing-and-urls.md#locale-prefix) has the numbers).

## Check

`pnpm test:unprefixed-redirect` pins the proxy's unprefixed 308s; `curl -sI` the old URL against a
production build or preview and expect one `308` to the new one. Background:
[routing and URLs → redirect logic](../architecture/routing-and-urls.md#redirect-logic-404-prevention).
