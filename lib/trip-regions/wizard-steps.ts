import type { TicketCatalog } from './plan-tickets';
import type { TripPlanState } from './plan-query';
import type { TripRegionConfig } from './registry';
import type { TripRegion } from './types';

/**
 * Which steps the trip planner's assistant asks in a region, and what each step asks. Pure and free
 * of React, so `scripts/test-wizard-steps.mjs` pins the four regions' lists. The steps are data of
 * the region (its registry entry and the API's region), never a hand-built assistant per region:
 * docs/features/trip-planner/wizard.md#the-trip-planners-assistant.
 */

/** A step of the assistant, in the order it is asked. The finale is no step: it follows the last. */
export const TRIP_WIZARD_STEPS = [
  'dates',
  'parks',
  'hotel',
  'route',
  'hotels',
  'pace',
  'evenings',
  'tickets',
] as const;

/** A step of the assistant by its key, as the rail, the messages and the statistic name it. */
export type TripWizardStepKey = (typeof TRIP_WIZARD_STEPS)[number];

/**
 * One question a step asks: a group of cards, chips or a stepper on its screen. The count is what
 * decides whether a step stands alone or goes into its neighbour.
 */
export type TripWizardQuestion =
  | 'dates'
  | 'parks'
  | 'hotel'
  | 'area'
  | 'gateways'
  | 'cities'
  | 'city_areas'
  | 'move_buffer'
  | 'rest'
  | 'second_days'
  | 'travel_days'
  | 'evenings'
  | 'fireworks'
  | 'blocks'
  | 'hop'
  | 'tickets';

/** What the steps are worked out from: the region's data and, once chosen, the trip's nights. */
export interface TripWizardFacts {
  /** The region plans across cities (the API's `bases`): Route and Hotels instead of Hotel. */
  bases: boolean;
  /** The hotel kinds the planner offers in a region without bases. */
  hotelKinds: number;
  /** The hotel areas of a region without bases. */
  hotelAreas: number;
  /** A base has airports or stations to land at (`gateways`). */
  gateways: boolean;
  /** A base has more than one hotel area to choose from. */
  cityAreas: boolean;
  /** The plan takes a hotel change's buffer (`stayRules.moveBufferOptions`). */
  moveBuffers: boolean;
  /** The trip's nights, `null` before the dates are chosen. */
  nights: number | null;
  /** The region asks about a park's fireworks against its party nights. */
  fireworks: boolean;
  /** The region keeps two resorts' days together (`blockResorts`). */
  blocks: boolean;
  /** A resort of the region sells a hopper, so park hopping can count. */
  hopper: boolean;
}

/** A step as the assistant draws it. */
export interface TripWizardStep {
  key: TripWizardStepKey;
  /** Its own questions, then those of the steps merged into it, in the order they are drawn. */
  questions: readonly TripWizardQuestion[];
  /** The steps whose one question it took over, drawn after its own body. */
  merged: readonly TripWizardStepKey[];
}

/**
 * A hotel change needs a night on each side and a night to change on: with fewer the trip sleeps in
 * one city, so the change's buffer is not asked.
 */
export const MIN_NIGHTS_FOR_A_MOVE = 3;

/**
 * The steps that are always their own screen: the only required one, the one the plan's parks are
 * chosen in and the tickets. Only the option steps between them merge.
 */
const FIXED_STEPS: ReadonlySet<TripWizardStepKey> = new Set(['dates', 'parks', 'tickets']);

/** The questions of every step for a region, before any merging, in the order of the steps. */
export function wizardQuestions(
  facts: TripWizardFacts
): Array<{ key: TripWizardStepKey; questions: TripWizardQuestion[] }> {
  const pick = (entries: Array<[TripWizardQuestion, boolean]>) =>
    entries.filter(([, asked]) => asked).map(([question]) => question);
  const move =
    facts.moveBuffers && (facts.nights === null || facts.nights >= MIN_NIGHTS_FOR_A_MOVE);
  const all: Array<{ key: TripWizardStepKey; questions: TripWizardQuestion[] }> = [
    { key: 'dates', questions: ['dates'] },
    { key: 'parks', questions: ['parks'] },
    {
      key: 'hotel',
      questions: facts.bases
        ? []
        : pick([
            ['hotel', facts.hotelKinds > 1],
            ['area', facts.hotelAreas > 0],
          ]),
    },
    {
      key: 'route',
      questions: facts.bases
        ? pick([
            ['gateways', facts.gateways],
            ['cities', true],
          ])
        : [],
    },
    {
      key: 'hotels',
      questions: facts.bases
        ? pick([
            ['city_areas', facts.cityAreas],
            ['move_buffer', move],
          ])
        : [],
    },
    { key: 'pace', questions: ['rest', 'second_days', 'travel_days'] },
    {
      key: 'evenings',
      questions: pick([
        ['evenings', true],
        ['fireworks', facts.fireworks],
        ['blocks', facts.blocks],
        ['hop', facts.hopper],
      ]),
    },
    { key: 'tickets', questions: ['tickets'] },
  ];
  return all.filter((step) => step.questions.length > 0);
}

