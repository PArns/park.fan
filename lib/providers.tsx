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
 * Client-side providers: React Query, the temperature unit and geolocation. `ThemeProvider`
 * (next-themes) is mounted in the locale layout instead, to avoid React 19 script injection
 * warnings.
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // The API's own cache TTL.
            staleTime: 5 * 60 * 1000,
            gcTime: 5 * 60 * 1000,
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
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
