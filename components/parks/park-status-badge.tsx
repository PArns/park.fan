import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import type { ParkStatus } from '@/lib/api/types';

interface ParkStatusBadgeProps {
  status: ParkStatus;
  className?: string;
}

export function ParkStatusBadge({ status, className }: ParkStatusBadgeProps) {
  const t = useTranslations('parks.status');

  const statusConfig = {
    OPERATING: {
      color:
        'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-400 text-white dark:text-slate-900',
      icon: Clock,
    },
    DOWN: {
      color: 'bg-status-down hover:opacity-90 text-white',
      icon: AlertTriangle,
    },
    CLOSED: {
      color: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-400 text-white dark:text-slate-900',
      icon: XCircle,
    },
    REFURBISHMENT: {
      color: 'bg-status-refurbishment hover:opacity-90 text-white',
      icon: Wrench,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CLOSED;
  const Icon = config.icon;

  return (
    <Badge
      variant="default"
      className={cn('border-0 font-medium whitespace-nowrap', config.color, className)}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {t(status)}
    </Badge>
  );
}
