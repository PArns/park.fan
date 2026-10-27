# Ride page

How a ride page is built: the header card it shares with the park page, the chapter row, the
"Beste Besuchszeit planen" chapter and its stand-in panel, the colour rank of the typical-waits
card, and the 30-day history calendar. Open it before changing anything above the fold of a ride
page or in those chapters. The rules it applies:
[a cell is gated on its content](../rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md)
and [the quietest weekday](../rules/the-quietest-weekday-is-the-parks-quiet-end.md).

## The park page's anatomy

A ride page and its park page sit one click apart over the same photograph, so they open with the
same card built from the same parts:

| Park page                                 | Ride page                               |
| ----------------------------------------- | --------------------------------------- |
| `GlassCard variant="tile"`                | `GlassCard variant="tile"`              |
| `ParkHeaderCard` panel → `ParkTodayPanel` | `ParkHeaderCard` panel → `RideNowPanel` |
| `ParkHeaderCard` tiles → `ParkTabsList`   | `ParkHeaderCard` tiles → `RideNavTiles` |

- **The panel.** `RideNowPanel` takes the park panel's header strip (live dot, clock), its
  `PanelGrid` of hairline-ruled columns and its `PanelMetric` captions, and gathers what the ride
  page used to say in four places: the live wait, the park's status and hours, the day's best slots
  and the typical/busy pair. A visitor searching „Taron Wartezeit" no longer assembles it.
- **The chapter row stays jump links.** The park's tiles switch `Tabs` whose inactive panels are not
  in the DOM; doing that here would take the typical waits, the history, the ride profile and the
  FAQ out of the served HTML of every attraction URL. `RideNavTiles` takes the park row's cell
  (`tileCell`), body (`EntryTileBody` with its reserved two-line hint) and `SelectionBar`
  (`opacity-0` without `data-state=active` or `aria-current`), so the rows are structurally
  identical. Its hints read the query the panel already runs, by the same key: no extra request.
- **Its two chapter titles come in as props** (`labels={{ rideProfile, faq }}`). `RideNavTiles` is
  a Client Component; a `useTranslations('seo.faq.attraction')` inside it would put that namespace
  and `attraction.rideProfile` into the routed messages of every attraction URL for two strings the
  server already holds ([translations are routed](../rules/translations-are-routed-not-bundled.md)).
- **A tile never points at an anchor that is not on the page.** One `hasPlanChapter` gates the
  „Beste Besuchszeit planen" tile and the chapter together, as the ride-profile and FAQ tiles do.
- **The first chapter is the ride in sentences.** `RideDataCard` („… im Überblick", `#facts`) sits
  directly under the header card in every state, written from day-stable data only
  (`buildRideSummary`: curated facts, `typicalWaits`, `ropeDrop`), because Google mostly fetches
  these pages at night, when the live half reads „—". It is a `ChapterPanel` over a `PanelGrid`:
  the paragraph in a `3fr` cell with every figure `font-semibold text-foreground`, the key figures
  as `PanelMetric`s in a `2fr` cell on `bg-primary/[0.04]`. Fewer than two figures drop the column;
  fewer than three sentences drop the card (`rideSummaryRenders`), so it never holds one line.

## „Beste Besuchszeit planen"

The chapter's grid counts its columns from `attraction.ropeDrop && typicalWaits?.displayable`, one
level above `RopeDropCard`. When the card answered `null` for its negative case, the cell, its
hairline and a second column were drawn around nothing: over every park, **183 ride pages with
an empty half** and 159 more with an empty box under the heading, because 60 parks carry no
rope-drop recommendation at all (every recommended Efteling ride among them, which is how it was
reported). The fix made the component total
([the rule](../rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md)).

**One line in a cell.** Where the park did carry recommendations,
the muted „no need to rush" note rendered alone in half a card beside a full
`AttractionTypicalWaits` chart: **470 ride pages in 87 parks** (2026-09-15). The note stays, because
the contrast to a recommended neighbour is information, but as a **footer** of the stand-in panel
under the same hairline as the low-confidence hint, so `parkHasRecommendations` picks a footer, not
a panel. Moving it changed what it claims: it had read „die Wartezeiten bleiben über den Tag
überschaubar (ca. {openWait} Min. zur Öffnung)", a third copy of the opening wait, and „überschaubar"
was contradicted on 65 of the 470 (peak 60 min or more; Tokyo DisneySea's Soaring reads 140 at
opening and peaks at 180). The footer keeps only what the branch knows: not worth a rope drop
(`worth === false`) and the contrast. It may compare with the park's other rides because **none**
of the parks behind those 470 recommends only evenings. Rewritten in all six locales.

**What the stand-in panel says is a measurement.** It gives the ride's own readings rather than an
apology, chosen over the 183 rides it is drawn for: the quietest **hour** is defensible on only 15
(146 have a trough equal to the opening wait), the quietest **weekday** on 119
(`quietestWeekdays`), and the spread `busyPeak − openWait` (median 25 minutes) on all 183. It never
explains why the recommendation is missing: that threshold lives in the backend, and an invented
reason would read as measured. Of the 470 footer rides, 312 print the weekday sentence (66 %).

- **A refusal is two things, and only one is sayable.** „No weekday stands out" is a measurement
  (61 rides have a flat week); „we cannot tell" is missing data. `quietestWeekdays` is three-valued
  and the card prints nothing for `unknown`: the 159 rides with no displayable typical waits, and 3
  where a dropped thin day draws a shorter bar right beside the sentence. A day is dropped from the
  **vote**, never from the **chart**.
- **Every minute on the panel is on the 5-minute grid**, derived ones included: `openWait` and
  `busyPeak` round once, the spread tile is the difference of the rounded pair, and the "quieter
  later" line tests the rounded pair (an unrounded saving of 25 under a tile reading 25 promises
  something not on screen). The three older panels keep raw figures; matching them is a card-wide
  change.
