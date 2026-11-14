'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  MapPinned,
  Route,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatParkDayRange } from '@/lib/utils/park-day';
import { effectiveParks, tripDates } from '@/lib/trip-regions/plan';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS, PlanSheetClose } from './plan-controls';
import { PlanDatesStep } from './plan-find';
import { PlanParks } from './plan-parks';
import { PlanOptions, usePlanOptionsSummary } from './plan-options';
import { PlanTickets, type TicketStep } from './plan-tickets';
import type { TripEditPanel } from '@/lib/analytics/site-analytics';

/**
 * The phone's sheets: Dates and Parks, the Route where the region has bases, More options, and
 * Tickets, which the answer opens once there is a plan.
 */
export type PlanSheetStep = 'dates' | 'parks' | 'route' | 'options' | 'tickets';

/** `lg`, where the setup is drawn inline; below it the same panels are sheets. */
export const PLAN_WIDE_QUERY = '(min-width: 64rem)';

/** What a region with bases adds to the setup: the Route, and its rows under More options. */
export interface PlanSetupRoute {
  /** The Route step itself (`PlanRoute`). */
  body: ReactNode;
  /** Its one line: the ends and the cities with their nights. */
  summary: string;
  /** The hotel per city and the hotel change's buffer, inside More options. */
  options: ReactNode;
}

/**
 * Dates and Parks first, the only two things a plan needs, and the parks start chosen: the region's
 * headliners. Everything else waits until there is a plan to change: the Route of a region with
 * bases and More options (hotel, travel days, rest days, evenings, hopping) are folded away with a
 * summary line that says what the plan assumes, and Tickets are asked for in the answer. On a phone
 * the setup is summary rows that open one bottom sheet each, and the walk is the Dates sheet alone:
 * once the departure date is picked the sheet closes and the answer takes the focus. At a desk the
 * dates and parks are two panels side by side and the rest are disclosures under them. Both are in
 * the markup and CSS picks one, so the server's stand-in and the hydrated planner have the same
 * boxes. The sheet returns the focus to the row that opened it.
 */
