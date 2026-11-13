import { addDays } from '@/lib/utils/park-day';
import {
  MAX_TICKETS,
  MAX_TRIP_DAYS,
  normalizePlanState,
  type OrlandoPlanState,
  type PlanTicket,
  type PlanTicketHopper,
} from './plan-query';
import type {
  PlanDay,
  PlanHopperVerdict,
  PlanMeta,
  PlanOwnedTicket,
  PlanTicketSuggestion,
} from './plan';
import type { TicketProduct } from './types';

/**
 * Tickets in the Orlando planner: the region's catalog read for the step (which products a resort
 * offers, their days, windows and hopper), the rules the API would answer with a 400 checked before
 * a request, and the answer's ticket fields turned into what the result says. Pure, and free of
 * React; `scripts/test-orlando-plan.mjs` checks it. The contract: the API's
 * `docs/frontend/trip-regions.md#tickets`.
 */

/** The catalog by product id. */
export type TicketCatalog = ReadonlyMap<string, TicketProduct>;

/** The four groups the step offers tickets for, always in this order. */
export const TICKET_RESORTS = [
  'walt-disney-world',
  'universal-orlando',
  'seaworld-orlando',
  'day-trips',
] as const;
/** One of {@link TICKET_RESORTS}. */
export type TicketResort = (typeof TICKET_RESORTS)[number];

/** The catalog keyed by id; empty without one. */
export function ticketCatalog(products: readonly TicketProduct[] | undefined): TicketCatalog {
  return new Map((products ?? []).map((p) => [p.id, p]));
}

/**
 * The catalog as the browser needs it: the operators' notes and the rules only the optimizer reads
 * (`hopSets`, `caps`, `confidence`) stay on the server, which keeps the planner's payload small.
 */
export function leanTicketCatalog(products: readonly TicketProduct[]): TicketProduct[] {
  return products.map((product) => {
    const lean = { ...product } as TicketProduct & Record<string, unknown>;
    delete lean.notes;
    delete lean.hopSets;
    delete lean.caps;
    delete lean.confidence;
    return lean;
  });
}

// ── The step's lists ──────────────────────────────────────────────────────────

/**
 * One line of a resort's product list in the step, as a visitor recognises a ticket: the
 * operator's name, with a rule in one line (`tickets.entry.<key>` in the messages).
 *
 * - `products` are the catalog ids it stands for; more than one is asked as chips, unless `addon`
 *   or `uk14` decides between them.
 * - `addon`: a checkbox that turns the first product into the second (Disney's water parks,
 *   Universal's Volcano Bay).
 * - `uk14`: Universal's two UK 14-day tickets as one entry, the start date picking the one on sale.
 * - `unsure`: "Not sure which", mapped to the product with the strictest window for its length.
 */
export interface TicketEntry {
  key: string;
  resort: TicketResort;
  products: readonly string[];
  addon?: 'waterParks' | 'volcanoBay';
  uk14?: boolean;
  unsure?: boolean;
}

/** Universal's UK 14-day tickets, Three Park Adventure first: the one sold while Volcano Bay is shut. */
export const UNIVERSAL_UK_14 = ['uor-uk-three-park-adventure', 'uor-uk-all-parks'] as const;
/** Disney's UK 14-day ticket. */
export const DISNEY_UK_14 = 'wdw-uk-14-day-magic';

