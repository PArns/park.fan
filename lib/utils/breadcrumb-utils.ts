import type { Breadcrumb } from '@/lib/api/types';
import type { Locale } from '@/i18n/routing';

/**
 * Generate breadcrumbs for park pages
 */
export function generateParkBreadcrumbs({
  locale,
  continent,
  country,
  city,
  continentName,
  countryName,
  cityName,
  homeLabel,
}: {
  locale: Locale;
  continent: string;
  country: string;
  city: string;
  continentName: string;
  countryName: string;
  cityName: string;
  homeLabel: string;
}): Breadcrumb[] {
  return [
    { name: homeLabel, url: '/' },
    { name: continentName, url: `/parks/${continent}` },
    { name: countryName, url: `/parks/${continent}/${country}` },
    { name: cityName, url: `/parks/${continent}/${country}/${city}` },
  ];
}

/**
 * Generate breadcrumbs for attraction pages
 */
export function generateAttractionBreadcrumbs({
  locale,
  continent,
  country,
  city,
  parkSlug,
  continentName,
  countryName,
  cityName,
  parkName,
  homeLabel,
}: {
  locale: Locale;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  continentName: string;
  countryName: string;
  cityName: string;
  parkName: string;
  homeLabel: string;
}): Breadcrumb[] {
  return [
    { name: homeLabel, url: '/' },
    { name: continentName, url: `/parks/${continent}` },
    { name: countryName, url: `/parks/${continent}/${country}` },
    { name: cityName, url: `/parks/${continent}/${country}/${city}` },
    { name: parkName, url: `/parks/${continent}/${country}/${city}/${parkSlug}` },
  ];
}
