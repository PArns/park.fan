# The guide page (`/{locale}/{howto-segment}`)

The page that answers "what does this site actually do that a wait-time feed
does not". Route folder `app/[locale]/how-park-fan-works/`, published on a
localized slug per language.

| Locale | URL                               |
| ------ | --------------------------------- |
| de     | `/de/so-funktioniert-park-fan`    |
| en     | `/en/how-park-fan-works`          |
| nl     | `/nl/hoe-park-fan-werkt`          |
| fr     | `/fr/comment-fonctionne-park-fan` |
| es     | `/es/como-funciona-park-fan`      |
| it     | `/it/come-funziona-park-fan`      |

---

## 1. The slug moved, and the mechanism is the one already in the repo

It shipped for a year on `/howto` in all six languages — the only static page
left on an English segment outside English, and a segment that says nothing in
any of them. It now uses the same three-part arrangement as the glossary and
the best-travel-time hub, and nothing else:

- **`lib/howto/segments.ts`** — the locale → segment table. Every link site
  imports it (`header`, `footer`, the layout's `SiteNavigation` schema, the
  homepage CTA, the fancast and best-time content files) so a slug can never be
  typed twice.
- **`rewrites()` in `next.config.ts`** — the five non-English segments are
  served by the English route folder. EN needs none.
- **`redirects()` in `next.config.ts`** — every wrong segment under every
  locale 301s to that locale's correct one, and `howto` is folded into that
  wrong-segment set, which is what keeps the indexed URLs alive. Bare `/howto`
  is deliberately absent: it names no language, so the intl middleware resolves
  the visitor's locale first and the per-locale rule finishes the job.

Two things that had to move with it, both easy to miss:

- `app/api/cron/indexnow/route.ts` pushes the **new** URLs. A submitter left on
  the old ones just feeds redirects to Bing — the exact failure documented in
  [SEO analysis](../seo/analysis.md).
- The OG route's `genericPages` keeps **both** `howto` and `how-park-fan-works`,
  because an OG URL that was already shared or cached must keep rendering a
  card. `getOgImageUrl` uses the English segment for every locale, so one key
  covers all six.

The sitemap entry is priority **0.8**, up from 0.4: it is the page every other
surface links to when it needs to explain what a badge, a percentile or a
forecast means.

## 2. The numbers are the ride's own

Every figure in chapters 01–03 is a value the API returned for Taron and
Phantasialand on 2026-08-24, copied into `_fixtures.ts` with the date on it —
not a shape invented to make the lesson land. That matters twice over: a reader
who follows the "echte Werte" link must not find different numbers, and the
lesson itself is better for being real. Taron's Saturday median is exactly 70
minutes, which is why 70 is the number at the entrance.

Frozen rather than fetched, deliberately. The three steps in chapter 02 are
written around 70 landing above Monday's busy line and on Saturday's median; a
lesson that re-shapes itself overnight is not a lesson. Re-check them against
the ride's page when this page is next edited.

Things the audit caught, worth not re-introducing:

- **`AttractionTypicalWaits` shows no measured-day count.** The number above each
  bar is that weekday's P90; the card's own hint names the _window_
  ("Basierend auf den letzten 365 Tagen"), which is a different thing.
- **No surface puts sample days next to a ride, on any page.**
  `ParkStatsAttractionsCard` — the park's longest-queue ranking, and the one this
  page mounts live — renders rank, ride, (now), P50, P90 and nothing else. The
  measured-day count is rendered in exactly three places: the stats section's own
  subtitle (`parks.stats.subtitle`, the park total), the `Tage` column in the
  by-month and by-weekday cards, and the blog's `ride-waits-widget` (`RideWaitTable`,
  `columns=…,days`), which is the only per-ride one. Four sentences on this page
  claimed the park page had a per-ride column; they were wrong in all six
  languages before anybody read them in five of those. The scale figure in chapter
  02 does show sample days, because its fixture carries them.
- **`typicalWaitThisHour` / `currentVsTypical` are never rendered anywhere.**
  They exist on the payload and are only passed through. Do not claim them.
- **The calendar's horizon is the park's, not a year.** A year-round park
  (Disneyland Paris, Efteling) answers with a crowd level 330 days out; a
  seasonal one (Phantasialand, Europa-Park) returns CLOSED past its published
  season, because a forecast for a day the park demonstrably shuts is not a
  forecast.
