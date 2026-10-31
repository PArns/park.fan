'use client';

import { useEffect, useState, type FocusEvent } from 'react';
import { searchPresence } from '@/lib/analytics/search-presence';
import { trackSiteEvent, type SearchSurface } from '@/lib/analytics/site-analytics';
import {
  SEARCH_SETTLE_MS,
  createSearchSession,
  type SearchEventName,
  type SearchEventProps,
  type SearchEventSender,
  type SearchSession,
} from '@/lib/analytics/search-session';

/**
 * `trackSiteEvent` narrowed to the search events: its conditional argument type cannot be resolved
 * for a generic event name.
 */
const trackSearchEvent = trackSiteEvent as (
  name: SearchEventName,
  props: SearchEventProps<SearchEventName>,
  entity?: string
) => void;

const send: SearchEventSender = (name, props, entity) => trackSearchEvent(name, props, entity);

/**
 * The {@link SearchSession} of one mounted search surface, the same object on every render. While
 * it is open and on the page, {@link searchPresence} counts a search as open, unless `presence` is
 * `false`: `/search` opens one with every load and never closes it, and is a page of results rather
 * than a field somebody is typing into.
 */
export function useSearchSession(
  surface: SearchSurface,
  { presence = true }: { presence?: boolean } = {}
): SearchSession {
  const [session] = useState(() => {
    const created: SearchSession = createSearchSession(
      surface,
      send,
      presence ? (open) => searchPresence.setOpen(created, open) : undefined
    );
    return created;
  });
  useEffect(() => {
    searchPresence.mount(session);
    return () => searchPresence.unmount(session);
  }, [session]);
  return session;
}

/**
 * Focus and blur handlers for a field that is a search surface of its own (the hero, the listing
 * fields, the guides panel): a focus opens, a blur to anywhere else closes. Switching to another
 * tab or window blurs the field too, but leaves it the page's focused element, so coming back is
 * not a second opening.
 */
export function searchFieldFocusProps(session: SearchSession) {
  return {
    onFocus: () => session.open(),
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (document.activeElement === event.currentTarget || !document.hasFocus()) return;
      session.close();
    },
  };
}

/**
 * `search_typed` and `search_no_results` for a field that searches on every keystroke (the
 * listings, the guides panel): sent once its query of three characters or more has held still for
 * {@link SEARCH_SETTLE_MS}, like the palette's debounced query. `found` is `null` while the post
 * list is still on its way.
 */
export function useSettledQueryEvents(
  session: SearchSession,
  query: string,
  found: boolean | null
): void {
  useEffect(() => {
    if (query.trim().length < 3 || found === null) return;
    const timer = setTimeout(() => {
      session.typed();
      if (!found) session.noResults();
    }, SEARCH_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [session, query, found]);
}
