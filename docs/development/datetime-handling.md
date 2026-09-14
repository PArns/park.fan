# Date & Time Handling (Park Timezone)

## Golden rule

**Never use "today" or schedule dates based on server or browser time alone.**

Parks are in different timezones. When it is 10:00 in Berlin (Phantasialand open), it can be 01:00 in Los Angeles (Disneyland closed). Schedule and "today" must be derived from the **park's timezone**.

---

## Park timezone

The API provides `park.timezone` (e.g. `Europe/Berlin`, `America/New_York`). Use it for:

- "Today" when filtering schedule or calendar
- Displaying current time on the park page (`ParkTimeInfo`, `LocalTime`)
- Comparing dates (e.g. is this day "today" in the park?)

---

## Getting "today" in park timezone

**Wrong:** Using server/browser date only.

```ts
const today = new Date().toISOString().split('T')[0]; // UTC date – wrong for park
```

**Correct:** Use the park timezone.

```ts
import { formatInTimeZone } from 'date-fns-tz';

const timeZone = park.timezone || 'UTC';
const todayStr = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');
// Use todayStr to filter schedule: schedule.find((s) => s.date === todayStr)
```

Alternative (no date-fns-tz):

```ts
const todayStr = new Date().toLocaleDateString('en-CA', {
  timeZone: park.timezone,
}); // "YYYY-MM-DD"
```

---

## Date-only values (schedule, calendar, holidays)

Schedule and calendar days use **date-only** strings (`YYYY-MM-DD`). They mean "that calendar day in the park's timezone".

- **Compare with "today":** Use today in park timezone (see above), then `s.date === todayStr`.
- **Do not** parse with `new Date("2025-12-25")` for comparison – that is midnight UTC and can shift the calendar day in other timezones.

**Good:**

```ts
const todayStr = formatInTimeZone(new Date(), park.timezone, 'yyyy-MM-dd');
const todaySchedule = park.schedule?.find((s) => s.date === todayStr);
```

**Bad:**

```ts
const d = new Date(scheduleItem.date); // Can shift day at timezone boundaries
```

---

## Displaying times (current time, showtimes, wait time updates)

Use the park timezone when rendering times:

- **`LocalTime`** component: pass `timeZone={park.timezone}`.
- **`ParkTimeInfo`**: receives `timezone={park.timezone}` and uses it for live time.
- **date-fns-tz:** `formatInTimeZone(date, park.timezone, 'HH:mm')` or similar.

### Calendar hours (`CalendarDay.hours.openingTime` / `closingTime`)

These are **UTC ISO strings** (e.g. `2026-03-30T07:00:00.000Z`). Always convert using the park timezone — **never** use `format(parseISO(...), 'HH:mm')` from plain `date-fns`, which would render UTC time on the server.

```ts
import { formatInTimeZone } from 'date-fns-tz';

// ✅ Correct — shows local park time (e.g. 09:00 for Europe/Berlin UTC+2)
const open = formatInTimeZone(day.hours.openingTime, timezone, 'HH:mm');
const close = formatInTimeZone(day.hours.closingTime, timezone, 'HH:mm');

// ❌ Wrong — renders UTC time on the server
import { format, parseISO } from 'date-fns';
const open = format(parseISO(day.hours.openingTime), 'HH:mm');
```

The timezone comes from `IntegratedCalendarResponse.meta.timezone` (or `park.timezone`).

### Hourly predictions (`CalendarDay.hourly[].hour`)

A **UTC** hour of day, 0–23 — not the park's local hour. Measured at 11:42 UTC on 2026-09-14:
Phantasialand (`Europe/Berlin`, opens 07:00Z), Alton Towers (`Europe/London`, 09:00Z) and
Toverland (`Europe/Amsterdam`, 08:00Z) all answered `11 12 13 14 15` for today — the current UTC
hour, not the local one — and tomorrow's series starts at each park's UTC opening hour rather than
its local one.

It is a bare number, not an ISO string, so there is no `Z` to warn the next reader. Build the
instant first:

```ts
import { formatInTimeZone } from 'date-fns-tz';
import { hourlyPredictionInstants } from '@/lib/utils/calendar-utils';

// ✅ Correct — 11 UTC reads as 13 for a park in Europe/Berlin
const instants = hourlyPredictionInstants(
  day.date,
  hourly.map((h) => h.hour),
  timezone
);
const label = formatInTimeZone(instants[i], timezone, 'HH');

// ❌ Wrong — prints the API's UTC hour on a park-local calendar
const label = `${h.hour}`;
```

**The timezone is not optional, and not only for the label.** `day.date` is a calendar day in the
park's timezone and the hours are UTC, so the two calendars are a whole day apart at the edges: the
park-local `2026-09-15` in `Asia/Tokyo` begins at `2026-09-14T15:00Z`, and its hour `20` sits on the
UTC day _before_ the one the date names. A label survives that (the hour is right either way); a
comparison against the clock does not, which is what `upcomingHourlyPredictions` does when it drops
the bars whose hour has ended.

---

## Where we use it

| Place                   | Usage                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Park page               | Today's schedule: `toLocaleDateString('en-CA', { timeZone: park.timezone })`                 |
| FAQ / structured data   | `formatInTimeZone(now, timeZone, 'yyyy-MM-dd')` for today                                    |
| Calendar (day cells)    | `formatInTimeZone(day.hours.openingTime, timezone, 'HH:mm')` — timezone from `meta.timezone` |
| Calendar (hourly chart) | `hourlyPredictionInstants(day.date, hours, timezone)` → `formatInTimeZone(…, 'HH')`          |
| Calendar utils          | `lib/utils/calendar-utils.ts`: `getParkTime`, `toZonedTime`, `formatInTimeZone`              |
| ParkTimeInfo, LocalTime | `timeZone={park.timezone}`                                                                   |

---

## Related

- [Date & Time Handling (API)](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/development/datetime-handling.md) – Backend rules (same concepts)
- [Troubleshooting – Wrong park timezone](../troubleshooting/common-issues.md#wrong-park-timezone--today-incorrect)
- [Calendar status](../api/calendar-status-closed.md) – Calendar day status and display
