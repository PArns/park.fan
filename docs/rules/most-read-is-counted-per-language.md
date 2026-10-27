# Most read is counted per language, by a key every language shares (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here. The whole feature (beacon, rankings, surfaces, admin) is [docs/features/most-read.md](../features/most-read.md); the API half is `docs/frontend/page-views.md` in v4.api.park.fan.

## The rule

- **A page is one key in every language**: a post by its `translationKey`, a park or a ride by its UUID. The language travels beside the key (`locale`), never in it, so every ranking is per language and the admin can still add a post's six languages up.
- **`PageViewBeacon` posts straight to api.park.fan** (`sendPageView`, `lib/analytics/page-views.ts`), never through a relay route here: the API caps a reader by address and User-Agent, and both must be the reader's own. Only on `ANALYTICS_HOSTS`, after five seconds in front, never under Do Not Track, Global Privacy Control, the opt-out or automation, once per tab, and nothing in the browser's storage (§ 25 TDDDG).
- **The current lists are fetched**: `/api/nav/most-read/[locale]` (an hour) via `useMostRead`. A failed ranking is a 502 without cache, never a 200 with empty lists.
- **The build's snapshot is rendered**: the post foot and the homepage draw `getMostReadSeed(locale)` (`scripts/generate-most-read-seed.mjs`, run by `prebuild`) into the HTML, so crawlers find the links, and the browser swaps in the current lists after load. Never a request or a `revalidate` in the page for it, and never in the header band, which ships on every page.
- **Every list is full** (`resolveMostRead` fills a thin ranking with the newest posts at 0 views), and a row's height is fixed (`MOST_READ_ROW_HEIGHT`), so the placeholders reserve exactly what arrives. The flame and the „Meistgelesen" badge ask one question, `mostReadLeader`.

## Why

Counting per URL would split a post into six and a park into one count per slug it ever had. A list summed over all languages would be the German list for every reader. A relay would make every reader look like one Vercel address and one User-Agent to the API's cap and bot filter. A list fetched only by the browser has no links for a crawler, and one fetched at render time would put an hour's `revalidate` on pages that keep a day or a week; the build's snapshot is neither. One rendered into the header would cost every page. An empty list cached for an hour hides the feature on a blip; a list that can come back shorter than its placeholder moves the page under the reader.

`pnpm test:most-read`.
