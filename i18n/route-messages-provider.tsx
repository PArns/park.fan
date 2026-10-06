'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { IntlProvider, useLocale, useMessages, type AbstractIntlMessages } from 'next-intl';
import { mergeMessages } from './client-messages';
import { LAYOUT_MESSAGE_NAMESPACES } from './route-namespaces.generated';

/**
 * Which namespaces are already in the provider below this point, so a lazy boundary such as
 * `FavoritesSection` fetches a chunk only on routes that do not ship it. The default is the
 * layout set, so a route that adds nothing costs no context payload.
 */
const ProvidedNamespacesContext = createContext<readonly string[]>(LAYOUT_MESSAGE_NAMESPACES);

/** Namespaces reachable from the nearest provider. */
export function useProvidedNamespaces(): readonly string[] {
  return useContext(ProvidedNamespacesContext);
}

/** True when `namespace` is covered by an entry in `provided` (or one of its ancestors). */
export function isNamespaceProvided(provided: readonly string[], namespace: string): boolean {
  return provided.some((entry) => namespace === entry || namespace.startsWith(entry + '.'));
}

interface RouteMessagesProviderProps {
  /** The route's delta, not the full message set. */
  messages: AbstractIntlMessages;
  /** Namespace paths contained in `messages`, for {@link useProvidedNamespaces}. */
  namespaces: readonly string[];
  children: ReactNode;
}

/**
 * Layers a route's namespaces onto the ones already in context, merging on the client so a shared
 * set is serialized once. A nested provider replaces messages instead of merging them, so the
 * delta is merged with `useMessages()` first. `IntlProvider` rather than `NextIntlClientProvider`
 * because it inherits the parent's formats, time zone and formatter cache.
 */
export function RouteMessagesProvider({
  messages,
  namespaces,
  children,
}: RouteMessagesProviderProps) {
  const base = useMessages();
  const parentNamespaces = useProvidedNamespaces();
  const locale = useLocale();

  const merged = useMemo(() => mergeMessages(base, messages), [base, messages]);
  const provided = useMemo(
    () => [...parentNamespaces, ...namespaces],
    [parentNamespaces, namespaces]
  );

  return (
    <ProvidedNamespacesContext value={provided}>
      <IntlProvider locale={locale} messages={merged}>
        {children}
      </IntlProvider>
    </ProvidedNamespacesContext>
  );
}
