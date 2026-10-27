# Ride alerts and show reminders

The bells on ride and show cards: a push when a ride's wait drops under a threshold or the ride
opens again, and a push before a show starts. This page is the browser side: where the bells
render, how a browser subscribes, the local mirror, the `/alerts` page, the service worker and the
timezone sync. Open it before changing any of them. The API's side (endpoints, limits, send
windows, quiet hours, payloads) is the backend's
[push contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/push.md); the trip
planner's switch, which shares the subscription, is [planner push
notifications](trip-planner/push-notifications.md).

| Piece                                                                 | Job                                                                                 |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `lib/push/push-registration.ts`                                       | Availability probe, permission, service worker, `POST /v1/push/subscriptions`       |
| `lib/push/push-follows.ts`                                            | The writes and the two list reads, each returning a typed failure                   |
| `lib/push/push-follows-store.ts`                                      | The local mirror (`localStorage`) the bells render from                             |
| `lib/push/push-timezone.ts`, `components/push/push-timezone-sync.tsx` | Keeps the subscription's timezone current                                           |
| `components/push/ride-alert-*.tsx`, `ride-alerts-entry-button.tsx`    | Ride bell, ride dialog, the park's ride list for it, the central entry              |
| `components/push/show-follow-*.tsx`                                   | Show bell and dialog                                                                |
| `components/push/alerts-overview.tsx`, `app/[locale]/alerts/page.tsx` | `/alerts`, every alert this browser has                                             |
| `app/api/push/*`                                                      | Thin relays to `/v1/push*` (`relayPushGet`, `relayPushWrite` in `lib/api/relay.ts`) |
| `public/sw.js`                                                        | Shows the notification, focuses a tab on click                                      |

## One subscription per browser

A browser has one push subscription per origin, shared by ride alerts, show reminders and the
planner. `ensurePushRegistered()` subscribes **without** `tripId` or `topics`: the API leaves fields
a write omits untouched, so a bell never disturbs the planner's half of the row and vice versa.
Every write first looks for an existing subscription (`getExistingPushIdentity`) and registers only
when there is none, so a second bell on a page never prompts again.

`ensurePushRegistered` never throws. It answers a `PushUnavailableCause`, because each failure needs
a different sentence (`usePushErrorMessage`, strings in `pushAlerts.pushErrors`):

| Cause            | When                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| `unsupported`    | no service worker, `PushManager` or `Notification` (insecure origin, old browser) |
| `probe-failed`   | `GET /v1/push` did not answer                                                     |
| `not-configured` | the API answered `available: false`: this deploy has no VAPID keypair             |
| `denied`         | notifications blocked, including a browser set never to ask (no prompt shown)     |
| `dismissed`      | the prompt was closed without a decision                                          |
| `failed`         | subscribing or the API's `POST` failed; the push subscription is undone           |

A write that gets a **404** retries once after `ensurePushRegistered()`: the browser still holds a
subscription the API has lost (it deletes one after a 404/410 from the push service). A 429 shows
the server's wait in seconds; on `/alerts` and in the header that message expires when the wait is
over (`usePushFollowRemoval`).

**The VAPID key is the API's.** The frontend has no key of its own: `GET /api/push` relays
`/v1/push` (`available`, `publicKey`, `topics`) with `no-store`, so a deploy that adds the keypair
shows the bells at once. `fetchAvailability()` memoizes only a successful answer for the page's
life. `urlBase64ToUint8Array` (`lib/push/vapid-key.ts`) turns the base64url key into the bytes
`pushManager.subscribe` takes. The relay answers `{ available: false }` for any upstream failure,
so through the relay an API outage reads as `not-configured`; only a direct call
(`NEXT_PUBLIC_API_DIRECT=1`, [the rule](../rules/a-request-no-cache-can-share-goes-to-the-api-directly.md))
can end in `probe-failed`.

## Ride alerts

Two kinds, one per ride and browser (setting one replaces the other, as the API does):

- **Wait alert**, "tell me when the queue is under N minutes". The slider runs from
  `THRESHOLD_SLIDER_MIN` (5) to `maxThresholdFor(wait)`, ten minutes under the current reading
  rounded to five, in steps of 5; it starts at that maximum, or at `DEFAULT_THRESHOLD_MIN` (20)
  without a reading. Anything at or above today's reading would already be true.
  `hasUsableThresholdRange` is false once the queue is down to ten: the bell then hides unless an
  alert is set, its dialog is open, or it offers the reopen alert. No reading counts as usable.
  `lib/push/threshold-minutes.ts`, `pnpm test:threshold-minutes`.
- **Reopen alert** (`kind: 'reopen'`), "tell me when it runs again". Offered only for a ride that
  stands (`DOWN`, `CLOSED`, `REFURBISHMENT`, `isStoppedRide`) in a park whose wait times can be read
  (`hasReadableWaitTimes` of the server-rendered park, [parks we cannot
  read](../rules/parks-we-cannot-read.md)), and preselected there (`rideAlertKindsFor`).

