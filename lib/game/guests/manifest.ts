/**
 * Who visits the park, who they come with, and what they think about it — all four of them as
 * content rather than as code.
 *
 * Four pack categories are claimed here. `needs` is core's own (`needSchema` in
 * `core/pack-schema.ts`, `registry.needOrder()`); the other three are this module's, declared
 * through `Registry.registerPackCategory` so a typo in a pack (`guestArchetype`, singular) is a
 * line in the console naming the pack and the key rather than an array that is silently empty:
 *
 *   `guestArchetypes`  a kind of visitor: proportions, pace, wallet, patience, palette
 *   `guestParties`     who arrives together, by archetype id
 *   `guestThoughts`    a line of dialogue plus the condition it fires under
 *
 * **Both halves of the read are needed and neither alone is enough.** `registry.onPack` fires on
 * REGISTRATION, and `host.ts` registers the bundled packs *before* any module is built, so a
 * listener on its own would miss exactly the two packs the game ships with — the trap three
 * modules in this repo have already fallen into. `attachGuestContent` walks `registry.packs()`
 * first and then subscribes.
 *
 * The built-in manifests below are the same shape a pack entry is, and they go through the same
 * parser: there is no privileged path for the defaults, which is what stops the parser from
 * quietly only working on data it wrote itself.
 *
 * DOM-free and Babylon-free: the sim reads all of it, and so does the renderer (the palettes).
 */

import type { GuestArchetypeDef, GuestPartyDef, GuestThoughtDef, Localized } from './types';

// ── Palettes ────────────────────────────────────────────────────────────────────────────────
/**
 * Park clothing, not primary colours.
 *
 * The art bible bans "flat untextured primitives in primary colours", and a crowd is where that
 * failure is loudest: eight saturated hues on two thousand figures reads as a bag of sweets from
 * any distance. These are the colours people actually wear to a park on a Saturday — denim, olive,
 * rust, sand, charcoal — with the saturation pushed one notch, which is the house style. Children
 * get the bright end on purpose, because that is also true and it is what makes a family legible
 * from the `ground` camera.
 */
const SKIN = ['#f2d3b4', '#ecc19b', '#dda679', '#c58a5c', '#a06a41', '#7c4e2f', '#5a3820'];
const HAIR = [
  '#221a15',
  '#3d2b1f',
  '#5c4028',
  '#8a6034',
  '#bd9553',
  '#8e3b21',
  '#918a82',
  '#d6d0c6',
];
const TOP_ADULT = [
  '#3f5d78',
  '#7a3b3b',
  '#5f6b4a',
  '#d3c6ae',
  '#2e3b45',
  '#a35c3a',
  '#47786e',
  '#b9a493',
  '#e0ddd4',
  '#655578',
];
const TOP_BRIGHT = ['#d9663c', '#3f8ecc', '#5aa350', '#dcae35', '#c1507c', '#e5e2d8', '#38a3a0'];
const BOTTOM = ['#39434f', '#2f3238', '#5a5145', '#7a7267', '#404a3a', '#8a8378', '#4b3f45'];

// ── Archetypes ──────────────────────────────────────────────────────────────────────────────
/**
 * The six visitors the base game ships with.
 *
 * `speed` is metres per PARK minute and is the number the whole module's pacing hangs off; the
 * reasoning, and why it is not 1.35, is in `sim.ts` above `WALK_SPEED_SCALE`.
 *
 * `height` is the standing height including the head, and the renderer scales the whole figure to
 * it. A child is not an adult at 0.72: `appearance.ts` gives it a larger head fraction, because a
 * uniformly scaled adult reads as a very small adult and it is the first thing anybody notices
 * about a crowd with families in it.
 */
