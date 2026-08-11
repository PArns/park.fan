'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { IntlProvider, useLocale, useMessages, type AbstractIntlMessages } from 'next-intl';
import { mergeMessages } from './client-messages';
import { LAYOUT_MESSAGE_NAMESPACES } from './route-namespaces.generated';

/**
 * Which namespaces are already in the provider below this point.
 *
 * A lazy boundary has to know whether the route it happens to be rendered on
 * already ships the namespaces it needs — `FavoritesSection` sits on the
 * homepage (where the park cards are eager anyway) and on `/blog` (where they
 * are not). Without this it would either fetch a chunk it does not need or, if
 * it guessed the other way, render raw message keys.
 *
 * The default is the layout set, which is a build-time constant: routes that
 * add nothing cost no context payload at all.
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
  /** The route's delta — NOT the full message set. */
  messages: AbstractIntlMessages;
  /** Namespace paths contained in `messages`, for {@link useProvidedNamespaces}. */
  namespaces: readonly string[];
  children: ReactNode;
}

/**
 * Layers extra namespaces onto the ones already in context, merging on the
 * CLIENT so a shared set is serialized into the payload exactly once.
 *
 * Nesting a provider is what makes that possible, but note the semantics: a
 * nested provider REPLACES messages, it does not merge them
 * (`messages === undefined ? prevContext?.messages : messages` in `use-intl`'s
 * `IntlProvider`). Handing it just the delta would knock out the header and
 * footer translations for everything below. Hence `useMessages()` +
 * {@link mergeMessages} here rather than a second `<NextIntlClientProvider>`.
 *
 * `IntlProvider` is used directly instead of `NextIntlClientProvider` because it
 * inherits `formats`, `now`, `timeZone` and — importantly — the formatter cache
 * from the parent context, so the extra level costs no re-created Intl
 * formatters. Only `locale` has to be restated; the provider requires it.
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