`RideAlertBell` sits in `AttractionCard`'s glass corner, only for a UUID id (a blog fallback card
carries a slug, which the API refuses). It mounts its dialog on the first press, and only that
dialog reads the park's ride list from `RideAlertParkProvider` (`live-park-data.tsx`), which changes
with every poll ([a subscription lives in the leaf that shows
it](../rules/a-subscription-lives-in-the-leaf-that-shows-it.md)). `RideAlertsEntryButton` opens the
same dialog without a preselected ride, as a link in `ParkTodayPanel` and as a button at the end of
the attraction list's headliner heading (`tabs-with-hash.tsx`).

`RideAlertDialog` asks the server on every open (`fetchRideAlertsRemote`) and lists this park's
alerts above the add form; a failed read is an error state, never "no alerts", or the form would
offer rides that already have one. The picker (`lib/push/ride-alert-picker.ts`) sorts by name in the
page's locale, keeps rides without a usable range visible but not selectable, and never defaults to
one of those.

## Show reminders

A follow is either open-ended (`startTime` null, "whichever performance is next", what a show
card's corner bell files) or pinned to one performance (an ISO instant, what a showtime row's bell
or a showtime badge files). The API keeps one row per show and overwrites `startTime`, so pinning a
second performance moves the reminder; `ShowFollowDialog` says so before the press
(`replacedStart`). Instants are compared as instants (`isSameInstant`), never as text.

`ShowFollowBell` renders on `ShowCard` and on the showtime rows of `ParkTodayPanel`; the showtime
badges (`show-card-showtimes.tsx`) open the dialog directly. The bell hides when the next
performance is under `SHOW_FOLLOW_MIN_LEAD_MIN` (10) minutes away, unless a reminder is on; the
dialog warns under `SHOW_LEAD_MIN` (25) that only the late reminder is left. Both mirror the API's
`SHOW_LEAD_*` windows by hand (`lib/push/show-lead.ts`): a change there is copied here. Times print
in the park's zone (`formatShowClock`, `LocalTime`), counted against the browser's clock
(`useMinuteNowDate`) because the pages are cached.

## The local mirror

`lib/push/push-follows-store.ts` keeps `localStorage['parkfan_ride_alerts']` and
`['parkfan_show_follows']` and fires `push-follows-changed` on every write, so every bell on the page
re-reads (`useLocalPushFollowsValue`). It is a cache for rendering bells without a request, not the
truth:

- It is written only after the server answered 2xx. A removal goes to the server first, and a 404 on
  a `DELETE` counts as removed (the API answers 404 only for an unknown subscription). Without a push
  identity there is nothing on the server, so clearing the mirror is the removal. This order is
  [a standing rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md);
  `pnpm test:push-follow-delete`.
- Lists come from the server. `/alerts` and the header's alerts group read `usePushFollowsList`
  (one query key, `staleTime: 0`), gated on `hasAnyPushFollowsLocal()` in the header so a browser
  that never pressed a bell asks nothing. A failed identity lookup is `{ ok: false }`, never an empty
  list (`lookupExistingPushIdentity`); `pnpm test:push-follow-read`.
- The show dialog reconciles its own show's entry on open (`reconcileShowFollowLocal`). Ride entries
  are never reconciled, and nothing sweeps the mirror: a pinned performance that is over stays, and
  the show dialog treats it as expired (`armedExpired`). `pnpm test:show-follows-store`.

## `/alerts`

`app/[locale]/alerts/page.tsx`: every ride alert and show reminder of this browser across parks,
with a remove button per row (`AlertsOverview`). `noindex`, in no sitemap; the header menu and the
footer link it ([header navigation](header-navigation.md#the-alerts-group)). Its namespaces are
`pushAlerts.overview` and `pushAlerts.pushErrors`. Four states: loading, both lists failed, one
failed (`partial`, the rows that came are shown with a note), and empty, which is only shown after
both reads succeeded. Removal is `usePushFollowRemoval`, shared with the header group, so a removal
in one place updates the other.

## Service worker

`public/sw.js` has two jobs: `push` shows the notification (a payload without a `title` is
dropped; `tag` collapses notifications about the same thing), and `notificationclick` focuses an
open park.fan tab and navigates it to the payload's `url`, or opens one. It has no `fetch` handler
and caches nothing ([offline: nothing is stored, by
decision](../architecture/caching-strategy.md#offline-nothing-is-stored-by-decision)). It is
registered on the first subscribe (`push-registration.ts` here, `use-push-subscription.ts` for the
planner), never on page load, because a worker claims scope over the whole origin.

## The timezone follows the phone

The API's quiet hours run on the subscription's `timezone`, so a subscription made in Berlin would
go quiet over an evening in Orlando. `PushTimezoneSync`, mounted once in `app/[locale]/layout.tsx`,
calls `refreshPushTimezone()` on load. It returns after two `localStorage` reads unless this browser
has a mirror entry or an armed planner (`readArmedPush`); otherwise it compares the current zone
with `localStorage['parkfan_push_timezone']` (the endpoint and zone the API last accepted) and
posts the subscription again with `timezone` and `locale` only when either differs. A failure
changes nothing. `pnpm test:push-timezone`.

Analytics: `ride_alert_set`, `ride_alert_removed`, `show_follow_add`, `show_follow_remove`, sent only
after the server confirmed ([event inventory](../development/analytics.md#event-inventory)).
