# Location is asked for by a tap, and a yes is used until the browser drops it (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**A page never opens the browser's location prompt on its own.** Only a button the visitor taps
may call `getCurrentPosition` or `watchPosition` into a `prompt` state. Everything else reads the
position from `useGeolocation()` (`lib/contexts/geolocation-context.tsx`), and the provider reads one
only where the browser will not ask. The decisions live in `lib/utils/geolocation-permission.ts` and
are pinned by `pnpm test:geolocation-permission`.

## A page cannot ask for a longer grant

How long a yes lasts is the browser's call, and no API lets a site ask for more:

| Browser                  | What a yes lasts                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome (desktop/Android) | "Allow on every visit" is permanent. "Allow this time" ends when the page closes, after 16 h, or after 5 min in the background; the Permissions API then reads `prompt` again. |
| Safari (macOS/iOS)       | With the default "Ask" setting, one day at most. Only the per-site setting "Allow" (iOS: aA → Website Settings → Location) is permanent.                                       |
| Firefox                  | Permanent with "Remember this decision" ticked, otherwise for the page.                                                                                                        |

What the site does control is how often it makes the browser ask, and whether it uses a yes it
already has. Both went wrong here.

## What went wrong (fixed 2026-09-28)

Measured with Playwright against `next dev`, the Permissions API and `navigator.geolocation`
stubbed per case, reads counted. A read in a `prompt` state is a native prompt nobody tapped for.
The map-tab counts are doubled by Strict Mode in dev; production opens one prompt per map.

| Case                                           | Before                                | After                |
| ---------------------------------------------- | ------------------------------------- | -------------------- |
| Safari, said yes on an earlier visit, homepage | 0 reads, banner shown                 | 1 read, no banner    |
| Chrome `prompt`, park page map tab             | 2 reads (prompts)                     | 0 reads              |
| Chrome `denied`, park page map tab             | 2 reads, row offers a useless button  | 0 reads, "blocked"   |
| Chrome `granted`, park page map tab            | 3 reads                               | 1 read (the context) |
| Chrome `denied`, homepage                      | banner with a button that cannot work | no banner            |
| Chrome one-time grant runs out, tab comes back | 1 read (prompt)                       | 0 reads, banner      |
| Banner closed, new tab                         | banner again                          | closed for 30 days   |

1. **Safari was asked on every visit.** WebKit keeps `permissions.query({ name: 'geolocation' })`
   at `prompt` while a grant is live: allowing without "Remember for one day" leaves it at `prompt`,
   and so does "Deny"; only the per-site "Allow" reads `granted`
   ([Apple Developer Forums](https://developer.apple.com/forums/thread/751189),
   [mdn/browser-compat-data#25032](https://github.com/mdn/browser-compat-data/issues/25032)). The
   provider already kept an opt-in flag (`pf_geo_optin`) for exactly this, but only consulted it
   when the query returned `null`, which current Safari does not do. Now `prompt` on WebKit
   (`navigator.vendor` starts with "Apple", which covers every browser on iOS) is treated like
   `null`: with the flag set, the provider reads on load. That is a no-op when Safari still holds the
   grant and one native prompt when it has dropped it, for a visitor who said yes to this before.
2. **The park map asked by itself.** `useParkMapGeolocation` called `getCurrentPosition` on mount,
   so every opened map tab, and every blog post with a park map, opened a prompt. Chrome counts an
   ignored prompt: after three it blocks the site's requests for a week (the "embargo",
   [Chrome for Developers](https://developer.chrome.com/blog/geolocation-html-element)), and the
   visitor who then taps our button gets nothing. The map now reads the context's position; its
   in-park `watchPosition` starts only while `permissionGranted` holds.
3. **A background refresh could open a prompt.** Chrome's "Allow this time" runs out after five
   minutes in the background ([one-time permissions](https://developer.chrome.com/blog/one-time-permissions)).
   The `visibilitychange` refresh then read a position the instant the visitor came back, into a
   `prompt` state. Each background tick now reads the live `PermissionStatus.state` first
   (`canRefreshSilently`) and stops on a `prompt` once the page has seen `granted`, and a `change`
   to `prompt` sets `permissionGranted` back to false, so the visitor sees the button again instead
   of a prompt. The last fix is kept. The "once it has seen `granted`" is for Firefox: a temporary
   grant ("Remember this decision" unticked) stays at `prompt` and fires no `change`
   ([w3c/geolocation#117](https://github.com/w3c/geolocation/issues/117)), and its refresh has to
   go on working.
4. **A stored denial was ignored on load.** Only a denial answered in this page set
   `permissionDenied`, so a visitor who had blocked the site met a banner and an "ask" row whose
   button could do nothing. `denied` from the query is now remembered. The Umami denied event still
   counts only a denial answered in the page (`use-nearby-analytics.ts`), or it would bill one event
   per page view of every visitor who ever said no ([Umami event budget](umami-event-budget.md)).
5. **Closing the banner lasted one browser session** (`sessionStorage`). It now lasts 30 days
   (`LOCATION_BANNER_QUIET_MS`, `localStorage` key `pf_geo_banner_dismissed_at`).

## Counter-examples

- A new component that wants a position and calls `navigator.geolocation` itself. Read
  `useGeolocation()`; offer `refresh` behind a button when `permissionGranted` is false and
  `permissionDenied` is false.
- Treating `prompt` as "first-time visitor". With one-time grants and WebKit it is neither.
- A `watchPosition` that is not gated on `permissionGranted`. `useLivePosition` (compass) and the
  map's in-park watch both are.

The admin capture tool (`app/admin/capture/_lib/use-park-location.ts`) is exempt: an operator opens
it to record a position, so the prompt there is the point of the page.

## How to prove a change

`pnpm test:geolocation-permission` for the decisions. For the pages, stub
`navigator.permissions.query` and `navigator.geolocation` in a Playwright init script, set
`navigator.vendor` to "Apple Computer, Inc." for the Safari case, and count calls on the homepage
and on a park page opened at `#map`, as in the table above.

## Not done yet

Chrome 144 ships a `<geolocation>` element. A tap on it is a user gesture the browser can verify,
and it lets a visitor lift an earlier denial or an embargo from the page itself. It could replace
the "use my location" buttons in Chrome, with the current button as the fallback elsewhere.