const ENTRIES: readonly TicketEntry[] = [
  {
    key: 'wdw-dated',
    resort: 'walt-disney-world',
    products: ['wdw-date-based', 'wdw-date-based-plus'],
    addon: 'waterParks',
  },
  { key: 'wdw-uk-14', resort: 'walt-disney-world', products: [DISNEY_UK_14] },
  { key: 'wdw-uk-7', resort: 'walt-disney-world', products: ['wdw-uk-7-day-magic'] },
  { key: 'wdw-4-park', resort: 'walt-disney-world', products: ['wdw-4-park-magic'] },
  { key: 'wdw-pass', resort: 'walt-disney-world', products: ['wdw-annual-pass'] },
  {
    key: 'wdw-unsure',
    resort: 'walt-disney-world',
    products: ['wdw-date-based', DISNEY_UK_14],
    unsure: true,
  },
  {
    key: 'uor-dated',
    resort: 'universal-orlando',
    products: ['uor-date-based', 'uor-date-based-volcano-bay'],
    addon: 'volcanoBay',
  },
  { key: 'uor-uk-14', resort: 'universal-orlando', products: UNIVERSAL_UK_14, uk14: true },
  {
    key: 'uor-epic',
    resort: 'universal-orlando',
    products: ['uor-1-day-plus-epic', 'uor-2-day-p2p-plus-epic'],
  },
  {
    key: 'uor-1-day',
    resort: 'universal-orlando',
    products: ['uor-epic-1-day', 'uor-volcano-bay-1-day'],
  },
  {
    key: 'uor-pass',
    resort: 'universal-orlando',
    products: ['uor-annual-pass', 'uor-annual-pass-3-park'],
    addon: 'volcanoBay',
  },
  {
    key: 'uor-unsure',
    resort: 'universal-orlando',
    products: ['uor-date-based', ...UNIVERSAL_UK_14],
    unsure: true,
  },
  {
    key: 'sw-1-day',
    resort: 'seaworld-orlando',
    products: ['seaworld-1-day', 'busch-gardens-1-day'],
  },
  { key: 'sw-two-park', resort: 'seaworld-orlando', products: ['seaworld-two-park'] },
  { key: 'sw-three-park', resort: 'seaworld-orlando', products: ['seaworld-three-park-3-day'] },
  { key: 'sw-four-parks', resort: 'seaworld-orlando', products: ['seaworld-four-parks-14-day'] },
  { key: 'sw-uk-3-visit', resort: 'seaworld-orlando', products: ['seaworld-uk-3-visit'] },
  { key: 'sw-uk-ultimate', resort: 'seaworld-orlando', products: ['seaworld-uk-ultimate'] },
  {
    key: 'sw-discovery-cove',
    resort: 'seaworld-orlando',
    products: ['discovery-cove', 'discovery-cove-plus-2', 'discovery-cove-plus-3'],
  },
  {
    key: 'sw-fun-card',
    resort: 'seaworld-orlando',
    products: ['seaworld-fun-card', 'seaworld-fun-card-aquatica', 'busch-gardens-fun-card'],
  },
  {
    key: 'sw-pass',
    resort: 'seaworld-orlando',
    products: ['seaworld-annual-pass', 'seaworld-annual-pass-florida'],
  },
  { key: 'lego-day', resort: 'day-trips', products: ['legoland-1-day', 'legoland-2-day'] },
  { key: 'lego-7', resort: 'day-trips', products: ['legoland-merlin-7-attractions'] },
  { key: 'lego-pass', resort: 'day-trips', products: ['legoland-annual-pass'] },
];

/**
 * A resort's product list, keeping only the products the catalog has; an entry with none left goes,
 * so a product the API drops leaves the list without a dead button.
 */
export function ticketEntries(resort: string, catalog: TicketCatalog): TicketEntry[] {
  return ENTRIES.flatMap((entry) => {
    if (entry.resort !== resort) return [];
    const products = entry.products.filter((id) => catalog.has(id));
    if (products.length === 0 || (entry.unsure && !products.includes(entry.products[0]))) {
      return [];
    }
    return [{ ...entry, products }];
  });
}

/** The entry a written ticket belongs to: the first that lists its product and is no "not sure". */
export function entryOfProduct(product: string): TicketEntry | null {
  return ENTRIES.find((e) => !e.unsure && e.products.includes(product)) ?? null;
}

/**
 * Whether an entry's ticket is sold outside the US only, which its tag says ("Sold outside the US").
 * The catalog's `markets` lack `us` for those; no residency rule is claimed, since the sellers'
 * pages state none.
 */
export function entryMarket(entry: TicketEntry, catalog: TicketCatalog): 'intl' | null {
  const markets = catalog.get(entry.products[0])?.markets ?? [];
  return markets.includes('us') ? null : 'intl';
}

// ── A product's rules ─────────────────────────────────────────────────────────

/** The lengths a product sells, or `null` for a pass or a product with only a window. */
export function soldLengths(product: TicketProduct): number[] | null {
  if (product.days === 'unlimited') return null;
  const out: number[] = [];
  for (let n = product.days.min; n <= product.days.max; n++) out.push(n);
  return out;
}

