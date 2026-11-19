'use client';

import type { ComponentType, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarPlus,
  CalendarX,
  Ellipsis,
  Lock,
  LockOpen,
  Trash2,
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatParkDay } from '@/lib/utils/park-day';
import {
  effectiveParks,
  isSpareDay,
  lockOn,
  type PlanDay,
  type TripPlan,
} from '@/lib/trip-regions/plan';
import { swapPreview } from '@/lib/trip-regions/plan-week';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanSheetContent } from './plan-sheet';

const ACTION =
  'text-muted-foreground hover:text-foreground hover:bg-accent/50 flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors lg:min-h-9';

/** A park day's name and date as its controls' labels say them: „Tokyo DisneySea am Di., 19. Jan.“ */
function useDayWords(day: PlanDay) {
  const { locale, parkName } = usePlanContext();
  return {
    park: parkName(day.parks[0]?.slug ?? ''),
    date: formatParkDay(locale, day.date, { weekday: 'short', day: 'numeric', month: 'short' }),
  };
}

/**
 * „Mehr“ under a park day's card, named with the park and the date: the day's edits (pin, swap,
 * a free day, take the park out) wait in its sheet, since few visitors use them. Nothing for a day
 * without one park, a hop day.
 */
export function PlanDayActions({
  day,
  open,
  onMore,
}: {
  day: PlanDay;
  /** Whether this day's sheet is open. */
  open: boolean;
  onMore: (day: PlanDay) => void;
}) {
  const t = useTranslations('tripPlanner.edit');
  const words = useDayWords(day);
  if (day.kind !== 'park' || !day.parks[0]) return null;
  return (
    <div className="flex justify-end" data-plan-day-actions="">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('moreLabel', words)}
        onClick={() => onMore(day)}
        className={cn(ACTION, PLAN_FOCUS)}
      >
        <Ellipsis className="size-3.5" aria-hidden="true" />
        {t('more')}
      </button>
    </div>
  );
}

/**
 * „Mehr“ for a park day, in the planner's sheet: pin it, swap it, put it on the quietest free day
 * of its city (with the figure, or honestly „no free day is quieter“), make it a free day, take the
 * park out of the trip, or open the day in the day planner.
 */
