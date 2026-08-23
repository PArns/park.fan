'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarDays, CalendarRange, Ticket, TriangleAlert } from 'lucide-react';
import { adminKeys, useAdminQuery } from '../_lib/api';
import type { ParkSeason, ParkSeasonKind, ParkSeasonStatus } from '../_lib/types';
import { Chip, EmptyState, ErrorState, SkeletonRows, Toolbar } from '../_ui/primitives';
import { Select } from '../_ui/controls';

/**
 * Every park's seasons in one place.
 *
 * This is the view that answers "what do we have on file for Halloween 2026",
 * and until now that question could only be answered by reading a blog post.
 * The research existed — nine parks, in prose, in six languages — and it was
 * unqueryable: nothing could tell you which of the other 203 parks had nothing
 * recorded, which is the useful half.
 */

const KIND_LABELS: Record<ParkSeasonKind, string> = {
  halloween: 'Halloween',
  christmas: 'Weihnachten',
  summer_nights: 'Sommernächte',
  special_event: 'Sonderevent',
  opening: 'Saison',
  closure: 'Schließzeit',
  maintenance: 'Wartung',
};

const STATUS_LABELS: Record<ParkSeasonStatus, string> = {
  confirmed: 'bestätigt',
  announced: 'angekündigt',
  expected: 'erwartet',
  cancelled: 'abgesagt',
};

export default function SeasonsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string | null>(String(currentYear));
  const [kind, setKind] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const params = useMemo(() => {
    const search = new URLSearchParams({ limit: '400' });
    if (year) search.set('year', year);
    if (kind) search.set('kind', kind);
    if (status) search.set('status', status);
    return search.toString();
  }, [year, kind, status]);

  const seasons = useAdminQuery<{ seasons: ParkSeason[]; total: number }>(
    adminKeys.seasons({ params }),
    `/api/admin/content/seasons?${params}`
  );

  const grouped = useMemo(() => {
    const byKind = new Map<string, ParkSeason[]>();
    for (const season of seasons.data?.seasons ?? []) {
      const list = byKind.get(season.kind) ?? [];
      list.push(season);
      byKind.set(season.kind, list);
    }
    return [...byKind.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [seasons.data]);

  const years = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const value = String(currentYear - 1 + index);
        return { value, label: value };
      }),
    [currentYear]
  );

  return (
    <div>
      <Toolbar>
        <Select
          value={year}
          onValueChange={setYear}
          options={years}
          placeholder="Alle Jahre"
          emptyLabel="Alle Jahre"
          className="h-8 w-32 text-xs"
        />
        <Select
          value={kind}
          onValueChange={setKind}
          options={Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))}
          placeholder="Alle Arten"
          emptyLabel="Alle Arten"
          className="h-8 w-40 text-xs"
        />
        <Select
          value={status}
          onValueChange={setStatus}
          options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          placeholder="Alle Status"
          emptyLabel="Alle Status"
          className="h-8 w-40 text-xs"
        />
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {seasons.data ? `${seasons.data.total} Einträge` : '…'}
        </span>
      </Toolbar>

      <div className="mx-auto max-w-5xl space-y-6 p-4">
        {seasons.isError ? (
          <ErrorState message={seasons.error.message} onRetry={() => void seasons.refetch()} />
        ) : seasons.isLoading ? (
          <SkeletonRows rows={8} />
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Für diesen Filter ist nichts hinterlegt"
            description="Saisons entstehen nicht von selbst — sie werden im jeweiligen Park eingetragen."
          />
        ) : (
          grouped.map(([kindKey, list]) => (
            <section key={kindKey}>
              <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-widest uppercase">
                {KIND_LABELS[kindKey as ParkSeasonKind] ?? kindKey} · {list.length}
              </h2>
              <ul className="divide-border/40 border-border/60 bg-card/40 divide-y rounded-xl border">
                {list
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((season) => (
                    <li key={season.id}>
                      <Link
                        href={`/admin/parks/${season.parkId}?tab=seasons`}
                        className="hover:bg-muted/25 flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {season.park?.name ?? 'Unbekannter Park'}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {season.name ?? ''}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {format(parseISO(season.startDate), 'd. MMM', { locale: de })} –{' '}
                          {format(parseISO(season.endDate), 'd. MMM', { locale: de })}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          {season.dates && season.dates.length > 0 && (
                            <Chip>
                              <CalendarDays className="h-3 w-3" />
                              {season.dates.length}
                            </Chip>
                          )}
                          {season.separateTicket && (
                            <Chip>
                              <Ticket className="h-3 w-3" />
                            </Chip>
                          )}
                          <Chip
                            tone={
                              season.status === 'confirmed'
                                ? 'success'
                                : season.status === 'cancelled'
                                  ? 'danger'
                                  : 'muted'
                            }
                          >
                            {STATUS_LABELS[season.status]}
                          </Chip>
                          {!season.sourceUrl && season.status !== 'expected' && (
                            <span title="Ohne Quelle">
                              <TriangleAlert className="h-3.5 w-3.5 text-amber-400" />
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
