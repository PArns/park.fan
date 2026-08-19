# Changelog / Recent Updates

Short log of notable changes; details live in the linked docs.

---

## Unreleased – fix: six layout shifts, two of which the harness had been unable to see

`pnpm measure:cls` diffs a page's first-paint layout against its settled one. That is good at
finding candidates and bad at two things, and both showed up here.

**It could not say what a browser would score.** CPU throttling was the stand-in, and it is a
coin toss: the same page under the same 4× throttle measured 0.000 and 0.088 in two consecutive
runs. `--late` replaces it. It fetches the document once, finds where React parked the resolved
Suspense content (`<div hidden id="S:1">` near the end of the body), and re-serves it through a
local proxy that flushes the shell immediately and the rest 1.5 s later — no throttling at all,
which is the shape of a cold start whose sub-request missed cache. Under that the glossary term
page scored 0.5425 desktop and 0.4872 mobile against Cloudflare's field value of 0.538, run after
run. `--scroll=<y>` parks the reader, because a shift only counts what is in view: the same page
reads 0.0000 from the top on a phone.

**It was browsing from 127.0.0.1.** `/api/nearby` had no public IP to geolocate, answered
`userLocation: {0, 0}` with an empty park list, and every run therefore settled on the card's
short "no parks near you" state. A placeholder had been tuned against that. `pnpm measure:cls`
sends a real `x-forwarded-for` now (`--ip=` to change it), the card settles on the six-card list
like it does for a visitor, and the short box turns out to cost +683 px desktop / +291 px mobile
on the homepage — its largest in-view shift. The six-card skeleton is back, in both the pre-mount
and the loading phase: mounting reveals nothing about where the visitor is, so those two have no
business being different heights.

What else moved, and no longer does:

- **The park header shrank twice before settling.** `showCrowdToday` was true while the daily
  crowd query was unsettled and false once it settled without a value, so on a park nobody can
  rate — Phantasialand most mornings — the header went 63 → 142 → 63 px at 277 / 709 / 2474 ms.
  Two 79 px jumps at the very top of the page. It now shows the slot only once there is a value.
- **The glossary rides section.** `<Suspense fallback={null}>` on a prerendered route defers
  nothing: the project runs no PPR, so the prerender waits anyway and the resolved markup was
  already in the shipped `.html`, sorted to the end of the byte stream. All the boundary did was
  drop 396–1463 px into the column two seconds after paint and push the "back to dictionary"
  button — the element Cloudflare names — down with the rest of the page. Awaited inline now.
  Padding it was not an option: 115 of the 267 terms have no rides at all.
- **The favorites band, on the homepage, all five blog routes and every glossary term.**
  `next/dynamic` is `React.lazy` plus `<Suspense>`, so `loading: () => null` was a
  `fallback={null}` in disguise and the whole 232 px band arrived after the first paint. It
  reserves its empty state now, with the two lines held `invisible` until the cookie has been
  read, so a visitor who does have favorites is not told for a beat that they have none.
- **The coaster player's transport bar** appeared when the three.js scene booted, on the 42 term
  pages that carry one. 57 px, now mounted from the first render and disabled until ready.
- **Park-card placeholders were one height at every breakpoint.** `ParkCard` hides its photo row
  below `sm` and is less than half as tall there; the placeholder stayed at 360 px. On a phone
  the featured-parks grid therefore collapsed by 1284 px when the real cards landed. The
  placeholder is one shared component now, built from the card's measured rows: 100 px top panel,
  photo row 0 below `sm` and 220 px above, 45 px bottom panel.

Left alone on purpose: the attraction grid that swaps in when `TabsWithHash` hydrates (+9187 px
mobile on Universal Studios Singapore) and `LazyMount`'s `rowHeight: 340`. Both are real — a
reader standing in the wrong band pays up to 1.0 for them — but the card height they would have
to reserve runs from 94 to 508 px inside a single park, and the swap exists to keep hydration off
a 1017 ms long task. Trading CLS for INP there needs its own round.

## Unreleased – fix: four more blog widgets pointed at a park that had been renamed

`disney-magic-kingdom` was not the only one. The Toverland post carried `slug=toverland` on its
map, best-days, stats and weather widget, in all six locales — 24 widgets rendering
"Park „toverland" wurde nicht gefunden" since the API renamed the park to
`attractiepark-toverland`. The prose references in the same posts had been pulled along
(`ref:attractiepark-toverland/booster-bike` is already correct); the `slug=` attrs had not.

Nothing catches this. The build stays green, `generate:blog-manifest` only validates
`parkLinks`/`rideLinks`, and the API answers the old slug with a 301 — so the URL still works in a
browser while `resolvePark`, which looks the slug up exactly in the geo index, returns null.

So there is a checker now: `pnpm check:blog-slugs` resolves every widget `slug=`, every
`glossary-widget` term id and every `ref:`/`park:`/`attraction:` link target against the live geo
structure. Across the 42 posts that is 2160 references — 132 widget parks, 84 glossary terms, 1944
links — and after this fix all of them resolve. It was verified by putting the old slug back and
watching it fail.

`scripts/check-media-urls.mjs` pointed its sample pages at the old park URL too. Those still
answered, because the API's 308 is followed transparently, which is exactly what makes this class
of rename so quiet.

## Unreleased – fix: the blog's copy of the top-ten table gets its live column too

The stats widget renders the same `ParkStatsSection` as the park page, and on a blog post its live
column was effectively never there: nothing on such a page subscribes to `['park-live', …]` unless
the post happens to include a weather widget as well.

The data was already on the page. A post that names rides of a park fetches
`/api/parks/<geo>/<park>/wait-times` for its `ref:` references — 9 KB carrying park status plus
status and standby wait per slug, which is exactly what the column needs. `die-kunst-des-wartens`
makes eleven of those calls, one of them for the very park its stats widget shows, and the table
ignored all of it. `ParkStatsSection` now reads that cache as a second source, `enabled: false`
like the first one, so it still issues no request of its own.

The wait-times payload is queue rows and nothing else, so the `effectiveStatus` check the park page
does is not available on this path — a ride whose feed went quiet keeps the wait it last published.
The alternative on a blog post is no live column at all.

While testing it: `die-kunst-des-wartens` rendered "Park „disney-magic-kingdom" wurde nicht
gefunden" in all six locales. The API renamed that park to `magic-kingdom-park`; the widget was
never pulled along. Fixed, and it is what made the fallback testable — Magic Kingdom is open while
every European park in those posts is shut for the night.

## Unreleased – fix: the live column no longer disappears at opening time

The "now" column decided whether to exist by asking whether any of the ten rides in the table had a
wait time. That looked equivalent to "is there live data" and is not. Phantasialand at 09:37 has 14
rides open and every one of them is a carousel or a walk-through — no headliner in the top ten was
running yet, so the column was gone from a park that was very much operating, and would have popped
back in mid-session the moment Taron opened.

It is a question about the park, so the park answers it: the column is there when the park is
OPERATING, its wait times are readable, and a live snapshot has reached the section. A ride that is
closed while the park is open shows a dash, which is a fact about that ride rather than a reason to
drop the column for the other nine.

The minutes unit in that table was the string `min`, hardcoded, in all six locales — German reads
`Min.` and Dutch `min.`. It comes from `parks.overview.minutesUnit` now, the same key the
server-rendered wait overview has always used. The typical and peak columns carried the hardcoded
version long before the live column copied it; all three are localized now.

## 2.11.0 (2026-08-15) – Blog, ride pages, and the load-order work behind them

Two months of work since 2.10.1, released together. The blog went live and grew a link in both
directions with the park and ride pages; ride pages got a header, measurements and a way into the
glossary; every image moved into one media database with its own sidecar; and the park page had
passes on load order, ISR writes, re-renders and the Umami bill. Newest first.

### fix: the OG function was shipping 400 MB of photos

Deploys started failing on `The Vercel Function "api/og/[...path]" is 410.24mb uncompressed`, over
Vercel's 250 MB limit. Two things stacked up to get there.

`public/images/` was the photo tree from before the media database. Nothing has read it since; the
351 files left in it were all generated crops with no source images beside them, and a `git add -A`
swept 282 MB of them into a36bfd8e. They are deleted and the path is in `.gitignore` now —
`git checkout a36bfd8e -- public/images` brings them back if a photo in there turns out to be
wanted.

That alone would not have mattered if the function only carried what it paints. It does not:
`lib/og/background-photo.ts` reads its photo with `readFileSync(join(process.cwd(), 'public', …))`,
and the tracer's answer to a path it cannot resolve statically is to bundle the entire directory
that path is rooted at. So the OG function holds all of `/public` — every source image, every
sidecar, all three crop ratios — while no other route traces a single file from it. 130 MB now,
down from 425 MB, of which about 17 MB is the 16:9 crops the card actually reads.

The `outputFileTracingIncludes` entry naming those crops was not what put them there, and cannot be
used to trim the rest either: `next build --turbo` never calls `collectBuildTraces`, which is the
only place includes and excludes are applied, so under the build this project ships every key in
that map is inert. Reaching for `outputFileTracingExcludes` here does nothing — it was tried, the
crops it named stayed in the trace. Making the OG route lighter means changing how it reads its
photo, not configuring the tracer.

### the top-ten wait times now show what the ride is doing right now

"Typical 29 min / peak 34 min" is a comparison with nothing to compare against, so the ranking of
the longest waits is a table from `sm` up: rank, ride, **now**, typical, peak. The live number is
coloured on the shared wait-time scale (`WaitTimeValue`), so a 60 at a ride that typically runs 31
reads as the outlier it is. Below `sm` the table keeps the two columns it had — rank, ride and
peak, with the label moved from the row into a header.

