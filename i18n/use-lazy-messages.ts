'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, type AbstractIntlMessages } from 'next-intl';
import type { Locale } from './config';
import { getLoadedMessageChunk, loadMessageChunk } from '@/lib/i18n/message-chunk-loader';
import { isNamespaceProvided, useProvidedNamespaces } from './route-messages-provider';

export interface LazyMessagesResult {
  /**
   * `false` only while a genuinely needed chunk is still in flight. Gate the
   * render that needs the messages on this — and keep showing whatever
   * placeholder was already on screen, so the swap costs no layout shift.
   */
  ready: boolean;
  /**
   * The fetched namespaces, or `null` when nothing had to be fetched because
   * the route already ships them. Wrap the consuming subtree in
   * `<RouteMessagesProvider>` when this is set.
   */
  messages: AbstractIntlMessages | null;
}

/**
 * Fetches message namespaces that the current route does not already ship.
 *
 * Where this matters: `FavoritesSection` needs `parks` + `attractions` for the
 * cards it renders, but only once the visitor actually has favorites. On the
 * homepage and the park pages those namespaces are in the payload anyway
 * (`ROUTE_MESSAGE_NAMESPACES`) and this hook resolves to `{ready: true,
 * messages: null}` without a request. On `/blog` and `/glossary/[term]` they are
 * not, and keeping them out of the payload saves every visitor 16.5 KB of JSON.
 *
 * `enabled` should become true at the same moment the consumer starts fetching
 * whatever data it needs, so the chunk downloads in parallel with that request
 * rather than after it.
 */
export function useLazyMessages(
  namespaces: readonly string[],
  enabled: boolean
): LazyMessagesResult {
  const locale = useLocale() as Locale;
  const provided = useProvidedNamespaces();

  const missing = useMemo(
    () => namespaces.filter((namespace) => !isNamespaceProvided(provided, namespace)),
    [namespaces, provided]
  );
  const needsFetch = enabled && missing.length > 0;

  // Seeded synchronously: once a locale's chunk is in the module cache a second
  // mount (navigating back to a blog page) renders the cards on the first pass
  // instead of flashing the skeleton again.
  const [chunk, setChunk] = useState<AbstractIntlMessages | null>(() =>
    needsFetch ? (getLoadedMessageChunk(locale) ?? null) : null
  );

  useEffect(() => {
    if (!needsFetch || chunk) return;

    let cancelled = false;
    void loadMessageChunk(locale).then((loaded) => {
      if (!cancelled && loaded) setChunk(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [needsFetch, chunk, locale]);

  if (!needsFetch) return { ready: true, messages: null };
  return { ready: chunk !== null, messages: chunk };
}
