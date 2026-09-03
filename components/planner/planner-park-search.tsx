'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { MapPin, Search } from 'lucide-react';
import { getCountryName } from '@/lib/utils/region-names';
import { todayInZone } from '@/lib/planner/park-time';
import type { PlannerGeo } from '@/lib/planner/types';

/** `/api/search` answers an empty set below this, so asking earlier is a lie. */
const MIN_QUERY_LENGTH = 3;

interface PlannerParkSearchProps {
  /** Parks already in the plan — offered, but marked, so a pick is never a surprise. */
  plannedSlugs: ReadonlySet<string>;
  onPick: (park: { slug: string; name: string; geo: PlannerGeo }, date: string) => void;
}

interface ParkHit {
  slug: string;
  name: string;
  geo: PlannerGeo;
  city?: string;
  country?: string;
  /** ISO 3166-1 alpha-2, which is what a localized country name is derived from. */
  countryCode?: string;
  imageUrl?: string;
  imagePosition?: string;
}

/**
 * Adding a park the plan does not have yet.
 *
 * The overview lists parks WITH entries, so before this the only way to start a
 * second park was to leave the panel, navigate to that park, and use a control
 * there — which is a strange thing to ask of somebody who has the planner open
 * and is looking at a list of their parks.
 *
 * It searches the site's own `/api/search` rather than a new endpoint: that
 * route already ranks parks, already carries the media thumbnail, and — the part
 * that matters — its `url` is the geographic path, so the four URL SLUGS a plan
 * files a park under come from the API instead of being reconstructed here from
 * display names. "Netherlands" is not `netherlands` in every language, and
 * guessing would file the park under a path that 404s.
 */
export function PlannerParkSearch({ plannedSlugs, onPick }: PlannerParkSearchProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ParkHit[]>([]);
  const [busy, setBusy] = useState(false);

  const needle = query.trim();
  // The floor is the SEARCH ROUTE's, not a number picked here: `/api/search`
  // answers an empty result set below three characters, so a two-letter query
  // would render "keine Treffer" for a park that is in the catalogue.
  const short = needle.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    // No `setState` in the effect BODY — React 19 rejects it outright
    // (`react-hooks/set-state-in-effect`), and it is the wrong shape anyway:
    // "too short to search" is derivable from `needle`, so it is derived at
    // render rather than stored and cleared.
    if (needle.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    // Debounced and aborted, the same discipline `EntityPicker` uses for the
    // same reason: this one queries the API across every park, so a keystroke
    // must not become a request and a slow answer for "to" must not land on top
    // of a fast one for "toverland".
    const timer = window.setTimeout(() => {
      setBusy(true);
      fetch(`/api/search?q=${encodeURIComponent(needle)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: unknown) => {
          setHits(parkHits(data));
          setBusy(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setHits([]);
          setBusy(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [needle]);

  const results = useMemo(() => (short ? [] : hits.slice(0, 6)), [hits, short]);

  return (
    <div className="border-border/60 border-b px-2 py-2" data-planner-park-search="">
      <div className="relative">
        <Search className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('parkSearch.placeholder')}
          aria-label={t('parkSearch.placeholder')}
          className="bg-accent/40 focus:bg-accent placeholder:text-muted-foreground/70 h-9 w-full rounded-md pr-2 pl-7 text-sm transition-colors outline-none max-sm:h-11"
        />
      </div>

      {!short && (
        <ul className="mt-1">
          {results.length === 0 ? (
            <li className="text-muted-foreground px-1 py-2 text-xs">
              {busy ? t('parkSearch.searching') : t('parkSearch.noResults')}
            </li>
          ) : (
            results.map((park) => (
              <li key={park.slug}>
                <button
                  type="button"
                  onClick={() => onPick(park, todayInZone(undefined))}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors max-sm:py-2.5"
                >
                  {park.imageUrl ? (
                    <span className="bg-muted relative size-8 shrink-0 overflow-hidden rounded">
                      <Image
                        src={park.imageUrl}
                        alt=""
                        fill
                        sizes="96px"
                        quality={75}
                        style={{ objectFit: 'cover', objectPosition: park.imagePosition }}
                      />
                    </span>
                  ) : (
                    <span className="bg-muted/50 text-muted-foreground/60 flex size-8 shrink-0 items-center justify-center rounded">
                      <MapPin className="size-3.5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{park.name}</span>
                    {(park.city || park.country) && (
                      <span className="text-muted-foreground block truncate text-[11px]">
                        {[park.city, countryLabel(park, locale)].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </span>
                  {plannedSlugs.has(park.slug) && (
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {t('parkSearch.alreadyPlanned')}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * The country in the reader's language.
 *
 * The search payload names it in English — "Netherlands", "South Korea" — while
 * the site's own palette three centimetres to the left says "Deutschland". The
 * ISO code rides along on the same hit, so `Intl.DisplayNames` settles it; the
 * English name stays as the fallback for a hit that carries no code.
 */
function countryLabel(park: ParkHit, locale: string): string | undefined {
  if (!park.countryCode) return park.country;
  return getCountryName(park.countryCode, locale);
}

/**
 * Park hits out of the search payload, with their geo read off the API's own URL.
 *
 * `/v1/parks/<continent>/<country>/<city>/<park>` — four slugs, taken rather than
 * derived. A result whose URL does not have that shape is dropped: a park filed
 * under a guessed path is a plan pointing at a 404.
 */
function parkHits(data: unknown): ParkHit[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { results?: unknown[] })?.results)
      ? ((data as { results: unknown[] }).results ?? [])
      : [];

  const out: ParkHit[] = [];
  for (const raw of list) {
    const hit = raw as Record<string, unknown>;
    if (hit.type !== 'park') continue;
    if (typeof hit.slug !== 'string' || typeof hit.name !== 'string') continue;
    if (typeof hit.url !== 'string') continue;

    const parts = hit.url.split('/').filter(Boolean);
    const parksAt = parts.indexOf('parks');
    if (parksAt === -1) continue;
    const geoParts = parts.slice(parksAt + 1);
    if (geoParts.length < 4) continue;

    out.push({
      slug: hit.slug,
      name: hit.name,
      geo: { continent: geoParts[0], country: geoParts[1], city: geoParts[2] },
      city: typeof hit.city === 'string' ? hit.city : undefined,
      country: typeof hit.country === 'string' ? hit.country : undefined,
      countryCode: typeof hit.countryCode === 'string' ? hit.countryCode : undefined,
      imageUrl: typeof hit.imageUrl === 'string' ? hit.imageUrl : undefined,
      imagePosition: typeof hit.imagePosition === 'string' ? hit.imagePosition : undefined,
    });
  }
  return out;
}
