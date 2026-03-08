import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

import { User, Users, AlertCircle, Ban } from 'lucide-react';

/* Green band: teal (very_low) → emerald (low) → green (moderate/Normal); then orange → rose → red. */
const crowdLevelConfig: Record<string, { colorClass: string; Icon: typeof User }> = {
  very_low: {
    colorClass:
      'bg-crowd-very-low/65 text-white border border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
    Icon: User,
  },
  low: {
    colorClass:
      'bg-crowd-low/65 text-white border border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
    Icon: User,
  },
  moderate: {
    colorClass:
      'bg-crowd-moderate/65 text-white border border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
    Icon: Users,
  },
  high: {
    colorClass:
      'bg-crowd-high/65 text-white border border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
    Icon: Users,
  },
  very_high: {
    colorClass:
      'bg-crowd-very-high/65 text-white border border-crowd-very-high/80 dark:bg-crowd-very-high/25 dark:border-crowd-very-high/40',
    Icon: Users,
  },
  extreme: {
    colorClass:
      'bg-crowd-extreme/65 text-white border border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
    Icon: AlertCircle,
  },
  closed: {
    colorClass:
      'bg-status-closed/65 text-white border border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
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
        'font-bold tracking-wide uppercase backdrop-blur-md',
        className
      )}
    >
      {config.Icon && <config.Icon className="h-3 w-3 text-inherit" />}
      {showLabel ? t(level) : null}
    </Badge>
  );
}
