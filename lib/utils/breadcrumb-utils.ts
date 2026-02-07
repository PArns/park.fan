import type { Breadcrumb } from '@/lib/api/types';
import type { Locale } from '@/i18n/routing';

/**
 * Generate breadcrumbs for continent pages
 */
export function generateContinentBreadcrumbs({
  homeLabel,
  continentsLabel,
}: {
  homeLabel: string;
  continentsLabel: string;
}): Breadcrumb[] {
  return [
    { name: homeLabel, url: '/' },
    { name: continentsLabel, url: '/parks' },
  ];
}

/**
 * Generate breadcrumbs for country pages
 */
export function generateCountryBreadcrumbs({
  continent,
  continentName,
  homeLabel,
  continentsLabel,
}: {
  locale: Locale;
  continent: string;
  continentName: string;
  homeLabel: string;
  continentsLabel: string;
}): Breadcrumb[] {
  return [
    { name: homeLabel, url: '/' },
    { name: continentsLabel, url: '/parks', className: 'hidden md:inline-flex' },
    { name: continentName, url: `/parks/${continent}` },
  ];
}

/**
 * Generate breadcrumbs for city pages
 */
export function generateCityBreadcrumbs({
  continent,
  country,
  continentName,
  countryName,
  homeLabel,
  continentsLabel,
}: {
  locale: Locale;
  continent: string;
  country: string;
  continentName: string;
  countryName: string;
  homeLabel: string;
  continentsLabel: string;
}): Breadcrumb[] {
  return [
    { name: homeLabel, url: '/' },
    { name: continentsLabel, url: '/parks', className: 'hidden md:inline-flex' },
    { name: continentName, url: `/parks/${continent}`, className: 'hidden md:inline-flex' },
    { name: countryName, url: `/parks/${continent}/${country}` },
  ];
}

/**
 * Generate breadcrumbs for park pages
 */
export function generateParkBreadcrumbs({
  continent,
  country,
  city,
  parkSlug,
  continentName,
  countryName,
  cityName,
  parkName,
  homeLabel,
  continentsLabel,
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
  continentsLabel: string;
}): Breadcrumb[] {
  return [
    { name: homeLabel, url: '/' },
    { name: continentsLabel, url: '/parks', className: 'hidden md:inline-flex' },
    { name: continentName, url: `/parks/${continent}`, className: 'hidden md:inline-flex' },
    { name: countryName, url: `/parks/${continent}/${country}` },
    { name: cityName, url: `/parks/${continent}/${country}/${city}` },
    { name: parkName, url: `/parks/${continent}/${country}/${city}/${parkSlug}` },
  ];
}

/**
 * Generate breadcrumbs for attraction pages
 */
export function generateAttractionBreadcrumbs({
  continent,
  country,
  city,
  parkSlug,
  continentName,
  countryName,
  cityName,
  parkName,
  homeLabel,
  continentsLabel,
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
  continentsLabel: string;
}): Breadcrumb[] {
  return [
    { name: homeLabel, url: '/' },
    { name: continentsLabel, url: '/parks', className: 'hidden md:inline-flex' },
    { name: continentName, url: `/parks/${continent}`, className: 'hidden md:inline-flex' },
    { name: countryName, url: `/parks/${continent}/${country}` },
    { name: cityName, url: `/parks/${continent}/${country}/${city}` },
    { name: parkName, url: `/parks/${continent}/${country}/${city}/${parkSlug}` },
  ];
}
