import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins class names and resolves conflicting Tailwind classes, the later one winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strip "NEW:", "Neu:", "Nouveau:", etc. from display names, titles, descriptions. */
export function stripNewPrefix(text: string): string {
  return text.replace(/^(NEW|NEU|NOUVEAU|NIEUW|NUEVO):\s*/i, '').trim();
}

/**
 * Whether a string is shaped like a UUID — used to refuse an id before it
 * reaches an endpoint that validates one with `@IsUUID()`.
 *
 * Some cards render with a slug standing in for the id: a blog post's
 * attraction card falls back to `attraction.attractionSlug` when the ride's
 * detail failed to resolve at build time (`lib/blog/attraction-payload.ts`),
 * and a slug like "taron" reaching `POST /push/ride-alerts` would 400 rather
 * than silently doing nothing — the id is fine for `FavoriteStar`'s purely
 * local storage key, but not for a call that leaves this origin.
 */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * The German article a park name takes, curated first and guessed second. The curated
 * `nameArticleDe` is set for every park, including those that take none; pass it whenever a park
 * object is at hand. The guess, for call sites with only a name, follows the rule the curation
 * came from: a name built on -land is neuter, one built on Park masculine, the rest take none.
 *
 * @param curated `nameArticleDe` from the API. `null` is an answer ("this name
 *   takes none") and wins over the guess; `undefined` means it was not threaded
 *   through, and only then is the name inspected.
 */
export function getGermanArticle(
  parkName: string,
  parkSlug?: string,
  curated?: string | null
): 'der' | 'die' | 'das' | undefined {
  if (curated === 'der' || curated === 'die' || curated === 'das') return curated;
  if (curated === null) return undefined;

  const words = parkName.toLowerCase().split(/[\s-]+/);
  const head = words[0] ?? '';
  if (head.endsWith('land') && head.length > 5) return 'das';
  if (words.some((w) => w === 'park' || w === 'parc' || w.endsWith('park'))) return 'der';
  return undefined;
}
