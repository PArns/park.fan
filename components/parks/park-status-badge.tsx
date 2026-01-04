import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ParkStatus } from '@/lib/api/types';

interface ParkStatusBadgeProps {
  status: ParkStatus;
  className?: string;
}

export function ParkStatusBadge({ status, className }: ParkStatusBadgeProps) {
  const t = useTranslations('parks.status');
  const statusConfig = {
    OPERATING:
      'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-400 dark:text-slate-900',
    DOWN: 'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-400 dark:text-slate-900',
    CLOSED: 'bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-400 dark:text-slate-900',
    REFURBISHMENT:
      'bg-slate-500 hover:bg-slate-600 text-white dark:bg-slate-400 dark:text-slate-900',
  };

  const statusColor = statusConfig[status as keyof typeof statusConfig] || 'bg-slate-500';

  return (
    <Badge
      variant="default"
      className={cn('border-0 font-bold tracking-wide uppercase', statusColor, className)}
    >
      {t(status)}
    </Badge>
  );
}
