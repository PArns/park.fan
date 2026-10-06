import { Construction } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { WorksPeriod } from '@/lib/api/types';
import { isWorksPeriodActive } from '@/lib/utils/works-period';

interface WorksPeriodBadgeProps {
  /** The curated window from the API. Renders nothing when absent. */
  worksPeriod?: WorksPeriod | null;
  /** The park's own day as `YYYY-MM-DD`, computed on the server. */
  todayIso?: string;
  className?: string;
}

/**
 * „Umbaupause": the word that separates a ride being rebuilt from one that happens to be shut. Both
 * read `CLOSED` and no feed tells them apart, so the window is curated.
 *
 * Its own badge beside `SeasonalBadge`, because "only opens in winter" and "being rebuilt" are
 * different facts that may both hold; orange because no other badge on these cards uses it. Renders
 * nothing unless the window covers `todayIso` (see `isWorksPeriodActive`).
 */
export function WorksPeriodBadge({ worksPeriod, todayIso, className }: WorksPeriodBadgeProps) {
  const t = useTranslations('parks.worksPeriod');

  if (!isWorksPeriodActive(worksPeriod, todayIso)) return null;

  return (
    <Badge
      className={cn(
        'border border-orange-500/30 bg-orange-500/15 font-semibold text-orange-600 backdrop-blur-md dark:text-orange-300',
        className
      )}
    >
      <Construction className="h-3 w-3 text-inherit" />
      {t('label')}
    </Badge>
  );
}