/**
 * The calendar days a ticket may be used in, from its start: the window of its length, or the
 * product's own window; `null` for a pass.
 */
export function windowLength(product: TicketProduct, days: number | null): number | null {
  if (product.pass) return null;
  if (product.windowDays) return product.windowDays;
  const length = days ?? (product.days === 'unlimited' ? null : product.days.min);
  if (length === null) return null;
  return product.windowTable?.find((w) => w.days === length)?.window ?? length;
}

/** The days a ticket of this product has to count off, `null` for a pass or a window-only product. */
export function ticketLength(product: TicketProduct, days: number | null): number | null {
  if (product.pass || product.days === 'unlimited') return null;
  return days ?? product.days.min;
}

/**
 * Whether a ticket is valid every day of its window, so it has no days to count off: a window as
 * long as its days (Universal's UK 14-day tickets), or a window without a day count (SeaWorld's
 * Four Parks). The contract numbers such a ticket's days by the window.
 */
export function isEveryDayTicket(product: TicketProduct, days: number | null): boolean {
  if (product.pass) return false;
  const length = ticketLength(product, days);
  const window = windowLength(product, days);
  return window !== null && (length === null || length === window);
}

/** Whether the product is sold for a ticket starting on `date`. */
export function onSaleAt(product: TicketProduct, date: string): boolean {
  if (!product.onSale || product.onSale.length === 0) return true;
  return product.onSale.some((r) => (!r.from || date >= r.from) && (!r.to || date <= r.to));
}

/** A ticket's window as dates, both ends included; `null` without a start or for a pass. */
export function ticketWindow(
  product: TicketProduct,
  ticket: Pick<PlanTicket, 'days' | 'start'>
): { from: string; to: string } | null {
  const window = windowLength(product, ticket.days);
  if (!ticket.start || window === null) return null;
  return { from: ticket.start, to: addDays(ticket.start, window - 1) };
}

/**
 * Universal's UK 14-day tickets sold for a start, Three Park Adventure first: one product in most
 * weeks, both in the week their sales overlap (the step then asks about Volcano Bay), none outside.
 */
export function universalUk14At(catalog: TicketCatalog, start: string): string[] {
  return UNIVERSAL_UK_14.filter((id) => {
    const product = catalog.get(id);
    return product !== undefined && onSaleAt(product, start);
  });
}

// ── A ticket being entered ────────────────────────────────────────────────────

/**
 * A ticket in the step as the visitor fills it in. Only a complete one becomes a `tickets=` item
 * ({@link draftTicket}); the rest stays here until it is.
 */
export interface TicketDraft {
  /** Stable for the session, the key of its card. */
  id: number;
  resort: TicketResort;
  /** The chosen entry; `null` while its list is open. */
  entry: string | null;
  /** The chosen product, where the entry offers several as chips. */
  product: string | null;
  days: number | null;
  /** `null` until answered, which plans as "not sure". */
  hopper: PlanTicketHopper | null;
  /** The entry's checkbox: water parks, or Volcano Bay. */
  addon: boolean;
  start: string | null;
  /** The other half of a Combo Ticket, which shares this one's first day. */
  link?: number;
}

/** The lengths "Not sure which" offers: every date-based length, and the UK ticket's 14. */
export function unsureLengths(entry: TicketEntry, catalog: TicketCatalog): number[] {
  const base = catalog.get(entry.products[0]);
  const lengths = base ? (soldLengths(base) ?? []) : [];
  return entry.products.length > 1 ? [...lengths, 14] : lengths;
}

/**
 * The product a draft stands for, or `null` while it cannot be told: the entry's chosen chip, its
 * add-on, the UK 14-day ticket on sale at the start, or for "not sure" the strictest product of
 * that length (a date-based ticket, or the UK 14-day one).
 */
