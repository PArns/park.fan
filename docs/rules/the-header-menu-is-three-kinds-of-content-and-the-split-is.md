# The header menu is three kinds of content, and the split is about the link graph (REQUIREMENT)

Everything the header's full-width band renders is a link on ~35,000 pages, so what goes into the
server HTML is decided by the link graph:

1. **Hub links, server-rendered and always in the document.** The parks panel renders continents
   and countries only (28 hub links, 420 B brotli). A panel's markup is `hidden`, never unmounted
   and never `next/dynamic`, so the destinations stay in every page's HTML. The „Mehr" entry (best
   time, dictionary, guide; `NavMenu.href` is optional for it) and the hub chapter lists
   (`lib/howto/chapters.ts`, `lib/best-time/chapters.ts`, fragments on their hub, so no new crawl
   targets) follow the same rule.
2. **Detail fetched per opened country.** The 144 cities and 212 parks come from
   `/api/nav/geo/[continent]/[country]`: they are already reachable from the hubs and the sitemap,
   and in the template they would spread the same weight over 356 more targets. Blog tags stay out
   too (31 tag pages over 7 posts were mostly one post's teaser at a second URL).
3. **Personal content, loaded only for a visitor who has it**: favorites and the browser's own
   alerts. The alerts group is gated on `countPushFollowsLocal()`, a `localStorage` read, and loaded
   with `React.lazy` (`components/layout/favorites-menu-panel.tsx`), because
   `lib/push/push-follows.ts` reaches the service worker and the VAPID key.

The photo rail is a fixed six (`lib/navigation/featured-parks-menu.ts`: the locale's most viewed
parks, with the brand cover where a park has no photo, then the homepage's `FEATURED_PARK_SLUGS`
that have one, then other photographed parks), resolved on the server, because `@/lib/media` is the
107 KB catalog and the header is a Client Component.

## What else is load-bearing

- **The band is glass** (`bg-popover/95` + `backdrop-blur-xl` + the popover ring), and the opening
  animation (`lib/hooks/use-menu-reveal.ts`) only targets descendants of the surface: a transform or
  opacity on it or an ancestor makes it a backdrop root and the blur goes flat. CSS owns visibility,
  GSAP animates `y` only, and under `prefers-reduced-motion` the chunk is never imported.
- **It is positioned against the `<header>`, not the trigger, and its content column is the bar's
  column** (`MenuBand`), read off the header's container, not the window. The nav is
  `whitespace-nowrap` and `white-space` inherits, so the surface resets `whitespace-normal`.
- **Hover has to be rested on, not crossed**: entering a country row arms the switch and leaving
  before 140 ms disarms it (focus commits at once). A response keyed by country is a cache write and
  is never cancelled; a failed request drops its key so the next hover retries.
- **One `useTranslations('blog')` in a header component puts the whole namespace on every page**
  (6,066 → 9,047 B × 6 locales for one label), so the bar's words live in `navigation`.
- **Card widths in the favorites band come from `planBand`** (`lib/utils/favorites-band-plan.ts`):
  one width for every card (`CARD_MIN` 168 to `CARD_MAX` 248 px), whole tracks per group, and
  `MAX_CARD_ROWS` rows before the "+N" line, so the height follows the rows, not the favorites
  count (868 → 610 px at 1440 with eleven favorites).
- **A row leaves only where the server let it go.** Removing an alert sends the DELETE first, then
  writes the local mirror and the query cache only on success (`usePushFollowRemoval`, shared with
  `AlertsOverview`); a **404 is a success**. The read path passes a failed identity lookup on as
  `{ ok: false }` (`lookupExistingPushIdentity()`), never as an empty list.
- **Labels**: the blog entry is „Guides" (`navigation.blog`), and News is an entry of its own with
  `NewsMenuPanel` ([news is set apart](news-is-set-apart-from-the-articles.md)). Six entries did not
  fit a 1024 px bar in French; with the current entries every locale fits on one line there.

## Why

Before the band the header carried 4 crawlable nav links; after, 48, all resolving 200, for
+5.65 KB brotli per page (~4.2 KB of it the 23 flags), CLS unchanged, and no photo request until
somebody opens it. Skimming past countries used to discard their answers and refuse to ask again:
23 of 23 countries stayed empty. Removing an alert wrote the mirror first and never read
`response.ok`, so a 500 took the row off the screen over an alert that was still armed.

## Check

`pnpm check:header-links` (against a running site) counts the hub links in the served `<header>`
against `/v1/discovery/continents`; `pnpm test:hub-chapters`, `pnpm test:favorites-band`,
`pnpm test:push-follow-delete` and `pnpm test:push-follow-read` pin the rest. Background:
[header navigation](../features/header-navigation.md).
