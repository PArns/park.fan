'use client';

import { useMemo, useState } from 'react';
import { countryName, formatCount, formatShare } from '@/lib/admin/site-analytics';
import { countryShadePercent } from '@/lib/admin/world-map';
import { LoadingState } from '../../_ui/primitives';
import { useCountryPaths } from '../_lib/country-paths';

/**
 * A world map shaded by how many views each country has, one hue from nothing to the biggest.
 * Pressing a country sets it as the page's filter, pressing the set one takes it off. The list
 * beside it carries the same numbers, so the map is a second way in, not the only one.
 */
export function WorldMap({
  items,
  active,
  onSelect,
}: {
  /** Views per country, the API's lower-case alpha-2 codes. */
  items: readonly { value: string; views: number }[];
  /** The country the page is filtered to. */
  active?: string;
  onSelect: (code: string) => void;
}) {
  const { data, error } = useCountryPaths();
  const [hover, setHover] = useState<string | null>(null);
  const views = useMemo(
    () => new Map(items.map((item) => [item.value.toUpperCase(), item.views])),
    [items]
  );
  const total = items.reduce((sum, item) => sum + item.views, 0);
  const max = Math.max(1, ...items.map((item) => item.views));

  if (error) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        Die Karte konnte nicht geladen werden.
      </p>
    );
  }
  if (!data) return <LoadingState label="Lade Karte…" />;

  const hovered = hover ? { name: countryName(hover), count: views.get(hover) ?? 0 } : null;

  return (
    <div>
      <svg
        viewBox={data.viewBox}
        className="block h-auto w-full"
        aria-hidden="true"
        onPointerLeave={() => setHover(null)}
      >
        {Object.entries(data.paths).map(([iso, d]) => {
          const count = views.get(iso) ?? 0;
          const strength = countryShadePercent(count, max);
          const isActive = active?.toUpperCase() === iso;
          return (
            <path
              key={iso}
              d={d}
              onPointerEnter={() => setHover(iso)}
              onClick={() => onSelect(iso.toLowerCase())}
              className={
                isActive ? 'stroke-primary cursor-pointer' : 'stroke-background cursor-pointer'
              }
              strokeWidth={isActive ? 1.6 : 0.6}
              strokeLinejoin="round"
              style={{
                fill:
                  count > 0
                    ? `color-mix(in oklab, var(--color-primary) ${strength}%, transparent)`
                    : 'color-mix(in oklab, var(--color-muted-foreground) 14%, transparent)',
              }}
            />
          );
        })}
      </svg>
      <p aria-live="polite" className="text-muted-foreground mt-2 min-h-4 text-xs tabular-nums">
        {hovered ? (
          <>
            <span className="text-foreground font-medium">{hovered.name}</span>
            {': '}
            {formatCount(hovered.count)} ({formatShare(total > 0 ? hovered.count / total : 0)})
          </>
        ) : (
          'Land antippen zum Filtern'
        )}
      </p>
    </div>
  );
}
