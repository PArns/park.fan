import { ParkResponse, ParkWithAttractions, Breadcrumb, ParkAttraction } from '@/lib/api/types';
import {
  Thing,
  WithContext,
  AmusementPark,
  BreadcrumbList,
  Organization,
  TouristAttraction,
  Article,
} from 'schema-dts';
import {
  getParkImageSet,
  getAttractionBackgroundImage,
  getAttractionImageSet,
} from '@/lib/utils/park-assets';

import { stripNewPrefix } from '@/lib/utils';
import { RSL_LICENSE_PATH } from '@/lib/agents/licensing';
import { buildOpeningHoursSpecification } from '@/lib/utils/opening-hours-schema';
import { buildWaitTimeObservations } from '@/lib/utils/wait-time-observations';
import { SITE_URL } from '@/i18n/config';

/**
 * Stable node identities so the graph is one entity, not a fresh anonymous
 * Organization on every page. Without them nothing tied `WebSite` to its
 * publisher, and a crawler had no way to know the Organization on a park page
 * and the one on the homepage were the same thing.
 */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * Third-party profiles that ARE park.fan, for `sameAs` — the edge an answer engine follows to
 * decide that the park.fan it read about somewhere else and this site are one entity. Empty for
 * now, and therefore omitted below rather than emitted as `sameAs: []`, which would be a claim
 * that the brand has no presence anywhere (the same reason `ParkStructuredData` drops an empty
 * one). Add a profile and it is one line.
 *
 * Only profiles of the ORGANISATION belong here. Patrick's personal accounts are a different
 * entity and already sit on the author's `Person` node in the blog's structured data; listing
 * them here would assert that the person and the company are the same thing.
 */
const ORGANIZATION_SAME_AS: readonly string[] = [];
const websiteId = (locale: string) => `${SITE_URL}/${locale}/#website`;

/*
 * A reference to a node another `<script type="application/ld+json">` on this page describes in
 * full — and the reason most of them below carry a `@type` they do not strictly need.
 *
 * `{'@id': …}` on its own is correct JSON-LD and resolves against whatever graph the consumer
 * happens to have merged. Inside one `@graph` that is the document itself and the reference is
 * complete; across two script blocks it is a promise about a node that may never be looked up,
 * and Search Console says so: the wait-time calendar's `Dataset` pointed `spatialCoverage` at the
 * park id declared in the *neighbouring* block and came back „Ungültiger Objekttyp für Feld
 * spatialCoverage" — an object with no type is not a `Place`, whatever the id would have led to.
 *
 * So the rule is: a reference that leaves its own script states its type. It costs one property,
 * it cannot go stale (a node's type is the one thing about it that does not change), and it is
 * the difference between a graph a consumer can read in one pass and one it can read only if it
 * chose to merge. The description itself stays where it is — restating a park's address on
 * 24,000 URLs is one entity written 24,000 times, free to drift from the first edit.
 *
 * The one field this rule does not settle is `Dataset.spatialCoverage`: a stated type is not
 * enough there, it has to be the type Google's Dataset parser lists. See
 * `ParkDatasetStructuredData`.
 */

/**
 * A `@graph` container is not a `Thing` — it sets already-built nodes side by side, which is how
 * the wait-time `Observation`s ship without duplicating every ride into the park node. The old
 * `as WithContext<Thing>` cast papered over that; the union states it instead.
 */
type SchemaGraph = { '@context': 'https://schema.org'; '@graph': readonly object[] };

type StructuredDataProps = {
  data: WithContext<Thing> | SchemaGraph;
};

/** Escapes JSON for safe use in script tags (prevents XSS in JSON-LD). */
export function escapeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function JsonLd({ data }: StructuredDataProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
  );
}

/**
 * Article JSON-LD for static guide pages (e.g. /howto). Google retired HowTo
 * rich results in 2023, so a plain Article with publisher is the appropriate
 * markup for long-form guide content.
 */
