import { foldText as foldForSearch } from '../media/tokenize.mjs';

/**
 * Text reduced for matching: lower case, accents off, "ß" as "ss", so "farup" finds "Fårup" and
 * "strasse" finds "Straße". The media search's fold, so every search matches alike; it is plain JS
 * because the media index is built without TypeScript.
 */
export const foldText: (value: string) => string = foldForSearch;

/** A ride name reduced for matching, so "winjas" finds "Winja's" and "fly" finds "F.L.Y.". */
export function foldRideName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Whether every word of `query` occurs, folded, in at least one of `fields`, so "phanta" finds
 * Phantasialand and "rust europa" finds Europa-Park by its town. An empty query matches all.
 */
export function matchesQuery(
  fields: ReadonlyArray<string | null | undefined>,
  query: string
): boolean {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields.flatMap((field) => (field ? [foldText(field)] : []));
  return words.every((word) => haystack.some((field) => field.includes(word)));
}
