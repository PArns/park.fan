import { orlandoPath, ORLANDO_PLANNER_ID } from './paths';
import type { TicketProduct, TripRegion } from './types';

/**
 * The Orlando trip planner's state and its one URL form. The state lives in the address bar under
 * the API's own `/plan` names (and, for the When mode, `when=<from>_<to>&days&within`), so the
 * page, "Copy link", the best-time pages and Parky's `plan_vacation` and `find_trip_dates` links
 * all open the same plan: whatever builds a URL builds it here, and whatever reads one reads it
 * here. Pure, and free of React; `scripts/test-orlando-plan.mjs` checks it.
 */

/** The plan's `hotel=`: which resort's perks count. */
export const PLAN_HOTELS = [
  'disney',
  'disney_deluxe',
  'universal',
  'universal_premier',
  'offsite',
] as const;
/** One of {@link PLAN_HOTELS}. */
export type PlanHotel = (typeof PLAN_HOTELS)[number];

/** `rest=`: automatic, none, or at most n park days in a row. */
export type PlanRest = 'auto' | 'none' | `max:${number}`;

/** A pin: a park on a date, or `rest` for a day off. */
export interface PlanLock {
  target: string;
  date: string;
}

/** A chosen park; `visits` null leaves the count to the API's split. */
export interface PlanParkPick {
  slug: string;
  visits: number | null;
}

/** Whether a ticket has the hopper option: `.h`, nothing, or `.h?` (the visitor does not know). */
export type PlanTicketHopper = 'yes' | 'no' | 'unsure';

/** One owned ticket, as `tickets=` writes it: `<product>[.<days>][.h|.h?][@<YYYY-MM-DD>]`. */
export interface PlanTicket {
  product: string;
  /** The length, where the product sells several; `null` where it sells one, and for a pass. */
  days: number | null;
  hopper: PlanTicketHopper;
  /** The start chosen at purchase (or the first visit); `null` leaves it to the plan. */
  start: string | null;
}

/** A search range of the When mode, both ends included. */
export interface PlanSearchRange {
  from: string;
  to: string;
}

/**
 * Everything the visitor chose, which is everything the `/plan` query carries, and the When mode's
 * search (`/when`): with `when` set the planner looks for the best dates instead of planning given
 * ones, and `from`/`to` stay empty.
 */
export interface OrlandoPlanState {
  from: string | null;
  to: string | null;
  /** The When mode's search range; `null` when the visitor knows the dates. */
  when: PlanSearchRange | null;
  /** The When mode's trip length, arrival and departure included. */
  days: number;
  /** The When mode's school-holiday region (`DE-NW`), or `null`. */
  within: string | null;
  /** `null` until the visitor touches the parks: the region's headliners, the API's default. */
  parks: PlanParkPick[] | null;
  hotel: PlanHotel | null;
  area: string | null;
  arrival: 'free' | 'park';
  departure: 'free' | 'park';
  /**
   * `blocks=`: each resort's days together (`true`), mixed (`false`), or the API's default
   * (`null`): together on plan first, and inside owned tickets' windows mixed only where it pays.
   */
  blocks: boolean | null;
  fireworks: 'want' | 'any';
  rest: PlanRest;
  hop: boolean;
  /** `ticket=hopper`: every plan-first resort with its hopper, as older links and Parky ask. */
  ticket: 'base' | 'hopper';
  /** `hopper=`: the plan-first resorts planned with the hopper option. */
  hopper: string[];
  /** `tickets=`: the tickets the visitor already has, in the order entered. */
  tickets: PlanTicket[];
  /** `evenings=`: an evening at a second park or a venue after a park that closes early. */
  evenings: boolean;
  split: 'auto' | 'fixed';
  locks: PlanLock[];
}

