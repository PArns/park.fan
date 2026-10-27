# Internationalization

The six locales, where they are configured, which translations reach the browser on which route,
and how a language switch finds the localized URL. Open it when a component crosses the client
boundary, a page shows a raw message key, or the locale switcher lands on the wrong path. Adding
keys, helpers and the validation scripts: [translations](translations.md).

## Locales and configuration

| Code | Language          | Open Graph |
| ---- | ----------------- | ---------- |
| `en` | English (default) | `en_US`    |
| `de` | Deutsch           | `de_DE`    |
| `fr` | Français          | `fr_FR`    |
| `it` | Italiano          | `it_IT`    |
| `nl` | Nederlands        | `nl_NL`    |
| `es` | Español           | `es_ES`    |

`i18n/config.ts` is the one list (`locales`, `defaultLocale`, `localeNames`,
`localeToOpenGraphLocale`, `generateAlternateLanguages()` for hreflang); a new language needs an
entry there, in `localeNames` and a `messages/<locale>.json`. `i18n/routing.ts` sets
`localePrefix: 'always'` and `alternateLinks: false` (hreflang comes from each page's
`generateMetadata`, because next-intl's own `Link` headers give the glossary wrong alternates).
next-intl is used through `proxy.ts`, not `middleware.ts`; the prefix, detection by
`Accept-Language` and the unprefixed-path redirects are in
[routing and URLs](../architecture/routing-and-urls.md#locale-prefix), why `proxy.ts` drops the
`NEXT_LOCALE` cookie in [CDN caching](../architecture/cdn-caching.md#why-a-pages-window-is-cdn-cache-control).

Messages live in `messages/<locale>.json`, one top-level namespace per feature (`common`, `parks`,
`attractions`, `geo`, `planner`, `blog`, `seo`, … about forty). `getTranslations()` on the server
reads any of them; `useTranslations()` reads only what reached the client, below.

## Which namespaces reach the client

The rule: [translations are routed, not bundled](../rules/translations-are-routed-not-bundled.md).
This section is the mechanism and the measurements behind it.

The chrome set (`LAYOUT_MESSAGE_NAMESPACES`: header, footer, search, language banner) and each
route's delta (`<RouteMessages route="…">`, `i18n/route-messages.tsx`) come from the import graph
([how the map is generated](../development/scripts.md#the-route-namespace-map-is-generated-not-written)).
The client-side merge exists because a nested next-intl provider replaces its parent's messages
(`messages === undefined ? prevContext?.messages : messages` in `use-intl`), so
`i18n/route-messages-provider.tsx` reads the parent's through `useMessages()` and sends only the
delta.

What the message payload costs, against `messages/de.json`, when the split replaced one flat
allowlist:

|                                       | JSON    | in HTML (escaped) | brotli  |
| ------------------------------------- | ------- | ----------------- | ------- |
| one flat allowlist (before)           | 47.4 KB | 51.7 KB           | 14.9 KB |
| chrome only (`/impressum`, `/search`) | 6.6 KB  | 7.4 KB            | 2.5 KB  |
| park detail page (heaviest)           | 29.7 KB | 32.7 KB           | 9.4 KB  |

Whole pages, two production builds of the same commit range (prerendered HTML, or `next start` for
the `force-dynamic` park and ride pages):

| Page                        | HTML before | after   | brotli before | after  |      Δ |
| --------------------------- | ----------- | ------- | ------------- | ------ | -----: |
| `/de/impressum`             | 139,513     | 94,851  | 26,557        | 14,155 | −46.7% |
| `/de/parks`                 | 150,873     | 110,176 | 28,054        | 16,497 | −41.2% |
| `/de/parks/europe/germany`  | 225,861     | 184,801 | 29,945        | 18,384 | −38.6% |
| `/de/blog`                  | 344,966     | 304,000 | 35,462        | 24,068 | −32.1% |
| `/de` (homepage)            | 631,229     | 618,910 | 48,704        | 45,164 |  −7.3% |
| Ride `…/troublion`          | 177,706     | 155,846 | 30,636        | 24,382 | −20.4% |
| Park `…/phantasialand`      | 477,455     | 455,683 | 51,275        | 45,860 | −10.6% |
| Park `…/europa-park`        | 634,414     | 616,464 | 61,950        | 56,424 |  −8.9% |
| Park `…/europa-park` (`en`) | 630,082     | 613,709 | 59,786        | 55,056 |  −7.9% |

Park and ride pages dropped `home` (7.5 KB), `blog`, `glossary`, `explore` and `stats`, namespaces
they never rendered, ~5.5–6.3 KB brotli per request. The homepage moved least because its cards
need the card namespaces anyway. And compression eats most of an apparent win: the previous
allowlist trimmed ~10 KB of JSON and ~2.3 KB after brotli, so judge on the compressed number. A
missing namespace renders as its raw key, so the end-to-end check after the split was a scan of the
rendered HTML for dotted message paths in text nodes: 2,882 prerendered pages plus the park and
ride routes, zero hits.

### Working with it

- `getTranslations(…)` on the server needs nothing.
- `useTranslations('x')` needs `x` in the browser, whether or not the file says `'use client'`: a
  shared component without the directive inherits the boundary from whoever imports it.
- After moving a component across the client boundary, run `pnpm generate:route-namespaces` and
  commit the result; `pnpm check:client-messages` (also in `release:check`) is the rule's check.
- An entry is a whole namespace (`'parks'`) or a subtree (`'seo.faq'`, kept under its path so
  lookups do not change).

Three invariants are easy to break and invisible, so the analysis checks them:

- **Shell files belong to the layout set.** `error.tsx` replaces the page, `loading.tsx` renders
  before it and `not-found.tsx` instead of it, so the page's provider never mounted; a nested
  `layout.tsx` has the same problem from above, and all of them guard every descendant segment. The
  analysis folds them into the layout set.
- **`setRequestLocale()` runs before `<RouteMessages>`.** The wrapper resolves through
  `getMessages()`; the other way round it resolves the default locale and a German page hands
  English messages to its client components. Every key still resolves, so no raw-key scan finds it.
- **A lazy boundary's whole subtree is covered.** The analysis walks each route a second time
  through the boundaries and fails on anything neither shipped nor fetchable, because the lazy
  namespace lists are written by hand.

### Namespaces that are fetched instead of shipped

`LAZY_MESSAGE_BOUNDARIES` (`lib/i18n/route-namespaces.mjs`) names components whose subtree renders
nothing for most visitors; the graph walk stops at them, and they fetch their namespaces as a
per-locale chunk (`lib/i18n/message-chunks/<locale>.ts`, generated in `prebuild`) through
`useLazyMessages`:

| Boundary                                      | Fetches                                                                             | Why it is lazy                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `components/parks/favorites-section.tsx`      | `parks`, `attractions`, `nearby`, `parkCard`, the `pushAlerts` bell and dialog keys | renders cards only once the visitor has favorites (cookie, client)    |
| `components/planner/planner-launcher.tsx`     | `planner`, `parks.weather`                                                          | mounted in the layout, but has content only once something is planned |
| `components/planner/plan-day-button-lazy.tsx` | `planner`                                                                           | lives in the calendar's day dialog                                    |

**A boundary file never calls `useTranslations` itself.** The generator counts a boundary's own
calls and stops only at its imports, so a read in the boundary file puts the namespace back into
the layout set of every page. That is why the planner boundaries are pairs, `planner-launcher.tsx` /
`planner-launcher-button.tsx` and `plan-day-button-lazy.tsx` / `plan-day-button.tsx`: everything
that reads `planner` sits behind the boundary file's import.

A namespace still reachable another way stays eager, and where a route already ships it (the cards
on the homepage and park pages) `useLazyMessages` resolves without a request. Favorites `parks` +
`attractions` alone are 16.5 KB of JSON off each blog listing and glossary term page.

**The wait must not shift the page.** `favorites` (title, skeleton, empty state) stays eager, the
chunk starts downloading in the same render that enables the favorites query, and the cards replace
the skeleton only once data **and** messages are there. Meanwhile the skeleton is held at the real
favorite count, so what lands is the same box.

## Switching language

`LocaleSwitcher` (`components/common/locale-switcher.tsx`) and `LanguageBanner`
(`components/layout/language-banner.tsx`) first read the page's
`link[rel="alternate"][hreflang="<new>"]` and navigate to its pathname
(`new URL(el.href).pathname`), which is the only source that knows a localized segment
(`/en/glossary` ↔ `/de/glossar`). Without one, the switcher calls
`router.replace(pathname, { locale })` and the banner replaces only the leading `/<locale>/`
segment. Never `path.replace(`/${locale}`, …)`: it breaks localized segments and hits the locale
code elsewhere in a path (`/en/parks/europe/de`). Both call `rememberLocale()`
(`lib/i18n/remember-locale.ts`), which writes `NEXT_LOCALE` for the unprefixed `/`, the only
place it is read.

The `en` flag is `FlagUS`, not `FlagGB` (`components/common/icons/flags.tsx`).
