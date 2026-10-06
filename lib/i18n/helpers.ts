/** Country and continent names that fall back to the prettified slug and log the missing key. */

import { logMissingTranslation } from './logger';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

/**
 * Translate a country by its slug with logging
 */
export function translateCountry(
  t: TranslationFunction,
  slug: string,
  locale: string,
  fallback?: string
): string {
  try {
    const key = `countries.${slug}`;
    const translated = t(key);

    if (translated === key || translated.startsWith('countries.')) {
      logMissingTranslation(key, locale, 'geo');
      return fallback || formatSlug(slug);
    }
    return translated;
  } catch {
    logMissingTranslation(`countries.${slug}`, locale, 'geo');
    return fallback || formatSlug(slug);
  }
}

/**
 * Translate a continent by its slug with logging
 */
export function translateContinent(
  t: TranslationFunction,
  slug: string,
  locale: string,
  fallback?: string
): string {
  try {
    const key = `continents.${slug}`;
    const translated = t(key);

    if (translated === key || translated.startsWith('continents.')) {
      logMissingTranslation(key, locale, 'geo');
      return fallback || formatSlug(slug);
    }
    return translated;
  } catch {
    logMissingTranslation(`continents.${slug}`, locale, 'geo');
    return fallback || formatSlug(slug);
  }
}

/**
 * Format a slug into a readable string
 * Example: "north-america" -> "North America"
 */
function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
