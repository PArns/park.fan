import type { Locale } from '@/i18n/config';
import { MEDIA_TEXT } from './manifest-text';
import { pickText } from './sidecar.mjs';
import type { LocalizedText, MediaImage, ResolvedMediaImage } from './types';

/**
 * Localized alt/caption resolution — the half of the media database that costs
 * bytes.
 *
 * Kept out of `@/lib/media` on purpose: `manifest-text.ts` carries six locales of
 * prose for every image, and a route that only resolves paths or runs a search
 * should not pull it into its bundle. Import from here only where text is
 * actually rendered. Same split as `@/lib/blog/listing` vs `@/lib/blog`.
 */

/** How many images carry localized prose at all — the translation-coverage counter. */
export function countWithText(): number {
  return Object.keys(MEDIA_TEXT).length;
}

/** Raw localized text for an image, unresolved. */
export function getMediaText(id: string): { alt?: LocalizedText; caption?: LocalizedText } {
  return MEDIA_TEXT[id] ?? {};
}

/** Alt text in the requested locale, falling back through de → en → anything. */
export function getMediaAlt(id: string, locale: string): string | null {
  return pickText(MEDIA_TEXT[id]?.alt, locale);
}

/** Caption in the requested locale, falling back through de → en → anything. */
export function getMediaCaption(id: string, locale: string): string | null {
  return pickText(MEDIA_TEXT[id]?.caption, locale);
}

/**
 * Attribution line, e.g. `© 2025 Patrick Arns (CC BY 4.0)`.
 *
 * Returns null when nobody is credited — an image whose rights are unestablished
 * renders no attribution rather than an empty or misleading one.
 */
export function getCreditLine(image: MediaImage): string | null {
  const { author, license, year } = image.credit;
  if (!author) return null;
  const line = year ? `© ${year} ${author}` : `© ${author}`;
  if (license === 'all-rights-reserved' || license === 'unknown') return line;
  return `${line} (${formatLicense(license)})`;
}

function formatLicense(license: string): string {
  if (license === 'public-domain') return 'Public domain';
  // cc-by-sa-4.0 → CC BY-SA 4.0
  return license
    .replace(/^cc-/, 'cc ')
    .replace(/-(\d[\d.]*)$/, ' $1')
    .toUpperCase();
}

/** An image with its text resolved for one locale — the shape components render. */
export function resolveMediaImage(image: MediaImage, locale: Locale | string): ResolvedMediaImage {
  return {
    ...image,
    // Falling back to the title keeps `alt` a non-empty string: a decorative-looking
    // empty alt on a content photo is an accessibility regression, not a default.
    alt: getMediaAlt(image.id, locale) ?? image.title,
    caption: getMediaCaption(image.id, locale),
    creditLine: getCreditLine(image),
  };
}

/** `resolveMediaImage` over a list. */
export function resolveMediaImages(
  images: readonly MediaImage[],
  locale: Locale | string
): ResolvedMediaImage[] {
  return images.map((image) => resolveMediaImage(image, locale));
}
