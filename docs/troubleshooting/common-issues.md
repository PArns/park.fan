# Common issues

Symptoms that come up repeatedly in development, with their cause and fix. Open it when something
looks broken before digging into the code.

## Broken links (404s from malformed URLs)

**Symptom:** a URL such as `/parks/europe/germany/phantasialand` (city missing) or one with an old
city slug answers 404.

**Cause:** a link built by hand from geo names instead of the API's slugs, or an old external link.

**Fix:** build links with `convertApiUrlToFrontendUrl(url)` or the builders in
`lib/utils/url-utils.ts`, never from `city`/`country` name fields. Old and malformed park URLs are
redirected by `lib/utils/redirect-utils.ts` and the static rules in `next.config.ts`; see
[routing and URLs](../architecture/routing-and-urls.md#redirect-logic-404-prevention).

## Translations missing or showing the key

**Symptom:** the UI shows `parks.status` instead of "Open".

**Cause:** a key missing from `messages/{locale}.json`, a typo in the namespace or key, or a client
component reading a namespace its route does not ship.

**Fix:**

1. `pnpm validate:translations` checks the keys across all six locales.
2. `pnpm check:client-messages` checks that each route ships the namespaces its client components
   read ([translations are routed, not bundled](../rules/translations-are-routed-not-bundled.md)).
3. `pnpm crawl:translations:live` crawls a running site (`--url=`, default `localhost:3000`) for
   untranslated keys.

## Search fails with a CORS error

**Cause:** the browser called api.park.fan directly. Search goes through the `/api/search` relay;
only nearby, favorites, trips and push may go direct, and only with `NEXT_PUBLIC_API_DIRECT=1`
([backend integration](../api/backend-integration.md)).

## Wrong park timezone / "today" incorrect

**Symptom:** the schedule or "today" shows the wrong day for a park in another timezone.

**Cause:** the server's or the browser's date was used instead of the park's.

**Fix:** derive the park's day with `parkDayOf(now, park.timezone)` (`lib/utils/park-day.ts`) and
compare `YYYY-MM-DD` strings; never parse a schedule date with `new Date(dateStr)`. See
[date and time handling](../development/datetime-handling.md).

## ARIA hidden / focusable element warnings

**Symptom:** the Vercel Toolbar's accessibility check reports "ARIA hidden element must not contain
focusable elements" while search or the mobile sheet is open.

**Cause:** an open Radix dialog sets `aria-hidden` on the rest of the page, header and footer
included.

**Fix:** run the audit with every dialog closed; with one open the warning is expected.

## Testing in-park features from a desk

`?sim=` (a visitor in a park) and `?state=` (a park in an unusual state) work on local dev and
preview deployments; in production only the compass demo does. See
[flags and debug parameters](../development/flags-and-debug.md).

## Related

- [Development setup](../development/setup.md)
- [Date and time handling](../development/datetime-handling.md)
- [Backend integration](../api/backend-integration.md)
