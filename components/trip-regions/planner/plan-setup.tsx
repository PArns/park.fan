'use client';

import { useId, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  MapPinned,
  SlidersHorizontal,
  Ticket,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatParkDayRange } from '@/lib/utils/park-day';
import { effectiveParks, minimumVisits, tripDates } from '@/lib/trip-regions/plan';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDatesStep } from './plan-find';
import { PlanParks } from './plan-parks';
import { PlanOptions, usePlanOptionsSummary } from './plan-options';
import { PlanTickets, type TicketStep } from './plan-tickets';
import { useTicketSummary } from './plan-ticket-summary';

/** The phone's sheets, in the order the flow walks them; Fine-tune is optional. */
export type PlanSheetStep = 'tickets' | 'dates' | 'parks' | 'options';

/** `lg`, where the setup is drawn inline; below it the same panels are sheets. */
export const PLAN_WIDE_QUERY = '(min-width: 64rem)';

/**
 * Tickets, Dates, Parks and Fine-tune. On a phone, summary rows that open one bottom sheet, walked
 * Tickets → Dates → Parks → Plan (Tickets only while its question is open), with Fine-tune a row of
 * its own nobody has to open. At a desk Tickets is a disclosure, open until answered, the dates and
 * parks two panels side by side and Fine-tune a disclosure under them with its summary line. Both
 * are in the markup and CSS picks one, so the server's stand-in and the hydrated planner have the
 * same boxes. The sheet returns the focus to the row that opened it.
 */
