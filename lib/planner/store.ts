import {
  DEFAULT_CUSTOM_MINUTES,
  EMPTY_PLANNER_STATE,
  MAX_CUSTOM_LABEL_LENGTH,
  MAX_CUSTOM_MINUTES,
  MAX_PLANNED_MINUTE,
  MIN_CUSTOM_MINUTES,
  PLANNER_BLOCK_ICONS,
  type PlannerBlockIcon,
  type PlannerCustomBlock,
  type PlannerDayPrefs,
  type PlannerEntry,
  type PlannerGeo,
  type PlannerState,
} from './types';
import { clampRiderHeight } from './party';

/**
 * The planner's storage, as an external store over localStorage alone; a multi-park trip is a few
 * KB and would ride on every request as a cookie.
 *
 * An external store rather than React state, because hydration is not one pass (see
 * `temperature-unit-context.tsx`): `useSyncExternalStore` takes a separate server snapshot, so the
 * first render is empty by construction and the plan arrives in the re-render after it.
 */

/** The localStorage key the plan lives under. */
const STORAGE_KEY = 'parkfan_planner';

/** What the server rendered, and therefore what hydration has to see. */
const SERVER_STATE: PlannerState = EMPTY_PLANNER_STATE;

let current: PlannerState | null = null;
const listeners = new Set<() => void>();

/** Guards against prototype pollution, same as the favourites cookie parser. */
function secureJsonParse(raw: string): unknown {
  return JSON.parse(raw, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
    return value;
  });
}

/**
 * A free block, or `null` where the stored shape is not one. An icon outside the closed set falls
 * back rather than dropping the block, so the label the visitor typed survives.
 */
function toCustomBlock(value: unknown): PlannerCustomBlock | null {
  if (typeof value !== 'object' || value === null) return null;
  const c = value as Record<string, unknown>;
  if (typeof c.label !== 'string') return null;
  const icon = PLANNER_BLOCK_ICONS.includes(c.icon as PlannerBlockIcon)
    ? (c.icon as PlannerBlockIcon)
    : 'star';
  const raw = typeof c.durationMinutes === 'number' ? c.durationMinutes : DEFAULT_CUSTOM_MINUTES;
  return {
    label: c.label.slice(0, MAX_CUSTOM_LABEL_LENGTH),
    icon,
    durationMinutes: Math.max(MIN_CUSTOM_MINUTES, Math.min(MAX_CUSTOM_MINUTES, Math.round(raw))),
  };
}

/**
 * The day's party preferences, or `null` where there are none, so `hasPartyPrefs` can tell "not
 * asked" from "asked and answered nothing".
 */
function toPrefs(value: unknown): PlannerDayPrefs | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const height = typeof raw.riderHeightCm === 'number' ? clampRiderHeight(raw.riderHeightCm) : null;
  const avoidWet = raw.avoidWet === true;
  const earlyEntry = raw.earlyEntry === true;
  if (height === null && !avoidWet && !earlyEntry) return null;
  return {
    ...(height !== null ? { riderHeightCm: height } : {}),
    ...(avoidWet ? { avoidWet: true } : {}),
    ...(earlyEntry ? { earlyEntry: true } : {}),
  };
}

/**
 * One entry. A legacy `hour` is lifted to `hour * 60` on read and both fields are written on save,
 * so a tab on the previous build does not drop the plan, which has no other copy.
 */
function toEntry(value: unknown): PlannerEntry | null {
  if (typeof value !== 'object' || value === null) return null;
  const e = value as Record<string, unknown>;
  if (typeof e.id !== 'string') return null;

  // A free block carries a `custom` object and no ride. A ride without its two strings is a broken
  // row and is dropped.
  const custom = toCustomBlock(e.custom);
  if (!custom && (typeof e.attractionSlug !== 'string' || typeof e.attractionName !== 'string')) {
    return null;
  }

  const startMinute =
    typeof e.startMinute === 'number'
      ? e.startMinute
      : typeof e.hour === 'number'
        ? e.hour * 60
        : null;
  if (startMinute === null || !Number.isFinite(startMinute)) return null;

  return {
    id: e.id,
    ...(typeof e.attractionSlug === 'string' ? { attractionSlug: e.attractionSlug } : {}),
    ...(typeof e.attractionName === 'string' ? { attractionName: e.attractionName } : {}),
    ...(custom ? { custom } : {}),
    // Only with a `custom` block: a stray slug on a ride would claim a show position for a queue.
    ...(custom && typeof e.showSlug === 'string' && e.showSlug ? { showSlug: e.showSlug } : {}),
    // The ceiling `applyPlan` writes under, not the drag's 1500: an optimiser stop filed past the
    // gate must survive a reload. The storage boundary admits everything a writer may store.
    startMinute: Math.max(0, Math.min(MAX_PLANNED_MINUTE, Math.round(startMinute))),
    hour: Math.floor(Math.max(0, Math.min(MAX_PLANNED_MINUTE, startMinute)) / 60),
    ...(e.done === true ? { done: true } : {}),
    ...(typeof e.actualWait === 'number' ? { actualWait: e.actualWait } : {}),
  };
}

