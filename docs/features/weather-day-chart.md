# The weather card's day chart

`components/parks/weather-hourly-chart.tsx` draws today's hour-by-hour weather inside the weather
card: a temperature curve, rain bars beneath it, a "now" marker, severe-weather bands, and an hour
axis. This page is about the one thing that makes it different from every other hourly weather
chart — **its time axis is not linear** — and about the box it has to fit in.

Geometry lives in `lib/utils/weather-chart-axis.ts` as pure functions, tested by
`pnpm test:weather-chart-axis`. The component only renders.

---

## Why the axis is warped

A visitor reads this chart to plan a day at a park, and the hours that matter are the ones the park
is open. On a linear day axis those hours get whatever share of the width they happen to occupy:
for the median park in the catalogue (10 h of opening hours) that is **42 %**, and the night takes
the rest. Every label, every reading, every bit of curve a visitor actually cares about was
squeezed into a bit less than half the box.

So the axis is piecewise linear with two kinks: an open hour is drawn `OPEN_HOUR_RATIO` (4)× as
wide as a closed one. The median park's opening hours go from 42 % to **74 %** of the width — 7.4 %
per open hour instead of 4.17 % — which is what buys room for hour-by-hour ticks and a few
temperature readings inside the visit.

**Both kinks sit exactly on the dashed borders of the opening-hours band.** That is not decoration.
A change of slope the eye cannot account for reads as weather — a temperature curve that suddenly
steepens looks like a cold front. Landing the kink on a line that is already there, and labelling
that line with the opening time, is what keeps it readable. It is also why a smooth fisheye falloff
was not used: there is no line to hang it off.

### Numbers

| Opening hours              | open h | share | per open hour | per closed hour |
| -------------------------- | ------ | ----- | ------------- | --------------- |
| linear (today, any)        | —      | —     | 4.17 %        | 4.17 %          |
| 10:00–20:00 (median)       | 10     | 74 %  | 7.41 %        | 1.85 %          |
| 09:00–18:00 (Europa-Park)  | 9      | 71 %  | 7.84 %        | 1.96 %          |
| 17:00–22:30 (Ferrari Land) | 5.5    | 54 %  | 9.88 %        | 2.47 %          |
| 08:00–00:00 (Disneyland)   | 15.5   | 80 %  | 5.16 %        | 2.35 %          |

The 80 % is `MAX_OPEN_SHARE`, the only cap that bites in practice.

### When it stays linear

`buildDayScale` returns `null` — the identity axis, the chart exactly as it was — whenever the warp
would be pointless or grotesque:

- **no OPERATING schedule for today.** About a quarter of the 212 parks on any given day: closed,
  `UNKNOWN`, or nothing but an `INFO` entry. This is the common case and it is deliberately
  untouched, down to the every-third-hour ticks.
- the opening instant is not today's local date (a stale schedule row);
- a park open around the clock, or a window over `MAX_OPEN_HOURS` (21 h);
- a window under `MIN_OPEN_HOURS` (3 h) — too little curve to expand;
- a gain under `MIN_GAIN` (6 % of the width) — not worth the distortion.

A warp can never make the opening hours **narrower** than a linear axis would: `share` is floored at
the linear share after the caps are applied.

---

## Index coordinates, not hours

Everything works in a continuous index `s ∈ [0, n]` over the hourly points, never in
hours-since-midnight. Open-Meteo returns the day it is asked for, so on a DST changeover `n` is 23
or 25 and `points[i]` is not the `i`-th hour. `indexForMinute()` maps a wall-clock minute onto that
axis; on the autumn changeover the repeated hour resolves to its later occurrence, on the spring one
the skipped hour maps onto the start of the hour that replaced it.

Column `i` spans `[i, i + 1]` and its data point sits at `i + 0.5`. That half-hour shear is not new
— it is the centre-of-hour convention the chart has always drawn, and keeping it means the null
scale reduces to exactly the old `((i + 0.5) / n) * 100`. It is also why `DayScale.sOpen` for a
09:00 opening is `9.5` and not `9`: the band border, the kink and the "09" tick have to be the same
x.

Two consequences worth knowing before touching the file:

- **The spline's horizontal control points are clamped into their segment.** With even spacing the
  clamp never binds, so the curve is unchanged; with a 1.96 %-wide night hour meeting a 7.84 %-wide
  open one, the unclamped Catmull-Rom tangent lands past the segment's own end and draws a cusp.
- **The live-temperature splice filters its neighbours by index, not by percentage.** The old
  `100 / n / 3` test assumed equal columns and deletes both neighbours of a "now" that falls in a
  compressed night column.

---

## The axis row, and the 143 px contract

