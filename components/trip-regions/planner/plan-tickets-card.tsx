'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, CircleAlert, ExternalLink, Info, Moon, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatParkDayRange, formatParkDay } from '@/lib/utils/park-day';
import { getListFormat } from '@/lib/utils/intl-format';
import { setParkVisits, type TripPlan } from '@/lib/trip-regions/plan';
import {
  adoptSuggestions,
  entryOfProduct,
  hopperHighlights,
  hopperOn,
  linkMarket,
  longStayTickets,
  needsConnectedHop,
  officialTicketLink,
  orderTicketLinks,
  orderTicketPackages,
  orderTicketPicks,
  ownedUse,
  ticketLinkAttributes,
  ticketLinkGroups,
  plannedVisits,
  primaryTicketLink,
  setTickets,
  suggestionGroups,
  suggestionsByStart,
  ticketHomeMarket,
  ticketFacts,
  ticketLength,
  ticketStoreName,
  ticketWindowDays,
  toggleHopper,
  windowLength,
  visitorMarket,
  type HopperHighlight,
  type SuggestionGroup,
  type TicketCatalog,
  type TicketFact,
  type TicketLinkVisitor,
} from '@/lib/trip-regions/plan-tickets';
import type { TicketLink } from '@/lib/trip-regions/types';
import { ticketLinkClickProps, ticketModeOf } from '@/lib/trip-regions/plan-analytics';
import {
  trackSiteEvent,
  type TicketLinkSurface,
  type TicketMode,
  type TripEditFrom,
  type TripTicketsFrom,
} from '@/lib/analytics/site-analytics';
import type {
  PlanHopperVerdict,
  PlanOwnedTicket,
  PlanTicketSuggestion,
} from '@/lib/trip-regions/plan';
import { tripTicketAnswer } from '@/lib/trip-regions/ticket-answer';
import { tripPlannerUi } from '@/lib/trip-regions/planner-ui';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button, buttonLinkProps } from '@/components/ui/button';
import { usePlanContext, useTripEvents } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import {
  productName,
  TicketMarketTag,
  useHopperWord,
  useResortWord,
  useTicketName,
} from './plan-ticket-words';
import { oneFullStop } from '@/lib/utils/metadata';

/** The result's ways back into the assistant's steps, each told where it was pressed (for the statistic). */
export interface PlanEdit {
  /** The Tickets step, with the focus on the first day of `tickets=`'s item `index`. */
  tickets: (from: TripTicketsFrom, index?: number) => void;
  parks: (from: TripEditFrom) => void;
  dates: (from: TripEditFrom) => void;
}

/**
 * The tickets at Level 0, after the saving and before the day lines, and under the assistant's
 * "Not yet". Plan first: one line that names the tickets to buy, the recommendation with a buy
 * button per ticket and the long stay's 14-day tickets as the package beside it, then a line per
 * ticket that opens on its park days, its window and its rules. Owned,
 * "Your tickets": per ticket its validity and how many days the plan uses, and what the visitor can
 * do about a day outside it. Both, "Tickets" with the two halves. Nothing without a catalog or
 * without either.
 */
