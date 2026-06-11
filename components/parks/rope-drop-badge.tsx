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
          'font-semibold backdrop-blur-md',
          strength === 'high'
            ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
            : 'border border-teal-500/30 bg-teal-500/15 text-teal-600 dark:text-teal-300',
          className
        )}
      >
        <Sunrise className="h-3 w-3 text-inherit" />
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
          'border border-indigo-500/30 bg-indigo-500/15 font-semibold text-indigo-500 backdrop-blur-md dark:text-indigo-300',
          className
        )}
      >
        <Moon className="h-3 w-3 text-inherit" />
        {t('eveningBadge')}
      </Badge>
    </span>
  );
}
