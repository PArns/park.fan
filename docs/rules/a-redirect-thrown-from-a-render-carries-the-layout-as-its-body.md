# A redirect thrown from a render carries the layout as its body (REQUIREMENT)

On a crawled surface, a redirect is answered in `proxy.ts` or `next.config.ts` `redirects()`, never
by `redirect()` or `permanentRedirect()` thrown from a page render. The proxy imports the rule from
the module that owns it instead of restating it (`lib/parks/calendar-redirects.ts` reads
`lib/parks/calendar-segments.ts`), and answers only the cases it can decide from the URL alone;
everything else returns `null` and falls through to the route unchanged.

- **A middleware `Location` must be absolute** (`new URL(target, request.url)`). Next parses it with
  `new NextURL(...)`, and a bare path throws `ERR_INVALID_URL`, which is a 500. Next relativizes it
  again when the host matches, so the header on the wire is the same.
- **A rule that needs a lookup stays in the render.** `findParkPageRedirect`,
  `findRelocatedParkRedirect` and `findRenamedParkRedirect` on the park, ride, city and calendar
  routes, `findMovedRideRedirect` on the ride route, the glossary's localized-segment 308 and the blog's canonical-slug redirect all need data;
  running them in the proxy would put a lookup on every request to save a body that only fires on a
  redirect.

## Why

Next catches the thrown redirect, sets the status and the header, and still renders the not-found
document through the root and locale layouts as the body (the `isRedirectError` branch in
`next/dist/server/app-render/app-render.js`), so it grows with the layout. Measured on an
out-of-range calendar month (2026-09-21): `308` with an **81,963 B** body in production,
uncompressed; in the proxy the same 308 is **66 B**. The breakdown and how many calendar URLs answer
it: [decision log](../optimization/decisions.md#2026-09-21--accepted-the-bodyless-308-three-weeks-after-it-was-deferred).

**What made the calendar hoistable.** A park's timezone only shifts which day it is, so the two
extreme zones (`Etc/GMT+12` is UTC−12, `Etc/GMT-14` is UTC+14; the POSIX sign is inverted) bracket
every park's current month, and `scheduleCoverage.to` can only shorten the forward window. A month
outside that bracket is out of range for every park. The edge months, where a park's own clock and
coverage decide, still 308 from the render. A proxy that redirected one month too far would make an
existing page unreachable with no build turning red.

## Check

`pnpm test:calendar-month` pins both edges of the proxy's window. Weigh a redirect with
`curl -sI` and `curl -s … | wc -c` on a production build.
