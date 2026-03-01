import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

import { User, Users, AlertCircle, Ban } from 'lucide-react';

/* Green band: teal (very_low) → emerald (low) → green (moderate/Normal); then orange → rose → red. */
const crowdLevelConfig: Record<string, { colorClass: string; Icon: typeof User }> = {
  very_low: {
    colorClass: 'bg-crowd-very-low/15 text-crowd-very-low',
    Icon: User,
  },
  low: {
    colorClass: 'bg-crowd-low/15 text-crowd-low',
    Icon: User,
  },
  moderate: {
    colorClass: 'bg-crowd-moderate/15 text-crowd-moderate',
    Icon: Users,
  },
  high: {
    colorClass: 'bg-crowd-high/15 text-crowd-high',
    Icon: Users,
  },
  very_high: {
    colorClass: 'bg-crowd-very-high/15 text-crowd-very-high',
    Icon: Users,
  },
  extreme: {
    colorClass: 'bg-crowd-extreme/15 text-crowd-extreme',
    Icon: AlertCircle,
  },
  closed: {
    colorClass: 'bg-status-closed/15 text-status-closed',
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
