import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface WaitTimeBadgeProps {
  waitTime: number;
  /**
   * 'lg' = large prominent display (attraction card main wait time)
   * 'sm' = small muted display (park card avg wait time)
   */
  size?: 'sm' | 'lg';
  className?: string;
}

export function WaitTimeBadge({ waitTime, size = 'sm', className }: WaitTimeBadgeProps) {
  const tCommon = useTranslations('common');

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        size === 'lg' ? 'text-lg font-bold' : 'text-muted-foreground text-xs font-medium',
        className
      )}
    >
      <Clock className="h-4 w-4" />
      <span>
        {waitTime} {tCommon('minute', { count: waitTime })}
      </span>
    </div>
  );
}
