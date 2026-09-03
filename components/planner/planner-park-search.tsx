'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getCountryName } from '@/lib/utils/region-names';
import type { PlannerGeo } from '@/lib/planner/types';

/** `/api/search` answers an empty set below this, so asking earlier is a lie. */
const MIN_QUERY_LENGTH = 3;

/**
 * A park as this control hands it over.
 *
 * Everything past `geo` is what the SEARCH payload happened to carry, and the
 * wizard's hero paints it: a park picked here arrives with its own photograph
 * and its own city. None of it is stored in the plan — a plan holds the four
 * slugs and the name, because those are what rebuild a URL, and a `?v=`-hashed
 * crop URL in persisted state would be a derived asset frozen into the
 * visitor's browser.
 */
export interface PlannerParkPick {
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

interface PlannerParkSearchProps {
  /** Parks already in the plan — offered, but marked, so a pick is never a surprise. */
  plannedSlugs: ReadonlySet<string>;
  /**
   * The park, and nothing else. It used to hand over a DATE as well — today in
   * the READER's zone, because the search payload carries no timezone — and
   * every call site filed the new park under it. For a Florida park picked from
   * Germany after 18:00 that is tomorrow's plan. The date is the wizard's own
   * question now, answered against the park's own zone once its forecast has
   * named it.
   */
  onPick: (park: PlannerParkPick) => void;
}

type ParkHit = PlannerParkPick;

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
    <div data-planner-park-search="">
      {/* The house `Input`, not a bespoke one. This was a bare `<input>` with a
          hand-rolled `bg-accent/40` fill and no border or focus ring — so on the
          planner's own page it sat next to nothing else on the site and read as
          a placeholder somebody had not finished. `Input` carries the border,
          the focus ring and the `dark:bg-input/30` every other field on the site
          has; the only thing added here is room for the icon. */}
      <div className="relative">
        <Search className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('parkSearch.placeholder')}
          aria-label={t('parkSearch.placeholder')}
          className="pl-9 max-sm:h-11"
        />
      </div>

      {!short && (
        <ul className="mt-2 space-y-1">
          {results.length === 0 ? (
            <li className="text-muted-foreground px-1 py-2 text-xs">
              {busy ? t('parkSearch.searching') : t('parkSearch.noResults')}
            </li>
          ) : (
            results.map((park) => (
              <li key={park.slug}>
                {/* The photo is a 14:10 STRIP, not a square. Its source is the
                    park's own background picture — a landscape shot of a
                    skyline or a queue line — and a square crop of one is a
                    detail of the middle of it. */}
                <button
                  type="button"
                  onClick={() => onPick(park)}
                  className="hover:bg-accent focus-visible:ring-ring hover:border-border/60 flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none max-sm:py-2"
                >
                  {park.imageUrl ? (
                    <span className="bg-muted relative h-10 w-14 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={park.imageUrl}
                        alt=""
                        fill
                        sizes="112px"
                        quality={75}
                        style={{ objectFit: 'cover', objectPosition: park.imagePosition }}
                      />
                    </span>
                  ) : (
                    <span className="bg-muted/50 text-muted-foreground/60 flex h-10 w-14 shrink-0 items-center justify-center rounded-lg">
                      <MapPin className="size-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{park.name}</span>
                    {(park.city || park.country) && (
                      <span className="text-muted-foreground block truncate text-xs">
                        {[park.city, countryLabel(park, locale)].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </span>
                  {plannedSlugs.has(park.slug) && (
                    <span className="text-muted-foreground/80 shrink-0 text-[10px]">
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
