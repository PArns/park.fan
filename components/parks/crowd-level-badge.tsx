import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

const crowdLevelConfig: Record<string, { colorClass: string }> = {
  very_low: { colorClass: 'bg-emerald-500 text-white dark:bg-emerald-600' },
  low: { colorClass: 'bg-emerald-400 text-white dark:bg-emerald-500' },
  moderate: { colorClass: 'bg-blue-500 text-white dark:bg-blue-600' },
  high: { colorClass: 'bg-orange-500 text-white dark:bg-orange-600' },
  very_high: { colorClass: 'bg-rose-500 text-white dark:bg-rose-600' },
  extreme: { colorClass: 'bg-red-700 text-white dark:bg-red-800' },
  closed: { colorClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
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
