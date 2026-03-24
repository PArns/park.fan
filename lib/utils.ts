import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strip "NEW:", "Neu:", "Nouveau:", etc. from display names, titles, descriptions. */
export function stripNewPrefix(text: string): string {
  return text.replace(/^(NEW|NEU|NOUVEAU|NIEUW|NUEVO):\s*/i, '').trim();
}

/** Parks that sound unnatural with any article in German — used without one. */
const GERMAN_NO_ARTICLE_SLUGS = new Set(['efteling']);

/**
 * Determines the German nominative article for a theme park name.
 * - Slugs in GERMAN_NO_ARTICLE_SLUGS → undefined (no article)
 * - "Park" as a word/hyphen component → 'der' (der Europa-Park, der Movie Park Germany)
 * - Everything else → 'das' (default for foreign/unknown proper nouns in German)
 */
export function getGermanArticle(parkName: string, parkSlug?: string): 'der' | 'das' | undefined {
  if (parkSlug && GERMAN_NO_ARTICLE_SLUGS.has(parkSlug)) return undefined;
  const lower = parkName.toLowerCase();
  const words = lower.split(/[\s-]+/);
  if (words.some((w) => w === 'park') || lower.endsWith('park')) return 'der';
  return 'das';
}
