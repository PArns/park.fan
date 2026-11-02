import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { HeroWithNearby, type HeroInitialCounts } from './hero-with-nearby';
import type { LatestNews } from '@/components/blog/latest-news-chip';

/**
 * Server seed for the hero's live numbers (open-parks badge and intro counts), cached as long as
 * `getGlobalStats` says, so it never pins the homepage's ISR window; the client overlays the live
 * values via `useGlobalStats` after mount. Streamed inside a Suspense boundary whose fallback
 * renders the same hero without the seed, so a slow or failing stats call never blocks the hero.
 */
export async function HeroStats({ latestNews }: { latestNews: LatestNews | null }) {
  const stats = await catchNonFatal(getGlobalStats());
  const counts: HeroInitialCounts | null = stats
    ? {
        openParks: stats.counts.openParks,
        parks: stats.counts.parks,
        attractions: stats.counts.attractions,
      }
    : null;

  return <HeroWithNearby initialCounts={counts} latestNews={latestNews} />;
}
