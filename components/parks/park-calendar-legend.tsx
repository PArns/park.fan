'use client';

import { useTranslations } from 'next-intl';
import { Backpack, Ban, Calendar, Luggage, PartyPopper } from 'lucide-react';

import { cn } from '@/lib/utils';

/** One legend chip. The `title` is the hint a pointer gets; the colour is the cell border it
 *  explains, so the two must keep matching `park-calendar-grid`'s day cells. */
function LegendChip({
  title,
  icon: Icon,
  label,
  className,
}: {
  title: string;
  icon: typeof Ban;
  label: string;
  className: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] whitespace-nowrap',
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

/**
 * What the coloured borders in the month grid mean.
 *
 * It used to live INSIDE `ParkCalendarGrid`, which is a `ssr: false` import — so a legend that
 * needs no data, no clock and no viewport was withheld until a JavaScript chunk arrived, and it
 * made the grid's two loading states structurally different: `next/dynamic` drew a bare
 * placeholder, then the mounted-but-fetching grid drew this row PLUS a placeholder. Measured, the
 * row is 60 px on a 390 px phone (it wraps to two lines) and 26 px from `md` up, each plus a 16 px
 * gap — so the box grew by that much on mount and shrank back when the data landed.
 *
 * Up in the panel's control row it is server-rendered in the first byte, the two loading states
 * become the same box by construction, and the grid gets the vertical space back.
 *
 * Denser than the version it replaces (`text-[11px]`, tighter padding) because it now shares a row
 * with the month stepper rather than owning a full-width line of its own.
 */
export function ParkCalendarLegend({ className }: { className?: string }) {
  const t = useTranslations('parks');
  const tAttractions = useTranslations('attractions');

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <LegendChip
        title={t('legendHints.closed')}
        icon={Ban}
        label={tAttractions('historyLegend.closed')}
        className="border-red-500/70 bg-red-50/50 text-red-700 dark:bg-red-950/20 dark:text-red-300"
      />
      <LegendChip
        title={t('legendHints.holiday')}
        icon={PartyPopper}
        label={tAttractions('historyLegend.holiday')}
        className="border-orange-500/70 text-orange-700 dark:text-orange-300"
      />
      <LegendChip
        title={t('legendHints.schoolVacation')}
        icon={Backpack}
        label={tAttractions('historyLegend.schoolVacation')}
        className="border-yellow-500/70 text-yellow-700 dark:text-yellow-300"
      />
      <LegendChip
        title={t('legendHints.bridgeDay')}
        icon={Calendar}
        label={tAttractions('historyLegend.bridgeDay')}
        className="border-blue-500/70 text-blue-700 dark:text-blue-300"
      />
      <LegendChip
        title={t('legendHints.neighbor')}
        icon={Luggage}
        label={t('influencingHolidays')}
        className="border-amber-500/70 text-amber-700 dark:text-amber-300"
      />
    </div>
  );
}
