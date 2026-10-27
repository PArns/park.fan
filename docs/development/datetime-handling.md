# Date and time handling

How "today", schedule dates and clock times are computed for a park in another timezone. Open it
before writing anything that compares a date, filters a schedule or prints a time. The backend's
side of the same rules: [API datetime handling](https://github.com/PArns/v4.api.park.fan/blob/main/docs/development/datetime-handling.md).

## The rule

**"Today" and every schedule date come from the park's timezone, never from the server's or the
browser's clock alone.** At 10:00 in Berlin it is 01:00 in Los Angeles. The API sends
`park.timezone` (`Europe/Berlin`, `America/New_York`); the calendar response carries it as
`IntegratedCalendarResponse.meta.timezone`.

```ts
import { parkDayOf } from '@/lib/utils/park-day';

const today = parkDayOf(new Date(), park.timezone); // "YYYY-MM-DD", cached formatter
const todaySchedule = park.schedule?.find((s) => s.date === today);
```

`formatInTimeZone(new Date(), park.timezone, 'yyyy-MM-dd')` from `date-fns-tz` gives the same
string. `new Date().toISOString().split('T')[0]` is the UTC date and wrong for most parks.

## Date-only values

Schedule, calendar and holiday days are `YYYY-MM-DD` strings meaning that calendar day in the
park's timezone. Compare them as strings. Never `new Date('2025-12-25')` for logic: that is
midnight UTC and moves the day at timezone boundaries.

## Times

Render every clock time in the park's timezone: `LocalTime` takes `timeZone={park.timezone}`,
`ParkTimeInfo` takes `timezone`, otherwise `formatInTimeZone(date, timezone, 'HH:mm')`.

**Calendar hours** (`CalendarDay.hours.openingTime` / `closingTime`) are UTC ISO strings
(`2026-03-30T07:00:00.000Z`). `format(parseISO(…), 'HH:mm')` from plain `date-fns` prints UTC on
the server; use `formatInTimeZone(day.hours.openingTime, timezone, 'HH:mm')`.

**Hourly predictions** (`CalendarDay.hourly[].hour`) are a bare **UTC** hour, 0–23, with no `Z` to
warn the reader. Measured 2026-09-14 at 11:42 UTC: Phantasialand, Alton Towers and Toverland all
answered `11 12 13 14 15` for today, and tomorrow's series starts at each park's UTC opening hour.
Build the instant first:

```ts
import { hourlyPredictionInstants } from '@/lib/utils/calendar-utils';

const instants = hourlyPredictionInstants(
  day.date,
  hourly.map((h) => h.hour),
  timezone
);
const label = formatInTimeZone(instants[i], timezone, 'HH'); // 11 UTC reads 13 in Europe/Berlin
```

The timezone matters beyond the label. `day.date` is a park-local day and the hours are UTC, so at
the edges they sit on different days: park-local `2026-09-15` in `Asia/Tokyo` begins at
`2026-09-14T15:00Z`, and its hour `20` lies on the UTC day before. A label survives that; a
comparison against the clock does not, which is what `upcomingHourlyPredictions` does when it drops
the hours that have ended.

## Where it is used

| Place                         | How                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| Park page                     | today's schedule via `parkDayOf(now, park.timezone)` (`lib/utils/park-day.ts`)          |
| FAQ, structured data          | `formatInTimeZone(now, timeZone, 'yyyy-MM-dd')`                                         |
| Calendar day cells            | `formatInTimeZone(day.hours.openingTime, timezone, 'HH:mm')`, zone from `meta.timezone` |
| Calendar hourly chart         | `hourlyPredictionInstants(day.date, hours, timezone)`, then `formatInTimeZone(…, 'HH')` |
| `lib/utils/calendar-utils.ts` | `upcomingHourlyPredictions`, `isServableHourlyDate`                                     |
| `ParkTimeInfo`, `LocalTime`   | the park's timezone as a prop                                                           |

Symptoms of getting it wrong: [troubleshooting](../troubleshooting/common-issues.md#wrong-park-timezone--today-incorrect).
Calendar day status (`OPERATING` / `CLOSED` / `UNKNOWN`): [calendar status](../api/calendar-status-closed.md).
