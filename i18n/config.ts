/**
 * The locales and their names, the one list every other file reads. A new language needs an
 * entry here, in `localeNames` and a `messages/{locale}.json`.
 */

export const locales = ['en', 'de', 'fr', 'it', 'nl', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const SITE_URL = 'https://park.fan';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  nl: 'Nederlands',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
};

/** Builds the absolute hreflang alternates, one per locale, from a path template. */
export function generateAlternateLanguages(
  pathTemplate: (locale: Locale) => string
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const locale of locales) {
    result[locale] = `${SITE_URL}${pathTemplate(locale)}`;
  }

  return result;
}

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

/**
 * Mapping of app locales to Open Graph locales (underscore format)
 */
export const localeToOpenGraphLocale: Record<Locale, string> = {
  en: 'en_US',
  de: 'de_DE',
  nl: 'nl_NL',
  fr: 'fr_FR',
  es: 'es_ES',
  it: 'it_IT',
};
