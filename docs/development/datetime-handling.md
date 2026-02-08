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

---

## Where we use it

| Place                   | Usage                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| Park page               | Today's schedule: `toLocaleDateString('en-CA', { timeZone: park.timezone })`    |
| FAQ / structured data   | `formatInTimeZone(now, timeZone, 'yyyy-MM-dd')` for today                       |
| Calendar                | `lib/utils/calendar-utils.ts`: `getParkTime`, `toZonedTime`, `formatInTimeZone` |
| ParkTimeInfo, LocalTime | `timeZone={park.timezone}`                                                      |

---

## Related

- [Date & Time Handling (API)](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/development/datetime-handling.md) – Backend rules (same concepts)
- [Troubleshooting – Wrong park timezone](../troubleshooting/common-issues.md#wrong-park-timezone--today-incorrect)
- [Calendar status](../api/calendar-status-closed.md) – Calendar day status and display