export function draftProduct(
  draft: Pick<TicketDraft, 'entry' | 'product' | 'days' | 'addon' | 'start'>,
  catalog: TicketCatalog,
  fallbackStart: string | null
): string | null {
  const entry = ENTRIES.find((e) => e.key === draft.entry);
  if (!entry) return null;
  const products = entry.products.filter((id) => catalog.has(id));
  if (products.length === 0) return null;
  const uk14 = (start: string | null) => {
    const sold = start ? universalUk14At(catalog, start) : [...UNIVERSAL_UK_14];
    if (sold.length === 0) return null;
    // Both are sold for one week: Volcano Bay decides, and without it the cheaper one.
    return draft.addon && sold.includes('uor-uk-all-parks') ? 'uor-uk-all-parks' : sold[0];
  };
  if (entry.unsure) {
    if (draft.days === null) return null;
    if (draft.days !== 14) return products[0];
    return entry.resort === 'universal-orlando'
      ? uk14(draft.start ?? fallbackStart)
      : (products.find((id) => id === DISNEY_UK_14) ?? null);
  }
  if (entry.uk14) return uk14(draft.start ?? fallbackStart);
  if (entry.addon) {
    const variant = products[1];
    return draft.addon && variant ? variant : products[0];
  }
  if (products.length === 1) return products[0];
  return draft.product && products.includes(draft.product) ? draft.product : null;
}

/** Why a draft's start cannot be used: a product not sold for it. */
export type DraftIssue = { kind: 'not_on_sale'; product: string };

/**
 * The draft as a `tickets=` item, or why not: `null` with no issue while a field is still empty.
 * A start the product is not sold for is an issue, never written, since the API would refuse it.
 */
export function draftTicket(
  draft: TicketDraft,
  catalog: TicketCatalog,
  fallbackStart: string | null
): { ticket: PlanTicket | null; issue: DraftIssue | null } {
  const id = draftProduct(draft, catalog, fallbackStart);
  const entry = ENTRIES.find((e) => e.key === draft.entry);
  if (!id) {
    // The UK 14-day ticket with a start neither product is sold for.
    if (draft.start && (entry?.uk14 || (entry?.unsure && draft.days === 14))) {
      return { ticket: null, issue: { kind: 'not_on_sale', product: UNIVERSAL_UK_14[0] } };
    }
    return { ticket: null, issue: null };
  }
  const product = catalog.get(id) as TicketProduct;
  if (draft.start && !product.pass && !onSaleAt(product, draft.start)) {
    return { ticket: null, issue: { kind: 'not_on_sale', product: id } };
  }
  const lengths = soldLengths(product);
  let days: number | null = null;
  if (lengths && lengths.length > 1) {
    if (draft.days === null || !lengths.includes(draft.days)) return { ticket: null, issue: null };
    days = draft.days;
  }
  const hopper: PlanTicketHopper =
    product.hopping === 'optional' ? (draft.hopper ?? 'unsure') : 'no';
  const start = product.pass ? null : draft.start;
  return { ticket: { product: id, days, hopper, start }, issue: null };
}

/** A written ticket as a draft, so the step opens on what the link says. */
export function ticketDraft(ticket: PlanTicket, id: number, catalog: TicketCatalog): TicketDraft {
  const entry = entryOfProduct(ticket.product);
  const product = catalog.get(ticket.product);
  return {
    id,
    resort: (entry?.resort ?? product?.resort ?? 'walt-disney-world') as TicketResort,
    entry: entry?.key ?? null,
    product: ticket.product,
    days: ticket.days,
    hopper: product?.hopping === 'optional' ? ticket.hopper : null,
    addon: entry?.addon !== undefined && entry.products[1] === ticket.product,
    start: ticket.start,
  };
}

// ── The trip and the tickets ──────────────────────────────────────────────────

/** Each ticket's window with its resort, in entry order, for the date grid's bars and key. */
export function ticketWindows(
  tickets: readonly PlanTicket[],
  catalog: TicketCatalog
): Array<{ index: number; resort: string; from: string; to: string }> {
  return tickets.flatMap((ticket, index) => {
    const product = catalog.get(ticket.product);
    const window = product ? ticketWindow(product, ticket) : null;
    return product && window ? [{ index, resort: product.resort, ...window }] : [];
  });
}

/**
 * The trip the tickets imply, for dates not chosen yet: the earliest first day to the latest
 * window's end, at most {@link MAX_TRIP_DAYS} days. `null` while no ticket has a first day.
 */
