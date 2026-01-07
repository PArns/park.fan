import { ParkResponse, ParkWithAttractions, Breadcrumb } from '@/lib/api/types';
import { Thing, WithContext, ThemePark, BreadcrumbList, Organization } from 'schema-dts';

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
    sameAs: ['https://x.com/arns_dev'],
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

// Ensure you have 'schema-dts' installed or define types manually if you prefer not to add a dependency.
// If 'schema-dts' is not available, you can use 'any' or define partial interfaces.
// For this environment, I will assume we might need to skip strict typing if schema-dts is missing,
// but I will write it as if standard types are available or I will define a basic fallback if it fails.
