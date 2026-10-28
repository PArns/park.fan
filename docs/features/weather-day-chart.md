# The weather card's day chart

`components/parks/weather-hourly-chart.tsx` draws today's hourly weather inside the park page's
weather card: a temperature curve, rain bars, a "now" marker, severe-weather bands and an hour axis
whose time scale is **not linear**. Open this page before changing the chart or its axis.

The rule (why the axis is warped, why the kinks sit on the opening-hours band, the 143 px it owes the
card, container-query tick density) is
[weather day chart is built around the park's hours](../rules/weather-day-chart-is-built-around-the-parks-hours.md).
Geometry is pure and lives in `lib/utils/weather-chart-axis.ts`, tested by
`pnpm test:weather-chart-axis`; the component only renders.

## The warp in numbers

An open hour is drawn `OPEN_HOUR_RATIO` (4) times as wide as a closed one; the opening hours never
take more than `MAX_OPEN_SHARE` (80 %), and a closed hour never shrinks below `MIN_CLOSED_UNIT_PCT`
(1.2 %) of the width.

| Opening hours              | Open h | Share | Per open hour | Per closed hour |
| -------------------------- | ------ | ----- | ------------- | --------------- |
| linear (any)               | —      | —     | 4.17 %        | 4.17 %          |
| 10:00–20:00 (median park)  | 10     | 74 %  | 7.41 %        | 1.85 %          |
| 09:00–18:00 (Europa-Park)  | 9      | 71 %  | 7.84 %        | 1.96 %          |
| 17:00–22:30 (Ferrari Land) | 5.5    | 54 %  | 9.88 %        | 2.47 %          |
| 08:00–00:00 (Disneyland)   | 15.5   | 80 %  | 5.16 %        | 2.35 %          |

A smooth fisheye was not used because there would be no drawn line to hang its slope change on.

### When it stays linear

`buildDayScale` returns `null`, the identity axis with the old every-third-hour ticks
(`LINEAR_TICK_STEP`), whenever the warp would be pointless or grotesque:

- no `OPERATING` schedule for today (closed, `UNKNOWN`, or only an `INFO` entry), about a quarter of
  the parks on any given day;
- the opening instant is not today's local date (a stale schedule row);
- open around the clock, or a window over `MAX_OPEN_HOURS` (21 h);
- a window under `MIN_OPEN_HOURS` (3 h);
- a gain under `MIN_GAIN` (6 % of the width).

The open share is floored at the linear share after the caps, so a warp never makes the opening hours
narrower than a linear axis would.

## Index coordinates, not hours

Everything works in a continuous index `s ∈ [0, n]` over the hourly points. Open-Meteo returns the day
asked for, so on a DST changeover `n` is 23 or 25 and `points[i]` is not the `i`-th hour.
`indexForMinute()` maps a wall-clock minute onto that axis: on the autumn changeover the repeated hour
resolves to its later occurrence, on the spring one the skipped hour maps onto the start of the hour
that replaced it.

Column `i` spans `[i, i + 1]` with its point at `i + 0.5`, the centre-of-hour convention, so the null
scale reduces exactly to `((i + 0.5) / n) * 100`. That is also why `DayScale.sOpen` for a 09:00
opening is `9.5`: band border, kink and the "09" tick must be the same x.

Two consequences before touching the file:

- **The spline's horizontal control points are clamped into their segment.** With even spacing the
  clamp never binds; where a 1.96 % night hour meets a 7.84 % open one, the unclamped Catmull-Rom
  tangent lands past the segment's end and draws a cusp.
- **The live-temperature splice filters its neighbours by index, not by percentage.** A percentage
  test assumes equal columns and deletes both neighbours of a "now" inside a compressed night column.

## The axis row

The chart is 143 px tall, always: `h-28` plot + `mt-1` + a fixed `h-[27px]` axis row, the box
`weather-card.tsx` reserves while the chart's two client queries are out. Every tick group is out of
flow and `whitespace-nowrap`, so the row's height cannot depend on the number of ticks, their labels
or the locale (German renders „14 Uhr", which wrapped in a flex row of 24 cells). Mobile, `sm` and
desktop all measure exactly 143 px.

### Which hours get a tick

`buildAxisTicks` takes candidates in priority order and drops any that would crowd one already
accepted. Two ticks must clear half of each label, so two ordinary hours need the tier's gap and a
spelled-out time („9:30 AM") a third more (`HOUR_LABEL_WEIGHT`, `TIME_LABEL_WEIGHT`).

1. **Opening and closing**, at the band's borders, with a door icon and the exact time in the primary
   colour; the visitor reads the hours instead of inferring them from the band.
2. **Hours inside the window**, on a grid of round hours whose step comes from the actual column
   width (`STEP_LADDER` 1, 2, 3, 4, 6).
3. **Hours outside it**, every hour a candidate and the spacing rule alone deciding, since a step would
   round away the one label a compressed segment has room for.

Ticks come in two tiers: tier 0 always renders, tier 1 is hidden until the chart itself is 440 px wide
(`TICK_WIDE_MIN_PX`, `@container/weatherchart`). Both are in the DOM and CSS picks, so there is no
hydration branch. The tier gaps (`TICK_GAP_BASE` 10.5 %, `TICK_GAP_WIDE` 6.5 %) are each about 30 px at
their tier's minimum width, what the widest hour label in any locale needs at `text-[9px]`.

## What else is drawn inside the visit

**Temperatures** (`pickExtraTemperatureLabels`). Beyond the day's min and max, up to five more
readings (`EXTRA_LABEL_MAX`), three on a narrow chart (`EXTRA_LABEL_BASE_MAX`). The two ends of the visit
come first: arrival and departure are what the warp is for, they sit on the band's borders, and they
are endpoints the simplification can never pick. The rest is Douglas-Peucker on the in-window curve:
label the hour furthest from the polyline through the hours already labelled, until that distance drops
under a tolerance scaled to the day's own range. A day that warms steadily gets nothing beyond its two
ends. A candidate printing the same number as a label within three gaps (`EXTRA_LABEL_VALUE_GAPS`) is
dropped. None of this depends on the current time, or the set would reshuffle every minute; only the
"Now" label does, and it yields to everything (the live temperature is in `text-3xl` two rows up).

**Rain** (`findRainRuns`). Each hour keeps its bar; the two wettest runs of consecutive wet hours
(`MAX_RAIN_RUNS`, thresholds `RAIN_RUN_MM`, `RAIN_RUN_LIGHT_MM`, `RAIN_RUN_PROB`) also get a 3 px rule
along the baseline and sky-blue hour labels, because compressed night hours are a few pixels wide and
four drizzle bars read as noise. A single wet hour is left to its bar.

**Storm, hail, thunderstorm** bands come from the live nowcast and are never narrower than 2.5 % of the
chart (`MIN_BAND_WIDTH_PCT`), so a 20-minute squall in a night hour stays visible. Official DWD and
MeteoAlarm warnings are deliberately not drawn: `WeatherWarningBanner` shows them on the same page,
their windows span days, and a full-width tint would add nothing.

## Accessibility

All hours keep their own column, `aria-label` and tooltip however narrow they get.
`@radix-ui/react-tooltip` bails out on `pointerType === 'touch'`, so on a phone the `aria-label` is the
only channel; everything the warp adds is drawn or in an `aria-label`, and its tooltips are a desktop
bonus. The opening-hours band is `role="img"` and reads „Öffnungszeiten: 09:00 – 18:00"; the two
band-edge ticks carry a tooltip with that line plus `parks.weather.compressedAxisHint`, which explains
the compression in words.

## Two costs, accepted

- The compressed night draws overnight cooling at roughly four times its true gradient; the dashed
  border on the same x as the slope change is the whole mitigation.
- Two parks no longer share an x-scale, so curve shapes are not comparable park to park: fine for a
  per-park widget, wrong for a comparison view.

## Related

- [Date and time handling](../development/datetime-handling.md): park timezone and "today"
- `pnpm measure:cls`: layout-shift inventory
