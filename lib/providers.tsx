'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GeolocationProvider } from '@/lib/contexts/geolocation-context';
import { TemperatureUnitProvider } from '@/lib/contexts/temperature-unit-context';
import { createQueryClient } from '@/lib/query-client';
import { useState, type ReactNode } from 'react';
import { AccountSyncGate } from '@/components/account/account-sync-gate';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers: React Query, the temperature unit and geolocation, and the gate that
 * starts a signed-in visitor's account sync. `ThemeProvider`
 * (next-themes) is mounted in the locale layout instead, to avoid React 19 script injection
 * warnings.
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() =>
    createQueryClient({
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
      <AccountSyncGate />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
