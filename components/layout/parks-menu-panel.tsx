'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { translateContinent, translateCountry } from '@/lib/i18n/helpers';
import type { GeoMenuContinent } from '@/lib/navigation/geo-menu';

/**
 * The three panes of the parks menu, and why they are not the same kind of thing.
 *
 * - **Continents and countries** are server-rendered into every page and are always in the
 *   document, the inactive country lists merely `hidden`. 28 links, 420 B brotli, and every one of
 *   them a hub worth concentrating sitewide weight on.
 * - **Cities and their parks** are fetched when somebody opens a country. 144 cities and 212 parks
 *   in the header template would put 356 more targets into the link graph of ~35,000 pages, to
 *   reach pages that the country hubs and the sitemap already reach. See `lib/navigation/geo-menu.ts`.
 *
 * The countries pane is a two-column grid because Europe has 11 countries and South America has
 * one: a single column would make the panel change height every time the pointer crossed the rail.
 * Two columns cap it at six rows, and `min-h` holds that height for the short continents.
 */

/**
 * How many rows the third pane may draw before it defers to the country page.
 *
 * A row is a city heading OR a park under it, because that is what actually takes vertical space:
 * Germany is 7 cities but 9 parks, and Rust alone contributes four rows. Counting cities instead
 * made the pane a different height for every country. The alternative was `max-height` plus a
 * scrollbar, which cut Haßloch in half at the panel's bottom edge and read as broken rather than
 * as scrollable — a menu should end on a whole row.
 */
const ROW_BUDGET = 12;

/** Split the fetched cities at the row budget, keeping whole cities. */
function fitCities(cities: CityEntry[]): { shown: CityEntry[]; hidden: number } {
  const shown: CityEntry[] = [];
  let rows = 0;
  for (const city of cities) {
    const cost = 1 + city.parks.length;
    // Always show the first city, however many parks it has — a pane that renders nothing because
    // the biggest city blew the budget on its own is worse than one that runs a little long.
    if (shown.length > 0 && rows + cost > ROW_BUDGET) break;
    shown.push(city);
    rows += cost;
  }
  return { shown, hidden: cities.length - shown.length };
}

/**
 * Which continent the panel opens on.
 *
 * Sorted by park count the first entry is North America (85 parks against Europe's 49), and
 * opening a German, Dutch, French, Spanish or Italian reader onto Florida is a worse guess than
 * the one the URL already makes for us. The reading language is the only signal available at
 * render time that says anything about where somebody is — the nearby-park query would be a better
 * one, but it lands after the first paint and would move the panel under the pointer.
 */
const DEFAULT_CONTINENT: Record<string, string> = {
  de: 'europe',
  nl: 'europe',
  fr: 'europe',
  es: 'europe',
  it: 'europe',
};

interface CityEntry {
  slug: string;
  name: string;
  parkCount: number;
  parks: { slug: string; name: string }[];
}

interface ParksMenuPanelProps {
  continents: GeoMenuContinent[];
}

