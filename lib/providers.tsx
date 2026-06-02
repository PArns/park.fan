'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GeolocationProvider } from '@/lib/contexts/geolocation-context';
import { TemperatureUnitProvider } from '@/lib/contexts/temperature-unit-context';
import { useState, type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper.
 * Includes geolocation and data fetching (React Query).
 * Note: ThemeProvider (next-themes) is handled in the root layout to avoid React 19 script injection warnings.
 *
 * The global TemperatureUnitProvider resolves the unit client-side (cookie or
 * browser-locale detection on mount). Park detail pages nest their own
 * cookie-seeded provider (see the park-scoped layout) to avoid a unit flash on
 * server-rendered weather — without forcing the whole app into dynamic rendering.
 */
export function Providers({ children }: ProvidersProps) {
  // Create QueryClient with optimized defaults
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Keep data fresh for reasonable time
            staleTime: 5 * 60 * 1000, // 5 minutes — aligns with API cache TTL
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TemperatureUnitProvider>
        <GeolocationProvider>{children}</GeolocationProvider>
      </TemperatureUnitProvider>
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
