/**
 * Where Parky stands while his chat window is shut: in his corner, or in a slot on the page that
 * holds him bigger (the homepage hero on a desktop, `HeroParky`) while that slot is on screen. The
 * slot registers itself here and says whether it is on screen; the launcher hops Parky between the
 * corner and the slot when that changes, and says whether he has arrived in the slot.
 */

type Listener = () => void;

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    set(next: T) {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const slotStore = createStore<HTMLElement | null>(null);
const presentStore = createStore(false);
/** The slot last on screen, which the hop down to the corner starts from once it has left. */
let lastSlot: HTMLElement | null = null;

/** The slot Parky may stand in: the element, while it is on screen. */
export const parkyDock = {
  /** The slot reports itself while it is on screen, `null` once it is not or goes. */
  set(slot: HTMLElement | null) {
    if (slot) lastSlot = slot;
    slotStore.set(slot);
  },
  subscribe: slotStore.subscribe,
  /** The slot on screen, or `null`: Parky then belongs in his corner. */
  element: slotStore.get,
  /** The slot last on screen, while it is still in the page. */
  lastElement: () => (lastSlot?.isConnected ? lastSlot : null),
  /** Whether Parky belongs in the slot rather than in his corner. */
  getSnapshot: () => slotStore.get() !== null,
  getServerSnapshot: () => false,
};

/**
 * Whether Parky stands in the slot right now: not in his window, not on his way there or back, and
 * done hopping in from the corner. The launcher sets it; the slot draws Parky only then.
 */
export const parkyInDock = {
  set: presentStore.set,
  subscribe: presentStore.subscribe,
  getSnapshot: presentStore.get,
  getServerSnapshot: () => false,
};
