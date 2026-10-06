import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale, type Locale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
  // hreflang comes from each page's generateMetadata(); next-intl's Link headers would give the
  // glossary pages wrong alternates.
  alternateLinks: false,
});

export type { Locale };
