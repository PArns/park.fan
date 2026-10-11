import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CROWD_SOLID_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { cn } from '@/lib/utils';

/**
 * The colour a ride's status is written in where it is text rather than a badge, on the second
 * line of an in-park row. Only read when the ride posts no wait; closed and unknown keep the
 * muted line's colour.
 */
export const RIDE_STATUS_TEXT: Partial<Record<string, string>> = {
  OPERATING: 'text-status-operating',
  DOWN: 'text-status-down',
  REFURBISHMENT: 'text-status-refurbishment',
};

/**
 * A posted wait as an opaque pill in the crowd colours, the one the in-park compass and the
 * in-park ride lists share. Solid rather than `badge-crowd-*`, whose 60 % fill under white text
 * fell below 4.5 : 1 over a photo or glass (docs/features/park-compass.md, „The dial").
 */
export function LiveWaitPill({ minutes, className }: { minutes: number; className?: string }) {
  const tCommon = useTranslations('common');
  return (
    <Badge
      className={cn(
        CROWD_SOLID_CLASS[waitTimeCrowdTier(minutes)],
        'border-transparent px-2.5 py-1 font-bold tabular-nums',
        className
      )}
    >
      {minutes} {tCommon('min')}
    </Badge>
  );
}
