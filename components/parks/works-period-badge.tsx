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
 * „Umbaupause" — the one word that separates a ride being rebuilt from a ride
 * that happens to be shut.
 *
 * Both read `CLOSED` in the card's status badge, and until this existed that
 * was the whole story a visitor got: a headliner behind hoardings until March
 * looked exactly like a ride that had a bad morning. The window is curated
 * precisely because no feed distinguishes the two.
 *
 * Its own badge next to `SeasonalBadge`, not a variant of it, and the two may
 * stand side by side: "only opens in winter" and "being rebuilt right now" are
 * different facts about the same ride, and a single badge showing one of them
 * would have to pick which one to hide. Orange because no other badge on these
 * cards uses it — beside a summer season's amber the difference has to survive
 * a glance.
 *
 * Renders nothing unless the window covers `todayIso`. A finished rebuild is
 * not news, and a listing that cannot name the park's day passes no `todayIso`
 * and gets no badge — see `isWorksPeriodActive`.
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
