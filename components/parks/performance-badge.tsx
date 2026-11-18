import { Theater } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * The badge colours of a ride that starts at set times: sky, the colour of a timetable rather than
 * of a state. Shared with the blog's inline ride chip, which shows the next start in them.
 */
export const PERFORMANCE_BADGE_CLASS =
  'border border-sky-500/30 bg-sky-500/15 font-semibold text-sky-700 backdrop-blur-md dark:text-sky-300';

/**
 * „Feste Vorstellungen": stands where the status badge would on a ride that shows today's
 * performance times instead of a wait. The feed reads such a ride CLOSED between two
 * performances, and a red badge over a countdown would contradict it.
 */
export function PerformanceBadge({ className }: { className?: string }) {
  const t = useTranslations('attractions.performance');
  return (
    <Badge title={t('hint')} className={cn(PERFORMANCE_BADGE_CLASS, className)}>
      <Theater className="h-3 w-3 text-inherit" aria-hidden="true" />
      {t('badge')}
    </Badge>
  );
}
