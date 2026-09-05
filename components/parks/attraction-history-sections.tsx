'use client';

import { useMounted } from '@/lib/hooks/use-mounted';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { AttractionHistoryPanel } from './attraction-history-panel';
import { AttractionTypicalWaits } from './attraction-typical-waits';

interface AttractionHistorySectionsProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractionSlug: string;
  /** Today in the park's timezone (`yyyy-MM-dd`) — the history grid's reservation reads it. */
  todayIso: string;
  /** True when the shell already rendered typical-waits (headliner) — skip it here. */
  suppressTypicalWaits?: boolean;
}

/**
 * Client wrapper for the attraction's 30-day history calendar (+ typical-waits for non-headliners).
 *
 * The heavy `history` / `hourlyForecast` time-series loads client-side via the CDN-cached
 * `/api/parks/.../attractions/<slug>` route (see {@link useAttractionDetail}) so it never bakes
 * into the per-attraction ISR write. The "Wartezeiten heute" daily chart lives in the live card
 * (see {@link LiveAttractionData}), which shares this same query; here we render only the
 * historical calendar (and the typical-waits summary when it wasn't server-rendered in the shell).
 *
 * The whole chapter no longer disappears behind a skeleton while that fetch is in flight: the
 * heading and the legend need no data and are in the served HTML, and only the grid's own box is
 * held — see {@link AttractionHistoryPanel}.
 */
export function AttractionHistorySections({
  continent,
  country,
  city,
  parkSlug,
  attractionSlug,
  todayIso,
  suppressTypicalWaits,
}: AttractionHistorySectionsProps) {
  const mounted = useMounted();
  const { data: detail, isLoading } = useAttractionDetail({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
  });
  const loading = !mounted || isLoading;

  return (
    <>
      {/* Typical (P50) vs busy (P90) peak waits. For headliners this is rendered in the static
          shell instead (suppressTypicalWaits) for SEO + instant paint; non-headliner displayable
          rides still get it client-side here. */}
      {!suppressTypicalWaits && detail?.typicalWaits?.displayable && (
        <section className="mb-8">
          <AttractionTypicalWaits typicalWaits={detail.typicalWaits} />
        </section>
      )}

      <AttractionHistoryPanel
        history={detail?.history}
        schedule={detail?.schedule}
        loading={loading}
        todayIso={todayIso}
      />
    </>
  );
}
