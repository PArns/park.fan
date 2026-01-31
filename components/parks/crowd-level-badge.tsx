import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

import { User, Users, AlertCircle, Ban } from 'lucide-react';

const crowdLevelConfig: Record<string, { colorClass: string; Icon: typeof User }> = {
  very_low: {
    colorClass: 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-200',
    Icon: User,
  },
  low: {
    colorClass: 'bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-200',
    Icon: User,
  },
  moderate: {
    colorClass: 'bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-200',
    Icon: Users,
  },
  high: {
    colorClass: 'bg-orange-600 text-white dark:bg-orange-500/20 dark:text-orange-200',
    Icon: Users,
  },
  very_high: {
    colorClass: 'bg-rose-600 text-white dark:bg-rose-500/20 dark:text-rose-200',
    Icon: Users,
  },
  extreme: {
    colorClass: 'bg-red-700 text-white dark:bg-red-500/20 dark:text-red-200',
    Icon: AlertCircle,
  },
  closed: {
    colorClass: 'bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
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
