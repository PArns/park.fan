import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

import { User, Users, AlertCircle, Ban } from 'lucide-react';

/* Green band: teal (very_low) → emerald (low) → green (moderate/Normal); then orange → rose → red. */
const crowdLevelConfig: Record<string, { colorClass: string; Icon: typeof User }> = {
  very_low: {
    colorClass:
      'bg-crowd-very-low/20 text-crowd-very-low border border-crowd-very-low/35 backdrop-blur-[10px]',
    Icon: User,
  },
  low: {
    colorClass: 'bg-crowd-low/20 text-crowd-low border border-crowd-low/35 backdrop-blur-[10px]',
    Icon: User,
  },
  moderate: {
    colorClass:
      'bg-crowd-moderate/20 text-crowd-moderate border border-crowd-moderate/35 backdrop-blur-[10px]',
    Icon: Users,
  },
  high: {
    colorClass: 'bg-crowd-high/20 text-crowd-high border border-crowd-high/35 backdrop-blur-[10px]',
    Icon: Users,
  },
  very_high: {
    colorClass:
      'bg-crowd-very-high/20 text-crowd-very-high border border-crowd-very-high/35 backdrop-blur-[10px]',
    Icon: Users,
  },
  extreme: {
    colorClass:
      'bg-crowd-extreme/20 text-crowd-extreme border border-crowd-extreme/35 backdrop-blur-[10px]',
    Icon: AlertCircle,
  },
  closed: {
    colorClass:
      'bg-status-closed/20 text-status-closed border border-status-closed/35 backdrop-blur-[10px]',
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
    <Badge className={cn(config.colorClass, 'font-bold tracking-wide uppercase', className)}>
      {config.Icon && <config.Icon className="h-3 w-3 text-inherit" />}
      {showLabel ? t(level) : null}
    </Badge>
  );
}
