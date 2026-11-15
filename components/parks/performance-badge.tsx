import { Theater } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * „Feste Vorstellungen": stands where the status badge would on a ride that shows today's
 * performance times instead of a wait. The feed reads such a ride CLOSED between two
 * performances, and a red badge over a countdown would contradict it. Sky, the colour of a
 * timetable rather than of a state.
 */
export function PerformanceBadge({ className }: { className?: string }) {
  const t = useTranslations('attractions.performance');
  return (
    <Badge
      title={t('hint')}
      className={cn(
        'border border-sky-500/30 bg-sky-500/15 font-semibold text-sky-700 backdrop-blur-md dark:text-sky-300',
        className
      )}
    >
      <Theater className="h-3 w-3 text-inherit" aria-hidden="true" />
      {t('badge')}
    </Badge>
  );
}
