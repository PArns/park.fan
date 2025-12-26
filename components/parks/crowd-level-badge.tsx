import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ParkCrowdLevel, CrowdLevel } from '@/lib/api/types';

const crowdLevelConfig: Record<string, { colorClass: string }> = {
  very_low: { colorClass: 'bg-emerald-500 text-white' },
  low: { colorClass: 'bg-emerald-400 text-white' },
  normal: { colorClass: 'bg-blue-500 text-white' },
  moderate: { colorClass: 'bg-blue-500 text-white' },
  higher: { colorClass: 'bg-orange-400 text-white' },
  high: { colorClass: 'bg-orange-500 text-white' },
  very_high: { colorClass: 'bg-rose-500 text-white' },
  extreme: { colorClass: 'bg-rose-700 text-white' },
  closed: { colorClass: 'bg-slate-200 text-slate-600' },
};

interface CrowdLevelBadgeProps {
  level: ParkCrowdLevel | CrowdLevel | null | undefined;
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
