import { Badge } from '@/components/ui/badge';
import { getWaitTimeBadgeVariant } from '@/lib/api';
import { cn } from '@/lib/utils';

interface WaitTimeBadgeProps {
  waitTime: number;
  showText?: boolean;
  className?: string;
  status?: 'open' | 'closed'; // Für explizit geschlossene Fahrgeschäfte
}

export function WaitTimeBadge({
  waitTime,
  showText = true,
  className,
  status = 'open',
}: WaitTimeBadgeProps) {
  const getVariant = () => {
    if (status === 'closed') return 'secondary';
    return getWaitTimeBadgeVariant(waitTime);
  };

  const displayText = () => {
    if (!showText) return null;
    if (status === 'closed') return 'Closed';
    return waitTime === 0 ? 'Walk On' : `${waitTime} min`;
  };

  return (
    <Badge variant={getVariant()} className={cn('font-medium', className)}>
      {displayText()}
    </Badge>
  );
}
