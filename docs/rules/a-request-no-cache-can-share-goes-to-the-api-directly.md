# A request no cache can share goes to the API directly (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

## The rule

**A browser request whose answer belongs to one visitor is addressed through `browserApiUrl()`
(`lib/api/client.ts`), never as a literal `/api/…` path.** These are nearby (`fetchNearby`,
`lib/nearby/fetch-nearby.ts`), favorites (`getFavorites`, `lib/api/favorites.ts`), trips
(`lib/planner/trip-sync.ts`, the shared-plan page) and push (`lib/push/*`, `lib/planner/push-*`).

With `NEXT_PUBLIC_API_DIRECT=1` the request goes to api.park.fan and never reaches Vercel. With the
flag off it goes to the relay route, which mirrors the API path under `/api/` (`/v1/trips/<id>` →
`/api/trips/<id>`); nearby is the one relay under another name, so its call names `/api/nearby`
itself. `pnpm test:direct-api` finds every `browserApiUrl('/v1/…')` in the app and fails when a
path has no relay route, because that path would 404 with the flag off.

## Why only these

A relay for an answer no cache can share starts a function on every request and holds it open for
as long as the backend takes: an invocation, active CPU, provisioned memory and origin transfer,
roughly 1.50–4 $ per million requests. On 2026-10-20 every function on the team together cost
0.43 $ a day (invocations 0.05, active CPU 0.29, memory 0.10), with page renders in the same line,
so this is single dollars a month — and it is the part that has no reason to exist.

**A cached route stays a relay.** `/api/search`, the park routes under `/api/parks/…`,
`/api/parks/live` and the rest answer with `CDN-Cache-Control`, so Cloudflare and Vercel's edge
serve nearly every request and the function runs on a miss. Calling api.park.fan for them instead
would move those hits onto the API's own Cloudflare zone, and that breaks CORS: Cloudflare ignores
`Vary: Origin`, so it keeps whichever copy it stored first, and a copy stored for a server-side
caller carries no `Access-Control-Allow-Origin`. The backend's
[`docs/deployment/cors.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/deployment/cors.md)
says the same from its side. Admin, ML and contribute stay relays because they carry a secret (the
admin session, `x-auth-key`, Turnstile).

## What a direct call does itself

- **No request headers on a GET.** A `Content-Type` on a cross-origin GET makes it non-simple, and
  the browser sends an `OPTIONS` preflight before every one of them. A write with a JSON body has a
  preflight anyway.
- **The card photos the relay attached.** The media manifest is server-only, so the browser loads
  `/api/card-images` once (`loadCardImageMap()`, `lib/media/card-images.ts`): every park and ride
  card photo with its focal point, prerendered at build, 10.6 KB raw and 2.6 KB brotli for 9 parks
  and 100 rides on 2026-10-23. Both the relays and the direct call run the same transforms on it,
  `withNearbyCardImages` and `favoritesForCards`, and the server's `enrichParksWithImages` reads
  the same map, so a card gets the same photo whichever way its data came.
- **A `?sim=` nearby simulation takes the relay.** It overrides the coordinates on the server.

Moving the photo lookup to the browser pays only where it lets the function go entirely. On the
server it costs 17 µs for 40 rides and 0.7 µs for 6 parks (measured 2026-10-23), so taking it off a
cached route would save nothing and add the map to a page that does not need it.

## Turning it on

1. api.park.fan must allow the origin. The backend allows `https://park.fan` and
   `https://www.park.fan` in production by default (`buildCorsOptions`,
   `src/common/cors/cors.config.ts`). A preview needs `CORS_ORIGINS` on the backend to include
   `https://park-*-arns.vercel.app`; the variable replaces the default list, so it names park.fan
   again.
2. Set `NEXT_PUBLIC_API_DIRECT=1` in Vercel, for Preview first. It is read at build time, so it
   takes a new deployment.
3. Check in the browser's network panel that the nearby request goes to `api.park.fan` and answers
   with `access-control-allow-origin`, and that a starred park still shows its photo.

With the flag on before the backend allows the origin, the browser refuses every one of these
answers: no nearby parks, no favorites, no trip sync, no push. The layout then also adds a
`<link rel="dns-prefetch">` for the API origin, as it does for Umami; both are asked for only after
load, so a preconnect would compete with the page's own assets for nothing.