export function PlanSetup({
  defaultMonth,
  sheet,
  onSheet,
  onDone,
  onSheetClosed,
  onDatesPicked,
  onSetupOpened,
  step: ticketStep,
  fineTuneOpen,
  onFineTuneOpen,
  routeOpen,
  onRouteOpen,
  route,
  onStart,
}: {
  defaultMonth?: string;
  sheet: PlanSheetStep | null;
  onSheet: (step: PlanSheetStep | null) => void;
  /** "Show the plan": the sheet closes and the answer takes the focus. */
  onDone: () => void;
  /** The sheet is gone; true when the planner moved the focus itself (to the answer). */
  onSheetClosed: () => boolean;
  /** The visitor picked the trip's dates in the Dates step: the plan is there to see. */
  onDatesPicked: () => void;
  /** A phone's setup row opened a panel: a change from the setup, for the statistic. */
  onSetupOpened: (panel: TripEditPanel) => void;
  step: TicketStep;
  fineTuneOpen: boolean;
  onFineTuneOpen: (open: boolean) => void;
  routeOpen: boolean;
  onRouteOpen: (open: boolean) => void;
  /** The Route, in a region with bases. */
  route: PlanSetupRoute | null;
  /** "Plan my trip": the walk's sheet. */
  onStart: () => void;
}) {
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const tTickets = useTranslations('tripPlanner.tickets');
  const { state, locale, headliners, live, today } = usePlanContext();
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const opener = useRef<HTMLElement | null>(null);
  const open = (step: PlanSheetStep) => {
    if (sheet === null) {
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    if (step !== 'tickets') onSetupOpened(step);
    onSheet(step);
  };
  const summary = usePlanOptionsSummary(state);
  const picked = usePickedDates(onDatesPicked);

  const dates = tripDates(state);
  const picks = effectiveParks(state, headliners);
  const range = (from: string, to: string) =>
    formatParkDayRange(locale, from, to, { day: 'numeric', month: 'short', year: 'numeric' });
  // Formatted only once the browser's clock is read: the server's and the browser's ICU write a
  // date range with different spaces, and a mismatch would cost the planner its hydration.
  const datesValue = !today
    ? ' '
    : state.when
      ? t('setup.findSummary', { days: state.days, range: range(state.when.from, state.when.to) })
      : state.from && state.to
        ? `${formatParkDayRange(locale, state.from, state.to, { day: 'numeric', month: 'short' })} · ${t('dates.dayCount', { count: dates.length })}`
        : t('setup.datesEmpty');
  const ready = Boolean((state.from && state.to) || state.when);
  const parksValue = t('setup.parksCount', { count: picks.length });
  const showPlan = (
    <Button className="w-full" disabled={!ready} onClick={onDone}>
      {state.when ? t('setup.find') : t('setup.showPlan')}
    </Button>
  );
  const done = (
    <Button className="w-full" onClick={ready ? onDone : () => onSheet(null)}>
      {t('setup.done')}
    </Button>
  );

  const steps: Record<PlanSheetStep, { title: string; body: ReactNode; next: ReactNode } | null> = {
    dates: {
      title: t('setup.dates'),
      body: (
        <div {...picked}>
          <PlanDatesStep defaultMonth={defaultMonth} />
        </div>
      ),
      next: showPlan,
    },
    parks: { title: t('setup.parks'), body: <PlanParks />, next: ready ? showPlan : done },
    route: route && { title: t('setup.route'), body: route.body, next: done },
    options: {
      title: t('setup.fineTune'),
      body: <PlanOptions>{route?.options}</PlanOptions>,
      next: done,
    },
    tickets: {
      title: tTickets('title'),
      body: <PlanTickets step={ticketStep} defaultMonth={defaultMonth} />,
      next: done,
    },
  };
  const step = sheet && !wide ? steps[sheet] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Phone: the rows. */}
      <div className="flex flex-col gap-2 lg:hidden">
        <SetupRow
          icon={<CalendarDays className="size-5" aria-hidden="true" />}
          label={t('setup.dates')}
          value={datesValue}
          empty={!ready}
          disabled={!live}
          onClick={() => open('dates')}
          rowKey="dates"
        />
        <SetupRow
          icon={<MapPinned className="size-5" aria-hidden="true" />}
          label={t('setup.parks')}
          value={parksValue}
          disabled={!live}
          onClick={() => open('parks')}
          rowKey="parks"
        />
        {route && (
          <SetupRow
            icon={<Route className="size-5" aria-hidden="true" />}
            label={t('setup.route')}
            value={route.summary}
            quiet
            disabled={!live}
            onClick={() => open('route')}
            rowKey="route"
          />
        )}
        <SetupRow
          icon={<SlidersHorizontal className="size-5" aria-hidden="true" />}
          label={t('setup.fineTune')}
          value={summary}
          quiet
          disabled={!live}
          onClick={() => open('options')}
          rowKey="options"
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
            {regionOrShared(tRegion, t, 'setup.start')}
          </Button>
        )}
      </div>

      {/* Desk: the panels. */}
      <div className="hidden flex-col gap-4 lg:flex">
        <div className="grid grid-cols-2 gap-4">
          <SetupPanel title={t('setup.dates')} dates>
            <div {...picked}>
              <PlanDatesStep defaultMonth={defaultMonth} />
            </div>
          </SetupPanel>
          <SetupPanel title={t('setup.parks')} parks>
            <PlanParks />
          </SetupPanel>
        </div>
        {route && (
          <PlanDisclosure
            icon={Route}
            label={t('setup.route')}
            summary={route.summary}
            open={routeOpen}
            onToggle={() => onRouteOpen(!routeOpen)}
            disabled={!live}
            panelKey="route"
          >
            {route.body}
          </PlanDisclosure>
        )}
        <PlanDisclosure
          icon={SlidersHorizontal}
          label={t('setup.fineTune')}
          summary={summary}
          open={fineTuneOpen}
          onToggle={() => onFineTuneOpen(!fineTuneOpen)}
          disabled={!live}
          panelKey="options"
        >
          <PlanOptions className="grid grid-cols-2 gap-x-8 gap-y-5 xl:grid-cols-3">
            {route?.options}
          </PlanOptions>
        </PlanDisclosure>
      </div>

      <Sheet open={step !== null} onOpenChange={(open) => !open && onSheet(null)}>
        {step && (
          <SheetContent
            side="bottom"
            hideClose
            className="max-h-[90svh] gap-0 rounded-t-2xl p-0"
            onCloseAutoFocus={(event) => {
              // "Show the plan" moves the focus to the result itself; a plain close goes back to
              // the row.
              event.preventDefault();
              if (onSheetClosed()) return;
              if (document.activeElement === document.body) opener.current?.focus();
            }}
          >
            <div className="border-border/60 flex items-center gap-2 border-b px-4 py-1.5">
              <SheetTitle className="min-w-0 flex-1 text-base">{step.title}</SheetTitle>
              <SheetDescription className="sr-only">{t('setup.sheetHint')}</SheetDescription>
              <PlanSheetClose label={t('setup.close')} onClick={() => onSheet(null)} />
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

/**
 * Tells when the trip's dates were picked inside the element it is spread on: a press or a key in
 * the Dates step, then new `from`/`to`. A change that came from elsewhere (a link, Parky, a ticket's
 * window) is not a pick, so the page does not move under the visitor.
 */
function usePickedDates(onPicked: () => void) {
  const { state } = usePlanContext();
  const touched = useRef(false);
  const key = state.from && state.to ? `${state.from}_${state.to}` : null;
  const last = useRef(key);
  const latest = useRef(onPicked);
  useEffect(() => {
    latest.current = onPicked;
  }, [onPicked]);
  useEffect(() => {
    if (key === last.current) return;
    last.current = key;
    if (key && touched.current) latest.current();
    touched.current = false;
  }, [key]);
  const touch = () => {
    touched.current = true;
  };
  return { onPointerDownCapture: touch, onKeyDownCapture: touch };
}

function SetupRow({
  icon,
  label,
  value,
  empty = false,
  quiet = false,
  disabled,
  onClick,
  rowKey,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  empty?: boolean;
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
      <span className={cn('shrink-0', empty ? 'text-primary-ink' : 'text-muted-foreground')}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={cn(
            'line-clamp-2 text-sm',
            empty ? 'text-primary-ink' : 'text-muted-foreground'
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
  /** The dates panel, which the hub's hero action scrolls to (`tripPlannerUi`). */
  dates?: boolean;
  /** The parks panel, which "Change parks" in the result scrolls to. */
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
 * A desk row that folds a panel away under its one-line summary: the Route and More options. The
 * row is the disclosure button, the panel stays in the DOM while hidden.
 */
function PlanDisclosure({
  icon: Icon,
  label,
  summary,
  open,
  onToggle,
  disabled,
  panelKey,
  children,
}: {
  icon: LucideIcon;
  label: string;
  summary: string;
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
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">{summary}</span>
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
