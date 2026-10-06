import { ParkResponse, ParkWithAttractions, Breadcrumb, ParkAttraction } from '@/lib/api/types';
import {
  Thing,
  WithContext,
  AmusementPark,
  BreadcrumbList,
  Organization,
  TouristAttraction,
  Article,
  FAQPage,
  Question,
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
 * Stable node identities, so the Organization on every page, and the `WebSite` that names it as
 * publisher, are one entity rather than a fresh anonymous node per page.
 */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * Third-party profiles that are park.fan itself, for `sameAs`. Omitted while empty, since
 * `sameAs: []` claims no presence anywhere. Organisation profiles only: Patrick's accounts belong
 * on the author's `Person` node in the blog's structured data.
 */
const ORGANIZATION_SAME_AS: readonly string[] = [];
const websiteId = (locale: string) => `${SITE_URL}/${locale}/#website`;

/*
 * A reference that leaves its own `<script type="application/ld+json">` states its `@type`. A bare
 * `{'@id': …}` resolves only for a consumer that merges the page's blocks, and Search Console
 * rejects it as an invalid object type; the type costs one property and cannot go stale, while the
 * full description stays in one place. `Dataset.spatialCoverage` has a stricter rule, see
 * `ParkDatasetStructuredData`.
 */

/**
 * A `@graph` container is not a `Thing`: it sets built nodes side by side, which is how the
 * wait-time `Observation`s ship without duplicating every ride into the park node.
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
 * Article JSON-LD for static guide pages (e.g. /howto). Google retired HowTo rich results in 2023,
 * so long-form guides get a plain Article with a publisher.
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
   * `YYYY-MM-DD`, written by hand: the date the content last changed, the only signal that a guide
   * is kept current. A build timestamp would move on every deploy and say nothing.
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
 * FAQPage JSON-LD for a page that renders the same questions, from plain-text Q&A pairs (no
 * markup inside answers).
 */
export function FaqStructuredData({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: string }>;
}) {
  const data: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item): Question => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  return <JsonLd data={data} />;
}

/**
 * Builds the JSON-LD `image` value from a park/ride image set: real photos first, the OG card only
 * when there is none. A multi-crop set becomes an array, Google's recommended multi-aspect input.
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
 * `WebSite` JSON-LD with a `SearchAction`, per locale so each language has its own search URL.
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
   * The header's main navigation, stated as a hint and kept short: the main destinations, news
   * where there is any, and the five continent hubs. The country links stay in the rendered `<nav>`
   * rather than in the head of every page. An `ItemList` because `position` is the only way to
   * state an order, and the order is decided by the caller (`app/[locale]/layout.tsx`).
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
      // Street and postcode are curated; nothing upstream carries them.
      streetAddress: info?.streetAddress || undefined,
      postalCode: info?.postalCode || undefined,
      addressLocality: park.city || undefined,
      addressCountry: park.country || undefined,
      addressRegion: park.region || undefined,
    },
    telephone: info?.phone || undefined,
    // The park's own presence, so a search engine ties this page to the entity. Omitted when none
    // is curated: `sameAs: []` claims no presence anywhere.
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
              // An id, so the ride is one entity on the page and the wait-time `Observation` below
              // can point here instead of repeating its name.
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

  // Current standby waits as `Observation` nodes in their own block: a park has no property for
  // measurements about it, and the readings are about the rides, referenced by their `@id`.
  // `undefined` for parks whose waits we cannot read; see buildWaitTimeObservations.
  const observations = 'attractions' in park ? buildWaitTimeObservations(park, url) : undefined;

  // The freshest wait-time reading, as the `WebPage`'s `dateModified`: it is a CreativeWork
  // property, and a park is a Place. Omitted when there is no reading, since an unsupported date is
  // worse than none. A lexicographic max is safe: every value is the same API's ISO-8601 UTC
  // instant.
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
 * `ItemList` JSON-LD for listing pages (a continent lists countries; a country or city, parks).
 */
export function ItemListStructuredData({
  items,
  listName,
  pageUrl,
}: {
  /**
   * `image` gives Google a per-item thumbnail candidate, which lets hub pages surface picture
   * results. Absolute or site-relative; `null` or omitted carries no image.
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
 * `WebApplication` for a page that is a tool rather than a document (the trip planner): it runs in
 * the browser, is free and needs no account. No `aggregateRating`: there are no ratings to report.
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
   * The page being rendered, as the trail's last item, with its canonical URL. Separate from
   * `breadcrumbs` because `BreadcrumbNav` draws the leaf unlinked and would otherwise render it
   * twice; Google's examples end the list with the current page.
   */
  currentPage?: Breadcrumb;
  locale?: string;
}) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;
  const trail = currentPage ? [...breadcrumbs, currentPage] : breadcrumbs;

  const toAbsoluteUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    if (!locale) return `${SITE_URL}${url}`;
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
  // The park page lists this ride under `@id: <ride URL>` and itself under `@id: <park URL>`; both
  // ids here make the two pages describe one ride inside one park.
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
 * The `WebPage` node for a park sub-page (the wait-time calendar and its months), so the page
 * declares its subject. It points at the park with `about` rather than describing it again, and
 * uses `about` rather than `mainEntity` because the calendar is the primary thing. No `FAQPage`:
 * the same questions on every URL of a park would compete with each other.
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
          // The stub for `about`: a bare `@id` means nothing to a consumer that does not also fetch
          // the park page, so it states a type and a name, neither of which can go stale.
          { '@type': 'AmusementPark', '@id': parkUrl, name: parkName, url: parkUrl },
        ],
      }}
    />
  );
}

/**
 * `Dataset` for a table of measurements about one park: the crowd calendar's month, or the
 * wait-time record's two-year window. Narrower than the type allows, because a `Dataset` makes
 * claims a page has to honour:
 *
 * - `variableMeasured` lists what the grid draws, translated, since the node carries `inLanguage`.
 * - No `distribution`: there is no download to point at.
 * - No `dateModified`: the forecast shifts every morning on every park at once, the signal
 *   docs/seo/sitemaps.md keeps out of `<lastmod>`.
 * - `spatialCoverage` is a plain `Place` with no `@id`. Google's Dataset parser takes `Text` or
 *   `Place` only, not a subtype such as `AmusementPark`, and the park's `@id` would merge it into
 *   the `AmusementPark` stub. It carries the name, the park page's URL and, when known, a point.
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
