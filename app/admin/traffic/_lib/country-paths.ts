'use client';

import { useQuery } from '@tanstack/react-query';
import { largestRing, type PathRing } from '@/lib/admin/world-map';

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

/** The countries of `public/world.svg`, one path each, keyed by upper-case alpha-2. */
interface CountryPaths {
  viewBox: string;
  /** The map's width and height in its own units, for placing markers over it in percent. */
  size: { width: number; height: number };
  /** ISO 3166 alpha-2 in capitals to the path data of all its parts. */
  paths: Record<string, string>;
  /** Where a marker on a country goes: the centre of its largest part. */
  anchors: Record<string, { x: number; y: number }>;
}

/**
 * Reads `public/world.svg` (the map the homepage hero's continents are cut from) into one path per
 * country. It is fetched when a map is first drawn rather than bundled, since 150 KB of paths
 * belong on the admin's map pages and not in every chunk.
 */
async function loadCountryPaths(): Promise<CountryPaths> {
  const response = await fetch('/world.svg');
  if (!response.ok) throw new Error(`world.svg: ${response.status}`);
  const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  const paths: Record<string, string> = {};
  const largest: Record<string, PathRing> = {};
  for (const element of Array.from(doc.querySelectorAll('path'))) {
    const iso = (
      element.getAttribute('id') ?? NAME_TO_ISO[element.getAttribute('class') ?? '']
    )?.toUpperCase();
    const d = element.getAttribute('d');
    if (!iso || iso === 'AQ' || !d) continue;
    paths[iso] = paths[iso] ? `${paths[iso]} ${d}` : d;
    const ring = largestRing(d);
    if (ring && (!largest[iso] || ring.area > largest[iso].area)) largest[iso] = ring;
  }
  const svg = doc.documentElement;
  const viewBox = svg.getAttribute('viewbox') ?? svg.getAttribute('viewBox') ?? '0 0 2000 857';
  const [, , width, height] = viewBox.split(/[\s,]+/).map(Number);
  const anchors: CountryPaths['anchors'] = {};
  for (const [iso, ring] of Object.entries(largest)) anchors[iso] = { x: ring.x, y: ring.y };
  return { viewBox, size: { width: width || 2000, height: height || 857 }, paths, anchors };
}

/** The country paths of the admin's world maps, read once per tab and shared by every map. */
export function useCountryPaths() {
  return useQuery({
    queryKey: ['admin', 'world-map'],
    queryFn: loadCountryPaths,
    staleTime: Infinity,
  });
}
