# The guide page (`/{locale}/{howto-segment}`)

The page that answers "what does this site do that a wait-time feed does not": ten chapters, the same
in every locale (the ride card; typical, busy, record; the best moment of the day; the right day; the
day as a plan; a park page top to bottom; where the numbers come from; what we leave blank; where to
find what; FAQ). Route folder `app/[locale]/how-park-fan-works/`. Open this page before editing the
guide's content, its demos or its URLs.

The standing rule, with the audit of what the cards really show, the live-block exceptions, the
motion constraints and the structured-data decision, is
[the guide page teaches the real cards with the ride's real numbers](../rules/the-guide-page-teaches-the-real-cards-with-the-rides-real.md).
This page holds the mechanism.

**The page tells a visitor what they see and can do; the why belongs here or in a component's
comment, never in the page.** The 2026-09-30 rewrite took the crowd thresholds, the hourly-profile
column rules, the source-disagreement chain, the night-job order and the planner's transfer formula
out of all six locales (German prose from about 4,000 to 2,200 words).

## URLs

| Locale | URL                               |
| ------ | --------------------------------- |
| de     | `/de/so-funktioniert-park-fan`    |
| en     | `/en/how-park-fan-works`          |
| nl     | `/nl/hoe-park-fan-werkt`          |
| fr     | `/fr/comment-fonctionne-park-fan` |
| es     | `/es/como-funciona-park-fan`      |
| it     | `/it/come-funziona-park-fan`      |

The same three-part arrangement as the glossary and the best-travel-time hub:

- **`lib/howto/segments.ts`** (`HOWTO_SEGMENTS`, `howtoPath`): the locale → segment table every link
  site imports (header, footer, the layout's `SiteNavigation` schema, the homepage CTA, the fancast
  and best-time content, the sitemap, IndexNow), so a slug is never typed twice. `next.config.ts`
  keeps its own copy of the table for `redirects()`; change both.
- **`rewrites()` in `next.config.ts`** serves the five non-English segments from the English route
  folder.
- **`redirects()` in `next.config.ts`**: every wrong segment under every locale, including the
  legacy `howto` the page shipped on for a year, redirects permanently (308) to that locale's
  segment, and `/<segment>` without a locale goes to `/<locale>/<segment>`. Bare `/howto` has no rule
  on purpose: it names no language, so `proxy.ts` resolves the reader's locale first and the
  per-locale rule finishes the job.

Two things that had to move with the slug: `app/api/cron/indexnow/route.ts` pushes the new URLs (a
submitter left on old ones feeds Bing redirects, see [SEO analysis](../seo/analysis.md)), and the OG
route's `genericPages` (`app/api/og/[...path]/route.tsx`) keeps both `howto` and
`how-park-fan-works`, because an OG URL already shared must keep rendering. `getOgImageUrl` uses the
English segment for every locale, so one key covers all six.

## Demos and fixtures

`_demos.tsx` and `_anatomy-demos.tsx` render **production** components (`AttractionCard`,
`AttractionTypicalWaits`, `RopeDropCard`, `ParkCalendarDay`, `NoLiveWaitTimesNotice`,
`CrowdLevelBadge`, `ComparisonBadge`, …) fed from `_fixtures.ts`, each inside a `DemoFrame`, and the
intro says the figures are examples: a card pixel-identical to the live one must not be mistaken for
a live reading. Two blocks fetch instead (`LiveHourlyProfile` around `ParkHourlyProfileCard`,
`LiveTopAttractions` around `ParkStatsSection`), gated by `useLoadLast` like every trip-planning
query.

Every figure in chapters 01–03 is a value the API returned for Taron and Phantasialand on 2026-08-24,
dated in `_fixtures.ts`. They are frozen on purpose: chapter 02's three steps are written around 70
minutes landing above Monday's busy line and on Saturday's median (Taron's Saturday median is exactly
70). Re-check them against the ride's page when the guide is next edited.

`_fixtures.ts` has two anchors:

- **Static**: typical waits, the calendar days, the hourly series, the out-of-season card.
- **Built from `nowMs`** by `buildDemoFixtures(nowMs)`: the queue history, the best-visit slot and the
  rope-drop instants, because a card's sparkline stretches its axis to the reader's clock and a
  hard-coded date decays into a sliver of curve with a week-long flat tail. `getServerNowMs()`
  resolves at build time on this prerendered route and the daily revalidate refreshes it. The
  rope-drop instants are wall-clock times on today's date in the **park's** zone; `parkLocalInstant()`
  formats the instant in the zone and re-reads the fields as UTC to get the offset in force, which
  holds across a DST change.

Traps beyond the rule's audit list:

- `minimumHeight` and the per-ride `predictionAccuracy` chip **are** rendered, by
  `AttractionMetaBadges` and `RideNowPanel`.
- **One card per row template.** `AttractionCard` is `row-span-3` + subgrid, so two in one three-row
  grid put the second on implicit `auto` rows and its panels closed over each other at 390 px. Each
  card gets its own wrapper.
- **Demo photos come from the media database**, never a typed path: `/media/phantasialand/taron.jpg`
  typed into `_demos.tsx` drops the sidecar's focal point and the `?v=` hash, so the card would be
  cropped differently from the park page's.

Chapter 05 mounts `PlannerDayFigure`, a server wrapper around `PlannerDayDemo` from
`app/[locale]/trip-planner/_demos.tsx`, fed by that page's `_fixtures.ts`: imported, not copied, so
there is one day grid and one date to keep honest. It costs the route the `planner` message
namespace (added by `pnpm generate:route-namespaces`): client messages went from 40,974 to 53,147 B
raw.

## Motion

Two pieces, following the split `lib/hooks/use-menu-reveal.ts` arrived at (CSS owns the picture, GSAP
owns the transition between two of them), with `IntersectionObserver` as the trigger and no
ScrollTrigger:

- **`_wait-scale.tsx`**, the figure the page is built around: one wait time against what that ride's
  day normally looks like. `WaitScaleBar` is a server-renderable `<figure>` whose geometry is three
  CSS custom properties, correct in the first HTML. `WaitScaleStage` is the sticky desktop copy: an
  observer picks the step the reader is next to and GSAP tweens those properties and the two numbers.
  Below `lg` each step carries its own static bar.
- **`_night-shift.tsx`**: the nightly job chain on the hours it runs at. GSAP lifts the markers once on
  first view; the diagram is complete without it.

What both must keep:

1. Nothing informative waits for script. A failed chunk or `prefers-reduced-motion` leaves the figure
   on the first step, and every step states its numbers in prose.
2. `fromTo` only from offsets a half-applied tween survives (a 14 px `y`), never from `opacity: 0` or
   `scaleX: 0`.
3. Nothing touches a backdrop: the bar sits on the page background, and the tween writes custom
   properties on one element rather than transforming an ancestor, which would flatten any
   `backdrop-blur` inside it while it runs.

Two charts meant to be compared pass the same `yMax` to `Sparkline` (`components/parks/sparkline.tsx`);
each instance otherwise fits its own maximum. The wide decorative layers (the opening glow, each
chapter's `Ambience` tint at 1152 px) cost 381 px of horizontal scroll on a phone until they were
clipped with `overflow-x-clip` (`_chrome.tsx`), never `overflow-hidden`, which would make a scroll
container and stop the chapter 02 figure sticking.

## Six locales, one shape

Each locale is a full `content/<locale>.tsx`, the convention `fancast` and `best-time-to-visit` use,
with localized chapter ids (`#massstab`, `#scale`, `#echelle`, …). The duplication is deliberate: a
shared structure with a per-locale string table would be an i18n mechanism invented for one page. The
cost is an edit applied six times. Chapter ids and labels live in `HOWTO_CHAPTERS`
(`lib/howto/chapters.ts`), read by the page, its rail and the header's "more" band;
`pnpm test:hub-chapters` fails on an id the page does not render. The `locale=` prop on the two live
blocks must match the file it is in.

## Companion post

[`content/blog/de/sind-70-minuten-viel.md`](../../content/blog/de/sind-70-minuten-viel.md) and its five
translations (`translationKey: is-seventy-minutes-a-lot`) make the same argument with **live** widgets
(`ride-waits-widget`, `hourly-profile-widget`, `park-comparison-widget`) and link here for the long
version. `parkLinks` puts it on the Phantasialand and Hansa-Park pages; Hansa-Park because the post
explains why that park shows no wait times.
