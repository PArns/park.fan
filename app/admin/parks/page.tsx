'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarRange,
  Filter,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Rows3,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminKeys, useAdminQuery } from '../_lib/api';
import type { AdminParkListItem } from '../_lib/types';
import { Chip, EmptyState, ErrorState, SkeletonRows, Toolbar } from '../_ui/primitives';
import { Select, TextInput } from '../_ui/controls';
import { useLocalPreference } from '../_lib/use-local-preference';

/**
 * The park browser, in three shapes.
 *
 * The same 212 rows answer different questions depending on how they are laid
 * out, and an admin that offers only one shape makes two of the three questions
 * hard. A table sorts and compares — "which parks have nothing curated yet".
 * A grid is for recognising a place rather than reading it. A map answers the
 * one neither can: where these things are, and which coordinates are wrong.
 *
 * The mode is remembered, because somebody who works in one shape works in it
 * every day, and re-choosing it on every visit is a small tax charged forever.
 */

const ParksMap = dynamic(() => import('./_components/parks-map'), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
      Karte wird geladen…
    </div>
  ),
});

type ViewMode = 'table' | 'grid' | 'map';
type CuratedFilter = 'all' | 'only' | 'none';

export default function ParksPage() {
  const [view, setView] = useLocalPreference('parkfan_admin_parks_view', 'table');
  const mode = (['table', 'grid', 'map'].includes(view) ? view : 'table') as ViewMode;

  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [curated, setCurated] = useState<CuratedFilter>('all');

  // Deferred so typing stays smooth on the grid and map, which re-render every
  // row. The request itself is not debounced — the whole catalogue is one
  // request and the server filters it.
  const deferredQuery = useDeferredValue(query);

  const params = useMemo(() => {
    const search = new URLSearchParams({ limit: '500' });
    if (deferredQuery.trim().length > 0) search.set('q', deferredQuery.trim());
    if (country) search.set('country', country);
    if (curated !== 'all') search.set('curated', curated);
    return search.toString();
  }, [deferredQuery, country, curated]);

  const parks = useAdminQuery<{ total: number; parks: AdminParkListItem[] }>(
    adminKeys.parks({ params }),
    `/api/admin/content/parks?${params}`
  );

  const countries = useMemo(() => {
    const seen = new Map<string, string>();
    for (const park of parks.data?.parks ?? []) {
      if (park.countryCode && park.country) seen.set(park.countryCode, park.country);
    }
    return [...seen.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de'));
  }, [parks.data]);

  const rows = parks.data?.parks ?? [];
  const filtersActive = country !== null || curated !== 'all' || query.trim().length > 0;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <Toolbar>
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Park, Stadt oder Slug…"
            className="h-8 pl-8 text-xs"
          />
        </div>

        <Select
          value={country}
          onValueChange={setCountry}
          options={countries}
          placeholder="Alle Länder"
          emptyLabel="Alle Länder"
          className="h-8 w-40 text-xs"
        />

        <Select
          value={curated === 'all' ? null : curated}
          onValueChange={(value) => setCurated((value as CuratedFilter) ?? 'all')}
          options={[
            { value: 'only', label: 'Nur kuratierte' },
            { value: 'none', label: 'Noch unkuratiert' },
          ]}
          placeholder="Kuratierung: alle"
          emptyLabel="Kuratierung: alle"
          className="h-8 w-44 text-xs"
        />

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCountry(null);
              setCurated('all');
            }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          >
            <X className="h-3 w-3" /> zurücksetzen
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
            {parks.isLoading ? '…' : `${rows.length} von ${parks.data?.total ?? 0}`}
          </span>
          <ViewSwitch mode={mode} onChange={setView} />
        </div>
      </Toolbar>

      <div className="min-h-0 flex-1 overflow-auto">
        {parks.isError ? (
          <ErrorState message={parks.error.message} onRetry={() => void parks.refetch()} />
        ) : parks.isLoading ? (
          <SkeletonRows rows={10} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={filtersActive ? Filter : MapPin}
            title={filtersActive ? 'Keine Treffer' : 'Keine Parks'}
            description={
              filtersActive
                ? 'Andere Filter probieren — oder die Suche leeren.'
                : 'Der Katalog ist leer. Das ist selten und meistens ein Sync-Problem.'
            }
          />
        ) : mode === 'map' ? (
          <div className="h-full">
            <ParksMap parks={rows} />
          </div>
        ) : mode === 'grid' ? (
          <ParkGrid parks={rows} />
        ) : (
          <ParkTable parks={rows} />
        )}
      </div>
    </div>
  );
}

