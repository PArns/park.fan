import type { MediaImage } from './types';

/**
 * Who is credited for a photo, and how the line reads.
 *
 * Imports nothing at runtime, on purpose: `scripts/generate-media-manifest.mjs` loads this file
 * through Node's type stripping to build the client-safe credit table, so the generator, the blog
 * and every card answer "does this photo need a credit" with the same code.
 */

/**
 * The names the site's own shoots are signed with, in any of the three spellings the sidecars use.
 * Every other `credit.author` needs a visible, on-image credit.
 */
export const OWN_PHOTO_AUTHORS: readonly string[] = ['Patrick Arns', 'Patrick', 'park.fan'];

/** Whether an author name is one of the site's own, ignoring case and surrounding space. */
export function isOwnPhotoAuthor(author: string | null | undefined): boolean {
  if (!author) return false;
  const name = author.trim().toLowerCase();
  return OWN_PHOTO_AUTHORS.some((own) => own.toLowerCase() === name);
}

/**
 * Attribution line, e.g. `© 2025 Patrick Arns (CC BY 4.0)`.
 *
 * Returns null when nobody is credited — an image whose rights are unestablished
 * renders no attribution rather than an empty or misleading one.
 */
export function getCreditLine(image: Pick<MediaImage, 'credit'>): string | null {
  const { author, license, year } = image.credit;
  if (!author) return null;
  const line = year ? `© ${year} ${author}` : `© ${author}`;
  if (license === 'all-rights-reserved' || license === 'unknown') return line;
  return `${line} (${formatLicense(license)})`;
}

/**
 * Whether an image needs a visible, on-image credit rather than just the
 * sidecar-only line every photo already carries. Own shoots are implicitly
 * park.fan's — everything else (stock, press, a contribution) has to say so
 * where a reader can see it, not just in metadata nobody opens.
 */
export function needsAttribution(image: Pick<MediaImage, 'credit'>): boolean {
  const { author } = image.credit;
  return author != null && !isOwnPhotoAuthor(author);
}

function formatLicense(license: string): string {
  if (license === 'public-domain') return 'Public domain';
  if (license === 'unsplash') return 'Unsplash License';
  // cc-by-sa-4.0 → CC BY-SA 4.0
  return license
    .replace(/^cc-/, 'cc ')
    .replace(/-(\d[\d.]*)$/, ' $1')
    .toUpperCase();
}
