import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

const crowdLevelConfig: Record<string, { colorClass: string }> = {
  very_low: { colorClass: 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-900' },
  low: { colorClass: 'bg-emerald-500 text-white dark:bg-emerald-300 dark:text-slate-900' },
  moderate: { colorClass: 'bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-900' },
  high: { colorClass: 'bg-orange-600 text-white dark:bg-orange-400 dark:text-slate-900' },
  very_high: { colorClass: 'bg-rose-600 text-white dark:bg-rose-400 dark:text-slate-900' },
  extreme: { colorClass: 'bg-red-700 text-white dark:bg-red-400 dark:text-slate-900' },
  closed: { colorClass: 'bg-slate-300 text-slate-800 dark:bg-slate-400 dark:text-slate-900' },
};

interface CrowdLevelBadgeProps {
  level: CrowdLevel | null | undefined;
  showLabel?: boolean;
  className?: string;
}

export function CrowdLevelBadge({ level, showLabel = true, className }: CrowdLevelBadgeProps) {
  const t = useTranslations('parks.crowdLevels');

  if (!level) return null;

  const config = crowdLevelConfig[level] || { colorClass: 'bg-muted' };

  return (
    <Badge
      className={cn(
        config.colorClass,
        'border-0 font-bold tracking-wide uppercase hover:opacity-90',
        className
      )}
    >
      {showLabel ? t(level) : null}
    </Badge>
  );
}
