# The guide page (`/{locale}/{howto-segment}`)

The page that answers "what does this site do that a wait-time feed does not": eleven chapters, the
same in every locale (the ride card; normal, busy, record; the best moment of the day; the right day;
the day as a plan; a park page top to bottom; where the numbers come from; what we leave blank; where
to find what; ask Parky; FAQ). Route folder `app/[locale]/how-park-fan-works/`. Open this page before
editing the guide's content, its demos or its URLs.

The standing rule, with the audit of what the cards really show, the live-block exceptions, the
motion constraints and the structured-data decision, is
[the guide page teaches the real cards with the ride's real numbers](../rules/the-guide-page-teaches-the-real-cards-with-the-rides-real.md).
This page holds the mechanism.

**The page tells a visitor what they see and can do; the why belongs here or in a component's
comment, never in the page.** The 2026-09-30 rewrite took the crowd thresholds, the hourly-profile
column rules, the source-disagreement chain, the night-job order and the planner's transfer formula
out of all six locales (German prose from about 4,000 to 2,200 words).

The 2026-11-04 fact check went through every claim against both repos and the live API and fixed
what had gone stale or was never true: the sources are no majority vote (ThemeParks.wiki is the base,
the other two add rides and overrule a stale "closed"), chapter 06 follows the park page as it renders
now, the park-wide table is an hourly average and not the ride page's daily peaks, no holiday radius
exists, Fancast measures seven days, and the search opens with `/`. It added chapter 10 on Parky. The
words on the page are the UI's: the ride page's P50 is „Normal", so chapter 02 says so, while the park
table's own labels („Typisch"/„Spitze") are named as that table's.

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
`CrowdLevelBadge`, `ParkHolidayBand`, …) fed from `_fixtures.ts`, each inside a `DemoFrame`, and the
intro says the figures are examples: a card pixel-identical to the live one must not be mistaken for
a live reading. Two blocks fetch instead (`LiveHourlyProfile` around `ParkHourlyProfileCard`,
`LiveTopAttractions` around `ParkStatsSection`), gated by `useLoadLast` like every trip-planning
query.

Every figure is a value the API returned, dated in `_fixtures.ts` or beside the demo:

| Fixture                                                                                | Read on    |
| -------------------------------------------------------------------------------------- | ---------- |
| Taron's typical waits and its 45-minute baseline (chapter 01–02)                       | 2026-09-10 |
| The live-looking ride cards and the rope-drop card                                     | 2026-08-24 |
| Taron's land and height (130 cm), the ice rink's season                                | 2026-11-04 |
| The four autumn-holiday days (19, 20, 22 and 25 October 2026)                          | 2026-11-04 |
| Magic Kingdom's skip-the-line lines, Europa-Park's show and restaurant, the stats rows | 2026-11-04 |
| The holiday band's day (09:00–19:00, NRW and Gelderland on summer holidays)            | 2026-08-24 |

The scale figures are frozen on purpose: chapter 02's three steps are written around 70 minutes
landing on Monday's busy line and on Saturday's median. Re-checked on 2026-11-04: Monday still 55/70,
Saturday still 70/85 and the only day with a median of 70, while the weekday bucket moved to 55/80 and
the baseline to 40, which is why the prose dates the 45 to September. Re-check them against the
ride's page when the guide is next edited.

`_fixtures.ts` has two anchors:

- **Static**: typical waits, the calendar days, the hourly series, the out-of-season card.
- **Built from `nowMs`** by `buildDemoFixtures(nowMs)`: the queue history, the best-visit slot and the
  rope-drop instants, because a card's sparkline stretches its axis to the reader's clock and a
  hard-coded date decays into a sliver of curve with a week-long flat tail. `getServerNowMs()`
  resolves at build time on this prerendered route and the daily revalidate refreshes it. The
  rope-drop instants are wall-clock times on today's date in the **park's** zone; `parkLocalInstant()`
  formats the instant in the zone and re-reads the fields as UTC to get the offset in force, which
  holds across a DST change. Chapter 06's `todaySchedule` (opening hours on the park-local date, via
  `parkDayOf`) and the show's times use it too: fixed `07:00Z`/`17:00Z` read 09:00–19:00 in summer
  and 08:00–18:00 after the clocks went back.

Traps beyond the rule's audit list:

- `minimumHeight` and the per-ride `predictionAccuracy` chip **are** rendered, by
  `AttractionMetaBadges` and `RideNowPanel`.
- **One card per row template.** `AttractionCard` is `row-span-3` + subgrid, so two in one three-row
  grid put the second on implicit `auto` rows and its panels closed over each other at 390 px. Each
  card gets its own wrapper.
- **Demo photos come from the media database**, never a typed path: `/media/phantasialand/taron.jpg`
  typed into `_demos.tsx` drops the sidecar's focal point and the `?v=` hash, so the card would be
  cropped differently from the park page's.
- **Chapter 06 shows no `ParkTimeInfo`.** That card renders on no park page any more; „Heute im Park"
  (`ParkTodayPanel`) took its hours, countdown and holidays, and the panel polls its own queries, so
  it has no fixture mode. The step shows the three parts of the panel that do take fixtures: the
  warning strip (`WeatherWarningBanner`), the rain banner a press on the title row opens
  (`NowcastAlertBanner`) and the holiday band (`ParkHolidayBand`).
- **The park-wide table is not the ride page's scale.** `ParkStatsAttractionsCard` averages hourly P50
  and P90 over every opening hour of two years (`/stats`), so Taron reads 45/45 there and 55/80 on its
  own page. `AnatomyStatsDemo` takes its labels from `useParkStatsAttractionsLabels`, the hook the
  park page's section uses, so the guide cannot name a column the page does not.
- **`ComparisonBadge` is on no public surface**, so chapter 08 shows the crowd levels alone.
- **Two night jobs at one time** (03:00, the park baseline and the TFT training) share one marker on
  the track; the cards are keyed by title.

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
cost is an edit applied six times. French spacing follows the file: U+00A0 before a colon,
U+202F before `?`, `;` and inside « ». Chapter ids and labels live in `HOWTO_CHAPTERS`
(`lib/howto/chapters.ts`), read by the page, its rail and the header's "more" band;
`pnpm test:hub-chapters` fails on an id the page does not render. The `locale=` prop on the two live
blocks must match the file it is in.

## Parky's chapter

Chapter 10 (`#parky` in every locale) sits between "where to find what" and the FAQ, the way the
homepage tour ends on Parky. `ParkyShot` puts the text beside the same phone screenshot Parky's page
and the tour show (`ShotRow`, `public/media/parky/<locale>/chat.webp` through `versionedPath`), with
the alt text from `parkyPage.chapters.ask.alt`, read on the server. What the chapter claims comes from
[the assistant page](assistant.md) and the API's `docs/frontend/assistant.md`: the lookups, the
actions only on request, the position only after „Standort teilen", no web search, three questions
per 30 seconds, questions kept 90 days without an address.

## Companion post

[`content/blog/de/sind-70-minuten-viel.md`](../../content/blog/de/sind-70-minuten-viel.md) and its five
translations (`translationKey: is-seventy-minutes-a-lot`) make the same argument with **live** widgets
(`ride-waits-widget`, `hourly-profile-widget`, `park-comparison-widget`) and link here for the long
version. `parkLinks` puts it on the Phantasialand and Hansa-Park pages; Hansa-Park because the post
explains why that park shows no wait times.
