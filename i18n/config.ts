/**
 * Central i18n configuration - Single Source of Truth for all locales
 *
 * To add a new language:
 * 1. Add locale code to 'locales' array
 * 2. Add display name to 'localeNames'
 * 3. Create messages/{locale}.json file
 * 4. All other files will automatically pick up the new locale
 */

export const locales = ['en', 'de', 'nl', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  nl: 'Nederlands',
  fr: 'Français',
  es: 'Español',
};

/**
 * Helper to generate alternate language links for SEO/hreflang
 *
 * @param pathTemplate - Function that generates the path for each locale
 * @returns Object with locale codes as keys and paths as values
 *
 * @example
 * generateAlternateLanguages(locale => `/${locale}/parks`)
 * // Returns: { en: '/en/parks', de: '/de/parks', ... }
 */
export function generateAlternateLanguages(
  pathTemplate: (locale: Locale) => string
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const locale of locales) {
    result[locale] = pathTemplate(locale);
  }

  return result;
}

/**
 * Generate locale matcher pattern for Next.js config/middleware
 * @returns Regex pattern like "(en|de|nl|fr|es)"
 */
export function getLocalePattern(): string {
  return `(${locales.join('|')})`;
}

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}
