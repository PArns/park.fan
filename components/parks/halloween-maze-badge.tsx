import { Ghost } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { AttractionKind } from '@/lib/api/types';

interface HalloweenMazeBadgeProps {
  /** The API's `attractionKind`. Anything other than `MAZE`, including null and absent, renders nothing. */
  attractionKind?: AttractionKind | null;
  className?: string;
}

/**
 * „Halloween-Maze": a seasonal walk-through, not a ride. Orange, because it belongs to one time of
 * the year, and next to {@link TransportSystemBadge} in the badge row. Whether it is open follows
 * the park's season like any other attraction.
 */
export function HalloweenMazeBadge({ attractionKind, className }: HalloweenMazeBadgeProps) {
  const t = useTranslations('parks.halloweenMaze');

  if (attractionKind !== 'MAZE') return null;

  return (
    <Badge
      title={t('hint')}
      className={cn(
        'border border-orange-500/30 bg-orange-500/15 font-semibold text-orange-700 backdrop-blur-md dark:text-orange-300',
        className
      )}
    >
      <Ghost className="h-3 w-3 text-inherit" />
      {t('label')}
    </Badge>
  );
}
