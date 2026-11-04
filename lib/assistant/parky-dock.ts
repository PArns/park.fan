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

/**
 * How far below the screen's top edge Parky stays: the sticky header's 48 px and a little air. The
 * slot counts as on screen only below it, and no hop flies over it.
 */
export const PARKY_TOP_CLEARANCE = 56;

/**
 * How Parky came to stand in the slot: `appeared` when he stood there from the start, `landed`
 * when he hopped or jumped in, where whoever brought him hands over in the same frame.
 */
export type ParkyArrival = 'appeared' | 'landed';

const slotStore = createStore<HTMLElement | null>(null);
const presentStore = createStore<ParkyArrival | null>(null);
/** The slot last on screen, which the hop down to the corner starts from once it has left. */
let lastSlot: HTMLElement | null = null;
/** Where that slot stood as it left the page (a navigation), measured before it went. */
let lastBox: DOMRect | null = null;

/** What the hop measures a slot by: the element, or the box it last had. */
export type ParkySlotBox = Pick<HTMLElement, 'getBoundingClientRect'>;

/** From this width a slot on the page holds Parky (`HeroParky`); below it he keeps his corner. */
export const PARKY_DOCK_MEDIA = '(min-width: 1024px)';

/** The slot Parky may stand in: the element, while it is on screen. */
export const parkyDock = {
  /** The slot reports itself while it is on screen, `null` once it is not or goes. */
  set(slot: HTMLElement | null) {
    if (slot) {
      lastSlot = slot;
      lastBox = null;
    }
    slotStore.set(slot);
  },
  /**
   * The slot is about to leave the page, still in it: its box, for the hop down from where it
   * stood. Called from a layout effect's cleanup, which runs before the element is removed.
   */
  leave(box: DOMRect) {
    lastBox = box;
  },
  subscribe: slotStore.subscribe,
  /** The slot on screen, or `null`: Parky then belongs in his corner. */
  element: slotStore.get,
  /** The slot last on screen, or once it has left the page the box it had then. */
  lastElement: (): ParkySlotBox | null => {
    if (lastSlot?.isConnected) return lastSlot;
    const box = lastBox;
    return box ? { getBoundingClientRect: () => box } : null;
  },
  /** Whether Parky belongs in the slot rather than in his corner. */
  getSnapshot: () => slotStore.get() !== null,
  getServerSnapshot: () => false,
};

/**
 * Whether Parky stands in the slot right now, and how he got there (`ParkyArrival`), or null: in
 * his window, on his way there or back, or still hopping in from the corner. The launcher sets it;
 * the slot draws Parky only then.
 */
export const parkyInDock = {
  set: presentStore.set,
  subscribe: presentStore.subscribe,
  getSnapshot: presentStore.get,
  getServerSnapshot: (): ParkyArrival | null => null,
};
