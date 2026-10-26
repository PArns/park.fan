import { QueryClient, isServer, type QueryClientConfig } from '@tanstack/react-query';

/**
 * A `QueryClient` whose queries keep `gcTime: Infinity` on the server, whatever their hook asks
 * for. A finite one arms a timer per query during SSR, and the timer holds the request's async
 * context, and through it the whole render, until it fires: 3.5 MB per post render, for up to a
 * day. Without timers the per-request client is collected with the request. See
 * docs/rules/a-server-render-arms-no-timer.md.
 */
export function createQueryClient(config: QueryClientConfig): QueryClient {
  const client = new QueryClient(config);
  if (isServer) {
    const defaultQueryOptions = client.defaultQueryOptions.bind(client);
    client.defaultQueryOptions = (options) => ({
      ...defaultQueryOptions(options),
      gcTime: Infinity,
    });
  }
  return client;
}
