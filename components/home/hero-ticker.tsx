import { getTickerData } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { HeroTickerClient } from './hero-ticker-client';

/**
 * Live wait-times ticker overlaid at the bottom of the hero (desktop only).
 *
 * Fetches its own data so it can be streamed inside a <Suspense fallback={null}>
 * boundary — it must never block the hero / first paint. The actual ticker is mounted
 * client-side only on desktop AND only after the page has loaded (see HeroTickerClient),
 * so its chunk + React Query poll stay off the critical path; on mobile it never loads at
 * all — it used to be CSS-hidden but still hydrated.
 */
export async function HeroTicker() {
  // 3600: seed only (LiveWaitTicker replaces it on mount via initialDataUpdatedAt: 0) — the
  // default 600 would pin the homepage's ISR window to 10 min. The /api/analytics/ticker
  // proxy keeps the 600s cache for the client polls.
  const tickerData = await catchNonFatal(getTickerData(3600));
  if (!tickerData || tickerData.items.length === 0) return null;

  return <HeroTickerClient items={tickerData.items} />;
}
