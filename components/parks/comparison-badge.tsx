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
    much_lower: 'badge-crowd-very-low',
    lower: 'badge-crowd-low',
    typical: 'badge-crowd-moderate',
    higher: 'badge-crowd-high',
    much_higher: 'badge-crowd-extreme',
    closed: 'badge-status-closed',
  };

  const colorClass = colorMap[comparison] ?? '';

  return (
    <Badge className={cn('backdrop-blur-md', colorClass, className)}>
      {showIcon && <Activity className="h-3 w-3 text-inherit" />}
      {tCommon(comparison)}
    </Badge>
  );
}