export function ArticleStructuredData({
  title,
  description,
  url,
  locale,
  image,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  locale: string;
  image?: string;
  /** `YYYY-MM-DD`. Optional — a guide with no meaningful publication date omits it. */
  datePublished?: string;
  /**
   * `YYYY-MM-DD`. Worth setting on an evergreen guide: it is the only signal
   * that separates a page kept current from one written once and abandoned, and
   * Google shows it in the result. Must be a date the content actually changed,
   * so it is written by hand rather than derived from the build clock — a
   * timestamp that moves on every deploy says nothing and is arguably a lie.
   */
  dateModified?: string;
}) {
  const data: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    mainEntityOfPage: url,
    url,
    inLanguage: locale,
    ...(image && { image }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    author: { '@type': 'Organization', name: 'park.fan', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'park.fan',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  };
  return <JsonLd data={data} />;
}

/**
 * FAQPage JSON-LD for guide pages that answer a set of recurring questions
 * (e.g. the Fancast model page). Enables the FAQ rich result in Google when the
 * page is eligible. Pass plain-text Q&A pairs — no markup inside answers.
 */
export function FaqStructuredData({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: string }>;
}) {
  // schema-dts doesn't ship a `FAQPage` member in the pinned version, so we
  // build the JSON-LD as a plain object and reuse the shared escaper/renderer.
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
  );
}

/**
 * Builds the JSON-LD `image` value from a park/ride image set.
 *
 * Real park/ride photos are always preferred; the OG card is used ONLY as a
 * fallback when no such photo exists (Google then still has something to show,
 * but never in place of a real picture). Site-relative paths are absolutized;
 * a multi-crop set becomes an array (Google's recommended multi-aspect input),
 * a single image stays a string.
 */
function buildStructuredImage(
  imageSet: string[],
  ogFallback?: string
): string | string[] | undefined {
  const absolute = imageSet.map((src) => (src.startsWith('http') ? src : `${SITE_URL}${src}`));
  if (absolute.length === 0) return ogFallback;
  return absolute.length === 1 ? absolute[0] : absolute;
}

/** Normalizes raw API cuisineType values to proper display names. */
function normalizeCuisineType(cuisineType: string | null): string | undefined {
  if (!cuisineType) return undefined;
  const map: Record<string, string> = {
    cafe: 'Café',
    fondu: 'Fondue',
  };
  return map[cuisineType.toLowerCase()] ?? cuisineType;
}

/**
 * `Organization` JSON-LD for park.fan: name, logo, description, contact point and an optional
 * image.
 */
export function OrganizationStructuredData({
  description,
  image,
}: {
  description?: string;
  /** Representative image (e.g. the homepage OG card) — a thumbnail candidate for brand results. */
  image?: string;
}) {
  const data: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'park.fan',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    ...(image && { image }),
    description:
      description ||
      'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts for 200+ theme parks worldwide.',
    ...(ORGANIZATION_SAME_AS.length > 0 && { sameAs: [...ORGANIZATION_SAME_AS] }),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: SITE_URL,
    },
  };

  return <JsonLd data={data} />;
}

/**
 * WebSite schema with SearchAction – helps Google show sitelinks search box and
 * understand site structure. Locale-aware so each language has correct search URL.
 */
export function WebSiteStructuredData({
  locale,
  siteName = 'park.fan',
  description,
  image,
}: {
  locale: string;
  siteName?: string;
  description?: string;
  /** Representative image (e.g. the locale's homepage OG card). */
  image?: string;
}) {
  const baseUrl = `${SITE_URL}/${locale}`;
  const searchUrl = `${baseUrl}/search?q={search_term_string}`;

  const data = {
    '@context': 'https://schema.org' as const,
    '@type': 'WebSite' as const,
    '@id': websiteId(locale),
    name: siteName,
    url: baseUrl,
    // Points at the Organization node rather than restating it — the same
    // publisher on all six locales instead of six unrelated ones.
    publisher: { '@type': 'Organization', '@id': ORGANIZATION_ID },
    ...(description && { description }),
    ...(image && { image }),
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction' as const,
      target: {
        '@type': 'EntryPoint' as const,
        urlTemplate: searchUrl,
      },
      'query-input': 'required name=search_term_string' as const,
    },
  };

  return <JsonLd data={data as WithContext<Thing>} />;
}

