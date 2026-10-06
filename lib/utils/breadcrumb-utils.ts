import type { Breadcrumb } from '@/lib/api/types';

interface BreadcrumbResult {
  breadcrumbs: Breadcrumb[];
  currentPage: string;
}

/** Breadcrumbs for a continent page. */
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

/** Breadcrumbs for a country page. */
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

/** Breadcrumbs for a city page. */
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
 * The city crumb, or nothing when the city has no page of its own: a single-park city 308s to that
 * park, so linking it would send readers and crawlers through a redirect back to where they were.
 * `cityHasPage` comes from `cityHasOwnPage()` in `./redirect-utils`.
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

/** Breadcrumbs for a park page. */
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

/** Breadcrumbs for an attraction page. */
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
