/**
 * The shapes every other file in this module agrees on. DOM-free, Babylon-free, import-safe on the
 * worker and in node.
 *
 * Two of these are contracts with the outside world and are worth reading before changing:
 *
 * `GuestState` is written into the `guests.anim` frame buffer as a **byte**, so the numbers are
 * part of the wire format between the worker and the renderer, and a reordering is a save-and-a-
 * frame-format break rather than a refactor. They are declared as a frozen object rather than a
 * TypeScript `enum` because the sim runs under node's strip-only mode in the soak harness, where
 * an `enum` is a syntax error (`scripts/test-game-lint.mjs` greps for it).
 *
 * `GuestStyle` is a `u16` that both threads decode with the same pure function
 * (`appearance.ts`), and that is deliberate: the alternative — building a palette table from
 * `ctx.rng` on each side and trusting the two streams to stay in step — makes a guest's shirt
 * depend on how many times an unrelated module rolled a die.
 */

// ── Behaviour ───────────────────────────────────────────────────────────────────────────────
/**
 * What a guest is doing. Low nibble of `guests.anim`; the renderer picks a pose from it.
 *
 * `GONE` is the free-slot marker rather than a state anybody is in: the store never compacts
 * (see `store.ts`), so the buffers carry `capacity` entries and the renderer skips the dead ones.
 */
export const GuestState = {
  GONE: 0,
  ARRIVING: 1,
  WALKING: 2,
  IDLE: 3,
  SITTING: 4,
  QUEUING: 5,
  RIDING: 6,
  BUYING: 7,
  LEAVING: 8,
  LOST: 9,
} as const;
export type GuestStateValue = (typeof GuestState)[keyof typeof GuestState];

export const GUEST_STATE_NAMES: Record<number, string> = {
  0: 'gone',
  1: 'arriving',
  2: 'walking',
  3: 'idle',
  4: 'sitting',
  5: 'queuing',
  6: 'riding',
  7: 'buying',
  8: 'leaving',
  9: 'lost',
};

/** A guest is standing still to the renderer in these; the others get a walk cycle. */
export function isStanding(state: number): boolean {
  return (
    state === GuestState.IDLE ||
    state === GuestState.SITTING ||
    state === GuestState.QUEUING ||
    state === GuestState.RIDING ||
    state === GuestState.BUYING
  );
}

// ── Content ─────────────────────────────────────────────────────────────────────────────────
export type Localized = Record<string, string>;

/** How a person is built and how they behave. One manifest entry per kind of visitor. */
export interface GuestArchetypeDef {
  id: string;
  name: Localized;
  /** Relative share of the arrivals. Normalised across every registered archetype. */
  weight: number;
  /** Body plan. Drives height, head ratio and the walk cadence, never a mesh switch. */
  age: 'adult' | 'child' | 'senior';
  /** Standing height in metres, before the per-guest variation. Art bible: 1.65-1.85 for adults. */
  height: number;
  /** Metres per PARK minute. See the note on `WALK_SPEED` in `sim.ts` before changing it. */
  speed: number;
  /** Cents in the wallet on arrival, `[min, max]`. */
  wallet: [number, number];
  /** Per-need decay multipliers by need id. A need not listed here runs at 1. */
  needs: Record<string, number>;
  /** 0..1. How long they will stand in a line before it costs them mood. */
  patience: number;
  /** 0..1. Preference for intense rides over gentle ones. Read by the rides module later. */
  thrill: number;
  /** Park minutes they mean to stay, `[min, max]`. */
  stay: [number, number];
  /** sRGB hex. The renderer decodes a per-guest pick out of these; see `appearance.ts`. */
  palette: {
    skin: string[];
    hair: string[];
    top: string[];
    bottom: string[];
  };
  /** Fraction of this archetype wearing short sleeves; the arms take the skin colour instead. */
  bareArms: number;
}

/** Who arrives together. A party is resolved into guests at spawn time. */
export interface GuestPartyDef {
  id: string;
  name: Localized;
  weight: number;
  members: Array<{
    /** Archetype id. An unknown id is skipped with one warning, never a throw. */
    archetype: string;
    /** `[min, max]` inclusive. */
    count: [number, number];
  }>;
}

/**
 * A thought is a condition over named signals, not a hard-coded trigger.
 *
 * The signals the module publishes are listed in `SIGNAL_NAMES` (`thoughts.ts`) and every one of
 * them is documented there. A pack composes conditions over those; adding a **thought** is a
 * manifest entry, adding a **signal** is code. That line is where it has to be — a thought that
 * could name any expression would be a scripting language in a JSON file — and it is stated
 * rather than hidden.
 */
export interface GuestThoughtDef {
  id: string;
  text: Localized;
  /** Mood points, signed. Negative for a complaint. */
  mood: number;
  /** Every clause must hold. An empty list never fires. */
  when: Array<{ signal: string; gte?: number; lte?: number }>;
  /** Park minutes before the same guest may think this again. */
  cooldown: number;
  /** Higher wins when several fire in one tick. */
  priority: number;
}

// ── Needs ───────────────────────────────────────────────────────────────────────────────────
/** A need as the module uses it: the pack's declaration plus its column in the store. */
export interface NeedColumn {
  id: string;
  column: number;
  name: Localized;
  decayPerHour: number;
  moodWeight: number;
  urgentAt: number;
  criticalAt: number;
  weather: 'none' | 'warm' | 'cold' | 'wet';
  icon?: string;
  thoughts: Localized[];
}

// ── Public API ──────────────────────────────────────────────────────────────────────────────
export interface GuestStats {
  /** Guests inside the park right now. */
  count: number;
  capacity: number;
  arrivedToday: number;
  leftToday: number;
  /** Live guests by state name. */
  byState: Record<string, number>;
  /** 0..100. */
  meanHappiness: number;
  /** 0..100, the needs mixed by their declared weights. */
  meanMood: number;
  /** Mean level per need id, 0..255. */
  needs: Record<string, number>;
  /** How many guests are past a need's `urgentAt` with nothing in the park answering it. */
  unmet: Record<string, number>;
  /** Guests that have not moved while trying to. `scripts/game-soak.mjs` asserts this is 0. */
  stuck: number;
  /** Guests that asked for a route and did not get one, and are now heading for the gate. */
  lost: number;
  groups: number;
  /** Cents spent inside the park today. */
  spentToday: number;
  /** Milliseconds the last tick cost this module, measured by the caller's own clock. */
  tickMs: number;
}

/** What `sim.ts` exposes to the soak harness, the HUD and every other sim module. */
export interface GuestsSimApi {
  count(): number;
  /** Guests that have been trying to move and have not. The soak's `no stuck guests`. */
  stuckCount(): number;
  stats(): GuestStats;
  /** Every registered need, in registration order. */
  needs(): NeedColumn[];
  archetypes(): GuestArchetypeDef[];
  /** Force `n` arrivals now, ignoring the arrival curve. Returns how many were admitted. */
  spawn(n: number): number;
  /** One guest's full record, for the inspector panel. `null` when the slot is empty. */
  inspect(slot: number): GuestRecord | null;
}

export interface GuestRecord {
  slot: number;
  id: number;
  archetype: string;
  state: string;
  position: [number, number, number];
  happiness: number;
  mood: number;
  cash: number;
  needs: Record<string, number>;
  group: number;
  /** Park minute the guest walked in. */
  arrivedAt: number;
  destination: [number, number] | null;
  thought: Localized | null;
}