/**
 * `ItemList` of `SiteNavigationElement` JSON-LD naming the main navigation's destinations, in the
 * order the caller passes.
 */
export function SiteNavigationStructuredData({
  locale,
  items,
}: {
  locale: string;
  /** Label + path (locale-relative, leading slash) of each entry of the main navigation. */
  items: { name: string; path: string }[];
}) {
  const baseUrl = `${SITE_URL}/${locale}`;

  /*
   * What the header's main navigation is, stated rather than inferred.
   *
   * Google works the primary navigation out from the markup on its own, so this is a hint, not a
   * requirement — which is exactly why it stays SHORT. It names six destinations (five where the
   * blog has nothing published), news where there is any, and the five continent hubs, and stops there. The 23 country links are in the rendered `<nav>` where they
   * belong; repeating them here would put a second copy of the same list into the head of every
   * one of ~35,000 pages to tell the crawler something the markup already says.
   *
   * It used to say "the five bar entries", and that stopped being true when four of them moved
   * behind the "Mehr" trigger: they are still in the main navigation, one level down in a band
   * that is `hidden` rather than unmounted, so the hint is unchanged and only its description was.
   *
   * An `ItemList` rather than a bare array, because `position` is the only way to state an order at
   * all — and the order is this list's own, not a copy of any surface's. It has not mirrored the
   * bar since the blog moved out of it, and the caller is where it is decided
   * (`app/[locale]/layout.tsx`).
   */
  const data = {
    '@context': 'https://schema.org' as const,
    '@type': 'ItemList' as const,
    name: 'park.fan',
    itemListElement: items.map((item, index) => ({
      '@type': 'SiteNavigationElement' as const,
      position: index + 1,
      name: item.name,
      url: `${baseUrl}${item.path}`,
    })),
  };

  return <JsonLd data={data as WithContext<Thing>} />;
}

/**
 * `AmusementPark` JSON-LD for a park page (address, coordinates, opening hours, rides and
 * restaurants) plus a `WebPage` node and the current wait times as `Observation` nodes.
 */
