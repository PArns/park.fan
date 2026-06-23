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
  const tickerData = await catchNonFatal(getTickerData());
  if (!tickerData || tickerData.items.length === 0) return null;

  return <HeroTickerClient items={tickerData.items} />;
}
