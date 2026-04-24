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
        'bg-status-operating/20 text-status-operating border border-status-operating/35 backdrop-blur-[10px]',
      icon: Clock,
    },
    DOWN: {
      color: 'bg-status-down/20 text-status-down border border-status-down/35 backdrop-blur-[10px]',
      icon: AlertTriangle,
    },
    CLOSED: {
      color:
        'bg-status-closed/20 text-status-closed border border-status-closed/35 backdrop-blur-[10px]',
      icon: XCircle,
    },
    REFURBISHMENT: {
      color:
        'bg-status-refurbishment/20 text-status-refurbishment border border-status-refurbishment/35 backdrop-blur-[10px]',
      icon: Wrench,
    },
    UNKNOWN: {
      color:
        'bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/35 backdrop-blur-[10px]',
      icon: Clock,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CLOSED;
  const Icon = config.icon;

  return (
    <Badge className={cn('font-bold tracking-wide uppercase', config.color, className)}>
      <Icon className="h-3 w-3 text-inherit" />
      {t(status)}
    </Badge>
  );
}
