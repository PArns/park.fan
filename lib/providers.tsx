'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GeolocationProvider } from '@/lib/contexts/geolocation-context';
import { useState, type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper.
 * Includes theme, geolocation, and data fetching (React Query).
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
            staleTime: 60 * 1000, // 1 minute default
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
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <GeolocationProvider>{children}</GeolocationProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