export function DayActionsSheet({
  day,
  plan,
  calendar,
  onClose,
  onPin,
  onSwap,
  onMove,
  onFree,
  onRemove,
  onPlanDay,
  returnFocus,
}: {
  day: PlanDay | null;
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onClose: () => void;
  onPin: (day: PlanDay) => void;
  onSwap: (day: PlanDay) => void;
  onMove: (day: PlanDay, date: string) => void;
  onFree: (day: PlanDay) => void;
  onRemove: (day: PlanDay) => void;
  onPlanDay: (slug: string, date: string) => void;
  returnFocus?: () => void;
}) {
  const { locale } = usePlanContext();
  return (
    <Sheet open={day !== null} onOpenChange={(open) => !open && onClose()}>
      {day && (
        <PlanSheetContent
          kicker={formatParkDay(locale, day.date, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          title={<SheetTitleText day={day} />}
          onClose={onClose}
          returnFocus={returnFocus}
          bodyClassName="px-2 py-2"
        >
          <DayActionList
            day={day}
            plan={plan}
            calendar={calendar}
            onPin={onPin}
            onSwap={onSwap}
            onMove={onMove}
            onFree={onFree}
            onRemove={onRemove}
            onPlanDay={onPlanDay}
          />
        </PlanSheetContent>
      )}
    </Sheet>
  );
}

function SheetTitleText({ day }: { day: PlanDay }) {
  return <>{useDayWords(day).park}</>;
}

function DayActionList({
  day,
  plan,
  calendar,
  onPin,
  onSwap,
  onMove,
  onFree,
  onRemove,
  onPlanDay,
}: {
  day: PlanDay;
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onPin: (day: PlanDay) => void;
  onSwap: (day: PlanDay) => void;
  onMove: (day: PlanDay, date: string) => void;
  onFree: (day: PlanDay) => void;
  onRemove: (day: PlanDay) => void;
  onPlanDay: (slug: string, date: string) => void;
}) {
  const t = useTranslations('tripPlanner');
  const { locale, timeZone, state, headliners } = usePlanContext();
  const words = useDayWords(day);
  const slug = day.parks[0]?.slug ?? '';
  const short = (date: string) =>
    formatParkDay(locale, date, { weekday: 'short', day: 'numeric', month: 'short' });
  const pinned = lockOn(state, day.date) !== null;

  // The free days of its city the park could go to, by its own figure there; the quietest first.
  const spares = plan.days
    .filter((d) => isSpareDay(d) && (d.base ?? null) === (day.base ?? null))
    .map((spare) => {
      const preview = swapPreview(calendar, day, spare, timeZone);
      const figure = preview.kind === 'minutes' ? preview.parks[0] : undefined;
      return { spare, preview, figure };
    })
    .filter((s) => s.preview.kind !== 'closed')
    .sort((a, b) => (a.figure?.away ?? Infinity) - (b.figure?.away ?? Infinity));
  const best = spares[0];
  const moveHint = !best
    ? t('edit.sheet.toSpareNone')
    : best.figure && best.figure.away < best.figure.here
      ? t('edit.sheet.toSpareBetter', {
          date: short(best.spare.date),
          after: best.figure.away,
          before: best.figure.here,
        })
      : best.figure
        ? t('edit.sheet.toSpareSame', { date: short(best.spare.date), after: best.figure.away })
        : t('edit.sheet.toSpareNoFigure', { date: short(best.spare.date) });

  const visits = plan.parks.find((p) => p.slug === slug)?.dates.length ?? 1;
  const lastPark = effectiveParks(state, headliners).length <= 1;

  return (
    <ul className="flex flex-col">
      <ActionRow
        icon={pinned ? Lock : LockOpen}
        title={pinned ? t('details.unpin') : t('edit.pin')}
        hint={t('edit.sheet.pinHint', words)}
        pressed={pinned}
        onClick={() => onPin(day)}
      />
      <ActionRow
        icon={ArrowLeftRight}
        title={t('edit.sheet.swap')}
        hint={t('edit.sheet.swapHint')}
        onClick={() => onSwap(day)}
      />
      <ActionRow
        icon={ArrowRight}
        title={t('edit.sheet.toSpare')}
        hint={moveHint}
        disabled={!best}
        onClick={() => best && onMove(day, best.spare.date)}
      />
      <ActionRow
        icon={CalendarX}
        title={t('edit.sheet.free')}
        hint={t('edit.sheet.freeHint', words)}
        onClick={() => onFree(day)}
      />
      <ActionRow
        icon={Trash2}
        title={t('edit.sheet.remove', words)}
        hint={lastPark ? t('edit.sheet.removeLast') : t('edit.sheet.removeHint', { count: visits })}
        disabled={lastPark}
        onClick={() => onRemove(day)}
      />
      <ActionRow
        icon={CalendarPlus}
        title={t('details.planDay')}
        hint={t('edit.sheet.planHint')}
        onClick={() => onPlanDay(slug, day.date)}
      />
    </ul>
  );
}

/**
 * One entry of a planner sheet's menu, as a list item: an icon in its square, the action and a
 * line under it. `pressed` makes it a toggle, `expanded` a disclosure.
 */
export function ActionRow({
  icon: Icon,
  title,
  hint,
  pressed,
  expanded,
  controls,
  disabled = false,
  onClick,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: ReactNode;
  hint?: ReactNode;
  pressed?: boolean;
  expanded?: boolean;
  /** The id of what a disclosure opens. */
  controls?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={pressed}
        aria-expanded={expanded}
        aria-controls={controls}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'hover:bg-accent/50 flex min-h-11 w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors disabled:opacity-50',
          PLAN_FOCUS
        )}
      >
        <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 self-center">
          <span className="text-sm font-medium">{title}</span>
          {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
        </span>
      </button>
    </li>
  );
}
