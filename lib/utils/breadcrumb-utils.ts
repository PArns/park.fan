import type { Breadcrumb } from '@/lib/api/types';

interface BreadcrumbResult {
  breadcrumbs: Breadcrumb[];
  currentPage: string;
}

/**
 * Generate breadcrumbs for continent pages
 */
export function generateContinentBreadcrumbs({
  homeLabel,
  continentsLabel,
  continentName,
}: {
  homeLabel: string;
  continentsLabel: string;
  continentName: string;
}): BreadcrumbResult {
  return {
    breadcrumbs: [
      { name: homeLabel, url: '/' },
      { name: continentsLabel, url: '/parks' },
    ],
    currentPage: continentName,
  };
}

/**
 * Generate breadcrumbs for country pages
 */
export function generateCountryBreadcrumbs({
  continent,
  continentName,
  countryName,
  homeLabel,
  continentsLabel,
}: {
  continent: string;
  continentName: string;
  countryName: string;
  homeLabel: string;
  continentsLabel: string;
}): BreadcrumbResult {
  return {
    breadcrumbs: [
      { name: homeLabel, url: '/' },
      { name: continentsLabel, url: '/parks', className: 'hidden md:inline-flex' },
      { name: continentName, url: `/parks/${continent}` },
    ],
    currentPage: countryName,
  };
}

/**
 * Generate breadcrumbs for city pages
 */
export function generateCityBreadcrumbs({
  continent,
  country,
  continentName,
  countryName,
  cityName,
  homeLabel,
  continentsLabel,
}: {
  continent: string;
  country: string;
  continentName: string;
  countryName: string;
  cityName: string;
  homeLabel: string;
  continentsLabel: string;
}): BreadcrumbResult {
  return {
    breadcrumbs: [
      { name: homeLabel, url: '/' },
      { name: continentsLabel, url: '/parks', className: 'hidden md:inline-flex' },
      { name: continentName, url: `/parks/${continent}`, className: 'hidden md:inline-flex' },
      { name: countryName, url: `/parks/${continent}/${country}` },
    ],
    currentPage: cityName,
  };
}

/**
 * Generate breadcrumbs for park pages
 */
export function generateParkBreadcrumbs({
  continent,
  country,
  city,
  continentName,
  countryName,
  cityName,
  parkName,
  homeLabel,
  continentsLabel,
}: {
  continent: string;
  country: string;
  city: string;
  continentName: string;
  countryName: string;
  cityName: string;
  parkName: string;
  homeLabel: string;
  continentsLabel: string;
}): BreadcrumbResult {
  return {
    breadcrumbs: [
      { name: homeLabel, url: '/' },
      { name: continentsLabel, url: '/parks', className: 'hidden md:inline-flex' },
      { name: continentName, url: `/parks/${continent}`, className: 'hidden md:inline-flex' },
      { name: countryName, url: `/parks/${continent}/${country}` },
      { name: cityName, url: `/parks/${continent}/${country}/${city}` },
    ],
    currentPage: parkName,
  };
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
  attractionName,
  homeLabel,
  continentsLabel,
}: {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  continentName: string;
  countryName: string;
  cityName: string;
  parkName: string;
  attractionName: string;
  homeLabel: string;
  continentsLabel: string;
}): BreadcrumbResult {
  return {
    breadcrumbs: [
      { name: homeLabel, url: '/' },
      { name: continentsLabel, url: '/parks', className: 'hidden md:inline-flex' },
      { name: continentName, url: `/parks/${continent}`, className: 'hidden md:inline-flex' },
      { name: countryName, url: `/parks/${continent}/${country}` },
      { name: cityName, url: `/parks/${continent}/${country}/${city}` },
      { name: parkName, url: `/parks/${continent}/${country}/${city}/${parkSlug}` },
    ],
    currentPage: attractionName,
  };
}
