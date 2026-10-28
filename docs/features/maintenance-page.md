# The maintenance page

What a reader sees while api.park.fan is unreachable, and how the site leaves that state again.
Open this page before changing how an API failure is classified, the locale error boundary or
`/maintenance`.

## From a failed fetch to `/maintenance`

1. **Classification** (`apiFetch`, `lib/api/client.ts`). A non-OK answer throws `ApiError`. A 502,
   or a body carrying Cloudflare's tunnel error 1033 (usually with a 530), sets `isMaintenance` and
   the digest `API_MAINTENANCE_1033` (`API_MAINTENANCE_DIGEST`). The digest is the signal because
   production redacts a server error's message but keeps a custom digest. A timeout (15 s,
   `UPSTREAM_TIMEOUT_MS`) or a network error is not classified as maintenance. At runtime nothing is
   retried; during a build a 429, 502, 503, 504 or network failure is retried for up to 60 s from
   the first failure (`BUILD_RETRY_WINDOW_MS`).
2. **Propagation.** `catchNonFatal` turns an optional fetch's failure into `null` but rethrows a
   maintenance error, so an outage is not rendered as a page with its optional parts missing.
   `nullOnNotFound` rethrows everything but a 404.
3. **The boundary** (`app/[locale]/error.tsx`) recognizes the digest (or `1033` in the message under
   `next dev`), renders `MaintenancePage` at once so nothing flashes, and replaces the URL with
   `/maintenance`. Every other error gets the generic error page with a retry button.

Only an error thrown while rendering under `[locale]` gets there. A failed client query shows its
own component's error state, and an API route answers its own failure status.

## `/maintenance`

`app/[locale]/maintenance/page.tsx`, static per locale and `noindex`, renders `MaintenancePage`
(`components/maintenance-page.tsx`): a full-screen card with the logo and two strings from
`common` (`maintenanceTitle`, `maintenanceDescription`).

Because the route is static it would show the outage for ever, so it polls
`/api/parks/popular?limit=1` every 15 s (`RECOVERY_POLL_MS`) and leaves with
`location.replace('/')`, a full navigation, once that answers 200. That route reads
`getPopularParks`, which goes through Next's Data Cache (`revalidate: 1800`), so an entry cached
before the outage can answer 200 while the API is still down; the page then lands on `/` and, if
that render fails, comes back here.
