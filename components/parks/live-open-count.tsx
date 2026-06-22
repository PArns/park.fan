'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';
import { cn } from '@/lib/utils';

/**
 * Inline live "open parks" number for a continent (or a country within it). Renders a skeleton
 * until the shared {@link useGeoLiveStats} batch call lands, so the surrounding text can be
 * prerendered/cached without baking a stale count into the ISR shell.
 */
export function LiveOpenCount({
  continent,
  country,
  className,
}: {
  continent: string;
  country?: string;
  className?: string;
}) {
  const { data } = useGeoLiveStats();
  const count = findOpenParkCount(data, continent, country);
  if (count === undefined) {
    // <span>, not the default <div>: this renders inline inside a <p> (the geo PageHeader subtitle),
    // where a <div> is invalid HTML and triggers a hydration mismatch.
    return (
      <Skeleton as="span" className={cn('inline-block h-[1em] w-6 align-middle', className)} />
    );
  }
  return <>{count}</>;
}
