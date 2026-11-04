import type { Locale } from '@/i18n/config';

/**
 * The path of this page in `locale` as its own hreflang link names it, or null when the page has
 * none. It carries what a locale swap in the path cannot know, a post's slug in that language or a
 * localized segment (`/de/glossar` and `/en/glossary`).
 */
export function hreflangPath(locale: Locale): string | null {
  const link = document.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${locale}"]`
  );
  if (!link?.href) return null;
  try {
    return new URL(link.href).pathname;
  } catch {
    return null;
  }
}
