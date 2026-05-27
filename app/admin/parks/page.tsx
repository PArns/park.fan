'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
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
import type { ParksListResponse, SearchResponse, SearchResult } from '@/lib/api/admin-stats';

const PAGE_SIZE = 25;

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

function SearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return <EmptyPanel label="No matches." />;
  return (
    <div className="space-y-1">
      {results.map((r) => (
        <Link
          key={`${r.type}-${r.id}`}
          href={r.url}
          className="hover:border-primary/40 flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
        >
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
          <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        </Link>
      ))}
    </div>
  );
}

export default function ParksPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);

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

  const listEndpoint = searchActive ? null : `/api/parks-list?page=${page}&limit=${PAGE_SIZE}`;
  const list = useAdminFetch<ParksListResponse>(listEndpoint);

  const totalParks = list.data?.pagination.total;
  const totalPages = list.data?.pagination.totalPages ?? 1;

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
                      <th className="px-4 py-2 font-medium">Park</th>
                      <th className="px-4 py-2 font-medium">Location</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 text-right font-medium">Avg wait</th>
                      <th className="px-4 py-2 text-right font-medium">Rides</th>
                      <th className="px-4 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.data.map((park) => {
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
                            {stats ? `${stats.operatingAttractions}/${stats.totalAttractions}` : '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              disabled
                              title="Editing requires backend write endpoints (coming soon)"
                              className="text-muted-foreground/50 inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-border/40 px-2 py-1 text-xs"
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
                disabled={!list.data.pagination.hasPrevious || list.loading}
                className="border-border/60 hover:border-primary/40 flex h-8 items-center gap-1 rounded-lg border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!list.data.pagination.hasNext || list.loading}
                className="border-border/60 hover:border-primary/40 flex h-8 items-center gap-1 rounded-lg border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                {list.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </Section>
  );
}