The current values cost no request. `useLiveParkData` is already polling `['park-live', …]` for the
page, and the section subscribes to that key with `enabled: false`: React Query disables the fetch,
not the subscription, so the column updates with every 5-minute poll and the park page still makes
exactly one live call. Details and the two catches in
[api-budget](architecture/api-budget.md#reading-live-data-without-adding-a-request).

A closed ride keeps publishing `waitTime: 0` — River Quest and Black Mamba both did while the rest
of Phantasialand ran — so a wait is only taken from a ride that reads OPERATING. The status is
decided the way `AttractionCard` decides it, `effectiveStatus` before the queue row: a feed that
goes quiet mid-day leaves its STANDBY row on the last value it published, and reading that alone
would print a wait here for a ride whose own card on the same page says closed.

Whether the park has readable wait times at all is **not** derived from any of this. The park page
passes `hasReadableWaitTimes(park)` down, so a park that publishes wait times only inside its own
app has no "now" column whether it is midday or 03:00 — the live projection carries no
`liveWaitTimes` field, and inferring the answer from an empty payload is what
[parks without wait times](api/parks-without-wait-times.md) exists to forbid.

### the hero search placeholder no longer types

The homepage search field used to type park and ride names into its placeholder,
letter by letter, on a loop. That typewriter is gone: the field shows the
translated static placeholder from the first paint, on the homepage and the
howto pages alike (they share `HeroSearchInput`).

Gone with it: the `useTypewriter` state machine and `TypewriterPlaceholder` leaf
in `hero-search-input.tsx`, the `typewriter-blink` keyframes in `globals.css`,
and the `placeholderShown` property on `hero_search_clicked` — it only ever
reported which phrase was on screen, and without the typewriter every click
would have billed an extra Umami event to say "default". `useActiveOnScreen`
stays, the countdowns and charts still pause through it.

### fix: the ride measurements credit the right source again

The measurement display shipped against an importer that read the roller-coaster
database directly. That import is gone — their terms permit the link, not the
data — and the API now merges a hand-curated seed with a **Wikidata (CC0)**
import, curated values winning.

So `stats.source` is one of `curated`, `wikidata` or `mixed`, and `sourceId`
carries a Wikidata entity id **only when an imported value survived** the merge.
The display assumed a single source with an id always present, which in
production it never was: 26 of the 27 rides that currently state a measurement
are `curated` with no id at all, so every one of them rendered "Measurements:
RCDB" over numbers RCDB never supplied, linking to `rcdb.com/undefined.htm`.

- **The API resolves the credit now, and the page just renders it.**
  `stats.attribution` is `{ label, url }` or **null when every surviving number
  is hand-curated** ([v4.api.park.fan#150](https://github.com/PArns/v4.api.park.fan/pull/150)),
  so the rule and the URL shape live with the data instead of being rebuilt at
  the edge. The page shows the line when it is there and nothing when it is not.
  That is the whole condition — there is no `source` to interpret and no
  `wikidata.org/wiki/…` to assemble, which is what got this wrong twice.
- **`statsSource` takes the source name as `{source}`** rather than baking
  "Wikidata" into six translations, so a second source needs no locale change.
- **`RideStats` matches what the API sends** — three-value `source`, optional
  `sourceId`, plus `attribution`.
- **The grid drops the rows nothing can fill** — drop, elevation, steepest
  angle, g-force, capacity, riders per train, restraints, designer, builder,
  train builder — along with their translation keys in all six locales.

### cut the Umami event bill, and fix what "visitor" counts

The Hobby plan allows 100k events/month; early August was tracking toward
~112k, the second overrun. The cause was not traffic. Umami bills **every event
property as another event**, so the properties were ~70 % of the bill while the
pageviews — the only thing actually wanted here — were ~26 %.

- **`identifyVisitor()` removed.** Three session properties on _every_ session,
  which was the entire Session-data band (~25 % of usage). Two of them
  (`browser_language`, `site_locale`) restated what Umami already collects
  natively and what the URL path already says.
- **`web-vital-inp`: 9 properties → 4, and only non-`good` samples.** It fired
  on every pageview carrying an interaction at ten billed rows a time, the
  largest single line in the bill. A good INP is not something we act on, and
  the three delay numbers collapse to `phase`, the one that dominated — which
  is the whole decision the breakdown drives.
- **Derivable properties dropped everywhere**: `in_park` (it is
  `type === 'in_park'`), `geo_allowed` (`source === 'gps'`), `hasQuery`
  (`queryLength > 0`), `rating` (a threshold on `value`), `locale` (it is in the
  event's own URL), and `parkId` wherever a `parkName` already named the same
  park. `nearby_in_park_detected` is gone entirely — it restated
  `nearby_parks_loaded` with `type: 'in_park'` and spent four rows doing it.
- **Eight unused `track*` helpers deleted** (`hero_viewed`, the card/discovery
  clicks, `map_opened`, `calendar_date_selected`) — dead code that invited
  someone to re-add a three-property event firing on view.
- **`data-exclude-hash="true"`** stops a phantom-pageview leak: Umami's tracker
  patches `pushState` _and_ `replaceState` and treats a changed hash as a new
  URL, so every park-page tab switch and every calendar month step was billed
  as a full extra pageview and inflated Views against Visitors.
- **`data-domains` now lists `www.park.fan`** as well. The attribute is a hard
  gate on `window.location.hostname` — a host missing from it is silently
  absent from the stats, not merely mislabelled.
- **The known undercount is written down**, not fixed: `data-do-not-track` means
  DNT visitors send nothing at all, so the visitor number reads low by roughly
  3–8 %. It is a voluntary choice (Umami is cookieless, the privacy policy rests
  on Art. 6(1)(f) and never promises DNT) and was reviewed and kept.

New doc: [analytics](development/analytics.md) — the billing model, the two
rules for adding a property, and what Umami's "unique visitor" actually means
(hash of website ID, hostname, User-Agent and IP against a salt that rotates
**monthly**, so a visitor count spanning a month boundary is not deduplicated).

### park and ride pages link into the blog

The blog linked into the catalog from day one (`ref:europa-park`, spotlight
cards, widgets); the catalog never linked back. A reader on the Phantasialand
page had no way of knowing a 4.700-word guide to that park existed.

- **New section on every park page and every ride page** — "{park} im Blog" as
  a frosted panel next to its neighbours, "{ride} im Blog" as a `PageSection`
  chapter, both showing the three most relevant posts as the same
  `BlogPostCard` the blog index uses. Static content out of the generated
  manifest: no API call, no clock, so it neither competes with the live queries
  nor with the load-last best-travel-time data. Renders nothing when no post
  mentions the park/ride, and stays away in locales that have no blog surfaces
  yet.
- **Reverse index** (`lib/blog/backlinks.ts`) derived from the posts
  themselves: every park and ride a body references (`ref:`/`park:`/
  `attraction:` links and the widget fences, a ride counting for its parent
  park too) plus `relatedParks`/`relatedAttractions`. A round-up like the
  Halloween guide therefore appears on all ten park pages without anyone
  maintaining a list. References that carry the full `/parks/…` path only count
  for that park, so the Paris and Anaheim `disneyland-park` don't swap
  articles.
- **`parkLinks` / `rideLinks` frontmatter** for the cases the automatic result
  gets wrong: `false` keeps a post off those pages entirely, a list replaces the
  detection, and `rideLinks` also takes `parkSlug/*` ("every ride of that park
  this article links") so a park guide keeps its own rides without listing
  twelve of them. The two keys are independent — a guide is often right on the
  park page and far too broad on a dozen ride pages. Resolved per post rather
  than per locale, so a rewritten paragraph in one translation can't change
  which pages link the article; the manifest generator warns about invalid
  entries and about translations that disagree.
- **The blog manifest is three modules now**, because a 3-card section must not
  cost the park route a megabyte: `manifest.ts` keeps frontmatter plus the
  build-time derivations (reading time, `parkRefs`), `manifest-bodies.ts` holds
  the ~900 KB of markdown, `manifest-galleries.ts` the image listings. Listing
  surfaces import `lib/blog/listing.ts`, which never touches a body — that
  includes the **root layout**'s `hasPublishedPosts()`, so the bodies dropped
  out of every route's server bundle, not just the park pages'. Body-derived
  values are computed once at build time by the shared `lib/blog/derive.mjs`.
- **Curated the existing posts**: the Phantasialand guide now shows only on
  Phantasialand, the Toverland guide on Toverland and the Efteling (not on
  Liseberg because Balder came up once) and on `toverland/*` + Joris en de
  Draak, the launch story on Phantasialand + Movie Park and on Taron + Maus au
  Chocolat. The Halloween round-up and the queueing essay keep the automatic
  behaviour — every park and ride they name gets a real section in the text.
- **Listing lookups are memoised per process, not per request.** Everything in
  `lib/blog/listing.ts` derives from the manifest and reads no clock, so
  React's per-request `cache()` just rebuilt the same lists on every render of
  the root layout, the homepage and (now) every park and ride page. The lists
  are frozen, since they are shared across requests.

---

### fix: blog posts stop reporting a park and its rides as closed

The Phantasialand guide showed the park as open and **all twelve** coasters it
names as "Geschlossen", in the middle of an operating day.

Blog posts are fully statically generated, and every park/ride reference in
them was resolved **once, at build time**. Whatever the park's status happened
to be during that build — the middle of the night, for a post built overnight —
is what every reader saw afterwards, indefinitely. Nothing refreshed it.

- **The browser now lays live values over the build-time snapshot**, the same
  shell + client-overlay model the homepage, hub pages and featured cards
  already use. The prerendered HTML is unchanged, so SEO and no-JS readers
  still get a fully rendered card.
- **Batched per park, not per reference.** Park status/crowd/wait/hours come
  from the existing `useRegionParks` region call; ride status and waits from a
  new lean whole-park snapshot (`/api/parks/.../wait-times`, ~9 KB against
  ~95 KB for the full park payload). A post naming a dozen rides in one park
  costs **one** extra request.
- **The heavier per-ride payload stays lazy.** Today's average/peak and the
  card sparkline need the full attraction detail, so it's fetched only once a
  spotlight card scrolls into view or a hover preview opens — never on load.
- **One source for "now".** Status and wait always come from the 5-min batch,
  so a card's badge can no longer disagree with the inline badge beside it in
  the prose. The "closed park ⇒ closed rides" rule is applied on both sides.

**And the crash that would have hidden all of it on long posts.**
`/de/blog/die-kunst-des-wartens` was throwing
`Primitive.button failed to slot onto its children` and dropping its whole
client tree into the error boundary — so no hook on that post ran at all, live
overlay included.

`GlossaryInjectTerm` was a **server** component wrapping `next/link` in
`<TooltipTrigger asChild>`. Rendered from the server, the link reaches Radix's
`Slot` as a **lazy client reference**, and `Slot` only unwraps a lazy child
while its payload is still _pending_. Once any earlier `next/link` on the page
has resolved that chunk, the payload is settled, `Slot` sees a non-element and
throws. That's why it looked content-dependent: long posts resolve the chunk
before the first tooltip renders, short ones don't — halving the post made it
disappear, which is what sent the first search down the wrong path.

- `GlossaryInjectTerm` is now a client component, like its sibling
  `GlossaryTermLink` already was. Same markup, no lazy wrapper reaches the Slot,
  and nothing new ships — the tooltip and the link were already client code.
- **Every other server component with the same latent shape** — a `Link` slotted
  into `<Button asChild>` — was converted too: `BlogSectionHeader`,
  `GlossaryTermDetail`, `AnnounceSection`, the 404 page and the homepage hero.
  None had been observed to fire, but they were all one chunk-resolution order
  away from it.
- New **`buttonLinkProps`** (`components/ui/button.tsx`) is the shared way to
  render a button-shaped link: it returns exactly the props `<Button>` applies
  (`data-slot` / `data-variant` / `data-size` + the `buttonVariants` class
  string), so the rendered markup is byte-identical with no `Slot` in play.
  Verified by diffing the rendered `data-slot="button"` elements on `/de`,
  `/de/glossar/…` and `/de/blog/tag/…` before and after — same count, same
  classes, same attributes.

> **Rule:** never put a client-component element inside an `asChild` trigger
> from a **server** component. Either move the wrapper into a client component,
> or use `buttonLinkProps` / apply the variant classes directly. Slotting a
> _host_ element (`<a>`, `<button>`) from the server stays fine — those are
> never lazy.

See [caching-strategy](architecture/caching-strategy.md#minimizing-isr-writes-jun-2026).

---

### feat: a ride's measurements, in the visitor's units

The ride page can now say how fast, how long, how tall and how steep — the
numbers the API imports from RCDB (see the backend changelog). Top speed sits
in the header's facts band next to the inversions, because both answer "what
does it do to you"; the rest fill out the ride profile's fact grid: height,
drop, length, elevation change, steepest angle, ride time, g-force, capacity,
riders per train, restraints, and who designed, built and supplied the trains.
Every value renders only when RCDB has it, and the grid links back to the
record the numbers came from.

- **One unit system, one toggle.** The C/F choice now drives ride
  measurements too, not just weather: Fahrenheit means mph, feet and inches —
  **including the rider height** ("Ab 140 cm" becomes "From 55 in"). Rendered
  through `unit-display`, so both units are in the server HTML and CSS picks
  one before paint: no hydration flash, page stays cacheable.
- **Fixed: a badge that read "Inversions:" and nothing else.** The API strips
  null-valued keys from its responses, so an unknown value arrives as a
  _missing_ key — and `!== null` waves `undefined` straight through. The types
  now mark those fields optional as well as nullable, and the guards use
  `!= null`. The same bug was hiding on the glossary term page's year badge.
- **"All rides" on a glossary term page did not list all of them** — the three
  highlighted above are deliberately not repeated, so the heading sent people
  hunting for the ride they had just seen (Manta, on the flying-coaster page).
  It says "More rides" now.
- The glossary term page's ride section goes through `PageSection` like the
  ride page's chapters, so the two cannot drift apart again.

### fix: the ride header's facts say what they are

Follow-up to the header cleanup below. The facts band was a row of values with
no nouns on them: a wrench and "Intamin", a calendar and "2016", and "RCDB" —
readable if you already knew what each one meant, a guess otherwise, and the
`title` tooltips only helped the half of the audience with a mouse.

- **Every fact names itself:** "Manufacturer: Intamin", "Opened: 2016",
  "Inversions: 0".
- **The RCDB link names its destination** — "Taron on RCDB" instead of a bare
  acronym, so it reads as a way out of the page rather than a label. It moved
  out of `AttractionMetaBadges` (the rider-restriction set shared with the
  attraction cards) into its own `RcdbBadge`.
- **Order follows what you need to know:** the height limit that decides
  whether you may ride at all, then what the ride does (inversions), then what
  kind of ride it is, then who built it and when, then the outbound reference.
  The jump link stays pinned right.
- **The ride type is in the header now**, linked into the glossary like the
  type chips in the profile below — and a launch coaster with **more than one
  launch is called a Multi-Launch Coaster**. Nothing in the seed carries that
  distinction, but the layout does: `resolveRideProfile` counts the `launch`
  and `swing-launch` figures. It does that centrally so the header and the
  profile section can never disagree, and it counts element **ids**, not the
  `launch` element _kind_ — that kind groups lift hills and first drops too, so
  counting it would call every coaster with a lift and a drop a multi-launch.
- **"9 figures" is now "9 track elements"** (`Fahrfiguren`, `baanelementen`,
  `éléments du tracé` …), matching the label the profile section already used.
  In English "9 figures" reads as a nine-digit number.
- **The glossary link moved above the 3-D player**, joining the figure's name
  and definition — stranded under a five-second animation it was a footnote to
  a video nobody had finished.

### fix: the ride page header, and every section on it, reads like the park page

The ride header had grown a row at a time and no longer matched the park
header it sits under — and the intro paragraph below it was printed straight
onto the hero photo, where it was unreadable.

- **Header** now has the park header's anatomy: title row with the favourite
  star **in flow** (a long ride name wraps beside it instead of underneath it),
  a muted location line, one hairline-separated facts band, and the intro
  **inside** the glass card — the readability fix.
- **RCDB** is a Badge like its neighbours instead of grey text that read as a
  disabled label; builder and year carry a `title` so an icon-only fact is not
  a guess.
- **Every section has a heading with an icon.** The live wait time — the
  reason people open the page — was the only block without one. The 30-day
  "wait-time history" was the last bare heading. Card titles (rope drop,
  typical waits, today's chart, other queues) are now the same `plain` +
  `h3` heading instead of four sizes, so the page outline is chapter › card.
- **Chapter headings sit on a frosted pill** on the ride page, the same
  treatment the park page's section titles already used over hero imagery.
- **`PageSection`** is the new unit for a chapter: it owns the `<section>`, the
  heading **and** the spacing around it. `SectionHeading` alone only unified how
  a heading looks — every call site still hand-rolled its own `mt-10` and its
  own gap, which is how the live wait-time chapter ended up sitting a visible
  step lower than its neighbours (its refetch indicator added a reserved band
  on top of the heading's margin). All four ride-page chapters now measure the
  same 16 px from title to content.
- **The live refetch indicator** moved onto the "updated HH:MM" line inside the
  card, next to the timestamp it refreshes — it no longer reserves an empty
  band above the card, and it still cannot shift the layout (rendered always,
  just invisible when idle).
- **`SectionHeading`** gained `frosted`, `iconClassName`, ReactNode titles and
  a `badge` that is rendered as passed (it used to wrap its argument in a
  second `<Badge>`).
- **Ride profile:** a figure's name and definition now come **before** its 3-D
  animation — you tapped the figure to find out what it is, so reading the
  caption afterwards meant spending the animation guessing.

### feat: rides and the glossary now link to each other

A ride page could say "Black Mamba is an inverted coaster with four
inversions", but that was a dead end. Rides now carry a curated profile from
the API — track figures **in ride order**, ride type, builder, opening year —
stored as glossary term ids, so the link works both ways.

- **Ride page** gets a "Ride profile" chapter (`RideProfileSection`): the
  layout as a numbered walkthrough with every figure linking into the
  glossary, figures with a 3-D animation badged, plus type chips and the
  builder. Repeats are kept — Voltron Nevera really does hit two corkscrews
  back to back. Renders from the park response, so it is in the static shell.
- **Glossary term pages** get "Rides with this" (`GlossaryTermRides`), grouped
  by park, for figures, ride types _and_ manufacturers. Silent for the concept
  terms no ride references.
- **24 new glossary terms** across all 6 locales, added because the API seed
  needed them: launch, swing launch, vertical lift, drop track, scorpion tail,
  step-up under-flip, twisted horseshoe roll, double down, switch track,
  turntable, treble clef, indoor/family/motorbike/infinity coaster,
  interactive dark ride, madhouse, boat ride, shoot-the-chute, people mover,
  bumper cars, observation tower, Walt Disney Imagineering, Brogent. **262
  terms** total.
- **7 new 3-D animations** for the new figures, plus a `pace` hook on the
  coaster player so an element whose _speed_ is the point (a launch
  accelerating, a train stalling at a scorpion tail's overhang, a drop track
  standing dead still) can remap progress onto its curve.
- **`scripts/render-coaster-elements.mjs`** — the headless contact-sheet
  harness [conventions §12](development/conventions.md#12-threejs-animations-research-first-then-verify-from-every-perspective-requirement)
  has always required but that never existed as a checked-in tool. All 42
  elements verified through it.

→ [glossary](features/glossary.md#ride--glossary-link)

### fix: the bright blue hairline along the weather card's bottom edge

The weather card ended in a 1px, fully saturated sky-blue line across its whole bottom edge —
`#448ad1` against the `#1a324b` interior on a clear day, and the same untinted-gradient line in
every other scene and in light mode.

It was the glass overlay coming up one pixel short. `.weather-bg__glass` is deliberately
force-composited (`will-change: transform` + `translateZ(0)` + `backdrop-filter`, so the scene keeps
animating behind the blur on iOS/WebKit), which means its layer bounds get snapped to whole device
pixels — while `.weather-bg`'s sky gradient paints in the parent layer, all the way to the card's
fractional edge. The park page's card is 518.25px tall, so the snapped glass layer stopped a pixel
above the gradient and left that row untinted.

Fixed by giving the overlay `inset: -1px` instead of `inset: 0`; `.weather-bg` clips the overhang
with its own `overflow: hidden` + inherited `border-radius`, so the rounded corners are unchanged.
Verified at DPR 1/2/3, light and dark, across all seven scenes — no untinted row on any edge.

Worth knowing for anything layered over the weather scene: an `inset: 0` child of a composited
layer is not guaranteed to cover a fractionally-sized parent, so overlays that are supposed to tint
_everything_ need to overhang.

---

### fix: a single Back left the next page at the previous scroll offset

Clicking a blog card low on the homepage kept the homepage's scroll offset instead of opening the
post at the top. It needed one back/forward navigation anywhere earlier in the session to trigger,
which is why it looked specific to the lower blog cards: the links above the fold have the same
bug, but you are already at the top there, so nothing moves.

`ScrollToTop` classified back/forward navigations from a `popstate` listener, on the assumption
that `popstate` fires before the router commits the new route. It is the other way round — React
19 / the App Router commit from the `navigate` handling and `popstate` arrives _after_, so the
flag missed its own pop and then suppressed the **next** forward navigation. It now keys off
`history.pushState` (a forward navigation always pushes before the commit, a pop never pushes) and
scrolls only when the committed pathname is the one a push announced.

Back/forward still restores the previous position, and hash deep links (`…/europa-park#calendar`,
blog TOC, glossary anchors) still land on their target — those were the two behaviours the
`popstate` guard existed to protect.

Worth knowing for anything scroll-related: Next's own scroll handler bails out whenever the new
page's top element is already inside the viewport, which our streamed Suspense shells hit on
essentially every navigation. `ScrollToTop` is not a safety net, it is the only thing scrolling
these pages up — a wrong skip there is always visible.

The `history.pushState`/`replaceState` patch `NavigationProgress` carried now lives in
`lib/navigation/history-navigation.ts` and is shared, so the History API is wrapped once.

---

### perf: hero image loading, and why wide screens look soft

`backgroundImageLoader` used a single cutoff — `≤1080 → q50`, everything above → q75 — which lumped a
1440px desktop in with a 3440px ultrawide. It now **bands quality by how wide the rendition will
actually be painted**, and the middle band is the win: `≤1080 → q50` (mobile, unchanged), `≤1920 →
q60` (1440–1600px desktops, the most common desktop class), `>1920 → q75` (ultrawide and 2× retina,
unchanged). AVIF bytes for the 1440-class band, at Next's encoder settings:

| photo                                        | before (q75) | after (q60) |      |
| -------------------------------------------- | -----------: | ----------: | ---: |
| `walibi-holland/untamed`                     |       124 KB |       69 KB | −44% |
| `europa-park/wodan-timburcoaster`            |       140 KB |       85 KB | −39% |
| `phantasialand/taron`                        |        97 KB |       54 KB | −44% |
| `europa-park/silver-star`                    |        71 KB |       41 KB | −42% |
| `europa-park/madame-freudenreich-curiosites` |        79 KB |       41 KB | −48% |

(Measure these locally or with sharp, not against the deployed optimizer: `minimumCacheTTL` is a
year, so the Vercel image cache serves entries encoded by whatever the config was when they were
first requested — two "same" URLs can differ by 40%.)

The banding exists because the optimizer resizes with `withoutEnlargement`, so the delivered
rendition is capped by the source and the _requested_ width is really "how far will this get
stretched". Compression artifacts are magnified by that same factor, so a quality that is invisible
on mobile is not invisible at 3.9×. An earlier revision of this change put everything on q50 and made
ultrawide hero photos visibly blocky — that is what the bands fix.

Requested widths are also **clamped to 1920px**: w=2560 and w=3840 can only return the same pixels as
w=1920 even from the largest source in the tree, so they were three optimizer cache entries for one
rendition. No pixel and no byte changes at a given quality; it just stops that split, which matters
for a hero photo that re-picks on every shell regeneration.

**The real limit on wide screens is the source, not the encoder.** `sizes="115vw"` on a 3440px
ultrawide asks for a ~3956px paint width — a ~3.9× stretch of a 1024px photo, and almost every
background in the tree is 1024px. Measured on the Disneyland photo at that paint width: 1024px @ q75
costs 80 KB and still looks soft, while **2048px @ q50 costs 95 KB and is dramatically sharper**. New
and replaced backgrounds should therefore come in at 2048px; the loader's 1920px ceiling is set so
they deliver that detail without a code change. `disneyland-park/background.jpg` (the one 4032×3024 /
2.6 MB outlier) is downscaled to exactly that 2048px: sharper than the 1024px crowd on wide screens,
still ≥1200px for its structured-data crops, 2.2 MB lighter in the bundle, ~4× cheaper to decode.

The hero also gained the `placeholder="blur"` gradient the park backgrounds already had (now shared
via `lib/utils/image-placeholder.ts`), so it no longer flashes an empty `bg-background` slab.

Separately, the **in-park rotation** no longer fetches a park's whole photo set at once. Those layers
all sit in the viewport at full size, so `loading="lazy"` deferred nothing and Europa-Park fired 13
renditions (~250 KB) the moment the nearby lookup resolved. Only the outgoing / active / next layers
now mount an `<Image>`; the ken-burns animation moved to a permanently-mounted wrapper div so every
layer's animation clock still starts together and crossfades stay in phase.

→ [Assets – Delivery](development/assets.md#delivery-libutilsimage-loaderts)

---

### backend: park crowd levels now measure the park, not its busiest ride

No frontend code change, but the numbers on the park page move — worth knowing when a
screenshot from before this date disagrees with the live site.

The API's live park level used to be the P90 _across_ the per-headliner ratios, which over a
ten-ride headliner set is effectively the second-busiest ride. Phantasialand rendered **`high`**
while Taron and F.L.Y. both sat at 20 min against 45/40-min baselines. It is now a
baseline-weighted mean (`Σ current waits ÷ Σ their P50 baselines`) — the same afternoon reads
`low`. Expect quiet days to actually read quiet now; the badge ladder and colors are unchanged.

Three payload inconsistencies the page was rendering verbatim are also gone:
`analytics.occupancy.breakdown` now divides out to `occupancy.current` (it could show "25 min now
/ 30 min typical" beside "+23 % busier"), `statistics.avgWaitToday` can no longer exceed
`peakWaitToday`, and the calendar's per-day headliner figure is the same statistic on both sides
of today (past days were a daily average, future days a daily peak — a ~25 min step at the
today/tomorrow seam that read as "next week will be busier").

More surfaces now send **`unknown`** instead of a placeholder `moderate` — parks and rides
without a usable baseline. `CrowdLevelBadge` already renders it as "keine Prognose"; just don't
map it into the colored ladder anywhere new. This includes **`/v1/search` results' `load`**,
which used to fall back to `moderate`, and parks with no live sample at all, which used to
bottom out at `very_low`. Conversely, a ride reporting **0 min against a real baseline is a
walk-on** and now correctly rates `very_low` instead of `unknown` — so a 0 is a measurement,
not a gap.

→ [Backend Integration – Crowd Levels](api/backend-integration.md#crowd-levels-p50--normal),
[Crowd Levels (backend)](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/crowd-levels.md)

---

### fix: late-load flicker sweep (homepage, park-page weather, search)

Fixes the remaining "flickers once or twice a few seconds after load" reports. Root causes were
found empirically (headless Chromium + MutationObserver/layout-shift tracing on the built app).

- **Park-page weather no longer double-jumps:** the hour-by-hour chart now reserves its space with
  a same-size placeholder (fixed `h-28` plot + axis row — deterministic, not a guessed height)
  while the hourly fetch is still in flight and a nowcast is already shown. Previously the section
  shifted once when the nowcast landed (~3 s) and again ~1 s later when the chart mounted
  (layout-shift 0.037); now it settles in a single step. This resolves the "known, deferred"
  weather-chart CLS note from the re-render sweep.
- **Search palette stops flashing while typing:** the main search and glossary queries use
  `placeholderData: keepPreviousData`, so a new debounced query updates results in place instead of
  results → skeleton → results (the cmdk list height stopped jumping between 176/331/420 px).
- **Nearby card no longer flashes the "enable location" prompt:** the card keyed its skeleton off
  `isLoading` (actively fetching), but the nearby query is gated behind the after-load idle window
  and the initial permission check — in those first seconds nothing is in flight, so the prompt
  rendered and was then replaced by skeleton → parks. It now uses `isPending` (no data yet).
- **Nearby consumers survive the GPS key change:** `useNearbyParks` `placeholderData` now prefers
  the previous query's in-memory data before falling back to the localStorage cache, so the header
  pill / hero variant / search-dialog nearby group no longer blank out when coords arrive
  mid-session and re-key the query.
- **In-park hero takeover can't flash the background:** the base hero image holds its fade-out
  until the first park image has actually loaded (`onLoad`-gated), and the stacked park layers are
  `loading="eager"` (they're `opacity-0`, so lazy heuristics must not defer them).

---

### perf: re-render sweep (map re-pan fix, memoized grids/markers)

Follow-up render-churn pass on top of the code-quality sweep; no user-facing behaviour changes
except the map fix, which removes an unwanted motion.

- **Park map no longer re-pans every minute (visible fix):** `center` is now `useMemo`'d on the
  primitive coords, so the shared `useMinuteNow` tick no longer hands `MapViewController` a fresh
  array that re-triggered `map.setView(…, { animate: true })` every 60 s. `AttractionMarkers` and
  `RestaurantMarkers` are `React.memo`'d (no time-relative content) so the minute tick only
  re-renders the show markers that actually need it.
- **Attraction grid stops re-rendering on every keystroke/focus:** `LandSection` is `React.memo`'d
  and `TabsWithHash` is `React.memo`'d — on a big park the 100+ glass cards now bail out on search
  input and on the 5-min poll's `isFetching` flip, and only re-render when the data really changes.
- **Calendar day memo restored:** `ParkCalendarDay.onSelect` now receives the date, so the grid
  passes the stable `setSelectedDate` setter instead of a per-day arrow that defeated the existing
  `memo` (all ~35 day cards used to re-render on any day click / today-poll).
- Known, deferred (need a server-side data seed, not a skeleton): the hour-by-hour weather chart and
  the daily-wait chart still expand on their client fetch/mount (CLS); reserving space cleanly
  requires seeding those queries server-side rather than a guessed skeleton height.

---

### refactor: code-quality sweep (dedup, component splits, client→server, repaint gates, stale docs)

Cross-cutting cleanup driven by a full-codebase audit; no user-facing behavior changes intended.

- **Dead code removed:** `BlogRelatedParks`, `ShowCountdown`, `GlossaryInjectLoader` (all imported
  nowhere).
- **Client → Server components:** `RopeDropCard` (only its embedded `ParkTime` islands hydrate now)
  and `AttractionTypicalWaitsDemo` dropped `'use client'`. NOT converted: `ParkBackground` — its
  `next/image` `loader` function prop cannot cross the server→client boundary.
- **Repaint/CPU gates (continues #219):** `weather-nowcast-banner` 1 s countdown now pauses
  offscreen/hidden (`useActiveOnScreen`); hero rotation, geolocation auto-refresh and the shared
  `useMinuteNow()` clock skip ticks while the tab is hidden; `park-map` and the former
  `useBrowserNow(60_000)` consumers (`park-time-info`, `peak-hour-badge`, `use-today-schedule`) now
  share ONE minute timer via `useMinuteNow()`/`useMinuteNowDate()` instead of private intervals.
- **Dedup:** new `lib/utils/crowd-level-styles.ts` is the single source for crowd-level →
  text/badge/outline/chip classes + the wait-time threshold ladder (`waitTimeCrowdTier`) + the
  level order — `CrowdLevelBadge`, `WaitTimeValue`, blog live-display, live ticker, best-days
  chips and both calendar components now derive from it. `scoreToCrowdLevel` moved to
  `crowd-analysis.ts` (was copy-pasted twice). Shared `<TodayWaitRange>` + `<TrendIcon>` replace
  byte-identical blocks in `attraction-live-panel` / `wait-time-info-card`. The hourly weather
  chart's two temperature palettes merged into one `TEMP_STOPS` table.
- **Best practices:** added `app/global-error.tsx` (branded last-resort boundary); attraction
  `generateMetadata` uses `catchNonFatal` (maintenance outages no longer masked as not-found);
  `components/ui/progress.tsx` dropped `forwardRef` (React 19 ref prop).
- **Large-component splits (behaviour-identical):** `search-dialog` 651→350 (data layer →
  `lib/hooks/use-search-results.ts`, rows → `search-result-items.tsx`), `tabs-with-hash` 631→328
  (`use-tab-hash-routing` + `use-attraction-filter` hooks, `park-tabs-list` + `off-season-toggle`
  components), `park-map` ~550→263 (`lib/utils/leaflet-icons.ts`, `use-park-map-geolocation` hook,
  `park-map-markers` components), and `nearby-parks-card` split into a state-router + view/analytics
  pieces.
- **More dedup:** merged the two near-identical `SectionHeader`/`SectionHeading` components into one
  (`variant="plain"` absorbs the old `SectionHeader`; former component deleted, 2 call sites
  migrated); new `GlassSectionTitle` replaces the frosted section-title pill copy-pasted 6× across
  `nearby-parks-card`/`favorites-section`; new `<LiveDot>` primitive replaces the pulse/ping "live"
  dot hand-rolled in the live ticker, ML badge, weather-card and training-status badge.
- **More repaint gates:** `weather-background`'s declarative CSS animations (clouds/stars/fog/flash)
  now pause via `animation-play-state` when the card scrolls offscreen (IntersectionObserver →
  `data-paused`, no scroll-time re-renders); the precipitation canvas was already gated.
- **Version:** `package.json` bumped 2.10.0 → 2.10.1 to match the latest released changelog entry
  (was lagging).
- **Stale docs/comments fixed:** removed the long-gone Vercel Toolbar/Flags + `debug-geo-mode`
  subsystem from 8 docs + `.env.example`; caching-strategy doc got a "superseded" note (PPR →
  force-dynamic reality); `cache-config.ts` comments now reference `PARK_REVALIDATE`/
  `ATTRACTION_REVALIDATE`; tech-stack table (TS 6.x, custom SVG charts, no recharts); scripts doc
  lists all prebuild generators.

---

### feat: header "Prognose heute" opens the day-detail dialog (+ day navigation, park-tz times)

The forecast cell in the park-header stats band is now clickable and opens the SAME
day-detail dialog the crowd calendar shows when clicking today (status & hours, live vs.
forecast split, headliner waits, hourly prediction chart, weather, holiday context).

- `ParkHeaderStats` reuses `ParkCalendarDayDetail` 1:1 — no new dialog UI. The full
  `CalendarDay` for today comes from a one-day `/calendar` fetch with the same query key +
  staleTime as the calendar grid's today-patch (shared React Query cache; opening the
  calendar tab later reuses it), deferred via `useLoadLast` so it never competes with the
  live/weather queries (loads-last rule).
- The cell value becomes a button (hover pill + chevron affordance, `aria-haspopup`,
  focus ring) only once today's data is cached — a click therefore always opens instantly;
  until then (or if the fetch fails) it renders static as before.
- **Day navigation in the dialog**: prev/next chevron buttons (and ←/→ keys) flip through
  days without leaving the dialog — from both entry points. The dialog retains the last
  shown day and dims (`aria-busy`) while the target day loads instead of unmounting. In the
  header each visited day is its own small cached one-day query; in the calendar grid,
  crossing a month boundary also navigates the grid month (hash stays in sync).
- **Park-timezone times everywhere**: the dialog and the calendar grid cells now render
  opening hours via `ParkTimeRange` (park-local time, viewer-local tooltip on hover) instead
  of `format(parseISO(...))`, which silently used the BROWSER timezone — for viewers outside
  the park's timezone the calendar showed shifted hours (e.g. 07:00–17:00 UTC instead of
  09:00–19:00 park time). `ParkCalendarDay`/`ParkCalendarDayDetail` gained a required
  `parkTimezone` prop.
- New translation keys `parks.dayDetail.openToday` / `prevDay` / `nextDay` in all 6 locales.
- **Fix: header holiday panel no longer swallows neighbouring school breaks.** The
  `useTodaySchedule` influencing filter dropped every neighbour entry whose NAME matched the
  local holiday — with generic school-break names ("Summer Holidays" in NRW _and_ HE/NI/RP/
  NL/BE) that erased whole countries from <HeaderHolidayPanel> (only "Belgien" survived)
  while the day-detail dialog listed them all. The name-echo suppression now applies only to
  non-school entries (a shared public holiday like Whit Monday is still told once, by the
  local badge); region-specific school breaks always show — header and dialog tell one story.
  The panel's region chips now also carry their country's flag emoji (🇩🇪 Hessen · 🇳🇱
  Niederlande · 🇧🇪 Belgien), matching the dialog's visual language.

### perf: page-wide re-render/flicker sweep (memory & repaint fixes)

Audit of all pages for state/effect patterns that forced unnecessary re-renders, repaints or
leaked resources — the source of intermittent visible flicker.

- **Geolocation context** (`lib/contexts/geolocation-context.tsx`): background auto-refresh
  (60 s in-park / 5 min) no longer pulses `loading` and preserves the `position` object
  identity when coords are unchanged; context `value` memoized. Previously every tick
  re-rendered all geo consumers (hero, nearby card, favorites, banner) 2× with a new
  context reference even when nothing changed.
- **Region/neighbor live overlays** (`use-region-parks`, `use-park-neighbors`): return a plain
  `Record` instead of a `Map` — React Query structural sharing now keeps the identity stable
  across equal polls, so hub/country/nearby card grids stop re-rendering every 5 min for
  byte-identical data.
- **Attraction page**: the "Updating…" refetch indicator now lives in a fixed-height slot
  (same pattern as the park page) — it used to insert/remove a row on every mount refetch,
  5-min poll and tab refocus, shifting the whole live card up/down (CLS).
- **Attraction grid sparklines** (`WaitTimeSparklineCard`): one shared minute clock
  (`lib/hooks/use-minute-now.ts`, `useSyncExternalStore`) replaces one 60 s interval PER
  card — dozens of staggered per-card repaints per minute become a single batched update.
- **Sparkline hover** (`components/parks/sparkline.tsx`): local `onMouseMove`/`onMouseLeave`
  instead of a global `window` listener per instance (~31 on the attraction history grid,
  each doing a forced layout read on every pointer move anywhere on the page).
- **Crowd calendar**: `keepPreviousData` on month navigation — the grid dims instead of
  flashing back to the full skeleton on every prev/next click.
- **Weather**: nowcast banner ticks 1 s only while a banner is visible (was: every second on
  every park page forever, even with no banner); night-scene star field is generated after
  mount (was: SSR/client hydration mismatch that re-created the subtree).
- **Nowcast countdown hydration error** (found via headless smoke test): the
  `typeof window ? Date.now() : 0` state seed in `NowcastUpdateCountdown` (and the nowcast
  banner clock) rendered an epoch-based countdown ("Update in 29738148:20") into any
  server-rendered nowcast — guaranteed hydration text mismatch, React regenerated the whole
  subtree on every load (visible on /howto). Now: deterministic 0 on both server and
  hydration render with a stable "--:--" placeholder; the real clock mounts in an effect.
- **Coaster player** (glossary): progress bar is driven imperatively via refs — `onTick`
  no longer calls `setState` ~60×/s; `pause()` now actually stops the RAF loop (it kept
  rendering at 60 fps while paused/off-screen, and each pause→play stacked an extra RAF
  chain); both three.js scenes release their WebGL context on dispose
  (`forceContextLoss()`) so remounts can't exhaust the browser's context cap.
- **ShowCountdown**: browser-clock only via `useBrowserNow` (was: `new Date()` state seed
  baking the server/build clock into SSR HTML → hydration mismatch on every load).
- **Favorites**: the favorites cookie is parsed once per change event (memoized by raw
  cookie value) instead of once per mounted star (O(stars) JSON.parse per toggle).
- **Blog images**: the build manifest now bakes intrinsic width/height (via sharp, EXIF-aware)
  into every gallery/inline image so the box is reserved before load — `width={0}/height={0}`
  reflowed the article on every image pop-in.
- Smaller: memoized context values (temperature unit, glossary inject, admin), memoized
  glossary term parsing, memoized stats/best-days derivations, stable keys in the live wait
  ticker, `holiday` object in `useTodaySchedule` memoized, blob-URL cleanup in the contribute
  photo dropzone no longer closes over the first render's empty list.

### perf: best-days seed streams instead of blocking park-page TTFB

Cold-start latency fix. The best-days SEO seed (`getBestDaysCalendarSeed`) was `await`ed on the
park page's render critical path, so a cold `/best-days` fetch (~0.4–1 s, occasionally slower than
the park snapshot fetch, or hitting the seed timeout) was added straight to first-byte — a
noticeable cold-start regression on `force-dynamic` park pages (no edge-cached HTML).

- `page.tsx`: the seed promise is created but **no longer awaited in the body**. It's consumed only
  inside `<Suspense>` boundaries — the FAQ JSON-LD (`FAQStructuredData` now takes the seed _promise_
  and awaits it itself) and a new streamed `SeededBestDays` server component for the best-days slot.
  The shell (H1, attraction overview, header, FAQ base + Q1) now flushes at **park-fetch speed** and
  the seeded best-days HTML + least-crowded JSON-LD stream into the same response — crawlers still
  receive them in the final document (verified: full-download HTML of a park with data contains the
  best-days text + the 9-question FAQPage incl. least-crowded).
- The visible FAQ Q7 (least crowded) is no longer server-seeded (that required the blocking await);
  it streams in from the client calendar fetch after mount, and the SEO signal lives in the streamed
  JSON-LD. Q0–Q6 + Q1 still render immediately from the park snapshot.
- `BEST_DAYS_SEED_TIMEOUT_MS` 800 ms → 3 s: off the critical path now, so a generous bound just
  lets the seed land in the streamed HTML more often; `after()` still warms the data cache on a miss.
- Measured (local prod build, real API): cold-park page TTFB is now gated by the park snapshot fetch
  (e.g. 0.42 s) instead of park + seed serialized; a park whose snapshot fetch is itself slow cold
  (~0.9 s) is unchanged (that's the park fetch, not the seed). No hydration errors; forecast intact.

### SEO: park best-days now read the precomputed /best-days endpoint

Follow-up to the "core content in first HTML" work, now that the backend ships the precomputed
best-days endpoint (PArns/v4.api.park.fan#94). The best-days section, crowd FAQ and header
"Prognose heute" forecast previously derived their data from the ~2.25 MB `/calendar` response
(≈98 % unused `influencingHolidays`, 10–20 s cold ML compute) guarded by a seed timeout.

- `lib/api/integrated-calendar.ts`: `getBestDaysCalendar` / `getBestDaysCalendarSeed` now fetch
  `GET /v1/parks/.../best-days` (a materialized Redis snapshot, ~15 KB, p99 < 300 ms). Dropped
  `unstable_cache` + `projectBestDaysCalendar` — the small body fits Next's fetch data cache
  directly (plain `next: { revalidate, tags: ['best-days:<slug>'] }`; the backend fires
  `revalidateTag` after each forecast warmup). Seed timeout is now a formality (800 ms).
- New `getBestDaysSnapshotFresh` + `/api/parks/.../best-days` proxy branch; `useParkBestDaysCalendar`
  (client) switched to it — no more `from`/`to` window (the endpoint returns the rolling today→+90d
  window), so `getCalendarWindow` / `lib/hooks/use-calendar-window.ts` are gone.
- The `/best-days` snapshot includes a stats-quality `byDayOfWeek` aggregate, so the **SSR seed now
  renders the proper "quietest weekdays" ranking + best weekend day** in the first HTML (previously
  the seed fell back to the calendar-derived approximation).
- `park-header-stats.tsx`: "today" for the forecast is derived from the browser clock in the park
  timezone (`date === todayStr`) — the lean endpoint deliberately omits the `isToday` flag (a baked
  flag goes stale in the CDN cache).
- The calendar **grid tab** still uses the full `/calendar` endpoint (it needs hours + weather per
  day); with the backend payload diet its default body is now ~50 KB instead of ~2.25 MB.
- Loading-priority REQUIREMENT untouched: the client best-days query stays `useLoadLast`-deferred.

### SEO: park pages ship their core content in the first HTML again

Competitor SERP analysis (July 2026, "phantasialand wartezeiten" & co.) found the park page's
initial HTML contained **no attraction names, no attraction links and no best-days text** — the
attractions tab mount-gated everything behind a skeleton, and the best-days/FAQ calendar content
was client-only. wartezeiten.app/queue-times serve exactly this content statically. Changes
(see [SEO analysis](seo/analysis.md)):

- **NEW `AttractionWaitOverview`** — the pre-mount/no-JS state of the attractions tab is now a
  server-rendered semantic list of EVERY attraction (name + link + snapshot wait/status),
  grouped by land, with the park-wide Ø/peak/operating summary and a visible "Datenstand"
  timestamp. The interactive cards replace it after mount; crawlers index 40 ride names + 40
  internal links per park instead of a pulse skeleton.
- **Best-days SSR seed** — `getBestDaysCalendarSeed` (timeout-guarded `getBestDaysCalendar`,
  month-aligned window, `after()` keeps a cold fill alive) lets the "Beste Reisezeit" section
  and the least-crowded FAQ render server-side when the (72 h SWR) cache is warm. The client queries
  stay `useLoadLast`-deferred — the loading-priority requirement is untouched (the seed is
  props, not a page query).
- **FAQ**: "Wann ist {park} am wenigsten los?" now also lands in the FAQPage **JSON-LD**
  (shared `getLeastCrowdedDays` derivation, so markup and visible answer can't diverge), and
  Q1 renders today's concrete opening hours server-side (force-dynamic page, per-request clock).
- Fixes: German evergreen opening-hours FAQ no longer reads "von das {park}"; attraction-page
  H1 text no longer concatenates as "Taron– Aktuelle Wartezeit"; the neighbouring-holidays
  header panel renders once (responsive classes) instead of twice in the HTML.
- Deliberately NOT changed: `PARK_REVALIDATE` stays 1 day — a shorter snapshot window would
  re-create the ISR/data-cache write volume documented in
  [caching-strategy](architecture/caching-strategy.md); freshness is signalled honestly via the
  rendered "Datenstand" instead.

### Hottest-parks banner: centered layout for a partial heat wave

The homepage heat banner ([`HottestParksSection`](../components/home/hottest-parks-section.tsx))
switched from a fixed 3-column grid to a **centered flex-wrap** row of fixed-width (`w-72`)
cards. When only 1–2 parks in DE/FR/IT/NL/BE cross the 35 °C threshold, the cards now stay
centered instead of left-aligning and leaving an empty trailing column. Three cards still fill
`max-w-4xl` exactly; the ≥ 35 °C visibility trigger is unchanged.

### Blog: German-first launch (welcome post live in DE only)

The rewritten founder-story welcome post goes **published for DE**; EN stays draft until the
translations are polished. To make a single-locale launch clean, blog visibility is now
**locale-scoped** (`hasPublishedPosts(locale?)` in `lib/blog/index.ts`):

- Header/footer nav, blog index, category/tag/author pages and the RSS feed exist **only in
  locales that actually list posts** — /de/blog is live while /en/blog & co. stay 404 instead
  of presenting an empty index.
- `buildPostAlternates` emits only **published** translations (draft URLs 404, hidden ones are
  unlisted — neither belongs in hreflang); the DE post self-canonicalizes with `x-default` on
  itself until translations exist.
- `app/sitemap.ts` blog section iterates only blog-live locales (incl. blog-scoped hreflang
  alternates for index/category/tag/author entries).

### SEO: hub + attraction pages join the sitemaps

SERP checks (July 2026) showed the missing long-tail surface: queue-times/wartezeiten.app rank
their per-ride pages for "taron wartezeit"-style queries and country overviews rank for
"freizeitparks deutschland" — page types park.fan HAS but kept out of the sitemap (old
crawl-budget decision, explicitly marked "revisit"). Changes — see
[sitemaps](seo/sitemaps.md):

- `app/sitemap.ts`: continent + country hubs and **multi-park** city hubs added (single-park
  cities 308 to their park and stay excluded).
- **NEW `/sitemap-attractions.xml`** (`app/sitemap-attractions.xml/route.ts`, daily ISR):
  ~5.8k attractions × 6 locales as lean `<loc>`-only entries (full alternates would approach
  the 50 MB sitemap limit; the pages carry hreflang themselves). Referenced from robots.txt.
- `lib/content-urls.ts` `getAttractionPaths`: variant filter now mirrors the attraction page
  exactly — numbered-suffix slugs are only dropped when the base slug exists in the same park
  (previously over-excluded legit slugs like `spindeln-nyhet-2026`); also fixes the IndexNow
  URL set.

---

### SEO: heal re-slugged geo URLs (google.de showed English/no German pages)

The API's umlaut transliteration change re-slugged German cities (`bruhl` → `bruehl`,
`gunzburg` → `guenzburg`), so every previously indexed Phantasialand + Legoland-Deutschland
URL (park, attractions, city hub) returned **404** — Google dropped the German flagship pages
and google.de fell back to English results; visit share skewed to the US. hreflang, canonicals,
sitemap alternates and `Content-Language` were verified correct — the missing piece was
redirects for the old URLs:

- **`findRelocatedParkRedirect`** (`lib/utils/redirect-utils.ts`) — generic safety net: the
  park slug is the stable key; if the API lookup for a park/attraction URL 404s but the slug
  exists elsewhere in the geo structure, the page issues a **308** to the canonical path.
  Runs only after a confirmed API miss, so it can never bounce a working URL. Heals any
  future city/country re-slug automatically. Wired into the park page and attraction page
  (body + `generateMetadata` canonical). Handles duplicate park slugs (`disneyland-park`
  exists in Paris **and** Anaheim) by preferring continent/country matches.
- **Static 301s** in `next.config.ts`, derived from the GSC coverage export (2026-07-06,
  2,388 known 404s) diffed against `/v1/discovery/geo`:
  - rule 6 relocated cities: `bruhl`→`bruehl`, `gunzburg`→`guenzburg`, `cocoyoc`→`oaxtepec`,
    `glendale`→`phoenix`, `valencia`→`santa-clarita`, `willis`→`spring`
  - rule 7 renamed parks: 6× `six-flags-hurricane-harbor-*`→`hurricane-harbor-*` (the three
    still-existing six-flags water parks are deliberately NOT matched), `universals-*`→
    `universal-*`, `toverland`→`attractiepark-toverland`, `lotte-world`→`lotte-world-adventure`,
    `disneys-animal-kingdom-theme-park`→`disney-animal-kingdom`, `adventure-island`→
    `adventure-island-tampa`, `universal-studios`@bull-creek→`universal-studios-hollywood`@LA,
    resort URLs `walt-disney-world`→Orlando hub, `disneyland-paris`→`disneyland-park`
  - rule 8 pre-`/parks` URL scheme: `/{locale}/{continent}/…` → `/{locale}/parks/{continent}/…`
  - rule 9 doubled locale prefixes (`/de/de/…`), rule 10 `/manifest.json` → `/manifest.webmanifest`
- **Cross-locale glossary slugs** (≈38 % of the sampled 404s, legacy of next-intl
  auto-alternates): the term page now resolves a slug from ANY locale via `findTermByAnySlug`
  and 308s to the locale-correct slug — e.g. `/nl/glossaire/harnais-epaules` →
  `/nl/woordenboek/schouderbeugels`-style chains end on real content instead of 404.
- Docs: [routing-and-urls](architecture/routing-and-urls.md#redirect-logic-404-prevention)
  examples updated to current slugs; [SEO analysis](seo/analysis.md) notes the incident.
- Known backend data bug (flagged, needs API fix): `universal-studios-hollywood` is listed
  under BOTH `bull-creek` and `los-angeles` in `/v1/discovery/geo` → duplicate sitemap
  entries and split signals.

---

### ISR writes: hourly homepage shell, client-live overlays, on-demand revalidation

Vercel ISR Write Units had climbed back to ~45–100k/day (614k for Jun 19 – Jul 2). Root cause:
the Jun 22 homepage change (static 5-min shell) — 6 locales × up to 288 regenerations/day ×
~600 KB HTML+RSC per write (units are billed **per 8 KB stored**) ≈ the whole bill. On top,
`getGeoStructure(300)` in the featured-parks slot re-wrote the ~114 KB geo Data-Cache entry
every 5 min **and pinned every route embedding the slot** (blog, glossary terms, howto) to a
5-min ISR window — a route's effective window is its **lowest** fetch revalidate. Fix — see
[caching-strategy](architecture/caching-strategy.md):

- `app/[locale]/page.tsx` — homepage `revalidate` **300 → 3600** (~12× fewer shell writes).
  The classic hero photo now re-picks per regeneration (~hourly rotation across visits).
- Every homepage-shell fetch raised to ≥ 3600 so none pins the route: `getGlobalStats` /
  `getGeoLiveStats` (defaults 600→3600), `getTickerData(3600)` seed (the `/api/analytics/ticker`
  proxy keeps its 600s cache for client polls), `lib/api/ml.ts` 1800→3600, featured slot
  `getGeoStructure()` → 24h default.
- The numbers that read as "live" overlay themselves client-side on the baked seed (the
  park/hub-page shell+overlay model): new `LiveContinentOpenCount` (via existing
  `useGeoLiveStats`), new `GlobalStatsLiveCounts` + `useGlobalStats` hook (no-store
  `/api/analytics/realtime`), and featured cards now prerender **status-free** with
  `FeaturedParkCardsLive` → `useRegionParks` overlay (same as hub grids). Fresher than the old
  baked 5-min snapshot, ~zero extra LCP cost (all below the fold, React Query already loaded).
- **NEW `/api/revalidate`** (POST, `Authorization: Bearer $REVALIDATE_SECRET`, body
  `{"tags":[...],"paths":[...]}`) — on-demand `revalidateTag`/`revalidatePath`, so the backend
  can push "data actually changed" instead of the frontend re-writing on a timer. See
  [backend-integration](api/backend-integration.md#on-demand-revalidation).

---

### "Hottest parks" heat banner on the homepage

A Saisonstart-style homepage section that surfaces the **3 hottest parks** in
**Germany, France, Italy, the Netherlands and Belgium** during a heat wave, each with a
park link and a temperature card (max temp + the heat-warning triangle). It is
**data-driven**: it renders only while at least one park that is **operating today** is
at/above the heat threshold (`HEAT_WARNING_THRESHOLD_C`, 35 °C) and **disappears
automatically** when the heat passes — no manual end date. Includes a °C/°F toggle and an
explanatory heat-tips paragraph; water parks (Rulantica) and off-season / seasonal-event
venues are excluded. See [hottest-parks-heat-banner](features/hottest-parks-heat-banner.md).

- `lib/api/weather-hottest.ts` (new) — `getHottestParks()` derives the biggest parks
  operating today in DE/FR/IT/NL/BE from the geo tree and ranks them by cached per-park
  nowcast (today's max temperature). Frontend aggregation; swappable for a backend endpoint.
- `components/home/hottest-parks-section.tsx` (new) — server component, reuses `<Temp>`,
  `TemperatureUnitToggle`, `getWeatherConfig`, `<HeatWarningBadge>` and country translation;
  renders `null` when no park qualifies.
- `app/[locale]/page.tsx` — section mounted after `AnnounceSection`, in `Suspense` with a
  `null` fallback (no skeleton flash for a usually-absent section).
- `messages/*.json` — `home.hottestParks.*` (all 6 locales).

---

### Heat warning threshold raised to 35 °C

The heat warning now triggers at **≥ 35 °C (95 °F)** (was > 30 °C). Single constant
`HEAT_WARNING_THRESHOLD_C` in `components/parks/heat-warning-badge.tsx` plus the tooltip
copy in `messages/*.json`. Severe-weather day warnings are unchanged.

---

### Heat warning badge on the weather card

Temperatures above **30 °C (86 °F)** now show a real road-sign style warning triangle — red
border, white background and a black "!" (SVG) — next to the affected temperature. It appears
next to the current temperature at the top of the weather card, on the peak-temperature label of
the hourly nowcast chart, and on every day in the bottom forecast strip whose max temperature
crosses the threshold. The threshold is checked on the Celsius source value, so it triggers
identically regardless of the user's °C/°F unit choice.

The same triangle also flags **severe-weather days** in the forecast strip — thunderstorms,
heavy rain (code 65/67/82 or ≥ 25 mm/day), heavy snowfall (code 75/86 or ≥ 10 cm/day) and
storm-force wind (≥ 60 km/h). When a day is both hot and severe, a single triangle carries a
tooltip that lists every reason.

- `components/parks/heat-warning-badge.tsx` (new) — `HeatWarningBadge` (SVG warning triangle) +
  `isHeatWarning()` helper and the shared `HEAT_WARNING_THRESHOLD_C` constant.
- `lib/utils/weather-utils.ts` — `getDayWeatherWarning()` classifies a forecast day as severe.
- `components/parks/weather-card.tsx` / `weather-forecast-strip.tsx` / `weather-hourly-chart.tsx`
  — render the badge.
- `messages/*.json` — `parks.weather.heatWarning` + `parks.weather.weatherWarning.*` tooltip
  labels (all 6 locales).

---

### Homepage sections server-rendered into the 5-min shell

The homepage's data sections — **Featured Parks** ("beliebte Parks"), **Global/Platform Stats** and
**"Parks open now"** — now render **server-side into the 5-min static shell** instead of fetching
their data client-side. This removes the React Query hooks (`use-global-stats`, `use-park-backgrounds`,
the homepage's `useGeoLiveStats`, and the featured-parks poll) and their no-store `/api/...`
round-trips from the home bundle — less client JS competing with the render-blocking CSS at first
paint, and the content now lands in the prerendered HTML (better LCP, SEO, no-JS). Data is at most
5 min stale: the section fetches (`getGlobalStats(300)` / `getGeoLiveStats(300)` /
`getGeoStructure(300)`) share the shell's revalidate window. See
[caching-strategy](architecture/caching-strategy.md).

- `components/home/global-stats-section.tsx` → `async` server component; park/ride backgrounds are
  resolved on the server (`lib/utils/park-assets`) instead of via the deleted `use-park-backgrounds`
  client mirror.
- `components/home/live-activity-{section,grid}.tsx` → per-continent open counts come from the server
  `getGeoLiveStats(300)` fetch (props), so the grid ships no client JS. `useGeoLiveStats` stays for the
  geo pages.
- `components/home/featured-parks-slot.tsx` → `FeaturedParksSlot` (full section) + `PopularParksGrid`
  (compact, howto pages) are now server components that render `extractFeaturedParks(getGeoStructure(300))`
  directly. The client poll returned that _same_ 300s-cached data, so server-rendering costs no
  freshness. Deleted `featured-parks-section-client.tsx` + the `/api/featured-parks/[locale]` route
  (its only caller was the poll). Applied across the homepage, blog context module, glossary term
  pages and the 6 howto pages.
- `lib/api/analytics.ts`: `getGlobalStats` / `getGeoLiveStats` take an optional `revalidate` (default
  600); the homepage passes **300** to pin them to the shell's window.

---

### No more scrollbar flicker when opening popups

Opening any Radix popup (language switcher dropdown, dialog, popover, command palette,
mobile sheet) made the whole page flicker horizontally: `react-remove-scroll` locks the
body and hides the vertical scrollbar while the popup is open, so on classic-scrollbar
systems (Windows/Linux) the content area — including the sticky header and `w-screen`
full-bleed sections — widened by the scrollbar's width and snapped back on close.

- **Fix** (`app/globals.css`): `html:has(body[data-scroll-locked]) { scrollbar-gutter: stable }`
  reserves the scrollbar's space **only while a popup is open**, so hiding the scrollbar no
  longer changes the page width. It is deliberately _not_ permanent — during normal scrolling
  the browser's native scrollbar renders as-is (correct theme colour, no forced always-visible
  bar). The `body[data-scroll-locked]` rule also zeroes the `margin-right`/`padding-right` that
  `react-remove-scroll` adds to compensate for the removed scrollbar — the reserved gutter
  already covers that, so otherwise it would shift the page the other way.
- No-op on overlay-scrollbar systems (e.g. macOS without "always show scrollbars"), which
  never had the flicker.
- **Dark scrollbar in dark mode** (`app/globals.css`): some platforms (notably macOS) colour
  the native scrollbar from the _OS_ appearance, not the page — and `color-scheme: dark`
  doesn't reliably override it — so a dark site on a light/auto macOS showed a light/white
  scrollbar. `.dark { scrollbar-color: … transparent }` now sets the colour explicitly
  (driven by the theme class, so it matches the chosen theme from the first paint). Light
  mode keeps the native scrollbar.

---

### Glassier popups (dropdowns & popovers)

Dropdown menus (e.g. the language switcher) and popovers were flat opaque boxes. They now
match the site's glass aesthetic: a translucent, `backdrop-blur-xl` surface
(`supports-[backdrop-filter]` keeps an opaque fallback), softer `rounded-xl` corners, a
richer `shadow-xl` with a subtle ring, and menu items get `rounded-md` + a color
transition on hover. Shared via `components/ui/dropdown-menu.tsx` +
`components/ui/popover.tsx`, so every dropdown/popover benefits.

---

### Park page load order: weather first, best travel time last

Two loading fixes on the park page, plus a stale-cache fix that made the hourly weather
day view randomly disappear.

- **Hourly day view sometimes missing (stale-day cache race)**: `/api/weather/hourly`
  used `forecast_days=1` ("today at upstream fetch time") behind two
  stale-while-revalidate cache layers (Next data cache `revalidate: 900` + CDN
  `s-maxage=900`). The Next data cache serves a stale entry (any age) while it
  revalidates in the background — so the first visitors after midnight could receive
  YESTERDAY's hours. `WeatherHourlyChart` hides data that isn't "today" in the park
  timezone, so the chart silently vanished on those pages and reappeared on reload.
  Fix: the client (`useWeatherHourly`) now sends the park-local date (browser clock,
  computed at fetch time) as `&date=`, and the route maps it to Open-Meteo
  `start_date`/`end_date`. Every cache key (CDN request URL + Next data-cache upstream
  URL) now rolls over with the park-local day, so a stale serve can never deliver the
  wrong day.
- **Weather loaded too late (nowcast→hourly waterfall)**: the hourly fetch was gated on
  the nowcast having arrived. It now starts in parallel on mount; only the _rendering_
  of the day view still requires a nowcast.
- **Best travel time ALWAYS loads last (requirement)**: the best-days calendar +
  historical stats are the page's largest/slowest requests (cold compute 10–20 s) and
  competed with the live/weather queries. New `useLoadLast` gate
  (`lib/hooks/use-load-last.ts`) defers `useParkBestDaysCalendar` +
  `useParkHistoricalStats` until every other React Query fetch on the page has settled
  (300 ms network-idle grace, 5 s safety timeout so the sections can't be starved).
  Consumers (`ParkBestDaysSection`, `ParkStatsSection`) now gate their skeletons on
  `isPending` instead of `isLoading` — a deferred (disabled) query is pending but not
  fetching, so `isLoading` would have flashed the empty fallback. Requirement
  documented in [system-overview](architecture/system-overview.md) and `CLAUDE.md`.

---

### Hourly day view in the weather card

Weather-app style detail view for today inside the park weather card: smoothed temperature
curve with min/max labels, rain bars per hour, a "now" marker (past hours dimmed) and
per-hour tooltips (time, temp, condition, precip, rain probability), plus an axis with
weather icons every 3 h. Shown only when the park has a live nowcast.

- **Data**: the backend exposes no hourly temperatures (daily weather + ~6 h nowcast only),
  so `/api/weather/hourly` proxies Open-Meteo — the backend's own upstream source, already
  attributed in the card. The proxy keeps requests first-party (no visitor IPs to a third
  party), validates `lat`/`lon`/`tz`, rounds coords to ~1 km and caches 15 min
  (`revalidate: 900` + `s-maxage=900`), so all visitors of a park share one upstream call.
  If/when the backend grows an hourly endpoint, only the route handler needs to change.
- **Types**: `WeatherHourlyPoint` / `WeatherHourlyToday` in `lib/api/types.ts`.
- **Hook**: `useWeatherHourly` (client-only, 15 min stale, 30 min refetch to roll the chart
  over to the new day after midnight); enabled only when a nowcast exists.
- **Component**: `components/parks/weather-hourly-chart.tsx`; hides itself when the data no
  longer belongs to "today" in the park timezone (midnight gap until the next refetch).
- **Park page**: passes `latitude`/`longitude`/`timezone` to `WeatherCard` (new optional
  props — other `WeatherCard` consumers are unaffected).
- **i18n**: `parks.weather.hourlyTitle` / `parks.weather.nowLabel` in all 6 locales.

---

### Rope-drop recommendations

Surfaces the API's precomputed rope-drop data (backend PR #67): is it worth arriving at park
opening for a headliner, and until when does the advantage last.

- **Types**: `RopeDropInfo` / `RopeDropHeadliner` in `lib/api/types.ts`; `ropeDrop` on
  `ParkAttraction` + `AttractionResponse`, `ropeDropHeadliners` on `ParkWithAttractions`.
  Only set for tier1/tier2 headliners in parks with a schedule — and present even when
  `worth: false`, so always check `worth`, not just existence.
- **Attraction cards**: `<RopeDropBadge>` (sunrise icon, emerald = high / teal = moderate)
  shown when `worth: true`, regardless of live status (the tip matters most pre-opening).
- **Attraction detail**: `<RopeDropCard>` — savings headline (open wait vs. day peak),
  advantage window as concrete park-local time via `rideByUtc` (offset fallback when null),
  quieter evening alternative via `bestSlotUtc` when the day's trough isn't at opening,
  weekend/weekday breakdown, low-confidence hint. Muted "no need to rush" note when
  `worth: false`.
- **Park page**: `<RopeDropHeadliners>` strip above the headliners section (chips linking to
  each attraction, minutes saved); data arrives pre-filtered/sorted from the API.
- **Inverse recommendation ("better later")**: when `worth: false` but the line is already long
  right at opening (≥30 min) and the day's trough sits ≥2 h later (`isEveningBetter` in
  `lib/utils/rope-drop.ts`), cards get an indigo moon badge and the detail page an
  "Better later than at opening" panel pointing at the typical trough time (`bestSlotUtc`).
- **Backend PR #69 fields**: `bestSlotWait` (expected wait at the trough), `endOfDayWorth` /
  `endOfDaySavings` (server-side "better later" verdict with pre-closing line-drain guard) —
  all optional in the frontend types. `isEveningBetter` prefers the server verdict and keeps
  the local heuristic as fallback for cached recommendations predating the fields. When
  `bestSlotWait` is present, the evening panel shows an opening/peak/evening stat trio and the
  badge hint + alternative lines say "typically only ~X min". `/v1/favorites` now also carries
  `ropeDrop`, so favorites cards light up without further frontend changes.
- **i18n**: `attractions.ropeDrop.*` + `parks.ropeDropSection.*` in all 6 locales.
- Rope-drop values are recomputed daily server-side — no extra polling; the fields ride along
  on the existing park/attraction responses.

---

## 2.10.1 (2026-06-10) – SEO review fixes

Full-code SEO review; fixed everything actionable. See [seo/analysis.md](seo/analysis.md).

- **robots.txt**: `Allow: /api/og/` so Google can crawl the OG images; stopped disallowing
  `/_next/` (Google renders pages and needs JS/CSS/optimized images).
- **Sitemap**: removed noindex legal pages (Search-Console conflict), added `/parks` and
  `/search`; blog entries/hreflang now only for locales with a real translation.
- **Blog EN-fallbacks** (`/de/blog/<en-slug>` etc.): canonical now points to the EN original;
  no longer advertised via hreflang, sitemap, or IndexNow.
- **Localized 404**: new `app/[locale]/not-found.tsx` (translated, inside the site chrome)
  instead of the bare English root fallback.
- **Icons**: real 180×180 `apple-touch-icon.png` (iOS ignores SVG), manifest icons with
  correct sizes (192/512 generated from `logo-big.png`; `logo.png` was 569×683).
- **HowTo page**: Article JSON-LD added.
- **Maintenance page**: auto-recovers via 15 s health poll — previously a reloaded
  `/maintenance` showed the outage screen forever.
- **`SITE_URL`** from `i18n/config.ts` is now the single base-URL source for canonicals,
  hreflang, JSON-LD and IndexNow (was hardcoded in ~25 places).

---

## 2.10.0 (2026-06-07) – ISR cost & cold-load overhaul

Park/attraction routes were the dominant Vercel ISR-write source (write-heavy, read-light), and
cold parks loaded slowly. Reworked the render split so the server shell stays SEO-complete and cheap
while everything live/heavy loads client-side with skeletons.

### Caching / cost

- **7-day shell TTL** for park + attraction (`PARK_MAX_AGE`/`ATTRACTION_MAX_AGE = 604800`), down from
  daily — ~7× fewer time-based ISR writes. Required lifting every nested `'use cache'` MIN
  (`getCurrentYear`, `getParkSlugIndex` + `getGeoStructure`, `getParksNearLocation`) off its 1-day
  floor; verified via `next build`'s per-route `revalidate` column.
- **Lean ISR snapshot** — `leanParkForShell` strips the heavy `statistics.history` sparkline series
  from the cached/serialized shell (the live no-store poll keeps it) → smaller size-weighted writes.
- **Attraction detail client-side** — `history`/`hourlyForecast` load via the CDN-cached
  `/api/parks/.../attractions/<slug>` route, off the ISR shell.

### Cold-load

- **Prebuild top ~20 popular parks** (`generateStaticParams`) so the highest-traffic parks are warm
  with full SEO HTML on preview + prod from the first request; long-tail + attractions stay on-demand.
  (Prebuilding all ~156 overran a fresh Vercel build — too many cold park-detail fetches.)
- **Prewarm cron** (`vercel.json`, every 6 h) warms the rest of the popular set in prod + recovers
  after eviction.

### Other

- Disabled operating-park hover prefetch (prefetching a park triggered an ISR write).
- Fixed the `/api/parks/.../attractions/<slug>` CDN cache header (was clobbered by the blanket
  `/api` no-store rule).

See [caching-strategy](architecture/caching-strategy.md).

---

## 2.9.1 (2026-06-06) – Post-PPR front-end weight trim

Follow-up to the Cache Components migration after RUM showed FCP slipping into "needs
improvement". Measured on the live homepage: ~444 KB gzip JS (24 chunks), one 28 KB-gzip
render-blocking stylesheet (not inlined), and a redundant font preload.

### Performance

- **Geist_Mono dropped** — `font-mono` is aliased to Geist Sans in `globals.css`, removing a
  ~30 KB render-blocking font preload on every route. Number-heavy live spots (nowcast
  countdown) keep fixed-width digits via `tabular-nums`.
- **framer-motion code-split** — the homepage `FlipClock` countdown is now a `next/dynamic`
  import, so framer-motion (~40 KB gzip) leaves the initial bundle and only loads when an
  announcement countdown is actually live.

### Known tradeoff

- The single render-blocking stylesheet (~28 KB gzip) is **not** inlined: `optimizeCss`
  (Beasties) is Webpack-only and we keep Turbopack for `next build` (build speed). Critical-CSS
  extraction also previously caused FOUC. `build:webpack` remains for an inlined-CSS build if
  ever needed.

### Follow-ups (both since done)

- ~~ML sparkline still pulls **recharts (~100 KB)** for one line~~ — done: migrated to the
  hand-rolled SVG in `components/home/ml-sparkline.tsx`; recharts removed from the dependencies.
- ~~Header `SearchCommand` ships **cmdk** on every page~~ — done: the palette is code-split via
  `next/dynamic` in `components/search/search-bar.tsx` and only loads on first open.

---

## 2.9.0 (2026-06-05) – Next.js 16 Cache Components (PPR)

Full migration to `cacheComponents: true` (Partial Prerendering). Pages now ship as a static,
edge-cached shell with the slow/live data streamed in via `<Suspense>` holes — the park page
serves `x-vercel-cache: PRERENDER` instead of dynamic SSR (TTFB drops from ~650 ms to the edge
cache). Details: [cache-components-migration](architecture/cache-components-migration.md).

### Caching

- All API fetchers moved to `'use cache'` + `cacheLife`/`cacheTag` (replaces `withServerCache`,
  `unstable_cache`, and `next: { revalidate }`). `lib/api/server-cache.ts` removed.
- The best-days calendar keeps `unstable_cache` for its **projected** result — the raw upstream
  response (~2.25 MB) exceeds Next's 2 MB fetch-cache cap, which would otherwise leave the
  `'use cache'` boundary uncached.
- Cached time helpers (`lib/utils/server-time.ts`); client-only `Date.now()`/`Math.random()`
  guarded behind Suspense or `typeof window`.

### Routing

- Park route gains `generateStaticParams` (top parks prebuilt, long tail on-demand ISR) — under
  Cache Components every dynamic route must enumerate ≥1 param, else `await params` in a
  param-less placeholder shell counts as uncached data outside `<Suspense>`.

### Fixes

- Non-existent parks/attractions now return **404**, not 500 — a throw across a `'use cache'`
  boundary bypasses the caller's `catch` and surfaced as a 500.
- **Skeleton fallbacks** for the deferred, client-rendered card time bits (park-card
  schedule/countdown, show-card showtimes, attraction-card best-time) — no layout shift.

### Performance

- Weather-background canvas animation pauses when off-screen (`IntersectionObserver`).
- `dns-prefetch` for the analytics origin (the only third-party the browser contacts).

## 2.8.0 (2026-04-25) – Codebase Refactoring

### Shared Hooks (`lib/hooks/use-mounted.ts`)

- **`useMounted()`** — returns `true` after hydration (replaces `useState + useEffect` pattern across 5 components).
- **`useBrowserTimezone()`** — returns browser timezone string after mount.
- **`useBrowserNow(intervalMs)`** — returns a `Date` refreshed every `intervalMs` ms; pass `null` for one-shot (no interval). Replaces `setInterval` in `PeakHourBadge` and `ParkTimeInfo`.

### FAQ Helpers (`lib/faq/`)

- **`lib/faq/attraction-faq.ts`** — `buildAttractionFaqItems()` extracts FAQ Q1–Q4 logic from `AttractionFaqSection` and `AttractionFaqStructuredData`.
- **`lib/faq/park-faq.ts`** — `buildParkFaqItems()` (Q1–Q6) and `getParkArticleForms()` shared by `ParkFAQSection` and `faq-structured-data`.

### Shared Sparkline (`components/parks/sparkline.tsx`)

- Generic `<Sparkline points[] formatTooltip />` component with global-mousemove tooltip (portal to `document.body`).
- `WaitTimeSparkline` and `HourlyP90Sparkline` are now thin wrappers.

### Duration Formatting (`lib/i18n/time.ts`)

- **`formatDuration(diffMs, t)`** — formats milliseconds as `"Xh Ym"` / `"Xh"` / `"Ym"`. Used in `PeakHourBadge` and `ParkTimeInfo`.

### Howto Page Split (`app/[locale]/howto/`)

- `page.tsx` — metadata shell only (~236 lines).
- `_howto-ui.tsx` — shared UI atoms: `Section`, `SubSection`, `DemoBadge`, `InfoBox`, `TipBox`, `PersonaCard`, `Li`.
- `_mock-components.tsx` — demo components: `MockParkHeader`, `MockAttractionCards`, etc.
- `_live-calendar.tsx` — async server component that fetches live Phantasialand calendar data.
- `content/[locale].tsx` — per-locale content (de/en/es/fr/it/nl).

### Dead Code Removed

- `components/search/hero-search-button.tsx` — unused
- `components/home/scroll-indicator.tsx` — unused
- `components/common/truncated-text.tsx` — unused
- Removed dead `FeaturedParksSection` async function from `featured-parks-section.tsx`
- Removed `'use client'` from `glossary-background.tsx` and `glossary-inject-term.tsx`

---

## 2.7.0 (2026-03-15) – Glossary System

### Complete Glossary Launch

- **90 terms** across 7 categories: wait-times, crowd-levels, park-operations, planning, attractions, coasters, coaster-elements
- All terms with full definitions in 6 languages (EN/DE/FR/IT/NL/ES) — multi-paragraph format (`\n\n` separator), locale-appropriate park references
- Localized URL segments: `/glossary`, `/glossar`, `/glossaire`, `/glossario`, `/woordenlijst`, `/glosario`

### Design & UX

- **Random hero background** on all glossary pages (`GlossaryBackground` component, no Ken Burns animation)
- **Glass UI**: unified glass panel on overview (breadcrumb above panel; title + description + search inside); glass cards on detail page
- **Type-to-search**: typing anywhere on overview focuses the search input; ESC clears + blurs
- **Category filter pills** with instant client-side filtering
- **Detail page**: 2-column layout, multi-paragraph definition rendering, primary-color back button
- **Homepage extras on detail pages**: `NearbyParksCard`, `FavoritesSection`, `FeaturedParksSection` below each term

### Navigation

- **Header**: removed "Startseite" from desktop nav; reordered to Parks entdecken → Glossar → Anleitung
- **Homepage hero**: added glossary link ("Wichtige Freizeitparkbegriffe") next to the howto link in all 6 locales
- **Howto page**: removed `max-w-4xl` constraint — now full container width like other pages

### SEO & Indexing

- Glossary added to sitemap: 6 overview pages (priority 0.7) + ~540 term pages (priority 0.5)
- IndexNow aligned to sitemap scope: home, howto, glossary overview, parks, attractions
- Improved `generateMetadata` on both overview and detail pages: keyword-rich titles, `overviewKeywords` meta tag, locale-specific `termTitleSuffix`
- Schema.org: `DefinedTermSet` + `DefinedTerm` with `inLanguage`, `termCode`, localized descriptions

### Bug Fixes

- **Language switcher 404**: now extracts pathname from hreflang `<link>` tags instead of using full production URL — works on localhost and production
- **Breadcrumb double-locale** (`/de/de/glossar`): fixed by removing locale prefix from breadcrumb URL (next-intl `Link` adds it automatically)

→ [Glossary System](features/glossary.md) · [Sitemaps](seo/sitemaps.md)

---

## 2.6.4 (2026-03-05) – SEO: Featured Parks, Split Sitemaps, ItemList

### Featured Parks Section (Homepage)

- New `FeaturedParksSection` component on homepage — 6 locale-specific park cards with live data (status, crowd level, wait times, opening hours).
- Parks resolved from existing `geoData` (no extra API call; `CACHE_TTL.geo = 120s`).
- Locale configs based on TEA 2024 attendance data + language-market wait-time search relevance.
- Translated country names via `tGeo('countries.*')`.
- Positioned after FavoritesSection — first "browse parks" content above the fold.

### Sitemap Split (Next.js-native via `generateSitemaps()`)

- Single `app/sitemap.ts` with `generateSitemaps()` — three sub-sitemaps: `/sitemap/0.xml` (home+parks), `/sitemap/1.xml` (attractions), `/sitemap/2.xml` (geo hub pages).
- Geo hub pages (continent/country/city) were completely missing from any sitemap before — now covered with correct priorities (0.6–0.8).
- Attraction variant slugs (e.g. `taron-2`) excluded — noindex pages pointing to canonical base slug.
- Single-park city pages excluded — they 301-redirect to the park page.
- `robots.txt` references single sitemap index `/sitemap.xml` (auto-generated by Next.js).

### ItemList Structured Data

- Added `ItemListStructuredData` to `/parks` overview page (continents). All listing levels now have ItemList schema.

### Docs

- New: [docs/seo/featured-parks.md](seo/featured-parks.md) — how to update park lists, slug collision notes, SEO rationale.
- New: [docs/seo/sitemaps.md](seo/sitemaps.md) — full sitemap strategy, priorities, exclusions.
- Updated: [docs/seo/analysis.md](seo/analysis.md) — completed items marked done, open items updated.

→ [SEO Analysis](seo/analysis.md) · [Featured Parks](seo/featured-parks.md) · [Sitemaps](seo/sitemaps.md)

---

## 2.5.12 (2026-02-08) – Docs vs Code alignment

- **URL helpers:** Added `getParkUrlFromAttractionUrl()` in `lib/utils/url-utils.ts`; use in `nearby-parks-card` instead of manual `split('/attractions/')`. Park URLs from API now always go through `convertApiUrlToFrontendUrl()`.
- **Translation helpers:** Replaced `t(\`countries.${slug}\`)` / `t(\`continents.${x}\`)`with`translateCountry`/`translateContinent`across geo pages (parks, continent, country, city, park, attraction). Missing keys are now logged via`logMissingTranslation`.

→ [Translation System](i18n/translations.md), [Routing & URLs](architecture/routing-and-urls.md), [Notes for Sessions](development/notes-for-sessions.md)

---

## 2.5.5 (2026-01-25) – 404 prevention

- Redirect logic for malformed URLs (e.g. missing city segment).
- Nearby Parks use `convertApiUrlToFrontendUrl(url)` instead of building from name fields.

→ [Routing & URLs](architecture/routing-and-urls.md), [Troubleshooting](troubleshooting/common-issues.md)

---

## 2.5.6 (2026-01-25) – Link prefetch

- Prefetch only when `status === 'OPERATING'` for park/attraction links.
- `prefetch={false}` for header/footer and discovery/geo cards.

→ [Routing & URLs – Link Prefetching](architecture/routing-and-urls.md#link-prefetching)

---

## P50 / "Normal" display

- API returns `moderate` for typical day (P50 baseline); frontend displays **"Normal"** (green) in all locales.

→ [Backend Integration – Crowd Levels](api/backend-integration.md#crowd-levels-p50--normal), [Backend crowd-levels doc](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/crowd-levels.md)

---

## Related

- [README](README.md) – Doc index
- [Conventions](development/conventions.md) – Key rules
