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
 * Returns 'der' if the park name contains "Park" as a standalone word or
 * as a hyphenated component (e.g. "Europa-Park", "Movie Park Germany", "Moviepark").
 * Returns undefined for all other park names — they are used without an article in German.
 */
export function getGermanArticle(parkName: string): 'der' | undefined {
  const lower = parkName.toLowerCase();
  const words = lower.split(/[\s-]+/);
  if (words.some((w) => w === 'park') || lower.endsWith('park')) return 'der';
  return undefined;
}
