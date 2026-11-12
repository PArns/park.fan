'use client';

import { useId, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  MapPinned,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatParkDayRange } from '@/lib/utils/park-day';
import { effectiveParks, minimumVisits, tripDates } from '@/lib/orlando/plan';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDatesStep } from './plan-find';
import { PlanParks } from './plan-parks';
import { PlanOptions, usePlanOptionsSummary } from './plan-options';

/** The phone's sheets, in the order the flow walks them; Fine-tune is optional. */
export type PlanSheetStep = 'dates' | 'parks' | 'options';

/** `lg`, where the setup is drawn inline; below it the same panels are sheets. */
export const PLAN_WIDE_QUERY = '(min-width: 64rem)';

/**
 * Dates, Parks and Fine-tune. On a phone, three summary rows that open one bottom sheet, walked
 * Dates → Parks → Plan, with Fine-tune a row of its own nobody has to open. At a desk the dates and
 * parks are two panels side by side and Fine-tune a disclosure under them with its summary line.
 * Both are in the markup and CSS picks one, so the server's stand-in and the hydrated planner have
 * the same boxes. The sheet returns the focus to the row that opened it.
 */
export function PlanSetup({
  defaultMonth,
  sheet,
  onSheet,
  onDone,
}: {
  defaultMonth?: string;
  sheet: PlanSheetStep | null;
  onSheet: (step: PlanSheetStep | null) => void;
  onDone: () => void;
}) {
  const t = useTranslations('orlandoPlanner');
  const { state, locale, headliners, live, today } = usePlanContext();
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const fineTuneId = useId();
  const summary = usePlanOptionsSummary(state);

  const dates = tripDates(state);
  const picks = effectiveParks(state, headliners);
  const range = (from: string, to: string) =>
    formatParkDayRange(locale, from, to, { day: 'numeric', month: 'short', year: 'numeric' });
  // Formatted only once the browser's clock is read: the server's and the browser's ICU write a
  // date range with different spaces, and a mismatch would cost the planner its hydration.
  const datesValue = !today
    ? '\u00a0'
    : state.when
      ? t('setup.findSummary', { days: state.days, range: range(state.when.from, state.when.to) })
      : state.from && state.to
        ? `${formatParkDayRange(locale, state.from, state.to, { day: 'numeric', month: 'short' })} · ${t('dates.dayCount', { count: dates.length })}`
        : t('setup.datesEmpty');
  const ready = Boolean((state.from && state.to) || state.when);
  const parksValue = [
    t('setup.parksCount', { count: picks.length }),
    state.split === 'auto'
      ? t('setup.splitOn')
      : t('setup.visitCount', { count: minimumVisits(picks) }),
  ].join(' · ');

  const steps: Record<PlanSheetStep, { title: string; body: ReactNode; next: ReactNode }> = {
    dates: {
      title: t('setup.dates'),
      body: <PlanDatesStep defaultMonth={defaultMonth} />,
      next: (
        <Button className="w-full" disabled={!ready} onClick={() => onSheet('parks')}>
          {t('setup.nextParks')}
        </Button>
      ),
    },
    parks: {
      title: t('setup.parks'),
      body: <PlanParks />,
      next: (
        <Button className="w-full" disabled={!ready} onClick={onDone}>
          {state.when ? t('setup.find') : t('setup.plan')}
        </Button>
      ),
    },
    options: {
      title: t('setup.fineTune'),
      body: <PlanOptions />,
      next: (
        <Button className="w-full" onClick={onDone}>
          {t('setup.done')}
        </Button>
      ),
    },
  };
  const step = sheet && !wide ? steps[sheet] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Phone: the three rows. */}
      <div className="flex flex-col gap-2 lg:hidden">
        <SetupRow
          icon={<CalendarDays className="size-5" aria-hidden="true" />}
          label={t('setup.dates')}
          value={datesValue}
          empty={!ready}
          disabled={!live}
          onClick={() => onSheet('dates')}
        />
        <SetupRow
          icon={<MapPinned className="size-5" aria-hidden="true" />}
          label={t('setup.parks')}
          value={parksValue}
          disabled={!live}
          onClick={() => onSheet('parks')}
        />
        <SetupRow
          icon={<SlidersHorizontal className="size-5" aria-hidden="true" />}
          label={t('setup.fineTune')}
          value={summary}
          quiet
          disabled={!live}
          onClick={() => onSheet('options')}
        />
        {!ready && (
          <Button className="mt-1 w-full" disabled={!live} onClick={() => onSheet('dates')}>
            {t('setup.start')}
          </Button>
        )}
      </div>

      {/* Desk: the panels. */}
      <div className="hidden flex-col gap-4 lg:flex">
        <div className="grid grid-cols-2 gap-4">
          <SetupPanel title={t('setup.dates')}>
            <PlanDatesStep defaultMonth={defaultMonth} />
          </SetupPanel>
          <SetupPanel title={t('setup.parks')}>
            <PlanParks />
          </SetupPanel>
        </div>
        <div className="border-border/60 bg-muted/30 rounded-2xl border">
          <button
            type="button"
            aria-expanded={fineTuneOpen}
            aria-controls={fineTuneId}
            disabled={!live}
            onClick={() => setFineTuneOpen((open) => !open)}
            className={cn(
              'hover:bg-accent/40 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
              PLAN_FOCUS
            )}
          >
            <SlidersHorizontal
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold">{t('setup.fineTune')}</span>
            <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">{summary}</span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 transition-transform duration-200',
                fineTuneOpen && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>
          <div
            id={fineTuneId}
            hidden={!fineTuneOpen}
            className="border-border/60 border-t px-4 py-4"
          >
            <PlanOptions className="grid grid-cols-2 gap-x-8 gap-y-5 xl:grid-cols-3" />
          </div>
        </div>
      </div>

      <Sheet open={step !== null} onOpenChange={(open) => !open && onSheet(null)}>
        {step && (
          <SheetContent
            side="bottom"
            hideClose
            className="max-h-[90svh] gap-0 rounded-t-2xl p-0"
            aria-describedby={undefined}
          >
            <div className="border-border/60 flex items-center gap-2 border-b px-4 py-1.5">
              <SheetTitle className="min-w-0 flex-1 text-base">{step.title}</SheetTitle>
              <SheetDescription className="sr-only">{t('setup.sheetHint')}</SheetDescription>
              <button
                type="button"
                onClick={() => onSheet(null)}
                aria-label={t('setup.close')}
                className={cn(
                  'hover:bg-accent flex size-11 items-center justify-center rounded-md',
                  PLAN_FOCUS
                )}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {step.body}
            </div>
            <div className="border-border/60 border-t px-4 py-3">{step.next}</div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

function SetupRow({
  icon,
  label,
  value,
  empty = false,
  quiet = false,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  empty?: boolean;
  quiet?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'border-border/60 hover:bg-accent/40 flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
        quiet ? 'bg-transparent' : 'bg-muted/30',
        PLAN_FOCUS
      )}
    >
      <span className={cn('shrink-0', empty ? 'text-primary' : 'text-muted-foreground')}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{label}</span>
        <span className={cn('truncate text-sm', empty ? 'text-primary' : 'text-muted-foreground')}>
          {value}
        </span>
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </button>
  );
}

function SetupPanel({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="border-border/60 bg-muted/30 flex flex-col gap-3 rounded-2xl border p-4"
    >
      <h3 id={id} className="text-base font-semibold">
        {title}
      </h3>
      {children}
    </section>
  );
}