export function ParkStructuredData({
  park,
  url,
  description,
  locale,
  ogImageUrl,
}: {
  park: ParkResponse | ParkWithAttractions;
  url: string;
  description?: string;
  locale?: string;
  /** OG-card URL — used only as a fallback when the park has no real photo. */
  ogImageUrl?: string;
}) {
  const parkName = stripNewPrefix(park.name);
  const info = 'info' in park ? park.info : null;
  const parkSameAs = [
    info?.website,
    info?.wikipediaUrl,
    info?.instagramUrl,
    info?.facebookUrl,
    info?.youtubeUrl,
  ].filter((entry): entry is string => Boolean(entry));
  const data: WithContext<AmusementPark> = {
    '@context': 'https://schema.org',
    '@type': 'AmusementPark',
    // Same reason the rides below carry ids: so the `WebPage` node can point at the park as the
    // thing this page is about, instead of describing it a second time and disagreeing.
    '@id': url,
    name: parkName,
    url: url,
    ...(locale && { inLanguage: locale }),
    description: description || `Real-time wait times and crowd levels for ${parkName}.`,
    image: buildStructuredImage(getParkImageSet(park.slug), ogImageUrl),
    address: {
      '@type': 'PostalAddress',
      // Street and postcode are curated — nothing upstream carries them, so
      // before they existed this claimed a locality and a country and left
      // Google to guess the rest.
      streetAddress: info?.streetAddress || undefined,
      postalCode: info?.postalCode || undefined,
      addressLocality: park.city || undefined,
      addressCountry: park.country || undefined,
      addressRegion: park.region || undefined,
    },
    telephone: info?.phone || undefined,
    // The park's own presence, so a search engine can tie this page to the
    // entity rather than treating it as an unrelated site about the same name.
    // Omitted when the API curates none — an empty `sameAs: []` is a claim that
    // the park has no presence anywhere, which is never what we mean.
    sameAs: parkSameAs.length ? parkSameAs : undefined,
    geo:
      park.latitude && park.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: park.latitude,
            longitude: park.longitude,
          }
        : undefined,
    // `opens`/`closes` are schema.org `Time` values in the park's own timezone,
    // not the UTC instants the API sends — see buildOpeningHoursSpecification.
    openingHoursSpecification: buildOpeningHoursSpecification(park.schedule, park.timezone),
    containsPlace: [
      ...('attractions' in park && park.attractions
        ? park.attractions.map((attraction) => {
            const attrImg = getAttractionBackgroundImage(park.slug, attraction.slug);
            return {
              '@type': 'TouristAttraction' as const,
              // Same reason the Organization and WebSite nodes carry ids: so the
              // ride is one entity on the page rather than several anonymous
              // descriptions of it. The wait-time `Observation` below points
              // here instead of repeating the ride's name.
              '@id': `${url}/${attraction.slug}`,
              name: stripNewPrefix(attraction.name),
              url: `${url}/${attraction.slug}`,
              image: attrImg ? `${SITE_URL}${attrImg}` : undefined,
            };
          })
        : []),
      ...('restaurants' in park && park.restaurants
        ? park.restaurants.map((restaurant) => ({
            '@type': 'FoodEstablishment' as const,
            name: stripNewPrefix(restaurant.name),
            servesCuisine: normalizeCuisineType(restaurant.cuisineType),
          }))
        : []),
    ],
  };

  // Current standby waits as `Observation` nodes, in their own block rather than
  // inside `AmusementPark` — a park does not have a property for "measurements taken
  // about me", and the readings are about the rides anyway, which they reference
  // by the `@id` those rides carry above. `undefined` for parks whose waits we
  // cannot read; see buildWaitTimeObservations for the full selection rule.
  const observations = 'attractions' in park ? buildWaitTimeObservations(park, url) : undefined;

  // When this page's content last changed, which on a park page is the freshest wait-time reading
  // on it. It goes on a `WebPage` node rather than onto `AmusementPark`: `dateModified` is a
  // property of CreativeWork, and a park is a Place — the date describes the document, not the
  // park. Omitted when there is no reading at all (a park whose waits we cannot read, one shut
  // for the season): a stated modification date we cannot support is worse than none.
  //
  // Lexicographic max is safe here because every value is the same field from the same API, an
  // ISO-8601 instant in UTC (`2026-08-23T08:13:23.908Z`).
  const latestObservation = observations?.reduce<string | undefined>(
    (latest, observation) =>
      observation.observationDate && (!latest || observation.observationDate > latest)
        ? observation.observationDate
        : latest,
    undefined
  );

  const webPage = {
    '@type': 'WebPage' as const,
    '@id': `${url}#webpage`,
    url,
    name: parkName,
    ...(locale && {
      inLanguage: locale,
      isPartOf: { '@type': 'WebSite', '@id': websiteId(locale) },
    }),
    mainEntity: { '@type': 'AmusementPark', '@id': url },
    ...(latestObservation && { dateModified: latestObservation }),
  };

  return (
    <>
      <JsonLd data={data} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [webPage, ...(observations ?? [])],
        }}
      />
    </>
  );
}

/**
 * ItemList schema for listing pages (Continent = countries, Country/City = parks).
 * Helps search engines understand the page as a list of items.
 */