- **Taron's queue is flat across the day** (60/60/54/53/59 by hour) while Chiapas
  climbs by 22 minutes. "Come early" is a per-ride finding, not a rule, which is
  what chapter 03 now says.
- **The rope-drop thresholds are visible in the same park**: Colorado Adventure
  saves 40 minutes off a 50-minute peak and gets no recommendation, against the
  ≥ 60 peak / ≥ 45 saved gate.
- `minimumHeight` (Taron 140 cm) and the per-ride `predictionAccuracy` badge
  **are** rendered — `AttractionMetaBadges` and `AttractionLivePanel`.
- **A shared row template holds exactly one card.** `AttractionCard` is
  `row-span-3` + subgrid, so two of them in one three-row grid put the second on
  implicit `auto` rows: at 390 px card 1 got the 32 px spacer row and card 2 a
  0 px one, and its panels' `-mb-4`/`-mt-4` closed over each other. Each card
  gets its own wrapper, like the blog widgets.
- **The demo photos come from the media database**, not from a path typed into
  `_demos.tsx`. A literal `/media/phantasialand/taron.jpg` drops the sidecar's
  focal point (Taron 0.55/0.58, Black Mamba 0.5/0.38) and the `?v=` content
  hash, so the card would be cropped differently from the one a park page paints
  — which is the one claim this page cannot afford to get wrong.

## 3. The example UI is the real UI, and it never fetches

`_demos.tsx` renders **production** components — `AttractionCard`,
`AttractionTypicalWaits`, `RopeDropCard`, `ParkCalendarDay`,
`NoLiveWaitTimesNotice`, `CrowdLevelBadge`, `ComparisonBadge`,
`HourlyP90Sparkline` — fed from `_fixtures.ts`. A redrawn lookalike would
defeat the exercise (the reader is being taught to recognise these exact cards
an hour later in the park) and would start lying the first time one of them is
restyled.

Most of them are prop-driven by design, so the teaching figures hold still while
chapter 02 argues about specific readings. Two blocks are the deliberate
exception and mount the fetching wrappers (`ParkStatsSection`,
`ParkHourlyProfileCard`): where the claim is "this is running right now", a
frozen copy is the wrong exhibit. Both are gated by `useLoadLast` like every
other trip-planning query, and the prose beside them names no figure they
render — which is also what keeps the page honest when the numbers move.

Every block sits in a `DemoFrame`, and the intro says in plain words that the
figures are examples. That is not decoration: a card that is pixel-identical to
the live one must not be mistakable for a live reading.

### Two anchors, on purpose

`_fixtures.ts` splits into constants and `buildDemoFixtures(nowMs)`:

- **Static** — typical waits, the calendar days, the hourly series, the
  out-of-season card. Nothing about them depends on when you look.
- **Built from `nowMs`** — the queue history, the best-visit slot and the
  rope-drop instants. A card's sparkline stretches its axis to the reader's
  clock (`WaitTimeSparklineCard`) and the best-time row counts down to it, so a
  hard-coded date does not stay a demo: it decays into a sliver of curve with a
  week-long flat tail and a permanent "right now". `getServerNowMs()` resolves
  at build time on this prerendered route and the daily revalidate refreshes it.

The rope-drop instants are wall-clock times **on today's date in the park's
zone**, not offsets from now, because the card renders them as "until about
09:45". `parkLocalInstant()` gets that right across a DST boundary by
formatting the instant in the zone and re-reading those fields as if they were
UTC — the difference is the offset in force at that instant.

## 4. Motion: GSAP for the tween, `IntersectionObserver` for the trigger

Two pieces, both following the split `lib/hooks/use-menu-reveal.ts` arrived at:
**CSS owns the picture, GSAP owns the transition between two of them.**

- **`_wait-scale.tsx`** — the figure the page is built around. One wait time
  drawn against what that ride's day normally looks like. `WaitScaleBar` is a
  plain server-renderable `<figure>` whose geometry is three CSS custom
  properties, so it is correct in the first HTML with no JavaScript at all.
  `WaitScaleStage` is the sticky desktop copy: an observer picks the step the
  reader is next to and GSAP tweens those same properties, and the two numbers,
  from one weekday to the next. Below `lg` there is no sticky column and each
  step carries its own static bar.
