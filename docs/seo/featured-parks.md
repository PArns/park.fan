# Featured parks

The "popular parks" cards on the homepage and at the foot of the blog, news and glossary pages:
how the six parks per locale are chosen and how to edit the hand-picked fallback list. Open it
before changing `FEATURED_PARK_SLUGS`. For the site they are the main internal links from the
homepage to park pages, taking the most-read parks from four clicks deep (home → continent →
country → city → park) to one.

## How it works

- **Server-rendered structure:** `FeaturedParksSlot` (`components/home/featured-parks-slot.tsx`)
  reads the 24 h-cached `getGeoStructure()` and bakes only day-stable fields (name, link, city,
  photo, translated country). A shorter geo window here would pin every host page to it
  ([a `revalidate` at a call site is somebody else's page](../rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md)).
  On the homepage it is a story chapter; elsewhere it is part of `PageBottomSections`.
- **Which parks:** `extractFeaturedParks()` (`components/home/featured-parks-section.ts`) takes the
  parks this locale's readers opened most in the last 30 days first (the build's `viewedParksSeed`,
  at least `VIEWED_PARK_MIN_VIEWS` views each, [most read](../features/most-read.md#popular-parks)),
  then the hand-picked `FEATURED_PARK_SLUGS` in their order, until there are as many cards as the
  hand-picked list is long.
- **Live data** (status, crowd, wait, schedule) overlays on the client through
  `FeaturedParkCardsLive` → `useRegionParks`, one `/api/discovery/<continent>/<country>` batch per
  region with the 5-minute poll, as on the hub pages' `LiveParkGrid`. The server-rendered card is
  status-free.

## Editing the hand-picked list

The list at the top of `featured-parks-section.ts` is the fallback and the length: it fills the
row where too few parks were counted. Each entry carries its reason as a comment (attendance and
language-market search relevance).

- A slug must exist in `/v1/discovery/geo`; one that is not found is dropped with a warning, and
  the section hides only when no park is found.
- Order is display order behind the counted parks.
- A locale without a list uses `en`.
- **`disneyland-park` is two parks** (Paris and Anaheim). The first match in the structure wins and
  Europe is walked before North America, so it always resolves to Paris. For Anaheim, match by
  path or use another slug.
