import { Sunrise, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { RopeDropStrength } from '@/lib/api/types';

interface RopeDropBadgeProps {
  strength?: RopeDropStrength | null;
  savings: number;
  className?: string;
}

/** "Worth riding at park opening" badge for headliner attraction cards. */
export function RopeDropBadge({ strength, savings, className }: RopeDropBadgeProps) {
  const t = useTranslations('attractions.ropeDrop');

  return (
    <span title={t('badgeHint', { savings })}>
      <Badge
        className={cn(
          'border font-bold tracking-wide text-white uppercase shadow-md',
          strength === 'high'
            ? 'border-emerald-500/25 bg-emerald-600/60'
            : 'border-teal-500/25 bg-teal-600/60',
          className
        )}
      >
        <Sunrise className="h-3 w-3 text-white" />
        {t('badge')}
      </Badge>
    </span>
  );
}

interface RopeDropEveningBadgeProps {
  openWait: number;
  /** Expected wait at the day's trough — shown in the hint when available. */
  bestSlotWait?: number | null;
  className?: string;
}

/**
 * Inverse recommendation badge: the line is long right at opening and the
 * day's trough sits much later — ride late instead (see isEveningBetter).
 */
export function RopeDropEveningBadge({
  openWait,
  bestSlotWait,
  className,
}: RopeDropEveningBadgeProps) {
  const t = useTranslations('attractions.ropeDrop');

  const hint =
    bestSlotWait != null
      ? t('eveningBadgeHintWait', { openWait, bestSlotWait })
      : t('eveningBadgeHint', { openWait });

  return (
    <span title={hint}>
      <Badge
        className={cn(
          'border border-indigo-500/25 bg-indigo-600/60 font-bold tracking-wide text-white uppercase shadow-md',
          className
        )}
      >
        <Moon className="h-3 w-3 text-white" />
        {t('eveningBadge')}
      </Badge>
    </span>
  );
}
