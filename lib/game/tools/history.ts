/**
 * The undo/redo stack. Main thread only, and not in the save — ARCHITECTURE.md's module table
 * gives `tools` "nothing persistent (command stack on main)", and DECISIONS.md #12 gives the
 * reason: undo is a UI concern that has to be instant, while the worker only ever receives commands
 * that have already been applied. `world.log` keeps the tick order, which is what a replay needs;
 * this keeps the *inverse*, which is what a person needs.
 *
 * An entry is two lists of commands, not a closure: `forward` is what was done, `backward` is what
 * undoes it. Both go through the same `ctx.dispatch` a tool used in the first place, so undo is
 * never a second way of changing the world — it is the first way, run backwards. That is why a
 * placement's undo is `entity:remove` plus the refund, in that order, and why redo is exactly the
 * commands that were dispatched originally.
 *
 * Pure: the dispatcher is injected, so `selftest.mjs` can drive a hundred entries with a fake one.
 */

export interface HistoryCommand {
  type: string;
  payload: unknown;
}

export interface HistoryEntry {
  /** i18n key, `tools.action.place` etc. The bar shows the last one. */
  label: string;
  forward: HistoryCommand[];
  backward: HistoryCommand[];
}

export type HistoryDispatch = (type: string, payload: unknown) => void;

export interface History {
  push(entry: HistoryEntry): void;
  /** Dispatches the entry's `backward` commands. Returns the entry, or null when empty. */
  undo(): HistoryEntry | null;
  redo(): HistoryEntry | null;
  canUndo(): boolean;
  canRedo(): boolean;
  undoDepth(): number;
  redoDepth(): number;
  last(): HistoryEntry | null;
  clear(): void;
}

/**
 * How many actions back a player may go.
 *
 * 100 rather than unbounded: every entry holds a copy of an entity, and a stack nobody ever clears
 * in a session that lasts hours is a leak with a name. It is also more than anybody undoes.
 */
export const HISTORY_LIMIT = 100;

export function createHistory(dispatch: HistoryDispatch, limit = HISTORY_LIMIT): History {
  const done: HistoryEntry[] = [];
  const undone: HistoryEntry[] = [];

  return {
    push(entry) {
      done.push(entry);
      if (done.length > limit) done.shift();
      // A new action after an undo is a new branch; the old redo path is gone. Keeping it would
      // mean redo replaying commands against a world that has moved on.
      undone.length = 0;
    },
    undo() {
      const entry = done.pop();
      if (!entry) return null;
      for (const cmd of entry.backward) dispatch(cmd.type, cmd.payload);
      undone.push(entry);
      return entry;
    },
    redo() {
      const entry = undone.pop();
      if (!entry) return null;
      for (const cmd of entry.forward) dispatch(cmd.type, cmd.payload);
      done.push(entry);
      return entry;
    },
    canUndo: () => done.length > 0,
    canRedo: () => undone.length > 0,
    undoDepth: () => done.length,
    redoDepth: () => undone.length,
    last: () => done[done.length - 1] ?? null,
    clear() {
      done.length = 0;
      undone.length = 0;
    },
  };
}
