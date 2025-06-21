import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface WaitTimeBadgeProps {
  waitTime: number;
  showText?: boolean;
  className?: string;
}

export function WaitTimeBadge({ waitTime, showText = true, className }: WaitTimeBadgeProps) {
  const getBadgeStyles = (time: number) => {
    if (time === 0) {
      return {
        variant: 'secondary' as const,
        className: 'bg-muted text-muted-foreground hover:bg-muted/80'
      };
    }
    if (time <= 15) {
      return {
        variant: 'default' as const,
        className: 'bg-green-500 text-white hover:bg-green-600 border-green-500'
      };
    }
    if (time <= 30) {
      return {
        variant: 'outline' as const,
        className: 'border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-400'
      };
    }
    if (time <= 60) {
      return {
        variant: 'outline' as const,
        className: 'border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-400'
      };
    }
    return {
      variant: 'destructive' as const,
      className: 'bg-red-500 text-white hover:bg-red-600 border-red-500'
    };
  };

  const badgeStyles = getBadgeStyles(waitTime);
  
  const displayText = () => {
    if (!showText) return null;
    return waitTime === 0 ? 'Walk On' : `${waitTime} min`;
  };

  return (
    <Badge
      variant={badgeStyles.variant}
      className={cn(badgeStyles.className, className)}
    >
      {displayText()}
    </Badge>
  );
}
