'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Check, ChevronDown, ChevronRight, Plus, Ticket, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { monthLabel, monthOf } from '@/lib/planner/month-grid';
import { getDateTimeFormat, getListFormat } from '@/lib/utils/intl-format';
import { addDays, formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { MAX_DAYS_AHEAD, MAX_TICKETS, writeTicketItem } from '@/lib/trip-regions/plan-query';
import {
  draftProduct,
  draftTicket,
  entryMarket,
  ticketHomeMarket,
  isEveryDayTicket,
  setTickets,
  soldLengths,
  ticketDraft,
  ticketEntries,
  ticketLength,
  ticketWindow,
  rollingFortnightAt,
  unsureLengths,
  windowLength,
  type TicketDraft,
  type TicketEntry,
  type TicketResort,
} from '@/lib/trip-regions/plan-tickets';
import { tripTicketAnswer } from '@/lib/trip-regions/ticket-answer';
import type { TicketProduct } from '@/lib/trip-regions/types';
import { Badge } from '@/components/ui/badge';
import { usePlanContext, useTripEvents } from './plan-context';
import { PLAN_FOCUS, PlanCheckRow, PlanChip } from './plan-controls';
import { PlanMonthGrid } from './plan-month-grid';
import { oneStop, productName, useHopperWord, useResortWord } from './plan-ticket-words';

/** Whether the ticket question was answered, and how. */
export type TicketAnswer = 'unasked' | 'yes' | 'no';

/** Where the step should put the focus once it is drawn. */
type FocusTarget =
  | { draft: number; field: 'list' | 'start' | 'chosen' | 'fields' | 'was' }
  | { resort: TicketResort; field: 'add' };

/** The element a {@link FocusTarget} names inside the step. */
function focusSelector(focus: FocusTarget): string {
  if ('resort' in focus) return `[data-ticket-add="${focus.resort}"]`;
  const card = `[data-ticket-card="${focus.draft}"]`;
  if (focus.field === 'fields') {
    return `${card} fieldset button, ${card} [data-ticket-start], ${card} [data-ticket-chosen]`;
  }
  if (focus.field === 'was') return `${card} [data-ticket-was], ${card} [data-ticket-list]`;
  return `[data-ticket-${focus.field}="${focus.draft}"]`;
}

/** The step's state and its edits, shared by the phone's sheet and the desk's panel. */
export interface TicketStep {
  answer: TicketAnswer;
  drafts: TicketDraft[];
  /** The visitor opened their tickets from the answer: counted once, and kept for this browser. */
  answerYes: () => void;
  add: (resort: TicketResort) => void;
  addCombo: () => void;
  change: (id: number, patch: Partial<TicketDraft>) => void;
  remove: (id: number) => void;
  /** Put the focus on a written ticket's first day: `index` in `tickets=`. */
  focusTicket: (index: number) => void;
  /** Put the focus on a part of a draft's card once it is drawn. */
  focusDraft: (draft: number, field: 'fields' | 'was') => void;
  focus: FocusTarget | null;
  clearFocus: () => void;
}

/**
 * The ticket step's state. The URL holds only the complete tickets (`tickets=`); a ticket still
 * being filled in lives here until the page is left. A `tickets` the planner did not write (a link,
 * "Use these as your tickets", Parky) replaces the drafts.
 */
export function useTicketStep(): TicketStep {
  const { region, state, update, tickets: catalog, ticketStep: step, today } = usePlanContext();
  const track = useTripEvents();
  const asked = tripTicketAnswer(region.slug);
  const stored = useSyncExternalStore(asked.subscribe, asked.getSnapshot, asked.getServerSnapshot);
  const urlKey = state.tickets.map(writeTicketItem).join(',');
  const fromUrl = () => state.tickets.map((t, i) => ticketDraft(step, t, i + 1, catalog));
  const [own, setOwn] = useState(() => ({ key: urlKey, drafts: fromUrl() }));
  const [focus, setFocus] = useState<FocusTarget | null>(null);

  let current = own;
  if (own.key !== urlKey) {
    current = { key: urlKey, drafts: fromUrl() };
    setOwn(current);
  }
  const drafts = current.drafts;
  const answer: TicketAnswer = state.tickets.length > 0 ? 'yes' : (stored ?? 'unasked');
  const fallbackStart = state.from ?? today;

  const write = (next: TicketDraft[]) => {
    const tickets = next.flatMap((d) => draftTicket(step, d, catalog, fallbackStart).ticket ?? []);
    const key = tickets.map(writeTicketItem).join(',');
    setOwn({ key, drafts: next });
    if (key !== urlKey) update((s) => setTickets(s, tickets, catalog, today));
  };
  const nextId = () => drafts.reduce((max, d) => Math.max(max, d.id), 0) + 1;
  const blank = (id: number, resort: TicketResort, entry: string | null = null): TicketDraft => ({
    id,
    resort,
    entry,
    product: null,
    days: null,
    hopper: null,
    addon: false,
    start: null,
  });

  return {
    answer,
    drafts,
    answerYes: () => {
      if (answer === 'yes') return;
      track('trip_tickets_answered', { answer: 'yes' });
      asked.set('yes');
      write(drafts);
    },
    add: (resort) => {
      if (drafts.length >= MAX_TICKETS) return;
      const id = nextId();
      setOwn({ key: current.key, drafts: [...drafts, blank(id, resort)] });
      setFocus({ draft: id, field: 'list' });
    },
    addCombo: () => {
      if (!step.combo) return;
      const id = nextId();
      const [first, second] = step.combo;
      const added = [
        { ...blank(id, first.resort, first.entry), link: id + 1 },
        { ...blank(id + 1, second.resort, second.entry), link: id },
      ];
      if (drafts.length + added.length > MAX_TICKETS) return;
      for (const d of added) {
        track('trip_ticket_added', {
          entry: d.entry ?? 'none',
          resort: d.resort,
          via: 'combo',
        });
      }
      write([...drafts, ...added]);
      setFocus({ draft: id, field: 'start' });
    },
    change: (id, patch) => {
      const changed = drafts.find((d) => d.id === id);
      // A Combo Ticket's two halves start on the day chosen at booking; the other half follows
      // until the visitor gives it a day of its own.
      const partner =
        patch.start !== undefined && changed?.link !== undefined
          ? drafts.find(
              (d) => d.id === changed.link && (d.start === null || d.start === changed.start)
            )
          : undefined;
      write(
        drafts.map((d) =>
          d.id === id
            ? { ...d, ...patch }
            : d === partner
              ? { ...d, start: patch.start ?? null }
              : d
        )
      );
    },
    remove: (id) => {
      const gone = drafts.find((d) => d.id === id);
      if (gone) {
        track('trip_ticket_removed', { entry: gone.entry ?? 'none', resort: gone.resort });
      }
      write(drafts.filter((d) => d.id !== id));
      if (gone) setFocus({ resort: gone.resort, field: 'add' });
    },
    focusTicket: (index) => {
      let seen = -1;
      for (const d of drafts) {
        if (draftTicket(step, d, catalog, fallbackStart).ticket) seen += 1;
        if (seen === index) {
          setFocus({ draft: d.id, field: 'start' });
          return;
        }
      }
    },
    focusDraft: (draft, field) => setFocus({ draft, field }),
    focus,
    clearFocus: () => setFocus(null),
  };
}

/**
 * The visitor's own tickets, asked for once there is a plan ("Already have tickets?" in the
 * answer): the region's resorts, each with the operator's products as a list, the fields where a
 * product varies, and its window in dates; the region's package offer under them. Without any, the
 * plan suggests what to buy.
 */
export function PlanTickets({
  step,
  defaultMonth,
  wide = false,
}: {
  step: TicketStep;
  defaultMonth?: string;
  /** The desk's panel: resorts two to a row. */
  wide?: boolean;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { live, locale, today, tickets: catalog, config, ticketStep } = usePlanContext();
  const rootRef = useRef<HTMLDivElement>(null);
  const { drafts, focus, clearFocus } = step;

  // The sheet and the panel both hold a step; the one on screen takes the focus.
  useEffect(() => {
    if (!focus) return;
    const frame = requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root || root.offsetParent === null) return;
      const target = root.querySelector<HTMLElement>(focusSelector(focus));
      if (!target) return;
      target.focus();
      clearFocus();
    });
    return () => cancelAnimationFrame(frame);
  }, [focus, clearFocus]);

  const both =
    config.blockResorts?.every((resort) => drafts.some((d) => d.resort === resort)) ?? false;
  // The Combo Ticket's Universal half is the Lite version, without Volcano Bay, for the arrivals
  // Three Park Adventure is sold for.
  const rolling = ticketStep.rollingFortnight;
  const liteSale = rolling
    ? catalog.get(rolling.products[0])?.onSale?.find((r) => r.from && r.to)
    : undefined;
  const saleDay = (d: string) =>
    formatParkDay(locale, d, { day: 'numeric', month: 'short', year: 'numeric' });
  const lite =
    liteSale?.from && liteSale.to && today
      ? { from: saleDay(liteSale.from), to: saleDay(liteSale.to) }
      : null;
  const combo = ticketStep.combo;
  const hasCombo =
    combo !== undefined &&
    ticketStep.fortnight !== undefined &&
    catalog.has(ticketStep.fortnight.product) &&
    (rolling?.products.some((id) => catalog.has(id)) ?? false) &&
    !combo.every((half) => drafts.some((d) => d.entry === half.entry));

  return (
    <div ref={rootRef} className="flex flex-col gap-3" data-plan-tickets="">
      <p className="text-muted-foreground text-sm">{t('lead')}</p>
      <div className={cn('grid gap-3', wide && 'lg:grid-cols-2 lg:items-start')}>
        {ticketStep.resorts.map((resort) => (
          <ResortTickets key={resort} resort={resort} step={step} defaultMonth={defaultMonth} />
        ))}
      </div>
      {drafts.length >= MAX_TICKETS && (
        <p className="text-muted-foreground text-xs">{t('max', { count: MAX_TICKETS })}</p>
      )}
      {both && <p className="text-muted-foreground text-xs leading-snug">{tRegion('mixNote')}</p>}
      {hasCombo && (
        <button
          type="button"
          disabled={!live || drafts.length > MAX_TICKETS - 2}
          onClick={step.addCombo}
          data-ticket-combo=""
          className={cn(
            'border-primary/45 bg-primary/10 hover:bg-primary/15 flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-50',
            PLAN_FOCUS
          )}
        >
          <Ticket className="text-primary-ink size-5 shrink-0" aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
              {tRegion('combo.title')}
              <MarketTag market="intl" />
            </span>
            <span className="text-foreground/75 text-xs leading-snug">
              {tRegion('combo.hint')}
              {lite && ` ${oneStop(tRegion('combo.lite', lite))}`}
            </span>
          </span>
          <Plus className="text-primary-ink size-4 shrink-0" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function ResortTickets({
  resort,
  step,
  defaultMonth,
}: {
  resort: TicketResort;
  step: TicketStep;
  defaultMonth?: string;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { live, tickets: catalog, ticketStep } = usePlanContext();
  const resortWord = useResortWord();
  const drafts = step.drafts.filter((d) => d.resort === resort);
  const full = step.drafts.length >= MAX_TICKETS;
  if (ticketEntries(ticketStep, resort, catalog).length === 0) return null;

  if (drafts.length === 0) {
    return (
      <div className="border-border/60 flex min-h-14 items-center gap-3 rounded-xl border px-3">
        <span className="min-w-0 flex-1 text-sm font-semibold">{tRegion(`resort.${resort}`)}</span>
        <button
          type="button"
          data-ticket-add={resort}
          disabled={!live || full}
          aria-label={t('addLabel', { resort: resortWord(resort) })}
          onClick={() => step.add(resort)}
          className={cn(
            'text-primary-ink hover:bg-primary/10 flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors disabled:opacity-50',
            PLAN_FOCUS
          )}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('add')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {drafts.map((draft) => (
        <TicketCard key={draft.id} draft={draft} step={step} defaultMonth={defaultMonth} />
      ))}
      <button
        type="button"
        data-ticket-add={resort}
        disabled={!live || full}
        onClick={() => step.add(resort)}
        className={cn(
          'text-primary-ink hover:bg-primary/10 flex min-h-11 items-center gap-1.5 self-start rounded-md px-2 text-sm font-medium transition-colors disabled:opacity-50',
          PLAN_FOCUS
        )}
      >
        <Plus className="size-4" aria-hidden="true" />
        {t('addAnother', { resort: resortWord(resort) })}
      </button>
    </div>
  );
}

function TicketCard({
  draft,
  step,
  defaultMonth,
}: {
  draft: TicketDraft;
  step: TicketStep;
  defaultMonth?: string;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { live, tickets: catalog, ticketStep } = usePlanContext();
  const track = useTripEvents();
  const resortWord = useResortWord();
  const headingId = useId();
  const entries = ticketEntries(ticketStep, draft.resort, catalog);
  const entry = entries.find((e) => e.key === draft.entry) ?? null;

  return (
    <section
      aria-labelledby={headingId}
      data-ticket-card={draft.id}
      className="border-border/60 bg-muted/20 flex flex-col gap-3 rounded-xl border p-3"
    >
      <div className="flex items-center gap-2">
        <h4 id={headingId} className="min-w-0 flex-1 text-sm font-semibold">
          {tRegion(`resort.${draft.resort}`)}
        </h4>
        <button
          type="button"
          disabled={!live}
          onClick={() => step.remove(draft.id)}
          aria-label={t('removeLabel', { resort: resortWord(draft.resort) })}
          className={cn(
            'text-muted-foreground hover:bg-accent flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm transition-colors',
            PLAN_FOCUS
          )}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {t('remove')}
        </button>
      </div>
      {entry === null ? (
        <EntryList
          draft={draft}
          entries={entries}
          onPick={(picked) => {
            step.change(draft.id, {
              entry: picked.key,
              product: picked.products.length === 1 ? picked.products[0] : null,
              days: null,
              hopper: null,
              addon: false,
            });
            step.focusDraft(draft.id, 'fields');
            track('trip_ticket_added', {
              entry: picked.key,
              resort: draft.resort,
              via: 'picker',
            });
          }}
        />
      ) : (
        <TicketFields draft={draft} entry={entry} step={step} defaultMonth={defaultMonth} />
      )}
    </section>
  );
}

function EntryList({
  draft,
  entries,
  onPick,
}: {
  draft: TicketDraft;
  entries: TicketEntry[];
  onPick: (entry: TicketEntry) => void;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const { live, region, tickets: catalog, ticketStep } = usePlanContext();
  const homeMarket = ticketHomeMarket(region, ticketStep);
  const resortWord = useResortWord();
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <p id={labelId} className="text-sm font-medium">
        {t('which', { resort: resortWord(draft.resort) })}
      </p>
      <ul
        aria-labelledby={labelId}
        className="border-border/60 divide-border/60 flex flex-col divide-y rounded-lg border"
      >
        {entries.map((entry, index) => (
          <li key={entry.key}>
            <EntryButton
              entry={entry}
              market={entryMarket(entry, catalog, homeMarket)}
              disabled={!live}
              onClick={() => onPick(entry)}
              focusKey={index === 0 ? draft.id : undefined}
              chosen={draft.product !== null && entry.products.includes(draft.product)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EntryButton({
  entry,
  market,
  disabled,
  onClick,
  focusKey,
  chosen,
}: {
  entry: TicketEntry;
  market: 'intl' | null;
  disabled: boolean;
  onClick: () => void;
  focusKey?: number;
  chosen: boolean;
}) {
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const hintId = useId();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-describedby={hintId}
      data-ticket-list={focusKey}
      data-ticket-entry={entry.key}
      data-ticket-was={chosen ? '' : undefined}
      className={cn(
        'hover:bg-accent/40 flex min-h-11 w-full items-start gap-2 px-3 py-2.5 text-left transition-colors',
        PLAN_FOCUS
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
          {tRegion(`entry.${entry.key}.title`)}
          {market && <MarketTag market={market} />}
        </span>
        <EntryHint entry={entry} id={hintId} />
      </span>
      <ChevronRight className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
    </button>
  );
}

function MarketTag({ market }: { market: 'intl' }) {
  const tRegion = useTranslations('tripRegion.planner.tickets');
  return (
    <Badge variant="outline" className="border-primary/50 text-primary-ink font-medium">
      {tRegion(`market.${market}`)}
    </Badge>
  );
}

/** An entry's rule in one line; the 4-Park Magic Ticket's names its arrival dates from `onSale`. */
function EntryHint({ entry, id }: { entry: TicketEntry; id?: string }) {
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { locale, tickets: catalog } = usePlanContext();
  const sale = catalog.get(entry.products[0])?.onSale?.[0];
  const text =
    entry.key === 'wdw-4-park' && sale?.from && sale.to
      ? tRegion(`entry.${entry.key}.hint`, {
          range: formatParkDayRange(locale, sale.from, sale.to, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        })
      : tRegion(`entry.${entry.key}.hint`, { range: '' });
  return (
    <span id={id} className="text-foreground/70 text-xs leading-snug font-normal">
      {text}
    </span>
  );
}

function TicketFields({
  draft,
  entry,
  step,
  defaultMonth,
}: {
  draft: TicketDraft;
  entry: TicketEntry;
  step: TicketStep;
  defaultMonth?: string;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { live, locale, region, state, today, tickets: catalog, ticketStep } = usePlanContext();
  const hopperWord = useHopperWord();
  const fallbackStart = state.from ?? today;
  const set = (patch: Partial<TicketDraft>) => step.change(draft.id, patch);

  const resolved = draftProduct(ticketStep, draft, catalog, fallbackStart);
  // Before a product is told (days not chosen yet), the entry's first product answers what to ask.
  const base = catalog.get(
    entry.addon && draft.addon ? (entry.products[1] ?? entry.products[0]) : entry.products[0]
  ) as TicketProduct;
  const product = (resolved ? catalog.get(resolved) : null) ?? (entry.uk14 ? null : base);
  const { issue } = draftTicket(ticketStep, draft, catalog, fallbackStart);

  const lengths = entry.unsure
    ? unsureLengths(entry, catalog)
    : product
      ? soldLengths(product)
      : null;
  const variantChoice = entry.products.length > 1 && !entry.addon && !entry.uk14 && !entry.unsure;
  const hopperProduct = entry.unsure ? (draft.days === 14 ? null : base) : product;
  const asksHopper = hopperProduct?.hopping === 'optional';
  const variant = entry.addon ? catalog.get(entry.products[1] ?? '') : undefined;
  const variantLengths = variant ? soldLengths(variant) : null;
  const showAddon =
    entry.addon !== undefined &&
    variant !== undefined &&
    (entry.addon === 'waterParks' ||
      draft.addon ||
      !variantLengths ||
      draft.days === null ||
      variantLengths.includes(draft.days));
  const ukOverlap =
    entry.uk14 && draft.start
      ? rollingFortnightAt(ticketStep, catalog, draft.start).length > 1
      : false;
  const hopperName = hopperWord(entry.resort);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="border-primary/45 bg-primary/10 flex items-start gap-2 rounded-lg border px-3 py-2"
        data-ticket-chosen-row={draft.id}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
            {tRegion(`entry.${entry.key}.title`)}
            {entryMarket(entry, catalog, ticketHomeMarket(region, ticketStep)) && (
              <MarketTag market="intl" />
            )}
          </span>
          <EntryHint entry={entry} />
        </span>
        <button
          type="button"
          disabled={!live}
          data-ticket-chosen={draft.id}
          onClick={() => {
            set({ entry: null });
            step.focusDraft(draft.id, 'was');
          }}
          aria-label={t('changeLabel', { name: tRegion(`entry.${entry.key}.title`) })}
          className={cn(
            'text-primary-ink hover:bg-primary/10 -my-1 flex min-h-11 shrink-0 items-center rounded-md px-2 text-sm font-medium transition-colors',
            PLAN_FOCUS
          )}
        >
          {t('change')}
        </button>
      </div>

      {variantChoice && (
        <ChipGroup legend={t('fields.which')}>
          {entry.products.map((id) => (
            <PlanChip
              key={id}
              selected={draft.product === id}
              disabled={!live}
              onClick={() => set({ product: id, days: null })}
              label={tRegion(`variant.${id}`)}
            />
          ))}
        </ChipGroup>
      )}

      {lengths && lengths.length > 1 && (
        <ChipGroup legend={t('fields.days')}>
          {lengths.map((n) => (
            <PlanChip
              key={n}
              selected={draft.days === n}
              disabled={!live}
              onClick={() => set({ days: n })}
              label={n}
              className="min-w-11 px-0"
            />
          ))}
        </ChipGroup>
      )}

      {asksHopper &&
        !(entry.addon === 'volcanoBay' && draft.addon && entry.key === 'uor-dated') && (
          <div className="flex flex-col gap-1">
            <ChipGroup legend={t('fields.hopper', { hopper: hopperName })}>
              {(['yes', 'no', 'unsure'] as const).map((value) => (
                <PlanChip
                  key={value}
                  selected={draft.hopper === value}
                  disabled={!live}
                  onClick={() => set({ hopper: value })}
                  label={t(`fields.hopperAnswer.${value}`)}
                />
              ))}
            </ChipGroup>
            {draft.hopper !== 'yes' && draft.hopper !== 'no' && (
              <p className="text-muted-foreground text-xs">
                {t('fields.hopperUnsure', { hopper: hopperName })}
              </p>
            )}
          </div>
        )}

      {showAddon && (entry.addon !== 'volcanoBay' || entry.key !== 'uor-uk-14') && (
        <PlanCheckRow
          checked={draft.addon}
          disabled={
            !live ||
            (entry.addon === 'waterParks' &&
              draft.days !== null &&
              variantLengths !== null &&
              !variantLengths.includes(draft.days))
          }
          onChange={(addon) => set({ addon })}
          label={tRegion(`fields.${entry.addon}`)}
        />
      )}
      {ukOverlap && (
        <PlanCheckRow
          checked={draft.addon}
          disabled={!live}
          onChange={(addon) => set({ addon })}
          label={tRegion('fields.volcanoBay')}
        />
      )}

      {!product?.pass && !(entry.uk14 === undefined && base.pass) && (
        <StartField
          draft={draft}
          product={product ?? base}
          step={step}
          defaultMonth={defaultMonth}
        />
      )}

      {issue?.kind === 'not_on_sale' && (
        <p className="text-crowd-ink-high text-sm" role="status">
          {oneStop(
            t('fields.notOnSale', {
              name: productName(catalog, issue.product),
              ranges: saleRanges(catalog.get(issue.product), locale, t),
            })
          )}
        </p>
      )}

      {product && !issue && today && <WindowLine draft={draft} entry={entry} product={product} />}
    </div>
  );
}

/** A product's sale ranges as words: "from Jan 3 to May 22, 2027". */
function saleRanges(
  product: TicketProduct | undefined,
  locale: string,
  t: (key: string, values: Record<string, string>) => string
): string {
  const date = (d: string) =>
    formatParkDay(locale, d, { day: 'numeric', month: 'short', year: 'numeric' });
  const parts = (product?.onSale ?? []).map((r) =>
    r.from && r.to
      ? t('fields.saleRange', { from: date(r.from), to: date(r.to) })
      : r.to
        ? t('fields.saleUntil', { date: date(r.to) })
        : t('fields.saleFrom', { date: date(r.from ?? '') })
  );
  return getListFormat(locale, { style: 'long', type: 'disjunction' }).format(parts);
}

function ChipGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * The ticket's first day: a field that opens a month grid in place, empty meaning "not fixed yet",
 * which the plan then picks. Its label follows the product: the start chosen at purchase, the first
 * visit, or Discovery Cove's reserved day.
 */
function StartField({
  draft,
  product,
  step,
  defaultMonth,
}: {
  draft: TicketDraft;
  product: TicketProduct;
  step: TicketStep;
  defaultMonth?: string;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const tDates = useTranslations('tripPlanner.dates');
  const { live, locale, state, today } = usePlanContext();
  const track = useTripEvents();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<string | null>(null);
  const gridId = useId();
  const labelId = useId();
  const fieldRef = useRef<HTMLButtonElement>(null);
  const first = today ? addDays(today, -20) : null;
  const last = today ? addDays(today, MAX_DAYS_AHEAD) : null;
  const shown =
    month ??
    monthOf(draft.start ?? state.from ?? (defaultMonth ? `${defaultMonth}-01` : (today ?? '')));
  const label = product.reservedDayParks?.length
    ? tRegion('fields.startReserved')
    : product.anchor === 'first_use'
      ? t('fields.startFirstUse')
      : t('fields.start');
  const dayLabel = getDateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const pick = (start: string | null) => {
    track('trip_ticket_start', {
      entry: draft.entry ?? 'none',
      resort: draft.resort,
      start: start ? 'set' : 'open',
    });
    step.change(draft.id, { start });
    setOpen(false);
    requestAnimationFrame(() => fieldRef.current?.focus());
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-semibold">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          ref={fieldRef}
          type="button"
          data-ticket-start={draft.id}
          disabled={!live || !today}
          aria-expanded={open}
          aria-controls={gridId}
          aria-labelledby={`${labelId} ${gridId}-value`}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'border-border bg-background hover:bg-accent/40 flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors',
            PLAN_FOCUS
          )}
        >
          <CalendarDays className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          <span id={`${gridId}-value`} className="min-w-0 flex-1 truncate">
            {draft.start && today
              ? formatParkDay(locale, draft.start, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : t('fields.startOpen')}
          </span>
          <ChevronDown
            className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        {draft.start && (
          <button
            type="button"
            disabled={!live}
            onClick={() => pick(null)}
            className={cn(
              'text-muted-foreground hover:bg-accent min-h-11 shrink-0 rounded-md px-2 text-sm transition-colors',
              PLAN_FOCUS
            )}
          >
            {t('fields.startClear')}
          </button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        {draft.start ? t('fields.startHint') : t('fields.startOpenHint')}
      </p>
      <div
        id={gridId}
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          setOpen(false);
          fieldRef.current?.focus();
        }}
        className="border-border/60 rounded-lg border p-2"
      >
        {open && today && (
          <PlanMonthGrid
            month={shown}
            onMonth={setMonth}
            title={monthLabel(shown, locale)}
            locale={locale}
            canPrev={Boolean(first && shown > monthOf(first))}
            canNext={Boolean(last && shown < monthOf(last))}
            prevLabel={tDates('prevMonth')}
            nextLabel={tDates('nextMonth')}
            gridLabel={label}
            preferred={draft.start ?? state.from}
            live={live}
            onPick={pick}
            day={(date) => ({
              enabled: Boolean(first && last && date >= first && date <= last),
              mark: date === draft.start ? 'edge' : null,
              label: dayLabel.format(new Date(`${date}T12:00:00Z`)),
            })}
          />
        )}
      </div>
    </div>
  );
}

/**
 * The ticket's window in dates, which lets the visitor check the planner understood their ticket:
 * "Valid Sun, Feb 7 to Wed, Feb 24: any 14 days in these 18." Read out when it changes, which is
 * only on a press.
 */
function WindowLine({
  draft,
  entry,
  product,
}: {
  draft: TicketDraft;
  entry: TicketEntry;
  product: TicketProduct;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const { locale, tickets: catalog, ticketStep } = usePlanContext();
  const lengths = soldLengths(product);
  const days = lengths && lengths.length > 1 ? draft.days : null;
  if (lengths && lengths.length > 1 && days === null) return null;
  const length = ticketLength(product, days);
  const window = windowLength(product, days);
  if (window === null) return null;
  const everyDay = isEveryDayTicket(product, days);
  const span = ticketWindow(product, { days, start: draft.start });
  const date = (d: string) =>
    formatParkDay(locale, d, { weekday: 'short', day: 'numeric', month: 'short' });
  const lines = [
    span
      ? everyDay
        ? t('window.every', { from: date(span.from), to: date(span.to) })
        : t('window.any', { from: date(span.from), to: date(span.to), days: length ?? 0, window })
      : everyDay
        ? t('window.everyOpen', { window })
        : t('window.anyOpen', { days: length ?? 0, window }),
    entry.unsure ? t('window.unsure') : null,
    entry.uk14 ||
    (entry.unsure && draft.days === 14 && product.resort === ticketStep.rollingFortnight?.resort)
      ? t('window.ukUniversal', { name: productName(catalog, product.id) })
      : null,
  ].filter(Boolean);
  return (
    <p className="flex gap-2 text-sm" aria-live="polite" data-ticket-window={draft.id}>
      <Check className="text-crowd-ink-low mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{oneStop(lines.join(' '))}</span>
    </p>
  );
}