export function ParksMenuPanel({ continents }: ParksMenuPanelProps) {
  const t = useTranslations('geo');
  const tNav = useTranslations('navigation');
  const locale = useLocale();
  const preferred = DEFAULT_CONTINENT[locale];
  const [activeContinent, setActiveContinent] = useState(
    (preferred && continents.some((c) => c.slug === preferred) ? preferred : continents[0]?.slug) ??
      ''
  );
  const [activeCountry, setActiveCountry] = useState<{ continent: string; country: string } | null>(
    null
  );
  const [cities, setCities] = useState<Record<string, CityEntry[]>>({});
  /** Countries already requested. A ref, not the `cities` state: it has to be readable and
   *  writable inside the effect without making the effect depend on what it writes. */
  const requested = useRef<Set<string>>(new Set());

  const countryKey = activeCountry ? `${activeCountry.continent}/${activeCountry.country}` : null;

  useEffect(() => {
    if (!countryKey) return;
    // One request per country for the life of the tab — the key is marked before the fetch starts,
    // so a pointer wandering back and forth over the same row cannot queue a second one.
    if (requested.current.has(countryKey)) return;
    requested.current.add(countryKey);
    let cancelled = false;
    fetch(`/api/nav/geo/${countryKey}`)
      .then((r) => (r.ok ? r.json() : { cities: [] }))
      .then((data: { cities?: CityEntry[] }) => {
        if (!cancelled) setCities((prev) => ({ ...prev, [countryKey]: data.cities ?? [] }));
      })
      .catch(() => {
        // The country link in the middle pane still works; the pane just stays empty.
        if (!cancelled) setCities((prev) => ({ ...prev, [countryKey]: [] }));
      });

    return () => {
      cancelled = true;
    };
  }, [countryKey]);

  const detail = countryKey ? cities[countryKey] : undefined;
  const fitted = detail ? fitCities(detail) : null;
  const activeCountryName = activeCountry
    ? translateCountry(t, activeCountry.country, locale)
    : null;

  return (
    <div className="flex gap-3">
      {/* Pane 1 — continents. */}
      <ul className="border-border/50 w-40 shrink-0 space-y-0.5 border-r pr-3">
        {continents.map((continent) => {
          const isActive = continent.slug === activeContinent;
          return (
            <li key={continent.slug}>
              <Link
                href={`/parks/${continent.slug}`}
                prefetch={false}
                onPointerEnter={() => {
                  setActiveContinent(continent.slug);
                  setActiveCountry(null);
                }}
                onFocus={() => {
                  setActiveContinent(continent.slug);
                  setActiveCountry(null);
                }}
                className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="truncate">
                  {translateContinent(t, continent.slug, locale, continent.name)}
                </span>
                <span className="text-muted-foreground/70 text-xs tabular-nums">
                  {continent.parkCount}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Pane 2 — countries. Every continent's list is rendered; the inactive ones are
          `display:none`, which keeps all 28 links in the first HTML for the crawler while the
          pointer only ever sees one of them. */}
      <div className="border-border/50 w-64 shrink-0 border-r pr-3">
        {continents.map((continent) => (
          <ul
            key={continent.slug}
            className={`grid min-h-44 grid-cols-2 content-start gap-x-2 gap-y-0.5 ${
              continent.slug === activeContinent ? '' : 'hidden'
            }`}
          >
            {continent.countries.map((country) => {
              const isActive =
                activeCountry?.continent === continent.slug &&
                activeCountry.country === country.slug;
              return (
                <li key={country.slug}>
                  <Link
                    href={`/parks/${continent.slug}/${country.slug}`}
                    prefetch={false}
                    onPointerEnter={() =>
                      setActiveCountry({ continent: continent.slug, country: country.slug })
                    }
                    onFocus={() =>
                      setActiveCountry({ continent: continent.slug, country: country.slug })
                    }
                    className={`flex items-center justify-between gap-1.5 rounded-md px-2 py-1 text-sm transition-colors ${
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">
                      {translateCountry(t, country.slug, locale, country.name)}
                    </span>
                    <span className="text-muted-foreground/70 text-xs tabular-nums">
                      {country.parkCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </div>

      {/* Pane 3 — the open country's cities and parks, fetched on demand. */}
      <div className="w-56 shrink-0">
        {activeCountry == null ? (
          <p className="text-muted-foreground/70 px-2 py-1 text-xs">{t('exploreByRegion')}</p>
        ) : (
          <>
            <div className="text-foreground px-2 pb-1.5 text-xs font-semibold tracking-wide uppercase">
              {activeCountryName}
            </div>
            {detail === undefined ? (
              <ul className="space-y-1.5 px-2 pt-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="bg-muted/60 h-3.5 animate-pulse rounded" />
                ))}
              </ul>
            ) : detail.length === 0 ? null : (
              <ul className="space-y-1.5">
                {fitted!.shown.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={`/parks/${activeCountry.continent}/${activeCountry.country}/${city.slug}`}
                      prefetch={false}
                      className="text-muted-foreground/70 hover:text-foreground block px-2 text-[11px] tracking-wide uppercase transition-colors"
                    >
                      {city.name}
                    </Link>
                    <ul>
                      {city.parks.map((park) => (
                        <li key={park.slug}>
                          <Link
                            href={`/parks/${activeCountry.continent}/${activeCountry.country}/${city.slug}/${park.slug}`}
                            prefetch={false}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted block truncate rounded-md px-2 py-0.5 text-sm transition-colors"
                          >
                            {park.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
                {/* Never a silent cut: the US has 50 cities and the pane shows a handful. */}
                {fitted!.hidden > 0 && (
                  <li>
                    <Link
                      href={`/parks/${activeCountry.continent}/${activeCountry.country}`}
                      prefetch={false}
                      className="text-primary hover:text-primary/80 block px-2 pt-1 text-xs font-medium transition-colors"
                    >
                      {tNav('moreCities', { count: fitted!.hidden })}
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
