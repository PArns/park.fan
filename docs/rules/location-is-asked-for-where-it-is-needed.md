# Location is asked for where a page needs it, and not again after a no (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

Two kinds of page use the visitor's position for something the coarse IP position from `/api/nearby`
cannot give: the **homepage** (the in-park hero, the nearby parks, the compass) and the **park
pages** (the near-you row with the rides around you). They ask. No other page does. Blog and news
posts are where search traffic lands, and a reader who came for an article gets no prompt there.
How a page asks depends on what the visitor answered before:

| Visitor                                                                     | Homepage, park page                                                                                        | Every other page |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------- |
| browser reports `granted`                                                   | read, no prompt                                                                                            | read, no prompt  |
| said yes on an earlier visit (`pf_geo_optin`), browser no longer reports it | the browser's prompt, directly, once per page lifetime                                                     | nothing          |
| never answered                                                              | our ask first: the banner (homepage) or the near-you row's button (park page); the prompt comes from a tap | nothing          |
| said no: closed the banner, or answered the prompt with no                  | no direct prompt until the next yes, no banner for 30 days; the park page row keeps its button             | nothing          |
| browser reports `denied`                                                    | nothing to press; the row says location is blocked                                                         | nothing          |

A page part declares that it uses location with `useLocationNeeded()`
(`lib/contexts/geolocation-context.tsx`); today that is `LocationBanner` on the homepage and
`ParkInParkBlock` on the park pages, the two places that also carry the button. Nothing calls
`navigator.geolocation` into a `prompt` state by itself; components read `useGeolocation()`. The
decisions live in `lib/utils/geolocation-permission.ts` and are pinned by
`pnpm test:geolocation-permission`.

## A page cannot ask for a longer grant

How long a yes lasts is the browser's call, and no API lets a site ask for more:

| Browser                  | What a yes lasts                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome (desktop/Android) | "Allow on every visit" is permanent (`granted`). "Allow this time" ends when the page closes, after 16 h, or after 5 min in the background; the Permissions API then reads `prompt` again. |
| Safari on iOS            | With the default "Ask" setting, **until the page is reloaded**: the next page load prompts again. Only "Allow" for the site (aA → Website Settings → Location) is permanent (`granted`).   |
| Safari on macOS          | With "Remember my decision for one day" ticked, a day (`granted`); without it, the page. "Allow" in the site settings is permanent.                                                        |
| Firefox                  | Permanent with "Remember this decision" ticked (`granted`), otherwise for the page.                                                                                                        |

