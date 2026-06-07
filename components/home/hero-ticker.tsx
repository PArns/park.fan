import { getTickerData } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { LiveWaitTicker } from './live-wait-ticker';

/**
 * Live wait-times ticker overlaid at the bottom of the hero (desktop only).
 *
 * Fetches its own data so it can be streamed inside a <Suspense fallback={null}>
 * boundary — it must never block the hero / first paint. Decorative and absolutely
 * positioned, so a `null` fallback causes no layout shift.
 */
export async function HeroTicker() {
  // Day-stale SSR seed only — LiveWaitTicker keeps it live client-side (5-min poll). A short seed
  // TTL here would pin the whole homepage shell's ISR-write cadence to this decorative ticker.
  const tickerData = await catchNonFatal(getTickerData(86400));
  if (!tickerData || tickerData.items.length === 0) return null;

  return (
    <div className="absolute right-0 bottom-0 left-0 hidden md:block">
      <LiveWaitTicker initialItems={tickerData.items} />
    </div>
  );
}
