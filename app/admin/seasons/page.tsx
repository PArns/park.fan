'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarRange, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TRIP_REGIONS, tripRegionTitle } from '@/lib/trip-regions/registry';
import { adminKeys, useAdminQuery } from '../_lib/api';
import {
  SEASON_KIND_LABELS,
  SEASON_KIND_OPTIONS,
  SEASON_STATUS_OPTIONS,
  seasonFilterQuery,
  seasonFiltersFrom,
  seasonListPath,
  type SeasonFilters,
} from '../_lib/seasons';
import type { ParkSeason, ParkSeasonKind } from '../_lib/types';
import { parkCatalogOptions, useParkCatalog } from '../_lib/use-park-catalog';
import { useCan } from '../_app/session';
import { SearchSelect, Select, Switch } from '../_ui/controls';
import { AdminPage, EmptyState, ErrorState, SkeletonRows, Toolbar } from '../_ui/primitives';
import { SeasonEditor, SeasonRow } from './_components/season-editor';

const REGION_OPTIONS = TRIP_REGIONS.map((region) => ({
  value: region.slug,
  label: tripRegionTitle(region.slug),
}));

/**
 * Every park's seasons in one place, filtered by year, kind, status, trip region, park and whether
 * they run today, with the form to add, change or delete one. The filters are the address, so a
 * reload or a shared link opens the same list.
 */
export default function SeasonsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canEdit = useCan('editor');
  const currentYear = new Date().getFullYear();
  const filters = useMemo(
    () => seasonFiltersFrom(new URLSearchParams(params.toString()), currentYear),
    [params, currentYear]
  );
  const setFilter = <K extends keyof SeasonFilters>(key: K, value: SeasonFilters[K]) => {
    const query = seasonFilterQuery({ ...filters, [key]: value }, currentYear);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const [editing, setEditing] = useState<ParkSeason | 'new' | null>(null);

  const path = seasonListPath(filters);
  const seasons = useAdminQuery<{ seasons: ParkSeason[]; total: number }>(
    adminKeys.seasons({ path }),
    path
  );
  const parks = useParkCatalog();
  const parkName = (id: string | null) =>
    parks.data?.parks.find((park) => park.id === id)?.name ?? undefined;

  const grouped = useMemo(() => {
    const byKind = new Map<string, ParkSeason[]>();
    for (const season of seasons.data?.seasons ?? []) {
      byKind.set(season.kind, [...(byKind.get(season.kind) ?? []), season]);
    }
    return [...byKind.entries()]
      .map(([kind, list]) => [kind, list.sort((a, b) => a.startDate.localeCompare(b.startDate))])
      .sort((a, b) => b[1].length - a[1].length) as Array<[string, ParkSeason[]]>;
  }, [seasons.data]);

  const years = useMemo(() => {
    const values = Array.from({ length: 5 }, (_, index) => String(currentYear - 1 + index));
    if (filters.year && !values.includes(filters.year)) values.unshift(filters.year);
    return values.map((value) => ({ value, label: value }));
  }, [currentYear, filters.year]);

  const shown = seasons.data?.seasons.length ?? 0;
  const total = seasons.data?.total ?? 0;

  return (
    <div>
      <Toolbar>
        <Select
          value={filters.year}
          onValueChange={(value) => setFilter('year', value)}
          options={years}
          placeholder="Alle Jahre"
          emptyLabel="Alle Jahre"
          className="h-8 w-28 text-xs"
        />
        <Select
          value={filters.kind}
          onValueChange={(value) => setFilter('kind', value)}
          options={SEASON_KIND_OPTIONS}
          placeholder="Alle Arten"
          emptyLabel="Alle Arten"
          className="h-8 w-36 text-xs"
        />
        <Select
          value={filters.status}
          onValueChange={(value) => setFilter('status', value)}
          options={SEASON_STATUS_OPTIONS}
          placeholder="Alle Status"
          emptyLabel="Alle Status"
          className="h-8 w-36 text-xs"
        />
        <Select
          value={filters.region}
          onValueChange={(value) => setFilter('region', value)}
          options={REGION_OPTIONS}
          placeholder="Alle Regionen"
          emptyLabel="Alle Regionen"
          className="h-8 w-44 text-xs"
        />
        <div className="flex items-center gap-1">
          <SearchSelect
            value={filters.parkId}
            onValueChange={(value) => setFilter('parkId', value)}
            options={parkCatalogOptions(parks.data?.parks ?? [])}
            placeholder={parks.isLoading ? 'Parks werden geladen…' : 'Alle Parks'}
            searchPlaceholder="Park suchen…"
            disabled={parks.isLoading || parks.isError}
            fuzzy="park"
            className="h-8 w-48 text-xs"
          />
          {filters.parkId && (
            <button
              type="button"
              onClick={() => setFilter('parkId', null)}
              aria-label="Parkfilter entfernen"
              className="text-muted-foreground hover:text-foreground rounded p-1.5 max-sm:p-3"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
        <Switch
          checked={filters.current}
          onCheckedChange={(next) => setFilter('current', next)}
          label={<span className="text-xs">Läuft heute</span>}
        />
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {seasons.data ? `${total} ${total === 1 ? 'Eintrag' : 'Einträge'}` : '…'}
        </span>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Neue Saison
          </Button>
        )}
      </Toolbar>

      <AdminPage>
        {seasons.isError ? (
          <ErrorState message={seasons.error.message} onRetry={() => void seasons.refetch()} />
        ) : seasons.isLoading ? (
          <SkeletonRows rows={8} />
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Für diesen Filter ist nichts hinterlegt"
            description="Saisons entstehen nicht von selbst: jemand trägt sie hier oder im Park unter „Saisons“ ein."
          />
        ) : (
          <>
            {grouped.map(([kind, list]) => (
              <section key={kind} aria-labelledby={`season-kind-${kind}`}>
                <h2
                  id={`season-kind-${kind}`}
                  className="text-muted-foreground mb-2 text-xs font-medium"
                >
                  {SEASON_KIND_LABELS[kind as ParkSeasonKind] ?? kind} · {list.length}
                </h2>
                <ul className="space-y-2">
                  {list.map((season) => (
                    <SeasonRow
                      key={season.id}
                      season={season}
                      showPark
                      canEdit={canEdit}
                      onOpen={() => setEditing(season)}
                    />
                  ))}
                </ul>
              </section>
            ))}
            {total > shown && (
              <p className="text-muted-foreground text-xs">
                Die ersten {shown} von {total}. Ein Filter zeigt den Rest.
              </p>
            )}
          </>
        )}
      </AdminPage>

      {editing && (
        <SeasonEditor
          season={editing === 'new' ? null : editing}
          parkId={editing === 'new' ? filters.parkId : editing.parkId}
          parkName={editing === 'new' ? parkName(filters.parkId) : editing.park?.name}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
