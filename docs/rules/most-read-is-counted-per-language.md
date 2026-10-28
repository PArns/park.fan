# Most read is counted per language, by a key every language shares (REQUIREMENT)

- **A page is one key in every language**: a post by its `translationKey`, a park or a ride by its
  UUID. The language travels beside the key (`locale`), never in it, so every ranking is per
  language and the admin can still add up a post's six languages.
- **`PageViewBeacon` posts straight to api.park.fan** (`sendPageView`, `lib/analytics/page-views.ts`),
  never through a relay route here, and only past the gates in
  [most read → the beacon](../features/most-read.md#the-beacon) (production hosts, a dwell in the
  foreground, no opt-out signal, once per tab, nothing stored in the browser).
- **The current lists are fetched** from `/api/nav/most-read/[locale]` (an hour) via `useMostRead`.
  A failed ranking is a 502 without cache, never a 200 with empty lists.
- **The build's snapshot is rendered**: the post foot and the homepage draw `getMostReadSeed(locale)`
  (written by `scripts/generate-most-read-seed.mjs` in `prebuild`) into the HTML, and the browser
  swaps in the current lists after load. Never a request or a `revalidate` in the page for it, and
  never in the header band, which ships on every page.
- **Every list is full and every row has a fixed height**: `resolveMostRead` fills a thin ranking
  with the newest posts at 0 views, and `MOST_READ_ROW_HEIGHT` fixes the row, so the placeholders
  reserve exactly what arrives. The flame and the „Meistgelesen" badge ask one question,
  `mostReadLeader`.
- **Popular parks follow the views too**: four surfaces take the locale's most viewed parks and fill
  up with their hand-picked list (`rankedFirst`); which surfaces and from where is
  [most read → popular parks](../features/most-read.md#popular-parks). The footer's four countries
  never change.

## Why

Counting per URL would split a post into six and a park into one count per slug it ever had; a list
summed over all languages would be the German list for every reader. A relay would make every reader
one Vercel address and one User-Agent to the API's per-reader cap and bot filter. A list fetched only
by the browser has no links for a crawler, and one fetched at render time would put an hour's
`revalidate` on pages that keep a day or a week. An empty list cached for an hour hides the feature
on a blip, and a list shorter than its placeholder moves the page under the reader.

## Check

`pnpm test:most-read`, `pnpm test:viewed-parks`. Background:
[most read](../features/most-read.md) (beacon, rankings, surfaces, admin); the API half is
[`docs/frontend/page-views.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/page-views.md).
