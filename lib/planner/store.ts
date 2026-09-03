import { getCookie, setCookie } from 'cookies-next';
import {
  EMPTY_PLANNER_STATE,
  PLANNER_BLOCK_ICONS,
  hasAnyPlan,
  type PlannerBlockIcon,
  type PlannerCustomBlock,
  type PlannerEntry,
  type PlannerGeo,
  type PlannerState,
} from './types';

/**
 * The planner's storage, as an external store.
 *
 * Split across two places on purpose. The **cookie** holds one character —
 * whether a plan exists at all — because it is the only half the server can read,
 * and knowing "there is something to open" is all the server needs to reserve the
 * right box before hydration. The **plan itself** lives in localStorage: a
 * multi-day, multi-park trip runs to a few KB and a cookie caps out at 4, and it
 * would be sent up with every single request for nothing.
 *
 * It is an external store rather than React state for the reason
 * `temperature-unit-context.tsx` documents at length: hydration is not one pass.
 * Boundaries commit separately, so a provider effect that reads localStorage has
 * already run while a consumer further down the tree is still waiting — and that
 * consumer then hydrates against a value the server never rendered. React logs
 * the subtree and patches nothing. `useSyncExternalStore` takes a separate server
 * snapshot, so the first render is empty by construction and the real plan
 * arrives in the re-render right after it.
 */

const STORAGE_KEY = 'parkfan_planner';
const COOKIE_NAME = 'planner';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

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
 * One entry, accepting both shapes for one release.
 *
 * The grid moved an entry's time from a whole `hour` to a `startMinute`, and
 * `parseState`'s policy is that anything unrecognised is DROPPED rather than
 * repaired. localStorage is the only copy of a plan, so a visitor with a second
 * tab open across a deploy boundary would have watched the older tab quietly
 * empty their trip. A legacy `hour` is therefore lifted to `hour * 60` on read,
 * and both fields are written on save, until the mirror can go.
 */

/**
 * A free block, or `null` where the stored shape is not one.
 *
 * Read defensively because this comes out of localStorage, which is the only
 * copy a plan has and which a previous build wrote. An icon outside the closed
 * set falls back rather than dropping the block: the visitor's LABEL is the part
 * they typed, and losing a lunch break over an unknown icon name would be the
 * store deleting their plan to protect a class name.
 */
function toCustomBlock(value: unknown): PlannerCustomBlock | null {
  if (typeof value !== 'object' || value === null) return null;
  const c = value as Record<string, unknown>;
  if (typeof c.label !== 'string') return null;
  const icon = PLANNER_BLOCK_ICONS.includes(c.icon as PlannerBlockIcon)
    ? (c.icon as PlannerBlockIcon)
    : 'star';
  const raw = typeof c.durationMinutes === 'number' ? c.durationMinutes : 60;
  return {
    label: c.label.slice(0, 60),
    icon,
    durationMinutes: Math.max(5, Math.min(720, Math.round(raw))),
  };
}

function toEntry(value: unknown): PlannerEntry | null {
  if (typeof value !== 'object' || value === null) return null;
  const e = value as Record<string, unknown>;
  if (typeof e.id !== 'string') return null;

  // A free block carries a `custom` object and no ride. A RIDE without its two
  // strings is a broken row and is dropped, as before — the relaxation here is
  // for the new shape, not a general loosening.
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
    startMinute: Math.max(0, Math.min(1500, Math.round(startMinute))),
    hour: Math.floor(Math.max(0, Math.min(1500, startMinute)) / 60),
    ...(e.done === true ? { done: true } : {}),
    ...(typeof e.actualWait === 'number' ? { actualWait: e.actualWait } : {}),
  };
}

/**
 * Anything unrecognised is dropped rather than repaired. The stored shape will
 * change while this feature is being built, and a half-understood plan drawn as
 * if it were whole is worse than an empty one.
 */
function parseState(raw: string): PlannerState {
  const parsed = secureJsonParse(raw);
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
          days[date] = {
            date,
            entries: entries.map(toEntry).filter((entry): entry is PlannerEntry => entry !== null),
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
        // Stored so the cross-park overview and an add button on a page with no
        // park payload can each answer "what day is it there?" — a question the
        // browser's own offset gets wrong for any park in another zone.
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
    // A private window, cleared site data, or a browser refusing storage
    // outright. An empty plan is the right answer; a thrown error here would
    // take down every page, because this store is mounted in the layout.
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
    // One character, and only so the SERVER can reserve the right box before
    // hydration. Never the plan itself: that would ride along on every request.
    setCookie(COOKIE_NAME, hasAnyPlan(next) ? '1' : '0', {
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      path: '/',
    });
  } catch {
    // Storage refused. The change still applies in memory for this session
    // rather than being silently discarded under the visitor's hands.
  }
  for (const listener of listeners) listener();
}

/** Server-readable hint that this visitor has a plan. Read during SSR. */
export function plannerCookieSaysHasPlan(): boolean {
  return getCookie(COOKIE_NAME) === '1';
}

export const plannerStore = {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  /** Replace the whole state through a reducer, then notify. */
  update(recipe: (state: PlannerState) => PlannerState): void {
    if (typeof window === 'undefined') return;
    const next = recipe(getSnapshot());
    write({ ...next, version: next.version + 1 });
  },
};

export { STORAGE_KEY as PLANNER_STORAGE_KEY, COOKIE_NAME as PLANNER_COOKIE_NAME };
