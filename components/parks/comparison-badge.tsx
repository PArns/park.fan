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
    colorClass = 'bg-orange-600 text-white dark:bg-orange-400 dark:text-slate-900';
  } else if (comparison === 'lower') {
    variant = 'secondary';
    colorClass = 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-900';
  } else if (comparison === 'typical') {
    variant = 'secondary';
    colorClass = 'bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-900';
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
