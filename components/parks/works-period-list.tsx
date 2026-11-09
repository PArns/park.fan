import { Construction } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { WorksPeriod } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { worksWindowLabel } from '@/lib/utils/works-period';

/**
 * The colour of every works mark: the „Umbaupause" badge's orange, which no other badge on a ride
 * card uses, on the calendar's day icon, the planner's block and band, and the ride page's note.
 */
export const WORKS_TONE_CLASS = 'text-orange-600 dark:text-orange-400';

/** One line of a {@link WorksPeriodList}: a window, and the ride it closes where that varies. */
export interface WorksPeriodListItem {
  key: string;
  /** The ride's name; absent where the list is about one ride. */
  name?: string;
  period: WorksPeriod;
}

interface WorksPeriodListProps {
  items: readonly WorksPeriodListItem[];
  /** The heading over the list; „Umbaupause" when absent, none for `null`. */
  title?: string | null;
  /** `tooltip` is the glass panel's small type, `panel` the day detail's body type. */
  size?: 'tooltip' | 'panel';
  className?: string;
}

/**
 * Curated works windows as a short list: the ride (where the list spans several) and its dates,
 * written by `worksWindowLabel` so no line claims anything about today. The body of every
 * „Umbaupause" tooltip and of the calendar's day detail, so a window reads the same wherever it is
 * named.
 */
export function WorksPeriodList({
  items,
  title,
  size = 'tooltip',
  className,
}: WorksPeriodListProps) {
  const t = useTranslations('parks.worksPeriod');
  const locale = useLocale();
  if (items.length === 0) return null;

  const small = size === 'tooltip';
  return (
    <div className={className}>
      {title !== null && (
        <p
          className={cn(
            'flex items-center gap-1.5 font-semibold',
            small ? 'mb-2 text-[10px] tracking-widest uppercase' : 'mb-2 text-sm'
          )}
        >
          <Construction
            className={cn('shrink-0', WORKS_TONE_CLASS, small ? 'size-3' : 'size-4')}
            aria-hidden="true"
          />
          {title ?? t('label')}
        </p>
      )}
      <ul className={cn('space-y-1', small ? 'text-[11px]' : 'text-sm')}>
        {items.map((item) => (
          <li key={item.key} className="leading-snug">
            {item.name && <span className="font-semibold">{item.name}</span>}
            {item.name && <span aria-hidden="true"> · </span>}
            <span className={cn(item.name && 'text-muted-foreground')}>
              {worksWindowLabel(item.period, locale, t)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
