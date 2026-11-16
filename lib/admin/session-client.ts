/**
 * The browser's calls to the session proxies (`/api/developer/*`, `/api/account/*`): JSON in and
 * out, never cached, and a failure as a `SessionApiError` with the status and the API's error code.
 * The developer dashboard, the account sync and a member's storage share it. The admin has its own
 * (`app/admin/_lib/api.ts`), which also carries the admin's toasts and query hooks.
 */

/** A failed call, with the API's status and its error code (`generic` when it named none). */
export class SessionApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = 'SessionApiError';
    this.status = status;
    this.code = code;
  }

  /** Nobody is signed in, or the session ended. */
  get signedOut(): boolean {
    return this.status === 401;
  }
}

/** One call; a body is sent as JSON, a 204 answers `undefined`. */
export async function sessionCall<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(path, {
    method: init.method ?? 'GET',
    cache: 'no-store',
    ...(init.body !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(init.body),
    }),
  });
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => ({}))) as { error?: unknown } & T;
  if (!response.ok) {
    throw new SessionApiError(
      response.status,
      typeof payload.error === 'string' ? payload.error : 'generic'
    );
  }
  return payload;
}
