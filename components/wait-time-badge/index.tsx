import { Badge } from '@/components/ui/badge';
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
  status = 'open'
}: WaitTimeBadgeProps) {
  const getBadgeStyles = (time: number, rideStatus: string) => {
    // Geschlossene Fahrgeschäfte
    if (rideStatus === 'closed') {
      return {
        variant: 'outline' as const,
        className: 'border-slate-300 text-slate-600 bg-slate-50/50 hover:bg-slate-100/50 dark:border-slate-600 dark:text-slate-400 dark:bg-slate-800/50'
      };
    }

    // Walk On (0 Minuten)
    if (time === 0) {
      return {
        variant: 'outline' as const,
        className: 'border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950/50'
      };
    }
    
    // Kurze Wartezeit (1-15 min) - Grün
    if (time <= 15) {
      return {
        variant: 'outline' as const,
        className: 'border-green-400 text-green-700 bg-green-50 hover:bg-green-100 dark:border-green-500 dark:text-green-300 dark:bg-green-950/50'
      };
    }
    
    // Mittlere Wartezeit (16-30 min) - Gelb
    if (time <= 30) {
      return {
        variant: 'outline' as const,
        className: 'border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-300 dark:bg-amber-950/50'
      };
    }
    
    // Längere Wartezeit (31-60 min) - Orange
    if (time <= 60) {
      return {
        variant: 'outline' as const,
        className: 'border-orange-400 text-orange-700 bg-orange-50 hover:bg-orange-100 dark:border-orange-500 dark:text-orange-300 dark:bg-orange-950/50'
      };
    }
    
    // Sehr lange Wartezeit (60+ min) - Rot
    return {
      variant: 'outline' as const,
      className: 'border-red-400 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-500 dark:text-red-300 dark:bg-red-950/50'
    };
  };

  const badgeStyles = getBadgeStyles(waitTime, status);
  
  const displayText = () => {
    if (!showText) return null;
    if (status === 'closed') return 'Closed';
    return waitTime === 0 ? 'Walk On' : `${waitTime} min`;
  };

  return (
    <Badge
      variant={badgeStyles.variant}
      className={cn(badgeStyles.className, 'font-medium', className)}
    >
      {displayText()}
    </Badge>
  );
}
