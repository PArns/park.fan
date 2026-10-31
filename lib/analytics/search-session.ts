import {
  searchPosition,
  type SearchBrowseItem,
  type SearchResultKind,
  type SearchSurface,
  type SiteEventMap,
} from '@/lib/analytics/site-analytics';
import { isUuid } from '@/lib/utils';

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

/**
 * Where a session's events go: `trackSiteEvent` on the page, a recorder in the tests. `entity` is
 * the UUID of the park, ride, show or restaurant a click opened.
 */
export type SearchEventSender = <N extends SearchEventName>(
  name: N,
  props: SearchEventProps<N>,
  entity?: string
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
  /**
   * A result was opened; `index` is its 0-based place in its own group, `id` the result's own id,
   * which goes along as the entity when it is a UUID (a place's `city:slug` and a post's path are
   * not).
   */
  resultClicked(result: SearchResultKind, index: number, id?: string): void;
  /** A row of the list shown before anything is typed was opened; `id` as for a result. */
  browseClicked(item: SearchBrowseItem, index: number, id?: string): void;
  /** "All results" was pressed, on the way to `/search`. */
  viewAll(): void;
}

/** The id a click sends as its entity: a UUID, lower case, and nothing else. */
function entityOf(id: string | undefined): string | undefined {
  return id && isUuid(id) ? id.toLowerCase() : undefined;
}

/**
 * A {@link SearchSession} for `surface`, sending through `send`. Plain state rather than React
 * state: nothing renders from it, and the events must not wait for a commit. `onOpenChange` hears
 * each opening and each close of one, for whoever shows that a search is open.
 */
export function createSearchSession(
  surface: SearchSurface,
  send: SearchEventSender,
  onOpenChange?: (open: boolean) => void
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
      onOpenChange?.(true);
    },
    close() {
      if (!open) return;
      open = false;
      onOpenChange?.(false);
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
    resultClicked(result, index, id) {
      ensureOpen();
      send(
        'search_result_clicked',
        { surface: current, result, position: searchPosition(index + 1) },
        entityOf(id)
      );
    },
    browseClicked(item, index, id) {
      ensureOpen();
      send(
        'search_browse_clicked',
        { surface: current, item, position: searchPosition(index + 1) },
        entityOf(id)
      );
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
const RESULT_ID_ATTR = 'data-search-id';

/**
 * The attributes that mark a link as a search result for {@link trackResultClick}, for lists a
 * Server Component draws (`/search`) or that take no callback (`PostSearchResultList`). `path` is
 * the result's own locale-relative path, for a row that holds other links as well (a post's
 * category label): only a click on the link to it counts. `id` is the result's id, sent as the
 * click's entity when it is a UUID.
 */
export function searchResultData(
  result: SearchResultKind,
  index: number,
  path?: string,
  id?: string
) {
  return {
    [RESULT_KIND_ATTR]: result,
    [RESULT_INDEX_ATTR]: String(index),
    ...(path ? { [RESULT_PATH_ATTR]: path } : {}),
    ...(id ? { [RESULT_ID_ATTR]: id } : {}),
  };
}

/**
 * Sends `search_result_clicked` for a click inside a list marked with {@link searchResultData}:
 * one capture listener on the list instead of a handler per row. Only a click that opens the
 * result counts, one on its link: not one beside every link, not one on another link inside the
 * row, and not one on a button inside the link.
 */
export function trackResultClick(session: SearchSession, target: EventTarget | null): void {
  if (!(target instanceof Element)) return;
  const link = target.closest('a[href]');
  const row = link?.closest(`[${RESULT_KIND_ATTR}]`);
  if (!link || !row) return;
  // A button inside the link (a ride card's alert bell, its planner button) opens nothing.
  const button = target.closest('button');
  if (button && link.contains(button)) return;
  const path = row.getAttribute(RESULT_PATH_ATTR);
  // The anchor's pathname carries the locale prefix and percent-encodes what the path spells out.
  if (path && !decodeURI((link as HTMLAnchorElement).pathname).endsWith(path)) return;
  const index = Number(row.getAttribute(RESULT_INDEX_ATTR));
  session.resultClicked(
    row.getAttribute(RESULT_KIND_ATTR) as SearchResultKind,
    Number.isFinite(index) ? index : 0,
    row.getAttribute(RESULT_ID_ATTR) ?? undefined
  );
}
