import { ADMIN_MARKER_COOKIE } from '@/lib/admin/cookie';
import { readCookie } from '@/lib/utils/browser-cookie';

/** Whether Parky is on and for what share of visitors, as `/api/assistant-config` answers. */
export interface AssistantConfig {
  enabled: boolean;
  rolloutPercent: number;
}

/** The answer when the config cannot be read: hidden. */
export const ASSISTANT_OFF: AssistantConfig = { enabled: false, rolloutPercent: 0 };

/** Build-time kill switch: `NEXT_PUBLIC_ASSISTANT=off` hides Parky without asking the API. */
export const ASSISTANT_KILLED = process.env.NEXT_PUBLIC_ASSISTANT === 'off';

const BUCKET_KEY = 'parkfan:assistant-bucket';
const FORCE_KEY = 'parkfan:assistant-force';
const CONFIG_KEY = 'parkfan:assistant-config';
const INVITED_KEY = 'parkfan:assistant-invited';

/**
 * Whether this browser sees Parky: `?assistant=on` forces it for the session (`off` ends that),
 * otherwise a stable bucket 0–99 against the rollout share. A visitor of Parky's own page is
 * `invited`: inside the share whatever the bucket, as long as Parky is switched on. Pure, so the
 * decision is testable.
 */
export function assistantVisible(params: {
  config: AssistantConfig;
  bucket: number;
  forced: boolean;
  invited?: boolean;
}): boolean {
  if (params.forced) return true;
  return params.config.enabled && (params.invited || params.bucket < params.config.rolloutPercent);
}

/**
 * Whether Parky is switched on for everybody: a page may then offer it as part of its own design,
 * since no visitor would see an offer the widget then refuses. Pure, so the decision is testable.
 */
export function assistantForEveryone(config: AssistantConfig): boolean {
  return config.enabled && config.rolloutPercent >= 100;
}

function storage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function read(kind: 'local' | 'session', key: string): string | null {
  try {
    return storage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(kind: 'local' | 'session', key: string, value: string | null): void {
  try {
    if (value === null) storage(kind)?.removeItem(key);
    else storage(kind)?.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the decision is then made per page load.
  }
}

/** This browser's bucket, drawn once and kept; a fresh draw per load where storage is blocked. */
function bucket(): number {
  const stored = Number(read('local', BUCKET_KEY));
  if (Number.isInteger(stored) && stored >= 0 && stored < 100 && read('local', BUCKET_KEY)) {
    return stored;
  }
  const drawn = Math.floor(Math.random() * 100);
  write('local', BUCKET_KEY, String(drawn));
  return drawn;
}

/** Signed in to the admin, or `?assistant=on` earlier in this session. */
function forced(): boolean {
  if (readCookie(ADMIN_MARKER_COOKIE) === '1') return true;
  const flag = new URLSearchParams(window.location.search).get('assistant');
  if (flag === 'on') write('session', FORCE_KEY, '1');
  if (flag === 'off') write('session', FORCE_KEY, null);
  return read('session', FORCE_KEY) === '1';
}

async function config(): Promise<AssistantConfig> {
  const cached = read('session', CONFIG_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as AssistantConfig;
    } catch {
      // A broken copy is fetched again.
    }
  }
  try {
    const response = await fetch('/api/assistant-config');
    if (!response.ok) return ASSISTANT_OFF;
    const fetched = (await response.json()) as AssistantConfig;
    write('session', CONFIG_KEY, JSON.stringify(fetched));
    return fetched;
  } catch {
    return ASSISTANT_OFF;
  }
}

let visible = false;
let forEveryone = false;
let decided = false;
let started = false;
const listeners = new Set<() => void>();

async function decide(isForced: boolean): Promise<void> {
  const loaded = await config();
  forEveryone = assistantForEveryone(loaded);
  visible = assistantVisible({
    config: loaded,
    bucket: bucket(),
    forced: isForced,
    invited: read('session', INVITED_KEY) === '1',
  });
  decided = true;
  listeners.forEach((l) => l());
}

/** Where the gate stands, for a page that offers Parky: undecided, then shown or not. */
export type AssistantGateStatus = 'pending' | 'on' | 'off';

/**
 * The gate as a store for `useSyncExternalStore`: hidden on the server and until the decision is
 * made, which takes one cached request per session, so no page's HTML depends on it.
 */
export const assistantGate = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (!started && !ASSISTANT_KILLED) {
      started = true;
      const isForced = forced();
      void decide(isForced);
    }
    return () => listeners.delete(listener);
  },
  /**
   * The visitor came to Parky's own page: Parky shows for the rest of the session if it is
   * switched on, whatever the rollout share says.
   */
  invite(): void {
    if (ASSISTANT_KILLED || read('session', INVITED_KEY) === '1') return;
    write('session', INVITED_KEY, '1');
    if (started && !visible) void decide(false);
  },
  getSnapshot: (): boolean => visible,
  getServerSnapshot: (): boolean => false,
  /** Shown to this visitor and switched on for everybody ({@link assistantForEveryone}). */
  getForEveryone: (): boolean => visible && forEveryone,
  /** {@link AssistantGateStatus} as a snapshot of the same store. */
  getStatus: (): AssistantGateStatus =>
    ASSISTANT_KILLED ? 'off' : !decided ? 'pending' : visible ? 'on' : 'off',
  getServerStatus: (): AssistantGateStatus => 'pending',
};
