'use client';

import { useEffect, useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getCountryName } from '@/lib/utils/region-names';
import { parkHits, type SearchParkHit } from '@/lib/utils/search-park-hits';

/** `/api/search` answers an empty set below this, so asking earlier would be a lie. */
const MIN_QUERY_LENGTH = 3;

interface CompareParkPickerProps {
  /** Full geo paths (`continent/country/city/slug`) of the parks already chosen. */
  chosen: ReadonlySet<string>;
  /** Off when four parks are chosen: the field stays, a pick does nothing. */
  disabled: boolean;
  onPick: (park: SearchParkHit) => void;
}

/**
 * Finds a park through the site's own `/api/search`, the way the trip planner's park search does,
 * and hands over the four slugs the API's URL carries instead of rebuilding them from names.
 *
 * Its own file rather than `PlannerParkSearch`: that one reads the `planner` message namespace
 * (17 KB) for three short strings, and this page would ship all of it for them.
 */
export function CompareParkPicker({ chosen, disabled, onPick }: CompareParkPickerProps) {
  const t = useTranslations('compare.tool');
  const locale = useLocale();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<{ q: string; hits: SearchParkHit[] }>({ q: '', hits: [] });
  const [busy, setBusy] = useState(false);

  const needle = query.trim();
  const short = needle.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    if (needle.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    // Debounced and aborted: a keystroke is not a request, and a slow answer for "ef" must not
    // land on top of a fast one for "efteling".
    const timer = window.setTimeout(() => {
      setBusy(true);
      fetch(`/api/search?q=${encodeURIComponent(needle)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: unknown) => {
          setFound({ q: needle, hits: parkHits(data) });
          setBusy(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setFound({ q: needle, hits: [] });
          setBusy(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      setBusy(false);
    };
  }, [needle]);

  // Hits belong to the query they answered: while a newer one is in flight (250 ms debounce plus
  // the request) the old list is neither shown nor pickable by Enter.
  const results = short || found.q !== needle ? [] : found.hits.slice(0, 6);
  const keyOf = (p: SearchParkHit) => `${p.geo.continent}/${p.geo.country}/${p.geo.city}/${p.slug}`;

  const pick = (park: SearchParkHit) => {
    if (disabled || chosen.has(keyOf(park))) return;
    onPick(park);
    setQuery('');
    setFound({ q: '', hits: [] });
  };

  return (
    <div data-compare-picker="">
      <div className="relative">
        <Search
          className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const first = results.find((p) => !chosen.has(keyOf(p)));
            if (first) pick(first);
          }}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          aria-controls={listId}
          className="pl-9"
        />
      </div>

      {!short && (
        <ul id={listId} className="mt-2 space-y-1">
          {results.length === 0 ? (
            <li className="text-muted-foreground px-1 py-2 text-xs">
              {busy ? t('searching') : t('noResults')}
            </li>
          ) : (
            results.map((park) => {
              const picked = chosen.has(keyOf(park));
              const place = [
                park.city,
                park.countryCode ? getCountryName(park.countryCode, locale) : park.country,
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <li key={keyOf(park)}>
                  <button
                    type="button"
                    disabled={picked}
                    onClick={() => pick(park)}
                    className={cn(
                      'hover:bg-accent flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors disabled:opacity-60 disabled:hover:bg-transparent'
                    )}
                  >
                    <span className="bg-muted/50 text-muted-foreground/60 flex size-8 shrink-0 items-center justify-center rounded-lg">
                      {picked ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <MapPin className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{park.name}</span>
                      {place && (
                        <span className="text-muted-foreground block truncate text-xs">
                          {place}
                        </span>
                      )}
                    </span>
                    {picked && (
                      <span className="text-muted-foreground/80 shrink-0 text-[10px]">
                        {t('chosen')}
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