export const GUEST_ARCHETYPE_MANIFEST: readonly GuestArchetypeDef[] = [
  {
    id: 'visitor',
    name: { en: 'Visitor', de: 'Besucherin' },
    weight: 34,
    age: 'adult',
    height: 1.74,
    speed: 2.0,
    wallet: [3500, 9000],
    needs: {},
    patience: 0.55,
    thrill: 0.5,
    stay: [240, 420],
    palette: { skin: SKIN, hair: HAIR, top: TOP_ADULT, bottom: BOTTOM },
    bareArms: 0.45,
  },
  {
    id: 'parent',
    name: { en: 'Parent', de: 'Elternteil' },
    weight: 16,
    age: 'adult',
    height: 1.76,
    speed: 1.8,
    wallet: [6000, 16000],
    // A parent buys for the children too, so hunger and thirst arrive sooner than the wallet does.
    needs: { cash: 1.4, energy: 1.15 },
    patience: 0.72,
    thrill: 0.35,
    stay: [280, 460],
    palette: { skin: SKIN, hair: HAIR, top: TOP_ADULT, bottom: BOTTOM },
    bareArms: 0.4,
  },
  {
    id: 'child',
    name: { en: 'Child', de: 'Kind' },
    weight: 22,
    age: 'child',
    height: 1.24,
    speed: 2.2,
    wallet: [200, 900],
    needs: { hunger: 1.35, thirst: 1.4, happiness: 1.5, energy: 1.3 },
    patience: 0.2,
    thrill: 0.7,
    stay: [240, 420],
    palette: { skin: SKIN, hair: HAIR, top: TOP_BRIGHT, bottom: BOTTOM },
    bareArms: 0.7,
  },
  {
    id: 'teen',
    name: { en: 'Teenager', de: 'Jugendlicher' },
    weight: 12,
    age: 'adult',
    height: 1.68,
    speed: 2.3,
    wallet: [1500, 4500],
    needs: { hunger: 1.2, happiness: 1.3 },
    patience: 0.3,
    thrill: 0.9,
    stay: [200, 400],
    palette: { skin: SKIN, hair: HAIR, top: TOP_BRIGHT, bottom: BOTTOM },
    bareArms: 0.6,
  },
  {
    id: 'senior',
    name: { en: 'Senior', de: 'Seniorin' },
    weight: 8,
    age: 'senior',
    height: 1.66,
    speed: 1.45,
    wallet: [4000, 11000],
    needs: { energy: 1.6, toilet: 1.25, happiness: 0.7 },
    patience: 0.85,
    thrill: 0.15,
    stay: [180, 320],
    palette: {
      skin: SKIN,
      hair: ['#918a82', '#d6d0c6', '#bd9553', '#5c4028'],
      top: TOP_ADULT,
      bottom: BOTTOM,
    },
    bareArms: 0.2,
  },
  {
    id: 'enthusiast',
    name: { en: 'Enthusiast', de: 'Fan' },
    weight: 8,
    age: 'adult',
    height: 1.8,
    speed: 2.15,
    wallet: [5000, 14000],
    needs: { happiness: 1.6, energy: 0.8 },
    patience: 0.95,
    thrill: 1,
    stay: [360, 560],
    palette: {
      skin: SKIN,
      hair: HAIR,
      top: ['#2e3b45', '#1f2a30', '#7a3b3b', '#3f5d78'],
      bottom: BOTTOM,
    },
    bareArms: 0.3,
  },
];

// ── Parties ─────────────────────────────────────────────────────────────────────────────────
/**
 * A park full of solo adults is the clearest tell there is, so a party is the unit that arrives
 * and the guest is what it is made of.
 */
export const GUEST_PARTY_MANIFEST: readonly GuestPartyDef[] = [
  {
    id: 'solo',
    name: { en: 'On their own', de: 'Alleine' },
    weight: 14,
    members: [{ archetype: 'visitor', count: [1, 1] }],
  },
  {
    id: 'pair',
    name: { en: 'A pair', de: 'Zu zweit' },
    weight: 30,
    members: [{ archetype: 'visitor', count: [2, 2] }],
  },
  {
    id: 'family',
    name: { en: 'A family', de: 'Familie' },
    weight: 26,
    members: [
      { archetype: 'parent', count: [1, 2] },
      { archetype: 'child', count: [1, 3] },
    ],
  },
  {
    id: 'friends',
    name: { en: 'Friends', de: 'Freunde' },
    weight: 14,
    members: [{ archetype: 'teen', count: [3, 4] }],
  },
  {
    id: 'grandparents',
    name: { en: 'Grandparents and a grandchild', de: 'Großeltern mit Enkelkind' },
    weight: 8,
    members: [
      { archetype: 'senior', count: [1, 2] },
      { archetype: 'child', count: [1, 2] },
    ],
  },
  {
    id: 'enthusiasts',
    name: { en: 'Here for the coaster', de: 'Wegen der Achterbahn da' },
    weight: 8,
    members: [{ archetype: 'enthusiast', count: [1, 2] }],
  },
];

// ── Thoughts ────────────────────────────────────────────────────────────────────────────────
/**
 * The base game's thoughts.
 *
 * A need's own `thoughts` (from `needSchema`) cover "I could eat"; these are the ones that are
 * about the park rather than about the body. Each is a condition over the signals listed in
 * `thoughts.ts`, so a pack adds one without a line of TypeScript.
 */
