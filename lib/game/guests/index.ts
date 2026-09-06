/**
 * The guests module: needs, thoughts, wallets, wayfinding, groups — and the crowd on screen.
 *
 * Import-safe on the worker. `sim` is a plain function over pure files (`decide`, `manifest`,
 * `needs`, `store`, `thoughts`, `types`, `appearance`); everything that touches Babylon sits
 * behind the dynamic import below. `GuestsMainApi` is deliberately NOT re-exported here, for the
 * reason terrain, paths and track all give: a type re-export keeps a module reference to `main.ts`
 * that a bundler is free to follow into Babylon. Import it from `@/lib/game/guests/main`.
 *
 * `appearance.ts` is shared across the boundary on purpose — the sim packs a guest's look into one
 * 16-bit word and the crowd unpacks it, so both sides decode with the same function and a change
 * to it cannot desynchronise them.
 */

import type { GameModule } from '../core/types';
import { createGuestsSim } from './sim';

export const guestsModule: GameModule = {
  id: 'guests',
  deps: ['core', 'paths'],
  kinds: ['guest'],
  sim: createGuestsSim,
  main: async (ctx) => (await import('./main')).createGuestsMain(ctx),
};

export type { GuestsSimApi, GuestStats, GuestArchetypeDef } from './types';
export { PARK_OPEN, PARK_CLOSE } from './sim';
export {
  attachGuestContent,
  guestArchetypes,
  guestParties,
  guestThoughts,
  registerArchetype,
  registerParty,
  registerThought,
} from './manifest';