// ─── view switch ──────────────────────────────────────────────────────────────

const VIEWS: Array<{ mode: ViewMode; label: string; icon: typeof Rows3 }> = [
  { mode: 'table', label: 'Tabelle', icon: Rows3 },
  { mode: 'grid', label: 'Kacheln', icon: LayoutGrid },
  { mode: 'map', label: 'Karte', icon: MapIcon },
];

function ViewSwitch({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="border-border/60 bg-background/60 inline-flex rounded-lg border p-0.5">
      {VIEWS.map((view) => (
        <button
          key={view.mode}
          type="button"
          title={view.label}
          aria-pressed={mode === view.mode}
          onClick={() => onChange(view.mode)}
          className={cn(
            'rounded-md p-1.5 transition-colors',
            mode === view.mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <view.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

// ─── table ────────────────────────────────────────────────────────────────────

function ParkTable({ parks }: { parks: AdminParkListItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-background/80 text-muted-foreground sticky top-0 z-10 text-left text-xs backdrop-blur-md">
        <tr className="border-border/50 border-b">
          <th className="px-4 py-2 font-medium">Park</th>
          <th className="px-4 py-2 font-medium">Ort</th>
          <th className="px-4 py-2 text-right font-medium">Fahrgeschäfte</th>
          <th className="px-4 py-2 text-right font-medium">Saisons</th>
          <th className="px-4 py-2 font-medium">Kuratiert</th>
        </tr>
      </thead>
      <tbody className="divide-border/40 divide-y">
        {parks.map((park) => (
          <tr key={park.id} className="hover:bg-muted/25 group">
            <td className="px-4 py-2.5">
              <Link href={`/admin/parks/${park.id}`} className="block min-w-0">
                <span className="group-hover:text-primary flex items-center gap-1.5 font-medium">
                  {park.name}
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                {park.name !== park.upstreamName && (
                  <span className="text-muted-foreground block truncate text-xs">
                    Upstream: {park.upstreamName}
                  </span>
                )}
              </Link>
            </td>
            <td className="text-muted-foreground px-4 py-2.5 text-xs">
              {[park.city, park.country].filter(Boolean).join(', ') || '—'}
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums">{park.attractionCount}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">
              {park.seasonCount > 0 ? (
                <Link
                  href={`/admin/parks/${park.id}?tab=seasons`}
                  className="hover:text-primary inline-flex items-center gap-1"
                >
                  <CalendarRange className="h-3 w-3" />
                  {park.seasonCount}
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td className="px-4 py-2.5">
              <ParkCuratedChips park={park} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ParkCuratedChips({ park }: { park: AdminParkListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {park.curatedFieldCount > 0 ? (
        <Chip tone="primary">
          <Sparkles className="h-3 w-3" />
          {park.curatedFieldCount}
        </Chip>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )}
      {park.noWaitTimesReason && (
        <Chip tone="warning" className="whitespace-nowrap">
          keine Wartezeiten
        </Chip>
      )}
    </div>
  );
}

// ─── grid ─────────────────────────────────────────────────────────────────────

function ParkGrid({ parks }: { parks: AdminParkListItem[] }) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {parks.map((park) => (
        <Link
          key={park.id}
          href={`/admin/parks/${park.id}`}
          className="border-border/60 bg-card/50 hover:border-primary/40 group flex flex-col gap-2 rounded-xl border p-3.5 transition-colors"
        >
          <div className="flex items-start gap-2">
            <span className="bg-primary/10 text-primary mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="group-hover:text-primary truncate text-sm font-semibold">{park.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {[park.city, park.country].filter(Boolean).join(', ') || park.slug}
              </p>
            </div>
          </div>

          {park.name !== park.upstreamName && (
            <p className="text-muted-foreground truncate text-[11px]">
              Upstream: {park.upstreamName}
            </p>
          )}

          <div className="text-muted-foreground mt-auto flex items-center gap-3 text-xs tabular-nums">
            <span>{park.attractionCount} Bahnen</span>
            {park.seasonCount > 0 && <span>{park.seasonCount} Saisons</span>}
          </div>

          <ParkCuratedChips park={park} />
        </Link>
      ))}
    </div>
  );
}
