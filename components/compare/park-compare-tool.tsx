'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { ParkComparisonCard } from '@/components/parks/park-comparison-card';
import { CompareParkPicker } from '@/components/compare/compare-park-picker';
import { compareKey, MAX_COMPARE_PARKS, serializeCompare } from '@/lib/compare/selection';
import { useParkComparisonStats, type ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';
import type { SearchParkHit } from '@/lib/utils/search-park-hits';

interface CardLabels {
  title: string;
  labelPark: string;
  labelParkAverage: string;
  labelLongest: string;
  labelMinutes: string;
  labelQuietestDay: string;
  weekdayNames: string[];
}

interface ParkCompareToolProps {
  initialParks: ComparisonPark[];
  /** Slugs more than one park carries; the URL spells those with the full path. */
  ambiguousSlugs: string[];
  /** Server-translated, because the card's strings live in namespaces this page does not ship. */
  cardLabels: CardLabels;
}

/**
 * The visitor's own comparison: pick two to four parks, see the same table the posts embed.
 *
 * The selection lives in the URL (`?parks=a,b`) so it can be shared. It is written with
 * `history.replaceState`, not `router.replace`: a pick must not render the page on the server
 * again, because the page itself has nothing to say about the pick, and the stats queries are
 * already keyed by park.
 */
export function ParkCompareTool({
  initialParks,
  ambiguousSlugs,
  cardLabels,
}: ParkCompareToolProps) {
  const t = useTranslations('compare.tool');
  const [parks, setParks] = useState<ComparisonPark[]>(initialParks);
  const ambiguous = useMemo(() => new Set(ambiguousSlugs), [ambiguousSlugs]);

  const commit = (next: ComparisonPark[]) => {
    setParks(next);
    const value = serializeCompare(next, ambiguous);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('parks', value);
    else url.searchParams.delete('parks');
    window.history.replaceState(window.history.state, '', url);
  };

  const add = (hit: SearchParkHit) => {
    if (parks.length >= MAX_COMPARE_PARKS) return;
    const row: ComparisonPark = {
      slug: compareKey({ ...hit.geo, parkSlug: hit.slug }),
      name: hit.name,
      href: `/parks/${hit.geo.continent}/${hit.geo.country}/${hit.geo.city}/${hit.slug}`,
      ...hit.geo,
      parkSlug: hit.slug,
    };
    if (parks.some((p) => p.slug === row.slug)) return;
    commit([...parks, row]);
  };

  const chosen = useMemo(() => new Set(parks.map((p) => p.slug)), [parks]);

  return (
    <div className="space-y-6">
      <GlassCard variant="medium" className="space-y-4 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">{t('pickerTitle')}</h2>
          <p className="text-muted-foreground text-xs tabular-nums">
            {t('count', { count: parks.length, max: MAX_COMPARE_PARKS })}
          </p>
        </div>

        {parks.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {parks.map((park) => (
              <li key={park.slug}>
                <button
                  type="button"
                  onClick={() => commit(parks.filter((p) => p.slug !== park.slug))}
                  aria-label={t('remove', { park: park.name })}
                  className="bg-accent/60 hover:bg-accent focus-visible:ring-ring/50 inline-flex min-h-9 items-center gap-1.5 rounded-full py-1 pr-2 pl-3 text-sm outline-none focus-visible:ring-[3px]"
                >
                  <span className="max-w-[16rem] truncate">{park.name}</span>
                  <X className="text-muted-foreground size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <CompareParkPicker
          chosen={chosen}
          disabled={parks.length >= MAX_COMPARE_PARKS}
          onPick={add}
        />
        {parks.length >= MAX_COMPARE_PARKS && (
          <p className="text-muted-foreground text-xs">{t('full', { max: MAX_COMPARE_PARKS })}</p>
        )}
      </GlassCard>

      {parks.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        <>
          <ParkComparisonCard parks={parks} {...cardLabels} />
          <MissingStats parks={parks} />
          {parks.length === 1 && <p className="text-muted-foreground text-sm">{t('second')}</p>}
        </>
      )}
    </div>
  );
}

/**
 * Names the parks the table could only fill with dashes.
 *
 * The card shows an em dash for "no readable data", which is right in a row but says nothing about
 * why. The hook reads the queries the card already runs, so this adds no request.
 */
function MissingStats({ parks }: { parks: readonly ComparisonPark[] }) {
  const t = useTranslations('compare.tool');
  const { rows, isPending } = useParkComparisonStats(parks);
  if (isPending) return null;
  const missing = rows.filter((r) => r.parkP50 == null && r.longestP50 == null).map((r) => r.name);
  if (missing.length === 0) return null;
  return (
    <p className="text-muted-foreground text-sm" data-compare-missing="">
      {t('noStats', { parks: missing.join(', '), count: missing.length })}
    </p>
  );
}