/** A trip runs at most three weeks, arrival and departure included. */
export const MAX_TRIP_DAYS = 21;
/** A park takes at most this many visits. */
export const MAX_VISITS_PER_PARK = 3;
/** A plan places at most this many visits, repeats included. */
export const MAX_PLAN_VISITS = 16;
/** `rest=max:n` takes n from 1 to this. */
export const MAX_REST_STREAK = 9;
/** A plan reaches at most a year ahead. */
export const MAX_DAYS_AHEAD = 365;
/** The When mode's shortest trip. */
export const MIN_FIND_DAYS = 3;
/** The When mode's trip length before the visitor sets one. */
export const DEFAULT_FIND_DAYS = 10;
/** A plan takes at most this many owned tickets. */
export const MAX_TICKETS = 6;

/** The state before the visitor has chosen anything: the API's defaults, no dates. */
export const DEFAULT_PLAN_STATE: OrlandoPlanState = {
  from: null,
  to: null,
  when: null,
  days: DEFAULT_FIND_DAYS,
  within: null,
  parks: null,
  hotel: null,
  area: null,
  arrival: 'free',
  departure: 'free',
  blocks: null,
  fireworks: 'any',
  rest: 'auto',
  hop: false,
  ticket: 'base',
  hopper: [],
  tickets: [],
  evenings: true,
  split: 'auto',
  locks: [],
};

/**
 * The query names in the order a URL is written in, the `/plan` route's own. `parties` is not one
 * of them: it is read from older links (see {@link readPlanQuery}) and never written.
 */
export const PLAN_QUERY_NAMES = [
  'from',
  'to',
  'when',
  'days',
  'within',
  'parks',
  'hotel',
  'area',
  'arrival',
  'departure',
  'blocks',
  'fireworks',
  'rest',
  'hop',
  'ticket',
  'hopper',
  'tickets',
  'evenings',
  'split',
  'lock',
] as const;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9-]+$/;
const AREA = /^[a-z_]+$/;
/** A school-holiday region as the holiday data spells it: `DE-NW`, `GB-ENG`, `NL-north`. */
const WITHIN = /^[A-Z]{2}-[A-Za-z]{1,10}$/;