export function PlanSetup({
  defaultMonth,
  sheet,
  onSheet,
  walk,
  onDone,
  step: ticketStep,
  ticketsOpen,
  onTicketsOpen,
  fineTuneOpen,
  onFineTuneOpen,
  onStart,
}: {
  defaultMonth?: string;
  sheet: PlanSheetStep | null;
  onSheet: (step: PlanSheetStep | null) => void;
  /** The sheet was opened by the walk, so Tickets leads on to Dates. */
  walk: boolean;
  onDone: () => void;
  step: TicketStep;
  /** The desk's Tickets disclosure. */
  ticketsOpen: boolean;
  onTicketsOpen: (open: boolean) => void;
  fineTuneOpen: boolean;
  onFineTuneOpen: (open: boolean) => void;
  /** "Plan my Orlando trip": the walk's first sheet. */
  onStart: () => void;
}) {
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const { state, locale, headliners, live, today } = usePlanContext();
  const tTickets = useTranslations('tripPlanner.tickets');
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const opener = useRef<HTMLElement | null>(null);
  const open = (step: PlanSheetStep) => {
    if (sheet === null) {
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    onSheet(step);
  };
  const summary = usePlanOptionsSummary(state);
  const ticketSummary = useTicketSummary(ticketStep);
  // The desk's panel is open while the question is; a "Yes" keeps it open for the tickets.
  const deskStep: TicketStep = {
    ...ticketStep,
    answerYes: () => {
      onTicketsOpen(true);
      ticketStep.answerYes();
    },
  };
  const notYet = () => {
    ticketStep.answerNo();
    if (wide) {
      onTicketsOpen(false);
      document
        .querySelector<HTMLElement>('[data-plan-dates-panel]')
        ?.focus({ preventScroll: true });
    } else open('dates');
  };

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

  const steps: Record<
    PlanSheetStep,
    { title: string; body: ReactNode; next: ReactNode; hint?: string }
  > = {
    tickets: {
      title: tTickets('title'),
      hint: walk ? tTickets('sheetHint') : undefined,
      body: <PlanTickets step={ticketStep} onNotYet={notYet} defaultMonth={defaultMonth} />,
      next: walk ? (
        <Button
          className="w-full"
          onClick={() => {
            if (ticketStep.answer === 'unasked') ticketStep.answerNo(true);
            open('dates');
          }}
        >
          {tTickets('nextDates')}
        </Button>
      ) : (
        <Button className="w-full" onClick={ready ? onDone : () => onSheet(null)}>
          {t('setup.done')}
        </Button>
      ),
    },
    dates: {
      title: t('setup.dates'),
      body: <PlanDatesStep defaultMonth={defaultMonth} />,
      next: (
        <Button className="w-full" disabled={!ready} onClick={() => open('parks')}>
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
      {/* Phone: the rows. */}
      <div className="flex flex-col gap-2 lg:hidden">
        {ticketSummary && (
          <SetupRow
            icon={<Ticket className="size-5" aria-hidden="true" />}
            label={tTickets('title')}
            value={ticketSummary.value}
            empty={ticketSummary.tone === 'ask'}
            warn={ticketSummary.tone === 'warn'}
            quiet={ticketSummary.tone === 'quiet'}
            disabled={!live}
            onClick={() => open('tickets')}
            rowKey="tickets"
          />
        )}
        <SetupRow
          icon={<CalendarDays className="size-5" aria-hidden="true" />}
          label={t('setup.dates')}
          value={datesValue}
          empty={!ready}
          disabled={!live}
          onClick={() => open('dates')}
        />
        <SetupRow
          icon={<MapPinned className="size-5" aria-hidden="true" />}
          label={t('setup.parks')}
          value={parksValue}
          disabled={!live}
          onClick={() => open('parks')}
        />
        <SetupRow
          icon={<SlidersHorizontal className="size-5" aria-hidden="true" />}
          label={t('setup.fineTune')}
          value={summary}
          quiet
          disabled={!live}
          onClick={() => open('options')}
        />
        {!ready && (
          <Button
            className="mt-1 w-full"
            disabled={!live}
            onClick={() => {
              if (sheet === null) {
                opener.current =
                  document.activeElement instanceof HTMLElement ? document.activeElement : null;
              }
              onStart();
            }}
          >
            {tRegion('setup.start')}
          </Button>
        )}
      </div>

      {/* Desk: the panels. */}
      <div className="hidden flex-col gap-4 lg:flex">
        {ticketSummary && (
          <PlanDisclosure
            icon={Ticket}
            label={tTickets('title')}
            summary={ticketSummary.value}
            tone={ticketSummary.tone}
            open={ticketsOpen}
            onToggle={() => onTicketsOpen(!ticketsOpen)}
            disabled={!live}
            panelKey="tickets"
          >
            <div className="flex flex-col gap-4">
              <PlanTickets step={deskStep} onNotYet={notYet} defaultMonth={defaultMonth} wide />
              {ticketStep.answer !== 'unasked' && (
                <Button variant="outline" className="self-end" onClick={() => onTicketsOpen(false)}>
                  {t('setup.done')}
                </Button>
              )}
            </div>
          </PlanDisclosure>
        )}
        <div className="grid grid-cols-2 gap-4">
          <SetupPanel title={t('setup.dates')} dates>
            <PlanDatesStep defaultMonth={defaultMonth} />
          </SetupPanel>
          <SetupPanel title={t('setup.parks')} parks>
            <PlanParks />
          </SetupPanel>
        </div>
        <PlanDisclosure
          icon={SlidersHorizontal}
          label={t('setup.fineTune')}
          summary={summary}
          open={fineTuneOpen}
          onToggle={() => onFineTuneOpen(!fineTuneOpen)}
          disabled={!live}
          panelKey="options"
        >
          <PlanOptions className="grid grid-cols-2 gap-x-8 gap-y-5 xl:grid-cols-3" />
        </PlanDisclosure>
      </div>

      <Sheet open={step !== null} onOpenChange={(open) => !open && onSheet(null)}>
        {step && (
          <SheetContent
            side="bottom"
            hideClose
            className="max-h-[90svh] gap-0 rounded-t-2xl p-0"
            onCloseAutoFocus={(event) => {
              // "Plan" moves the focus to the result itself; a plain close goes back to the row.
              event.preventDefault();
              if (document.activeElement === document.body) opener.current?.focus();
            }}
          >
            <div className="border-border/60 flex items-center gap-2 border-b px-4 py-1.5">
              <SheetTitle className="min-w-0 flex-1 text-base">{step.title}</SheetTitle>
              <SheetDescription className="sr-only">
                {step.hint ?? t('setup.sheetHint')}
              </SheetDescription>
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
  warn = false,
  quiet = false,
  disabled,
  onClick,
  rowKey,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  empty?: boolean;
  /** The value is a problem to fix, in the warning ink. */
  warn?: boolean;
  quiet?: boolean;
  disabled: boolean;
  onClick: () => void;
  rowKey?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-haspopup="dialog"
      data-setup-row={rowKey}
      className={cn(
        'border-border/60 hover:bg-accent/40 flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
        quiet ? 'bg-transparent' : 'bg-muted/30',
        PLAN_FOCUS
      )}
    >
      <span
        className={cn(
          'shrink-0',
          warn ? 'text-crowd-ink-high' : empty ? 'text-primary-ink' : 'text-muted-foreground'
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={cn(
            'line-clamp-2 text-sm',
            warn ? 'text-crowd-ink-high' : empty ? 'text-primary-ink' : 'text-muted-foreground'
          )}
        >
          {value}
        </span>
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </button>
  );
}

function SetupPanel({
  title,
  dates = false,
  parks = false,
  children,
}: {
  title: string;
  /** The dates panel, which the hub's hero action scrolls to (`orlandoPlannerUi`). */
  dates?: boolean;
  /** The parks panel, which "Choose SeaWorld parks" in the result scrolls to. */
  parks?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      data-plan-dates-panel={dates ? '' : undefined}
      data-plan-parks-panel={parks ? '' : undefined}
      tabIndex={dates || parks ? -1 : undefined}
      className="border-border/60 bg-muted/30 flex flex-col gap-3 rounded-2xl border p-4"
    >
      <h3 id={id} className="text-base font-semibold">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * A desk row that folds a panel away under its one-line summary: Tickets and Fine-tune. The row is
 * the disclosure button, the panel stays in the DOM while hidden.
 */
function PlanDisclosure({
  icon: Icon,
  label,
  summary,
  tone,
  open,
  onToggle,
  disabled,
  panelKey,
  children,
}: {
  icon: typeof Ticket;
  label: string;
  summary: string;
  /** How the summary reads: a question to answer, a problem, or a plain value. */
  tone?: 'ask' | 'warn' | 'quiet' | 'set';
  open: boolean;
  onToggle: () => void;
  disabled: boolean;
  panelKey: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      className="border-border/60 bg-muted/30 rounded-2xl border"
      data-plan-disclosure={panelKey}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'hover:bg-accent/40 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
          PLAN_FOCUS
        )}
      >
        <Icon
          className={cn(
            'size-4 shrink-0',
            tone === 'warn'
              ? 'text-crowd-ink-high'
              : tone === 'ask'
                ? 'text-primary-ink'
                : 'text-muted-foreground'
          )}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm',
            tone === 'warn'
              ? 'text-crowd-ink-high'
              : tone === 'ask'
                ? 'text-primary-ink'
                : 'text-muted-foreground'
          )}
        >
          {summary}
        </span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div id={id} hidden={!open} className="border-border/60 border-t px-4 py-4">
        {children}
      </div>
    </div>
  );
}
