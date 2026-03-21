import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale, type Locale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Explicitly enable locale detection from browser Accept-Language header
  localeDetection: true,
  // Disable auto-generated Link headers — hreflang is managed via generateMetadata() on each page.
  // The auto-generated headers would produce incorrect alternates for glossary pages (wrong segments).
  alternateLinks: false,
});

export type { Locale };
