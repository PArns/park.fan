import type { PlanDay, PlanMove, PlanStay, TripPlan } from './plan';
import type { TripBase, TripBaseLeg, TripGateway } from './types';

/**
 * A trip across several cities (Japan, Paris): the plan's stays and moves as the views draw them,
 * and the region's gateways as the Route step offers them. Pure, and free of React, so
 * `scripts/test-orlando-plan.mjs` checks it. The contract: the API's
 * `docs/frontend/trip-regions.md#bases-a-trip-across-several-cities`.
 */

/** A stay of the plan with its place on the route, which its numbered marker shows. */
export interface PlanStayRun extends PlanStay {
  /** 1-based, in route order. */
  number: number;
}

/** The plan's stays in route order, numbered; empty in a region without bases. */
export function planStays(plan: Pick<TripPlan, 'meta'>): PlanStayRun[] {
  return (plan.meta.stays ?? []).map((stay, i) => ({ ...stay, number: i + 1 }));
}

/** Whether the plan sleeps in more than one place, the one case the stays are drawn at all. */
export function movesBetweenStays(plan: Pick<TripPlan, 'meta'>): boolean {
  return (plan.meta.stays?.length ?? 0) > 1;
}

/**
 * The stay a day is listed under: where it is spent. A morning move's park day and a travel day
 * belong to the city reached, an evening move's park day to the city left, every other day to the
 * night's base (the departure day's is where it starts).
 */
export function dayStayBase(day: Pick<PlanDay, 'base' | 'move'>): string | null {
  if (day.move?.when === 'evening') return day.move.from;
  return day.base ?? null;
}

/** One section of the list view: a stay, the move that leads into it, and its days. */
export interface PlanStaySection {
  stay: PlanStayRun | null;
  /** The day whose move reaches this stay; on an evening move it is the last day of the section before. */
  arrival: PlanDay | null;
  days: PlanDay[];
}

/**
 * The trip's days in sections, one per stay in route order, each opening on the move that reaches
 * it. A region without bases, or a plan with one stay, is one section without a stay.
 */
export function staySections(plan: Pick<TripPlan, 'meta' | 'days'>): PlanStaySection[] {
  const stays = planStays(plan);
  if (stays.length < 2) return [{ stay: null, arrival: null, days: [...plan.days] }];
  const byBase = new Map(stays.map((s) => [s.base, s]));
  const sections: PlanStaySection[] = [];
  let pending: PlanDay | null = null;
  for (const day of plan.days) {
    const base = dayStayBase(day);
    const current = sections.at(-1);
    if (!current || (base !== null && current.stay?.base !== base)) {
      const arrival = day.move && day.move.when !== 'evening' ? day : pending;
      sections.push({ stay: (base ? byBase.get(base) : undefined) ?? null, arrival, days: [day] });
      pending = null;
    } else {
      current.days.push(day);
    }
    if (day.move?.when === 'evening') pending = day;
  }
  return sections;
}

/** Half a day of the Week view's band: the city it is spent in, `null` before arrival and after departure. */
export type StayHalf = string | null;

/**
 * Each day's two halves for the Week view's stay band: the first belongs to the city the day
 * starts in, the second to the city it ends in, so a stay runs from the second half of its
 * arrival day to the first half of its departure day.
 */
export function stayHalves(days: readonly Pick<PlanDay, 'date' | 'base' | 'move'>[]): StayHalf[] {
  const halves: StayHalf[] = [];
  days.forEach((day, i) => {
    const start = i === 0 ? null : (day.move?.from ?? days[i - 1]?.base ?? day.base ?? null);
    const end = i === days.length - 1 ? null : (day.base ?? null);
    halves.push(start, end);
  });
  return halves;
}

/** A run of consecutive halves in one city: `start` and `end` are half indices, `end` exclusive. */
export interface StayBandRun {
  base: string;
  start: number;
  end: number;
}

/** The band's runs: consecutive halves of one city merged, gaps (before arrival, after departure) left out. */
export function stayBandRuns(halves: readonly StayHalf[]): StayBandRun[] {
  const runs: StayBandRun[] = [];
  halves.forEach((base, i) => {
    if (base === null) return;
    const last = runs.at(-1);
    if (last && last.base === base && last.end === i) last.end = i + 1;
    else runs.push({ base, start: i, end: i + 1 });
  });
  return runs;
}

/** A gateway the Route step offers, and the base it pins (`null`: several bases list it, the plan picks). */
export interface GatewayChoice {
  /** The base it sends as `startBase`/`endBase`; `null` for a gateway several bases share. */
  base: string | null;
  gateways: TripGateway[];
}

/**
 * The Route step's choices: per base the gateways only it lists, in the region's base order, and
 * last the gateways several bases share, which pin nothing (the contract: a gateway pins a base
 * only when exactly one base lists it).
 */
export function gatewayChoices(bases: readonly TripBase[]): GatewayChoice[] {
  const owners = new Map<string, string[]>();
  for (const base of bases) {
    for (const g of base.gateways ?? [])
      owners.set(g.code, [...(owners.get(g.code) ?? []), base.key]);
  }
  const ordered = [...bases].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const out: GatewayChoice[] = [];
  for (const base of ordered) {
    const own = (base.gateways ?? []).filter((g) => owners.get(g.code)?.length === 1);
    if (own.length > 0) out.push({ base: base.key, gateways: own });
  }
  const seen = new Set<string>();
  const shared: TripGateway[] = [];
  for (const base of ordered) {
    for (const g of base.gateways ?? []) {
      if ((owners.get(g.code)?.length ?? 0) > 1 && !seen.has(g.code)) {
        seen.add(g.code);
        shared.push(g);
      }
    }
  }
  if (shared.length > 0) out.push({ base: null, gateways: shared });
  return out;
}

/** The leg between two bases, either way round. */
export function baseLeg(
  legs: readonly TripBaseLeg[] | undefined,
  a: string,
  b: string
): TripBaseLeg | null {
  return (
    (legs ?? []).find((l) => (l.from === a && l.to === b) || (l.from === b && l.to === a)) ?? null
  );
}

/** A move's minutes from leaving to arriving, park-local ISO times, else the leg's own figure. */
export function moveMinutes(move: Pick<PlanMove, 'departAt' | 'arriveAt' | 'minutes'>): number {
  const a = Date.parse(move.departAt ?? '');
  const b = Date.parse(move.arriveAt ?? '');
  return Number.isFinite(a) && Number.isFinite(b) && b > a
    ? Math.round((b - a) / 60_000)
    : move.minutes;
}

/** What the Month view's band says on one date: the night's stay, the one the day starts in, and whether a stay begins. */
export interface MonthStayCell {
  stay: PlanStayRun;
  /** The stay the day starts in, on a move day. */
  left: PlanStayRun | null;
  /** The stay begins on this date; the grid also names the city at the start of each week row. */
  first: boolean;
}

/**
 * Each date's stay for the Month view's band, by date; empty when the plan sleeps in one place,
 * which draws no band.
 */
export function monthStayCells(plan: Pick<TripPlan, 'meta' | 'days'>): Map<string, MonthStayCell> {
  const stays = planStays(plan);
  const cells = new Map<string, MonthStayCell>();
  if (stays.length < 2) return cells;
  const byBase = new Map(stays.map((s) => [s.base, s]));
  for (const day of plan.days) {
    const stay = day.base ? byBase.get(day.base) : undefined;
    if (!stay) continue;
    const left = day.move ? (byBase.get(day.move.from) ?? null) : null;
    cells.set(day.date, {
      stay,
      left,
      first: day.date === stay.from || (left !== null && left !== stay),
    });
  }
  return cells;
}