/**
 * The assistant's steps for a region: a step with one question goes into its neighbour, the option
 * step before it, else the one after (Japan's evening question sits in Tempo, Paris' hotel for a
 * weekend in the Route). The dates, the parks and the tickets are always their own step.
 */
export function tripWizardSteps(facts: TripWizardFacts): TripWizardStep[] {
  const steps: TripWizardStep[] = wizardQuestions(facts).map((step) => ({
    ...step,
    merged: [],
  }));
  const option = (step: TripWizardStep | undefined) =>
    step !== undefined && !FIXED_STEPS.has(step.key);
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    if (!option(step) || step.questions.length !== 1 || step.merged.length > 0) continue;
    const before = steps[i - 1];
    const after = steps[i + 1];
    const host = option(before) ? before : option(after) ? after : null;
    if (!host) continue;
    const into = host === before ? i - 1 : i + 1;
    steps[into] = {
      ...host,
      questions:
        host === before
          ? [...host.questions, ...step.questions]
          : [...step.questions, ...host.questions],
      merged: [...host.merged, step.key],
    };
    steps.splice(i, 1);
    i -= 1;
  }
  return steps;
}

/**
 * The facts of a region and a trip, as {@link tripWizardSteps} reads them: the API's region, the
 * registry's entry, the ticket catalog and the trip's dates.
 */
export function tripWizardFacts(
  region: Pick<TripRegion, 'bases' | 'hotelAreas' | 'stayRules'>,
  config: Pick<TripRegionConfig, 'hotels' | 'fireworks' | 'blockResorts' | 'tickets'>,
  state: Pick<TripPlanState, 'from' | 'to'>,
  nightsBetween: (from: string, to: string) => number,
  catalog?: Pick<TicketCatalog, 'size'>
): TripWizardFacts {
  const bases = region.bases ?? [];
  const hopperResorts = Object.keys(config.tickets?.hopperNames ?? {});
  return {
    bases: bases.length > 0,
    hotelKinds: config.hotels.length,
    hotelAreas: region.hotelAreas.length,
    gateways: bases.some((base) => (base.gateways?.length ?? 0) > 0),
    cityAreas: bases.some((base) => base.hotelAreas.length > 1),
    moveBuffers: (region.stayRules?.moveBufferOptions?.length ?? 0) > 1,
    nights: state.from && state.to ? nightsBetween(state.from, state.to) : null,
    fireworks: config.fireworks === true,
    blocks: (config.blockResorts?.length ?? 0) > 0,
    // Without a catalog the hopper cannot be planned with, so the question would change nothing.
    hopper: hopperResorts.length > 0 && (catalog === undefined || catalog.size > 0),
  };
}

/** The step each question belongs to, wherever it is drawn. */
export const QUESTION_STEP: Readonly<Record<TripWizardQuestion, TripWizardStepKey>> = {
  dates: 'dates',
  parks: 'parks',
  hotel: 'hotel',
  area: 'hotel',
  gateways: 'route',
  cities: 'route',
  city_areas: 'hotels',
  move_buffer: 'hotels',
  rest: 'pace',
  second_days: 'pace',
  travel_days: 'pace',
  evenings: 'evenings',
  fireworks: 'evenings',
  blocks: 'evenings',
  hop: 'evenings',
  tickets: 'tickets',
};

/** The questions of one step's body inside a drawn step: the host's own, or a merged step's. */
export function stepQuestions(step: TripWizardStep, key: TripWizardStepKey): TripWizardQuestion[] {
  return step.questions.filter((question) => QUESTION_STEP[question] === key);
}

/**
 * Where a step sits in the list: its own index, the index of the step it went into, or where the
 * region has no such step, the first step after it (`hotel` in Japan opens the Route). `-1` only
 * past the last.
 */
export function wizardStepIndex(steps: readonly TripWizardStep[], key: TripWizardStepKey): number {
  const at = steps.findIndex((step) => step.key === key || step.merged.includes(key));
  if (at !== -1) return at;
  const order = TRIP_WIZARD_STEPS.indexOf(key);
  return steps.findIndex((step) => TRIP_WIZARD_STEPS.indexOf(step.key) > order);
}
