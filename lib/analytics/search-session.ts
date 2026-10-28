import {
  searchPosition,
  type SearchBrowseItem,
  type SearchResultKind,
  type SearchSurface,
  type SiteEventMap,
} from '@/lib/analytics/site-analytics';

/**
 * How long a query has to hold still to count as settled: the palette's debounce, and the wait a
 * field without one gives its query before `search_typed` and `search_no_results`.
 */
export const SEARCH_SETTLE_MS = 300;

/** The search events, the six a session sends. */
export type SearchEventName =
  | 'search_opened'
  | 'search_typed'
  | 'search_no_results'
  | 'search_result_clicked'
  | 'search_browse_clicked'
  | 'search_view_all';

/** A search event's properties. */
export type SearchEventProps<N extends SearchEventName> = SiteEventMap[N];

/** Where a session's events go: `trackSiteEvent` on the page, a recorder in the tests. */
export type SearchEventSender = <N extends SearchEventName>(
  name: N,
  props: SearchEventProps<N>
) => void;

/**
 * One search surface's events, counted per opening, so the admin can divide them: an opening
 * types at most once and runs into "no results" at most once, and a click before any opening
 * opens one first. `clickRate` and `noResultRate` therefore stay between 0 and 1. What follows a
 * close belongs to the opening it closed: a click on a result blurs the field before the click
 * lands. See docs/features/site-search.md#what-is-counted for when each surface counts as opened.
 */
export interface SearchSession {
  /**
   * Starts an opening, unless one is running. The palette passes the way it was opened (header,
   * ⌘K, hero); a field has one surface and passes nothing.
   */
  open(surface?: SearchSurface): void;
  /**
   * Ends the opening: the palette closed, or focus left the field for something else. The next
   * `open` starts a new one; anything sent before it still counts for this one.
   */
  close(): void;
  /** A query long enough to search (three characters) has settled. Once per opening. */
  typed(): void;
  /** A settled query found nothing on this surface. Once per opening. */
  noResults(): void;
  /** A result was opened; `index` is its 0-based place in its own group. */
  resultClicked(result: SearchResultKind, index: number): void;
  /** A row of the list shown before anything is typed was opened. */
  browseClicked(item: SearchBrowseItem, index: number): void;
  /** "All results" was pressed, on the way to `/search`. */
  viewAll(): void;
}

/**
 * A {@link SearchSession} for `surface`, sending through `send`. Plain state rather than React
 * state: nothing renders from it, and the events must not wait for a commit.
 */
export function createSearchSession(
  surface: SearchSurface,
  send: SearchEventSender
): SearchSession {
  let current = surface;
  let open = false;
  let openedOnce = false;
  let typed = false;
  let noResults = false;

  const ensureOpen = () => {
    if (!openedOnce) session.open();
  };

  const session: SearchSession = {
    open(next = surface) {
      if (open) return;
      open = true;
      openedOnce = true;
      current = next;
      typed = false;
      noResults = false;
      send('search_opened', { surface: current });
    },
    close() {
      open = false;
    },
    typed() {
      ensureOpen();
      if (typed) return;
      typed = true;
      send('search_typed', { surface: current });
    },
    noResults() {
      ensureOpen();
      if (noResults) return;
      noResults = true;
      send('search_no_results', { surface: current });
    },
    resultClicked(result, index) {
      ensureOpen();
      send('search_result_clicked', {
        surface: current,
        result,
        position: searchPosition(index + 1),
      });
    },
    browseClicked(item, index) {
      ensureOpen();
      send('search_browse_clicked', {
        surface: current,
        item,
        position: searchPosition(index + 1),
      });
    },
    viewAll() {
      ensureOpen();
      send('search_view_all', { surface: current });
    },
  };
  return session;
}

const RESULT_KIND_ATTR = 'data-search-result';
const RESULT_INDEX_ATTR = 'data-search-index';
const RESULT_PATH_ATTR = 'data-search-path';

/**
 * The attributes that mark a link as a search result for {@link trackResultClick}, for lists a
 * Server Component draws (`/search`) or that take no callback (`PostSearchResultList`). `path` is
 * the result's own locale-relative path, for a row that holds other links as well (a post's
 * category label): only a click on the link to it counts.
 */
export function searchResultData(result: SearchResultKind, index: number, path?: string) {
  return {
    [RESULT_KIND_ATTR]: result,
    [RESULT_INDEX_ATTR]: String(index),
    ...(path ? { [RESULT_PATH_ATTR]: path } : {}),
  };
}

/**
 * Sends `search_result_clicked` for a click inside a list marked with {@link searchResultData}:
 * one capture listener on the list instead of a handler per row. Only a click that opens the
 * result counts, one on its link: not one beside every link, and not one on another link inside
 * the row.
 */
export function trackResultClick(session: SearchSession, target: EventTarget | null): void {
  if (!(target instanceof Element)) return;
  const link = target.closest('a[href]');
  const row = link?.closest(`[${RESULT_KIND_ATTR}]`);
  if (!link || !row) return;
  const path = row.getAttribute(RESULT_PATH_ATTR);
  // The anchor's pathname carries the locale prefix and percent-encodes what the path spells out.
  if (path && !decodeURI((link as HTMLAnchorElement).pathname).endsWith(path)) return;
  const index = Number(row.getAttribute(RESULT_INDEX_ATTR));
  session.resultClicked(
    row.getAttribute(RESULT_KIND_ATTR) as SearchResultKind,
    Number.isFinite(index) ? index : 0
  );
}
