# Location is asked for where a page needs it, and not again after a no (REQUIREMENT)

Two kinds of page use the visitor's position for something the coarse IP position from `/api/nearby`
cannot give, and only they ask: the **homepage** (the in-park hero, the nearby parks, the compass)
and the **park pages** (the location line in the title card, the rides around you). Blog and news
posts, where search traffic lands, never ask. A page part declares that it uses location with
`useLocationNeeded()` (`lib/contexts/geolocation-context.tsx`): today `LocationBanner` and
`HomeLocationRow` on the homepage and `ParkLocationLine` on the park pages. Every other component
reads `useGeolocation()`; nothing calls `navigator.geolocation` into a `prompt` state by itself. The
decisions live in `lib/utils/geolocation-permission.ts`.

| Visitor                                                                     | Homepage, park page                                                                                         | Every other page |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------- |
| browser reports `granted`                                                   | read, no prompt                                                                                             | read, no prompt  |
| said yes on an earlier visit (`pf_geo_optin`), browser no longer reports it | the browser's prompt, directly, once per page lifetime                                                      | nothing          |
| never answered                                                              | our ask first: the banner (homepage) or the location line's button (park page); the prompt comes from a tap | nothing          |
| said no: closed the banner, dismissed or refused the prompt                 | no direct prompt until the next yes, no banner for 30 days; both rows keep their button                     | nothing          |
| browser reports `denied`                                                    | both rows say location is blocked and how to lift it                                                        | nothing          |

- **A no can always be taken back.** `HomeLocationRow` (below the nearby chapter's lead) and
  `ParkLocationLine` (the title card's address line) are server-rendered at one fixed height (44 px
  below `sm`; the park line 32 px from `sm` up) and never go away: a button while nothing is decided
  or after a no, "location on" once it is, "blocked" with the way out after a block. On the park page
  the distance is the badge beside it, never a second sentence; in the park the rides around the
  visitor open above the tabs (`ParkInParkBlock`).
- **A no lasts 30 days** (`LOCATION_BANNER_QUIET_MS`, key `pf_geo_banner_dismissed_at`), and it
  clears `pf_geo_optin`, so no direct prompt follows until the next yes.
- **A dismissed prompt is not a block.** Chrome answers code 1 to "Block" and to closing the prompt;
  the Permissions API still reads `prompt` after a dismissal (`wasOnlyDismissed`), so the button
  stays. WebKit cannot tell them apart and refuses every further request in the page after "Don't
  Allow", so there a refusal stays a block until the next load.
- **After a block**, `LocationBlockedHelp` offers what can lift it: in Chrome 144+ the browser's own
  `<geolocation>` element, elsewhere the steps for this browser in a popover
  (`locationHelpPlatform`). Chrome reports a lifted block through the permission's `change` event and
  the page reads at once; other browsers' steps end with a reload. The `<geolocation>` element is
  used only after a block; the ask before anything is decided stays our own button. A standing tip
  for iPhone readers to set "Allow" in Safari was considered and not wanted.
- **A background refresh never prompts.** Each tick reads the live `PermissionStatus.state` first
  (`canRefreshSilently`) and stops on `prompt` once the page has seen `granted`; a `change` to
  `prompt` sets `permissionGranted` back to false. On WebKit `prompt` is the steady state after a yes
  and a second read in the same page does not prompt (`promptStateIsReliable`).
- **The denied event counts a denial answered in the page only** (`use-nearby-analytics.ts`), or it
  would count an event per page view of everyone who ever said no. No event carries a park derived
  from the position ([analytics](../development/analytics.md#what-an-event-never-carries)).
- **Other prompts ask only from a tap**: push (`Notification.requestPermission`) and the iOS motion
  sensor for the compass (`DeviceOrientationEvent.requestPermission`). Embedded iframes cannot ask
  for location at all (`Permissions-Policy: geolocation=(self)` in `next.config.ts`).

## A page cannot ask for a longer grant

How long a yes lasts is the browser's call:

| Browser                  | What a yes lasts                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome (desktop/Android) | "Allow on every visit" is permanent (`granted`). "Allow this time" ends when the page closes, after 16 h, or after 5 min in the background; the Permissions API then reads `prompt` again. |
| Safari on iOS            | With the default "Ask" setting, until the page is reloaded. Only "Allow" for the site (aA → Website Settings → Location) is permanent (`granted`).                                         |
| Safari on macOS          | With "Remember my decision for one day" ticked, a day (`granted`); without it, the page. "Allow" in the site settings is permanent.                                                        |
| Firefox                  | Permanent with "Remember this decision" ticked (`granted`), otherwise for the page.                                                                                                        |

Sources: [Chrome one-time permissions](https://developer.chrome.com/blog/one-time-permissions),
[Apple Developer Forums 740270](https://developer.apple.com/forums/thread/740270) and
[751189](https://developer.apple.com/forums/thread/751189),
[w3c/geolocation#117](https://github.com/w3c/geolocation/issues/117) (a Firefox temporary grant
stays `prompt`).

So `granted` is the only state in which a read is silent, and Safari reports `prompt` even while a
yes still holds. The site's own record of an earlier yes (`pf_geo_optin`, set on every fix, cleared
on every no) is what tells a returning visitor from a new one.

## Why

Reusing an earlier yes on every page load meant a native prompt on every page a returning iPhone
reader opened, blog and news included. Asking only on a tap meant a returning visitor at the park
gate needed the banner and then the prompt on every reload, and after closing the banner once the
homepage had no way to ask. So the earlier yes is asked directly where a page uses location, and
nowhere else. Chrome also counts ignored prompts: after three it blocks the site's requests for a
week, which is why the park map stopped calling `getCurrentPosition` on mount (every map tab and
every blog `map-widget` opened a prompt).

## Counter-examples

- A component that calls `navigator.geolocation` itself, or Leaflet's `map.locate()`. Read
  `useGeolocation()`.
- A page that uses location without `useLocationNeeded()`: a returning iPhone visitor gets no prompt
  there. Or `useLocationNeeded()` on a page that only shows distances, which work from the IP
  position.
- Treating `prompt` as "first-time visitor". With one-time grants and WebKit it is neither; the
  opt-in record decides.
- A `watchPosition` not gated on `permissionGranted`. `useLivePosition` (compass) and the map's
  in-park watch both are.

The admin capture tool (`app/admin/capture/_lib/use-park-location.ts`) is exempt: prompting is the
point of that page.

## Check

`pnpm test:geolocation-permission` pins the decisions. For the pages, stub
`navigator.permissions.query` and `navigator.geolocation` in a Playwright init script (set
`navigator.vendor` to "Apple Computer, Inc." for Safari, seed `pf_geo_optin` for an earlier yes) and
count reads on the homepage, a park page, a blog post with a `map-widget` fence and `/news`: with an
earlier yes and `prompt`, the homepage and park page read once, the post and `/news` never.