- **`_night-shift.tsx`** — the nightly job chain on the hours it actually runs
  at, which is the page's answer to "why can a site not just show this?". GSAP
  lifts the markers once on first view; the diagram is complete without it.

One more shared-scale trap: `Sparkline` fits each instance to its own maximum,
so two charts meant to be compared draw a 7-minute band with the same amplitude
as a 22-minute one — backwards, when the comparison IS the figure. It takes a
`yMax` prop now; pass the same value to both.

**No ScrollTrigger.** Picking the active step is an intersection question and
`IntersectionObserver` answers it in eight lines, without a second GSAP plugin,
without a scroller-proxy against the sticky column, and without anything to tear
down on a soft navigation.

Three rules these must keep:

1. Nothing informative is hidden waiting for script. A failed chunk, a blocked
   import or `prefers-reduced-motion` leaves the figure standing on the first
   step, and every step states its own numbers in prose beside it.
2. `fromTo` only from offsets a half-applied tween can survive (a 14 px `y`),
   never from `opacity: 0` or `scaleX: 0`.
3. Nothing touches a backdrop. The bar sits on the page background, not on
   glass, and the tween writes custom properties on one element rather than
   transforming an ancestor — a transform on a `backdrop-blur` element, or any
   ancestor of one, flattens the blur for as long as it runs.

The decorative layers are wide on purpose (the glow behind the opening figure,
the per-chapter `Ambience` tint at 1152 px) and hang off both sides of a phone, which cost the
document 381 px of horizontal scroll the first time. They are clipped with
**`overflow-x-clip`**, never `overflow-hidden`: hidden makes the element a scroll
container and `position: sticky` sticks to the nearest one, so the chapter 02
figure would stop pinning. Verified at 390 px and 1512 px: 0 px overflow, CLS
0.0000.

## 5. Structured data

`ArticleStructuredData` + `BreadcrumbStructuredData` + `FaqList` (which emits
`FAQPage` from the same array it renders). No `HowTo`: Google retired those rich
results in 2023, which is why `components/seo/structured-data.tsx` has never had
one. FAQ answers stay plain text so the JSON-LD is clean.

The `FAQPage` is a **description, not a rich result**. Google retired the FAQ
SERP feature for every site on 2026-05-07 — not just the health and government
sites the August 2023 restriction had named. The markup stays because it costs
nothing and honestly describes a block that really is a list of questions, but
nothing here should be built or argued for on the promise of a rich result, and
no AI-citation benefit has been measured either. Genuine user-submitted Q&A
would be `QAPage`, a different type for a different thing.

## 6. Six locales, one shape

All six content modules are now the guide; the `EDITORIAL_LOCALES` switch and the
legacy feature-manual branch are gone, and every field on `PageHeader` is
required again. The URL had moved for every language at once from the start (a
slug change is a one-shot 301 campaign, not something to do six times) while the
prose followed as it was written.

Each locale is a full `content/<locale>.tsx`, the same convention `fancast` and
`best-time-to-visit` use, chapter ids localized with it (`#massstab`, `#scale`,
`#echelle`, …). The duplication is real and deliberate: a shared-structure module
with a per-locale string table would be a bespoke i18n mechanism invented for one
page. What that costs is an edit applied six times, so two things guard it —
`CHAPTERS` must match the rendered `<SectionShell id= index=>` calls exactly (the
rail looks its sections up by id), and the `locale=` prop on the two live blocks
must match the file it is in. Both are one grep each.

## 7. Companion post

[`content/blog/de/sind-70-minuten-viel.md`](../../content/blog/de/sind-70-minuten-viel.md)
and its five translations (`translationKey: is-seventy-minutes-a-lot`) make the
same argument in prose with **live** widgets rather than fixtures
(`ride-waits-widget`, `hourly-profile-widget`, `park-comparison-widget`), and
link here for the long version. Same rule as every post: no wait time is typed
into it. `parkLinks` puts it on the Phantasialand **and** Hansa-Park pages —
Hansa-Park because it gets a paragraph of its own about why that park shows no
wait times at all, which is exactly what somebody on that page is asking.
