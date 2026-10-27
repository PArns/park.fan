# The page render is the bigger half of the API budget (REQUIREMENT)

Whatever a Server Component hands to a Client Component is serialized into the RSC payload
(`self.__next_f.push(…)` at the end of the document). It is roughly half the bytes of a park,
calendar or ride page, it is paid by **every request including the crawler's**, and it is never
re-fetched. The [poll's projection rule](api-budget-per-page.md) applies to it as well:

- **A page that renders none of a thing must not ship it.** Trim the park per route before it
  crosses the client boundary: `leanParkForShell` (`lib/api/parks.ts`) drops `comparison`,
  `baseline` and the sparkline history; `leanParkForAttractionShell` (`lib/api/parks.ts`) and
  `leanParkForCalendarShell` (`lib/api/park-live-projection.ts`) keep only what their route draws.
- **A trim that keeps the short set is an allow-list**, like `leanParkForCalendarShell`, so a field
  the API adds next month stays out by default.
- **Judge it compressed, and A/B both sides in one build.** Brotli prices repeated JSON keys at
  almost nothing, so a raw figure can flatter a change 19×. Diffing a local render against
  production measures the deploy gap as well.
- **Measure on a cache-busted URL.** A plain fetch returns what Cloudflare holds, and a stale copy
  can look like a projection that already works.

## Why

The RSC payload was 199 KB of a calendar page's 444 KB and 205 KB of a park page's 500 KB, and
nobody had weighed it. The calendar shipped twenty-two attraction fields for forty rides where its
readers used twelve; `leanParkForCalendarShell` cut −1.52 KB brotli (−2.9 %) from the route with
the most origin misses. A rule written down is not a rule applied: `comparison` and `baseline` were
named as never rendered and the poll omitted them, while the server render shipped them on every
attraction until the shell trim dropped them. **Cost follows the URL count, not the visitor count**:
the calendar and ride routes are `force-dynamic` and swept by crawlers once per URL per TTL, so they
took 9.9 K and 11 K invocations in twelve hours against the park page's 1.7 K. Start an audit from
the invocation table, not from what feels busy.

## Check

```bash
curl -sS -H 'Accept-Encoding: identity' "https://park.fan/<path>?cb=$RANDOM"
```

Join the `self.__next_f.push([1,"…"])` string literals, size each field, and brotli-diff before
against after. `pnpm test:calendar-park-projection` drives the calendar projection through its real
readers.

Background: [API budget → the other copy](../architecture/api-budget.md#the-other-copy-what-the-server-render-serializes)
has the tables, what is still heavy (restaurants, the `parks` namespace, inline SVG) and the
measuring traps.
