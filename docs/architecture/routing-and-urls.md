# Routing and URLs

The URL scheme, how API URLs become frontend links, the redirects that keep old URLs alive, and
the locale prefix. Open it before building a link, adding a park sub-page or touching a redirect.

## Route structure

Routes mirror the API's geography:

```
/[locale]/parks/[continent]/[country]/[city]/[park]/[attraction]
```

- `/en/parks/europe/germany/bruehl/phantasialand`
- `/de/parks/europe/germany/bruehl/phantasialand/taron`

The **city** segment is required; there is no route without it. A city with exactly one park
answers 308 to that park (`cityHasOwnPage()` in `lib/utils/redirect-utils.ts` is the predicate,
shared with the sitemap and the breadcrumbs).

### Park sub-pages

Three routes sit in the `[attraction]` position and win over it, because Next matches a static
segment first: the crowd calendar (`lib/parks/calendar-segments.ts`), the wait-time record
(`lib/parks/stats-segments.ts`) and the "with kids" page (`lib/parks/kids-segments.ts`). Like the
glossary and the guides, the route folder is the **English** slug and the other five locales are
rewritten onto it in `next.config.ts`:

- `/de/parks/…/phantasialand/wartezeiten-kalender` → `…/wait-time-calendar`
- `/de/parks/…/phantasialand/durchschnittliche-wartezeiten` → `…/average-wait-times`
- `/de/parks/…/phantasialand/mit-kindern` → `…/with-kids`

**Each segment list lives in three places that move together:** its module (every link and
canonical URL is built from it), the `rewrites()` block in `next.config.ts`, and the edge-window
block in `headers()`. The third rots silently: a stale entry there is a page without a cache
window, which on these per-request routes means a render on every request (`pnpm test:edge-windows`
catches it). A ride slugged like one of the 18 segments would be shadowed by the route; none is.

## URL conversion (API → frontend)

The API returns URLs like `/v1/parks/europe/germany/bruehl/phantasialand`. **Always** convert them
with `convertApiUrlToFrontendUrl()` (`lib/utils/url-utils.ts`); never build them by hand from
`city`/`country` name fields.

```ts
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';

const href = convertApiUrlToFrontendUrl(attraction.url);
```

| API URL                                                   | Frontend URL                                        |
| --------------------------------------------------------- | --------------------------------------------------- |
| `/v1/parks/…/<park>`                                      | `/parks/…/<park>`                                   |
| `/v1/parks/…/<park>/attractions/<slug>`                   | `/parks/…/<park>/<slug>` (rides sit under the park) |
| `/v1/parks/…/<park>/shows/<slug>`, `…/restaurants/<slug>` | the park page (they live in its tabs)               |
| `/v1/shows/<id>`, `/v1/restaurants/<id>`                  | `'#'` (names no park; the caller decides)           |

## URL builders (`lib/utils/url-utils.ts`)

- **`convertApiUrlToFrontendUrl(url)`** whenever the API gave a `url`.
- **`buildParkUrl({ continent, country, city, slug, url? })`** from geo data; falls back to
  converting `url`, then `'#'`.
- **`buildAttractionUrlFromGeo({ slug, park?, url? })`**, the same for a ride.
- **`buildAttractionUrl(parkUrl, attractionSlug)`**: park URL plus `/<slug>`.
- **`parkChapterUrl(url, 'shows' | 'restaurants')`**: the park page's tab (`…#shows`), or `null`
  when the URL names no park.
- **`searchResultHref(result, locale)`**: where a search result links, for every search surface.

## Breadcrumbs

`lib/utils/breadcrumb-utils.ts` has one generator per level (`generateContinentBreadcrumbs` …
`generateAttractionBreadcrumbs`). Each returns `{ name, url, className? }[]` for `BreadcrumbNav`;
pass locale-aware labels. A single-park city gets no crumb of its own, because its URL is a redirect.

## Redirect logic (404 prevention)

Malformed and stale park URLs are redirected rather than answered with a 404.
`lib/utils/redirect-utils.ts` builds a park-slug index from the continents document the layout has
already parsed (`getContinentsOrLastGood()`). Slugs are not globally unique (`disneyland-park` is
Paris and Anaheim), so every lookup returns all locations and disambiguates by continent and
country.

- `findCityPageRedirect()` / `findParkPageRedirect()`: a park slug in the city position (missing
  city segment).
- `findRelocatedParkRedirect()`: stale geo segments after the API re-slugged or moved a city
  (`bruhl` → `bruehl`, `marne-la-vallee` → `paris`). Keyed by the stable park slug; runs **only
  after** the API lookup for the requested path failed, so a lagging snapshot never bounces a
  working URL.
- `findRenamedParkRedirect()`: the API found the park but its own `url` differs from the
  requested path (slug renames the API follows with a silent 301).
- Glossary terms: a slug from another locale 308s to the local one (`findTermByAnySlug`,
  `lib/glossary/translations.ts`).

Called from the city, park, attraction, calendar, wait-time-record and "with kids" pages. Known
re-slugs, relocated cities, renamed parks (`toverland` → `attractiepark-toverland`,
`six-flags-hurricane-harbor-*` → `hurricane-harbor-*`), the pre-`/parks` scheme
(`/{locale}/{continent}/…`), doubled locale prefixes and cross-locale glossary segments also have
static redirects in `next.config.ts` (`redirects()`), which cover the bare city hubs too. Without
them every API re-slug would 404 the URLs Google has indexed.

A redirect thrown from a render carries the whole layout as its body; the calendar-month window
is therefore decided in `proxy.ts` instead
([the rule](../rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md)).

Examples:

- `/de/parks/europe/germany/phantasialand` → `/de/parks/europe/germany/bruehl/phantasialand`
- `/de/parks/europe/germany/bruhl/phantasialand/taron` → `…/bruehl/phantasialand/taron`
- `/nl/glossaire/harnais-epaules` → `/nl/woordenboek/<nl-slug>`
- `/it/europe/germany/bruehl/phantasialand` → `/it/parks/europe/germany/bruehl/phantasialand`

## Locale prefix

Every page is prefixed (`localePrefix: 'always'` in `i18n/routing.ts`), with `Accept-Language`
detection for the bare `/`.

**Unprefixed paths are crawled although nothing links them.** `Link` from `@/i18n/navigation`
takes a locale-relative `href`, and that prop is serialized into the RSC payload, where Google
finds it as a string. Search Console counted 5.9 % of Googlebot requests (2026-06-26 to 09-22) as
temporary redirects, 971 of 981 examples unprefixed: next-intl answered them with a 307 to the
`Accept-Language` locale, which for Googlebot is always `/en/…`, and `/en/…/calendrier-temps-attente/…`
is a 404. `proxy.ts` therefore answers first with a 308 wherever the target does not depend on the
visitor (`lib/i18n/unprefixed-redirect.ts`): a localized park sub-page segment goes to its own
locale, a request without `Accept-Language` goes to the default locale, and a wrong-case locale
prefix is lower-cased. Browsers with `Accept-Language` keep next-intl's negotiation; `/` is never
touched. `pnpm test:unprefixed-redirect`.

## Link prefetching

`Link` from `@/i18n/navigation` (`i18n/no-prefetch-link.tsx`) prefetches nothing unless a call
site passes `prefetch={true}`: viewport prefetch on long card lists requested pages that were
mostly never visited. A click still navigates client-side.

## Related

- [System overview](system-overview.md)
- [Backend integration](../api/backend-integration.md)
- [Crawl budget](../seo/crawl-budget.md): what Googlebot spends on redirects
