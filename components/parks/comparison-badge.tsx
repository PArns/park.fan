import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

interface ComparisonBadgeProps {
  comparison: string | null;
  className?: string;
  showIcon?: boolean;
}

export function ComparisonBadge({ comparison, className, showIcon = true }: ComparisonBadgeProps) {
  const tCommon = useTranslations('common');

  if (!comparison) return null;

  // Determine variant based on comparison value
  // "higher" -> usually bad (more crowds/wait)
  // "lower" -> usually good (less crowds/wait)
  // "typical" -> neutral
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let colorClass = '';

  if (comparison === 'higher') {
    variant = 'secondary';
    colorClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
  } else if (comparison === 'lower') {
    variant = 'secondary';
    colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  } else if (comparison === 'typical') {
    variant = 'secondary';
    colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  }

  return (
    <Badge
      variant={variant}
      className={`h-5 gap-1 px-1 text-[10px] font-bold tracking-wide uppercase ${colorClass} ${className}`}
    >
      {showIcon && <Activity className="h-3 w-3" />}
      {tCommon(comparison)}
    </Badge>
  );
}
