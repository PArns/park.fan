import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // A region's copy is written one region at a time, so a key it lacks renders as nothing on the
    // server, never as its path; the blocks themselves check with `ownWords` and leave out what
    // has no words. Every other missing key keeps next-intl's fallback, its path.
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter(Boolean).join('.');
      return path.startsWith('tripRegions.') ? '' : path;
    },
  };
});
