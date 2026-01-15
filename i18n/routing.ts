import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale, type Locale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Explicitly enable locale detection from browser Accept-Language header
  localeDetection: true,
});

export type { Locale };
