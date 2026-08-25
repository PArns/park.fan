---
name: plan-a-park-visit
description: Pick a day for a theme park visit using park.fan crowd forecasts, best-day calendars, opening hours, school holidays and weather. Use when someone asks when to go rather than what the queue is now.
---

# Choosing a day on park.fan

"How long is the queue" and "when should I go" are different questions with different data
behind them. This skill is the second one.

## The hub

`https://park.fan/{locale}/best-time-to-visit` compares the parks it covers in one table: the
quietest weekday, the average wait, the ride with the longest queue. The path is localized —
`/de/beste-reisezeit`, `/fr/meilleure-periode-pour-visiter`, `/nl/beste-tijd-om-te-bezoeken`,
`/es/mejor-epoca-para-visitar`, `/it/periodo-migliore-per-visitare`.

A park can have two quiet days, and the table says both. An em dash means the data refused to
choose — too few comparable weekdays, three or more days tied at the minimum, or a "quietest"
day that is not actually below the park's own median. That is an answer: the park has no quiet
day, not that nobody looked.

## A park's own page

Further down `https://park.fan/{locale}/parks/{continent}/{country}/{city}/{park}` (fetch it
with `Accept: text/markdown`) sit the parts that answer a date:

- **Best days** — a calendar of the coming weeks with a crowd level per day, from the model
  rather than from a rule of thumb. It reaches a year ahead for year-round parks; a seasonal
  park returns closed days past its published season, which is a fact, not a gap.
- **Opening hours** per day, including the short days at the shoulders of the season.
- **School holidays** in the regions that actually feed the park — a park on a border reads two
  countries' calendars.
- **Weather**, hour by hour for today, with the park's opening hours marked.
- **Historical statistics** — average and P90 waits by month, by weekday and by hour.

## What the numbers mean before you turn them into advice

- A crowd level is a comparison of a park with itself. "Normal" at Europa-Park and "normal" at a
  small park are different queues.
- The quietest weekday is measured over the last months, so it carries the school holidays of
  those months with it. Check the holiday section for the actual date.
- "Come early" is a per-ride finding, not a rule. Some rides are flat all day; others climb
  twenty minutes between opening and noon. The ride page's typical-wait-by-hour chart is where
  that shows.
- A closed park is not a quiet park. Read the calendar's status before its crowd level.

## As data

Every one of these has an endpoint on the public API — `/best-days`, `/calendar`, `/schedule`,
`/stats`, `/stats/hourly`, `/predictions/yearly`, `/weather` under
`https://api.park.fan/v1/parks/{continent}/{country}/{city}/{park}`. See the `park-fan-data`
skill for the catalog and the OpenAPI description.
