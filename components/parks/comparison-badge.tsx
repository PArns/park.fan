import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface ComparisonBadgeProps {
  comparison: string | null;
  className?: string;
  showIcon?: boolean;
}

export function ComparisonBadge({ comparison, className, showIcon = true }: ComparisonBadgeProps) {
  const tCommon = useTranslations('common');

  if (!comparison) return null;

  // Map to shared crowd/status CSS tokens — same palette as CrowdLevelBadge/ParkStatusBadge
  const colorMap: Record<string, string> = {
    much_lower:
      'bg-crowd-very-low/65 text-white border border-crowd-very-low/80 dark:bg-crowd-very-low/25 dark:border-crowd-very-low/40',
    lower:
      'bg-crowd-low/65 text-white border border-crowd-low/80 dark:bg-crowd-low/25 dark:border-crowd-low/40',
    typical:
      'bg-crowd-moderate/65 text-white border border-crowd-moderate/80 dark:bg-crowd-moderate/25 dark:border-crowd-moderate/40',
    higher:
      'bg-crowd-high/65 text-white border border-crowd-high/80 dark:bg-crowd-high/25 dark:border-crowd-high/40',
    much_higher:
      'bg-crowd-extreme/65 text-white border border-crowd-extreme/80 dark:bg-crowd-extreme/25 dark:border-crowd-extreme/40',
    closed:
      'bg-status-closed/65 text-white border border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
  };

  const colorClass = colorMap[comparison] ?? '';

  return (
    <Badge
      className={cn('font-bold tracking-wide uppercase backdrop-blur-md', colorClass, className)}
    >
      {showIcon && <Activity className="h-3 w-3 text-inherit" />}
      {tCommon(comparison)}
    </Badge>
  );
}
