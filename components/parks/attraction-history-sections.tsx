'use client';

import { useMounted } from '@/lib/hooks/use-mounted';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { AttractionHistoryGrid } from './attraction-history-grid';
import { AttractionTypicalWaits } from './attraction-typical-waits';
import { AttractionHistorySectionsSkeleton } from './attraction-history-sections-skeleton';

interface AttractionHistorySectionsProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractionSlug: string;
  attractionName: string;
  /** True when the shell already rendered typical-waits (headliner) — skip it here. */
  suppressTypicalWaits?: boolean;
}

/**
 * Client wrapper for the attraction's 30-day history grid (+ typical-waits for non-headliners).
 *
 * The heavy `history` / `hourlyForecast` time-series loads client-side via the CDN-cached
 * `/api/parks/.../attractions/<slug>` route (see {@link useAttractionDetail}) so it never bakes
 * into the per-attraction ISR write. The "Wartezeiten heute" daily chart now lives in the unified
 * live card (see {@link LiveAttractionData}), which shares this same query; here we render only the
 * historical calendar (and the typical-waits summary when it wasn't server-rendered in the shell).
 *
 * Shows the skeleton until mounted + loaded so the static prerender renders a stable placeholder.
 */
export function AttractionHistorySections({
  continent,
  country,
  city,
  parkSlug,
  attractionSlug,
  attractionName,
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

  if (!mounted || isLoading) {
    return <AttractionHistorySectionsSkeleton />;
  }

  if (!detail) return null;

  return (
    <>
      {/* Typical (P50) vs busy (P90) peak waits. For headliners this is rendered
          in the static shell instead (suppressTypicalWaits) for SEO + instant
          paint; non-headliner displayable rides still get it client-side here. */}
      {!suppressTypicalWaits && detail.typicalWaits?.displayable && (
        <section className="mb-8">
          <AttractionTypicalWaits typicalWaits={detail.typicalWaits} />
        </section>
      )}

      {/* 30-day historical calendar */}
      <section className="mb-8">
        <AttractionHistoryGrid
          attraction={{ name: attractionName, history: detail.history, schedule: detail.schedule }}
        />
      </section>
    </>
  );
}
