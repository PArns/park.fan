'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { MostRead } from '@/lib/blog/most-read';
import { useMounted } from '@/lib/hooks/use-mounted';

/**
 * The most-read lists of the reader's locale from `/api/nav/most-read/[locale]`, once `enabled`.
 * One query key for every surface (header menu, homepage, post foot, badges), so a tab asks once.
 *
 * `data` and `failed` stay unset until hydration is over: the server drew every surface without
 * the ranking, and a late hydration may find it already in the shared cache.
 */
export function useMostRead(enabled: boolean): { data?: MostRead; failed: boolean } {
  const locale = useLocale();
  const query = useQuery({
    queryKey: ['most-read', locale],
    queryFn: async () => {
      const response = await fetch(`/api/nav/most-read/${locale}`);
      if (!response.ok) throw new Error(`most read ${response.status}`);
      return (await response.json()) as MostRead;
    },
    enabled,
    staleTime: 60 * 60_000,
    // An extra, so one retry: three would keep a placeholder pulsing for seven seconds.
    retry: 1,
  });
  const mounted = useMounted();
  return { data: mounted ? query.data : undefined, failed: mounted && query.isError };
}
