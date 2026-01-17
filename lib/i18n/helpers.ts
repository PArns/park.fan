/**
 * Enhanced Translation Helpers with Logging
 *
 * Type-safe helpers that also log missing translations
 */

import { logMissingTranslation } from './logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationFunction = (key: string, values?: any) => string;

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

    // Check if translation was found
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
 * Safely translate with fallback and logging
 */
export function safeTranslate(
  t: TranslationFunction,
  key: string,
  locale: string,
  namespace?: string,
  fallback?: string
): string {
  try {
    const result = t(key);

    // If result equals key, translation likely wasn't found
    if (result === key || result === `${namespace}.${key}`) {
      logMissingTranslation(key, locale, namespace);
      return fallback || key;
    }

    return result;
  } catch {
    logMissingTranslation(key, locale, namespace);
    return fallback || key;
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
