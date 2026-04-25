import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

import { User, Users, AlertCircle, Ban } from 'lucide-react';

/* Green band: teal (very_low) → emerald (low) → green (moderate/Normal); then orange → rose → red. */
const crowdLevelConfig: Record<string, { colorClass: string; Icon: typeof User }> = {
  very_low: { colorClass: 'badge-crowd-very-low', Icon: User },
  low: { colorClass: 'badge-crowd-low', Icon: User },
  moderate: { colorClass: 'badge-crowd-moderate', Icon: Users },
  high: { colorClass: 'badge-crowd-high', Icon: Users },
  very_high: { colorClass: 'badge-crowd-very-high', Icon: Users },
  extreme: { colorClass: 'badge-crowd-extreme', Icon: AlertCircle },
  closed: { colorClass: 'badge-status-closed', Icon: Ban },
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
    <Badge className={cn(config.colorClass, className)}>
      {config.Icon && <config.Icon className="h-3 w-3 text-white" />}
      {showLabel ? t(level) : null}
    </Badge>
  );
}
