'use client';

import { useEffect, type ReactNode } from 'react';
import { trackResultClick } from '@/lib/analytics/search-session';
import { useSearchSession } from '@/lib/hooks/use-search-session';

/**
 * `/search` as a search surface. Every load is an opening, since the form submits by loading the
 * page again; a query of three characters or more counts as typed, and as no results when neither
 * the parks and rides nor the posts found anything. A click on a result marked with
 * `searchResultData` inside `children` counts with its kind and place.
 */
export function SearchPageTracking({
  query,
  found,
  children,
}: {
  query: string;
  /** Whether anything was found; `true` when the search failed, which is no empty result. */
  found: boolean;
  children: ReactNode;
}) {
  const session = useSearchSession('search_page');

  useEffect(() => {
    session.open();
    if (query.trim().length < 3) return;
    session.typed();
    if (!found) session.noResults();
  }, [session, query, found]);

  return <div onClickCapture={(event) => trackResultClick(session, event.target)}>{children}</div>;
}
