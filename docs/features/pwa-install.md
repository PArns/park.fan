# Installing park.fan as an app

park.fan is installable as a home-screen app: a web app manifest and an install button in the
footer, and by decision no offline cache. Open this page before changing the button, the manifest
or anything that would make the service worker cache pages. The icons the manifest lists are
[the favicon's](../seo/favicon.md).

| Piece                                      | Job                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `app/manifest.ts`                          | `display: standalone`, `start_url: /`, colours, the three icons                  |
| `lib/pwa/install-store.ts`                 | Whether and how this browser can be asked, as an external store                  |
| `components/common/install-app-button.tsx` | `InstallAppButton`, in the footer's brand block (`components/layout/footer.tsx`) |

## The button

`InstallAppButton` reads `getInstallMode()` through `useSyncExternalStore` (the server and
hydration read `none`) and draws nothing until the browser can act on it. No modal, nothing above the
fold, so nothing on the page moves.

| Mode     | When                                                              | A press                                            |
| -------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| `prompt` | Chromium handed over `beforeinstallprompt`                        | the browser's own install dialog (`promptInstall`) |
| `ios`    | Safari on iPhone or iPad (`isIosSafari`)                          | toggles a hint about the Share sheet               |
| `none`   | installed, running standalone, dismissed, or neither of the above | nothing is drawn                                   |

- **The listener is registered when the module loads**, not in an effect. Chromium fires
  `beforeinstallprompt` once and early; a component subscribing after mount could miss it. The event
  is single-use, so it is dropped after `promptInstall()`, and `appinstalled` switches the mode off.
- **An install is counted** as `pwa_installed` in our own statistic, from the same `appinstalled`
  listener, so one made through the browser's own menu counts as well as one through the button
  ([site analytics](site-analytics.md)).
- **iOS** has no install event, only the Share sheet, and only Safari has it: Chrome, Firefox, Edge
  and Opera on iOS and the in-app browsers (Facebook, Instagram, Line, Google app, Snapchat) are
  excluded by their user-agent tokens. iPadOS reporting a Mac is told apart by its touch points.
- **Dismissing** writes `localStorage['install-hint-dismissed']` with a timestamp and hides the button
  for 30 days, the same as the location banner.

## No offline cache

The only service worker is `public/sw.js`, and it exists for push notifications: it has no `fetch`
handler and is registered only when a visitor turns notifications on
([ride alerts](ride-alerts.md#service-worker)). An installed app therefore loads every page from the
network and the CDN, like a browser tab, and shows the browser's error page offline. That was
decided, and what offline support would take and cost is written down in
[caching strategy](../architecture/caching-strategy.md#offline-nothing-is-stored-by-decision).
