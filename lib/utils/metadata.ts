import type { Metadata } from 'next';
import { locales, localeToOpenGraphLocale } from '@/i18n/config';

/**
 * Builds the openGraph + twitter metadata objects that are identical across all pages.
 * Eliminates ~12 lines of boilerplate per page.
 */
export function buildOpenGraphMetadata({
  locale,
  title,
  description,
  url,
  ogImageUrl,
  imageAlt,
}: {
  locale: string;
  title: string;
  description: string;
  url: string;
  ogImageUrl: string;
  /** Defaults to title when omitted */
  imageAlt?: string;
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const alt = imageAlt ?? title;
  return {
    openGraph: {
      title,
      description,
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
