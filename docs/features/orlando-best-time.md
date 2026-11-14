# Orlando's best-time pages

Three pages that answer "when should we go to Orlando": Disney and Universal together, Walt Disney
World alone and Universal Orlando alone. They target a different search from the
[Orlando hub](orlando-hub.md) ("Orlando crowd calendar"): "best time to visit Disney World 2027",
„beste Reisezeit Orlando“. Open this page before changing their URLs, their reads or what a chapter
shows. The anatomy is a hub's ([a landing page has one anatomy](../rules/a-landing-page-has-one-anatomy.md)).

## URLs

| Page                 | English                                            | German                                          |
| -------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Disney and Universal | `/en/orlando/best-time-to-visit`                   | `/de/orlando/beste-reisezeit`                   |
| Walt Disney World    | `/en/orlando/best-time-to-visit/disney-world`      | `/de/orlando/beste-reisezeit/disney-world`      |
| Universal Orlando    | `/en/orlando/best-time-to-visit/universal-orlando` | `/de/orlando/beste-reisezeit/universal-orlando` |

- The segment is the global best-time hub's (`BEST_TIME_SEGMENTS`, `lib/best-time/segments.ts`);
  "orlando" and the resort slugs are the same in every language. Links go through
  `tripRegionBestTimePath(region, locale, page?)` (`lib/trip-regions/paths.ts`), and `localizedPath` respells
  `/orlando/best-time-to-visit` written in a post.
- The folder is every region's, `app/[locale]/trip-regions/[region]/best-time-to-visit/[[...resort]]`;
  the pages and their resorts are the region's `bestTime` in the registry. `next.config.ts`
  rewrites each locale's segment onto it and 308s a wrong-locale or unprefixed segment to the
  locale's own ([trip regions](trip-regions.md)).
- `force-dynamic` behind an hour of `CDN-Cache-Control` (`pnpm test:edge-windows`): the title names
  the year Orlando's today decides, and the figures come from the Data Cache, an hour at most.
- Listed in `/sitemap.xml` with hreflang and **no** `<lastmod>`: `computedAt` moves on all three
  at once every few hours, which is a stamp ([sitemaps](../seo/sitemaps.md)).

## What the page reads

- **The region** (`getTripRegion`) for the parks: the headliner parks of the page's resorts
  (`bestTimeParks`, the region's `bestTime` pages).
- **`/when`** (`getTripRegionWhen`) once, for those parks, `days=10`, `limit=3`, over the **title's
  year**: from today at the earliest, never past the year ahead the API accepts (`bestTimeRange`).
  The year is the coming one from September on (`bestTimeYear`). Its `months[]` feed chapter 02.
- **`/school-breaks`** (`getTripRegionSchoolBreaks`), open and a day in the Data Cache, for DE, NL and
  GB over the same range. Its region codes are the ones `within` accepts and are never written
  into the code; a failed read drops chapter 04 and the European cells.

The contract is the API's `docs/frontend/trip-regions-when.md`. Every comparison is by the big
rides' wait at their busiest (`headlinerWait`), never by a crowd level.

## The levels

All of it is in the first HTML; nothing mounts on a click.

- **Level 0**, in the head: the three windows as one sentence (the hero's tagline) and three cards
  with dates, the wait, the share below the year's average, one reason and a basis label when the
  window is last year's. The hero's one action, "Plan these dates", opens the hub's planner on the
  first window (`plannerHrefOn`, plan mode); without a window it is the hub's „Reise planen“. The
  kicker is „park.fan · <the region's name>“. The photo is the page's `photo` in the registry; an
  id the media database does not hold yet gives the gradient head, not a picture that does not
  load.
- **Level 1**: chapter 01's week strip and chapter 02's month rows.
- **Level 2**: `<details>` under each card (all reasons, warnings, events) and each month (season
  dates, each European region's breaks, the climate period and nights).

## The chapters

1. **The year at a glance.** A bar per week in one ink, its height the peak wait, windows marked
   under it, a dashed line where last year's figures begin. No crowd-level tint: on this site a
   crowd colour means a day against its park's normal day, and a week's rank in the year is not
   that. The bars are `aria-hidden`; the same
   weeks are a `<table>` with a caption in a `<details>` below.
2. **Month by month.** A row per month of the title's year from the current one on; a month past
   the range says where the figures end. Per row: „Am ruhigsten“ or „Am vollsten“ on a neutral
   chip where the month is within five minutes of the year's lowest or highest figure (nothing
   between, nothing in a flat year: 43 min is not "busiest" beside 42), the peak wait, events with
   their status, the region's own school breaks (Orange County's for Orlando; `localSchoolBreakDays`,
   read by `monthBreakDays` with the US regions' older `usSchoolBreakDays` as its fallback; unnamed
   weekends join the break they border, `breakRuns`), European breaks (a region counts with a break of five days or
   more, so a bridge day does not; Germany as "n of 16"), the climate normal of Magic Kingdom's
   spot, labelled as the usual, hours against the year's mean, party nights and hurricane season.
   The month's name links its hub month where the hub serves it.
3. **Die ruhigsten und die vollsten Wochen**: the three quietest and busiest whole weeks with the
   breaks and seasons in them. Where the quietest week is in none of the trips and its month is in
   the region's storm season, a line says so (`quietWeekInStorm`): `/when` ranks the trips with the
   storm risk counted, and late August's 30 minutes otherwise look like a mistake.
4. **School holidays**: per country, each region's breaks long enough for the trip, each a link
   into the planner's When mode inside that break (`within`). The reader's country opens.

## FAQ

Every answer is built from the page's figures, and a question without its figure is left out:
the quietest window; Christmas week (or the New Year week when the range starts after Christmas);
the party nights (ticketed Halloween and Christmas seasons of the page's parks); hurricane season
with the wettest normal months; and "Disney or Universal first?" (on a resort page, which park
first), answered with the order the first window's plan visits the parks.

## Checks

`pnpm test:orlando-best-time` (the range, the month rows, break runs, European cells, weeks,
the window phrase), `pnpm test:edge-windows`, and against a running site
`pnpm check:landing-pages` and `pnpm check:semantic-html`, which load the German pages.
