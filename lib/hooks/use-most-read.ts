'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { MostRead } from '@/lib/blog/most-read';

/**
 * The most-read lists of the reader's locale from `/api/nav/most-read/[locale]`, once `enabled`.
 * One query key for every surface (header menu, homepage, post foot, badges), so a tab asks once.
 */
export function useMostRead(enabled: boolean) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['most-read', locale],
    queryFn: async () => {
      const response = await fetch(`/api/nav/most-read/${locale}`);
      if (!response.ok) throw new Error(`most read ${response.status}`);
      return (await response.json()) as MostRead;
    },
    enabled,
    staleTime: 60 * 60_000,
  });
}
