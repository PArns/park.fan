import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, XCircle, Wrench, Ban } from 'lucide-react';
import type { ParkStatus, AttractionStatus } from '@/lib/api/types';

/**
 * A ride that closed for good. Not a status the API sends in `status`: it comes from
 * `retiredKind === 'closed'`, and the caller that knows that passes it here instead of the live
 * reading, which for such a ride is a plain CLOSED — the one a ride comes back from.
 */
export type ClosedPermanentlyStatus = 'RETIRED';

interface ParkStatusBadgeProps {
  status: ParkStatus | AttractionStatus | ClosedPermanentlyStatus;
  className?: string;
}

/**
 * Status badge for a park or a ride: operating, down, closed, refurbishment, unknown, or `RETIRED`
 * for a ride that closed for good. An unrecognised status falls back to the closed style.
 */
export function ParkStatusBadge({ status, className }: ParkStatusBadgeProps) {
  const t = useTranslations('parks.status');

  const statusConfig = {
    OPERATING: { color: 'badge-status-operating', icon: Clock },
    DOWN: { color: 'badge-status-down', icon: AlertTriangle },
    CLOSED: { color: 'badge-status-closed', icon: XCircle },
    REFURBISHMENT: { color: 'badge-status-refurbishment', icon: Wrench },
    UNKNOWN: { color: 'badge-status-unknown', icon: Clock },
    // The closed colour, because it is closed; its own icon, because it is not the CLOSED of
    // tonight — the two stand side by side in a news post about the park.
    RETIRED: { color: 'badge-status-closed', icon: Ban },
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