- **The three readings are one component, `StatTiles`**, so the stand-in panel carries the weight
  of the recommendation it replaces.
- **They restack on the row's own width** (`@container/stattiles`, threshold 380 px), not the
  window's: the row sits in a `PANEL_CELL` whose width follows the chapter's column count and
  measures 286 px at a 360 px window, 262.5 at 640 and 302.5 at 768, while a 1024 px window gives
  430.5. Above the threshold a tile has 93 px for its label, a budget on the strings: the three that
  broke it were shortened („Vous économisez" → „Vous gagnez", „Picco del giorno" → „Al
  picco", „En la apertura" → „Al abrir"; widest now 88.4 px).

`pnpm test:typical-waits`, `pnpm test:quietest-day`.

## One colour rank, and a line for a boundary

`AttractionTypicalWaits` states the same two readings three times (summary tiles, seven bars, a
legend). The rank is **Normal (P50) = accent, Voll (P90) = recessive** in all three; the tiles used
to show Voll in blue while blue meant Normal in the bars. The tiles carry the rank as the legend's
**swatch**, not by tinting the digits: `text-primary` is 3.47 : 1 on the light card and an 18 px
semibold figure owes 4.5, a swatch owes 3.

The Voll wash was nearly invisible, computed from `--primary` / `--muted`:

|                                          | light        | dark         |
| ---------------------------------------- | ------------ | ------------ |
| Voll fill (`bg-primary/25`) vs the track | **1.32 : 1** | **1.40 : 1** |
| Voll fill vs the Normal segment          | 2.54 : 1     | 3.74 : 1     |
| legend swatch on the page                | 1.33 : 1     | 1.36 : 1     |

No opacity fixes it: the light track is rgb(251,251,251) and `bg-primary` itself reaches only
3.36 : 1 against it, so no third tone clears 3 : 1 from both the track and the solid segment. **A
boundary that must be seen is a line**: the Voll segment has a solid `bg-primary` top rule
(3.36 : 1 light, 5.24 : 1 dark) and the swatch the same colour as a ring; the fill went to `/40` to
read as a body. Printing „typical–busy" above each bar instead was rejected on a count: 217 of
5,942 ride-days round to seven characters, ~40 px in a ~36 px column at 360 px, and the `flex-1`
columns would run past the card.

The number above each bar is the Voll value, but `text-muted-foreground` is achromatic
(`lab(66.13 0 0)` dark, `lab(48.50 0 0)` light), so the rank cannot name it, and the `title` with
the pair does not exist on a phone. The row has its own caption: the Voll swatch plus „Zahlen:
Voll", with the swatch because a lone word at the left of a seven-column row reads as the first
column's label.

## The 30-day history calendar

The history is its own chapter (`#history`) in the crowd calendar's language: the
`CROWD_TILE_CLASS` fill, the four-signal bar on the top edge, the day number in the tier's colour,
the one-word verdict, weekday-aligned week rows from `lg` up and a newest-first two-column list
below. The guide page teaches `ParkCalendarDay` as "the real calendar cell" (`CalendarDaysDemo` in
`app/[locale]/how-park-fan-works/_demos.tsx`), so a ride cell in another visual language would make
that lesson wrong one click later.

The ride cell is still its own component because of the **sparkline**: a park day is a forecast
(one level, hours, weather), a ride day is a measured curve whose shape is the finding. It takes
the tile's floor with the rounded min–max pair under it. The whole grid shares **one `yMax`**:
`Sparkline` fits each instance to its own maximum, which would draw a flat 20-minute Tuesday as
dramatically as a 100-minute Saturday. The legend is the shared `ParkCalendarLegend`.

Loading holds only the grid's box: `AttractionHistoryPanel` renders its `ChapterHeading` and the
legend into the served HTML (neither reads data) and a `Skeleton` where the grid goes. That box's
height is a formula, `lib/parks/attraction-history-geometry.ts`: the 31-day window spans five week
rows, or six for two of the seven start weekdays, times one tile plus the gap, per breakpoint.
"Today" comes from the server in the **park's** timezone, or a Florida park (still on yesterday's
date for six hours after midnight in Berlin) would reserve different rows on the two sides of
hydration. `pnpm test:attraction-history-geometry` pins all seven weekdays, a year boundary, a
leap day and a DST Sunday.
