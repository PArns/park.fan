# A request no cache can share goes to the API directly (REQUIREMENT)

**A browser request whose answer belongs to one visitor is addressed through `browserApiUrl()`
(`lib/api/client.ts`), never as a literal `/api/…` path.** These are nearby (`fetchNearby`,
`lib/nearby/fetch-nearby.ts`), favorites (`lib/api/favorites.ts`), trips (`lib/planner/trip-sync.ts`,
the shared-plan page) and push (`lib/push/`, `lib/planner/push-repoint.ts`,
`lib/planner/use-push-subscription.ts`).

With `NEXT_PUBLIC_API_DIRECT=1` the request goes to api.park.fan and never reaches Vercel. With the
flag off it goes to the relay route that mirrors the API path under `/api/` (`/v1/trips/<id>` →
`/api/trips/<id>`); nearby is the one relay under another name, so its call names `/api/nearby`.

- **A cached route stays a relay.** `/api/search`, `/api/parks/…`, `/api/parks/live` and the rest
  answer with `CDN-Cache-Control`, so the edge serves nearly every request. Calling api.park.fan for
  them would move those hits onto the API's own Cloudflare zone, which ignores `Vary: Origin`: it
  keeps whichever copy it stored first, and a copy stored for a server-side caller carries no
  `Access-Control-Allow-Origin`. Admin, ML and contribute stay relays because they carry a secret.
- **A direct GET sends no request headers.** A `Content-Type` on a cross-origin GET triggers an
  `OPTIONS` preflight before every request.
- **The card photos the relay attached come from `loadCardImageMap()`** (`lib/media/card-images.ts`,
  `/api/card-images`, prerendered at build, 2.6 KB brotli). Relays and direct calls run the same
  transforms on it (`withNearbyCardImages`, `favoritesForCards`), so a card gets the same photo
  either way.
- **A `?sim=` nearby simulation takes the relay**: it overrides the coordinates on the server.

## Why

A relay for an answer no cache can share starts a function on every request and holds it open for as
long as the backend takes: an invocation, active CPU, memory and origin transfer. On 2026-10-20 every
function on the team together cost 0.43 $ a day, so this is single dollars a month, and it is the
part with no reason to exist. Moving the photo lookup to the browser pays only where it lets the
function go entirely: on the server it costs 17 µs for 40 rides.

## Turning it on

1. api.park.fan must allow the origin. The backend allows `https://park.fan` and
   `https://www.park.fan` by default (`buildCorsOptions`, `src/common/cors/cors.config.ts` in
   v4.api.park.fan). A preview needs `CORS_ORIGINS` to include `https://park-*-arns.vercel.app`; the
   variable replaces the default list, so it names park.fan again.
2. Set `NEXT_PUBLIC_API_DIRECT=1` in Vercel, Preview first. It is read at build time, so it takes a
   new deployment.
3. Check in the network panel that the nearby request goes to `api.park.fan` and answers with
   `access-control-allow-origin`, and that a starred park still shows its photo.

With the flag on before the backend allows the origin, the browser refuses every one of these
answers: no nearby parks, no favorites, no trip sync, no push. With it on, the layout adds a
`<link rel="dns-prefetch">` for the API origin after load.

## Check

`pnpm test:direct-api` finds every `browserApiUrl('/v1/…')` in the app and fails when a path has no
relay route, because that path would 404 with the flag off. The backend's side:
[`docs/deployment/cors.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/deployment/cors.md).
