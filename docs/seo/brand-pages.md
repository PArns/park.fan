# Brand pages

Two chains have an overview page of their own: `/{locale}/parks/six-flags` lists every park whose
name starts with "Six Flags" or "Hurricane Harbor", `/{locale}/parks/universal` every park whose
name starts with "Universal", each grouped by country. They exist for the query families "six flags
wait times" (PAR-1170) and "universal wait times" / "universal studios wait times", which Google
answered with one park's page: Six Flags Great Adventure and Universal Studios Hollywood. Open this
before adding a third brand.

## Which parks

`lib/parks/park-brands.ts` decides membership by the park's name (`isBrandPark`, after
`stripNewPrefix`), read from the day-cached `/v1/discovery/geo`. A brand has a list of `names`: the
water parks are "Six Flags Hurricane Harbor" in full and only "Hurricane Harbor" in the catalog. The
API knows no operator, so a park owned by the company under another name (La Ronde, the former
Cedar Fair parks) is not listed. A hand-kept list of those would go stale the day a park is sold; a
name does not. A prefix matches a whole word: "Universal" takes "Universal Studios Japan" and
"Universal Volcano Bay", not "Universe of Energy". In October 2026 the catalog holds eight Universal
parks (Hollywood, the four in Orlando, Osaka, Singapore, Beijing) and no other name starting with
the word.

`brandParksByCountry` groups by country, the country with the most parks first, then the parks in
the order of `names` (theme parks before water parks) and by the name the page shows.
`pnpm test:park-brands` pins both, and that each brand claims only its own parks.

## The page

`components/parks/brand-page.tsx` holds the page (`BrandPage`) and its metadata
(`brandPageMetadata`); `app/[locale]/parks/six-flags/page.tsx` and `app/[locale]/parks/universal/page.tsx`
only pass their `ParkBrand`. The folders are static segments, so they win over `[continent]`. The
page renders like a country page: `PageHeader` with the count, an intro paragraph, then
`CountryParkGroups` with one group per country. The live status of all countries comes in one
`/api/parks/live` request: `CountryParkGroups` and `LiveParkGrid` take `regions`
(`"<continent>/<country>"` pairs), and the geo pages pass their one region.

Structured data is `BreadcrumbList` (Home › Continents › brand) and an `ItemList` of the parks.
Metadata: canonical, hreflang for six locales plus `x-default`, the `/parks` OG card. The title
names the count ("Six Flags Wartezeiten LIVE: alle 24 Parks") and falls back to a count-less one
when the geo tree cannot be read. Strings are the brand's `namespace` (`sixFlags`, `universal`).

The page reads the geo tree without `catchNonFatal`: an API error throws, so ISR keeps the last
good page instead of caching a 404 for the whole `revalidate`. Only a tree without a park of the
brand is a 404, and then the sitemap leaves the page out too.

## Links and the sitemap

Every park page of a brand park links the brand page from its address row (`ParkTitleHeader`,
`parkBrandOf`), so the page is reached from each park it lists. Every brand in `PARK_BRANDS` is in
`/sitemap.xml` with hreflang; its `<lastmod>` comes from the content-change crawl, which
fingerprints its park list like a geo hub (`lib/seo/content-changes/crawl.ts`).

## A third brand

Add a `ParkBrand` constant with its `slug`, `namespace` and `names` to `PARK_BRANDS` (and to the
`slug` and `namespace` unions), a page folder under `app/[locale]/parks/` that passes it to
`BrandPage` (a dynamic `[brand]` would collide with `[continent]`), the message namespace in six
locales (German compounds differ per brand: "Six-Flags-Parks"), and run
`pnpm generate:route-namespaces`. The sitemap, the crawl and the park page's link read
`PARK_BRANDS`.