export function ItemListStructuredData({
  items,
  listName,
  pageUrl,
}: {
  /**
   * `image` (when provided) gives Google a per-item thumbnail candidate — the
   * signal that lets list/hub pages surface picture results in the SERP. Pass
   * an absolute or site-relative path; `null`/omitted items simply carry no image.
   */
  items: { name: string; url: string; image?: string | null }[];
  listName?: string;
  pageUrl: string;
}) {
  if (!items || items.length === 0) return null;

  const toAbsolute = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path}`);

  const data = {
    '@context': 'https://schema.org' as const,
    '@type': 'ItemList' as const,
    ...(listName && { name: listName }),
    url: toAbsolute(pageUrl),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: item.name,
      item: toAbsolute(item.url),
      ...(item.image && { image: toAbsolute(item.image) }),
    })),
  };

  return <JsonLd data={data as WithContext<Thing>} />;
}

/**
 * `WebApplication` for a page that IS a tool rather than a document about one (the trip planner).
 * It runs in the browser, costs nothing and needs no account, and those are the three facts this
 * node states. No `aggregateRating`: there are no ratings to report, so Google shows no software
 * rich result for it, and that is the honest outcome. What the node buys is the entity: an answer
 * engine reading the page learns it is a free web app by park.fan, not an article.
 */
export function WebApplicationStructuredData({
  name,
  description,
  path,
  locale,
}: {
  name: string;
  description: string;
  /** Locale-prefixed path, e.g. `/de/tagesplaner`. */
  path: string;
  locale: string;
}) {
  const url = `${SITE_URL}${path}`;
  const data = {
    '@context': 'https://schema.org' as const,
    '@type': 'WebApplication' as const,
    '@id': `${url}#app`,
    name,
    description,
    url,
    inLanguage: locale,
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer' as const, price: '0', priceCurrency: 'EUR' },
    publisher: { '@type': 'Organization', '@id': ORGANIZATION_ID },
    isPartOf: { '@id': websiteId(locale) },
  };

  return <JsonLd data={data as WithContext<Thing>} />;
}

/**
 * `BreadcrumbList` JSON-LD from the page's breadcrumbs, optionally ending with the current page,
 * with locale-prefixed absolute URLs. Renders nothing for an empty trail.
 */
export function BreadcrumbStructuredData({
  breadcrumbs,
  currentPage,
  locale,
}: {
  breadcrumbs: Breadcrumb[];
  /**
   * The page being rendered, as the trail's last item.
   *
   * Separate from `breadcrumbs` because the VISIBLE trail already takes it separately —
   * `BreadcrumbNav` draws it unlinked, as the leaf you are standing on — so a page that hands it
   * to both would render it twice on screen. Google's examples end the list with the current
   * page, and every geo, park, ride and calendar page here stopped one level short of it: the
   * park page's trail ended at „Brühl", the ride page's at „Phantasialand", the calendar's at
   * „Phantasialand" as well. A breadcrumb rich result for the calendar therefore advertised the
   * park. The glossary has passed its own leaf all along; this is the rest of the site catching
   * up.
   *
   * The URL is the page's own — the same one its canonical points at.
   */
  currentPage?: Breadcrumb;
  locale?: string;
}) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;
  const trail = currentPage ? [...breadcrumbs, currentPage] : breadcrumbs;

  const toAbsoluteUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    if (!locale) return `${SITE_URL}${url}`;
    // Home shorthand
    if (url === '/') return `${SITE_URL}/${locale}`;
    // Already has this locale prefix — don't double-prefix
    if (url === `/${locale}` || url.startsWith(`/${locale}/`)) return `${SITE_URL}${url}`;
    return `${SITE_URL}/${locale}${url}`;
  };

  const data: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: toAbsoluteUrl(crumb.url),
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * `TouristAttraction` JSON-LD for a ride page: name, description, image, coordinates and its park
 * as `containedInPlace`, linked by the same `@id`s the park page uses.
 */