export const GUEST_THOUGHT_MANIFEST: readonly GuestThoughtDef[] = [
  {
    id: 'nothing-to-do',
    text: {
      en: 'There is nothing to ride here yet.',
      de: 'Fahren kann man hier noch nichts.',
    },
    mood: -8,
    when: [{ signal: 'rides', lte: 0 }],
    cooldown: 90,
    priority: 6,
  },
  {
    id: 'nothing-to-buy',
    text: {
      en: 'Not one place to buy a drink.',
      de: 'Nirgends etwas zu trinken.',
    },
    mood: -6,
    when: [
      { signal: 'shops', lte: 0 },
      { signal: 'urgentNeeds', gte: 1 },
    ],
    cooldown: 75,
    priority: 7,
  },
  {
    id: 'queue-long',
    text: { en: 'This line is not moving.', de: 'Die Schlange steht.' },
    mood: -7,
    when: [{ signal: 'queueMinutes', gte: 25 }],
    cooldown: 30,
    priority: 8,
  },
  {
    id: 'crowded',
    text: { en: 'You cannot get through here.', de: 'Hier kommt man nicht durch.' },
    mood: -4,
    when: [{ signal: 'crowding', gte: 0.75 }],
    cooldown: 40,
    priority: 4,
  },
  {
    id: 'rain',
    text: { en: 'I did not bring a coat.', de: 'Ich habe keine Jacke dabei.' },
    mood: -5,
    when: [{ signal: 'rain', gte: 0.5 }],
    cooldown: 60,
    priority: 5,
  },
  {
    id: 'gardens',
    text: { en: 'The gardens alone are worth the walk.', de: 'Allein die Gärten lohnen den Weg.' },
    mood: 4,
    when: [
      { signal: 'happiness', gte: 72 },
      { signal: 'scenery', gte: 6 },
    ],
    cooldown: 120,
    priority: 2,
  },
  {
    id: 'lost',
    text: {
      en: 'I cannot work out where the path goes.',
      de: 'Ich sehe nicht, wo der Weg weitergeht.',
    },
    mood: -9,
    when: [{ signal: 'lostMinutes', gte: 4 }],
    cooldown: 45,
    priority: 9,
  },
  {
    id: 'going-home',
    text: { en: 'I am going home.', de: 'Ich fahre nach Hause.' },
    mood: 0,
    when: [
      { signal: 'leaving', gte: 1 },
      { signal: 'mood', lte: 32 },
    ],
    cooldown: 600,
    priority: 10,
  },
];

// ── Registration ────────────────────────────────────────────────────────────────────────────
const archetypes = new Map<string, GuestArchetypeDef>();
const parties = new Map<string, GuestPartyDef>();
const thoughts = new Map<string, GuestThoughtDef>();

function localized(value: unknown, fallback: string): Localized {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const out: Localized = {};
    for (const key of Object.keys(record).sort()) {
      if (typeof record[key] === 'string') out[key] = record[key] as string;
    }
    if (typeof out.en === 'string') return out;
  }
  return { en: fallback };
}

function num(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, n));
}

function hexList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const out = value.filter(
    (v): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
  );
  return out.length ? out : fallback;
}

function range(value: unknown, fallback: [number, number]): [number, number] {
  if (Array.isArray(value) && value.length === 2) {
    const a = num(value[0], fallback[0]);
    const b = num(value[1], fallback[1]);
    return a <= b ? [a, b] : [b, a];
  }
  return fallback;
}

/** Validate an archetype the way the built-in ones are validated. Throws with the offending field. */
export function parseArchetype(input: unknown): GuestArchetypeDef {
  const raw = input as Record<string, unknown>;
  const id = typeof raw?.id === 'string' ? raw.id : '';
  if (!id) throw new Error('guest archetype: missing id');
  const age = raw.age === 'child' || raw.age === 'senior' ? raw.age : 'adult';
  const palette = (raw.palette ?? {}) as Record<string, unknown>;
  const needs: Record<string, number> = {};
  if (raw.needs && typeof raw.needs === 'object') {
    for (const [k, v] of Object.entries(raw.needs as Record<string, unknown>)) {
      needs[k] = num(v, 1, 0, 8);
    }
  }
  return {
    id,
    name: localized(raw.name, id),
    weight: num(raw.weight, 1, 0, 1000),
    age,
    height: num(raw.height, age === 'child' ? 1.24 : 1.74, 0.6, 2.4),
    speed: num(raw.speed, 2, 0.2, 12),
    wallet: range(raw.wallet, [2000, 8000]),
    needs,
    patience: num(raw.patience, 0.5, 0, 1),
    thrill: num(raw.thrill, 0.5, 0, 1),
    stay: range(raw.stay, [240, 420]),
    palette: {
      skin: hexList(palette.skin, SKIN),
      hair: hexList(palette.hair, HAIR),
      top: hexList(palette.top, TOP_ADULT),
      bottom: hexList(palette.bottom, BOTTOM),
    },
    bareArms: num(raw.bareArms, 0.4, 0, 1),
  };
}

