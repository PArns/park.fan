import type { ReactNode } from 'react';
import { getMessages } from 'next-intl/server';
import { pickRouteMessages } from './client-messages';
import { ROUTE_MESSAGE_NAMESPACES, type RouteMessageKey } from './route-namespaces.generated';
import { RouteMessagesProvider } from './route-messages-provider';

interface RouteMessagesProps {
  /**
   * The route this subtree belongs to, written as the App Router segment (`'/blog/[slug]'`).
   * Typed against the generated map, so a renamed segment is a type error rather than an empty
   * message set.
   */
  route: RouteMessageKey;
  /**
   * The trip region the page is about, whose own copy (`tripRegions.<slug>`) its Client
   * Components read as `tripRegion…`; required where the route's namespaces name the alias.
   */
  region?: string;
  children: ReactNode;
}

/**
 * Adds the namespaces a route's client components need on top of the layout's chrome set.
 * `pnpm check:client-messages` fails when a route that needs a delta does not render it, and when
 * one that needs nothing still does.
 */
export async function RouteMessages({ route, region, children }: RouteMessagesProps) {
  const namespaces = ROUTE_MESSAGE_NAMESPACES[route];

  if (!namespaces || namespaces.length === 0) return <>{children}</>;

  const messages = pickRouteMessages(await getMessages(), namespaces, region);

  return (
    <RouteMessagesProvider messages={messages} namespaces={namespaces}>
      {children}
    </RouteMessagesProvider>
  );
}
