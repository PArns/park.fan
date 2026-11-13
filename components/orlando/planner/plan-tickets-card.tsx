'use client';

import { useId, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, CircleAlert, ExternalLink, Info, Ticket, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { getListFormat } from '@/lib/utils/intl-format';
import { formatParkDay } from '@/lib/utils/park-day';
import { setParkVisits, type TripPlan } from '@/lib/orlando/plan';
import {
  adoptSuggestions,
  entryOfProduct,
  hopperGains,
  hopperOn,
  longStayTickets,
  needsHogwartsHop,
  ownedUse,
  plannedVisits,
  setTickets,
  suggestionsByStart,
  ticketLength,
  toggleHopper,
  windowLength,
  type HopperGain,
} from '@/lib/orlando/plan-tickets';
import type { PlanHopperVerdict, PlanOwnedTicket, PlanTicketSuggestion } from '@/lib/orlando/plan';
import { orlandoTicketAnswer } from '@/lib/orlando/ticket-answer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PLAN_WIDE_QUERY } from './plan-setup';
import {
  oneStop,
  productName,
  useHopperWord,
  useResortWord,
  useTicketName,
} from './plan-ticket-words';

/** The result's ways back into the setup. */
export interface PlanEdit {
  /** The Tickets step, with the focus on the first day of `tickets=`'s item `index`. */
  tickets: (index?: number) => void;
  parks: () => void;
  options: () => void;
  dates: () => void;
}

/**
 * The tickets at Level 0, after the saving and before the day lines. Plan first, a compact block:
 * the one sentence that names the tickets to buy and "Ticket details", which open in a sheet on a
 * phone and in place at a desk. Owned, "Your tickets": per ticket its validity and how many days the
 * plan uses, and what the visitor can do about a day outside it. Both, "Tickets" with the two
 * halves. Nothing without a catalog or without either.
 */
export function PlanTicketsCard({ plan, edit }: { plan: TripPlan; edit: PlanEdit }) {
  const t = useTranslations('orlandoPlanner.tickets');
  const { tickets: catalog } = usePlanContext();
  const owned = [...(plan.meta.tickets ?? [])].sort((a, b) =>
    (a.start ?? '9').localeCompare(b.start ?? '9')
  );
  const suggested = suggestionsByStart(plan.meta.ticketSuggestion);
  if (catalog.size === 0 || (owned.length === 0 && suggested.length === 0)) return null;
  const both = owned.length > 0 && suggested.length > 0;

  return (
    <section
      aria-labelledby="plan-tickets-title"
      data-plan-tickets-card={both ? 'both' : owned.length > 0 ? 'owned' : 'suggested'}
      className="border-border/60 bg-muted/30 flex flex-col gap-3 rounded-2xl border p-4"
    >
      <div className="flex items-center gap-2">
        <Ticket className="text-primary-ink size-4 shrink-0" aria-hidden="true" />
        <h4 id="plan-tickets-title" className="min-w-0 flex-1 text-sm font-semibold">
          {both ? t('card.both') : owned.length > 0 ? t('card.owned') : t('card.suggested')}
        </h4>
        {owned.length > 0 && (
          <button
            type="button"
            onClick={() => edit.tickets()}
            className={cn(
              'text-primary-ink hover:bg-primary/10 -my-2 min-h-11 rounded-md px-2 text-sm font-medium transition-colors',
              PLAN_FOCUS
            )}
          >
            {t('change')}
          </button>
        )}
      </div>
      {owned.length > 0 && (
        <Half label={both ? t('card.yours') : null}>
          <OwnedTickets plan={plan} owned={owned} edit={edit} />
        </Half>
      )}
      {suggested.length > 0 && (
        <Half label={both ? t('card.toBuy') : null}>
          <SuggestedTickets plan={plan} suggested={suggested} edit={edit} />
        </Half>
      )}
    </section>
  );
}

function Half({ label, children }: { label: string | null; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

/** A date as the card writes it: "Fri, Feb 12". */
function useShortDay(): (date: string) => string {
  const { locale } = usePlanContext();
  return (date) =>
    formatParkDay(locale, date, { weekday: 'short', day: 'numeric', month: 'short' });
}

// ── Owned ─────────────────────────────────────────────────────────────────────

function OwnedTickets({
  plan,
  owned,
  edit,
}: {
  plan: TripPlan;
  owned: PlanOwnedTicket[];
  edit: PlanEdit;
}) {
  const t = useTranslations('orlandoPlanner.tickets');
  const { tickets: catalog } = usePlanContext();
  const resorts = new Set(owned.map((o) => catalog.get(o.product)?.resort));
  // The API reports mixing for any owned ticket; it is news only where Disney and Universal meet.
  const mixing =
    resorts.has('walt-disney-world') && resorts.has('universal-orlando')
      ? plan.meta.mixing
      : undefined;
  return (
    <>
      <ul className="divide-border/60 flex flex-col divide-y">
        {owned.map((ticket) => (
          <OwnedRow key={ticket.id} plan={plan} ticket={ticket} edit={edit} />
        ))}
      </ul>
      {mixing && (mixing.used || mixing.savedMinutesPerRide != null) && (
        <p className="text-foreground/75 text-sm" data-plan-mixing={mixing.used ? 'used' : 'kept'}>
          {mixing.used
            ? mixing.savedMinutesPerRide != null && mixing.savedMinutesPerRide > 0
              ? t('mixing.used', { minutes: Math.round(mixing.savedMinutesPerRide) })
              : t('mixing.forced')
            : t('mixing.kept')}
        </p>
      )}
    </>
  );
}

function OwnedRow({
  plan,
  ticket,
  edit,
}: {
  plan: TripPlan;
  ticket: PlanOwnedTicket;
  edit: PlanEdit;
}) {
  const t = useTranslations('orlandoPlanner.tickets');
  const { tickets: catalog, update, parkName, regionOrder, headliners } = usePlanContext();
  const name = useTicketName();
  const resortWord = useResortWord();
  const hopperWord = useHopperWord();
  const day = useShortDay();
  const product = catalog.get(ticket.product);
  const resort = product?.resort ?? entryOfProduct(ticket.product)?.resort ?? '';
  const use = ownedUse(ticket, catalog);
  const index = Number(ticket.id.slice(1)) - 1;
  const outside = plan.days.filter(
    (d) => d.ticket === ticket.id && d.warnings.includes('outside_ticket_window')
  );
  const plannedParks = plan.days
    .filter((d) => d.ticket === ticket.id)
    .flatMap((d) => d.parks.map((p) => p.slug));
  const warnings = ticket.warnings ?? [];
  const hogwarts =
    resort === 'universal-orlando' &&
    product?.hopping === 'optional' &&
    ticket.hopper === false &&
    needsHogwartsHop(plannedParks);

  return (
    <li className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0" data-plan-owned={ticket.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold">
            {name({
              product: ticket.product,
              days: ticket.days ?? null,
              hopper: ticket.hopper === true ? 'yes' : 'no',
            })}
          </span>
          <span className="text-foreground/75 text-sm">
            {use.kind === 'pass' || !ticket.start
              ? t('owned.noLimit')
              : ticket.startChosen
                ? oneStop(
                    t('owned.startChosen', { start: day(ticket.start), end: day(ticket.end ?? '') })
                  )
                : t('owned.valid', { from: day(ticket.start), to: day(ticket.end ?? '') })}
          </span>
        </div>
        <span className="text-sm tabular-nums" data-plan-owned-use={use.kind}>
          {use.kind === 'counted'
            ? t('owned.used', { used: use.used, days: use.days })
            : use.kind === 'everyDay'
              ? t('owned.usedEvery', { used: use.used, window: use.window })
              : t('owned.passDays', { count: use.used })}
          {ticket.allowanceVisits
            ? ` ${t('owned.allowance', { count: ticket.allowanceVisits })}`
            : ''}
        </span>
      </div>

      {use.kind === 'counted' && use.unused > 0 && (
        <p className="text-foreground/75 text-sm">
          {t(`unused.${KNOWN_UNUSED.has(use.reason ?? '') ? use.reason : 'other'}`, {
            count: use.unused,
          })}
          {use.reason === 'rest_days_kept' && (
            <>
              {' '}
              <InlineAction onClick={edit.options}>{t('unused.restLink')}</InlineAction>
            </>
          )}
        </p>
      )}

      {outside.map((d) => {
        const slug = d.parks[0]?.slug ?? '';
        const before = ticket.start && d.date < ticket.start;
        return (
          <Warning key={d.date} data-plan-outside={d.date}>
            <p>
              {oneStop(
                t(before ? 'outside.before' : 'outside.after', {
                  park: parkName(slug),
                  date: day(d.date),
                  edge: day((before ? ticket.start : ticket.end) ?? d.date),
                })
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update((s) =>
                    setParkVisits(
                      s,
                      slug,
                      Math.max(0, plannedVisits(plan.days, slug) - 1),
                      regionOrder,
                      headliners
                    )
                  )
                }
              >
                {t('outside.leaveOut')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => edit.tickets(index)}>
                {t('outside.changeTicket')}
              </Button>
            </div>
          </Warning>
        );
      })}

      {hogwarts && <Fact icon={Info}>{t('hogwarts')}</Fact>}

      {ticket.hopper === 'unknown' && ticket.hopperVerdict && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {t('owned.ifHopper', { hopper: hopperWord(resort) })}
          </p>
          <Verdict verdict={ticket.hopperVerdict} resort={resort} />
        </div>
      )}

      {warnings.includes('blockouts_unchecked') && (
        <Warning>
          <p>{t('pass.blockouts', { count: use.used, resort: resortWord(resort) })}</p>
          {product?.blockoutUrl && (
            <ShopLink href={product.blockoutUrl}>{t('pass.blockoutLink')}</ShopLink>
          )}
        </Warning>
      )}
      {warnings.includes('park_reservation_needed') && (
        <Fact icon={Info}>
          {t('pass.reservation')}
          {product?.reservationUrl && (
            <>
              {' '}
              <ShopLink href={product.reservationUrl} inline>
                {t('pass.reservationLink')}
              </ShopLink>
            </>
          )}
        </Fact>
      )}
      {warnings.includes('covers_no_planned_park') && (
        <Fact icon={Info}>
          {t('noPlannedPark', { resort: resortWord(resort) })}{' '}
          <InlineAction onClick={edit.parks}>
            {t('noPlannedParkAction', { resort: resortWord(resort) })}
          </InlineAction>
        </Fact>
      )}
    </li>
  );
}

const KNOWN_UNUSED = new Set([
  'parks_fewer_than_days',
  'rest_days_kept',
  'window_outside_trip',
  'no_open_day',
]);

// ── Plan first ────────────────────────────────────────────────────────────────

function SuggestedTickets({
  plan,
  suggested,
  edit,
}: {
  plan: TripPlan;
  suggested: PlanTicketSuggestion[];
  edit: PlanEdit;
}) {
  const t = useTranslations('orlandoPlanner.tickets');
  const { tickets: catalog, update, today, state } = usePlanContext();
  const resortWord = useResortWord();
  const day = useShortDay();
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const longStay = longStayTickets(suggested, catalog, plan.meta.from);
  const owns = (plan.meta.tickets ?? []).length > 0;

  const parts = suggested.map((s) =>
    s.extraDays
      ? t('suggest.partExtra', {
          days: s.days,
          resort: resortWord(s.resort),
          date: day(s.start),
          parkDays: s.days - s.extraDays,
        })
      : t('suggest.part', { days: s.days, resort: resortWord(s.resort), date: day(s.start) })
  );
  const sentence = oneStop(`${parts.join(t('suggest.then'))}.`);
  const details = <SuggestionDetails plan={plan} suggested={suggested} edit={edit} />;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-base font-semibold" data-plan-ticket-sentence="">
        {sentence}
      </p>
      {longStay.length > 0 && !owns && (
        <p className="text-foreground/75 flex flex-wrap items-center gap-x-2 text-sm">
          <span>{t('longStay.line')}</span>
          <InlineAction
            onClick={() => {
              orlandoTicketAnswer.set('yes');
              update((s) => setTickets(s, [...state.tickets, ...longStay], catalog, today));
            }}
          >
            {t('longStay.plan')}
          </InlineAction>
        </p>
      )}
      <div>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={wide ? open : undefined}
          aria-controls={wide ? detailsId : undefined}
          aria-haspopup={wide ? undefined : 'dialog'}
          onClick={() => setOpen((o) => !o)}
          data-plan-ticket-details=""
        >
          {t('details')}
          {wide && (
            <ChevronDown
              className={cn('transition-transform duration-200', open && 'rotate-180')}
              aria-hidden="true"
            />
          )}
        </Button>
      </div>
      {wide ? (
        <div id={detailsId} hidden={!open} className="border-border/60 border-t pt-3">
          {details}
        </div>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" hideClose className="max-h-[90svh] gap-0 rounded-t-2xl p-0">
            <div className="border-border/60 flex items-center gap-2 border-b px-4 py-1.5">
              <SheetTitle className="min-w-0 flex-1 text-base">{t('card.suggested')}</SheetTitle>
              <SheetDescription className="sr-only">{sentence}</SheetDescription>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('close')}
                className={cn(
                  'hover:bg-accent flex size-11 items-center justify-center rounded-md',
                  PLAN_FOCUS
                )}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {details}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function SuggestionDetails({
  plan,
  suggested,
  edit,
}: {
  plan: TripPlan;
  suggested: PlanTicketSuggestion[];
  edit: PlanEdit;
}) {
  const t = useTranslations('orlandoPlanner.tickets');
  const { tickets: catalog, update } = usePlanContext();
  const owns = (plan.meta.tickets ?? []).length > 0;
  const ukShops = new Map<string, string>();
  for (const s of suggested) {
    for (const alt of s.alternatives ?? []) {
      const url = catalog.get(alt.product)?.shopUrl;
      if (alt.reason === 'long_stay' && url) ukShops.set(alt.product, url);
    }
  }

  return (
    <div className="flex flex-col gap-4" data-plan-ticket-details-body="">
      <div className="grid gap-4 lg:grid-cols-2">
        {suggested.map((s) => (
          <SuggestionResort key={s.id} plan={plan} suggestion={s} suggested={suggested} />
        ))}
      </div>
      {ukShops.size > 0 && (
        <div className="flex flex-col gap-1 text-sm">
          <p>{t('longStay.detail')}</p>
          <ul className="flex flex-col">
            {[...ukShops].map(([id, url]) => (
              <li key={id}>
                <ShopLink href={url}>{productName(catalog, id)}</ShopLink>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!owns && (
        <button
          type="button"
          onClick={() => {
            orlandoTicketAnswer.set('yes');
            update((s) => adoptSuggestions(s, suggested, catalog));
            edit.tickets();
          }}
          data-plan-ticket-adopt=""
          className={cn(
            'text-primary-ink hover:bg-primary/10 flex min-h-11 items-center gap-2 self-start rounded-md px-2 text-sm font-medium transition-colors',
            PLAN_FOCUS
          )}
        >
          <Ticket className="size-4" aria-hidden="true" />
          {t('adopt')}
        </button>
      )}
    </div>
  );
}

function SuggestionResort({
  plan,
  suggestion: s,
  suggested,
}: {
  plan: TripPlan;
  suggestion: PlanTicketSuggestion;
  suggested: PlanTicketSuggestion[];
}) {
  const t = useTranslations('orlandoPlanner.tickets');
  const { tickets: catalog, state, update, parkName } = usePlanContext();
  const resortWord = useResortWord();
  const hopperWord = useHopperWord();
  const day = useShortDay();
  const product = catalog.get(s.product);
  const dated = ['wdw-dated', 'uor-dated'].includes(entryOfProduct(s.product)?.key ?? '');
  const window = product ? windowLength(product, s.days) : null;
  const on = hopperOn(state, s.resort);
  const optional = [
    ...new Set(
      suggested.filter((x) => catalog.get(x.product)?.hopping === 'optional').map((x) => x.resort)
    ),
  ];
  const gains = hopperGains(s.hopper);
  const hopper = hopperWord(s.resort);
  const notCovered = (s.notCoveredBy ?? [])
    .map((id) => plan.meta.tickets?.find((o) => o.id === id))
    .filter((o): o is PlanOwnedTicket => Boolean(o));

  return (
    <section className="flex flex-col gap-1.5 text-sm" data-plan-suggestion={s.resort}>
      <h5 className="font-semibold">
        {s.id.endsWith(':2')
          ? t('suggest.second', { resort: t(`resort.${s.resort}`) })
          : t(`resort.${s.resort}`)}
      </h5>
      <p>
        {t('suggest.shape', {
          name: dated ? t('suggest.dated', { days: s.days }) : productName(catalog, s.product),
          from: day(s.start),
          to: day(s.end),
        })}
      </p>
      {s.extraDays ? (
        <p className="text-foreground/75">
          {t('suggest.extraDays', {
            resort: resortWord(s.resort),
            parkDays: s.days - s.extraDays,
            days: s.days,
          })}
        </p>
      ) : null}
      {dated && window !== null && product && (ticketLength(product, s.days) ?? 0) < window && (
        <p className="text-foreground/75">
          {t('suggest.window', { days: s.days, window, resort: resortWord(s.resort) })}
        </p>
      )}
      {notCovered.map((o) => (
        <p key={o.id} className="text-foreground/75">
          {t('suggest.notCovered', {
            name: productName(catalog, o.product),
            parks: s.parks.map(parkName).join(', '),
          })}
        </p>
      ))}
      {s.hopper && (
        <div className="flex flex-col gap-1.5 pt-1">
          <Verdict verdict={s.hopper} resort={s.resort} on={on} />
          {(gains.length > 0 || on) && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              aria-pressed={on}
              data-plan-hopper-toggle={s.resort}
              onClick={() => update((st) => toggleHopper(st, s.resort, optional))}
            >
              {on ? t('hopper.without', { hopper }) : t('hopper.with', { hopper })}
            </Button>
          )}
        </div>
      )}
      {s.resort === 'universal-orlando' && needsHogwartsHop(s.parks) && (
        <Fact icon={Info}>{t('hogwarts')}</Fact>
      )}
      {(s.alternatives ?? [])
        .filter((a) => a.reason === 'promotion' && catalog.has(a.product))
        .map((a) => (
          <p key={a.product} className="text-foreground/75">
            {t('suggest.promotion', { name: productName(catalog, a.product) })}
          </p>
        ))}
      {(s.shopUrl ?? product?.shopUrl) && (
        <ShopLink href={(s.shopUrl ?? product?.shopUrl) as string}>
          {t('shop', { operator: resortWord(s.resort) })}
        </ShopLink>
      )}
    </section>
  );
}

/**
 * What the hopper adds, from the fields the API sends: a pill only where the API recommends it,
 * then each gain as a line, or that it adds nothing.
 */
function Verdict({
  verdict,
  resort,
  on = false,
}: {
  verdict: PlanHopperVerdict;
  resort: string;
  on?: boolean;
}) {
  const t = useTranslations('orlandoPlanner.tickets.hopper');
  const { parkName, locale } = usePlanContext();
  const hopperWord = useHopperWord();
  const day = useShortDay();
  const gains = hopperGains(verdict);
  const hopper = hopperWord(resort);
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const line = (gain: HopperGain): string => {
    switch (gain.kind) {
      case 'evening':
        return t('evening', { park: parkName(gain.park), date: day(gain.date) });
      case 'evenings':
        return t('evenings', { count: gain.count });
      case 'hopDay':
        return t('hopDay', { parks: list.format(gain.parks.map(parkName)), date: day(gain.date) });
      case 'hopDays':
        return t('hopDays', { count: gain.count });
      case 'fits':
        return t('fits', {
          parks: list.format(gain.parks.map(parkName)),
          count: gain.parks.length,
        });
      case 'minutes':
        return t('minutes', { minutes: gain.minutes });
    }
  };
  return (
    <div className="flex flex-col gap-1" data-plan-verdict={verdict.recommended ? 'yes' : 'no'}>
      {verdict.recommended && (
        <Badge variant="outline" className="border-primary/50 text-primary-ink">
          {t('worth', { hopper })}
        </Badge>
      )}
      {gains.length === 0 ? (
        <p className="text-foreground/75">{t(on ? 'nothingOn' : 'nothing', { hopper })}</p>
      ) : (
        <>
          <p className="text-foreground/75">{t(on ? 'addsOn' : 'adds', { hopper })}</p>
          <ul className="flex list-disc flex-col gap-0.5 pl-5">
            {gains.map((gain, i) => (
              <li key={i}>{line(gain)}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ── Small parts ───────────────────────────────────────────────────────────────

function Fact({ icon: Icon, children }: { icon: typeof Info; children: ReactNode }) {
  return (
    <p className="flex gap-2 text-sm">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}

function Warning({ children, ...data }: { children: ReactNode; [key: `data-${string}`]: string }) {
  return (
    <div className="text-crowd-ink-high flex gap-2 text-sm" role="note" {...data}>
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function InlineAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-primary-ink inline-flex min-h-11 items-center rounded-sm font-medium underline-offset-4 hover:underline',
        PLAN_FOCUS
      )}
    >
      {children}
    </button>
  );
}

/** An operator's page, in a new tab, which a screen reader is told. */
function ShopLink({
  href,
  inline = false,
  children,
}: {
  href: string;
  inline?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations('orlandoPlanner.tickets');
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'text-primary-ink items-center gap-1 font-medium underline-offset-4 hover:underline',
        inline ? 'inline-flex' : 'inline-flex min-h-11 self-start py-2',
        PLAN_FOCUS
      )}
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t('newTab')}</span>
    </a>
  );
}
