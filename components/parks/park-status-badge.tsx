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
    OPERATING: 'bg-status-operating hover:opacity-90 text-white',
    DOWN: 'bg-status-down hover:opacity-90 text-white',
    CLOSED: 'bg-status-closed hover:opacity-90 text-white',
    REFURBISHMENT: 'bg-status-refurbishment hover:opacity-90 text-white',
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
