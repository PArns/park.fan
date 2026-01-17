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

type StructuredDataProps<T extends Thing> = {
  data: WithContext<T>;
};

function JsonLd<T extends Thing>({ data }: StructuredDataProps<T>) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function OrganizationStructuredData() {
  const data: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'park.fan',
    url: 'https://park.fan',
    logo: 'https://park.fan/icon.png',
    description:
      'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts for 142+ theme parks worldwide.',
    sameAs: ['https://x.com/arns_dev'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: 'https://park.fan',
    },
  };

  return <JsonLd data={data} />;
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
  const data: WithContext<ThemePark> = {
    '@context': 'https://schema.org',
    '@type': 'ThemePark',
    name: park.name,
    url: url,
    description: description || `Real-time wait times and crowd levels for ${park.name}.`,
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
  const data: WithContext<Attraction> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: attraction.name,
    url: url,
    description:
      description || `${attraction.name} at ${park.name} - Real-time wait times and status.`,
    containedInPlace: {
      '@type': 'ThemePark',
      name: park.name,
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
      name: show.name,
      startDate: `${date}T${showtime.startTime}`,
      location: {
        '@type': 'ThemePark' as const,
        name: park.name,
        address: {
          '@type': 'PostalAddress' as const,
          addressLocality: park.city || undefined,
          addressCountry: park.country || undefined,
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
