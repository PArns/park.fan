'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, type AbstractIntlMessages } from 'next-intl';
import type { Locale } from './config';
import { getLoadedMessageChunk, loadMessageChunk } from '@/lib/i18n/message-chunk-loader';
import { isNamespaceProvided, useProvidedNamespaces } from './route-messages-provider';

export interface LazyMessagesResult {
  /**
   * `false` only while a needed chunk is in flight. Keep the placeholder that was already on
   * screen until then, so the swap costs no layout shift.
   */
  ready: boolean;
  /**
   * The fetched namespaces, or `null` when the route already ships them. Wrap the consuming
   * subtree in `<RouteMessagesProvider>` when this is set.
   */
  messages: AbstractIntlMessages | null;
}

/**
 * Fetches message namespaces that the current route does not already ship, so a section such as
 * `FavoritesSection` keeps them out of every visitor's payload on `/blog`. Set `enabled` when the
 * consumer starts its own data fetch, so the chunk downloads in parallel.
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

  // Seeded synchronously so a second mount renders from the module cache without flashing the
  // skeleton again.
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