export function tripFromTickets(
  tickets: readonly PlanTicket[],
  catalog: TicketCatalog
): { from: string; to: string } | null {
  const windows = ticketWindows(tickets, catalog);
  if (windows.length === 0) return null;
  const from = windows.reduce((a, w) => (w.from < a ? w.from : a), windows[0].from);
  const end = windows.reduce((a, w) => (w.to > a ? w.to : a), windows[0].to);
  const cap = addDays(from, MAX_TRIP_DAYS - 1);
  return { from, to: end < cap ? end : cap };
}

/** Set the tickets; where the trip has no dates yet, the tickets' windows give them. */
export function setTickets(
  state: OrlandoPlanState,
  tickets: PlanTicket[],
  catalog: TicketCatalog,
  today: string | null
): OrlandoPlanState {
  const next = { ...state, tickets: tickets.slice(0, MAX_TICKETS) };
  if (state.from || state.to || state.when) return next;
  const trip = tripFromTickets(next.tickets, catalog);
  if (!trip || (today && trip.from < today)) return next;
  return normalizePlanState({ ...next, from: trip.from, to: trip.to });
}

/** A ticket the trip's dates miss, which the API would answer with a 400. */
export interface TicketProblem {
  kind: 'after_trip' | 'before_trip' | 'not_on_sale';
  /** Its index in `tickets`. */
  index: number;
  product: string;
}

/**
 * The first ticket the trip cannot be planned with: one that starts after the trip, one whose
 * window ends before it, or a start the product is not sold for. `null` while there are no dates.
 */
export function ticketProblem(
  state: Pick<OrlandoPlanState, 'from' | 'to' | 'tickets'>,
  catalog: TicketCatalog
): TicketProblem | null {
  if (!state.from || !state.to) return null;
  for (const [index, ticket] of state.tickets.entries()) {
    const product = catalog.get(ticket.product);
    if (!product || !ticket.start) continue;
    if (!product.pass && !onSaleAt(product, ticket.start)) {
      return { kind: 'not_on_sale', index, product: product.id };
    }
    if (ticket.start > state.to) return { kind: 'after_trip', index, product: product.id };
    const window = ticketWindow(product, ticket);
    if (window && window.to < state.from) {
      return { kind: 'before_trip', index, product: product.id };
    }
  }
  return null;
}

/**
 * The resorts the visitor's owned tickets cover with a hopper (`.h`, or a product that always hops),
 * for the "Park hopping" option, which only these and plan first's hopper make count.
 */
export function hopperTicketResorts(
  tickets: readonly PlanTicket[],
  catalog: TicketCatalog
): string[] {
  const out = new Set<string>();
  for (const ticket of tickets) {
    const product = catalog.get(ticket.product);
    if (!product) continue;
    if (
      product.hopping === 'included' ||
      (product.hopping === 'optional' && ticket.hopper === 'yes')
    ) {
      out.add(product.resort);
    }
  }
  return [...out];
}

/** Whether owned tickets cover Disney and Universal both, so the two may mix inside the windows. */
export function ticketsCoverBothResorts(
  tickets: readonly PlanTicket[],
  catalog: TicketCatalog
): boolean {
  const resorts = new Set(tickets.map((t) => catalog.get(t.product)?.resort));
  return resorts.has('walt-disney-world') && resorts.has('universal-orlando');
}

// ── Plan first ────────────────────────────────────────────────────────────────

/** Whether a plan-first resort is planned with its hopper: all are with `ticket=hopper`, else `hopper=` names it. */
export function hopperOn(
  state: Pick<OrlandoPlanState, 'ticket' | 'hopper'>,
  resort: string
): boolean {
  return state.ticket === 'hopper' || state.hopper.includes(resort);
}

/**
 * "Show the plan with Park Hopper" for one resort, and its way back. An older link's `ticket=hopper`
 * (every resort) becomes the list of the others, so the press changes only this resort.
 */
export function toggleHopper(
  state: OrlandoPlanState,
  resort: string,
  optionalResorts: readonly string[]
): OrlandoPlanState {
  const current = state.ticket === 'hopper' ? [...optionalResorts] : state.hopper;
  const hopper = current.includes(resort)
    ? current.filter((r) => r !== resort)
    : [...current, resort];
  return { ...state, ticket: 'base', hopper, hop: hopper.length > 0 && state.hop };
}

/** The suggestions in the order of their first day, for the one sentence that names them. */
export function suggestionsByStart(
  suggestions: readonly PlanTicketSuggestion[] | undefined
): PlanTicketSuggestion[] {
  return [...(suggestions ?? [])].sort(
    (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id)
  );
}

