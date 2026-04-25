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
    OPERATING: { color: 'badge-status-operating', icon: Clock },
    DOWN: { color: 'badge-status-down', icon: AlertTriangle },
    CLOSED: { color: 'badge-status-closed', icon: XCircle },
    REFURBISHMENT: { color: 'badge-status-refurbishment', icon: Wrench },
    UNKNOWN: { color: 'badge-status-unknown', icon: Clock },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CLOSED;
  const Icon = config.icon;

  return (
    <Badge className={cn(config.color, className)}>
      <Icon className="h-3 w-3 text-white" />
      {t(status)}
    </Badge>
  );
}
