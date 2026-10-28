'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData } from '@tanstack/react-query';
import {
  IMPORT_POLL_MS,
  SEARCH_CONSOLE_PAGE_PARAM,
  SEARCH_CONSOLE_QUERY_PARAM,
  SEARCH_CONSOLE_STATUS_PATH,
  importFinished,
  parseSearchConsolePage,
  parseSearchConsoleQuery,
  searchConsolePath,
  type ImportMark,
  type SearchConsoleReport,
} from '@/lib/admin/search-console';
import type { SearchConsoleStatus } from '@/lib/api/admin-search-console';
import { useAdminQuery } from '../../_lib/api';
import { useAddressWriter, type TrafficFilters } from './use-traffic';

/** The cache key of the status read, so an import can refresh it and everything under the section. */
export const searchConsoleKey = ['admin', 'search-console'] as const;

/** An import the page asked for and is waiting on: what the status said then, and until when to ask. */
export interface ImportWait {
  mark: ImportMark;
  until: number;
}

/**
 * Whether the import is set up and what it has stored. Read once and on a refresh; after an import
 * was requested (`wait`) it is asked again every few seconds until the status changes or the wait
 * runs out.
 */
export function useSearchConsoleStatus(wait: ImportWait | null) {
  return useAdminQuery<SearchConsoleStatus>(
    [...searchConsoleKey, 'status'],
    SEARCH_CONSOLE_STATUS_PATH,
    {
      staleTime: 30_000,
      refetchInterval: (query) =>
        wait !== null &&
        Date.now() < wait.until &&
        !(query.state.data && importFinished(wait.mark, query.state.data))
          ? IMPORT_POLL_MS
          : false,
    }
  );
}

/**
 * One Search Console answer for the window and language of the page. The previous answer stays on
 * screen while a switch loads, as with the analytics reads. `version` is the status's last import:
 * a new import is a new key, so the numbers refresh when it lands.
 */
export function useSearchConsoleData<T>(
  report: SearchConsoleReport,
  filters: Pick<TrafficFilters, 'range' | 'locale'> & { interval?: TrafficFilters['interval'] },
  extra: Record<string, string | number> | undefined,
  version: string | null
) {
  const path = searchConsolePath(report, filters, extra);
  return useAdminQuery<T>([...searchConsoleKey, 'raw', path, version], path, {
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** The query and the page the section is narrowed to, as the address holds them. */
export interface SearchConsoleDrill {
  /** The query the pages are listed for. */
  query: string | null;
  /** The page the queries are listed for. */
  page: string | null;
  /** Narrows to a query, or takes it off when it is the one already chosen. */
  toggleQuery: (query: string) => void;
  /** Narrows to a page, or takes it off when it is the one already chosen. */
  togglePage: (path: string) => void;
  clearQuery: () => void;
  clearPage: () => void;
}

/**
 * The drill-down of the section, `?gscQuery=` and `?gscPage=`: a query narrows the page list to the
 * pages that Google shows for it, a page narrows the query list to the queries that lead to it.
 * Written with `replace`, so the view is a link. Needs a `Suspense` boundary above it.
 */
export function useSearchConsoleDrill(): SearchConsoleDrill {
  const params = useSearchParams();
  const write = useAddressWriter();
  const query = parseSearchConsoleQuery(params.get(SEARCH_CONSOLE_QUERY_PARAM));
  const page = parseSearchConsolePage(params.get(SEARCH_CONSOLE_PAGE_PARAM));

  const set = useCallback(
    (key: string, value: string | null) =>
      write((next) => {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }),
    [write]
  );

  return {
    query,
    page,
    toggleQuery: useCallback(
      (value) => set(SEARCH_CONSOLE_QUERY_PARAM, value === query ? null : value),
      [set, query]
    ),
    togglePage: useCallback(
      (value) => set(SEARCH_CONSOLE_PAGE_PARAM, value === page ? null : value),
      [set, page]
    ),
    clearQuery: useCallback(() => set(SEARCH_CONSOLE_QUERY_PARAM, null), [set]),
    clearPage: useCallback(() => set(SEARCH_CONSOLE_PAGE_PARAM, null), [set]),
  };
}