/**
 * "Use these as your tickets": the suggestions written as owned tickets, each with its start and,
 * where the plan was shown with it, the hopper. The resorts stay in blocks (`blocks=1`), so the
 * re-plan keeps the days the tickets were suggested for.
 */
export function adoptSuggestions(
  state: OrlandoPlanState,
  suggestions: readonly PlanTicketSuggestion[],
  catalog: TicketCatalog
): OrlandoPlanState {
  const adopted: PlanTicket[] = [];
  for (const s of suggestionsByStart(suggestions)) {
    const product = catalog.get(s.product);
    if (!product) continue;
    const lengths = soldLengths(product);
    adopted.push({
      product: s.product,
      days: lengths && lengths.length > 1 ? s.days : null,
      hopper: product.hopping === 'optional' && hopperOn(state, s.resort) ? 'yes' : 'no',
      start: s.start,
    });
  }
  const tickets = [...state.tickets, ...adopted].slice(0, MAX_TICKETS);
  const covered = new Set(adopted.map((t) => catalog.get(t.product)?.resort));
  return {
    ...state,
    tickets,
    blocks: state.blocks ?? true,
    ticket: 'base',
    hopper: state.hopper.filter((r) => !covered.has(r)),
  };
}

/**
 * "From the UK or Ireland? The 14-day tickets fit this trip": Disney's and Universal's UK 14-day
 * tickets for the resorts a long trip's suggestions name, without a first day, so the plan picks it.
 */
export function longStayTickets(
  suggestions: readonly PlanTicketSuggestion[] | undefined,
  catalog: TicketCatalog,
  tripFrom: string
): PlanTicket[] {
  const out: PlanTicket[] = [];
  for (const s of suggestions ?? []) {
    if (!s.alternatives?.some((a) => a.reason === 'long_stay')) continue;
    if (out.some((t) => catalog.get(t.product)?.resort === s.resort)) continue;
    const id =
      s.resort === 'walt-disney-world'
        ? catalog.has(DISNEY_UK_14)
          ? DISNEY_UK_14
          : null
        : s.resort === 'universal-orlando'
          ? (universalUk14At(catalog, tripFrom)[0] ?? null)
          : null;
    if (id) out.push({ product: id, days: null, hopper: 'no', start: null });
  }
  return out;
}

// ── The answer ────────────────────────────────────────────────────────────────

/** One thing the hopper adds, as the verdict says it, in the order the verdict lists them. */
export type HopperGain =
  | { kind: 'evening'; date: string; park: string }
  | { kind: 'evenings'; count: number }
  | { kind: 'hopDay'; date: string; parks: string[] }
  | { kind: 'hopDays'; count: number }
  | { kind: 'fits'; parks: string[] }
  | { kind: 'minutes'; minutes: number };

/**
 * What the hopper adds, from the fields the API sends: each evening at a second park and each day
 * with two parks by date (more than two by count), the parks that fit only with it, and the
 * minutes per ride. Empty when it adds nothing.
 */
export function hopperGains(verdict: PlanHopperVerdict | undefined): HopperGain[] {
  if (!verdict) return [];
  const gains: HopperGain[] = [];
  const evenings = verdict.eveningHopList ?? [];
  if (evenings.length > 2) gains.push({ kind: 'evenings', count: evenings.length });
  else {
    for (const e of evenings) {
      const park = e.parks[1];
      if (park) gains.push({ kind: 'evening', date: e.date, park });
    }
  }
  const fits = [...new Set(verdict.fitsOnlyWithHopper ?? [])];
  if (fits.length > 0) gains.push({ kind: 'fits', parks: fits });
  const hopDays = verdict.hopDayList ?? [];
  if (hopDays.length > 2) gains.push({ kind: 'hopDays', count: hopDays.length });
  else {
    for (const d of hopDays) gains.push({ kind: 'hopDay', date: d.date, parks: d.parks });
  }
  const perRide = Math.round(verdict.savedMinutesPerRide ?? 0);
  if (perRide >= 1) gains.push({ kind: 'minutes', minutes: perRide });
  return gains;
}

