import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

import { User, Users, AlertCircle, Ban } from 'lucide-react';

/* Green band: teal (very_low) → emerald (low) → green (moderate/Normal); then orange → rose → red. */
const crowdLevelConfig: Record<string, { colorClass: string; Icon: typeof User }> = {
  very_low: {
    colorClass: 'bg-teal-600 text-white dark:bg-teal-400/40 dark:text-teal-50',
    Icon: User,
  },
  low: {
    colorClass: 'bg-emerald-500 text-white dark:bg-emerald-500/32 dark:text-emerald-100',
    Icon: User,
  },
  moderate: {
    colorClass: 'bg-green-500 text-white dark:bg-green-500/30 dark:text-green-100',
    Icon: Users,
  },
  high: {
    colorClass: 'bg-orange-500 text-white dark:bg-orange-500/30 dark:text-orange-100',
    Icon: Users,
  },
  very_high: {
    colorClass: 'bg-rose-500 text-white dark:bg-rose-500/30 dark:text-rose-100',
    Icon: Users,
  },
  extreme: {
    colorClass: 'bg-red-600 text-white dark:bg-red-500/30 dark:text-red-100',
    Icon: AlertCircle,
  },
  closed: {
    colorClass: 'bg-slate-400 text-slate-900 dark:bg-slate-700 dark:text-slate-300',
    Icon: Ban,
  },
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
      {config.Icon && <config.Icon className="mr-1.5 h-3 w-3" />}
      {showLabel ? t(level) : null}
    </Badge>
  );
}
