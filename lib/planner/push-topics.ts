'use client';

/**
 * Which kinds of notification this browser wants.
 *
 * A set of topic ids, and the ids are the DEPLOY's — `/api/push` answers with
 * the list the API can actually send, and this only ever narrows it. Inventing
 * an id here would produce a switch that turns on and does nothing, which is the
 * one thing `use-push-subscription` is built to avoid.
 *
 * An external store rather than component state, for the reason `panel-width.ts`
 * gives: the choice has to survive the panel closing, and reading `localStorage`
 * during a render would make the first client render disagree with the server's.
 * An empty selection means "everything the deploy offers" — the value a visitor
 * who has never opened the list should get, and it stays correct when the API
 * adds a topic later.
 */

const KEY = 'parkfan_planner_push_topics';

let selection: readonly string[] | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load(): void {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
      selection = parsed;
    }
  } catch {
    // Private mode, storage off, or a value from an older shape. "Everything"
    // is the right answer to all three.
  }
}

export const plannerPushTopics = {
  subscribe(listener: () => void): () => void {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** The stored narrowing, or `null` for "everything this deploy offers". */
  getSnapshot(): readonly string[] | null {
    load();
    return selection;
  },
  getServerSnapshot(): readonly string[] | null {
    return null;
  },
  set(topics: readonly string[]): void {
    selection = topics;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(topics));
    } catch {
      // Holds for this session, which is better than refusing the change.
    }
    for (const listener of listeners) listener();
  },
};

/**
 * The topics to subscribe with: the deploy's list, narrowed by the visitor's.
 *
 * Intersected rather than substituted, so a stored id the API has since retired
 * cannot resurrect itself, and a topic added after the visitor last chose is
 * included — the alternative is somebody silently missing a new kind of
 * notification because they once opened a list that did not have it.
 */
export function resolvePushTopics(
  available: readonly string[],
  selected: readonly string[] | null
): string[] {
  if (selected === null) return [...available];
  const wanted = new Set(selected);
  const kept = available.filter((topic) => wanted.has(topic));
  // Never subscribe to nothing while the switch reads "on": an empty list would
  // be a subscription that receives no push at all, which is the switch-that-
  // does-nothing state under a different name. The caller's UI refuses to leave
  // the last box unticked, and this is the second fence.
  return kept.length > 0 ? kept : [...available];
}

/** Topic ids this app has copy for. Anything else is rendered by its id. */
export const KNOWN_PUSH_TOPICS = ['next-up', 'show-times', 'ride-status', 'wait-change'] as const;
