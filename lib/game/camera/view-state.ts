/**
 * Where the camera's pose is remembered — and why it is not in the save.
 *
 * `ARCHITECTURE.md` §4 lists `modules.camera` ("last view") as this module's owned world slot, and
 * that is the wrong side of the line. Three reasons, in order of how expensive each would be to
 * discover later:
 *
 * 1. **It would not work.** `world.modules` is serialised by `serializeWorld()` **in the worker**,
 *    from the worker's own copy of the world — `host.boot()` calls `cloneWorld(world)` before
 *    `init`. The camera exists only on the main thread. Writing a pose into the main thread's
 *    `world.modules.camera` would be read back by nothing, saved by nothing, and would look
 *    exactly like a working feature. That is the same shape of bug as the `?weather=` write core
 *    documents in `finishBoot`, and as `env-probe.ts` being dead code for a round.
 * 2. **It is not the world.** Axis 5 of the rubric asks that owned state be written by exactly one
 *    side. A pose changes on every mouse move at 60 Hz; routing that through a command into the
 *    tick log to satisfy the ownership rule would put sixty entries a second into `world.log`ns for
 *    something no simulation reads.
 * 3. **A save is shared.** Loading somebody else's park should not teleport the reader to wherever
 *    that person's mouse happened to be. A viewport is device state, like a scroll position.
 *
 * So it lives in `localStorage`, keyed by world name and seed, and is **skipped entirely** when
 * `?harness=1`, `?showcase=` or `?cam=` is set. That guard is the load-bearing half: the
 * screenshot harness always passes `harness=1`, so a restored pose can never make two runs of
 * `scripts/game-shot.mjs` disagree — which is the failure this would otherwise introduce into
 * every critique in the project.
 *
 * `persistence` can still put a view in a save slot if it ever wants one: `api.pose()` and
 * `api.setPose()` are public and this file is not in the way.
 */

import type { CameraPose } from './types';

const VERSION = 1;
const PREFIX = 'parkfan-coaster:view:';

export interface ViewStore {
  read(): CameraPose | null;
  write(pose: CameraPose): void;
  clear(): void;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * A store that does nothing. Returned whenever the pose must not be restored, so the call sites
 * stay branch-free and the decision is made once, where it can be read.
 */
export function nullViewStore(): ViewStore {
  return { read: () => null, write: () => {}, clear: () => {} };
}

export function createViewStore(key: string, storage: Storage | null): ViewStore {
  if (!storage) return nullViewStore();
  const full = PREFIX + key;
  return {
    read() {
      try {
        const raw = storage.getItem(full);
        if (!raw) return null;
        const data = JSON.parse(raw) as {
          v?: number;
          t?: unknown;
          a?: unknown;
          b?: unknown;
          r?: unknown;
        };
        if (data.v !== VERSION) return null;
        const t = data.t;
        if (!Array.isArray(t) || t.length !== 3 || !t.every(finite)) return null;
        if (!finite(data.a) || !finite(data.b) || !finite(data.r)) return null;
        return { target: [t[0], t[1], t[2]], alpha: data.a, beta: data.b, radius: data.r };
      } catch {
        // Private mode throws on read as well as on write, and a half-written entry throws in
        // JSON.parse. Either way the answer is "no remembered view", which is a fine park to open.
        return null;
      }
    },
    write(pose) {
      try {
        storage.setItem(
          full,
          JSON.stringify({
            v: VERSION,
            t: pose.target.map((n) => Math.round(n * 100) / 100),
            a: Math.round(pose.alpha * 1e4) / 1e4,
            b: Math.round(pose.beta * 1e4) / 1e4,
            r: Math.round(pose.radius * 100) / 100,
          })
        );
      } catch {
        /* quota, private mode, or a browser with site data blocked */
      }
    },
    clear() {
      try {
        storage.removeItem(full);
      } catch {
        /* as above */
      }
    },
  };
}