/** Universal Studios and Islands of Adventure: the Hogwarts Express runs between them. */
export const HOGWARTS_PARKS = ['universal-studios-florida', 'universal-islands-of-adventure'];

/** Whether a set of planned parks rides the Hogwarts Express between its two stations. */
export function needsHogwartsHop(parks: readonly string[]): boolean {
  return HOGWARTS_PARKS.every((p) => parks.includes(p));
}

/** A plan day's place on its ticket, for "Disney day 2 of 4" and the day's sheet. */
export interface TicketDayInfo {
  kind: 'owned' | 'suggested';
  resort: string;
  /** The day's number: the ticket day, or on an every-day ticket the day of its window. */
  day: number;
  /** "of n": the ticket's days, or an every-day ticket's window; `null` for a pass. */
  of: number | null;
  everyDay: boolean;
  pass: boolean;
  /** The owned ticket's window, for "Your ticket is valid … to …". */
  from?: string;
  to?: string;
  hopper: boolean;
}

/**
 * Where a plan day sits on its ticket, from `ticket` and `ticketDay` and the ticket the meta names;
 * `null` for a day without a ticket and for a water-park visit on the allowance.
 */
export function ticketDayOf(
  day: Pick<PlanDay, 'ticket' | 'ticketDay' | 'ticketAllowance'>,
  meta: Pick<PlanMeta, 'tickets' | 'ticketSuggestion'>,
  catalog: TicketCatalog
): TicketDayInfo | null {
  if (!day.ticket || day.ticketAllowance) return null;
  const owned = meta.tickets?.find((t) => t.id === day.ticket);
  if (owned) {
    const product = catalog.get(owned.product);
    if (!product) return null;
    if (product.pass) {
      return {
        kind: 'owned',
        resort: product.resort,
        day: 0,
        of: null,
        everyDay: false,
        pass: true,
        hopper: owned.hopper === true,
      };
    }
    if (day.ticketDay == null) return null;
    const everyDay = owned.windowDays != null || isEveryDayTicket(product, owned.days ?? null);
    return {
      kind: 'owned',
      resort: product.resort,
      day: day.ticketDay,
      of: everyDay
        ? (owned.windowDays ?? windowLength(product, owned.days ?? null))
        : (owned.days ?? ticketLength(product, null)),
      everyDay,
      pass: false,
      from: owned.start,
      to: owned.end,
      hopper: owned.hopper === true,
    };
  }
  const suggested = meta.ticketSuggestion?.find((s) => s.id === day.ticket);
  if (!suggested || day.ticketDay == null) return null;
  return {
    kind: 'suggested',
    resort: suggested.resort,
    day: day.ticketDay,
    of: suggested.days,
    everyDay: false,
    pass: false,
    hopper: false,
  };
}

/** How an owned ticket's days were used, for its row: counted, every day, or a pass. */
export type OwnedUse =
  | { kind: 'counted'; used: number; days: number; unused: number; reason: string | null }
  | { kind: 'everyDay'; used: number; window: number }
  | { kind: 'pass'; used: number };

/** An owned ticket's use, read the contract's way for its kind of product. */
export function ownedUse(ticket: PlanOwnedTicket, catalog: TicketCatalog): OwnedUse {
  const product = catalog.get(ticket.product);
  const unknownPass = !product && ticket.days === undefined && ticket.windowDays === undefined;
  if (product?.pass || unknownPass) return { kind: 'pass', used: ticket.usedDays };
  const window =
    ticket.windowDays ??
    (product && isEveryDayTicket(product, ticket.days ?? null)
      ? windowLength(product, ticket.days ?? null)
      : null);
  if (window !== null && window !== undefined) {
    return { kind: 'everyDay', used: ticket.usedDays, window };
  }
  const days = ticket.days ?? (product ? (ticketLength(product, null) ?? 0) : 0);
  return {
    kind: 'counted',
    used: ticket.usedDays,
    days,
    unused: ticket.unusedDays ?? Math.max(0, days - ticket.usedDays),
    reason: ticket.unusedReason ?? null,
  };
}

/** The planned visits of a park, for "Leave this visit out" on a day outside its ticket. */
export function plannedVisits(days: readonly Pick<PlanDay, 'parks'>[], slug: string): number {
  return days.filter((d) => d.parks.some((p) => p.slug === slug)).length;
}