/** A real `YYYY-MM-DD` day, not `2026-02-31`. */
export function isPlanDate(value: string | null | undefined): value is string {
  if (!value || !DATE.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** What the reader needs of a region to check a link against it. */
export interface PlanRegionKeys {
  parks: ReadonlySet<string>;
  areas: ReadonlySet<string>;
  /**
   * The ticket catalog by id, and the resorts `hopper=` may name. Without them (an API that does
   * not plan with tickets yet) a link's `tickets` and `hopper` are dropped, since the API would
   * answer both with a 400.
   */
  tickets?: ReadonlyMap<string, TicketProduct>;
  resorts?: ReadonlySet<string>;
}

/** The slugs, hotel areas, tickets and resorts a link may name, from the region the page rendered. */
export function planRegionKeys(
  region: Pick<TripRegion, 'parks' | 'hotelAreas' | 'groups' | 'tickets'>
): PlanRegionKeys {
  return {
    parks: new Set(region.parks.map((p) => p.slug)),
    areas: new Set(region.hotelAreas.map((a) => a.key)),
    ...(region.tickets && {
      tickets: new Map(region.tickets.map((t) => [t.id, t])),
      resorts: new Set(region.groups.filter((g) => g.kind === 'resort').map((g) => g.key)),
    }),
  };
}

const TICKET_PRODUCT = /^[a-z0-9-]+$/;

/**
 * One `tickets=` item, or `null` where it cannot be read. With the product from the catalog the item
 * is checked against it: an unknown product or a length it does not sell drops the item, a hopper
 * flag the product cannot take is dropped from it, and a length or a date on a pass goes.
 */
export function readTicketItem(text: string, product?: TicketProduct | null): PlanTicket | null {
  const [head, date, extra] = text.split('@');
  if (extra !== undefined || (date !== undefined && !isPlanDate(date))) return null;
  const [id, ...flags] = (head ?? '').split('.');
  if (!id || !TICKET_PRODUCT.test(id) || product === null) return null;
  let days: number | null = null;
  let hopper: PlanTicketHopper = 'no';
  for (const f of flags) {
    if (/^[1-9]\d?$/.test(f) && days === null) days = Number(f);
    else if (f === 'h' || f === 'h?') hopper = f === 'h' ? 'yes' : 'unsure';
    else return null;
  }
  const item: PlanTicket = { product: id, days, hopper, start: date ?? null };
  if (!product) return item;
  if (product.days === 'unlimited' || product.pass) {
    item.days = null;
    if (product.pass) item.start = null;
  } else if (product.days.min === product.days.max) {
    if (days !== null && days !== product.days.min) return null;
    item.days = null;
  } else if (days === null || days < product.days.min || days > product.days.max) {
    return null;
  }
  if (product.hopping !== 'optional') item.hopper = 'no';
  return item;
}

/** One ticket in its URL form, the flags in the contract's order. */
export function writeTicketItem(item: PlanTicket): string {
  return [
    item.product,
    item.days !== null ? `.${item.days}` : '',
    item.hopper === 'yes' ? '.h' : item.hopper === 'unsure' ? '.h?' : '',
    item.start ? `@${item.start}` : '',
  ].join('');
}

/**
 * A link's `tickets` read leniently, one item at a time, at most {@link MAX_TICKETS}; `dropped`
 * counts the items that could not be read, so the planner can say one was left out.
 */
export function readTickets(
  value: string | null,
  catalog?: ReadonlyMap<string, TicketProduct>
): { tickets: PlanTicket[]; dropped: number } {
  const tickets: PlanTicket[] = [];
  let dropped = 0;
  for (const part of (value ?? '').split(',')) {
    if (!part) continue;
    const item = readTicketItem(
      part,
      catalog ? (catalog.get(part.split(/[.@]/)[0]) ?? null) : undefined
    );
    if (item && tickets.length < MAX_TICKETS) tickets.push(item);
    else dropped += 1;
  }
  return { tickets, dropped };
}

const flag = (value: string | null): boolean | null =>
  value === '1' || value === 'true' ? true : value === '0' || value === 'false' ? false : null;

/** Anything with `get`, so `URLSearchParams` and Next's read-only variant both fit. */
export interface QueryReader {
  get(name: string): string | null;
}

/**
 * The state a URL describes. Lenient by design: a link from Parky, an old copy or a hand edit
 * opens what can be read and drops the rest, one parameter at a time, so a single bad value never
 * costs the visitor the whole plan. Older links carry `parties=avoid|allow|prefer`, which the
 * fireworks question replaced; none of them meant "I want to see the fireworks", so each reads as
 * `fireworks=any`.
 */
export function readPlanQuery(query: QueryReader, keys?: PlanRegionKeys): OrlandoPlanState {
  const state: OrlandoPlanState = { ...DEFAULT_PLAN_STATE, hopper: [], tickets: [], locks: [] };

  const from = query.get('from');
  const to = query.get('to');
  if (isPlanDate(from) && isPlanDate(to) && from <= to) {
    state.from = from;
    state.to = to;
  } else {
    // `when=<from>_<to>`: the When mode. Given dates win where a link carries both.
    const [a, b, extra] = (query.get('when') ?? '').split('_');
    if (extra === undefined && isPlanDate(a) && isPlanDate(b) && a <= b) {
      state.when = { from: a, to: b };
      const days = Number(query.get('days'));
      if (Number.isInteger(days) && days > 0) {
        state.days = Math.max(MIN_FIND_DAYS, Math.min(MAX_TRIP_DAYS, days));
      }
      const within = query.get('within');
      if (within && WITHIN.test(within)) state.within = within;
    }
  }

  const parks = query.get('parks');
  if (parks) {
    const picks: PlanParkPick[] = [];
    for (const part of parks.split(',')) {
      const [slug, n, extra] = part.split(':');
      if (extra !== undefined || !SLUG.test(slug ?? '')) continue;
      if (keys && !keys.parks.has(slug)) continue;
      if (picks.some((p) => p.slug === slug)) continue;
      let visits: number | null = null;
      if (n !== undefined) {
        const count = Number(n);
        if (!Number.isInteger(count) || count < 1) continue;
        visits = Math.min(count, MAX_VISITS_PER_PARK);
      }
      picks.push({ slug, visits });
    }
    if (picks.length > 0) state.parks = picks;
  }

  const hotel = query.get('hotel');
  if (hotel && (PLAN_HOTELS as readonly string[]).includes(hotel)) {
    state.hotel = hotel as PlanHotel;
  }
  const area = query.get('area');
  if (area && AREA.test(area) && (!keys || keys.areas.has(area))) state.area = area;

  if (query.get('arrival') === 'park') state.arrival = 'park';
  if (query.get('departure') === 'park') state.departure = 'park';
  state.blocks = flag(query.get('blocks'));
  state.hop = flag(query.get('hop')) ?? DEFAULT_PLAN_STATE.hop;
  if (query.get('ticket') === 'hopper') state.ticket = 'hopper';
  // A region read without a catalog means an API that would answer both with a 400.
  if (!keys || keys.tickets) {
    state.tickets = readTickets(query.get('tickets'), keys?.tickets).tickets;
    for (const resort of (query.get('hopper') ?? '').split(',')) {
      if (!SLUG.test(resort) || state.hopper.includes(resort)) continue;
      if (keys?.resorts && !keys.resorts.has(resort)) continue;
      state.hopper.push(resort);
    }
  }
  state.evenings = flag(query.get('evenings')) ?? DEFAULT_PLAN_STATE.evenings;

  const fireworks = query.get('fireworks');
  state.fireworks = fireworks === 'want' ? 'want' : 'any';

  const rest = query.get('rest');
  if (rest === 'none' || rest === 'auto') state.rest = rest;
  else if (rest && /^max:[1-9]$/.test(rest)) state.rest = rest as PlanRest;

  if (query.get('split') === 'fixed') state.split = 'fixed';

  const lock = query.get('lock');
  if (lock) {
    for (const part of lock.split(',')) {
      const [target, date, extra] = part.split('@');
      if (extra !== undefined || !SLUG.test(target ?? '') || !isPlanDate(date)) continue;
      if (state.locks.some((l) => l.date === date)) continue;
      state.locks.push({ target, date });
    }
  }
  return normalizePlanState(state);
}

/**
 * The state with what cannot hold dropped: a pin outside the trip, on a park not chosen (the API
 * answers either with a 400), or the second pin of a day. Called after every change, so the URL
 * and the request never carry one.
 */
export function normalizePlanState(state: OrlandoPlanState): OrlandoPlanState {
  const { from, to } = state;
  if (state.when && (from || to)) return normalizePlanState({ ...state, when: null, within: null });
  const chosen = state.parks ? new Set(state.parks.map((p) => p.slug)) : null;
  const seen = new Set<string>();
  const locks = state.locks
    .filter((l) => {
      if (!from || !to || l.date < from || l.date > to || seen.has(l.date)) return false;
      if (l.target !== 'rest' && chosen && !chosen.has(l.target)) return false;
      seen.add(l.date);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const same = locks.length === state.locks.length && locks.every((l, i) => l === state.locks[i]);
  return same ? state : { ...state, locks };
}

const restValue = (rest: PlanRest): string | null => (rest === 'auto' ? null : rest);

/**
 * The state as `/plan` query pairs, in {@link PLAN_QUERY_NAMES} order, with each value that is the
 * API's default left out so a link stays short. `parks` is written whenever the visitor chose them,
 * so a link keeps its parks when the region's default changes.
 */
export function planQueryEntries(state: OrlandoPlanState): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  if (state.from && state.to) {
    out.push(['from', state.from], ['to', state.to]);
  } else if (state.when) {
    out.push(['when', `${state.when.from}_${state.when.to}`], ['days', String(state.days)]);
    if (state.within) out.push(['within', state.within]);
  }
  if (state.parks && state.parks.length > 0) {
    out.push([
      'parks',
      state.parks.map((p) => (p.visits ? `${p.slug}:${p.visits}` : p.slug)).join(','),
    ]);
  }
  if (state.hotel) out.push(['hotel', state.hotel]);
  if (state.area) out.push(['area', state.area]);
  if (state.arrival === 'park') out.push(['arrival', 'park']);
  if (state.departure === 'park') out.push(['departure', 'park']);
  if (state.blocks !== null) out.push(['blocks', state.blocks ? '1' : '0']);
  if (state.fireworks === 'want') out.push(['fireworks', 'want']);
  const rest = restValue(state.rest);
  if (rest) out.push(['rest', rest]);
  if (state.hop) out.push(['hop', '1']);
  if (state.ticket === 'hopper') out.push(['ticket', 'hopper']);
  if (state.hopper.length > 0) out.push(['hopper', state.hopper.join(',')]);
  if (state.tickets.length > 0) out.push(['tickets', state.tickets.map(writeTicketItem).join(',')]);
  if (!state.evenings) out.push(['evenings', '0']);
  if (state.split === 'fixed') out.push(['split', 'fixed']);
  if (state.locks.length > 0 && !state.when) {
    out.push(['lock', state.locks.map((l) => `${l.target}@${l.date}`).join(',')]);
  }
  return out;
}

/**
 * The query string for the address bar, `''` for the untouched state. Commas, colons, `@` and the
 * `?` of `.h?` stay readable: `URLSearchParams` would encode them, and a link Parky prints should
 * look like the one the page writes.
 */
export function writePlanQuery(state: OrlandoPlanState): string {
  return planQueryEntries(state)
    .map(
      ([k, v]) =>
        `${k}=${encodeURIComponent(v)
          .replace(/%2C/g, ',')
          .replace(/%3A/g, ':')
          .replace(/%40/g, '@')
          .replace(/%3F/g, '?')}`
    )
    .join('&');
}

/**
 * The address of this plan on `pathname` (the hub or a month page), opening on the planner, which
 * "Copy link" shares and `history.replaceState` writes after each change.
 */
export function planHref(
  pathname: string,
  state: OrlandoPlanState,
  anchor: string = ORLANDO_PLANNER_ID
): string {
  const query = writePlanQuery(state);
  return `${pathname}${query ? `?${query}` : ''}#${anchor}`;
}

/** A planner state as a page outside the planner names it: any field, the rest the defaults. */
export type OrlandoPlannerHrefInput = Partial<Omit<OrlandoPlanState, 'parks'>> & {
  /** Slugs (the API's default count) or picks with a count. */
  parks?: ReadonlyArray<string | PlanParkPick> | null;
};

/**
 * The locale-relative address that opens the planner on a state, for `Link` from
 * `@/i18n/navigation`: `/orlando?from=…&to=…&parks=…#planner`, or in the When mode
 * `/orlando?when=<from>_<to>&days=10&within=DE-NW&parks=…#planner`. `path` is the hub by default,
 * a month page where the link should stay on it.
 */
export function orlandoPlannerHref(
  input: OrlandoPlannerHrefInput,
  path: string = orlandoPath()
): string {
  const parks =
    input.parks == null
      ? null
      : input.parks.map((p) => (typeof p === 'string' ? { slug: p, visits: null } : { ...p }));
  const state = normalizePlanState({
    ...DEFAULT_PLAN_STATE,
    ...input,
    parks: parks && parks.length > 0 ? parks : null,
    hopper: [...(input.hopper ?? [])],
    tickets: (input.tickets ?? []).slice(0, MAX_TICKETS).map((t) => ({ ...t })),
    locks: [...(input.locks ?? [])],
  });
  return planHref(path, state, ORLANDO_PLANNER_ID);
}
