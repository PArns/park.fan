import type { ReactNode } from 'react';
import { getMessages } from 'next-intl/server';
import { pickMessages } from './client-messages';
import { ROUTE_MESSAGE_NAMESPACES, type RouteMessageKey } from './route-namespaces.generated';
import { RouteMessagesProvider } from './route-messages-provider';

interface RouteMessagesProps {
  /**
   * The route this subtree belongs to, written as the App Router segment (`'/blog/[slug]'`).
   * Typed against the generated map, so a renamed segment is a type error rather than an empty
   * message set.
   */
  route: RouteMessageKey;
  children: ReactNode;
}

/**
 * Adds the namespaces a route's client components need on top of the layout's chrome set.
 * `pnpm check:client-messages` fails when a route that needs a delta does not render it, and when
 * one that needs nothing still does.
 */
export async function RouteMessages({ route, children }: RouteMessagesProps) {
  const namespaces = ROUTE_MESSAGE_NAMESPACES[route];

  if (!namespaces || namespaces.length === 0) return <>{children}</>;

  const messages = pickMessages(await getMessages(), namespaces);

  return (
    <RouteMessagesProvider messages={messages} namespaces={namespaces}>
      {children}
    </RouteMessagesProvider>
  );
}
