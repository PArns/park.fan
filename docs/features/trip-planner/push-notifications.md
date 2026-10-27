# Planner push notifications

The planner's notification switch: what it needs before it is offered, what "on" means and how the
plan reaches the server. Code: `lib/planner/use-push-subscription.ts`, `lib/planner/trip-sync.ts`,
`lib/planner/push-arming.ts`, `lib/planner/push-topics.ts`, `lib/planner/push-repoint.ts`,
`components/planner/planner-push-toggle.tsx`, `public/sw.js`. The server side — `/v1/trips`,
`/v1/push`, the topics, what a notification carries, quiet hours — is owned by the
API's [trips](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/trips.md) and [push](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/push.md) docs.

Ride alerts and show reminders outside the planner: [ride alerts](../ride-alerts.md).

## Never a switch that turns on and does nothing

`usePushSubscription` resolves a `PushState`: `unsupported` (no service worker / `PushManager` /
`Notification`) and `unavailable` (the deploy has no VAPID keypair: `/api/push` → `/v1/push`
answers `available: false`, never cached) hide the control; `denied` explains; `off` / `working` /
`on` are the switch. The VAPID keypair and the topic list are the API's; the frontend only reads
them from `/api/push`.

Switching on **stores the plan first, then subscribes**: a subscription with no plan behind it has
nothing to notify about. `syncTrip` (`trip-sync.ts`) creates or updates the server copy
(`POST /v1/trips`, `PUT /v1/trips/:id` through `browserApiUrl`); the trip id
(`parkfan_trip_id`) is the credential, so the plan is uploaded only while push is on, and switching
off deletes it (`forgetTrip`). While on, `startTripAutoSync` keeps the copy current (debounced 4 s,
only while a trip id is stored). A 404 on update means the trip is gone: the local id is dropped, a
new trip is created and the subscription is re-pointed (`repointPushSubscription`). Every
subscription write goes through `postSubscription` (`push-repoint.ts`): endpoint, trip id, locale,
timezone, topics.

## Topics

Which notifications a browser wants is a narrowing of the deploy's own topic ids from `/api/push`,
never a hard-coded set (`push-topics.ts`, `parkfan_planner_push_topics`; no stored narrowing means
everything the deploy offers, including topics added later). The toggle renders one checkbox per
topic (`push.topics.<id>`), and the last one may not be unticked, since a subscription with no
topics would read "on" and deliver nothing.

## "On" is a statement about the server

The browser keeps **one** push subscription per origin, shared with ride alerts and followed shows,
and a stored trip id survives a failed `POST` as well as a successful one, so neither local signal
can say the planner's push is on. There is no read to ask instead: `/v1/push/subscriptions` answers
`POST` and `DELETE` only, and the ride-alert and show-follow lists do not name a subscription's
`tripId`. So the server's 2xx is remembered against **the exact pair it was given for**
(`push-arming.ts`, `parkfan_push_armed`: endpoint + trip id), written by `postSubscription` on the
2xx and nowhere else, cleared by switching off (`forgetArmedPush`). A rotated endpoint or a replaced
trip id no longer matches, so the switch reads `off`. A failed `enable()` does **not** clear it: the
record describes a pair, not an attempt, and another tab may have armed the same pair. A pairing
that dies on the server unannounced still reads `on` until the next sync gets its 404.

`pnpm test:push-arming` pins this and the wiring; `pnpm test:trip-sync`, `pnpm test:push-timezone`
and `pnpm test:planner-push-topics` cover the sync, the timezone sent and the topic narrowing.
