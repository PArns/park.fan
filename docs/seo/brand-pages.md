# Brand pages

`/{locale}/parks/six-flags` lists every park whose name starts with "Six Flags" or "Hurricane
Harbor", grouped by country. It exists for the query family "six flags wait times", which Google
answered with Six Flags Great Adventure's park page (PAR-1170). Open this before adding a second
brand.

## Which parks

`lib/parks/park-brands.ts` decides membership by the park's name (`isBrandPark`, after
`stripNewPrefix`), read from the day-cached `/v1/discovery/geo`. A brand has a list of `names`: the
water parks are "Six Flags Hurricane Harbor" in full and only "Hurricane Harbor" in the catalog. The
API knows no operator, so a park owned by the company under another name (La Ronde, the former
Cedar Fair parks) is not listed. A hand-kept list of those would go stale the day a park is sold; a
name does not.

`brandParksByCountry` groups by country, the country with the most parks first, then the parks in
the order of `names` (theme parks before water parks) and by the name the page shows.
`pnpm test:park-brands` pins both.

## The page

`app/[locale]/parks/six-flags/page.tsx` is a static segment, so it wins over `[continent]`. It
renders like a country page: `PageHeader` with the count, an intro paragraph, then
`CountryParkGroups` with one group per country. The live status of all countries comes in one
`/api/parks/live` request: `CountryParkGroups` and `LiveParkGrid` take `regions`
(`"<continent>/<country>"` pairs), and the geo pages pass their one region.

Structured data is `BreadcrumbList` (Home › Continents › Six Flags) and an `ItemList` of the parks.
Metadata: canonical, hreflang for six locales plus `x-default`, the `/parks` OG card. The title
names the count ("Six Flags Wartezeiten LIVE: alle 24 Parks") and falls back to a count-less one
when the geo tree cannot be read. Strings are the `sixFlags` namespace.

The page reads the geo tree without `catchNonFatal`: an API error throws, so ISR keeps the last
good page instead of caching a 404 for the whole `revalidate`. Only a tree without a park of the
brand is a 404, and then the sitemap leaves the page out too.

## Links and the sitemap

Every park page of a brand park links the brand page from its address row (`ParkTitleHeader`,
`parkBrandOf`), so the page is reached from each park it lists. It is in `/sitemap.xml` with
hreflang; its `<lastmod>` comes from the content-change crawl, which fingerprints its park list
like a geo hub (`lib/seo/content-changes/crawl.ts`).

## A second brand

Add a `ParkBrand` constant with its `names`, a page folder under `app/[locale]/parks/` (a dynamic
`[brand]` would collide with `[continent]`), a message namespace (German compounds differ per
brand: "Six-Flags-Parks"), the sitemap entry and the crawl fingerprint, and extend `parkBrandOf`.
