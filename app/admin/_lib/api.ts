'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

/**
 * How the admin talks to everything.
 *
 * One rule and it is the reason this file is short: the browser holds no
 * credential. The session token lives in an httpOnly cookie the browser
 * attaches by itself, so every request here is a plain same-origin fetch with
 * no header to remember and nothing for an injected script to steal. The
 * previous admin passed a shared password from `sessionStorage` into every
 * call, which meant every call site had to remember to, and one that forgot
 * failed with a 401 that looked like an expired login.
 */

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload: unknown = null
  ) {
    super(message);
    this.name = 'AdminApiError';
  }

  /** True when the session is gone and the only cure is signing in again. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True when the account is signed in but not allowed to do this. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function adminFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    cache: 'no-store',
    signal: options.signal,
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const text = await response.text();
  const payload: unknown = text.length > 0 ? safeParse(text) : null;

  if (!response.ok) {
    throw new AdminApiError(response.status, messageFrom(payload, response), payload);
  }
  return payload as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 300) };
  }
}

/**
 * The most useful sentence in the payload.
 *
 * Nest's ValidationPipe answers with `message` as an array of complaints, one
 * per failing field, and showing `[object Object]` — or only the first of five
 * — is how a form ends up telling somebody "invalid" about a value that is
 * fine while staying silent about the one that is not.
 */
function messageFrom(payload: unknown, response: Response): string {
  const record =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;

  const sentence = (() => {
    if (record) {
      if (Array.isArray(record.message)) return record.message.join(' · ');
      if (typeof record.message === 'string') return record.message;
      if (typeof record.error === 'string') return record.error;
    }
    return `${response.status} ${response.statusText}`.trim();
  })();

  // A 5xx carries a reference the backend also wrote into its error log next to
  // the stack. Shown here, a screenshot of a failed save is enough to find what
  // produced it — which is the whole reason the reference exists, and it was
  // being dropped one layer short of the person looking at it.
  const reference = record && typeof record.reference === 'string' ? record.reference : null;
  return reference ? `${sentence} (Ref ${reference})` : sentence;
}

// ─── query helpers ────────────────────────────────────────────────────────────

/** Namespaced so `invalidate('parks')` can drop a whole family at once. */
export const adminKeys = {
  session: ['admin', 'session'] as const,
  fields: ['admin', 'fields'] as const,
  parks: (params?: Record<string, unknown>) =>
    params ? (['admin', 'parks', params] as const) : (['admin', 'parks'] as const),
  park: (id: string) => ['admin', 'park', id] as const,
  parkAttractions: (id: string, params?: Record<string, unknown>) =>
    ['admin', 'park', id, 'attractions', params ?? {}] as const,
  attraction: (id: string) => ['admin', 'attraction', id] as const,
  seasons: (params?: Record<string, unknown>) => ['admin', 'seasons', params ?? {}] as const,
  history: (params?: Record<string, unknown>) => ['admin', 'history', params ?? {}] as const,
  users: ['admin', 'users'] as const,
  sessions: ['admin', 'sessions'] as const,
  raw: (path: string) => ['admin', 'raw', path] as const,
};

export function useAdminQuery<T>(
  key: readonly unknown[],
  path: string | null,
  options?: Omit<UseQueryOptions<T, AdminApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, AdminApiError>({
    queryKey: key,
    queryFn: ({ signal }) => adminFetch<T>(path as string, { signal }),
    enabled: path !== null && (options?.enabled ?? true),
    ...options,
  });
}

export function useAdminMutation<TResult, TInput = void>(
  mutation: (input: TInput) => Promise<TResult>,
  options?: Omit<UseMutationOptions<TResult, AdminApiError, TInput>, 'mutationFn'>
) {
  return useMutation<TResult, AdminApiError, TInput>({
    mutationFn: mutation,
    ...options,
  });
}

/**
 * Drop every cached admin query under a prefix.
 *
 * Curation writes ripple: editing a park's name changes the park detail, the
 * park list, the history and — because the API embeds the park in each ride's
 * payload — every ride under it. Invalidating by prefix is how that stays one
 * line at the call site instead of five keys somebody has to remember.
 */
export function useInvalidateAdmin() {
  const client = useQueryClient();
  return (...prefixes: ReadonlyArray<readonly unknown[]>) => {
    for (const prefix of prefixes) {
      void client.invalidateQueries({ queryKey: prefix });
    }
  };
}