export function PlanTicketsCard({
  plan,
  edit,
  ask,
}: {
  plan: TripPlan;
  edit: PlanEdit;
  /** "Already have tickets?", at the card's foot, or alone where there is no card. */
  ask?: ReactNode;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const { tickets: catalog } = usePlanContext();
  const owned = [...(plan.meta.tickets ?? [])].sort((a, b) =>
    (a.start ?? '9').localeCompare(b.start ?? '9')
  );
  const suggested = suggestionsByStart(plan.meta.ticketSuggestion);
  if (catalog.size === 0 || (owned.length === 0 && suggested.length === 0)) return ask ?? null;
  const both = owned.length > 0 && suggested.length > 0;

  return (
    <section
      aria-labelledby="plan-tickets-title"
      data-plan-tickets-card={both ? 'both' : owned.length > 0 ? 'owned' : 'suggested'}
      className="border-border/60 bg-muted/30 @container flex flex-col gap-3 rounded-2xl border p-4"
    >
      <div className="flex items-center gap-2">
        <Ticket className="text-primary-ink size-4 shrink-0" aria-hidden="true" />
        <h4 id="plan-tickets-title" className="min-w-0 flex-1 text-sm font-semibold">
          {both ? t('card.both') : owned.length > 0 ? t('card.owned') : t('card.suggested')}
        </h4>
        {owned.length > 0 && (
          <button
            type="button"
            onClick={() => edit.tickets('card')}
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
      {ask}
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
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { tickets: catalog, config } = usePlanContext();
  const resorts = new Set(owned.map((o) => catalog.get(o.product)?.resort));
  // The API reports mixing for any owned ticket; it is news only where the region's two block
  // resorts (Disney and Universal) meet.
  const mixing =
    config.blockResorts && config.blockResorts.every((resort) => resorts.has(resort))
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
              ? tRegion('mixing.used', { minutes: Math.round(mixing.savedMinutesPerRide) })
              : tRegion('mixing.forced')
            : tRegion('mixing.kept')}
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
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const {
    tickets: catalog,
    ticketStep,
    update,
    parkName,
    regionOrder,
    headliners,
    locale,
  } = usePlanContext();
  const track = useTripEvents();
  const name = useTicketName();
  const resortWord = useResortWord();
  const hopperWord = useHopperWord();
  const day = useShortDay();
  const product = catalog.get(ticket.product);
  const resort = product?.resort ?? entryOfProduct(ticketStep, ticket.product)?.resort ?? '';
  const use = ownedUse(ticket, catalog);
  const index = Number(ticket.id.slice(1)) - 1;
  const outside = plan.days.filter(
    (d) => d.ticket === ticket.id && d.warnings.includes('outside_ticket_window')
  );
  // Only the rest days the trip has inside the ticket's window are days it could still use.
  const restDays = plan.days.filter(
    (d) =>
      d.kind === 'rest' &&
      ticket.start !== undefined &&
      ticket.end !== undefined &&
      d.date >= ticket.start &&
      d.date <= ticket.end
  );
  const plannedParks = plan.days
    .filter((d) => d.ticket === ticket.id)
    .flatMap((d) => d.parks.map((p) => p.slug));
  const warnings = ticket.warnings ?? [];
  const hogwarts =
    resort === ticketStep.connectedParks?.resort &&
    product?.hopping === 'optional' &&
    ticket.hopper === false &&
    needsConnectedHop(ticketStep, plannedParks);

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
                ? oneFullStop(
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

      {use.kind === 'counted' && use.unused > 0 && use.reason === 'rest_days_kept'
        ? restDays.length > 0 && (
            <p className="text-foreground/75 text-sm" data-plan-owned-rest="">
              {t('unused.restDays', {
                count: restDays.length,
                dates: getListFormat(locale, { style: 'long', type: 'conjunction' }).format(
                  restDays.map((d) => day(d.date))
                ),
              })}{' '}
              <InlineAction onClick={() => update((s) => ({ ...s, rest: 'none' }))}>
                {t('unused.makeParkDay', { count: restDays.length })}
              </InlineAction>
            </p>
          )
        : use.kind === 'counted' &&
          use.unused > 0 && (
            <p className="text-foreground/75 text-sm">
              {t(`unused.${KNOWN_UNUSED.has(use.reason ?? '') ? use.reason : 'other'}`, {
                count: use.unused,
              })}
            </p>
          )}

      {outside.map((d) => {
        const slug = d.parks[0]?.slug ?? '';
        const before = ticket.start && d.date < ticket.start;
        return (
          <Warning key={d.date} data-plan-outside={d.date}>
            <p>
              {oneFullStop(
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
                onClick={() => {
                  track('trip_outside_ticket_action', { action: 'leave_out' });
                  update((s) =>
                    setParkVisits(
                      s,
                      slug,
                      Math.max(0, plannedVisits(plan.days, slug) - 1),
                      regionOrder,
                      headliners
                    )
                  );
                }}
              >
                {t('outside.leaveOut')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  track('trip_outside_ticket_action', { action: 'change_ticket' });
                  edit.tickets('outside_ticket', index);
                }}
              >
                {t('outside.changeTicket')}
              </Button>
            </div>
          </Warning>
        );
      })}

      {warnings.includes('product_archived') && <Fact icon={Info}>{t('owned.archived')}</Fact>}

      {hogwarts && <Fact icon={Info}>{tRegion('hogwarts')}</Fact>}

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
          <InlineAction onClick={() => edit.parks('ticket_card')}>
            {t('noPlannedParkAction', { resort: resortWord(resort) })}
          </InlineAction>
        </Fact>
      )}
    </li>
  );
}

const KNOWN_UNUSED = new Set(['parks_fewer_than_days', 'window_outside_trip', 'no_open_day']);

// ── Plan first ────────────────────────────────────────────────────────────────

/**
 * Plan first: the tickets to buy, named in one line under the card's title, then the
 * recommendation as packages to compare with a buy button per ticket (`TicketPick`), then one line
 * per ticket that opens on its days and rules (`SuggestionRow`), then "Use these as your tickets".
 */
function SuggestedTickets({
  plan,
  suggested,
  edit,
}: {
  plan: TripPlan;
  suggested: PlanTicketSuggestion[];
  edit: PlanEdit;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const { region, tickets: catalog, update } = usePlanContext();
  const track = useTripEvents();
  const resortWord = useResortWord();
  const owns = (plan.meta.tickets ?? []).length > 0;

  // Where a resort sells only day tickets (Tokyo Disney Resort), the plan needs several of one
  // kind: one ticket per resort with the count, not one per day.
  const groups = suggestionGroups(suggested);
  const grouped = groups.length < suggested.length;
  const parts = grouped
    ? groups.map((g) =>
        t('suggest.group', { resort: resortWord(g.resort), count: g.items.length, days: g.days })
      )
    : suggested.map((s) => t('named.datedShort', { resort: resortWord(s.resort), days: s.days }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-foreground/75 text-sm" data-plan-ticket-sentence="">
        {parts.join(grouped ? t('suggest.groupSep') : t('suggest.then'))}
      </p>
      <TicketPick
        plan={plan}
        groups={groups}
        suggested={suggested}
        longStay={longStayProducts(suggested, catalog)}
      />
      <div className="flex flex-col gap-1">
        <h5 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t('pick.details')}
        </h5>
        <ul className="divide-border/60 flex flex-col divide-y">
          {groups.map((g) => (
            <SuggestionRow key={g.items[0].id} plan={plan} group={g} suggested={suggested} />
          ))}
        </ul>
      </div>
      {!owns && (
        <button
          type="button"
          onClick={() => {
            track('trip_tickets_adopted', { count: suggested.length });
            tripTicketAnswer(region.slug).set('yes');
            update((s) => adoptSuggestions(s, suggested, catalog));
            edit.tickets('adopt');
          }}
          data-plan-ticket-adopt=""
          className={cn(
            'text-primary-ink hover:bg-primary/10 -my-1 flex min-h-11 items-center gap-2 self-start rounded-md px-2 text-sm font-medium transition-colors',
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

/** Where a suggestion is bought: its own links, else its product's in the catalog. */
function suggestionShop(
  suggestion: PlanTicketSuggestion,
  catalog: TicketCatalog
): { links?: readonly TicketLink[]; shopUrl?: string } {
  return suggestion.links?.length || suggestion.shopUrl
    ? suggestion
    : (catalog.get(suggestion.product) ?? {});
}

/** The 14-day tickets the suggestions name as a long stay's alternative, once each, in the catalog. */
function longStayProducts(
  suggested: readonly PlanTicketSuggestion[],
  catalog: TicketCatalog
): string[] {
  return [
    ...new Set(
      suggested.flatMap((s) =>
        (s.alternatives ?? []).filter((a) => a.reason === 'long_stay').map((a) => a.product)
      )
    ),
  ].filter((id) => catalog.has(id));
}

/** One ticket the recommendation names, with the link it is bought through and the shop's own. */
interface PickItem {
  key: string;
  resort: string;
  product: string;
  /** "Universal 5 days + Park-to-Park", "Disney 14-Day Magic Ticket". */
  name: string;
  /** What the catalog says it holds, for a long stay's ticket. */
  facts: TicketFact[];
  buy: TicketLink | null;
  official: TicketLink | null;
  /** How many shops sell it, for the line that prices differ between them. */
  links: number;
  surface: TicketLinkSurface;
}

/** The recommendation's tickets as {@link PickItem}s, each with its links in the visitor's order. */
function usePickItems(
  groups: readonly SuggestionGroup[],
  longStay: readonly string[]
): { exact: PickItem[]; long: PickItem[] } {
  const t = useTranslations('tripPlanner.tickets');
  const { tickets: catalog } = usePlanContext();
  const name = useTicketName();
  const resortWord = useResortWord();
  const item = (
    key: string,
    resort: string,
    product: string,
    label: string,
    source: { links?: readonly TicketLink[]; shopUrl?: string },
    surface: TicketLinkSurface,
    facts: TicketFact[]
  ): PickItem => {
    const ordered = orderTicketLinks(source, resortWord(resort));
    return {
      key,
      resort,
      product,
      name: label,
      facts,
      buy: primaryTicketLink(ordered),
      official: officialTicketLink(ordered),
      links: ordered.length,
      surface,
    };
  };
  const picks = {
    exact: groups.map((g) => {
      const worth = g.items.some((s) => s.hopper?.recommended);
      const label = name({ product: g.product, days: g.days, hopper: worth ? 'yes' : 'no' }, true);
      return item(
        g.items[0].id,
        g.resort,
        g.product,
        g.items.length > 1 ? t('suggest.count', { count: g.items.length, name: label }) : label,
        suggestionShop(g.items[0], catalog),
        'suggestion',
        []
      );
    }),
    long: longStay.flatMap((id) => {
      const product = catalog.get(id);
      if (!product) return [];
      return [
        item(
          id,
          product.resort,
          id,
          name({ product: id, days: null, hopper: 'no' }, true),
          product,
          'long_stay',
          ticketFacts(product, null)
        ),
      ];
    }),
  };
  return {
    exact: orderTicketPicks(picks.exact, catalog),
    long: orderTicketPicks(picks.long, catalog),
  };
}

/**
 * The recommendation at the top of plan first, as packages to compare by their park days: the
 * tickets this plan needs ("Fits this plan · 12 park days"), and where the region sells 14-day
 * tickets for a long stay, those with what the catalog says they hold and "Plan with these". Each
 * ticket has one button to the seller it is bought through (`primaryTicketLink`: a sponsored seller
 * first, else the first that is not the operator's, in the admin's order), the operators' own shops
 * in a line under them, and the line that prices differ by the shop's country once. Tickets and
 * packages follow the admin's order (`orderTicketPicks`, `orderTicketPackages`). A sponsored link
 * moves up for being one, so with one in it the block is marked as an ad, its note saying what that
 * means, and the link says "Partner link"; without one, neither shows.
 */
function TicketPick({
  plan,
  groups,
  suggested,
  longStay,
}: {
  plan: TripPlan;
  groups: readonly SuggestionGroup[];
  suggested: PlanTicketSuggestion[];
  longStay: readonly string[];
}) {
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { region, tickets: catalog, ticketStep, update, today, state } = usePlanContext();
  const track = useTripEvents();
  const { exact, long } = usePickItems(groups, longStay);
  const owns = (plan.meta.tickets ?? []).length > 0;
  const plannable = owns ? [] : longStayTickets(ticketStep, suggested, catalog, plan.meta.from);
  const longShown = (long.length > 0 || plannable.length > 0) && tRegion.has('longStay.title');
  const packages = orderTicketPackages(longShown ? [exact, long] : [exact], (p) => p, catalog);
  const shown = packages.flat();
  if (shown.every((i) => !i.buy)) return null;
  const ticketMode = ticketModeOf(plan.meta.tickets?.length ?? 0, suggested.length);
  // Each link's place among the buttons the block draws, which the statistic counts: the tickets'
  // buttons in order, the operators' shops after them.
  const position = new Map(shown.map((i, index) => [i.key, index]));
  const linkProps = (i: PickItem) => ({ product: i.product, surface: i.surface, ticketMode });
  const longDays = long.reduce((sum, i) => {
    const fact = i.facts.find((f) => f.kind !== 'hopping');
    return (
      sum + (fact?.kind === 'daysIn' ? fact.days : fact?.kind === 'everyDay' ? fact.window : 0)
    );
  }, 0);

  return (
    <section className="flex flex-col gap-2" data-plan-ticket-pick="">
      <div className="flex items-center justify-between gap-2">
        <h5 className="text-primary-ink text-xs font-semibold tracking-wide uppercase">
          {t('pick.title')}
        </h5>
        {shown.some((i) => i.buy?.sponsored) && <PartnerLabel label={t('pick.ad')} />}
      </div>
      {packages.map((items, at) => {
        const officialBase = shown.length + packages.slice(0, at).flat().length;
        return items === exact ? (
          <PickPackage
            key="exact"
            title={t('pick.exact')}
            meta={t('pick.parkDays', {
              count: groups.reduce((sum, g) => sum + g.days * g.items.length, 0),
            })}
            tone="primary"
            items={exact}
            linkProps={linkProps}
            position={position}
            officialBase={officialBase}
          />
        ) : (
          <PickPackage
            key="long"
            title={tRegion('longStay.title')}
            meta={t('pick.parkDays', { count: longDays })}
            items={long}
            linkProps={linkProps}
            position={position}
            officialBase={officialBase}
            lead={
              <p className="text-foreground/75 text-sm">
                {tRegion('longStay.line')}
                {plannable.length > 0 && (
                  <>
                    {' '}
                    <InlineAction
                      inText
                      data-plan-long-stay=""
                      onClick={() => {
                        track('trip_long_stay_used', { count: plannable.length });
                        tripTicketAnswer(region.slug).set('yes');
                        update((s) =>
                          setTickets(s, [...state.tickets, ...plannable], catalog, today)
                        );
                      }}
                    >
                      {tRegion('longStay.plan')}
                    </InlineAction>
                  </>
                )}
              </p>
            }
            alternative
          />
        );
      })}
      {shown.some((i) => i.links > 1) && (
        <p className="text-muted-foreground text-xs">{t('links.compare')}</p>
      )}
    </section>
  );
}

/**
 * A package of the recommendation: its title and park days on one line, an optional `lead` under
 * them, then its tickets ({@link PickGroup}); the plan's own in the primary tint.
 */
function PickPackage({
  title,
  meta,
  tone,
  items,
  linkProps,
  position,
  officialBase,
  lead,
  alternative = false,
}: {
  title: string;
  meta: string;
  tone?: 'primary';
  items: readonly PickItem[];
  linkProps: PickLinkProps;
  position: ReadonlyMap<string, number>;
  officialBase: number;
  lead?: ReactNode;
  alternative?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-3',
        tone === 'primary' ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-background'
      )}
      data-plan-ticket-alternative={alternative ? '' : undefined}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h6 className="text-sm font-semibold">{title}</h6>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{meta}</span>
      </div>
      {lead}
      <PickGroup
        items={items}
        linkProps={linkProps}
        position={position}
        officialBase={officialBase}
        tone={tone}
      />
    </div>
  );
}

/** What a recommendation's link counts with besides its place: its product, surface and mode. */
type PickLinkProps = (i: PickItem) => {
  product: string;
  surface: TicketLinkSurface;
  ticketMode: TicketMode;
};

/**
 * Some tickets bought together: each with what it holds, the seller once where they share one
 * ("Buy at Attraction Tickets", its store too where they share that), then a compact button per
 * ticket named by its resort (and its store's currency where the stores differ), `action` after
 * them, and the operators' own shops in a line.
 */
function PickGroup({
  items,
  linkProps,
  position,
  officialBase,
  tone,
}: {
  items: readonly PickItem[];
  linkProps: PickLinkProps;
  position: ReadonlyMap<string, number>;
  officialBase: number;
  tone?: 'primary';
}) {
  const t = useTranslations('tripPlanner.tickets');
  const resortWord = useResortWord();
  const factLine = useFactLine();
  const { locale } = usePlanContext();
  const buys = items.flatMap((i) => (i.buy ? [i.buy] : []));
  const sameSeller =
    buys.length > 0 && buys.every((b) => b.seller === buys[0].seller && !b.official);
  const sameStore = sameSeller && buys.every((b) => buyKey(b) === buyKey(buys[0]));
  // The seller's line says "Partner link" for all of them, or each sponsored button for itself.
  const allSponsored = sameSeller && buys.every((b) => b.sponsored);
  const label = (i: PickItem, buy: TicketLink) =>
    sameStore
      ? resortWord(i.resort)
      : sameSeller && buy.store
        ? `${resortWord(i.resort)} (${ticketStoreName(buy.store, locale).currency})`
        : null;
  return (
    <>
      <ul className="flex flex-col gap-1 text-sm">
        {items.map((i) => (
          <li key={i.key} data-plan-pick={i.resort}>
            <span className="font-medium">{i.name}</span>
            {i.facts.length > 0 && (
              <span className="text-foreground/75 block text-xs">{factLine(i)}</span>
            )}
          </li>
        ))}
      </ul>
      {sameSeller && (
        <p className="text-foreground/75 text-xs">
          {t('pick.via')}{' '}
          <span className="whitespace-nowrap">
            {sameStore ? <BuyLabel link={buys[0]} /> : buys[0].seller}
          </span>
          {allSponsored && <PartnerWord />}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {items.map((i) => {
          if (!i.buy) return null;
          const short = label(i, i.buy);
          return (
            <span key={i.key} className="inline-flex max-w-full items-center">
              <BuyLink
                link={i.buy}
                index={position.get(i.key) ?? 0}
                tone={tone === 'primary' ? 'primary' : 'outline'}
                {...linkProps(i)}
              >
                {short ?? <BuyLabel link={i.buy} prefix={resortWord(i.resort)} />}
                {short && <span className="sr-only">{`, ${i.buy.seller}`}</span>}
              </BuyLink>
              {i.buy.sponsored && !allSponsored && <PartnerWord />}
            </span>
          );
        })}
      </div>
      <OfficialShops items={items} base={officialBase} linkProps={linkProps} />
    </>
  );
}

const buyKey = (link: TicketLink) => `${link.seller}|${link.store?.country ?? ''}`;

/** A ticket's facts in one line: "14 days in 18 · Park Hopper included". */
function useFactLine(): (item: PickItem) => string {
  const t = useTranslations('tripPlanner.tickets.pick');
  const hopperWord = useHopperWord();
  return (item) =>
    item.facts
      .map((fact) =>
        fact.kind === 'daysIn'
          ? t('daysIn', { days: fact.days, window: fact.window })
          : fact.kind === 'everyDay'
            ? t('everyDay', { window: fact.window })
            : t('hopping', { hopper: hopperWord(item.resort) })
      )
      .join(' · ');
}

/**
 * The operators' own shops of some tickets in one quiet line, once each, so the official way to
 * buy is always on the card.
 */
function OfficialShops({
  items,
  base,
  linkProps,
}: {
  items: readonly PickItem[];
  base: number;
  linkProps: PickLinkProps;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const resortWord = useResortWord();
  const shops = items.filter(
    (i, index) =>
      i.official &&
      i.official.url !== i.buy?.url &&
      items.findIndex((x) => x.official?.url === i.official?.url) === index
  );
  if (shops.length === 0) return null;
  return (
    <p className="text-muted-foreground text-xs" data-plan-official-shops="">
      {t('pick.official', { count: shops.length })}{' '}
      {shops.map((i, index) => (
        <span key={i.key}>
          {index > 0 && ' · '}
          <BuyLink
            link={i.official as TicketLink}
            index={base + index}
            tone="text"
            {...linkProps(i)}
          >
            {resortWord(i.resort)}
            <span className="sr-only">{`, ${(i.official as TicketLink).seller}`}</span>
          </BuyLink>
        </span>
      ))}
    </p>
  );
}

/**
 * One ticket of plan first as a line: the resort, the product, its window and how many of its
 * days the plan uses. It opens on the park days as chips with their dates, the window as a bar,
 * what the hopper adds with the way to plan with it or without, how the ticket works, and every
 * shop. A group of day tickets (`suggestionGroups`) is one line with its count.
 */
function SuggestionRow({
  plan,
  group,
  suggested,
}: {
  plan: TripPlan;
  group: SuggestionGroup;
  suggested: PlanTicketSuggestion[];
}) {
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { tickets: catalog, ticketStep, state, update, parkName, locale } = usePlanContext();
  const track = useTripEvents();
  const resortWord = useResortWord();
  const hopperWord = useHopperWord();
  const day = useShortDay();
  const { resort, items } = group;
  const first = items[0];
  const product = catalog.get(group.product);
  const dated = entryOfProduct(ticketStep, group.product)?.dated === true;
  const productLabel = dated
    ? t('suggest.dated', { days: group.days })
    : productName(catalog, group.product);
  const ids = new Set(items.map((s) => s.id));
  const parkDays = plan.days.filter(
    (d) => d.ticket !== undefined && ids.has(d.ticket) && d.parks.length > 0
  );
  const chipDates = new Set(parkDays.map((d) => d.date));
  const hopper = hopperWord(resort);
  const evenings = new Map(
    items.flatMap((s) =>
      (s.hopper?.eveningHopList ?? []).flatMap((e): Array<[string, string]> =>
        e.parks[1] ? [[e.date, e.parks[1]]] : []
      )
    )
  );
  const on = hopperOn(state, resort);
  const verdicts = items.flatMap((s) => (s.hopper ? [s.hopper] : []));
  const gains = verdicts.some((v) => hopperHighlights(v).length > 0);
  const optional = [
    ...new Set(
      suggested.filter((x) => catalog.get(x.product)?.hopping === 'optional').map((x) => x.resort)
    ),
  ];
  const notCovered = [...new Set(items.flatMap((s) => s.notCoveredBy ?? []))]
    .map((id) => plan.meta.tickets?.find((o) => o.id === id))
    .filter((o): o is PlanOwnedTicket => Boolean(o));
  const plannedParks = [...new Set(items.flatMap((s) => s.parks))];
  const window = product ? windowLength(product, group.days) : null;
  const promotions = [
    ...new Set(
      items.flatMap((s) =>
        (s.alternatives ?? [])
          .filter((a) => a.reason === 'promotion' && catalog.has(a.product))
          .map((a) => a.product)
      )
    ),
  ];
  const facts = [
    dated && window !== null && product && (ticketLength(product, group.days) ?? 0) < window ? (
      <p key="window">
        {t('suggest.window', { days: group.days, window, resort: resortWord(resort) })}
      </p>
    ) : null,
    ...items.map((s) =>
      s.extraDays ? (
        <p key={`extra:${s.id}`}>
          {t('suggest.extraDays', {
            resort: resortWord(resort),
            parkDays: s.days - s.extraDays,
            days: s.days,
          })}
        </p>
      ) : null
    ),
    resort === ticketStep.connectedParks?.resort && needsConnectedHop(ticketStep, plannedParks) ? (
      <Fact key="hogwarts" icon={Info}>
        {tRegion('hogwarts')}
      </Fact>
    ) : null,
    ...promotions.map((id) => (
      <p key={`promotion:${id}`}>{t('suggest.promotion', { name: productName(catalog, id) })}</p>
    )),
  ].filter(Boolean);
  const toggle = (gains || on) && (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={on}
      data-plan-hopper-toggle={resort}
      onClick={() => {
        track('trip_hopper_toggled', { resort, on: !on });
        update((st) => toggleHopper(st, resort, optional));
      }}
    >
      {on ? t('hopper.without', { hopper }) : t('hopper.with', { hopper })}
    </Button>
  );
  const used = (s: PlanTicketSuggestion) =>
    new Set(plan.days.filter((d) => d.ticket === s.id && !d.ticketAllowance).map((d) => d.date));
  const everyOnItsDay = items.every((s) => s.start === s.end);
  const summary = everyOnItsDay
    ? t('suggest.eachOnItsDay', { count: items.length })
    : items
        .map(
          (s) =>
            `${formatParkDayRange(locale, s.start, s.end, { day: 'numeric', month: 'short' })} · ${t(
              'suggest.inWindow',
              { used: used(s).size, window: ticketWindowDays(s.start, s.end, used(s)).length }
            )}`
        )
        .join('; ');

  return (
    <li className="min-w-0" data-plan-suggestion={resort}>
      <details
        className="group/row"
        onToggle={(event) =>
          event.currentTarget.open && track('trip_ticket_details_opened', { resort })
        }
        data-plan-ticket-facts={resort}
      >
        {/* On a phone Parky's launcher floats over the card's right edge; the room keeps the
            chevron beside it rather than under it. */}
        <summary
          className={cn(
            'flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md py-2 max-sm:pr-12 [&::-webkit-details-marker]:hidden',
            PLAN_FOCUS
          )}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm">
              <span className="font-semibold">
                {first.id.endsWith(':2') && items.length === 1
                  ? t('suggest.second', { resort: tRegion(`resort.${resort}`) })
                  : tRegion(`resort.${resort}`)}
              </span>
              {' · '}
              <span className="text-primary-ink font-medium" data-plan-suggestion-product="">
                {items.length > 1
                  ? t('suggest.count', { count: items.length, name: productLabel })
                  : productLabel}
              </span>
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">{summary}</span>
          </span>
          <ChevronDown
            className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-open/row:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="flex flex-col gap-3 pb-3">
          {notCovered.map((o) => (
            <p key={o.id} className="text-foreground/75 text-sm">
              {t('suggest.notCovered', {
                name: productName(catalog, o.product),
                parks: plannedParks.map(parkName).join(', '),
              })}
            </p>
          ))}

          {parkDays.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label={t('fields.days')}>
              {parkDays.map((d) => {
                const evening = evenings.get(d.date);
                return (
                  <li key={d.date} className="min-w-0">
                    <Badge
                      variant="secondary"
                      className="h-auto max-w-full flex-wrap justify-start gap-x-1.5 gap-y-0 rounded-xl text-left font-normal whitespace-normal"
                      data-plan-suggestion-day={d.date}
                    >
                      <span className="text-muted-foreground whitespace-nowrap">{day(d.date)}</span>
                      <span className="font-medium">
                        {d.parks.map((p) => parkName(p.slug)).join(' + ')}
                      </span>
                      {evening && (
                        <span className="text-primary-ink inline-flex items-center gap-0.5 font-medium whitespace-nowrap">
                          <Moon className="size-3 shrink-0" aria-hidden="true" />
                          <span className="sr-only">{t('hopper.eveningMark', { hopper })}</span>
                          {parkName(evening)}
                        </span>
                      )}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}

          {!everyOnItsDay &&
            items.map((s) => (
              <TicketWindowBar key={s.id} from={s.start} to={s.end} used={used(s)} />
            ))}

          {verdicts.map((verdict, i) => (
            <Verdict
              key={i}
              verdict={verdict}
              resort={resort}
              chipDates={chipDates}
              action={i === verdicts.length - 1 ? toggle : null}
            />
          ))}

          {facts.length > 0 && (
            <div className="flex flex-col gap-1.5 text-sm">
              <p className="text-muted-foreground text-xs font-medium">{t('howValid')}</p>
              {facts}
            </div>
          )}

          <PurchaseLinks
            source={suggestionShop(first, catalog)}
            resort={resort}
            product={group.product}
            surface="suggestion"
            ticketMode={ticketModeOf(plan.meta.tickets?.length ?? 0, suggested.length)}
            title
          />
        </div>
      </details>
    </li>
  );
}

/**
 * A ticket's window as a bar, a segment a day, the days the plan uses filled; under it the
 * window's dates and how many of its days the plan uses. The bar is a picture of that line.
 */
function TicketWindowBar({
  from,
  to,
  used,
}: {
  from: string;
  to: string;
  used: ReadonlySet<string>;
}) {
  const t = useTranslations('tripPlanner.tickets.suggest');
  const { locale } = usePlanContext();
  const days = ticketWindowDays(from, to, used);
  const count = days.filter((d) => d.used).length;
  return (
    <div className="flex flex-col gap-1" data-plan-ticket-window={`${count}/${days.length}`}>
      <div className="flex gap-0.5" aria-hidden="true">
        {days.map((d) => (
          <span
            key={d.date}
            className={cn(
              'h-2 min-w-0 flex-1 rounded-full',
              d.used ? 'bg-primary' : 'bg-foreground/15'
            )}
          />
        ))}
      </div>
      <p className="text-muted-foreground flex flex-wrap justify-between gap-x-3 text-xs tabular-nums">
        <span>
          {t('valid', {
            range: formatParkDayRange(locale, from, to, { day: 'numeric', month: 'short' }),
          })}
        </span>
        <span>{t('inWindow', { used: count, window: days.length })}</span>
      </p>
    </div>
  );
}

/**
 * What the hopper adds, in one line from the fields the API sends: "Worth it" in a tinted box only
 * where the API recommends it, then the gains, or that it adds nothing; `action` ends the line. An evening
 * whose date stands on a chip (`chipDates`) is counted, the chip shows the day; any other is dated.
 * With the hopper on, the API compares against the plan without it, so the same words hold.
 */
function Verdict({
  verdict,
  resort,
  chipDates,
  action,
}: {
  verdict: PlanHopperVerdict;
  resort: string;
  chipDates?: ReadonlySet<string>;
  action?: ReactNode;
}) {
  const t = useTranslations('tripPlanner.tickets.hopper');
  const { parkName, locale } = usePlanContext();
  const hopperWord = useHopperWord();
  const day = useShortDay();
  const highlights = hopperHighlights(verdict);
  const hopper = hopperWord(resort);
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const phrase = (highlight: HopperHighlight): string => {
    switch (highlight.kind) {
      case 'evenings':
        return chipDates && highlight.dates.every((date) => chipDates.has(date))
          ? t('eveningsAt', { park: parkName(highlight.park), count: highlight.dates.length })
          : t('eveningsOn', {
              park: parkName(highlight.park),
              count: highlight.dates.length,
              dates: list.format(highlight.dates.map(day)),
            });
      case 'hopDay':
        return t('hopDay', {
          parks: list.format(highlight.parks.map(parkName)),
          date: day(highlight.date),
        });
      case 'hopDays':
        return t('hopDays', { count: highlight.count });
      case 'fits':
        return t('fits', {
          parks: list.format(highlight.parks.map(parkName)),
          count: highlight.parks.length,
        });
      case 'minutes':
        return t('minutes', { minutes: highlight.minutes });
    }
  };
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm',
        verdict.recommended && 'border-primary/30 bg-primary/5 rounded-lg border p-2.5'
      )}
      data-plan-verdict={verdict.recommended ? 'yes' : 'no'}
    >
      {highlights.length === 0 ? (
        <Badge variant="outline" className="text-muted-foreground whitespace-normal">
          {t('nothing', { hopper })}
        </Badge>
      ) : (
        <>
          {verdict.recommended ? (
            <Badge
              variant="outline"
              className="border-primary/50 text-primary-ink whitespace-normal"
            >
              {t('worth', { hopper })}
            </Badge>
          ) : (
            <span className="font-medium">{t('adds', { hopper })}</span>
          )}
          <span>{list.format(highlights.map(phrase))}</span>
        </>
      )}
      {action}
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

function InlineAction({
  onClick,
  inText = false,
  children,
  ...data
}: {
  onClick: () => void;
  /** Inside a sentence, where a 44 px box would push the line apart. */
  inText?: boolean;
  children: ReactNode;
  [key: `data-${string}`]: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...data}
      className={cn(
        'text-primary-ink inline-flex items-center rounded-sm font-medium underline-offset-4 hover:underline',
        !inText && 'min-h-11',
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
  const t = useTranslations('tripPlanner.tickets');
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

/** Who reads the purchase links: the page's locale and the region of the browser's first language. */
function useTicketVisitor(): TicketLinkVisitor & { market: ReturnType<typeof visitorMarket> } {
  const { locale } = usePlanContext();
  // A string, never `navigator.languages` itself: that is a new array on every read.
  const language = useSyncExternalStore(
    noSubscribe,
    () => navigator.languages?.[0] ?? '',
    () => ''
  );
  const languages = language ? [language] : [];
  return { locale, market: visitorMarket(languages) };
}

const noSubscribe = () => () => {};

/**
 * One purchase link: in a new tab with park.fan as its referrer (`ticketLinkAttributes`), counted
 * as `ticket_link_clicked` with its place among the links drawn (`index`), a middle click
 * included. `primary` is the recommendation's filled button, `outline` a compact one, `text` a
 * link in a line. Every seller is drawn alike: a tint on one of two reads as a fault.
 */
function BuyLink({
  link,
  index,
  product,
  surface,
  ticketMode,
  tone = 'outline',
  className,
  children,
}: {
  link: TicketLink;
  index: number;
  product: string;
  surface: TicketLinkSurface;
  ticketMode: TicketMode;
  tone?: 'primary' | 'outline' | 'text';
  className?: string;
  children: ReactNode;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const visitor = useTicketVisitor();
  const count = () =>
    trackSiteEvent(
      'ticket_link_clicked',
      ticketLinkClickProps({ product, link, index, visitor, surface, ticketMode })
    );
  const look =
    tone === 'text'
      ? {
          className: cn(
            'text-primary-ink inline-flex items-center gap-1 rounded-sm py-1 font-medium underline-offset-4 hover:underline',
            PLAN_FOCUS,
            className
          ),
        }
      : buttonLinkProps({
          variant: tone === 'primary' ? 'default' : 'outline',
          size: 'sm',
          withIcon: true,
          className: cn(
            'h-auto min-h-8 max-w-full py-1 text-left whitespace-normal max-sm:h-auto max-sm:min-h-11',
            className
          ),
        });
  return (
    <a
      href={link.url}
      {...ticketLinkAttributes(link)}
      onClick={count}
      onAuxClick={(event) => event.button === 1 && count()}
      data-ticket-link={link.sponsored ? 'sponsored' : link.official ? 'official' : 'plain'}
      {...look}
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">
        {link.sponsored ? `${t('partner.label')}. ` : ''}
        {t('newTab')}
      </span>
    </a>
  );
}

/**
 * A purchase link's name: the operator's shop marked as such, a country store by its seller,
 * country and currency („Attraction Tickets · Deutschland (€)", `ticketStoreName`), any other by
 * its seller; `prefix` (a resort) before it.
 */
function BuyLabel({ link, prefix }: { link: TicketLink; prefix?: string }) {
  const t = useTranslations('tripPlanner.tickets');
  const { locale } = usePlanContext();
  const name = link.official
    ? t('links.official', { seller: link.seller })
    : link.store
      ? t('links.store', { seller: link.seller, ...ticketStoreName(link.store, locale) })
      : link.seller;
  return <>{prefix ? `${prefix} · ${name}` : name}</>;
}

/**
 * Where to buy a ticket, every shop as compact buttons: the product's links in the ticket order
 * (`orderTicketLinks`), a seller's country stores together under its name (`ticketLinkGroups`),
 * every store drawn alike. The official shop is marked, a country store named by its country and
 * currency („Deutschland (€)", `ticketStoreName`), a shop abroad tagged with where it sells ("UK
 * shop", `linkMarket`), a sponsored one labelled "Partner link" beside it, which says what that
 * means.
 */
function PurchaseLinks({
  source,
  resort,
  product,
  surface,
  ticketMode,
  title = false,
}: {
  source: { links?: readonly TicketLink[]; shopUrl?: string };
  resort: string;
  product: string;
  surface: TicketLinkSurface;
  ticketMode: TicketMode;
  title?: boolean;
}) {
  const t = useTranslations('tripPlanner.tickets');
  const { locale, region, tickets: catalog, ticketStep } = usePlanContext();
  const resortWord = useResortWord();
  const productMarkets = catalog.get(product)?.markets;
  const home = ticketHomeMarket(region, ticketStep);
  const groups = ticketLinkGroups(orderTicketLinks(source, resortWord(resort)));
  if (groups.length === 0) return null;

  const button = ({ link, index }: { link: TicketLink; index: number }, label: ReactNode) => {
    const market = linkMarket(link, productMarkets, home);
    return (
      <li key={link.url} className="flex max-w-full flex-wrap items-center gap-1.5">
        <BuyLink
          link={link}
          index={index}
          product={product}
          surface={surface}
          ticketMode={ticketMode}
        >
          {label}
        </BuyLink>
        {market && <TicketMarketTag market={market} />}
        {link.sponsored && <PartnerLabel />}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-1.5" data-plan-purchase-links="">
      {title && <p className="text-muted-foreground text-xs font-medium">{t('links.title')}</p>}
      <ul className="flex flex-col gap-2">
        {groups.map((group) =>
          group.stores ? (
            <li key={`stores:${group.seller}`} className="flex flex-col gap-1">
              <span className="text-foreground/75 text-xs">{group.seller}</span>
              <ul className="flex flex-wrap gap-1.5">
                {group.items.map((item) =>
                  button(
                    item,
                    <>
                      <span className="sr-only">{`${group.seller} · `}</span>
                      {item.link.store &&
                        t('links.storeOnly', ticketStoreName(item.link.store, locale))}
                    </>
                  )
                )}
              </ul>
            </li>
          ) : (
            button(group.items[0], <BuyLabel link={group.items[0].link} />)
          )
        )}
      </ul>
    </div>
  );
}

/**
 * The visible "Partner link" label beside a sponsored link (a legal requirement, so never subtle):
 * a pressable pill that says on hover, focus or a tap that park.fan earns a commission and the
 * price stays the same.
 */
function PartnerLabel({ label }: { label?: string }) {
  const t = useTranslations('tripPlanner.tickets.partner');
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-partner-label=""
          onPointerEnter={(event) => event.pointerType === 'mouse' && setOpen(true)}
          onPointerLeave={(event) => event.pointerType === 'mouse' && setOpen(false)}
          className={cn(
            'border-foreground/40 text-foreground inline-flex min-h-7 items-center gap-1 rounded-full border px-2 text-xs font-semibold',
            PLAN_FOCUS
          )}
        >
          <Info className="size-3.5" aria-hidden="true" />
          {label ?? t('label')}
        </button>
      </PopoverTrigger>
      {/* Above the phone's details sheet, which sits at z-[70]. */}
      <PopoverContent align="start" className="z-[80] w-64 p-3 text-sm" data-partner-note="">
        {t('note')}
      </PopoverContent>
    </Popover>
  );
}

/**
 * "Partner link" as a word beside a sponsored link in the recommendation, whose head carries the
 * pill that explains it ({@link PartnerLabel} as "Ad").
 */
function PartnerWord() {
  const t = useTranslations('tripPlanner.tickets.partner');
  return (
    <span
      className="text-muted-foreground ms-1.5 shrink-0 text-xs font-medium"
      data-partner-word=""
    >
      {t('label')}
    </span>
  );
}

/**
 * "Already have tickets? Add them": the way to the assistant's Tickets step, under the plan's
 * tickets (`onAsk`, the result's `edit.tickets`) and on the hub's landing without one, where it
 * starts the assistant there (`tripPlannerUi.openTickets`): tickets bought for fixed days give the
 * trip its dates.
 */
export function TicketsAsk({ onAsk }: { onAsk?: () => void }) {
  const t = useTranslations('tripPlanner.tickets');
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm" data-plan-tickets-ask="">
      {t('later')}
      <button
        type="button"
        onClick={onAsk ?? (() => tripPlannerUi.openTickets())}
        className={cn(
          'text-primary-ink hover:bg-primary/10 -my-2 min-h-11 rounded-md px-2 font-medium transition-colors',
          PLAN_FOCUS
        )}
      >
        {t('enter')}
      </button>
    </p>
  );
}
