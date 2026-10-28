'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { countryName, formatCount, formatShare } from '@/lib/admin/site-analytics';
import { LoadingState } from '../../_ui/primitives';

/**
 * Countries the source map draws in several parts name them in a `class` instead of an `id`. The
 * ones listed here are the multi-part countries of `public/world.svg`; a name outside it is a
 * part that is not drawn.
 */
const NAME_TO_ISO: Record<string, string> = {
  Angola: 'AO',
  Argentina: 'AR',
  Australia: 'AU',
  Azerbaijan: 'AZ',
  Canada: 'CA',
  China: 'CN',
  Denmark: 'DK',
  'United Kingdom': 'GB',
  Greece: 'GR',
  Indonesia: 'ID',
  Italy: 'IT',
  Japan: 'JP',
  Malaysia: 'MY',
  Norway: 'NO',
  Oman: 'OM',
  Philippines: 'PH',
  'Papua New Guinea': 'PG',
  Turkey: 'TR',
  'New Zealand': 'NZ',
  Chile: 'CL',
  'Russian Federation': 'RU',
  France: 'FR',
  'United States': 'US',
  'American Samoa': 'AS',
  'Antigua and Barbuda': 'AG',
  Bahamas: 'BS',
  Comoros: 'KM',
  'Cape Verde': 'CV',
  'Cayman Islands': 'KY',
  Cyprus: 'CY',
  'Falkland Islands': 'FK',
  'Faeroe Islands': 'FO',
  'Federated States of Micronesia': 'FM',
  'Saint Kitts and Nevis': 'KN',
  Malta: 'MT',
  'Northern Mariana Islands': 'MP',
  Mauritius: 'MU',
  'New Caledonia': 'NC',
  'Puerto Rico': 'PR',
  'French Polynesia': 'PF',
  'Solomon Islands': 'SB',
  'São Tomé and Principe': 'ST',
  Seychelles: 'SC',
  'Turks and Caicos Islands': 'TC',
  Tonga: 'TO',
  'Trinidad and Tobago': 'TT',
  'United States Virgin Islands': 'VI',
  Vanuatu: 'VU',
  Samoa: 'WS',
  'Canary Islands (Spain)': 'ES',
  Guadeloupe: 'GP',
  Fiji: 'FJ',
};

interface CountryPaths {
  viewBox: string;
  /** ISO 3166 alpha-2 in capitals to the path data of all its parts. */
  paths: Record<string, string>;
}

/**
 * Reads `public/world.svg` (the map the homepage hero's continents are cut from) into one path per
 * country. It is fetched when the map is first drawn rather than bundled, since 150 KB of paths
 * belong on one admin page and not in every chunk.
 */
async function loadCountryPaths(): Promise<CountryPaths> {
  const response = await fetch('/world.svg');
  if (!response.ok) throw new Error(`world.svg: ${response.status}`);
  const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  const paths: Record<string, string> = {};
  for (const element of Array.from(doc.querySelectorAll('path'))) {
    const iso = (
      element.getAttribute('id') ?? NAME_TO_ISO[element.getAttribute('class') ?? '']
    )?.toUpperCase();
    const d = element.getAttribute('d');
    if (!iso || iso === 'AQ' || !d) continue;
    paths[iso] = paths[iso] ? `${paths[iso]} ${d}` : d;
  }
  const svg = doc.documentElement;
  return {
    viewBox: svg.getAttribute('viewbox') ?? svg.getAttribute('viewBox') ?? '0 0 2000 857',
    paths,
  };
}

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
  const { data, error } = useQuery({
    queryKey: ['admin', 'world-map'],
    queryFn: loadCountryPaths,
    staleTime: Infinity,
  });
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
    <div className="relative">
      <svg
        viewBox={data.viewBox}
        className="block h-auto w-full"
        aria-hidden="true"
        onPointerLeave={() => setHover(null)}
      >
        {Object.entries(data.paths).map(([iso, d]) => {
          const count = views.get(iso) ?? 0;
          // A square root, or Germany would leave every other country the same pale shade.
          const strength = count > 0 ? Math.round(18 + Math.sqrt(count / max) * 72) : 0;
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
      <p
        aria-live="polite"
        className="text-muted-foreground bg-card/80 absolute top-1 left-1 rounded-md px-2 py-1 text-xs tabular-nums backdrop-blur-sm"
      >
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
