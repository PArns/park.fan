import {
  getFavoritesFromCookies,
  replaceFavorites,
  subscribeToFavorites,
} from '@/lib/utils/favorites';
import { getRiddenSnapshot, replaceRidden, subscribeToRidden } from '@/lib/utils/ridden-rides';
import {
  readChosenTemperatureUnit,
  subscribeToTemperatureUnit,
  writeUnit,
} from '@/lib/contexts/temperature-unit-context';
import { writeCookie } from '@/lib/utils/browser-cookie';
import { ACCOUNT_MARKER_COOKIE } from '@/lib/admin/cookie';
import {
  accountSyncStep,
  type AccountServerState,
  type AccountState,
  type AccountSyncRecord,
} from './state';

/**
 * A signed-in visitor's sync between this browser and the account, loaded only when the account
 * marker is set (`AccountSyncGate`). On start it merges, pulls or pushes (`accountSyncStep`); after
 * that, every change to favorites, ridden rides or the unit goes up a second later.
 */

/** Where this browser keeps its last agreement with the account. */
const RECORD_KEY = 'parkfan_account_sync';
/** Batches a burst of stars into one write. */
const PUSH_DELAY_MS = 1000;

/** The account as `GET /api/account` answers it. */
export interface AccountOverview {
  account: { email: string; displayName: string; role: string };
  data: AccountServerState;
}

function readRecord(): AccountSyncRecord | null {
  try {
    const raw = localStorage.getItem(RECORD_KEY);
    return raw ? (JSON.parse(raw) as AccountSyncRecord) : null;
  } catch {
    return null;
  }
}

function writeRecord(record: AccountSyncRecord | null): void {
  try {
    if (record) localStorage.setItem(RECORD_KEY, JSON.stringify(record));
    else localStorage.removeItem(RECORD_KEY);
  } catch {
    // Private mode: the next start merges again, which loses nothing.
  }
}

/** This browser's copy of the synced state. */
export function readLocalAccountState(): AccountState {
  const favorites = getFavoritesFromCookies();
  return {
    favorites: {
      parks: [...favorites.parks],
      attractions: [...favorites.attractions],
      shows: [...favorites.shows],
      restaurants: [...favorites.restaurants],
    },
    riddenRides: [...getRiddenSnapshot()],
    temperatureUnit: readChosenTemperatureUnit(),
  };
}

let applying = false;

/** Writes a state into this browser, without that write counting as a change to push. */
function applyLocally(state: AccountState): void {
  applying = true;
  try {
    replaceFavorites(state.favorites);
    replaceRidden(state.riddenRides);
    if (state.temperatureUnit) writeUnit(state.temperatureUnit);
  } finally {
    applying = false;
  }
}

/** A failed call to the account, with its status; 401 means the session is gone. */
export class AccountSyncError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Account request failed: ${status}`);
    this.name = 'AccountSyncError';
    this.status = status;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: 'no-store',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new AccountSyncError(response.status);
  return (await response.json()) as T;
}

/** The account and its synced state. */
export function fetchAccount(): Promise<AccountOverview> {
  return call<AccountOverview>('/api/account');
}

async function push(email: string, state: AccountState): Promise<AccountServerState> {
  const { data } = await call<{ data: AccountServerState }>('/api/account/data', {
    method: 'PUT',
    body: JSON.stringify({
      favorites: state.favorites,
      riddenRides: state.riddenRides,
      ...(state.temperatureUnit && { temperatureUnit: state.temperatureUnit }),
    }),
  });
  writeRecord({ email, syncedAt: data.updatedAt });
  return data;
}

/** The session is gone: the marker goes too, so no page tries again. */
function forgetAccount(): void {
  writeCookie(ACCOUNT_MARKER_COOKIE, '', { maxAge: 0, path: '/', sameSite: 'strict' });
  writeRecord(null);
}

/**
 * One round of the sync: reads the account, then merges, pulls or pushes. Returns the account as
 * it stands afterwards, for the account page.
 */
export async function syncAccountNow(): Promise<AccountOverview> {
  let overview: AccountOverview;
  try {
    overview = await fetchAccount();
  } catch (error) {
    if (error instanceof AccountSyncError && error.status === 401) forgetAccount();
    throw error;
  }
  const { email } = overview.account;
  const local = readLocalAccountState();
  const step = accountSyncStep(readRecord(), email, local, overview.data);
  if (step.kind === 'merge') {
    applyLocally(step.state);
    return { ...overview, data: await push(email, step.state) };
  }
  if (step.kind === 'pull') {
    applyLocally(overview.data);
    writeRecord({ email, syncedAt: overview.data.updatedAt });
    return overview;
  }
  if (step.kind === 'push') return { ...overview, data: await push(email, local) };
  writeRecord({ email, syncedAt: overview.data.updatedAt });
  return overview;
}

let stop: (() => void) | null = null;

/**
 * Starts the sync for this page: one round now, then a push a second after each local change.
 * Starting twice is one sync.
 */
export function startAccountSync(): void {
  if (stop) return;
  let email: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (applying || !email) return;
    if (timer) clearTimeout(timer);
    const owner = email;
    timer = setTimeout(() => {
      timer = null;
      push(owner, readLocalAccountState()).catch((error: unknown) => {
        if (error instanceof AccountSyncError && error.status === 401) {
          forgetAccount();
          stopAccountSync();
        }
      });
    }, PUSH_DELAY_MS);
  };
  const unsubscribe = [
    subscribeToFavorites(schedule),
    subscribeToRidden(schedule),
    subscribeToTemperatureUnit(schedule),
  ];
  stop = () => {
    if (timer) clearTimeout(timer);
    for (const off of unsubscribe) off();
  };
  syncAccountNow()
    .then((overview) => {
      email = overview.account.email;
    })
    .catch(() => stopAccountSync());
}

/** Ends the sync for this page, on sign-out or a lost session. */
export function stopAccountSync(): void {
  stop?.();
  stop = null;
}

/** Signing out or deleting the account: the sync ends and this browser forgets the agreement. */
export function endAccountSync(): void {
  stopAccountSync();
  forgetAccount();
}
