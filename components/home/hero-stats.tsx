import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { HeroWithNearby, type HeroInitialCounts } from './hero-with-nearby';

/**
 * The hero's text with its numbers (open-parks badge and intro counts) from `getGlobalStats`,
 * cached a week so it never pins the homepage's ISR window; the client overlays the live open
 * count via `useGlobalStats` after mount. Rendered with the page, not streamed: Parky's slot is
 * in the first HTML, and a failing stats call only leaves the sentence's round numbers.
 */
export async function HeroStats() {
  const stats = await catchNonFatal(getGlobalStats());
  const counts: HeroInitialCounts | null = stats
    ? {
        openParks: stats.counts.openParks,
        parks: stats.counts.parks,
        attractions: stats.counts.attractions,
      }
    : null;

  return <HeroWithNearby initialCounts={counts} />;
}
