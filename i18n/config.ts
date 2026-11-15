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
