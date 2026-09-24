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
      { name: continentsLabel, url: '/parks' },
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
      { name: continentsLabel, url: '/parks' },
      { name: continentName, url: `/parks/${continent}` },
      { name: countryName, url: `/parks/${continent}/${country}` },
    ],
    currentPage: cityName,
  };
}

/**
 * The city crumb, or nothing when the city has no page of its own.
 *
 * A city with a single park answers with a 308 to that park, so linking it sends the reader, and
 * every crawler walking the trail or its BreadcrumbList JSON-LD, to a redirect that lands on the
 * park they came from. `cityHasPage` comes from `cityHasOwnPage()` in `./redirect-utils`.
 */
function cityCrumb(
  continent: string,
  country: string,
  city: string,
  cityName: string,
  cityHasPage: boolean
): Breadcrumb[] {
  return cityHasPage ? [{ name: cityName, url: `/parks/${continent}/${country}/${city}` }] : [];
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
  cityHasPage,
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
  /** Whether the city has its own page; see {@link cityCrumb}. */
  cityHasPage: boolean;
  parkName: string;
  homeLabel: string;
  continentsLabel: string;
}): BreadcrumbResult {
  return {
    breadcrumbs: [
      { name: homeLabel, url: '/' },
      { name: continentsLabel, url: '/parks' },
      { name: continentName, url: `/parks/${continent}` },
      { name: countryName, url: `/parks/${continent}/${country}` },
      ...cityCrumb(continent, country, city, cityName, cityHasPage),
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
  cityHasPage,
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
  /** Whether the city has its own page; see {@link cityCrumb}. */
  cityHasPage: boolean;
  parkName: string;
  attractionName: string;
  homeLabel: string;
  continentsLabel: string;
}): BreadcrumbResult {
  return {
    breadcrumbs: [
      { name: homeLabel, url: '/' },
      { name: continentsLabel, url: '/parks' },
      { name: continentName, url: `/parks/${continent}` },
      { name: countryName, url: `/parks/${continent}/${country}` },
      ...cityCrumb(continent, country, city, cityName, cityHasPage),
      { name: parkName, url: `/parks/${continent}/${country}/${city}/${parkSlug}` },
    ],
    currentPage: attractionName,
  };
}