export function AttractionStructuredData({
  attraction,
  park,
  url,
  description,
  locale,
  ogImageUrl,
}: {
  /**
   * Name and slug, plus the ride's own coordinates when the caller has them. A closed ride passes
   * its detail response's pair only.
   */
  attraction: Pick<ParkAttraction, 'name' | 'slug'> &
    Partial<Pick<ParkAttraction, 'latitude' | 'longitude'>>;
  park: ParkResponse | ParkWithAttractions;
  url: string;
  description?: string;
  locale?: string;
  /** OG-card URL — used only as a fallback when neither the ride nor its park has a photo. */
  ogImageUrl?: string;
}) {
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park.name);
  // The park page lists this ride in `containsPlace` under `@id: <ride URL>` and states itself as
  // `@id: <park URL>`. Both ids here, so the two pages describe one ride inside one park instead
  // of a second, unconnected ride next to an anonymous park (SEO run, 2026-10-03).
  const parkUrl = url.split('/').slice(0, -1).join('/');
  const { latitude, longitude } = attraction;
  const data: WithContext<TouristAttraction> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    '@id': url,
    name: attractionName,
    url: url,
    ...(locale && { inLanguage: locale }),
    description:
      description || `${attractionName} at ${parkName} - Real-time wait times and status.`,
    image: buildStructuredImage(getAttractionImageSet(park.slug, attraction.slug), ogImageUrl),
    ...(latitude != null &&
      longitude != null && {
        geo: { '@type': 'GeoCoordinates', latitude, longitude },
      }),
    containedInPlace: {
      '@type': 'AmusementPark',
      '@id': parkUrl,
      name: parkName,
      url: parkUrl,
    },
    address:
      park.city || park.country
        ? {
            '@type': 'PostalAddress',
            addressLocality: park.city || undefined,
            addressCountry: park.country || undefined,
            addressRegion: park.region || undefined,
          }
        : undefined,
  };

  return <JsonLd data={data} />;
}

/**
 * The `WebPage` node for a park SUB-page — today the wait-time calendar and its months.
 *
 * These pages carried `Organization`, `WebSite`, `BreadcrumbList` and `ItemList` and nothing that
 * said what they are about. A crawler could see a breadcrumb ending in „Wartezeiten-Kalender" and
 * had to infer the rest, on a class of 1,272 hubs plus 22,896 month URLs — the largest set of
 * pages on the site with no declared subject.
 *
 * It points at the park with `about` rather than describing it again. The park page emits the
 * `AmusementPark` with `@id` set to its own URL precisely so another node can reference it, and a
 * second full copy of the place on 24,000 URLs would be the same entity stated 24,000 times, free
 * to drift the moment one of them is edited. `about` and not `mainEntity`, because the primary
 * thing here is the calendar, not the park.
 *
 * `FAQPage` is deliberately still absent. The visible FAQ is shared furniture across every page
 * of a park; the structured data may not be, or one set of questions competes with itself on
 * every URL the park has.
 */
export function ParkSubPageStructuredData({
  url,
  parkUrl,
  parkName,
  name,
  locale,
}: {
  /** This page's canonical URL. */
  url: string;
  /** The park page's URL, which is also the `@id` of its `AmusementPark` node. */
  parkUrl: string;
  /** Names the stub below — without it `about` points at nothing this document contains. */
  parkName: string;
  /** The page's own name — the month for a month page, so the 25 do not share one. */
  name: string;
  locale?: string;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${url}#webpage`,
            url,
            name,
            ...(locale && {
              inLanguage: locale,
              isPartOf: { '@type': 'WebSite', '@id': websiteId(locale) },
            }),
            // The only reference on this page that stays inside its own document: the stub
            // below is two lines down, in this same `@graph`.
            about: { '@id': parkUrl },
          },
          // The stub for the thing `about` points at.
          //
          // `@id` on its own is a cross-document reference: correct JSON-LD, and worth nothing to
          // a consumer reading this page without also fetching and merging the park page. The
          // full `AmusementPark` — address, hours, photos, socials — lives there and stays there,
          // because restating it on 24,000 URLs is one entity written 24,000 times and free to
          // drift from the moment one of them is edited. A type and a name are enough to make the
          // reference mean something here, and neither can go stale.
          { '@type': 'AmusementPark', '@id': parkUrl, name: parkName, url: parkUrl },
        ],
      }}
    />
  );
}

