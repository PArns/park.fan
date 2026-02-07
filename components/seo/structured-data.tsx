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
} from 'schema-dts';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { getAttractionImage } from '@/lib/attraction-images';
import { stripNewPrefix } from '@/lib/utils';

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

const SITE_URL = 'https://park.fan';

export function OrganizationStructuredData({ description }: { description?: string }) {
  const data: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'park.fan',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
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
}: {
  locale: string;
  siteName?: string;
  description?: string;
}) {
  const baseUrl = `${SITE_URL}/${locale}`;
  const searchUrl = `${baseUrl}/search?q={search_term_string}`;

  const data = {
    '@context': 'https://schema.org' as const,
    '@type': 'WebSite' as const,
    name: siteName,
    url: baseUrl,
    ...(description && { description }),
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
}: {
  park: ParkResponse | ParkWithAttractions;
  url: string;
  description?: string;
}) {
  const parkName = stripNewPrefix(park.name);
  const data: WithContext<ThemePark> = {
    '@context': 'https://schema.org',
    '@type': 'ThemePark',
    name: parkName,
    url: url,
    description: description || `Real-time wait times and crowd levels for ${parkName}.`,
    image: getParkBackgroundImage(park.slug)
      ? `https://park.fan${getParkBackgroundImage(park.slug)}`
      : undefined,
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
        ? park.attractions.map((attraction) => ({
            '@type': 'TouristAttraction' as const,
            name: stripNewPrefix(attraction.name),
            url: `${url}/${attraction.slug}`,
            image: getAttractionImage(park.slug, attraction.slug)
              ? `https://park.fan${getAttractionImage(park.slug, attraction.slug)}`
              : undefined,
          }))
        : []),
      ...('restaurants' in park && park.restaurants
        ? park.restaurants.map((restaurant) => ({
            '@type': 'FoodEstablishment' as const,
            name: stripNewPrefix(restaurant.name),
            servesCuisine: restaurant.cuisineType || undefined,
          }))
        : []),
    ],
  };

  return <JsonLd data={data} />;
}

export function BreadcrumbStructuredData({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  const data: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `https://park.fan${crumb.url}`,
    })),
  };

  return <JsonLd data={data} />;
}

export function AttractionStructuredData({
  attraction,
  park,
  url,
  description,
}: {
  attraction: ParkAttraction;
  park: ParkResponse | ParkWithAttractions;
  url: string;
  description?: string;
}) {
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park.name);
  const data: WithContext<Attraction> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: attractionName,
    url: url,
    description:
      description || `${attractionName} at ${parkName} - Real-time wait times and status.`,
    image: getAttractionImage(park.slug, attraction.slug)
      ? `https://park.fan${getAttractionImage(park.slug, attraction.slug)}`
      : undefined,
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
  date,
}: {
  shows: ParkShow[];
  park: ParkResponse | ParkWithAttractions;
  date: string;
}) {
  if (!shows || shows.length === 0) return null;

  // Filter shows that have showtimes for today
  const showsWithTimes = shows.filter(
    (show) => show.showtimes && show.showtimes.length > 0 && show.status === 'OPERATING'
  );

  if (showsWithTimes.length === 0) return null;

  // Generate Event schema for each show time
  const events = showsWithTimes.flatMap((show) =>
    (show.showtimes || []).map((showtime) => ({
      '@context': 'https://schema.org' as const,
      '@type': 'Event' as const,
      name: stripNewPrefix(show.name),
      startDate: `${date}T${showtime.startTime}`,
      image: getParkBackgroundImage(park.slug)
        ? `https://park.fan${getParkBackgroundImage(park.slug)}`
        : undefined, // Fallback to park image if no show image
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
    }))
  );

  return (
    <>
      {events.map((event, index) => (
        <JsonLd key={index} data={event} />
      ))}
    </>
  );
}
