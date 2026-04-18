import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import type { ParkStatus, AttractionStatus } from '@/lib/api/types';

interface ParkStatusBadgeProps {
  status: ParkStatus | AttractionStatus;
  className?: string;
}

export function ParkStatusBadge({ status, className }: ParkStatusBadgeProps) {
  const t = useTranslations('parks.status');

  const statusConfig = {
    OPERATING: {
      color:
        'bg-status-operating/65 text-white border border-status-operating/80 dark:bg-status-operating/25 dark:border-status-operating/40',
      icon: Clock,
    },
    DOWN: {
      color:
        'bg-status-down/65 text-white border border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40',
      icon: AlertTriangle,
    },
    CLOSED: {
      color:
        'bg-status-closed/65 text-white border border-status-closed/80 dark:bg-status-closed/25 dark:border-status-closed/40',
      icon: XCircle,
    },
    REFURBISHMENT: {
      color:
        'bg-status-refurbishment/65 text-white border border-status-refurbishment/80 dark:bg-status-refurbishment/25 dark:border-status-refurbishment/40',
      icon: Wrench,
    },
    UNKNOWN: {
      color:
        'bg-gray-500/65 text-white border border-gray-500/80 dark:bg-gray-500/25 dark:border-gray-500/40',
      icon: Clock,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CLOSED;
  const Icon = config.icon;

  return (
    <Badge
      className={cn('font-bold tracking-wide uppercase backdrop-blur-md', config.color, className)}
    >
      <Icon className="h-3 w-3 text-inherit" />
      {t(status)}
    </Badge>
  );
}