/**
 * `Dataset` for a table of measurements about one park — the crowd calendar's month, or the
 * wait-time record's two-year window.
 *
 * Neither page is prose about a park; each is a table of one row per day or per hour, and
 * `Dataset` is what schema.org has for that. wartezeiten.app marks its own calendar pages the
 * same way, which is what prompted this, but the shape here is deliberately narrower than theirs
 * in three places because a `Dataset` makes claims a page has to be able to honour.
 *
 * Everything that differs between the two pages arrives as a prop — the name, the description,
 * the covered interval and the list of values measured — so there is one node shape and one place
 * where its rules are written down.
 *
 * **`variableMeasured` lists what the grid actually draws** and nothing else. It is passed in by
 * the caller, already translated, rather than assembled from a fixed English list — the node
 * carries `inLanguage`, so its human-readable strings have to be in that language too.
 *
 * **No `distribution`.** That property means „here is the file", and there is no download. Naming
 * one would send Dataset Search at a URL that does not exist.
 *
 * **No `dateModified`.** A crowd forecast shifts a little every morning on all 212 parks at once,
 * so a modification date here would be one identical value across the whole catalogue — exactly
 * the signal docs/seo/sitemaps.md keeps out of `<lastmod>`, for the same reason.
 *
 * `creator` is a reference, not a copy: the site `Organization` already exists under that id, and
 * restating it on 24,000 URLs is one entity described 24,000 times, free to drift the moment one
 * is edited. It carries a `@type` because it points out of this script — see the note above
 * `ORGANIZATION_ID`.
 *
 * **`spatialCoverage` is a plain `Place`, and it carries no `@id`.** Google's Dataset parser takes
 * `Text` or `Place` there and nothing else — not a subtype, although schema.org makes
 * `AmusementPark` one (through `LocalBusiness`); the same parser rejects `Country`. Search Console
 * has reported „Ungültiger Objekttyp für Feld spatialCoverage" twice. In August the value was a
 * bare `{'@id': …}` with no type at all; the fix typed it `AmusementPark`, and from 23 September
 * the wait-time records came back with the same error, 137 items on the first day.
 * The park's `@id` stays off this node on purpose: it is the id of the `AmusementPark` stub in
 * `ParkSubPageStructuredData`'s `@graph`, and a consumer that merges the page's blocks would fold
 * the two into one node typed `AmusementPark` again. The link from this page to the park is that
 * stub and the `WebPage`'s `about`, not this field.
 *
 * What the `Place` does carry is the name, the park page's URL, and the park's coordinates when
 * the API has them: a single point is the form Google documents, and a name and a point do not
 * drift the way an address or opening hours would.
 */
export function ParkDatasetStructuredData({
  url,
  parkUrl,
  parkName,
  parkLatitude,
  parkLongitude,
  name,
  description,
  temporalCoverage,
  variableMeasured,
  locale,
}: {
  url: string;
  /** The park page's URL — `spatialCoverage.url`, not its `@id` (see above). */
  parkUrl: string;
  /** Names `spatialCoverage`, the one value here a consumer renders rather than follows. */
  parkName: string;
  /** The park's coordinates. `spatialCoverage` states no `geo` unless both are known. */
  parkLatitude: number | null;
  parkLongitude: number | null;
  /** The dataset's own name — the park AND what is tabulated, not the park alone. */
  name: string;
  description: string;
  /** ISO-8601 interval this page's figures were measured over, e.g. `2026-11-01/2026-11-30`. */
  temporalCoverage: string;
  /** Localized names of the values the table renders. */
  variableMeasured: string[];
  locale?: string;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        url,
        name,
        description,
        temporalCoverage,
        spatialCoverage: {
          '@type': 'Place',
          name: parkName,
          url: parkUrl,
          ...(parkLatitude != null &&
            parkLongitude != null && {
              geo: { '@type': 'GeoCoordinates', latitude: parkLatitude, longitude: parkLongitude },
            }),
        },
        creator: { '@type': 'Organization', '@id': ORGANIZATION_ID },
        license: `${SITE_URL}${RSL_LICENSE_PATH}`,
        isAccessibleForFree: true,
        ...(locale && { inLanguage: locale }),
        variableMeasured: variableMeasured.map((v) => ({
          '@type': 'PropertyValue' as const,
          name: v,
        })),
      }}
    />
  );
}
