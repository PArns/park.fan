# Weather day chart is built around the park's hours (REQUIREMENT)

The hourly weather chart's time axis is **piecewise linear**: an open hour is drawn
`OPEN_HOUR_RATIO` (4×) as wide as a closed one, and **both kinks sit exactly on the dashed borders
of the opening-hours band**. A change of slope the eye cannot account for reads as weather, so it
has to land on a line that is already there and labelled with the opening time.

- **Geometry is pure and lives in `lib/utils/weather-chart-axis.ts`**, never in the component. It
  works in a continuous point index, never in hours since midnight, because on a DST day
  `points[i]` is not the `i`-th hour.
- **A park with no OPERATING row for today** (about a quarter of the catalogue on a given day) keeps
  the linear axis: `buildDayScale` returns `null` and every formula reduces to the linear one.
- **The chart owes the card 143 px** whatever it draws, so every tick and label is out of flow and
  `whitespace-nowrap` ([the axis row](../features/weather-day-chart.md#the-axis-row)).
- **Tick density is a container query on the chart**, not a `sm:` breakpoint: `/ui` renders the card
  three to a row, and a 355 px chart at a 1280 px viewport must not get a desktop's labels.

## Why

The warp takes the median park's opening hours from 42 % of the width to 74 %, which is what makes
room for hour-by-hour ticks and temperature readings inside the visit.

## Check

`pnpm test:weather-chart-axis` asserts the geometry, including the linear fallback. Background:
[the weather card's day chart](../features/weather-day-chart.md).