export function parseParty(input: unknown): GuestPartyDef {
  const raw = input as Record<string, unknown>;
  const id = typeof raw?.id === 'string' ? raw.id : '';
  if (!id) throw new Error('guest party: missing id');
  const members: GuestPartyDef['members'] = [];
  if (Array.isArray(raw.members)) {
    for (const m of raw.members as Array<Record<string, unknown>>) {
      if (typeof m?.archetype !== 'string') continue;
      const count = range(m.count, [1, 1]);
      members.push({
        archetype: m.archetype,
        count: [Math.max(1, Math.round(count[0])), Math.max(1, Math.round(count[1]))],
      });
    }
  }
  if (!members.length) throw new Error(`guest party "${id}": no members`);
  return { id, name: localized(raw.name, id), weight: num(raw.weight, 1, 0, 1000), members };
}

export function parseThought(input: unknown): GuestThoughtDef {
  const raw = input as Record<string, unknown>;
  const id = typeof raw?.id === 'string' ? raw.id : '';
  if (!id) throw new Error('guest thought: missing id');
  const when: GuestThoughtDef['when'] = [];
  if (Array.isArray(raw.when)) {
    for (const clause of raw.when as Array<Record<string, unknown>>) {
      if (typeof clause?.signal !== 'string') continue;
      const entry: { signal: string; gte?: number; lte?: number } = { signal: clause.signal };
      if (typeof clause.gte === 'number') entry.gte = clause.gte;
      if (typeof clause.lte === 'number') entry.lte = clause.lte;
      if (entry.gte === undefined && entry.lte === undefined) continue;
      when.push(entry);
    }
  }
  if (!when.length) throw new Error(`guest thought "${id}": no condition, it could never fire`);
  return {
    id,
    text: localized(raw.text, id),
    mood: num(raw.mood, 0, -60, 60),
    when,
    cooldown: num(raw.cooldown, 60, 1, 100000),
    priority: num(raw.priority, 1, 0, 100),
  };
}

export function registerArchetype(input: unknown): GuestArchetypeDef {
  const def = parseArchetype(input);
  archetypes.set(def.id, def);
  return def;
}
export function registerParty(input: unknown): GuestPartyDef {
  const def = parseParty(input);
  parties.set(def.id, def);
  return def;
}
export function registerThought(input: unknown): GuestThoughtDef {
  const def = parseThought(input);
  thoughts.set(def.id, def);
  return def;
}

for (const def of GUEST_ARCHETYPE_MANIFEST) registerArchetype(def);
for (const def of GUEST_PARTY_MANIFEST) registerParty(def);
for (const def of GUEST_THOUGHT_MANIFEST) registerThought(def);

/**
 * Registration order, and that is the contract.
 *
 * A guest's appearance travels to the renderer as `archetypeIndex × 256 + variant`
 * (`appearance.ts`), so the index is a position in this list; a sort would repaint every guest in
 * a saved park the first time a pack was added. Appending cannot, which is the same argument
 * `registry.needOrder()` makes about need columns.
 */
export function guestArchetypes(): GuestArchetypeDef[] {
  return [...archetypes.values()];
}
export function guestParties(): GuestPartyDef[] {
  return [...parties.values()];
}
export function guestThoughts(): GuestThoughtDef[] {
  return [...thoughts.values()];
}
export function guestArchetype(id: string): GuestArchetypeDef | undefined {
  return archetypes.get(id);
}

/** The slice of `Registry` this needs, so the file stays worker-safe and core-import-free. */
export interface GuestContentRegistry {
  registerPackCategory(category: string, owner: string): void;
  packs(): readonly unknown[];
  onPack(fn: (pack: unknown) => void): () => void;
}

/**
 * Claim the three categories and read them off every pack, present and future.
 *
 * Archetypes are read before parties because a party names an archetype by id, and a bad entry is
 * warned about rather than thrown: one malformed thought in a third-party pack must not take the
 * other seven down with it, and it must not stop the pack's archetypes from loading either.
 */
export function attachGuestContent(registry: GuestContentRegistry): () => void {
  registry.registerPackCategory('guestArchetypes', 'guests');
  registry.registerPackCategory('guestParties', 'guests');
  registry.registerPackCategory('guestThoughts', 'guests');

  const read = (pack: unknown): void => {
    const manifest = pack as {
      id?: string;
      guestArchetypes?: unknown;
      guestParties?: unknown;
      guestThoughts?: unknown;
    };
    const each = (list: unknown, what: string, fn: (entry: unknown) => unknown): void => {
      if (!Array.isArray(list)) return;
      for (const entry of list) {
        try {
          fn(entry);
        } catch (error) {
          console.warn(`[game/guests] pack "${manifest.id}" has a bad ${what}`, error);
        }
      }
    };
    each(manifest.guestArchetypes, 'guest archetype', registerArchetype);
    each(manifest.guestParties, 'guest party', registerParty);
    each(manifest.guestThoughts, 'guest thought', registerThought);
  };

  for (const pack of registry.packs()) read(pack);
  return registry.onPack(read);
}
