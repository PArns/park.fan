'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { CrowdBadge, EmptyPanel, ErrorPanel, LoadingPanel, Section } from '../_lib/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type {
  ParkListItem,
  ParksListResponse,
  SearchResponse,
  SearchResult,
} from '@/lib/api/admin-stats';

const PAGE_SIZE = 25;

type SortKey = 'name' | 'location' | 'status' | 'avgWait' | 'rides';

function sortValue(park: ParkListItem, key: SortKey): string | number {
  const stats = park.analytics?.statistics;
  switch (key) {
    case 'name':
      return park.name.toLowerCase();
    case 'location':
      return [park.country, park.city].filter(Boolean).join(' ').toLowerCase();
    case 'status':
      return park.status;
    case 'avgWait':
      return stats?.avgWaitTime ?? -1;
    case 'rides':
      return stats?.totalAttractions ?? -1;
  }
}

const TYPE_STYLES: Record<string, string> = {
  park: 'bg-primary/15 text-primary',
  attraction: 'bg-blue-500/15 text-blue-400',
  show: 'bg-purple-500/15 text-purple-400',
  restaurant: 'bg-amber-500/15 text-amber-400',
  location: 'bg-zinc-500/15 text-zinc-400',
};

function StatusPill({ status }: { status: string }) {
  const operating = status === 'OPERATING';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        operating ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'
      )}
    >
      {operating ? 'Open' : 'Closed'}
    </span>
  );
}

function SearchResultRow({ r }: { r: SearchResult }) {
  // Shows/restaurants have no own page — fall back to the parent park.
  const target = r.url ?? r.parentPark?.url ?? null;
  const inner = (
    <>
      <span
        className={cn(
          'w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium capitalize',
          TYPE_STYLES[r.type] ?? TYPE_STYLES.location
        )}
      >
        {r.type}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{r.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {r.parentPark ? `${r.parentPark.name} · ` : ''}
          {[r.city, r.country].filter(Boolean).join(', ')}
        </p>
      </div>
      {r.status && <StatusPill status={r.status} />}
      {target && <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0" />}
    </>
  );
  const className = 'flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2';
  return target ? (
    <Link href={target} className={cn(className, 'hover:border-primary/40')}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function SearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return <EmptyPanel label="No matches." />;
  return (
    <div className="space-y-1">
      {results.map((r) => (
        <SearchResultRow key={`${r.type}-${r.id}`} r={r} />
      ))}
    </div>
  );
}

function SortHeader({
  label,
  column,
  active,
  dir,
  onSort,
  align = 'left',
}: {
  label: string;
  column: SortKey;
  active: boolean;
  dir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={cn('px-4 py-2 font-medium', align === 'right' && 'text-right')}>
      <button
        onClick={() => onSort(column)}
        className={cn(
          'hover:text-foreground inline-flex items-center gap-1 transition-colors',
          align === 'right' && 'flex-row-reverse',
          active && 'text-foreground'
        )}
      >
        {label}
        <Icon className={cn('h-3 w-3', !active && 'opacity-40')} />
      </button>
    </th>
  );
}

export default function ParksPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'name',
    dir: 'asc',
  });
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
    setPage(1);
  }

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const searchActive = debounced.length >= 3;
  // Derived loading flag — true until the latest query has fresh results.
  const searching = searchActive && searchData?.query !== debounced;

  useEffect(() => {
    if (!searchActive) return;
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: SearchResponse) => {
        if (!cancelled) setSearchData(d);
      })
      .catch(() => {
        if (!cancelled) setSearchData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, searchActive]);

  // The dataset is small (~155 parks), so load it all once and sort/paginate
  // client-side — the API only supports sorting by name/openStatus.
  const listEndpoint = searchActive ? null : '/api/parks-list?page=1&limit=500';
  const list = useAdminFetch<ParksListResponse>(listEndpoint);

  const totalParks = list.data?.pagination.total;

  const sorted = useMemo(() => {
    const rows = list.data?.data ?? [];
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [list.data, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const searchCount = useMemo(
    () =>
      searchData
        ? Object.values(searchData.counts).reduce((sum, c) => sum + (c?.total ?? 0), 0)
        : 0,
    [searchData]
  );

  return (
    <Section
      icon={MapPin}
      title="Parks"
      action={
        totalParks != null && !searchActive ? (
          <span className="text-muted-foreground text-xs tabular-nums">{totalParks} parks</span>
        ) : undefined
      }
    >
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search parks, rides, shows…"
          className="pl-9"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searchActive ? (
        searching ? (
          <LoadingPanel label="Searching…" />
        ) : (
          <>
            <p className="text-muted-foreground text-xs">
              {searchCount} result{searchCount === 1 ? '' : 's'} for “{debounced}”
            </p>
            <SearchResults results={searchData?.results ?? []} />
          </>
        )
      ) : list.error ? (
        <ErrorPanel message={list.error} />
      ) : !list.data ? (
        <LoadingPanel label="Loading parks…" />
      ) : (
        <>
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border/60 text-muted-foreground border-b text-left text-xs uppercase">
                      <SortHeader
                        label="Park"
                        column="name"
                        active={sort.key === 'name'}
                        dir={sort.dir}
                        onSort={toggleSort}
                      />
                      <SortHeader
                        label="Location"
                        column="location"
                        active={sort.key === 'location'}
                        dir={sort.dir}
                        onSort={toggleSort}
                      />
                      <SortHeader
                        label="Status"
                        column="status"
                        active={sort.key === 'status'}
                        dir={sort.dir}
                        onSort={toggleSort}
                      />
                      <SortHeader
                        label="Avg wait"
                        column="avgWait"
                        active={sort.key === 'avgWait'}
                        dir={sort.dir}
                        onSort={toggleSort}
                        align="right"
                      />
                      <SortHeader
                        label="Rides"
                        column="rides"
                        active={sort.key === 'rides'}
                        dir={sort.dir}
                        onSort={toggleSort}
                        align="right"
                      />
                      <th className="px-4 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((park) => {
                      const stats = park.analytics?.statistics;
                      return (
                        <tr
                          key={park.id}
                          className="border-border/30 hover:bg-card/60 border-b last:border-0"
                        >
                          <td className="px-4 py-2">
                            <Link href={park.url} className="hover:text-primary font-medium">
                              {park.name}
                            </Link>
                          </td>
                          <td className="text-muted-foreground px-4 py-2">
                            {[park.city, park.country].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <StatusPill status={park.status} />
                              {stats && <CrowdBadge level={stats.crowdLevel} />}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right font-mono tabular-nums">
                            {stats ? `${stats.avgWaitTime}'` : '—'}
                          </td>
                          <td className="text-muted-foreground px-4 py-2 text-right font-mono tabular-nums">
                            {stats
                              ? `${stats.operatingAttractions}/${stats.totalAttractions}`
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              disabled
                              title="Editing requires backend write endpoints (coming soon)"
                              className="text-muted-foreground/50 border-border/40 inline-flex cursor-not-allowed items-center gap-1 rounded-md border px-2 py-1 text-xs"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs tabular-nums">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border-border/60 hover:border-primary/40 flex h-8 items-center gap-1 rounded-lg border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border-border/60 hover:border-primary/40 flex h-8 items-center gap-1 rounded-lg border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </Section>
  );
}
