# Location is asked for by a tap, never by a page load (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**A page never opens the browser's location prompt on its own.** On load, the provider
(`lib/contexts/geolocation-context.tsx`) reads a position only when the Permissions API answers
`granted`, the one answer that promises no prompt. That holds on every page, and it matters most on
blog and news posts, which are where search traffic lands: a reader who came for an article gets
no prompt there, and no button on those pages asks either. Everything else waits until the visitor
taps a button that asks (`refresh` from `useGeolocation()`). Components read the position from the
context and never call `navigator.geolocation` into a `prompt` state themselves. The decisions live
in `lib/utils/geolocation-permission.ts` and are pinned by `pnpm test:geolocation-permission`.

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

So every permanent grant reads `granted`, and that is the only state in which a read on load is
silent. What the site controls is how often it makes the browser ask. On iPhone Safari with the
default setting it cannot make that less than once per page load; a client-side navigation keeps
the page, so the yes lasts for the visit as long as the visitor does not reload.

## What went wrong, and what was tried (2026-09-28)

Measured with Playwright against `next dev`, the Permissions API and `navigator.geolocation`
stubbed per case, reads counted. A read in a `prompt` state is a native prompt nobody tapped for.
The map counts are doubled by Strict Mode in dev; production opens one prompt per map.

| Case                                                                   | Before                                | After                |
| ---------------------------------------------------------------------- | ------------------------------------- | -------------------- |
| Chrome `prompt`, blog post with a park map                             | 2 reads (prompts)                     | 0 reads              |
| Chrome `prompt`, park page map tab                                     | 2 reads (prompts)                     | 0 reads              |
| Chrome `denied`, park page map tab                                     | 2 reads, row offers a useless button  | 0 reads, "blocked"   |
| Chrome `granted`, park page map tab                                    | 3 reads                               | 1 read (the context) |
| No Permissions API answer, earlier yes stored, any page (news, blog …) | 1 read (a prompt on iOS)              | 0 reads              |
| Chrome `denied`, homepage                                              | banner with a button that cannot work | no banner            |
| Chrome one-time grant runs out, tab comes back                         | 1 read (prompt)                       | 0 reads, banner      |
| Banner closed, new tab                                                 | banner again                          | closed for 30 days   |

1. **The park map asked by itself.** `useParkMapGeolocation` called `getCurrentPosition` on mount,
   so every opened map tab, and every blog post with a `map-widget` fence, opened a prompt. Chrome
   counts an ignored prompt: after three it blocks the site's requests for a week (the "embargo",
   [Chrome for Developers](https://developer.chrome.com/blog/geolocation-html-element)), and the
   visitor who then taps our button gets nothing. The map now reads the context's position; its
   in-park `watchPosition` starts only while `permissionGranted` holds.
2. **An earlier yes was reused on load.** Where `permissions.query` gave no answer (missing, or it
   threw), the provider read on load if an opt-in flag (`pf_geo_optin`) said the visitor had once
   agreed. On iPhone Safari that read is a native prompt on every page load. The flag is gone.
   **Tried and taken out again:** extending the same reuse to WebKit's `prompt`, because Safari
   reads `prompt` even while a yes still holds. It turned the banner into a native prompt on every
   page a returning iPhone reader opened, blog and news included. Do not bring it back; on WebKit
   there is no way to tell from the page whether a read would prompt.
3. **A background refresh could open a prompt.** Chrome's "Allow this time" runs out after five
   minutes in the background. The `visibilitychange` refresh then read a position the instant the
   visitor came back, into a `prompt` state. Each background tick now reads the live
   `PermissionStatus.state` first (`canRefreshSilently`) and stops on a `prompt` once the page has
   seen `granted`, and a `change` to `prompt` sets `permissionGranted` back to false, so the visitor
   sees the button again instead of a prompt. The last fix is kept. The "once it has seen
   `granted`" is for Firefox: a temporary grant ("Remember this decision" unticked) stays at
   `prompt` and fires no `change` ([w3c/geolocation#117](https://github.com/w3c/geolocation/issues/117)),
   and its refresh has to go on working. On WebKit `prompt` is the steady state after a tap, and a
   second read within the same page does not prompt, so the refresh goes on there too
   (`promptStateIsReliable`).
4. **A stored denial was ignored on load.** Only a denial answered in this page set
   `permissionDenied`, so a visitor who had blocked the site met a banner and an "ask" row whose
   button could do nothing. `denied` from the query is now remembered. The Umami denied event still
   counts only a denial answered in the page (`use-nearby-analytics.ts`), or it would bill one event
   per page view of every visitor who ever said no ([Umami event budget](umami-event-budget.md)).
5. **Closing the banner lasted one browser session** (`sessionStorage`). It now lasts 30 days
   (`LOCATION_BANNER_QUIET_MS`, `localStorage` key `pf_geo_banner_dismissed_at`).

## Where a tap may ask

The homepage banner (`LocationBanner`, homepage only), the nearby card's empty state, the park
page's "near you" row (`ParkInParkBlock`) and the compass. None of them renders on a blog or news
page. The other prompts on the site are tap-only as well: push notifications
(`Notification.requestPermission` in the planner toggle and the follow/alert dialogs) and the iOS
motion sensor for the compass (`DeviceOrientationEvent.requestPermission`). Embedded iframes cannot
ask for location at all: `Permissions-Policy: geolocation=(self)` in `next.config.ts`.

## Counter-examples

- A new component that wants a position and calls `navigator.geolocation` itself. Read
  `useGeolocation()`; offer `refresh` behind a button when `permissionGranted` is false and
  `permissionDenied` is false.
- Treating `prompt` as "first-time visitor". With one-time grants and WebKit it is neither.
- Treating an earlier yes as a licence to read on load. Only `granted` is.
- A `watchPosition` that is not gated on `permissionGranted`. `useLivePosition` (compass) and the
  map's in-park watch both are.
- Leaflet's `map.locate()`, which calls the Geolocation API directly. Not used; keep it that way.

The admin capture tool (`app/admin/capture/_lib/use-park-location.ts`) is exempt: an operator opens
it to record a position, so the prompt there is the point of the page.

## How to prove a change

`pnpm test:geolocation-permission` for the decisions. For the pages, stub
`navigator.permissions.query` and `navigator.geolocation` in a Playwright init script (set
`navigator.vendor` to "Apple Computer, Inc." for Safari, make the query throw for "no answer") and
count calls on the homepage, a park page opened at `#map`, a blog post with a `map-widget` fence and
`/news`, as in the table above.

## Not done yet

- A one-line tip for iPhone readers after they tapped "use my location", saying how to set
  park.fan to "Allow" in Safari. It is the only way to a permanent grant there, and it needs copy in
  six locales.
- Chrome 144 ships a `<geolocation>` element. A tap on it is a user gesture the browser can verify,
  and it lets a visitor lift an earlier denial or an embargo from the page itself. It could replace
  the "use my location" buttons in Chrome, with the current button as the fallback elsewhere.
