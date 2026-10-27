import 'server-only';
import { MOST_READ_SEED } from '@/lib/blog/most-read-seed.generated';
import type { ViewedPark } from '@/lib/parks/viewed-parks';

/**
 * The locale's most viewed parks as the last build saw them (`scripts/generate-most-read-seed.mjs`),
 * most viewed first. Read where a page cannot fetch them itself without changing its cache window:
 * the footer is in every page, the parks menu in every header. Empty where the build could not
 * reach the API; every caller fills up with its hand-picked list.
 */
export function viewedParksSeed(locale: string): readonly ViewedPark[] {
  return MOST_READ_SEED.parks?.[locale] ?? [];
}
