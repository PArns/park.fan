import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { HeroWithNearby, type HeroInitialCounts } from './hero-with-nearby';

/**
 * Server seed for the hero's live numbers (open parks badge + intro counts). Fetched at
 * 3600s so it never pins the homepage's hourly ISR window down; the client overlays the
 * live values via `useGlobalStats` (5-min poll) right after mount. Streamed inside a
 * Suspense boundary whose fallback renders the same hero without the seed, so a slow or
 * failing stats call never blocks the hero.
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
