# Calendar status in the frontend (`UNKNOWN`, `CLOSED`, `scheduleCoverage`)

How the crowd calendar renders a day's `status` and `crowdLevel`, and how
`scheduleCoverage.to` bounds the calendar months the site publishes. Open it before
changing a calendar cell, the month index or the calendar sitemap. What the fields
mean — `UNKNOWN` is not closed, past `to` a `CLOSED` is our sync and not the park — is
the backend's
[calendar status contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/calendar-schedule-status.md).

The calendar pages themselves (URLs, grid, day dialog): [crowd calendar](../features/crowd-calendar.md).

## A day cell (`components/parks/park-calendar-day.tsx`)

| `status`    | label                                      | colour                                          |
| ----------- | ------------------------------------------ | ----------------------------------------------- |
| `OPERATING` | the day's crowd level, or "Keine Prognose" | the crowd colour, when the level is a real tier |
| `CLOSED`    | "Geschlossen" (`common.closed`)            | grey                                            |
| `UNKNOWN`   | "Keine Prognose" (`crowdLevels.unknown`)   | grey                                            |

- A day is coloured **only** by a real tier: `closed`, `unknown` and a missing level all
  stay grey, because an aggregate over an empty set is Ø 0 min, byte for byte a very
  quiet day.
- `isEstimated` (or `hours.isInferred`) marks reconstructed hours, in the cell and in
  `park-calendar-day-detail.tsx`.
- The wait figure is the headliner average (`headlinerForecast.avgWait`, falling back to
  `avgWaitTime`), rounded to five.
- `hasOperatingSchedule: false` keeps a park from being called "off-season": the
  schedule line (`lib/utils/schedule-utils.ts`, read by `ParkTimeInfo` and
  `park-card-schedule-footer.tsx`) only says it for a park that publishes hours.

## Months past `scheduleCoverage.to` are not published

Past `to` the API resolves unpublished days to `CLOSED`, which would render a month of
confident closures for a park that will very likely be open. So the site does not
publish those months: `parkCalendarMonthsForward(now, coverageTo)`
(`lib/parks/calendar-segments.ts`) caps the forward span at the month `to` falls in
(never beyond `PARK_CALENDAR_MONTH_SPAN.forward`, 12). The month route, its redirects
(`lib/parks/calendar-redirects.ts`), the month index (`park-calendar-month-index.tsx`)
and the calendar sitemap (`app/sitemap-calendar/[locale]/route.ts`) all ask that
function, or `isParkCalendarMonthInRange` built on it. An
absent `scheduleCoverage` falls back to the full twelve months. Pass
`scheduleCoverage.to` as `coverageTo` wherever the park payload is in scope.

A day past `to` inside a published month (the month `to` falls in) still renders a
`CLOSED` as closed; the cell does not read `scheduleCoverage`.

## Related

- [Backend integration](backend-integration.md)
- [Sitemaps](../seo/sitemaps.md) — the calendar sitemap children and the `scheduleCoverage` trim
