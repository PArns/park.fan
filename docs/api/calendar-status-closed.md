# API: Calendar Days as "Closed" vs "Opening Hours Not Yet Available"

## Context

**Endpoint:** `GET /v1/parks/{continent}/{country}/{city}/{parkSlug}/calendar?from=...&to=...`

In the frontend (Crowd Calendar), days with `status: "UNKNOWN"` are displayed as **"Opening hours not yet available"**, days with `status: "CLOSED"` as **"Closed"** (including red "Closed" indicator in the legend).

Currently the API returns for many days (e.g. Phantasialand February 2026) both `"status": "UNKNOWN"` and `"crowdLevel": "closed"`. This is inconsistent: if we classify the day as "closed", the user should see "Closed", not "Opening hours not yet available".

## Desired Behavior

- **`status: "CLOSED"`** should be set when the park is **known to be closed** on that day – regardless of whether opening/closing times exist.
- **`status: "UNKNOWN"`** only when it is **unclear** whether the park is open or closed (e.g. missing data, date outside planned season, not yet published).

## Instructions for API Team

1. **Consistency with `crowdLevel`:**
   - When `crowdLevel: "closed"` is set for a day (e.g. because season closed, no opening hours published, or explicitly marked closed), that same day should have **`status: "CLOSED"`**, not `"UNKNOWN"`.
   - This makes the frontend display "Closed" (with red icon) instead of "Opening hours not yet available".

2. **No opening hours, but park known closed:**
   - If business logic classifies a day as closed (e.g. winter break, closed day, unpublished season), return `status: "CLOSED"` even when `openingTime`/`closingTime` or `hours` are missing.

3. **`UNKNOWN` only for genuine uncertainty:**
   - Use `status: "UNKNOWN"` only when it cannot be determined whether the park is open or closed (e.g. missing or ambiguous data sources).

## Example (current vs desired)

**Current (February 2026, Phantasialand):**

```json
{
  "date": "2026-02-01",
  "status": "UNKNOWN",
  "crowdLevel": "closed",
  ...
}
```

→ Frontend: "Opening hours not yet available" (gray question mark).

**Desired:**

```json
{
  "date": "2026-02-01",
  "status": "CLOSED",
  "crowdLevel": "closed",
  ...
}
```

→ Frontend: "Closed" (red icon, as in legend).

## Affected Endpoint

- `GET /v1/parks/{continent}/{country}/{city}/{parkSlug}/calendar`
- Relevant field: `days[].status` (`OPERATING` | `CLOSED` | `UNKNOWN`).

---

## Frontend Display Rules

How to show each calendar day status (Crowd Calendar and related UI):

| status        | Meaning                                                          | Display                                                                               |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **OPERATING** | Park has opening hours from source.                              | Show opening and closing times (e.g. from `hours.openingTime` / `hours.closingTime`). |
| **CLOSED**    | Park is confirmed closed on this day.                            | "Closed" – no time range (e.g. red "Closed" in legend).                               |
| **UNKNOWN**   | No opening hours from source yet (not published or placeholder). | "Opening hours not yet available" or "Not yet published" – **not** "Closed".          |

**Rule:** UNKNOWN ≠ closed. Use CLOSED only when the park is explicitly reported closed; use UNKNOWN when schedule data is missing.

Example (TypeScript):

```ts
function getScheduleLabel(day: CalendarDay): string {
  switch (day.status) {
    case 'OPERATING':
      return day.hours
        ? `${formatTime(day.hours.openingTime)} – ${formatTime(day.hours.closingTime)}`
        : 'Open';
    case 'CLOSED':
      return 'Closed';
    case 'UNKNOWN':
    default:
      return 'Opening hours not yet available';
  }
}
```

The change requested above is only in the API logic; the frontend keeps using these display rules.

---

## Related

- [Backend Integration](backend-integration.md)
- [Backend: Calendar status (UNKNOWN vs CLOSED)](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/frontend/calendar-schedule-status.md)