/**
 * Anything unrecognised is dropped rather than repaired: a half-understood plan drawn as if it were
 * whole is worse than an empty one.
 */
function parseState(raw: string): PlannerState {
  return toPlannerState(secureJsonParse(raw));
}

/**
 * A plan from outside this browser's storage, read by the same rules. Its one caller is the
 * shared-plan page, whose payload another browser wrote and the API checks only in outline.
 */
export function parsePlannerPayload(raw: string): PlannerState | null {
  let body: unknown;
  try {
    body = secureJsonParse(raw);
  } catch {
    return null;
  }
  if (typeof body !== 'object' || body === null) return null;
  return toPlannerState((body as Record<string, unknown>).payload);
}

function toPlannerState(parsed: unknown): PlannerState {
  if (typeof parsed !== 'object' || parsed === null) return EMPTY_PLANNER_STATE;

  const input = parsed as Record<string, unknown>;
  const parks: PlannerState['parks'] = {};

  if (typeof input.parks === 'object' && input.parks !== null) {
    for (const [slug, value] of Object.entries(input.parks as Record<string, unknown>)) {
      if (typeof value !== 'object' || value === null) continue;
      const park = value as Record<string, unknown>;
      const geo = park.geo as PlannerGeo | undefined;
      if (!geo || typeof geo.continent !== 'string') continue;

      const days: PlannerPark['days'] = {};
      if (typeof park.days === 'object' && park.days !== null) {
        for (const [date, dayValue] of Object.entries(park.days as Record<string, unknown>)) {
          if (typeof dayValue !== 'object' || dayValue === null) continue;
          const entries = (dayValue as Record<string, unknown>).entries;
          if (!Array.isArray(entries)) continue;
          const prefs = toPrefs((dayValue as Record<string, unknown>).prefs);
          days[date] = {
            date,
            entries: entries.map(toEntry).filter((entry): entry is PlannerEntry => entry !== null),
            ...(prefs ? { prefs } : {}),
            ...((dayValue as Record<string, unknown>).reserved === true ? { reserved: true } : {}),
          };
        }
      }

      parks[slug] = {
        slug,
        name: typeof park.name === 'string' ? park.name : slug,
        geo: {
          continent: geo.continent,
          country: String(geo.country ?? ''),
          city: String(geo.city ?? ''),
        },
        days,
        // Stored so pages without a park payload can answer "what day is it there?", which the
        // browser's own offset gets wrong for a park in another zone.
        ...(typeof park.timezone === 'string' ? { timezone: park.timezone } : {}),
      };
    }
  }

  return {
    parks,
    activeParkSlug: typeof input.activeParkSlug === 'string' ? input.activeParkSlug : null,
    activeDate: typeof input.activeDate === 'string' ? input.activeDate : null,
    version: typeof input.version === 'number' ? input.version : 1,
  };
}

type PlannerPark = PlannerState['parks'][string];

function readState(): PlannerState {
  if (typeof window === 'undefined') return EMPTY_PLANNER_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PLANNER_STATE;
    return parseState(raw);
  } catch {
    // A private window, cleared data, or refused storage: an empty plan, since a throw here would
    // take down every page, as this store is mounted in the layout.
    return EMPTY_PLANNER_STATE;
  }
}

/** Cached: `getSnapshot` runs on every render and must not re-parse each time. */
function getSnapshot(): PlannerState {
  current ??= readState();
  return current;
}

function getServerSnapshot(): PlannerState {
  return SERVER_STATE;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function write(next: PlannerState): void {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage refused: the change still applies in memory for this session.
  }
  for (const listener of listeners) listener();
}

/** The plan as an external store: subscribe, snapshots, and `update` through a reducer. */
export const plannerStore = {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  /**
   * Replace the whole state through a reducer, then notify. A reducer that returns the state it was
   * given ends here: no version bump, no write, no re-render, no trip sync for an unchanged plan.
   */
  update(recipe: (state: PlannerState) => PlannerState): void {
    if (typeof window === 'undefined') return;
    const previous = getSnapshot();
    const next = recipe(previous);
    if (next === previous) return;
    write({ ...next, version: next.version + 1 });
  },
};

export { STORAGE_KEY as PLANNER_STORAGE_KEY };
