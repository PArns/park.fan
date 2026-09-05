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
      <AttractionHistoryPanel
        history={detail?.history}
        schedule={detail?.schedule}
        loading={loading}
        todayIso={todayIso}
      />

      {/* Typical (P50) vs busy (P90) peak waits. For headliners the shell already carries this and
        renders it in „Beste Besuchszeit planen" (`suppressTypicalWaits`); for everyone else it
        exists only on the attraction detail — the park payload carries `typicalWaits` for the ten
        headliners of Phantasialand and for none of its thirty other rides — so it can only arrive
        client-side, and nothing in the shell predicts whether it will: 2 of 8 sampled
        non-headliners get a displayable one. Reserving its 331 px for the other six would be the
        `NearbyParksSection` mistake, so the box is not reserved and the position is what pays
        instead. UNDER the calendar, where its arrival pushes the page's tail rather than the
        1064–2258 px grid a reader at this chapter is looking at (measured: most of Talocan's
        0.3264 on a phone). It sits well there for the same reason the park's crowd calendar puts
        the historical statistics under its grid — the same question, one grain coarser. */}
      {!suppressTypicalWaits && detail?.typicalWaits?.displayable && (
        <section className="mt-8">
          <AttractionTypicalWaits typicalWaits={detail.typicalWaits} />
        </section>
      )}
    </>
  );
}
