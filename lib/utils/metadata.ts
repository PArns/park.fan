import type { Metadata } from 'next';
import { locales, localeToOpenGraphLocale } from '@/i18n/config';

/**
 * Google truncates the SERP title around 60 characters and the snippet around 160 — past that
 * the tail is replaced by an ellipsis, so the keyword sitting there stops being visible.
 * Our templates are written for typical names; a long one ("Fantawild Oriental Heritage
 * Mianyang", "Vereinigtes Königreich") pushes them over on its own.
 */
export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 160;

/**
 * Picks the first candidate that fits, else the shortest one — never truncates mid-word.
 *
 * Pass candidates richest-first: the full template, then progressively shorter fallbacks.
 * When even the shortest overruns (a park whose name alone is 60+ characters) the shortest
 * still wins, because a clipped tail on a bare name costs less than a clipped template.
 */
export function fitWithin(limit: number, ...candidates: string[]): string {
  const usable = candidates.filter((c) => c && c.trim().length > 0);
  if (usable.length === 0) return '';
  return (
    usable.find((c) => c.length <= limit) ??
    usable.reduce((shortest, c) => (c.length < shortest.length ? c : shortest))
  );
}

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
