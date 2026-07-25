import {
  ParkResponse,
  ParkWithAttractions,
  Breadcrumb,
  ParkAttraction,
  ParkShow,
} from '@/lib/api/types';
import {
  Thing,
  WithContext,
  ThemePark,
  BreadcrumbList,
  Organization,
  Attraction,
  Article,
} from 'schema-dts';
import {
  getParkBackgroundImage,
  getParkImageSet,
  getAttractionImageSet,
} from '@/lib/utils/park-assets';
import { getAttractionImage } from '@/lib/attraction-images';
import { stripNewPrefix } from '@/lib/utils';
import { SITE_URL } from '@/i18n/config';

type StructuredDataProps<T extends Thing> = {
  data: WithContext<T>;
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

function JsonLd<T extends Thing>({ data }: StructuredDataProps<T>) {
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
}: {
  title: string;
  description: string;
  url: string;
  locale: string;
  image?: string;
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
    name: 'park.fan',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    ...(image && { image }),
    description:
      description ||
      'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts for 142+ theme parks worldwide.',
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
    name: siteName,
    url: baseUrl,
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
  const data: WithContext<ThemePark> = {
    '@context': 'https://schema.org',
    '@type': 'ThemePark',
    name: parkName,
    url: url,
    ...(locale && { inLanguage: locale }),
    description: description || `Real-time wait times and crowd levels for ${parkName}.`,
    image: buildStructuredImage(getParkImageSet(park.slug), ogImageUrl),
    address: {
      '@type': 'PostalAddress',
      addressLocality: park.city || undefined,
      addressCountry: park.country || undefined,
      addressRegion: park.region || undefined,
    },
    geo:
      park.latitude && park.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: park.latitude,
            longitude: park.longitude,
          }
        : undefined,
    openingHoursSpecification: park.schedule?.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      opens: s.openingTime || undefined,
      closes: s.closingTime || undefined,
      validFrom: s.date,
      validThrough: s.date,
    })),
    containsPlace: [
      ...('attractions' in park && park.attractions
        ? park.attractions.map((attraction) => {
            const attrImg = getAttractionImage(park.slug, attraction.slug);
            return {
              '@type': 'TouristAttraction' as const,
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

  return <JsonLd data={data} />;
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

export function BreadcrumbStructuredData({
  breadcrumbs,
  locale,
}: {
  breadcrumbs: Breadcrumb[];
  locale?: string;
}) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

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
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: toAbsoluteUrl(crumb.url),
    })),
  };

  return <JsonLd data={data} />;
}

export function AttractionStructuredData({
  attraction,
  park,
  url,
  description,
  locale,
  ogImageUrl,
}: {
  attraction: ParkAttraction;
  park: ParkResponse | ParkWithAttractions;
  url: string;
  description?: string;
  locale?: string;
  /** OG-card URL — used only as a fallback when neither the ride nor its park has a photo. */
  ogImageUrl?: string;
}) {
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park.name);
  const data: WithContext<Attraction> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: attractionName,
    url: url,
    ...(locale && { inLanguage: locale }),
    description:
      description || `${attractionName} at ${parkName} - Real-time wait times and status.`,
    image: buildStructuredImage(getAttractionImageSet(park.slug, attraction.slug), ogImageUrl),
    containedInPlace: {
      '@type': 'ThemePark',
      name: parkName,
      url: url.split('/').slice(0, -1).join('/'), // Remove attraction slug to get park URL
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

export function ShowsStructuredData({
  shows,
  park,
}: {
  shows: ParkShow[];
  park: ParkResponse | ParkWithAttractions;
}) {
  if (!shows || shows.length === 0) return null;

  // Filter shows that have showtimes for today
  const showsWithTimes = shows.filter(
    (show) => show.showtimes && show.showtimes.length > 0 && show.status === 'OPERATING'
  );

  if (showsWithTimes.length === 0) return null;

  // Representative event date derived from the park's own schedule (the earliest OPERATING day in
  // the day-stable shell data), NOT the server clock. This keeps the Shows JSON-LD time-INDEPENDENT
  // so it never pins or stales the static shell, while still emitting a valid Event startDate.
  const schedule = park.schedule;
  const date = schedule?.find((s) => s.scheduleType === 'OPERATING')?.date ?? schedule?.[0]?.date;

  // No schedule date to anchor the Event(s) → skip rather than emit a bogus startDate.
  if (!date) return null;

  // One Event per show (not per showtime): a popular park can have 100+ daily
  // showtimes, which previously emitted 100+ near-identical Event blocks (~100KB
  // of JSON-LD). A single representative Event per show keeps the rich-result
  // value; the remaining showtimes are preserved via eventSchedule.
  const parkBgImage = getParkBackgroundImage(park.slug);
  const events = showsWithTimes.map((show) => {
    const startTimes = (show.showtimes || []).map((s) => s.startTime).filter(Boolean);
    return {
      '@context': 'https://schema.org' as const,
      '@type': 'Event' as const,
      name: stripNewPrefix(show.name),
      startDate: `${date}T${startTimes[0]}`,
      ...(startTimes.length > 1 && {
        eventSchedule: {
          '@type': 'Schedule' as const,
          startDate: date,
          byDayTime: startTimes,
        },
      }),
      image: parkBgImage ? `${SITE_URL}${parkBgImage}` : `${SITE_URL}/logo-big.png`,
      location: {
        '@type': 'Place' as const,
        name: stripNewPrefix(park.name),
        address: {
          '@type': 'PostalAddress' as const,
          addressLocality: park.city || undefined,
          addressCountry: park.country || undefined,
          addressRegion: park.region || undefined,
        },
      },
      eventStatus: 'https://schema.org/EventScheduled' as const,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode' as const,
    };
  });

  return (
    <>
      {events.map((event, index) => (
        <JsonLd key={index} data={event} />
      ))}
    </>
  );
}