The chart is **143 px tall, always**: `h-28` plot (112) + `mt-1` (4) + a fixed `h-[27px]` axis row.
That is the box `weather-card.tsx` reserves while the two client queries behind the chart are still
out, and it must not move — see
[system-overview §5](../architecture/system-overview.md#5-a-streamed-section-owes-the-page-its-height-requirement).

The axis used to be a flex row of 24 equal cells. On a 390 px phone each cell is ~13 px wide, and
German renders `"14 Uhr"`, not `"14"` — so the labels wrapped to a second line and the chart came
out **154.5 px** against a 143 px reservation, in four of six locales, on every park with weather.
Every tick group is now out of flow and `whitespace-nowrap`, so the row's height cannot depend on
how many ticks there are, how wide their labels are, or which locale is rendering.

Measured with the fix in place, mobile / `sm` / desktop all report exactly 143 px.

### Which hours get a tick

`buildAxisTicks` accepts candidates in priority order and drops any that would crowd one already
accepted. Two ticks have to clear half of each label, so a pair of ordinary hours needs the tier's
budget and a spelled-out opening time (`"9:30 AM"`) a third more.

1. **Opening and closing**, at the band's two borders, with a door icon and the exact time in the
   primary colour. This is what replaces the signal the band's width used to carry: the visitor
   reads `09 Uhr … 18 Uhr` instead of inferring it.
2. **Hours inside the window**, on a regular grid of round hours whose step is derived from the
   actual column width.
3. **Hours outside it**, where every hour is a candidate and the spacing rule alone decides — the
   compressed segments are short enough that a step would round away the one label they have room
   for.

### Two densities, decided by the chart, not the viewport

Ticks come in two tiers. Tier 0 always renders; tier 1 is `hidden` until the chart itself is 440 px
wide, via a **container query** (`@container/weatherchart`), not a `sm:` breakpoint. The difference
is not academic: the `/ui` showcase renders this card three to a row, so at a 1280 px viewport its
charts are 355 px wide and a viewport breakpoint would have packed a desktop's worth of labels into
a phone's worth of space. Both tiers are in the DOM and CSS picks between them, so the row's height
is the same either way and there is no hydration branch.

The tier budgets (10.5 % and 6.5 %) are each about 30 px at their tier's minimum width, which is
what the widest hour label any locale produces needs at `text-[9px]`.

---

## What else is drawn inside the visit

**Temperatures.** Beyond the day's min and max, up to five more readings, three of them on a narrow
chart. The two ends of the visit come first — what it is like on arrival and when you leave are the
readings the whole change is for, they sit on the band's borders, and they are the endpoints the
simplification below can structurally never pick. The rest is Douglas-Peucker on the in-window
curve: label the hour furthest from the polyline through the hours already labelled, stop when that
distance drops under a tolerance that scales with the day's own range. A day that just warms up
steadily therefore gets nothing beyond its two ends — that is the right answer, not a missing
feature. A candidate is also dropped when it would print a number that reads the same as a label
within three gaps of it: "32°" a screen-third away from "33°" is a second label carrying no second
fact.

None of this depends on the current time. The set would otherwise reshuffle on every minute tick.
Only the "Now" label is clock-dependent, and it yields to everything else — the live temperature is
already set in `text-3xl` two rows up in the same card.

**Rain.** Each hour keeps its own bar. On top of that, the two wettest **runs** of consecutive wet
hours get a 3 px rule along the baseline, and the hour labels inside them turn sky-blue. Under
compression a night hour is a few pixels wide, so four consecutive drizzle bars read as noise rather
than as "it rains all morning" — and unlike a tooltip, a drawn rule says so on a phone, where Radix
never opens one. A single wet hour is left to its bar.

**Storm, hail, thunderstorm.** Unchanged from before, from the live nowcast, with one addition: a
band is never narrower than 2.5 % of the chart, so a 20-minute squall inside a compressed night hour
is still a band and not a hairline. Official DWD/MeteoAlarm warnings are deliberately **not** drawn
here — `WeatherWarningBanner` already renders them above this card, their windows routinely span
days, and a full-width tint would say nothing the banner does not.

---

## Accessibility

All 24 hours keep their own column, their own `aria-label` and their own tooltip, however narrow the
compression makes them. Nothing is aggregated away: `@radix-ui/react-tooltip` bails out on
`pointerType === 'touch'`, so on a phone the `aria-label` is the only channel there is. Everything
this change adds is either drawn (the rain rule, the recoloured hours, the band-edge times, the
temperature labels) or in an `aria-label`; the two tooltips it adds are a desktop bonus.

The opening-hours band carries `role="img"` and reads `"Öffnungszeiten: 09:00 – 18:00"`. The two
band-edge ticks carry a tooltip with the same line plus `parks.weather.compressedAxisHint`, which is
where the compression is explained in words.

---

## Two costs, accepted

- The compressed night draws overnight cooling at roughly four times its true gradient. The dashed
  border landing on the same x as the slope change is the whole mitigation.
- Two parks no longer share an x-scale, so curve shapes stop being comparable park to park. Fine for
  a per-park widget; it would not be for a comparison view.

---

## Related

- [system-overview §5](../architecture/system-overview.md#5-a-streamed-section-owes-the-page-its-height-requirement) — why the height is fixed
- [Date & Time Handling](../development/datetime-handling.md) — park timezone and "today"
- `pnpm test:weather-chart-axis` — the geometry's unit tests
- `pnpm measure:cls` — layout-shift inventory