Sources: [Chrome one-time permissions](https://developer.chrome.com/blog/one-time-permissions),
[Apple Developer Forums 740270](https://developer.apple.com/forums/thread/740270) (iOS re-prompts
on refresh), [751189](https://developer.apple.com/forums/thread/751189) (Safari's Permissions API
states), [Gadget Hacks](https://ios.gadgethacks.com/how-to/stop-websites-from-asking-use-your-location-every-single-time-for-uninterrupted-browsing-safari-0384231/)
(the iOS settings).

So every permanent grant reads `granted`, and that is the only state in which a read is silent.
Everything else is a prompt, and the site's own record of an earlier yes (`pf_geo_optin`, set on
every fix, cleared on every no) is what tells a returning visitor from a new one. Safari reports
`prompt` even while a yes still holds, so the browser cannot tell them apart. A client-side
navigation keeps the page, so on an iPhone one yes lasts for the visit as long as nobody reloads.

## Why an earlier yes is asked again only where it is used

This rule went through three versions on 2026-09-28, and each one fixed a real case:

1. Reusing an earlier yes on **every** page load. On iPhone that is a native prompt on every page a
   returning reader opens, blog and news included. Measured with a stubbed WebKit, `/de/news` read
   once on load.
2. Asking **only on a tap**. No prompt anywhere without one, but a returning iPhone visitor at the
   park gate needed the banner and then the prompt, on every reload, before the homepage could
   say "Welcome to …". After closing the banner once, the homepage had no way to ask at all.
3. **Where a page uses location**, the earlier yes is asked directly; elsewhere, nothing. That is
   this rule.

## What else went wrong (2026-09-28)

1. **The park map asked by itself.** `useParkMapGeolocation` called `getCurrentPosition` on mount,
   so every opened map tab, and every blog post with a `map-widget` fence, opened a prompt. Chrome
   counts an ignored prompt: after three it blocks the site's requests for a week (the "embargo",
   [Chrome for Developers](https://developer.chrome.com/blog/geolocation-html-element)). The map
   now reads the context's position, and its in-park `watchPosition` starts only while
   `permissionGranted` holds. On a park page the near-you row above the tabs is what asks.
2. **A background refresh could open a prompt.** Chrome's "Allow this time" runs out after five
   minutes in the background. The `visibilitychange` refresh then read a position the instant the
   visitor came back, into a `prompt` state. Each background tick now reads the live
   `PermissionStatus.state` first (`canRefreshSilently`) and stops on a `prompt` once the page has
   seen `granted`, and a `change` to `prompt` sets `permissionGranted` back to false. The last fix
   is kept. The "once it has seen `granted`" is for Firefox: a temporary grant stays at `prompt`
   and fires no `change` ([w3c/geolocation#117](https://github.com/w3c/geolocation/issues/117)).
   On WebKit `prompt` is the steady state after a yes, and a second read within the same page
   does not prompt, so the refresh goes on there too (`promptStateIsReliable`).
3. **A stored denial was ignored on load.** A visitor who had blocked the site met a banner and an
   "ask" row whose button could do nothing. `denied` from the query is now remembered. The Umami
   denied event still counts only a denial answered in the page (`use-nearby-analytics.ts`), or it
   would bill one event per page view of every visitor who ever said no
   ([Umami event budget](umami-event-budget.md)).
4. **A no lasted one browser session.** Closing the banner was kept in `sessionStorage`, and a no
   to the prompt was not kept at all. Both now keep the banner away for 30 days
   (`LOCATION_BANNER_QUIET_MS`, `rememberLocationDeclined`, key `pf_geo_banner_dismissed_at`), and
   a no to the prompt clears `pf_geo_optin`, so no direct prompt follows until the next yes.

## Measured

Stubbed: Playwright against `next dev`, the Permissions API, `navigator.vendor` and
`navigator.geolocation` replaced per case, reads counted, and a `MutationObserver` noting whether
the banner appeared even for a frame. A read in a `prompt` state is a native prompt.

| Case                                   | Homepage          | Park page        | Blog post with map | `/news` |
| -------------------------------------- | ----------------- | ---------------- | ------------------ | ------- |
| Safari, earlier yes                    | 1 read, no banner | 1 read           | 0                  | 0       |
| Safari, never answered                 | 0, banner         | 0, row "ask"     | 0                  | 0       |
| Chrome `prompt`, earlier yes           | 1 read, no banner | 1 read           | 0                  | 0       |
| Chrome `prompt`, never answered        | 0, banner         | 0, row "ask"     | 0                  | 0       |
| Chrome `denied`, earlier yes on record | 0, no banner      | 0, row "blocked" | 0                  | 0       |
| Chrome `granted`                       | 1 read            | 1 read           | 1 read             | 1 read  |

- Safari with an earlier yes, landing on `/news` and following the logo home: 0 reads on `/news`,
  1 on arriving at the homepage, the banner never shown.
- Safari with an earlier yes, answering the prompt with no, then reloading: the opt-in is cleared,
  and the reload reads nothing and shows no banner.
- Real Chromium, real Permissions API, `getCurrentPosition` only counted: with an earlier yes and
  `prompt`, homepage and park page read once, the blog post and `/news` not at all; without a
  grant nothing reads; with a grant each page reads once; revoking the grant while the page is
  open fires the real `change` and brings the banner back without a read.

## Other prompts on the site

Push notifications (`Notification.requestPermission` in the planner toggle and the follow/alert
dialogs) and the iOS motion sensor for the compass (`DeviceOrientationEvent.requestPermission`) ask
only from a tap. Embedded iframes cannot ask for location at all:
`Permissions-Policy: geolocation=(self)` in `next.config.ts`.

## Counter-examples

- A new component that calls `navigator.geolocation` itself. Read `useGeolocation()`.
- A new page that uses location without `useLocationNeeded()`. A returning iPhone visitor then gets
  no prompt there, only whatever button the page shows.
- `useLocationNeeded()` on a page that only shows distances. Distances work from the IP position;
  a prompt there asks for something the page does not need. Blog and news pages never call it.
- Treating `prompt` as "first-time visitor". With one-time grants and WebKit it is neither; the
  opt-in record decides.
- A `watchPosition` that is not gated on `permissionGranted`. `useLivePosition` (compass) and the
  map's in-park watch both are.
- Leaflet's `map.locate()`, which calls the Geolocation API directly. Not used; keep it that way.

The admin capture tool (`app/admin/capture/_lib/use-park-location.ts`) is exempt: an operator opens
it to record a position, so the prompt there is the point of the page.

## How to prove a change

`pnpm test:geolocation-permission` for the decisions. For the pages, stub
`navigator.permissions.query` and `navigator.geolocation` in a Playwright init script (set
`navigator.vendor` to "Apple Computer, Inc." for Safari, seed `pf_geo_optin` for an earlier yes)
and count calls on the homepage, a park page, a blog post with a `map-widget` fence and `/news`,
as in the table above.

## Not done

- A tip for iPhone readers on setting park.fan to "Allow" in Safari was considered and not wanted.
- Chrome 144 ships a `<geolocation>` element. A tap on it is a user gesture the browser can verify,
  and it lets a visitor lift an earlier denial or an embargo from the page itself. It could replace
  the "use my location" buttons in Chrome, with the current button as the fallback elsewhere.
