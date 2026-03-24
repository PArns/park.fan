import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strip "NEW:", "Neu:", "Nouveau:", etc. from display names, titles, descriptions. */
export function stripNewPrefix(text: string): string {
  return text.replace(/^(NEW|NEU|NOUVEAU|NIEUW|NUEVO):\s*/i, '').trim();
}

/**
 * Determines the German nominative article for a theme park name.
 * - "Park" as a word/hyphen component → 'der' (der Europa-Park, der Movie Park Germany)
 * - Any word ending in "-land" → 'das' (das Phantasialand, das Disneyland, das Toverland)
 * - Everything else → 'das' (default for foreign/unknown proper nouns in German)
 */
export function getGermanArticle(parkName: string): 'der' | 'das' {
  const lower = parkName.toLowerCase();
  const words = lower.split(/[\s-]+/);
  if (words.some((w) => w === 'park') || lower.endsWith('park')) return 'der';
  return 'das';
}
